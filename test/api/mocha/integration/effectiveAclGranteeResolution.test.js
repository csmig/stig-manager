
// will use the lvl1 user and the lvl3 manage user to test r rw and none 
// will first set the access level to an acl rule then attempt to write to that item and write outside to throw errors 

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

const lvl1TestAcl = {
put: [{"benchmarkId":reference.testCollection.benchmark,"labelId":reference.testCollection.fullLabel,"access":"r"},{"assetId":"154","access":"rw"}],
}

describe(`GET- getEffectiveAclByCollectionUser`, () => {
    
    describe(`Testing Grantee Resolution`, () => {
        before(async function () {
            await utils.loadAppData()
        })

        after(async function () { 
            await utils.loadAppData()
        })

        let userGroup = null

        // User has only a direct grant
        it("check that user is not in a group", async () => {
            const res = await chai
                .request(config.baseUrl)
                .get(`/users/${lvl1.userId}?elevate=true&projection=userGroups`)
                .set('Authorization', 'Bearer ' + admin.token)
        
            expect(res).to.have.status(200)
            expect(res.body.userGroups).to.be.an('array').that.is.empty
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

