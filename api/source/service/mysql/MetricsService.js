const dbUtils = require('./utils')
const stream = require('node:stream')

// metrics endpoint helpers
function serializeDetailObject (field) {
  return `'${field}', json_object('total',sa.${field},'resultEngine',sa.${field}ResultEngine)`
}
function serializeDetailColumns (field) {
  return [
    `sa.${field}`,
    `sa.${field}ResultEngine`
  ]
}
function serializeDetailAggObject (field) {
  return `'${field}', json_object('total',coalesce(sum(sa.${field}),0),'resultEngine',coalesce(sum(sa.${field}ResultEngine),0))`
}
function serializeDetailAggColumns (field) {
  return [
    `coalesce(sum(sa.${field}),0) as "${field}"`,
    `coalesce(sum(sa.${field}ResultEngine),0) as "${field}ResultEngine"`
  ] 
}

function serializeProperties (props, aggregate = false) {
  let result = '', i = 0
  for (const [key, value] of Object.entries(props)) {
    result += `${i > 0 ? ',\n  ' : ''}'${key}', ${aggregate ? `coalesce(sum(${value}),0)` : value}`
    i++
  }
  return result
}

function serializeColumns (props, aggregate = false) {
  const columns = []
  for (const [key, value] of Object.entries(props)) {
    columns.push(`${aggregate ? `coalesce(sum(${value}),0)` : value} as "${key}"`)
  }
  return columns
}

const rootProperties = {
  assessments: 'cr.ruleCount',
  assessed: 'sa.pass + sa.fail + sa.notapplicable'
}
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

function summaryColumns (aggregate = false) {
  return [
    ...serializeColumns(rootProperties, aggregate),
    `DATE_FORMAT(${aggregate ? 'MIN(sa.minTs)':'sa.minTs'}, '%Y-%m-%dT%H:%i:%sZ') as minTs`,
    `DATE_FORMAT(${aggregate ? 'MAX(sa.maxTs)':'sa.maxTs'}, '%Y-%m-%dT%H:%i:%sZ') as maxTs`,
    ...serializeColumns(findings, aggregate),
    ...serializeColumns(results, aggregate),
    ...serializeColumns(statuses, aggregate)
  ]
}

function summaryObject (aggregate = false) {
  return `json_object(
  ${serializeProperties(rootProperties, aggregate)},
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
  const detailsFn = aggregate ? serializeDetailAggObject : serializeDetailObject
  const detailVals = fields.map( field => detailsFn(field) )
  return `json_object(
    ${detailVals.join(',\n')}
  )`
}

function detailsColumns (aggregate = false) {
  const detailsFn = aggregate ? serializeDetailAggColumns : serializeDetailColumns
  return detailsFn(fields)
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
  ${serializeProperties(rootProperties, false)},
  'minTs', DATE_FORMAT(sa.minTs, '%Y-%m-%dT%H:%i:%sZ'),
  'maxTs', DATE_FORMAT(sa.maxTs, '%Y-%m-%dT%H:%i:%sZ'),
  'findings', ${sqlFindings},
  'statuses', ${sqlDetailStatuses},
  'results', ${sqlDetailResults}
) as metrics`
const sqlMetricsDetailAgg = `json_object(
  ${serializeProperties(rootProperties, true)},
  'minTs', DATE_FORMAT(MIN(sa.minTs), '%Y-%m-%dT%H:%i:%sZ'),
  'maxTs', DATE_FORMAT(MAX(sa.maxTs), '%Y-%m-%dT%H:%i:%sZ'),
  'findings', ${sqlFindingsAgg},
  'statuses', ${sqlDetailStatusesAgg},
  'results', ${sqlDetailResultsAgg}
) as metrics`
const sqlMetricsSummary = `${summaryObject(false)} as metrics`
const sqlMetricsSummaryAgg = `${summaryObject(true)} as metrics`

const colsMetricsDetail = [
  `cr.ruleCount as assessments`,
  `sa.pass + sa.fail + sa.notapplicable as assessed`,
  `DATE_FORMAT(sa.minTs, '%Y-%m-%dT%H:%i:%sZ') as minTs`,
  `DATE_FORMAT(sa.maxTs, '%Y-%m-%dT%H:%i:%sZ') as maxTs`,
  `sa.lowCount as low`,
  `sa.mediumCount as medium`,
  `sa.highCount as high`,
  `sa.saved`,
  `sa.savedResultEngine`,
  `sa.submitted`,
  `sa.submittedResultEngine`,
  `sa.accepted`,
  `sa.acceptedResultEngine`,
  `sa.rejected`,
  `sa.rejectedResultEngine`,
  `sa.pass`,
  `sa.passResultEngine`,
  `sa.fail`,
  `sa.failResultEngine`,
  `sa.notapplicable`,
  `sa.notapplicableResultEngine`,
  `sa.notchecked`,
  `sa.notcheckedResultEngine`,
  `sa.unknown`,
  `sa.unknownResultEngine`,
  `sa.error`,
  `sa.errorResultEngine`,
  `sa.notselected`,
  `sa.notselectedResultEngine`,
  `sa.informational`,
  `sa.informationalResultEngine`,
  `sa.fixed`,
  `sa.fixedResultEngine`,
]
const colsMetricsDetailAgg = [
  `coalesce(sum(cr.ruleCount),0) as assessments`,
  `coalesce(sum(sa.pass + sa.fail + sa.notapplicable),0) as assessed`,
  `DATE_FORMAT(min(sa.minTs), '%Y-%m-%dT%H:%i:%sZ') as minTs`,
  `DATE_FORMAT(max(sa.maxTs), '%Y-%m-%dT%H:%i:%sZ') as maxTs`,
  `coalesce(sum(sa.lowCount),0) as low`,
  `coalesce(sum(sa.mediumCount),0) as medium`,
  `coalesce(sum(sa.highCount),0) as high`,
  `coalesce(sum(sa.saved),0) as saved`,
  `coalesce(sum(sa.savedResultEngine),0) as savedResultEngine`,
  `coalesce(sum(sa.submitted),0) as submitted`,
  `coalesce(sum(sa.submittedResultEngine),0) as submittedResultEngine`,
  `coalesce(sum(sa.accepted),0) as accepted`,
  `coalesce(sum(sa.acceptedResultEngine),0) as acceptedResultEngine`,
  `coalesce(sum(sa.rejected),0) as rejected`,
  `coalesce(sum(sa.rejectedResultEngine),0) as rejectedResultEngine`,
  `coalesce(sum(sa.pass),0) as pass`,
  `coalesce(sum(sa.passResultEngine),0) as passResultEngine`,
  `coalesce(sum(sa.fail),0) as fail`,
  `coalesce(sum(sa.failResultEngine),0) as failResultEngine`,
  `coalesce(sum(sa.notapplicable),0) as notapplicable`,
  `coalesce(sum(sa.notapplicableResultEngine),0) as notapplicableResultEngine`,
  `coalesce(sum(sa.notchecked),0) as notchecked`,
  `coalesce(sum(sa.notcheckedResultEngine),0) as notcheckedResultEngine`,
  `coalesce(sum(sa.unknown),0) as unknown`,
  `coalesce(sum(sa.unknownResultEngine),0) as unknownResultEngine`,
  `coalesce(sum(sa.error),0) as error`,
  `coalesce(sum(sa.errorResultEngine),0) as errorResultEngine`,
  `coalesce(sum(sa.notselected),0) as notselected`,
  `coalesce(sum(sa.notselectedResultEngine),0) as notselectedResultEngine`,
  `coalesce(sum(sa.informational),0) as informational`,
  `coalesce(sum(sa.informationalResultEngine),0) as informationalResultEngine`,
  `coalesce(sum(sa.fixed),0) as fixed`,
  `coalesce(sum(sa.fixedResultEngine),0) as fixedResultEngine`
]
const colsMetricsSummary = summaryColumns(false)
const colsMetricsSummaryAgg = summaryColumns(true)

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

const sqlLabelsFlat = `(
  select  
    group_concat(cl2.name)
  from
    collection_label_asset_map cla2
    left join collection_label cl2 on cla2.clId = cl2.clId
  where
    cla2.assetId = a.assetId) as "labels"`


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

const baseColsFlat = {
  unagg: [
    'cast(a.assetId as char) as assetId',
    'a.name',
    sqlLabelsFlat,
    'cr.benchmarkId'
  ],
  asset: [
    'cast(a.assetId as char) as assetId',
    'a.name',
    sqlLabelsFlat,
    'group_concat(sa.benchmarkId) as benchmarkIds'
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


module.exports.queryMetrics = async function ({
  inPredicates = {},
  inProjections = [],
  userId,
  aggregation = 'unagg',
  style = 'detail',
  returnType = 'json'
}) {

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
  if (inPredicates.labelNames || inPredicates.labelIds || inPredicates.labelMatch) {
    cteProps.joins.push(
      'left join collection_label_asset_map cla on a.assetId = cla.assetId',
      'left join collection_label cl on cla.clId = cl.clId'
    )
    const labelPredicates = []
    if (inPredicates.labelNames) {
      labelPredicates.push('cl.name IN ?')
      cteProps.predicates.binds.push([inPredicates.labelNames])
    }
    if (inPredicates.labelIds) {
      const uuidBinds = inPredicates.labelIds.map( uuid => dbUtils.uuidToSqlString(uuid))
      cteProps.predicates.binds.push([uuidBinds]) 
      labelPredicates.push('cl.uuid IN ?')
    }
    if (inPredicates.labelMatch === 'null') {
      labelPredicates.push('cl.uuid IS NULL')
    }
    cteProps.predicates.statements.push(
      `(${labelPredicates.join(' OR ')})`
    )
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
  const columns = returnType === 'csv' ? [...baseColsFlat[aggregation]] : [...baseCols[aggregation]]
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
    case 'unagg':
      predicates.statements.push('sa.benchmarkId IS NOT NULL')
      break
  }

  if (style === 'detail') {
    if (returnType === 'csv' && aggregation === 'unagg') {
      columns.push(...colsMetricsDetail)
    }
    else if (returnType === 'csv') {
      columns.push(...colsMetricsDetailAgg)
    }
    else {
      columns.push( aggregation === 'unagg' ? sqlMetricsDetail : sqlMetricsDetailAgg)
    }
  }
  else {
    if (returnType === 'csv' && aggregation === 'unagg') {
      columns.push(...colsMetricsSummary)
    }
    else if (returnType === 'csv') {
      columns.push(...colsMetricsSummaryAgg)
    }
    else {
      columns.push( aggregation === 'unagg' ? sqlMetricsSummary : sqlMetricsSummaryAgg)
    }
  }
  const query = dbUtils.makeQueryString({
    ctes,
    columns,
    joins,
    predicates,
    groupBy,
    orderBy
  })

  // let connection = await dbUtils.pool.getConnection()

  // let recordStream = connection.connection.query(query, cteProps.predicates.binds).stream()
  // const rows = []
  // for await (const row of recordStream) {
  //   rows.push(row)
  // }
  // await connection.release()

  let [rows] = await dbUtils.pool.query(query, cteProps.predicates.binds)
  return (rows || [])
}