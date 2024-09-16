Ext.ns("SM.AppInfo")
Ext.ns("SM.AppInfo.Database")
Ext.ns("SM.AppInfo.Operations")

SM.AppInfo.numberRenderer = new Intl.NumberFormat().format

SM.AppInfo.CollectionsGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const fields = [
      {
        name: 'collectionId',
        type: 'int'
      },
      'name',
      'state',
      'assetsTotal',
      'assetsDisabled',
      'uniqueStigs',
      'stigAssignments',
      'ruleCnt',
      'reviewCntTotal',
      'reviewCntDisabled',
      {
        name: 'assetStigCnt',
        mapping: 'assetStigByCollection.assetCnt'
      },
      {
        name: 'range01to05',
        mapping: 'assetStigByCollection.range01to05'
      },
      {
        name: 'range06to10',
        mapping: 'assetStigByCollection.range06to10'
      },
      {
        name: 'range11to15',
        mapping: 'assetStigByCollection.range11to15'
      },
      {
        name: 'range16plus',
        mapping: 'assetStigByCollection.range16plus'
      },
      {
        name: 'accessLevel1',
        mapping: 'grantCounts.accessLevel1'
      },
      {
        name: 'accessLevel2',
        mapping: 'grantCounts.accessLevel2'
      },
      {
        name: 'accessLevel3',
        mapping: 'grantCounts.accessLevel3'
      },
      {
        name: 'accessLevel4',
        mapping: 'grantCounts.accessLevel4'
      },
      {
        name: 'collectionLabelCount',
        mapping: 'labelCounts.collectionLabelCount'
      },
      {
        name: 'labeledAssetCount',
        mapping: 'labelCounts.labeledAssetCount'
      },
      {
        name: 'assetLabelCount',
        mapping: 'labelCounts.assetLabelCount'
      }
    ]

    const store = new Ext.data.JsonStore({
      fields,
      root: '',
      idProperty: 'collectionId',
      sortInfo: {
        field: 'name',
        direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
      }
    })

    const columns = [
      {
        header: "Id",
        // width: 25,
        dataIndex: 'collectionId',
        sortable: true,
      },
      {
        header: "name",
        // width: 25,
        dataIndex: 'name',
        sortable: true,
        filter: { type: 'string' }
      },
      {
        header: "state",
        // width: 25,
        dataIndex: 'state',
        sortable: true,
        filter: { type: 'values' }
      },
      {
        header: "assetsTotal",
        // width: 25,
        dataIndex: 'assetsTotal',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "assetsDisabled",
        // width: 25,
        dataIndex: 'assetsDisabled',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "uniqueStigs",
        // width: 25,
        dataIndex: 'uniqueStigs',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "stigAssignments",
        // width: 25,
        dataIndex: 'stigAssignments',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "ruleCnt",
        // width: 25,
        dataIndex: 'ruleCnt',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "reviewCntTotal",
        // width: 25,
        dataIndex: 'reviewCntTotal',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "reviewCntDisabled",
        // width: 25,
        dataIndex: 'reviewCntDisabled',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "assetStigCnt",
        // width: 25,
        dataIndex: 'assetStigCnt',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "range01to05",
        // width: 25,
        dataIndex: 'range01to05',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "range06to10",
        // width: 25,
        dataIndex: 'range06to10',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "range11to15",
        // width: 25,
        dataIndex: 'range11to15',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "range16plus",
        // width: 25,
        dataIndex: 'range16plus',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "accessLevel1",
        // width: 25,
        dataIndex: 'accessLevel1',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "accessLevel2",
        // width: 25,
        dataIndex: 'accessLevel2',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "accessLevel3",
        // width: 25,
        dataIndex: 'accessLevel3',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "accessLevel4",
        // width: 25,
        dataIndex: 'accessLevel4',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "collectionLabelCount",
        // width: 25,
        dataIndex: 'collectionLabelCount',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "labeledAssetCount",
        // width: 25,
        dataIndex: 'labeledAssetCount',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "assetLabelCount",
        // width: 25,
        dataIndex: 'assetLabelCount',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      }
    ]

    const sm = new Ext.grid.RowSelectionModel({
      singleSelect: true
    })

    const view = new SM.ColumnFilters.GridView({
      emptyText: this.emptyText || 'No records to display',
      deferEmptyText: false,
      // forceFit: true,
      markDirty: false,
      listeners: {
        filterschanged: function (view) {
          store.filter(view.getFilterFns())  
        }
      }
    })

    const bbar = new Ext.Toolbar({
      items: [
        {
          xtype: 'exportbutton',
          hasMenu: false,
          grid: this,
          gridBasename: this.exportName || this.title || 'collections',
          iconCls: 'sm-export-icon',
          text: 'CSV'
        },
        {
          xtype: 'tbfill'
        },
        {
          xtype: 'tbseparator'
        },
        new SM.RowCountTextItem({
          store,
          noun: 'collection',
          iconCls: 'sm-collection-icon'
        })
      ]
    })

    const config = {
      store,
      view,
      sm,
      columns,
      bbar
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.AppInfo.Database.TablesGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const fields = [
      'tableName',
      'rowCount',
      'tableRows',
      'tableCollation',
      'avgRowLength',
      'dataLength',
      'maxDataLength',
      'indexLength',
      'autoIncrement',
      'createTime',
      'updateTime'
    ]

    const store = new Ext.data.JsonStore({
      fields,
      root: '',
      idProperty: 'tableName',
      sortInfo: {
        field: 'tableName',
        direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
      }
    })

    const columns = [
      {
        header: "tableName",
        width: 160,
        dataIndex: 'tableName',
        sortable: true,
        filter: { type: 'string' }
      },
      {
        header: "rowCount",
        // width: 25,
        dataIndex: 'rowCount',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "tableRows",
        // width: 25,
        dataIndex: 'tableRows',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "tableCollation",
        // width: 25,
        dataIndex: 'tableCollation',
        sortable: true,
        align: 'right',
      },
      {
        header: "avgRowLength",
        // width: 25,
        dataIndex: 'avgRowLength',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "dataLength",
        // width: 25,
        dataIndex: 'dataLength',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "maxDataLength",
        // width: 25,
        dataIndex: 'maxDataLength',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "indexLength",
        // width: 25,
        dataIndex: 'indexLength',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "autoIncrement",
        // width: 25,
        dataIndex: 'autoIncrement',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "createTime",
        // width: 25,
        dataIndex: 'createTime',
        sortable: true,
        align: 'right',
      },
      {
        header: "updateTime",
        // width: 25,
        dataIndex: 'updateTime',
        sortable: true,
        align: 'right',
      }
    ]

    const sm = new Ext.grid.RowSelectionModel({
      singleSelect: true
    })

    const view = new SM.ColumnFilters.GridView({
      emptyText: this.emptyText || 'No records to display',
      deferEmptyText: false,
      // forceFit: true,
      markDirty: false,
      listeners: {
        filterschanged: function (view) {
          store.filter(view.getFilterFns())  
        }
      }
    })

    const bbar = new Ext.Toolbar({
      items: [
        {
          xtype: 'exportbutton',
          hasMenu: false,
          grid: this,
          gridBasename: this.exportName || this.title || 'tables',
          iconCls: 'sm-export-icon',
          text: 'CSV'
        },
        {
          xtype: 'tbfill'
        },
        {
          xtype: 'tbseparator'
        },
        new SM.RowCountTextItem({
          store,
          noun: 'table',
          iconCls: 'sm-database-icon'
        })
      ]
    })

    const config = {
      store,
      view,
      sm,
      columns,
      bbar
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.AppInfo.KeyValueGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const fields = [
      'key',
      'value'
    ]

    const store = new Ext.data.JsonStore({
      fields,
      root: '',
      idProperty: 'key',
      sortInfo: {
        field: 'key',
        direction: 'ASC'
      }
    })

    const columns = [
      {
        header: this.keyColumnName ?? "key",
        width: 160,
        dataIndex: 'key',
        sortable: true,
        filter: { type: 'string' }
      },
      {
        header: this.valueColumnName ?? "value",
        dataIndex: 'value',
        sortable: true,
        align: 'right',
        renderer: v => {
          const rendered = SM.AppInfo.numberRenderer(v)
          return rendered === 'NaN' ? v : rendered
        }
      }
    ]

    const sm = new Ext.grid.RowSelectionModel({
      singleSelect: true
    })

    const view = new SM.ColumnFilters.GridView({
      emptyText: this.emptyText || 'No records to display',
      deferEmptyText: false,
      // forceFit: true,
      markDirty: false,
      listeners: {
        filterschanged: function (view) {
          store.filter(view.getFilterFns())  
        }
      }
    })

    const bbar = new Ext.Toolbar({
      items: [
        {
          xtype: 'exportbutton',
          hasMenu: false,
          grid: this,
          gridBasename: this.exportName || this.title || 'keys',
          iconCls: 'sm-export-icon',
          text: 'CSV'
        },
        {
          xtype: 'tbfill'
        },
        {
          xtype: 'tbseparator'
        },
        new SM.RowCountTextItem({
          store,
          noun: this.rowCountNoun ?? 'key',
          iconCls: 'sm-database-icon'
        })
      ]
    })

    const config = {
      store,
      view,
      sm,
      columns,
      bbar
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.AppInfo.Operations.OpIdsGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const fields = [
      'operationId',
      'totalRequests',
      'totalDuration',
      'elevatedRequests',
      'minDuration',
      'maxDuration',
      'maxDurationUpdates',
      'averageDuration',
      'clients',
      'users'
    ]

    const store = new Ext.data.JsonStore({
      fields,
      root: '',
      idProperty: 'operationId',
      sortInfo: {
        field: 'operationId',
        direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
      }
    })

    const columns = [
      {
        header: "operationId",
        width: 160,
        dataIndex: 'operationId',
        sortable: true,
        filter: { type: 'string' }
      },
      {
        header: "totalRequests",
        dataIndex: 'totalRequests',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "totalDuration",
        // width: 25,
        dataIndex: 'totalDuration',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "elevatedRequests",
        // width: 25,
        dataIndex: 'elevatedRequests',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "minDuration",
        // width: 25,
        dataIndex: 'minDuration',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "maxDuration",
        // width: 25,
        dataIndex: 'maxDuration',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "maxDurationUpdates",
        // width: 25,
        dataIndex: 'maxDurationUpdates',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "averageDuration",
        // width: 25,
        dataIndex: 'averageDuration',
        sortable: true,
        align: 'right',
      },
      {
        header: "clients",
        // width: 25,
        dataIndex: 'clients',
        sortable: true,
        align: 'right',
        renderer: v => JSON.stringify(v)
      },
      {
        header: "users",
        // width: 25,
        dataIndex: 'users',
        sortable: true,
        align: 'right',
        renderer: v => JSON.stringify(v)
      }
    ]

    const sm = new Ext.grid.RowSelectionModel({
      singleSelect: true
    })

    const view = new SM.ColumnFilters.GridView({
      emptyText: this.emptyText || 'No records to display',
      deferEmptyText: false,
      // forceFit: true,
      markDirty: false,
      listeners: {
        filterschanged: function (view) {
          store.filter(view.getFilterFns())  
        }
      }
    })

    const bbar = new Ext.Toolbar({
      items: [
        {
          xtype: 'exportbutton',
          hasMenu: false,
          grid: this,
          gridBasename: this.exportName || this.title || 'operations',
          iconCls: 'sm-export-icon',
          text: 'CSV'
        },
        {
          xtype: 'tbfill'
        },
        {
          xtype: 'tbseparator'
        },
        new SM.RowCountTextItem({
          store,
          noun: 'operation',
          iconCls: 'sm-import-icon'
        })
      ]
    })

    const config = {
      store,
      view,
      sm,
      columns,
      bbar
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.AppInfo.TabPanel = Ext.extend(Ext.TabPanel, {
  initComponent: function () {
    const collectionsGrid = new SM.AppInfo.CollectionsGrid({
      title: 'Collections',
      iconCls: 'sm-collection-icon'
    })
    const dbTablesGrid = new SM.AppInfo.Database.TablesGrid({
      title: 'Tables',
      iconCls: 'sm-database-save-icon'
    })

    const dbVarsGrid = new SM.AppInfo.KeyValueGrid({
      title: 'Variables',
      iconCls: 'sm-database-save-icon',
      keyColumnName: 'variable',
      exportName: 'variables',
      rowCountNoun: 'variable'
    })
    
    const dbStatusGrid = new SM.AppInfo.KeyValueGrid({
      title: 'Status',
      iconCls: 'sm-database-save-icon',
      keyColumnName: 'status',
      exportName: 'status',
      rowCountNoun: 'status'
    })

    const opIdsGrid = new SM.AppInfo.Operations.OpIdsGrid({
      title: 'Operations',
      iconCls: 'sm-api-icon'
    })

    const nodeJsPanel = new Ext.Panel({
      title: 'Node.js',
      iconCls: 'sm-nodejs-icon'
    })

    const usersPanel = new Ext.Panel({
      title: 'Users',
      iconCls: 'sm-users-icon'
    })


    function loadData(data) {
      const collections = []
      const collectionProp = data.collections ?? data.countsByCollection
      for (const key in collectionProp) {
        collections.push({collectionId: key, name: `Collection ${key}`, ...collectionProp[key]})
      }
      collectionsGrid.store.loadData(collections)

      const tables = []
      const dbProp = data.mysql ?? data.dbInfo
      for (const key in dbProp.tables) {
        tables.push({tableName: key, ...dbProp.tables[key]})
      }
      dbTablesGrid.store.loadData(tables)

      const operationIds = []
      const operationsProp = data.operations ?? data.operationalStats
      for (const key in operationsProp?.operationIdStats) {
        operationIds.push({operationId: key, ...operationsProp?.operationIdStats[key]})
      }
      opIdsGrid.store.loadData(operationIds)

      const variables = []
      const variablesObj = dbProp.variablesRaw ?? data.mySqlVariablesRaw 
      variables.push({key: 'mysql_version', value: variablesObj.version ?? data.MySqlVersion})
      for (const key in variablesObj) {
        variables.push({key, value: variablesObj[key]})
      }
      dbVarsGrid.store.loadData(variables)

      const status = []
      const statusObj = dbProp.statusRaw ?? data.mySqlStatusRaw 
      status.push({key: 'mysql_version', value: dbProp.version ?? data.MySqlVersion})
      for (const key in statusObj) {
        status.push({key, value: statusObj[key]})
      }
      dbStatusGrid.store.loadData(status)
    }
  
    const config = {
      loadData,
      items: [
        collectionsGrid,
        usersPanel,
        opIdsGrid,
        dbTablesGrid,
        dbVarsGrid,
        dbStatusGrid,
        nodeJsPanel
      ]
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.AppInfo.SourcePanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const sourceDisplayField = new Ext.form.DisplayField({
      fieldLabel: 'Source',
      width: 400
    })
    const dateDisplayField = new Ext.form.DisplayField({
      fieldLabel: 'Date',
      width: 200
    })
    const versionDisplayField = new Ext.form.DisplayField({
      fieldLabel: 'Version',
      width: 200
    })
    const commitDisplayField = new Ext.form.DisplayField({
      fieldLabel: 'Commit',
      width: 200
    })

    function loadData({data, source}) {
      sourceDisplayField.setValue(source)
      dateDisplayField.setValue(data.dateGenerated ?? data.date)
      versionDisplayField.setValue(data.stigmanVersion ?? data.version)
      commitDisplayField.setValue(JSON.stringify(data.stigmanCommit ?? data.commit))
    }

    const selectFileBtn = new Ext.ux.form.FileUploadField({
      buttonOnly: true,
      accept: '.json',
      webkitdirectory: false,
      multiple: false,
      style: 'width: 95px;',
      buttonText: `Load from file...`,
      buttonCfg: {
        icon: "img/upload.svg"
      },
      listeners: {
        fileselected: this.onFileSelected || Ext.emptyFn
      }
    })


    const bbar = new Ext.Toolbar({
      items: [
        selectFileBtn,
        '-',
        {
          text: 'Save to file...',
          iconCls: 'sm-export-icon',
          handler: this.onFileSave || Ext.emptyFn
        },
        '-',
        {
          text: 'Fetch from API',
          iconCls: 'icon-refresh',
          handler: this.onFetchFromApi || Ext.emptyFn
        },

      ]
    })
  
    const config = {
      layout: 'form',
      padding: '10px 10px 10px 10px',
      items: [
        sourceDisplayField,
        dateDisplayField,
        versionDisplayField,
        commitDisplayField
      ],
      bbar,
      loadData
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.AppInfo.fetchFromApi = async function () {
  return Ext.Ajax.requestPromise({
    responseType: 'json',
    url: `${STIGMAN.Env.apiBase}/op/details`,
    params: {
      elevate: curUser.privileges.canAdmin
    },
    method: 'GET'
  })
}

SM.AppInfo.validateData = function (data) {
  return (data.countsByCollection && (data.dateGenerated ?? data.date))
}

SM.AppInfo.showAppInfoTab = async function (options) {
  const {treePath} = options
  const tab = Ext.getCmp('main-tab-panel').getItem(`appinfo-tab`)
  if (tab) {
    Ext.getCmp('main-tab-panel').setActiveTab(tab.id)
    return
  }

  let data = ''

  async function onFileSelected (uploadField) {
    try {
      let input = uploadField.fileInput.dom
      const text = await input.files[0].text()
      data = SM.safeJSONParse(text)
      if (data && SM.AppInfo.validateData(data)) {
        sourcePanel.loadData({data, source: input.files[0].name})
        tabPanel.loadData(data) 
      }
      else {
        Ext.Msg.alert('Unrecognized data', 'The file contents could not be understood as Application information.')
      }
    }
    catch (e) {
      SM.Error.handleError(e)
    }
    finally {
      uploadField.reset()
    }
  }

  async function onFetchFromApi() {
    try {
      thisTab.getEl().mask('Fetching from API...')
      data = await SM.AppInfo.fetchFromApi()
      sourcePanel.loadData({data, source: 'API'})
      tabPanel.loadData(data) 
    }
    finally {
      thisTab.getEl().unmask()
    }
  }

  function onFileSave() {
    if (data) {
      const blob = new Blob([JSON.stringify(data)], {type: 'application/json'})
      downloadBlob(blob, SM.Global.filenameEscaped(`stig-manager-details_${SM.Global.filenameComponentFromDate()}.json`))
    }
  }

  function downloadBlob (blob, filename) {
    let a = document.createElement('a')
    a.style.display = "none"
    let url = window.URL.createObjectURL(blob)
    a.href = url
    a.download = filename
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url)
  }

  const sourcePanel = new SM.AppInfo.SourcePanel({
    cls: 'sm-round-panel',
    margins: { top: SM.Margin.top, right: SM.Margin.edge, bottom: SM.Margin.adjacent, left: SM.Margin.edge },
    title:'Source',
    region: 'north',
    border: false,
    height: 180,
    onFileSelected,
    onFetchFromApi,
    onFileSave
  })

  const tabPanel = new SM.AppInfo.TabPanel({
    cls: 'sm-round-panel',
    margins: { top: SM.Margin.adjacent, right: SM.Margin.edge, bottom: SM.Margin.bottom, left: SM.Margin.edge },
    region: 'center',
    border: false,
    activeTab: 0
  })

  const thisTab = Ext.getCmp('main-tab-panel').add({
    id: 'appdata-admin-tab',
    sm_treePath: treePath,
    iconCls: 'sm-database-save-icon',
    title: 'Application Info',
    closable: true,
    layout: 'border',
    border: false,
    items: [sourcePanel, tabPanel]
  })
  thisTab.show()

  await onFetchFromApi()
}