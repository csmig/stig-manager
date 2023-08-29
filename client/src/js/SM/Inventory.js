Ext.ns('SM.Inventory')

// SM.Inventory.CsvItemsPerRowFieldSet = Ext.extend(Ext.form.FieldSet, {
SM.Inventory.CsvItemsPerRowFieldSet = Ext.extend(Ext.form.FormPanel, {
  initComponent: function () {
    const _this = this
    const numberField = new Ext.form.NumberField({
      fieldLabel: `Max NL-delimited ${this.itemName ?? 'items'}/row (0 = unlimited)`,
      value: this.initialValue ?? 253,
      width: 50,
      maxValue: 253,
      enableKeyEvents: true,
      // setItemName: function (name) {
      //   numberField.label.dom.innerHTML = `Max NL-delimited ${name}/row (0 = unlimited)`
      // },
      listeners: {
        keyup: function (field, event) {
          slider.suspendEvents()
          slider.setValue(this.getValue())
          slider.resumeEvents()
        }
      }
    })
    function setItemName(name) {
      _this.itemName = name
      numberField.label.dom.innerHTML = `Max NL-delimited ${_this.itemName}/row (0 = unlimited)`
    }
    const slider = new Ext.slider.SingleSlider({
      value: this.initialValue ?? 253,
      increment: 1,
      disabledClass: 'sm-disabled',
      minValue: 0,
      maxValue: 253,
      listeners: {
        change: function (slider, newValue) {
          numberField.suspendEvents()
          numberField.setValue(newValue)
          numberField.resumeEvents()
        }
      }
    })

    const config = {
      // header: false,
      // layout: 'form',
      border: false,
      labelWidth: 240,
      autoHeight: true,
      maskDisabled: false,
      setItemName,
      getValue: numberField.getValue.bind(numberField),
      items: [
        numberField,
        slider
      ]
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.Inventory.OptionsWindow = Ext.extend(Ext.Window, {
  initComponent: function () {
    const _this = this
    if (!this.collectionId) throw ('Missing collectionId')

    // Grouped by: and Format:
    const groupByRadioGroup = new Ext.form.RadioGroup({
      fieldLabel: 'Grouped by',
      columns: [70, 70],
      items: [
        {
          boxLabel: 'STIG',
          name: 'groupBy',
          groupBy: 'stig',
          itemField: 'asset',
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

    // CSV items per row, for group by asset or stig
    const itemsPerRowFieldSet = new SM.Inventory.CsvItemsPerRowFieldSet()

    // CSV fields for group by asset
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
    const stigsPerRowFieldSet = new SM.Inventory.CsvItemsPerRowFieldSet({ itemName: 'STIGs', itemField })
    const csvAssetFieldSet = new Ext.form.FieldSet({
      title: 'CSV fields',
      autoHeight: true,
      getFieldOptions: function () {
        const fields = assetCheckboxGroup.getValue().map(cb => ({property: cb.name, header: cb.boxLabel}))
        const itemsPerRow = stigsPerRowFieldSet.getValue()
        return { fields, itemsPerRow }
      },
      items: [
        assetCheckboxGroup,
        stigsPerRowFieldSet
      ]
    })

    // CSV fields for group by stig
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
    const assetsPerRowFieldSet = new SM.Inventory.CsvItemsPerRowFieldSet({ itemName: 'Assets' })
    const csvStigFieldSet = new Ext.form.FieldSet({
      title: 'CSV fields',
      autoHeight: true,
      getFieldOptions: function () {
        const fields = stigCheckboxGroup.getValue().map(cb => ({property: cb.name, header: cb.boxLabel}))
        const itemsPerRow = assetsPerRowFieldSet.getValue()
        return { fields, itemsPerRow }
      },
      items: [
        stigCheckboxGroup,
        assetsPerRowFieldSet
      ]
    })

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

    async function exportHandler() {
      try {
        const groupedBy = groupByRadioGroup.getValue().groupBy
        const format = formatRadioGroup.getValue().format
        const apiData = await fetchApiData(groupedBy)
        let downloadData = apiData // json will remain unchanged
        if (format === 'csv') {
          const fieldOptions = groupedBy === 'asset' ? csvAssetFieldSet.getFieldOptions() : csvStigFieldSet.getFieldOptions()
          downloadData = SM.Inventory.apiToCsv({ 
            apiData,
            fieldOptions
          })
        }
      }
      catch (e) {
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

    function handleSTIGCheckboxes() {
      exportButton.setDisabled(!benchmarkIdCheckbox.getValue() && !stigTitleCheckbox.getValue())
      assetsPerRowFieldSet.setDisabled(!assetNamesCheckBox.getValue())
    }
    function handleAssetCheckboxes() {
      exportButton.setDisabled(!nameCheckbox.getValue() && !fqdnCheckbox.getValue())
      stigsPerRowFieldSet.setDisabled(!stigBenchmarksCheckBox.getValue())

    }

    function updateDisplay() {
      if (formatRadioGroup.getValue().format === 'json') {
        csvAssetFieldSet.hide()
        csvStigFieldSet.hide()
      }
      else {
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

SM.Inventory.apiToCsv = function ({ itemField, apiData, fieldOptions }) {
  const delimitObjectArray = (array, property, size) => {
    let result = []
    for (let i = 0; i < array.length; i += size) {
      let chunk = array.slice(i, i + size).map( item => item[property])
      result.push(chunk.join('\n'))
    }
    return result
  }
  const properties = [], rows = []
  for (const field of fieldOptions.fields) {
    rows.push(field.header)
    properties.push(field.properties)
  }
  for (const member of apiData) {

    const scalarValues = []
    for (const property of properties) {
      const value = data[property]
      if (Array.isArray(value)) {

      }
      else {
        scalarValues.push(data[property])
      }
    }
    rows.rush(rowValues)
  }
}

SM.Inventory.codePen = function () {
  const apiData = [
    {
      "benchmarkId": "Microsoft_Access_2016",
      "title": "Microsoft Access 2016 Security Technical Implementation Guide",
      "revisionStr": "V1R1",
      "benchmarkDate": "2016-11-14",
      "revisionPinned": false,
      "ruleCount": 16,
      "assetCount": 24,
      "assets": [
        {
          "name": "Asset_Windows_0301",
          "assetId": "2007"
        },
        {
          "name": "Asset_Windows_0302-NA-dbInstance01",
          "assetId": "2008"
        },
        {
          "name": "Asset_Windows_0303",
          "assetId": "2009"
        },
        {
          "name": "Asset_Windows_0304",
          "assetId": "2010"
        },
        {
          "name": "Asset_Windows_0305",
          "assetId": "2011"
        },
        {
          "name": "Asset_Windows_0307",
          "assetId": "2012"
        },
        {
          "name": "Asset_Windows_0308",
          "assetId": "2013"
        },
        {
          "name": "Asset_Windows_0309",
          "assetId": "2014"
        },
        {
          "name": "Asset_Windows_0310",
          "assetId": "2015"
        },
        {
          "name": "Asset_Windows_0311",
          "assetId": "2016"
        },
        {
          "name": "Asset_Windows_0312",
          "assetId": "2017"
        },
        {
          "name": "Asset_Windows_0313",
          "assetId": "2018"
        },
        {
          "name": "Asset_Windows_0314",
          "assetId": "2019"
        },
        {
          "name": "Asset_Windows_0315",
          "assetId": "2020"
        },
        {
          "name": "Asset_Windows_0316",
          "assetId": "2021"
        },
        {
          "name": "Asset_Windows_0317",
          "assetId": "2022"
        },
        {
          "name": "Asset_Windows_0318",
          "assetId": "2023"
        },
        {
          "name": "Asset_Windows_0319",
          "assetId": "2024"
        },
        {
          "name": "Asset_Windows_0320",
          "assetId": "2025"
        },
        {
          "name": "Asset_Windows_0321",
          "assetId": "2026"
        },
        {
          "name": "Asset_Windows_0322",
          "assetId": "2027"
        },
        {
          "name": "Asset_Windows_0323",
          "assetId": "2028"
        },
        {
          "name": "Asset_Windows_0324",
          "assetId": "2029"
        },
        {
          "name": "Asset_Windows_0325",
          "assetId": "2030"
        }
      ]
    }
  ]
  const csvFields = [
    {apiProperty: 'title', header: 'Title'},
    {apiProperty: 'revisionStr', header: 'Revision'},
    {apiProperty: 'benchmarkDate', header: 'Date'},
    {apiProperty: 'assets', header: 'Assets', delimitedProperty: 'name', delimiter: ', ', size: 1},
  ]
  
  const delimitObjectArrayByProperty = (array, property, size, delimiter) => {
    let result = []
    for (let i = 0; i < array.length; i += size) {
      let chunk = array.slice(i, i + size).map( item => `"${item[property].replace(/"/g,'""')}"`)
      result.push(chunk.join(delimiter))
    }
    return result
  }
  
  const csvData = []
  for (const data of apiData) {
    const obj = {}
    for (const field of csvFields) {
      if (Array.isArray(data[field.apiProperty])) {
        obj[field.header] = delimitObjectArrayByProperty(data[field.apiProperty], field.delimitedProperty, field.size, field.delimiter)
      }
      else {
        obj[field.header] = `"${data[field.apiProperty].replace(/"/g,'""')}"`   
      }
    }
    csvData.push(obj)
  }
  console.log(JSON.stringify(csvData, null, 2))
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