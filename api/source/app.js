'use strict'

const express = require('express')
const setupConfig = require('./lib/setupConfig')
const setupMiddleware = require('./lib/setupMiddleware')
const setupRoutes = require('./lib/setupRoutes')
const setupErrorHandlers = require('./lib/errorHandlers')
const startServer = require('./lib/server')

const depStatus = { db: 'waiting', auth: 'waiting' }
const config = setupConfig()

// Express app setup
const app = express()
setupMiddleware(app, config)
setupRoutes(app, config)
setupErrorHandlers(app)

// Run the server
startServer(app, config, depStatus)
