const config = require('../utils/config')
const MetricsSvc = require(`../service/${config.database.type}/MetricsService`)
const Collection = require('./Collection')
const Security = require('../utils/accessLevels')
const SmError = require('../utils/error')

async function getCollectionMetrics (req, res, next, {style, aggregation, firstRowOnly = false}) {
  try {
    const collectionId = Collection.getCollectionIdAndCheckPermission(req, Security.ACCESS_LEVEL.Restricted)
    const inPredicates = {
      collectionId,
      labelNames: req.query.labelName,
      labelIds: req.query.labelId,
      assetIds: req.query.assetId,
      benchmarkIds: req.query.benchmarkId,
    }
    const rows = await MetricsSvc.queryMetrics({
      inPredicates,
      userId: req.userObject.userId,
      style,
      aggregation
    })
    res.json(firstRowOnly ? rows[0] : rows)
  }
  catch (e) {
    next(e)
  }
}

module.exports.getMetricsDetailByCollection = async function (req, res, next) {
  await getCollectionMetrics(req, res, next, {style: 'detail', aggregation: 'unagg'})
}
module.exports.getMetricsDetailByCollectionAggAsset = async function (req, res, next) {
  await getCollectionMetrics(req, res, next, {style: 'detail', aggregation: 'asset'})
}
module.exports.getMetricsDetailByCollectionAgg = async function (req, res, next) {
  await getCollectionMetrics(req, res, next, {style: 'detail', aggregation: 'collection'})
}
module.exports.getMetricsDetailByCollectionAggLabel = async function (req, res, next) {
  await getCollectionMetrics(req, res, next, {style: 'detail', aggregation: 'label'})
}
module.exports.getMetricsDetailByCollectionAggStig = async function (req, res, next) {
  await getCollectionMetrics(req, res, next, {style: 'detail', aggregation: 'stig'})
}
module.exports.getMetricsSummaryByCollection = async function (req, res, next) {
  await getCollectionMetrics(req, res, next, {style: 'summary', aggregation: 'unagg'})
}
module.exports.getMetricsSummaryByCollectionAggAsset = async function (req, res, next) {
  await getCollectionMetrics(req, res, next, {style: 'summary', aggregation: 'asset'})
}
module.exports.getMetricsSummaryByCollectionAgg = async function (req, res, next) {
  await getCollectionMetrics(req, res, next, {style: 'summary', aggregation: 'collection', firstRowOnly: true})
}
module.exports.getMetricsSummaryByCollectionAggLabel = async function (req, res, next) {
  await getCollectionMetrics(req, res, next, {style: 'summary', aggregation: 'label'})
}
module.exports.getMetricsSummaryByCollectionAggStig = async function (req, res, next) {
  await getCollectionMetrics(req, res, next, {style: 'summary', aggregation: 'stig'})
}
module.exports.getMetricsRootDetail = async function (req, res, next) {
  try {

  }
  catch (e) {
    next(e)
  }
}
module.exports.getMetricsRootDetailAggCollection = async function (req, res, next) {
  try {

  }
  catch (e) {
    next(e)
  }
}
module.exports.getMetricsRootDetailAggStig = async function (req, res, next) {
  try {

  }
  catch (e) {
    next(e)
  }
}
module.exports.getMetricsRootSummary = async function (req, res, next) {
  try {

  }
  catch (e) {
    next(e)
  }
}
module.exports.getMetricsRootSummaryAggCollection = async function (req, res, next) {
  try {

  }
  catch (e) {
    next(e)
  }
}
module.exports.getMetricsRootSummaryAggStig = async function (req, res, next) {
  try {

  }
  catch (e) {
    next(e)
  }
}

