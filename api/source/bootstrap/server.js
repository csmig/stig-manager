const http = require('node:http')
const logger = require('../utils/logger')
const state = require('../utils/state')
const OperationSvc = require(`../service/OperationService`)
const { serializeError } = require('../utils/serializeError')
const config = require('../utils/config')
const { initializeDependencies } = require('./dependencies')
const WebSocket = require('ws')
const { Writable } = require('stream');



async function startServer(app, startTime) {

  const server = http.createServer(app)

  const onListenError = (e) => {
    logger.writeError('server', 'shutdown', { message: `Server failed establishing or while listening on port ${config.http.port}`, error: serializeError(e) })
    state.setState('fail')
  }
  server.on('error', onListenError)

  const wss = new WebSocket.Server({ server, path: '/ws' })

  wss.on('connection', (ws) => {
    console.log('Client connected')

    const loggerEventHandler = (logObj) => {
      ws.send(JSON.stringify(logObj))
    }

    logger.loggerEvents.on('log', loggerEventHandler)

    ws.on('message', (message) => { 
      console.log(`Received: ${message}`)
    })

    ws.on('close', () => {
      logger.loggerEvents.off('log', loggerEventHandler)
      console.log('Client disconnected')
    })
  })

  server.listen(config.http.port, async function () {
    server.removeListener('error', onListenError)
    logger.writeInfo('server', 'listening', {
      port: config.http.port,
      api: '/api',
      client: config.client.disabled ? undefined : '/',
      documentation: config.docs.disabled ? undefined : '/docs',
      swagger: config.swaggerUi.enabled ? '/api-docs' : undefined
    })
    await initializeDependencies()
    // Set/change classification if indicated
    await applyConfigurationSettings()
    logStartupDuration(startTime)
  })
}

async function applyConfigurationSettings() {
  if (config.settings.setClassification) {
    await OperationSvc.setConfigurationItem('classification', config.settings.setClassification)
  }
}

function logStartupDuration(startTime) {
  const endTime = process.hrtime.bigint()
  logger.writeInfo('server', 'started', {
    durationS: Number(endTime - startTime) / 1e9
  })
}

module.exports = startServer
