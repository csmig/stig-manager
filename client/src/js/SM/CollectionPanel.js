Ext.ns('SM.Collection')


SM.Collection.AggGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const _this = this

    const sm = this.checkboxSelModel ? new Ext.grid.CheckboxSelectionModel({
      singleSelect: false,
      checkOnly: false,
    }) : new Ext.grid.RowSelectionModel({
      singleSelect: true
    })
    const fields = [...SM.Metrics.CommonFields]
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
        <div class="sm-static-width"><img class="sm-grid-cell-toolbar-edit" src="img/edit.svg" width="12" height="12"></div>
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

SM.Collection.UnaggGrid = Ext.extend(Ext.grid.GridPanel, {
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

    function renderWithToolbar (v) {
      return `
      <div class="sm-grid-cell-with-toolbar">
        <div class="sm-dynamic-width">
          <div class="sm-info">${v}</div>
        </div>
        <div class="sm-static-width"><img class="sm-grid-cell-toolbar-edit" src="img/edit.svg" width="12" height="12"></div>
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
            renderer: renderReviewAction
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


SM.Collection.AggStigPanel = Ext.extend(Ext.Panel, {
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

    const aggStigGrid = new SM.Collection.AggGrid({
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

    const unaggGrid = new SM.Collection.UnaggGrid({
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

  
SM.Collection.showCollectionTab = async function (options) {
  try {
    const { collectionId, collectionName, treePath, initialLabelIds = [] } = options
    let currentBaseParams = initialLabelIds.length ? { labelId: initialLabelIds } : undefined
    let currentLabelIds = initialLabelIds
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
      `Overview{[values.labels ? ' ' + values.labels : '']} {[values.lastApiRefresh ? '<i>(' + durationToNow(values.lastApiRefresh, true) + ')</i>' : '']}`
    )

    const getMetricsAggCollection = async function (collectionId, labelIds) {
      // API requests
      const params = labelIds.length ? { labelId: labelIds } : undefined
      const results = await Ext.Ajax.requestPromise({
        url: `${STIGMAN.Env.apiBase}/collections/${collectionId}/metrics/summary/collection`,
        method: 'GET',
        params
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
      listeners: {
        applied: function (labelIds) {
            SM.Dispatcher.fireEvent('labelfilter', collectionId, labelIds)
        }
      }
    })
      
    const overviewPanel = new SM.Metrics.OverviewPanel({
      cls: 'sm-round-panel sm-metrics-overview-panel',
      collapsible: true,
      collapseFirst: false,
      tools: [
        {
          id: 'label',
          handler: (event, toolEl, panel, tc) => {
            labelsMenu.showAt(event.xy)
          }
        },
        {
          id: 'manage',
          handler: (event, toolEl, panel, tc) => {
            addCollectionManager({
              collectionId,
              collectionName,
              treePath
            })
          }
        }
      ],
      title: 'Overview',
      margins: { top: SM.Margin.top, right: SM.Margin.edge, bottom: SM.Margin.bottom, left: SM.Margin.edge },
      region: 'west',
      width: 430,
      minWidth: 430,
      split: true,
      collectionId
    })

    const updateOverviewTitle = () => {
      // console.log(`${collectionName}: Executing updateOverviewTitle with ${currentLabelIds} and ${lastApiRefresh}`)
      const overviewTitle = overviewTitleTpl.apply({
        labels: SM.Collection.LabelSpritesByCollectionLabelId(collectionId, currentLabelIds),
        lastApiRefresh
      })
      overviewPanel.setTitle(overviewTitle)
    }

    const reloadBtnHandler = () => { updateData() }
    const aggAssetPanel = new SM.Metrics.AggAssetPanel({
      title: 'Assets',
      iconCls: 'sm-asset-icon',
      layout: 'fit',
      border: false,
      collectionId,
      reloadBtnHandler,
      baseParams: currentBaseParams
    })
    const aggStigPanel = new SM.Collection.AggStigPanel({
      title: 'STIGs',
      iconCls: 'sm-stig-icon',
      layout: 'fit',
      border: false,
      collectionId,
      reloadBtnHandler,
      baseParams: currentBaseParams
    })
    const aggLabelPanel = new SM.Metrics.AggLabelPanel({
      title: 'Labels',
      iconCls: 'sm-label-icon',
      layout: 'fit',
      border: false,
      collectionId,
      reloadBtnHandler,
      baseParams: currentBaseParams
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
          currentLabelIds = srcLabelIds
          let apiMetricsCollection = await getMetricsAggCollection(collectionId, currentLabelIds)
          updateOverviewTitle()
          overviewPanel.updateMetrics(apiMetricsCollection)
          currentBaseParams = currentLabelIds.length ? { labelId: currentLabelIds } : undefined
          aggAssetPanel.updateBaseParams(currentBaseParams)
          aggStigPanel.updateBaseParams(currentBaseParams)
          aggLabelPanel.updateBaseParams(currentBaseParams)
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
          apiMetricsCollection = await getMetricsAggCollection(collectionId, currentLabelIds)
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

