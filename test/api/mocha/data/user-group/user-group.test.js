// const chai = require('chai')
// const chaiHttp = require('chai-http')
// chai.use(chaiHttp)
// const { v4: uuidv4 } = require('uuid')
// const expect = chai.expect
// const config = require('../../testConfig.json')
// const utils = require('../../utils/testUtils.js')
// const iterations = require('../../iterations.js')
// const reference = require('../../referenceData.js')
// const requestBodies = require('./requestBodies.js')

// describe('user-group', () => {

//   before(async function () {
//    // await utils.loadAppData()
//   })

//   for(const iteration of iterations) {

//     // note all these tests are dependant on eachother
//     describe(`iteration:${iteration.name}`, () => {

//       let userGroup = null

//       describe('POST - user-groups', () => {

//         describe(`POST - createUserGroup - /user-groups`, () => {
        
//           it('should create a userGroup', async () => {
//             const res = await chai
//                 .request(config.baseUrl)
//                 .post(`/user-groups?elevate=true&projection=collections&projection=users&projection=attributions`)
//                 .set('Authorization', 'Bearer ' + iteration.token)
//                 .send({
//                   "name": "group" +  uuidv4(),
//                   "description": "test group",
//                   "userIds": [
//                     iteration.userId   
//                   ]
//               })
//               if(iteration.name != "stigmanadmin"){
//                 expect(res).to.have.status(403)
//                 return
//               }
//               userGroup = res.body

//               expect(res).to.have.status(201)
//               expect(res.body.collections).to.be.empty
//               for(let user of res.body.users) {
//                 expect(user.userId, "expect userId to be equal to the userId returned from API").to.equal(iteration.userId)
//                 expect(user.username, "expect username to be equal to the username returned from API").to.equal(iteration.name)
//               }
//               expect(res.body.attributions.created.userId, "expect userId to be equal to the userId returned from API").to.equal(parseInt(iteration.userId))
//               expect(res.body.attributions.created.username, "expect username to be equal to the username returned from API").to.equal(iteration.name)
//               expect(res.body.attributions.modified.userId, "expect userId to be equal to the userId returned from API").to.equal(parseInt(iteration.userId))
//               expect(res.body.attributions.modified.username, "expect username to be equal to the username returned from API").to.equal(iteration.name)
//           })

//           if(iteration.name == "stigmanadmin"){
          
//             it('should throw SmError.UnprocessableError Duplicate name exists.', async () => {
//               const res = await chai
//                   .request(config.baseUrl)
//                   .post(`/user-groups?elevate=true`)
//                   .set('Authorization', 'Bearer ' + iteration.token)
//                   .send({
//                     "name": userGroup.name,
//                     "description": "test group",
//                     "userIds": [
//                       iteration.userId   
//                     ]
//                   })
//                 if(iteration.name != "stigmanadmin"){
//                   expect(res).to.have.status(403)
//                   return
//                 }
//                 expect(res).to.have.status(422)
//             })
//           }
//         })
//       })

//       describe('GET - user-groups', () => {

//         describe(`getUserGroups - /user-groups`, () => {

//           it('should return all userGroups (as of now we should have the one created eariler in tests', async () => {

//             const res = await chai
//               .request(config.baseUrl)
//               .get(`/user-groups?elevate=true`)
//               .set('Authorization', 'Bearer ' + iteration.token)
            
//             if(iteration.name != "stigmanadmin"){
//               expect(res).to.have.status(403)
//               return
//             }
//             expect(res).to.have.status(200)
//           })
//         })
        
//         describe(`getUserGroup - /user-groups/{userGroupId}`, () => {

//           it('should return the userGroup created earlier', async () => {
//             const res = await chai
//               .request(config.baseUrl)
//               .get(`/user-groups/${userGroup.userGroupId}?elevate=true&projection=users&projection=collections&projection=attributions`)
//               .set('Authorization', 'Bearer ' + iteration.token)
//             if(iteration.name != "stigmanadmin"){
//               expect(res).to.have.status(403)
//               return
//             }
//             expect(res).to.have.status(200)
//             expect(res.body.userGroupId, "expect userGroupId to be equal to the userGroupId returned from API").to.equal(userGroup.userGroupId)
//             expect(res.body.name, "expect name to be equal to the name returned from API").to.equal(userGroup.name)
//             expect(res.body.description, "expect description to be equal to the description returned from API").to.equal(userGroup.description)
//             expect(res.body.attributions.created.userId, "expect userId to be equal to the userId returned from API").to.equal(parseInt(iteration.userId))
//             expect(res.body.attributions.created.username, "expect username to be equal to the username returned from API").to.equal(iteration.name)
//             expect(res.body.attributions.modified.userId, "expect userId to be equal to the userId returned from API").to.equal(parseInt(iteration.userId))
//             expect(res.body.attributions.modified.username, "expect username to be equal to the username returned from API").to.equal(iteration.name)
//             expect(res.body.users).to.be.an('array').of.length(1)
//             expect(res.body.users[0].userId, "expect userId to be equal to the userId returned from API").to.equal(iteration.userId)
//           })
//         })
//       })
     
//       // describe('PATCH - user-groups', () => {

//       //   describe(`PATCH - patchUserGroup - /user-groups/{userGroupId}`, async () => {

//       //     it('Merge provided properties with a user - Change Username', async () => {
//       //       const res = await chai
//       //             .request(config.baseUrl)
//       //             .patch(`/users/${testUser.userId}?elevate=true&projection=collectionGrants&projection=statistics`)
//       //             .set('Authorization', 'Bearer ' + iteration.token)
//       //             .send({
//       //               "username": "PatchTest",
//       //           })
//       //           if(iteration.name != "stigmanadmin"){
//       //             expect(res).to.have.status(403)
//       //             return
//       //           }
//       //           expect(res).to.have.status(200)
//       //           expect(res.body.username).to.equal('PatchTest')
//       //           expect(res.body.userId, "expect userId to be equal to scraplvl1users userId").to.equal(testUser.userId)

//       //           for(let grant of res.body.collectionGrants) {
//       //             expect(grant).to.have.property('collection')
//       //             expect(grant).to.have.property('accessLevel')
//       //             expect(grant.collection.collectionId, "expect collectionId to be scrapCollection Id").to.equal(reference.scrapCollection.collectionId)
//       //           }

//       //           const userEffected = await utils.getUser(testUser.userId)

//       //           expect(userEffected).to.be.an('object')
//       //           expect(userEffected.username, "expectthe effected user to be the one returned by the api").to.equal(res.body.username)
//       //           expect(userEffected.userId,"expectthe effected user to be the one returned by the api").to.equal(res.body.userId)
//       //     })
//       //     it("should throw SmError.UnprocessableError collectionIds are invalid.", async () => {
//       //       const res = await chai
//       //           .request(config.baseUrl)
//       //           .patch(`/users/${testUser.userId}?elevate=true`)
//       //           .set('Authorization', 'Bearer ' + iteration.token)
//       //           .send({
//       //             "username": "PatchTest",
//       //             "collectionGrants": [
//       //                 {
//       //                     "collectionId": `${Math.floor(Math.random() * 100022)}`,
//       //                     "accessLevel": 1
//       //                 }
//       //             ]
//       //           })
//       //           if(iteration.name != "stigmanadmin"){
//       //             expect(res).to.have.status(403)
//       //             return
//       //           }
//       //           expect(res).to.have.status(422)
//       //     })
//       //   })

//       // })

//       // describe('PUT - user-groups', () => {

//       //   describe(`PUT - putUserGroup - /user-groups/{userGroupId}`, async () => {

//       //     it(`Set all properties of a user - Change Username`, async () => {
//       //     const res = await chai
//       //       .request(config.baseUrl)
//       //       .put(`/users/${testUser.userId}?elevate=true&projection=collectionGrants&projection=statistics`)
//       //       .set('Authorization', 'Bearer ' + iteration.token)
//       //       .send({
//       //         "username": "putTesting",
//       //         "collectionGrants": [
//       //             {
//       //                 "collectionId": `${reference.scrapCollection.collectionId}`,
//       //                 "accessLevel": 1
//       //             }
//       //         ]
//       //       })
//       //       if(iteration.name != "stigmanadmin"){
//       //         expect(res).to.have.status(403)
//       //         return
//       //       }
//       //       expect(res).to.have.status(200)
//       //       expect(res.body).to.be.an('object')
//       //       expect(res.body.username, "expect username to be putTesting").to.equal('putTesting')
//       //       expect(res.body.userId, "expect userId to be scraplvl1").to.equal(testUser.userId)
//       //       expect(res.body.collectionGrants).to.be.an('array')
//       //       expect(res.body.statistics).to.be.an('object')

//       //       for(let grant of res.body.collectionGrants) {
//       //         expect(grant).to.have.property('collection')
//       //         expect(grant).to.have.property('accessLevel')
//       //         expect(grant.collection.collectionId, "expect to have grant to the scrap collection").to.equal(reference.scrapCollection.collectionId)
//       //       }

//       //       const userEffected = await utils.getUser(res.body.userId)

//       //       expect(userEffected).to.be.an('object')
//       //       expect(userEffected.username, "user effected to have username returned by API").to.equal(res.body.username)
//       //       expect(userEffected.userId, "user effected to have Id returned by API").to.equal(res.body.userId)
//       //       expect(userEffected.collectionGrants).to.be.an('array')

//       //     })

//       //     it("should throw SmError.UnprocessableError collectionIds are invalid.", async () => {
//       //       const res = await chai
//       //           .request(config.baseUrl)
//       //           .put(`/users/${testUser.userId}?elevate=true`)
//       //           .set('Authorization', 'Bearer ' + iteration.token)
//       //           .send({
//       //             "username": "putTesting",
//       //             "collectionGrants": [
//       //                 {
//       //                     "collectionId": `${Math.floor(Math.random() * 100022)}`,
//       //                     "accessLevel": 1
//       //                 }
//       //             ]
//       //           })
//       //           if(iteration.name != "stigmanadmin"){
//       //             expect(res).to.have.status(403)
//       //             return
//       //           }
//       //           expect(res).to.have.status(422)
//       //     })
//       //   })

//       // })

//       // describe('DELETE - user-groups', () => {

//       //   describe(`DELETE - deleteUserGroup - /user-groups/{userGroupId}`, async () => {
//       //     it('Delete a user - fail due to user access record', async () => {
//       //       const res = await chai
//       //         .request(config.baseUrl)
//       //         .delete(`/users/${reference.testCollection.collectionOwnerID}?elevate=true&projection=collectionGrants&projection=statistics`)
//       //         .set('Authorization', 'Bearer ' + iteration.token)
//       //         if(iteration.name != "stigmanadmin"){
//       //           expect(res).to.have.status(403)
//       //           return
//       //         }
//       //         expect(res).to.have.status(422)
//       //     })
//       //     it('Delete a user - succeed, as user has never accessed the system', async () => {
//       //       const res = await chai
//       //         .request(config.baseUrl)
//       //         .delete(`/users/${reference.deleteUser.userId}?elevate=true`)
//       //         .set('Authorization', 'Bearer ' + iteration.token)
//       //         if(iteration.name != "stigmanadmin"){
//       //           expect(res).to.have.status(403)
//       //           return
//       //         }
//       //         expect(res).to.have.status(200)
//       //         const userEffected = await utils.getUser("43")
//       //         expect(userEffected.status, "expect 404 response (user delete worked)").to.equal(404)
//       //     })
//       //     it('Delete a user - not elevated expect fail', async () => {
//       //       const res = await chai
//       //         .request(config.baseUrl)
//       //         .delete(`/users/${43}?elevate=false`)
//       //         .set('Authorization', 'Bearer ' + iteration.token)

//       //         expect(res).to.have.status(403)
//       //     })
//       //     if(iteration.name === "stigmanadmin"){
//       //       it('Delete test user for cleanup', async () => {
//       //         const res = await chai
//       //           .request(config.baseUrl)
//       //           .delete(`/users/${testUser.userId}?elevate=true`)
//       //           .set('Authorization', 'Bearer ' + iteration.token)
//       //           expect(res).to.have.status(200)
//       //       })
//       //     }
//       //   })
      
//       // })
//     })
//   }
// })