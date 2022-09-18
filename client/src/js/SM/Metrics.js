Ext.ns('SM.Metrics')

Chart.defaults.font = {
  size: 11,
  family: "'Open Sans', helvetica, sans-serif"
}

SM.Metrics.ChartPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const _this = this
    const tpl = new Ext.XTemplate(
      '<canvas id="sm-chart-{chartId}" height="250px" width="250px"></canvas>',
      {
          compiled: true
      }
    )
    this.chartId = Ext.id()
    const html = `<canvas id="sm-chart-${this.chartId}"${this.chartHeight ? ' height="250px"' : ''}${this.chartWidth ? ' width="250px"' : ''}></canvas>`

    const config = {
      html,
      border: false,
      listeners: {
          afterrender (me) {
              me.chart = new Chart(`sm-chart-${me.chartId}`, this.chartOptions)
          }
      }
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
		SM.Metrics.ChartPanel.superclass.initComponent.call(this)
  },
  replaceData: function (data, datasetIndex = 0) {
    this.chart.dataset[datasetIndex].data = data
    this.chart.update()
  }
})
SM.Metrics.CompletionPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const _this = this
    const chartOptions = {
      type: 'doughnut',
      data: {
        datasets:[{
          data: [this.metrics.assessments - this.metrics.assessed, this.metrics.assessed],
          backgroundColor: ['#f4a4a4', '#dfe6b3' ],
          borderWidth: [1,1]
        }],
        labels: ['Unassessed', 'Assessed'],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false
          }
        }
      }               
    }

    const chartPanel = new SM.Metrics.ChartPanel({
      border: false,
      id: 'chart-panel',
      width: 150,
      height: 150,
      chartOptions
    })

    const dataTpl = [
      `<div style="padding-top:35px;text-align:center;font-size:large;">{[(values.assessed/values.assessments * 100).toFixed(2)]}%</div>`,
      '<table>',
      '<tbody>',
      '<tr><td>Assessments</td><td>{assessments}</td></tr>',
      '<tr><td>Assessed</td><td>{assessed}</td></tr>',
      '</tbody>',
      '</table>'
    ]
    const dataPanel = new Ext.Panel({
      tpl: dataTpl,
      flex: 1,
      data: this.metrics
    })

    
    const config = {
      title: 'Completion',
      layout: 'hbox',
      layoutConfig: {
        align: 'top'
      },
      items: [chartPanel, dataPanel]
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
		SM.Metrics.CompletionPanel.superclass.initComponent.call(this)
  }
})

SM.Metrics.OverviewPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const completionPanel = new SM.Metrics.CompletionPanel({
      border: false,
      collectionId: this.collectionId,
      metrics: this.metrics
    })
    const config = {
      border: false,
      layout: 'fit',
      items: [completionPanel]
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
		SM.Metrics.OverviewPanel.superclass.initComponent.call(this)
  }
})

SM.Metrics.addCollectionMetricsTab = async function (options) {
  try {
    let {collectionId, collectionName, treePath} = options

    const tab = Ext.getCmp('main-tab-panel').getItem(`metrics-tab-${collectionId}`)
		if (tab) {
			tab.show()
			return
		}

    let result = await Ext.Ajax.requestPromise({
      url: `${STIGMAN.Env.apiBase}/collections/${collectionId}/metrics/summary/collection`,
      method: 'GET'
    })
    let apiMetrics = JSON.parse(result.response.responseText)

    const overviewPanel = new SM.Metrics.OverviewPanel({
      cls: 'sm-round-panel',
      title: 'Overview',
      margins: { top: SM.Margin.top, right: SM.Margin.edge, bottom: SM.Margin.bottom, left: SM.Margin.edge },
      region: 'west',
      width: 430,
			minWidth:430,
      split: true,
      collectionId,
      metrics: apiMetrics.metrics       
    })

    const aggPanel = new Ext.Panel({
      region: 'center',
      layout: 'fit',
      title: 'Aggregations',
      cls: 'sm-round-panel',
      margins: { top: SM.Margin.top, right: SM.Margin.edge, bottom: SM.Margin.bottom, left: SM.Margin.adjacent },
      border: false,
      collapsible: false,
      items: [
        {
          xtype: 'tabpanel',
          border: false,
          deferredRender: false,
          items: [
            {
              title: 'Assets',
              iconCls: 'sm-asset-icon',
              layout: 'fit',
            },
            {
              title: 'Labels',
              iconCls: 'sm-label-icon',
              layout: 'fit',
            },
            {
              title: 'STIGs',
              iconCls: 'sm-stig-icon',
              layout: 'fit',
            }
          ]
        }
      ]
    })

    const metricsTab = new Ext.Panel ({
      id: 'metrics-tab-' + collectionId,
			border: false,
			region: 'center',
      collectionId: collectionId,
      collectionName: collectionName,
      iconCls: 'sm-report-icon',
      title: '',
      closable: true,
      layout: 'border',
      sm_tabMode: 'permanent',
      sm_treePath: treePath,
      items: [
        overviewPanel,
        aggPanel
      ]
    })
  
    metricsTab.updateTitle = function () {
      metricsTab.setTitle(`${metricsTab.sm_tabMode === 'ephemeral' ? '<i>':''}${SM.he(metricsTab.collectionName)} / Metrics${metricsTab.sm_tabMode === 'ephemeral' ? '</i>':''}`)
    }
    metricsTab.makePermanent = function () {
      metricsTab.sm_tabMode = 'permanent'
      metricsTab.updateTitle.call(metricsTab)
    }
  
    let tp = Ext.getCmp('main-tab-panel')
    let ephTabIndex = tp.items.findIndex('sm_tabMode', 'ephemeral')
    let thisTab
    if (ephTabIndex !== -1) {
      let ephTab = tp.items.itemAt(ephTabIndex)
      tp.remove(ephTab)
      thisTab = tp.insert(ephTabIndex, metricsTab);
    } else {
      thisTab = tp.add( metricsTab )
    }
    thisTab.updateTitle.call(thisTab)
    thisTab.show();

  }
  catch (e) {
    alert(e)
  }
}