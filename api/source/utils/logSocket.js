const logger = require('./logger')
const WebSocket = require('ws')
const component = 'logSocket'

class LogSession {
  constructor(ws) {
    this.ws = ws
  }

  start() {
    logger.loggerEvents.on('log', this.loggerEventHandler)
    this.ws.on('message', this.onSocketMessage)
    this.ws.on('close', this.onSocketClose)
  }

  stop() {
    logger.loggerEvents.off('log', this.loggerEventHandler)
    this.ws.off('message', this.onSocketMessage)
    this.ws.off('close', this.onSocketClose)
  }

  loggerEventHandler = (logObj) => {
    this.ws.send(JSON.stringify(logObj))
  }

  onSocketMessage = (message) => {
    console.log(`Received: ${message}`)
  }

  onSocketClose = () => {
    console.log('Client disconnected')
  }
}

function setupLogSocket (server) {
  const wss = new WebSocket.Server({ server, path: '/log-socket' })
  wss.on('connection', onConnection)
}

function onConnection (ws) {
  console.log('Client connected')
  const logSession = new LogSession(ws)
  logSession.start()
  logger.writeInfo(component, 'connection', {source: `${ws._socket.remoteAddress}:${ws._socket.remotePort}`})
}


module.exports = { setupLogSocket }