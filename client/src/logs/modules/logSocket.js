const locationUrl = new URL(window.location);
const wsProtocol = locationUrl.protocol === 'https:' ? 'wss:' : 'ws:';
const wsUrl = wsProtocol + '//' + locationUrl.host + locationUrl.pathname + '../log-socket';
const ws = new WebSocket(wsUrl);
const contentDiv = document.getElementById('content');
const wrapperDiv = document.getElementById('wrapper');
const detailDiv = document.getElementById('detail');

ws.onopen = () => {
  console.log('Connected to WebSocket server');
};

const maxLines = 500;
let logLines = [];
let needsUpdate = false;
let shouldAutoScroll = true;

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
  const stringified = JSON.stringify(JSON.parse(event.target.textContent), null, 2);
  detailDiv.innerHTML = `<pre>${stringified}</pre>`;
});

// content div updater
function updateContentDiv() {
  for (const logLine of logLines) {
    const json = JSON.parse(logLine);
    const logTextEl = document.createElement('div');
    logTextEl.textContent = logLine + '\n';
    logTextEl.className = `log-line level-${json.level} component-${json.component} type-${json.type}`;
    wrapperDiv.appendChild(logTextEl);
    if (wrapperDiv.childElementCount > maxLines) {
      wrapperDiv.removeChild(wrapperDiv.firstChild);
    }
  }
  logLines = [];
  if (shouldAutoScroll) {
    contentDiv.scrollTop = contentDiv.scrollHeight;
  }
  needsUpdate = false;
}
// websocket message handler
ws.onmessage = function (event) {
  const message = JSON.parse(event.data);
  if (message.type === 'log') {
    // prepare for content div
    const logObj = message.data;
    logLines.push(JSON.stringify(logObj));
    if (logLines.length > maxLines) logLines.shift();
    if (!needsUpdate) {
      needsUpdate = true;
      requestAnimationFrame(updateContentDiv);
    }
    // prepare for table
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

// split panes
const splitter = document.querySelector('.splitter');
const leftPane = contentDiv;
const rightPane = detailDiv;

let isDragging = false;

splitter.addEventListener('mousedown', (e) => {
  isDragging = true;
  splitter.classList.add('dragging');
  document.body.style.userSelect = 'none';
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
});

function handleMouseMove(e) {
  if (!isDragging) return;
  e.preventDefault();

  const containerRect = splitter.parentElement.getBoundingClientRect();
  const minWidth = 100; // minimum width for panes

  // Calculate new left width relative to the container
  let newLeftWidth = e.clientX - containerRect.left;
  let newRightWidth = containerRect.width - newLeftWidth - splitter.offsetWidth;

  // Clamp to minimums
  if (newLeftWidth < minWidth) newLeftWidth = minWidth;
  if (newRightWidth < minWidth) {
    newRightWidth = minWidth;
    newLeftWidth = containerRect.width - minWidth - splitter.offsetWidth;
  }

  leftPane.style.flexBasis = `${newLeftWidth}px`;
  rightPane.style.flexBasis = `${newRightWidth}px`;
}

function handleMouseUp() {
  isDragging = false;
  splitter.classList.remove('dragging');
  document.body.style.userSelect = '';
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
}

// wrap handler
const wrapCheckbox = document.getElementById('checkbox-wrap');
wrapCheckbox.addEventListener('change', (e) => {
  const isChecked = e.target.checked;
  console.log('Wrap lines:', isChecked);
  contentDiv.style.textWrapMode = isChecked ? 'wrap' : 'nowrap';
});

