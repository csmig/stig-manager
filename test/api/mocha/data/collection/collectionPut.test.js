
const { expect } = chai
import {config } from '../../testConfig.js'
import * as utils from '../../utils/testUtils.js'
import reference from '../../referenceData.js'
import {requestBodies} from "./requestBodies.js"
import {iterations} from '../../iterations.js'
import {expectations} from './expectations.js'

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
            const res = await chai.request.execute(config.baseUrl)
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
          const res = await chai.request.execute(config.baseUrl)
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
      
            const res = await chai.request.execute(config.baseUrl)
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

            const res = await chai.request.execute(config.baseUrl)
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
          const res = await chai.request.execute(config.baseUrl)
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

      describe("putGrantByCollectionGrant - /collections/{collectionId}/grants/{grantId}", function () {
        
        before(async function () {
          await utils.loadAppData()
        })

        it("should replace access level and keep the same user in the test group in the test colleciton, not elevated", async function () {
          
          const res = await chai.request.execute(config.baseUrl)
          .put(`/collections/${reference.testCollection.collectionId}/grants/${reference.testCollection.testGroup.testCollectionGrantId}`)
          .set('Authorization', `Bearer ${iteration.token}`)
          .send({
            "userGroupId": reference.testCollection.testGroup.userGroupId,
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

        it("should replace access level and user of the test group grant id in the test colleciton,  elevated only stigmanadmin success", async function () {

          const res = await chai.request.execute(config.baseUrl)
          .put(`/collections/${reference.testCollection.collectionId}/grants/${reference.testCollection.testGroup.testCollectionGrantId}?elevate=true`)
          .set('Authorization', `Bearer ${iteration.token}`)
          .send({
            "userId": reference.wfTest.userId,
            "accessLevel": 1
          })
          if(iteration.name !== "stigmanadmin"){
            expect(res).to.have.status(403)
            return
          }
          expect(res).to.have.status(200)
          expect(res.body.user.userId).to.equal(reference.wfTest.userId)
          expect(res.body.grantId).to.equal(reference.testCollection.testGroup.testCollectionGrantId)
        })

        it("should throw error, the user does not have grant to the collection ", async function () {

          const res = await chai.request.execute(config.baseUrl)
          .put(`/collections/${reference.scrapCollection.collectionId}/grants/${reference.testCollection.testGroup.testCollectionGrantId}`)
          .set('Authorization', `Bearer ${iteration.token}`)
          .send({
            "userId": reference.lvl1User.userId,
            "accessLevel": 1
          })
          if(distinct.canModifyCollection === false){
            expect(res).to.have.status(403)
            return
          }
          expect(res).to.have.status(404)
        })
      })

      it("should throw error, the user has < 4 access level and is attempting to modified an existing owners grant. ", async function () {

        const res = await chai.request.execute(config.baseUrl)
        .put(`/collections/${reference.testCollection.collectionId}/grants/${reference.adminBurke.testCollectionGrantId}`)
        .set('Authorization', `Bearer ${iterations[1].token}`)
        .send({
          "userId": reference.adminBurke.userId,
          "accessLevel": 2
        })
        if(distinct.accessLevel !== 4){
          expect(res).to.have.status(403)
          return
        }
        expect(res).to.have.status(403)
      })

      describe('putAclRulesByCollectionGrant - /collections/{collectionId}/grants/{grantId}/acl', function () {

        before(async function () {
          await utils.loadAppData()
        })

        it('Set all ACL rules of a Collection',async function () {

            const res = await chai.request.execute(config.baseUrl)
                .put(`/collections/${reference.testCollection.collectionId}/grants/${reference.testCollection.testGroup.testCollectionGrantId}/acl`)
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

          const res = await chai.request.execute(config.baseUrl)
          .put(`/collections/${reference.testCollection.collectionId}/grants/${"1234321"}/acl`)
              .set('Authorization', `Bearer ${iteration.token}`)
              .send(requestBodies.putGroupAcl)
          if(distinct.canModifyCollection === false){
            expect(res).to.have.status(403)
            return
          }
          expect(res).to.have.status(404)
        })

        it("Should throw 403 because collectionId does not exist", async function () {

          const res = await chai.request.execute(config.baseUrl)
          .put(`/collections/${1234321}/grants/${reference.testCollection.testGroup.testCollectionGrantId}/acl`)
            .set('Authorization', `Bearer ${iteration.token}`)
            .send(requestBodies.putGroupAcl)
          expect(res).to.have.status(403)
        })
      })
    })
  }
})
