// setupRoutes.js
const path = require('path')
const swaggerUi = require('swagger-ui-express')
const jsyaml = require('js-yaml')
const fs = require('fs')
const { middleware: openApiMiddleware } = require('express-openapi-validator')
const auth = require('./utils/auth')

function setupRoutes(app, config) {
  const apiSpecPath = path.join(__dirname, './specification/stig-manager.yaml')
  let spec = fs.readFileSync(apiSpecPath, 'utf8')
  let oasDoc = jsyaml.load(spec)

  oasDoc.info.version = config.version
  oasDoc.servers[0].url = config.swaggerUi.server
  oasDoc.components.securitySchemes.oauth.openIdConnectUrl = `${config.client.authority}/.well-known/openid-configuration`
  config.definition = oasDoc

  app.use('/api', openApiMiddleware({
    apiSpec: apiSpecPath,
    validateRequests: { coerceTypes: false, allowUnknownQueryParameters: false },
    validateResponses: buildResponseValidationConfig(config),
    validateApiSpec: true,
    $refParser: { mode: 'dereference' },
    operationHandlers: { basePath: path.join(__dirname, 'controllers'), resolver: modulePathResolver },
    validateSecurity: { handlers: { oauth: auth.verifyRequest } },
    fileUploader: false
  }))

  if (config.swaggerUi.enabled) {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(oasDoc, null, {
      oauth2RedirectUrl: config.swaggerUi.oauth2RedirectUrl,
      oauth: { usePkceWithAuthorizationCodeGrant: true }
    }))

    app.get(['/swagger.json', '/openapi.json'], (req, res) => res.json(oasDoc))
  }
}

module.exports = setupRoutes
