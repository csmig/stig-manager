Ext.ns('SM.LogStream')

SM.LogStream.RawLogPanel = Ext.extend(Ext.Panel, {
  html: 'Log start<br>',
  bodyStyle: 'white-space: pre; overflow: auto;'
});

SM.LogStream.Panel = Ext.extend(Ext.Panel, {
  initComponent: function () {


    const rawLogPanel = new Ext.Panel();

    const config = {
      layout: 'fit',
      items: [
        rawLogPanel
      ],
      rawLogPanel
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
});

SM.LogStream.showLogTab = function ({ treePath }) {
  const locationUrl = new URL(window.location);
  const wsProtocol = locationUrl.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = wsProtocol + '//' + locationUrl.host + locationUrl.pathname + 'ws';

  let ws
  const panel = new SM.LogStream.RawLogPanel({
    listeners: {
      afterrender: function () {
        // WebSocket message handling
        ws = new WebSocket(wsUrl);
        
        const logTextNode = document.createTextNode('');
        panel.body.dom.appendChild(logTextNode);

        ws.onmessage = function (event) {
          const logEntry = event.data;
          // Append the new log entry to the body
          logTextNode.nodeValue = logEntry + '\n';
          panel.body.dom.scrollTop = panel.body.dom.scrollHeight;
        };
      },
      destroy: function () {
        ws?.close();
      }
    }
  });

  const thisTab = Ext.getCmp('main-tab-panel').add({
    id: 'logstream-admin-tab',
    sm_treePath: treePath,
    iconCls: 'sm-logs-icon',
    title: 'Log Stream',
    closable: true,
    layout: 'fit',
    items: [panel]
  })
  thisTab.show()


}
