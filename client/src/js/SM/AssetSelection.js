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
      ddGroup: 'SM.AssetSelection.GridPanel',
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
    if (!this.benchmarkId || !this.collectionId) throw new Error('SM.AssetSelection.SelectingPanel is missing a required property')
    const availableGrid = new SM.AssetSelection.GridPanel({
      title: 'Available',
      role: 'available',
      collectionId: this.collectionId,
      flex: 1
    })
    const selectionsGrid = new SM.AssetSelection.GridPanel({
      title: 'Selected',
      role: 'selections',
      collectionId: this.collectionId,
      flex: 1
    })
    const addBtn = new Ext.Button({
      text: 'Add Assignment ',
      handler: function () {
        const selectedRecords = availableGrid.getSelectionModel().getSelections()
        changeAssignments(availableGrid, selectedRecords, selectionsGrid)
      }
    })
    const removeBtn = new Ext.Button({
      text: 'Remove Assignment ',
      handler: function () {
        const selectedRecords = selectionsGrid.getSelectionModel().getSelections()
        changeAssignments(selectionsGrid, selectedRecords, availableGrid)
      }
    })
    const buttonPanel = new Ext.Panel({
      bodyStyle: 'background-color:transparent;border:none',
      layout: {
        type: 'vbox',
        pack: 'center',
        padding: "10 10 10 10"
      },
      items: [
        addBtn,
        removeBtn
      ]
    })

    async function initPanel() {
      const [apiAvailableAssets, apiAssignedAssets] = await Promise.all([
        Ext.Ajax.requestPromise({
          responseType: 'json',
          url: `${STIGMAN.Env.apiBase}/assets`,
          params: {
            collectionId: _this.collectionId,
            projection: ['stigs']
          },
          method: 'GET'
        }),
        Ext.Ajax.requestPromise({
          responseType: 'json',
          url: `${STIGMAN.Env.apiBase}/collections/${_this.collectionId}/stigs/${_this.benchmarkId}/assets`,
          method: 'GET'
        })
      ])
      const assignedAssetIds = apiAssignedAssets.map(apiAsset => apiAsset.assetId)
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
      srcGrid.store.remove(records)
      dstGrid.store.add(records)
      const { field, direction } = dstGrid.store.getSortState()
      dstGrid.store.sort(field, direction)
    }

    const config = {
      layout: 'hbox',
      layoutConfig: {
        align: 'stretch'
      },
      items: [
        availableGrid,
        buttonPanel,
        selectionsGrid
      ],
      availableGrid,
      selectionsGrid,
      initPanel
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this);
  }
})