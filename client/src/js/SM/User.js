Ext.ns('SM.User')

SM.User.GroupSpriteHtml = `<span class="sm-label-sprite {extraCls}" style="color:black;background-color:#888;">{[SM.he(values)]}</span>`

SM.User.GroupTpl = new Ext.XTemplate(
  SM.User.GroupSpriteHtml
)
SM.User.GroupArrayTpl = new Ext.XTemplate(
    '<tpl for=".">',
    `${SM.User.GroupSpriteHtml} `,
    '</tpl>'
)

SM.User.GroupSelectingGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const _this = this
    const fields = Ext.data.Record.create([
      { name: 'userGroupId', type: 'string' },
      { name: 'name', type: 'string' },
      { name: 'usernames', convert: (v, r) => r.users.map(user => user.username) },
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
        header: "Group name",
        width: 150,
        dataIndex: 'name',
        sortable: true,
        filter: { type: 'string' }
      },
      {
        header: "Members",
        width: 50,
        align: 'center',
        dataIndex: 'usernames',
        sortable: true,
        hidden: false,
        filter: { type: 'values' },
        renderer: function (value, metadata, record) {
          let qtipWidth = 230
          if (value.length > 0) {
            let longest = Math.max(...(value.map(el => el.length)))
            qtipWidth = longest * 8
          }
          metadata.attr = ` ext:qwidth=${qtipWidth} ext:qtip="<b>${record.data.name} Members</b><br>${value.join('<br>')}"`
          return `<i>${value.length}</i>`
        }
      }
    ]
    const store = new Ext.data.JsonStore({
      fields,
      idProperty: 'userGroupId',
      sortInfo: {
        field: 'name',
        direction: 'ASC'
      },
    })
    const totalTextCmp = new SM.RowCountTextItem({
      store,
      noun: 'group',
      iconCls: 'sm-users-icon'
    })
    const config = {
      store,
      columns,
      sm,
      enableDragDrop: true,
      ddText : '{0} selected Group{1}',
      bodyCssClass: 'sm-grid3-draggable',
      ddGroup: `SM.User.GroupSelectingGrid-${this.role}`,
      border: true,
      loadMask: false,
      stripeRows: true,
      view: new SM.ColumnFilters.GridView({
        forceFit: true,
        emptyText: 'No Groups to display',
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
            gridBasename: 'Groups (grid)',
            storeBasename: 'Groups (store)',
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

SM.User.GroupSelectingPanel = Ext.extend(Ext.Panel, {
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
    const availableGrid = new SM.User.GroupSelectingGrid({
      title: 'Available',
      headerCssClass: 'sm-available-panel-header',
      role: 'available',
      flex: 1,
      listeners: {
        render: function (grid) {
          setupDragZone(grid)
          const gridDropTargetEl = grid.getView().scroller.dom;
          const gridDropTarget = new Ext.dd.DropTarget(gridDropTargetEl, {
            ddGroup: selectionsGrid.ddGroup,
            notifyDrop: function (ddSource, e, data) {
              const selectedRecords = ddSource.dragData.selections;
              changeSelected(selectionsGrid, selectedRecords, availableGrid)
              return true
            }
          })
        },

      }
    })
    const selectionsGrid = new SM.User.GroupSelectingGrid({
      title: this.selectionsGridTitle || 'Assigned',
      headerCssClass: 'sm-selections-panel-header',
      role: 'selections',
      flex: 1,
      listeners: {
        render: function (grid) {
          setupDragZone(grid)
          const gridDropTargetEl = grid.getView().scroller.dom;
          const gridDropTarget = new Ext.dd.DropTarget(gridDropTargetEl, {
            ddGroup: availableGrid.ddGroup,
            notifyDrop: function (ddSource, e, data) {
              const selectedRecords = ddSource.dragData.selections;
              changeSelected(availableGrid, selectedRecords, selectionsGrid)
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
        changeSelected(availableGrid, selectedRecords, selectionsGrid)
        btn.disable()
      }
    })
    const removeBtn = new Ext.Button({
      iconCls: 'sm-remove-assignment-icon',
      margins: "0 10 10 10",
      disabled: true,
      handler: function (btn) {
        const selectedRecords = selectionsGrid.getSelectionModel().getSelections()
        changeSelected(selectionsGrid, selectedRecords, availableGrid)
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

    async function initPanel({ userId }) {
      const promises = [
        Ext.Ajax.requestPromise({
          responseType: 'json',
          url: `${STIGMAN.Env.apiBase}/user-groups`,
          params: {
            projection: ['users']
          },
          method: 'GET'
        }),
        Ext.Ajax.requestPromise({
          responseType: 'json',
          url: `${STIGMAN.Env.apiBase}/users/${userId}`,
          params: {
            elevate: curUser.privileges.canAdmin,
            projection: ['userGroups']
          },
          method: 'GET'
        })
      ]
      const [apiAvailableUserGroups, apiUser ] = await Promise.all(promises)
      const assignedUserGroupIds = apiUser?.userGroups?.map(userGroup => userGroup.userGroupId) ?? []
      _this.originalUserGroupIds = assignedUserGroupIds
      const availableUserGroups = []
      const assignedUserGroups = []
      apiAvailableUserGroups.reduce((accumulator, userGroup) => {
        const property = assignedUserGroupIds.includes(userGroup.userGroupId) ? 'assignedUserGroups' : 'availableUserGroups'
        accumulator[property].push(userGroup)
        return accumulator
      }, { availableUserGroups, assignedUserGroups })

      availableGrid.store.loadData(availableUserGroups)
      selectionsGrid.store.loadData(assignedUserGroups)
      _this.trackedProperty = { dataProperty: 'usernames', value: apiUser.username }

    }

    function changeSelected(srcGrid, records, dstGrid) {
      srcGrid.store.suspendEvents()
      dstGrid.store.suspendEvents()
      srcGrid.store.remove(records)
      dstGrid.store.add(records)
      // for (const record of records) {
      //   if (srcGrid.role === 'available') {
      //     record.data[_this.trackedProperty.dataProperty].push(_this.trackedProperty.value)
      //     record.commit()
      //   }
      //   else {
      //     record.data[_this.trackedProperty.dataProperty] = record.data[_this.trackedProperty.dataProperty].filter(i => i !== _this.trackedProperty.value)
      //     record.commit()
      //   }
      // }
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
      _this.fireEvent('groupselectionschanged')
    }

    function getValue() {
      const records = selectionsGrid.store.snapshot?.items ?? selectionsGrid.store.getRange()
      return records.map(record => record.data.userGroupId)
    }

    const config = {
      layout: 'hbox',
      layoutConfig: {
        align: 'stretch'
      },
      name: 'userGroups',
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
    this.superclass().initComponent.call(this)
  }
})


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
        name: 'groupNames',
        convert: (v, r) => r.userGroups.map(userGroup => userGroup.name)
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
        projection: ['userGroups', 'statistics']
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
          header: "Groups",
          width: 220,
          dataIndex: 'groupNames',
          sortable: false,
          filter: {
              type: 'values', 
              renderer: SM.ColumnFilters.Renderers.groups
          },
          renderer: function (value, metadata) {
              value.sort((a,b) => a.localeCompare(b))
              metadata.attr = 'style="line-height: 17px;white-space:normal;"'
              return SM.User.GroupArrayTpl.apply(value)
          }
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