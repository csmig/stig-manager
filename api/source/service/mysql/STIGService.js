'use strict';
const dbUtils = require('./utils')

let _this = this

/**
Generalized queries for STIGs
**/
exports.queryStigs = async function ( inPredicates ) {
  try {
    let columns = [
      'b.benchmarkId',
      'b.title',
      `cr.status`,
      `concat('V', cr.version, 'R', cr.release) as "lastRevisionStr"`,
      `date_format(cr.benchmarkDateSql,'%Y-%m-%d') as "lastRevisionDate"`,
      `cr.ruleCount`,
      `JSON_ARRAYAGG(concat('V',revision.version,'R',revision.release)) as revisionStrs`
    ]
    let joins = [
      'stig b',
      'left join current_rev cr on b.benchmarkId = cr.benchmarkId',
      'left join revision on b.benchmarkId = revision.benchmarkId'
    ]

    // PREDICATES
    let predicates = {
      statements: [],
      binds: []
    }
    if (inPredicates.title) {
      predicates.statements.push("b.title LIKE CONCAT('%',?,'%')")
      predicates.binds.push( inPredicates.title )
    }
    if (inPredicates.benchmarkId) {
      predicates.statements.push('b.benchmarkId = ?')
      predicates.binds.push( inPredicates.benchmarkId )
    }

    // CONSTRUCT MAIN QUERY
    let sql = 'SELECT '
    sql+= columns.join(",\n")
    sql += ' FROM '
    sql+= joins.join(" \n")
    if (predicates.statements.length > 0) {
      sql += "\nWHERE " + predicates.statements.join(" and ")
    }
    sql += ' group by b.benchmarkId order by b.benchmarkId'

    let [rows, fields] = await dbUtils.pool.query(sql, predicates.binds)
    return (rows)
  }
  catch (err) {
    throw err
  }  
}


/**
Generalized queries for Groups
**/
exports.queryGroups = async function ( inProjection, inPredicates ) {
  let columns = [
    'g.groupId as "groupId"',
    'g.title as "title"',
  ]

  let joins
  let predicates = {
    statements: [],
    binds: []
  }
  
  predicates.statements.push('r.benchmarkId = ?')
  predicates.binds.push(inPredicates.benchmarkId)
  
  if (inPredicates.revisionStr != 'latest') {
    joins = ['revision r']
    let [results, version, release] = /V(\d+)R(\d+(\.\d+)?)/.exec(inPredicates.revisionStr)
    predicates.statements.push('r.version = ?')
    predicates.binds.push(version)
    predicates.statements.push('r.release = ?')
    predicates.binds.push(release)
  } else {
    joins = ['current_rev r']
  }
  
  joins.push('inner join rev_group_map rg on r.revId = rg.revId')
  joins.push('inner join `group` g on rg.groupId = g.groupId')

  if (inPredicates.groupId) {
    predicates.statements.push('g.groupId = ?')
    predicates.binds.push(inPredicates.groupId)
  }

  // PROJECTIONS
  if (inProjection && inProjection.includes('rules')) {
    joins.push('inner join rev_group_rule_map rgr on rg.rgId = rgr.rgId' )
    joins.push('inner join rule rule on rgr.ruleId = rule.ruleId' )
    columns.push(`json_arrayagg(json_object(
      'ruleId', rule.ruleId, 
      'version', rule.version, 
      'title', rule.title, 
      'severity', rule.severity)) as "rules"`)
  }

  // CONSTRUCT MAIN QUERY
  let sql = 'SELECT '
  sql+= columns.join(",\n")
  sql += ' FROM '
  sql+= joins.join(" \n")
  if (predicates.statements.length > 0) {
    sql += "\nWHERE " + predicates.statements.join(" and ")
  }
  if (inProjection && inProjection.includes('rules')) {
    sql += "\nGROUP BY g.groupId, g.title\n"
  }  
  sql += ` order by substring(g.groupId from 3) + 0`

  try {
    let [rows, fields] = await dbUtils.pool.query(sql, predicates.binds)
    return (rows.length > 0 ? rows : null)
  }
  catch (err) {
    throw err
  }  
}


/**
Generalized queries for Rules associated with a STIG
For specific Rule, allow for projections with Check and Fixes
**/
exports.queryBenchmarkRules = async function ( benchmarkId, revisionStr, inProjection, inPredicates ) {
  let columns = [
    'r.ruleId',
    'r.title',
    'g.groupId',
    'g.title as "groupTitle"',
    'r.version',
    'r.severity'
  ]

  let groupBy = [
    'r.ruleId',
    'r.title',
    'g.groupId',
    'g.title',
    'r.version',
    'r.severity',
    'rgr.rgrId'
  ]

  let joins
  let predicates = {
    statements: [],
    binds: []
  }
  
  // PREDICATES
  predicates.statements.push('rev.benchmarkId = ?')
  predicates.binds.push(benchmarkId)
  
  if (revisionStr != 'latest') {
    joins = ['revision rev']
    let [input, version, release] = /V(\d+)R(\d+(\.\d+)?)/.exec(revisionStr)
    predicates.statements.push('rev.version = ?')
    predicates.binds.push(version)
    predicates.statements.push('rev.release = ?')
    predicates.binds.push(release)
  } else {
    joins = ['current_rev rev']
  }
  
  if (inPredicates && inPredicates.ruleId) {
    predicates.statements.push('rgr.ruleId = ?')
    predicates.binds.push(inPredicates.ruleId)
  }

  joins.push('left join rev_group_map rg on rev.revId = rg.revId')
  joins.push('left join `group` g on rg.groupId = g.groupId')
  joins.push('left join rev_group_rule_map rgr on rg.rgId = rgr.rgId' )
  joins.push('left join rule r on rgr.ruleId = r.ruleId' )

  // PROJECTIONS
  if ( inProjection && inProjection.includes('detail') ) {
    columns.push(`json_object(
      'weight', r.weight,
      'vulnDiscussion', r.vulnDiscussion,
      'falsePositives', r.falsePositives,
      'falseNegatives', r.falseNegatives,
      'documentable', r.documentable,
      'mitigations', r.mitigations,
      'severityOverrideGuidance', r.severityOverrideGuidance,
      'potentialImpacts', r.potentialImpacts,
      'thirdPartyTools', r.thirdPartyTools,
      'mitigationControl', r.mitigationControl,
      'responsibility', r.responsibility
    ) as detail`)
    groupBy.push(
      'r.version',
      'r.weight',
      'r.vulnDiscussion',
      'r.falsePositives',
      'r.falseNegatives',
      'r.documentable',
      'r.mitigations',
      'r.severityOverrideGuidance',
      'r.potentialImpacts',
      'r.thirdPartyTools',
      'r.mitigationControl',
      'r.responsibility',
      'r.iacontrols'
    )
  }

  if ( inProjection && inProjection.includes('ccis') ) {
    columns.push(`(select 
      coalesce
      (
        (select json_arrayagg (
          json_object(
            'cci', rc.cci,
            'apAcronym', cci.apAcronym,
            'definition',  cci.definition
          )
        ) 
        from
          rule_cci_map rc 
          left join cci cci on rc.cci = cci.cci
          left join cci_reference_map cr on cci.cci = cr.cci
        where 
          rc.ruleId = r.ruleId
        ), 
        json_array()
      )
    ) as "ccis"`)
  }
  if ( inProjection && inProjection.includes('checks') ) {
    columns.push(`(select json_arrayagg(json_object(
      'checkId', rck.checkId,
      'content', cc.content))
      from rev_group_rule_check_map rck 
      left join check_content cc on rck.ccId = cc.ccId
      where rck.rgrId = rgr.rgrId) as "checks"`)
  }
  if ( inProjection && inProjection.includes('fixes') ) {
    columns.push(`(select json_arrayagg(json_object(
      'fixId', rf.fixId,
      'text', fix.text))
      from rev_group_rule_fix_map rf left join fix fix on fix.fixId = rf.fixId
      where rf.rgrId = rgr.rgrId) as "fixes"`)
  }


  // CONSTRUCT MAIN QUERY
  let sql = 'SELECT '
  sql+= columns.join(",\n")
  sql += ' FROM '
  sql+= joins.join(" \n")
  if (predicates.statements.length > 0) {
    sql += "\nWHERE " + predicates.statements.join(" and ")
  }
  if (inProjection && inProjection.includes('cci')) {
    sql += "\nGROUP BY " + groupBy.join(", ") + "\n"
  }  
  sql += ` order by substring(r.ruleId from 4) + 0`

  try {
    let [rows] = await dbUtils.pool.query(sql, predicates.binds)
    return (rows)
  }
  catch (err) {
    throw err
  }  
}


/**
Generalized queries for a single Rule, optionally with Check and Fix
**/
exports.queryRules = async function ( ruleId, inProjection ) {
  let columns = [
    'r.ruleId',
    'r.version',
    'r.title',
    'r.severity',
    'g.groupId',
    'g.Title as "groupTitle"'
  ]
  
  let groupBy = [
    'r.ruleId',
    'r.version',
    'r.title',
    'r.severity',
    'g.groupId',
    'g.Title'
  ]

  let joins = [
    'rule r',
    'left join rev_group_rule_map rgr on r.ruleId = rgr.ruleId',
    'left join rev_group_map rg on rgr.rgId = rg.rgId',
    'left join `group` g on rg.groupId = g.groupId'
  ]


  let predicates = {
    statements: [],
    binds: []
  }
  
  // PREDICATES
  predicates.statements.push('r.ruleId = ?')
  predicates.binds.push(ruleId)
  

  // PROJECTIONS
  if ( inProjection && inProjection.includes('detail') ) {
    columns.push(`json_object(
      'weight', r.weight,
      'vulnDiscussion', r.vulnDiscussion,
      'falsePositives', r.falsePositives,
      'falseNegatives', r.falseNegatives,
      'documentable', r.documentable,
      'mitigations', r.mitigations,
      'severityOverrideGuidance', r.severityOverrideGuidance,
      'potentialImpacts', r.potentialImpacts,
      'thirdPartyTools', r.thirdPartyTools,
      'mitigationControl', r.mitigationControl,
      'responsibility', r.responsibility
    ) as detail`)
    let detailColumns = [
      'r.weight',
      'r.vulnDiscussion',
      'r.falsePositives',
      'r.falseNegatives',
      'r.documentable',
      'r.mitigations',
      'r.severityOverrideGuidance',
      'r.potentialImpacts',
      'r.thirdPartyTools',
      'r.mitigationControl',
      'r.responsibility'
    ]
    groupBy.push(...detailColumns)
  }

  if ( inProjection && inProjection.includes('ccis') ) {
    columns.push(`(select 
      coalesce
      (
        (select json_arrayagg (
          json_object(
            'cci', rc.cci,
            'apAcronym', cci.apAcronym,
            'definition',  cci.definition
          )
        ) 
        from
          rule_cci_map rc 
          left join cci cci on rc.cci = cci.cci
          left join cci_reference_map cr on cci.cci = cr.cci
        where 
          rc.ruleId = r.ruleId
        ), 
        json_array()
      )
    ) as "ccis"`)
  }

  if ( inProjection && inProjection.includes('checks') ) {
    columns.push(`(select json_arrayagg(json_object(
      'checkId', rck.checkId,
      'content', cc.content))
      from rev_group_rule_check_map rck 
        left join check_content cc on rck.ccId = cc.ccId
        left join rev_group_rule_map rgr on rck.rgrId = rgr.rgrId
      where rgr.ruleId = r.ruleId) as "checks"`)
  }

  if ( inProjection && inProjection.includes('fixes') ) {
    columns.push(`(select json_arrayagg(json_object(
      'fixId', rf.fixId,
      'text', fix.text))
      from rev_group_rule_fix_map rf 
        left join fix fix on fix.fixId = rf.fixId
        left join rev_group_rule_map rgr on rf.rgrId = rgr.rgrId
      where rgr.ruleId = r.ruleId) as "fixes"`)
  }  


  // CONSTRUCT MAIN QUERY
  let sql = 'SELECT '
  sql += columns.join(",\n")
  sql += ' FROM '
  sql += joins.join(" \n")

  if (predicates.statements.length > 0) {
    sql += "\nWHERE " + predicates.statements.join(" and ")
  }

  sql += "\nGROUP BY " + groupBy.join(", ") + "\n"

  sql += ` ORDER BY substring(r.ruleId from 4) + 0`

  try {
    let [rows, fields] = await dbUtils.pool.query(sql, predicates.binds)
    return (rows[0])
  }
  catch (err) {
    throw err
  }  
}


exports.insertManualBenchmark = async function (b, clobber, svcStatus = {}) {

  let connection
  try {
    const stats = {}
    let totalstart = process.hrtime() 

    const dml = dmlObjectFromBenchmarkData(b) // defined below

    connection = await dbUtils.pool.getConnection()
    connection.config.namedPlaceholders = true

    // check if this revision exists
    const [revision] = await connection.query('select revId from revision where `benchmarkId` = ? and `version` = ? and `release` = ?', [
      dml.revision.binds.benchmarkId,
      dml.revision.binds.version,
      dml.revision.binds.release
    ])
    const gExistingRevision = revision?.[0]?.revId
    if (gExistingRevision && !clobber) {
      return {
        benchmarkId: dml.revision.binds.benchmarkId,
        revisionStr: `V${dml.revision.binds.version}R${dml.revision.binds.release}`,
        action: 'preserved'
      }
    }

    // create temporary table(s) outside the transaction
    await connection.query(dml.tempGroupRuleDrop.sql)
    await connection.query(dml.tempRuleCheckDrop.sql)
    await connection.query(dml.tempRuleFixDrop.sql)
    await connection.query(dml.tempGroupRuleCreate.sql)
    await connection.query(dml.tempRuleCheckCreate.sql)
    await connection.query(dml.tempRuleFixCreate.sql)

    async function transaction() {
      let result, hrstart, hrend, action = 'inserted'
      await connection.query('START TRANSACTION')

      // purge any exitsing records for this revision so we can replace
      if (gExistingRevision) {
        hrstart = process.hrtime()
        await connection.query('DELETE FROM revision WHERE revId = ?', [gExistingRevision])
        const cleanupDml = [
          "DELETE FROM `group` WHERE groupId NOT IN (select groupId from rev_group_map)",
          "DELETE FROM `rule` WHERE ruleId NOT IN (select ruleId from rev_group_rule_map )",
          "DELETE FROM check_content WHERE ccId NOT IN (select ccId from rev_group_rule_check_map)",
          "DELETE FROM fix WHERE fixId NOT IN (select fixId from rev_group_rule_fix_map)"
        ]
        for (const query of cleanupDml) {
          await connection.query(query)
        }
        hrend = process.hrtime(hrstart)
        stats.delRev = `${hrend[0]}s  ${hrend[1] / 1000000}ms`
        action = 'replaced'
      }

      // insert new records for this revision
      const queryOrder = [
        'stig',
        'revision',
        'group',
        'rule',
        'tempGroupRuleInsert',
        'tempRuleCheckInsert',
        'tempRuleFixInsert',
        'checkContent',
        'fix',
        'revGroupMap',
        'revGroupRuleMap',
        'revGroupRuleCheckMap',
        'revGroupRuleFixMap',
        'ruleCciMap'
      ]

      for (const query of queryOrder) {
        hrstart = process.hrtime()
        if (Array.isArray(dml[query].binds)) {
          if (dml[query].binds.length === 0) { continue }
          ;[result] = await connection.query(dml[query].sql, [dml[query].binds])
        }
        else {
          ;[result] = await connection.query(dml[query].sql, dml[query].binds)
        }
        hrend = process.hrtime(hrstart)
        stats[query] = `${result.affectedRows} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`
      }

      // Update current_rev
      hrstart = process.hrtime()
      let sqlDeleteCurrentRev = 'DELETE from current_rev where benchmarkId = ?'
      let sqlUpdateCurrentRev = `INSERT INTO current_rev (
        revId,
        benchmarkId,
        \`version\`, 
        \`release\`, 
        benchmarkDate,
        benchmarkDateSql,
        status,
        statusDate,
        description,
        active,
        groupCount,
        lowCount,
        mediumCount,
        highCount,
        checkCount,
        fixCount)
        SELECT 
          revId,
          benchmarkId,
          \`version\`,
          \`release\`,
          benchmarkDate,
          benchmarkDateSql,
          status,
          statusDate,
          description,
          active,
          groupCount,
          lowCount,
          mediumCount,
          highCount,
          checkCount,
          fixCount
        FROM
          v_current_rev
        WHERE
          v_current_rev.benchmarkId = ?`
      ;[result] = await connection.query(sqlDeleteCurrentRev, [dml.stig.binds.benchmarkId])
      ;[result] = await connection.query(sqlUpdateCurrentRev, [dml.stig.binds.benchmarkId])
      hrend = process.hrtime(hrstart)
      stats.current_rev = `${hrend[0]}s  ${hrend[1] / 1000000}ms`


      // update current_group_rule
      hrstart = process.hrtime()
      let sqlDeleteCurrentGroupRule = 'DELETE FROM current_group_rule WHERE benchmarkId = ?'
      let sqlInsertCurrentGroupRule = `INSERT INTO current_group_rule (groupId, ruleId, benchmarkId)
        SELECT rg.groupId,
          rgr.ruleId,
          cr.benchmarkId
        from
          current_rev cr
          left join rev_group_map rg on rg.revId=cr.revId
          left join rev_group_rule_map rgr on rgr.rgId=rg.rgId
        where
          cr.benchmarkId = ?
        order by
          rg.groupId,rgr.ruleId,cr.benchmarkId`
      ;[result] = await connection.query(sqlDeleteCurrentGroupRule, [dml.stig.binds.benchmarkId])
      ;[result] = await connection.query(sqlInsertCurrentGroupRule, [dml.stig.binds.benchmarkId])
      hrend = process.hrtime(hrstart)
      stats.current_rev = `${hrend[0]}s  ${hrend[1] / 1000000}ms`

      // Stats
      hrstart = process.hrtime()
      await dbUtils.updateStatsAssetStig(connection, {
        benchmarkId: dml.stig.binds.benchmarkId
      })
      hrend = process.hrtime(hrstart)
      stats.statistics = `${hrend[0]}s  ${hrend[1] / 1000000}ms`

      await connection.commit()
      hrend = process.hrtime(totalstart)
      stats.totalTime = `Completed in ${hrend[0]}s  ${hrend[1] / 1000000}ms`

      return {
        benchmarkId: dml.revision.binds.benchmarkId,
        revisionStr: `V${dml.revision.binds.version}R${dml.revision.binds.release}`,
        action
      }
    }
    return await dbUtils.retryOnDeadlock(transaction, svcStatus)
  }
  catch (err) {
    if (typeof connection !== 'undefined') {
      await connection.rollback()
    }
    throw err
  }
  finally {
    if (typeof connection !== 'undefined') {
      await connection.release()
    }
  }

  function dmlObjectFromBenchmarkData(b) {
    let dml = {
      stig: {
        sql: "insert into stig (title, benchmarkId) VALUES (:title, :benchmarkId) as new on duplicate key update stig.title = new.title"
      },
      revisionDelete: {
        sql: 'delete from revision where revId = ?',
        binds: []
      },
      revision: {
        sql: `insert into revision (
  revId, 
  benchmarkId, 
  \`version\`, 
  \`release\`, 
  benchmarkDate, 
  benchmarkDateSql, 
  status, 
  statusDate, 
  description,
  groupCount,
  checkCount,
  fixCount,
  lowCount,
  mediumCount,
  highCount
) VALUES (
  :revId, 
  :benchmarkId, 
  :version, 
  :release, 
  :benchmarkDate, 
  STR_TO_DATE(:benchmarkDateSql, '%Y-%m-%d'),
  :status, 
  :statusDate, 
  :description,
  :groupCount,
  :checkCount,
  :fixCount,
  :lowCount,
  :mediumCount,
  :highCount)`,
      },
      group: {
        sql: `INSERT into \`group\` (
  groupId, 
  title, 
  severity
  ) VALUES ? as new
  ON DUPLICATE KEY UPDATE
    \`group\`.groupId = new.groupId,
    \`group\`.title = new.title,
    \`group\`.severity = CASE WHEN \`group\`.severity <> new.severity THEN
      'mixed' ELSE new.severity END`,
        binds: []
      },
      fix: {
        sql: "insert into fix (fixId, text) VALUES ? as new on duplicate key update fix.text=new.text",
        binds: []
      },
      checkContent: {
        sql: `insert ignore into check_content (content) select content from temp_rule_check`
      },
      tempGroupRuleDrop: {
        sql: "drop table if exists temp_group_rule"
      },
      tempGroupRuleCreate: {
        sql: `CREATE TEMPORARY TABLE temp_group_rule (
          groupId varchar(45) ,
          ruleId varchar(255) ,
          \`version\` varchar(45) ,
          \`title\` varchar(1000) ,
          \`severity\` varchar(45) ,
          \`weight\` varchar(45) ,
          \`vulnDiscussion\` text,
          \`falsePositives\` text,
          \`falseNegatives\` text,
          \`documentable\` varchar(45) ,
          \`mitigations\` text,
          \`severityOverrideGuidance\` text,
          \`potentialImpacts\` text,
          \`thirdPartyTools\` text,
          \`mitigationControl\` text,
          \`responsibility\` varchar(255) ,
          \`iaControls\` varchar(255) 
          )`
      },
      tempGroupRuleInsert: {
        sql: `insert into temp_group_rule (
          groupId, 
          ruleId,
          \`version\`,
          title,
          severity,
          weight,
          vulnDiscussion,
          falsePositives,
          falseNegatives,
          documentable,
          mitigations,
          severityOverrideGuidance,
          potentialImpacts,
          thirdPartyTools,
          mitigationControl,
          responsibility,
          iaControls
          ) VALUES ?`,
        binds: []
      },
      tempRuleCheckDrop: {
        sql: "drop table if exists temp_rule_check"
      },
      tempRuleCheckCreate: {
        sql: `CREATE TEMPORARY TABLE temp_rule_check (
          ruleId varchar(255) NOT NULL,
          checkSystem varchar(255),
          content TEXT,
          digest BINARY(32) GENERATED ALWAYS AS (UNHEX(SHA2(content, 256))) STORED,
          INDEX (digest))`
      },
      tempRuleCheckInsert: {
        sql: `insert into temp_rule_check (ruleId, checkSystem, content) VALUES ?`,
        binds: []
      },
      tempRuleFixDrop: {
        sql: "drop table if exists temp_rule_fix"
      },
      tempRuleFixCreate: {
        sql: `CREATE TEMPORARY TABLE temp_rule_fix (
          ruleId varchar(255) NOT NULL,
          fixRef VARCHAR(45),
          fixText TEXT,
          fixDigest BINARY(32) GENERATED ALWAYS AS (UNHEX(SHA2(fixText, 256))) STORED,
          INDEX (fixDigest))`
      },
      tempRuleFixInsert: {
        sql: `insert into temp_rule_fix (ruleId, fixRef, fixText) VALUES ?`,
        binds: []
      },
      rule: {
        sql: `insert into rule (
          ruleId,
          version,
          title,
          severity,
          weight,
          vulnDiscussion,
          falsePositives,
          falseNegatives,
          documentable,
          mitigations,
          severityOverrideGuidance,
          potentialImpacts,
          thirdPartyTools,
          mitigationControl,
          responsibility,
          iaControls
        ) VALUES ? as new
        on duplicate key update
          rule.version = new.version,
          rule.title = new.title,
          rule.severity = new.severity,
          rule.weight = new.weight,
          rule.vulnDiscussion = new.vulnDiscussion,
          rule.falsePositives = new.falsePositives,
          rule.falseNegatives = new.falseNegatives,
          rule.documentable = new.documentable,
          rule.mitigations = new.mitigations,
          rule.severityOverrideGuidance = new.severityOverrideGuidance,
          rule.potentialImpacts = new.potentialImpacts,
          rule.thirdPartyTools = new.thirdPartyTools,
          rule.mitigationControl = new.mitigationControl,
          rule.responsibility = new.responsibility,
          rule.iaControls = new.iaControls`,
        binds: []
      },
      ruleCcId: {
        sql: `with cte1 as (
  select
    rgr.ruleId,
    MAX(c.checkId) as checkId
  from
    rev_group_map rg
    left join rev_group_rule_map rgr on rg.rgId = rgr.rgId
    left join rev_group_rule_check_map rgrc on rgr.rgrId = rgrc.rgrId
    left join \`check\` c on rgrc.checkId = c.checkId
  where
    rg.revId = ?
  group by
    rgr.ruleId),
  cte2 as (
    select
      cte1.ruleId,
      c.ccId
    from
      \`check\` c
      inner join cte1 on c.checkId = cte1.checkId)
  update rule
  inner join cte2 on rule.ruleId = cte2.ruleId
  set rule.ccId = cte2.ccId`,
        binds: []
      },
      revGroupMap: {
        delete: {
          sql: 'delete from rev_group_map where revId = ?',
          binds: []
        },
        sql: "insert into rev_group_map (revId, groupId) VALUES ?",
        binds: []
      },
      revGroupRuleMap: {
        sql: `INSERT INTO rev_group_rule_map (rgId, ruleId, \`version\`, severity, weight, vulnDiscussion, falsePositives, falseNegatives,
        documentable, mitigations, severityOverrideGuidance, potentialImpacts, thirdPartyTools, mitigationControl, responsibility, iaControls)
          SELECT 
            rg.rgId,
            tt.ruleId,
            tt.\`version\`,
            tt.severity,
            tt.weight,
            tt.vulnDiscussion,
            tt.falsePositives,
            tt.falseNegatives,
            tt.documentable,
            tt.mitigations,
            tt.severityOverrideGuidance,
            tt.potentialImpacts,
            tt.thirdPartyTools,
            tt.mitigationControl,
            tt.responsibility,
            tt.iaControls
          FROM
            rev_group_map rg
            left join temp_group_rule tt using (groupId)
          WHERE rg.revId = :revId`
      },
      ruleCciMap: {
        sql: `INSERT IGNORE INTO rule_cci_map
        (ruleId, cci)
        VALUES ?`,
        binds: []
      },
      revGroupRuleCheckMap: {
        sql: `INSERT INTO rev_group_rule_check_map (rgrId, checkId, ccId)
          SELECT 
            rgr.rgrId,
            tt.checkSystem,
            cc.ccId
          FROM
            rev_group_map rg
            left join rev_group_rule_map rgr using (rgId)
            left join temp_rule_check tt using (ruleId)
            left join check_content cc using (digest)
          WHERE 
            rg.revId = :revId
            AND rg.rgId=rgr.rgId`
      },
      revGroupRuleFixMap: {
        sql: `INSERT INTO rev_group_rule_fix_map (rgrId, fixId)
          SELECT 
            rgr.rgrId,
            tt.fixRef
          FROM
            rev_group_map rg
            left join rev_group_rule_map rgr using (rgId)
            left join temp_rule_fix tt using (ruleId)
          WHERE 
            rg.revId = :revId
            AND rg.rgId=rgr.rgId`
      },
    }

    let { revision, ...benchmarkBinds } = b
    // QUERY: stig
    dml.stig.binds = benchmarkBinds
    delete dml.stig.binds.scap

    let { groups, ...revisionBinds } = revision
    delete revisionBinds.revisionStr
    revisionBinds.benchmarkId = benchmarkBinds.benchmarkId
    revisionBinds.revId = `${revisionBinds.benchmarkId}-${revisionBinds.version}-${revisionBinds.release}`
    revisionBinds.benchmarkDateSql = revisionBinds.benchmarkDate8601
    delete revisionBinds.benchmarkDate8601
    revisionBinds.lowCount = revisionBinds.mediumCount = revisionBinds.highCount = 0
    // QUERY: revision
    dml.revision.binds = revisionBinds
    // QUERY: revisionDelete
    dml.revisionDelete.binds.push(revisionBinds.revId)
    // QUERY: ruleCcId
    dml.ruleCcId.binds.push(revisionBinds.revId)

    groups.forEach(group => {
      let { rules, ...groupBinds } = group

      let groupSeverity
      rules.forEach(rule => {
        let { checks, fixes, idents, ...ruleBinds } = rule
        // Group severity calculation
        if (!groupSeverity) {
          groupSeverity = ruleBinds.severity
        }
        else if (groupSeverity !== ruleBinds.severity) {
          groupSeverity = 'mixed'
        }
        // QUERY: tempGroupRuleInsert
        dml.tempGroupRuleInsert.binds.push([
          groupBinds.groupId,
          ruleBinds.ruleId,
          ruleBinds.version,
          ruleBinds.title,
          ruleBinds.severity,
          ruleBinds.weight,
          ruleBinds.vulnDiscussion,
          ruleBinds.falsePositives,
          ruleBinds.falseNegatives,
          ruleBinds.documentable,
          ruleBinds.mitigations,
          ruleBinds.severityOverrideGuidance,
          ruleBinds.potentialImpacts,
          ruleBinds.thirdPartyTools,
          ruleBinds.mitigationControl,
          ruleBinds.responsibility,
          ruleBinds.iaControls          
        ])

        // QUERY: rule
        dml.rule.binds.push([
          ruleBinds.ruleId,
          ruleBinds.version,
          ruleBinds.title,
          ruleBinds.severity,
          ruleBinds.weight,
          ruleBinds.vulnDiscussion,
          ruleBinds.falsePositives,
          ruleBinds.falseNegatives,
          ruleBinds.documentable,
          ruleBinds.mitigations,
          ruleBinds.severityOverrideGuidance,
          ruleBinds.potentialImpacts,
          ruleBinds.thirdPartyTools,
          ruleBinds.mitigationControl,
          ruleBinds.responsibility,
          ruleBinds.iaControls
        ])
        if (checks) {
          checks.forEach(check => {
            // QUERY: tempRuleCheckInsert
            dml.tempRuleCheckInsert.binds.push([
              ruleBinds.ruleId,
              check.checkId,
              check.content
            ])
          })
        }

        fixes.forEach(fix => {
          // QUERY: tempRuleFixInsert
          dml.tempRuleFixInsert.binds.push([
            ruleBinds.ruleId,
            fix.fixId,
            fix.text
          ])
          // QUERY: fix
          dml.fix.binds.push([
            fix.fixId,
            fix.text
          ])
        })

        idents.forEach(ident => {
          if (ident.system === 'http://iase.disa.mil/cci' || ident.system === 'http://cyber.mil/cci') {
            dml.ruleCciMap.binds.push([rule.ruleId, ident.ident.replace('CCI-', '')])
          }
        })

      }) // end rules.forEach

      // QUERY: group
      dml.group.binds.push([
        groupBinds.groupId,
        groupBinds.title,
        groupSeverity
      ])

      // QUERY: rev_group_map
      dml.revGroupMap.binds.push([
        revisionBinds.revId,
        group.groupId
      ])

      // QUERY: rev_group_rule_map
      dml.revGroupRuleMap.binds = { revId: revisionBinds.revId }
      // QUERY: rev_group_rule_check_map
      dml.revGroupRuleCheckMap.binds = { revId: revisionBinds.revId }
      // QUERY: rev_group_rule_fix_map
      dml.revGroupRuleFixMap.binds = { revId: revisionBinds.revId }

    }) // end groups.forEach

    dml.revision.binds.groupCount = dml.group.binds.length
    dml.revision.binds.checkCount = dml.tempRuleCheckInsert.binds.length
    dml.revision.binds.fixCount = dml.fix.binds.length
    // add rule severity counts to the revision binds. rule[3] is the index of the severity value
    dml.rule.binds.reduce((binds, rule) => {
      const prop = `${rule[3]}Count`
      binds[prop] = (binds[prop] ?? 0) + 1
      return binds
    }, dml.revision.binds)

    return dml
  }
}

/**
 * Deletes the specified revision of a STIG
 *
 * benchmarkId String A path parameter that identifies a STIG
 * revisionStr String A path parameter that identifies a STIG revision [ V{version_num}R{release_num} | 'latest' ]
 * returns Revision
 **/
exports.deleteRevisionByString = async function(benchmarkId, revisionStr, svcStatus = {}) {

  let dmls = [
    "DELETE FROM revision WHERE benchmarkId = :benchmarkId and `version` = :version and `release` = :release",
    "DELETE FROM `rule` WHERE ruleId NOT IN (select ruleId from rev_group_rule_map )",
    "DELETE FROM check_content WHERE ccId NOT IN (select distinct ccId from rev_group_rule_check_map)",
    "DELETE FROM fix WHERE fixId NOT IN (select fixId from rev_group_rule_fix_map)",
    "DELETE FROM `group` WHERE groupId NOT IN (select groupId from rev_group_map)"
  ]
  let currentRevDmls = [
    "DELETE from current_rev where benchmarkId = :benchmarkId",
    `INSERT INTO current_rev (
        revId,
        benchmarkId,
        \`version\`, 
        \`release\`, 
        benchmarkDate,
        benchmarkDateSql,
        status,
        statusDate,
        description,
        active,
        groupCount,
        lowCount,
        mediumCount,
        highCount,
        checkCount,
        fixCount)
      SELECT 
        revId,
        benchmarkId,
        \`version\`,
        \`release\`,
        benchmarkDate,
        benchmarkDateSql,
        status,
        statusDate,
        description,
        active,
        groupCount,
        lowCount,
        mediumCount,
        highCount,
        checkCount,
        fixCount
      FROM
        v_current_rev
      WHERE
        v_current_rev.benchmarkId = :benchmarkId`,
    "DELETE FROM current_group_rule WHERE benchmarkId = :benchmarkId",
    `INSERT INTO current_group_rule (groupId, ruleId, benchmarkId)
    SELECT rg.groupId,
      rgr.ruleId,
      cr.benchmarkId
    from
      current_rev cr
      left join rev_group_map rg on rg.revId=cr.revId
      left join rev_group_rule_map rgr on rgr.rgId=rg.rgId
    where
      cr.benchmarkId = :benchmarkId
    order by
      rg.groupId,rgr.ruleId,cr.benchmarkId`,     
    "DELETE FROM stig WHERE benchmarkId NOT IN (select benchmarkId FROM current_rev)"
  ]

  let connection;
  try {
    let [input, version, release] = /V(\d+)R(\d+(\.\d+)?)/.exec(revisionStr)
    let binds = {
      benchmarkId: benchmarkId,
      version: version,
      release: release
    }

    connection = await dbUtils.pool.getConnection()
    connection.config.namedPlaceholders = true
    async function transaction () {
      await connection.query('START TRANSACTION')

      // note if this is the current revision
      const [crRows] = await connection.query('SELECT * FROM current_rev WHERE benchmarkId = :benchmarkId and `version` = :version and `release` = :release', binds)
      const isCurrentRev = !!crRows.length
      
      // re-materialize current_rev and current_group_rule if we're deleteing the current revision
      if (isCurrentRev) {
        dmls = dmls.concat(currentRevDmls)
      }
  
      for (const sql of dmls) {
       await connection.query(sql, binds)
      }
  
      // re-calculate review statistics if we've affected current_rev
      // NOTE: for performance we could skip this if the only revision has 
      // been deleted (STIG itself is now deleted)
      if (isCurrentRev) {
        await dbUtils.updateStatsAssetStig( connection, {benchmarkId})
      }
  
      await connection.commit()
    }
    await dbUtils.retryOnDeadlock(transaction, svcStatus)
  }
  catch(err) {
    if (typeof connection !== 'undefined') {
      await connection.rollback()
    }
    throw ( {status: 500, message: err.message, stack: err.stack} )
  }
  finally {
    if (typeof connection !== 'undefined') {
      await connection.release()
    }
  }
}


/**
 * Deletes a STIG (*** and all revisions ***)
 *
 * benchmarkId String A path parameter that indentifies a STIG
 * returns STIG
 **/
exports.deleteStigById = async function(benchmarkId, userObject, svcStatus = {}) {

  let dmls = [
    "DELETE FROM revision WHERE benchmarkId = :benchmarkId",
    "DELETE from current_rev where benchmarkId = :benchmarkId",
    "DELETE FROM current_group_rule WHERE benchmarkId = :benchmarkId",
    "DELETE from stig where benchmarkId = :benchmarkId",
    "DELETE FROM `rule` WHERE ruleId NOT IN (select ruleId from rev_group_rule_map )",
    "DELETE FROM check_content WHERE ccId NOT IN (select ccId from rev_group_rule_check_map)",
    "DELETE FROM fix WHERE fixId NOT IN (select fixId from rev_group_rule_fix_map)",
    "DELETE FROM `group` WHERE groupId NOT IN (select groupId from rev_group_map)"
  ]

  let connection;

  try {
    let rows = await _this.queryStigs( {benchmarkId: benchmarkId}, userObject)

    let binds = {
      benchmarkId: benchmarkId
    }

    connection = await dbUtils.pool.getConnection()
    connection.config.namedPlaceholders = true
    async function transaction () {
      await connection.query('START TRANSACTION')

      for (const sql of dmls) {
        await connection.query(sql, binds)
      }
   
      await dbUtils.updateStatsAssetStig( connection, {benchmarkId})
   
      await connection.commit()  
    }
    await dbUtils.retryOnDeadlock(transaction, svcStatus)
    return (rows[0])
  }
  catch (err) {
    if (typeof connection !== 'undefined') {
      await connection.rollback()
    }
    throw ( {status: 500, message: err.message, stack: err.stack} )
  }
  finally {
    if (typeof connection !== 'undefined') {
      await connection.release()
    }
  }
}


/**
 * Return data for the specified CCI
 *
 * cci String A path parameter that indentifies a CCI
 * returns List
 **/
exports.getCci = async function(cci, inProjection, userObject) {
  let columns = [
    'c.cci', 
    'c.status', 
    'c.publishdate', 
    'c.contributor', 
    'c.type', 
    'c.definition'
  ]

  let joins = [
    'cci c '
  ]
  
  let predicates = {
    statements: [],
    binds: []
  }
  
  // PREDICATES
  predicates.statements.push('c.cci = ?')
  predicates.binds.push(cci)

  if ( inProjection && inProjection.includes('emassAp') ) {
    columns.push(`case when c.apAcronym is null then null else json_object("apAcronym", c.apAcronym, "implementation", c.implementation, "assessmentProcedure", c.assessmentProcedure) END  as "emassAp"`)
  }

  if ( inProjection && inProjection.includes('references') ) {
    columns.push(`(select 
      coalesce
      (
        (
          select json_arrayagg (json_object(
            'creator', crm.creator,
            'title', crm.title,
            'version', crm.version,
            'location', crm.location,
            'indexDisa', crm.indexDisa,
            'textRefNist', crm.textRefNist,
            'parentControl', crm.parentControl
          ))
          from cci_reference_map crm
          where crm.cci = c.cci
        ), 
        json_array()
      )
    ) as "references"`)
  }

  if ( inProjection && inProjection.includes('stigs') ) {
    columns.push(`(select 
      coalesce
      (
        (
          select json_arrayagg(stig)
          from
          (
            select distinct json_object(
              'benchmarkId', rv.benchmarkId,
              'revisionStr', concat('V', rv.version, 'R', rv.release)
          ) as stig
          from cci ci
            left join rule_cci_map as rcm on rcm.cci = ci.cci
            left join rev_group_rule_map as rgrm on rgrm.ruleId = rcm.ruleId
            left join rev_group_map as rgm on rgm.rgId = rgrm.rgId
            left join revision as rv on rv.revId = rgm.revId
          where ci.cci = c.cci and benchmarkId is not null
          ) as agg), 
        json_array()
      )
    ) as "stigs"`)
  }

  // CONSTRUCT MAIN QUERY
  let sql = 'SELECT '
  sql += columns.join(",\n")
  sql += ' FROM '
  sql += joins.join(" \n")

  if (predicates.statements.length > 0) {
    sql += "\nWHERE " + predicates.statements.join(" and ")
  }

  sql += ` order by c.cci`

  try {
    let [rows, fields] = await dbUtils.pool.query(sql, predicates.binds)

    return (rows[0])
  }
  catch(err) {
    throw ( {status: 500, message: err.message, stack: err.stack} ) 
  }
  // finally{}
}


/**
 * Return a list of CCIs from a STIG revision
 *
 * benchmarkId String A path parameter that indentifies a STIG
 * revisionStr String A path parameter that indentifies a STIG revision [ V{version_num}R{release_num} | 'latest' ]
 * returns List
 **/
exports.getCcisByRevision = async function(benchmarkId, revisionStr, userObject) {
  let columns = [
    'c.cci',
    'c.type',
    `COALESCE((
      SELECT JSON_ARRAYAGG(JSON_OBJECT(
        "creator", crm.creator,
        "title", crm.title,
        "version", crm.version,
        "location", crm.location,
        "indexDisa", crm.indexDisa,
        "textRefNist", crm.textRefNist,
        "parentControl", crm.parentControl
      ))
      FROM cci_reference_map crm
      WHERE crm.cci = c.cci
    ), JSON_ARRAY()) AS "references"`
  ]

  let joins
  let predicates = {
    statements: [],
    binds: []
  }
  
  predicates.statements.push('r.benchmarkId = ?')
  predicates.binds.push(benchmarkId)
  
  if (revisionStr != 'latest') {
    joins = ['revision r']

    let [results, version, release] = /V(\d+)R(\d+(\.\d+)?)/.exec(revisionStr)
    predicates.statements.push('r.version = ?')
    predicates.binds.push(version)
    predicates.statements.push('r.release = ?')
    predicates.binds.push(release)
  } 
  else {
    joins = ['current_rev r']
  }
  
  joins.push('LEFT JOIN rev_group_map rgm on r.revId = rgm.revId')
  joins.push('LEFT JOIN rev_group_rule_map AS rgrm ON rgrm.rgId = rgm.rgId')
  joins.push('LEFT JOIN rule_cci_map AS rcm ON rgrm.ruleId = rcm.ruleId')
  joins.push('LEFT JOIN cci AS c ON rcm.cci = c.cci')
  joins.push('LEFT JOIN cci_reference_map AS crm ON crm.cci = c.cci')


  // CONSTRUCT MAIN QUERY
  let sql = 'SELECT DISTINCT '
  sql+= columns.join(",\n")
  sql += ' FROM '
  sql+= joins.join(" \n")
  if (predicates.statements.length > 0) {
    sql += "\nWHERE " + predicates.statements.join(" and ")
  }
  sql += ` ORDER BY c.cci`

  try {
    let [rows, fields] = await dbUtils.pool.query(sql, predicates.binds)
    return rows
  }
  catch(err) {
    throw ( {status: 500, message: err.message, stack: err.stack} )
  }
}


/**
 * Return the rules, checks and fixes for a Group from a specified revision of a STIG.
 * None
 *
 * benchmarkId String A path parameter that indentifies a STIG
 * revisionStr String A path parameter that indentifies a STIG revision [ V{version_num}R{release_num} | 'latest' ]
 * groupId String A path parameter that indentifies a Group
 * returns GroupObj
 **/
exports.getGroupByRevision = async function(benchmarkId, revisionStr, groupId, projection, userObject) {
  try {
    let rows = await _this.queryGroups( projection, {
      benchmarkId: benchmarkId,
      revisionStr: revisionStr,
      groupId: groupId
    })
    return (rows[0])
  }
  catch(err) {
    throw ( {status: 500, message: err.message, stack: err.stack} )
  }
}


/**
 * Return the list of groups for the specified revision of a STIG.
 *
 * benchmarkId String A path parameter that indentifies a STIG
 * revisionStr String A path parameter that indentifies a STIG revision [ V{version_num}R{release_num} | 'latest' ]
 * returns List
 **/
exports.getGroupsByRevision = async function(benchmarkId, revisionStr, projection, userObject) {
  try {
    let rows = await _this.queryGroups( projection, {
      benchmarkId: benchmarkId,
      revisionStr: revisionStr
    })
    return (rows)
  }
  catch(err) {
    throw ( {status: 500, message: err.message, stack: err.stack} )
  }
}


/**
 * Return metadata for the specified revision of a STIG
 *
 * benchmarkId String A path parameter that indentifies a STIG
 * revisionStr String A path parameter that indentifies a STIG revision [ V{version_num}R{release_num} | 'latest' ]
 * returns Revision
 **/
exports.getRevisionByString = async function(benchmarkId, revisionStr, userObject) {
  try {
    let ro = dbUtils.parseRevisionStr(revisionStr)
    let sql = 
    `SELECT
      ${ro.table_alias}.benchmarkId,
      concat('V', ${ro.table_alias}.version, 'R', ${ro.table_alias}.release) as "revisionStr",
      cast(${ro.table_alias}.version as char) as version,
      ${ro.table_alias}.release,
      date_format(${ro.table_alias}.benchmarkDateSql,'%Y-%m-%d') as "benchmarkDate",
      ${ro.table_alias}.status,
      ${ro.table_alias}.statusDate,
      ${ro.table_alias}.ruleCount
    FROM
      ${ro.table}  ${ro.table_alias}
    WHERE
      ${ro.table_alias}.benchmarkId = ?
      ${ro.predicates}
    ORDER BY
      ${ro.table_alias}.benchmarkDateSql desc
    `
    let binds = [benchmarkId]
    if (ro.version) {
      binds.push(ro.version, ro.release)
    }
    let [rows, fields] = await dbUtils.pool.query(sql, binds)
    return (rows[0])
  }
  catch(err) {
    throw ( {status: 500, message: err.message, stack: err.stack} )
  }
}


/**
 * Return a list of revisions for the specified STIG
 *
 * benchmarkId String A path parameter that indentifies a STIG
 * returns List
 **/
exports.getRevisionsByBenchmarkId = async function(benchmarkId, userObject) {
  try {
    let sql = 
    `SELECT
      r.benchmarkId,
      concat('V', r.version, 'R', r.release) as "revisionStr",
      CAST(r.version as char) as version,
      r.release,
      date_format(r.benchmarkDateSql,'%Y-%m-%d') as "benchmarkDate",
      r.status,
      r.statusDate,
      r.ruleCount
    FROM
      revision r
    WHERE
      r.benchmarkId = ?
    ORDER BY
      r.benchmarkDateSql desc
    `
    let [rows, fields] = await dbUtils.pool.query(sql, [benchmarkId])
    return (rows)
  }
  catch(err) {
    throw ( {status: 500, message: err.message, stack: err.stack} )
  }
}


/**
 * Return the defintion and associated checks and fixes for the specified Rule
 *
 * ruleId String A path parameter that indentifies a Rule
 * returns Rule
 **/
exports.getRuleByRuleId = async function(ruleId, projection, userObject) {
  try {
    let rows = await _this.queryRules( ruleId, projection )
    return (rows)
  }
  catch(err) {
    throw ( {status: 500, message: err.message, stack: err.stack} )
  }
}


/**
 * Return rule data for the specified Rule in a revision of a STIG.
 *
 * benchmarkId String A path parameter that indentifies a STIG
 * revisionStr String A path parameter that indentifies a STIG revision [ V{version_num}R{release_num} | 'latest' ]
 * returns List
 **/
exports.getRuleByRevision = async function(benchmarkId, revisionStr, ruleId, projection, userObject) {
  try {
    let rows = await _this.queryBenchmarkRules( benchmarkId, revisionStr, projection, {
      ruleId: ruleId
    })
    return (rows[0])
  }
  catch(err) {
    throw ( {status: 500, message: err.message, stack: err.stack} )
  }
}


/**
 * Return rule data for the specified revision of a STIG.
 *
 * benchmarkId String A path parameter that indentifies a STIG
 * revisionStr String A path parameter that indentifies a STIG revision [ V{version_num}R{release_num} | 'latest' ]
 * returns List
 **/
exports.getRulesByRevision = async function(benchmarkId, revisionStr, projection, userObject) {
  try {
    let rows = await _this.queryBenchmarkRules( benchmarkId, revisionStr, projection, {} )
    return (rows)
  }
  catch(err) {
    throw ( {status: 500, message: err.message, stack: err.stack} )
  }
}


/**
 * Return a list of available STIGs
 *
 * title String A string found anywhere in a STIG title (optional)
 * returns List
 **/
exports.getSTIGs = async function(title, userObject) {
  try {
    let rows = await _this.queryStigs( {
      title: title
    }, userObject )
    return (rows)
  }
  catch(err) {
    throw ( {status: 500, message: err.message, stack: err.stack} )
  }
}


/**
 * Return properties of the specified STIG
 *
 * benchmarkId String A path parameter that indentifies a STIG
 * returns STIG
 **/
exports.getStigById = async function(benchmarkId, userObject) {
  try {
    let rows = await _this.queryStigs( {
      benchmarkId: benchmarkId
    }, userObject )
    return (rows[0])
  }
  catch(err) {
    throw ( {status: 500, message: err.message, stack: err.stack} )
  }
}

