Ext.ns("SM.AppInfo")
Ext.ns("SM.AppInfo.Collections")
Ext.ns("SM.AppInfo.MySql")
Ext.ns("SM.AppInfo.Requests")
Ext.ns("SM.AppInfo.Users")
Ext.ns("SM.AppInfo.Nodejs")
Ext.ns("SM.AppInfo.ShareFile")

SM.AppInfo.numberRenderer = new Intl.NumberFormat().format

SM.AppInfo.usernameLookup = {}

SM.AppInfo.uptimeString = function uptimeString(uptime) {
  const days = Math.floor(uptime / 86400)
  uptime %= 86400
  const hours = Math.floor(uptime / 3600)
  uptime %= 3600
  const minutes = Math.floor(uptime / 60)
  const seconds = Math.floor(uptime % 60)
  return `${days} day${days !== 1 ? 's' : ''}, ${hours} hour${hours !== 1 ? 's' : ''}, ${minutes} minute${minutes !== 1 ? 's' : ''}, ${seconds} second${seconds !== 1 ? 's' : ''}`
}

SM.AppInfo.transformPreviousSchemas = function (input) {
  if (input.schema === 'stig-manager-appinfo-v1.0') {
    return input
  }
  if (!input.stigmanVersion) {
    return false
  }

  // renames properties "assetStigByCollection" and "restrictedGrantCountsByUser"
  function transformCountsByCollection(i) {
    const o = {}
    const padLength = Object.keys(i).at(-1).length
    for (const id in i) {
      const { assetStigByCollection, restrictedGrantCountsByUser, ...keep } = i[id]

      o[id.padStart(padLength, '0')] = {
        ...keep,
        assetStigRanges: transformAssetStigByCollection(assetStigByCollection),
        restrictedUsers: restrictedGrantCountsByUser || {}
      }
    }
    return o
  }

  // renames property "roles" and removes the string "other"
  function transformUserInfo(i) {
    const o = {}
    const padLength = Object.keys(i).at(-1).length
    for (const id in i) {
      const { roles, ...keep } = i[id]
      o[id.padStart(padLength, '0')] = {
        ...keep,
        privileges: roles?.filter(v => v !== 'other') || []
      }
    }
    return o
  }

  // remove counts of the "other" string
  function transformUserPrivilegeCounts(i) {
    for (const category in i) {
      delete i[category].other
    }
    return i
  }

  // add count of privilege "none" to each category
  // must be called after transforming userInfo
  function addNoPrivilegeCount(i) {
    const dataTime = Math.floor(new Date(i.dateGenerated) / 1000)
    const thirtyDaysAgo = dataTime - (30 * 24 * 60 * 60)
    const ninetyDaysAgo = dataTime - (90 * 24 * 60 * 60)

    i.userPrivilegeCounts.overall.none = 0
    i.userPrivilegeCounts.activeInLast90Days.none = 0
    i.userPrivilegeCounts.activeInLast30Days.none = 0

    for (const userId in i.userInfo) {
      const user = i.userInfo[userId]
      if (user.privileges.length === 0) {
        i.userPrivilegeCounts.overall.none++
        // Update counts for the last 30 and 90 days based on lastAccess
        if (user.lastAccess >= ninetyDaysAgo) {
          i.userPrivilegeCounts.activeInLast90Days.none++
        }
        if (user.lastAccess >= thirtyDaysAgo) {
          i.userPrivilegeCounts.activeInLast30Days.none++
        }
      }
    }
  }

  function transformAssetStigByCollection(i) {
    i.range00 = i.assetCnt - (i.range01to05 + i.range06to10 + i.range11to15 + i.range16plus)
    delete i.assetCnt
    return i
  }

  const { operationIdStats, ...requestsKeep } = input.operationalStats

  input.userInfo = transformUserInfo(input.userInfo)
  addNoPrivilegeCount(input)
  transformUserPrivilegeCounts(input.userPrivilegeCounts)

  const norm = {
    date: input.dateGenerated,
    schema: 'stig-manager-appinfo-v1.0',
    version: input.stigmanVersion,
    commit: input.stigmanCommit,
    collections: transformCountsByCollection(input.countsByCollection),
    requests: {
      ...requestsKeep,
      operationIds: operationIdStats
    },
    users: {
      userInfo: input.userInfo,
      userPrivilegeCounts: input.userPrivilegeCounts
    },
    mysql: {
      version: input.mySqlVersion,
      tables: input.dbInfo.tables,
      variables: input.mySqlVariablesRaw,
      status: input.mySqlStatusRaw
    },
    nodejs: {
      version: 'v0.0.0',
      uptime: parseNodeUptimeString(input.nodeUptime),
      os: {},
      environment: {},
      memory: input.nodeMemoryUsageInMb,
      cpus: []
    }
  }
  return norm

  function parseNodeUptimeString(uptimeString) {
    const values = uptimeString.match(/\d+/g)
    return (parseInt(values[0]) * 86400) +
      (parseInt(values[1]) * 3600) +
      (parseInt(values[2]) * 60) +
      parseInt(values[3])
  }
}

SM.AppInfo.objectToRowsArray = function (obj, keyPropertyName) {
  const rows = []
  for (const prop of obj) {
    rows.push({[keyPropertyName]: prop, ...obj[prop]})
  }
  return rows
}

SM.AppInfo.KeyValueGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const valueColumnId = Ext.id()
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

    const keyColumn = {
      ...{
        header: 'key',
        width: 100,
        dataIndex: 'key',
        sortable: true,
        filter: { type: 'string' }
      },
      ...this.keyColumnConfig
    }

    const valueColumn = {
      ...{
        header: 'value',
        id: valueColumnId,
        // width: 100,
        dataIndex: 'value',
        sortable: true,
        align: 'right',
        renderer: v => {
          const rendered = SM.AppInfo.numberRenderer(v)
          return rendered === 'NaN' ? v : rendered
        }
      },
      ...this.valueColumnConfig
    }

    const columns = [
      keyColumn,
      valueColumn
    ]

    const sm = new Ext.grid.RowSelectionModel({
      singleSelect: true
    })

    const view = new SM.ColumnFilters.GridView({
      emptyText: this.emptyText || 'No records to display',
      // autoFill: true,
      deferEmptyText: false,
      forceFit: this.forceFit ?? false,
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
          iconCls: 'sm-circle-icon'
        })
      ]
    })

    function loadData(o) {
      const rows = []
      for (const key in o) {
        rows.push({ key, value: o[key] })
      }
      this.store.loadData(rows)
    }

    const config = {
      cls: this.cls ?? 'sm-round-panel',
      autoExpandColumn: valueColumnId,
      autoExpandMax: 500,
      store,
      view,
      sm,
      columns,
      bbar,
      loadData
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.AppInfo.JsonTreePanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    let tree
    function loadData(data) {
      tree = JsonView.createTree(data)
      tree.isExpanded = true
      if (this.body) {
        this.body.dom.textContent = ''
        JsonView.render(tree, this.body.dom)
      }
    }
    function renderTree() {
      if (tree) {
        JsonView.render(tree, this.body.dom)
      }
    }

    const config = {
      bodyStyle: 'overflow-y:auto;',
      loadData
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
    this.on('render', renderTree)
  }
})

SM.AppInfo.Collections.OverviewGrid = Ext.extend(Ext.grid.GridPanel, {
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
      {
        name: 'assetsEnabled',
        convert: (v, r) => r.assetsTotal - r.assetsDisabled
      },
      'uniqueStigs',
      'stigAssignments',
      'ruleCnt',
      'reviewCntTotal',
      'reviewCntDisabled',
      {
        name: 'reviewCntEnabled',
        convert: (v, r) => r.reviewCntTotal - r.reviewCntDisabled
      },
      'restrictedUsers'
    ]

    const store = new Ext.data.JsonStore({
      fields,
      root: '',
      idProperty: 'collectionId',
      sortInfo: {
        field: 'name',
        direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
      },
      listeners: {
        // // load: () => sm.selectFirstRow()
      }
    })

    const columns = [
      {
        header: "Name",
        width: 180,
        dataIndex: 'name',
        sortable: true,
        filter: { type: 'string' }
      },
      {
        header: "Id",
        hidden: true,
        dataIndex: 'collectionId',
        sortable: true,
      },
      {
        header: "State",
        dataIndex: 'state',
        sortable: true,
        filter: { type: 'values' }
      },
      {
        header: "Assets",
        dataIndex: 'assetsEnabled',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Assets Disabled",
        dataIndex: 'assetsDisabled',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Assets Total",
        dataIndex: 'assetsTotal',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "STIGs",
        dataIndex: 'uniqueStigs',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Assignments",
        dataIndex: 'stigAssignments',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Rules",
        dataIndex: 'ruleCnt',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Reviews",
        dataIndex: 'reviewCntEnabled',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Reviews Total",
        dataIndex: 'reviewCntTotal',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Reviews Disabled",
        dataIndex: 'reviewCntDisabled',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
    ]

    const sm = new Ext.grid.RowSelectionModel({
      singleSelect: true,
      listeners: {
        rowselect: this.onRowSelect ?? Ext.emptyFn
      }
    })

    const view = new SM.ColumnFilters.GridView({
      emptyText: this.emptyText || 'No records to display',
      forceFit: true,
      listeners: {
        filterschanged: function (view) {
          store.filter(view.getFilterFns())
        }
      },
      getRowClass: record => record.data.state === 'disabled' ? 'sm-row-disabled' : ''
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
      cls: this.cls ?? 'sm-round-panel',
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

SM.AppInfo.Collections.OverviewGridLocked = Ext.extend(Ext.grid.GridPanel, {
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
      {
        name: 'assetsEnabled',
        convert: (v, r) => r.assetsTotal - r.assetsDisabled
      },
      'uniqueStigs',
      'stigAssignments',
      'ruleCnt',
      'reviewCntTotal',
      'reviewCntDisabled',
      {
        name: 'reviewCntEnabled',
        convert: (v, r) => r.reviewCntTotal - r.reviewCntDisabled
      },
      'restrictedUsers',
      {
        name: 'range00',
        mapping: 'assetStigRanges.range00'
      },
      {
        name: 'range01to05',
        mapping: 'assetStigRanges.range01to05'
      },
      {
        name: 'range06to10',
        mapping: 'assetStigRanges.range06to10'
      },
      {
        name: 'range11to15',
        mapping: 'assetStigRanges.range11to15'
      },
      {
        name: 'range16plus',
        mapping: 'assetStigRanges.range16plus'
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
      },
      listeners: {
        // // load: () => sm.selectFirstRow()
      }
    })

    const columns = [
      {
        header: "Name",
        locked: true,
        width: 180,
        dataIndex: 'name',
        sortable: true,
        filter: { type: 'string' }
      },
      {
        header: "Id",
        hidden: true,
        dataIndex: 'collectionId',
        sortable: true,
      },
      {
        header: "State",
        dataIndex: 'state',
        sortable: true,
        filter: { type: 'values' }
      },
      {
        header: "Assets",
        dataIndex: 'assetsEnabled',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Assets Disabled",
        dataIndex: 'assetsDisabled',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Assets Total",
        hidden: true,
        dataIndex: 'assetsTotal',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "STIGs",
        dataIndex: 'uniqueStigs',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Assignments",
        dataIndex: 'stigAssignments',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Rules",
        dataIndex: 'ruleCnt',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Reviews",
        dataIndex: 'reviewCntEnabled',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Reviews Total",
        dataIndex: 'reviewCntTotal',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Reviews Disabled",
        dataIndex: 'reviewCntDisabled',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "range00",
        dataIndex: 'range00',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "range01to05",
        dataIndex: 'range01to05',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "range06to10",
        dataIndex: 'range06to10',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "range11to15",
        dataIndex: 'range11to15',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "range16plus",
        dataIndex: 'range16plus',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "accessLevel1",
        dataIndex: 'accessLevel1',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "accessLevel2",
        dataIndex: 'accessLevel2',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "accessLevel3",
        dataIndex: 'accessLevel3',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "accessLevel4",
        dataIndex: 'accessLevel4',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "collectionLabelCount",
        dataIndex: 'collectionLabelCount',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "labeledAssetCount",
        dataIndex: 'labeledAssetCount',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "assetLabelCount",
        dataIndex: 'assetLabelCount',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      }
    ]

    const sm = new Ext.grid.RowSelectionModel({
      singleSelect: true,
      listeners: {
        rowselect: this.onRowSelect ?? Ext.emptyFn
      }
    })

    const view = new SM.ColumnFilters.GridViewLocking({
      emptyText: this.emptyText || 'No records to display',
      listeners: {
        filterschanged: function (view) {
          store.filter(view.getFilterFns())
        }
      },
      getRowClass: record => record.data.state === 'disabled' ? 'sm-row-disabled' : ''
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
      enableColLock: false,
      cls: this.cls ?? 'sm-round-panel',
      store,
      view,
      sm,
      colModel: new Ext.ux.grid.LockingColumnModel(columns),
      bbar
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.AppInfo.Collections.RestrictedUsersGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const fields = [
      {
        name: 'userId',
        type: 'int'
      },
      'username',
      'uniqueAssets',
      'stigAssetCount'
    ]

    const store = new Ext.data.JsonStore({
      fields,
      root: '',
      idProperty: 'userId',
      sortInfo: {
        field: 'username',
        direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
      },
      listeners: {
        // load: () => sm.selectFirstRow()
      }
    })

    const columns = [
      {
        header: "Id",
        hidden: true,
        dataIndex: 'userId',
        sortable: true,
      },
      {
        header: "username",
        // width: 25,
        dataIndex: 'username',
        sortable: true,
        filter: { type: 'string' }
      },
      {
        header: "uniqueAssets",
        // width: 25,
        dataIndex: 'uniqueAssets',
        sortable: true,
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "stigAssetCount",
        // width: 25,
        dataIndex: 'stigAssetCount',
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
      cls: this.cls ?? 'sm-round-panel',
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

SM.AppInfo.Collections.AssetStigGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const fields = [
      {
        name: 'collectionId',
        type: 'int'
      },
      'name',
      'state',
      'range00',
      'range01to05',
      'range06to10',
      'range11to15',
      'range16plus'
    ]

    const store = new Ext.data.JsonStore({
      fields,
      root: '',
      idProperty: 'collectionId',
      sortInfo: {
        field: 'name',
        direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
      },
      listeners: {
        // // load: () => sm.selectFirstRow()
      }
    })

    const columns = [
      {
        header: "Id",
        hidden: true,
        dataIndex: 'collectionId',
        sortable: true,
      },
      {
        header: "Name",
        dataIndex: 'name',
        sortable: true,
        filter: { type: 'string' }
      },
      {
        header: "State",
        hidden: true,
        dataIndex: 'state',
        sortable: true,
        filter: { type: 'values' }
      },
      {
        header: "0",
        dataIndex: 'range00',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "1-5",
        dataIndex: 'range01to05',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "6-10",
        dataIndex: 'range06to10',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "11-15",
        dataIndex: 'range11to15',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "16+",
        dataIndex: 'range16plus',
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
      forceFit: true,
      listeners: {
        filterschanged: function (view) {
          store.filter(view.getFilterFns())
        }
      },
      getRowClass: record => record.data.state === 'disabled' ? 'sm-row-disabled' : ''
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
      cls: this.cls ?? 'sm-round-panel',
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

SM.AppInfo.Collections.GrantsGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const fields = [
      {
        name: 'collectionId',
        type: 'int'
      },
      'name',
      'state',
      'accessLevel1',
      'accessLevel2',
      'accessLevel3',
      'accessLevel4'
    ]

    const store = new Ext.data.JsonStore({
      fields,
      root: '',
      idProperty: 'collectionId',
      sortInfo: {
        field: 'name',
        direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
      },
      listeners: {
        // load: () => sm.selectFirstRow()
      }
    })

    const columns = [
      {
        header: "Id",
        // width: 25,
        hidden: true,
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
        hidden: true,
        dataIndex: 'state',
        sortable: true,
        filter: { type: 'values' }
      },
      {
        header: "Restricted",
        width: 40,
        dataIndex: 'accessLevel1',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Full",
        width: 40,
        dataIndex: 'accessLevel2',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Manage",
        width: 40,
        dataIndex: 'accessLevel3',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Owner",
        width: 40,
        dataIndex: 'accessLevel4',
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
      forceFit: true,
      markDirty: false,
      listeners: {
        filterschanged: function (view) {
          store.filter(view.getFilterFns())
        }
      },
      getRowClass: record => record.data.state === 'disabled' ? 'sm-row-disabled' : ''
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
      cls: this.cls ?? 'sm-round-panel',
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

SM.AppInfo.Collections.LabelsGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const fields = [
      {
        name: 'collectionId',
        type: 'int'
      },
      'name',
      'state',
      'collectionLabelCount',
      'labeledAssetCount',
      'assetLabelCount'
    ]

    const store = new Ext.data.JsonStore({
      fields,
      root: '',
      idProperty: 'collectionId',
      sortInfo: {
        field: 'name',
        direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
      },
      listeners: {
        // load: () => sm.selectFirstRow()
      }
    })

    const columns = [
      {
        header: "Id",
        hidden: true,
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
        hidden: true,
        dataIndex: 'state',
        sortable: true,
        filter: { type: 'values' }
      },
      {
        header: "Labels",
        // width: 25,
        dataIndex: 'collectionLabelCount',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Labeled",
        // width: 25,
        dataIndex: 'labeledAssetCount',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Tags",
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
      forceFit: true,
      listeners: {
        filterschanged: function (view) {
          store.filter(view.getFilterFns())
        }
      },
      getRowClass: record => record.data.state === 'disabled' ? 'sm-row-disabled' : ''
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
      cls: this.cls ?? 'sm-round-panel',
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

SM.AppInfo.Collections.Container = Ext.extend(Ext.Container, {
  initComponent: function () {
    function loadData(data) {
      // expects just the collections property of the full object
      const overview = []
      const assetStig = []
      const grants = []
      const labels = []
      for (const collectionId in data) {
        const { assetStigRanges, grantCounts, labelCounts, name = collectionId, state, ...rest } = data[collectionId]
        overview.push({ collectionId, name, state, ...rest })
        assetStig.push({ collectionId, name, state, ...assetStigRanges })
        grants.push({ collectionId, name, state, ...grantCounts })
        labels.push({ collectionId, name, state, ...labelCounts })
      }
      overviewGrid.store.loadData(overview)
      assetStigGrid.store.loadData(assetStig)
      grantsGrid.store.loadData(grants)
      labelsGrid.store.loadData(labels)

      const overviewLocked = []
      for (const collectionId in data) {
        const { name = collectionId, ...rest } = data[collectionId]
        overviewLocked.push({ collectionId, name, ...rest })
      }
      overviewGridLocked.store.loadData(overviewLocked)
    }

    function overviewOnRowSelect(sm, index, record) {
      const data = record.data.restrictedUsers
      const rows = []
      for (const userId in data) {
        rows.push({ userId, username: SM.AppInfo.usernameLookup[userId], ...data[userId] })
      }
      restrictedUsersGrid.store.loadData(rows)
    }

    function onRowDblClick(grid, rowIndex, e) {
      const sourceRecord = grid.store.getAt(rowIndex)
      console.log(sourceRecord)
      for (const peeredGrid of peeredGrids) {
        if (grid.title !== peeredGrid.title) {
          const destRecord = peeredGrid.store.getById(sourceRecord.id)
          const destIndex = peeredGrid.store.indexOf(destRecord)
          peeredGrid.selModel.selectRow(destIndex)
          peeredGrid.view.focusRow(destIndex)
        }
      }
    }

    function bbarBtnHandler(btn) {
      centerContainer.removeAll(false)
      if (btn.text === 'Join') {
        centerContainer.add(overviewGridLocked)
        sepContainer.hide()
        overviewGridLocked.show()
      }
      else {
        centerContainer.add(sepContainer)
        overviewGridLocked.hide()
        sepContainer.show()
      }
      centerContainer.doLayout()
    }

    function toolHandler(event, toolEl, panel, tc) {
      console.log(panel)
      centerContainer.removeAll(false)
      if (tc.id === 'collapse-grids') {
        centerContainer.add(overviewGridLocked)
        sepContainer.hide()
        overviewGridLocked.show()
      }
      else if (tc.id === 'expand-grid') {
        centerContainer.add(sepContainer)
        overviewGridLocked.hide()
        sepContainer.show()
      }
      centerContainer.doLayout()
    }

    const collapseToolConfig = {
      id: 'collapse-grids',
      qtip: 'Collapse into a single grid',
      handler: toolHandler
    }
    const overviewGrid = new SM.AppInfo.Collections.OverviewGrid({
      title: 'Overview',
      border: false,
      tools: [collapseToolConfig],
      region: 'center',
      onRowSelect: overviewOnRowSelect,
      bbarBtnHandler,
      listeners: {
        rowdblclick: onRowDblClick
      }
    })
    const overviewGridLocked = new SM.AppInfo.Collections.OverviewGridLocked({
      title: 'Overview',
      border: false,
      tools: [{
        id: 'expand-grid',
        qtip: 'Expand into multiple grids',
        handler: toolHandler
      }],
      id: 'appinfo-locked',
      autoDestroy: false,
      layout: 'fit',
      bbarBtnHandler
    })

    const restrictedUsersGrid = new SM.AppInfo.Collections.RestrictedUsersGrid({
      title: 'Restricted Users',
      border: false,
      collapsible: true,
      region: 'east',
      split: true,
      width: 340
    })
    const grantsGrid = new SM.AppInfo.Collections.GrantsGrid({
      title: 'Grants',
      border: false,
      tools: [collapseToolConfig],
      margins: { top: 0, right: 5, bottom: 0, left: 0 },
      flex: 1,
      listeners: {
        rowdblclick: onRowDblClick
      }
    })
    const labelsGrid = new SM.AppInfo.Collections.LabelsGrid({
      title: 'Labels',
      border: false,
      tools: [collapseToolConfig],
      margins: { top: 0, right: 5, bottom: 0, left: 5 },
      flex: 1,
      listeners: {
        rowdblclick: onRowDblClick
      }
    })
    const assetStigGrid = new SM.AppInfo.Collections.AssetStigGrid({
      title: 'STIG Assignment Ranges',
      border: false,
      tools: [collapseToolConfig],
      margins: { top: 0, right: 0, bottom: 0, left: 5 },
      flex: 1,
      listeners: {
        rowdblclick: onRowDblClick
      }
    })
    const peeredGrids = [overviewGrid, grantsGrid, labelsGrid, assetStigGrid]

    const southContainer = new Ext.Container({
      region: 'south',
      // autoDestroy: false,
      height: 300,
      split: true,
      layout: 'hbox',
      layoutConfig: {
        align: 'stretch',
      },
      items: [
        grantsGrid,
        labelsGrid,
        assetStigGrid,
      ]
    })

    const sepContainer = new Ext.Container({
      id: 'appinfo-sep',
      layout: 'border',
      autoDestroy: false,
      items: [overviewGrid, southContainer]
    })

    const centerContainer = new Ext.Container({
      id: 'appinfo-center',
      region: 'center',
      // autoDestroy: false,
      border: false,
      layout: 'fit',
      items: [sepContainer]
    })

    const config = {
      layout: 'border',
      // autoDestroy: false,
      items: [
        centerContainer,
        restrictedUsersGrid
      ],
      loadData
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.AppInfo.MySql.TablesGrid = Ext.extend(Ext.grid.GridPanel, {
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
      forceFit: true,
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

SM.AppInfo.MySql.Container = Ext.extend(Ext.Container, {
  initComponent: function () {
    function loadData(data) {
      // expects only mysql property from full appinfo object
      tablesGrid.setTitle(`Tables | Version ${data.variables.version} | up ${SM.AppInfo.uptimeString(data.status.Uptime)}`)
      const tables = []
      for (const key in data.tables) {
        tables.push({ tableName: key, ...data.tables[key] })
      }
      tablesGrid.store.loadData(tables)
      variablesGrid.loadData(data.variables)
      statusGrid.loadData(data.status)
    }

    const tablesGrid = new SM.AppInfo.MySql.TablesGrid({
      title: ' ',
      border: false,
      cls: 'sm-round-panel',
      region: 'center'
    })

    const variablesGrid = new SM.AppInfo.KeyValueGrid({
      title: 'Variables',
      border: false,
      flex: 1,
      margins: { top: 0, right: 5, bottom: 0, left: 0 },
      keyColumnConfig: { header: 'Variable', width: 200 },
      valueColumnConfig: { header: 'Value' },
      exportName: 'variables',
      rowCountNoun: 'variable'
    })

    const statusGrid = new SM.AppInfo.KeyValueGrid({
      title: 'Status',
      border: false,
      flex: 1,
      margins: { top: 0, right: 0, bottom: 0, left: 5 },
      keyColumnConfig: { header: 'Variable', width: 200 },
      valueColumnConfig: { header: 'Value' },
      exportName: 'status',
      rowCountNoun: 'status'
    })

    const childContainer = new Ext.Container({
      region: 'south',
      split: true,
      height: 300,
      layout: 'hbox',
      bodyStyle: 'background-color: transparent;',
      layoutConfig: {
        align: 'stretch',
        // defaultMargins: {top: 5, right: 10, bottom: 0, left: 10}
      },
      items: [
        variablesGrid,
        statusGrid
      ]
    })

    const config = {
      layout: 'border',
      items: [
        tablesGrid,
        childContainer
      ],
      loadData
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.AppInfo.Requests.OperationsGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const fields = [
      'operationId',
      'totalRequests',
      'totalDuration',
      'minDuration',
      'maxDuration',
      'maxDurationUpdates',
      {
        name: 'averageDuration',
        convert: (v, r) => Math.round(r.totalDuration / r.totalRequests)
      },
      'elevatedRequests',
      'retried',
      'averageRetries',
      'totalReqLength',
      'minReqLength',
      'maxReqLength',
      'totalResLength',
      'minResLength',
      'maxResLength',
      'clients',
      'users',
      'projections'
    ]

    const store = new Ext.data.JsonStore({
      fields,
      root: '',
      idProperty: 'operationId',
      sortInfo: {
        field: 'operationId',
        direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
      },
      listeners: {
        load: function () {
          // sm.selectFirstRow()
        }
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
        header: "Requests",
        dataIndex: 'totalRequests',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Duration",
        // width: 25,
        dataIndex: 'totalDuration',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "DurAvg",
        hidden: true,
        // width: 25,
        dataIndex: 'averageDuration',
        sortable: true,
        align: 'right',
      },
      {
        header: "DurMin",
        // width: 25,
        dataIndex: 'minDuration',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "DurMax",
        // width: 25,
        dataIndex: 'maxDuration',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "DurMaxUpdates",
        hidden: true,
        dataIndex: 'maxDurationUpdates',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Elevated",
        // width: 25,
        dataIndex: 'elevatedRequests',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Retried",
        // width: 25,
        dataIndex: 'retried',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "RetriesAvg",
        // width: 25,
        dataIndex: 'averageRetries',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "ResLen",
        // width: 25,
        dataIndex: 'totalResLength',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "ResLenMin",
        // width: 25,
        dataIndex: 'minResLength',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "ResLenMax",
        // width: 25,
        dataIndex: 'maxResLength',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "ReqLen",
        // width: 25,
        dataIndex: 'totalReqLength',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "ReqLenMin",
        // width: 25,
        dataIndex: 'minReqLength',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "ReqLenMin",
        // width: 25,
        dataIndex: 'maxReqLength',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      }
    ]

    const sm = new Ext.grid.RowSelectionModel({
      singleSelect: true,
      listeners: {
        rowselect: this.onRowSelect ?? Ext.emptyFn
      },
      grid: this
    })

    const view = new SM.ColumnFilters.GridView({
      emptyText: this.emptyText || 'No records to display',
      deferEmptyText: false,
      forceFit: true,
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
      cls: this.cls ?? 'sm-round-panel',
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

SM.AppInfo.Requests.ProjectionsGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const fields = [
      'projection',
      'totalRequests',
      'minDuration',
      'maxDuration',
      'totalDuration',
      'averageDuration',
      'retried',
      'averageRetries'
    ]

    const store = new Ext.data.JsonStore({
      fields,
      root: '',
      idProperty: 'projection',
      sortInfo: {
        field: 'projection',
        direction: 'ASC'
      }
    })

    const columns = [
      {
        header: 'Projection',
        width: 160,
        dataIndex: 'projection',
        sortable: true,
        filter: { type: 'string' }
      },
      {
        header: 'totalRequests',
        dataIndex: 'totalRequests',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: 'minDuration',
        dataIndex: 'minDuration',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: 'maxDuration',
        dataIndex: 'maxDuration',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: 'totalDuration',
        dataIndex: 'totalDuration',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: 'averageDuration',
        dataIndex: 'averageDuration',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: 'retried',
        dataIndex: 'retried',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: 'averageRetries',
        dataIndex: 'averageRetries',
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
      forceFit: true,
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
          gridBasename: this.exportName || this.title || 'projections',
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
          noun: this.rowCountNoun ?? 'projection',
          iconCls: 'sm-circle-icon'
        })
      ]
    })

    const config = {
      cls: this.cls ?? 'sm-round-panel',
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

SM.AppInfo.Requests.Container = Ext.extend(Ext.Container, {
  initComponent: function () {
    const operationsGrid = new SM.AppInfo.Requests.OperationsGrid({
      title: 'Operations',
      border: false,
      region: 'center',
      onRowSelect
    })
    const usersGrid = new SM.AppInfo.KeyValueGrid({
      title: 'User requests',
      border: false,
      margins: { top: 0, right: 5, bottom: 0, left: 0 },
      keyColumnConfig: { header: 'User' },
      valueColumnConfig: { header: 'Requests' },
      width: 200,
    })
    const clientsGrid = new SM.AppInfo.KeyValueGrid({
      title: 'Client requests',
      border: false,
      margins: { top: 0, right: 5, bottom: 0, left: 5 },
      keyColumnConfig: { header: 'Client' },
      valueColumnConfig: { header: 'Requests' },
      width: 200,
    })
    const projectionsGrid = new SM.AppInfo.Requests.ProjectionsGrid({
      title: 'Projections',
      border: false,
      flex: 1,
      margins: { top: 0, right: 0, bottom: 0, left: 5 }
    })

    function onRowSelect(sm, index, record) {
      const users = []
      const clients = []
      const projections = []
      const data = record.data
      for (const userId in data.users) {
        users.push({ key: SM.AppInfo.usernameLookup[userId] || 'unkown', value: data.users[userId] })
      }
      for (const client in data.clients) {
        clients.push({ key: client, value: data.clients[client] })
      }
      for (const projection of Object.keys(data.projections)) {
        projections.push({ projection, ...data.projections[projection] })
      }
      usersGrid.store.loadData(users)
      clientsGrid.store.loadData(clients)
      projectionsGrid.store.loadData(projections)
    }

    const childContainer = new Ext.Container({
      region: 'south',
      split: true,
      height: 300,
      bodyStyle: 'background-color: transparent;',
      layout: 'hbox',
      layoutConfig: {
        align: 'stretch',
        // defaultMargins: {top: 10, right: 10, bottom: 10, left: 10}
      },
      items: [
        usersGrid,
        clientsGrid,
        projectionsGrid
      ]
    })

    function loadData(data) {
      const nr = SM.AppInfo.numberRenderer
      const operationIds = []
      for (const key in data.operationIds) {
        operationIds.push({ operationId: key, ...data.operationIds[key] })
      }
      operationsGrid.store.loadData(operationIds)
      operationsGrid.setTitle(`API Operations | ${nr(data.totalRequests)} total requests, ${nr(data.totalApiRequests)} to API, duration ${nr(data.totalRequestDuration)}ms`)
    }

    const config = {
      layout: 'border',
      items: [
        operationsGrid,
        childContainer
      ],
      loadData
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.AppInfo.Users.InfoGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const fields = [
      {
        name: 'userId',
        type: 'int'
      },
      'username',
      'created',
      'lastAccess',
      'privileges'
    ]

    const store = new Ext.data.JsonStore({
      fields,
      root: '',
      idProperty: 'userId',
      sortInfo: {
        field: 'userId',
        direction: 'ASC'
      }
    })

    const columns = [
      {
        header: 'username',
        dataIndex: 'username',
        sortable: true,
        filter: { type: 'string' }
      },
      {
        header: 'Id',
        dataIndex: 'userId',
        hidden: true,
        sortable: true,
      },
      {
        header: 'lastAccess',
        dataIndex: 'lastAccess',
        width: 150,
        sortable: true,
        align: 'right',
        renderer: v => v ? new Date(v * 1000).toISOString() : '-'
      },
      {
        header: 'privileges',
        dataIndex: 'privileges',
        width: 250,
        sortable: true,
        align: 'right',
        renderer: v => JSON.stringify(v)
      },
      {
        header: 'created',
        dataIndex: 'created',
        width: 150,
        sortable: true,
        align: 'right'
      }

    ]

    const sm = new Ext.grid.RowSelectionModel({
      singleSelect: true
    })

    const view = new SM.ColumnFilters.GridView({
      emptyText: this.emptyText || 'No records to display',
      deferEmptyText: false,
      forceFit: true,
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
          gridBasename: this.exportName || this.title || 'users',
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
          noun: this.rowCountNoun ?? 'user',
          iconCls: 'sm-users-icon'
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

SM.AppInfo.Users.Container = Ext.extend(Ext.Container, {
  initComponent: function () {
    // expects just the value of appinfo.users
    function loadData(data) {
      const rows = []
      for (const key in data.userInfo) {
        rows.push({ userId: key, username: key, ...data.userInfo[key] })
      }
      infoGrid.store.loadData(rows)

      // setup the username lookup object
      SM.AppInfo.usernameLookup = {}
      for (const row of rows) {
        SM.AppInfo.usernameLookup[row.userId] = row.username
      }

      for (const key in data.userPrivilegeCounts) {
        privilegePropertyGridMap[key].loadData(data.userPrivilegeCounts[key])
      }
    }

    const privilegeGridOptions = {
      border: false,
      flex: 1,
      keyColumnConfig: { header: 'Privilege' },
      valueColumnConfig: { header: 'User count' },
      forceFit: true,
      exportName: 'overall',
      rowCountNoun: 'privilege'
    }

    const overallGrid = new SM.AppInfo.KeyValueGrid({
      title: 'Privileges - Overall',
      margins: { top: 0, right: 0, bottom: 5, left: 0 },
      ...privilegeGridOptions
    })
    const last30Grid = new SM.AppInfo.KeyValueGrid({
      title: 'Privileges - Active last 30d',
      margins: { top: 5, right: 0, bottom: 5, left: 0 },
      ...privilegeGridOptions
    })
    const last90Grid = new SM.AppInfo.KeyValueGrid({
      title: 'Privileges - Active last 90d',
      margins: { top: 5, right: 0, bottom: 0, left: 0 },
      ...privilegeGridOptions
    })

    const privilegePropertyGridMap = {
      overall: overallGrid,
      activeInLast30Days: last30Grid,
      activeInLast90Days: last90Grid
    }

    const infoGrid = new SM.AppInfo.Users.InfoGrid({
      title: 'User details',
      border: false,
      region: 'center'
    })

    const privilegeContainer = new Ext.Container({
      region: 'east',
      split: true,
      width: 300,
      bodyStyle: 'background-color: transparent;',
      layout: 'vbox',
      layoutConfig: {
        align: 'stretch',
      },
      border: false,
      items: [
        overallGrid,
        last30Grid,
        last90Grid
      ]
    })

    const config = {
      layout: 'border',
      items: [infoGrid, privilegeContainer],
      loadData,
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.AppInfo.Nodejs.CpusGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    // expects the nodejs.cpus array as data
    function loadData(data) {
      let index = 0
      const rows = data?.map(item => ({
        cpu: index++,
        ...item
      })) || []
      store.loadData(rows)
    }
    const fields = [
      {
        name: 'cpu',
        type: 'int'
      },
      'model',
      'speed'
    ]

    const store = new Ext.data.JsonStore({
      fields,
      root: '',
      idProperty: 'cpu',
      sortInfo: {
        field: 'cpu',
        direction: 'ASC'
      }
    })

    const columns = [
      {
        header: 'CPU',
        dataIndex: 'cpu',
        width: 15,
        sortable: true,
      },
      {
        header: 'Model',
        dataIndex: 'model',
        width: 60,
        sortable: true,
        filter: { type: 'string' }
      },
      {
        header: 'Speed (MHz)',
        dataIndex: 'speed',
        width: 25,
        align: 'right',
        sortable: true
      }
    ]

    const sm = new Ext.grid.RowSelectionModel({
      singleSelect: true
    })

    const view = new SM.ColumnFilters.GridView({
      emptyText: this.emptyText || 'No records to display',
      deferEmptyText: false,
      forceFit: true,
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
          gridBasename: this.exportName || this.title || 'cpus',
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
          noun: this.rowCountNoun ?? 'cpu',
          iconCls: 'sm-cpu-icon'
        })
      ]
    })

    const config = {
      store,
      view,
      sm,
      columns,
      bbar,
      loadData
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.AppInfo.Nodejs.Container = Ext.extend(Ext.Container, {
  initComponent: function () {
    // expects just the value of appinfo.nodejs
    function loadData(data) {
      envGrid.setTitle(`Environment | Version ${data.version.slice(1)} | up ${SM.AppInfo.uptimeString(data.uptime)}`)
      memoryGrid.loadData(data.memory)
      osGrid.loadData(data.os)
      cpusGrid.loadData(data.cpus)
      envGrid.loadData(data.environment)
    }

    const envGrid = new SM.AppInfo.KeyValueGrid({
      title: 'Environment',
      border: false,
      region: 'center',
      keyColumnConfig: { header: 'Variable', width: 240 },
      valueColumnConfig: { header: 'Value', align: 'left', width: 370 },
      forceFit: true,
      exportName: 'environment',
      rowCountNoun: 'item'
    })
    const cpusGrid = new SM.AppInfo.Nodejs.CpusGrid({
      title: 'CPU',
      border: false,
      flex: 1,
      margins: { top: 0, right: 5, bottom: 0, left: 0 }
    })
    const memoryGrid = new SM.AppInfo.KeyValueGrid({
      title: 'Memory',
      border: false,
      flex: 1,
      margins: { top: 0, right: 5, bottom: 0, left: 5 },
      keyColumnConfig: { header: 'Property' },
      valueColumnConfig: { header: 'Value' },
      exportName: 'memory',
      rowCountNoun: 'bytes'
    })
    const osGrid = new SM.AppInfo.KeyValueGrid({
      title: 'OS',
      border: false,
      flex: 1,
      margins: { top: 0, right: 0, bottom: 0, left: 5 },
      keyColumnConfig: { header: 'Property' },
      valueColumnConfig: { header: 'Value', align: 'left' },
      exportName: 'os',
      rowCountNoun: 'item'
    })

    const panel = new Ext.Panel({
      region: 'south',
      split: true,
      height: 300,
      bodyStyle: 'background-color: transparent;',
      layout: 'hbox',
      layoutConfig: {
        align: 'stretch',
        // defaultMargins: {top: 5, right: 10, bottom: 0, left: 10}
      },
      border: false,
      items: [
        cpusGrid,
        memoryGrid,
        osGrid,
      ]
    })

    const config = {
      layout: 'border',
      items: [envGrid, panel],
      loadData,
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.AppInfo.TabPanel = Ext.extend(Ext.TabPanel, {
  initComponent: function () {
    const collectionsContainer = new SM.AppInfo.Collections.Container({
      border: false,
      title: 'Collections',
      iconCls: 'sm-collection-icon'
    })

    const usersContainer = new SM.AppInfo.Users.Container({
      title: 'Users',
      iconCls: 'sm-users-icon'
    })

    const requestsContainer = new SM.AppInfo.Requests.Container({
      title: 'Requests',
      iconCls: 'sm-browser-icon'
    })

    const mysqlContainer = new SM.AppInfo.MySql.Container({
      title: 'MySQL',
      iconCls: 'sm-database-save-icon'
    })

    const nodejsContainer = new SM.AppInfo.Nodejs.Container({
      title: 'Node.js',
      iconCls: 'sm-nodejs-icon',
    })

    const jsonPanel = new SM.AppInfo.JsonTreePanel({
      title: 'JSON Tree',
      iconCls: 'sm-json-icon',
      layout: 'fit'
    })

    const items = [
      collectionsContainer,
      usersContainer,
      requestsContainer,
      mysqlContainer,
      nodejsContainer,
      jsonPanel,
    ]

    function loadData(data) {
      // users MUST be loaded first so the username lookup object is built
      usersContainer.loadData(data.users)
      collectionsContainer.loadData(data.collections)
      requestsContainer.loadData(data.requests)
      mysqlContainer.loadData(data.mysql)
      nodejsContainer.loadData(data.nodejs)
      jsonPanel.loadData(data)

    }

    const config = {
      deferredRender: false,
      loadData,
      items
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.AppInfo.ShareFile.OptionsFieldSet = Ext.extend(Ext.form.FieldSet, {
  initComponent: function () {
    const collectionNames = new Ext.form.Checkbox({
      prop: 'collectionName',
      boxLabel: 'Replace each Collection name with its ID'
    })
    const usernames = new Ext.form.Checkbox({
      prop: 'username',
      boxLabel: 'Replace each User name with its ID'
    })
    const clientIds = new Ext.form.Checkbox({
      prop: 'clientId',
      boxLabel: 'Replace each Request clientId with a generated value'
    })
    const envvars = new Ext.form.Checkbox({
      prop: 'envvar',
      boxLabel: 'Exclude Node.js environment variables'
    })

    const items = [
      collectionNames,
      usernames,
      clientIds,
      envvars
    ]

    function getValues() {
      const values = {}
      for (const item of items) {
        values[item.prop] = item.getValue()
      }
      return values
    }
    const config = {
      title: this.title || 'Options',
      defaults: {
        hideLabel: true,
        checked: true
      },
      autoHeight: true,
      items,
      getValues
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.AppInfo.ShareFile.Panel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const saveFn = this.onSaveShared || Ext.emptyFn
    const _this = this
    const fieldset = new SM.AppInfo.ShareFile.OptionsFieldSet()
    const button = new Ext.Button({
      style: 'float: right; margin-top: 6px;',
      cls: 'x-toolbar',
      text: 'Save for sharing',
      iconCls: 'sm-share-icon',
      handler: () => {
        const fieldsetValues = fieldset.getValues()
        if (_this.menu) _this.menu.hide()
        saveFn(fieldsetValues)
      }
    })
    const config = {
      border: false,
      autoWidth: true,
      items: [
        fieldset,
        button
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

    function loadData({ data, source }) {
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

    const saveSharedPanel = new SM.AppInfo.ShareFile.Panel({
      onSaveShared: this.onSaveShared
    })

    const saveSharedMenu = new Ext.menu.Menu({
      plain: true,
      style: 'padding: 10px;',
      items: saveSharedPanel
    })
    saveSharedPanel.menu = saveSharedMenu

    const tbar = new Ext.Toolbar({
      items: [
        selectFileBtn,
        '-',
        {
          text: 'Save to file',
          iconCls: 'sm-export-icon',
          handler: this.onSaveFull || Ext.emptyFn
        },
        '-',
        {
          text: 'Save for sharing',
          iconCls: 'sm-share-icon',
          menu: saveSharedMenu
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
        // commitDisplayField
      ],
      tbar,
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

SM.AppInfo.generateSharable = function (data, options) {
  const kloned = SM.Klona(data)
  const { collections, requests, users, nodejs } = kloned
  if (options.collectionName) {
    const padLength = Object.keys(collections).at(-1).length
    for (const id in collections) {
      collections[id].name = id.padStart(padLength, '0')
    }
  }
  if (options.username) {
    const padLength = Object.keys(users.userInfo).at(-1).length
    for (const id in users.userInfo) {
      users.userInfo[id].username = id.padStart(padLength, '0')
    }
  }
  if (options.clientId) {
    obfuscateClients(requests.operationIds)
  }
  if (options.envvar) {
    delete nodejs.environment
  }
  return kloned

  function obfuscateClients(operationIds) {
    const obfuscationMap = {
      [STIGMAN.Env.oauth.clientId]: 'webapp'
    }
    let obfuscatedCounter = 1

    function getObfuscatedKey(client) {
      if (client === 'unknown' || client === 'webapp') {
        return client
      }
      if (!obfuscationMap[client]) {
        obfuscationMap[client] = `client${obfuscatedCounter++}`
      }
      return obfuscationMap[client]
    }

    for (const id in operationIds) {
      if (operationIds[id].clients) {
        const clients = operationIds[id].clients
        const newClients = {}
        for (const client in clients) {
          const obfuscatedName = getObfuscatedKey(client)
          newClients[obfuscatedName] = clients[client]
        }
        operationIds[id].clients = newClients
      }
    }
  }

}

SM.AppInfo.showAppInfoTab = async function (options) {
  const { treePath } = options
  const tab = Ext.getCmp('main-tab-panel').getItem(`appinfo-tab`)
  if (tab) {
    Ext.getCmp('main-tab-panel').setActiveTab(tab.id)
    return
  }

  let data = ''

  async function onFileSelected(uploadField) {
    try {
      let input = uploadField.fileInput.dom
      const text = await input.files[0].text()
      data = SM.AppInfo.transformPreviousSchemas(SM.safeJSONParse(text))
      if (data) {
        sourcePanel.loadData({ data, source: input.files[0].name })
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
      sourcePanel.loadData({ data, source: 'API' })
      tabPanel.loadData(data)
    }
    finally {
      thisTab.getEl()?.unmask()
    }
  }

  function onSaveFull() {
    if (data) {
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
      downloadBlob(blob, SM.Global.filenameEscaped(`stig-manager-details_${SM.Global.filenameComponentFromDate()}.json`))
    }
  }

  function onSaveShared(options) {
    console.log(options)
    const kloned = SM.AppInfo.generateSharable(data, options)
    console.log(kloned)
    const blob = new Blob([JSON.stringify(kloned)], { type: 'application/json' })
    downloadBlob(blob, SM.Global.filenameEscaped(`stig-manager-details-shareable_${SM.Global.filenameComponentFromDate()}.json`))
  }

  function downloadBlob(blob, filename) {
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
    title: 'Source',
    region: 'north',
    border: false,
    height: 150,
    onFileSelected,
    onFetchFromApi,
    onSaveFull,
    onSaveShared
  })


  const tabPanel = new SM.AppInfo.TabPanel({
    cls: 'sm-round-panel',
    margins: { top: SM.Margin.adjacent, right: SM.Margin.edge, bottom: SM.Margin.bottom, left: SM.Margin.edge },
    region: 'center',
    border: false,
    activeTab: 0,
    listeners: {
      tabchange: function () {
        console.log('tabPanel event')
      }
    }

  })

  const thisTab = Ext.getCmp('main-tab-panel').add({
    id: 'appinfo-tab',
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