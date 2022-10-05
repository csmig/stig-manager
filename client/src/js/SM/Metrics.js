Ext.ns('SM.Metrics')

Chart.defaults.font = {
  size: 11,
  family: "'Open Sans', helvetica, sans-serif"
}

SM.Metrics.Renderers = {
  severityCount: function (v, md) {
    return v === 0 ? '' : `<div class="sm-metrics-findings-count-cell sm-metrics-${this.dataIndex}-box">${v}</div>`
  }
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
  }
]

SM.Metrics.CommonColumns = [
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
  // {
  //   header: "Saved",
  //   width: 75,
  //   dataIndex: 'savedPct',
  //   align: "center",
  //   sortable: true,
  //   renderer: renderPct
  // },
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
    renderer: SM.Metrics.Renderers.severityCount
  },
  {
    header: "CAT 2",
    width: 50,
    dataIndex: 'medium',
    align: "center",
    sortable: true,
    renderer: SM.Metrics.Renderers.severityCount
  },
  {
    header: "CAT 1",
    width: 50,
    dataIndex: 'high',
    align: "center",
    sortable: true,
    renderer: SM.Metrics.Renderers.severityCount
  },
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
      autoLoad: this.storeAutoLoad ?? true,
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

    const onChildRowDblClick = (grid, rowIndex) => {
      const r = grid.getStore().getAt(rowIndex);
      addReview({
        collectionId: grid.collectionId, 
        assetId: r.data.assetId,
        assetName: r.data.name,
        assetLabelIds: r.data.labelIds,
        benchmarkId: r.data.benchmarkId,
        stigName: r.data.benchmarkId,
      })
    }
    
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
      }),
      listeners: {
        rowdblclick: onChildRowDblClick
      }
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.Metrics.ChartPanel = Ext.extend(Ext.Panel, {
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
    SM.Metrics.ChartPanel.superclass.initComponent.call(this)
  },
  replaceData: function (data, datasetIndex = 0) {
    this.chart.dataset[datasetIndex].data = data
    this.chart.update()
  },

})

SM.Metrics.ProgressPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const data = {
      assessed: this.metrics.assessments ? this.metrics.assessed / this.metrics.assessments * 100 : 0,
      submitted: this.metrics.assessments ? ((this.metrics.statuses.submitted + this.metrics.statuses.accepted + this.metrics.statuses.rejected) / this.metrics.assessments) * 100 : 0,
      accepted: this.metrics.assessments ? (this.metrics.statuses.accepted / this.metrics.assessments) * 100 : 0,
      rejected: this.metrics.assessments ? (this.metrics.statuses.rejected / this.metrics.assessments) * 100 : 0
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
    const config = {
      tpl,
      data
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.Metrics.StatusPanelColors = function (theme) {
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

SM.Metrics.StatusPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {

    const metricCalcs = {
      unassessed: this.metrics.assessments - this.metrics.assessed,
      assessed: this.metrics.statuses.saved - this.metrics.results.other,
      submitted: this.metrics.statuses.submitted,
      accepted: this.metrics.statuses.accepted,
      rejected: this.metrics.statuses.rejected,
      assessments: this.metrics.assessments,
      apiAssessed: this.metrics.assessed
    }
    
    const chartOptions = {
      type: 'doughnut',
      data: {
        datasets: [{
          data: [
            metricCalcs.assessed, //Assessed
            metricCalcs.submitted, // Submitted
            metricCalcs.accepted, // Accepted
            metricCalcs.unassessed, // Unassessed
            metricCalcs.rejected // Rejected         
          ],
          backgroundColor: SM.Metrics.StatusPanelColors(localStorage.getItem('darkMode') === '1' ? 'dark' : 'light'),
          borderWidth: [1, 1],
          borderColor: '#bbbbbb'
        }],
        labels: [
          'Saved',
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

    const chartPanel = metricCalcs.assessments ? new SM.Metrics.ChartPanel({
      border: false,
      id: 'chart-panel',
      width: 175,
      height: 175,
      chartOptions
    }) : { 
      border: false,
      html: '<div class="sm-metrics-no-assessments-body">No Asset/STIG mappings exist</div>',
      width: 175,
      height: 175
    }

    const onThemeChanged = function (theme) {
      // setTimeout( () => {
        if (chartPanel.chart) {
          chartPanel.chart.config._config.data.datasets[0].backgroundColor = SM.Metrics.StatusPanelColors(theme)
          chartPanel.chart.update() 
        }
      // }, 100)
    }
    SM.Dispatcher.addListener('themechanged', onThemeChanged)

    const dataTpl = [
      `<div class="sm-metrics-status-pct">{[values.assessments ? ( values.apiAssessed/values.assessments * 100).toFixed(1) : 0]}% assessed</div>`,
      '<table class="sm-metrics-status-table" style="margin: 0 auto;">',
      '<tbody>',
      '<tr><td class="sm-metrics-label sm-metrics-unassessed">Unassessed</td><td class="sm-metrics-value">{unassessed}</td></tr>',
      '<tr><td class="sm-metrics-label sm-metrics-assessed">Saved</td><td class="sm-metrics-value">{assessed}</td></tr>',
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
      flex: 1,
      data: metricCalcs
    })

    const config = {
      layout: 'hbox',
      layoutConfig: {
        align: 'top'
      },
      items: [chartPanel, dataPanel],
      listeners: {
        beforedestroy: function () {
          SM.Dispatcher.removeListener('themechanged', onThemeChanged)
        }
      }
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    SM.Metrics.StatusPanel.superclass.initComponent.call(this)
  }
})

SM.Metrics.AgesPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const _this = this
    const tpl = new Ext.XTemplate(
      '<div class="sm-metrics-count-parent">',
        '<div class="sm-metrics-count-child sm-metrics-age-box" >',
          `<div class="sm-metrics-count-label">Oldest</div><div class="sm-metrics-count-value">{[renderDurationToNow(values.minTs)]}</div>`,
        '</div>',
        '<div class="sm-metrics-count-child sm-metrics-age-box">',
          `<div class="sm-metrics-count-label">Newest</div><div class="sm-metrics-count-value">{[renderDurationToNow(values.maxTs)]}</div>`,
        '</div>',
      '</div>'
    )
    const config = {
      tpl,
      data: this.metrics
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.Metrics.FindingsPanel = Ext.extend(Ext.Panel, {
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
    const config = {
      tpl,
      data: this.metrics
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.Metrics.ExportPanel = Ext.extend(Ext.Panel, {
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

SM.Metrics.OverviewPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const collectionId = this.collectionId

    const progressPanel = new SM.Metrics.ProgressPanel({
      cls: 'sm-round-inner-panel',
      bodyStyle: 'padding: 10px;',
      title: 'Progress',
      border: true,
      metrics: this.metrics
    })
    const statusPanel = new SM.Metrics.StatusPanel({
      cls: 'sm-round-inner-panel',
      bodyStyle: 'padding: 10px;',
      title: 'Status Distribution',
      border: true,
      metrics: this.metrics
    })
    const agesPanel = new SM.Metrics.AgesPanel({
      cls: 'sm-round-inner-panel',
      bodyStyle: 'padding: 10px;',
      title: 'Review Age',
      border: true,
      metrics: this.metrics
    })
    const findingsPanel = new SM.Metrics.FindingsPanel({
      cls: 'sm-round-inner-panel',
      bodyStyle: 'padding: 10px;',
      title: 'Findings',
      border: true,
      metrics: this.metrics.findings
    })
    const exportPanel = new SM.Metrics.ExportPanel({
      cls: 'sm-round-inner-panel',
      bodyStyle: 'padding: 10px;',
      title: 'Export metrics',
      border: true,
      height: 140,
      collectionId
    })
    const config = {
      border: false,
      autoScroll: true,
      // layout: 'vbox',
      // layoutConfig: {
      //   align: 'stretch',
      // },
      items: [
        statusPanel,
        progressPanel,
        findingsPanel,
        agesPanel,
        exportPanel
      ]
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
      border: false,
      region: 'center',
      baseParams: this.baseParams
    })
    const unaggGrid = new SM.Metrics.UnaggGrid({
      title: 'STIGs',
      parentAggregation: 'asset',
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

    const config = {
      layout: 'border',
      cls: 'sm-metric-agg-panel',
      items: [
        aggAssetGrid,
        unaggGrid
      ]
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.Metrics.AggStigPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const _this = this
    const collectionId = this.collectionId
    const aggStigGrid = new SM.Metrics.AggGrid({
      aggregation: 'stig',
      collectionId,
      baseParams: this.baseParams,
      region: 'center'
    })
    const unaggGrid = new SM.Metrics.UnaggGrid({
      title: 'Assets',
      parentAggregation: 'stig',
      collectionId,
      region: 'south',
      split: true,
      height: '66%'
    })
    async function onRowSelect (cm, index, record) {
      const params = {
        benchmarkId: record.data.benchmarkId
      }
      if (_this.baseParams?.labelId.length) {
        params.labelId = _this.baseParams.labelId
      }
      await unaggGrid.store.loadPromise(params)
      unaggGrid.setTitle(`Assets mapped to ${record.data.benchmarkId}`)
    }

    aggStigGrid.getSelectionModel().on('rowselect', onRowSelect)

    const config = {
      layout: 'border',
      cls: 'sm-metric-agg-panel',
      items: [
        aggStigGrid,
        unaggGrid
      ]
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.Metrics.AggLabelPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const _this = this
    const collectionId = this.collectionId
    const aggLabelGrid = new SM.Metrics.AggGrid({
      aggregation: 'label',
      collectionId,
      baseParams: this.baseParams,
      region: 'north',
      split: true,
      height: '33%'
    })
    const aggAssetGrid = new SM.Metrics.AggGrid({
      title: 'Assets',
      aggregation: 'asset',
      storeAutoLoad: false,
      collectionId,
      baseParams: this.baseParams,
      region: 'center'
    })
    const unaggGrid = new SM.Metrics.UnaggGrid({
      title: 'STIGs',
      parentAggregation: 'asset',
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

    const config = {
      layout: 'border',
      cls: 'sm-metric-agg-panel',
      items: [
        aggLabelGrid,
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
    let { collectionId, collectionName, treePath, labelIds } = options

    const tab = Ext.getCmp('main-tab-panel').getItem(`metrics-tab-${collectionId}`)
    if (tab) {
      tab.show()
      return
    }

    // API requests
    const params = labelIds.length ? { labelId: labelIds } : undefined
    const results = await Ext.Ajax.requestPromise({
      url: `${STIGMAN.Env.apiBase}/collections/${collectionId}/metrics/summary/collection`,
      method: 'GET',
      params
    })
    const apiMetricsCollection = JSON.parse(results.response.responseText)

    const overviewPanel = new SM.Metrics.OverviewPanel({
      cls: 'sm-round-panel sm-metrics-overview-panel',
      collapsible: true,
      title: `Overview ${SM.Collection.LabelSpritesByCollectionLabelId(collectionId, labelIds)}`,
      margins: { top: SM.Margin.top, right: SM.Margin.edge, bottom: SM.Margin.bottom, left: SM.Margin.edge },
      region: 'west',
      width: 430,
      minWidth: 430,
      split: true,
      collectionId,
      metrics: apiMetricsCollection.metrics
    })
    const aggAssetPanel = new SM.Metrics.AggAssetPanel({
      border: false,
      collectionId,
      baseParams: params
    })
    const aggStigPanel = new SM.Metrics.AggStigPanel({
      border: false,
      collectionId,
      baseParams: params
    })
    const aggLabelPanel = new SM.Metrics.AggLabelPanel({
      border: false,
      collectionId,
      baseParams: params
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
              border: false,
              items: [aggAssetPanel]
            },
            {
              title: 'Labels',
              iconCls: 'sm-label-icon',
              layout: 'fit',
              border: false,
              items: [aggLabelPanel]
            },
            {
              title: 'STIGs',
              iconCls: 'sm-stig-icon',
              layout: 'fit',
              border: false,
              items: [aggStigPanel]
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