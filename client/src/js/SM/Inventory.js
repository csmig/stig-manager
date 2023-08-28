Ext.ns('SM.Inventory')

SM.Inventory.OptionsWindow = Ext.extend(Ext.Window, {
  initComponent: function () {
    const _this = this
    if (!this.collectionId) throw ('Missing collectionId')
    const groupByRadioGroup = new Ext.form.RadioGroup({
      fieldLabel: 'Grouped by',
      columns: [70, 70],
      items: [
        {
          boxLabel: 'STIG',
          name: 'groupBy',
          groupBy: 'stig',
          checked: true
        },
        {
          boxLabel: 'Asset',
          name: 'groupBy',
          groupBy: 'asset'
        }
      ],
      listeners: {
        change: updateDisplay
      }
    })
    const formatRadioGroup = new Ext.form.RadioGroup({
      fieldLabel: 'Format',
      columns: [70, 70],
      items: [
        {
          boxLabel: 'CSV',
          name: 'format',
          format: 'csv',
          checked: true
        },
        {
          boxLabel: 'JSON',
          name: 'format',
          format: 'json'
        }
      ],
      listeners: {
        change: updateDisplay
      }
    })
    const nameCheckbox = new Ext.form.Checkbox({
      boxLabel: 'Name',
      name: 'name',
      checked: true,
      listeners: {
        check: handleAssetCheckboxes
      }
    })
    const fqdnCheckbox = new Ext.form.Checkbox({
      boxLabel: 'FQDN',
      name: 'fqdn',
      checked: true,
      listeners: {
        check: handleAssetCheckboxes
      }
    })
    const ipCheckbox = new Ext.form.Checkbox({
      boxLabel: 'IP',
      name: 'ip',
      checked: true,
      listeners: {
        check: handleAssetCheckboxes
      }
    })
    const macCheckbox = new Ext.form.Checkbox({
      boxLabel: 'MAC',
      name: 'ip',
      checked: true,
      listeners: {
        check: handleAssetCheckboxes
      }
    })
    const descriptionCheckBox = new Ext.form.Checkbox({
      boxLabel: 'Description',
      name: 'description',
      checked: true,
      listeners: {
        check: handleAssetCheckboxes
      }
    })
    const stigBenchmarksCheckBox = new Ext.form.Checkbox({
      boxLabel: 'STIGs',
      name: 'stigs',
      checked: true,
      listeners: {
        check: handleAssetCheckboxes
      }
    })
    const assetCheckboxGroup = new Ext.form.CheckboxGroup({
      // fieldLabel: 'Asset fields',
      hideLabel: true,
      columns: [70, 70, 50, 60, 100, 60],
      items: [
          nameCheckbox,
          fqdnCheckbox,
          ipCheckbox,
          macCheckbox,
          descriptionCheckBox,
          stigBenchmarksCheckBox
      ]
    })

    const benchmarkIdCheckbox = new Ext.form.Checkbox({
      boxLabel: 'Benchmark',
      name: 'benchmarkId',
      checked: true,
      listeners: {
        check: handleSTIGCheckboxes
      }
    })
    const stigTitleCheckbox = new Ext.form.Checkbox({
      boxLabel: 'Title',
      name: 'title',
      checked: true,
      listeners: {
        check: handleSTIGCheckboxes
      }
    })
    const revisionCheckbox = new Ext.form.Checkbox({
      boxLabel: 'Revision',
      name: 'revisionStr',
      checked: true,
      listeners: {
        check: handleSTIGCheckboxes
      }
    })
    const dateCheckbox = new Ext.form.Checkbox({
      boxLabel: 'Date',
      name: 'benchmarkDate',
      checked: true,
      listeners: {
        check: handleSTIGCheckboxes
      }
    })
    const assetNamesCheckBox = new Ext.form.Checkbox({
      boxLabel: 'Assets',
      name: 'assets',
      checked: true,
      listeners: {
        check: handleSTIGCheckboxes
      }
    })

    const stigCheckboxGroup = new Ext.form.CheckboxGroup({
      hideLabel: true,
      columns: [100, 70, 85, 70, 70],
      items: [
          benchmarkIdCheckbox,
          stigTitleCheckbox,
          revisionCheckbox,
          dateCheckbox,
          assetNamesCheckBox
      ]
    })
    const assetsPerRowSlider = new Ext.form.SliderField({
      fieldLabel: 'Max NL-delimited Assets/row<',
      value: 253,
      increment: 1,
      minValue: 0,
      maxValue: 253,
    })
    assetsPerRowSlider.slider.on('change', function(slider, newValue) {
      assetsPerRowSlider.label.dom.innerHTML = `Max NL-delimited Assets/row: <b>${newValue}</b>`
    })

    const csvAssetFieldSet = new Ext.form.FieldSet({
      title: 'CSV fields',
      autoHeight: true,
      items: [
        assetCheckboxGroup
      ]

    })
    const csvStigFieldSet = new Ext.form.FieldSet({
      title: 'CSV fields',
      labelWidth: 190,
      autoHeight: true,
      items: [
        stigCheckboxGroup,
        assetsPerRowSlider
      ]
    })

    const csvPreviewFieldSet = new Ext.form.FieldSet({
      title: 'Preview',
      autoHeight: true,
      collapsible: true,
      collapsed: true,
      items: [
      ]
    })
    const jsonPreviewFieldSet = new Ext.form.FieldSet({
      title: 'Preview',
      autoHeight: true,
      collapsible: true,
      collapsed: true,
      items: [
      ]
    })

    function getValues() {
      return {
        benchmarkId: benchmarkIdCheckbox.getValue(),
        title: stigTitleCheckbox.getValue(),
        revisionStr: revisionCheckbox.getValue(),
        assetsPerRow: assetsPerRowSlider.getValue()
      }
    }

    async function fetchApiData(groupBy, queryParams = {}) {
      const requests = {
        asset: {
          url: `${STIGMAN.Env.apiBase}/assets`,
          params: {
            collectionId: _this.collectionId,
            projection: 'stigs'
          }
        },
        stig: {
          url: `${STIGMAN.Env.apiBase}/collections/${_this.collectionId}/stigs`,
          params: {
            projection: 'assets'
          }
        }
      }
      const apiData = await Ext.Ajax.requestPromise({
        responseType: 'json',
        method: 'GET',
        url: requests[groupBy].url,
        params: requests[groupBy].params
      })
      return apiData
    } 

    async function exportHandler () {
      try {
        const groupedBy = groupByRadioGroup.getValue().groupBy
        const format = formatRadioGroup.getValue().format
        const apiData = await fetchApiData(groupedBy)
        let downloadData = apiData // json will remain unchanged
        if (format === 'csv') {
          downloadData = SM.Inventory.apiToCsv({groupedBy, apiData, fieldOptions: getValues()})
        }
      }
      catch(e) {
        SM.Error.handleError(e)
      }
      finally {
        _this.close()
      }
    }

    const exportButton = new Ext.Button({
      text: 'Export',
      iconCls: 'sm-export-icon',
      disabled: false,
      handler: exportHandler
    })

    function handleSTIGCheckboxes () {
      exportButton.setDisabled(!benchmarkIdCheckbox.getValue() && !stigTitleCheckbox.getValue())
      assetsPerRowSlider.setVisible(assetNamesCheckBox.getValue())
    }
    function handleAssetCheckboxes () {
      exportButton.setDisabled(!nameCheckbox.getValue() && !fqdnCheckbox.getValue())
    }

    function updateDisplay() {
      if (formatRadioGroup.getValue().format === 'json') {
        csvAssetFieldSet.hide()
        csvPreviewFieldSet.hide()
        csvStigFieldSet.hide()
        jsonPreviewFieldSet.show()
      }
      else {
        jsonPreviewFieldSet.hide()
        csvPreviewFieldSet.show()
        if (groupByRadioGroup.getValue().groupBy === 'stig') {
          csvAssetFieldSet.hide()
          csvStigFieldSet.show()
          handleSTIGCheckboxes()
        }
        else {
          csvAssetFieldSet.show()
          csvStigFieldSet.hide()
          handleAssetCheckboxes()
        }
      }
    }

    const config = {
      layout: 'form',
      padding: 10,
      items: [
        groupByRadioGroup,
        formatRadioGroup,
        csvAssetFieldSet,
        csvStigFieldSet
      ],
      buttons: [exportButton],
      listeners: {
        beforeshow: updateDisplay
      }
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.Inventory.apiToCsv = function ({groupedBy, apiData, fieldOptions}) {
  const one = 1
}

SM.Inventory.showInventoryDownloadOptions = function (collectionId) {
  const optionsWindow = new SM.Inventory.OptionsWindow({
    title: 'Export options',
    modal: true,
    width: 460,
    collectionId
  })
  optionsWindow.show()
}