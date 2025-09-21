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
      IF(COUNT(jt.taskname), json_arrayagg(json_object('taskname', jt.taskname, 'parameters', jt.parameters)), json_array())
      from job_task_map jt where jt.jobId = job.jobId) AS tasks`
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

// Placeholder for future implementation
exports.createJob = async ({ jobData, userId, svcStatus } = {}) => {
  const { tasks, events, ...jobFields } = jobData
  async function transactionFn(connection) {
    const sqlInsertJob = `INSERT into job (name, description, createdBy) VALUES ?`
    const values = [
      [jobFields.name, jobFields.description, userId]
    ]
    const result = await connection.query(sqlInsertJob, [values])
    const jobId = result[0].insertId

    const sqlInsertTasks = `INSERT INTO job_task_map (jobId, taskname, parameters) VALUES ?`
    const taskValues = tasks.map(t => [jobId, t.taskname, t.parameters ? JSON.stringify(t.parameters) : null])
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

exports.getRunsByJob = async (jobId) => {
  throw new Error('Not implemented')
}

exports.runImmediateJob = async (jobId) => {
  const sql = 'CALL run_job(?)'
  const [result] = await dbUtils.pool.query(sql, [jobId])
  return result
}