const dbUtils = require('./utils')

// metrics endpoint helpers
function totalResultEngine (field) {
  return `'${field}', json_object('total',sa.${field},'resultEngine',sa.${field}ResultEngine)`
}
function totalResultEngineAgg (field) {
  return `'${field}', json_object('total',coalesce(sum(sa.${field}),0),'resultEngine',coalesce(sum(sa.${field}ResultEngine),0))`
}
function summaryObject (aggregate = 'none') {
  const statuses = {
    saved: 'sa.saved',
    submitted: 'sa.submitted',
    accepted: 'sa.accepted',
    rejected: 'sa.rejected'  
  }
  const findings = {
    low: 'sa.lowCount',
    medium: 'sa.mediumCount',
    high: 'sa.highCount'
  }
  const top = {
    assessments: 'cr.ruleCount',
    assessed: 'sa.pass + sa.fail + sa.notapplicable',
    minTs: 'sa.minTs',
    maxTs: 'sa.maxTs'
  }
  function serializeProperties (props) {
    let result = '', i = 0
    for (const [key, value] of Object.entries(props)) {
      result += `${i > 0 ? ',\n  ' : ''}'${key}', ${aggregate === 'none' ? value : `coalesce(sum(${value}),0)`}`
      i++
    }
    return result
  }

  return `json_object(
  ${serializeProperties(top)},
  'statuses', json_object(
    ${serializeProperties(statuses)}
  ),
  'findings', json_object(
    ${serializeProperties(findings)}
  )
)`
}
function detailsObject (fields, withAgg = false) {
  const detailsFn = withAgg ? totalResultEngineAgg : totalResultEngine
  const detailVals = fields.map( field => detailsFn(field) )
  return `json_object(
    ${detailVals.join(',\n')}
  )`
}

const sqlJsonObjectStatus = detailsObject([
  'saved',
  'submitted',
  'rejected',
  'accepted'
])
const sqlJsonObjectStatusAgg = detailsObject([
  'saved',
  'submitted',
  'rejected',
  'accepted'
], true)
const sqlJsonObjectResult = detailsObject([
  'notchecked',
  'notapplicable',
  'pass',
  'fail',
  'unknown',
  'error',
  'notselected',
  'informational',
  'fixed'
])
const sqlJsonObjectResultAgg = detailsObject([
  'notchecked',
  'notapplicable',
  'pass',
  'fail',
  'unknown',
  'error',
  'notselected',
  'informational',
  'fixed'
], true)
const sqlJsonObjectFindings = `json_object(
  'low', sa.lowCount,
  'medium', sa.mediumCount,
  'high', sa.highCount
)`
const sqlJsonObjectFindingsAgg = `json_object(
  'low', coalesce(sum(sa.lowCount),0),
  'medium', coalesce(sum(sa.mediumCount),0),
  'high', coalesce(sum(sa.highCount),0)
)`

module.exports.queryMetrics = async function () {
  let ctes = [
    `granted as (select
      distinct sa.benchmarkId, a.assetId
    from
      collection c
      left join collection_grant cg on c.collectionId = cg.collectionId
      left join asset a on c.collectionId = a.collectionId
      left join stig_asset_map sa on a.assetId = sa.assetId
      left join user_stig_asset_map usa on sa.saId = usa.saId
    where
      c.collectionId = ?
        and (cg.userId = ? AND CASE WHEN cg.accessLevel = 1 THEN usa.userId = cg.userId ELSE TRUE END)
    )`
  ]
  let columns, groupBy, orderBy
  const assetProperties = [
    `cast(a.assetId as char) as assetId`,
    'a.name as assetName',
    'a.ip',
    `coalesce(
      (select
        json_arrayagg(BIN_TO_UUID(cl.uuid,1))
      from
        collection_label_asset_map cla
        left join collection_label cl on cla.clId = cl.clId
      where
        cla.assetId = a.assetId),
      json_array()
    ) as assetLabelIds`,
  ]
  const statsProperties = summary ? [


  ] : [
    `${sqlJsonObjectFindings} as findings`,
    `${sqlJsonObjectStatus} as status`,
    `${sqlJsonObjectResult} as result`              
  ]

  switch (aggregate) {
    case 'none':
      columns = [
        ...assetProperties,
        'sa.benchmarkId',
        `json_object(
          'total', cr.ruleCount
        ) as assessments`,
        'sa.minTs',
        'sa.maxTs',
        `${sqlJsonObjectFindings} as findings`,
        `${sqlJsonObjectStatus} as status`,
        `${sqlJsonObjectResult} as result`              
      ]
      groupBy = []
      orderBy = []
      break
    case 'asset':
      columns = [
        ...assetProperties,
        'JSON_ARRAYAGG(sa.benchmarkId) as stigs',
        `coalesce(sum(cr.ruleCount),0) as assessmentsRequired`,
        'min(sa.minTs) as minTs',
        'max(sa.maxTs) as maxTs',
        `${sqlJsonObjectFindingsAgg} as findings`,
        `${sqlJsonObjectStatusAgg} as status`,
        `${sqlJsonObjectResultAgg} as result`              
      ]
      groupBy = ['granted.assetId']
      orderBy = ['a.name']

      break
    case 'stig':
      columns = [
        'sa.benchmarkId'
      ]
  }
  let joins = [
    'granted',
    'left join asset a on granted.assetId = a.assetId',
    'left join stig_asset_map sa on (granted.assetId = sa.assetId and granted.benchmarkId = sa.benchmarkId)',
    'left join current_rev cr on sa.benchmarkId = cr.benchmarkId'
  ]

  // PREDICATES
  let predicates = {
    statements: [],
    // collectionId predicate is mandatory per API spec
    binds: [inPredicates.collectionId, userObject.userId]
  }
  if ( inPredicates.benchmarkIds ) {
    predicates.statements.push('sa.benchmarkId IN ?')
    predicates.binds.push( [inPredicates.benchmarkIds] )
  }
  if ( inPredicates.assetIds ) {
    predicates.statements.push('sa.assetId IN ?')
    predicates.binds.push( [inPredicates.assetIds] )
  }
  
  // CONSTRUCT MAIN QUERY
  let sql = dbUtils.makeQueryString({ctes,columns,joins,predicates,groupBy,orderBy})
  
  let [rows] = await dbUtils.pool.query(sql, predicates.binds)
  return (rows)
}