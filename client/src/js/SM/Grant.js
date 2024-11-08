Ext.ns('SM.Grant')

SM.Grant.GranteeTreePanel = Ext.extend(Ext.tree.TreePanel, {
  initComponent: function () {
    const config = {
      autoScroll: true,
      bodyStyle: 'padding:5px;',
      minSize: 220,
      root: {
        nodeType: 'async',
        id: `grantee-root`,
        expanded: true
      },
      rootVisible: false,
      loader: new Ext.tree.TreeLoader({
        directFn: this.loadTree
      }),
      loadMask: { msg: '' },
      listeners: {
        beforeexpandnode: function (n) {
          n.loaded = false; // always reload from the server
        }
      }
    }

    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  },
  loadTree: async function (node, cb) {
    try {
      const existingGrants = this.ownerTree.existingGrants ?? []
      const existingUserIds = existingGrants.filter( g => g.userId).map(u=>u.userId)
      const existingGroupIds = existingGrants.filter( g => g.userGroupId).map(g=>g.userGroupId)
      let match
      // Root node
      if (node === 'grantee-root') {
        const content = [
          {
            id: `grantee-user-groups-node`,
            node: 'user-groups',
            text: 'User Groups',
            iconCls: 'sm-users-icon',
            expanded: true
          },
          {
            id: `grantee-users-node`,
            node: 'users',
            text: 'Users',
            iconCls: 'sm-user-icon',
            expanded: true
          }
        ]
        cb(content, { status: true })
        return
      }
      // UserGroups node
      if (node === 'grantee-user-groups-node') {
        const apiUserGroups = await Ext.Ajax.requestPromise({
          responseType: 'json',
          url: `${STIGMAN.Env.apiBase}/user-groups`,
          method: 'GET'
        })
        const availUserGroups = apiUserGroups.filter( userGroup => !existingGroupIds.includes(userGroup.userGroupId))

        const content = availUserGroups.map(userGroup => ({
          id: `${userGroup.userGroupId}-user-groups-group-node`,
          text: SM.he(userGroup.name),
          userGroup,
          node: 'user-group',
          iconCls: 'sm-users-icon',
          checked: false,
          qtip: SM.he(userGroup.description)
        }))
        cb(content, { status: true })
        return
      }
      // UserGroups-User node
      match = node.match(/^(\d+)-user-groups-group-node$/)
      if (match) {
        const userGroupId = match[1]
        const apiUsers = await Ext.Ajax.requestPromise({
          responseType: 'json',
          url: `${STIGMAN.Env.apiBase}/user-groups/${userGroupId}`,
          method: 'GET',
          params: {
            projection: 'users'
          }
        })
        const content = apiUsers.users.map(user => ({
          id: `${userGroupId}-${user.userId}-user-groups-user-leaf`,
          text: SM.he(user.displayName),
          leaf: true,
          node: 'user',
          iconCls: 'sm-user-icon',
          user,
          qtip: `Rules: ${SM.he(user.username)}`
        }))
        cb(content, { status: true })
        return
      }

      // Users node
      if (node === 'grantee-users-node') {
        const apiUsers = await Ext.Ajax.requestPromise({
          responseType: 'json',
          url: `${STIGMAN.Env.apiBase}/users`,
          method: 'GET'
        })
        const availUsers = apiUsers.filter( user => !existingUserIds.includes(user.userId))

        const content = availUsers.map(user => ({
          id: `users-${user.userId}-user-leaf`,
          text: SM.he(user.displayName),
          user,
          node: 'user',
          leaf: true,
          checked: false,
          iconCls: 'sm-user-icon',
          qtip: SM.he(user.username)
        }))
        cb(content, { status: true })
        return
      }
    }
    catch (e) {
      SM.Error.handleError(e)
    }
  }
})

SM.Grant.GranteeAddBtn = Ext.extend(Ext.Button, {
  initComponent: function () {
    const config = {
      disabled: true,
      height: 30,
      width: 150,
      margins: "10 10 10 10",
      icon: 'img/right-arrow-16.png',
      iconAlign: 'right',
      cls: 'x-btn-text-icon'
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.Grant.GranteeRemoveBtn = Ext.extend(Ext.Button, {
  initComponent: function () {
    const grid = this.grid
    const config = {
      disabled: true,
      height: 30,
      width: 150,
      margins: "10 10 10 10",
      icon: 'img/left-arrow-16.png',
      iconAlign: 'left',
      cls: 'x-btn-text-icon',
      listeners: {
        click: function () {
          const assigmentsToPurge = grid.getSelectionModel().getSelections()
          grid.getStore().remove(assigmentsToPurge)
        }
      }
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.Grant.GrantGrid = Ext.extend(Ext.grid.EditorGridPanel, {
  initComponent: function () {
    const _this = this
    const fields = [
      'grantTarget',
      'grantTargetId',
      'title',
      'subtitle',
      'accessLevel',
      'recordId',
      'grantee'
    ]

    const store = new Ext.data.JsonStore({
      grid: this,
      root: '',
      fields,
      idProperty: 'recordId',
      sortInfo: {
        field: 'title',
        direction: 'ASC'
      }
    })
    const totalTextCmp = new SM.RowCountTextItem({
      store,
      noun: 'grant',
      iconCls: 'sm-lock-icon'
    })
    const accessLevelField = new SM.RoleComboBox({
      submitValue: false,
      grid: this,
      includeOwnerGrant: this.canModifyOwners,
      listeners: {
        select: function (combo) {
          if (combo.startValue !== combo.value ) {
            combo.fireEvent("blur");
          } 
        }
      }
    })
    const colModel = new Ext.grid.ColumnModel({
      columns: [
        {
          header: "Grantee",
          width: 150,
          dataIndex: 'title',
          sortable: true,
          renderer: function (v, m, r) {
            const icon = r.data.grantTarget === 'user' ? 'sm-user-icon' : 'sm-users-icon'
            return `<div class="x-combo-list-item ${icon} sm-combo-list-icon" exportValue="${r.data.title ?? ''}:${r.data.subtitle ?? ''}"><span style="font-weight:600;">${r.data.title ?? ''}</span><br>${r.data.subtitle ?? ''}</div>`
          }
        },
        {
          header: '<span exportvalue="Role">Role<i class= "fa fa-question-circle sm-question-circle"></i></span>',
          width: 70,
          dataIndex: 'accessLevel',
          sortable: true,
          renderer: (v) => SM.RoleStrings[v],
          editor: accessLevelField
        }
      ]
    })
    const selModel = new Ext.grid.RowSelectionModel({
      singleSelect: false
    })
    const view = new SM.ColumnFilters.GridView({
      emptyText: this.emptyText || 'No records to display',
      deferEmptyText: false,
      forceFit: true,
      markDirty: false,
      listeners: {
        refresh: function (view) {
          // Setup the tooltip for column 'accessLevel'
          const index = view.grid.getColumnModel().findColumnIndex('accessLevel')
          const tipEl = view.getHeaderCell(index).getElementsByClassName('fa')[0]
          if (tipEl) {
            new Ext.ToolTip({
              target: tipEl,
              showDelay: 0,
              dismissDelay: 0,
              maxWidth: 600,
              html: SM.TipContent.AccessLevels
            })
          }
        },
      },
    })
    const bbar = new Ext.Toolbar({
      items: [
        {
          xtype: 'exportbutton',
          hasMenu: false,
          gridBasename: 'CollectionGrants',
          exportType: 'grid',
          iconCls: 'sm-export-icon',
          text: 'CSV'
        }, {
          xtype: 'tbfill'
        }, {
          xtype: 'tbseparator'
        },
        totalTextCmp
      ]
    })
    function viewready (grid) {
      // Setup the tooltip for column 'accessLevel'
      const index = grid.getColumnModel().findColumnIndex('accessLevel')
      const tipEl = grid.view.getHeaderCell(index).getElementsByClassName('fa')[0]
      if (tipEl) {
        new Ext.ToolTip({
          target: tipEl,
          showDelay: 0,
          dismissDelay: 0,
          maxWidth: 600,
          html: SM.TipContent.AccessLevels
        })
      }
    }
    function getValue () {
      let grants = []
      store.data.items.forEach(i => {
        if (i.data.grantTarget === 'user')
          grants.push({
            userId: i.data.grantTargetId,
            accessLevel: i.data.accessLevel
          })
        else
          grants.push({
            userGroupId: i.data.grantTargetId,
            accessLevel: i.data.accessLevel
          })
      })
      return grants
    }
    function setValue (v) {
      const data = v.map(g => {
        if (g.user) return {
          grantTarget: 'user',
          grantTargetId: g.user.userId,
          subtitle: g.user.username,
          title: g.user.displayName,
          accessLevel: g.accessLevel,
          recordId: `U${g.user.userId}`

        }
        return {
          grantTarget: 'user-group',
          grantTargetId: g.userGroup.userGroupId,
          title: g.userGroup.name,
          subtitle: g.userGroup.description,
          accessLevel: g.accessLevel,
          recordId: `UG${g.userGroup.userGroupId}`
        }
      })
      store.loadData(data)
    }
    
    const config = {
      name: 'grants',
      allowBlank: false,
      layout: 'fit',
      height: 150,
      store,
      colModel,
      selModel,
      view,
      bbar,
      listeners: {
        viewready
      },
      getValue,
      setValue
    }

    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.Grant.NewGrantPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    function handleTreeCheck(node) {
      const checkedNodes = granteeTp.getChecked()
      addBtn.setDisabled(!checkedNodes.length)
    }

    const granteeTp = new SM.Grant.GranteeTreePanel({
      panel: this,
      role: 'available',
      title: 'Available Grantees',
      width: 240,
      existingGrants: this.existingGrants,
      // selModel: new Ext.tree.MultiSelectionModel(),
      listeners: {
        checkchange: handleTreeCheck
      }
    })
    new Ext.tree.TreeSorter(granteeTp, {
      dir: "asc"
    })

    const grantGrid = new SM.Grant.GrantGrid({
      title: 'New Grants',
      iconCls: 'sm-lock-icon',
      headerCssClass: 'sm-selections-panel-header',
      role: 'selections',
      flex: 1
    })
    grantGrid.getSelectionModel().on('selectionchange', function (sm) {
      removeBtn.setDisabled(sm.getSelected()?.length)
    })

    const addBtn = new Ext.Button({
      iconCls: 'sm-add-assignment-icon',
      margins: "10 0 10 0",
      disabled: true,
      handler: function (btn) {
        const checkedNodes = granteeTp.getChecked()
        const data = checkedNodes.map( node => {
          const accessLevel = roleComboBox.getValue()
          if (node.attributes.user) {
            return {
              grantTarget: 'user',
              grantTargetId: node.attributes.user.userId,
              subtitle: node.attributes.user.username,
              title: node.attributes.user.displayName,
              accessLevel,
              recordId: `U${node.attributes.user.userId}`,
              grantee: node.attributes.user
            } 
          }
          else {
            return {
              grantTarget: 'user-group',
              grantTargetId: node.attributes.userGroup.userGroupId,
              title: node.attributes.userGroup.name,
              subtitle: node.attributes.userGroup.description,
              accessLevel,
              recordId: `UG${node.attributes.userGroup.userGroupId}`,
              grantee: node.attributes.userGroup
            }
          }
        })
        for (const node of checkedNodes) {
          node.remove()
        }
        grantGrid.store.loadData(data, true)
        btn.disable()
      }
    })
    const removeBtn = new Ext.Button({
      iconCls: 'sm-remove-assignment-icon',
      // margins: "0 10 10 10",
      disabled: true,
      handler: function (btn) {
        const selectedRecords = grantGrid.getSelectionModel().getSelections()
        for (const record of selectedRecords) {
          const data = record.data
          if (data.grantTarget === 'user-group') {
            const node = new Ext.tree.TreeNode({
              id: `${data.grantTargetId}-user-groups-group-node`,
              text: SM.he(data.title),
              userGroup: data.grantee,
              node: 'user-group',
              iconCls: 'sm-users-icon',
              checked: false,
              qtip: SM.he(data.subtitle)
            })
            const parentNode = granteeTp.getNodeById('grantee-user-groups-node')
            parentNode.appendChild(node)
            if (!parentNode.isExpanded()) parentNode.expand({anim: false})
          }
          else if (data.grantTarget === 'user') {
            const node = new Ext.tree.TreeNode({
              id: `users-${data.grantTargetId}-user-leaf`,
              text: SM.he(data.title),
              user: data.grantee,
              node: 'user',
              iconCls: 'sm-user-icon',
              checked: false,
              qtip: SM.he(data.subtitle)
            })
            const parentNode = granteeTp.getNodeById('grantee-users-node')
            parentNode.appendChild(node)
            if (!parentNode.isExpanded()) parentNode.expand({anim: false})
          }
        }
        grantGrid.store.remove(selectedRecords)
        btn.disable()
      }
    })

    const roleComboBox = new SM.RoleComboBox({
      width: 80,
      includeOwnerGrant: this.canModifyOwners
    })

    const buttonPanel = new Ext.Panel({
      bodyStyle: 'background-color:transparent;border:none',
      width: 120,
      layout: {
        type: 'vbox',
        pack: 'center',
        align: 'center',
      },
      items: [
        { xtype: 'panel', border: false, html: 'Role:', margins: '0 0 5 0' },
        roleComboBox,
        addBtn,
        removeBtn
      ]
    })

    const config = {
      layout: 'hbox',
      layoutConfig: {
        align: 'stretch'
      },
      name: 'users',
      border: false,
      items: [
        granteeTp,
        buttonPanel,
        grantGrid
      ],
      granteeTp,
      grantGrid
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.Grant.showNewGrantWindow = function ({collectionId, existingGrants, canModifyOwners}) {
  try {
    async function saveHandler () {
      try {
        const grants = panel.grantGrid.getValue()
        const requests = []
        for (const grant of grants) {
          let url
          if (grant.userId) {
            url = `${STIGMAN.Env.apiBase}/collections/${collectionId}/grants/user/${grant.userId}`
          }
          else {
            url = `${STIGMAN.Env.apiBase}/collections/${collectionId}/grants/user-group/${grant.userGroupId}`
          }
          requests.push(
            Ext.Ajax.requestPromise({
              url,
              method: 'put',
              headers: { 'Content-Type': 'application/json;charset=utf-8' },
              jsonData: {
                accessLevel: grant.accessLevel
              }
            })
          )  
        }
        await Promise.all(requests)
      }
      catch (e) {
        SM.Error.handleError(e)
      }
      finally {
        panelWindow.close()
      }
    }
      
    const panel = new SM.Grant.NewGrantPanel({existingGrants, canModifyOwners})

    const panelWindow = new Ext.Window({
      title: `New Grants for ${collectionId}`,
      cls: 'sm-dialog-window sm-round-panel',
      modal: true,
      hidden: true,
      width: 660,
      height: 600,
      layout: 'fit',
      plain: true,
      bodyStyle: 'padding:20px;',
      buttonAlign: 'right',
      items: panel,
      buttons: [
        {
          text: 'Cancel',
          handler: function () {
            panelWindow.close();
          }
        },
        {
          text: 'Save',
          formBind: true,
          id: 'submit-button',
          handler: saveHandler
        }
      ]
    })
    panel.panelWindow = panelWindow
    panelWindow.render(Ext.getBody())
    Ext.getBody().unmask()
    panelWindow.show()
  }
  catch (e) {
    if (typeof e === 'object') {
      if (e instanceof Error) {
        e = JSON.stringify(e, Object.getOwnPropertyNames(e), 2);
      }
      else {
        e = JSON.stringify(e);
      }
    }
    SM.Error.handleError(e)
    Ext.getBody().unmask()
  }
}

SM.Grant.showGranteeWindow = function ({existingGrants}) {
  const granteeTp = new SM.Grant.GranteeTreePanel({
    title: 'Available Grantees',
    width: 240,
    existingGrants,
    listeners: {
      beforeclick: function (node, e) {
        console.log(node, e)
      }
    }
  })

  granteeTp.getSelectionModel().on('beforeselect', function (sm, newNode, oldNode) {
    granteeTp.root.cascade(function (n) {
      n.ui.toggleCheck(false)
    })
    newNode.ui.toggleCheck(true)
    return false
  })
  const panelWindow = new Ext.Window({
    title: `Change Grantee`,
    cls: 'sm-dialog-window sm-round-panel',
    modal: true,
    hidden: true,
    width: 300,
    height: 600,
    layout: 'fit',
    plain: true,
    bodyStyle: 'padding:20px;',
    buttonAlign: 'right',
    items: granteeTp,
    buttons: [
      {
        text: 'Cancel',
        handler: function () {
          panelWindow.close();
        }
      },
      {
        text: 'Save',
        formBind: true,
        id: 'submit-button',
        // handler: saveHandler
      }
    ]
  })
  // panelWindow.render(Ext.getBody())
  // Ext.getBody().unmask()
  panelWindow.show()
}
