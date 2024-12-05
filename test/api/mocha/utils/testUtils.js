const config = require('../testConfig.json')
const { Blob } = require('buffer')
const fs = require('fs')
const path = require('path')
const { v4: uuidv4 } = require('uuid')
const reference = require('../referenceData')
const adminToken = config.adminToken

// canidate for a function? (used to store responses for a test (metrics))
const metricsOutputToJSON = (testCaseName, username, responseData, outputJsonFile) => {
  const metricsFilePath = path.join(__dirname, outputJsonFile)
  let metricsData = JSON.parse(fs.readFileSync(metricsFilePath, 'utf8'))
  if (!metricsData[testCaseName]) {
    metricsData[testCaseName] = {}
  }
  metricsData[testCaseName][username] = responseData
  fs.writeFileSync(metricsFilePath, JSON.stringify(metricsData, null, 2), 'utf8')
}

const getUUIDSubString = (length = 20) => {
  return uuidv4().substring(0, length)
}

const loadAppData = async (appdataFileName = 'appdata.jsonl') => {

  const filePath = path.join(__dirname, `../../appdata/${appdataFileName}`)
  const fileContent = fs.readFileSync(filePath, 'utf-8')
  
  const res = await fetch(`${config.baseUrl}/op/appdata?elevate=true`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/jsonl', 
    },
    body: fileContent,
  })
  
  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`HTTP error, Status: ${res.status}, Message: ${errorText}`)
  }
  const data = await res.text()
  return data

}

const createTempCollection = async (collectionPost) => {
  // if no collecitonPost is passed in, use the default
  if (!collectionPost) {
    collectionPost = 
      {
        name: 'temoCollection' + getUUIDSubString(),
        description: 'Collection TEST description',
        settings: {
          fields: {
            detail: {
              enabled: 'always',
              required: 'findings'
            },
            comment: {
              enabled: 'always',
              required: 'findings'
            }
          },
          status: {
            canAccept: true,
            minAcceptGrant: 2,
            resetCriteria: 'result'
          },
          history: {
            maxReviews: 11
          }
        },
        metadata: {
          pocName: 'poc2Put',
          pocEmail: 'pocEmailPut@email.com',
          pocPhone: '12342',
          reqRar: 'true'
        },
        grants: [
          {
            userId: '1',
            accessLevel: 4
          },
          {
            userId: '85',
            accessLevel: 1
          }
        ],
        labels: [
          {
            name: 'TEST',
            description: 'Collection label description',
            color: 'ffffff'
          }
        ]
      }
  }
  
  const res = await fetch(`${config.baseUrl}/collections?elevate=true&projection=grants&projection=labels`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(collectionPost)
  })
  if (!res.ok) { 
    throw new Error(`HTTP error, Status: ${res.status}`)
  }
  return res.json()
}

const deleteCollection = async (collectionId) => {

  const res = await fetch(`${config.baseUrl}/collections/${collectionId}?elevate=true&projection=assets&projection=grants&projection=owners&projection=statistics&projection=stigs`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
  })
  if (!res.ok) { 
    throw new Error(`HTTP error, Status: ${res.status}`)
  }
  return res.json()
}

const createTempAsset = async asset => {
  if (!asset) {
    asset = {
      name: 'tempAsset' + getUUIDSubString(),
      collectionId: "21",
      description: 'temp',
      ip: '1.1.1.1',
      noncomputing: true,
      labelIds: [],
      metadata: {
        pocName: 'pocName',
        pocEmail: 'pocEmail@example.com',
        pocPhone: '12345',
        reqRar: 'true'
      },
      stigs: ['VPN_SRG_TEST', 'Windows_10_STIG_TEST']
    }
  }

  const res = await fetch(`${config.baseUrl}/assets`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(asset)
  })
  if (!res.ok) { 
    throw new Error(`HTTP error, Status: ${res.status}`)
  }
  return res.json()
}

const deleteAsset = async assetId => {

  const res = await fetch(`${config.baseUrl}/assets/${assetId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
  })
  if (!res.ok) { 
    throw new Error(`HTTP error, Status: ${res.status}`)
  }
  return res.json()
}

const createDisabledCollectionsandAssets = async ({context = 'full'} = {}) => {
  // this also should create stig grants for a user, add reviews too .
  const collection = await createTempCollection()
  const asset = await createTempAsset()
  if (context === 'meta') {
    await setStigGrantsMeta(21, 85, asset.assetId)
  }
  else {
    await setStigGrants(21, 85, asset.assetId)
  }
  await importReview(21, asset.assetId)
  await deleteAsset(asset.assetId)
  await deleteCollection(collection.collectionId)
  return {collection: collection.data , asset: asset.data}
}

const importReview = async (collectionId, assetId, ruleId = "SV-106179r1_rule") => {

  const res = await fetch(`${config.baseUrl}/collections/${collectionId}/reviews/${assetId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify([
      {
        "ruleId": ruleId,
        "result": "pass",
        "detail": "test\nvisible to lvl1",
        "comment": "sure",
        "autoResult": false,
        "status": "submitted"
      }
    ])
  })
  if (!res.ok) { 
    throw new Error(`HTTP error, Status: ${res.status}`)
  }
  return res.json()
}

const setStigGrants = async (collectionId, userId, assetId) => {

  const res = await fetch(`${config.baseUrl}/collections/${collectionId}/grants/user/${userId}/access`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify([
      {
          "benchmarkId": "VPN_SRG_TEST",
          "assetId": `${assetId}`
      },
      {
          "benchmarkId": "VPN_SRG_TEST",
          "assetId": "42"
      },
      {
          "benchmarkId": "VPN_SRG_TEST",
          "assetId": "154"
      }        
    ])
  })
  if (!res.ok) { 
    throw new Error(`HTTP error, Status: ${res.status}`)
  }
  return res.json()
}

const setStigGrantsMeta = async (collectionId, userId, assetId) => {

  const res = await fetch(`${config.baseUrl}/collections/${collectionId}/grants/user/${userId}/access`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify([
      {
          "benchmarkId": "VPN_SRG_TEST",
          "assetId": `${assetId}`
      },
      {
          "benchmarkId": "VPN_SRG_TEST",
          "assetId": "42"
      }
    ])
  })
  if (!res.ok) { 
    throw new Error(`HTTP error, Status: ${res.status}`)
  }
  return res.json()
}

const uploadTestStig = async (filename) => {

  const filePath = path.join(__dirname, '../../form-data-files/', filename)
  const fileContents = fs.readFileSync(filePath)
  
  // Create a Blob for the file content
  const blob = new Blob([fileContents], { type: 'text/xml' })

  const formData = new FormData()
  formData.append('importFile', blob, filename)


  const response = await fetch(`${config.baseUrl}/stigs?elevate=true&clobber=true`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`)
  }

  const data = await response.json()
  return data
}

const deleteStigByRevision = async (benchmarkId, revisionStr) => {

  const res = await fetch(`${config.baseUrl}/stigs/${benchmarkId}/revisions/${revisionStr}?elevate=true&force=true`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
  })
  if (!res.ok) { 
    throw new Error(`HTTP error, Status: ${res.status}`)
  }
  return res.json()
}

const deleteStig = async (benchmarkId) => {

  const res = await fetch(`${config.baseUrl}/stigs/${benchmarkId}?elevate=true&force=true`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
  })
  if (!res.ok) { 
    throw new Error(`HTTP error, Status: ${res.status}`)
  }
  return res.json()
}

const getAsset = async assetId => {
  const res = await fetch(`${config.baseUrl}/assets/${assetId}?projection=statusStats&projection=stigs`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) { 
    if (res.status === 403) {
      return { status: 403 }
    }
    throw new Error(`HTTP error, Status: ${res.status}`)
  }

  return await res.json()
}

const getStigByBenchmarkId = async benchmarkId => {
  try {

    const res = await fetch(`${config.baseUrl}/stigs/${benchmarkId}?elevate=true`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
    })
    if (!res.ok) { 
      if(res.status === 404) {
        return { status: 404 }
      }
      throw new Error(`HTTP error, Status: ${res.status}`)
    }
    return res.json()
  }
  catch (e) {
    if (e.response && e.response.status === 404) {
      return { status: 404 } // return an object with the 404 status
    }
    throw e 
  }
}

const getUser = async userId => {
  try {

    const res = await fetch(`${config.baseUrl}/users/${userId}?elevate=true&projection=collectionGrants&projection=statistics`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
    })
    if (!res.ok) { 
      if(res.status === 404) {
        return { status: 404 }
      }
      throw new Error(`HTTP error, Status: ${res.status}`)
    }
    return res.json()
  }
  catch (e) {
    if (e.response && e.response.status === 404) {
      return { status: 404 } // return an object with the 404 status
    }
    throw e 
  }
}

const getAssetsByLabel = async (collectionId, labelId) => {

  const res = await fetch(`${config.baseUrl}/collections/${collectionId}/labels/${labelId}/assets`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
  })
  if (!res.ok) { 
    throw new Error(`HTTP error, Status: ${res.status}`)
  }
  return res.json()
}

const getCollectionMetricsDetails = async (collectionId) => {

  const res = await fetch(`${config.baseUrl}/collections/${collectionId}/metrics/detail`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
  })
  if (!res.ok) { 
    throw new Error(`HTTP error, Status: ${res.status}`)
  }
  return res.json()
}

const getReviews = async (collectionId) => {

  const res = await fetch(`${config.baseUrl}/collections/${collectionId}/reviews`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
  })
  if (!res.ok) { 
    throw new Error(`HTTP error, Status: ${res.status}`)
  }
  return res.json()
}

const getChecklist = async (assetId, benchmarkId, revisionStr) => {

  const res = await fetch(`${config.baseUrl}/assets/${assetId}/checklists/${benchmarkId}/${revisionStr}?format=ckl`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
  })
  if (!res.ok) { 
    throw new Error(`HTTP error, Status: ${res.status}`)
  }
  return res.text()
}

const getCollection = async (collectionId) => {

  const res = await fetch(`${config.baseUrl}/collections/${collectionId}?projection=grants&projection=assets&projection=labels&projection=owners&projection=statistics&projection=stigs`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
  })
  if (!res.ok) { 
    if (res.status === 403) {
      return { status: 403 }
    }
    throw new Error(`HTTP error, Status: ${res.status}`)
  }
  return res.json()
}

const setDefaultRevision = async (collectionId, benchmarkId, revisionStr) => {

  const res = await fetch(`${config.baseUrl}/collections/${collectionId}/stigs/${benchmarkId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({"defaultRevisionStr": revisionStr})
  })
  if (!res.ok) {
    throw new Error(`HTTP error, Status: ${res.status}`)
  }
  return res.json()
}

const putReviewByAssetRule = async (collectionId, assetId, ruleId, body) => {

  const res = await fetch(`${config.baseUrl}/collections/${collectionId}/reviews/${assetId}/${ruleId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })

  if (!res.ok) {
    throw new Error(`HTTP error, Status: ${res.status}`)
  }
  return res.json()
}



const resetTestAsset = async () => {
  const res = await putAsset("42", {
    name: "Collection_X_lvl1_asset-1",
    collectionId: "21",
    description: "",
    fqdn: null,
    ip: "",
    noncomputing: true,
    mac: null,
    labelIds: [
      "755b8a28-9a68-11ec-b1bc-0242ac110002",
      "5130dc84-9a68-11ec-b1bc-0242ac110002",
    ],
    metadata: {
      testkey: "testvalue",
    },
    stigs: ["VPN_SRG_TEST", "Windows_10_STIG_TEST"],
  })
  const res2 = await setRestrictedUsers("21", "86", [
    {
      assetId: "42",
      benchmarkId: "Windows_10_STIG_TEST",
      access: "rw"
    },
  ])
  const res3 = await setGroupAccess("21", "1", 
    [
      {
        benchmarkId: 'VPN_SRG_TEST',
        labelId: '5130dc84-9a68-11ec-b1bc-0242ac110002',
        access: 'rw'
      },
      {
        assetId: '62',
        access: 'r'
      },
      {
        benchmarkId: 'VPN_SRG_TEST',
        assetId: '154',
        access: 'r'
      }
    ])
}

const setGroupAccess = async (collectionId, userGroupId, body) => {

  const res = await fetch(`${config.baseUrl}/collections/${collectionId}/grants/user-group/${userGroupId}/access`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })
  if (!res.ok) { 
    throw new Error(`HTTP error, Status: ${res.status}`)
  }
  return res.json()
}

const resetScrapAsset = async () => {
  const res = await putAsset("34", {
    name: "test asset stigmanadmin",
    collectionId: "1",
    description: "test desc",
    ip: "1.1.1.1",
    fqdn: null,
    noncomputing: true,
    mac: null,
    labelIds: [],
    metadata: {},
    stigs: ["VPN_SRG_TEST", "Windows_10_STIG_TEST","RHEL_7_STIG_TEST"],
    })
}

const setRestrictedUsers = async (collectionId, userId, body) => {

  const res = await fetch(`${config.baseUrl}/collections/${collectionId}/grants/user/${userId}/access`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })
  if (!res.ok) { 
    throw new Error(`HTTP error, Status: ${res.status}`)
  }
  return res.json()
}

const createUser = async (user) => {

  const res = await fetch(`${config.baseUrl}/users?elevate=true`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(user)
  })
  if (!res.ok) { 
    throw new Error(`HTTP error, Status: ${res.status}`)
  }
  return res.json()
}

const putAsset = async (assetId, asset) => {

  const res = await fetch(`${config.baseUrl}/assets/${assetId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(asset)
  })
  if (!res.ok) { 
    throw new Error(`HTTP error, Status: ${res.status}`)
  }
  return res.json()
}

const putCollection = async (collectionId, collection) => {

  const res = await fetch(`${config.baseUrl}/collections/${collectionId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(collection)
  })
  if (!res.ok) { 
    throw new Error(`HTTP error, Status: ${res.status}`)
  }
  return res.json()
}

const createCollectionLabel = async (collectionId, label) => {

  const res = await fetch(`${config.baseUrl}/collections/${collectionId}/labels`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(label)
  })
  if (!res.ok) { 
    throw new Error(`HTTP error, Status: ${res.status}`)
  }
  return res.json()
}

const deleteReview = async (collectionId, assetId, ruleId) => {

  const res = await fetch(`${config.baseUrl}/collections/${collectionId}/reviews/${assetId}/${ruleId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
  })
  if (!res.ok) { 
    throw new Error(`HTTP error, Status: ${res.status}`)
  }
  if(res.status === 204) {
    return { status: 204 }
  }
  return res.json()
}


module.exports = {
  deleteReview,
  createCollectionLabel,
  putCollection,
  metricsOutputToJSON,
  putReviewByAssetRule,
  createUser,
  resetTestAsset,
  resetScrapAsset,
  setRestrictedUsers,
  loadAppData,
  deleteCollection,
  // uploadTestStigs,
  deleteAsset,
  putAsset,
  setDefaultRevision,
  createTempAsset,
  createDisabledCollectionsandAssets,
  createTempCollection,
  getAsset,
  getAssetsByLabel,
  getUser,
  getReviews,
  getCollectionMetricsDetails,
  getChecklist,
  importReview,
  deleteStig,
  getStigByBenchmarkId,
  getCollection,
  uploadTestStig,
  deleteStigByRevision,
  getUUIDSubString
}
