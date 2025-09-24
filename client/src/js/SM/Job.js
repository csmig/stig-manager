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
          return v.map(t => t.name).join('<br>')
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

SM.Job.SchedulePanel = Ext.extend(Ext.FormPanel, {
  initComponent: function() {
    const intervalValue = new Ext.form.NumberField({
      fieldLabel: 'Value',
      name: 'intervalValue',
      value: 1,
      minValue: 1,
      maxValue: 365,
      width: 30,
      allowBlank: false,
      allowDecimals: false,
      allowNegative: false,
      listeners: {
        change: function (nf, newVal, oldVal) {
          if (newVal < 1) nf.setValue(1)
          if (newVal > 365) nf.setValue(365)
        }
      }
    })

    const intervalField = new Ext.form.ComboBox({
      fieldLabel: 'Field',
      name: 'intervalField',
      store: new Ext.data.ArrayStore({
        fields: ['value', 'display'],
        data: [
          ['minute', 'Minute(s)'],
          ['hour', 'Hour(s)'],
          ['day', 'Day(s)'],
          ['week', 'Week(s)'],
          ['month', 'Month(s)'],
        ]
      }),
      valueField: 'value',
      displayField: 'display',
      mode: 'local',
      triggerAction: 'all',
      editable: false,
      selectOnFocus: true,
      forceSelection: true,
      value: 'day',
      width: 100,
      allowBlank: false,
    })

    const intervalComposite = new Ext.form.CompositeField({
        fieldLabel: 'Repeat Every',
        labelWidth: 120,
        items: [
            intervalValue,
            intervalField
        ]
    })

    const startTime = new Ext.form.TimeField({
      fieldLabel: 'Start Time',
      name: 'dailyTime',
      value: '00:00',
      format: 'H:i',
      width: 110,
    })

    const startDate = new Ext.form.DateField({
      fieldLabel: 'Start Date',
      name: 'dailyDate',
      value: new Date(),
      minValue: new Date(),
      format: 'D Y-m-d',
      width: 110,
      editable: false,
      listeners: {
        select: function (df, date) {
        }
      }
    })

    const frequencyCombo = new Ext.form.ComboBox({
      fieldLabel: 'Frequency',
      name: 'frequency',
      store: new Ext.data.ArrayStore({
        fields: ['value', 'display'],
        data: [
          ['none', 'None'],
          ['recurring', 'Recurring'],
          ['once', 'One Time'],
        ]
      }),
      valueField: 'value',
      displayField: 'display',
      mode: 'local',
      triggerAction: 'all',
      editable: false,
      selectOnFocus: true,
      forceSelection: true,
      value: 'recurring',
      width: 100,
      listeners: {
        select: function (cb, record, index) {
          if (cb.getValue() === 'recurring') {
            intervalComposite.show()
            startDate.show()
            startTime.show()
          }
          else if (cb.getValue() === 'once') {
            intervalComposite.hide()
            startDate.show()
            startTime.show()
          }
          else if (cb.getValue() === 'none') {
            intervalComposite.hide()
            startDate.hide()
            startTime.hide()
          }
        }
      }
    })

    const config = {
      labelWidth: 120,
      items: [
        frequencyCombo,
        intervalComposite,
        startDate,
        startTime,
      ]
    }

    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.Job.TaskSelectingGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const fields = [
      'taskId',
      'name',
      'description',
    ]
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
        header: "Task",
        width: 150,
        dataIndex: 'name',
        sortable: true,
        renderer: function (v, m, r) {
          return `<div exportValue="${r.data.name ?? ''}:${r.data.description ?? ''}"><span style="font-weight:600;">${r.data.name ?? ''}</span><br>${r.data.description ?? ''}</div>`
        }
      },
    ]
    const store = new Ext.data.JsonStore({
      fields,
      idProperty: 'taskId',
      sortInfo: {
        field: 'name',
        direction: 'ASC'
      },
    })
    const totalTextCmp = new SM.RowCountTextItem({
      store,
      noun: 'task',
      iconCls: 'sm-task-icon'
    })
    const config = {
      store,
      columns,
      sm,
      enableDragDrop: true,
      ddText: '{0} selected Task{1}',
      bodyCssClass: 'sm-grid3-draggable',
      ddGroup: `SM.Job.TaskSelectingGrid-${this.role}`,
      border: true,
      loadMask: false,
      stripeRows: true,
      view: new SM.ColumnFilters.GridView({
        forceFit: true,
        emptyText: 'No Users to display',
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
            gridBasename: 'Tasks (grid)',
            storeBasename: 'Tasks (store)',
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

SM.Job.TaskSelectingPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const _this = this
    function setupDragZone(grid) {
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
    const availableGrid = new SM.Job.TaskSelectingGrid({
      title: 'Available Tasks',
      iconCls: 'sm-task-icon',
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
    const selectionsGrid = new SM.Job.TaskSelectingGrid({
      title: 'Job Tasks',
      iconCls: 'sm-task-icon',
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
          const gridDropTarget2 = new Ext.dd.DropTarget(gridDropTargetEl, {
            ddGroup: selectionsGrid.ddGroup,
            notifyDrop: function (ddSource, e, data) {
              const selectedRecords = ddSource.dragData.selections;
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

    const upBtn = new Ext.Button({
      iconCls: 'sm-move-up-icon',
      margins: "0 10 10 10",
      disabled: true,
      handler: function (btn) {
        const sm = selectionsGrid.getSelectionModel()
        if (sm.hasSelection()) {
          const record = sm.getSelected()
          const index = selectionsGrid.store.indexOf(record)
          if (index > 0) {
            selectionsGrid.store.remove(record)
            selectionsGrid.store.insert(index - 1, record)
            sm.selectRow(index - 1)
            fireSelectedChanged ()
          }
        }
      }
    })
    const downBtn = new Ext.Button({
      iconCls: 'sm-move-down-icon',
      margins: "0 10 10 10",
      disabled: true,
      handler: function (btn) {
        const sm = selectionsGrid.getSelectionModel()
        if (sm.hasSelection()) {
          const record = sm.getSelected()
          const index = selectionsGrid.store.indexOf(record)
          if (index < selectionsGrid.store.getCount() - 1) {
            selectionsGrid.store.remove(record)
            selectionsGrid.store.insert(index + 1, record)
            sm.selectRow(index + 1)
            fireSelectedChanged ()
          }
        }
      }
    })
    selectionsGrid.getSelectionModel().on('selectionchange', function (sm) {
      const hasSelection = sm.hasSelection()
      upBtn.setDisabled(!hasSelection)
      downBtn.setDisabled(!hasSelection)
    })

    // const orderButtonPanel = new Ext.Panel({
    //   bodyStyle: 'background-color:transparent;border:none',
    //   width: 60,
    //   layout: {
    //     type: 'vbox',
    //     pack: 'center',
    //     align: 'center',
    //     padding: "10 10 10 10"
    //   },
    //   items: [
    //     upBtn,
    //     downBtn,
    //     { xtype: 'panel', border: false, html: '<i>to reorder</i>' }
    //   ]
    // })
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
        upBtn,
        downBtn,
        addBtn,
        removeBtn,
        { xtype: 'panel', border: false, html: '<i>or drag</i>' },
      ]
    })

    function handleSelections() {
      const sm = this.selModel
      if (sm.hasSelection()) {
        sm.suspendEvents()
        sm.clearSelections()
        sm.resumeEvents()
        SM.SetCheckboxSelModelHeaderState(sm)
      }
      const availableSelected = availableGrid.selModel.hasSelection()
      const selectionsSelected = selectionsGrid.selModel.hasSelection()
      addBtn.setDisabled(!availableSelected)
      removeBtn.setDisabled(!selectionsSelected)
    }

    async function initPanel(apiJob) {
      const apiAvailableTasks = await Ext.Ajax.requestPromise({
        responseType: 'json',
        url: `${STIGMAN.Env.apiBase}/jobs/tasks?elevate=${curUser.privileges.admin}`,
        method: 'GET'
      })

      // const [apiAvailableUsers, apiUserGroup] = await Promise.all(promises)
      const assignedTaskIds = apiJob?.tasks?.map(task => task.taskId) ?? []
      _this.originalTaskIds = assignedTaskIds
      const availableTasks = []
      const assignedTasks = []
      apiAvailableTasks.reduce((accumulator, task) => {
        const property = assignedTaskIds.includes(task.taskId) ? 'assignedTasks' : 'availableTasks'
        accumulator[property].push(task)
        return accumulator
      }, { availableTasks, assignedTasks })

      availableGrid.store.loadData(availableTasks)
      selectionsGrid.store.loadData(assignedTasks)
    }

    function fireSelectedChanged () {
      _this.fireEvent('selectedchanged', selectionsGrid.store.getRange().map( r => r.data.userId ))
    }

    function changeSelected(srcGrid, records, dstGrid) {
      srcGrid.store.suspendEvents()
      dstGrid.store.suspendEvents()
      srcGrid.store.remove(records)
      dstGrid.store.add(records)
      const { field, direction } = dstGrid.store.getSortState()
      dstGrid.store.sort(field, direction)
      dstGrid.getSelectionModel().selectRecords(records)
      srcGrid.store.resumeEvents()
      dstGrid.store.resumeEvents()

      srcGrid.store.fireEvent('datachanged', srcGrid.store)
      dstGrid.store.fireEvent('datachanged', dstGrid.store)
      srcGrid.store.fireEvent('update', srcGrid.store)
      dstGrid.store.fireEvent('update', dstGrid.store)
      dstGrid.store.filter(dstGrid.getView().getFilterFns())
      dstGrid.getView().focusRow(dstGrid.store.indexOfId(records[0].data.assetId))

      fireSelectedChanged ()
    }

    function getValue() {
      const records = selectionsGrid.store.snapshot?.items ?? selectionsGrid.store.getRange()
      return records.map(record => record.data.userId)
    }

    const config = {
      layout: 'hbox',
      layoutConfig: {
        align: 'stretch'
      },
      name: 'users',
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

  const schedulePanel = new SM.Job.SchedulePanel({
    border: false,
    iconCls: 'sm-job-event-icon',
    title: 'Schedule',
    cls: 'sm-round-panel',
  })

  const tasksPanel = new SM.Job.TaskSelectingPanel({
    border: false,
    iconCls: 'sm-job-task-icon',
    title: 'Tasks',
    cls: 'sm-round-panel',
  })
  tasksPanel.initPanel()

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
      tasksPanel,
      schedulePanel,
    ]
  })

  const thisTab = Ext.getCmp('main-tab-panel').add({
		id: 'job-admin-tab',
		sm_treePath: treePath, 
		iconCls: 'sm-job-icon',
		title: 'Service Jobs',
		closable:true,
		layout: 'border',
		border: false,
		items: [jobsGrid, jobTabPanel],
	})
	thisTab.show()
	jobsGrid.getStore().load()
}