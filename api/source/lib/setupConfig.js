// setupConfig.js
const logger = require('./utils/logger')
const config = require('./utils/config')
const packageJson = require("./package.json")

function setupConfig() {
  logger.writeInfo('index', 'starting', {
    version: packageJson.version,
    env: logger.serializeEnvironment(),
    dirname: __dirname,
    cwd: process.cwd()
  })

  logger.writeInfo('index', 'configuration', config)

  return config
}

module.exports = setupConfig
