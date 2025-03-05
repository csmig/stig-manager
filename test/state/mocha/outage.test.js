import { expect } from 'chai'
import { spawnApiPromise, spawnHttpServer, spawnMySQL, simpleRequest, waitChildClose } from './lib.js'
import addContext from 'mochawesome/addContext.js'

describe('DB outage: shutdown', function () {
  let api
  let mysql
  let kc

  async function waitLogEvent(type) {
    return new Promise((resolve) => {
      api.logEvents.on(type, function (log) {
        resolve(log)
      })
    })
  }
  
  before(async function () {
    this.timeout(60000)
    kc = spawnHttpServer({port:'8080'})
    mysql = await spawnMySQL({tag:'8.0.24'})
    console.log('MYSQL STARTED')
    api = await spawnApiPromise({
      resolveOnType: 'started',
      resolveOnClose: false,
      env: {
        STIGMAN_DEPENDENCY_RETRIES: 2,
        STIGMAN_DB_PASSWORD: 'stigman',
        STIGMAN_DB_HOST: '127.0.0.1',
        STIGMAN_DB_PORT: '3306',
        STIGMAN_OIDC_PROVIDER: `http://127.0.0.1:8080/auth/realms/stigman`
      }
    })
    console.log('API STARTED')
  })

  after(function () {
    api.process.kill()
    mysql.kill()
    kc.kill()
    addContext(this, {title: 'api-log', value: api.logRecords})
  })

  describe('DB up', function () {
    it('should return state "available"', async function () {
      this.timeout(20000)
      const res = await simpleRequest('http://localhost:54000/api/op/state')
      expect(res.status).to.equal(200)
      expect(res.body.state).to.equal('available')
      expect(res.body.dependencies).to.eql({db: true, oidc: true})
    })
  })

  describe('DB shutdown', function () {
    before(async function () {
      mysql.kill()
    })
    it('should return state "unavailable"', async function () {
      this.timeout(30000)
      const log = await waitLogEvent('statechanged')
      expect(log.data.currentState).to.equal('unavailable')
      expect(log.data.previousState).to.equal('available')
      const res = await simpleRequest('http://localhost:54000/api/op/state')
      expect(res.status).to.equal(200)
      expect(res.body.state).to.equal('unavailable')
      expect(res.body.dependencies).to.eql({db: false, oidc: true})     
    })

    it('should log retry fail', async function () {
      this.timeout(30000)
      const log = await waitLogEvent('consoleIntercept')
      expect(log.data.arguments["0"]).to.equal('Error retrying connection: connect ECONNREFUSED 127.0.0.1:3306')
    })
  })

  describe('DB restarted', function() {
    before( async function() {
      this.timeout(30000)
      mysql = await spawnMySQL({tag:'8.0.24'})
      console.log('MYSQL RESTARTED', new Date())
    })

    it('should return state "available"', async function () {
      this.timeout(60000)
      const log = await waitLogEvent('statechanged')
      expect(log.data.currentState).to.equal('available')
      expect(log.data.previousState).to.equal('unavailable')
      const res = await simpleRequest('http://localhost:54000/api/op/state')
      expect(res.status).to.equal(200)
      expect(res.body.state).to.equal('available')
      expect(res.body.dependencies).to.eql({db: true, oidc: true})
    })
  })

})