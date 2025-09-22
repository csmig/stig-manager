Ext.ns('SM.Job')

SM.Job.JobsGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function() {
    const _this = this
    const fields = ['jobId', 'name', 'description', 'created', 'createdBy', 'updated', 'updatedBy', 'tasks', 'events', 'runCount', 'lastRun']
    const columns = [
      {header: 'ID', dataIndex: 'jobId', width: 50, sortable: true},
      {header: 'Name', dataIndex: 'name', width: 150, sortable: true},
      {header: 'Description', dataIndex: 'description', width: 250, sortable: false},
      // {header: 'Created', dataIndex: 'created', width: 100, sortable: true},
      // {header: 'CreatedBy', dataIndex: 'createdBy', width: 100, sortable: true},
      // {header: 'Updated', dataIndex: 'updated', width: 150, sortable: true},
      // {header: 'UpdatedBy', dataIndex: 'updatedBy', width: 150, sortable: true},
      {header: 'Tasks', dataIndex: 'tasks', width: 200, sortable: false, renderer: function(v) {
        if (v?.length) {
          return v.map(t => t.taskname).join('<br>')
        }
        return ''
      }},
      {header: 'Schedule', dataIndex: 'events', width: 200, sortable: false, renderer: function(v) {
        if (v?.length) {
          return v.map(e => e.eventId).join('<br>')
        }
        return ''
      }},
      {header: 'Runs', dataIndex: 'runCount', width: 150, sortable: true},
      {header: 'Last Run', xtype: 'datecolumn', format: 'Y-m-d H:i:s T', dataIndex: 'lastRun', width: 150, sortable: true}
    ]

    const store = new Ext.data.JsonStore({
      proxy: new Ext.data.HttpProxy({
        url: `${STIGMAN.Env.apiBase}/jobs`,
        method: 'GET'
      }),
      baseParams: {
        elevate: curUser.privileges.admin,
        // status: 'available',
        projection: ['events', 'runs']
      },
      root: '',
      fields,
      idProperty: 'jobId',
      sortInfo: {
        field: 'name',
        direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
      },
      listeners: {
        load: function () {
          _this.selModel.selectRow(0)
        }
      }
    })
    const totalTextCmp = new SM.RowCountTextItem({ store })

    const sm = new Ext.grid.RowSelectionModel({ 
      singleSelect: true,
      listeners: {
        rowselect: function (sm, rowIndex, record) {
          // if (store.getAt(rowIndex).data.status === 'available') {
          //   _this.modifyBtn.setDisabled(false)
          //   _this.statusBtn.setText('Set Unavailable')
          //   _this.statusBtn.setIconClass('sm-user-unavailable-icon')
          // } 
          // else {
          //   _this.modifyBtn.setDisabled(true)
          //   _this.statusBtn.setText('Set Available')
          //   _this.statusBtn.setIconClass('sm-user-icon')
          // } 
        }
      }
    })

    const view = new SM.ColumnFilters.GridView({
      forceFit: true,
      emptyText: 'No jobs found',
      listeners: {
        filterschanged: function (view) {
          store.filter(view.getFilterFns())
        },
        // These listeners keep the grid in the same scroll position after the store is reloaded
        beforerefresh: function (v) {
          v.scrollTop = v.scroller.dom.scrollTop;
          v.scrollHeight = v.scroller.dom.scrollHeight;
        },
        refresh: function (v) {
          setTimeout(function () {
            v.scroller.dom.scrollTop = v.scrollTop + (v.scrollTop == 0 ? 0 : v.scroller.dom.scrollHeight - v.scrollHeight);
          }, 100);
        }
      },
      deferEmptyText: false
    })

    const tbar = [
      {
        iconCls: 'icon-add',
        text: 'Create',
        handler: function () {
          Ext.getBody().mask('');
          SM.User.showUserProps(0);
        }
      },
      '-',
      {
        ref: '../removeBtn',
        iconCls: 'icon-del',
        text: 'Remove',
        handler: function () {
          let user = _this.getSelectionModel().getSelected();
          let buttons = { yes: 'Remove', no: 'Cancel' }
          let confirmStr = `Remove job ${user.data.username}?<br><br>This action will remove the Job's scheduled events and run output.`;

          Ext.Msg.show({
            title: 'Confirm remove action',
            icon: Ext.Msg.WARNING,
            msg: confirmStr,
            buttons: buttons,
            fn: async function (btn, text) {
              try {
                if (btn == 'yes') {
                  const apiUser = await Ext.Ajax.requestPromise({
                    responseType: 'json',
                    url: `${STIGMAN.Env.apiBase}/users/${user.data.userId}?elevate=${curUser.privileges.admin}&projection=collectionGrants&projection=statistics&projection=userGroups`,
                    method: 'DELETE',
                  })
                }
              }
              catch (e) {
                SM.Error.handleError(e)
              }
            }
          })
        },
      },
      '-',
      {
        ref: '../modifyBtn',
        iconCls: 'icon-edit',
        text: 'Modify',
        handler: function () {
          var r = _this.getSelectionModel().getSelected();
          Ext.getBody().mask('Getting properties...');
          SM.User.showUserProps(r.get('jobId'));
        }
      }
    ]

    const bbar = new Ext.Toolbar({
      items: [
        {
          xtype: 'tbbutton',
          iconCls: 'icon-refresh',
          tooltip: 'Reload this grid',
          width: 20,
          handler: function (btn) {
            store.reload()
          }
        },
        {
          xtype: 'tbseparator'
        },
        {
          xtype: 'exportbutton',
          hasMenu: false,
          gridBasename: 'Job-Info',
          exportType: 'grid',
          iconCls: 'sm-export-icon',
          text: 'CSV',
          grid: this     
        },
        {
          xtype: 'tbfill'
        }, {
          xtype: 'tbseparator'
        },
        totalTextCmp
      ]
    })

    const config = {
      store,
      columns,
      sm,
      view,
      tbar,
      bbar, 
    }

    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.Job.RunsGrid = Ext.extend(Ext.grid.GridPanel, {
    initComponent: function() {
    const _this = this
    const fields = [
      'runId', 
      'state', 
      'created', 
      'updated',
      {
        name: 'duration', 
        convert: function(v, record) {
          if (record.state !== 'running') {
            return new Date(record.updated) - new Date(record.created)
          }
          return null
        }
      }
    ]
    const columns = [
      // {header: 'ID', dataIndex: 'runId', width: 50, sortable: true},
      {header: 'Started', xtype: 'datecolumn', format: 'Y-m-d H:i:s.u T', dataIndex: 'created', width: 150, sortable: true},
      {header: 'State', dataIndex: 'state', width: 150, sortable: true},
      {header: 'Duration', dataIndex: 'duration', width: 150, sortable: true}
    ]

    const store = new Ext.data.JsonStore({
      root: '',
      fields,
      idProperty: 'runId',
      sortInfo: {
        field: 'created',
        direction: 'DESC'
      },
      listeners: {
        load: function () {
          _this.selModel.selectRow(0)
        }
      }
    })
    const totalTextCmp = new SM.RowCountTextItem({ store })

    const sm = new Ext.grid.RowSelectionModel({ 
      singleSelect: true,
      listeners: {
        rowselect: function (sm, rowIndex, record) {
          // if (store.getAt(rowIndex).data.status === 'available') {
          //   _this.modifyBtn.setDisabled(false)
          //   _this.statusBtn.setText('Set Unavailable')
          //   _this.statusBtn.setIconClass('sm-user-unavailable-icon')
          // } 
          // else {
          //   _this.modifyBtn.setDisabled(true)
          //   _this.statusBtn.setText('Set Available')
          //   _this.statusBtn.setIconClass('sm-user-icon')
          // } 
        }
      }
    })

    const view = new SM.ColumnFilters.GridView({
      forceFit: true,
      emptyText: 'No runs found',
      listeners: {
        // filterschanged: function (view) {
        //   store.filter(view.getFilterFns())
        // },
        // // These listeners keep the grid in the same scroll position after the store is reloaded
        // beforerefresh: function (v) {
        //   v.scrollTop = v.scroller.dom.scrollTop;
        //   v.scrollHeight = v.scroller.dom.scrollHeight;
        // },
        // refresh: function (v) {
        //   setTimeout(function () {
        //     v.scroller.dom.scrollTop = v.scrollTop + (v.scrollTop == 0 ? 0 : v.scroller.dom.scrollHeight - v.scrollHeight);
        //   }, 100);
        // }
      },
      deferEmptyText: false
    })


    const bbar = new Ext.Toolbar({
      items: [
        {
          xtype: 'tbbutton',
          iconCls: 'icon-refresh',
          tooltip: 'Reload this grid',
          width: 20,
          handler: function (btn) {
            store.reload()
          }
        },
        {
          xtype: 'tbseparator'
        },
        {
          xtype: 'exportbutton',
          hasMenu: false,
          gridBasename: 'runs',
          exportType: 'grid',
          iconCls: 'sm-export-icon',
          text: 'CSV',
          grid: this     
        },
        {
          xtype: 'tbfill'
        }, {
          xtype: 'tbseparator'
        },
        totalTextCmp
      ]
    })

    const config = {
      store,
      columns,
      sm,
      view,
      bbar, 
    }

    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }

})

SM.Job.RunOutputGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function() {
    const _this = this
    const fields = ['seq', 'type', 'message', 'task', 'ts']
    const columns = [
      {header: 'Seq', dataIndex: 'seq', width: 50, sortable: true},
      {header: 'Timestamp', xtype: 'datecolumn', format: 'Y-m-d H:i:s.u T', dataIndex: 'ts', width: 150, sortable: true},
      {header: 'Task', dataIndex: 'task', width: 100, sortable: true},
      {header: 'Type', dataIndex: 'type', width: 100, sortable: true},
      {header: 'Message', dataIndex: 'message', width: 300, sortable: true},
    ]
    const store = new Ext.data.JsonStore({
      root: '',
      fields,
      idProperty: 'seq',
      sortInfo: {
        field: 'seq',
        direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
      },
    })
    const totalTextCmp = new SM.RowCountTextItem({ store })
    const view = new SM.ColumnFilters.GridView({
      forceFit: true,
      emptyText: 'No output found',
      listeners: {
        filterschanged: function (view) {
          store.filter(view.getFilterFns())
        }
      }
    })

    const bbar = new Ext.Toolbar({
      items: [
        {
          xtype: 'tbbutton',
          iconCls: 'icon-refresh',
          tooltip: 'Reload this grid',
          width: 20,
          handler: function (btn) {
            store.reload()
          }
        },
        {
          xtype: 'tbseparator'
        },
        {
          xtype: 'exportbutton',
          hasMenu: false,
          gridBasename: 'Job-Run-Output',
          exportType: 'grid',
          iconCls: 'sm-export-icon',
          text: 'CSV',
          grid: this     
        },
        {
          xtype: 'tbfill'
        }, {
          xtype: 'tbseparator'
        },
        totalTextCmp
      ]
    })

    const config = {
      store,
      columns,
      view,
      bbar, 
    }

    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.Job.RunsPanel = Ext.extend(Ext.Panel, {
  initComponent: function() {
    const runsGrid = new SM.Job.RunsGrid({
      region: 'west',
      title: 'Runs',
      width: '33%',
      split: true,
      minWidth: 200,
      maxWidth: 600,
      iconCls: 'sm-job-run-icon',
      margins: { top: SM.Margin.top, right: SM.Margin.adjacent, bottom: SM.Margin.bottom, left: SM.Margin.edge },
      cls: 'sm-round-panel',
      border: true,
      loadMask: true,
    })

    const outputGrid = new SM.Job.RunOutputGrid({
      region: 'center',
      margins: { top: SM.Margin.top, right: SM.Margin.edge, bottom: SM.Margin.bottom, left: SM.Margin.adjacent },
      border: true,
      loadMask: true,
      iconCls: 'sm-job-output-icon',
      title: 'Output',
      cls: 'sm-round-panel',
    })
    runsGrid.getSelectionModel().on('rowselect', async function (sm, rowIndex, record) {
      const response = await Ext.Ajax.requestPromise({
        responseType: 'json',
        url: `${STIGMAN.Env.apiBase}/jobs/runs/${record.data.runId}/output?elevate=${curUser.privileges.admin}`,
        method: 'GET',
      })
      outputGrid.getStore().loadData(response)
    })

    const config = {
      layout: 'border',
      border: false,
      items: [runsGrid, outputGrid],
      runsGrid
    }

    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})


SM.Job.showJobAdminTab = function ({treePath}) {
	const tab = Ext.getCmp('main-tab-panel').getItem('job-admin-tab')
	if (tab) {
		tab.show()
		return
	}

  const jobsGrid = new SM.Job.JobsGrid({
    region: 'center',
    border: false,
    loadMask: true,
    margins: { top: SM.Margin.top, right: SM.Margin.edge, bottom: SM.Margin.adjacent, left: SM.Margin.edge },
    cls: 'sm-round-panel',
  })

  const runsPanel = new SM.Job.RunsPanel({
    border: false,
    iconCls: 'sm-job-run-icon',
    title: 'Runs',
    cls: 'sm-round-panel',
  })

  jobsGrid.getSelectionModel().on('rowselect', async function (sm, rowIndex, record) {
    const response = await Ext.Ajax.requestPromise({
      responseType: 'json',
      url: `${STIGMAN.Env.apiBase}/jobs/${record.data.jobId}/runs?elevate=${curUser.privileges.admin}`,
      method: 'GET',
    })
    runsPanel.runsGrid.getStore().loadData(response)
  })

  const jobTabPanel = new Ext.TabPanel({
    region: 'south',
    margins: { top: SM.Margin.adjacent, right: SM.Margin.edge, bottom: SM.Margin.bottom, left: SM.Margin.edge },
    cls: 'sm-round-panel',
    border: false,
    height: '66%',
    split: true,
    minHeight: 100,
    activeTab: 0,
    deferredRender: false,
    items: [
      runsPanel,
      {
        title: 'Tasks',
        iconCls: 'sm-job-task-icon',
      },
      {
        title: 'Schedule',
        iconCls: 'sm-job-event-icon',
      },
    ]
  })

  const thisTab = Ext.getCmp('main-tab-panel').add({
		id: 'job-admin-tab',
		sm_treePath: treePath, 
		iconCls: 'sm-job-icon',
		title: 'Jobs',
		closable:true,
		layout: 'border',
		border: false,
		items: [jobsGrid, jobTabPanel],
	})
	thisTab.show()
	jobsGrid.getStore().load()
}