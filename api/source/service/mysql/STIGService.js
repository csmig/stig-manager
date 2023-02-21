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
    'rg.groupId as "groupId"',
    'rg.title as "title"',
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

  if (inPredicates.groupId) {
    predicates.statements.push('rg.groupId = ?')
    predicates.binds.push(inPredicates.groupId)
  }

  // PROJECTIONS
  if (inProjection && inProjection.includes('rules')) {
    joins.push('inner join rev_group_rule_map rgr on rg.rgId = rgr.rgId' )
    columns.push(`json_arrayagg(json_object(
      'ruleId', rgr.ruleId, 
      'version', rgr.version, 
      'title', rgr.title, 
      'severity', rgr.severity)) as "rules"`)
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
    sql += "\nGROUP BY rg.groupId, rg.title\n"
  }  
  sql += ` order by substring(rg.groupId from 3) + 0`

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
    'rgr.ruleId',
    'rgr.title',
    'rg.groupId',
    'rg.title as "groupTitle"',
    'rgr.version',
    'rgr.severity'
  ]

  let groupBy = [
    'rgr.ruleId',
    'rgr.title',
    'rg.groupId',
    'rg.title',
    'rgr.version',
    'rgr.severity',
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
  
  if (inPredicates?.ruleId) {
    predicates.statements.push('rgr.ruleId = ?')
    predicates.binds.push(inPredicates.ruleId)
  }

  joins.push('left join rev_group_map rg using (revId)')
  joins.push('left join rev_group_rule_map rgr using (rgId)' )

  // PROJECTIONS
  if ( inProjection && inProjection.includes('detail') ) {
    columns.push(`json_object(
      'weight', rgr.weight,
      'vulnDiscussion', rgr.vulnDiscussion,
      'falsePositives', rgr.falsePositives,
      'falseNegatives', rgr.falseNegatives,
      'documentable', rgr.documentable,
      'mitigations', rgr.mitigations,
      'severityOverrideGuidance', rgr.severityOverrideGuidance,
      'potentialImpacts', rgr.potentialImpacts,
      'thirdPartyTools', rgr.thirdPartyTools,
      'mitigationControl', rgr.mitigationControl,
      'responsibility', rgr.responsibility
    ) as detail`)
    groupBy.push(
      'rgr.version',
      'rgr.weight',
      'rgr.vulnDiscussion',
      'rgr.falsePositives',
      'rgr.falseNegatives',
      'rgr.documentable',
      'rgr.mitigations',
      'rgr.severityOverrideGuidance',
      'rgr.potentialImpacts',
      'rgr.thirdPartyTools',
      'rgr.mitigationControl',
      'rgr.responsibility',
      'rgr.iacontrols'
    )
  }

  if ( inProjection && inProjection.includes('ccis') ) {
    columns.push(`(select 
      coalesce
      (
        (select json_arrayagg(
          json_object(
            'cci', rgrcc.cci,
            'apAcronym', cci.apAcronym,
            'definition',  cci.definition
          )
        ) 
        from
          rev_group_rule_cci_map rgrcc 
          left join cci cci using (cci)
          left join cci_reference_map cr using (cci)
        where 
          rgrcc.rgrId = rgr.rgrId
        ), 
        json_array()
      )
    ) as "ccis"`)
  }
  if ( inProjection && inProjection.includes('checks') ) {
    columns.push(`(select json_arrayagg(json_object(
      'checkId', rck.system,
      'system', rck.system,
      'content', cc.content))
      from rev_group_rule_check_map rck 
      left join check_content cc using (ccId)
      where rck.rgrId = rgr.rgrId) as "checks"`)
  }
  if ( inProjection && inProjection.includes('fixes') ) {
    columns.push(`(select json_arrayagg(json_object(
      'fixId', rf.fixref,
      'fixref', rf.fixref,
      'text', ft.text))
      from rev_group_rule_fix_map rf left join fix_text ft using (ftId)
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
  sql += ` order by substring(rgr.ruleId from 4) + 0`

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
    'rgr.ruleId',
    'rgr.version',
    'rgr.title',
    'rgr.severity',
    'rg.groupId',
    'rg.Title as "groupTitle"'
  ]
  
  let groupBy = [
    'rgr.rgrId',
    'rg.rgId'
  ]

  let joins = [
    'rev_group_rule_map rgr',
    'left join rev_group_map rg on rgr.rgId = rg.rgId'
  ]


  let predicates = {
    statements: [],
    binds: []
  }
  
  // PREDICATES
  predicates.statements.push('rgr.ruleId = ?')
  predicates.binds.push(ruleId)
  

  // PROJECTIONS
  if ( inProjection && inProjection.includes('detail') ) {
    columns.push(`json_object(
      'weight', rgr.weight,
      'vulnDiscussion', rgr.vulnDiscussion,
      'falsePositives', rgr.falsePositives,
      'falseNegatives', rgr.falseNegatives,
      'documentable', rgr.documentable,
      'mitigations', rgr.mitigations,
      'severityOverrideGuidance', rgr.severityOverrideGuidance,
      'potentialImpacts', rgr.potentialImpacts,
      'thirdPartyTools', rgr.thirdPartyTools,
      'mitigationControl', rgr.mitigationControl,
      'responsibility', rgr.responsibility
    ) as detail`)
    // let detailColumns = [
    //   'rgr.weight',
    //   'rgr.vulnDiscussion',
    //   'rgr.falsePositives',
    //   'rgr.falseNegatives',
    //   'rgr.documentable',
    //   'rgr.mitigations',
    //   'rgr.severityOverrideGuidance',
    //   'rgr.potentialImpacts',
    //   'rgr.thirdPartyTools',
    //   'rgr.mitigationControl',
    //   'rgr.responsibility'
    // ]
    // groupBy.push(...detailColumns)
  }

  if ( inProjection && inProjection.includes('ccis') ) {
    columns.push(`CASE WHEN count(rgrcc.cci) = 0 
    THEN json_array()
    ELSE CAST(CONCAT('[', GROUP_CONCAT(distinct json_object('cci', rgrcc.cci,'apAcronym',cci.apAcronym,'definition',cci.definition)), ']') as json) 
    END as ccis`)
    joins.push(
      'left join rev_group_rule_cci_map rgrcc using (rgrId)',
      'left join cci using (cci)'
    )
  }

  if ( inProjection && inProjection.includes('checks') ) {
    columns.push(`CASE WHEN count(rgrc.system) = 0 
    THEN json_array()
    ELSE CAST(CONCAT('[', GROUP_CONCAT(distinct json_object('system', rgrc.system,'content', cc.content)), ']') as json) 
    END as checks`)
  joins.push(
    'left join rev_group_rule_check_map rgrc using (rgrId)',
    'left join check_content cc using (ccId)'
  )

  }

  if ( inProjection && inProjection.includes('fixes') ) {
    columns.push(`CASE WHEN count(rgrf.fixref) = 0 
    THEN json_array()
    ELSE CAST(CONCAT('[', GROUP_CONCAT(distinct json_object('fixref', rgrf.fixref,'text', ft.text)), ']') as json) 
    END as fixes`)
  }  
  joins.push(
    'left join rev_group_rule_fix_map rgrf using (rgrId)',
    'left join fix_text ft using (ftId)'
  )


  // CONSTRUCT MAIN QUERY
  let sql = 'SELECT '
  sql += columns.join(",\n")
  sql += ' FROM '
  sql += joins.join(" \n")

  if (predicates.statements.length > 0) {
    sql += "\nWHERE " + predicates.statements.join(" and ")
  }

  sql += "\nGROUP BY " + groupBy.join(", ") + "\n"

  sql += ` ORDER BY substring(rgr.ruleId from 4) + 0`

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

    const {ddl, dml} = queriesFromBenchmarkData(b) // defined below

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

    // create temporary tables outside the transaction
    for (const tempTable of Object.keys(ddl)) {
      await connection.query(ddl[tempTable].drop)
      await connection.query(ddl[tempTable].create)
    }

    async function transaction() {
      let result, hrstart, hrend, action = 'inserted'
      await connection.query('START TRANSACTION')

      // purge any exitsing records for this revision so we can replace
      if (gExistingRevision) {
        hrstart = process.hrtime()
        await connection.query('DELETE FROM revision WHERE revId = ?', [gExistingRevision])
        const cleanupDml = [
          "DELETE FROM check_content WHERE ccId NOT IN (select ccId from rev_group_rule_check_map)",
          "DELETE FROM fix_text WHERE ftId NOT IN (select ftId from rev_group_rule_fix_map)"
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
        'tempGroupRule',
        'tempRuleCheck',
        'tempRuleFix',
        'tempRuleCci',
        'checkContent',
        'fixText',
        'revGroupMap',
        'revGroupRuleMap',
        'revGroupRuleCheckMap',
        'revGroupRuleFixMap',
        'revGroupRuleCciMap'
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

  function queriesFromBenchmarkData(b) {
    const tempFlag = true
    const ddl = {
      tempGroupRule: {
        drop: 'drop table if exists temp_group_rule',
        create: `CREATE${tempFlag ? ' TEMPORARY' : ''} TABLE temp_group_rule (
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
          \`iaControls\` varchar(255))`
      },
      tempRuleCheck: {
        drop: 'drop table if exists temp_rule_check',
        create: `CREATE${tempFlag ? ' TEMPORARY' : ''} TABLE temp_rule_check (
          ruleId varchar(255) NOT NULL,
          \`system\` varchar(255),
          content TEXT,
          digest BINARY(32) GENERATED ALWAYS AS (UNHEX(SHA2(content, 256))) STORED,
          INDEX (digest))`
      },
      tempRuleFix: {
        drop: 'drop table if exists temp_rule_fix',
        create: `CREATE${tempFlag ? ' TEMPORARY' : ''} TABLE temp_rule_fix (
          ruleId varchar(255) NOT NULL,
          fixref VARCHAR(45),
          \`text\` TEXT,
          digest BINARY(32) GENERATED ALWAYS AS (UNHEX(SHA2(text, 256))) STORED,
          INDEX (digest))`
      },
      tempRuleCci: {
        drop: 'drop table if exists temp_rule_cci',
        create: `CREATE${tempFlag ? ' TEMPORARY' : ''} TABLE temp_rule_cci (
          ruleId varchar(255) NOT NULL,
          cci varchar(20),
          INDEX (cci))`
      }
    }
    const dml = {
      stig: {
        sql: "insert into stig (title, benchmarkId) VALUES (:title, :benchmarkId) as new on duplicate key update stig.title = new.title"
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
      checkContent: {
        sql: `insert ignore into check_content (content) select content from temp_rule_check`
      },
      fixText: {
        sql: `insert ignore into fix_text (\`text\`) select text from temp_rule_fix`
      },
      tempGroupRule: {
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
      tempRuleCheck: {
        sql: `insert into temp_rule_check (ruleId, \`system\`, content) VALUES ?`,
        binds: []
      },
      tempRuleFix: {
        sql: `insert into temp_rule_fix (ruleId, fixref, \`text\`) VALUES ?`,
        binds: []
      },
      tempRuleCci: {
        sql: `insert into temp_rule_cci (ruleId, cci) VALUES ?`,
        binds: []
      },
      revGroupMap: {
        delete: {
          sql: 'delete from rev_group_map where revId = ?',
          binds: []
        },
        sql: "insert into rev_group_map (revId, groupId, title, severity) VALUES ?",
        binds: []
      },
      revGroupRuleMap: {
        sql: `INSERT INTO rev_group_rule_map (rgId, ruleId, title, \`version\`, severity, weight, vulnDiscussion, falsePositives, falseNegatives,
        documentable, mitigations, severityOverrideGuidance, potentialImpacts, thirdPartyTools, mitigationControl, responsibility, iaControls)
          SELECT 
            rg.rgId,
            tt.ruleId,
            tt.title,
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
      revGroupRuleCheckMap: {
        sql: `INSERT INTO rev_group_rule_check_map (rgrId, \`system\`, ccId)
          SELECT 
            rgr.rgrId,
            tt.system,
            cc.ccId
          FROM
            rev_group_map rg
            left join rev_group_rule_map rgr using (rgId)
            inner join temp_rule_check tt using (ruleId)
            inner join check_content cc using (digest)
          WHERE 
            rg.revId = :revId
            AND rg.rgId=rgr.rgId`
      },
      revGroupRuleFixMap: {
        sql: `INSERT INTO rev_group_rule_fix_map (rgrId, fixref, ftId)
          SELECT 
            rgr.rgrId,
            tt.fixref,
            ft.ftId
          FROM
            rev_group_map rg
            left join rev_group_rule_map rgr using (rgId)
            inner join temp_rule_fix tt using (ruleId)
            inner join fix_text ft using (digest)
          WHERE 
            rg.revId = :revId
            AND rg.rgId=rgr.rgId`
      },
      revGroupRuleCciMap: {
        sql: `INSERT INTO rev_group_rule_cci_map (rgrId, cci)
          SELECT 
            rgr.rgrId,
            tt.cci
          FROM
            rev_group_map rg
            left join rev_group_rule_map rgr using (rgId)
            inner join temp_rule_cci tt using (ruleId)
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

    for (const group of groups) {
      let { rules, ...groupBinds } = group

      let groupSeverity
      for (const rule of rules) {
        let { checks, fixes, idents, ...ruleBinds } = rule
        // Group severity calculation
        if (!groupSeverity) {
          groupSeverity = ruleBinds.severity
        }
        else if (groupSeverity !== ruleBinds.severity) {
          groupSeverity = 'mixed'
        }
        // QUERY: tempGroupRule
        dml.tempGroupRule.binds.push([
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
        for (const check of checks) {
          // QUERY: tempRuleCheck
          dml.tempRuleCheck.binds.push([
            ruleBinds.ruleId,
            check.system,
            check.content
          ])
        }
        for (const fix of fixes) {
          // QUERY: tempRuleFix
          dml.tempRuleFix.binds.push([
            ruleBinds.ruleId,
            fix.fixref,
            fix.text
          ])
        }
        for (const ident of idents) {
          if (ident.system === 'http://iase.disa.mil/cci' || ident.system === 'http://cyber.mil/cci') {
            dml.tempRuleCci.binds.push([
              rule.ruleId,
              ident.ident.replace('CCI-', '')])
          }
        }
      }

      // QUERY: rev_group_map
      dml.revGroupMap.binds.push([
        revisionBinds.revId,
        groupBinds.groupId,
        groupBinds.title,
        groupSeverity
      ])

      // QUERY: rev_group_rule_map      
      // QUERY: rev_group_rule_check_map
      // QUERY: rev_group_rule_fix_map
      // QUERY: rev_group_rule_cci_map
      dml.revGroupRuleMap.binds = 
      dml.revGroupRuleCheckMap.binds =
      dml.revGroupRuleFixMap.binds =
      dml.revGroupRuleCciMap.binds = { revId: revisionBinds.revId }
    }

    dml.revision.binds.groupCount = dml.revGroupMap.binds.length
    dml.revision.binds.checkCount = dml.tempRuleCheck.binds.length
    dml.revision.binds.fixCount = dml.tempRuleFix.binds.length

    // add rule severity counts to the revision binds. groupRule[3] is the location of the severity value
    dml.tempGroupRule.binds.reduce((binds, groupRule) => {
      const prop = `${groupRule[4]}Count`
      binds[prop] = (binds[prop] ?? 0) + 1
      return binds
    }, dml.revision.binds)

    return {ddl, dml}
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
    "DELETE FROM check_content WHERE ccId NOT IN (select ccId from rev_group_rule_check_map)",
    "DELETE FROM fix_text WHERE ftId NOT IN (select ftId from rev_group_rule_fix_map)"
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
    // "DELETE FROM current_group_rule WHERE benchmarkId = :benchmarkId",
    // `INSERT INTO current_group_rule (groupId, ruleId, benchmarkId)
    // SELECT rg.groupId,
    //   rgr.ruleId,
    //   cr.benchmarkId
    // from
    //   current_rev cr
    //   left join rev_group_map rg on rg.revId=cr.revId
    //   left join rev_group_rule_map rgr on rgr.rgId=rg.rgId
    // where
    //   cr.benchmarkId = :benchmarkId
    // order by
    //   rg.groupId,rgr.ruleId,cr.benchmarkId`,     
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
    "DELETE from stig where benchmarkId = :benchmarkId",
    "DELETE from current_rev where benchmarkId = :benchmarkId",
    "DELETE FROM check_content WHERE ccId NOT IN (select ccId from rev_group_rule_check_map)",
    "DELETE FROM fix_text WHERE ftId NOT IN (select ftId from rev_group_rule_fix_map)"
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
            left join rev_group_rule_cci_map rgrcc using (cci)
            left join rev_group_rule_map rgr using (rgrId)
            left join rev_group_map rg using (rgId)
            left join revision rv using (revId)
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
  
  joins.push('LEFT JOIN rev_group_map rg using (revId)')
  joins.push('LEFT JOIN rev_group_rule_map rgr using (rgId)')
  joins.push('LEFT JOIN rev_group_rule_cci_map rgrcc using (rgrId)')
  joins.push('LEFT JOIN cci c using (cci)')
  // joins.push('LEFT JOIN cci_reference_map crm using (cci)')


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

