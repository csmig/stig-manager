
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

const lvl3TestAcl = {
  put: [{"benchmarkId":reference.testCollection.benchmark,"labelId":reference.testCollection.fullLabel,"access":"r"}],
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
              userId: 44,
              username: "lvl3",
              accessLevel: 3,
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
              userId: 44,
              username: "lvl3",
              accessLevel: 3,
            },
          },
        ],
      },
      
    ]
}

describe(`Test a restricted users access (r,rw,none)`, () => {

    before(async function () {
        await utils.loadAppData()
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
    it("Remove Base appdata userGroup from test Colleciton", async () => {

      const res = await chai.request(config.baseUrl)  
        .delete(`/collections/${reference.testCollection.collectionId}/grants/user-group/${reference.testCollection.testGroup.userGroupId}`)
        .set('Authorization', `Bearer ${admin.token}`)

      expect(res).to.have.status(200)
    })

    it(`should set users ACL in test collection `, async () => {
        const res = await chai.request(config.baseUrl)
            .put(`/collections/${reference.testCollection.collectionId}/grants/user/${lvl1.userId}/access`)
            .set('Authorization', `Bearer ${admin.token}`)
            .send(lvl1TestAcl.put)
        expect(res).to.have.status(200)
        // needs tesitng but as of rn the endpont is broke 
    })
    it("should confirm users effective acl was set ", async () => {
        const res = await chai.request(config.baseUrl)
            .get(`/collections/${reference.testCollection.collectionId}/grants/user/${lvl1.userId}/access/effective`)
            .set('Authorization', `Bearer ${admin.token}`)
            expect(res).to.have.status(200)
        expect(res.body).to.deep.equalInAnyOrder(lvl1TestAcl.response)
    })
    it("should get reviews that is associated with the ACL and confirm that is it all read only.", async () => {

        const res = await chai.request(config.baseUrl)
            .get(`/collections/${reference.testCollection.collectionId}/reviews?rules=default-mapped`)
            .set('Authorization', `Bearer ${lvl1.token}`)
            expect(res).to.have.status(200)

        for(const review of res.body){
            if(review.assetId === "154"){
                expect(review.access).to.equal("rw")
            }
            else if (review.assetId === reference.testAsset.assetId){
                expect(review.access).to.equal("r")
            }
            // sanity check
            if(review.assetId === reference.testAsset.assetId && review.ruleId === reference.testCollection.ruleId){
                expect(review.access, "expect that the test rule exists and is read only").to.equal("r")
            }
        }
    })
    it("should reject PUT modification to reviews that is associated with the ACLs that are read only", async () => {

      const res = await chai.request(config.baseUrl)
          .put(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}`)
          .set('Authorization', `Bearer ${lvl1.token}`)
          .send({
            result: 'pass',
            detail: '',
            comment: 'sure',
            status: 'accepted',
            autoResult: false
          })
      expect(res).to.have.status(403)
      expect(res.body.detail).to.equal("no grant for this asset/ruleId")
    })
    it("should reject PATCH modification to read only review on test asset with test ruleId", async () => {

      const res = await chai.request(config.baseUrl)
          .patch(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}`)
          .set('Authorization', `Bearer ${lvl1.token}`)
          .send({
            result: 'pass',
          })
      expect(res).to.have.status(403)
      expect(res.body.detail).to.equal("no grant for this asset/ruleId")
    })
    it("should reject DELETE modification to read only review on test asset with test ruleId", async () => {

      const res = await chai.request(config.baseUrl)
          .delete(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}`)
          .set('Authorization', `Bearer ${lvl1.token}`)
         
      expect(res).to.have.status(403)
    })
    it("should reject put modification to read only review metadata on test asset with test ruleId", async () => {

      const res = await chai.request(config.baseUrl)
          .put(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}/metadata`)
          .set('Authorization', `Bearer ${lvl1.token}`)
          .send({[reference.reviewMetadataKey]: reference.reviewMetadataValue})
      expect(res).to.have.status(403)
      expect(res.body.detail).to.equal("User has insufficient privilege to put the review of this rule.")

    })
    it("should reject patch modification to read only review metadata on test asset with test ruleId", async () => {

      const res = await chai.request(config.baseUrl)
          .patch(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}/metadata`)
          .set('Authorization', `Bearer ${lvl1.token}`)
          .send({[reference.reviewMetadataKey]: reference.reviewMetadataValue})
      expect(res).to.have.status(403)
      expect(res.body.detail).to.equal("User has insufficient privilege to patch the review of this rule.")
      
    })
    it("should reject put modification to read only review metadata on test asset with test ruleId", async () => {

      const res = await chai.request(config.baseUrl)
          .put(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}/metadata`)
          .set('Authorization', `Bearer ${lvl1.token}`)
          .send({[reference.reviewMetadataKey]: reference.reviewMetadataValue})
      expect(res).to.have.status(403)
      expect(res.body.detail).to.equal("User has insufficient privilege to put the review of this rule.")
    })
    it('should reject delete modification  of metadata key to read only review metadata on test asset with test ruleId', async () => {
      const res = await chai.request(config.baseUrl)
        .delete(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testAsset.testRuleId}/metadata/keys/${reference.reviewMetadataKey}`)
        .set('Authorization', `Bearer ${lvl1.token}`)
        .send(`${JSON.stringify(reference.reviewMetadataValue)}`)
    
      expect(res).to.have.status(403)
    })
})

describe(`Test manage user access (r,rw,none)`, () => {`  `

    before(async function () {
        await utils.loadAppData()
    })
    it(`should set users ACL in test collection `, async () => {
        const res = await chai.request(config.baseUrl)
            .put(`/collections/${reference.testCollection.collectionId}/grants/user/${lvl3.userId}/access`)
            .set('Authorization', `Bearer ${admin.token}`)
            .send(lvl3TestAcl.put)
        expect(res).to.have.status(200)
        // needs tesitng but as of rn the endpont is broke 
    })
    it("should confirm users effective acl was set ", async () => {
        const res = await chai.request(config.baseUrl)
            .get(`/collections/${reference.testCollection.collectionId}/grants/user/${lvl3.userId}/access/effective`)
            .set('Authorization', `Bearer ${admin.token}`)
            expect(res).to.have.status(200)
        expect(res.body).to.deep.equalInAnyOrder(lvl3TestAcl.response)
    })
    it("should get reviews that is associated with the ACL and confirm that is it all read only.", async () => {

        const res = await chai.request(config.baseUrl)
            .get(`/collections/${reference.testCollection.collectionId}/reviews?rules=default-mapped`)
            .set('Authorization', `Bearer ${lvl3.token}`)
            expect(res).to.have.status(200)

        for(const review of res.body){
            if (review.assetId === reference.testAsset.assetId && review.ruleId === reference.testCollection.ruleId){
                expect(review.access).to.equal("r")
            }
            if(review.assetId === "62"){
                expect(review.access).to.equal("r")
            }
            if(review.assetId === "154"){
                expect(review.access).to.equal("rw")
            }
        }
    })
    it("should reject POST  modification to reviews that is associated with the ACLs that are read only", async () => {
      

      const res = await chai.request(config.baseUrl)
          .post(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}`)
          .set('Authorization', `Bearer ${lvl3.token}`)
          .send([
            {
            "ruleId": reference.testCollection.ruleId,
            "result": "pass",
            "detail": "test\nvisible to lvl1",
            "comment": "sure",
            "autoResult": false,
            "status": "submitted"
            }
        ])
      expect(res).to.have.status(200)
      expect(res.body.rejected).to.have.length(1)
      expect(res.body.rejected[0].reason).to.equal("no grant for this asset/ruleId")
    })
    it("should reject PUT modification to reviews that is associated with the ACLs that are read only", async () => {

      const res = await chai.request(config.baseUrl)
          .put(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}`)
          .set('Authorization', `Bearer ${lvl3.token}`)
          .send({
            result: 'pass',
            detail: '',
            comment: 'sure',
            status: 'accepted',
            autoResult: false
          })
      expect(res).to.have.status(403)
      expect(res.body.detail).to.equal("no grant for this asset/ruleId")
    })
    it("should reject PATCH modification to read only review on test asset with test ruleId", async () => {

      const res = await chai.request(config.baseUrl)
          .patch(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}`)
          .set('Authorization', `Bearer ${lvl3.token}`)
          .send({
            result: 'pass',
          })
      expect(res).to.have.status(403)
      expect(res.body.detail).to.equal("no grant for this asset/ruleId")
    })
    it("should reject DELETE modification to read only review on test asset with test ruleId", async () => {

      const res = await chai.request(config.baseUrl)
          .delete(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}`)
          .set('Authorization', `Bearer ${lvl3.token}`)
         
      expect(res).to.have.status(403)
    })
    it("should reject put modification to read only review metadata on test asset with test ruleId", async () => {

      const res = await chai.request(config.baseUrl)
          .put(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}/metadata`)
          .set('Authorization', `Bearer ${lvl3.token}`)
          .send({[reference.reviewMetadataKey]: reference.reviewMetadataValue})
      expect(res).to.have.status(403)
      expect(res.body.detail).to.equal("User has insufficient privilege to put the review of this rule.")

    })
    it("should reject patch modification to read only review metadata on test asset with test ruleId", async () => {

      const res = await chai.request(config.baseUrl)
          .patch(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}/metadata`)
          .set('Authorization', `Bearer ${lvl3.token}`)
          .send({[reference.reviewMetadataKey]: reference.reviewMetadataValue})
      expect(res).to.have.status(403)
      expect(res.body.detail).to.equal("User has insufficient privilege to patch the review of this rule.")
      
    })
    it("should reject put modification to read only review metadata on test asset with test ruleId", async () => {

      const res = await chai.request(config.baseUrl)
          .put(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}/metadata`)
          .set('Authorization', `Bearer ${lvl3.token}`)
          .send({[reference.reviewMetadataKey]: reference.reviewMetadataValue})
      expect(res).to.have.status(403)
      expect(res.body.detail).to.equal("User has insufficient privilege to put the review of this rule.")
    })
    it('should reject delete modification  of metadata key to read only review metadata on test asset with test ruleId', async () => {
      const res = await chai.request(config.baseUrl)
        .delete(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testAsset.testRuleId}/metadata/keys/${reference.reviewMetadataKey}`)
        .set('Authorization', `Bearer ${lvl3.token}`)
        .send(`${JSON.stringify(reference.reviewMetadataValue)}`)
    
      expect(res).to.have.status(403)
    })
})

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

describe("Test restricted user group access (r,rw,none)", ()  => {

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

  // make a group with lvl1 in it
  it('should create a userGroup', async () => {
    const res = await chai
        .request(config.baseUrl)
        .post(`/user-groups?elevate=true&projection=collections&projection=users`)
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
      expect(res.body.collections).to.be.empty
      for(let user of res.body.users) {
        expect(user.userId, "expect userId to be equal to the userId returned from API").to.equal(lvl1.userId)
        expect(user.username, "expect username to be equal to the username returned from API").to.equal(lvl1.name)
      }
  }) 

  it("should delete lvl1 users direct grant to test collection", async () => {

    const res = await chai.request(config.baseUrl)
      .delete(`/collections/${reference.testCollection.collectionId}/grants/user/${lvl1.userId}`)
      .set('Authorization', `Bearer ${admin.token}`)
    expect(res).to.have.status(200)

  })

  // assign group to test collection with restricted 
  it("should assign group created to the test collection with restricted grant", async function () {

    const res = await chai.request(config.baseUrl)
    .put(`/collections/${reference.testCollection.collectionId}/grants/user-group/${userGroup.userGroupId}`)
    .set('Authorization', `Bearer ${admin.token}`)
    .send({
      accessLevel: 1
    })
    expect(res).to.have.status(201)
    expect(res.body.accessLevel).to.equal(1)
  })
  
  // give it read only to something use lvl1TEstAcl object
  it("should set userGroups ACL in test collection", async () => {

    const res = await chai.request(config.baseUrl)
        .put(`/collections/${reference.testCollection.collectionId}/grants/user-group/${userGroup.userGroupId}/access`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send(lvl1TestAcl.put)

        expect(res).to.have.status(200)
        expect(res.body.defaultAccess).to.equal("none")
  })

  // get the effective acl and confirm that it is read only and grantee from the group
  it("should confirm users effective acl was set ", async () => {
    const res = await chai.request(config.baseUrl)
        .get(`/collections/${reference.testCollection.collectionId}/grants/user/${lvl1.userId}/access/effective`)
        .set('Authorization', `Bearer ${admin.token}`)
    expect(res).to.have.status(200)
    
    for(const acl of res.body){
      if(acl.asset.assetId === reference.testAsset.assetId){
        expect(acl.access).to.equal("r")
        expect(acl.aclSources[0].grantee.userGroupId).to.equal(parseInt(userGroup.userGroupId))
      }
    }
  })

  it("should get reviews that is associated with the ACL and confirm that is it all read only.", async () => {

    const res = await chai.request(config.baseUrl)
        .get(`/collections/${reference.testCollection.collectionId}/reviews?rules=default-mapped`)
        .set('Authorization', `Bearer ${lvl1.token}`)
    expect(res).to.have.status(200)

    for(const review of res.body){
        if(review.assetId === "154"){
            expect(review.access).to.equal("rw")
        }
        else if (review.assetId === reference.testAsset.assetId){
            expect(review.access).to.equal("r")
        }
        // sanity check
        if(review.assetId === reference.testAsset.assetId && review.ruleId === reference.testCollection.ruleId){
            expect(review.access, "expect that the test rule exists and is read only").to.equal("r")
        }
    }
  })

  it("should reject PUT modification to reviews that is associated with the ACLs that are read only", async () => {
      
      const res = await chai.request(config.baseUrl)
          .put(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}`)
          .set('Authorization', `Bearer ${lvl1.token}`)
          .send({
            result: 'pass',
            detail: '',
            comment: 'sure',
            status: 'accepted',
            autoResult: false
          })
      expect(res).to.have.status(403)
      expect(res.body.detail).to.equal("no grant for this asset/ruleId")
  })

  it("should reject PATCH modification to read only review on test asset with test ruleId", async () => {
      
      const res = await chai.request(config.baseUrl)
          .patch(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}`)
          .set('Authorization', `Bearer ${lvl1.token}`)
          .send({
            result: 'pass',
          })
      expect(res).to.have.status(403)
      expect(res.body.detail).to.equal("no grant for this asset/ruleId")
  })

  it("should reject DELETE modification to read only review on test asset with test ruleId", async () => {

    const res = await chai.request(config.baseUrl)
        .delete(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}`)
        .set('Authorization', `Bearer ${lvl1.token}`)
        
    expect(res).to.have.status(403)
  })
  it("should reject put modification to read only review metadata on test asset with test ruleId", async () => {

    const res = await chai.request(config.baseUrl)
        .put(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}/metadata`)
        .set('Authorization', `Bearer ${lvl1.token}`)
        .send({[reference.reviewMetadataKey]: reference.reviewMetadataValue})
    expect(res).to.have.status(403)
    expect(res.body.detail).to.equal("User has insufficient privilege to put the review of this rule.")

  })
  it("should reject patch modification to read only review metadata on test asset with test ruleId", async () => {

    const res = await chai.request(config.baseUrl)
        .patch(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}/metadata`)
        .set('Authorization', `Bearer ${lvl1.token}`)
        .send({[reference.reviewMetadataKey]: reference.reviewMetadataValue})
    expect(res).to.have.status(403)
    expect(res.body.detail).to.equal("User has insufficient privilege to patch the review of this rule.")
    
  })
  it("should reject put modification to read only review metadata on test asset with test ruleId", async () => {

    const res = await chai.request(config.baseUrl)
        .put(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}/metadata`)
        .set('Authorization', `Bearer ${lvl1.token}`)
        .send({[reference.reviewMetadataKey]: reference.reviewMetadataValue})
    expect(res).to.have.status(403)
    expect(res.body.detail).to.equal("User has insufficient privilege to put the review of this rule.")
  })
  it('should reject delete modification  of metadata key to read only review metadata on test asset with test ruleId', async () => {
    const res = await chai.request(config.baseUrl)
      .delete(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testAsset.testRuleId}/metadata/keys/${reference.reviewMetadataKey}`)
      .set('Authorization', `Bearer ${lvl1.token}`)
      .send(`${JSON.stringify(reference.reviewMetadataValue)}`)
  
    expect(res).to.have.status(403)
  })

})

describe(`Multiple Group Role Collsions`, () => {

  before(async function () {
      await utils.loadAppData()
  })
  
  let userGroup1
  let userGroup2

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
})

describe("Multiple Group ACL Collisions", () => {

  // will create following sinceros where we have two restricted groups 
  // 1.) group 1 will get rw on test asset and group 2 will get r on test asset should take r 
  // 2.) group 1 will get rw on test asset and group 2 will get none on test asset should take none
  // 3.) group 1 will get rw on test asset and group 2 will get rw on test asset should take rw but idk how? 
  // 4.) on each of these tests try to write to the asset and check outcome. 

  // 1.) do same with a label

  // 1.) do same with an advanced ACL. 

  before(async function () {
      await utils.loadAppData()
  })

  let userGroup1
  let userGroup2

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
              "name": "ACLCollisionGroup1",
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
          "name": "ACLCollisionGroup2",
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

  /*
  Do not run at this level, run at describe above
  */
  describe("Group 1: r, Group 2: rw on Asset", () => {

      it(`should set group1 acl to r on test asset`, async () => {
          const res = await chai.request(config.baseUrl)
          .put(`/collections/${reference.testCollection.collectionId}/grants/user-group/${userGroup1.userGroupId}/access`)
          .set('Authorization', `Bearer ${config.adminToken}`)
          .send([{"assetId":reference.testAsset.assetId,"access":"r"}])

          expect(res).to.have.status(200)
          expect(res.body.defaultAccess).to.equal("none")
          expect(res.body.acl.length).to.equal(1)
          expect(res.body.acl[0].access).to.equal("r")
          expect(res.body.acl[0].asset.assetId).to.equal(reference.testAsset.assetId)

      })

      it(`should set group2 acl to rw on test asset`, async () => {
          const res = await chai.request(config.baseUrl)
          .put(`/collections/${reference.testCollection.collectionId}/grants/user-group/${userGroup2.userGroupId}/access`)
          .set('Authorization', `Bearer ${config.adminToken}`)
          .send([{"assetId":reference.testAsset.assetId,"access":"rw"}])

          expect(res).to.have.status(200)
          expect(res.body.defaultAccess).to.equal("none")
          expect(res.body.acl.length).to.equal(1)
          expect(res.body.acl[0].access).to.equal("rw")
          expect(res.body.acl[0].asset.assetId).to.equal(reference.testAsset.assetId)
      })
      

      it("should confirm group1 acl was set", async () => {
          const res = await chai.request(config.baseUrl)
              .get(`/collections/${reference.testCollection.collectionId}/grants/user-group/${userGroup1.userGroupId}/access`)
              .set('Authorization', `Bearer ${config.adminToken}`)
          expect(res).to.have.status(200)
          expect(res.body.defaultAccess).to.equal("none")
          expect(res.body.acl.length).to.equal(1)
          expect(res.body.acl[0].access).to.equal("r")
      })

      it("should confirm group2 acl was set", async () => {
          const res = await chai.request(config.baseUrl)
              .get(`/collections/${reference.testCollection.collectionId}/grants/user-group/${userGroup2.userGroupId}/access`)
              .set('Authorization', `Bearer ${config.adminToken}`)
          expect(res).to.have.status(200)
          expect(res.body.defaultAccess).to.equal("none")
          expect(res.body.acl.length).to.equal(1)
          expect(res.body.acl[0].access).to.equal("rw")
      })

      it('should return all resources with access of "r" from ACLCollisionGroup1', async () => {
          const res = await chai.request(config.baseUrl)
              .get(`/collections/${reference.testCollection.collectionId}/grants/user/${lvl1.userId}/access/effective`)
              .set('Authorization', `Bearer ${config.adminToken}`)
          expect(res).to.have.status(200)

          for(const acl of res.body){
              expect(acl.access).to.be.equal("r")
              expect(acl.asset.assetId).to.be.equal(reference.testAsset.assetId)
              expect(acl.aclSources.length).to.be.equal(1)
              expect(acl.aclSources[0].aclRule.access).to.be.equal("r")
              expect(acl.aclSources[0].grantee.name).to.be.equal("ACLCollisionGroup1")
              expect(acl.aclSources[0].grantee.accessLevel).to.be.equal(1)
          }
      })
  })

  describe("Group 1: r, Group 2: none on Asset", () => {

      it(`should set group1 acl to r on test asset`, async () => {
          const res = await chai.request(config.baseUrl)
          .put(`/collections/${reference.testCollection.collectionId}/grants/user-group/${userGroup1.userGroupId}/access`)
          .set('Authorization', `Bearer ${config.adminToken}`)
          .send([{"assetId":reference.testAsset.assetId,"access":"r"}])

          expect(res).to.have.status(200)
          expect(res.body.defaultAccess).to.equal("none")
          expect(res.body.acl.length).to.equal(1)
          expect(res.body.acl[0].access).to.equal("r")
          expect(res.body.acl[0].asset.assetId).to.equal(reference.testAsset.assetId)

      })

      it(`should set group2 acl to none on test asset`, async () => {
          const res = await chai.request(config.baseUrl)
          .put(`/collections/${reference.testCollection.collectionId}/grants/user-group/${userGroup2.userGroupId}/access`)
          .set('Authorization', `Bearer ${config.adminToken}`)
          .send([{"assetId":reference.testAsset.assetId,"access":"none"}])

          expect(res).to.have.status(200)
          expect(res.body.defaultAccess).to.equal("none")
          expect(res.body.acl.length).to.equal(1)
          expect(res.body.acl[0].access).to.equal("none")
          expect(res.body.acl[0].asset.assetId).to.equal(reference.testAsset.assetId)
      })

      it("should confirm group1 acl was set", async () => {
          const res = await chai.request(config.baseUrl)
              .get(`/collections/${reference.testCollection.collectionId}/grants/user-group/${userGroup1.userGroupId}/access`)
              .set('Authorization', `Bearer ${config.adminToken}`)
          expect(res).to.have.status(200)
          expect(res.body.defaultAccess).to.equal("none")
          expect(res.body.acl.length).to.equal(1)
          expect(res.body.acl[0].access).to.equal("r")
      })

      it("should confirm group2 acl was set", async () => {
          const res = await chai.request(config.baseUrl)
              .get(`/collections/${reference.testCollection.collectionId}/grants/user-group/${userGroup2.userGroupId}/access`)
              .set('Authorization', `Bearer ${config.adminToken}`)
          expect(res).to.have.status(200)
          expect(res.body.defaultAccess).to.equal("none")
          expect(res.body.acl.length).to.equal(1)
          expect(res.body.acl[0].access).to.equal("none")
      })

      it('should return empty array because user as "none"', async () => {
          const res = await chai.request(config.baseUrl)
              .get(`/collections/${reference.testCollection.collectionId}/grants/user/${lvl1.userId}/access/effective`)
              .set('Authorization', `Bearer ${config.adminToken}`)
          expect(res).to.have.status(200)

          expect(res.body).to.be.empty
      })
  })

  describe("Group 1: rw, Group 2: r on Test Label", () => {

      it(`should set group1 acl to rw on test label`, async () => {
          const res = await chai.request(config.baseUrl)
          .put(`/collections/${reference.testCollection.collectionId}/grants/user-group/${userGroup1.userGroupId}/access`)
          .set('Authorization', `Bearer ${config.adminToken}`)
          .send([{"labelId":reference.testCollection.fullLabel,"access":"rw"}])

          expect(res).to.have.status(200)
          expect(res.body.defaultAccess).to.equal("none")
          expect(res.body.acl.length).to.equal(1)
          expect(res.body.acl[0].access).to.equal("rw")
          expect(res.body.acl[0].label.labelId).to.equal(reference.testCollection.fullLabel)

      })

      it(`should set group2 acl to r on test label`, async () => {
          const res = await chai.request(config.baseUrl)
          .put(`/collections/${reference.testCollection.collectionId}/grants/user-group/${userGroup2.userGroupId}/access`)
          .set('Authorization', `Bearer ${config.adminToken}`)
          .send([{"labelId":reference.testCollection.fullLabel,"access":"r"}])

          expect(res).to.have.status(200)
          expect(res.body.defaultAccess).to.equal("none")
          expect(res.body.acl.length).to.equal(1)
          expect(res.body.acl[0].access).to.equal("r")
          expect(res.body.acl[0].label.labelId).to.equal(reference.testCollection.fullLabel)
      })

      it("should confirm group1 acl was set", async () => {
          const res = await chai.request(config.baseUrl)
              .get(`/collections/${reference.testCollection.collectionId}/grants/user-group/${userGroup1.userGroupId}/access`)
              .set('Authorization', `Bearer ${config.adminToken}`)
          expect(res).to.have.status(200)
          expect(res.body.defaultAccess).to.equal("none")
          expect(res.body.acl.length).to.equal(1)
          expect(res.body.acl[0].access).to.equal("rw")
      })

      it("should confirm group2 acl was set", async () => {
          const res = await chai.request(config.baseUrl)
              .get(`/collections/${reference.testCollection.collectionId}/grants/user-group/${userGroup2.userGroupId}/access`)
              .set('Authorization', `Bearer ${config.adminToken}`)
          expect(res).to.have.status(200)
          expect(res.body.defaultAccess).to.equal("none")
          expect(res.body.acl.length).to.equal(1)
          expect(res.body.acl[0].access).to.equal("r")
      })

      it('should return read only assets from group 2s read ACL', async () => {
          const res = await chai.request(config.baseUrl)
              .get(`/collections/${reference.testCollection.collectionId}/grants/user/${lvl1.userId}/access/effective`)
              .set('Authorization', `Bearer ${config.adminToken}`)
          expect(res).to.have.status(200)
          for(const acl of res.body){
              expect(acl.access).to.be.equal("r")
              expect(acl.asset.assetId).to.be.oneOf(["42","62"])
              expect(acl.aclSources.length).to.be.equal(1)
              expect(acl.aclSources[0].aclRule.access).to.be.equal("r")
              expect(acl.aclSources[0].grantee.name).to.be.equal("ACLCollisionGroup2")
              expect(acl.aclSources[0].grantee.accessLevel).to.be.equal(1)
          }
      })
  })

  describe("Advanced ACL collision", () => {

      it(`should set group1 acl to rw on test label`, async () => {
          const res = await chai.request(config.baseUrl)
          .put(`/collections/${reference.testCollection.collectionId}/grants/user-group/${userGroup1.userGroupId}/access`)
          .set('Authorization', `Bearer ${config.adminToken}`)
          .send([{"labelId":reference.testCollection.fullLabel, "benchmarkId":reference.testCollection.benchmark, "access":"rw"}, {"assetId":"154","access":"r"}])

          expect(res).to.have.status(200)
          expect(res.body.defaultAccess).to.equal("none")
          expect(res.body.acl.length).to.equal(2)
          for(const acl of res.body.acl){
              if(acl.label){
                  expect(acl.access).to.equal("rw")
              }
              else {
                  expect(acl.access).to.equal("r")
              }
          }
      })

      it(`should set group2 acl to r on test label`, async () => {
          const res = await chai.request(config.baseUrl)
          .put(`/collections/${reference.testCollection.collectionId}/grants/user-group/${userGroup2.userGroupId}/access`)
          .set('Authorization', `Bearer ${config.adminToken}`)
          .send([{"labelId":reference.testCollection.fullLabel,"access":"r"}])

          expect(res).to.have.status(200)
          expect(res.body.defaultAccess).to.equal("none")
          expect(res.body.acl.length).to.equal(1)
          expect(res.body.acl[0].access).to.equal("r")
          expect(res.body.acl[0].label.labelId).to.equal(reference.testCollection.fullLabel)
      })

      it("should confirm group1 acl was set", async () => {
          const res = await chai.request(config.baseUrl)
              .get(`/collections/${reference.testCollection.collectionId}/grants/user-group/${userGroup1.userGroupId}/access`)
              .set('Authorization', `Bearer ${config.adminToken}`)
          expect(res).to.have.status(200)
          expect(res.body.defaultAccess).to.equal("none")
          expect(res.body.acl.length).to.equal(2)
          for(const acl of res.body.acl){
              if(acl.label){
                  expect(acl.access).to.equal("rw")
              }
              else {
                  expect(acl.access).to.equal("r")
              }
          }
      })

      it("should confirm group2 acl was set", async () => {
          const res = await chai.request(config.baseUrl)
              .get(`/collections/${reference.testCollection.collectionId}/grants/user-group/${userGroup2.userGroupId}/access`)
              .set('Authorization', `Bearer ${config.adminToken}`)
          expect(res).to.have.status(200)
          expect(res.body.defaultAccess).to.equal("none")
          expect(res.body.acl.length).to.equal(1)
          expect(res.body.acl[0].access).to.equal("r")
      })

      it('should return effective ACLs belonging from a combination of both groups', async () => {
          const res = await chai.request(config.baseUrl)
              .get(`/collections/${reference.testCollection.collectionId}/grants/user/${lvl1.userId}/access/effective`)
              .set('Authorization', `Bearer ${config.adminToken}`)
          expect(res).to.have.status(200)
          for(const acl of res.body){
              if(acl.asset.assetId === "154"){
                  expect(acl.access).to.be.equal("r")
                  expect(acl.aclSources[0].grantee.name).to.be.equal("ACLCollisionGroup1")
              }
              else if(acl.asset.assetId === "42" || acl.asset.assetId === "62"){
                 if(acl.benchmarkId === reference.testCollection.benchmark){
                      expect(acl.access).to.be.equal("rw")
                      expect(acl.aclSources[0].grantee.name).to.be.equal("ACLCollisionGroup1")
                 }
                 else {
                      expect(acl.access).to.be.equal("r")
                      expect(acl.aclSources[0].grantee.name).to.be.equal("ACLCollisionGroup2")
                 }
              }
          }
      })
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
