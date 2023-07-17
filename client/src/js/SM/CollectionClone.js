Ext.ns('SM.CollectionClone')

SM.CollectionClone.ComboBox = Ext.extend(SM.Global.HelperComboBox, {
  initComponent: function () {
    const _this = this
    const data = this.data || []
    this.store = new Ext.data.SimpleStore({
      fields: ['value', 'display']
    })
    this.store.on('load', function (store) {
      _this.setValue(store.getAt(0).get('value'))
    })
    const config = {
      displayField: 'display',
      valueField: 'value',
      triggerAction: 'all',
      mode: 'local',
      editable: false
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
    this.store.loadData(data)
  }
})

SM.CollectionClone.CloneForm = Ext.extend(Ext.form.FormPanel, {
  initComponent: function () {
    const _this = this
    const nameField = new Ext.form.TextField({
      fieldLabel: 'Name',
      labelStyle: 'font-weight: 600;',
      name: 'name',
      allowBlank: false,
      value: this.sourceName ? `Clone of ${this.sourceName}` : '',
      anchor: '100%'
    })
    const descriptionField = new Ext.form.TextArea({
      fieldLabel: 'Description',
      labelStyle: 'font-weight: 600;',
      name: 'description',
      anchor: '100%',
      value: `Cloned from ${this.sourceName} on ${new Date().toLocaleDateString('en-CA')} by ${curUser.displayName}`
    })
    const grantsCb = new SM.Global.HelperCheckbox({
      boxLabel: 'Grants',
      name: 'grants',
      checked: true,
      helpText: 'Clone grants',
      listeners: {
        check: handleCheck
      }

    })
    const labelsCb = new SM.Global.HelperCheckbox({
      boxLabel: 'Labels',
      name: 'labels',
      checked: true,
      helpText: 'Clone labels',
      listeners: {
        check: handleCheck,
      }
    })
    const assetsCb = new SM.Global.HelperCheckbox({
      boxLabel: 'Assets',
      name: 'assets',
      checked: true,
      helpText: 'Clone assets',
      listeners: {
        check: handleCheck,
      }
    })
    const cbGroup = new Ext.form.CheckboxGroup({
      fieldLabel: 'Include',
      allowBlank: false,
      name: 'include',
      columns: 1,
      items: [
        grantsCb,
        labelsCb,
        assetsCb
      ]
    })
    const stigMappingsComboBox = new SM.CollectionClone.ComboBox({
      name: 'stigMappings',
      width: 220,
      fieldLabel: 'STIGs',
      data: [
        ['withReviews', 'Assignments and Reviews'],
        ['withoutReviews', 'Assignments but not Reviews'],
        ['no', 'Do not clone assignments or Reviews']
      ]
    })
    const pinRevisionsComboBox = new SM.CollectionClone.ComboBox({
      name: 'pinRevisions',
      width: 220,
      fieldLabel: 'Pin Revisions',
      data: [
        ['matchSource', "Match the source's pinned revisions"],
        ['sourceDefaults', "Pin the source's default revisions"]
      ]
    })
    const cloneBtn = new Ext.Button({
      text: 'Clone',
      iconCls: 'sm-clone-icon',
      handler: this.btnHandler
    })

    function getApiValues() {
      return {
        name: nameField.getValue(),
        description: descriptionField.getValue(),
        options: {
          grants: grantsCb.getValue(),
          labels: labelsCb.getValue(),
          assets: assetsCb.getValue(),
          stigMappings: stigMappingsComboBox.getValue(),
          pinRevisions: pinRevisionsComboBox.getValue()
        }
      }
    }
    function handleCheck (cb, checked) {
      stigMappingsComboBox.setDisabled(!assetsCb.checked)
      pinRevisionsComboBox.setDisabled(!assetsCb.checked)
      cloneBtn.setDisabled(!assetsCb.checked && !labelsCb.checked && !grantsCb.checked)
    }
    const config = {
      baseCls: 'x-plain',
      cls: 'sm-collection-manage-layout sm-round-panel',
      bodyStyle: 'padding: 9px;',
      border: false,
      labelWidth: 100,
      getApiValues,
      items: [
        {
          xtype: 'fieldset',
          // height: 200,
          split: false,
          title: 'New Collection information',
          items: [nameField, descriptionField]
        },
        {
          xtype: 'fieldset',
          region: 'center',
          title: 'Cloning Options',
          items: [cbGroup, stigMappingsComboBox, pinRevisionsComboBox]
        }
      ],
      buttons: [
        cloneBtn
      ]
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this);
  }
})

class NDJSONTransformStream {
  buffer = ''
  constructor(separator = '\n') {
    const _this = this
    return new TransformStream({
      transform(chunk, controller) {
        if (_this.buffer) {
          chunk = _this.buffer + chunk
        }
        const segments = chunk.split(separator)
        for (const segment of segments) {
          const jsonObj = SM.safeJSONParse(segment)
          if (jsonObj) {
            controller.enqueue(jsonObj)
          }
        }
        if (!chunk.endsWith(separator)) {
          _this.buffer = segments[segments.length - 1]
        }
      }
    })
  }
}

function NDJSONStream(separator = '\n') {
  let buffer = ''
  return new TransformStream({
    transform(chunk, controller) {
      buffer = buffer ? buffer + chunk : chunk
      const segments = buffer.split(separator)
      for (const segment of segments) {
        const jsonObj = SM.safeJSONParse(segment)
        if (jsonObj) {
          controller.enqueue(jsonObj)
        }
      }
      buffer = buffer.endsWith(separator) ? '' : segments[segments.length - 1]
    }
  })
}

SM.CollectionClone.showCollectionClone = function ({collectionId, sourceName}) {
  try {
    const width = 420
    const height = 450
    const fp = new SM.CollectionClone.CloneForm({
      sourceName,
      btnHandler
    })
    async function btnHandler (btn) {
      try {
        const jsonData = fp.getApiValues()
        fpwindow.close()
        initProgress("Cloning", "Waiting for response...");
        updateStatusText ('Waiting for API response...')

        await window.oidcProvider.updateToken(10)
        let response = await fetch(`${STIGMAN.Env.apiBase}/collections/${collectionId}/clone?projection=owners&projection=labels&projection=statistics`, {
          method: 'POST',
          headers: new Headers({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${window.oidcProvider.token}`
          }),
          body: JSON.stringify(jsonData)
        })
        // const reader = response.body.getReader()
        const reader = response.body
          .pipeThrough(new TextDecoderStream())
          .pipeThrough(NDJSONStream())
          .getReader()

        const td = new TextDecoder("utf-8")
        let isdone = false
        const jsons = []
        do {
          const {value, done} = await reader.read()
          if (value) {
            updateStatusText (JSON.stringify(value), true)
            jsons.push(value)
            console.log(`chunk: ${JSON.stringify(value)}`)
          }
          isdone = done
        } while (!isdone)
        updateProgress(0, 'Done')
        
        // Refresh the curUser global
        await SM.GetUserObject()

        SM.Dispatcher.fireEvent( 'collectioncreated', jsons[jsons.length - 1], {
          elevate: false,
          showManager: true
        })

}
      catch (e) {
        SM.Error.handleError(e)
      }
      finally {
        fpwindow.close()
      }
    }

    const fpwindow = new Ext.Window({
      title: 'Clone Collection',
      cls: 'sm-dialog-window sm-round-panel',
      modal: true,
      resizable: false,
      width,
      height,
      layout: 'fit',
      plain: true,
      bodyStyle: 'padding:5px;',
      buttonAlign: 'right',
      items: fp,
      // buttons: [
      //   cloneBtn
      // ]
    })
    fpwindow.show(document.body)
  }
  catch (e) {
    SM.Error.handleError(e)
  }
}
