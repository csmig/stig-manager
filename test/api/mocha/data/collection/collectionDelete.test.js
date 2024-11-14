const chai = require('chai')
const chaiHttp = require('chai-http')
const { v4: uuidv4 } = require('uuid');
chai.use(chaiHttp)
const expect = chai.expect
const deepEqualInAnyOrder = require('deep-equal-in-any-order')
chai.use(deepEqualInAnyOrder)
const config = require('../../testConfig.json')
const utils = require('../../utils/testUtils')
const iterations = require('../../iterations')
const expectations = require('./expectations')
const reference = require('../../referenceData.js')
const requestBodies = require('./requestBodies')

describe('DELETE - Collection ', function () {

  let tempCollection = null

  for(const iteration of iterations){
    
    if (expectations[iteration.name] === undefined){
      it(`No expectations for this iteration scenario: ${iteration.name}`,async function () {})
      continue
    }

    describe(`iteration:${iteration.name}`, function () {
      const distinct = expectations[iteration.name]

      describe('deleteCollection - /collections/{collectionId}', function () {

        before(async function () {
          const testCollectionClone  = JSON.parse(JSON.stringify(requestBodies.resetTestCollection))
          testCollectionClone.name = `Collection ` + utils.getUUIDSubString()
          tempCollection = await utils.createTempCollection(testCollectionClone)
        })

        it('Delete tempCollection collection (stigmanadmin only)',async function () {
          const res = await chai.request(config.baseUrl)
              .delete(`/collections/${tempCollection.data.collectionId}`)
              .set('Authorization', `Bearer ${iteration.token}`)

          if(distinct.canDeleteCollection === false){ 
            expect(res).to.have.status(403)
            return
          }
          expect(res).to.have.status(200)

          expect(res.body.collectionId).to.equal(tempCollection.data.collectionId)

          //confirm that it is deleted
          const deletedCollection = await utils.getCollection(tempCollection.data.collectionId)
          expect(deletedCollection.status, "expect 403 response (delete worked)").to.equal(403)
        })

      })

      describe('deleteGrantByCollectionUserGroup - /collections/{collectionId}/grants/user-group/{userGroupId}', function () {  

        before(async function () {
          await utils.loadAppData()
        })

        it("it should delete the collection grant for the test user group",async function () {

          const res = await chai.request(config.baseUrl)
              .delete(`/collections/${reference.testCollection.collectionId}/grants/user-group/${reference.testCollection.testGroup.userGroupId}`)
              .set('Authorization', `Bearer ${iteration.token}`)
          if(distinct.canModifyCollection === false){
            expect(res).to.have.status(403)
            return
          }
          expect(res).to.have.status(200)
          expect(res.body.accessLevel).to.equal(1)
          expect(res.body.userGroupId).to.equal(reference.testCollection.testGroup.userGroupId)
        })

        it("should return empty response when deleting a non-existent grant.",async function () {

          const res = await chai.request(config.baseUrl)
              .delete(`/collections/${reference.testCollection.collectionId}/grants/user-group/${"1234321"}`)
              .set('Authorization', `Bearer ${iteration.token}`)
          if(distinct.canModifyCollection === false){
            expect(res).to.have.status(403)
            return
          }
          expect(res).to.have.status(200)
          expect(res.body).to.eql('')
        })

        it("should throw when collectionId is invalid", async function () {

          const res = await chai.request(config.baseUrl)
              .delete(`/collections/${"1234321"}/grants/user-group/${reference.testCollection.testGroup.userGroupId}`)
              .set('Authorization', `Bearer ${iteration.token}`)
          if(distinct.canModifyCollection === false){
            expect(res).to.have.status(403)
            return
          }
          expect(res).to.have.status(403)
        })
      })

      describe('deleteCollectionLabelById - /collections/{collectionId}/labels/{labelId}', function () {

        let tempLabel = null
        beforeEach(async function () {
          const labelPost = JSON.parse(JSON.stringify(requestBodies.recreateCollectionLabel))
          labelPost.name = `Label ` + utils.getUUIDSubString(5)
          tempLabel = await utils.createCollectionLabel(reference.testCollection.collectionId, labelPost)
        })
        it('Delete a scrap collection scrap Label',async function () {
            const res = await chai.request(config.baseUrl)
                .delete(`/collections/${reference.testCollection.collectionId}/labels/${tempLabel.labelId}`)
                .set('Authorization', `Bearer ${iteration.token}`)
            if(distinct.canModifyCollection === false){
                expect(res).to.have.status(403)
                return
            }
            expect(res).to.have.status(204)
            const collection = await utils.getCollection(reference.testCollection.collectionId)
            expect(collection.labels).to.not.include(tempLabel.labelId)
        })
        it("should throw SmError.NotFoundError when deleting a non-existent label.",async function () {
          const labelId = uuidv4()
          const res = await chai.request(config.baseUrl)
              .delete(`/collections/${reference.scrapCollection.collectionId}/labels/${labelId}`)
              .set('Authorization', `Bearer ${iteration.token}`)
          if(distinct.canModifyCollection === false){
              expect(res).to.have.status(403)
              return
          }
          expect(res).to.have.status(404)
          expect(res.body.error).to.equal("Resource not found.")
        })
      })

      describe('deleteCollectionMetadataKey - /collections/{collectionId}/metadata/keys/{key}', function () {

        beforeEach(async function () {
          const res = await utils.putCollection(reference.testCollection.collectionId, requestBodies.resetTestCollection)
        })
        it('Delete a scrap collection Metadata Key',async function () {
            const res = await chai.request(config.baseUrl)
                .delete(`/collections/${reference.testCollection.collectionId}/metadata/keys/${reference.testCollection.collectionMetadataKey}`)
                .set('Authorization', `Bearer ${iteration.token}`)

              if(distinct.canModifyCollection === false){
                expect(res).to.have.status(403)
                return
              }
              expect(res).to.have.status(204)
              const collection = await utils.getCollection(reference.testCollection.collectionId)
              expect(collection.metadata).to.not.have.property(reference.testCollection.collectionMetadataKey)
        })
      })

      describe('deleteReviewHistoryByCollection - /collections/{collectionId}/review-history', function () {

        beforeEach(async function () {
          await utils.loadAppData()
        })

        it('Delete review History records - retentionDate',async function () {
            const res = await chai.request(config.baseUrl)
                .delete(`/collections/${reference.testCollection.collectionId}/review-history?retentionDate=${reference.testCollection.reviewHistory.endDate}`)
                .set('Authorization', `Bearer ${iteration.token}`)
                
            if(distinct.canModifyCollection === false){
              expect(res).to.have.status(403)
              return
            }
  
            expect(res).to.have.status(200)
            expect(res.body.HistoryEntriesDeleted).to.be.equal(reference.testCollection.reviewHistory.deletedEntriesByDate)
        })
        it('Delete review History records - date and assetId',async function () {
            const res = await chai.request(config.baseUrl)
                .delete(`/collections/${reference.testCollection.collectionId}/review-history?retentionDate=${reference.testCollection.reviewHistory.endDate}&assetId=${reference.testCollection.testAssetId}`)
                .set('Authorization', `Bearer ${iteration.token}`)

              if(distinct.canModifyCollection === false){
                expect(res).to.have.status(403)
                return
              }
  
            expect(res).to.have.status(200)
            expect(res.body.HistoryEntriesDeleted).to.be.equal(reference.testCollection.reviewHistory.deletedEntriesByDateAsset)
        })
      })

      describe('deleteGrantByCollectionUser - /collections/{collectionId}/grants/user/{userId}', function () {
          
          beforeEach(async function () {
            await utils.loadAppData()
          })
          it('Delete a grant for a user',async function () {
              const res = await chai.request(config.baseUrl)
                  .delete(`/collections/${reference.testCollection.collectionId}/grants/user/${reference.scrapLvl1User.userId}`)
                  .set('Authorization', `Bearer ${iteration.token}`)
                  
              if(distinct.canModifyCollection === false){
                expect(res).to.have.status(403)
                return
              }
              expect(res).to.have.status(200)
              expect(res.body.accessLevel).to.equal(1)
              for(const grant of res.body.grantees){
                expect(grant.userId).to.equal(reference.scrapLvl1User.userId)
              }
          })

          it("should return 200 when deleting a non-existent grant.",async function () {

            const res = await chai.request(config.baseUrl)
                .delete(`/collections/${reference.testCollection.collectionId}/grants/user/${"1234321"}`)
                .set('Authorization', `Bearer ${iteration.token}`)
            if(distinct.canModifyCollection === false){
              expect(res).to.have.status(403)
              return
            }
            expect(res).to.have.status(200)
          })
      })

      describe('deleteGrantByCollectionGrant - /collections/{collectionId}/grants/{grantId}', function () {

        let tempGrant = 1

        before(async function () {
          await utils.loadAppData()
        })  

        it("create a grant for scrap user in the test collection",async function () {

          const res = await chai.request(config.baseUrl)
              .put(`/collections/${reference.testCollection.collectionId}/grants/user/${reference.scrapLvl1User.userId}`)
              .set('Authorization', `Bearer ${iteration.token}`)
              .send({
                accessLevel: 1
              })
          if(distinct.canModifyCollection === false){
            expect(res).to.have.status(403)
            return
          }
          expect(res).to.have.status(200)
          tempGrant = res.body
        })
        
        it('Delete the grant created by grantId in the test colleciton ',async function () {

            if(tempGrant === 1){
              return
            }
            const res = await chai.request(config.baseUrl)
                .delete(`/collections/${reference.testCollection.collectionId}/grants/${tempGrant.grantIds[0]}`)
                .set('Authorization', `Bearer ${iteration.token}`)
                
            if(distinct.canModifyCollection === false){
              expect(res).to.have.status(403)
              return
            }
            expect(res).to.have.status(200)
            expect(res.body.accessLevel).to.eql(1)
            expect(res.body.grantId).to.eql(`${tempGrant.grantIds[0]}`)
            expect(res.body.user.userId).to.eql(reference.scrapLvl1User.userId)

        })

        it("attempt to delete owner grant expect error",async function () {

          const res = await chai.request(config.baseUrl)
              .delete(`/collections/${reference.testCollection.collectionId}/grants/${reference.adminBurke.userId}`)
              .set('Authorization', `Bearer ${iteration.token}`)
          if(distinct.canModifyCollection === false){
            expect(res).to.have.status(403)
            return
          }
          expect(res).to.have.status(404)
        })

        it("attempt to delete grant that does not exist expect error",async function () {

          const res = await chai.request(config.baseUrl)
              .delete(`/collections/${reference.testCollection.collectionId}/grants/${"54321"}`)
              .set('Authorization', `Bearer ${iteration.token}`)
          if(distinct.canModifyCollection === false){
            expect(res).to.have.status(403)
            return
          }
          expect(res).to.have.status(404)
        })
      })
    })
  }
})

