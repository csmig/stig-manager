const logger = require('./logger')
const WebSocket = require('ws')
const component = 'logSocket'
const auth = require('./auth')
const uuid = require('uuid')

class LogSession {
  constructor(ws) {
    this.ws = ws;
    this.authorized = false;
    this.tokenExp = null;
    this.logForwarding = false;
    this.sessionId = uuid.v1();
  }

  start = () => {
    this.ws.on('message', this.onSocketMessage);
    this.ws.on('close', this.onSocketClose);
    // Initial handshake: send authorize request
    this.send({ type: 'authorize', data: null });
    logger.writeInfo(component, 'session-start', { sessionId: this.sessionId, msg: 'Session started, sent authorize request' });
  }

  stop = () => {
    this.disableLogForwarding();
    this.ws.off('message', this.onSocketMessage);
    this.ws.off('close', this.onSocketClose);
    if (this.tokenTimer) clearTimeout(this.tokenTimer);
    logger.writeInfo(component, 'session-stop', { sessionId: this.sessionId, msg: 'Session stopped' });
  }

  enableLogForwarding = () => {
    if (!this.logForwarding) {
      logger.loggerEvents.on('log', this.loggerEventHandler);
      this.logForwarding = true;
    }
  }

  disableLogForwarding = () => {
    if (this.logForwarding) {
      logger.loggerEvents.off('log', this.loggerEventHandler);
      this.logForwarding = false;
    }
  }

  loggerEventHandler = (logObj) => {
    if (this.authorized) {
      this.send({ type: 'log', data: logObj });
    }
  }

  onSocketMessage = (message) => {
    let msgObj;
    try {
      msgObj = JSON.parse(message);
    } catch {
      this.send({ type: 'error', data: 'Invalid JSON' });
      logger.writeError(component, 'Invalid JSON received', { sessionId: this.sessionId, message });
      return;
    }
    if (msgObj.type === 'authorize' ) {
      logger.writeInfo(component, 'message', { sessionId: this.sessionId, type: msgObj.type });
    }
    else {
      logger.writeInfo(component, 'message', { sessionId: this.sessionId, ...msgObj });
    }
    switch (msgObj.type) {
      case 'authorize':
        this.handleAuthorize(msgObj.data);
        break;
      case 'command':
        // Placeholder for command handling
        this.send({ type: 'info', data: 'Command received (not implemented)' });
        break;
      default:
        this.send({ type: 'error', data: 'Unexpected message type' });
        logger.writeError(component, 'Unexpected message type', { sessionId: this.sessionId, type: msgObj.type });
    }
  }

  onSocketClose = () => {
    this.stop();
  }

  send = (msg) => {
    try {
      this.ws.send(JSON.stringify(msg));
    } catch {
      // Ignore send errors
    }
  }



  handleAuthorize = (authData) => {
    // Expect {token}
    if (!authData || typeof authData.token !== 'string') {
      this.send({ type: 'error', data: 'Authorization failed: missing token' });
      this.send({ type: 'close', data: 'Closing connection' });
      this.stop();
      logger.writeError(component, 'auth', { sessionId: this.sessionId, msg: 'Authorization failed: missing token' });
      return;
    }
    // Validate token (format and expiration)
    let payload;
    try {
      // Accept JWTs: decode and check exp
      const parts = authData.token.split('.');
      if (parts.length !== 3) throw new Error('Invalid JWT format');
      const decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
      if (!decoded.exp || typeof decoded.exp !== 'number') throw new Error('Missing exp');
      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp < now) throw new Error('Token expired');
      payload = decoded;
      this.tokenExp = decoded.exp;
    } catch (e) {
      this.send({ type: 'error', data: 'Authorization failed: ' + e.message });
      this.send({ type: 'close', data: 'Closing connection' });
      this.stop();
      logger.writeError(component, 'auth', { sessionId: this.sessionId, msg: 'Authorization failed', error: e.message });
      return;
    }
    this.authorized = true;
    this.enableLogForwarding();
    this.send({ type: 'info', data: 'Authorization successful' });
    logger.writeInfo(component, 'auth', { sessionId: this.sessionId, msg: 'Authorization successful' });
    // Start token expiration timer
    this.startTokenTimer();
  }

  startTokenTimer = () => {
    if (this.tokenTimer) clearTimeout(this.tokenTimer);
    if (!this.tokenExp) return;
    const now = Math.floor(Date.now() / 1000);
    const ms = Math.max(0, (this.tokenExp - now) * 1000);
    this.tokenTimer = setTimeout(() => {
      this.authorized = false;
      this.disableLogForwarding();
      this.send({ type: 'error', data: 'token expired' });
      logger.writeInfo(component, 'auth', { msg: 'Token expired, waiting for refresh' });
    }, ms);
  }
}

function setupLogSocket (server) {
  const wss = new WebSocket.Server({ server, path: '/log-socket' })
  wss.on('connection', onConnection)
}


function onConnection (ws) {
  const clientAddr = `${ws._socket.remoteAddress}:${ws._socket.remotePort}`;
  logger.writeInfo(component, 'connection', {source: clientAddr});
  const logSession = new LogSession(ws);
  logSession.start();
}


module.exports = { setupLogSocket }