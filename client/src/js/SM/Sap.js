Ext.ns('SM.SAP')

SM.SAP.optionsWindow = Ext.extend(Ext.Window, {
  initComponent: function () {
    const _this = this
    const benchmarkIdCheckbox = new Ext.form.Checkbox({
      boxLabel: 'Benchmark',
      name: 'benchmarkId',
      checked: true,
      listeners: {
        check: handleInput
      }
    })
    const stigTitleCheckbox = new Ext.form.Checkbox({
      boxLabel: 'STIG title',
      name: 'benchmarkId',
      checked: true,
      listeners: {
        check: handleInput
      }
    })
    const assetNamesCheckbox = new Ext.form.Checkbox({
      boxLabel: 'Asset names',
      name: 'assetNames',
      checked: true,
      listeners: {
        check: handleInput
      }
    })
    const checkboxGroup = new Ext.form.CheckboxGroup({
      fieldLabel: 'Columns',
      items: [
          benchmarkIdCheckbox,
          stigTitleCheckbox,
          assetNamesCheckbox
      ]
    })
    const exportButton = new Ext.Button({
      text: 'Download',
      iconCls: 'sm-export-icon',
      disabled: false,
      handler: function () {
        _this.close()
      }
    })

    function handleInput () {

    }

    const config = {
      title: 'SAP CSV options',
      layout: 'form',
      items: checkboxGroup,
      buttons: [exportButton]
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.SAP.showSAPOptions = function (collectionId) {
  const sapWindow = new SM.SAP.optionsWindow({
    modal: true,
    width: 400
  })
  sapWindow.show(document.body)
}