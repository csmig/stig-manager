// setupMiddleware.js
const express = require('express')
const cors = require('cors')
const compression = require('compression')
const multer = require('multer')
const logger = require('./utils/logger')
const depStatusManager = require('./depStatusManager')

function setupMiddleware(app, config) {
  const storage = multer.memoryStorage()
  const upload = multer({
    storage,
    limits: { fileSize: parseInt(config.http.maxUpload) }
  })

  app.use(upload.single('importFile'))
  app.use(express.urlencoded({ extended: true }))
  app.use(express.json({ strict: false, limit: parseInt(config.http.maxJsonBody) }))
  app.use(cors())

  app.use(logger.requestLogger)

  app.use(compression({
    filter: (req, res) => !req.noCompression && compression.filter(req, res)
  }))

  // 503 Service Unavailable Check
  app.use((req, res, next) => {
    try {
      const depStatus = depStatusManager.getStatus()
      if ((depStatus.db === 'up' && depStatus.auth === 'up') || req.url.startsWith('/api/op/definition')) {
        next()
      } else {
        res.status(503).json({ status: depStatus })
      }
    } catch (e) {
      next(e)
    }
  })

}

module.exports = setupMiddleware
