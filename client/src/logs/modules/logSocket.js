const locationUrl = new URL(window.location);
const wsProtocol = locationUrl.protocol === 'https:' ? 'wss:' : 'ws:';
const wsUrl = wsProtocol + '//' + locationUrl.host + locationUrl.pathname + '../log-socket';
const ws = new WebSocket(wsUrl);
const contentDiv = document.getElementById('wrapper');
const detailDiv = document.getElementById('detail');

ws.onopen = () => {
  console.log('Connected to WebSocket server');
};

// const logTextNode = document.createTextNode('');
// contentDiv.appendChild(logTextNode);


const maxLines = 500;
let logLines = [];
let needsUpdate = false;
let shouldAutoScroll = true;


// content div updater
function updateContentDiv() {
  for (const logLine of logLines) {
    const json = JSON.parse(logLine);
    const logTextEl = document.createElement('div');
    logTextEl.textContent = logLine + '\n';
    logTextEl.className = `log-line level-${json.level} component-${json.component} type-${json.type}`;
    contentDiv.appendChild(logTextEl);
  }
  logLines = [];
  if (shouldAutoScroll) {
    contentDiv.scrollTop = contentDiv.scrollHeight;
  }
  needsUpdate = false;
}

// content div scroll handling
function isAtBottom() {
  // Allow a small threshold for float rounding
  return contentDiv.scrollHeight - contentDiv.scrollTop - contentDiv.clientHeight < 5;
}
contentDiv.addEventListener('scroll', () => {
  shouldAutoScroll = isAtBottom();
});

// div click handler
let selectedLogLineEl = null;
contentDiv.addEventListener('click', (event) => {
  if (event.target.classList.contains('log-line')) {
    const logLine = event.target;
    if (selectedLogLineEl) {
      selectedLogLineEl.classList.remove('selected');
    }
    logLine.classList.add('selected');
    selectedLogLineEl = logLine;
  }
  // detailDiv.textContent = event.target.textContent;
});

// websocket message handler
ws.onmessage = function (event) {
  const message = JSON.parse(event.data);
  if (message.type === 'log') {
    const logObj = message.data;
    logLines.push(JSON.stringify(logObj));
    if (logLines.length > maxLines) logLines.shift();
    if (!needsUpdate) {
      needsUpdate = true;
      requestAnimationFrame(updateContentDiv);
    }
    // if (logObj.type === 'transaction' && logObj.component === 'rest') {
    //   const record = {
    //     timestamp: logObj.date,
    //     source: logObj.data.request.source,
    //     user: logObj.data.request.headers?.accessToken?.preferred_username,
    //     browser: SM.LogStream.GetBrowser(logObj.data.request.headers['user-agent']),
    //     action: `${logObj.data.request.method} ${logObj.data.request.url}`,
    //     status: logObj.data.response.status,
    //     length: logObj.data.response.headers?.['content-length']
    //   };
    //   const store = transactionGrid.getStore();
    //   store.loadData([record], true);
    //   const view = transactionGrid.getView();
    //   view.scroller.dom.scrollTop = view.scroller.dom.scrollHeight;
    // }
  }
  else if (message.type === 'authorize') {
    ws.send(JSON.stringify({ type: 'authorize', data: { token: window.oidcWorker.token } }));
  }

};

// websocket close handler
ws.onclose = function () {
  bc.removeEventListener('message', tokenBroadcastHandler)
}

// broadcast channel handling
const bc = new BroadcastChannel('stigman-oidc-worker')
function tokenBroadcastHandler(event) {
  if (event.data.type === 'accessToken') {
    console.log('{log-stream] Received from worker:', event.type, event.data)
    ws.send(JSON.stringify({ type: 'authorize', data: { token: event.data.accessToken } }))
  } else if (event.data.type === 'noToken') {
    promptReauth(event.data)
  }
}
bc.addEventListener('message', tokenBroadcastHandler)


function promptReauth(data) {
  console.log('Prompting reauthorization:', data);
  showReauthModal();
}

function showReauthModal(promptText = "Your session has expired. Please sign in again.") {
  const modal = document.createElement('div');
  modal.id = 'reauth-modal';
  modal.style = `
    position: fixed; z-index: 9999; left: 0; top: 0; width: 100vw; height: 100vh;
    background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;
  `;
  modal.innerHTML = `
    <div style="background: #fff; padding: 2em 2.5em; border-radius: 8px; box-shadow: 0 2px 16px #0002; text-align: center; min-width: 300px;">
      <div style="margin-bottom: 1.5em; font-size: 1.1em;">${promptText}</div>
      <button id="reauth-signin-btn" style="padding: 0.5em 1.5em; font-size: 1em;">Sign In</button>
    </div>
  `;
  document.body.prepend(modal);
}

// ws.onmessage = event => {
//   // Display shell output in a designated area (e.g., a pre tag)
//   contentDiv.innerHTML += event.data + '\n';
//   contentDiv.scrollTop = contentDiv.scrollHeight;
// };


