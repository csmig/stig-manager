Ext.ns('SM.LogStream')
Ext.ns('SM.LogStream.Filters')

SM.LogStream.LogPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    this.shouldAutoScroll = true
    this.writableStream = null

    const streamBtn = new Ext.Button({
      text: 'Stream',
      enableToggle: true,
      toggleHandler: (btn, state) => {
        if (state) {
          this.startStreaming();
        } else {
          this.stopStreaming();
        }
      }
    });
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
            this.writableStream = await newHandle.createWritable();
          } catch (error) {
            console.error('Error capturing file:', error);
            btn.toggle(false, true); //toggle off with event suppressed
            return;
          }
        } else {
          btn.setText('Capture...');
          if (this.writableStream) {
            this.writableStream.close();
            this.writableStream = null;
          }
        }
      }
    });
    const clearBtn = new Ext.Button({
      text: 'Clear',
      handler: () => {
        this.logDivs = [];
        this.clearPanel();
        this.fireEvent('logCleared');
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
      items: [streamBtn, captureBtn, '->', wrapBtn, filtersBtn, clearBtn]
    });

    const config = {
      html: '<div class="log-wrapper"></div>',
      bodyCssClass: 'log-panel',
      tbar
    };
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this);
  },
  afterRender: function () {
    // setup element event handlers
    const _this = this
    this.superclass().afterRender.call(this);
    this.applyEmptyString();
    const contentDiv = this.body.dom;
    // content div scroll handling
    function isAtBottom() {
      // Allow a small threshold for float rounding
      return contentDiv.scrollHeight - contentDiv.scrollTop - contentDiv.clientHeight < 5;
    }
    contentDiv.addEventListener('scroll', () => {
      this.shouldAutoScroll = isAtBottom();
    });

    // div click handler
    let selectedLogLineEl = null;
    contentDiv.addEventListener('click', (event) => {
      if (event.target.classList.contains('log-line')) {
        const logLineEl = event.target;
        if (selectedLogLineEl) {
          selectedLogLineEl.classList.remove('selected');
        }
        logLineEl.classList.add('selected');
        selectedLogLineEl = logLineEl;
        const data = JSON.parse(logLineEl.textContent);
        _this.fireEvent('logLineSelected', data);
        // jsonPanel.loadData(data);
      }
    });
  },
  addLogString: function (logLine) {
    this.logLines.push(logLine);
    if (this.writableStream) {
      this.writableStream.write(logLine + '\n').catch((err) => {
        console.error('Error writing to file:', err);
      });
    }
    if (this.logLines.length > this.maxLines) this.logLines.shift();
    if (!this.needsUpdate) {
      this.needsUpdate = true;
      requestAnimationFrame(this.updatePanelBody.bind(this));
    }
  },
  updatePanelBody: function () {
    const wrapperDiv = this.body.dom.querySelector('.log-wrapper');
    for (const logLine of this.logLines) {
      const json = JSON.parse(logLine);
      const logTextEl = document.createElement('div');
      logTextEl.textContent = logLine + '\n';
      logTextEl.className = `log-line`;
      logTextEl.dataset.level = json.level;
      logTextEl.dataset.component = json.component;
      logTextEl.dataset.type = json.type;
      this.logDivs.push(logTextEl);
      if (this.logDivs.length > this.maxLines) {
        this.logDivs = this.logDivs.slice(this.logDivs.length - this.maxLines);
      }
    }
    wrapperDiv.replaceChildren(...this.logDivs);

    this.logLines = [];
    if (this.shouldAutoScroll) {
      this.body.dom.scrollTop = this.body.dom.scrollHeight;
    }
    this.needsUpdate = false;
  },
  startStreaming: function () {
    if (SM.LogStream.Socket) {
      this.clearPanel()
      SM.LogStream.Socket.send(JSON.stringify({ type: 'command', data: { command: 'stream-start' } }));
    }
  },
  stopStreaming: function () {
    if (SM.LogStream.Socket) {
      SM.LogStream.Socket.send(JSON.stringify({ type: 'command', data: { command: 'stream-stop' } }));
    }
  },
  applyEmptyString: function () {
    const contentDiv = this.body.dom;
    const wrapperDiv = contentDiv.querySelector('.log-wrapper');
    wrapperDiv.innerHTML = this.emptyString;
  },
  clearPanel: function () {
    const contentDiv = this.body.dom;
    const wrapperDiv = contentDiv.querySelector('.log-wrapper');
    wrapperDiv.innerHTML = '';
  },
  logLines: [],
  logDivs: [],
  needsUpdate: false,
  maxLines: 100,
  emptyString: '<div style="padding: 10px;color:#999">Log stream not running. Click above to start.</div>'

});

SM.LogStream.JsonTreePanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const config = {
      bodyStyle: 'overflow-y:auto;',
      html: this.emptyString,
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  },
  tree: null,
  emptyString: '<div style="padding: 10px;color:#999">Select a log record</div>',
  loadData: function (data) {
    this.tree = JsonView.createTree(data)
    this.tree.isExpanded = true
    this.tree.children[4].isExpanded = true // 'data' property
    if (this.tree.children[3].value === "transaction") {
      for (const child of this.tree.children[4].children) {
        child.isExpanded = true
      }
    }
    if (this.body) {
      this.body.dom.textContent = ''
      JsonView.render(this.tree, this.body.dom)
    }
  },
  renderTree: function () {
    if (this.tree) {
      JsonView.render(this.tree, this.body.dom)
    }
  },
  clearData: function () {
    this.tree = null
    if (this.body) {
      this.update(this.emptyString)
    }
  }

})

SM.LogStream.TransactionGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const store = new Ext.data.JsonStore({
      fields: ['timestamp', 'source', 'user', 'browser', 'url', 'status', 'length', 'duration', 'operationId'],
    });
    const bbar = new Ext.Toolbar({
      items: [
        {
          xtype: 'tbfill'
        },
        {
          xtype: 'tbseparator'
        },
        new SM.RowCountTextItem({
          store,
          width: 100,
          noun: 'requests',
          // iconCls: 'sm-logs-icon'
        })
      ]
    })

    const config = {
      store,
      columns: [
        { header: 'Timestamp', dataIndex: 'timestamp', width: 150 },
        { header: 'Source', dataIndex: 'source', width: 100, filter: { type: 'string' } },
        { header: 'User', dataIndex: 'user', width: 100, filter: { type: 'values' } },
        { header: 'Browser', dataIndex: 'browser', width: 100, filter: { type: 'values' } },
        { header: 'Operation ID', dataIndex: 'operationId', width: 100, filter: { type: 'values' } },
        { header: 'URL', dataIndex: 'url', width: 200 },
        { header: 'Status', dataIndex: 'status', width: 100, renderer: this.statusRenderer, align: 'center', filter: { type: 'values' } },
        { header: 'Length (b)', dataIndex: 'length', width: 100, align: 'right' },
        { header: 'Duration (ms)', dataIndex: 'duration', width: 100, align: 'right' },
      ],
      view: new SM.ColumnFilters.GridView({
        forceFit: true,
        emptyText: 'No transactions to display',
        listeners: {
          filterschanged: function (view) {
            store.filter(view.getFilterFns())
          }
        }
      }),
      bbar
    };
    Ext.apply(this, Ext.apply(this.initialConfig, config));
    this.superclass().initComponent.call(this);
  },
  addTransaction: function (logObj) {
    const logData = logObj.data
    const record = {
      timestamp: logObj.date,
      source: logData.request.source,
      user: logData.request.headers?.accessToken?.preferred_username,
      browser: SM.LogStream.GetBrowser(logData.request.headers['user-agent']),
      url: `${logData.request.method} ${logData.request.url}`,
      status: `${logData.response.status}`,
      length: logData.response.headers?.['content-length'],
      duration: logData.operationStats.durationMs,
      operationId: logData.operationStats.operationId
    };
    const store = this.getStore();
    if (store.data.length > 999) {
      store.removeAt(0);
    }
    store.loadData([record], true);
    const view = this.getView();
    view.scroller.dom.scrollTop = view.scroller.dom.scrollHeight;
  },
  statusRenderer: function (value, metaData, record, rowIndex, colIndex, store) {
    let css = ''
    if (value >= 200 && value <= 299) {
      css = 'sm-http-status-sprite sm-http-status-200';
    } else if (value >= 300 && value <= 399) {
      css = 'sm-http-status-sprite sm-http-status-300';
    } else if (value >= 400 && value <= 499) {
      css = 'sm-http-status-sprite sm-http-status-400';
    } else if (value >= 500 && value <= 599) {
      css = 'sm-http-status-sprite sm-http-status-500';
    }
    return `<span class="${css}">${value}</span>`;
  }
});

SM.LogStream.Socket = null

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

SM.LogStream.setupSocket = async function () {
  return new Promise((resolve, reject) => {
    const locationUrl = new URL(window.location);
    const wsProtocol = locationUrl.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = wsProtocol + '//' + locationUrl.host + locationUrl.pathname + 'log-socket';

    const ws = new WebSocket(wsUrl);
    ws.onopen = () => {
      ws.onerror = null;
      SM.LogStream.Socket = ws;
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
    margins: { top: 0, right: SM.Margin.adjacent, bottom: 0, left: 0 },
    border: false,
    listeners: {
      destroy: function () {
        if (ws) {
          ws.close();
        }
        if (logPanel.writableStream) {
          logPanel.writableStream.close();
        }
      },
      logLineSelected: function (data) {
        jsonPanel.loadData(data);
      },
      logCleared: function () {
        jsonPanel.clearData();
        transactionGrid.store.removeAll();
      }
    }
  });

  const jsonPanel = new SM.LogStream.JsonTreePanel({
    title: 'JSON Tree',
    cls: 'sm-round-panel',
    margins: { top: 0, left: SM.Margin.adjacent, bottom: 0, right: 0 },
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
    height: 400,
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

  try {
    ws = await SM.LogStream.setupSocket()
    ws.onmessage = function (event) {
      const message = JSON.parse(event.data);
      if (message.type === 'log') {
        logPanel.addLogString(JSON.stringify(message.data));
        const logObj = message.data;
        if (logObj.type === 'transaction' && logObj.component === 'rest') {
          transactionGrid.addTransaction(logObj);
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
  } catch (error) {
    logPanel.update(error.message);
    return;
  }

}

