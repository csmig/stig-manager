import { expect } from 'chai'
import { spawnApiPromise, spawnHttpServer, spawnMySQL, simpleRequest, waitChildClose } from './lib.js'
import addContext from 'mochawesome/addContext.js'

describe('No dependencies', function () {
  let api
  const STIGMAN_DEPENDENCY_RETRIES = 2
  
  before('starting api', async function () {
    this.timeout(60000)
    api = await spawnApiPromise({
      resolveOnType: 'listening',
      env:{
        STIGMAN_DEPENDENCY_RETRIES
      }
    })
  })

  describe('GET /op/state', function () {
    it('should return state "starting"', async function () {
      const res = await simpleRequest('http://localhost:54000/api/op/state')
      expect(res.status).to.equal(200)
      expect(res.body.state).to.equal('starting')
      expect(res.body.dependencies).to.eql({db: false, oidc: false})
    })
  })
  
  describe('GET /op/configuration', function () {
    it('should return 503 when dependencies are not available', async function () {
      const res = await simpleRequest('http://localhost:54000/api/op/configuration')
      expect(res.status).to.equal(503)
      expect(res.body.state).to.equal('starting')
      expect(res.body.dependencies).to.eql({db: false, oidc: false})
    })
  })

  describe('exit code', function () {
    it('should exit after all retries', async function () {
      this.timeout(STIGMAN_DEPENDENCY_RETRIES * 6000)
      await waitChildClose(api.process)
    })
    it('should have exited with code 1', function () {
      expect(api.process.exitCode).to.equal(1)
    })
  })  

  describe('dependency failure count', function () {
    it('db', function () {
      const failures = api.logRecords.filter(r => r.type === 'preflight' && r.component === 'mysql' && r.data.success === false)
      expect(failures).to.have.lengthOf(STIGMAN_DEPENDENCY_RETRIES)
    })
    it('oidc', function () {
      const failures = api.logRecords.filter(r => r.type === 'discovery' && r.component === 'oidc' && r.data.success === false)
      expect(failures).to.have.lengthOf(STIGMAN_DEPENDENCY_RETRIES)
    })
  })

  describe('dependency success count', function () {
    it('db', function () {
      const successes = api.logRecords.filter(r => r.type === 'preflight' && r.component === 'mysql' && r.data.success === true)
      expect(successes).to.have.lengthOf(0)
    })
    it('oidc', function () {
      const successes = api.logRecords.filter(r => r.type === 'discovery' && r.component === 'oidc' && r.data.success === true)
      expect(successes).to.have.lengthOf(0)
    })
  })

  describe('statechanged message', function () {
    it('currentState = "fail"', function () {
      const stateChanged = api.logRecords.filter(r => r.type === 'statechanged')
      expect(stateChanged).to.have.lengthOf(1)
      expect(stateChanged[0].data).to.eql({currentState: 'fail', previousState: 'starting', dependencyStatus: {db: false, oidc: false}})
    })
  })

  describe('api log', function () {
    it('addContext', function () {
      addContext(this, {title: 'api-log', value: api.logRecords})
    })
  })
})

describe('Both dependencies', function () {
  let api
  let mysql
  let kc
   
  before(async function () {
    this.timeout(60000)
    kc = spawnHttpServer({port:'8080'})
    mysql = await spawnMySQL({tag:'8.0.24'})
    api = await spawnApiPromise({
      resolveOnType: 'started',
      env: {
        STIGMAN_DEPENDENCY_RETRIES: 2,
        STIGMAN_DB_PASSWORD: 'stigman',
        STIGMAN_DB_PORT: '3306',
        STIGMAN_OIDC_PROVIDER: `http://localhost:8080/auth/realms/stigman`
      }
    })
  })

  after(function () {
    api.process.kill()
    mysql.kill()
    kc.kill()
  })

  describe('GET /op/state', function () {
    it('should return state "operational"', async function () {
      const res = await simpleRequest('http://localhost:54000/api/op/state')
      expect(res.status).to.equal(200)
      expect(res.body.state).to.equal('operational')
      expect(res.body.dependencies).to.eql({db: true, oidc: true})
    })
  })
  
  describe('GET /op/configuration', function () {
    it('should return 200 when dependencies are available', async function () {
      const res = await simpleRequest('http://localhost:54000/api/op/configuration')
      expect(res.status).to.equal(200)
    })
  })

  describe('dependency failure count', function () {
    it('db', function () {
      const failures = api.logRecords.filter(r => r.type === 'preflight' && r.component === 'mysql' && r.data.success === false)
      expect(failures).to.have.lengthOf(0)
    })
    it('oidc', function () {
      const failures = api.logRecords.filter(r => r.type === 'discovery' && r.component === 'oidc' && r.data.success === false)
      expect(failures).to.have.lengthOf(0)
    })
  })

  describe('dependency success count', function () {
    it('db', function () {
      const successes = api.logRecords.filter(r => r.type === 'preflight' && r.component === 'mysql' && r.data.success === true)
      expect(successes).to.have.lengthOf(1)
    })
    it('oidc', function () {
      const successes = api.logRecords.filter(r => r.type === 'discovery' && r.component === 'oidc' && r.data.success === true)
      expect(successes).to.have.lengthOf(1)
    })
  })

  describe('statechanged message', function () {
    it('currentState = "operational"', function () {
      const stateChanged = api.logRecords.filter(r => r.type === 'statechanged')
      expect(stateChanged).to.have.lengthOf(1)
      expect(stateChanged[0].data).to.eql({currentState: 'operational', previousState: 'starting', dependencyStatus: {db: true, oidc: true}})
    })
  })

  describe('api log', function () {
    it('addContext', function () {
      addContext(this, {title: 'api-log', value: api.logRecords})
    })
  })
})

describe('Old mysql', function () {
  let api
  let mysql
  let kc

  before(async function () {
    this.timeout(60000)
    kc = spawnHttpServer({port:'8080'})
    mysql = await spawnMySQL({tag:'8.0.23', port:'3307'})
    api = await spawnApiPromise({
      resolveOnClose: true,
      env:{
        STIGMAN_DEPENDENCY_RETRIES: 2,
        STIGMAN_DB_PASSWORD: 'stigman',
        STIGMAN_DB_PORT: '3307',
        STIGMAN_OIDC_PROVIDER: `http://localhost:8080/auth/realms/stigman`
      }
    })
  })

  after(function () {
    api.process.kill()
    mysql.kill()
    kc.kill()
  })

  describe('exit code', function () {
    it('should have exited with code 1', function () {
      expect(api.process.exitCode).to.equal(1)
    })
  })  

  describe('dependency failure count', function () {
    it('db, check message', function () {
      const failures = api.logRecords.filter(r => r.type === 'preflight' && r.component === 'mysql' && r.data.success === false)
      expect(failures).to.have.lengthOf(1)
      expect(failures[0].data.message).to.equal('MySQL release 8.0.23 is too old. Update to release 8.0.24 or later.')
    })
    it('oidc', function () {
      const failures = api.logRecords.filter(r => r.type === 'discovery' && r.component === 'oidc' && r.data.success === false)
      expect(failures).to.have.lengthOf(0)
    })
  })

  describe('dependency success count', function () {
    it('db', function () {
      const successes = api.logRecords.filter(r => r.type === 'preflight' && r.component === 'mysql' && r.data.success === true)
      expect(successes).to.have.lengthOf(0)
    })
    it('oidc', function () {
      const successes = api.logRecords.filter(r => r.type === 'discovery' && r.component === 'oidc' && r.data.success === true)
      expect(successes).to.have.lengthOf(1)
    })
  })

  describe('statechanged message', function () {
    it('currentState = "fail"', function () {
      const stateChanged = api.logRecords.filter(r => r.type === 'statechanged')
      expect(stateChanged).to.have.lengthOf(1)
      expect(stateChanged[0].data).to.eql({currentState: 'fail', previousState: 'starting', dependencyStatus: {db: false, oidc: true}})
    })
  })

  describe('api log', function () {
    it('addContext', function () {
      addContext(this, {title: 'api-log', value: api.logRecords})
    })
  })
})

