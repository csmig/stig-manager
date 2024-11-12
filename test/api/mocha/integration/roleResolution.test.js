
const chai = require("chai")
const chaiHttp = require("chai-http")
const deepEqualInAnyOrder = require('deep-equal-in-any-order')
const { v4: uuidv4 } = require('uuid')
chai.use(chaiHttp)
chai.use(deepEqualInAnyOrder)
const expect = chai.expect
const config = require("../testConfig.json")
const utils = require("../utils/testUtils.js")
const reference = require("../referenceData.js")

const admin = {
  name: "admin",
  grant: "Owner",
  token:
    "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJGSjg2R2NGM2pUYk5MT2NvNE52WmtVQ0lVbWZZQ3FvcXRPUWVNZmJoTmxFIn0.eyJleHAiOjE4NjQ2ODEwMzUsImlhdCI6MTY3MDU0MDIzNiwiYXV0aF90aW1lIjoxNjcwNTQwMjM1LCJqdGkiOiI0N2Y5YWE3ZC1iYWM0LTQwOTgtOWJlOC1hY2U3NTUxM2FhN2YiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvYXV0aC9yZWFsbXMvc3RpZ21hbiIsImF1ZCI6WyJyZWFsbS1tYW5hZ2VtZW50IiwiYWNjb3VudCJdLCJzdWIiOiJiN2M3OGE2Mi1iODRmLTQ1NzgtYTk4My0yZWJjNjZmZDllZmUiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJzdGlnLW1hbmFnZXIiLCJub25jZSI6IjMzNzhkYWZmLTA0MDQtNDNiMy1iNGFiLWVlMzFmZjczNDBhYyIsInNlc3Npb25fc3RhdGUiOiI4NzM2NWIzMy0yYzc2LTRiM2MtODQ4NS1mYmE1ZGJmZjRiOWYiLCJhY3IiOiIwIiwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImNyZWF0ZV9jb2xsZWN0aW9uIiwiZGVmYXVsdC1yb2xlcy1zdGlnbWFuIiwiYWRtaW4iXX0sInJlc291cmNlX2FjY2VzcyI6eyJyZWFsbS1tYW5hZ2VtZW50Ijp7InJvbGVzIjpbInZpZXctdXNlcnMiLCJxdWVyeS1ncm91cHMiLCJxdWVyeS11c2VycyJdfSwiYWNjb3VudCI6eyJyb2xlcyI6WyJtYW5hZ2UtYWNjb3VudCIsIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwidmlldy1wcm9maWxlIl19fSwic2NvcGUiOiJvcGVuaWQgc3RpZy1tYW5hZ2VyOmNvbGxlY3Rpb24gc3RpZy1tYW5hZ2VyOnN0aWc6cmVhZCBzdGlnLW1hbmFnZXI6dXNlcjpyZWFkIHN0aWctbWFuYWdlcjpvcCBzdGlnLW1hbmFnZXI6Y29sbGVjdGlvbjpyZWFkIHN0aWctbWFuYWdlcjpvcDpyZWFkIHN0aWctbWFuYWdlcjp1c2VyIHN0aWctbWFuYWdlciBzdGlnLW1hbmFnZXI6c3RpZyIsInNpZCI6Ijg3MzY1YjMzLTJjNzYtNGIzYy04NDg1LWZiYTVkYmZmNGI5ZiIsIm5hbWUiOiJTVElHTUFOIEFkbWluIiwicHJlZmVycmVkX3VzZXJuYW1lIjoic3RpZ21hbmFkbWluIiwiZ2l2ZW5fbmFtZSI6IlNUSUdNQU4iLCJmYW1pbHlfbmFtZSI6IkFkbWluIn0.a1XwJZw_FIzwMXKo-Dr-n11me5ut-SF9ni7ylX-7t7AVrH1eAqyBxX9DXaxFK0xs6YOhoPsh9NyW8UFVaYgtF68Ps6yzoiqFEeiRXkpN5ygICN3H3z6r-YwanLlEeaYR3P2EtHRcrBtCnt0VEKKbGPWOfeiNCVe3etlp9-NQo44",
}

const lvl1 = {
    name: "lvl1",
    userId: "85",
    token:
      "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJGSjg2R2NGM2pUYk5MT2NvNE52WmtVQ0lVbWZZQ3FvcXRPUWVNZmJoTmxFIn0.eyJleHAiOjE4NjQ3MDg5ODQsImlhdCI6MTY3MDU2ODE4NCwiYXV0aF90aW1lIjoxNjcwNTY4MTg0LCJqdGkiOiIxMDhmMDc2MC0wYmY5LTRkZjEtYjE0My05NjgzNmJmYmMzNjMiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvYXV0aC9yZWFsbXMvc3RpZ21hbiIsImF1ZCI6WyJyZWFsbS1tYW5hZ2VtZW50IiwiYWNjb3VudCJdLCJzdWIiOiJlM2FlMjdiOC1kYTIwLTRjNDItOWRmOC02MDg5ZjcwZjc2M2IiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJzdGlnLW1hbmFnZXIiLCJub25jZSI6IjE0ZmE5ZDdkLTBmZTAtNDQyNi04ZmQ5LTY5ZDc0YTZmMzQ2NCIsInNlc3Npb25fc3RhdGUiOiJiNGEzYWNmMS05ZGM3LTQ1ZTEtOThmOC1kMzUzNjJhZWM0YzciLCJhY3IiOiIxIiwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImRlZmF1bHQtcm9sZXMtc3RpZ21hbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7InJlYWxtLW1hbmFnZW1lbnQiOnsicm9sZXMiOlsidmlldy11c2VycyIsInF1ZXJ5LWdyb3VwcyIsInF1ZXJ5LXVzZXJzIl19LCJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6Im9wZW5pZCBzdGlnLW1hbmFnZXI6Y29sbGVjdGlvbiBzdGlnLW1hbmFnZXI6c3RpZzpyZWFkIHN0aWctbWFuYWdlcjp1c2VyOnJlYWQgc3RpZy1tYW5hZ2VyOmNvbGxlY3Rpb246cmVhZCIsInNpZCI6ImI0YTNhY2YxLTlkYzctNDVlMS05OGY4LWQzNTM2MmFlYzRjNyIsIm5hbWUiOiJyZXN0cmljdGVkIiwicHJlZmVycmVkX3VzZXJuYW1lIjoibHZsMSIsImdpdmVuX25hbWUiOiJyZXN0cmljdGVkIn0.OqLARi5ILt3j2rMikXy0ECTTqjWco0-CrMwzE88gUv2i8rVO9kMgVsXbtPk2L2c9NNNujnxqg7QIr2_sqA51saTrZHvzXcsT8lBruf74OubRMwcTQqJap-COmrzb60S7512k0WfKTYlHsoCn_uAzOb9sp8Trjr0NksU8OXCElDU"
}

const lvl3 = {
    name: "lvl3",
    userId: "44",
    token: "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJGSjg2R2NGM2pUYk5MT2NvNE52WmtVQ0lVbWZZQ3FvcXRPUWVNZmJoTmxFIn0.eyJleHAiOjE4NjQ3MDkxMjUsImlhdCI6MTY3MDU2ODMyNSwiYXV0aF90aW1lIjoxNjcwNTY4MzI1LCJqdGkiOiI4NTI5MjZmZi0xYzM4LTQwMDYtOTYwYi1kOWE0YmNhMjcxZjkiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvYXV0aC9yZWFsbXMvc3RpZ21hbiIsImF1ZCI6WyJyZWFsbS1tYW5hZ2VtZW50IiwiYWNjb3VudCJdLCJzdWIiOiIzNWZhYmMwNi0wNzZlLTRmZjQtOGJkZS1mMzI1ZWE3ZGQ0ZmIiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJzdGlnLW1hbmFnZXIiLCJub25jZSI6IjQxNmMwYmJkLTJmNjktNGZkMC04MmE1LTdjZDBmNmRlNzUzNSIsInNlc3Npb25fc3RhdGUiOiIzMThkOGNmZi0wY2U1LTQ3MzktODEyYy1iNWI0NjdlMWQ2YzEiLCJhY3IiOiIwIiwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImRlZmF1bHQtcm9sZXMtc3RpZ21hbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7InJlYWxtLW1hbmFnZW1lbnQiOnsicm9sZXMiOlsidmlldy11c2VycyIsInF1ZXJ5LWdyb3VwcyIsInF1ZXJ5LXVzZXJzIl19LCJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6Im9wZW5pZCBzdGlnLW1hbmFnZXI6Y29sbGVjdGlvbiBzdGlnLW1hbmFnZXI6c3RpZzpyZWFkIHN0aWctbWFuYWdlcjp1c2VyOnJlYWQgc3RpZy1tYW5hZ2VyOmNvbGxlY3Rpb246cmVhZCIsInNpZCI6IjMxOGQ4Y2ZmLTBjZTUtNDczOS04MTJjLWI1YjQ2N2UxZDZjMSIsInByZWZlcnJlZF91c2VybmFtZSI6Imx2bDMifQ.KduimV7h4DSySAWBbWlpN1xwbfXBfNsscvx2qIx9SVAeZFSGbPZ0JtgThD9uray9xZjrk6qLNYnkoVyYQLS4M-pg8IlFp5yKJBCIeCpcTxA25MdV5VwZQcCD9pgwtEav-cgaDD2Ue6cHj_02cQGMClsfkJ2SuOUJ9nIu4B3m3Qk"
}

const lvl1TestAcl = {
    put: [{"benchmarkId":reference.testCollection.benchmark,"labelId":reference.testCollection.fullLabel,"access":"r"},{"assetId":"154","access":"rw"}],
    response: [
        {
          access: "r",
          asset: {
            name: "Collection_X_asset",
            assetId: "62",
          },
          benchmarkId: "VPN_SRG_TEST",
          aclSources: [
            {
              aclRule: {
                label: {
                  name: "test-label-full",
                  labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
                },
                access: "r",
                benchmarkId: "VPN_SRG_TEST",
              },
              grantee: {
                userId: 85,
                username: "lvl1",
                accessLevel: 1,
              },
            },
          ],
        },
        {
          access: "r",
          asset: {
            name: "Collection_X_lvl1_asset-1",
            assetId: "42",
          },
          benchmarkId: "VPN_SRG_TEST",
          aclSources: [
            {
              aclRule: {
                label: {
                  name: "test-label-full",
                  labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
                },
                access: "r",
                benchmarkId: "VPN_SRG_TEST",
              },
              grantee: {
                userId: 85,
                username: "lvl1",
                accessLevel: 1,
              },
            },
          ],
        },
        {
          access: "rw",
          asset: {
            name: "Collection_X_lvl1_asset-2",
            assetId: "154",
          },
          benchmarkId: "VPN_SRG_TEST",
          aclSources: [
            {
              aclRule: {
                asset: {
                  name: "Collection_X_lvl1_asset-2",
                  assetId: "154",
                },
                access: "rw",
              },
              grantee: {
                userId: 85,
                username: "lvl1",
                accessLevel: 1,
              },
            },
          ],
        },
        {
          access: "rw",
          asset: {
            name: "Collection_X_lvl1_asset-2",
            assetId: "154",
          },
          benchmarkId: "Windows_10_STIG_TEST",
          aclSources: [
            {
              aclRule: {
                asset: {
                  name: "Collection_X_lvl1_asset-2",
                  assetId: "154",
                },
                access: "rw",
              },
              grantee: {
                userId: 85,
                username: "lvl1",
                accessLevel: 1,
              },
            },
          ],
        },
      ]
}

describe("Test grantee resolution is resolved from assigning a user to a group", function () {

  before(async function () {
    await utils.loadAppData()
  })

  let tempUserID = null
  let tempGroupID = null
  // create test user 
  it("create a temporary user", async function () {

    let uuid = uuidv4()
    //first 20 chars
    uuid = uuid.substring(0, 20)

    const res = await chai
    .request(config.baseUrl)
    .post(`/users?elevate=true&projection=collectionGrants&projection=statistics`)
    .set('Authorization', 'Bearer ' + admin.token)
    .send({
      "username": "TEMP_USER" +  uuid,
      "collectionGrants": [
      ]
    })
  
    expect(res).to.have.status(201) 
    tempUserID = res.body.userId
  })

  // create test group
  it("create a temporary userGroup", async function () {

    const uuid = uuidv4()
    //first 20 chars
    let = uuid.substring(0, 20)

    const res = await chai
    .request(config.baseUrl)
    .post(`/user-groups?elevate=true`)
    .set('Authorization', 'Bearer ' + admin.token)
    .send({
      "name": "TEMP_GROUP" +  uuid,
      "description": "TEMP_GROUP" +  uuid,
      userIds: [tempUserID]
    })
   
    expect(res).to.have.status(201) 
    tempGroupID = res.body.userGroupId
  })

  // assign it to the test collection 
  it("assign the userGroup to the test collection with restricted grant", async function () {

    const res = await chai.request(config.baseUrl)
    .put(`/collections/${reference.testCollection.collectionId}/grants/user-group/${tempGroupID}`)
    .set('Authorization', `Bearer ${admin.token}`)
    .send({
      accessLevel: 1
    })
   
    expect(res).to.have.status(201)
  })

  // then get the grant and test grantee = userGroup.
  it("should return the grant for the user in the collection and check that grantee is from a group grant",async function () {
    
    const res = await chai.request(config.baseUrl)
      .get(`/collections/${reference.testCollection.collectionId}/grants/user/${tempUserID}`)
      .set('Authorization', `Bearer ${admin.token}`)
  
    expect(res).to.have.status(200)
    expect(res.body.accessLevel).to.equal(1)
    expect(res.body.userId).to.equal(tempUserID)
    for(const grant of res.body.grantees){
      expect(grant.userGroupId).to.equal(tempGroupID)
    }
  })
})

describe(`Testing grantee resolution between a direct grant and group grant`, () => {
  describe(`GET- getEffectiveAclByCollectionUser`, () => {
      before(async function () {
          await utils.loadAppData()
      })

      let userGroup = null

      it("Remove Base appdata userGroup from test Colleciton", async () => {

        const res = await chai.request(config.baseUrl)  
          .delete(`/collections/${reference.testCollection.collectionId}/grants/user-group/${reference.testCollection.testGroup.userGroupId}`)
          .set('Authorization', `Bearer ${admin.token}`)
    
        expect(res).to.have.status(200)
      })
      it("should give lvl1 user restricted access to test collection", async () => {
        const res = await chai.request(config.baseUrl)
            .put(`/collections/${reference.testCollection.collectionId}/grants/user/${lvl1.userId}`)
            .set('Authorization', `Bearer ${admin.token}`)
            .send({
              "accessLevel": 1
            })
        expect(res).to.have.status(201)
      })
      // user has direct grant to collection
      it("make sure grantee has a userID property which means it has a direct grant ", async () => {

          const res = await chai
              .request(config.baseUrl)
              .get(`/collections/${reference.testCollection.collectionId}/grants/user/${lvl1.userId}/access/effective`)
              .set('Authorization', 'Bearer ' + admin.token)
      
          expect(res).to.have.status(200)
          for(const grant of res.body){
              for(const acl of grant.aclSources){
                  expect(acl.grantee.userId).to.exist
              }
          }
      })

      // make group
      it("should create a userGroup with lvl1 in it", async () => {
          const res = await chai
              .request(config.baseUrl)
              .post(`/user-groups?elevate=true&projection=users`)
              .set('Authorization', 'Bearer ' + admin.token)
              .send({
                  "name": "group" +  uuidv4(),
                  "description": "test group",
                  "userIds": [
                  lvl1.userId   
                  ]
              })
          
          userGroup = res.body
          expect(res).to.have.status(201)
          for(let user of res.body.users) {
              expect(user.userId, "expect userId to be equal to the userId returned from API").to.equal(lvl1.userId)
          }
      })

      // add group to collection
      it("should give created group restricted access to test collection", async () => {

          const res = await chai
              .request(config.baseUrl)
              .put(`/collections/${reference.testCollection.collectionId}/grants/user-group/${userGroup.userGroupId}`)
              .set('Authorization', 'Bearer ' + admin.token)
              .send({
                  accessLevel: 1
              })
          expect(res).to.have.status(201)
      })

      it("should set userGroups ACL in test collection", async () => {

          const res = await chai
              .request(config.baseUrl)
              .put(`/collections/${reference.testCollection.collectionId}/grants/user-group/${userGroup.userGroupId}/access`)
              .set('Authorization', 'Bearer ' + admin.token)
              .send(lvl1TestAcl.put)
          expect(res).to.have.status(200)
      })

      it("should confirm users effective acl was set. User has group and direct grant expect to get effective from the direct", async () => {

          const res = await chai
              .request(config.baseUrl)
              .get(`/collections/${reference.testCollection.collectionId}/grants/user/${lvl1.userId}/access/effective`)
              .set('Authorization', 'Bearer ' + admin.token)
      
          expect(res).to.have.status(200)
          for(const grant of res.body){
              for(const acl of grant.aclSources){
                  expect(acl.grantee.userId).to.exist
              }
          }
      })

      it("should delete users direct grant to test collection", async () => {

          const res = await chai.request(config.baseUrl)  
              .delete(`/collections/${reference.testCollection.collectionId}/grants/user/${lvl1.userId}`)
              .set('Authorization', `Bearer ${admin.token}`)
          expect(res).to.have.status(200)
      })
      
      it("User now only has a group grant, check that grantee was resolved from a group", async () => {

          const res = await chai
              .request(config.baseUrl)
              .get(`/collections/${reference.testCollection.collectionId}/grants/user/${lvl1.userId}/access/effective`)
              .set('Authorization', 'Bearer ' + admin.token)
               
          expect(res).to.have.status(200)
          for(const grant of res.body){
              for(const acl of grant.aclSources){
                  expect(acl.grantee.userGroupId).to.exist
              }
          }
      })

      it("should delete the userGroup", async () => {
          const res = await chai
              .request(config.baseUrl)
              .delete(`/user-groups/${userGroup.userGroupId}?elevate=true`)
              .set('Authorization', 'Bearer ' + admin.token)
          expect(res).to.have.status(200)
      })

      it("should confirm that the userGroup was deleted", async () => {
          const res = await chai
              .request(config.baseUrl)
              .get(`/user-groups/${userGroup.userGroupId}?elevate=true`)
              .set('Authorization', 'Bearer ' + admin.token)
          expect(res).to.have.status(404)
      })
      
      it("User now has no grant to the collection should get 422 error", async () => {

          const res = await chai
              .request(config.baseUrl)
              .get(`/collections/${reference.testCollection.collectionId}/grants/user/${lvl1.userId}/access/effective`)
              .set('Authorization', 'Bearer ' + admin.token)
          expect(res).to.have.status(422)
          expect(res.body.detail).to.equal("user has no direct or group grant in collection")
      })
  })
})

describe(`Multiple Group Role Collsions`, () => {

  before(async function () {
      await utils.loadAppData()
  })
  
  let userGroup1
  let userGroup2
  let userGroup3

  it("Remove Base appdata userGroup from test Colleciton", async () => {

    const res = await chai.request(config.baseUrl)  
      .delete(`/collections/${reference.testCollection.collectionId}/grants/user-group/${reference.testCollection.testGroup.userGroupId}`)
      .set('Authorization', `Bearer ${admin.token}`)

    expect(res).to.have.status(200)
  })

  it('should create a test user group with lvl1 user in it.', async () => {
    const res = await chai
        .request(config.baseUrl)
        .post(`/user-groups?elevate=true&projection=collections`)
        .set('Authorization', 'Bearer ' + config.adminToken)
        .send({
          "name": "CollisionGroup1",
          "description": "test group",
          "userIds": [
            lvl1.userId   
          ]
      })
      userGroup1 = res.body
      expect(res).to.have.status(201)
      expect(res.body.collections).to.be.empty
     
  })

  it('should another test user group with lvl1 user in it.', async () => {

      const res = await chai
          .request(config.baseUrl)
          .post(`/user-groups?elevate=true&projection=collections`)
          .set('Authorization', 'Bearer ' + config.adminToken)
          .send({
            "name": "CollisionGroup2",
            "description": "test group",
            "userIds": [
              lvl1.userId   
            ]
        })
        userGroup2 = res.body
        expect(res).to.have.status(201)
        expect(res.body.collections).to.be.empty
       
  })
  
  it("should delete lvl1 users direct grant to test collection", async () => {

    const res = await chai.request(config.baseUrl)
      .delete(`/collections/${reference.testCollection.collectionId}/grants/user/${lvl1.userId}`)
      .set('Authorization', `Bearer ${config.adminToken}`)
    expect(res).to.have.status(200)

  })

  it("should assign both groups created to the test collection with restricted grant", async function () {

    const res = await chai.request(config.baseUrl)
      .put(`/collections/${reference.testCollection.collectionId}/grants/user-group/${userGroup1.userGroupId}`)
      .set('Authorization', `Bearer ${config.adminToken}`)
      .send({
          accessLevel: 1
      })
      expect(res).to.have.status(201)
    expect(res.body.accessLevel).to.equal(1)

      const res2 = await chai.request(config.baseUrl)
          .put(`/collections/${reference.testCollection.collectionId}/grants/user-group/${userGroup2.userGroupId}`)
          .set('Authorization', `Bearer ${config.adminToken}`)
          .send({
          accessLevel: 1
          })
      expect(res2).to.have.status(201)
      expect(res2.body.accessLevel).to.equal(1)
  })

  it("get users assigned to the test collection and check that lvl1 user obtained accessLevel = 1 due to membership in two groups with accessLevel = 1", async () => {

      const res = await chai.request(config.baseUrl)
          .get(`/collections/${reference.testCollection.collectionId}?projection=users`)
          .set('Authorization', `Bearer ${config.adminToken}`)
      expect(res).to.have.status(200)
      
      const testUser = res.body.users.find(user => user.user.userId === lvl1.userId)
      expect(testUser.accessLevel).to.equal(1)
      const groupNames = [userGroup1.name, userGroup2.name]
      for(const grantee of testUser.grantees){
          expect(grantee.name).to.be.oneOf(groupNames)
      }
  })

  it("should change userGroup1 accessLevel to 2", async () => {
      const res = await chai.request(config.baseUrl)
          .put(`/collections/${reference.testCollection.collectionId}/grants/user-group/${userGroup1.userGroupId}`)
          .set('Authorization', `Bearer ${config.adminToken}`)
          .send({
              accessLevel: 2
          })
      expect(res).to.have.status(200)
      expect(res.body.accessLevel).to.equal(2)
  })

  it("get users assigned to the test collection and check that lvl1 user obtained accessLevel = 2 due to membership in two groups with highest being accessLevel = 2", async () => {

      const res = await chai.request(config.baseUrl)
          .get(`/collections/${reference.testCollection.collectionId}?projection=users`)
          .set('Authorization', `Bearer ${config.adminToken}`)
      expect(res).to.have.status(200)
      
      const testUser = res.body.users.find(user => user.user.userId === lvl1.userId)
      expect(testUser.accessLevel).to.equal(2)
      expect(testUser.grantees.length).to.equal(1)
      for(const grantee of testUser.grantees){
          expect(grantee.name).to.equal(userGroup1.name)
      }
  })

  it("should change userGroup2 accessLevel to 3", async () => {
      const res = await chai.request(config.baseUrl)
          .put(`/collections/${reference.testCollection.collectionId}/grants/user-group/${userGroup2.userGroupId}`)
          .set('Authorization', `Bearer ${config.adminToken}`)
          .send({
              accessLevel: 3
          })
      expect(res).to.have.status(200)
      expect(res.body.accessLevel).to.equal(3)
  })

  it("get users assigned to the test collection and check that lvl1 user obtained accessLevel = 3 due to membership in two groups with highest being accessLevel = 3", async () => {

      const res = await chai.request(config.baseUrl)
          .get(`/collections/${reference.testCollection.collectionId}?projection=users`)
          .set('Authorization', `Bearer ${config.adminToken}`)
      expect(res).to.have.status(200)
      
      const testUser = res.body.users.find(user => user.user.userId === lvl1.userId)
      expect(testUser.accessLevel).to.equal(3)
      expect(testUser.grantees.length).to.equal(1)
      for(const grantee of testUser.grantees){
          expect(grantee.name).to.equal(userGroup2.name)
      }
  })

  it("should change userGroup1 accessLevel to 4", async () => {
      const res = await chai.request(config.baseUrl)
          .put(`/collections/${reference.testCollection.collectionId}/grants/user-group/${userGroup1.userGroupId}`)
          .set('Authorization', `Bearer ${config.adminToken}`)
          .send({
              accessLevel: 4
          })
      expect(res).to.have.status(200)
      expect(res.body.accessLevel).to.equal(4)
  })
  
  it("get users assigned to the test collection and check that lvl1 user obtained accessLevel = 4 due to membership in two groups with highest being accessLevel = 4", async () => {

      const res = await chai.request(config.baseUrl)
          .get(`/collections/${reference.testCollection.collectionId}?projection=users`)
          .set('Authorization', `Bearer ${config.adminToken}`)
      expect(res).to.have.status(200)
      
      const testUser = res.body.users.find(user => user.user.userId === lvl1.userId)
      expect(testUser.accessLevel).to.equal(4)
      expect(testUser.grantees.length).to.equal(1)
      for(const grantee of testUser.grantees){
          expect(grantee.name).to.equal(userGroup1.name)
      }
  })

  it("create a new userGroup with lvl1 user in it", async () => {
      const res = await chai
          .request(config.baseUrl)
          .post(`/user-groups?elevate=true&projection=collections`)
          .set('Authorization', 'Bearer ' + config.adminToken)
          .send({
              "name": "CollisionGroup3",
              "description": "test group",
              "userIds": [
                  lvl1.userId   
              ]
          })
      userGroup3 = res.body
      expect(res).to.have.status(201)
      expect(res.body.collections).to.be.empty
    })

    it("assign userGroup3 to the test collection with accessLevel = 4", async () => {
      const res = await chai.request(config.baseUrl)
          .put(`/collections/${reference.testCollection.collectionId}/grants/user-group/${userGroup3.userGroupId}`)
          .set('Authorization', `Bearer ${config.adminToken}`)
          .send({
              accessLevel: 4
          })
      expect(res).to.have.status(201)
      expect(res.body.accessLevel).to.equal(4)
    })

    it("get users assigned to the test collection and check that lvl1 user obtained accessLevel = 4 due to membership in three groups with two groups being accessLevel = 4", async () => {

      const res = await chai.request(config.baseUrl)
          .get(`/collections/${reference.testCollection.collectionId}?projection=users`)
          .set('Authorization', `Bearer ${config.adminToken}`)
      expect(res).to.have.status(200)

      const testUser = res.body.users.find(user => user.user.userId === lvl1.userId)
      expect(testUser.accessLevel).to.equal(4)
      expect(testUser.grantees.length).to.equal(2)
      for(const grantee of testUser.grantees){
          expect(grantee.name).to.be.oneOf([userGroup1.name, userGroup3.name])
      }
    })
})

describe(`Testing grantee resolution between a direct grant and group grant`, () => {
  describe(`GET- getEffectiveAclByCollectionUser`, () => {
      before(async function () {
          await utils.loadAppData()
      })

      let userGroup = null

      it("Remove Base appdata userGroup from test Colleciton", async () => {

        const res = await chai.request(config.baseUrl)  
          .delete(`/collections/${reference.testCollection.collectionId}/grants/user-group/${reference.testCollection.testGroup.userGroupId}`)
          .set('Authorization', `Bearer ${admin.token}`)
    
        expect(res).to.have.status(200)
      })
      it("should give lvl1 user restricted access to test collection", async () => {
        const res = await chai.request(config.baseUrl)
            .put(`/collections/${reference.testCollection.collectionId}/grants/user/${lvl1.userId}`)
            .set('Authorization', `Bearer ${admin.token}`)
            .send({
              "accessLevel": 1
            })
        expect(res).to.have.status(201)
      })
      // user has direct grant to collection
      it("make sure grantee has a userID property which means it has a direct grant ", async () => {

          const res = await chai
              .request(config.baseUrl)
              .get(`/collections/${reference.testCollection.collectionId}/grants/user/${lvl1.userId}/access/effective`)
              .set('Authorization', 'Bearer ' + admin.token)
      
          expect(res).to.have.status(200)
          for(const grant of res.body){
              for(const acl of grant.aclSources){
                  expect(acl.grantee.userId).to.exist
              }
          }
      })

      // make group
      it("should create a userGroup with lvl1 in it", async () => {
          const res = await chai
              .request(config.baseUrl)
              .post(`/user-groups?elevate=true&projection=users`)
              .set('Authorization', 'Bearer ' + admin.token)
              .send({
                  "name": "group" +  uuidv4(),
                  "description": "test group",
                  "userIds": [
                  lvl1.userId   
                  ]
              })
          
          userGroup = res.body
          expect(res).to.have.status(201)
          for(let user of res.body.users) {
              expect(user.userId, "expect userId to be equal to the userId returned from API").to.equal(lvl1.userId)
          }
      })

      // add group to collection
      it("should give created group restricted access to test collection", async () => {

          const res = await chai
              .request(config.baseUrl)
              .put(`/collections/${reference.testCollection.collectionId}/grants/user-group/${userGroup.userGroupId}`)
              .set('Authorization', 'Bearer ' + admin.token)
              .send({
                  accessLevel: 1
              })
          expect(res).to.have.status(201)
      })

      it("should set userGroups ACL in test collection", async () => {

          const res = await chai
              .request(config.baseUrl)
              .put(`/collections/${reference.testCollection.collectionId}/grants/user-group/${userGroup.userGroupId}/access`)
              .set('Authorization', 'Bearer ' + admin.token)
              .send(lvl1TestAcl.put)
          expect(res).to.have.status(200)
      })

      it("should confirm users effective acl was set. User has group and direct grant expect to get effective from the direct", async () => {

          const res = await chai
              .request(config.baseUrl)
              .get(`/collections/${reference.testCollection.collectionId}/grants/user/${lvl1.userId}/access/effective`)
              .set('Authorization', 'Bearer ' + admin.token)
      
          expect(res).to.have.status(200)
          for(const grant of res.body){
              for(const acl of grant.aclSources){
                  expect(acl.grantee.userId).to.exist
              }
          }
      })

      it("should delete users direct grant to test collection", async () => {

          const res = await chai.request(config.baseUrl)  
              .delete(`/collections/${reference.testCollection.collectionId}/grants/user/${lvl1.userId}`)
              .set('Authorization', `Bearer ${admin.token}`)
          expect(res).to.have.status(200)
      })
      
      it("User now only has a group grant, check that grantee was resolved from a group", async () => {

          const res = await chai
              .request(config.baseUrl)
              .get(`/collections/${reference.testCollection.collectionId}/grants/user/${lvl1.userId}/access/effective`)
              .set('Authorization', 'Bearer ' + admin.token)
               
          expect(res).to.have.status(200)
          for(const grant of res.body){
              for(const acl of grant.aclSources){
                  expect(acl.grantee.userGroupId).to.exist
              }
          }
      })

      it("should delete the userGroup", async () => {
          const res = await chai
              .request(config.baseUrl)
              .delete(`/user-groups/${userGroup.userGroupId}?elevate=true`)
              .set('Authorization', 'Bearer ' + admin.token)
          expect(res).to.have.status(200)
      })

      it("should confirm that the userGroup was deleted", async () => {
          const res = await chai
              .request(config.baseUrl)
              .get(`/user-groups/${userGroup.userGroupId}?elevate=true`)
              .set('Authorization', 'Bearer ' + admin.token)
          expect(res).to.have.status(404)
      })
      
      it("User now has no grant to the collection should get 422 error", async () => {

          const res = await chai
              .request(config.baseUrl)
              .get(`/collections/${reference.testCollection.collectionId}/grants/user/${lvl1.userId}/access/effective`)
              .set('Authorization', 'Bearer ' + admin.token)
          expect(res).to.have.status(422)
          expect(res.body.detail).to.equal("user has no direct or group grant in collection")
      })
  })
})

describe("Testing user grant for a user that has a 'grantee' from a userGroup grant", function () {

  before(async function () {
    await utils.loadAppData()
  })

  let tempUserID = null
  let tempGroupID = null
  // create test user 
  it("create a temporary user with no grants", async function () {

    let uuid = uuidv4()
    //first 20 chars
    uuid = uuid.substring(0, 20)

    const res = await chai
    .request(config.baseUrl)
    .post(`/users?elevate=true&projection=collectionGrants&projection=statistics`)
    .set('Authorization', 'Bearer ' + admin.token)
    .send({
      "username": "TEMP_USER" +  uuid,
      "collectionGrants": [
      ]
    })
  
    expect(res).to.have.status(201) 
    tempUserID = res.body.userId
  })

  // create test group
  it("create a temporary userGroup with our temp user in it", async function () {

    const uuid = uuidv4()
    //first 20 chars
    let = uuid.substring(0, 20)

    const res = await chai
    .request(config.baseUrl)
    .post(`/user-groups?elevate=true`)
    .set('Authorization', 'Bearer ' + admin.token)
    .send({
      "name": "TEMP_GROUP" +  uuid,
      "description": "TEMP_GROUP" +  uuid,
      userIds: [tempUserID]
    })
   
    expect(res).to.have.status(201) 
    tempGroupID = res.body.userGroupId
  })

  // assign it to the test collection 
  it("assign the userGroup to the test collection with restricted grant", async function () {

    const res = await chai.request(config.baseUrl)
    .put(`/collections/${reference.testCollection.collectionId}/grants/user-group/${tempGroupID}`)
    .set('Authorization', `Bearer ${admin.token}`)
    .send({
      accessLevel: 1
    })
   
    expect(res).to.have.status(201)
  })

  // then get the grant and test grantee = userGroup.
  it("should return the grant for the user in the collection and check that grantee is from a group grant",async function () {
    
    const res = await chai.request(config.baseUrl)
      .get(`/collections/${reference.testCollection.collectionId}/grants/user/${tempUserID}`)
      .set('Authorization', `Bearer ${admin.token}`)
  
    expect(res).to.have.status(200)
    expect(res.body.accessLevel).to.equal(1)
    expect(res.body.userId).to.equal(tempUserID)
    for(const grant of res.body.grantees){
      expect(grant.userGroupId).to.equal(tempGroupID)
    }
  })

})

describe(`Multiple Group Role Collsions`, () => {

  before(async function () {
      await utils.loadAppData()
  })
  
  let userGroup1
  let userGroup2
  let userGroup3

  it("Remove Base appdata userGroup from test Colleciton", async () => {

    const res = await chai.request(config.baseUrl)  
      .delete(`/collections/${reference.testCollection.collectionId}/grants/user-group/${reference.testCollection.testGroup.userGroupId}`)
      .set('Authorization', `Bearer ${admin.token}`)

    expect(res).to.have.status(200)
  })

  it('should create a test user group with lvl1 user in it.', async () => {
    const res = await chai
        .request(config.baseUrl)
        .post(`/user-groups?elevate=true&projection=collections`)
        .set('Authorization', 'Bearer ' + config.adminToken)
        .send({
          "name": "CollisionGroup1",
          "description": "test group",
          "userIds": [
            lvl1.userId   
          ]
      })
      userGroup1 = res.body
      expect(res).to.have.status(201)
      expect(res.body.collections).to.be.empty
     
  })

  it('should another test user group with lvl1 user in it.', async () => {

      const res = await chai
          .request(config.baseUrl)
          .post(`/user-groups?elevate=true&projection=collections`)
          .set('Authorization', 'Bearer ' + config.adminToken)
          .send({
            "name": "CollisionGroup2",
            "description": "test group",
            "userIds": [
              lvl1.userId   
            ]
        })
        userGroup2 = res.body
        expect(res).to.have.status(201)
        expect(res.body.collections).to.be.empty
       
  })
  
  it("should delete lvl1 users direct grant to test collection", async () => {

    const res = await chai.request(config.baseUrl)
      .delete(`/collections/${reference.testCollection.collectionId}/grants/user/${lvl1.userId}`)
      .set('Authorization', `Bearer ${config.adminToken}`)
    expect(res).to.have.status(200)

  })

  it("should assign both groups created to the test collection with restricted grant", async function () {

    const res = await chai.request(config.baseUrl)
      .put(`/collections/${reference.testCollection.collectionId}/grants/user-group/${userGroup1.userGroupId}`)
      .set('Authorization', `Bearer ${config.adminToken}`)
      .send({
          accessLevel: 1
      })
      expect(res).to.have.status(201)
    expect(res.body.accessLevel).to.equal(1)

      const res2 = await chai.request(config.baseUrl)
          .put(`/collections/${reference.testCollection.collectionId}/grants/user-group/${userGroup2.userGroupId}`)
          .set('Authorization', `Bearer ${config.adminToken}`)
          .send({
          accessLevel: 1
          })
      expect(res2).to.have.status(201)
      expect(res2.body.accessLevel).to.equal(1)
  })

  it("get users assigned to the test collection and check that lvl1 user obtained accessLevel = 1 due to membership in two groups with accessLevel = 1", async () => {

      const res = await chai.request(config.baseUrl)
          .get(`/collections/${reference.testCollection.collectionId}?projection=users`)
          .set('Authorization', `Bearer ${config.adminToken}`)
      expect(res).to.have.status(200)
      
      const testUser = res.body.users.find(user => user.user.userId === lvl1.userId)
      expect(testUser.accessLevel).to.equal(1)
      const groupNames = [userGroup1.name, userGroup2.name]
      for(const grantee of testUser.grantees){
          expect(grantee.name).to.be.oneOf(groupNames)
      }
  })

  it("should change userGroup1 accessLevel to 2", async () => {
      const res = await chai.request(config.baseUrl)
          .put(`/collections/${reference.testCollection.collectionId}/grants/user-group/${userGroup1.userGroupId}`)
          .set('Authorization', `Bearer ${config.adminToken}`)
          .send({
              accessLevel: 2
          })
      expect(res).to.have.status(200)
      expect(res.body.accessLevel).to.equal(2)
  })

  it("get users assigned to the test collection and check that lvl1 user obtained accessLevel = 2 due to membership in two groups with highest being accessLevel = 2", async () => {

      const res = await chai.request(config.baseUrl)
          .get(`/collections/${reference.testCollection.collectionId}?projection=users`)
          .set('Authorization', `Bearer ${config.adminToken}`)
      expect(res).to.have.status(200)
      
      const testUser = res.body.users.find(user => user.user.userId === lvl1.userId)
      expect(testUser.accessLevel).to.equal(2)
      expect(testUser.grantees.length).to.equal(1)
      for(const grantee of testUser.grantees){
          expect(grantee.name).to.equal(userGroup1.name)
      }
  })

  it("should change userGroup2 accessLevel to 3", async () => {
      const res = await chai.request(config.baseUrl)
          .put(`/collections/${reference.testCollection.collectionId}/grants/user-group/${userGroup2.userGroupId}`)
          .set('Authorization', `Bearer ${config.adminToken}`)
          .send({
              accessLevel: 3
          })
      expect(res).to.have.status(200)
      expect(res.body.accessLevel).to.equal(3)
  })

  it("get users assigned to the test collection and check that lvl1 user obtained accessLevel = 3 due to membership in two groups with highest being accessLevel = 3", async () => {

      const res = await chai.request(config.baseUrl)
          .get(`/collections/${reference.testCollection.collectionId}?projection=users`)
          .set('Authorization', `Bearer ${config.adminToken}`)
      expect(res).to.have.status(200)
      
      const testUser = res.body.users.find(user => user.user.userId === lvl1.userId)
      expect(testUser.accessLevel).to.equal(3)
      expect(testUser.grantees.length).to.equal(1)
      for(const grantee of testUser.grantees){
          expect(grantee.name).to.equal(userGroup2.name)
      }
  })

  it("should change userGroup1 accessLevel to 4", async () => {
      const res = await chai.request(config.baseUrl)
          .put(`/collections/${reference.testCollection.collectionId}/grants/user-group/${userGroup1.userGroupId}`)
          .set('Authorization', `Bearer ${config.adminToken}`)
          .send({
              accessLevel: 4
          })
      expect(res).to.have.status(200)
      expect(res.body.accessLevel).to.equal(4)
  })
  
  it("get users assigned to the test collection and check that lvl1 user obtained accessLevel = 4 due to membership in two groups with highest being accessLevel = 4", async () => {

      const res = await chai.request(config.baseUrl)
          .get(`/collections/${reference.testCollection.collectionId}?projection=users`)
          .set('Authorization', `Bearer ${config.adminToken}`)
      expect(res).to.have.status(200)
      
      const testUser = res.body.users.find(user => user.user.userId === lvl1.userId)
      expect(testUser.accessLevel).to.equal(4)
      expect(testUser.grantees.length).to.equal(1)
      for(const grantee of testUser.grantees){
          expect(grantee.name).to.equal(userGroup1.name)
      }
  })

  it("create a new userGroup with lvl1 user in it", async () => {
      const res = await chai
          .request(config.baseUrl)
          .post(`/user-groups?elevate=true&projection=collections`)
          .set('Authorization', 'Bearer ' + config.adminToken)
          .send({
              "name": "CollisionGroup3",
              "description": "test group",
              "userIds": [
                  lvl1.userId   
              ]
          })
      userGroup3 = res.body
      expect(res).to.have.status(201)
      expect(res.body.collections).to.be.empty
  })

  it("assign userGroup3 to the test collection with accessLevel = 4", async () => {
    const res = await chai.request(config.baseUrl)
        .put(`/collections/${reference.testCollection.collectionId}/grants/user-group/${userGroup3.userGroupId}`)
        .set('Authorization', `Bearer ${config.adminToken}`)
        .send({
            accessLevel: 4
        })
    expect(res).to.have.status(201)
    expect(res.body.accessLevel).to.equal(4)
  })

  it("get users assigned to the test collection and check that lvl1 user obtained accessLevel = 4 due to membership in three groups with two groups being accessLevel = 4", async () => {

      const res = await chai.request(config.baseUrl)
          .get(`/collections/${reference.testCollection.collectionId}?projection=users`)
          .set('Authorization', `Bearer ${config.adminToken}`)
      expect(res).to.have.status(200)

      const testUser = res.body.users.find(user => user.user.userId === lvl1.userId)
      expect(testUser.accessLevel).to.equal(4)
      expect(testUser.grantees.length).to.equal(2)
      for(const grantee of testUser.grantees){
          expect(grantee.name).to.be.oneOf([userGroup1.name, userGroup3.name])
      }
  })
})