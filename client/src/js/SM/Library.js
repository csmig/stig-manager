Ext.ns("SM.Library")

SM.Library.ChecklistGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const _this = this
    this.benchmarkId = this.benchmarkId || 'RHEL_8_STIG'
    this.revisionStr = this.revisionStr || 'latest'
    const title = this.stigTitle
    const fields = [
      {
        name: 'version',
        type: 'string'
      },
      {
        name: 'groupId',
        type: 'string',
        sortType: sortGroupId
      },
      {
        name: 'ruleId',
        type: 'string',
        sortType: sortRuleId
      },
      {
        name: 'groupTitle',
        type: 'string'
      },
      {
        name: 'title',
        type: 'string',
      },
      {
        name: 'severity',
        type: 'string',
        sortType: sortSeverity
      },
      {
        name: 'check',
        mapping: 'checks[0]?.content'
      },
      {
        name: 'fix',
        mapping: 'fixes[0]?.text'
      },
      {
        name: 'discussion',
        mapping: 'detail.vulnDiscussion'
      }
    ]
    const exportBtn = new Ext.ux.ExportButton({
      hasMenu: false,
      exportType: 'grid',
      gridBasename: 'STIG',
      iconCls: 'sm-export-icon',
      text: 'CSV',
      gridSource: this
    })
    const store = new Ext.data.JsonStore({
      fields,
      root: '',
      idProperty: 'ruleId',
      sortInfo: {
        field: 'ruleId',
        direction: 'ASC'
      },
      listeners: {
        load: function (store, records) {
          _this.getSelectionModel().selectFirstRow()
          totalTextItem.setText(`${store.getCount()} records`)
        },
        reload: function (store, records) {
          _this.getSelectionModel().selectFirstRow()
          totalTextItem.setText(`${store.getCount()} records`)
        }
      }
    })
    const totalTextItem = new SM.RowCountTextItem({ store: store })
    const ruleTitleColumnId = Ext.id()
    const columns = [
      {
        header: "CAT",
        fixed: true,
        width: 48,
        align: 'left',
        dataIndex: 'severity',
        sortable: true,
        renderer: renderSeverity,
        filter: {
          type: 'values',
          comparer: SM.ColumnFilters.CompareFns.severity,
          renderer: SM.ColumnFilters.Renderers.severity
        }
      },
      {
        header: "STIG Id",
        width: 150,
        dataIndex: 'version',
        sortable: true,
        align: 'left',
        renderer: (v, attrs) => {
          attrs.css = 'sm-direction-rtl'
          return v
        },
        filter: { type: 'string' }
      },
      {
        header: "Group Id",
        width: 75,
        dataIndex: 'groupId',
        sortable: true,
        align: 'left',
        filter: { type: 'string' }
      },
      {
        header: "Group Title",
        width: 200,
        dataIndex: 'groupTitle',
        renderer: columnWrap,
        sortable: true,
        // hidden: true,
        filter: { type: 'string' }
      },
      {
        header: "Rule Id",
        width: 150,
        dataIndex: 'ruleId',
        sortable: true,
        align: 'left',
        // hidden: true,
        filter: { type: 'string' }
      },
      {
        id: ruleTitleColumnId,
        header: "Rule Title",
        width: 300,
        dataIndex: 'title',
        renderer: columnWrap,
        sortable: true,
        filter: { type: 'string' }
      },
      {
        header: "Check",
        width: 300,
        dataIndex: 'check',
        renderer: columnWrap,
        sortable: true,
        filter: { type: 'string' }
      },
      {
        header: "Fix",
        width: 300,
        dataIndex: 'fix',
        renderer: columnWrap,
        sortable: true,
        filter: { type: 'string' }
      },
      {
        header: "Discussion",
        width: 300,
        dataIndex: 'discussion',
        renderer: columnWrap,
        sortable: true,
        filter: { type: 'string' }
      }
    ]
    const view = new SM.ColumnFilters.GridView({
      emptyText: this.emptyText || 'No records to display',
      deferEmptyText: false,
      forceFit: true,
      rowOverCls: 'sm-null',
      selectedRowClass: 'sm-null',
      listeners: {
        filterschanged: function (view, item, value) {
          store.filter(view.getFilterFns())
        }
      }
    })
    const revisionStore = new Ext.data.JsonStore({
      fields: [
        "benchmarkId",
        "revisionStr",
        "version",
        "release",
        "benchmarkDate",
        "status",
        "statusDate",
        { name: 'display', convert: (v, r) => `Version ${r.version} Release ${r.release} (${r.benchmarkDate})` }
      ],
      url: `${STIGMAN.Env.apiBase}/stigs/${_this.benchmarkId}/revisions`
    })
    const revisionComboBox = new Ext.form.ComboBox({
      store: revisionStore,
      displayField: 'display',
      valueField: 'revisionStr',
      triggerAction: 'all',
      mode: 'local',
      editable: false,
      listeners: {
        select: function (combo, record, index) {
          _this.revisionStr = combo.getValue()
          _this.loadStig()
        }
      }
    })
    const tbar = new Ext.Toolbar({
      items: ['Revision', revisionComboBox]
    })
    const bbar = new Ext.Toolbar({
      items: [
        exportBtn,
        '->',
        totalTextItem
      ]
    })

    async function getStig(benchmarkId, revisionStr) {
      let result = await Ext.Ajax.requestPromise({
        url: `${STIGMAN.Env.apiBase}/stigs/${benchmarkId}/revisions/${revisionStr}/rules`,
        method: 'GET',
        params: {
          projection: ['checks', 'fixes', 'detail']
        }
      })
      return JSON.parse(result.response.responseText)
    }

    this.loadStig = async function (benchmarkId = _this.benchmarkId, revisionStr = _this.revisionStr || 'latest') {
      try {
        exportBtn.gridBasename = benchmarkId
        _this.benchmarkId = benchmarkId
        _this.getEl().mask('Please wait')
        const apiStig = await getStig(benchmarkId, revisionStr)
        store.loadData(apiStig)
      }
      catch (e) {
        console.error(e.message)
      }
      finally {
        _this.getEl().unmask()
      }
    }
    this.loadRevisions = async function (benchmarkId = _this.benchmarkId, revisionStr = _this.revisionStr) {
      try {
        await revisionStore.loadPromise()
        revisionComboBox.setValue(revisionStr)
      }
      catch (e) {
        console.error(e.message)
      }
    }
    const config = {
      title,
      store,
      columns,
      view,
      tbar,
      bbar,
      autoExpandColumn: ruleTitleColumnId,
      stripeRows: true,
      loadMask: { msg: '' }
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    SM.Library.ChecklistGrid.superclass.initComponent.call(this);
  }
})

SM.Library.RuleContentPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const config = {
      padding: 20,
      autoScroll: true,
      title: 'Rule',
      tpl: SM.RuleContentTpl
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    SM.Library.RuleContentPanel.superclass.initComponent.call(this);
  }
})

SM.Library.StigPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const _this = this
    const checklistGrid = new SM.Library.ChecklistGrid({
      benchmarkId: this.benchmarkId,
      revisionStr: this.revisionStr || 'latest',
      stigTitle: this.stigTitle,
      cls: 'sm-round-panel',
      margins: { top: SM.Margin.top, right: SM.Margin.adjacent, bottom: SM.Margin.bottom, left: SM.Margin.edge },
      border: false,
      region: 'center'
    })
    // const ruleContentPanel = new SM.Library.RuleContentPanel({
    //   cls: 'sm-round-panel',
    //   margins: { top: SM.Margin.top, right: SM.Margin.edge, bottom: SM.Margin.bottom, left: SM.Margin.adjacent },
    //   border: false,
    //   region: 'east',
    //   split: true,
    //   collapsible: true,
    //   width: 400
    // })
    this.load = async function () {
      await checklistGrid.loadStig(this.benchmarkId)
      await checklistGrid.loadRevisions(this.benchmarkId)
    }
    async function onRowSelect(cm, index, record) {
      try {
        const contentReq = await Ext.Ajax.requestPromise({
          url: `${STIGMAN.Env.apiBase}/stigs/rules/${record.data.ruleId}`,
          method: 'GET',
          params: {
            projection: ['detail', 'ccis', 'checks', 'fixes']
          }
        })
        let content = JSON.parse(contentReq.response.responseText)
        // ruleContentPanel.update(content)
        // ruleContentPanel.setTitle('Rule for Group ' + record.data.groupId)
      }
      catch (e) {
        console.log(e)
        alert(e.message)
      }
    }
    checklistGrid.getSelectionModel().on('rowselect', onRowSelect)
    const config = {
      iconCls: 'sm-stig-icon',
      closable: true,
      layout: 'border',
      layoutConfig: {
        targetCls: 'sm-border-layout-ct'
      },
      items: [
        checklistGrid,
        // ruleContentPanel
      ]
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    SM.Library.RuleContentPanel.superclass.initComponent.call(this)
  }
})

SM.Library.DiffSelectForm = Ext.extend(Ext.form.FormPanel, {
  initComponent: function () {
    const _this = this

    const stigSelectionField = new SM.StigSelectionField({
      autoLoad: false,
      name: 'benchmarkId',
      submitValue: false,
      fieldLabel: 'BenchmarkId',
      hideTrigger: false,
      anchor: '100%',
      allowBlank: false,
      listeners: {
        select: this.onStigSelect || function () { }
      }
    })
    stigSelectionField.store.loadData(this.apiStigs)

    const config = {
      items: [
        stigSelectionField
      ]
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.Library.DiffRulesGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const _this = this

    const fields = [
      'stigId', 'lRuleId', 'rRuleId', 'unified', 'checkUpdated'
    ]
    const columns = [
      {
        header: "STIG Id",
        width: 175,
        dataIndex: 'stigId',
        sortable: true,
        filter: { type: 'string' }
      },
      {
        header: 'Left rule',
        width: 175,
        dataIndex: 'lRuleId',
        sortable: true,
        filter: { type: 'string' }
      },
      {
        header: 'Right rule',
        width: 175,
        dataIndex: 'rRuleId',
        sortable: true,
        filter: { type: 'string' }
      },
      {
        header: 'New check?',
        width: 100,
        align: 'center',
        dataIndex: 'checkUpdated',
        sortable: true,
        renderer: function (value) {
					return value ? 'x' : ''
				}

      }

    ]
    const store = new Ext.data.JsonStore({
      grid: this,
      root: '',
      fields,
      idProperty: 'stigId',
      sortInfo: {
        field: 'stigId',
        direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
      }
    })
    const config = {
      layout: 'fit',
      loadMask: { msg: '' },
      store,
      cm: new Ext.grid.ColumnModel({
        columns
      }),
      sm: new Ext.grid.RowSelectionModel({
        singleSelect: true,
        listeners: {
          rowselect: this.onRowSelect || function () { }
        }
      }),
      view: new SM.ColumnFilters.GridView({
        emptyText: this.emptyText || 'No records to display',
        deferEmptyText: false,
        forceFit: true,
        listeners: {
          filterschanged: function (view, item, value) {
            store.filter(view.getFilterFns())
          }
        }
      })
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.Library.DiffContentPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const _this = this
    const config = {
      autoScroll: true
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.Library.DiffPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const _this = this

    function DiffObj(lhs, rhs) {
      const ruleProps = [
        'ruleId',
        'title',
        'groupId',
        'groupTitle',
        'severity',
      ]
      const detailProps = [
        "weight",
        "mitigations",
        "documentable",
        "falseNegatives",
        "falsePositives",
        "responsibility",
        "vulnDiscussion",
        "thirdPartyTools",
        "potentialImpacts",
        "mitigationControl",
        "severityOverrideGuidance"
      ]
      const checkProps = [
        'checkId',
        'content'
      ]
      const fixProps = [
        'fixId',
        'text'
      ]

      const obj = {}
      const data = []
      for (const rule of lhs) {
        const value = obj[rule.version] ?? {}
        value.lhs = rule
        obj[rule.version] = value
      }
      for (const rule of rhs) {
        const value = obj[rule.version] ?? {}
        value.rhs = rule
        obj[rule.version] = value
      }
      for (const [key, value] of Object.entries(obj)) {
        const dataItem = {
          stigId: key,
          lRuleId: value.lhs?.ruleId,
          rRuleId: value.rhs?.ruleId,
          checkUpdated: false
        }
        const diffOptions = {
          context: 999,
          newlineIsToken: true
        }
        let fullUnified = ''
        let lhsStr, rhsStr
        for (const prop of ruleProps) {
          lhsStr = value.lhs?.[prop] ?? ''
          rhsStr = value.rhs?.[prop] ?? ''
          fullUnified += Diff.createPatch(prop, lhsStr, rhsStr, undefined, undefined, diffOptions)
        }

        for (const prop of detailProps) {
          lhsStr = value.lhs?.detail[prop] ?? ''
          rhsStr = value.rhs?.detail[prop] ?? ''
          fullUnified += Diff.createPatch(prop, lhsStr, rhsStr, undefined, undefined, diffOptions)
        }

        for (let x = 0, l = Math.max(value.lhs?.checks.length ?? 0, value.rhs?.checks.length ?? 0); x < l; x++) {
          for (const prop of checkProps) {
            lhsStr = value.lhs?.checks[x][prop] ?? ''
            rhsStr = value.rhs?.checks[x][prop] ?? ''
            const thisUnified = Diff.createPatch(`check-${x}.${prop}`, lhsStr, rhsStr, undefined, undefined, diffOptions) 
            if (prop === 'content' && thisUnified) {
              dataItem.checkUpdated = true
            }
            fullUnified += thisUnified
          }
        }

        for (let x = 0, l = Math.max(value.lhs?.fixes.length ?? 0, value.rhs?.fixes.length ?? 0); x < l; x++) {
          for (const prop of fixProps) {
            lhsStr = value.lhs?.fixes[x][prop] ?? ''
            rhsStr = value.rhs?.fixes[x][prop] ?? ''
            fullUnified += Diff.createPatch(`fix-${x}.${prop}`, lhsStr, rhsStr, undefined, undefined, diffOptions)
          }
        }

        if (fullUnified) {
          dataItem.unified = fullUnified
          data.push(dataItem)
        }

      }
      return data
    }

    const onStigSelect = async function (combo, record, index) {
      const benchmarkId = record.data.benchmarkId
      const revisionStrs = record.data.revisionStrs
      const l = revisionStrs.length
      const rhRevisionStr = revisionStrs[l - 1]
      const lhRevisionStr = revisionStrs[l - 2]

      const rhResult = await Ext.Ajax.requestPromise({
        url: `${STIGMAN.Env.apiBase}/stigs/${benchmarkId}/revisions/${rhRevisionStr}/rules`,
        method: 'GET',
        params: {
          projection: ['checks', 'fixes', 'detail']
        }
      })
      const rhs = JSON.parse(rhResult.response.responseText)

      const lhResult = await Ext.Ajax.requestPromise({
        url: `${STIGMAN.Env.apiBase}/stigs/${benchmarkId}/revisions/${lhRevisionStr}/rules`,
        method: 'GET',
        params: {
          projection: ['checks', 'fixes', 'detail']
        }
      })
      const lhs = JSON.parse(lhResult.response.responseText)

      _this.diffObj = DiffObj(lhs, rhs)

      diffRulesGrid.store.loadData(_this.diffObj)

    }

    const onRowSelect = function ( sm, index, record) {
      // const dom = diffContentPanel.getEl().dom
      const configuration = {
        drawFileList: false,
        matching: 'lines',
        diffStyle: 'word'
      }
      const html = Diff2Html.html(record.data.unified, configuration)
      diffContentPanel.update(html)
      // let diff2htmlUi = new Diff2HtmlUI(dom, record.data.unified, configuration)
      // diff2htmlUi.draw()
    }

    const diffSelectForm = new SM.Library.DiffSelectForm({
      region: 'north',
      height: 100,
      split: true,
      apiStigs: this.multiRevisionStigs,
      onStigSelect
    })

    const diffRulesGrid = new SM.Library.DiffRulesGrid({
      region: 'center',
      onRowSelect 
    })

    const diffContentPanel = new SM.Library.DiffContentPanel({
      region: 'center'
    })

    const config = {
      layout: 'border',
      items: [
        diffContentPanel,
        {
          region: 'west',
          width: 500,
          split: true,
          layout: 'border',
          items: [
            diffSelectForm,
            diffRulesGrid
          ]
        }
      ]
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.Library.showDiffPanel = async function (options) {

  const { treePath, multiRevisionStigs = [] } = options
  const tab = Ext.getCmp('main-tab-panel').getItem(`stig-diff`)
  if (tab) {
    Ext.getCmp('main-tab-panel').setActiveTab(tab.id)
    return
  }

  const diffPanel = new SM.Library.DiffPanel({
    title: 'Compare STIG Revisions',
    closable: true,
    iconCls: 'sm-diff-icon',
    multiRevisionStigs
  })

  SM.AddPanelToMainTab(diffPanel, 'permanent')
}