const chai = require('chai')
const chaiHttp = require('chai-http')
chai.use(chaiHttp)
const expect = chai.expect
const config = require('../../testConfig.json')
const utils = require('../../utils/testUtils')
const iterations = require('../../iterations.js')
const expectations = require('./expectations.js')
const reference = require('../../referenceData.js')

describe('DELETE - Review', () => {

  before(async function () {
    await utils.loadAppData()
  })
    
  for(const iteration of iterations) {
    if (expectations[iteration.name] === undefined){
      it(`No expectations for this iteration scenario: ${iteration.name}`, async () => {})
      continue
    }
    describe(`iteration:${iteration.name}`, () => {
      const distinct = expectations[iteration.name]
      
      describe('DELETE - deleteReviewByAssetRule - /collections/{collectionId}/reviews/{assetId}/{ruleId}', () => {
        let review = null
        beforeEach(async function () {
          review = await utils.importReview(reference.testCollection.collectionId, reference.testAsset.assetId, reference.testAsset.testRuleId)
          await utils.importReview(reference.testCollection.collectionId, reference.testCollection.lvl1ReadOnlyAssetId, reference.testAsset.testRuleId)
        })
        
        it('Delete a Review', async () => {
          const res = await chai.request(config.baseUrl)
            .delete(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testAsset.testRuleId}?projection=rule&projection=history&projection=stigs`)
            .set('Authorization', `Bearer ${iteration.token}`)

          expect(res).to.have.status(200)
          expect(res.body.assetId).to.equal(reference.testAsset.assetId)
          expect(res.body.rule.ruleId).to.equal(reference.testAsset.testRuleId)
          expect(res.body.stigs).to.be.an('array').of.length(reference.testAsset.testRuleIdStigCount)

          for(const history of res.body.history) {
            expect(history.ruleId).to.equal(reference.testAsset.testRuleId)
          }

          for(const stig of res.body.stigs) { 
            expect(reference.testAsset.validStigs).to.include(stig.benchmarkId)
          }
       
        })

        it("Delete review that is read only for lvl1 user, expect 403 for lvl1 iteration", async () => {

          const res = await chai.request(config.baseUrl)
            .delete(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testCollection.lvl1ReadOnlyAssetId}/${reference.testAsset.testRuleId}`)
            .set('Authorization', `Bearer ${iteration.token}`)

            if(iteration.name === "lvl1") {
            expect(res).to.have.status(403)
          }
          else {
            expect(res).to.have.status(200)
          }
        })
      })

      describe('DELETE - deleteReviewMetadataKey - /collections/{collectionId}/reviews/{assetId}/{ruleId}/metadata/keys/{key}', () => {

        before(async function () {
          review = await utils.importReview(reference.testCollection.collectionId, reference.testAsset.assetId, reference.testAsset.testRuleId)
        })

        it('should create metadata to be deleted', async () => {
          const res = await chai.request(config.baseUrl)
          .put(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}/metadata`)
          .set('Authorization', `Bearer ${iteration.token}`)
          .send({[reference.reviewMetadataKey]: reference.reviewMetadataValue})
          expect(res).to.have.status(200)
          expect(res.body).to.eql({[reference.reviewMetadataKey]: reference.reviewMetadataValue})

        })
        it('Delete one metadata key/value of a Review', async () => {
          const res = await chai.request(config.baseUrl)
            .delete(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testAsset.testRuleId}/metadata/keys/${reference.reviewMetadataKey}`)
            .set('Authorization', `Bearer ${iteration.token}`)
            .send(`${JSON.stringify(reference.reviewMetadataValue)}`)
        
          expect(res).to.have.status(204)
        })
      })
    })
  }
})