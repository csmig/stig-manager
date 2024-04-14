Ext.ns('SM.UserGroup')

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
