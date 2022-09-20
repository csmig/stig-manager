const dbUtils = require('./utils')

// metrics endpoint helpers
function totalResultEngine (field) {
  return `'${field}', json_object('total',sa.${field},'resultEngine',sa.${field}ResultEngine)`
}
function totalResultEngineAgg (field) {
  return `'${field}', json_object('total',coalesce(sum(sa.${field}),0),'resultEngine',coalesce(sum(sa.${field}ResultEngine),0))`
}

function serializeProperties (props, aggregate = false) {
  let result = '', i = 0
  for (const [key, value] of Object.entries(props)) {
    result += `${i > 0 ? ',\n  ' : ''}'${key}', ${aggregate ? `coalesce(sum(${value}),0)` : value}`
    i++
  }
  return result
}

const top = {
  assessments: 'cr.ruleCount',
  assessed: 'sa.pass + sa.fail + sa.notapplicable'
}

function summaryObject (aggregate = false) {
  const statuses = {
    saved: 'sa.saved',
    submitted: 'sa.submitted',
    accepted: 'sa.accepted',
    rejected: 'sa.rejected'  
  }
  const results = {
    pass: 'sa.pass',
    fail: 'sa.fail',
    notapplicable: 'sa.notapplicable',
    other : 'sa.notchecked + sa.unknown + sa.error + sa.notselected + sa.informational + sa.fixed'  
  }
  const findings = {
    low: 'sa.lowCount',
    medium: 'sa.mediumCount',
    high: 'sa.highCount'
  }

  return `json_object(
  ${serializeProperties(top, aggregate)},
  'minTs', DATE_FORMAT(${aggregate ? 'MIN(sa.minTs)':'sa.minTs'}, '%Y-%m-%dT%H:%i:%sZ'),
  'maxTs', DATE_FORMAT(${aggregate ? 'MAX(sa.maxTs)':'sa.maxTs'}, '%Y-%m-%dT%H:%i:%sZ'),
  'results', json_object(
    ${serializeProperties(results, aggregate)}
  ),
  'statuses', json_object(
    ${serializeProperties(statuses, aggregate)}
  ),
  'findings', json_object(
    ${serializeProperties(findings, aggregate)}
  )
)`
}
function detailsObject (fields, aggregate = false) {
  const detailsFn = aggregate ? totalResultEngineAgg : totalResultEngine
  const detailVals = fields.map( field => detailsFn(field) )
  return `json_object(
    ${detailVals.join(',\n')}
  )`
}

const sqlDetailStatuses = detailsObject([
  'saved',
  'submitted',
  'rejected',
  'accepted'
])
const sqlDetailStatusesAgg = detailsObject([
  'saved',
  'submitted',
  'rejected',
  'accepted'
], true)
const sqlDetailResults = detailsObject([
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
const sqlDetailResultsAgg = detailsObject([
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
const sqlFindings = `json_object(
  'low', sa.lowCount,
  'medium', sa.mediumCount,
  'high', sa.highCount
)`
const sqlFindingsAgg = `json_object(
  'low', coalesce(sum(sa.lowCount),0),
  'medium', coalesce(sum(sa.mediumCount),0),
  'high', coalesce(sum(sa.highCount),0)
)`

const sqlMetricsDetail = `json_object(
  ${serializeProperties(top, false)},
  'minTs', DATE_FORMAT(sa.minTs, '%Y-%m-%dT%H:%i:%sZ'),
  'maxTs', DATE_FORMAT(sa.maxTs, '%Y-%m-%dT%H:%i:%sZ'),
  'findings', ${sqlFindings},
  'statuses', ${sqlDetailStatuses},
  'results', ${sqlDetailResults}
) as metrics`

const sqlMetricsDetailAgg = `json_object(
  ${serializeProperties(top, true)},
  'minTs', DATE_FORMAT(MIN(sa.minTs), '%Y-%m-%dT%H:%i:%sZ'),
  'maxTs', DATE_FORMAT(MAX(sa.maxTs), '%Y-%m-%dT%H:%i:%sZ'),
  'findings', ${sqlFindingsAgg},
  'statuses', ${sqlDetailStatusesAgg},
  'results', ${sqlDetailResultsAgg}
) as metrics`

const sqlMetricsSummary = `${summaryObject(false)} as metrics`
const sqlMetricsSummaryAgg = `${summaryObject(true)} as metrics`

const sqlLabels = `coalesce(
  (select
    json_arrayagg(json_object(
      'labelId', BIN_TO_UUID(cl2.uuid,1),
      'name', cl2.name
      ))
  from
    collection_label_asset_map cla2
    left join collection_label cl2 on cla2.clId = cl2.clId
  where
    cla2.assetId = a.assetId),
  json_array()) as labels`


const baseCols = {
  unagg: [
    'cast(a.assetId as char) as assetId',
    'a.name',
    sqlLabels,
    'cr.benchmarkId'
  ],
  asset: [
    'cast(a.assetId as char) as assetId',
    'a.name',
    sqlLabels,
    'case when count(sa.benchmarkId) > 0 THEN json_arrayagg(sa.benchmarkId) ELSE json_array() END as benchmarkIds'
  ],
  collection: [
    'cast(c.collectionId as char) as collectionId',
    'c.name',
    'count(distinct a.assetId) as assets',
    'count(sa.saId) as checklists'
  ],
  stig: [
    'cr.benchmarkId',
    'count(distinct a.assetId) as assets'
  ],
  label: [
    'BIN_TO_UUID(cl.uuid,1) as labelId',
    'cl.name',
    'count(distinct a.assetId) as assets'
  ]
}

module.exports.queryMetrics = async function ({inPredicates = {},inProjections = [],userId,aggregation = 'unagg',style = 'detail'}) {

    // CTE processing
  const cteProps = {
    columns: [
      'distinct sa.benchmarkId',
      'a.assetId',
      'sa.saId'
    ],
    joins: [
      'collection c',
      'left join collection_grant cg on c.collectionId = cg.collectionId',
      'left join asset a on c.collectionId = a.collectionId',
      'left join stig_asset_map sa on a.assetId = sa.assetId',
      'left join user_stig_asset_map usa on sa.saId = usa.saId'
    ],
    predicates: {
      statements: [
        'c.collectionId = ?',
        '(cg.userId = ? AND CASE WHEN cg.accessLevel = 1 THEN usa.userId = cg.userId ELSE TRUE END)'
      ],
      binds: [
        inPredicates.collectionId,
        userId
      ]
    }
  }
  if (inPredicates.labelNames) {
    cteProps.joins.push(
      'left join collection_label_asset_map cla on a.assetId = cla.assetId',
      'left join collection_label cl on cla.clId = cl.clId'
    )
    cteProps.predicates.statements.push(
      'cl.name IN ?'
    )
    cteProps.predicates.binds.push([inPredicates.labelNames])
  }
  if (inPredicates.labelIds) {
    cteProps.joins.push(
      'left join collection_label_asset_map cla on a.assetId = cla.assetId',
      'left join collection_label cl on cla.clId = cl.clId'
    )
    cteProps.predicates.statements.push(
      'cl.uuid IN ?'
    )
    const uuidBinds = inPredicates.labelIds.map( uuid => dbUtils.uuidToSqlString(uuid))
    cteProps.predicates.binds.push([uuidBinds])
  }
  if (inPredicates.assetIds) {
    cteProps.predicates.statements.push(
      'a.assetId IN ?'
    )
    cteProps.predicates.binds.push([inPredicates.assetIds])
  }
  if (inPredicates.benchmarkIds) {
    cteProps.predicates.statements.push(
      'sa.benchmarkId IN ?'
    )
    cteProps.predicates.binds.push([inPredicates.benchmarkIds])
  }

  const cteQuery = dbUtils.makeQueryString({
    columns: cteProps.columns,
    joins: cteProps.joins,
    predicates: cteProps.predicates
  })
  const ctes = [
    `granted as (${cteQuery})`
  ]

  // Main query
  const columns = [...baseCols[aggregation]]
  const joins = [
    'granted',
    'left join asset a on granted.assetId = a.assetId',
    'left join stig_asset_map sa on granted.saId = sa.saId',
    'left join current_rev cr on sa.benchmarkId = cr.benchmarkId'
  ]
  const predicates = {
    statements: [],
    binds: []
  }
  const groupBy = []
  const orderBy = []

  switch (aggregation) {
    case 'asset':
      groupBy.push('a.assetId')
      orderBy.push('a.name')
      break
    case 'stig':
      predicates.statements.push('sa.benchmarkId IS NOT NULL')
      groupBy.push('sa.benchmarkId')
      orderBy.push('sa.benchmarkId')
      break
    case 'collection':
      joins.push('left join collection c on a.collectionId = c.collectionId')
      groupBy.push('c.collectionId')
      orderBy.push('c.name')
      break
    case 'label':
      joins.push(
        'left join collection_label_asset_map cla on a.assetId = cla.assetId',
        'left join collection_label cl on cla.clId = cl.clId'
      )
      groupBy.push('cl.uuid', 'cl.name')
      orderBy.push('cl.name')
      break
 }

  if (style === 'detail') {
    columns.push( aggregation === 'unagg' ? sqlMetricsDetail : sqlMetricsDetailAgg)
  }
  else {
    columns.push( aggregation === 'unagg' ? sqlMetricsSummary : sqlMetricsSummaryAgg)
  }
  const query = dbUtils.makeQueryString({
    ctes,
    columns,
    joins,
    predicates,
    groupBy,
    orderBy
  })
  let [rows] = await dbUtils.pool.query(query, cteProps.predicates.binds)
  return (rows || [])
}