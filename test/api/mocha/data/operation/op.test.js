
const { expect } = chai
import {config } from '../../testConfig.js'
import * as utils from '../../utils/testUtils.js'
import reference from '../../referenceData.js'
import {iterations} from '../../iterations.js'


describe('GET - Op', () => {
  let disabledCollection
  before(async function () {
    await utils.loadAppData()
  })

  for(const iteration of iterations){
    describe(`iteration:${iteration.name}`, () => {
      describe('getAppData - /op/appdata', () => {
        it('Export application data', async () => {
        const res = await chai.request.execute(config.baseUrl)
            .get(`/op/appdata?format=jsonl&elevate=true`)
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
        const res = await chai.request.execute(config.baseUrl)
            .get(`/op/configuration`)
            .set('Authorization', `Bearer ${iteration.token}`)
        expect(res).to.have.status(200)
        })
        it('delate alter test', async () => {
          const res = await chai.request.execute(config.baseUrl)
              .get(`/op/configuration`)
              .set('Authorization', `Bearer ${iteration.token}`)
          expect(res).to.have.status(200)
          })
      })
      describe('getAppInfo - /op/appinfo', () => {
        it('Return API Deployment Details', async () => {
          const res = await chai.request.execute(config.baseUrl)
              .get(`/op/appinfo?elevate=true`)
              .set('Authorization', `Bearer ${iteration.token}`)
          if(iteration.name !== "stigmanadmin"){
            expect(res).to.have.status(403)
            return
          }
          expect(res).to.have.status(200)
          expect(res.body).to.be.an('object')
          const rtc = reference.testCollection
          expect(res.body).to.nested.include({
            schema: 'stig-manager-appinfo-v1.0',
            [`collections.${rtc.collectionId}.state`]: rtc.appinfo.state,
            [`collections.${rtc.collectionId}.assets`]: rtc.appinfo.assets,
            [`collections.${rtc.collectionId}.assetsDisabled`]: rtc.appinfo.assetsDisabled,
            [`collections.${rtc.collectionId}.reviews`]: rtc.appinfo.reviews,
            [`collections.${rtc.collectionId}.reviewsDisabled`]: rtc.appinfo.reviewsDisabled,
           
          })
        })
      })
      describe('getDefinition - /op/definition', () => {
        it('Return API Deployment Definition', async () => {
        const res = await chai.request.execute(config.baseUrl)
            .get(`/op/definition`)
            .set('Authorization', `Bearer ${iteration.token}`)
        expect(res).to.have.status(200)
        })
      })
    })
  }
})
