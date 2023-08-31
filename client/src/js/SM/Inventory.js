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

SM.Inventory.ArrayDelimiterComboBox = Ext.extend(Ext.form.ComboBox, {
	initComponent: function () {
		const _this = this
		let config = {
			width: 120,
			forceSelection: true,
			editable: false,
			mode: 'local',
			triggerAction: 'all',
			displayField: 'display',
			valueField: 'delimiter',
			store: new Ext.data.SimpleStore({
				fields: ['display', 'delimiter'],
				data: [['Comma', ','], ['Comma and space', ', '], ['Newline', '\n']]
			}),
      value: this.value || ','
		}
		Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
	}
})

SM.Inventory.OptionsWindow = Ext.extend(Ext.Window, {
  initComponent: function () {
    const _this = this
    if (!this.collectionId) throw ('Missing collectionId')

    // Group by: and Format:
    const groupByRadioGroup = new Ext.form.RadioGroup({
      fieldLabel: 'Group by',
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

    // CSV fields for group by asset
    const nameCheckbox = new Ext.form.Checkbox({
      boxLabel: 'Name',
      csvField: {
        apiProperty: 'name',
        header: 'Name'
      },
      checked: true,
      listeners: {
        check: handleAssetCheckboxes
      }
    })
    const fqdnCheckbox = new Ext.form.Checkbox({
      boxLabel: 'FQDN',
      csvField: {
        apiProperty: 'fqdn',
        header: 'FQDN'
      },
      checked: true,
      listeners: {
        check: handleAssetCheckboxes
      }
    })
    const ipCheckbox = new Ext.form.Checkbox({
      boxLabel: 'IP',
      csvField: {
        apiProperty: 'ip',
        header: 'IP'
      },
      checked: true,
      listeners: {
        check: handleAssetCheckboxes
      }
    })
    const macCheckbox = new Ext.form.Checkbox({
      boxLabel: 'MAC',
      csvField: {
        apiProperty: 'mac',
        header: 'MAC'
      },
      checked: true,
      listeners: {
        check: handleAssetCheckboxes
      }
    })
    const descriptionCheckBox = new Ext.form.Checkbox({
      boxLabel: 'Description',
      csvField: {
        apiProperty: 'description',
        header: 'Description'
      },
      checked: true,
      listeners: {
        check: handleAssetCheckboxes
      }
    })
    const stigBenchmarksCheckBox = new Ext.form.Checkbox({
      boxLabel: 'STIGs',
      csvField: {
        apiProperty: 'stigs',
        header: 'STIGs',
        delimitedProperty: 'benchmarkId',
        delimiter: ','
      },
      checked: true,
      listeners: {
        check: handleAssetCheckboxes
      }
    })
    const assetCheckboxGroup = new Ext.form.CheckboxGroup({
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
    const stigsDelimiterComboBox = new SM.Inventory.ArrayDelimiterComboBox({
      fieldLabel: 'STIGs delimited by',
      listeners: {
        select: function (cb) {
          stigBenchmarksCheckBox.csvField.delimiter = cb.getValue()
        }
      }
    })
    const csvAssetFieldSet = new Ext.form.FieldSet({
      title: 'CSV fields',
      labelWidth: 120,
      autoHeight: true,
      getFieldOptions: function () {
        return assetCheckboxGroup.getValue().map(cb => cb.csvField)
      },
      items: [
        assetCheckboxGroup,
        stigsDelimiterComboBox
      ]
    })

    // CSV fields for group by stig
    const benchmarkIdCheckbox = new Ext.form.Checkbox({
      boxLabel: 'Benchmark',
      csvField: {
        apiProperty: 'benchmarkId',
        header: 'Benchmark'
      },
      checked: true,
      listeners: {
        check: handleSTIGCheckboxes
      }
    })
    const stigTitleCheckbox = new Ext.form.Checkbox({
      boxLabel: 'Title',
      csvField: {
        apiProperty: 'title',
        header: 'Title'
      },
      checked: true,
      listeners: {
        check: handleSTIGCheckboxes
      }
    })
    const revisionCheckbox = new Ext.form.Checkbox({
      boxLabel: 'Revision',
      csvField: {
        apiProperty: 'revisionStr',
        header: 'Revision'
      },
      checked: true,
      listeners: {
        check: handleSTIGCheckboxes
      }
    })
    const dateCheckbox = new Ext.form.Checkbox({
      boxLabel: 'Date',
      csvField: {
        apiProperty: 'benchmarkDate',
        header: 'Date'
      },
      checked: true,
      listeners: {
        check: handleSTIGCheckboxes
      }
    })
    const assetNamesCheckBox = new Ext.form.Checkbox({
      boxLabel: 'Assets',
      csvField: {
        apiProperty: 'assets',
        header: 'Assets',
        delimitedProperty: 'name',
        delimiter: ','
      },
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
    const assetsDelimiterComboBox = new SM.Inventory.ArrayDelimiterComboBox({
      fieldLabel: 'Assets delimited by',
      listeners: {
        select: function (cb) {
          assetNamesCheckBox.csvField.delimiter = cb.getValue()
        }
      }
    })
    const csvStigFieldSet = new Ext.form.FieldSet({
      title: 'CSV fields',
      labelWidth: 120,
      autoHeight: true,
      getFieldOptions: function () {
        return stigCheckboxGroup.getValue().map(cb => cb.csvField)
      },
      items: [
        stigCheckboxGroup,
        assetsDelimiterComboBox
      ]
    })

    // Button
    const exportButton = new Ext.Button({
      text: 'Export',
      iconCls: 'sm-export-icon',
      disabled: false,
      handler: exportHandler
    })

    // Functions
    async function fetchApiDataAsText(groupBy, queryParams = {}) {
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
      const result = await Ext.Ajax.requestPromise({
        method: 'GET',
        url: requests[groupBy].url,
        params: requests[groupBy].params
      })
      return result.response.responseText
    }

    async function exportHandler() {
      try {
        _this.getEl().mask('')
        const groupItem = groupByRadioGroup.getValue()
        const formatItem = formatRadioGroup.getValue()
        const apiText = await fetchApiDataAsText(groupItem.groupBy)
        let downloadData
        if (formatItem.format === 'csv') {
          const csvFields = groupItem.groupBy === 'asset' ? csvAssetFieldSet.getFieldOptions() : csvStigFieldSet.getFieldOptions()
          downloadData = new Blob([SM.Inventory.apiToCsv(JSON.parse(apiText), csvFields)])
        }
        else {
          downloadData = new Blob([apiText])
        }
        const timestamp = Ext.util.Format.date((new Date), 'Y-m-d_His')
        saveAs(downloadData, `${_this.collectionName}_InventoryBy${groupItem.boxLabel}_${timestamp}.${formatItem.format}`)
      }
      catch (e) {
        SM.Error.handleError(e)
      }
      finally {
        _this.close()
      }
    }

    function handleSTIGCheckboxes() {
      exportButton.setDisabled(!benchmarkIdCheckbox.getValue() && !stigTitleCheckbox.getValue())
      assetsDelimiterComboBox.setDisabled(!assetNamesCheckBox.getValue())
    }

    function handleAssetCheckboxes() {
      exportButton.setDisabled(!nameCheckbox.getValue() && !fqdnCheckbox.getValue())
      stigsDelimiterComboBox.setDisabled(!stigBenchmarksCheckBox.getValue())

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

SM.Inventory.apiToCsv = function (apiData, csvFields) {
  const quotify = (string) => {
    return `"${string.replace(/"/g,'""')}"`
  }
  
  const csvData = []
  // Header
  const header = []
  for (const field of csvFields) {
    header.push(quotify(field.header))
  }
  csvData.push(header.join(','))
  
  // Data
  for (const data of apiData) {
    const row = []
    for (const field of csvFields) {
      if (field.delimiter) {
        row.push(quotify(data[field.apiProperty].map(i => i[field.delimitedProperty]).join(field.delimiter)))
      }
      else {
        row.push(quotify(data[field.apiProperty] ?? ''))
      }
    }
    csvData.push(row.join(','))
  }
   return csvData.join('\n')
}

SM.Inventory.showInventoryExportOptions = function (collectionId, collectionName) {
  const optionsWindow = new SM.Inventory.OptionsWindow({
    title: 'Inventory export options',
    modal: true,
    width: 460,
    collectionId,
    collectionName
  })
  optionsWindow.show()
}