import { config } from '../testConfig.js'
import * as utils from '../utils/testUtils.js'
import reference from '../referenceData.js'
import { expect } from 'chai'

const user = {
  name: "admin",
  grant: "Owner",
  token:
    "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJGSjg2R2NGM2pUYk5MT2NvNE52WmtVQ0lVbWZZQ3FvcXRPUWVNZmJoTmxFIn0.eyJleHAiOjE4NjQ2ODEwMzUsImlhdCI6MTY3MDU0MDIzNiwiYXV0aF90aW1lIjoxNjcwNTQwMjM1LCJqdGkiOiI0N2Y5YWE3ZC1iYWM0LTQwOTgtOWJlOC1hY2U3NTUxM2FhN2YiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvYXV0aC9yZWFsbXMvc3RpZ21hbiIsImF1ZCI6WyJyZWFsbS1tYW5hZ2VtZW50IiwiYWNjb3VudCJdLCJzdWIiOiJiN2M3OGE2Mi1iODRmLTQ1NzgtYTk4My0yZWJjNjZmZDllZmUiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJzdGlnLW1hbmFnZXIiLCJub25jZSI6IjMzNzhkYWZmLTA0MDQtNDNiMy1iNGFiLWVlMzFmZjczNDBhYyIsInNlc3Npb25fc3RhdGUiOiI4NzM2NWIzMy0yYzc2LTRiM2MtODQ4NS1mYmE1ZGJmZjRiOWYiLCJhY3IiOiIwIiwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImNyZWF0ZV9jb2xsZWN0aW9uIiwiZGVmYXVsdC1yb2xlcy1zdGlnbWFuIiwiYWRtaW4iXX0sInJlc291cmNlX2FjY2VzcyI6eyJyZWFsbS1tYW5hZ2VtZW50Ijp7InJvbGVzIjpbInZpZXctdXNlcnMiLCJxdWVyeS1ncm91cHMiLCJxdWVyeS11c2VycyJdfSwiYWNjb3VudCI6eyJyb2xlcyI6WyJtYW5hZ2UtYWNjb3VudCIsIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwidmlldy1wcm9maWxlIl19fSwic2NvcGUiOiJvcGVuaWQgc3RpZy1tYW5hZ2VyOmNvbGxlY3Rpb24gc3RpZy1tYW5hZ2VyOnN0aWc6cmVhZCBzdGlnLW1hbmFnZXI6dXNlcjpyZWFkIHN0aWctbWFuYWdlcjpvcCBzdGlnLW1hbmFnZXI6Y29sbGVjdGlvbjpyZWFkIHN0aWctbWFuYWdlcjpvcDpyZWFkIHN0aWctbWFuYWdlcjp1c2VyIHN0aWctbWFuYWdlciBzdGlnLW1hbmFnZXI6c3RpZyIsInNpZCI6Ijg3MzY1YjMzLTJjNzYtNGIzYy04NDg1LWZiYTVkYmZmNGI5ZiIsIm5hbWUiOiJTVElHTUFOIEFkbWluIiwicHJlZmVycmVkX3VzZXJuYW1lIjoic3RpZ21hbmFkbWluIiwiZ2l2ZW5fbmFtZSI6IlNUSUdNQU4iLCJmYW1pbHlfbmFtZSI6IkFkbWluIn0.a1XwJZw_FIzwMXKo-Dr-n11me5ut-SF9ni7ylX-7t7AVrH1eAqyBxX9DXaxFK0xs6YOhoPsh9NyW8UFVaYgtF68Ps6yzoiqFEeiRXkpN5ygICN3H3z6r-YwanLlEeaYR3P2EtHRcrBtCnt0VEKKbGPWOfeiNCVe3etlp9-NQo44",
}

describe('GET - getAllTasks - /jobs/tasks', function () {

  before(async function () {
    await utils.loadAppData()
  })

  it('should get all tasks', async function () {
    const res = await utils.executeRequest(`${config.baseUrl}/jobs/tasks?elevate=true`, 'GET', user.token)
    expect(res.status).to.eql(200)
    expect(res.body).to.be.an('array')
    expect(res.body.length).to.be.greaterThan(0)
  })
})

describe('POST - createJob - /jobs', function () {

  before(async function () {
    await utils.loadAppData()
  })


  it('should create a job without event', async function () {
    let jobId = null
    after(async function () {
      // Clean up job created during test
      if (jobId) {
        await utils.executeRequest(`${config.baseUrl}/jobs/${jobId}?elevate=true`, 'DELETE', user.token)
      }
    })

    const res = await utils.executeRequest(`${config.baseUrl}/jobs?elevate=true`, 'POST', user.token, {
      name: "Test Job",
      tasks: ["1"],
    })
    expect(res.status).to.eql(201)
    expect(res.body).to.be.an('object')
    expect(res.body).to.have.property('jobId')
    jobId = res.body.jobId
    expect(res.body).to.have.property('name', 'Test Job')
    expect(res.body).to.have.property('tasks').that.is.an('array').with.length(1)
  })

  it('should create a job with one-time event', async function () {
    let jobId = null
    after(async function () {
      // Clean up job created during test
      if (jobId) {
        await utils.executeRequest(`${config.baseUrl}/jobs/${jobId}?elevate=true`, 'DELETE', user.token)
      }
    })

    const res = await utils.executeRequest(`${config.baseUrl}/jobs?elevate=true`, 'POST', user.token, {
      name: "Test Job with Event",
      tasks: ["1"],
      event: {
        type: "once",
        starts: '2099-01-01T00:00:00Z',
      }
    })
    expect(res.status).to.eql(201)
    expect(res.body).to.be.an('object')
    expect(res.body).to.have.property('jobId')
    jobId = res.body.jobId
    expect(res.body).to.have.property('name', 'Test Job with Event')
    expect(res.body).to.have.property('tasks').that.is.an('array').with.length(1)
    expect(res.body).to.have.property('event').that.is.an('object')
    expect(res.body.event).to.have.property('type', 'once')
    expect(res.body.event).to.have.property('starts')
  })

  it('should create a job with recurring event enabled', async function () {
    let jobId = null
    after(async function () {
      // Clean up job created during test
      if (jobId) {
        await utils.executeRequest(`${config.baseUrl}/jobs/${jobId}?elevate=true`, 'DELETE', user.token)
      }
    })

    const res = await utils.executeRequest(`${config.baseUrl}/jobs?elevate=true`, 'POST', user.token, {
      name: "Test Job with Event",
      tasks: ["1"],
      event: {
        type: "recurring",
        interval: {
          value: "1",
          field: "day"
        },
        starts: '2099-01-01T00:00:00Z',
      }
    })
    expect(res.status).to.eql(201)
    expect(res.body).to.be.an('object')
    expect(res.body).to.have.property('jobId')
    jobId = res.body.jobId
    expect(res.body).to.have.property('name', 'Test Job with Event')
    expect(res.body).to.have.property('tasks').that.is.an('array').with.length(1)
    expect(res.body).to.have.property('event').that.is.an('object')
    expect(res.body.event).to.have.property('type', 'recurring')
    expect(res.body.event).to.have.property('interval').that.is.an('object')
    expect(res.body.event.interval).to.have.property('value', '1')
    expect(res.body.event.interval).to.have.property('field', 'day')
    expect(res.body.event).to.have.property('starts')
    expect(res.body.event).to.have.property('enabled', true)
  })

})