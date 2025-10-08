import MockOidc from '../../../utils/mockOidc.js'
import WebSocket from 'ws';
import { expect } from 'chai'

const oidc = new MockOidc({ keyCount: 0, includeInsecureKid: true })

describe('LogStream authorization', async function () {
  this.timeout(5000)

  it('should ask for a token on socket connection', async function () {
    const socket = await openSocket()
    await new Promise(r => setTimeout(r, 500)); // wait for socket to be ready
    expect(socket.messages).to.have.lengthOf(1);
    expect(socket.messages[0]).to.have.property('type', 'authorize');
    socket.ws.close();
  });

  it('should accept a valid token', async function () {
    const socket = await openSocket()
    await new Promise(r => setTimeout(r, 500)); // wait for socket to be ready
    expect(socket.messages).to.have.lengthOf(1);
    expect(socket.messages[0]).to.have.property('type', 'authorize');

    const token = oidc.getToken({ sub: 'test-user', privileges: ['admin'] })
    socket.ws.send(JSON.stringify({ type: 'authorize', data: { token } }));
    await new Promise(r => setTimeout(r, 500));
    expect(socket.messages).to.have.lengthOf(2);
    expect(socket.messages[1]).to.have.property('type', 'info');
    expect(socket.messages[1].data).to.have.property('message', 'Authorization successful');
    socket.ws.close();
  });

  it('should reject an expired token', async function () {
    const socket = await openSocket()
    await new Promise(r => setTimeout(r, 500)); // wait for socket to be ready
    expect(socket.messages).to.have.lengthOf(1);
    expect(socket.messages[0]).to.have.property('type', 'authorize');

    const token = oidc.getToken({ sub: 'test-user', privileges: ['admin'], expiresIn: -10 })
    socket.ws.send(JSON.stringify({ type: 'authorize', data: { token } }));
    await new Promise(r => setTimeout(r, 500));
    expect(socket.messages).to.have.lengthOf(2);
    expect(socket.messages[1]).to.have.property('type', 'error');
    expect(socket.messages[1].data).to.have.property('message').that.includes('Authorization failed');
    socket.ws.close();
  });

  it('should reject a token without admin role', async function () {
    const socket = await openSocket()
    await new Promise(r => setTimeout(r, 500)); // wait for socket to be ready
    expect(socket.messages).to.have.lengthOf(1);
    expect(socket.messages[0]).to.have.property('type', 'authorize');

    const token = oidc.getToken({ sub: 'test-user', privileges: [] })
    socket.ws.send(JSON.stringify({ type: 'authorize', data: { token } }));
    await new Promise(r => setTimeout(r, 500));
    expect(socket.messages).to.have.lengthOf(2);
    expect(socket.messages[1]).to.have.property('type', 'error');
    expect(socket.messages[1].data).to.have.property('message').that.includes('Authorization failed');
    socket.ws.close();
  });

  it('should reject a malformed token', async function () {
    const socket = await openSocket()
    await new Promise(r => setTimeout(r, 500)); // wait for socket to be ready
    expect(socket.messages).to.have.lengthOf(1);
    expect(socket.messages[0]).to.have.property('type', 'authorize');

    const token = 'malformed.token.value'
    socket.ws.send(JSON.stringify({ type: 'authorize', data: { token } }));
    await new Promise(r => setTimeout(r, 500));
    expect(socket.messages).to.have.lengthOf(2);
    expect(socket.messages[1]).to.have.property('type', 'error');
    expect(socket.messages[1].data).to.have.property('message').that.includes('Authorization failed');
    socket.ws.close();
  });
  
  it('should reject an empty token', async function () {
    const socket = await openSocket()
    await new Promise(r => setTimeout(r, 500)); // wait for socket to be ready
    expect(socket.messages).to.have.lengthOf(1);
    expect(socket.messages[0]).to.have.property('type', 'authorize');
    socket.ws.send(JSON.stringify({ type: 'authorize', data: { token: '' } }));
    await new Promise(r => setTimeout(r, 500));
    expect(socket.messages).to.have.lengthOf(2);
    expect(socket.messages[1]).to.have.property('type', 'error');
    expect(socket.messages[1].data).to.have.property('message').to.match(/^Authorization failed/);
    socket.ws.close();
  });

  it('should reject an invalid message without token', async function () {
    const socket = await openSocket()
    await new Promise(r => setTimeout(r, 500)); // wait for socket to be ready
    expect(socket.messages).to.have.lengthOf(1);
    expect(socket.messages[0]).to.have.property('type', 'authorize');
    socket.ws.send(JSON.stringify({ type: 'authorize', data: { } }));
    await new Promise(r => setTimeout(r, 500));
    expect(socket.messages).to.have.lengthOf(2);
    expect(socket.messages[1]).to.have.property('type', 'error');
    expect(socket.messages[1].data).to.have.property('message').to.match(/^Message validation failed/);
    socket.ws.close();
  });

  it('should error when token expires', async function () {
    const socket = await openSocket()
    await new Promise(r => setTimeout(r, 500)); // wait for socket to be ready
    expect(socket.messages).to.have.lengthOf(1);
    expect(socket.messages[0]).to.have.property('type', 'authorize');

    const token = oidc.getToken({ sub: 'test-user', privileges: ['admin'], expiresIn: 1 })
    socket.ws.send(JSON.stringify({ type: 'authorize', data: { token } }));
    await new Promise(r => setTimeout(r, 500));
    expect(socket.messages).to.have.lengthOf(2);
    expect(socket.messages[1]).to.have.property('type', 'info');
    expect(socket.messages[1].data).to.have.property('message', 'Authorization successful');

    await new Promise(r => setTimeout(r, 2000)); // wait for token to expire
    expect(socket.messages).to.have.lengthOf(3);
    expect(socket.messages[2]).to.have.property('type', 'error');
    expect(socket.messages[2].data).to.have.property('message', 'token expired');
    socket.ws.close();
  });
  
  // More tests can be added here for log forwarding once authorization is working
  // e.g., send some logs and verify they are received over the socket
});


async function openSocket() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket('ws://localhost:64001/socket/log-socket')
    const resolution = {
      ws,
      messages: [],
    }
    ws.on('message', function incoming(data) {
      const msg = JSON.parse(data)
      resolution.messages.push(msg)
    });
    ws.on('error', function error(err) {
      reject(err instanceof Error ? err : new Error(err))
    });
    ws.on('open', function open() {
      resolve(resolution)
    });
  })
}

