const dbUtils = require('./utils')
const _this = this
const uuid = require('uuid')

exports.queryJobs = async function ({ projections = [], filters = {} } = {}) {
  const columns = [
    'CAST(job.jobId AS CHAR) AS jobId',
    'job.name',
    'job.description',
    `json_object(
      'userId', CAST(ud_creator.userId as char),
      'username', ud_creator.username) AS createdBy`,
    'job.created',
    `IF(ud_updater.userId IS NULL, NULL, json_object(
      'userId', CAST(ud_updater.userId as char),
      'username', ud_updater.username)) AS updatedBy`,
    'job.updated',
    `(select
      IF(COUNT(jt.taskId), json_arrayagg(json_object('taskId', CAST(jt.taskId as char), 'name', t.name)), json_array())
      from job_task_map jt left join task t ON jt.taskId = t.taskId where jt.jobId = job.jobId) AS tasks`,
    `(select ifnull(COUNT(*), 0) from job_run jr where jr.jobId = job.jobId) AS runCount`,
    `(select max(jr.created) from job_run jr where jr.jobId = job.jobId) AS lastRun`
  ]
  const joins = new Set([
    'job',
    'LEFT JOIN user_data ud_creator ON ud_creator.userId = job.createdBy',
    'LEFT JOIN user_data ud_updater ON ud_updater.userId = job.updatedBy'
  ])
  const groupBy = ['job.jobId']

  const orderBy = ['job.jobId']

  if (projections?.includes('events')) {
    const arrayValues = `
    IF(e.event_type = 'ONE TIME',
      JSON_OBJECT(
        'eventId', e.event_name,
        'type', 'once',
        'runAt', DATE_FORMAT(e.execute_at,'%Y-%m-%dT%H:%i:%sZ') 
      ),
      JSON_OBJECT(
        'eventId', e.event_name,
        'type', 'recurring',
        'runEvery', CONCAT(e.interval_value, ' ', e.interval_field),
        'startsAt', DATE_FORMAT(e.starts,'%Y-%m-%dT%H:%i:%sZ'),
        'endsAt', DATE_FORMAT(e.ends,'%Y-%m-%dT%H:%i:%sZ'),
        'lastRun', DATE_FORMAT(e.last_executed,'%Y-%m-%dT%H:%i:%sZ')
      )
    )`
    columns.push(`(select
      if (COUNT(e.event_name), json_arrayagg(${arrayValues}), JSON_ARRAY()) AS events
    from
      information_schema.events e
    where
      e.event_schema = database() 
      AND e.event_name LIKE CONCAT("job-", job.jobId, "-%")
    ) as events`)

    // joins.add(`left join information_schema.events e ON
    //   (e.event_schema = database() AND e.event_name LIKE CONCAT("job_", job.jobId, "_%"))`)
    // const jsonArrayDistinct = dbUtils.jsonArrayAggDistinct(`
    //   IF(e.event_type = 'ONE TIME',
    //     JSON_OBJECT(
    //       'eventId', e.event_name,
    //       'type', 'once',
    //       'runAt', DATE_FORMAT(e.execute_at,'%Y-%m-%dT%H:%i:%sZ') 
    //     ),
    //     JSON_OBJECT(
    //       'eventId', e.event_name,
    //       'type', 'recurring',
    //       'runEvery', CONCAT(e.interval_value, ' ', e.interval_field),
    //       'startsAt', DATE_FORMAT(e.starts,'%Y-%m-%dT%H:%i:%sZ'),
    //       'endsAt', DATE_FORMAT(e.ends,'%Y-%m-%dT%H:%i:%sZ'),
    //       'lastRun', DATE_FORMAT(e.last_executed,'%Y-%m-%dT%H:%i:%sZ')
    //     )
    //   )`)
    // columns.push(`IF(COUNT(e.event_name), ${jsonArrayDistinct}, JSON_ARRAY()) AS events`)
  }

  const predicates = {
    statements: [],
    binds: []
  }
  if (filters.jobId) {
    predicates.statements.push('job.jobId = ?')
    predicates.binds.push(filters.jobId)
  }

  const sql = dbUtils.makeQueryString({ columns, joins, predicates, groupBy, orderBy, format: true })
  let [rows] = await dbUtils.pool.query(sql)
  return (rows)
}

exports.getJobs = async ({ projections }) => {
  return _this.queryJobs({ projections })
}

exports.getJob = async (jobId, { projections } = {}) => {
  const jobs = await _this.queryJobs({ projections, filters: { jobId } })
  return jobs[0]
}

exports.deleteJob = async (jobId) => {
  const sql = 'select event_name from information_schema.events where event_schema = database() AND event_name LIKE CONCAT("job-", ?, "-%")'
  const [events] = await dbUtils.pool.query(sql, [jobId])
  if (events.length) {
    const eventNames = events.map(r => r.EVENT_NAME)
    for (const eventName of eventNames) {
      const sqlDropEvent = `DROP EVENT IF EXISTS ??`
      await dbUtils.pool.query(sqlDropEvent, [eventName])
    }
  }
  const [result] = await dbUtils.pool.query('DELETE FROM job WHERE jobId = ?', [jobId])
  return result.affectedRows > 0
}

exports.createJob = async ({ jobData, userId, svcStatus } = {}) => {
  const { tasks, events, ...jobFields } = jobData
  async function transactionFn(connection) {
    const sqlInsertJob = `INSERT into job (name, description, createdBy) VALUES ?`
    const values = [
      [jobFields.name, jobFields.description, userId]
    ]
    const result = await connection.query(sqlInsertJob, [values])
    const jobId = result[0].insertId

    const sqlInsertTasks = `INSERT INTO job_task_map (jobId, taskId) VALUES ?`
    const taskValues = tasks.map(t => [jobId, t])
    if (taskValues.length) {
      await connection.query(sqlInsertTasks, [taskValues])
    }
    return jobId
  }
  const jobId = await dbUtils.retryOnDeadlock2({
    transactionFn,
    statusObj: svcStatus
  })
  // Create events after committing the transaction
  if (events?.length) {
    for (const event of events) {
      const eventName = `job-${jobId}-${uuid.v1()}`
      if (event.type === 'once') {
        const sqlCreateEvent = `
          CREATE EVENT ?? 
          ON SCHEDULE AT ? 
          DO CALL run_job(?)
        `
        const params = [eventName, event.runAt, jobId]
        await dbUtils.pool.query(sqlCreateEvent, params)
      } else if (event.type === 'recurring') {
        let endsAt = event.endsAt ? `ENDS '${event.endsAt}'` : ''
        // Interpolate the interval unit as a bare word
        const sqlCreateEvent = `
          CREATE EVENT ?? 
          ON SCHEDULE EVERY ? ${event.runEvery.field} STARTS ? ${endsAt}
          DO CALL run_job(?)
        `
        const params = [eventName, event.runEvery.value, event.startsAt, jobId]
        await dbUtils.pool.query(sqlCreateEvent, params)
      }
    }
  }
  return jobId
}

exports.updateJob = async (jobId, jobData) => {
  throw new Error('Not implemented')
}

exports.getEventsByJob = async (jobId) => {
  throw new Error('Not implemented')
}

exports.createEventByJob = async (jobId, eventData) => {
  throw new Error('Not implemented')
}

exports.getRunById = async (runId) => {
  const columns = [
    `BIN_TO_UUID(jr.runId, 1) AS runId`,
    'jr.state',
    'jr.created',
    'jr.updated',
    'jr.jobId'
  ]
  const joins = new Set(['job_run jr'])
  const predicates = {
    statements: ['jr.runId = ?'],
    binds: [dbUtils.uuidToSqlString(runId)]
  }
  const sql = dbUtils.makeQueryString({ columns, joins, predicates, format: true })
  let [rows] = await dbUtils.pool.query(sql, [runId])
  return (rows)
}


exports.getRunsByJob = async (jobId) => {
  const columns = [
    `BIN_TO_UUID(jr.runId, 1) AS runId`,
    `jr.state`,
    `jr.created`,
    `jr.updated`,
    `jr.jobId`
  ]
  const joins = new Set(['job_run jr'])
  const predicates = {
    statements: ['jr.jobId = ?'],
    binds: [jobId]
  }
  const orderBy = ['jr.created DESC']

  const sql = dbUtils.makeQueryString({ columns, joins, predicates, orderBy, format: true })
  let [rows] = await dbUtils.pool.query(sql, [jobId])
  return (rows)
}

exports.runImmediateJob = async (jobId) => {
  const v1 = uuid.v1()
  const sql = `CREATE EVENT IF NOT EXISTS ??
  ON SCHEDULE AT CURRENT_TIMESTAMP
  DO CALL run_job(?,?)`
  await dbUtils.pool.query(sql, [`job-${jobId}-${v1}`, jobId, v1])
  return v1
}

exports.getOutputByRun = async (runId, {filters}) => {
  const columns = [
    'tout.seq',
    'tout.ts',
    'tout.taskId',
    't.name as task',
    'tout.type',
    'tout.message'
  ]

  const joins = new Set(['task_output tout', 'left join task t ON tout.taskId = t.taskId'])
  const predicates = {
    statements: ['runId = UUID_TO_BIN(?, 1)'],
    binds: [runId]
  }
  if (filters?.afterSeq) {
    predicates.statements.push('seq > ?')
    predicates.binds.push(filters.afterSeq)
  }
  const orderBy = ['seq DESC']
  const sql = dbUtils.makeQueryString({ columns, joins, predicates, orderBy, format: true })
  let [rows] = await dbUtils.pool.query(sql, predicates.binds)
  return (rows)
}

exports.getAllTasks = async () => {
  const sql = `SELECT taskId, name, description, command FROM task ORDER BY name`
  let [rows] = await dbUtils.pool.query(sql)
  return rows
}

// Placeholder for future implementation --- IGNORE ---
exports.deleteRunByJob = async (jobId) => {
  throw new Error('Not implemented')
}