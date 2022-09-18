Ext.ns('SM.Metrics')

Chart.defaults.font = {
  size: 11,
  family: "'Open Sans', helvetica, sans-serif"
}

SM.Metrics.CommonFields = [
  {
    name: 'assessments',
    type: 'integer',
    mapping: 'metrics.assessments'
  },
  {
    name: 'assessed',
    type: 'integer',
    mapping: 'metrics.assessed'
  },
  {
    name: 'low',
    type: 'integer',
    mapping: 'metrics.findings.low'
  },
  {
    name: 'medium',
    type: 'integer',
    mapping: 'metrics.findings.medium'
  },
  {
    name: 'high',
    type: 'integer',
    mapping: 'metrics.findings.high'
  },
  {
    name: 'saved',
    type: 'integer',
    mapping: 'metrics.statuses.saved'
  },
  {
    name: 'submitted',
    type: 'integer',
    mapping: 'metrics.statuses.submitted'
  },
  {
    name: 'accepted',
    type: 'integer',
    mapping: 'metrics.statuses.accepted'
  },
  {
    name: 'rejected',
    type: 'integer',
    mapping: 'metrics.statuses.rejected'
  },
  {
    name: 'pass',
    type: 'integer',
    mapping: 'metrics.results.pass'
  },
  {
    name: 'fail',
    type: 'integer',
    mapping: 'metrics.results.fail'
  },
  {
    name: 'notapplicable',
    type: 'integer',
    mapping: 'metrics.results.notapplicable'
  },
  {
    name: 'other',
    type: 'integer',
    mapping: 'metrics.results.other'
  },
  {
    name: 'completedPct',
    convert: (v, r) => r.metrics.assessments ? r.metrics.assessed / r.metrics.assessments * 100 : 0
  },
  {
    name: 'savedPct',
    convert: (v, r) => r.metrics.assessments ? ((r.metrics.statuses.saved + r.metrics.statuses.submitted + r.metrics.statuses.accepted + r.metrics.statuses.rejected) / r.metrics.assessments) * 100 : 0
  },
  {
    name: 'submittedPct',
    convert: (v, r) => r.metrics.assessments ? ((r.metrics.statuses.submitted + r.metrics.statuses.accepted + r.metrics.statuses.rejected) / r.metrics.assessments) * 100 : 0
  },
  {
    name: 'acceptedPct',
    convert: (v, r) => r.metrics.assessments ? (r.metrics.statuses.accepted / r.metrics.assessments) * 100 : 0
  },
  {
    name: 'rejectedPct',
    convert: (v, r) => r.metrics.assessments ? (r.metrics.statuses.rejected / r.metrics.assessments) * 100 : 0
  },
  {
    name: 'minTs',
    type: 'date',
    mapping: 'metrics.minTs'
  },
  {
    name: 'maxTs',
    type: 'date',
    mapping: 'metrics.maxTs'
  }
]

SM.Metrics.CommonColumns = [
  {
    header: "Assessments",
    width: 50,
    dataIndex: 'assessments',
    align: "center",
    sortable: true
  },
  {
    header: "Assessed",
    width: 50,
    dataIndex: 'assessed',
    align: "center",
    sortable: true
  },
  {
    header: 'Oldest',
    width: 50,
    dataIndex: 'minTs',
    align: 'center',
    sortable: true,
    renderer: renderDurationToNow
  },
  {
    header: 'Newest',
    width: 50,
    dataIndex: 'maxTs',
    align: 'center',
    sortable: true,
    renderer: renderDurationToNow
  },
  {
    header: "Saved",
    width: 100,
    dataIndex: 'savedPct',
    align: "center",
    sortable: true,
    renderer: renderPct
  },
  {
    header: "Completed",
    width: 100,
    dataIndex: 'completedPct',
    align: "center",
    sortable: true,
    renderer: renderPct
  },
  {
    header: "Submitted",
    width: 100,
    dataIndex: 'submittedPct',
    align: "center",
    sortable: true,
    renderer: renderPct
  },
  {
    header: "Accepted",
    width: 100,
    dataIndex: 'acceptedPct',
    align: "center",
    sortable: true,
    renderer: renderPct
  },
  {
    header: "Rejected",
    width: 100,
    dataIndex: 'rejectedPct',
    align: "center",
    sortable: true,
    renderer: renderPctAllHigh
  },
  {
    header: "CAT 1",
    width: 50,
    dataIndex: 'high',
    align: "center",
    sortable: true
  },
  {
    header: "CAT 2",
    width: 50,
    dataIndex: 'medium',
    align: "center",
    sortable: true
  },
  {
    header: "CAT 3",
    width: 50,
    dataIndex: 'low',
    align: "center",
    sortable: true
  }
]

SM.Metrics.AggGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const _this = this
    const fields = [...SM.Metrics.CommonFields]
    const columns = []
    let idProperty, sortField = 'name', autoExpandColumn = Ext.id()
    switch (this.aggregation) {
      case 'asset':
        fields.push(
          {name: 'assetId', type: 'string'},
          {name: 'name', type: 'string'},
          {name: 'labelIds', type: 'string', convert: (v,r) => r.labels.map(l => l.labelId)},
          'benchmarkIds',
          {name: 'stigCount', convert: (v, r) => r.benchmarkIds.length}
        )
        columns.push(
          {
            header: "Asset",
            width: 175,
            id: autoExpandColumn,
            dataIndex: 'name',
            sortable: true,
            filter: { type: 'string' }
          },
          {
            header: "Labels",
            width: 120,
            dataIndex: 'labelIds',
            sortable: false,
            filter: {
              type: 'values',
              collectionId: _this.collectionId,
              renderer: SM.ColumnFilters.Renderers.labels
            },
            renderer: function (value, metadata) {
              const labels = []
              for (const labelId of value) {
                const label = SM.Cache.CollectionMap.get(_this.collectionId).labelMap.get(labelId)
                if (label) labels.push(label)
              }
              labels.sort((a, b) => a.name.localeCompare(b.name))
              metadata.attr = 'style="white-space:normal;"'
              return SM.Collection.LabelArrayTpl.apply(labels)
            }
          },
          {
            header: "STIGs",
            width: 50,
            dataIndex: 'stigCount',
            align: "center",
            tooltip: "Total STIGs Assigned",
            sortable: true
          }
        )
        idProperty = 'assetId'
        break
      case 'collection':
        fields.push(
          {name: 'collectionId', type: 'string'},
          {name: 'name', type: 'string'},
          {name: 'assets', type: 'integer'},
          {name: 'checklists', type: 'integer'}
        )
        columns.push(
          {
            header: "Collection",
            width: 175,
            id: autoExpandColumn,
            dataIndex: 'name',
            sortable: true,
            filter: { type: 'string' }
          },
          {
            header: "Assets",
            width: 50,
            dataIndex: 'assets',
            align: "center",
            tooltip: "Total Assets in the Collection",
            sortable: true
          },
          {
            header: "Checklists",
            width: 50,
            dataIndex: 'checklists',
            align: "center",
            tooltip: "Total Asset/STIG in the Collection",
            sortable: true
          }
        )
        idProperty = 'collectionId'
        break
      case 'label':
        fields.push(
          {name: 'labelId', type: 'string'},
          {name: 'name', type: 'string'},
          'assets'
        )
        columns.push(
          {
            header: "Label",
            width: 175,
            id: autoExpandColumn,
            dataIndex: 'name',
            sortable: true,
            filter: { type: 'string' }
          },
          {
            header: "Assets",
            width: 50,
            dataIndex: 'assets',
            align: "center",
            tooltip: "Total Assets Assigned",
            sortable: true
          }
        )
        idProperty = 'labelId'
        break
      case 'stig':
        fields.push(
          {name: 'benchmarkId', type: 'string'},
          'assets'
        )
        columns.push(
          {
            header: "Benchmark",
            width: 175,
            id: autoExpandColumn,
            dataIndex: 'benchmarkId',
            sortable: true,
            filter: { type: 'string' }
          },
          {
            header: "Assets",
            width: 50,
            dataIndex: 'assets',
            align: "center",
            tooltip: "Total Assets Assigned",
            sortable: true
          }
        )
        idProperty = 'benchmarkId'
        sortField = 'benchmarkId'
        break
    }
    columns.push(...SM.Metrics.CommonColumns)

    this.proxy = new Ext.data.HttpProxy({
      restful: true,
      url: `${STIGMAN.Env.apiBase}/collections/${this.collectionId}/metrics/summary/${this.aggregation}`,
      headers: { 'Content-Type': 'application/json;charset=utf-8' },
      listeners: {
        exception: function (proxy, type, action, options, response, arg) {
          let message
          if (response.responseText) {
            message = response.responseText
          } else {
            message = "Unknown error"
          }
          Ext.Msg.alert('Error', message);
        }
      }
    })
    const store = new Ext.data.JsonStore({
      grid: this,
      autoLoad: true,
      smMaskDelay: 250,
      proxy: this.proxy,
      root: '',
      fields,
      idProperty,
      sortInfo: {
        field: sortField,
        direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
      }
    })
    _this.totalTextCmp = new SM.RowCountTextItem({
      store
    })

    const config = {
      layout: 'fit',
      loadMask: true,
      store,
      sm: new Ext.grid.RowSelectionModel({
        singleSelect: true
      }),
      cm: new Ext.grid.ColumnModel({
        columns
      }),
      view: new SM.ColumnFilters.GridView({
        emptyText: this.emptyText || 'No records to display',
        deferEmptyText: false,
        forceFit: true,
        autoExpandColumn,
        listeners: {
          filterschanged: function (view, item, value) {
            store.filter(view.getFilterFns())
          }
        }
      }),
      bbar: new Ext.Toolbar({
        items: [
          {
            xtype: 'tbbutton',
            grid: this,
            iconCls: 'icon-refresh',
            tooltip: 'Reload this grid',
            width: 20,
            handler: function (btn) {
              const savedSmMaskDelay = btn.grid.store.smMaskDelay
              btn.grid.store.smMaskDelay = 0
              btn.grid.store.reload();
              btn.grid.store.smMaskDelay = savedSmMaskDelay
            }
          }, {
            xtype: 'tbseparator'
          }, {
            xtype: 'exportbutton',
            hasMenu: false,
            gridBasename: 'Assets (grid)',
            storeBasename: 'Assets (store)',
            iconCls: 'sm-export-icon',
            text: 'CSV'
          }, {
            xtype: 'tbfill'
          }, {
            xtype: 'tbseparator'
          },
          this.totalTextCmp
        ]
      })
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.Metrics.UnaggGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const _this = this
    const fields = [
      {name: 'assetId', type: 'string'},
      {name: 'name', type: 'string'},
      {name: 'labelIds', type: 'string', convert: (v,r) => r.labels.map(l => l.labelId)},
      'benchmarkId',
      ...SM.Metrics.CommonFields
    ]
    const columns = []
    let sortField, autoExpandColumn = Ext.id()
    switch (this.parentAggregation) {
      case 'stig':
        columns.push(
          {
            header: "Asset",
            width: 175,
            id: autoExpandColumn,
            dataIndex: 'name',
            sortable: true,
            filter: { type: 'string' }
          },
          {
            header: "Labels",
            width: 120,
            dataIndex: 'labelIds',
            sortable: false,
            filter: {
              type: 'values',
              collectionId: _this.collectionId,
              renderer: SM.ColumnFilters.Renderers.labels
            },
            renderer: function (value, metadata) {
              const labels = []
              for (const labelId of value) {
                const label = SM.Cache.CollectionMap.get(_this.collectionId).labelMap.get(labelId)
                if (label) labels.push(label)
              }
              labels.sort((a, b) => a.name.localeCompare(b.name))
              metadata.attr = 'style="white-space:normal;"'
              return SM.Collection.LabelArrayTpl.apply(labels)
            }
          }
        )
        sortField = 'name'
        break
      case 'asset':
        columns.push(
          {
            header: "Benchmark",
            width: 175,
            id: autoExpandColumn,
            dataIndex: 'benchmarkId',
            sortable: true,
            filter: { type: 'string' }
          }
        )
        sortField = 'benchmarkId'
        break        
    }
    columns.push(...SM.Metrics.CommonColumns)

    this.proxy = new Ext.data.HttpProxy({
      restful: true,
      url: `${STIGMAN.Env.apiBase}/collections/${this.collectionId}/metrics/summary`,
      headers: { 'Content-Type': 'application/json;charset=utf-8' },
      listeners: {
        exception: function (proxy, type, action, options, response, arg) {
          let message
          if (response.responseText) {
            message = response.responseText
          } else {
            message = "Unknown error"
          }
          Ext.Msg.alert('Error', message);
        }
      }
    })
    const store = new Ext.data.JsonStore({
      grid: this,
      autoLoad: false,
      smMaskDelay: 250,
      proxy: this.proxy,
      root: '',
      fields,
      idProperty: (v) => {
				return `${v.assetId}-${v.benchmarkId}`
      },
      sortInfo: {
        field: sortField,
        direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
      }
    })
    _this.totalTextCmp = new SM.RowCountTextItem({
      store
    })
    
    const config = {
      layout: 'fit',
      loadMask: true,
      store,
      cm: new Ext.grid.ColumnModel({
        columns
      }),
      view: new SM.ColumnFilters.GridView({
        emptyText: this.emptyText || 'No records to display',
        deferEmptyText: false,
        forceFit: true,
        autoExpandColumn,
        listeners: {
          filterschanged: function (view, item, value) {
            store.filter(view.getFilterFns())
          }
        }
      }),
      bbar: new Ext.Toolbar({
        items: [
          {
            xtype: 'tbbutton',
            grid: this,
            iconCls: 'icon-refresh',
            tooltip: 'Reload this grid',
            width: 20,
            handler: function (btn) {
              const savedSmMaskDelay = btn.grid.store.smMaskDelay
              btn.grid.store.smMaskDelay = 0
              btn.grid.store.reload();
              btn.grid.store.smMaskDelay = savedSmMaskDelay
            }
          }, {
            xtype: 'tbseparator'
          }, {
            xtype: 'exportbutton',
            hasMenu: false,
            gridBasename: 'Assets (grid)',
            storeBasename: 'Assets (store)',
            iconCls: 'sm-export-icon',
            text: 'CSV'
          }, {
            xtype: 'tbfill'
          }, {
            xtype: 'tbseparator'
          },
          this.totalTextCmp
        ]
      })
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

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
        afterrender(me) {
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
        datasets: [{
          data: [this.metrics.assessments - this.metrics.assessed, this.metrics.assessed],
          backgroundColor: ['#f4a4a4', '#dfe6b3'],
          borderWidth: [1, 1]
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

SM.Metrics.AggAssetPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const _this = this
    const collectionId = this.collectionId
    const aggAssetGrid = new SM.Metrics.AggGrid({
      aggregation: 'asset',
      collectionId,
      region: 'center'
    })
    const unaggGrid = new SM.Metrics.UnaggGrid({
      parentAggregation: 'asset',
      collectionId,
      region: 'south',
      split: true,
      height: '33%'
    })
    async function onRowSelect (cm, index, record) {
      await unaggGrid.store.loadPromise({
        assetId: record.data.assetId
      })
    }

    aggAssetGrid.getSelectionModel().on('rowselect', onRowSelect)

    const config = {
      layout: 'border',
      items: [
        aggAssetGrid,
        unaggGrid
      ]
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.Metrics.addCollectionMetricsTab = async function (options) {
  try {
    let { collectionId, collectionName, treePath } = options

    const tab = Ext.getCmp('main-tab-panel').getItem(`metrics-tab-${collectionId}`)
    if (tab) {
      tab.show()
      return
    }

    // API requests
    const results = await Ext.Ajax.requestPromise({
      url: `${STIGMAN.Env.apiBase}/collections/${collectionId}/metrics/summary/collection`,
      method: 'GET'
    })
    const apiMetricsCollection = JSON.parse(results.response.responseText)

    const overviewPanel = new SM.Metrics.OverviewPanel({
      cls: 'sm-round-panel',
      title: 'Overview',
      margins: { top: SM.Margin.top, right: SM.Margin.edge, bottom: SM.Margin.bottom, left: SM.Margin.edge },
      region: 'west',
      width: 430,
      minWidth: 430,
      split: true,
      collectionId,
      metrics: apiMetricsCollection.metrics
    })
    // const aggAssetGrid = new SM.Metrics.AggGrid({
    //   aggregation: 'asset',
    //   collectionId
    // })
    const aggAssetPanel = new SM.Metrics.AggAssetPanel({
      collectionId
    })
    const aggLabelGrid = new SM.Metrics.AggGrid({
      aggregation: 'label',
      collectionId
    })
    const aggStigGrid = new SM.Metrics.AggGrid({
      aggregation: 'stig',
      collectionId
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
          activeTab: 0,
          border: false,
          deferredRender: false,
          items: [
            {
              title: 'Assets',
              iconCls: 'sm-asset-icon',
              layout: 'fit',
              items: [aggAssetPanel]
            },
            {
              title: 'Labels',
              iconCls: 'sm-label-icon',
              layout: 'fit',
              items: [aggLabelGrid]
            },
            {
              title: 'STIGs',
              iconCls: 'sm-stig-icon',
              layout: 'fit',
              items: [aggStigGrid]
            }
          ]
        }
      ]
    })

    const metricsTab = new Ext.Panel({
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
      metricsTab.setTitle(`${metricsTab.sm_tabMode === 'ephemeral' ? '<i>' : ''}${SM.he(metricsTab.collectionName)} / Metrics${metricsTab.sm_tabMode === 'ephemeral' ? '</i>' : ''}`)
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
      thisTab = tp.add(metricsTab)
    }
    thisTab.updateTitle.call(thisTab)
    thisTab.show();

  }
  catch (e) {
    alert(e)
  }
}