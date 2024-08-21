// server.js
const http = require('http')
const logger = require('./utils/logger')
const auth = require('./utils/auth')
const db = require('./service/utils')

async function startServer(app, config, depStatus) {
  const server = http.createServer(app)

  server.listen(config.http.port, () => {
    logger.writeInfo('index', 'listening', {
      port: config.http.port,
      api: '/api',
      client: config.client.disabled ? undefined : '/',
      documentation: config.docs.disabled ? undefined : '/docs',
      swagger: config.swaggerUi.enabled ? '/api-docs' : undefined
    })
  })

  try {
    await Promise.all([auth.initializeAuth(depStatus), db.initializeDatabase(depStatus)])
  } catch (e) {
    logger.writeError('index', 'shutdown', { message: 'Failed to setup dependencies', error: serializeError(e) })
    process.exit(1)
  }

  const endTime = process.hrtime.bigint()
  logger.writeInfo('index', 'started', { durationS: Number(endTime - startTime) / 1e9 })
}

module.exports = startServer
