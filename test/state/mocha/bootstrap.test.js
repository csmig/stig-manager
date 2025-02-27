import { expect } from 'chai'
import { spawnApiWait, spawnMockKeycloak, spawnMySQL, simpleRequest, spawnApi, waitChildClose } from './lib.js'
import addContext from 'mochawesome/addContext.js'

describe('no dependencies', () => {
  let api
  const STIGMAN_DEPENDENCY_RETRIES = 2
  before('starting api', async function () {
    api = await spawnApi({
      STIGMAN_DEPENDENCY_RETRIES
    })
  })

  describe('/op/state', function () {
    it('should return correct state', async () => {
      const res = await simpleRequest('http://localhost:54000/api/op/state')
      expect(res.status).to.equal(200)
      expect(res.body.state).to.equal('starting')
      expect(res.body.dependencies).to.eql({db: false, oidc: false})
    })
    it('should return 503 when dependencies are not available', async () => {
      const res = await simpleRequest('http://localhost:54000/api/op/configuration')
      expect(res.status).to.equal(503)
      expect(res.body.state).to.equal('starting')
      expect(res.body.dependencies).to.eql({db: false, oidc: false})
    })
    it('should exit after retries', async () => {
      await waitChildClose(api.process)
    }).timeout(STIGMAN_DEPENDENCY_RETRIES * 6000)
  })

  describe('exit code', function () {
    it('should have exited with code 1', () => {
      expect(api.process.exitCode).to.equal(1)
    })
  })  

  describe('dependency failure count', function () {
    it('db failure count', () => {
      const failures = api.logRecords.filter(r => r.type === 'preflight' && r.component === 'mysql' && r.data.success === false)
      expect(failures).to.have.lengthOf(STIGMAN_DEPENDENCY_RETRIES)
    })
    it('oidc failure count', () => {
      const failures = api.logRecords.filter(r => r.type === 'discovery' && r.component === 'oidc' && r.data.success === false)
      expect(failures).to.have.lengthOf(STIGMAN_DEPENDENCY_RETRIES)
    })
  })

  describe('dependency success count', function () {
    it('db success count', () => {
      const successes = api.logRecords.filter(r => r.type === 'preflight' && r.component === 'mysql' && r.data.success === true)
      expect(successes).to.have.lengthOf(0)
    })
    it('oidc success count', () => {
      const successes = api.logRecords.filter(r => r.type === 'discovery' && r.component === 'oidc' && r.data.success === true)
      expect(successes).to.have.lengthOf(0)
    })
  })

  describe('statechanged message', function () {
    it('fail message', () => {
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

describe('both dependencies', () => {
  let api
  let mysql
  let kc
   
  before(async function () {
    kc = spawnMockKeycloak('8080')
    mysql = await spawnMySQL('8.0.41')
    api = await spawnApiWait({
      STIGMAN_DEPENDENCY_RETRIES: 3,
      STIGMAN_DB_PASSWORD: 'stigman',
      STIGMAN_DB_PORT: '3306',
      STIGMAN_OIDC_PROVIDER: `http://localhost:8080/auth/realms/stigman`
    })
  }).timeout(100000)

  after(function () {
    api.process.kill()
    mysql.kill()
    kc.kill()
  })

  describe('/op/state', function () {
    it('should return correct state', async () => {
      const res = await simpleRequest('http://localhost:54000/api/op/state')
      expect(res.status).to.equal(200)
      expect(res.body.state).to.equal('operational')
      expect(res.body.dependencies).to.eql({db: true, oidc: true})
    })
    it('should return 200 when dependencies are available', async () => {
      const res = await simpleRequest('http://localhost:54000/api/op/configuration')
      expect(res.status).to.equal(200)
    })
  })

  describe('dependency failure count', function () {
    it('db', () => {
      const failures = api.logRecords.filter(r => r.type === 'preflight' && r.component === 'mysql' && r.data.success === false)
      expect(failures).to.have.lengthOf(0)
    })
    it('oidc', () => {
      const failures = api.logRecords.filter(r => r.type === 'discovery' && r.component === 'oidc' && r.data.success === false)
      expect(failures).to.have.lengthOf(0)
    })
  })

  describe('dependency success count', function () {
    it('db', () => {
      const successes = api.logRecords.filter(r => r.type === 'preflight' && r.component === 'mysql' && r.data.success === true)
      expect(successes).to.have.lengthOf(1)
    })
    it('oidc', () => {
      const successes = api.logRecords.filter(r => r.type === 'discovery' && r.component === 'oidc' && r.data.success === true)
      expect(successes).to.have.lengthOf(1)
    })
  })

  describe('statechanged message', function () {
    it('fail message', () => {
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

describe('old mysql', () => {
  let api
  let mysql
  let kc

  before(async function () {
    kc = spawnMockKeycloak('8080')
    mysql = await spawnMySQL('8.0.23', '3307')
    api = await spawnApiWait({
      STIGMAN_DEPENDENCY_RETRIES: 3,
      STIGMAN_DB_PASSWORD: 'stigman',
      STIGMAN_DB_PORT: '3307',
      STIGMAN_OIDC_PROVIDER: `http://localhost:8080/auth/realms/stigman`
    })
  }).timeout(100000)

  after(function () {
    api.process.kill()
    mysql.kill()
    kc.kill()
  })

  describe('exit code', function () {
    it('should have exited with code 1', () => {
      expect(api.process.exitCode).to.equal(1)
    })
  })  

  describe('dependency failure count', function () {
    it('db', () => {
      const failures = api.logRecords.filter(r => r.type === 'preflight' && r.component === 'mysql' && r.data.success === false)
      expect(failures).to.have.lengthOf(1)
      expect(failures[0].data.message).to.equal('MySQL release 8.0.23 is too old. Update to release 8.0.24 or later.')
    })
    it('oidc', () => {
      const failures = api.logRecords.filter(r => r.type === 'discovery' && r.component === 'oidc' && r.data.success === false)
      expect(failures).to.have.lengthOf(0)
    })
  })

  describe('dependency success count', function () {
    it('db', () => {
      const successes = api.logRecords.filter(r => r.type === 'preflight' && r.component === 'mysql' && r.data.success === true)
      expect(successes).to.have.lengthOf(0)
    })
    it('oidc', () => {
      const successes = api.logRecords.filter(r => r.type === 'discovery' && r.component === 'oidc' && r.data.success === true)
      expect(successes).to.have.lengthOf(1)
    })
  })

  describe('statechanged message', function () {
    it('fail message', () => {
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

