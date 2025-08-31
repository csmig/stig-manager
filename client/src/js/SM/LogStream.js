Ext.ns('SM.LogStream')

SM.LogStream.RawLogPanel = Ext.extend(Ext.Panel, {
  html: 'Log start<br>',
  bodyStyle: 'white-space: pre; overflow: auto;'
});

SM.LogStream.TransactionGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const config = {
      columns: [
        { header: 'Timestamp', dataIndex: 'timestamp', width: 150 },
        { header: 'Source', dataIndex: 'source', width: 100 },
        { header: 'User', dataIndex: 'user', width: 100 },
        { header: 'Browser', dataIndex: 'browser', width: 100 },
        { header: 'Action', dataIndex: 'action', width: 200 },
        { header: 'Status', dataIndex: 'status', width: 100 },
        { header: 'Length', dataIndex: 'length', width: 100, align: 'right' }
      ],
      store: new Ext.data.JsonStore({
        fields: ['timestamp', 'source', 'user', 'browser', 'action', 'status', 'length'],
      }),
      view: new Ext.grid.GridView({
        forceFit: true
      })
    };
    Ext.apply(this, Ext.apply(this.initialConfig, config));
    this.superclass().initComponent.call(this);
  }
});

SM.LogStream.showLogTab = function ({ treePath }) {
  const locationUrl = new URL(window.location);
  const wsProtocol = locationUrl.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = wsProtocol + '//' + locationUrl.host + locationUrl.pathname + 'log-socket';

  let ws
  const rawLogPanel = new SM.LogStream.RawLogPanel({
    region: 'center',
    cls: 'sm-round-panel',
    title: 'Raw Log',
    border: false,
    listeners: {
      afterrender: function (panel) {
        // WebSocket message handling
        ws = new WebSocket(wsUrl);

        const logTextNode = document.createTextNode('');
        panel.body.dom.appendChild(logTextNode);

        const maxLines = 1000;
        const logLines = [];
        let needsUpdate = false;

        function updateLogNode() {
          logTextNode.nodeValue = logLines.join('\n');
          panel.body.dom.scrollTop = panel.body.dom.scrollHeight;
          needsUpdate = false;
        }

        ws.onmessage = function (event) {
          const message = JSON.parse(event.data);
          if (message.type === 'log') {
            const logObj = message.data;
            logLines.push(JSON.stringify(logObj));
            if (logLines.length > maxLines) logLines.shift();
            if (!needsUpdate) {
              needsUpdate = true;
              requestAnimationFrame(updateLogNode);
            }
            if (logObj.type === 'transaction' && logObj.component === 'rest') {
              const record = {
                timestamp: logObj.date,
                source: logObj.data.request.source,
                user: logObj.data.request.headers?.accessToken?.preferred_username,
                browser: SM.LogStream.GetBrowser(logObj.data.request.headers['user-agent']),
                action: `${logObj.data.request.method} ${logObj.data.request.url}`,
                status: logObj.data.response.status,
                length: logObj.data.response.headers?.['content-length']
              };
              const store = transactionGrid.getStore();
              store.loadData([record], true);
              const view = transactionGrid.getView();
              view.scroller.dom.scrollTop = view.scroller.dom.scrollHeight;
            }
          }
          else if (message.type === 'authorize') {
            ws.send(JSON.stringify({ type: 'authorize', data: { token: window.oidcWorker.token } }));
          }

        };

        const bc = new BroadcastChannel('stigman-oidc-worker')
        function tokenBroadcastHandler(event) {
          if (event.data.type === 'accessToken') {
            console.log('{log-stream] Received from worker:', event.type, event.data)
            ws.send(JSON.stringify({ type: 'authorize', data: { token: event.data.accessToken } }))
          }
        }
        bc.addEventListener('message', tokenBroadcastHandler)
        ws.onclose = function () {
          bc.removeEventListener('message', tokenBroadcastHandler)
        }
      }
    }
  });

  const transactionGrid = new SM.LogStream.TransactionGrid({
    region: 'north',
    cls: 'sm-round-panel',
    split: true,
    title: 'API Transactions',
    height: '66%',
    border: false,

  });

  const thisTab = Ext.getCmp('main-tab-panel').add({
    id: 'logstream-admin-tab',
    sm_treePath: treePath,
    iconCls: 'sm-logs-icon',
    title: 'Log Stream',
    closable: true,
    layout: 'border',
    items: [rawLogPanel, transactionGrid]
  })
  thisTab.show()


}

SM.LogStream.GetBrowser = function (userAgent) {
  const browsers = [
    { name: 'Chrome', regex: /Chrome\/([0-9.]+)/ },
    { name: 'Firefox', regex: /Firefox\/([0-9.]+)/ },
    { name: 'Safari', regex: /Version\/([0-9.]+).*Safari/ },
    { name: 'Edge', regex: /Edg\/([0-9.]+)/ },
    { name: 'Internet Explorer', regex: /MSIE ([0-9.]+)/ }
  ];

  for (const browser of browsers) {
    const match = userAgent.match(browser.regex);
    if (match) {
      return `${browser.name}/${match[1]}`;
    }
  }

  return 'Unknown/0';
}
