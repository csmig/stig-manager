const chai = require('chai')
const deepEqualInAnyOrder = require('deep-equal-in-any-order')
const chaiHttp = require('chai-http')
chai.use(chaiHttp)
chai.use(deepEqualInAnyOrder)
const { v4: uuidv4 } = require('uuid')
const expect = chai.expect
const config = require('../../testConfig.json')
const utils = require('../../utils/testUtils.js')
const reference = require('./referenceData.js')
//const requestBodies = require('./aclData.js')
const iterations = require('./groupIterations.js')

const user = {
    name: 'lvl1',
    userId: '85', 
    token:
    'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJGSjg2R2NGM2pUYk5MT2NvNE52WmtVQ0lVbWZZQ3FvcXRPUWVNZmJoTmxFIn0.eyJleHAiOjE4NjQ3MDg5ODQsImlhdCI6MTY3MDU2ODE4NCwiYXV0aF90aW1lIjoxNjcwNTY4MTg0LCJqdGkiOiIxMDhmMDc2MC0wYmY5LTRkZjEtYjE0My05NjgzNmJmYmMzNjMiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvYXV0aC9yZWFsbXMvc3RpZ21hbiIsImF1ZCI6WyJyZWFsbS1tYW5hZ2VtZW50IiwiYWNjb3VudCJdLCJzdWIiOiJlM2FlMjdiOC1kYTIwLTRjNDItOWRmOC02MDg5ZjcwZjc2M2IiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJzdGlnLW1hbmFnZXIiLCJub25jZSI6IjE0ZmE5ZDdkLTBmZTAtNDQyNi04ZmQ5LTY5ZDc0YTZmMzQ2NCIsInNlc3Npb25fc3RhdGUiOiJiNGEzYWNmMS05ZGM3LTQ1ZTEtOThmOC1kMzUzNjJhZWM0YzciLCJhY3IiOiIxIiwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImRlZmF1bHQtcm9sZXMtc3RpZ21hbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7InJlYWxtLW1hbmFnZW1lbnQiOnsicm9sZXMiOlsidmlldy11c2VycyIsInF1ZXJ5LWdyb3VwcyIsInF1ZXJ5LXVzZXJzIl19LCJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6Im9wZW5pZCBzdGlnLW1hbmFnZXI6Y29sbGVjdGlvbiBzdGlnLW1hbmFnZXI6c3RpZzpyZWFkIHN0aWctbWFuYWdlcjp1c2VyOnJlYWQgc3RpZy1tYW5hZ2VyOmNvbGxlY3Rpb246cmVhZCIsInNpZCI6ImI0YTNhY2YxLTlkYzctNDVlMS05OGY4LWQzNTM2MmFlYzRjNyIsIm5hbWUiOiJyZXN0cmljdGVkIiwicHJlZmVycmVkX3VzZXJuYW1lIjoibHZsMSIsImdpdmVuX25hbWUiOiJyZXN0cmljdGVkIn0.OqLARi5ILt3j2rMikXy0ECTTqjWco0-CrMwzE88gUv2i8rVO9kMgVsXbtPk2L2c9NNNujnxqg7QIr2_sqA51saTrZHvzXcsT8lBruf74OubRMwcTQqJap-COmrzb60S7512k0WfKTYlHsoCn_uAzOb9sp8Trjr0NksU8OXCElDU'
}

describe('GET- getEffectiveAclByCollectionUser - /collection/{collectionId}/grants/user/{userId}/access/effective - Test Effective ACL from Group Grant', () => {

  before(async () => {
    await utils.loadAppData()
  })

  let userGroup

  it('should create a test user group with lvl1 user in it.', async () => {
    const res = await chai
        .request(config.baseUrl)
        .post(`/user-groups?elevate=true&projection=collections`)
        .set('Authorization', 'Bearer ' + config.adminToken)
        .send({
          "name": "IterationTestgroup",
          "description": "test group",
          "userIds": [
            user.userId   
          ]
      })
      userGroup = res.body
      expect(res).to.have.status(201)
      expect(res.body.collections).to.be.empty
     
  })

  it("should delete lvl1 users direct grant to test collection", async () => {

    const res = await chai.request(config.baseUrl)
      .delete(`/collections/${reference.testCollection.collectionId}/grants/user/${user.userId}`)
      .set('Authorization', `Bearer ${config.adminToken}`)
    expect(res).to.have.status(200)

  })

  it("should assign group created to the test collection with restricted grant", async function () {

    const res = await chai.request(config.baseUrl)
    .put(`/collections/${reference.testCollection.collectionId}/grants/user-group/${userGroup.userGroupId}`)
    .set('Authorization', `Bearer ${config.adminToken}`)
    .send({
      accessLevel: 1
    })
    expect(res).to.have.status(201)
    expect(res.body.accessLevel).to.equal(1)
  })

  for(const iteration of iterations){
 
    describe(`iteration:${iteration.name}`, () => {
      
      it(`should set test groups ACL: ${iteration.name}`, async () => {
        const res = await chai.request(config.baseUrl)
        .put(`/collections/${reference.testCollection.collectionId}/grants/user-group/${userGroup.userGroupId}/access`)
        .set('Authorization', `Bearer ${config.adminToken}`)
        .send(iteration.put)

        expect(res).to.have.status(200)
        expect(res.body.defaultAccess).to.equal("none")
      })

      it("should confirm group acl was set", async () => {
        const res = await chai.request(config.baseUrl)
          .get(`/collections/${reference.testCollection.collectionId}/grants/user-group/${userGroup.userGroupId}/access`)
          .set('Authorization', `Bearer ${config.adminToken}`)
        expect(res).to.have.status(200)
        expect(res.body.defaultAccess).to.equal("none")
        expect(res.body.acl.length).to.equal(iteration.put.length)
        
        for (const acl of iteration.put) {
          // Look for an exact match in res.body.acl that satisfies all specified conditions
          const exactMatch = res.body.acl.find(a => 
            (acl.assetId ? a.asset?.assetId === acl.assetId : true) &&
            (acl.labelId ? a.label?.labelId === acl.labelId : true) &&
            (acl.benchmarkId ? a.benchmarkId === acl.benchmarkId : true) &&
            (acl.access ? a.access === acl.access : true)
          )
          // Check if an exact match was found
          expect(exactMatch).to.not.be.undefined
        
          // Verify each specified field to ensure full match
          if (acl.assetId) {
            expect(exactMatch.asset.assetId).to.equal(acl.assetId)
          }
          if (acl.labelId) {
            expect(exactMatch.label.labelId).to.equal(acl.labelId)
          }
          if (acl.benchmarkId) {
            expect(exactMatch.benchmarkId).to.equal(acl.benchmarkId)
          }
          if (acl.access) {
            expect(exactMatch.access).to.equal(acl.access)
          }
        }
      })

      it('should return 200 and the effective acl for the iteration', async () => {
        const res = await chai.request(config.baseUrl)
        .get(`/collections/${reference.testCollection.collectionId}/grants/user/${user.userId}/access/effective`)
        .set('Authorization', `Bearer ${config.adminToken}`)
        expect(res).to.have.status(200)

        const putAcl = iteration.put
        expect(res.body).to.deep.equalInAnyOrder(iteration.response)
      })
    })
  }
})
