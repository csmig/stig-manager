Ext.ns('SM.SAP')

SM.SAP.optionsWindow = Ext.extend(Ext.Window, {
  initComponent: function () {
    const _this = this
    if (!this.collectionId) throw ('Missing collectionId')
    const benchmarkIdCheckbox = new Ext.form.Checkbox({
      boxLabel: 'Benchmark',
      name: 'benchmarkId',
      checked: true,
      listeners: {
        check: handleCheckboxes
      }
    })
    const stigTitleCheckbox = new Ext.form.Checkbox({
      boxLabel: 'STIG title',
      name: 'title',
      checked: true,
      listeners: {
        check: handleCheckboxes
      }
    })
    const revisionCheckbox = new Ext.form.Checkbox({
      boxLabel: 'Revision',
      name: 'revisionStr',
      checked: true,
      listeners: {
        check: handleCheckboxes
      }
    })
    const stigCheckboxGroup = new Ext.form.CheckboxGroup({
      fieldLabel: 'STIG fields',
      columns: 1,
      items: [
          benchmarkIdCheckbox,
          stigTitleCheckbox,
          revisionCheckbox
      ]
    })
    const assetsPerRowSlider = new Ext.form.SliderField({
      fieldLabel: 'Assets/row',
      value: 253,
      increment: 1,
      minValue: 1,
      maxValue: 253,
    })

    assetsPerRowSlider.slider.on('change', function(slider, newValue) {
      assetsPerRowSlider.label.dom.innerHTML = `${newValue} Assets/row`
    })

    function getValues() {
      return {
        benchmarkId: benchmarkIdCheckbox.getValue(),
        title: stigTitleCheckbox.getValue(),
        revisionStr: revisionCheckbox.getValue(),
        assetsPerRow: assetsPerRowSlider.getValue()
      }
    }

    async function exportHandler () {
      try {
        const apiSap = await Ext.Ajax.requestPromise({
          responseType: 'json',
          url: `${STIGMAN.Env.apiBase}/collections/${_this.collectionId}/sap`,
          method: 'GET'
        })
        SM.SAP.apiToCsv(apiSap, getValues())
      }
      catch(e) {
        SM.Error.handleError(e)
      }
      finally {
        _this.close()
      }
    }

    const exportButton = new Ext.Button({
      text: 'Download',
      iconCls: 'sm-export-icon',
      disabled: false,
      handler: exportHandler
    })

    function handleCheckboxes () {
      exportButton.setDisabled(!benchmarkIdCheckbox.getValue() && !stigTitleCheckbox.getValue())
    }

    const config = {
      title: 'SAP CSV options',
      layout: 'form',
      padding: 10,
      items: [stigCheckboxGroup, assetsPerRowSlider],
      buttons: [exportButton]
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.SAP.apiToCsv = function (apiSap, {benchmarkId, title, revisionStr, assetsPerRow}) {
  const one = 1
}

SM.SAP.showSAPOptions = function (collectionId) {
  const sapWindow = new SM.SAP.optionsWindow({
    modal: true,
    width: 400,
    collectionId
  })
  sapWindow.show()
}