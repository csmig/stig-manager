Ext.ns('SM.AssetSelection')

SM.AssetSelection.GridPanel = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const _this = this // verify we need this, only used once by Labels column renderer
    const fields = Ext.data.Record.create([
      { name: 'assetId', type: 'string' },
      { name: 'name', type: 'string' },
      { name: 'ip', type: 'string' },
      { name: 'fqdn', type: 'string' },
      { name: 'mac', type: 'string' },
      'labelIds',
      { name: 'benchmarkIds', convert: (v, r) => r.stigs.map(stig => stig.benchmarkId) },
      { name: 'collection' }
    ])
    const columns = [
      {
        header: "Asset",
        width: 150,
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
          collectionId: this.collectionId,
          renderer: SM.ColumnFilters.Renderers.labels
        },
        renderer: function (value, metadata, record) {
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
        width: 150,
        dataIndex: 'benchmarkIds',
        sortable: true,
        hidden: true,
        filter: { type: 'values' },
        renderer: function (value, metadata) {
          metadata.attr = 'style="white-space:normal;"'
          return value.join('<br>')
        }
      },
      {
        header: "FQDN",
        width: 100,
        dataIndex: 'fqdn',
        sortable: true,
        hidden: true,
        renderer: SM.styledEmptyRenderer,
        filter: { type: 'string' }
      },
      {
        header: "IP",
        width: 100,
        dataIndex: 'ip',
        hidden: true,
        sortable: true,
        renderer: SM.styledEmptyRenderer
      },
      {
        header: "MAC",
        hidden: true,
        width: 110,
        dataIndex: 'mac',
        sortable: true,
        renderer: SM.styledEmptyRenderer,
        filter: { type: 'string' }
      },

    ]
    const store = new Ext.data.JsonStore({
      fields,
      idProperty: 'assetId',
      sortInfo: {
        field: 'name',
        direction: 'ASC'
      },
    })
    const totalTextCmp = new SM.RowCountTextItem({
      store,
      noun: 'asset',
      iconCls: 'sm-asset-icon'
    })
    const sm = new Ext.grid.RowSelectionModel()
    const config = {
      store,
      columns,
      sm,
      enableDragDrop: true,
      ddGroup: `SM.AssetSelection.GridPanel-${this.role}`,
      border: true,
      loadMask: false,
      stripeRows: true,
      view: new SM.ColumnFilters.GridView({
        forceFit: true,
        emptyText: 'No Assets to display',
        listeners: {
          filterschanged: function (view, item, value) {
            store.filter(view.getFilterFns())
          }
        }
      }),
      bbar: new Ext.Toolbar({
        items: [
          {
            xtype: 'exportbutton',
            grid: this,
            hasMenu: false,
            gridBasename: 'Assets (grid)',
            storeBasename: 'Assets (store)',
            iconCls: 'sm-export-icon',
            text: 'CSV'
          },
          {
            xtype: 'tbfill'
          },
          {
            xtype: 'tbseparator'
          },
          totalTextCmp
        ]
      })
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this);
  }
})

SM.AssetSelection.SelectingPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const _this = this
    const availableGrid = new SM.AssetSelection.GridPanel({
      title: 'Available',
      headerCssClass: 'sm-available-panel-header',
      role: 'available',
      collectionId: this.collectionId,
      flex: 1,
      listeners: {
        render: function (grid) {
          const gridDropTargetEl = grid.getView().scroller.dom;
          const gridDropTarget = new Ext.dd.DropTarget(gridDropTargetEl, {
            ddGroup: selectionsGrid.ddGroup,
            notifyDrop: function (ddSource, e, data) {
              const selectedRecords = ddSource.dragData.selections;
              changeAssignments(selectionsGrid, selectedRecords, availableGrid)
              return true
            }
          })
        },

      }
    })
    const selectionsGrid = new SM.AssetSelection.GridPanel({
      title: this.selectionsGridTitle || 'Assigned',
      headerCssClass: 'sm-selections-panel-header',
      role: 'selections',
      collectionId: this.collectionId,
      flex: 1,
      listeners: {
        render: function (grid) {
          const gridDropTargetEl = grid.getView().scroller.dom;
          const gridDropTarget = new Ext.dd.DropTarget(gridDropTargetEl, {
            ddGroup: availableGrid.ddGroup,
            notifyDrop: function (ddSource, e, data) {
              const selectedRecords = ddSource.dragData.selections;
              changeAssignments(availableGrid, selectedRecords, selectionsGrid)
              return true
            }
          })
        }
      }

    })
    availableGrid.getSelectionModel().on('rowselect', handleSelections, selectionsGrid)
    selectionsGrid.getSelectionModel().on('rowselect', handleSelections, availableGrid)

    const addBtn = new Ext.Button({
      iconCls: 'sm-add-assignment-icon',
      margins: "0 10 10 10",
      disabled: true,
      handler: function (btn) {
        const selectedRecords = availableGrid.getSelectionModel().getSelections()
        changeAssignments(availableGrid, selectedRecords, selectionsGrid)
        btn.disable()
      }
    })
    const removeBtn = new Ext.Button({
      iconCls: 'sm-remove-assignment-icon',
      margins: "0 10 10 10",
      disabled: true,
      handler: function (btn) {
        const selectedRecords = selectionsGrid.getSelectionModel().getSelections()
        changeAssignments(selectionsGrid, selectedRecords, availableGrid)
        btn.disable()
      }
    })
    const buttonPanel = new Ext.Panel({
      bodyStyle: 'background-color:transparent;border:none',
      width: 60,
      layout: {
        type: 'vbox',
        pack: 'center',
        align: 'center',
        padding: "10 10 10 10"
      },
      items: [
        addBtn,
        removeBtn,
        { xtype: 'panel', border: false, html: '<i>or drag</i>' }
      ]
    })

    function handleSelections() {
      const sm = this.getSelectionModel()
      if (sm.getSelected()) sm.clearSelections()
      addBtn.setDisabled(this.role === 'available')
      removeBtn.setDisabled(this.role === 'selections')
    }

    async function initPanel({ benchmarkId, labelId }) { // need to handle no benchmarkId
      const promises = [
        Ext.Ajax.requestPromise({
          responseType: 'json',
          url: `${STIGMAN.Env.apiBase}/assets`,
          params: {
            collectionId: _this.collectionId,
            projection: ['stigs']
          },
          method: 'GET'
        })
      ]
      if (benchmarkId) {
        promises.push(Ext.Ajax.requestPromise({
          responseType: 'json',
          url: `${STIGMAN.Env.apiBase}/collections/${_this.collectionId}/stigs/${benchmarkId}/assets`,
          method: 'GET'
        }))
        _this.trackedProperty = {dataProperty: 'benchmarkIds', value: benchmarkId}
      }
      else if (labelId) {
        promises.push(Ext.Ajax.requestPromise({
          responseType: 'json',
          url: `${STIGMAN.Env.apiBase}/collections/${_this.collectionId}/labels/${labelId}/assets`,
          method: 'GET'
        }))
        _this.trackedProperty = {dataProperty: 'labelIds', value: labelId}
      }
      const [apiAvailableAssets, apiAssignedAssets = []] = await Promise.all(promises)
      const assignedAssetIds = apiAssignedAssets.map(apiAsset => apiAsset.assetId)
      _this.originalAssetIds = assignedAssetIds
      const availableAssets = []
      const assignedAssets = []
      apiAvailableAssets.reduce((accumulator, asset) => {
        const property = assignedAssetIds.includes(asset.assetId) ? 'assignedAssets' : 'availableAssets'
        accumulator[property].push(asset)
        return accumulator
      }, { availableAssets, assignedAssets })

      availableGrid.store.loadData(availableAssets)
      selectionsGrid.store.loadData(assignedAssets)
    }

    function changeAssignments(srcGrid, records, dstGrid) {
      // const maskTimer = setTimeout(() => _this.getEl().mask(''), 150)
      _this.getEl().mask('')
      try {
        srcGrid.store.remove(records)
        dstGrid.store.add(records)
        // for (const record of records) {
        //   if (srcGrid.role === 'available') {
        //     record.data[_this.trackedProperty.dataProperty].push(_this.trackedProperty.value)
        //     record.commit()
        //   }
        //   else {
        //     record.data[_this.trackedProperty.dataProperty] = record.data[_this.trackedProperty.dataProperty].filter( i => i !== _this.trackedProperty.value)
        //     record.commit()
        //   }
        // }
        const { field, direction } = dstGrid.store.getSortState()
        dstGrid.store.sort(field, direction)
        dstGrid.getSelectionModel().selectRecords(records)
        dstGrid.getView().focusRow(dstGrid.store.indexOfId(records[0].data.assetId))
        _this.fireEvent('assignmentschanged') 
      }
      finally {
				// clearTimeout(maskTimer)
				_this.getEl().unmask()
      }
    }

    function getValue() {
      const records = selectionsGrid.store.snapshot?.items ?? selectionsGrid.store.getRange()
      return records.map(record => record.data.assetId)
    }

    const config = {
      layout: 'hbox',
      layoutConfig: {
        align: 'stretch'
      },
      name: 'assets',
      border: false,
      items: [
        availableGrid,
        buttonPanel,
        selectionsGrid
      ],
      availableGrid,
      selectionsGrid,
      initPanel,
      getValue,
      // need fns below so Ext handles us like a form field
      setValue: () => { },
      markInvalid: function () { },
      clearInvalid: function () { },
      isValid: () => true,
      getName: () => this.name,
      validate: () => true
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this);
  }
})