'use strict';

const writer = require('../utils/writer')
const config = require('../utils/config')
const CollectionSvc = require(`../service/${config.database.type}/CollectionService`)
const AssetSvc = require(`../service/${config.database.type}/AssetService`)
const Serialize = require(`../utils/serializers`)
const Security = require('../utils/accessLevels')
const SmError = require('../utils/error')
const Archiver = require('archiver')
const J2X = require("fast-xml-parser").j2xParser
const he = require('he')


module.exports.createCollection = async function createCollection (req, res, next) {
  try {
    const projection = req.query.projection
    const elevate = req.query.elevate
    const body = req.body
    if ( elevate || req.userObject.privileges.canCreateCollection ) {
      try {
        const response = await CollectionSvc.createCollection( body, projection, req.userObject, res.svcStatus)
        res.status(201).json(response)
      }
      catch (err) {
        // This is MySQL specific, should abstract
        if (err.code === 'ER_DUP_ENTRY') {
          throw new SmError.UnprocessableError('Duplicate name exists.')
        }
        else {
          throw err
        }
      }
    }
    else {
      throw new SmError.PrivilegeError()
    }
  }
  catch (err) {
    next(err)
  }  
}

module.exports.deleteCollection = async function deleteCollection (req, res, next) {
  try {
    const elevate = req.query.elevate
    const collectionId = req.params.collectionId
    const projection = req.query.projection
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if (elevate || (collectionGrant && collectionGrant.accessLevel === 4)) {
      const response = await CollectionSvc.deleteCollection(collectionId, projection, elevate, req.userObject)
      res.json(response)
    }
    else {
      throw new SmError.PrivilegeError()
    }
  }
  catch (err) {
    next(err)
  }
}

module.exports.exportCollections = async function exportCollections (projection, elevate, userObject) {
  try {
    return await CollectionSvc.getCollections( {}, projection, elevate, userObject )
  }
  catch (err) {
    next(err)
  }
} 

module.exports.getChecklistByCollectionStig = async function getChecklistByCollectionStig (req, res, next) {
  try {
    const collectionId = req.params.collectionId
    const benchmarkId = req.params.benchmarkId
    const revisionStr = req.params.revisionStr
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if ( collectionGrant || req.userObject.privileges.globalAccess ) {
      const response = await CollectionSvc.getChecklistByCollectionStig(collectionId, benchmarkId, revisionStr, req.userObject )
      res.json(response)
    }
    else {
      throw new SmError.PrivilegeError()
    }
  }
  catch (err) {
    next(err)
  }
}

module.exports.getCollection = async function getCollection (req, res, next) {
  try {
    const collectionId = req.params.collectionId
    const projection = req.query.projection
    const elevate = req.query.elevate
    
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if (collectionGrant || req.userObject.privileges.globalAccess || elevate ) {
      const response = await CollectionSvc.getCollection(collectionId, projection, elevate, req.userObject )
      res.status(typeof response === 'undefined' ? 204 : 200).json(response)
    }
    else {
      throw new SmError.PrivilegeError()
    }
  }
  catch (err) {
    next(err)
  }
}

module.exports.getCollections = async function getCollections (req, res, next) {
  try {
    const projection = req.query.projection
    const elevate = req.query.elevate
    const name = req.query.name
    const nameMatch = req.query['name-match']
    const metadata = req.query.metadata
    const response = await CollectionSvc.getCollections({
      name: name,
      nameMatch: nameMatch,
      metadata: metadata
    }, projection, elevate, req.userObject)
    res.json(response)
  }
  catch (err) {
    next(err)
  }
}

module.exports.getFindingsByCollection = async function getFindingsByCollection (req, res, next) {
  try {
    const collectionId = req.params.collectionId
    const aggregator = req.query.aggregator
    const benchmarkId = req.query.benchmarkId
    const assetId = req.query.assetId
    const acceptedOnly = req.query.acceptedOnly
    const projection = req.query.projection
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if (collectionGrant || req.userObject.privileges.globalAccess ) {
      const response = await CollectionSvc.getFindingsByCollection( collectionId, aggregator, benchmarkId, assetId, acceptedOnly, projection, req.userObject )
      res.json(response)
      }
    else {
      throw new SmError.PrivilegeError()
    }
  }
  catch (err) {
    next(err)
  }
}

module.exports.getPoamByCollection = async function getFindingsByCollection (req, res, next) {
  try {
    const collectionId = req.params.collectionId
    const aggregator = req.query.aggregator
    const benchmarkId = req.query.benchmarkId
    const assetId = req.query.assetId
    const acceptedOnly = req.query.acceptedOnly
    const defaults = {
      date: req.query.date,
      office: req.query.office,
      status: req.query.status
    }
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if (collectionGrant || req.userObject.privileges.globalAccess ) {
      const response = await CollectionSvc.getFindingsByCollection( collectionId, aggregator, benchmarkId, assetId, acceptedOnly, 
        [
          'rulesWithDiscussion',
          'groups',
          'assets',
          'stigsInfo',
          'ccis'
        ], req.userObject )
      
      const po = Serialize.poamObjectFromFindings(response, defaults)
      const xlsx = await Serialize.xlsxFromPoamObject(po)
      let collectionName
      if (!collectionGrant && req.userObject.privileges.globalAccess) {
        const response = await CollectionSvc.getCollection(collectionId, [], false, req.userObject )
        collectionName = response.name
      }
      else {
        collectionName = collectionGrant.collection.name
      }
      writer.writeInlineFile( res, xlsx, `POAM-${collectionName}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    }
    else {
      throw new SmError.PrivilegeError()
    }
  }
  catch (err) {
    next(err)
  }
}

module.exports.getStatusByCollection = async function getStatusByCollection (req, res, next) {
  try {
    const collectionId = req.params.collectionId
    const benchmarkIds = req.query.benchmarkId
    const assetIds = req.query.assetId
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if (collectionGrant || req.userObject.privileges.globalAccess ) {
      const response = await CollectionSvc.getStatusByCollection( collectionId, assetIds, benchmarkIds, req.userObject )
      res.json(response)
    }
    else {
      throw new SmError.PrivilegeError()
    }
  }
  catch (err) {
    next(err)
  }
}

module.exports.getStigAssetsByCollectionUser = async function getStigAssetsByCollectionUser (req, res, next) {
  try {
    const collectionId = req.params.collectionId
    const userId = req.params.userId
    
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if ( collectionGrant && collectionGrant.accessLevel >= 3 ) {
      const response = await CollectionSvc.getStigAssetsByCollectionUser(collectionId, userId, req.userObject )
      res.json(response)
    }
    else {
      throw new SmError.PrivilegeError()
    }
  }
  catch (err) {
    next(err)
  }
}

module.exports.getStigsByCollection = async function getStigsByCollection (req, res, next) {
  try {
    const collectionId = req.params.collectionId
    const labelIds = req.query.labelId
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if (collectionGrant || req.userObject.privileges.globalAccess ) {
      const response = await CollectionSvc.getStigsByCollection( collectionId, labelIds, false, req.userObject )
      res.json(response)
      }
    else {
      throw new SmError.PrivilegeError()
    }
  }
  catch (err) {
    next(err)
  }
}

module.exports.replaceCollection = async function replaceCollection (req, res, next) {
  try {
    const elevate = req.query.elevate
    const collectionId = req.params.collectionId
    const projection = req.query.projection
    const body = req.body
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if ( elevate || (collectionGrant && collectionGrant.accessLevel >= 3) ) {
      const response = await CollectionSvc.replaceCollection(collectionId, body, projection, req.userObject, res.svcStatus)
      res.json(response)
    }
    else {
      throw new SmError.PrivilegeError()
    }    
  }
  catch (err) {
    next(err)
  }
}

module.exports.setStigAssetsByCollectionUser = async function setStigAssetsByCollectionUser (req, res, next) {
  try {
    const collectionId = req.params.collectionId
    const userId = req.params.userId
    const stigAssets = req.body
    
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if ( collectionGrant && collectionGrant.accessLevel >= 3 ) {
      const collectionResponse = await CollectionSvc.getCollection(collectionId, ['grants'], false, req.userObject )
      if (collectionResponse.grants.filter( grant => grant.accessLevel === 1 && grant.user.userId === userId).length > 0) {
        const setResponse = await CollectionSvc.setStigAssetsByCollectionUser(collectionId, userId, stigAssets, res.svcStatus ) 
        const getResponse = await CollectionSvc.getStigAssetsByCollectionUser(collectionId, userId, req.userObject )
        res.json(getResponse)    
      }
      else {
        throw new SmError.NotFoundError('User not found in this Collection with accessLevel === 1.')
      }
    }
    else {
      throw new SmError.PrivilegeError()
    }
  }
  catch (err) {
    next(err)
  }
}

module.exports.updateCollection = async function updateCollection (req, res, next) {
  try {
    const elevate = req.query.elevate
    const collectionId = req.params.collectionId
    const projection = req.query.projection
    const body = req.body
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if ( elevate || (collectionGrant && collectionGrant.accessLevel >= 3) ) {
      let response = await CollectionSvc.replaceCollection(collectionId, body, projection, req.userObject, res.svcStatus)
      res.json(response)
    }
    else {
      throw new SmError.PrivilegeError()
    }    
  }
  catch (err) {
    next(err)
  }
}

function getCollectionIdAndCheckPermission(request, minimumAccessLevel = Security.ACCESS_LEVEL.Manage, allowElevate = false) {
  let collectionId = request.params.collectionId
  const elevate = request.query.elevate
  const collectionGrant = request.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
  if (!( (allowElevate && elevate) || (collectionGrant && collectionGrant.accessLevel >= minimumAccessLevel) )) {
    throw new SmError.PrivilegeError()
  }
  return collectionId
}

module.exports.getCollectionMetadata = async function (req, res, next) {
  try {
    let collectionId = getCollectionIdAndCheckPermission(req)
    let result = await CollectionSvc.getCollectionMetadata(collectionId, req.userObject)
    res.json(result)
  }
  catch (err) {
    next(err)
  }  
}

module.exports.patchCollectionMetadata = async function (req, res, next) {
  try {
    let collectionId = getCollectionIdAndCheckPermission(req)
    let metadata = req.body
    await CollectionSvc.patchCollectionMetadata(collectionId, metadata)
    let result = await CollectionSvc.getCollectionMetadata(collectionId)
    res.json(result)
  }
  catch (err) {
    next(err)
  }  
}

module.exports.putCollectionMetadata = async function (req, res, next) {
  try {
    let collectionId = getCollectionIdAndCheckPermission(req)
    let body = req.body
    await CollectionSvc.putCollectionMetadata( collectionId, body)
    let result = await CollectionSvc.getCollectionMetadata(collectionId)
    res.json(result)
  }
  catch (err) {
    next(err)
  }  
}

module.exports.getCollectionMetadataKeys = async function (req, res, next) {
  try {
    let collectionId = getCollectionIdAndCheckPermission(req)
    let result = await CollectionSvc.getCollectionMetadataKeys(collectionId, req.userObject)
    if (!result) {
      throw new SmError.NotFoundError('metadata keys not found')
    } 
    res.json(result)
  }
  catch (err) {
    next(err)
  }  
}

module.exports.getCollectionMetadataValue = async function (req, res, next) {
  try {
    let collectionId = getCollectionIdAndCheckPermission(req)
    let key = req.params.key
    let result = await CollectionSvc.getCollectionMetadataValue(collectionId, key, req.userObject)
    if (!result) {
      throw new SmError.NotFoundError('metadata key not found')
    }
    res.json(result)
  }
  catch (err) {
    next(err)
  }  
}

module.exports.putCollectionMetadataValue = async function (req, res, next) {
  try {
    let collectionId = getCollectionIdAndCheckPermission(req)
    let key = req.params.key
    let value = req.body
    let result = await CollectionSvc.putCollectionMetadataValue(collectionId, key, value)
    res.status(204).send()
  }
  catch (err) {
    next(err)
  }  
}

module.exports.deleteCollectionMetadataKey = async function (req, res, next) {
  try {
    let collectionId = getCollectionIdAndCheckPermission(req)
    let key = req.params.key
    let result = await CollectionSvc.deleteCollectionMetadataKey(collectionId, key, req.userObject)
    res.status(204).send()
  }
  catch (err) {
    next(err)
  }  
}

module.exports.deleteReviewHistoryByCollection = async function (req, res, next) {
  try {
    let collectionId = getCollectionIdAndCheckPermission(req, Security.ACCESS_LEVEL.Manage)
    const retentionDate = req.query.retentionDate
    const assetId = req.query.assetId
    
    let result = await CollectionSvc.deleteReviewHistoryByCollection(collectionId, retentionDate, assetId)
    res.json(result)
  }
  catch (err) {
    next(err)
  }  
}

module.exports.getReviewHistoryByCollection = async function (req, res, next) {
  try {
    let collectionId = getCollectionIdAndCheckPermission(req, Security.ACCESS_LEVEL.Full)
    const startDate = req.query.startDate
    const endDate = req.query.endDate
    const assetId = req.query.assetId
    const ruleId = req.query.ruleId
    const status = req.query.status

    let result = await CollectionSvc.getReviewHistoryByCollection(collectionId, startDate, endDate, assetId, ruleId, status)
    res.json(result)
  }
  catch (err) {
    next(err)
  }  
}

module.exports.getReviewHistoryStatsByCollection = async function (req, res, next) {
  try {
    let collectionId = getCollectionIdAndCheckPermission(req, Security.ACCESS_LEVEL.Full)
    const startDate = req.query.startDate
    const endDate = req.query.endDate
    const assetId = req.query.assetId
    const ruleId = req.query.ruleId
    const status = req.query.status
    const projection = req.query.projection

    let result = await CollectionSvc.getReviewHistoryStatsByCollection(collectionId, startDate, endDate, assetId, ruleId, status, projection)
    res.json(result)
  }
  catch (err) {
    next(err)
  }  
}

module.exports.getCollectionLabels = async function (req, res, next) {
  try {
    const collectionId = getCollectionIdAndCheckPermission(req, Security.ACCESS_LEVEL.Restricted)
    const response = await CollectionSvc.getCollectionLabels( collectionId, req.userObject )
    res.json(response)
  }
  catch (err) {
    next(err)
  }
}

module.exports.createCollectionLabel = async function (req, res, next) {
  try {
    const collectionId = getCollectionIdAndCheckPermission(req, Security.ACCESS_LEVEL.Manage)
    const labelId = await CollectionSvc.createCollectionLabel( collectionId, req.body )
    const response = await CollectionSvc.getCollectionLabelById( collectionId, labelId, req.userObject )
    res.status(201).json(response)
  }
  catch (err) {
    next(err)
  }
}

module.exports.getCollectionLabelById = async function (req, res, next) {
  try {
    const collectionId = getCollectionIdAndCheckPermission(req, Security.ACCESS_LEVEL.Restricted)
    const response = await CollectionSvc.getCollectionLabelById( collectionId, req.params.labelId, req.userObject )
    if (!response) {
      throw new SmError.NotFoundError()
    }
    res.json(response)
  }
  catch (err) {
    next(err)
  }
}

module.exports.patchCollectionLabelById = async function (req, res, next) {
  try {
    const collectionId = getCollectionIdAndCheckPermission(req, Security.ACCESS_LEVEL.Manage)
    const affectedRows = await CollectionSvc.patchCollectionLabelById( collectionId, req.params.labelId, req.body )
    if (affectedRows === 0) {
      throw new SmError.NotFoundError()
    }
    const response = await CollectionSvc.getCollectionLabelById( collectionId, req.params.labelId, req.userObject )
    res.json(response)
  }
  catch (err) {
    next(err)
  }
}

module.exports.deleteCollectionLabelById = async function (req, res, next) {
  try {
    const collectionId = getCollectionIdAndCheckPermission(req, Security.ACCESS_LEVEL.Manage)
    const affectedRows = await CollectionSvc.deleteCollectionLabelById(collectionId, req.params.labelId)
    if (affectedRows === 0) {
      throw new SmError.NotFoundError()
    }
    res.status(204).end()
  }
  catch (err) {
    next(err)
  }
}

module.exports.getAssetsByCollectionLabelId = async function (req, res, next) {
  try {
    const collectionId = getCollectionIdAndCheckPermission(req, Security.ACCESS_LEVEL.Restricted)
    const response = await CollectionSvc.getAssetsByCollectionLabelId( collectionId, req.params.labelId, req.userObject )
    res.json(response)
  }
  catch (err) {
    next(err)
  }
}

module.exports.putAssetsByCollectionLabelId = async function (req, res, next) {
  try {
    const collectionId = getCollectionIdAndCheckPermission(req)
    const labelId = req.params.labelId
    const assetIds = req.body
    let collection = await CollectionSvc.getCollection( collectionId, ['assets'], false, req.userObject)
    let collectionAssets = collection.assets.map( a => a.assetId)
    if (assetIds.every( a => collectionAssets.includes(a))) {
      await CollectionSvc.putAssetsByCollectionLabelId( collectionId, labelId, assetIds, res.svcStatus )
      const response = await CollectionSvc.getAssetsByCollectionLabelId( collectionId, req.params.labelId, req.userObject )
      res.json(response)
    }
    else {
      throw new SmError.PrivilegeError('One or more assetId is not a Collection member.')
    }
  }
  catch (err) {
    next(err)
  }
}

module.exports.postCklArchiveByCollection = async function (req, res, next) {
  try {
    const collectionId = getCollectionIdAndCheckPermission(req)
    const mode = req.query.mode || 'mono'
    const parsedRequest = await processAssetStigRequests (req.body, collectionId, mode, req.userObject)
    await postArchiveByCollection({
      format: `ckl-${mode}`,
      req,
      res,
      parsedRequest
    })
  }
  catch (err) {
    next(err)
  }
}

module.exports.postXccdfArchiveByCollection = async function (req, res, next) {
  try {
    const collectionId = getCollectionIdAndCheckPermission(req)
    const parsedRequest = await processAssetStigRequests (req.body, collectionId, 'mono', req.userObject)
    await postArchiveByCollection({
      format: 'xccdf',
      req,
      res,
      parsedRequest
    })
  }
  catch (err) {
    next(err)
  }
}

async function postArchiveByCollection ({format = 'ckl-mono', req, res, parsedRequest}) {
  const j2x = new J2X({
    attributeNamePrefix : "@_",
    textNodeName : "#text",
    ignoreAttributes : format.startsWith('ckl-'),
    cdataTagName: "__cdata",
    cdataPositionChar: "\\c",
    format: true,
    indentBy: "  ",
    supressEmptyNode: format === 'xccdf',
    tagValueProcessor: a => {
      return a ? he.encode(a.toString(), { useNamedReferences: false}) : a 
    },
    attrValueProcessor: a => he.encode(a, {isAttributeValue: true, useNamedReferences: true})
  })
  const zip = Archiver('zip', {zlib: {level: 9}})
  res.attachment(`${parsedRequest.collection.name}-${format.startsWith('ckl-') ? 'CKL' : 'XCCDF'}.zip`)
  zip.pipe(res)
  const manifest = {
    started: new Date().toISOString(),
    finished: '',
    errorCount: 0,
    errors: [],
    memberCount: 0,
    members: [],
    requestParams: {
      collection: parsedRequest.collection,
      assetStigs: req.body
    }
  }

  zip.on('error', function (e) {
    manifest.errors.push({message: e.message, stack: e.stack})
    manifest.errorCount += 1
  })
  for (const arg of parsedRequest.assetStigArguments) {
    try {
      const response = format.startsWith('ckl-') ?
        await AssetSvc.cklFromAssetStigs(arg.assetId, arg.stigs) :
        await AssetSvc.xccdfFromAssetStig(arg.assetId, arg.stigs[0].benchmarkId, arg.stigs[0].revisionStr)
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<!-- STIG Manager ${config.version} -->\n<!-- Classification: ${config.settings.setClassification} -->\n`
      xml += j2x.parse(response.xmlJs)
      let filename = arg.assetName
      if (format === 'ckl-mono' || format === 'xccdf') {
        filename += `-${arg.stigs[0].benchmarkId}-${response.revisionStrResolved}`
      }
      filename += `${format === 'xccdf' ? '-xccdf.xml' : '.ckl'}`
      zip.append(xml, {name: filename})
      manifest.members.push(filename)
      manifest.memberCount += 1

    }
    catch (e) {
      arg.error = {message: e.message, stack: e.stack}
      manifest.errors.push(arg)
      manifest.errorCount += 1
    }
  }
  manifest.finished = new Date().toISOString()
  manifest.members.sort((a,b) => a.localeCompare(b))
  zip.append(JSON.stringify(manifest, null, 2), {name: '_manifest.json'})
  await zip.finalize()
}

module.exports.getUnreviewedAssetsByCollection = async function (req, res, next) {
  try {
    const collectionId = getCollectionIdAndCheckPermission(req, Security.ACCESS_LEVEL.Restricted)
    const benchmarkId = req.query.benchmarkId
    const assetId = req.query.assetId
    const severities = req.query.severity || []
    const labelIds = req.query.labelId || []
    const labelNames = req.query.labelName || []
    const projections = req.query.projection || []
    const response = await CollectionSvc.getUnreviewedAssetsByCollection( {
      collectionId,
      benchmarkId,
      assetId,
      labelIds,
      labelNames,
      severities,
      projections,
      userObject: req.userObject
    })
    res.json(response)
  }
  catch (err) {
    next(err)
  }
}

module.exports.getUnreviewedRulesByCollection = async function (req, res, next) {
  try {
    const collectionId = getCollectionIdAndCheckPermission(req, Security.ACCESS_LEVEL.Restricted)
    const benchmarkId = req.query.benchmarkId
    const ruleId = req.query.ruleId
    const severities = req.query.severity || []
    const labelIds = req.query.labelId || []
    const labelNames = req.query.labelName || []
    const projections = req.query.projection || []
    const response = await CollectionSvc.getUnreviewedRulesByCollection( {
      collectionId,
      benchmarkId,
      ruleId,
      severities,
      labelIds,
      labelNames,
      projections,
      userObject: req.userObject
    })
    res.json(response)
  }
  catch (err) {
    next(err)
  }
}

// for the archive streaming endpoints
async function processAssetStigRequests (assetStigRequests, collectionId, mode = 'mono', userObject) {
  const assetStigArguments = []
  let collectionName
  for (const requested of assetStigRequests) {
    const assetId = requested.assetId
    
    // Try to fetch asset as this user.
    const assetResponse = await AssetSvc.getAsset(assetId, ['stigs'], false, userObject )
    // Does user have a grant permitting access to the asset?
    if (!assetResponse) {
      throw new SmError.PrivilegeError()
    }
    // Is asset a member of collectionId?
    if (assetResponse.collection.collectionId !== collectionId) {
      throw new SmError.UnprocessableError(`Asset id ${assetId} is not a member of Collection id ${collectionId}.`)
    }
    if (!collectionName) { collectionName = assetResponse.collection.name } // will be identical for other assets
    // Does the asset have STIG mappings?
    if (assetResponse.stigs.length === 0) {
      throw new SmError.UnprocessableError(`Asset id ${assetId} has no STIG mappings.`)
    }

    // create Map of the asset's mapped STIGs
    const availableRevisionsMap = new Map()
    for (const stig of assetResponse.stigs) {
      availableRevisionsMap.set(stig.benchmarkId, stig.revisionStrs)
    }

    // create Map of the requested STIGs for the asset
    const requestedRevisionsMap = new Map()
    if (!requested.stigs) {
      // request doesn't specify STIGs, so include all mapped STIGs and their current revision strings
      for (const stig of assetResponse.stigs) {
        requestedRevisionsMap.set(stig.benchmarkId, [stig.lastRevisionStr])
      } 
    }
    else {
      // request includes specific STIGs
      for (const stig of requested.stigs) {
        if (typeof stig === 'string' && availableRevisionsMap.has(stig)) {
          // array member is a benchmarkId string that matches an available STIG mapping
          const revisions = requestedRevisionsMap.get(stig) ?? []
          revisions.push('latest')
          requestedRevisionsMap.set(stig, revisions)
        }
        else if ((stig.revisionStr === 'latest' && availableRevisionsMap.has(stig.benchmarkId)) || availableRevisionsMap.get(stig.benchmarkId)?.includes(stig.revisionStr)) {
          // array member is an object that matches an available STIG/Revision mapping
          const revisions = requestedRevisionsMap.get(stig.benchmarkId) ?? []
          revisions.push(stig.revisionStr)
          requestedRevisionsMap.set(stig.benchmarkId, revisions)
        }
        else {
          throw new SmError.UnprocessableError(`Asset id ${assetId} is not mapped to ${JSON.stringify(stig)}.`)
        }
      }
    }

    // For generating individual filenames
    const assetName = assetResponse.name

    if (mode === 'mono') {
      // XCCDF and mono CKLs
      for (const entry of requestedRevisionsMap) {
        for (const revisionStr of entry[1]) {
          assetStigArguments.push({
            assetId,
            assetName,
            stigs: [{benchmarkId: entry[0], revisionStr}]
          }) 
        }
      }
    }
    else {
      // multi-STIG CKLs
      const stigsParam = []
      for (const entry of requestedRevisionsMap) {
        for (const revisionStr of entry[1]) {
          stigsParam.push({benchmarkId: entry[0], revisionStr})
        }
      }
      assetStigArguments.push({
        assetId,
        assetName,
        stigs: stigsParam
      })
    }
  }
  return {
    collection: {
      collectionId,
      name: collectionName,
    },
    assetStigArguments
  }
}
