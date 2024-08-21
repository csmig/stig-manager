// errorHandlers.js
const logger = require('./utils/logger')
const smErrors = require('./utils/error')
const { serializeError } = require('./utils/serializeError')
const path = require('path')
const eovErrors = require(path.join(path.dirname(require.resolve('express-openapi-validator')), 'framework', 'types.js'))

function setupErrorHandlers(app) {
  app.use((err, req, res, next) => {
    if (!(err instanceof smErrors.SmError) && !(err instanceof eovErrors.HttpError)) {
      logger.writeError('rest', 'error', {
        request: logger.serializeRequest(req),
        error: serializeError(err)
      })
    }

    res.errorBody = { error: err.message, detail: err.detail, stack: err.stack }
    if (!res._headerSent) {
      res.status(err.status || 500).header(err.headers).json(res.errorBody)
    } else {
      res.write(JSON.stringify(res.errorBody) + '\n')
      res.end()
    }
  })
}

module.exports = setupErrorHandlers
