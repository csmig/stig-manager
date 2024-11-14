const chai = require('chai')
const chaiHttp = require('chai-http')
chai.use(chaiHttp)
const expect = chai.expect
const deepEqualInAnyOrder = require('deep-equal-in-any-order')
chai.use(deepEqualInAnyOrder)
const config = require('../../testConfig.json')
const utils = require('../../utils/testUtils')
const iterations = require("../../iterations.js")
const expectations = require('./expectations.js')
const reference = require('../../referenceData.js')
const requestBodies = require('./requestBodies.js')

describe('PUT - Collection', function () {

  before(async function () {
      await utils.loadAppData()
  })

  for(const iteration of iterations){
    if (expectations[iteration.name] === undefined){
      it(`No expectations for this iteration scenario: ${iteration.name}`,async function () {})
      continue
    }

    describe(`iteration:${iteration.name}`, function () {
      const distinct = expectations[iteration.name]
    
      describe('replaceCollection - /collections/{collectionId}', function () {

        after(async function () {
          await utils.loadAppData()
        })

        it('Set all properties of a Collection',async function () {

            const putRequest = requestBodies.replaceCollection
            const res = await chai.request(config.baseUrl)
                .put(`/collections/${reference.testCollection.collectionId}?projection=grants&projection=owners&projection=statistics&projection=stigs&projection=assets`)
                .set('Authorization', `Bearer ${iteration.token}`)
                .send(putRequest)

              if(distinct.canModifyCollection === false){
                  expect(res).to.have.status(403)
                  return
              }
              expect(res).to.have.status(200)

              expect(res.body.description).to.equal("test")
              expect(res.body.name).to.equal("SetAllProperties")
              expect(res.body.settings.fields.detail.enabled).to.equal(putRequest.settings.fields.detail.enabled)
              expect(res.body.settings.fields.detail.required).to.equal(putRequest.settings.fields.detail.required)
              expect(res.body.settings.fields.comment.enabled).to.equal(putRequest.settings.fields.comment.enabled)
              expect(res.body.settings.fields.comment.required).to.equal(putRequest.settings.fields.comment.required)
              expect(res.body.settings.status.canAccept).to.equal(putRequest.settings.status.canAccept)
              expect(res.body.settings.status.minAcceptGrant).to.equal(putRequest.settings.status.minAcceptGrant)
              expect(res.body.settings.status.resetCriteria).to.equal(putRequest.settings.status.resetCriteria)
              expect(res.body.metadata.pocName).to.equal(putRequest.metadata.pocName)
              expect(res.body.metadata.pocEmail).to.equal(putRequest.metadata.pocEmail)
              expect(res.body.metadata.pocPhone).to.equal(putRequest.metadata.pocPhone)
              expect(res.body.metadata.reqRar).to.equal(putRequest.metadata.reqRar)
              
            // grants projection
            expect(res.body.grants).to.have.lengthOf(putRequest.grants.length)
            for(let grant of res.body.grants) {
              if(grant.userId){
                  expect(grant.userId).to.be.oneOf(putRequest.grants.map(grant => grant.userId))
              }
              if(grant.userGroupId){
                  expect(grant.userGroupId).to.be.oneOf(putRequest.grants.map(grant => grant.userGroupId))
              }
            }
        
            // assets projection
            expect(res.body.assets).to.deep.equalInAnyOrder(reference.testCollection.assetsProjected)

            // owners projection
            expect(res.body.owners).to.have.lengthOf(reference.testCollection.owners.length)

            // statistics projection
            expect(res.body.statistics.assetCount).to.equal(reference.testCollection.assetIds.length)
            expect(res.body.statistics.checklistCount).to.equal(reference.testCollection.statisticsProjected.checklistCount)
        
            // stigs projection
            expect(res.body.stigs).to.have.lengthOf(reference.testCollection.validStigs.length)              
        })

        it("should throw SmError.UnprocessableError when replacing due to duplicate user in grant array.",async function () {

          const putRequest = JSON.parse(JSON.stringify(requestBodies.replaceCollection))
          putRequest.grants.push(putRequest.grants[0])
          putRequest.name = "TEST" + utils.getUUIDSubString()
          const res = await chai.request(config.baseUrl)
              .put(`/collections/${reference.testCollection.collectionId}`)
              .set('Authorization', `Bearer ${iteration.token}`)
              .send(putRequest)
            if(distinct.canModifyCollection === false){
                expect(res).to.have.status(403)
                return
            }
            expect(res).to.have.status(422)
            expect(res.body.error).to.equal("Unprocessable Entity.")
            expect(res.body.detail).to.equal("Duplicate user in grant array")
        })

        it('Set all properties of a Collection- with metadata',async function () {

            const putRequest = {
                name: "TestPutCollection",
                settings: {
                fields: {
                    detail: {
                    enabled: "findings",
                    required: "findings",
                    },
                    comment: {
                    enabled: "always",
                    required: "findings",
                    },
                },
                status: {
                    canAccept: true,
                    minAcceptGrant: 2,
                    resetCriteria: "result",
                },
                },

                description: "hellodescription",
                metadata: {
                [reference.testCollection.metadataKey]: reference.testCollection.metadataValue,
                },
                grants: [
                {
                    userId: "1",
                    accessLevel: 4,
                },
                {
                    userId: "21",
                    accessLevel: 2,
                },
                {
                    userId: "44",
                    accessLevel: 3,
                },
                {
                    userId: "45",
                    accessLevel: 4,
                },
                {
                    userId: "87",
                    accessLevel: 4,
                },
                ],
            }
      
            const res = await chai.request(config.baseUrl)
                .put(`/collections/${reference.testCollection.collectionId}?projection=grants&projection=owners&projection=statistics&projection=stigs&projection=assets`)
                .set('Authorization', `Bearer ${iteration.token}`)
                .send(putRequest    )
            if(distinct.canModifyCollection === false){ 
              expect(res).to.have.status(403)
              return
            } 
            expect(res).to.have.status(200)
            expect(res.body.description).to.equal("hellodescription")
            expect(res.body.name).to.equal("TestPutCollection")
            expect(res.body.settings.fields.detail.enabled).to.equal(putRequest.settings.fields.detail.enabled)
            expect(res.body.settings.fields.detail.required).to.equal(putRequest.settings.fields.detail.required)
            expect(res.body.settings.fields.comment.enabled).to.equal(putRequest.settings.fields.comment.enabled)
            expect(res.body.settings.fields.comment.required).to.equal(putRequest.settings.fields.comment.required)
            expect(res.body.settings.status.canAccept).to.equal(putRequest.settings.status.canAccept)
            expect(res.body.settings.status.minAcceptGrant).to.equal(putRequest.settings.status.minAcceptGrant)
            expect(res.body.settings.status.resetCriteria).to.equal(putRequest.settings.status.resetCriteria)
            expect(res.body.metadata.testkey).to.equal(reference.testCollection.metadataValue)

            // grants projection
            expect(res.body.grants).to.have.lengthOf(5)
            for(const grant of res.body.grants){
              expect(grant.user.userId).to.be.oneOf(putRequest.grants.map(g => g.userId))
            }
        
            // assets projection
            expect(res.body.assets).to.have.lengthOf(4)

            // owners projection
            expect(res.body.owners).to.have.lengthOf(3)

            // statistics projection
            expect(res.body.statistics.assetCount).to.equal(4)
            expect(res.body.statistics.checklistCount).to.equal(6)
            //expect(res.body.statistics.grantCount).to.equal(5)

            // stigs projection
            expect(res.body.stigs).to.have.lengthOf(2)

        })
      })

      describe('putCollectionMetadata - /collections/{collectionId}/metadata', function () {

        it('Set all metadata of a Collection',async function () {

            const putRequest = {
                [reference.testCollection.metadataKey]: reference.testCollection.metadataValue
            }

            const res = await chai.request(config.baseUrl)
                .put(`/collections/${reference.testCollection.collectionId}/metadata`)
                .set('Authorization', `Bearer ${iteration.token}`)
                .send(putRequest)

              if(distinct.canModifyCollection === false){
                expect(res).to.have.status(403)
                return
              }
              expect(res).to.have.status(200)
            expect(res.body[reference.testCollection.metadataKey]).to.equal(reference.testCollection.metadataValue)
        })
      })

      describe('putCollectionMetadataValue - /collections/{collectionId}/metadata/keys/{key}', function () {

        it('Set one metadata key/value of a Collection',async function () {
          const res = await chai.request(config.baseUrl)
            .put(`/collections/${reference.testCollection.collectionId}/metadata/keys/${reference.testCollection.collectionMetadataKey}`)
            .set('Authorization', `Bearer ${iteration.token}`)
            .set('Content-Type', 'application/json') 
            .send(`${JSON.stringify(reference.testCollection.collectionMetadataValue)}`)

          if(distinct.canModifyCollection === false){
            expect(res).to.have.status(403)
            return
          }
          expect(res).to.have.status(204)
        })
      })

      describe('setReviewAclByCollectionUser - /collections/{collectionId}/grants/user/{userId}/access', function () {

        it(`should set all users acls to all []`, async () => {
          const res = await chai.request(config.baseUrl)
          .put(`/collections/${reference.testCollection.collectionId}/grants/user/${iteration.userId}/access`)
          .set('Authorization', `Bearer ${iteration.token}`)
          .send([])
          if(distinct.canModifyCollection === false){
            expect(res).to.have.status(403)
            return
          }
          expect(res).to.have.status(200)
          expect(res.body.defaultAccess).to.equal(distinct.defaultAccess)
          //expect(res.body.acl).to.deep.equalInAnyOrder([])
        })

        it(`should set all users acls to the same thing. will use admin token for all `, async () => {
          const res = await chai.request(config.baseUrl)
          .put(`/collections/${reference.testCollection.collectionId}/grants/user/${iteration.userId}/access`)
          .set('Authorization', `Bearer ${iterations[0].token}`)
          .send([{"labelId":reference.testCollection.fullLabel,"access":"r"},{"benchmarkId":reference.testCollection.benchmark,"access":"r"}])

          if(iteration.name === "collectioncreator" || iteration.name === "lvl1" ){
            expect(res).to.have.status(422)
            return
          }
          expect(res).to.have.status(200)
          expect(res.body.defaultAccess).to.equal(distinct.defaultAccess)
          expect(res.body.acl).to.deep.equalInAnyOrder([
            {
              label: {
                name: "test-label-full",
                color: "FF99CC",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002"
              },
              access: "r"
            },
            {
              access: "r",
              benchmarkId: "VPN_SRG_TEST"
            }
          ])
        })

        it(`should set all users acls to read only on test full label `, async () => {
          const res = await chai.request(config.baseUrl)
          .put(`/collections/${reference.testCollection.collectionId}/grants/user/${iteration.userId}/access`)
          .set('Authorization', `Bearer ${iterations[0].token}`)
          .send([{"labelId":reference.testCollection.fullLabel,"access":"r"}])
          // these users do not have direct grant to the collection
          if(iteration.name === "collectioncreator" || iteration.name === "lvl1" ){
            expect(res).to.have.status(422)
            return
          }
          expect(res).to.have.status(200)
          expect(res.body.defaultAccess).to.equal(distinct.defaultAccess)
          expect(res.body.acl).to.deep.equalInAnyOrder([
            {
              label: {
                name: "test-label-full",
                color: "FF99CC",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002"
              },
              access: "r"
            }
          ])
        })
      })

      describe('setGrantByCollectionUserGroup - /collections/{collectionId}/grants/user-group/{userGroupId}', function () {

        before(async function () {
          await utils.loadAppData()
        })
        

        it("should update test group's access level to 3c (updating exisiting group)", async function () {

          const res = await chai.request(config.baseUrl)
            .put(`/collections/${reference.testCollection.collectionId}/grants/user-group/${reference.testCollection.testGroup.userGroupId}`)
              .set('Authorization', `Bearer ${iteration.token}`)
              .send({
                "accessLevel": 3
              })
          if(distinct.canModifyCollection === false){
            expect(res).to.have.status(403)
            return
          }
          expect(res).to.have.status(200)
          expect(res.body.accessLevel).to.equal(3)
          expect(res.body.userGroupId).to.equal(reference.testCollection.testGroup.userGroupId)
        })

        it("should create a temp group so we can test a new access level assignment for a 201", async function () {

          const create = await chai.request(config.baseUrl)
            .post(`/user-groups?elevate=true`)
              .set('Authorization', `Bearer ${iteration.token}`)
              .send({
                  "name": "temp" + utils.getUUIDSubString(20),
                  "description": "test",
                  "userIds": [
                    reference.lvl1User.userId
                  ]
              })
            if(iteration.name !== "stigmanadmin"){
              expect(create).to.have.status(403)
              return
            }
            expect(create).to.have.status(201)

            const editresponse = await chai.request(config.baseUrl)
              .put(`/collections/${reference.testCollection.collectionId}/grants/user-group/${create.body.userGroupId}`)
                .set('Authorization', `Bearer ${iteration.token}`)
                .send({
                  "accessLevel": 3
                })
            if(distinct.canModifyCollection === false){
              expect(editresponse).to.have.status(403)
              return
            }
            expect(editresponse).to.have.status(201)
            expect(editresponse.body.accessLevel).to.equal(3)
            expect(editresponse.body.userGroupId).to.equal(create.body.userGroupId)
        })

        it("should throw 422 error, because groupId does not exist. ", async function () {

          const res = await chai.request(config.baseUrl)
            .put(`/collections/${reference.testCollection.collectionId}/grants/user-group/${"1234321"}`)
              .set('Authorization', `Bearer ${iteration.token}`)
              .send({
                "accessLevel": 3
              })
          if(distinct.canModifyCollection === false){
            expect(res).to.have.status(403)
            return
          }
          expect(res).to.have.status(422)
        })
      })

      describe('setReviewAclByCollectionUserGroup - /collections/{collectionId}/grants/user-group/{userGroupId}/access', function () {

        before(async function () {
          await utils.loadAppData()
        })

        it(`should set all user groups acls to all []`, async () => {
          const res = await chai.request(config.baseUrl)
          .put(`/collections/${reference.testCollection.collectionId}/grants/user-group/${reference.testCollection.testGroup.userGroupId}/access`)
          .set('Authorization', `Bearer ${iteration.token}`)
          .send(requestBodies.putGroupAcl)
          if(distinct.canModifyCollection === false){
            expect(res).to.have.status(403)
            return
          }
          expect(res).to.have.status(200)
          expect(res.body.defaultAccess).to.equal(reference.testCollection.testGroup.defaultAccess)
          expect(res.body.acl).to.be.lengthOf(2)
          for(const item of res.body.acl){
            if(item.assetId){
              expect(item.assetId).to.be.equal("62")
              expect(item.access).to.be.equal("rw") 
            }
            else if(item.benchmarkId){
              expect(item.benchmarkId).to.be.equal("VPN_SRG_TEST")
              expect(item.access).to.be.equal("rw") 
            }
          }
        })

        it("should throw 422 error, because groupId does not exist. ", async function () {

          const res = await chai.request(config.baseUrl)
            .put(`/collections/${reference.testCollection.collectionId}/grants/user-group/${"1234321"}/access`)
              .set('Authorization', `Bearer ${iteration.token}`)
              .send(requestBodies.putGroupAcl)
          if(distinct.canModifyCollection === false){
            expect(res).to.have.status(403)
            return
          }
          expect(res).to.have.status(422)
        })

        it("Should throw 403 because collectionId does not exist", async function () {

          const res = await chai.request(config.baseUrl)
            .put(`/collections/${"1234321"}/grants/user-group/${reference.testCollection.testGroup.userGroupId}/access`)
            .set('Authorization', `Bearer ${iteration.token}`)
            .send(requestBodies.putGroupAcl)
          expect(res).to.have.status(403)
        })
      })

      describe('setGrantByCollectionUser - /collections/{collectionId}/grants/user/{userId}', function () {

        before(async function () {
          await utils.loadAppData()
        })

        it('set stig-asset grants for a lvl1 user in this collection. user does not have a direct grant to the colleciton',async function () {

          it("should throw SmError.Unprocessable Entity when attempting to set asset stig for a user that does not exist with access level 1",async function () {
            const res = await chai.request(config.baseUrl)
            .put(`/collections/${reference.testCollection.collectionId}/grants/user/${"1234321"}`)
                .set('Authorization', `Bearer ${iteration.token}`)
                .send({
                  "accessLevel": 1
                })
              if(distinct.grant === "none"){
                expect(res).to.have.status(403)
                return
              }
              expect(res).to.have.status(404)
              expect(res.body.error).to.equal("Resource not found.")
              expect(res.body.detail).to.equal("User not found")
          })

          const res = await chai.request(config.baseUrl)
              .put(`/collections/${reference.testCollection.collectionId}/grants/user/${reference.lvl1User.userId}`)
              .set('Authorization', `Bearer ${iteration.token}`)
              .send({
                "accessLevel": 1
              })

            if (distinct.grant === "none" || distinct.canModifyCollection === false){
              expect(res).to.have.status(403)
              return
            }
            expect(res).to.have.status(201) 
            expect(res.body.accessLevel).to.equal(1)
            expect(res.body.userId).to.equal(reference.lvl1User.userId)
            for(const grant of res.body.grantees){
              expect(grant.userId).to.equal(reference.lvl1User.userId)
              expect(grant.username).to.equal(reference.lvl1User.username)
            }
        })
        it('set grant for a lvl1 user in this collection but only use admin token to test lvl1, lvl2 and collection creator.',async function () {
          const res = await chai.request(config.baseUrl)
              .put(`/collections/${reference.testCollection.collectionId}/grants/user/${reference.lvl1User.userId}`)
              .set('Authorization', `Bearer ${iterations[0].token}`)
              .send({
                "accessLevel": 1
              })
          if (distinct.grant === "none" || distinct.canModifyCollection === false){
            expect(res).to.have.status(201)
          }
          else {
            expect(res).to.have.status(200)
          }
          expect(res.body.accessLevel).to.equal(1)
          expect(res.body.userId).to.equal(reference.lvl1User.userId)
          for(const grant of res.body.grantees){
            expect(grant.userId).to.equal(reference.lvl1User.userId)
            expect(grant.username).to.equal(reference.lvl1User.username)
          }
        })
      })

      describe("putGrantByCollectionGrant - /collections/{collectionId}/grants/{grantId}", function () {
        
        before(async function () {
          await utils.loadAppData()
        })

        it("should replace access level and keep the same user of the test group in the test colleciton", async function () {
          
          const res = await chai.request(config.baseUrl)
          .put(`/collections/${reference.testCollection.collectionId}/grants/${reference.testCollection.testGroup.testCollectionGrantId}`)
          .set('Authorization', `Bearer ${iteration.token}`)
          .send({
            "userId": reference.lvl1User.userId,
            "accessLevel": 1
          })
          if(distinct.canModifyCollection === false){
            expect(res).to.have.status(403)
            return
          }
          expect(res).to.have.status(200)
          expect(res.body.user.userId).to.equal(reference.lvl1User.userId)
          expect(res.body.accessLevel).to.equal(1)
          expect(res.body.grantId).to.equal(reference.testCollection.testGroup.testCollectionGrantId)
        })

        it("should replace access level and user of the test group in the test colleciton", async function () {

          const res = await chai.request(config.baseUrl)
          .put(`/collections/${reference.testCollection.collectionId}/grants/${reference.testCollection.testGroup.testCollectionGrantId}`)
          .set('Authorization', `Bearer ${iteration.token}`)
          .send({
            "userGroupId": "1",
            "accessLevel": 2
          })
          if(distinct.canModifyCollection === false){
            expect(res).to.have.status(403)
            return
          }
          expect(res).to.have.status(200)
          expect(res.body.userGroup.userGroupId).to.equal(reference.testCollection.testGroup.userGroupId)
          expect(res.body.accessLevel).to.equal(2)
          expect(res.body.grantId).to.equal(reference.testCollection.testGroup.testCollectionGrantId)
        })

      })
    })
  }
})
