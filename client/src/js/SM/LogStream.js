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
          logLines.push(event.data);
          if (logLines.length > maxLines) logLines.shift();
          if (!needsUpdate) {
            needsUpdate = true;
            requestAnimationFrame(updateLogNode);
          }

          // {"date":"2025-08-28T01:48:33.668Z","level":3,"component":"rest","type":"transaction","data":{"request":{"date":"2025-08-28T01:48:33.656Z","source":"::1","method":"GET","url":"/api/collections?elevate=true&projection=owners&projection=statistics","headers":{"host":"localhost:64001","connection":"keep-alive","pragma":"no-cache","cache-control":"no-cache","sec-ch-ua-platform":"\"Linux\"","x-requested-with":"XMLHttpRequest","user-agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36","sec-ch-ua":"\"Not;A=Brand\";v=\"99\", \"Google Chrome\";v=\"139\", \"Chromium\";v=\"139\"","sec-ch-ua-mobile":"?0","accept":"*/*","sec-fetch-site":"same-origin","sec-fetch-mode":"cors","sec-fetch-dest":"empty","referer":"http://localhost:64001/","accept-encoding":"gzip, deflate, br, zstd","accept-language":"en-US,en;q=0.9","cookie":"CSRF-Token-2O3FN=4tNxPRj4cxfnfmTaUjJfzcDvKxSCzzuA; CSRF-Token-XJHSP=2ovyxyRR6uv7VZ3JUQ275dwUFtWtbjLj; CSRF-Token-ZJ5UIGU=QR7NpwCgG9TpfbQSbdA63qJ4dUdrSSGM; Squeezebox-expanded-RADIO=0; Squeezebox-expanded-PLUGINS=0; Squeezebox-expanded-MY_MUSIC=1; Squeezebox-expanded-PLUGIN_MY_APPS_MODULE_NAME=1; Squeezebox-expanded-activePlugins=1; Squeezebox-expanded-inactivePlugins=1; Squeezebox-expanded-otherPlugins0=1; Squeezebox-expandPlayerControl=true; Squeezebox-noPlaylistCover=0; Squeezebox-albumView=; Squeezebox-expanded-FAVORITES=1; stigmanId=B30AF92E-AA9C-11EF-8E43-CF3C9BB8B135; requestedURI=../../carbon/admin/index.jsp; accepts-cookies=true; commonAuthId=f3404079-88b1-4d46-bd17-091b42a7d177; opbs=63d96fd5-2b38-4334-8022-b5debcaea723-v2; atbv=5d16fe2f-6003-4936-81d7-ebee1de1d959; JSESSIONID=E4479BEE29FFEE33AD72BA5B38A05643; Squeezebox-advancedsettings=null; Squeezebox-playersettings=settings/player/audio.html%3F; Squeezebox-player=00%3A00%3A00%3A00%3A00%3A00; CSRF-Token-XJHSPYZ=eDiR7i9og2Xc3RWHYw54aQgfEuwHbFGFcceRP66HJpGy5UsNAX4ZQHKiAimdYMJx; Squeezebox-enableHiDPI=1.25; sid=780dcf8edd5b6d1e54f639857de8f6da","accessToken":{"jti":"d73241aff3f9747607f9320ed0bfcd3e","realm_access":{"roles":["create_collection","admin"]},"preferred_username":"admin","name":"admin","scope":"stig-manager","sid":"780dcf8edd5b6d1e54f639857de8f6da","auth_time":1756303426,"aud":"stig-manager","iat":1756318161,"exp":1756372161},"authorization":true},"body":{}},"response":{"date":"2025-08-28T01:48:33.667Z","status":200,"headers":{"x-powered-by":"Express","access-control-allow-origin":"*","content-type":"application/json; charset=utf-8","content-length":"700","etag":"W/\"2bc-YrBmfzTd6yUEbECzN5jvHVqiAZ4\"","vary":"Accept-Encoding"},"responseBody":"[{\"collectionId\":\"1\",\"name\":\"status-collection\",\"description\":\"\",\"settings\":{\"fields\":{\"detail\":{\"enabled\":\"always\",\"required\":\"always\"},\"comment\":{\"enabled\":\"findings\",\"required\":\"findings\"}},\"status\":{\"canAccept\":true,\"resetCriteria\":\"result\",\"minAcceptGrant\":3},\"history\":{\"maxReviews\":5},\"importOptions\":{\"autoStatus\":{\"fail\":\"submitted\",\"pass\":\"submitted\",\"notapplicable\":\"submitted\"},\"unreviewed\":\"commented\",\"allowCustom\":true,\"emptyDetail\":\"replace\",\"emptyComment\":\"ignore\",\"unreviewedCommented\":\"informational\"}},\"metadata\":{},\"owners\":[{\"userId\":\"1\",\"username\":\"admin\",\"displayName\":\"admin\"}],\"statistics\":{\"created\":\"2025-03-22T18:23:18Z\",\"userCount\":3,\"assetCount\":0,\"checklistCount\":0}}]"},"operationStats":{"operationId":"getCollections","durationMs":11}}}

          const json = JSON.parse(event.data);
          if (json.type === 'transaction' && json.component === 'rest') {
            const record = {
              timestamp: json.date,
              source: json.data.request.source,
              user: json.data.request.headers?.accessToken?.preferred_username,
              browser: SM.LogStream.GetBrowser(json.data.request.headers['user-agent']),
              action: `${json.data.request.method} ${json.data.request.url}`,
              status: json.data.response.status,
              length: json.data.response.headers['content-length']
            };
            const store = transactionGrid.getStore();
            store.loadData([record], true);
            const view = transactionGrid.getView();
            view.scroller.dom.scrollTop = view.scroller.dom.scrollHeight;
          }
        };
      },
      destroy: function () {
        ws?.close();
      }
    }
  });

  const transactionGrid = new SM.LogStream.TransactionGrid({
    region: 'south',
    cls: 'sm-round-panel',
    split: true,
    title: 'API Transactions',
    height: 300,
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
