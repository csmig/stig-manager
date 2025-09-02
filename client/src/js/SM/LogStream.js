Ext.ns('SM.LogStream')
Ext.ns('SM.LogStream.Filters')

SM.LogStream.LogPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const _this = this
    this.writableStream = null
    const wrapBtn = new Ext.Button({
      text: 'Wrap',
      enableToggle: true,
      toggleHandler: (btn, state) => {
        this.body.dom.style.textWrapMode = state ? 'wrap' : 'nowrap';
      }
    });
    const captureBtn = new Ext.Button({
      text: 'Capture...',
      enableToggle: true,
      toggleHandler: async (btn, state) => {
        if (state) {
          try {
            const newHandle = await window.showSaveFilePicker();
            btn.setText(`Capturing to ${newHandle.name}`);
            _this.writableStream = await newHandle.createWritable();
          } catch (error) {
            console.error('Error capturing file:', error);
            btn.toggle(false, true); //toggle off with event suppressed
            return;
          }
        } else {
          btn.setText('Capture...');
          if (_this.writableStream) {
            _this.writableStream.close();
            _this.writableStream = null;
          }
        }
      }
    });
    const clearBtn = new Ext.Button({
      text: 'Clear',
      handler: () => {
        _this.body.dom.querySelector('.log-wrapper').textContent = '';
      }
    });

    const filtersPanel = new SM.LogStream.Filters.Panel({
      onFilter: (values) => {
        console.log('Filtering log stream with values:', values);
      }
    });
    const filtersMenu = new Ext.menu.Menu({
      plain: true,
      style: 'padding: 10px;',
      items: [filtersPanel]
    });
    filtersPanel.menu = filtersMenu;

    const filtersBtn = new Ext.Button({
      text: 'Filter',
      menu: filtersMenu
    });

    const tbar = new Ext.Toolbar({
      items: [wrapBtn, captureBtn, clearBtn, filtersBtn]
    });

    const config = {
      html: '<div class="log-wrapper"></div>',
      bodyCssClass: 'log-panel',
      tbar
    };
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this);
  },

});

SM.LogStream.JsonTreePanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    let tree
    function loadData(data) {
      tree = JsonView.createTree(data)
      tree.isExpanded = true
      tree.children[4].isExpanded = true // 'data' property
      if (tree.children[3].value === "transaction") {
        for (const child of tree.children[4].children) {
          child.isExpanded = true
        }
      }
      if (this.body) {
        this.body.dom.textContent = ''
        JsonView.render(tree, this.body.dom)
      }
    }
    function renderTree() {
      if (tree) {
        JsonView.render(tree, this.body.dom)
      }
    }

    const config = {
      bodyStyle: 'overflow-y:auto;',
      loadData
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
    this.on('render', renderTree)
  }
})

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

SM.LogStream.setupSocket = async function () {
  return new Promise((resolve, reject) => {
    const locationUrl = new URL(window.location);
    const wsProtocol = locationUrl.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = wsProtocol + '//' + locationUrl.host + locationUrl.pathname + 'log-socket';

    const ws = new WebSocket(wsUrl);
    ws.onopen = () => {
      ws.onerror = null;
      SM.LogStream.ws = ws;
      resolve(ws);
    };
    ws.onerror = (event) => {
      console.log('WebSocket error:', event);
      reject(new Error(`Feature unavailable. Error establishing WebSocket connection to ${event.target.url}. `));
    };
  });
};

SM.LogStream.showLogTab = async function ({ treePath }) {
  const tab = Ext.getCmp('main-tab-panel').getItem('logstream-admin-tab')
  if (tab) {
    tab.show()
    return
  }

  let ws
  const logPanel = new SM.LogStream.LogPanel({
    region: 'center',
    cls: 'sm-round-panel',
    border: false,
    listeners: {
      afterrender: async function (panel) {
        // WebSocket message handling
        try {
          ws = await SM.LogStream.setupSocket()
        } catch (error) {
          console.error('WebSocket setup error:', error);
          panel.update(error.message);
          return;
        }

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

        const contentDiv = panel.body.dom;
        const wrapperDiv = contentDiv.querySelector('.log-wrapper');
        const maxLines = 1000;
        let logLines = [];
        let logDivs = [];
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
            const data = JSON.parse(event.target.textContent);
            jsonPanel.loadData(data);
          }
        });


        function updatePanelBody() {
          for (const logLine of logLines) {
            const json = JSON.parse(logLine);
            const logTextEl = document.createElement('div');
            logTextEl.textContent = logLine + '\n';
            logTextEl.className = `log-line`;
            logTextEl.dataset.level = json.level;
            logTextEl.dataset.component = json.component;
            logTextEl.dataset.type = json.type;
            logDivs.push(logTextEl);
            if (logDivs.length > maxLines) {
              logDivs = logDivs.slice(logDivs.length - maxLines);
            }
          }
          wrapperDiv.replaceChildren(...logDivs);

          logLines = [];
          if (shouldAutoScroll) {
            contentDiv.scrollTop = contentDiv.scrollHeight;
          }
          needsUpdate = false;
        }


        ws.onmessage = function (event) {
          const message = JSON.parse(event.data);
          if (message.type === 'log') {
            const logObj = message.data;
            logLines.push(JSON.stringify(logObj));
            if (logPanel.writableStream) {
              logPanel.writableStream.write(JSON.stringify(logObj) + '\n').catch((err) => {
                console.error('Error writing to file:', err);
              });
            }
            if (logLines.length > maxLines) logLines.shift();
            if (!needsUpdate) {
              needsUpdate = true;
              requestAnimationFrame(updatePanelBody);
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
          } else if (message.type === 'authorize') {
            ws?.send(JSON.stringify({ type: 'authorize', data: { token: window.oidcWorker.token } }));
          }

        };

        const bc = new BroadcastChannel('stigman-oidc-worker')
        function tokenBroadcastHandler(event) {
          if (event.data.type === 'accessToken') {
            console.log('{log-stream] Received from worker:', event.type, event.data)
            ws?.send(JSON.stringify({ type: 'authorize', data: { token: event.data.accessToken } }))
          }
        }
        bc.addEventListener('message', tokenBroadcastHandler)
        ws.onclose = function () {
          bc.removeEventListener('message', tokenBroadcastHandler)
          ws.onmessage = null
        }
      },
      destroy: function () {
        if (ws) {
          ws.close();
        }
        if (logPanel.writableStream) {
          logPanel.writableStream.close();
        }
      }
    }
  });

  const jsonPanel = new SM.LogStream.JsonTreePanel({
    title: 'JSON Tree',
    cls: 'sm-round-panel',
    region: 'east',
    border: false,
    split: true,
    iconCls: 'sm-json-icon',
    width: 400
  })

  const logAndJsonPanel = new Ext.Panel({
    margins: { top: SM.Margin.top, right: SM.Margin.edge, bottom: SM.Margin.adjacent, left: SM.Margin.edge },
    region: 'center',
    layout: 'border',
    border: false,
    items: [logPanel, jsonPanel]
  })

  const transactionGrid = new SM.LogStream.TransactionGrid({
    region: 'south',
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
    items: [logAndJsonPanel, transactionGrid]
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

SM.LogStream.Filters.LevelsFieldSet = Ext.extend(Ext.form.FieldSet, {
  initComponent: function () {
    const level1 = new Ext.form.Checkbox({
      prop: 1,
      boxLabel: 'Error'
    })
    const level2 = new Ext.form.Checkbox({
      prop: 2,
      boxLabel: 'Warning'
    })
    const level3 = new Ext.form.Checkbox({
      prop: 3,
      boxLabel: 'Info'
    })

    const items = [
      level1,
      level2,
      level3
    ]

    function getValues() {
      const values = {}
      for (const item of items) {
        values[item.prop] = item.getValue()
      }
      return values
    }
    const config = {
      title: this.title || 'Levels',
      defaults: {
        hideLabel: true,
        checked: true
      },
      autoHeight: true,
      items,
      getValues
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.LogStream.Filters.ComponentFieldSet = Ext.extend(Ext.form.FieldSet, {
  initComponent: function () {
    const level1 = new Ext.form.Checkbox({
      prop: 1,
      boxLabel: 'Error'
    })
    const level2 = new Ext.form.Checkbox({
      prop: 2,
      boxLabel: 'Warning'
    })
    const level3 = new Ext.form.Checkbox({
      prop: 3,
      boxLabel: 'Info'
    })

    const items = [
      level1,
      level2,
      level3
    ]

    function getValues() {
      const values = {}
      for (const item of items) {
        values[item.prop] = item.getValue()
      }
      return values
    }
    const config = {
      title: this.title || 'Levels',
      defaults: {
        hideLabel: true,
        checked: true
      },
      autoHeight: true,
      items,
      getValues
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})


SM.LogStream.Filters.Panel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const filterFn = this.onFilter || Ext.emptyFn
    const _this = this
    const fieldset = new SM.LogStream.Filters.LevelsFieldSet()
    const button = new Ext.Button({
      style: 'float: right; margin-top: 6px;',
      cls: 'x-toolbar',
      text: 'Filter',
      iconCls: 'sm-share-icon',
      handler: () => {
        const fieldsetValues = fieldset.getValues()
        if (_this.menu) _this.menu.hide()
        filterFn(fieldsetValues)
      }
    })
    const config = {
      border: false,
      autoWidth: true,
      items: [
        fieldset,
        button
      ]
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

