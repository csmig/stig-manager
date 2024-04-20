Ext.ns('SM.UserGroup')

SM.UserGroup.UserSpriteHtml = `<span class="sm-label-sprite {extraCls}" style="color:black;background-color:#888;">{[SM.he(values)]}</span>`

SM.UserGroup.UserTpl = new Ext.XTemplate(
  SM.UserGroup.GroupSpriteHtml
)
SM.UserGroup.UserArrayTpl = new Ext.XTemplate(
    '<tpl for=".">',
    `${SM.UserGroup.GroupSpriteHtml} `,
    '</tpl>'
)

SM.UserGroup.UserGroupGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const _this = this
    const fields = Ext.data.Record.create([
      {
        name: 'userGroupId',
        type: 'string'
      },
      {
        name: 'name',
        type: 'string'
      },
      {
        name: 'description',
        type: 'string'
      },
      {
        name: 'created',
        type: 'date',
        mapping: 'attributions.created.ts'
      },
      {
        name: 'userCount',
        type: 'integer',
        convert: (v, r) => r.userIds.length
      },
      {
        name: 'collectionCount',
        type: 'integer',
        convert: (v, r) => r.collectionIds.length

      }
    ])
    const store = new Ext.data.JsonStore({
      proxy: new Ext.data.HttpProxy({
        url: `${STIGMAN.Env.apiBase}/user-groups`,
        method: 'GET'
      }),
      baseParams: {
        // elevate: curUser.privileges.canAdmin,
        projection: ['userIds', 'collectionIds', 'attributions']
      },
      root: '',
      fields,
      idProperty: 'userGroupId',
      sortInfo: {
        field: 'name',
        direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
      }
    })
    const columns = [
      {
        header: "Name", 
        width: 150,
        dataIndex: 'name',
        sortable: true,
        filter: {type: 'string'}
      },
      { 	
        header: "Description",
        width: 150,
        dataIndex: 'description',
        sortable: true,
        filter: {type: 'string'}
      },
      { 	
        header: "Created",
        xtype: 'datecolumn',
        format: 'Y-m-d H:i T',
        width: 150,
        dataIndex: 'created',
        sortable: true
      },
      { 	
        header: "# Users",
        width: 100,
        align: 'center',
        dataIndex: 'userCount',
        sortable: true,
        renderer: SM.styledEmptyRenderer
      },
      { 	
        header: "# Collections",
        width: 100,
        align: 'center',
        dataIndex: 'collectionCount',
        sortable: true,
        renderer: SM.styledEmptyRenderer
      }
    ]
    const view = new SM.ColumnFilters.GridView({
      forceFit:true,
      listeners: {
        filterschanged: function (view) {
          store.filter(view.getFilterFns())  
        },
        // These listeners keep the grid in the same scroll position after the store is reloaded
        beforerefresh: function(v) {
           v.scrollTop = v.scroller.dom.scrollTop;
           v.scrollHeight = v.scroller.dom.scrollHeight;
        },
        refresh: function(v) {
          setTimeout(function() { 
            v.scroller.dom.scrollTop = v.scrollTop + (v.scrollTop == 0 ? 0 : v.scroller.dom.scrollHeight - v.scrollHeight);
          }, 100);
        }
      },
      deferEmptyText:false
    })
    const sm = new Ext.grid.RowSelectionModel({ singleSelect: true })
    const tbar = [
      {
        iconCls: 'icon-add',
        text: 'Add Group',
        disabled: !(curUser.privileges.canAdmin),
        handler: function() {
          Ext.getBody().mask('');
          showUserProps(0);            
        }
      },
      '-',
      {
        ref: '../removeBtn',
        iconCls: 'icon-del',
        text: 'Delete Group',
        disabled: !(curUser.privileges.canAdmin),
        handler: function() {
          let selRec = _this.getSelectionModel().getSelected()
          let buttons = {yes: 'Delete', no: 'Cancel'}
          let confirmStr=`Delete group ${selRec.data.name}?<br><br>This action will delete all Collection Grants for the user group.`;
          
          Ext.Msg.show({
            title: 'Confirm delete action',
            icon: Ext.Msg.WARNING,
            msg: confirmStr,
            buttons: buttons,
            fn: async function (btn,text) {
              try {
                if (btn == 'yes') {
                  const apiUserGroup = await Ext.Ajax.requestPromise({
                    responseType: 'json',
                    url: `${STIGMAN.Env.apiBase}/user-groups/${selRec.data.userGroupId}?elevate=${curUser.privileges.canAdmin}`,
                    method: 'DELETE'
                  })
                  store.remove(selRec)
                  SM.Dispatcher.fireEvent('usergroupdeleted', apiUserGroup)
                }
              }
              catch (e) {
                SM.Error.handleError(e)
              }
            }
          })
        }
      },
      '-',
      {
        iconCls: 'icon-edit',
        text: 'Modify Group',
        handler: function() {
          const r = userGrid.getSelectionModel().getSelected();
          Ext.getBody().mask('Getting properties...');
          showUserGroupProps(r.get('userGroupId'));
        }
      }
    ]
    const totalTextCmp = new SM.RowCountTextItem({store})
    const bbar = new Ext.Toolbar({
      items: [
        {
          xtype: 'tbbutton',
          iconCls: 'icon-refresh',
          tooltip: 'Reload this grid',
          width: 20,
          handler: function(btn){
            store.reload()
          }
        },
        {
          xtype: 'tbseparator'
        },
        {
          xtype: 'exportbutton',
          hasMenu: false,
          gridBasename: 'UserGroup-Info',
          exportType: 'grid',
          iconCls: 'sm-export-icon',
          text: 'CSV'
        },	
        {
          xtype: 'tbfill'
        },{
          xtype: 'tbseparator'
        },
        totalTextCmp
      ]
    })
    const config = {
      store,
      sm,
      columns,
      view,
      tbar,
      bbar
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.UserGroup.UserSelectingGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const _this = this
    const fields = Ext.data.Record.create([
      { name: 'userId', type: 'string' },
      { name: 'username', type: 'string' },
      { name: 'displayName', type: 'string' },
      { name: 'userGroups', convert: (v, r) => r.userGroups.map(userGroup => userGroup.name) },
    ])
    const sm = new Ext.grid.CheckboxSelectionModel({
      singleSelect: false,
      checkOnly: false,
      listeners: {
        selectionchange: function (sm) {
          SM.SetCheckboxSelModelHeaderState(sm)
        }
      }
    })
    const columns = [
      sm,
      {
        header: "Username",
        width: 150,
        dataIndex: 'username',
        sortable: true,
        filter: { type: 'string' }
      },
      {
        header: "Name",
        width: 150,
        dataIndex: 'displayName',
        sortable: true,
        filter: { type: 'string' }
      },
      {
        header: "Name",
        width: 120,
        dataIndex: 'displayName',
        sortable: false,
        filter: {
          type: 'values',
          collectionId: this.collectionId,
          renderer: SM.ColumnFilters.Renderers.labels
        },
        renderer: function (value) {
          const labels = []
          for (const labelId of value) {
            const label = SM.Cache.CollectionMap.get(_this.collectionId).labelMap.get(labelId)
            if (label) labels.push(label)
          }
          labels.sort((a, b) => a.name.localeCompare(b.name))
          return SM.Collection.LabelArrayTpl.apply(labels)
        }
      },
      {
        header: "STIGs",
        width: 50,
        align: 'center',
        dataIndex: 'benchmarkIds',
        sortable: true,
        hidden: false,
        filter: { type: 'values' },
        renderer: function (value, metadata, record) {
          let qtipWidth = 230
          if (value.length > 0) {
            let longest = Math.max(...(value.map(el => el.length)))
            qtipWidth = longest * 8
          }
          metadata.attr = ` ext:qwidth=${qtipWidth} ext:qtip="<b>${record.data.name} STIGs</b><br>${value.join('<br>')}"`
          return `<i>${value.length}</i>`
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
    const config = {
      store,
      columns,
      sm,
      enableDragDrop: true,
      ddText : '{0} selected Asset{1}',
      bodyCssClass: 'sm-grid3-draggable',
      ddGroup: `SM.AssetSelection.GridPanel-${this.role}`,
      border: true,
      loadMask: false,
      stripeRows: true,
      view: new SM.ColumnFilters.GridViewBuffered({
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

SM.UserGroup.SelectingPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const _this = this
    function setupDragZone (grid) {
      const gridDragZone = grid.getView().dragZone
      const originalGetDragData = gridDragZone.getDragData
      gridDragZone.getDragData = function (e) {
        const t = Ext.lib.Event.getTarget(e)
        if (t.className === 'x-grid3-row-checker') {
          return false
        }
        return originalGetDragData.call(gridDragZone, e)
      }
      
      const originalStartDrag = gridDragZone.startDrag
      gridDragZone.startDrag = function (x, y) {
        Ext.getBody().addClass('sm-grabbing')
        return originalStartDrag.call(gridDragZone, x, y)
      }

      const originalOnDragDrop = gridDragZone.onDragDrop
      gridDragZone.onDragDrop = function (e, id) {
        Ext.getBody().removeClass('sm-grabbing')
        return originalOnDragDrop.call(gridDragZone, e, id)
      }

      const originalOnInvalidDrop = gridDragZone.onInvalidDrop
      gridDragZone.onInvalidDrop = function (e, id) {
        Ext.getBody().removeClass('sm-grabbing')
        return originalOnInvalidDrop.call(gridDragZone, e)
      }

    }
    const availableGrid = new SM.AssetSelection.GridPanel({
      title: 'Available',
      headerCssClass: 'sm-available-panel-header',
      role: 'available',
      collectionId: this.collectionId,
      flex: 1,
      listeners: {
        render: function (grid) {
          setupDragZone(grid)
          const gridDropTargetEl = grid.getView().scroller.dom;
          const gridDropTarget = new Ext.dd.DropTarget(gridDropTargetEl, {
            ddGroup: selectionsGrid.ddGroup,
            notifyDrop: function (ddSource, e, data) {
              const selectedRecords = ddSource.dragData.selections;
              changeSelectedAssets(selectionsGrid, selectedRecords, availableGrid)
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
          setupDragZone(grid)
          const gridDropTargetEl = grid.getView().scroller.dom;
          const gridDropTarget = new Ext.dd.DropTarget(gridDropTargetEl, {
            ddGroup: availableGrid.ddGroup,
            notifyDrop: function (ddSource, e, data) {
              const selectedRecords = ddSource.dragData.selections;
              changeSelectedAssets(availableGrid, selectedRecords, selectionsGrid)
              return true
            }
          })
        }
      }
    })
    availableGrid.getSelectionModel().on('selectionchange', handleSelections, selectionsGrid)
    selectionsGrid.getSelectionModel().on('selectionchange', handleSelections, availableGrid)

    const addBtn = new Ext.Button({
      iconCls: 'sm-add-assignment-icon',
      margins: "0 10 10 10",
      disabled: true,
      handler: function (btn) {
        const selectedRecords = availableGrid.getSelectionModel().getSelections()
        changeSelectedAssets(availableGrid, selectedRecords, selectionsGrid)
        btn.disable()
      }
    })
    const removeBtn = new Ext.Button({
      iconCls: 'sm-remove-assignment-icon',
      margins: "0 10 10 10",
      disabled: true,
      handler: function (btn) {
        const selectedRecords = selectionsGrid.getSelectionModel().getSelections()
        changeSelectedAssets(selectionsGrid, selectedRecords, availableGrid)
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
      if (sm.getSelected()) {
        sm.suspendEvents()
        sm.clearSelections()
        sm.resumeEvents()
        SM.SetCheckboxSelModelHeaderState(sm)
      }
      addBtn.setDisabled(this.role === 'available')
      removeBtn.setDisabled(this.role === 'selections')
    }

    async function initPanel({ benchmarkId, labelId }) {
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
        _this.trackedProperty = { dataProperty: 'benchmarkIds', value: benchmarkId }
      }
      else if (labelId) {
        promises.push(Ext.Ajax.requestPromise({
          responseType: 'json',
          url: `${STIGMAN.Env.apiBase}/collections/${_this.collectionId}/labels/${labelId}/assets`,
          method: 'GET'
        }))
        _this.trackedProperty = { dataProperty: 'labelIds', value: labelId }
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

    function changeSelectedAssets(srcGrid, records, dstGrid) {
      srcGrid.store.suspendEvents()
      dstGrid.store.suspendEvents()
      srcGrid.store.remove(records)
      dstGrid.store.add(records)
      for (const record of records) {
        if (srcGrid.role === 'available') {
          record.data[_this.trackedProperty.dataProperty].push(_this.trackedProperty.value)
          record.commit()
        }
        else {
          record.data[_this.trackedProperty.dataProperty] = record.data[_this.trackedProperty.dataProperty].filter(i => i !== _this.trackedProperty.value)
          record.commit()
        }
      }
      const { field, direction } = dstGrid.store.getSortState()
      dstGrid.store.sort(field, direction)
      srcGrid.store.resumeEvents()
      dstGrid.store.resumeEvents()
      srcGrid.store.fireEvent('datachanged', srcGrid.store)
      dstGrid.store.fireEvent('datachanged', dstGrid.store)
      srcGrid.store.fireEvent('update', srcGrid.store)
      dstGrid.store.fireEvent('update', dstGrid.store)
      dstGrid.store.filter(dstGrid.getView().getFilterFns())

      dstGrid.getSelectionModel().selectRecords(records)
      dstGrid.getView().focusRow(dstGrid.store.indexOfId(records[0].data.assetId))
      _this.fireEvent('assetselectionschanged')
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

SM.UserGroup.addUserGroupAdmin = function ({treePath}) {
	const tab = Ext.getCmp('main-tab-panel').getItem('user-group-admin-tab')
	if (tab) {
		tab.show()
		return
	}

	const userGroupGrid = new SM.UserGroup.UserGroupGrid({
		cls: 'sm-round-panel',
		margins: { top: SM.Margin.top, right: SM.Margin.edge, bottom: SM.Margin.bottom, left: SM.Margin.edge },
		region: 'center',
		stripeRows:true,
		loadMask: {msg: ''}
	})

	// const onUserChanged = function (apiUser) {
	// 	userGrid.store.loadData(apiUser, true)
	// 	const sortState = userGrid.store.getSortState()
	// 	userGrid.store.sort(sortState.field, sortState.direction)
	// 	userGrid.getSelectionModel().selectRow(userGrid.store.findExact('userId',apiUser.userId))
	// }
	// SM.Dispatcher.addListener('userchanged', onUserChanged)
	// SM.Dispatcher.addListener('usercreated', onUserChanged)


	const thisTab = Ext.getCmp('main-tab-panel').add({
		id: 'user-group-admin-tab',
		sm_treePath: treePath, 
		iconCls: 'sm-users-icon',
		title: 'User Groups',
		closable:true,
		layout: 'border',
		border: false,
		items: [userGroupGrid],
		listeners: {
			// beforedestroy: function(grid) {
			// 	SM.Dispatcher.removeListener('userchanged', onUserChanged)
			// 	SM.Dispatcher.removeListener('usercreated', onUserChanged)
			// }
		}
	})
	thisTab.show()
	
	userGroupGrid.getStore().load()
}
