Ext.ns('SM.User')

SM.User.UserGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const _this = this
    const fields = Ext.data.Record.create([
      {	name:'userId',
        type: 'string'
      },
      {
        name:'username',
        type: 'string'
      },
      {
        name: 'name',
        type: 'string',
        mapping: 'statistics.lastClaims?.name'
      },
      {
        name: 'created',
        type: 'date',
        mapping: 'statistics.created'
      },
      {
        name: 'lastAccess',
        type: 'integer',
        mapping: 'statistics.lastAccess'
      },
      {
        name: 'collectionGrantCount',
        type: 'integer',
        mapping: 'statistics.collectionGrantCount'
      },
      {
        name: 'statistics'
      }
    ])
    const store = new Ext.data.JsonStore({
      proxy: new Ext.data.HttpProxy({
        url: `${STIGMAN.Env.apiBase}/users`,
        method: 'GET'
      }),
      baseParams: {
        elevate: curUser.privileges.canAdmin,
        projection: ['statistics']
      },
      root: '',
      fields,
      idProperty: 'userId',
      sortInfo: {
        field: 'username',
        direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
      }
    })
    const privilegeGetter = new Function("obj", "return obj?." + STIGMAN.Env.oauth.claims.privileges + " || [];");
    const totalTextCmp = new SM.RowCountTextItem({store})
    const config = {
      store,
      sm: new Ext.grid.RowSelectionModel({ singleSelect: true }),
      columns: [
        {
          header: "Username", 
          width: 150,
          dataIndex: 'username',
          sortable: true,
          filter: {type: 'string'}
        },
        { 	
          header: "Name",
          width: 150,
          dataIndex: 'name',
          sortable: true,
          filter: {type: 'string'}
        },
        { 	
          header: "Grants",
          width: 50,
          align: 'center',
          dataIndex: 'collectionGrantCount',
          sortable: true,
        },
        { 	
          header: "Added",
          xtype: 'datecolumn',
          format: 'Y-m-d H:i T',
          width: 150,
          dataIndex: 'created',
          sortable: true
        },
        { 	
          header: "Last Access",
          width: 150,
          dataIndex: 'lastAccess',
          sortable: true,
          renderer: v => v ? Ext.util.Format.date(new Date(v * 1000), 'Y-m-d H:i T') : SM.styledEmptyRenderer()
        },
        { 	
          header: "Create Collection",
          width: 100,
          align: 'center',
          renderer: function (value, metaData, record) {
            return privilegeGetter(record.data.statistics.lastClaims).includes('create_collection') ? '&#x2714;' : ''
          }
        },
        { 	
          header: "Administrator",
          width: 100,
          align: 'center',
          renderer: function (value, metaData, record) {
            return privilegeGetter(record.data.statistics.lastClaims).includes('admin') ? '&#x2714;' : ''
          }
        },
        {
          header: "userId", 
          width: 100,
          dataIndex: 'userId',
          sortable: true
        }
      ],
      view: new SM.ColumnFilters.GridView({
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
      }),
      listeners: {
        rowdblclick: function(grid,rowIndex,e) {
          let r = grid.getStore().getAt(rowIndex);
          Ext.getBody().mask('Getting grants for ' + r.get('name') + '...');
          showUserProps(r.get('userId'));
        }
      },
      tbar: [
        {
          iconCls: 'icon-add',
          text: 'Pre-register User',
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
          text: 'Unregister User',
          disabled: !(curUser.privileges.canAdmin),
          handler: function() {
            let user = _this.getSelectionModel().getSelected();
            let buttons = {yes: 'Unregister', no: 'Cancel'}
            let confirmStr=`Unregister user ${user.data.username}?<br><br>This action will remove all Collection Grants for the user. A record will be retained in the system for auditing and attribution purposes.`;
            if (user.data.lastAccess === 0){
              confirmStr=`Delete user ${user.data.username}?<br><br>This user has never accessed the system, and will be deleted from the system entirely.`;
              buttons.yes = 'Delete'
            }
            
            Ext.Msg.show({
              title: 'Confirm unregister action',
              icon: Ext.Msg.WARNING,
              msg: confirmStr,
              buttons: buttons,
              fn: async function (btn,text) {
                try {
                  if (btn == 'yes') {
                      if (user.data.lastAccess === 0){
                        const apiUser = await Ext.Ajax.requestPromise({
                          responseType: 'json',
                          url: `${STIGMAN.Env.apiBase}/users/${user.data.userId}?elevate=${curUser.privileges.canAdmin}`,
                          method: 'DELETE'
                        })
                        store.remove(user)
                        SM.Dispatcher.fireEvent('userdeleted', apiUser)
                      }
                      else {
                        const apiUser = await Ext.Ajax.requestPromise({
                          responseType: 'json',
                          url: `${STIGMAN.Env.apiBase}/users/${user.data.userId}?elevate=${curUser.privileges.canAdmin}&projection=collectionGrants&projection=statistics`,
                          method: 'PATCH',
                          jsonData: {collectionGrants: []}
                        })
                      // userStore.remove(user)
                      SM.Dispatcher.fireEvent('userchanged', apiUser)									
                    }
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
          text: 'Modify User',
          handler: function() {
            var r = _this.getSelectionModel().getSelected();
            Ext.getBody().mask('Getting properties...');
            showUserProps(r.get('userId'));
          }
        }
      ],
      bbar: new Ext.Toolbar({
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
          gridBasename: 'User-Info',
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
    }
  

    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})