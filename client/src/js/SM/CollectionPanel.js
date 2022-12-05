Ext.ns('SM.CollectionPanel')

Chart.defaults.font = {
  size: 11,
  family: "'Open Sans', helvetica, sans-serif"
}

SM.CollectionPanel.Renderers = {
  severityCount: function (v, md) {
    return v === 0 ? '' : `<div class="sm-metrics-findings-count-cell sm-metrics-${this.dataIndex}-box">${v}</div>`
  }
}

SM.CollectionPanel.CommonFields = [
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
    name: 'unassessed',
    type: 'integer',
    mapping: 'metrics.results.unassessed'
  },
  {
    name: 'assessedPct',
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
  },
  {
    name: 'maxTouchTs',
    type: 'date',
    mapping: 'metrics.maxTouchTs'
  }
]

SM.CollectionPanel.CommonColumns = [
  {
    header: "Checks",
    width: 50,
    dataIndex: 'assessments',
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
    header: 'Updated',
    width: 50,
    dataIndex: 'maxTouchTs',
    align: 'center',
    sortable: true,
    renderer: renderDurationToNow
  },
  {
    header: "Assessed",
    width: 75,
    dataIndex: 'assessedPct',
    // align: "center",
    sortable: true,
    renderer: renderPct
  },
  {
    header: "Submitted",
    width: 75,
    dataIndex: 'submittedPct',
    // align: "center",
    sortable: true,
    renderer: renderPct
  },
  {
    header: "Accepted",
    width: 75,
    dataIndex: 'acceptedPct',
    // align: "center",
    sortable: true,
    renderer: renderPct
  },
  {
    header: "Rejected",
    width: 75,
    dataIndex: 'rejectedPct',
    // align: "center",
    sortable: true,
    renderer: renderPctAllHigh
  },
  {
    header: "CAT 3",
    width: 50,
    dataIndex: 'low',
    align: "center",
    sortable: true,
    renderer: SM.CollectionPanel.Renderers.severityCount
  },
  {
    header: "CAT 2",
    width: 50,
    dataIndex: 'medium',
    align: "center",
    sortable: true,
    renderer: SM.CollectionPanel.Renderers.severityCount
  },
  {
    header: "CAT 1",
    width: 50,
    dataIndex: 'high',
    align: "center",
    sortable: true,
    renderer: SM.CollectionPanel.Renderers.severityCount
  },
]

SM.CollectionPanel.AggGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const _this = this

    const sm = this.checkboxSelModel ? new Ext.grid.CheckboxSelectionModel({
      singleSelect: false,
      checkOnly: false,
    }) : new Ext.grid.RowSelectionModel({
      singleSelect: true
    })
    const fields = [...SM.CollectionPanel.CommonFields]
    const columns = []
    if (this.checkboxSelModel) {
      columns.push(sm)
    }
    let idProperty, sortField = 'name', autoExpandColumn = Ext.id()
    let rowdblclick = () => {}
    let cellmousedown = () => {}

    function renderWithToolbar (v) {
      return `
      <div class="sm-grid-cell-with-toolbar">
        <div class="sm-dynamic-width">
          <div class="sm-info">${v}</div>
        </div>
        <div class="sm-static-width"><img class="sm-grid-cell-toolbar-edit" ext:qtip="Open checklist" src="img/shield-grey-check.svg" width="14" height="14"></div>
      </div>`
    }

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
              metadata.attr = 'style="white-space:nowrap;text-overflow:clip;"'
              return SM.styledEmptyRenderer(SM.Collection.LabelArrayTpl.apply(labels))
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
            dataIndex: 'labelId',
            sortable: true,
            filter: {
              type: 'values',
              collectionId: _this.collectionId,
              renderer: SM.ColumnFilters.Renderers.labels
            },
            renderer: function (value, metadata) {
              const labels = []
              const labelId = value
              const label = SM.Cache.CollectionMap.get(_this.collectionId).labelMap.get(labelId)
              if (label) labels.push(label)
              labels.sort((a, b) => a.name.localeCompare(b.name))
              metadata.attr = 'style="white-space:normal;"'
              return SM.styledEmptyRenderer(SM.Collection.LabelArrayTpl.apply(labels))
            }
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
            renderer: renderWithToolbar,
            filter: { type: 'string' },
            listeners: {
              mousedown: function (col, grid, index, e) {
                if (e.target.className === "sm-grid-cell-toolbar-edit") {
                  return false
                }
              }
            }
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
        rowdblclick = (grid, rowIndex) => {
          const r = grid.getStore().getAt(rowIndex)
          const leaf = {
            collectionId: grid.collectionId, 
            benchmarkId: r.data.benchmarkId
          }
          addCollectionReview({leaf})
        }
        cellmousedown = (grid, rowIndex, columnIndex, e) => {
          if (e.target.className === "sm-grid-cell-toolbar-edit") {
            const r = grid.getStore().getAt(rowIndex)
            const leaf = {
              collectionId: grid.collectionId, 
              benchmarkId: r.data.benchmarkId
            }
            addCollectionReview({leaf})
          }
        }
    
        break
    }
    columns.push(...SM.CollectionPanel.CommonColumns)

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
      autoLoad: this.storeAutoLoad ?? false,
      baseParams: this.baseParams,
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
    this.totalTextCmp = new SM.RowCountTextItem({
      store
    })

    const config = {
      layout: 'fit',
      store,
      sm,
      cm: new Ext.grid.ColumnModel({
        columns
      }),
      view: new SM.ColumnFilters.GridViewBuffered({
        emptyText: this.emptyText || 'No records to display',
        deferEmptyText: false,
        forceFit: true,
        cellSelectorDepth: 5,
        // custom row height
        rowHeight: 21,
        borderHeight: 2,
        // render rows as they come into viewable area.
        scrollDelay: false,
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
            xtype: 'sm-reload-store-button',
            store,
            handler: this.reloadBtnHandler
          },
          {
            xtype: 'tbseparator'
          }, {
            xtype: 'exportbutton',
            hasMenu: false,
            grid: this,
            gridBasename: this.exportName || this.title || 'aggregation',
            iconCls: 'sm-export-icon',
            text: 'CSV'
          }, {
            xtype: 'tbfill'
          }, {
            xtype: 'tbseparator'
          },
          this.totalTextCmp
        ]
      }),
      listeners: {
        rowdblclick,
        cellmousedown
      }
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.CollectionPanel.UnaggGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const _this = this
    const fields = [
      {name: 'assetId', type: 'string'},
      {name: 'name', type: 'string'},
      {name: 'labelIds', type: 'string', convert: (v,r) => r.labels.map(l => l.labelId)},
      'benchmarkId',
      ...SM.CollectionPanel.CommonFields
    ]
    const columns = []
    let sortField, autoExpandColumn = Ext.id()

    function renderWithToolbar (v) {
      return `
      <div class="sm-grid-cell-with-toolbar">
        <div class="sm-dynamic-width">
          <div class="sm-info">${v}</div>
        </div>
        <div class="sm-static-width"><img class="sm-grid-cell-toolbar-edit" ext:qtip="Open checklist" src="img/shield-grey-check.svg" width="14" height="14"></div>
      </div>`
    }

    switch (this.parentAggregation) {
      case 'stig':
        columns.push(
          {
            header: "Asset",
            width: 175,
            id: autoExpandColumn,
            dataIndex: 'name',
            sortable: true,
            filter: { type: 'string' },
            renderer: renderWithToolbar
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
              metadata.attr = 'style="white-space:nowrap;text-overflow:clip;"'
              return SM.styledEmptyRenderer(SM.Collection.LabelArrayTpl.apply(labels))
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
            filter: { type: 'string' },
            renderer: renderWithToolbar
          }
        )
        sortField = 'benchmarkId'
        break        
    }
    columns.push(...SM.CollectionPanel.CommonColumns)

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
    this.totalTextCmp = new SM.RowCountTextItem({
      store
    })

    const rowdblclick = (grid, rowIndex) => {
      const r = grid.getStore().getAt(rowIndex)
      const leaf = {
        collectionId: grid.collectionId, 
        assetId: r.data.assetId,
        assetName: r.data.name,
        assetLabelIds: r.data.labelIds,
        benchmarkId: r.data.benchmarkId,
        stigName: r.data.benchmarkId,
      }
      addReview({leaf})
    }

    function cellclick (grid, rowIndex, columnIndex, e) {
      if (e.target.className === "sm-grid-cell-toolbar-edit") {
        const r = grid.getStore().getAt(rowIndex)
        const leaf = {
          collectionId: grid.collectionId, 
          assetId: r.data.assetId,
          assetName: r.data.name,
          assetLabelIds: r.data.labelIds,
          benchmarkId: r.data.benchmarkId,
          stigName: r.data.benchmarkId,
        }
        addReview({leaf})
      }
    }
    
    const config = {
      layout: 'fit',
      store,
      cm: new Ext.grid.ColumnModel({
        columns
      }),
      view: new SM.ColumnFilters.GridViewBuffered({
        emptyText: this.emptyText || 'No records to display',
        deferEmptyText: false,
        forceFit: true,
        cellSelectorDepth: 5,
        // custom row height
        rowHeight: 21,
        borderHeight: 2,
        // render rows as they come into viewable area.
        scrollDelay: false,
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
            xtype: 'sm-reload-store-button',
            store,
            handler: this.reloadBtnHandler
          },
          {
            xtype: 'tbseparator'
          },
          {
            xtype: 'exportbutton',
            hasMenu: false,
            grid: this,
            gridBasename: this.exportName || this.title || 'unaggregated',
            iconCls: 'sm-export-icon',
            text: 'CSV'
          },
          {
            xtype: 'tbfill'
          }, 
          {
            xtype: 'tbseparator'
          },
          this.totalTextCmp
        ]
      }),
      listeners: {
        rowdblclick,
        cellclick
      }
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.CollectionPanel.ChartPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    this.chartId = Ext.id()
    const html = `<canvas id="sm-chart-${this.chartId}"${this.chartHeight ? ' height="250px"' : ''}${this.chartWidth ? ' width="250px"' : ''}></canvas>`

    const config = {
      html,
      listeners: {
        afterrender(me) {
          me.chart = new Chart(`sm-chart-${me.chartId}`, this.chartOptions)
        }
      }
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    SM.CollectionPanel.ChartPanel.superclass.initComponent.call(this)
  },
  replaceData: function (data, datasetIndex = 0) {
    this.chart.dataset[datasetIndex].data = data
    this.chart.update()
  },

})

SM.CollectionPanel.ProgressBarsPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const _this = this
    const calcData = function (metrics) {
      return {
        assessed: metrics.assessments ? metrics.assessed / metrics.assessments * 100 : 0,
        submitted: metrics.assessments ? ((metrics.statuses.submitted + metrics.statuses.accepted + metrics.statuses.rejected) / metrics.assessments) * 100 : 0,
        accepted: metrics.assessments ? (metrics.statuses.accepted / metrics.assessments) * 100 : 0,
        rejected: metrics.assessments ? (metrics.statuses.rejected / metrics.assessments) * 100 : 0
      }
    }
    const tpl = new Ext.XTemplate(
      '<div class="sm-metrics-progress-parent">',
        '<div class="sm-metrics-progress-child">',
          `<div class="sm-metrics-progress-label">Assessed</div>`,
          `<div class="sm-metrics-progress-thermometer-wrap">{[renderPct(values.assessed)]}</div>`,
        '</div>',
        '<div class="sm-metrics-progress-child" >',
          `<div class="sm-metrics-progress-label">Submitted</div>`,
          `<div class="sm-metrics-progress-thermometer-wrap">{[renderPct(values.submitted)]}</div>`,
        '</div>',
        '<div class="sm-metrics-progress-child" >',
          `<div class="sm-metrics-progress-label">Accepted</div>`,
          `<div class="sm-metrics-progress-thermometer-wrap">{[renderPct(values.accepted)]}</div>`,
        '</div>',
        '<div class="sm-metrics-progress-child" >',
          `<div class="sm-metrics-progress-label">Rejected</div>`,
          `<div class="sm-metrics-progress-thermometer-wrap">{[renderPct(values.rejected)]}</div>`,
        '</div>',
      '</div>'
    )
    const updateMetrics = function(metrics) {
      _this.update(calcData(metrics))
    }
    const config = {
      tpl,
      updateMetrics
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.CollectionPanel.ProgressPanelColors = function (theme) {
  const style = getComputedStyle(document.documentElement)
  const ordered = [  
    'assessed',
    'submitted',
    'accepted',
    'unassessed',
    'rejected'
  ].map( category => style.getPropertyValue(`--metrics-status-chart-${category}-${theme}`))
  return ordered
}

SM.CollectionPanel.ProgressPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {

    const calcMetrics = function (metrics) {
      return {
        unassessed: metrics.assessments - metrics.assessed,
        assessed: metrics.statuses.saved - metrics.results.unassessed,
        submitted: metrics.statuses.submitted,
        accepted: metrics.statuses.accepted,
        rejected: metrics.statuses.rejected,
        assessments: metrics.assessments,
        apiAssessed: metrics.assessed
      }
    }
    
    const chartOptions = {
      type: 'doughnut',
      data: {
        datasets: [{
          data: [0,0,0,0,0],
          backgroundColor: SM.CollectionPanel.ProgressPanelColors(localStorage.getItem('darkMode') === '1' ? 'dark' : 'light'),
          borderWidth: [1, 1],
          borderColor: '#bbbbbb'
        }],
        labels: [
          'Assessed',
          'Submitted',
          'Accepted',
          'Unassessed',
          'Rejected'
        ],
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

    const chartPanel = new SM.CollectionPanel.ChartPanel({
      border: false,
      width: 170,
      height: 170,
      chartOptions
    })

    const onThemeChanged = function (theme) {
        if (chartPanel.chart) {
          chartPanel.chart.config._config.data.datasets[0].backgroundColor = SM.CollectionPanel.ProgressPanelColors(theme)
          chartPanel.chart.update() 
        }
    }
    SM.Dispatcher.addListener('themechanged', onThemeChanged)

    const updateMetrics = function (metrics) {
      const metricCalcs = calcMetrics(metrics)
      dataPanel.update(metricCalcs)
      if (chartPanel.chart) {
        chartPanel.chart.config._config.data.datasets[0].data = [
          metricCalcs.assessed, //Assessed
          metricCalcs.submitted, // Submitted
          metricCalcs.accepted, // Accepted
          metricCalcs.unassessed, // Unassessed
          metricCalcs.rejected // Rejected         
        ]
        chartPanel.chart.update()  
      }
      progressBarsPanel.updateMetrics(metrics)
    }

    const dataTpl = [
      `<div class="sm-metrics-status-pct">{[values.assessments ? ( values.apiAssessed/values.assessments * 100).toFixed(0) : 0]}% assessed</div>`,
      '<table class="sm-metrics-status-table" style="margin: 0 auto;">',
      '<tbody>',
      '<tr><td class="sm-metrics-label sm-metrics-unassessed">Unassessed</td><td class="sm-metrics-value">{unassessed}</td></tr>',
      '<tr><td class="sm-metrics-label sm-metrics-assessed">Assessed</td><td class="sm-metrics-value">{assessed}</td></tr>',
      '<tr><td class="sm-metrics-label sm-metrics-submitted">Submitted</td><td class="sm-metrics-value">{submitted}</td></tr>',
      '<tr><td class="sm-metrics-label sm-metrics-accepted">Accepted</td><td class="sm-metrics-value">{accepted}</td></tr>',
      '<tr><td class="sm-metrics-label sm-metrics-rejected">Rejected</td><td class="sm-metrics-value">{rejected}</td></tr>',
      '<tr class="sm-metrics-total"><td>Total Checks</td><td class="sm-metrics-value">{assessments}</td></tr>',
      '</tbody>',
      '</table>'
    ]
    const dataPanel = new Ext.Panel({
      border: false,
      tpl: dataTpl,
      width: 150
    })
    const progressBarsPanel = new SM.CollectionPanel.ProgressBarsPanel({
      border: false,
      height: 44
    })

    const config = {
      layout: 'vbox',
      height: 290,
      layoutConfig: {
        align: 'stretch',
        pack: 'center'
      },
      items: [
        {
          layout: 'hbox',
          height: 180,
          border: false,
          layoutConfig: {
            align: 'middle',
            pack: 'center'
          },
          items: [chartPanel, {width: 30, border: false}, dataPanel]
        },
        {height: 20, border: false},
        progressBarsPanel,
      ],
      updateMetrics,
      listeners: {
        beforedestroy: function () {
          SM.Dispatcher.removeListener('themechanged', onThemeChanged)
        }
      }
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    SM.CollectionPanel.ProgressPanel.superclass.initComponent.call(this)
  }
})

SM.CollectionPanel.AgesPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const _this = this
    let refreshTimer
    const tpl = new Ext.XTemplate(
      '<div class="sm-metrics-count-parent">',
        `<div class="sm-metrics-count-child sm-metrics-age-box" ext:qwidth=130 ext:qtip="{[Ext.util.Format.date(values.minTs,'Y-m-d H:i T')]}">`,
          `<div class="sm-metrics-count-label">Oldest</div><div class="sm-metrics-count-value">{[renderDurationToNow(values.minTs)]}</div>`,
        '</div>',
        `<div class="sm-metrics-count-child sm-metrics-age-box" ext:qwidth=130 ext:qtip="{[Ext.util.Format.date(values.maxTs,'Y-m-d H:i T')]}">`,
          `<div class="sm-metrics-count-label">Newest</div><div class="sm-metrics-count-value">{[renderDurationToNow(values.maxTs)]}</div>`,
        '</div>',
        `<div class="sm-metrics-count-child sm-metrics-age-box" ext:qwidth=130 ext:qtip="{[Ext.util.Format.date(values.maxTouchTs,'Y-m-d H:i T')]}">`,
          `<div class="sm-metrics-count-label">Updated</div><div class="sm-metrics-count-value">{[renderDurationToNow(values.maxTouchTs)]}</div>`,
        '</div>',
      '</div>'
    )
    const updateMetrics = function (metrics) {
      _this.metrics = metrics
      _this.update(metrics)
    }

    const config = {
      tpl,
      data: this.metrics,
      updateMetrics,
      listeners: {
        beforedestroy: () => {
          clearTimeout(refreshTimer)
        },
      }
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.CollectionPanel.FindingsPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const _this = this
    const tpl = new Ext.XTemplate(
      '<div class="sm-metrics-count-parent">',
        '<div class="sm-metrics-count-child sm-metrics-low-box">',
          `<div class="sm-metrics-count-label">CAT 3</div><div class="sm-metrics-count-value">{[values.low]}</div>`,
        '</div>',
        '<div class="sm-metrics-count-child sm-metrics-medium-box" >',
          `<div class="sm-metrics-count-label">CAT 2</div><div class="sm-metrics-count-value">{[values.medium]}</div>`,
        '</div>',
        '<div class="sm-metrics-count-child sm-metrics-high-box" >',
          `<div class="sm-metrics-count-label">CAT 1</div><div class="sm-metrics-count-value">{[values.high]}</div>`,
        '</div>',
      '</div>'
    )
    const updateMetrics = function (metrics) {
      _this.update(metrics)
    }
    const config = {
      tpl,
      data: this.metrics,
      updateMetrics
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.CollectionPanel.ExportPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const _this = this
    const collectionId = this.collectionId

    const formatComboBox = new Ext.form.ComboBox({
      mode: 'local',
      width: 110,
      fieldLabel: "Format",
      forceSelection: true,
      autoSelect: true,
      editable: false,
      store: new Ext.data.SimpleStore({
        fields: ['displayStr', 'valueStr'],
        data: [
          ['JSON', 'json'],
          ['CSV', 'csv']
        ]
      }),
      valueField:'valueStr',
      displayField:'displayStr',
      value: localStorage.getItem('metricsExportFormat') || 'json',
      monitorValid: false,
      triggerAction: 'all',
      listeners: {
        select: function (combo, record, index) {
          localStorage.setItem('metricsExportFormat', combo.getValue())
        }
      }
    })
    const styleComboBox = new Ext.form.ComboBox({
      mode: 'local',
      width: 110,
      fieldLabel: "Style",
      forceSelection: true,
      autoSelect: true,
      editable: false,
      store: new Ext.data.SimpleStore({
        fields: ['displayStr', 'valueStr'],
        data: [
          ['Summary', 'summary'],
          ['Detail', 'detail']
        ]
      }),
      valueField:'valueStr',
      displayField:'displayStr',
      value: localStorage.getItem('metricsExportStyle') || 'summary',
      monitorValid: false,
      triggerAction: 'all',
      listeners: {
        select: function (combo, record, index) {
          localStorage.setItem('metricsExportStyle', combo.getValue())
        }
      }
    })
    const aggComboBox = new Ext.form.ComboBox({
      mode: 'local',
      width: 110,
      fieldLabel: "Grouped by",
      forceSelection: true,
      autoSelect: true,
      editable: false,
      store: new Ext.data.SimpleStore({
        fields: ['displayStr', 'valueStr'],
        data: [
          ['Collection', 'collection'],
          ['Asset', 'asset'],
          ['Label', 'label'],
          ['STIG', 'stig'],
          ['Ungrouped', 'unagg']
        ]
      }),
      valueField:'valueStr',
      displayField:'displayStr',
      value: localStorage.getItem('metricsExportAgg') || 'collection',
      monitorValid: false,
      triggerAction: 'all',
      listeners: {
        select: function (combo, record, index) {
          localStorage.setItem('metricsExportAgg', combo.getValue())
        }
      }
    })
    const exportButton = new Ext.Button({
      text: 'Download',
      iconCls: 'sm-export-icon',
      disabled: false,
      style: {
        position: 'relative',
        top: '-52px',
        left: '255px'
      },
      handler: async function () {
        const format = formatComboBox.getValue()
        const style = styleComboBox.getValue()
        const agg = aggComboBox.getValue() 
        const url = `${STIGMAN.Env.apiBase}/collections/${collectionId}/metrics/${style}${agg === 'unagg' ? '' : `/${agg}`}?format=${format}`
        const attachment = `${agg}-${style}.${format}` 
        await window.oidcProvider.updateToken(10)
        const fetchInit = {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${window.oidcProvider.token}`,
            'Accept': `${format === 'csv' ? 'text/csv' : 'application/json'}`
          },
          attachment 
        }
        const href = await SM.ServiceWorker.getDownloadUrl({ url, ...fetchInit })
        if (href) {
          window.location = href
          return
        }
        const response = await fetch(url, fetchInit)
        if (!response.ok) {
          const body = await response.text()
          throw new Error(`Request failed with status ${response.status}\n${body}`)
        }
        const blob = await response.blob()
        saveAs(blob, attachment)
      }
    })

    const config = {
      layout: 'form',
      items:[
        aggComboBox,
        styleComboBox,
        formatComboBox,
        exportButton
      ]
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.CollectionPanel.InventoryPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const _this = this
    const tpl = new Ext.XTemplate(
      '<div class="sm-metrics-count-parent">',
        '<div class="sm-metrics-count-child sm-metrics-inventory-box" >',
          `<div class="sm-metrics-count-label">Assets</div><div class="sm-metrics-count-value">{assets}</div>`,
        '</div>',
        '<div class="sm-metrics-count-child sm-metrics-inventory-box">',
        `<div class="sm-metrics-count-label">STIGs</div><div class="sm-metrics-count-value">{stigs}</div>`,
        '</div>',
        '<div class="sm-metrics-count-child sm-metrics-inventory-box">',
        `<div class="sm-metrics-count-label">Checklists</div><div class="sm-metrics-count-value">{checklists}</div>`,
        '</div>',
      '</div>'
    )
    const updateMetrics = function (metrics) {
      _this.update(metrics)
    }
    const config = {
      tpl,
      data: this.data,
      updateMetrics
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.CollectionPanel.OverviewPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const _this = this
    const collectionId = this.collectionId
    this.inventoryPanel = new SM.CollectionPanel.InventoryPanel({
      cls: 'sm-round-inner-panel',
      bodyStyle: 'padding: 10px;',
      title: 'Inventory',
      tools: this.inventoryPanelTools || undefined,
      border: true
    })
    this.progressPanel = new SM.CollectionPanel.ProgressPanel({
      cls: 'sm-round-inner-panel',
      bodyStyle: 'padding: 10px;',
      title: 'Progress',
      tools: this.progressPanelTools || undefined,
      border: true
    })
    this.agesPanel = new SM.CollectionPanel.AgesPanel({
      cls: 'sm-round-inner-panel',
      bodyStyle: 'padding: 10px;',
      title: 'Review Ages',
      tools: this.agesPanelTools || undefined,
      border: true
    })
    this.findingsPanel = new SM.CollectionPanel.FindingsPanel({
      cls: 'sm-round-inner-panel',
      bodyStyle: 'padding: 10px;',
      title: 'Findings',
      tools: this.findingsPanelTools || undefined,
      border: true
    })
    this.exportPanel = new SM.CollectionPanel.ExportPanel({
      cls: 'sm-round-inner-panel',
      bodyStyle: 'padding: 10px;',
      title: 'Export metrics',
      border: true,
      height: 122,
      collectionId
    })

    const updateMetrics = function (data) {
      _this.data = data
      _this.inventoryPanel.updateMetrics(data)
      _this.progressPanel.updateMetrics(data.metrics)
      _this.agesPanel.updateMetrics(data.metrics)
      _this.findingsPanel.updateMetrics(data.metrics.findings)
    }
    const config = {
      border: false,
      autoScroll: true,
      items: [
        this.progressPanel,
        this.inventoryPanel,
        this.findingsPanel,
        this.agesPanel,
        this.exportPanel
      ],
      updateMetrics
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.CollectionPanel.AggAssetPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const _this = this
    const collectionId = this.collectionId
    const aggAssetGrid = new SM.CollectionPanel.AggGrid({
      aggregation: 'asset',
      stateId: `sm-metrics-agg-grid-asset-${collectionId}`,
      stateful: true,
      collectionId,
      border: false,
      region: 'center',
      exportName: 'Assets',
      baseParams: this.baseParams,
      reloadBtnHandler: this.reloadBtnHandler
    })
    const unaggGrid = new SM.CollectionPanel.UnaggGrid({
      title: 'STIGs',
      stateId: `sm-metrics-unagg-grid-asset-${collectionId}`,
      stateful: true,
      parentAggregation: 'asset',
      reloadBtnHandler: this.reloadBtnHandler,
      collectionId,
      border: false,
      region: 'south',
      split: true,
      height: '33%'
    })
    async function onRowSelect (cm, index, record) {
      await unaggGrid.store.loadPromise({
        assetId: record.data.assetId
      })
      unaggGrid.setTitle(`STIGs mapped to ${record.data.name}`)
    }

    aggAssetGrid.getSelectionModel().on('rowselect', onRowSelect)
    const updateBaseParams = function (params) {
      unaggGrid.store.baseParams = aggAssetGrid.store.baseParams = _this.baseParams = params
      updateData()
    }
    const updateData = async function (onlyRefreshView = false) {
      try {
        const selectedRow = aggAssetGrid.getSelectionModel().getSelected()

        if (onlyRefreshView) {
          aggAssetGrid.getView().refresh()
          if (selectedRow) {
            unaggGrid.getView().refresh()
          }
          return
        }

        await aggAssetGrid.store.loadPromise()
        if (!selectedRow) {
          return
        }

        const currentRecord = aggAssetGrid.store.getById(selectedRow.data.assetId)
        if (!currentRecord) {
          unaggGrid.store.removeAll()
          return
        }
        const currentIndex = aggAssetGrid.store.indexOfId(selectedRow.data.assetId)
        aggAssetGrid.view.focusRow(currentIndex)
        await unaggGrid.store.loadPromise({
          assetId: currentRecord.data.assetId
        })
      }
      catch (e) {
        console.log(e)
      }
    }

    const config = {
      layout: 'border',
      cls: 'sm-metric-agg-panel',
      items: [
        aggAssetGrid,
        unaggGrid
      ],
      updateBaseParams,
      updateData
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.CollectionPanel.AggStigPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const _this = this
    const collectionId = this.collectionId

    // const exportBtn = new Ext.Button({
    //   iconCls: 'sm-export-icon',
    //   text: 'Export results...',
    //   disabled: true,
    //   handler: function () {
    //     SM.Exports.showExportTree(_this.collectionId, _this.collectionName, 'stig', aggStigGrid.getSelectionModel().getSelections().map(r => r.data));
    //   }
    // })

    const aggStigGrid = new SM.CollectionPanel.AggGrid({
      aggregation: 'stig',
      stateId: `sm-collection-${collectionId}-agg-grid-stig`,
      stateful: true,
      checkboxSelModel: false,
      collectionId,
      baseParams: this.baseParams,
      reloadBtnHandler: this.reloadBtnHandler,
      exportName: 'STIGs',
      region: 'center',
      // tbar: new Ext.Toolbar({
      //   items: [
      //     exportBtn,
      //   ]
      // })
    })

    const unaggGrid = new SM.CollectionPanel.UnaggGrid({
      title: 'Checklists',
      stateId: `sm-collection-${collectionId}-unagg-grid-stig`,
      stateful: true,
      parentAggregation: 'stig',
      collectionId,
      reloadBtnHandler: this.reloadBtnHandler,
      region: 'south',
      split: true,
      height: '66%'
    })
    async function onRowSelect(cm, index, record) {
      const params = {
        benchmarkId: record.data.benchmarkId
      }
      if (_this.baseParams?.labelId.length) {
        params.labelId = _this.baseParams.labelId
      }
      await unaggGrid.store.loadPromise(params)
      unaggGrid.setTitle(`Checklists for ${record.data.benchmarkId}`)
    }

    aggStigGrid.getSelectionModel().on('rowselect', onRowSelect)

    const updateBaseParams = function (params) {
      unaggGrid.store.baseParams = aggStigGrid.store.baseParams = _this.baseParams = params
      updateData()
    }
    const updateData = async function (onlyRefreshView = false) {
      try {
        const selectedRow = aggStigGrid.getSelectionModel().getSelected()

        if (onlyRefreshView) {
          aggStigGrid.getView().refresh()
          if (selectedRow) {
            unaggGrid.getView().refresh()
          }
          return
        }

        await aggStigGrid.store.loadPromise()
        if (!selectedRow) {
          return
        }

        const currentRecord = aggStigGrid.store.getById(selectedRow.data.benchmarkId)
        if (!currentRecord) {
          unaggGrid.store.removeAll()
          return
        }
        const currentIndex = aggStigGrid.store.indexOfId(selectedRow.data.benchmarkId)
        aggStigGrid.view.focusRow(currentIndex)
        await unaggGrid.store.loadPromise({
          benchmarkId: currentRecord.data.benchmarkId
        })
      }
      catch (e) {
        console.log(e)
      }
    }

    const config = {
      layout: 'border',
      cls: 'sm-metric-agg-panel',
      items: [
        aggStigGrid,
        unaggGrid
      ],
      updateBaseParams,
      updateData
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.CollectionPanel.AggLabelPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const _this = this
    const collectionId = this.collectionId
    const aggLabelGrid = new SM.CollectionPanel.AggGrid({
      aggregation: 'label',
      stateId: `sm-metrics-agg-grid-label-${collectionId}`,
      stateful: true,
      collectionId,
      reloadBtnHandler: this.reloadBtnHandler,
      baseParams: this.baseParams,
      exportName: 'Labels',
      region: 'north',
      split: true,
      height: '33%'
    })
    const aggAssetGrid = new SM.CollectionPanel.AggGrid({
      title: 'Assets',
      stateId: `sm-metrics-agg-grid-label-asset-${collectionId}`,
      stateful: true,
      reloadBtnHandler: this.reloadBtnHandler,
      aggregation: 'asset',
      storeAutoLoad: false,
      collectionId,
      baseParams: this.baseParams,
      exportName: 'Assets',
      region: 'center'
    })
    const unaggGrid = new SM.CollectionPanel.UnaggGrid({
      title: 'STIGs',
      stateId: `sm-metrics-unagg-grid-label-${collectionId}`,
      stateful: true,
      parentAggregation: 'asset',
      reloadBtnHandler: this.reloadBtnHandler,
      collectionId,
      region: 'south',
      split: true,
      height: '33%'
    })
    async function onRowSelectLabel (cm, index, record) {
      const params = {}
      if (record.data.labelId) {
        params.labelId = record.data.labelId
      }
      else {
        params.labelMatch = 'null'
      }
      await aggAssetGrid.store.loadPromise(params)
      unaggGrid.store.removeAll()
      aggAssetGrid.setTitle(`Assets for ${record.data.name}`)
    }
    async function onRowSelectAsset (cm, index, record) {
      await unaggGrid.store.loadPromise({
        assetId: record.data.assetId
      })
      unaggGrid.setTitle(`STIGs for ${record.data.name}`)
    }

    aggLabelGrid.getSelectionModel().on('rowselect', onRowSelectLabel)
    aggAssetGrid.getSelectionModel().on('rowselect', onRowSelectAsset)
    const updateBaseParams = function (params) {
      unaggGrid.store.baseParams = aggLabelGrid.store.baseParams = aggAssetGrid.store.baseParams = _this.baseParams = params
      updateData()
    }
    const updateData = async function (onlyRefreshView = false) {
      try {
        const selectedRowLabel = aggLabelGrid.getSelectionModel().getSelected()
        const selectedRowAsset = aggAssetGrid.getSelectionModel().getSelected()

        if (onlyRefreshView) {
          aggLabelGrid.getView().refresh()
          if (selectedRowLabel) {
            aggAssetGrid.getView().refresh()
            if (selectedRowAsset) {
              unaggGrid.getView().refresh()
            }
          }
          return
        }

        await aggLabelGrid.store.loadPromise()
        if (!selectedRowLabel) {
          return
        }

        const currentRecordLabel = aggLabelGrid.store.getById(selectedRowLabel.data.labelId)
        if (!currentRecordLabel) {
          aggAssetGrid.store.removeAll()
          unaggGrid.store.removeAll()
          return
        }
        const currentIndexLabel = aggLabelGrid.store.indexOfId(selectedRowLabel.data.labelId)
        aggLabelGrid.view.focusRow(currentIndexLabel)
        await aggAssetGrid.store.loadPromise({
          labelId: currentRecordLabel.data.labelId
        })
        const currentRecordAsset = aggAssetGrid.store.getById(selectedRowAsset.data.assetId)
        if (!currentRecordAsset) {
          unaggGrid.store.removeAll()
          return
        }
        const currentIndexAsset = aggAssetGrid.store.indexOfId(selectedRowAsset.data.assetId)
        aggAssetGrid.view.focusRow(currentIndexAsset)
        await unaggGrid.store.loadPromise({
          assetId: currentRecordAsset.data.assetId
        })
      }
      catch (e) {
        console.log(e)
      }
    }

    const config = {
      layout: 'border',
      cls: 'sm-metric-agg-panel',
      items: [
        aggLabelGrid,
        aggAssetGrid,
        unaggGrid
      ],
      updateBaseParams,
      updateData
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.CollectionPanel.showCollectionTab = async function (options) {
  try {
    const { collectionId, collectionName, treePath, initialLabelIds = [] } = options

    function setCurrentBaseParams (labelIds) {
      if (!labelIds.length) return undefined
      const params = {}
      for (let x = 0, length = labelIds.length; x < length; x++) {
        if (labelIds[x] === null) {
          params.labelMatch = 'null'
        }
        else {
          ;(params.labelId ??= []).push(labelIds[x])
        }
      }
      return params
    }

    let gCurrentBaseParams = setCurrentBaseParams(initialLabelIds)
    let gCurrentLabelIds = initialLabelIds
    let lastApiRefresh, lastApiMetricsCollection
    const updateDataDelay = 300000
    const updateOverviewTitleDelay = 60000
    let updateDataTimer, refreshViewTimer, updateOverviewTitleInterval

    const tab = Ext.getCmp('main-tab-panel').getItem(`metrics-tab-${collectionId}`)
    if (tab) {
      Ext.getCmp('main-tab-panel').setActiveTab(tab.id)
      return
    }

    const overviewTitleTpl = new Ext.XTemplate(
      `{[values.labels ? 'Filtered: ' + values.labels : 'Full Collection']}{[values.lastApiRefresh ? '&nbsp;&nbsp;<i>(' + durationToNow(values.lastApiRefresh, true) + ')</i>' : '']}`
    )

    const getMetricsAggCollection = async function (collectionId) {
      // API requests
      const results = await Ext.Ajax.requestPromise({
        url: `${STIGMAN.Env.apiBase}/collections/${collectionId}/metrics/summary/collection`,
        method: 'GET',
        params: gCurrentBaseParams
      })
      lastApiRefresh = new Date()
      lastApiMetricsCollection = JSON.parse(results.response.responseText)
      return lastApiMetricsCollection
    }

    const labelsMenu = new SM.Collection.LabelsMenu({
      labels: SM.Cache.CollectionMap.get(collectionId).labels,
      showHeader: true,
      showApply: true,
      ignoreUnusedLabels: true,
      hasUnlabeledItem: true,
      listeners: {
        applied: function (labelIds) {
            SM.Dispatcher.fireEvent('labelfilter', collectionId, labelIds)
        }
      }
    })
      
    const overviewPanel = new SM.CollectionPanel.OverviewPanel({
      cls: 'sm-round-panel sm-metrics-overview-panel',
      collapsible: true,
      collapseFirst: false,
      inventoryPanelTools: [
        {
          id: 'manage',
          qtip: 'Manage collection',
          handler: (event, toolEl, panel, tc) => {
            addCollectionManager({
              collectionId,
              collectionName,
              treePath
            })
          }
        }
      ],
      findingsPanelTools: [
        {
          id: 'report',
          qtip: 'Open Findings report',
          handler: (event, toolEl, panel, tc) => {
            addFindingsSummary({
              collectionId,
              collectionName,
              treePath
            })
          }
        }
      ],
      tools: [
        {
          id: 'label',
          qtip: 'Label filtering',
          handler: (event, toolEl, panel, tc) => {
            labelsMenu.showAt(event.xy)
          }
        }
      ],
      title: ' ',
      margins: { top: SM.Margin.top, right: SM.Margin.edge, bottom: SM.Margin.bottom, left: SM.Margin.edge },
      region: 'west',
      width: 430,
      minWidth: 430,
      split: true,
      collectionId
    })

    const updateOverviewTitle = () => {
      // console.log(`${collectionName}: Executing updateOverviewTitle with ${gCurrentLabelIds} and ${lastApiRefresh}`)
      const overviewTitle = overviewTitleTpl.apply({
        labels: SM.Collection.LabelSpritesByCollectionLabelId(collectionId, gCurrentLabelIds),
        lastApiRefresh
      })
      overviewPanel.setTitle(overviewTitle)
    }

    const reloadBtnHandler = () => { updateData() }
    const aggAssetPanel = new SM.CollectionPanel.AggAssetPanel({
      title: 'Assets',
      iconCls: 'sm-asset-icon',
      layout: 'fit',
      border: false,
      collectionId,
      reloadBtnHandler,
      baseParams: gCurrentBaseParams
    })
    const aggStigPanel = new SM.CollectionPanel.AggStigPanel({
      title: 'STIGs',
      iconCls: 'sm-stig-icon',
      layout: 'fit',
      border: false,
      collectionId,
      reloadBtnHandler,
      baseParams: gCurrentBaseParams
    })
    const aggLabelPanel = new SM.CollectionPanel.AggLabelPanel({
      title: 'Labels',
      iconCls: 'sm-label-icon',
      layout: 'fit',
      border: false,
      collectionId,
      reloadBtnHandler,
      baseParams: gCurrentBaseParams
    })

    const aggTabPanel = new Ext.TabPanel({
      activeTab: 0,
      border: false,
      deferredRender: false,
      items: [
        aggStigPanel,
        aggLabelPanel,
        aggAssetPanel
      ],
      listeners: {
        beforetabchange: function (tp, newTab, currentTab) {
          if (currentTab) { // after initial setup update the whole presentation
            updateData()
          }
        }
      }
    })

    const centerPanel = new Ext.Panel({
      region: 'center',
      layout: 'fit',
      // title: 'Checklists',
      cls: 'sm-round-panel',
      margins: { top: SM.Margin.top, right: SM.Margin.edge, bottom: SM.Margin.bottom, left: SM.Margin.adjacent },
      border: false,
      collapsible: false,
      items: aggTabPanel
    })

    const metricsTab = new Ext.Panel({
      id: 'metrics-tab-' + collectionId,
      border: false,
      region: 'center',
      collectionId: collectionId,
      collectionName: collectionName,
      iconCls: 'sm-collection-color-icon',
      title: '',
      closable: true,
      layout: 'border',
      sm_tabMode: 'permanent',
      sm_treePath: treePath,
      items: [
        overviewPanel,
        centerPanel
      ],
      listeners: {
        beforehide: (panel) => {
            // console.log(`${collectionName}: hide tab ${panel.id}`)
            cancelTimers()
        },
        beforeshow: (panel) => {
            // console.log(`${collectionName}: show tab ${panel.id}`)
            updateData()
        }

      }
    })

    // handle change to label filters in NavTree
    const onLabelFilter = async (srcCollectionId, srcLabelIds) => {
      try {
        if (srcCollectionId === collectionId) {
          gCurrentLabelIds = srcLabelIds
          gCurrentBaseParams = setCurrentBaseParams(gCurrentLabelIds)
          let apiMetricsCollection = await getMetricsAggCollection(collectionId)
          updateOverviewTitle()
          overviewPanel.updateMetrics(apiMetricsCollection)
          aggAssetPanel.updateBaseParams(gCurrentBaseParams)
          aggStigPanel.updateBaseParams(gCurrentBaseParams)
          aggLabelPanel.updateBaseParams(gCurrentBaseParams)
        }
      }
      catch (e) {
        alert (e)
      }
    }
    SM.Dispatcher.addListener('labelfilter', onLabelFilter)

    // handle periodic updates
    async function updateData (onlyRefreshView = false) {
      try {
        // console.log(`${collectionName}: executing updateData(${onlyRefreshView})`)
        let apiMetricsCollection = lastApiMetricsCollection
        if (!onlyRefreshView) {
          // console.log(`${collectionName}: cancelling refreshView timer, id ${refreshViewTimer}`)
          clearTimeout(refreshViewTimer)
          // console.log(`${collectionName}: cancelling updateData timer, id ${updateDataTimer}`)
          clearTimeout(updateDataTimer)
          updateDataTimer = refreshViewTimer = null
          apiMetricsCollection = await getMetricsAggCollection(collectionId, gCurrentLabelIds)
          updateDataTimer = setTimeout(updateData, updateDataDelay)
          // console.log(`${collectionName}: set updateData timer in ${updateDataDelay}, id ${updateDataTimer}`)
        }
        // console.log(`${collectionName}: cancelling updateOverviewTitle interval, id ${updateOverviewTitleInterval}`)
        clearInterval(updateOverviewTitleInterval)
        updateOverviewTitleInterval = null
        updateOverviewTitle()
        updateOverviewTitleInterval = setInterval(updateOverviewTitle, updateOverviewTitleDelay)
        // console.log(`${collectionName}: set updateOverviewTitle interval every ${updateOverviewTitleDelay}, id ${updateOverviewTitleInterval}`)

        overviewPanel.updateMetrics(apiMetricsCollection)
        const activePanel = aggTabPanel.getActiveTab()
        if (activePanel) {
          await activePanel.updateData(onlyRefreshView)
        }

        const refreshDelay = calcRefreshDelay(apiMetricsCollection.metrics.maxTouchTs)
        if (refreshDelay < updateDataDelay) {
          refreshViewTimer = setTimeout(updateData, refreshDelay, true)
          // console.log(`${collectionName}: set refreshView timer in ${refreshDelay}, id ${refreshViewTimer}`)
        }
      }
      catch (e) {
        alert (e)
      }
    }
    function cancelTimers () {
      // console.log(`${collectionName}: cancelling refreshView timer, id ${refreshViewTimer}`)
      clearTimeout(refreshViewTimer)
      // console.log(`${collectionName}: cancelling updateData timer, id ${updateDataTimer}`)
      clearTimeout(updateDataTimer)
      // console.log(`${collectionName}: cancelling updateOverview interval, id ${updateOverviewTitleInterval}`)
      clearInterval(updateOverviewTitleInterval)
      refreshViewTimer = updateDataTimer = updateOverviewTitleInterval = null
    }

    const calcRefreshDelay = (maxTouchTs) => {
      const diffSecs = Math.ceil(Math.abs(new Date() - new Date(maxTouchTs))/1000)
      if ( diffSecs < 3600 ) {
        return 30 * 1000
      }
      if ( diffSecs < 86400 ) {
        return 3600 * 1000
      }
      return 86400 * 1000
    }
    metricsTab.on('beforedestroy', () => { 
      SM.Dispatcher.removeListener('labelfilter', onLabelFilter) 
      cancelTimers()
    })

    metricsTab.updateTitle = function () {
      metricsTab.setTitle(`${metricsTab.sm_tabMode === 'ephemeral' ? '<i>' : ''}${SM.he(metricsTab.collectionName)}${metricsTab.sm_tabMode === 'ephemeral' ? '</i>' : ''}`)
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
    tp.setActiveTab(metricsTab.id)


  }
  catch (e) {
    alert(e)
  }
}

