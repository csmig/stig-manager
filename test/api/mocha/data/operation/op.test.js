const chai = require('chai')
const chaiHttp = require('chai-http')
chai.use(chaiHttp)
const expect = chai.expect
const config = require('../../testConfig.json')
const utils = require('../../utils/testUtils.js')
const iterations = require('../../iterations.js')

describe('GET - Op', () => {
  let disabledCollection
  before(async function () {
    this.timeout(4000)
    await utils.uploadTestStigs()
    await utils.loadAppData()
    ;({collection: disabledCollection} = await utils.createDisabledCollectionsandAssets())
  })

  for(const iteration of iterations){
    describe(`iteration:${iteration.name}`, () => {
      describe('getAppData - /op/appdata', () => {
        it('Export application data', async () => {
        const res = await chai.request(config.baseUrl)
            .get(`/op/appdata?elevate=true`)
            .set('Authorization', `Bearer ${iteration.token}`)
        if(iteration.name !== "stigmanadmin"){
          expect(res).to.have.status(403)
          return
        }
        expect(res).to.have.status(200)
        })
      })
      describe('getConfiguration - /op/configuration', () => {
        it('Return API version and configuration information', async () => {
        const res = await chai.request(config.baseUrl)
            .get(`/op/configuration`)
            .set('Authorization', `Bearer ${iteration.token}`)
        expect(res).to.have.status(200)
        })
        it('delate alter test', async () => {
          const res = await chai.request(config.baseUrl)
              .get(`/op/configuration`)
              .set('Authorization', `Bearer ${iteration.token}`)
          expect(res).to.have.status(200)
          })
      })
      describe('getAppInfo - /op/appinfo', () => {
        it('Return API Deployment Details', async () => {
          const res = await chai.request(config.baseUrl)
              .get(`/op/appinfo?elevate=true`)
              .set('Authorization', `Bearer ${iteration.token}`)
          if(iteration.name !== "stigmanadmin"){
            expect(res).to.have.status(403)
            return
          }
          expect(res).to.have.status(200)
          expect(res.body).to.be.an('object')
          expect(res.body).to.nested.include({
            schema: 'stig-manager-appinfo-v1.0',
            'collections.21.assets': 4,
            'collections.21.assetsDisabled': 1,
            'collections.21.reviews': 17,
            'collections.21.reviewsDisabled': 1,
            [`collections.${disabledCollection.collectionId}.state`]: 'disabled'
          })
        })
      })
      describe('getDefinition - /op/definition', () => {
        it('Return API Deployment Definition', async () => {
        const res = await chai.request(config.baseUrl)
            .get(`/op/definition`)
            .set('Authorization', `Bearer ${iteration.token}`)
        expect(res).to.have.status(200)
        })
      })
    })
  }
})