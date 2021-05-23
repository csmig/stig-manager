const sql = require('mssql');
const config = require('../../utils/config')
const retry = require('async-retry')
const Umzug = require('umzug')
const path = require('path')
const fs = require("fs")
const semverLt = require('semver/functions/lt')

let _this = this

module.exports.sql = sql
module.exports.testConnection = async function () {
  try {
    // await _this.pool.connect()
    // const result = await _this.pool.request().query('SELECT @@version as version')
    const result = await _this.queryPool('SELECT @@version as version')
    return result.recordset[0].version
  }
  catch (err) {
    // console.log(err.message)
    throw (err)
  }
}
module.exports.queryPool = async function (query, params = {}, transaction = null) {
  try {
    const request = _this.pool.request(transaction)
    for (const [prop, value] of Object.entries(params)) {
      request.input(prop, value)
    }
    const result = request.query(query)
    return result
  }
  finally {}
}

function getPoolConfig() {
  const poolConfig = {
    server: config.database.host,
    port: parseInt(config.database.port),
    user: config.database.username,
    database: config.database.schema,
    trustServerCertificate: true,
    parseJSON: true,
    pool: {
      max: parseInt(config.database.maxConnections),
      min: 1
    }
  }
  if (config.database.password) {
    poolConfig.password = config.database.password
  }
  return poolConfig
}

module.exports.initializeDatabase = async function () {
  try {
    console.log('[DB] Initializing MSSQL.')

    // Create the connection pool
    const poolConfig = getPoolConfig()
    // _this.pool = new sql.ConnectionPool(poolConfig)
    _this.pool = await sql.connect(poolConfig)

    // Call the pool destruction methods on SIGTERM and SEGINT
    async function closePoolAndExit() {
      console.log('\nTerminating');
      try {
        await _this.pool.close()
        console.log('[DB] Pool closed');
        process.exit(0);
      } catch (err) {
        console.error(err.message);
        process.exit(1);
      }
    }
    process.on('SIGTERM', closePoolAndExit)
    process.on('SIGINT', closePoolAndExit)

    // Preflight the pool every 5 seconds
    console.log('[DB] Attempting preflight connection.')
    const detectedServerVersion = await retry(_this.testConnection, {
      retries: 24,
      factor: 1,
      minTimeout: 5 * 1000,
      maxTimeout: 5 * 1000,
      onRetry: (error) => {
        console.log(`[DB] ${error.message}`)
      }
    })
    console.log('[DB] Preflight connection succeeded.')
    console.log(`[DB] ${detectedServerVersion}`)


    // console.log(result)

    // Perform migrations
    const umzug = new Umzug({
      migrations: {
        path: path.join(__dirname, './migrations'),
        params: [_this.pool]
      },
      storage: path.join(__dirname, './migrations/lib/umzug-mssql-storage'),
      storageOptions: {
        dbUtils: _this
      }
    })

    if (config.database.revert) {
      const migrations = await umzug.executed()
      if (migrations.length) {
        console.log(`[DB] MSSQL schema will revert the last migration and terminate.`)
        await umzug.down()
      } else {
        console.log('[DB] MSSQL schema has no migrations to revert.')
      }
      console.log("Terminating")
      process.exit(1)
    }
    const migrations = await umzug.pending()
    if (migrations.length > 0) {
      console.log(`[DB] MSSQL schema requires ${migrations.length} update${migrations.length > 1 ? 's' : ''}.`)
      await umzug.up()
      console.log('[DB] All migrations performed successfully')
    }
    else {
      console.log(`[DB] MSSQL schema is up to date.`)
    }
    return migrations.length > 0 && migrations[0].file === '0000.js'

  }
  catch (err) {
    throw (err)
  }
}

module.exports.parseRevisionStr = function (revisionStr) {
  let ro = {}
  if (revisionStr !== 'latest') {
    let results = /V(\d+)R(\d+(\.\d+)?)/.exec(revisionStr)
    ro.version = results[1]
    ro.release = results[2]
    ro.table = 'revision'
    ro.table_alias = 'r'
    ro.predicates = ' and r.version = ? and r.release = ? '
  } else {
    ro.version = null
    ro.release = null
    ro.table = 'current_rev'
    ro.table_alias = 'cr'
    ro.predicates = ''
  }
  return ro
}

// Returns Boolean
module.exports.userHasAssetStigs = async function (assetId, requestedBenchmarkIds, elevate, userObject) {
  try {
    let sql
    let rows
    if (userObject.privileges.globalAccess) {
      sql = `select
        distinct sa.benchmarkId
      from
        stig_asset_map sa
      where
        sa.assetId = ?`

        ;[rows] = await _this.pool.query(sql, [assetId])
    }
    else {
      sql = `select
        distinct sa.benchmarkId
      from
        stig_asset_map sa
        left join asset a on sa.assetId = a.assetId
        left join collection_grant cg on a.collectionId = cg.collectionId
        left join user_stig_asset_map usa on sa.saId = usa.saId
      where
        cg.userId = ?
        and sa.assetId = ?
        and (cg.accessLevel >= 2 or (cg.accessLevel = 1 and usa.userId = cg.userId))`
        ;[rows] = await _this.pool.query(sql, [userObject.userId, assetId])
    }
    const availableBenchmarkIds = rows.map(row => row.benchmarkId)
    return requestedBenchmarkIds.every(requestedBenchmarkId => availableBenchmarkIds.includes(requestedBenchmarkId))
  }
  catch (e) {
    throw (e)
  }
}

// Returns Boolean
// Called when a User's Colection grant is accessLevel 1
module.exports.userHasAssetRule = async function (assetId, ruleId, elevate, userObject) {
  try {
  }
  catch (e) {
    throw (e)
  }
}


// @param reviews Array List of Review objects
// @param elevate Boolean 
// @param userObject Object
module.exports.scrubReviewsByUser = async function (reviews, elevate, userObject) {
  try {
    const permitted = [], rejected = []
    if (userObject.privileges.globalAccess || elevate) {
      permitted = reviews
    }
    else {
      const sql = `SELECT
        CONCAT(sa.assetId, '-', rgr.ruleId) as permitted
      FROM
        collection_grant cg
        inner join asset a on cg.collectionId = a.collectionId
        inner join stig_asset_map sa on a.assetId = sa.assetId
        inner join revision rev on sa.benchmarkId = rev.benchmarkId
        inner join rev_group_map rg on rev.revId = rg.revId
        inner join rev_group_rule_map rgr on rg.rgId = rgr.rgId
      WHERE
        cg.userId = ?
        and cg.accessLevel != 1
      GROUP BY
        sa.assetId, rgr.ruleId
      UNION
      SELECT
        CONCAT(sa.assetId, '-', rgr.ruleId) as permitted
      FROM
        collection_grant cg
        inner join asset a on cg.collectionId = a.collectionId
        inner join stig_asset_map sa on a.assetId = sa.assetId
        inner join user_stig_asset_map usa on (sa.saId = usa.saId and cg.userId = usa.userId)
        inner join revision rev on sa.benchmarkId = rev.benchmarkId
        inner join rev_group_map rg on rev.revId = rg.revId
        inner join rev_group_rule_map rgr on rg.rgId = rgr.rgId
      WHERE
        cg.userId = ?
        and cg.accessLevel = 1
      GROUP BY
        sa.assetId, rgr.ruleId`
      let [rows] = await _this.pool.query(sql, [userObject.userId, userObject.userId])
      let allowedAssetRules = rows.map(r => r.permitted)
      reviews.forEach(review => {
        if (allowedAssetRules.includes(`${review.assetId}-${review.ruleId}`)) {
          permitted.push(review)
        }
        else {
          rejected.push(review)
        }
      })
    }
    return {
      permitted: permitted,
      rejected: rejected
    }
  }
  catch (e) {
    throw (e)
  }

}

/**
 * updateStatsAssetStig
 * @param {PoolConnection} connection 
 * @param {Object} param1 
 * @param {string} param1.collectionId
 * @param {string} param1.assetId
 * @param {string} param1.benchmarkId
 * @param {string[]} param1.rules
 */
module.exports.updateStatsAssetStig = async function (connection, { collectionId, assetId, benchmarkId, rules }) {
  try {
    if (!connection) { throw ('Connection required') }
    // Handle optional predicates, 
    let predicates = []
    let binds = []
    let whereClause = ''

    if (rules && rules.length > 0) {
      predicates.push(`sa.benchmarkId IN (SELECT DISTINCT benchmarkId from current_group_rule where ruleId IN ?)`)
      binds.push([rules])
    }

    if (collectionId) {
      predicates.push('a.collectionId = ?')
      binds.push(collectionId)
    }
    if (assetId) {
      predicates.push('a.assetId = ?')
      binds.push(assetId)
    }
    if (benchmarkId) {
      predicates.push('sa.benchmarkId = ?')
      binds.push(benchmarkId)
    }
    if (predicates.length > 0) {
      whereClause = `where ${predicates.join(' and ')}`
    }

    const sqlSelect = `
      select
        sa.assetId,
        sa.benchmarkId,
        min(review.ts) as minTs,
        max(review.ts) as maxTs,
        sum(CASE WHEN review.autoResult = 0 and review.statusId = 0 THEN 1 ELSE 0 END) as savedManual,
        sum(CASE WHEN review.autoResult = 1 and review.statusId = 0 THEN 1 ELSE 0 END) as savedAuto,
        sum(CASE WHEN review.autoResult = 0 and review.statusId = 1 THEN 1 ELSE 0 END) as submittedManual,
        sum(CASE WHEN review.autoResult = 1 and review.statusId = 1 THEN 1 ELSE 0 END) as submittedAuto,
        sum(CASE WHEN review.autoResult = 0 and review.statusId = 2 THEN 1 ELSE 0 END) as rejectedManual,
        sum(CASE WHEN review.autoResult = 1 and review.statusId = 2 THEN 1 ELSE 0 END) as rejectedAuto,
        sum(CASE WHEN review.autoResult = 0 and review.statusId = 3 THEN 1 ELSE 0 END) as acceptedManual,
        sum(CASE WHEN review.autoResult = 1  and review.statusId = 3 THEN 1 ELSE 0 END) as acceptedAuto,
        sum(CASE WHEN review.resultId=4 and r.severity='high' THEN 1 ELSE 0 END) as highCount,
        sum(CASE WHEN review.resultId=4 and r.severity='medium' THEN 1 ELSE 0 END) as mediumCount,
        sum(CASE WHEN review.resultId=4 and r.severity='low' THEN 1 ELSE 0 END) as lowCount
      from
        asset a
        left join stig_asset_map sa using (assetId)
        left join current_group_rule cgr using (benchmarkId)
        left join rule r using (ruleId)
        left join review on (r.ruleId=review.ruleId and review.assetId=sa.assetId)
      ${whereClause}
      group by
        sa.assetId,
        sa.benchmarkId
      FOR UPDATE
      `

    const sqlUpsert = `
    insert into stats_asset_stig (
      assetId,
      benchmarkId,
      minTs,
      maxTs,
      savedManual,
      savedAuto,
      submittedManual,
      submittedAuto,
      rejectedManual,
      rejectedAuto,
      acceptedManual,
      acceptedAuto,
      highCount,
      mediumCount,
      lowCount)
    VALUES ? 
      on duplicate key update
        minTs = VALUES(minTs),
        maxTs = VALUES(maxTs),
        savedManual = VALUES(savedManual),
        savedAuto = VALUES(savedAuto),
        submittedManual = VALUES(submittedManual),
        submittedAuto = VALUES(submittedAuto),
        rejectedManual = VALUES(rejectedManual),
        rejectedAuto = VALUES(rejectedAuto),
        acceptedManual = VALUES(acceptedManual),
        acceptedAuto = VALUES(acceptedAuto),
        highCount = VALUES(highCount),
        mediumCount = VALUES(mediumCount),
        lowCount = VALUES(lowCount)
    `
    const sqlIntegrity = `
      DELETE
        sas 
      FROM
        stats_asset_stig sas
        left join stig_asset_map sam on sas.assetId = sam.assetId and sas.benchmarkId = sam.benchmarkId
      WHERE
        sam.assetId is null
    `
    let results;
    [results] = await connection.query(sqlSelect, binds)

    if (results.length > 0) {
      let bindsUpsert = results.map(r => Object.values(r))
      let stats;
      [stats] = await connection.query(sqlUpsert, [bindsUpsert])
      // await connection.query(sqlIntegrity)
      return stats
    }
    else {
      return false
    }
  }
  catch (err) {
    throw err
  }
}


module.exports.CONTEXT_ALL = 'all'
module.exports.CONTEXT_DEPT = 'department'
module.exports.CONTEXT_USER = 'user'
module.exports.REVIEW_RESULT_ID = {
  1: { api: 'notchecked', ckl: 'Not_Reviewed', abbr: 'NC' },
  2: { api: 'notapplicable', ckl: 'Not_Applicable', abbr: 'NA' },
  3: { api: 'pass', ckl: 'NotAFinding', abbr: 'NF' },
  4: { api: 'fail', ckl: 'Open', abbr: 'O' }
}
module.exports.REVIEW_RESULT_API = {
  'notapplicable': 2,
  'pass': 3,
  'fail': 4
}
module.exports.REVIEW_RESULT_CKL = {
  'Not_Applicable': { id: 2 },
  'NotAFinding': { id: 3 },
  'Open': { id: 4 }
}
module.exports.REVIEW_RESULT_ABBR = {
  'NA': { id: 2 },
  'NF': { id: 3 },
  'O': { id: 4 }
}
module.exports.REVIEW_ACTION_ID = {
  1: 'remediate',
  2: 'mitigate',
  3: 'exception'
}
module.exports.REVIEW_ACTION_API = {
  'remediate': 1,
  'mitigate': 2,
  'exception': 3
}
module.exports.REVIEW_STATUS_ID = {
  0: 'saved',
  1: 'submitted',
  2: 'rejected',
  3: 'approved'
}
module.exports.REVIEW_STATUS_API = {
  'saved': 0,
  'submitted': 1,
  'rejected': 2,
  'accepted': 3
}
module.exports.WRITE_ACTION = {
  CREATE: 0,
  REPLACE: 1,
  UPDATE: 2
}
module.exports.USER_ROLE_ID = {
  2: { role: "IAWF", display: "IA Workforce" },
  3: { role: "IAO", display: "IA Officer" },
  4: { role: "Staff", display: "IA Staff" }
}
module.exports.USER_ROLE = {
  IAWF: { id: 2, display: "IA Workforce" },
  IAO: { id: 3, display: "IA Officer" },
  Staff: { id: 4, display: "IA Staff" }
}

module.exports.jsonObject = (obj) => {
  const appends = []
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value == 'string') {
      if (value.startsWith('"')) {
        appends.push(`'"${key}": "', ${value.substring(1)}, '"'`)
      }
      else {
        appends.push(`'"${key}":', ${value}`)
      }
    }
  }
  return `CONCAT( '{', ${appends.join(", ','  , ")}, '}')`
}

module.exports.jsonArrayAggD = ( item ) => {
  if (item.startsWith('"')) {
    return `CONCAT('["', dbo.group_concat_d(distinct ${item},'","'), '"]')`
  }
  else {
    return `CONCAT('[', dbo.group_concat_d(distinct ${item},','), ']')`
  }
}

