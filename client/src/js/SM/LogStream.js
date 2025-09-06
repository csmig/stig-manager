Ext.ns('SM.LogStream')
Ext.ns('SM.LogStream.Filter')

SM.LogStream.LogPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    this.shouldAutoScroll = true
    this.writableStream = null
    this.logLines = []
    this.logDivs = []
    this.needsUpdate = false
    this.maxLines = 1000
    this.emptyString = '<div id="sm-log-empty" style="padding: 10px;color:#999">Socket connected and ready to stream.</div>'
    this.preserveLog = true

    const filterPanel = new SM.LogStream.Filter.Panel({
      onFilter: (values) => {
        console.log('Filtering log stream with values:', values);
        this.startStreaming(values);
        streamBtn.toggle(true, true);
        streamBtn.setIconClass('sm-stream-icon')
      }
    });
    const filterMenu = new Ext.menu.Menu({
      plain: true,
      style: 'padding: 10px;',
      items: [filterPanel],
      listeners: {
        beforehide: (menu) => {
          if (streamBtn.pressed && !menu.hidden) {
            this.startStreaming(filterPanel.getValue());
          }
        }
      }
    });
    filterPanel.menu = filterMenu;

    const streamBtn = new Ext.SplitButton({
      text: 'Stream',
      enableToggle: true,
      iconCls: 'sm-stream-stopped-icon',
      menu: filterMenu,
      handler: (btn) => {
        if (btn.pressed) {
          const filter = filterPanel.getValue();
          console.log('Starting log stream with filter:', filter);
          this.startStreaming(filter);
          btn.setIconClass('sm-stream-icon')
        } else {
          this.stopStreaming();
          btn.setIconClass('sm-stream-stopped-icon')

        }
      }
    });
    const recordingBtn = new Ext.Button({
      text: 'Record...',
      enableToggle: true,
      iconCls: 'sm-recording-stopped-icon',
      toggleHandler: async (btn, state) => {
        if (state) {
          try {
            const dateString = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z').replace(/:/g, '-');
            const newHandle = await window.showSaveFilePicker({
              suggestedName: `log-${dateString}.jsonl`,
              types: [{
                description: 'JSONL Files',
                accept: { 'application/jsonl': ['.jsonl'] },
              }],
            });
            this.writableStream = await newHandle.createWritable();
            btn.setText(`Recording to ${newHandle.name}`);
            btn.setIconClass('sm-recording-icon');
          } catch (error) {
            console.error('Error recording file:', error);
            btn.toggle(false, true); //toggle off with event suppressed
            return;
          }
        } else {
          btn.setText('Record...');
          btn.setIconClass('sm-recording-stopped-icon');
          if (this.writableStream) {
            this.writableStream.close();
            this.writableStream = null;
          }
        }
      }
    });
    const preserveCb = new Ext.form.Checkbox({
      boxLabel: 'Preserve Log',
      checked: true,
      listeners: {
        change: (cb, checked) => {
          this.preserveLog = checked;
        }
      }
    });
    const wrapBtn = new Ext.Button({
      text: 'Wrap',
      enableToggle: true,
      iconCls: 'sm-wrap-lines-icon',
      toggleHandler: (btn, state) => {
        this.body.dom.style.textWrapMode = state ? 'wrap' : 'nowrap';
      }
    });
    const clearBtn = new Ext.Button({
      text: 'Clear',
      iconCls: 'sm-clear-icon',
      handler: () => {
        this.logDivs = [];
        this.clearPanel();
        this.fireEvent('logCleared');
      }
    });

    const toolbarItems = [streamBtn, '-', recordingBtn, '->', preserveCb, '-', wrapBtn, '-', clearBtn];
    if (!window.showSaveFilePicker) {
      toolbarItems.splice(1, 2); // Remove recording button
    }

    const tbar = new Ext.Toolbar({
      items: toolbarItems
    });

    const config = {
      html: '<div class="sm-log-wrapper"></div>',
      cls: 'sm-round-panel sm-log-panel',
      bodyCssClass: 'sm-log-panel-body',
      tbar
    };
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this);
  },
  afterRender: function () {
    // setup element event handlers
    const contentDiv = this.body.dom;
    this.wrapperDiv = contentDiv.querySelector('.sm-log-wrapper');
    this.superclass().afterRender.call(this);
    this.applyEmptyString();
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
      if (event.target.classList.contains('sm-log-line')) {
        const logLineEl = event.target;
        if (selectedLogLineEl) {
          selectedLogLineEl.classList.remove('selected');
        }
        logLineEl.classList.add('selected');
        selectedLogLineEl = logLineEl;
        const data = JSON.parse(logLineEl.textContent);
        this.fireEvent('logLineSelected', data);
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
    for (const logLine of this.logLines) {
      const json = JSON.parse(logLine);
      const logTextEl = document.createElement('div');
      logTextEl.textContent = logLine + '\n';
      logTextEl.className = `sm-log-line`;
      logTextEl.dataset.level = json.level;
      logTextEl.dataset.component = json.component;
      logTextEl.dataset.type = json.type;
      this.logDivs.push(logTextEl);
      if (this.logDivs.length > this.maxLines) {
        this.logDivs = this.logDivs.slice(this.logDivs.length - this.maxLines);
      }
    }
    this.wrapperDiv.replaceChildren(...this.logDivs);

    this.logLines = [];
    if (this.shouldAutoScroll) {
      this.body.dom.scrollTop = this.body.dom.scrollHeight;
    }
    this.needsUpdate = false;
  },
  startStreaming: function (filter) {
    if (SM.LogStream.Socket) {
      this.clearEmptyString();
      if (!this.preserveLog) {
        this.clearPanel();
      }
      const message = {
        type: 'command',
        data: {
          command: 'stream-start',
        }
      }
      if (filter) {
        message.data.filter = filter;
      }
      SM.LogStream.Socket.send(JSON.stringify(message));
    }
  },
  stopStreaming: function () {
    if (SM.LogStream.Socket) {
      SM.LogStream.Socket.send(JSON.stringify({ type: 'command', data: { command: 'stream-stop' } }));
    }
  },
  applyEmptyString: function () {
    this.wrapperDiv.innerHTML = this.emptyString;
  },
  clearEmptyString: function () {
    const emptyEl = this.wrapperDiv.querySelector('#sm-log-empty');
    if (emptyEl) {
      this.wrapperDiv.removeChild(emptyEl);
    }
  },
  clearPanel: function () {
    this.logDivs = [];
    this.wrapperDiv.innerHTML = '';
  }
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
    this.requestMap = new Map();
    const store = new Ext.data.JsonStore({
      fields: ['timestamp', 'source', 'user', 'browser', 'url', 'status', 'length', 'duration', 'operationId'],
      root: '',
    });
    const columns = [
      { header: 'Timestamp', dataIndex: 'timestamp', width: 150, xtype: 'datecolumn', format: 'Y-m-d H:i:s.u T' },
      { header: 'Source', dataIndex: 'source', width: 100, filter: { type: 'string' } },
      { header: 'User', dataIndex: 'user', width: 100, filter: { type: 'string' } },
      { header: 'Browser', dataIndex: 'browser', width: 100, filter: { type: 'string' } },
      { header: 'Operation ID', dataIndex: 'operationId', width: 100, filter: { type: 'string' } },
      { header: 'URL', dataIndex: 'url', width: 200 },
      { header: 'Status', dataIndex: 'status', width: 100, renderer: this.statusRenderer, align: 'center', filter: { type: 'values' } },
      { header: 'Length (b)', dataIndex: 'length', width: 100, align: 'right' },
      { header: 'Duration (ms)', dataIndex: 'duration', width: 100, align: 'right' },
    ];
    const view = new SM.ColumnFilters.GridView({
      forceFit: true,
      emptyText: 'No transactions to display',
      deferEmptyText: false,
      listeners: {
        filterschanged: function (view) {
          store.filter(view.getFilterFns())
        }
      }
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
          noun: 'request',
          // iconCls: 'sm-logs-icon'
        })
      ]
    })

    const config = {
      store,
      columns,
      view,
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
  addRequest: function (logObj) {
    const logData = logObj.data
    const record = {
      requestId: logData.requestId,
      timestamp: logObj.date,
      source: logData.source,
      user: logData.headers?.accessToken?.preferred_username,
      browser: SM.LogStream.GetBrowser(logData.headers['user-agent']),
      url: `${logData.method} ${logData.url}`,
    };
    this.requestMap.set(logData.requestId, record);
  },
  addResponse: function (logObj) {
    const logData = logObj.data
    const requestRecord = this.requestMap.get(logData.requestId);
    if (requestRecord) {
      requestRecord.status = `${logData.status}`;
      requestRecord.length = logData.headers?.['content-length'];
      requestRecord.duration = logData.operationStats.durationMs;
      requestRecord.operationId = logData.operationStats.operationId;
      const store = this.getStore();
      if (store.data.length > 999) {
        store.removeAt(0);
      }
      store.loadData([requestRecord], true);
      const view = this.getView();
      view.scroller.dom.scrollTop = view.scroller.dom.scrollHeight;
      this.requestMap.delete(logData.requestId);
    }
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
    { name: 'Chrome', regex: /Chrome\/([0-9.]+$)/ },
    { name: 'Firefox', regex: /Firefox\/([0-9.]+$)/ },
    { name: 'Safari', regex: /Version\/([0-9.]+).*Safari/ },
    { name: 'Edge', regex: /Edg\/([0-9.]+$)/ },
  ];

  for (const browser of browsers) {
    const match = userAgent.match(browser.regex);
    if (match) {
      return `${browser.name}/${match[1]}`;
    }
  }

  return 'Unknown/0';
}

SM.LogStream.Filter.LevelFieldSet = Ext.extend(Ext.form.FieldSet, {
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
      level3,
      level2,
      level1
    ]

    function getValues() {
      const values = []
      for (const item of items) {
        if (item.getValue()) {
          values.push(item.prop)
        }
      }
      return values.length < items.length ? values : undefined
    }
    const config = {
      title: this.title || 'Level',
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

SM.LogStream.Filter.ComponentFieldSet = Ext.extend(Ext.form.FieldSet, {
  initComponent: function () {
    const items = []

    for (const item of ['jwksCache', 'logSocket', 'rest', 'static']) {
      items.push(new Ext.form.Checkbox({
        prop: item,
        boxLabel: item
      }))
    }

    function getValues() {
      const values = []
      for (const item of items) {
        if (item.getValue()) {
          values.push(item.prop)
        }
      }
      return values.length < items.length ? values : undefined
    }

    const config = {
      title: this.title || 'Component',
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

SM.LogStream.Filter.Panel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const filterFn = this.onFilter || Ext.emptyFn
    const _this = this
    const levelFieldset = new SM.LogStream.Filter.LevelFieldSet({
      width: 100
    })
    const componentFieldset = new SM.LogStream.Filter.ComponentFieldSet({
      width: 100
    })
    const button = new Ext.Button({
      style: 'float: right; margin-top: 6px;',
      cls: 'x-toolbar',
      text: 'Stream',
      iconCls: 'sm-stream-stopped-icon',
      handler: () => {
        if (_this.menu) _this.menu.hide()
        const levelValues = levelFieldset.getValues()
        const componentValues = componentFieldset.getValues()

        let filter = null;
        if (levelValues || componentValues) {
          filter = {};
          if (levelValues) filter.level = levelValues;
          if (componentValues) filter.component = componentValues;
        }
        filterFn(filter);
      }
    })
    function getValue() {
      const levelValues = levelFieldset.getValues()
      const componentValues = componentFieldset.getValues()

      let filter = null;
      if (levelValues || componentValues) {
        filter = {};
        if (levelValues) filter.level = levelValues;
        if (componentValues) filter.component = componentValues;
      }
      return filter
    }
    const config = {
      getValue,
      layout: 'form',
      border: false,
      autoWidth: true,
      items: [
        levelFieldset,
        componentFieldset,
        // button
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
        } else if (logObj.type === 'request' && logObj.component === 'rest') {
          transactionGrid.addRequest(logObj);
        } else if (logObj.type === 'response' && logObj.component === 'rest') {
          transactionGrid.addResponse(logObj);
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
      console.log('WebSocket closed');
      bc.removeEventListener('message', tokenBroadcastHandler)
      ws.onmessage = null
    }
  } catch (error) {
    logPanel.update(`<div id="sm-log-empty" style="padding: 10px;color:#999">${error.message}</div>`);
    return;
  }

}

