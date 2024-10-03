const chai = require('chai')
const deepEqualInAnyOrder = require('deep-equal-in-any-order')
const chaiHttp = require('chai-http')
chai.use(chaiHttp)
chai.use(deepEqualInAnyOrder)
const expect = chai.expect
const config = require('../../testConfig.json')
const utils = require('../../utils/testUtils.js')
const expectations = require('./aclData.js')
const reference = require('./referenceData.js')
const requestBodies = require('./aclData.js')
const iterations = require('./iterations.js')
//const distinct = require('./expectations.js')

const user = {
    name: 'lvl1',
    userId: '85', 
    token:
    'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJGSjg2R2NGM2pUYk5MT2NvNE52WmtVQ0lVbWZZQ3FvcXRPUWVNZmJoTmxFIn0.eyJleHAiOjE4NjQ3MDg5ODQsImlhdCI6MTY3MDU2ODE4NCwiYXV0aF90aW1lIjoxNjcwNTY4MTg0LCJqdGkiOiIxMDhmMDc2MC0wYmY5LTRkZjEtYjE0My05NjgzNmJmYmMzNjMiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvYXV0aC9yZWFsbXMvc3RpZ21hbiIsImF1ZCI6WyJyZWFsbS1tYW5hZ2VtZW50IiwiYWNjb3VudCJdLCJzdWIiOiJlM2FlMjdiOC1kYTIwLTRjNDItOWRmOC02MDg5ZjcwZjc2M2IiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJzdGlnLW1hbmFnZXIiLCJub25jZSI6IjE0ZmE5ZDdkLTBmZTAtNDQyNi04ZmQ5LTY5ZDc0YTZmMzQ2NCIsInNlc3Npb25fc3RhdGUiOiJiNGEzYWNmMS05ZGM3LTQ1ZTEtOThmOC1kMzUzNjJhZWM0YzciLCJhY3IiOiIxIiwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImRlZmF1bHQtcm9sZXMtc3RpZ21hbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7InJlYWxtLW1hbmFnZW1lbnQiOnsicm9sZXMiOlsidmlldy11c2VycyIsInF1ZXJ5LWdyb3VwcyIsInF1ZXJ5LXVzZXJzIl19LCJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6Im9wZW5pZCBzdGlnLW1hbmFnZXI6Y29sbGVjdGlvbiBzdGlnLW1hbmFnZXI6c3RpZzpyZWFkIHN0aWctbWFuYWdlcjp1c2VyOnJlYWQgc3RpZy1tYW5hZ2VyOmNvbGxlY3Rpb246cmVhZCIsInNpZCI6ImI0YTNhY2YxLTlkYzctNDVlMS05OGY4LWQzNTM2MmFlYzRjNyIsIm5hbWUiOiJyZXN0cmljdGVkIiwicHJlZmVycmVkX3VzZXJuYW1lIjoibHZsMSIsImdpdmVuX25hbWUiOiJyZXN0cmljdGVkIn0.OqLARi5ILt3j2rMikXy0ECTTqjWco0-CrMwzE88gUv2i8rVO9kMgVsXbtPk2L2c9NNNujnxqg7QIr2_sqA51saTrZHvzXcsT8lBruf74OubRMwcTQqJap-COmrzb60S7512k0WfKTYlHsoCn_uAzOb9sp8Trjr0NksU8OXCElDU'
}

describe('GET - Test Effective ACL', () => {

  for(const iteration of iterations){
    // if (expectations[iteration.name] === undefined){
    //   it(`No expectations for this iteration scenario: ${iteration.name}`, async function () {})
    //   continue
    // }
    describe(`iteration:${iteration.name}`, () => {
      //const distinct = expectations[iteration.name]

      describe(`getEffectiveAclByCollectionUser - /collection/{collectionId}/grants/user/{userId}/access/effective`, () => {

        it(`should set lvl1 users ACL: ${iteration.name}`, async () => {
          const res = await chai.request(config.baseUrl)
          .put(`/collections/${reference.testCollection.collectionId}/grants/user/${user.userId}/access`)
          .set('Authorization', `Bearer ${config.adminToken}`)
          .send(requestBodies[iteration.name].put)

          expect(res).to.have.status(200)
          expect(res.body.defaultAccess).to.equal("none")
          expect(res.body.acl).to.be.an('array').of.length(requestBodies[iteration.name].put.length)
          // for (const aclPut of requestBodies[iteration.name]) {
          //   const matchingAcl = res.body.acl.find(responseAcl => {
          //     const assetMatch = aclPut.assetId ? responseAcl.asset.assetId === aclPut.assetId : true
          //     const benchmarkMatch = aclPut.benchmarkId ? responseAcl.benchmarkId === aclPut.benchmarkId : true
          //     const labelMatch = aclPut.labelId ? responseAcl.label.labelId === aclPut.labelId : true
          //     const accessMatch = aclPut.access ? responseAcl.access === aclPut.access : true
          
          //     return assetMatch && benchmarkMatch && labelMatch && accessMatch
          //   })
          //   expect(matchingAcl).to.exist
          // }
        })

        it('should return 200 and the effective acl for the iteration', async () => {
          const res = await chai.request(config.baseUrl)
          .get(`/collections/${reference.testCollection.collectionId}/grants/user/${user.userId}/access/effective`)
          .set('Authorization', `Bearer ${config.adminToken}`)
          expect(res).to.have.status(200)

          const putAcl = requestBodies[iteration.name].put
          expect(res.body).to.deep.equalInAnyOrder(requestBodies[iteration.name].response)
      
        })
      })
    })
  }
})

