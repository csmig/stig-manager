Ext.ns('SM.MetaPanel')

Chart.defaults.font = {
  size: 11,
  family: "'Open Sans', helvetica, sans-serif"
}

SM.MetaPanel.Renderers = {
  severityCount: function (v, md) {
    return v === 0 ? '' : `<div class="sm-metrics-findings-count-cell sm-metrics-${this.dataIndex}-box">${v}</div>`
  }
}

SM.MetaPanel.CommonFields = [
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

SM.MetaPanel.CommonColumns = [
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
    renderer: SM.MetaPanel.Renderers.severityCount
  },
  {
    header: "CAT 2",
    width: 50,
    dataIndex: 'medium',
    align: "center",
    sortable: true,
    renderer: SM.MetaPanel.Renderers.severityCount
  },
  {
    header: "CAT 1",
    width: 50,
    dataIndex: 'high',
    align: "center",
    sortable: true,
    renderer: SM.MetaPanel.Renderers.severityCount
  },
]

SM.MetaPanel.AggGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const _this = this

    const sm = this.checkboxSelModel ? new Ext.grid.CheckboxSelectionModel({
      singleSelect: false,
      checkOnly: false,
    }) : new Ext.grid.RowSelectionModel({
      singleSelect: true
    })
    const fields = [...SM.MetaPanel.CommonFields]
    const columns = []
    if (this.checkboxSelModel) {
      columns.push(sm)
    }
    let idProperty, sortField = 'name', autoExpandColumn = Ext.id()
    let rowdblclick = () => { }
    let cellmousedown = () => { }

    function renderWithToolbar(v) {
      return `
      <div class="sm-grid-cell-with-toolbar">
        <div class="sm-dynamic-width">
          <div class="sm-info">${v}</div>
        </div>
        <div class="sm-static-width"><img class="sm-grid-cell-toolbar-edit" ext:qtip="Open checklist" src="img/shield-green-check.svg" width="14" height="14"></div>
      </div>`
    }

    const rowCountCfg = {
      noun: this.aggregation,
      iconCls: `sm-${this.aggregation}-icon`
    }
    switch (this.aggregation) {
      case 'asset':
        fields.push(
          { name: 'assetId', type: 'string' },
          { name: 'name', type: 'string' },
          { name: 'labelIds', type: 'string', convert: (v, r) => r.labels.map(l => l.labelId) },
          'benchmarkIds',
          { name: 'stigCount', convert: (v, r) => r.benchmarkIds.length }
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
          { name: 'collectionId', type: 'string' },
          { name: 'name', type: 'string' },
          { name: 'assets', type: 'integer' },
          { name: 'stigs', type: 'integer' },
          { name: 'checklists', type: 'integer' }
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
            header: "STIGs",
            width: 50,
            dataIndex: 'stigs',
            align: "center",
            tooltip: "Total STIGs in the Collection",
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
          { name: 'labelId', type: 'string' },
          { name: 'name', type: 'string' },
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
          { name: 'benchmarkId', type: 'string' },
          { name: 'title', type: 'string' },
          { name: 'revisionStr', type: 'string' },
          { name: 'revisionPinned' },
          'assets',
          { name: 'uniqueId', type: 'string', convert: (v, r) => `${r.benchmarkId}|${r.revisionStr}` }
        )
        idProperty = r => `${r.benchmarkId}|${r.revisionStr}`
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
            header: "Title",
            width: 175,
            dataIndex: 'title',
            sortable: true,
            filter: { type: 'string' },
            hidden: true
          },
          {
            header: "Revision",
            width: 58,
            dataIndex: 'revisionStr',
            align: "left",
            tooltip: "Default revision",
            sortable: true,
            renderer: function (v, md, r) {
              return `${r.data.revisionStr}${r.data.revisionPinned ? '<img src="img/pin.svg" width="12" height="12" style="margin-left: 8px;">' : ''}`
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
        sortField = 'benchmarkId'
        rowdblclick = (grid, rowIndex) => {
          const r = grid.getStore().getAt(rowIndex)
          const leaf = {
            collectionId: grid.collectionId,
            benchmarkId: r.data.benchmarkId,
            revisionStr: r.data.revisionStr
          }
          addCollectionReview({ leaf })
        }
        cellmousedown = (grid, rowIndex, columnIndex, e) => {
          if (e.target.className === "sm-grid-cell-toolbar-edit") {
            const r = grid.getStore().getAt(rowIndex)
            const leaf = {
              collectionId: grid.collectionId,
              benchmarkId: r.data.benchmarkId,
              revisionStr: r.data.revisionStr
            }
            addCollectionReview({ leaf })
          }
        }
        rowCountCfg.noun = 'STIG'
        break
    }
    columns.push(...SM.MetaPanel.CommonColumns)

    this.proxy = new Ext.data.HttpProxy({
      restful: true,
      url: `${STIGMAN.Env.apiBase}/collections/meta/metrics/summary/${this.aggregation}`,
      headers: { 'Content-Type': 'application/json;charset=utf-8' }
    })
    const store = new Ext.data.JsonStore({
      grid: this,
      autoLoad: this.storeAutoLoad ?? false,
      baseParams: this.baseParams,
      smMaskDelay: 50,
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
      store,
      ...rowCountCfg
    })

    const config = {
      layout: 'fit',
      store,
      loadMask: { msg: '' },
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

SM.MetaPanel.UnaggGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const _this = this
    const fields = [
      { name: 'assetId', type: 'string' },
      { name: 'name', type: 'string' },
      { name: 'labelIds', type: 'string', convert: (v, r) => r.labels.map(l => l.labelId) },
      'benchmarkId',
      'title',
      'revisionStr',
      'revisionPinned',
      ...SM.MetaPanel.CommonFields
    ]
    const columns = []
    let sortField, autoExpandColumn = Ext.id()

    function renderWithToolbar(v) {
      return `
      <div class="sm-grid-cell-with-toolbar">
        <div class="sm-dynamic-width">
          <div class="sm-info">${v}</div>
        </div>
        <div class="sm-static-width"><img class="sm-grid-cell-toolbar-edit" ext:qtip="Open checklist" src="img/shield-green-check.svg" width="14" height="14"></div>
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
            // filter: {
            //   type: 'values',
            //   collectionId: _this.collectionId,
            //   renderer: SM.ColumnFilters.Renderers.labels
            // },
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
          },
          {
            header: "Title",
            width: 175,
            dataIndex: 'title',
            sortable: true,
            filter: { type: 'string' },
            hidden: true
          },
          {
            header: "Revision",
            width: 58,
            dataIndex: 'revisionStr',
            align: "center",
            tooltip: "Default revision",
            sortable: true,
            renderer: function (v, md, r) {
              return `${r.data.revisionStr}${r.data.revisionPinned ? '<img src="img/pin.svg" width="12" height="12" style="margin-left: 8px;">' : ''}`
            }
          }
        )
        sortField = 'benchmarkId'
        break
    }
    columns.push(...SM.MetaPanel.CommonColumns)

    this.proxy = new Ext.data.HttpProxy({
      restful: true,
      url: `${STIGMAN.Env.apiBase}/collections/${this.collectionId}/metrics/summary`,
      headers: { 'Content-Type': 'application/json;charset=utf-8' }
    })
    const store = new Ext.data.JsonStore({
      grid: this,
      autoLoad: false,
      smMaskDelay: 50,
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
      store,
      noun: 'checklist',
      iconCls: 'sm-stig-icon'
    })

    const rowdblclick = (grid, rowIndex) => {
      const r = grid.getStore().getAt(rowIndex)
      const leaf = {
        collectionId: grid.collectionId,
        assetId: r.data.assetId,
        assetName: r.data.name,
        assetLabelIds: r.data.labelIds,
        benchmarkId: r.data.benchmarkId,
        revisionStr: r.data.revisionStr,
        stigName: r.data.benchmarkId,
      }
      addReview({ leaf })
    }

    function cellclick(grid, rowIndex, columnIndex, e) {
      if (e.target.className === "sm-grid-cell-toolbar-edit") {
        const r = grid.getStore().getAt(rowIndex)
        const leaf = {
          collectionId: grid.collectionId,
          assetId: r.data.assetId,
          assetName: r.data.name,
          assetLabelIds: r.data.labelIds,
          benchmarkId: r.data.benchmarkId,
          revisionStr: r.data.revisionStr,
          stigName: r.data.benchmarkId,
        }
        addReview({ leaf })
      }
    }

    const config = {
      layout: 'fit',
      store,
      loadMask: { msg: '' },
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

SM.MetaPanel.ChartPanel = Ext.extend(Ext.Panel, {
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
    SM.MetaPanel.ChartPanel.superclass.initComponent.call(this)
  },
  replaceData: function (data, datasetIndex = 0) {
    this.chart.dataset[datasetIndex].data = data
    this.chart.update()
  },

})

SM.MetaPanel.ProgressBarsPanel = Ext.extend(Ext.Panel, {
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
    const updateMetrics = function (metrics) {
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

SM.MetaPanel.ProgressPanelColors = function (theme) {
  const style = getComputedStyle(document.documentElement)
  const ordered = [
    'assessed',
    'submitted',
    'accepted',
    'unassessed',
    'rejected'
  ].map(category => style.getPropertyValue(`--metrics-status-chart-${category}-${theme}`))
  return ordered
}

SM.MetaPanel.ProgressPanel = Ext.extend(Ext.Panel, {
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
          data: [0, 0, 0, 0, 0],
          backgroundColor: SM.MetaPanel.ProgressPanelColors(localStorage.getItem('darkMode') === '1' ? 'dark' : 'light'),
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

    const chartPanel = new SM.MetaPanel.ChartPanel({
      border: false,
      width: 170,
      height: 170,
      chartOptions
    })

    const onThemeChanged = function (theme) {
      if (chartPanel.chart) {
        chartPanel.chart.config._config.data.datasets[0].backgroundColor = SM.MetaPanel.ProgressPanelColors(theme)
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

    const dataTpl = new Ext.XTemplate(
      `<div class="sm-metrics-status-pct">{[this.calcAssessedPct(values.apiAssessed, values.assessments)]}% assessed</div>`,
      '<table class="sm-metrics-status-table" style="margin: 0 auto;">',
      '<tbody>',
      '<tr><td class="sm-metrics-label sm-metrics-unassessed">Unassessed</td><td class="sm-metrics-value">{unassessed}</td></tr>',
      '<tr><td class="sm-metrics-label sm-metrics-assessed">Assessed</td><td class="sm-metrics-value">{assessed}</td></tr>',
      '<tr><td class="sm-metrics-label sm-metrics-submitted">Submitted</td><td class="sm-metrics-value">{submitted}</td></tr>',
      '<tr><td class="sm-metrics-label sm-metrics-accepted">Accepted</td><td class="sm-metrics-value">{accepted}</td></tr>',
      '<tr><td class="sm-metrics-label sm-metrics-rejected">Rejected</td><td class="sm-metrics-value">{rejected}</td></tr>',
      '<tr class="sm-metrics-total"><td>Total Checks</td><td class="sm-metrics-value">{assessments}</td></tr>',
      '</tbody>',
      '</table>',
      {
        calcAssessedPct: function (assessed, assessments) {
          const pct = assessments ? assessed / assessments * 100 : 0
          if (pct > 99 && pct < 100) {
            return '>99'
          }
          else {
            return pct.toFixed(0).toString()
          }
        }
      }
    )

    const dataPanel = new Ext.Panel({
      border: false,
      tpl: dataTpl,
      width: 150
    })
    const progressBarsPanel = new SM.MetaPanel.ProgressBarsPanel({
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
          items: [chartPanel, { width: 30, border: false }, dataPanel]
        },
        { height: 20, border: false },
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
    SM.MetaPanel.ProgressPanel.superclass.initComponent.call(this)
  }
})

SM.MetaPanel.AgesPanel = Ext.extend(Ext.Panel, {
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

SM.MetaPanel.FindingsPanel = Ext.extend(Ext.Panel, {
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

SM.MetaPanel.ExportPanel = Ext.extend(Ext.Panel, {
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
      valueField: 'valueStr',
      displayField: 'displayStr',
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
      valueField: 'valueStr',
      displayField: 'displayStr',
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
      valueField: 'valueStr',
      displayField: 'displayStr',
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
        const queryParams = Object.entries(_this.baseParams ?? {}).flatMap(([k, v]) => Array.isArray(v) ? v.map((v) => [k, v]) : [[k, v]])
        const format = formatComboBox.getValue()
        queryParams.push(['format', format])
        const queryParamsStr = new URLSearchParams(queryParams).toString()

        const style = styleComboBox.getValue()
        const agg = aggComboBox.getValue()
        const url = `${STIGMAN.Env.apiBase}/collections/${collectionId}/metrics/${style}${agg === 'unagg' ? '' : `/${agg}`}?${queryParamsStr}`

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
      items: [
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

SM.MetaPanel.InventoryPanel = Ext.extend(Ext.Panel, {
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

SM.MetaPanel.OverviewPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const _this = this
    const toolTemplate = new Ext.XTemplate(
      '<tpl if="!!values.text">',
      '<div class="x-tool x-tool-{id}">{text}</div>',
      '</tpl>',
      '<tpl if="!!!values.text">',
      '<div class="x-tool x-tool-{id}">&#160;</div>',
      '</tpl>'
    )

    const collectionId = this.collectionId
    this.lastRefreshedTextItem = new Ext.Toolbar.TextItem({
      text: '',
      tpl: [
        `<span style="font-weight:600;">Fetched:</span> {[Ext.util.Format.date(values.date,'Y-m-d H:i:s T')]}`
      ]
    })
    this.reloadBtn = new SM.ReloadStoreButton({
      handler: this.reloadBtnHandler
    })

    this.inventoryPanel = new SM.MetaPanel.InventoryPanel({
      cls: 'sm-round-inner-panel',
      bodyStyle: 'padding: 10px;',
      title: 'Inventory',
      tools: this.inventoryPanelTools || undefined,
      toolTemplate,
      border: true
    })
    this.progressPanel = new SM.MetaPanel.ProgressPanel({
      cls: 'sm-round-inner-panel',
      bodyStyle: 'padding: 10px;',
      title: 'Progress',
      tools: this.progressPanelTools || undefined,
      border: true
    })
    this.agesPanel = new SM.MetaPanel.AgesPanel({
      cls: 'sm-round-inner-panel',
      bodyStyle: 'padding: 10px;',
      title: 'Review Ages',
      tools: this.agesPanelTools || undefined,
      border: true
    })
    this.findingsPanel = new SM.MetaPanel.FindingsPanel({
      cls: 'sm-round-inner-panel',
      bodyStyle: 'padding: 10px;',
      title: 'Findings',
      tools: this.findingsPanelTools || undefined,
      toolTemplate,
      border: true
    })
    this.exportPanel = new SM.MetaPanel.ExportPanel({
      cls: 'sm-round-inner-panel',
      bodyStyle: 'padding: 10px;',
      title: 'Export metrics',
      border: true,
      height: 122,
      collectionId
    })

    const updateBaseParams = function (params) {
      _this.baseParams = params
      _this.exportPanel.baseParams = params
    }
    const updatePanels = function (data) {
      _this.inventoryPanel.updateMetrics(data)
      _this.progressPanel.updateMetrics(data.metrics)
      _this.agesPanel.updateMetrics(data.metrics)
      _this.findingsPanel.updateMetrics(data.metrics.findings)
      _this.lastRefreshedTextItem.update({
        date: data.date
      })
    }
    const updateData = async function ({ refreshViewsOnly = false, loadMasksDisabled = false } = {}) {
      try {
        if (!_this.hasContent || !loadMasksDisabled) {
          _this.bwrap?.mask('')
        }
        _this.reloadBtn.showLoadingIcon()
        if (!refreshViewsOnly) {
          const results = await Ext.Ajax.requestPromise({
            url: `${STIGMAN.Env.apiBase}/collections/meta/metrics/summary`,
            method: 'GET',
            params: _this.baseParams
          })
          _this.data = JSON.parse(results.response.responseText)
          _this.data.date = new Date()
        }
        updatePanels(_this.data)
        _this.hasContent = true
        return _this.data
      }
      catch (e) {
        console.log(e)
      }
      finally {
        _this.bwrap?.unmask()
        _this.reloadBtn.showRefreshIcon()
      }
    }
    const config = {
      border: false,
      autoScroll: true,
      toolTemplate,
      items: [
        this.progressPanel,
        this.inventoryPanel,
        this.findingsPanel,
        this.agesPanel,
        this.exportPanel
      ],
      bbar: [
        this.reloadBtn,
        '->',
        '-',
        this.lastRefreshedTextItem
      ],
      updateData,
      updateBaseParams
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.MetaPanel.AggCollectionPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const _this = this
    const gridNorth = new SM.MetaPanel.AggGrid({
      aggregation: 'collection',
      // stateId: `sm-metrics-agg-grid-label-${collectionId}`,
      // stateful: true,
      border: false,
      reloadBtnHandler: this.reloadBtnHandler,
      baseParams: this.baseParams,
      exportName: 'Labels',
      region: 'north',
      split: true,
      height: '33%',
      initialized: false
    })
    const gridCenter = new SM.MetaPanel.AggGrid({
      title: 'STIGs',
      // stateId: `sm-metrics-agg-grid-label-asset-${collectionId}`,
      // stateful: true,
      border: false,
      reloadBtnHandler: this.reloadBtnHandler,
      aggregation: 'stig',
      storeAutoLoad: false,
      baseParams: this.baseParams,
      exportName: 'STIGs',
      region: 'center'
    })
    const gridSouth = new SM.MetaPanel.UnaggGrid({
      title: 'Checklists',
      // stateId: `sm-metrics-unagg-grid-collection-${collectionId}`,
      // stateful: true,
      border: false,
      parentAggregation: 'stig',
      reloadBtnHandler: this.reloadBtnHandler,
      region: 'south',
      split: true,
      height: '33%'
    })
    async function onRowSelectNorth(cm, index, record) {
      gridCenter.collectionId = record.data.collectionId
      gridCenter.store.proxy.setUrl(`${STIGMAN.Env.apiBase}/collections/${record.data.collectionId}/metrics/summary/stig`)
      await gridCenter.store.loadPromise()
      gridSouth.store.removeAll()
      gridCenter.setTitle(`STIGs for ${record.data.name}`)
    }
    async function onRowSelectCenter(cm, index, record) {
      const selectedRowNorth = gridNorth.getSelectionModel().getSelected()
      gridSouth.store.proxy.setUrl(`${STIGMAN.Env.apiBase}/collections/${selectedRowNorth.data.collectionId}/metrics/summary`)
      gridSouth.collectionId = selectedRowNorth.data.collectionId
      await gridSouth.store.loadPromise({
        benchmarkId: record.data.benchmarkId
      })
      gridSouth.setTitle(`Checklists for ${record.data.benchmarkId}`)
    }

    gridNorth.getSelectionModel().on('rowselect', onRowSelectNorth)
    gridCenter.getSelectionModel().on('rowselect', onRowSelectCenter)
    const updateBaseParams = function (params) {
      gridNorth.store.baseParams = _this.baseParams = params
    }
    const updateData = async function ({ refreshViewsOnly = false, loadMasksDisabled = false } = {}) {
      try {
        gridNorth.initialized = true
        const selectedRowNorth = gridNorth.getSelectionModel().getSelected()
        const selectedRowCenter = gridCenter.getSelectionModel().getSelected()

        if (refreshViewsOnly) {
          gridNorth.getView().refresh()
          if (selectedRowNorth) {
            gridCenter.getView().refresh()
            if (selectedRowCenter) {
              gridSouth.getView().refresh()
            }
          }
          return
        }

        let savedLoadMaskDisabled = gridNorth.loadMask.disabled
        gridNorth.loadMask.disabled = loadMasksDisabled
        await gridNorth.store.loadPromise()
        gridNorth.loadMask.disabled = savedLoadMaskDisabled

        if (!selectedRowNorth) {
          return
        }

        const currentRecordNorth = gridNorth.store.getById(selectedRowNorth.data.collectionId)
        if (!currentRecordNorth) {
          gridCenter.setTitle('STIGs')
          gridCenter.store.removeAll()
          gridSouth.setTitle('STIGs')
          gridSouth.store.removeAll()
          return
        }
        const currentIndexNorth = gridNorth.store.indexOfId(selectedRowNorth.data.collectionId)
        gridNorth.view.focusRow(currentIndexNorth)
        savedLoadMaskDisabled = gridCenter.loadMask.disabled
        gridCenter.loadMask.disabled = loadMasksDisabled
        gridCenter.store.proxy.setUrl(`${STIGMAN.Env.apiBase}/collections/${currentRecordNorth.data.collectionId}/metrics/summary/stig`)
        await gridCenter.store.loadPromise()
        gridCenter.loadMask.disabled = savedLoadMaskDisabled
        const currentRecordCenter = gridCenter.store.getById(selectedRowCenter.data.uniqueId)
        if (!currentRecordCenter) {
          gridSouth.setTitle('Checklists')
          gridSouth.store.removeAll()
          return
        }
        const currentIndexCenter = gridCenter.store.indexOfId(selectedRowCenter.data.uniqueId)
        gridCenter.view.focusRow(currentIndexCenter)
        savedLoadMaskDisabled = gridSouth.loadMask.disabled
        gridSouth.loadMask.disabled = loadMasksDisabled
        gridSouth.store.proxy.setUrl(`${STIGMAN.Env.apiBase}/collections/${currentRecordLabel.data.collectionId}/metrics/summary`)
        gridSouth.collectionId = currentRecordLabel.data.collectionId
        await gridSouth.store.loadPromise({
          benchmarkId: currentRecordCenter.data.benchmarkId
        })
        gridSouth.loadMask.disabled = savedLoadMaskDisabled
      }
      catch (e) {
        console.log(e)
      }
    }

    const config = {
      layout: 'border',
      cls: 'sm-metric-agg-panel',
      items: [
        gridNorth,
        gridCenter,
        gridSouth
      ],
      updateBaseParams,
      updateData
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.MetaPanel.AggAssetPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const _this = this
    const collectionId = this.collectionId
    const aggAssetGrid = new SM.MetaPanel.AggGrid({
      aggregation: 'asset',
      stateId: `sm-metrics-agg-grid-asset-${collectionId}`,
      stateful: true,
      collectionId,
      border: false,
      region: 'center',
      exportName: 'Assets',
      baseParams: this.baseParams,
      reloadBtnHandler: this.reloadBtnHandler,
      initialized: false
    })
    const unaggGrid = new SM.MetaPanel.UnaggGrid({
      title: 'Checklists',
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
    async function onRowSelect(cm, index, record) {
      await unaggGrid.store.loadPromise({
        assetId: record.data.assetId
      })
      unaggGrid.setTitle(`Checklists for ${record.data.name}`)
    }

    aggAssetGrid.getSelectionModel().on('rowselect', onRowSelect)
    const updateBaseParams = function (params) {
      unaggGrid.store.baseParams = aggAssetGrid.store.baseParams = _this.baseParams = params
    }
    const updateData = async function ({ refreshViewsOnly = false, loadMasksDisabled = false } = {}) {
      try {
        aggAssetGrid.initialized = true
        const selectedRow = aggAssetGrid.getSelectionModel().getSelected()

        if (refreshViewsOnly) {
          aggAssetGrid.getView().refresh()
          if (selectedRow) {
            unaggGrid.getView().refresh()
          }
          return
        }
        let savedLoadMaskDisabled = aggAssetGrid.loadMask.disabled
        aggAssetGrid.loadMask.disabled = loadMasksDisabled
        await aggAssetGrid.store.loadPromise()
        aggAssetGrid.loadMask.disabled = savedLoadMaskDisabled

        if (!selectedRow) {
          return
        }

        const currentRecord = aggAssetGrid.store.getById(selectedRow.data.assetId)
        if (!currentRecord) {
          unaggGrid.setTitle('Checklists')
          unaggGrid.store.removeAll()
          return
        }
        const currentIndex = aggAssetGrid.store.indexOfId(selectedRow.data.assetId)
        aggAssetGrid.view.focusRow(currentIndex)

        savedLoadMaskDisabled = unaggGrid.loadMask.disabled
        unaggGrid.loadMask.disabled = loadMasksDisabled
        await unaggGrid.store.loadPromise({
          assetId: currentRecord.data.assetId
        })
        unaggGrid.loadMask.disabled = savedLoadMaskDisabled

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


SM.MetaPanel.AggStigPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const _this = this
    const collectionId = this.collectionId
    const gridNorth = new SM.MetaPanel.AggGrid({
      aggregation: 'stig',
      // stateId: `sm-metrics-agg-grid-label-${collectionId}`,
      // stateful: true,
      border: false,
      collectionId,
      reloadBtnHandler: this.reloadBtnHandler,
      baseParams: this.baseParams,
      exportName: 'STIGs',
      region: 'north',
      split: true,
      height: '33%',
      initialized: false
    })
    const gridCenter = new SM.MetaPanel.AggGrid({
      title: 'Collections',
      // stateId: `sm-metrics-agg-grid-label-asset-${collectionId}`,
      // stateful: true,
      border: false,
      reloadBtnHandler: this.reloadBtnHandler,
      aggregation: 'collection',
      storeAutoLoad: false,
      collectionId,
      baseParams: this.baseParams,
      exportName: 'STIGs',
      region: 'center'
    })
    const gridSouth = new SM.MetaPanel.UnaggGrid({
      title: 'Checklists',
      // stateId: `sm-metrics-unagg-grid-label-${collectionId}`,
      // stateful: true,
      border: false,
      parentAggregation: 'stig',
      reloadBtnHandler: this.reloadBtnHandler,
      collectionId,
      region: 'south',
      split: true,
      height: '33%'
    })
    async function onRowSelectNorth(cm, index, record) {
      gridCenter.store.proxy.setUrl(`${STIGMAN.Env.apiBase}/collections/meta/metrics/summary/collection`)
      await gridCenter.store.loadPromise({
        benchmarkId: record.data.benchmarkId
      })
      gridSouth.store.removeAll()
      gridCenter.setTitle(`STIGs for ${record.data.name}`)
    }
    async function onRowSelectCenter(cm, index, record) {
      const selectedRowNorth = gridNorth.getSelectionModel().getSelected()
      gridSouth.store.proxy.setUrl(`${STIGMAN.Env.apiBase}/collections/${record.data.collectionId}/metrics/summary`)
      gridSouth.collectionId = record.data.collectionId
      await gridSouth.store.loadPromise({
        benchmarkId: selectedRowNorth.data.benchmarkId
      })
      gridSouth.setTitle(`Checklists for ${record.data.name}`)
    }

    gridNorth.getSelectionModel().on('rowselect', onRowSelectNorth)
    gridCenter.getSelectionModel().on('rowselect', onRowSelectCenter)
    const updateBaseParams = function (params) {
      gridSouth.store.baseParams = gridNorth.store.baseParams = gridCenter.store.baseParams = _this.baseParams = params
    }
    const updateData = async function ({ refreshViewsOnly = false, loadMasksDisabled = false } = {}) {
      try {
        gridNorth.initialized = true
        const selectedRowNorth = gridNorth.getSelectionModel().getSelected()
        const selectedRowCenter = gridCenter.getSelectionModel().getSelected()

        if (refreshViewsOnly) {
          gridNorth.getView().refresh()
          if (selectedRowNorth) {
            gridCenter.getView().refresh()
            if (selectedRowCenter) {
              gridSouth.getView().refresh()
            }
          }
          return
        }

        let savedLoadMaskDisabled = gridNorth.loadMask.disabled
        gridNorth.loadMask.disabled = loadMasksDisabled
        await gridNorth.store.loadPromise()
        gridNorth.loadMask.disabled = savedLoadMaskDisabled

        if (!selectedRowNorth) {
          return
        }

        const currentRecordNorth = gridNorth.store.getById(selectedRowNorth.data.collectionId)
        if (!currentRecordNorth) {
          gridCenter.setTitle('STIGs')
          gridCenter.store.removeAll()
          gridSouth.setTitle('STIGs')
          gridSouth.store.removeAll()
          return
        }
        const currentIndexNorth = gridNorth.store.indexOfId(selectedRowNorth.data.collectionId)
        gridNorth.view.focusRow(currentIndexNorth)
        savedLoadMaskDisabled = gridCenter.loadMask.disabled
        gridCenter.loadMask.disabled = loadMasksDisabled
        gridCenter.store.proxy.setUrl(`${STIGMAN.Env.apiBase}/collections/${currentRecordNorth.data.collectionId}/metrics/summary/stig`)
        await gridCenter.store.loadPromise()
        gridCenter.loadMask.disabled = savedLoadMaskDisabled
        const currentRecordStig = gridCenter.store.getById(selectedRowCenter.data.benchmarkId)
        if (!currentRecordStig) {
          gridSouth.setTitle('Checklists')
          gridSouth.store.removeAll()
          return
        }
        const currentIndexCenter = gridCenter.store.indexOfId(selectedRowCenter.data.benchmarkId)
        gridCenter.view.focusRow(currentIndexCenter)
        savedLoadMaskDisabled = gridSouth.loadMask.disabled
        gridSouth.loadMask.disabled = loadMasksDisabled
        gridSouth.store.proxy.setUrl(`${STIGMAN.Env.apiBase}/collections/${currentRecordLabel.data.collectionId}/metrics/summary`)
        gridSouth.collectionId = currentRecordLabel.data.collectionId
        await gridSouth.store.loadPromise({
          benchmarkId: currentRecordStig.data.benchmarkId
        })
        gridSouth.loadMask.disabled = savedLoadMaskDisabled
      }
      catch (e) {
        console.log(e)
      }
    }

    const config = {
      layout: 'border',
      cls: 'sm-metric-agg-panel',
      items: [
        gridNorth,
        gridCenter,
        gridSouth
      ],
      updateBaseParams,
      updateData
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.MetaPanel.AggStigPanelX = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const _this = this
    const collectionId = this.collectionId

    const aggStigGrid = new SM.MetaPanel.AggGrid({
      aggregation: 'stig',
      stateId: `sm-collection-${collectionId}-agg-grid-stig`,
      stateful: true,
      border: false,
      checkboxSelModel: false,
      collectionId,
      baseParams: this.baseParams,
      reloadBtnHandler: this.reloadBtnHandler,
      exportName: 'STIGs',
      region: 'center',
      initialized: false
    })

    const unaggGrid = new SM.MetaPanel.UnaggGrid({
      title: 'Checklists',
      stateId: `sm-collection-${collectionId}-unagg-grid-stig`,
      stateful: true,
      border: false,
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
      await unaggGrid.store.loadPromise(params)
      unaggGrid.setTitle(`Checklists for ${record.data.benchmarkId}`)
    }

    aggStigGrid.getSelectionModel().on('rowselect', onRowSelect)

    const updateBaseParams = function (params) {
      unaggGrid.store.baseParams = aggStigGrid.store.baseParams = _this.baseParams = params
    }
    const updateData = async function ({ refreshViewsOnly = false, loadMasksDisabled = false } = {}) {
      try {
        aggStigGrid.initialized = true
        const selectedRow = aggStigGrid.getSelectionModel().getSelected()

        if (refreshViewsOnly) {
          aggStigGrid.getView().refresh()
          if (selectedRow) {
            unaggGrid.getView().refresh()
          }
          return
        }
        let savedLoadMaskDisabled = aggStigGrid.loadMask.disabled
        aggStigGrid.loadMask.disabled = loadMasksDisabled
        await aggStigGrid.store.loadPromise()
        aggStigGrid.loadMask.disabled = savedLoadMaskDisabled
        if (!selectedRow) {
          return
        }


        const currentRecord = aggStigGrid.store.getById(selectedRow.data.benchmarkId)
        if (!currentRecord) {
          unaggGrid.setTitle('Checklists')
          unaggGrid.store.removeAll()
          return
        }
        const currentIndex = aggStigGrid.store.indexOfId(selectedRow.data.benchmarkId)
        aggStigGrid.view.focusRow(currentIndex)

        savedLoadMaskDisabled = unaggGrid.loadMask.disabled
        unaggGrid.loadMask.disabled = loadMasksDisabled
        await unaggGrid.store.loadPromise({
          benchmarkId: currentRecord.data.benchmarkId
        })
        unaggGrid.loadMask.disabled = savedLoadMaskDisabled
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

SM.MetaPanel.AggLabelPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const _this = this
    const collectionId = this.collectionId
    const aggLabelGrid = new SM.MetaPanel.AggGrid({
      aggregation: 'label',
      stateId: `sm-metrics-agg-grid-label-${collectionId}`,
      stateful: true,
      border: false,
      collectionId,
      reloadBtnHandler: this.reloadBtnHandler,
      baseParams: this.baseParams,
      exportName: 'Labels',
      region: 'north',
      split: true,
      height: '33%',
      initialized: false
    })
    const aggAssetGrid = new SM.MetaPanel.AggGrid({
      title: 'Assets',
      stateId: `sm-metrics-agg-grid-label-asset-${collectionId}`,
      stateful: true,
      border: false,
      reloadBtnHandler: this.reloadBtnHandler,
      aggregation: 'asset',
      storeAutoLoad: false,
      collectionId,
      baseParams: this.baseParams,
      exportName: 'Assets',
      region: 'center'
    })
    const unaggGrid = new SM.MetaPanel.UnaggGrid({
      title: 'Checklists',
      stateId: `sm-metrics-unagg-grid-label-${collectionId}`,
      stateful: true,
      border: false,
      parentAggregation: 'asset',
      reloadBtnHandler: this.reloadBtnHandler,
      collectionId,
      region: 'south',
      split: true,
      height: '33%'
    })
    async function onRowSelectLabel(cm, index, record) {
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
    async function onRowSelectAsset(cm, index, record) {
      await unaggGrid.store.loadPromise({
        assetId: record.data.assetId
      })
      unaggGrid.setTitle(`Checklists for ${record.data.name}`)
    }

    aggLabelGrid.getSelectionModel().on('rowselect', onRowSelectLabel)
    aggAssetGrid.getSelectionModel().on('rowselect', onRowSelectAsset)
    const updateBaseParams = function (params) {
      unaggGrid.store.baseParams = aggLabelGrid.store.baseParams = aggAssetGrid.store.baseParams = _this.baseParams = params
    }
    const updateData = async function ({ refreshViewsOnly = false, loadMasksDisabled = false } = {}) {
      try {
        aggLabelGrid.initialized = true
        const selectedRowLabel = aggLabelGrid.getSelectionModel().getSelected()
        const selectedRowAsset = aggAssetGrid.getSelectionModel().getSelected()

        if (refreshViewsOnly) {
          aggLabelGrid.getView().refresh()
          if (selectedRowLabel) {
            aggAssetGrid.getView().refresh()
            if (selectedRowAsset) {
              unaggGrid.getView().refresh()
            }
          }
          return
        }

        let savedLoadMaskDisabled = aggLabelGrid.loadMask.disabled
        aggLabelGrid.loadMask.disabled = loadMasksDisabled
        await aggLabelGrid.store.loadPromise()
        aggLabelGrid.loadMask.disabled = savedLoadMaskDisabled

        if (!selectedRowLabel) {
          return
        }

        const currentRecordLabel = aggLabelGrid.store.getById(selectedRowLabel.data.labelId)
        if (!currentRecordLabel) {
          aggAssetGrid.setTitle('Assets')
          aggAssetGrid.store.removeAll()
          unaggGrid.setTitle('STIGs')
          unaggGrid.store.removeAll()
          return
        }
        const currentIndexLabel = aggLabelGrid.store.indexOfId(selectedRowLabel.data.labelId)
        aggLabelGrid.view.focusRow(currentIndexLabel)
        savedLoadMaskDisabled = aggAssetGrid.loadMask.disabled
        aggAssetGrid.loadMask.disabled = loadMasksDisabled
        await aggAssetGrid.store.loadPromise({
          labelId: currentRecordLabel.data.labelId
        })
        aggAssetGrid.loadMask.disabled = savedLoadMaskDisabled
        const currentRecordAsset = aggAssetGrid.store.getById(selectedRowAsset.data.assetId)
        if (!currentRecordAsset) {
          unaggGrid.setTitle('STIGs')
          unaggGrid.store.removeAll()
          return
        }
        const currentIndexAsset = aggAssetGrid.store.indexOfId(selectedRowAsset.data.assetId)
        aggAssetGrid.view.focusRow(currentIndexAsset)
        savedLoadMaskDisabled = unaggGrid.loadMask.disabled
        unaggGrid.loadMask.disabled = loadMasksDisabled
        await unaggGrid.store.loadPromise({
          assetId: currentRecordAsset.data.assetId
        })
        unaggGrid.loadMask.disabled = savedLoadMaskDisabled
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

SM.MetaPanel.showMetaTab = async function (options) {
  try {
    const { treePath, initialCollectionIds = [] } = options
    const tab = Ext.getCmp('main-tab-panel').getItem(`meta-panel`)
    if (tab) {
      Ext.getCmp('main-tab-panel').setActiveTab(tab.id)
      return
    }

    const gState = {}

    gState.collectionIds = initialCollectionIds
    gState.filterableCollections = []

    const UPDATE_DATA_DELAY = 300000

    const overviewTitleTpl = new Ext.XTemplate(
      `Collections: {[values.collections]}`
    )

    const filterMenu = new SM.MetaPanel.CollectionsMenu({
      collections: gState.filterableCollections,
      showHeader: true,
      showApply: true,
      listeners: {
        applied: function (collectionIds) {
          SM.Dispatcher.fireEvent('collectionfilter', collectionIds)
        }
      }
    })
    const overviewPanel = new SM.MetaPanel.OverviewPanel({
      cls: 'sm-round-panel sm-metrics-overview-panel',
      collapsible: true,
      collapseFirst: false,
      inventoryPanelTools: [],
      findingsPanelTools: [],
      tools: [
        {
          id: 'collection',
          text: 'Filter &#9660;',
          handler: (event, toolEl, panel, tc) => {
            filterMenu.showAt(event.xy)
          }
        }
      ],
      // title: overviewTitleTpl.apply({
      //   collections: `Showing ${gState.collectionIds.length ? gState.collectionIds.length : gState.filterableCollections.length} of ${gState.filterableCollections.length}`
      // }),
      title: 'Initializing...',
      margins: { top: SM.Margin.top, right: SM.Margin.edge, bottom: SM.Margin.bottom, left: SM.Margin.edge },
      region: 'west',
      width: 430,
      minWidth: 430,
      split: true,
      reloadBtnHandler,
      // listeners: {
      //   render: (panel) => {
      //     if (panel.tools.collection) {
      //       panel.tools.collection.setDisplayed(gState.filterableLabels.length > 1)
      //     }
      //   }
      // }
    })
    // overviewPanel.inventoryPanel.on('render', (panel) => {
    //   const collectionGrant = curUser.collectionGrants.find(g => g.collection.collectionId === collectionId)
    //   const isManager = !!(collectionGrant?.accessLevel >= 3)
    //   panel.tools.manage.setDisplayed(isManager)
    //   panel.tools.spacer.setDisplayed(isManager)
    // })
    const aggStigPanel = new SM.MetaPanel.AggStigPanel({
      title: 'STIGs',
      iconCls: 'sm-stig-icon',
      layout: 'fit',
      border: false,
      reloadBtnHandler
    })
    const aggCollectionPanel = new SM.MetaPanel.AggCollectionPanel({
      title: 'Collections',
      iconCls: 'sm-collection-icon',
      layout: 'fit',
      border: false,
      reloadBtnHandler
    })

    setCurrentBaseParams(initialCollectionIds)

    const aggTabPanel = new Ext.TabPanel({
      activeTab: 0,
      border: false,
      deferredRender: false,
      firstShow: true,
      items: [
        aggCollectionPanel,
        aggStigPanel
      ],
      listeners: {
        tabchange: function (tp) {
          updateData({ event: 'tabchange' })
          tp.firstShow = false
        }
      }
    })

    const centerPanel = new Ext.Panel({
      region: 'center',
      layout: 'fit',
      cls: 'sm-round-panel',
      margins: { top: SM.Margin.top, right: SM.Margin.edge, bottom: SM.Margin.bottom, left: SM.Margin.adjacent },
      border: false,
      collapsible: false,
      items: aggTabPanel
    })

    const metaTab = new Ext.Panel({
      id: 'meta-panel',
      sm_unshown: true,
      border: false,
      region: 'center',
      iconCls: 'sm-collection-icon',
      title: "Meta dashboard",
      closable: true,
      layout: 'border',
      sm_treePath: treePath,
      updateTitle: function () {
        this.setTitle("Meta dashboard")
      },
      items: [
        overviewPanel,
        centerPanel
      ],
      listeners: {
        beforehide: (panel) => {
          cancelTimers()
        },
        activate: (panel) => {
          updateData({ event: 'activate' })
          panel.sm_unshown = false
        }
      }
    })

    SM.Dispatcher.addListener('collectionfilter', onCollectionFilter)
    metaTab.on('beforedestroy', () => {
      SM.Dispatcher.removeListener('collectionfilter', onCollectionFilter)
      cancelTimers()
    })

    SM.AddPanelToMainTab(metaTab, 'permanent')

    // functions

    function setCurrentBaseParams(collectionIds) {
      const params = {}
      if (collectionIds.length) {
        params.collectionId = collectionIds
      }
      aggCollectionPanel?.updateBaseParams(params)
      aggStigPanel?.updateBaseParams(params)
      overviewPanel?.updateBaseParams(params)
      return params
    }

    async function updateFilterableCollections() {
      try {
        gState.filterableCollections = await Ext.Ajax.requestPromise({
          responseType: 'json',
          url: `${STIGMAN.Env.apiBase}/collections`,
          method: 'GET'
        })
        const filterableCollectionIds = gState.filterableCollections.map(collection => collection.collectionId)
        // remove from gState.collectionIds any missing collectionIds
        gState.collectionIds = gState.collectionIds.filter(collectionId => filterableCollectionIds.includes(collectionId))
        // reset base parameters
        setCurrentBaseParams(gState.collectionIds)
        filterMenu.refreshItems(gState.filterableCollections)

        return gState.filterableCollections
      }
      catch (e) {
        console.error(e)
        return []
      }
    }

    function updateOverviewTitle() {
      const overviewTitle = overviewTitleTpl.apply({
        // collections: SM.Collection.LabelSpritesByCollectionLabelId(collectionId, gState.collectionIds)
        collections: `Showing ${gState.collectionIds.length ? gState.collectionIds.length : gState.filterableCollections.length} of ${gState.filterableCollections.length} <span class="sm-navtree-sprite">experimental</span>`
      })
      overviewPanel.setTitle(overviewTitle)
    }

    function reloadBtnHandler() { updateData({ event: 'reload' }) }

    // handle change to collection filters in NavTree
    async function onCollectionFilter(srcCollectionIds) {
      try {
        if (gState.filterableCollections.every(i => srcCollectionIds.includes(i.collectionId))) {
          gState.collectionIds = []
        }
        else {
          gState.collectionIds = srcCollectionIds
        }
        gState.baseParams = setCurrentBaseParams(gState.collectionIds)
        await overviewPanel.updateData()
        updateOverviewTitle()
        const activePanel = aggTabPanel.getActiveTab()
        if (activePanel) {
          await activePanel.updateData()
        }
      }
      catch (e) {
        SM.Error.handleError(e)
      }
    }

    // handle periodic updates
    async function updateData({ event } = {}) {
      try {
        // event = activate || tabchange || reload || updateData || refreshViews
        const refreshViewsOnly = event === 'refreshviews'
        const loadMasksDisabled = event === 'tabchange' || event === 'updatedata' || event === 'refreshviews'

        clearTimeout(gState.refreshViewTimerId)
        const promises = []

        if (!refreshViewsOnly) {
          clearTimeout(gState.updateDataTimerId)
          gState.updateDataTimerId = gState.refreshViewTimerId = null

          promises.push(updateFilterableCollections())

          gState.updateDataTimerId = setTimeout(
            updateData,
            UPDATE_DATA_DELAY,
            { event: 'updatedata' }
          )
        }
        promises.push(overviewPanel.updateData({ refreshViewsOnly, loadMasksDisabled }))
        const activePanel = aggTabPanel.getActiveTab()
        if (activePanel) {
          promises.push(activePanel.updateData({ refreshViewsOnly, loadMasksDisabled: activePanel.items.items[0].initialized ? loadMasksDisabled : false }))
        }

        const [unused0, apiMetricsCollection, unused1] = await Promise.all(promises)
        updateOverviewTitle()

        const refreshViewsDelay = calcRefreshDelay(apiMetricsCollection.metrics.maxTouchTs)
        if (refreshViewsDelay < UPDATE_DATA_DELAY) {
          gState.refreshViewTimerId = setTimeout(
            updateData,
            refreshViewsDelay,
            { event: 'refreshviews' }
          )
        }
      }
      catch (e) {
        console.log(e)
      }
    }
    function cancelTimers() {
      clearTimeout(gState.refreshViewTimerId)
      clearTimeout(gState.updateDataTimerId)
      // clearInterval(gState.updateLastRefreshIntervalId)
      // gState.refreshViewTimerId = gState.updateDataTimerId = gState.updateLastRefreshIntervalId = null
      gState.refreshViewTimerId = gState.updateDataTimerId = null
    }

    function calcRefreshDelay(maxTouchTs) {
      // given maxTouchTs, calculate the interval to refresh the grids/toolbars
      const diffSecs = Math.ceil(Math.abs(new Date() - new Date(maxTouchTs)) / 1000)
      if (diffSecs < 3600) {
        // 30s when maxTouchTs is < 1h 
        return 30 * 1000
      }
      if (diffSecs < 86400) {
        // 1h when maxTouchTs is < 1d
        return 3600 * 1000
      }
      // 1d
      return 86400 * 1000
    }
  }
  catch (e) {
    SM.Error.handleError(e)
  }
}

SM.MetaPanel.CollectionsMenu = Ext.extend(Ext.menu.Menu, {
  initComponent: function () {
    const _this = this
    this.addEvents('applied')
    const config = {
      items: [],
      listeners: {
        itemclick: this.onItemClick,
      }
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
    this.refreshItems(this.collections)
  },
  isExcluded: function (collection) {
    return collection.metadata['app.metaExcluded'] === '1'
  },
  onItemClick: function (item, e) {
    if (item.hideOnClick) { // only the Apply item
      const ids = this.getCheckedIds()
      this.fireEvent('applied', ids)
    }
  },
  getCheckedIds: function () {
    const checked = this.items.items.reduce(function (ids, item) {
      if (item.checked) {
        ids.push(item.collectionId)
      }
      return ids
    }, [])
    return checked
  },
  getCollectionItemConfig: function (collection, checked = false) {
    return {
      xtype: 'menucheckitem',
      hideOnClick: false,
      text: SM.MetaPanel.CollectionTpl.apply(collection),
      collectionId: collection?.collectionId ?? null,
      collection,
      checked,
      listeners: {
        checkchange: function (item, checked) {
          item.parentMenu.fireEvent('itemcheckchanged', item, checked)
        }
      }
    }
  },
  getTextItemConfig: function (text = '<b>FILTER</b>') {
    return {
      hideOnClick: false,
      activeClass: '',
      text,
      iconCls: 'sm-menuitem-filter-icon',
      cls: 'sm-menuitem-filter-collection'
    }
  },

  getActionItemConfig: function (text = '<b>Apply</b>') {
    return {
      xtype: 'menuitem',
      text,
      icon: 'img/change.svg'
    }
  },
  setCollectionsChecked: function (collectionIds, checked) {
    for (const collectionId of collectionIds) {
      this.find('collectionId', collectionId)[0].setChecked(checked, true) //suppressEvent = true
    }
  },
  updateCollection: function (collection) {
    const item = this.find('collectionId', collection.collectionId)[0]
    if (item) {
      if (this.isExcluded(collection)) {
        this.removeCollection(collection)
      }
      else {
        item.collection = collection
        item.setText(SM.MetaPanel.CollectionTpl.apply(collection))
        this.items.sort('ASC', this.sorter)
        this.rerender()
      }
    }
  },
  addCollection: function (collection) {
    if (this.isExcluded(collection)) return
    this.addItem(this.getCollectionItemConfig(collection))
    this.items.sort('ASC', this.sorter)
    this.rerender()
  },
  removeCollection: function (collectionId) {
    const item = this.find('collectionId', collectionId)[0]
    if (item) {
      this.remove(item)
    }
  },
  sorter: function (a, b) {
    return a.name.localeCompare(b.name)
  },
  refreshItems: function (collections) {
    const collectionIdSet = new Set(this.getCheckedIds())
    this.removeAll()
    if (this.showHeader) {
      this.addItem(this.getTextItemConfig())
    }
    collections.sort(this.sorter)
    for (const collection of collections) {
      if (this.isExcluded(collection)) continue
      const checked = collectionIdSet.has(collection.collectionId)
      this.addItem(this.getCollectionItemConfig(collection, checked))
    }
    if (this.showApply) {
      this.addItem('-')
      this.addItem(this.getActionItemConfig())
    }
  },
  rerender: function () {
    if (this.rendered) {
      this.el.remove()
      delete this.el
      delete this.ul
      this.rendered = false
      this.render()
      this.doLayout.call(this, false, true)
    }
  }
})

SM.MetaPanel.SpriteHtml = `<span class="sm-collection-sprite {extraCls}"
    ext:qtip="{[SM.he(SM.he(values.description))]}">
    {[SM.he(values.name)]}
    </span>`

SM.MetaPanel.CollectionTpl = new Ext.XTemplate(
  SM.MetaPanel.SpriteHtml
)

