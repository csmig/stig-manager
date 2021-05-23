'use strict';
const writer = require('../../utils/writer.js')
const dbUtils = require('./utils')

/**
 * Return version information
 *
 * returns ApiVersion
 **/
exports.getConfiguration = async function() {
  try {
    let sql = `SELECT * from config`
    let [rows] = await dbUtils.pool.query(sql)
    let config = {}
    for (const row of rows) {
      config[row.key] = row.value
    }
    return (config)
  }
  catch(err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}

exports.setConfigurationItem = async function (key, value) {
  try {
    await dbUtils.pool.request().query`MERGE INTO config WITH (HOLDLOCK) AS target 
    USING (SELECT ${key} AS [key]) AS source
    ON (target.[key] = source.[key])
    WHEN MATCHED THEN UPDATE SET target.value = ${value}
    WHEN NOT MATCHED THEN INSERT ([key], value) VALUES (${key}, ${value});`
    return (true)
  }
  catch(err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }

}

exports.replaceAppData = async function (importOpts, appData, userObject, res ) {
  function dmlObjectFromAppData (appdata) {
    let {collections, assets, users, reviews} = appdata

    let dml = {
      preload: [
      ],
      postload: [
      ],
      collection: {
        sqlDelete: `DELETE FROM collection`,
        sqlInsert: `SET IDENTITY_INSERT collection ON;INSERT INTO
        collection (
          collectionId,
          name,
          workflow,
          metadata 
        ) SELECT * FROM OPENJSON(@json) WITH (
          collectionId int,
          name nvarchar(45),
          workflow nvarchar(45),
          metadata nvarchar(max)
        ) AS source;SET IDENTITY_INSERT collection OFF;`,
        insertBinds: []
      },
      userData: {
        sqlDelete: `DELETE FROM user_data`,
        sqlInsert: `SET IDENTITY_INSERT user_data ON;INSERT INTO
        user_data (
          userId,
          username, 
          lastAccess,
          lastClaims
        ) SELECT * FROM OPENJSON(@json) WITH (
          userId int, 
          username nvarchar(255), 
          lastAccess int, 
          lastClaims nvarchar(max)      
        ) AS source;SET IDENTITY_INSERT user_data OFF`,
        insertBinds: []
      },
      collectionGrant: {
        sqlDelete: `DELETE FROM collection_grant`,
        sqlInsert: `INSERT INTO
        collection_grant (
          collectionId,
          userId,
          accessLevel
        ) SELECT * FROM OPENJSON(@json) WITH (
          collectionId int,
          userId int,
          accessLevel int
        )`,
        insertBinds: []
      },
      asset: {
        sqlDelete: `DELETE FROM asset`,
        sqlInsert: `SET IDENTITY_INSERT asset ON;INSERT INTO asset (
          assetId,
          collectionId,
          name,
          description,
          ip,
          noncomputing,
          metadata
        ) SELECT * FROM OPENJSON(@json) WITH (
          assetId int,
          collectionId int,
          name nvarchar(255),
          description nvarchar(255),
          ip nvarchar(255),
          noncomputing binary(1),
          metadata nvarchar(max)
        );SET IDENTITY_INSERT asset OFF;`,
        insertBinds: []
      },
      stigAssetMap: {
        sqlDelete: `DELETE FROM stig_asset_map`,
        sqlInsert: `INSERT INTO stig_asset_map (
          assetId,
          benchmarkId,
          userIds
        ) SELECT * FROM OPENJSON(@json) WITH (
          assetId int,
          benchmarkId nvarchar(255),
          userIds nvarchar(max)
        )`,
        insertBinds: []
      },
      userStigAssetMap: {
        sqlDelete: `DELETE FROM user_stig_asset_map`,
        sqlInsert: `INSERT INTO user_stig_asset_map
        (saId, userId)
        SELECT
        sa.saId,
        jt.userId
        FROM
        stig_asset_map sa CROSS APPLY
        OPENJSON(sa.userIds) WITH (
          userId int '$'
        ) jt`,
        insertBinds: [null] // dummy value so length > 0
      },
      reviewHistory: {
        sqlDelete: `DELETE FROM review_history`,
        sqlInsert: `INSERT INTO review_history (
          assetId,
          ruleId,
          activityType,
          columnName,
          oldValue,
          newValue,
          userId,
          ts
        ) VALUES ?`,
        insertBinds: []
      },
      review: {
        sqlDelete: `DELETE FROM review`,
        sqlInsert: `INSERT INTO review (
          assetId,
          ruleId,
          resultId,
          resultComment,
          actionId,
          actionComment,
          userId,
          autoResult,
          ts,
          rejectText,
          rejectUserId,
          statusId
        ) SELECT * FROM OPENJSON(@json) WITH (
          assetId int,
          ruleId nvarchar(45),
          resultId int,
          resultComment nvarchar(max),
          actionId int,
          actionComment nvarchar(max),
          userId int,
          autoResult binary(1),
          ts datetime2(0),
          rejectText nvarchar(max),
          rejectUserId int,
          statusId int
        )`,
        insertBinds: []
      }
    }

    // Process appdata object

    // Table: user_data
    for (const u of users) {
      dml.userData.insertBinds.push({
        userId: parseInt(u.userId),
        username: u.username, 
        lastAccess: u.statistics.lastAccess,
        lastClaims: JSON.stringify(u.statistics.lastClaims)
      })
    }
    
    // Tables: collection, collection_grant_map
    for (const c of collections) {
      dml.collection.insertBinds.push({
        collectionId: parseInt(c.collectionId),
        name: c.name,
        workflow: c.workflow,
        metadata: JSON.stringify(c.metadata)
      })
      for (const grant of c.grants) {
        dml.collectionGrant.insertBinds.push({
          collectionId: parseInt(c.collectionId),
          userId: parseInt(grant.userId),
          accessLevel: grant.accessLevel
        })
      }
    }


    // Tables: asset, stig_asset_map, user_stig_asset_map
    for (const asset of assets) {
      let { stigGrants, ...assetFields} = asset
      dml.asset.insertBinds.push({
        assetId: parseInt(assetFields.assetId),
        collectionId: parseInt(assetFields.collectionId),
        name: assetFields.name,
        description: assetFields.description,
        ip: assetFields.ip,
        noncomputing: assetFields.noncomputing ? 'gA==': 'AA==',
        metadata: JSON.stringify(assetFields.metadata)
      })
      let assetId = assetFields.assetId
      for (const sg of stigGrants) {
        sg.userIds = sg.userIds.map( u => parseInt(u))
        dml.stigAssetMap.insertBinds.push({
          assetId: parseInt(assetId),
          benchmarkId: sg.benchmarkId,
          userIds: JSON.stringify(sg.userIds)
        })
      }
    }

    // Tables: review, review_history
    for (const review of reviews) {
      // for (const h of review.history) {
      //   dml.reviewHistory.insertBinds.push([
      //     review.assetId,
      //     review.ruleId,
      //     h.activityType,
      //     h.columnName,
      //     h.oldValue,
      //     h.newValue,
      //     h.userId,
      //     new Date(h.ts)
      //   ])
      // }
      dml.review.insertBinds.push({
        assetId: parseInt(review.assetId),
        ruleId: review.ruleId,
        resultId: dbUtils.REVIEW_RESULT_API[review.result],
        resultComment:review.resultComment,
        actionId: review.action ? dbUtils.REVIEW_ACTION_API[review.action] : null,
        actionComment: review.actionComment,
        userId: parseInt(review.userId),
        autoState: review.autoState ? 'gA==': 'AA==',
        ts: new Date(review.ts),
        rejectText: review.rejectText,
        rejectUserId: parseInt(review.rejectUserId),
        statusId: review.status ? dbUtils.REVIEW_STATUS_API[review.status] : 0
      })
    }

    return dml
  }

  let transaction
  try {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.write('Starting import\n')
    let result, hrstart, hrend, tableOrder, dml, stats = {}
    let totalstart = process.hrtime() 

    hrstart = process.hrtime() 
    dml = dmlObjectFromAppData(appData)
    hrend = process.hrtime(hrstart)
    stats.dmlObject = `Built in ${hrend[0]}s  ${hrend[1] / 1000000}ms`
    res.write('Parsed appdata\n')

    // Connect to MSSQL and start transaction
    transaction = new dbUtils.sql.Transaction()
    await transaction.begin()
    await dbUtils.queryPool('EXEC sp_MSForEachTable "ALTER TABLE ? NOCHECK CONSTRAINT all"', {}, transaction)

    // Deletes
    tableOrder = [
      'reviewHistory',
      'review',
      'userStigAssetMap',
      'stigAssetMap',
      'collectionGrant',
      'collection',
      'asset',
      'userData',
    ]
    for (const table of tableOrder) {
      res.write(`Deleting: ${table}\n`)
      hrstart = process.hrtime() 
      result = await dbUtils.queryPool(dml[table].sqlDelete, {}, transaction)

      hrend = process.hrtime(hrstart)
      stats[table] = {}
      stats[table].delete = `${result.affectedRows} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`
    }

    // Inserts

  
    tableOrder = [
      'userData',
      'collection',
      'collectionGrant',
      'asset',
      'stigAssetMap',
      'userStigAssetMap',
      'review',
      'reviewHistory'
    ]
    await dbUtils.queryPool('EXEC sp_MSForEachTable "ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all"', {}, transaction)

    for (const table of tableOrder) {
      if (dml[table].insertBinds.length > 0) {
        hrstart = process.hrtime()

        let i, j, bindchunk, chunk = 5000;
        for (i=0,j=dml[table].insertBinds.length; i<j; i+=chunk) {
          console.log(`table: ${table} chunk: ${i}\n`)
          res.write(`Inserting: ${table} chunk: ${i}\n`)
          bindchunk = dml[table].insertBinds.slice(i,i+chunk);
          const json = JSON.stringify(bindchunk)
          result = await dbUtils.queryPool(dml[table].sqlInsert, {json}, transaction)
        }
        hrend = process.hrtime(hrstart)
        stats[table].insert = `${result.affectedRows} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`
      }
    }

    // // Stats
    // res.write('Calculating status statistics\n')
    // hrstart = process.hrtime();
    // const statusStats = await dbUtils.updateStatsAssetStig( connection, {} )
    // hrend = process.hrtime(hrstart)
    // stats.stats = `${statusStats.affectedRows} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`
    
    // Commit
    hrstart = process.hrtime() 
    res.write(`Starting commit\n`)
    await transaction.commit()
    res.write(`Commit successful\n`)
    hrend = process.hrtime(hrstart)
    stats.commit = `${result.affectedRows} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`

    // // Postload
    // hrstart = process.hrtime() 
    // for (const sql of dml.postload) {
    //   ;[result] = await connection.execute(sql)
    // }
    // hrend = process.hrtime(hrstart)
    // stats.postload = `${result.affectedRows} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`

    // Total time calculation
    hrend = process.hrtime(totalstart)
    stats.total = `TOTAL in ${hrend[0]}s  ${hrend[1] / 1000000}ms`
    res.write(JSON.stringify(stats))
    res.end()

    // return (stats)
  }
  catch (err) {
    if (typeof transaction !== 'undefined') {
      await transaction.rollback()
    }
    res.write(err.message)
    res.end()
  }
}
