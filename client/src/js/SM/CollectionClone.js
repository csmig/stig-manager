Ext.ns('SM.CollectionClone')


SM.CollectionClone.WarningFormPanel = Ext.extend(Ext.form.FormPanel, {
  initComponent: function () {
    const _this = this
    const displayField = new Ext.form.DisplayField({
      value: `<b>WARNING</b><br><br>The warning text The warning text The warning text The warning text The warning text The warning text The warning text The warning text The warning text The warning text The warning text The warning text The warning text The warning text The warning text The warning text The warning text The warning text The warning text `
    })
    const disableCheckbox = new Ext.form.Checkbox({
      boxLabel: `Don't show this warning again during this session`,
      margins: '30 0 0 0',
      listeners: {
        check: function (cb, checked) {
          curUser.noCloneWarning = checked
        }
      }
    })
    const continueBtn = new Ext.Button({
      text: 'Continue',
      // iconCls: 'sm-clone-icon',
      handler: this.btnHandler
    })
    const config = {
      baseCls: 'x-plain',
      cls: 'sm-collection-manage-layout sm-round-panel',
      bodyStyle: 'padding: 9px;',
      border: false,
      hideLabels: true,
      layout: 'vbox',
      items: [
        displayField,
        disableCheckbox
      ],
      buttons: [
        continueBtn
      ]
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this);
  }
})

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

SM.CollectionClone.CloneFormPanel = Ext.extend(Ext.form.FormPanel, {
  initComponent: function () {
    const _this = this
    const nameField = new Ext.form.TextField({
      fieldLabel: 'Name',
      enableKeyEvents: true,
      labelStyle: 'font-weight: 600;',
      name: 'name',
      allowBlank: false,
      value: this.sourceName ? `Clone of ${this.sourceName}` : '',
      anchor: '100%',
      listeners: {
        keyup: handleInput
      }
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
        check: handleInput
      }

    })
    const labelsCb = new SM.Global.HelperCheckbox({
      boxLabel: 'Labels',
      name: 'labels',
      checked: true,
      helpText: 'Clone labels',
      listeners: {
        check: handleInput,
      }
    })
    const assetsCb = new SM.Global.HelperCheckbox({
      boxLabel: 'Assets',
      name: 'assets',
      checked: true,
      helpText: 'Clone assets',
      listeners: {
        check: handleInput,
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
    const manageCb = new SM.Global.HelperCheckbox({
      boxLabel: 'Open Collection Manager after cloning',
      hideLabel: true,
      checked: true,
      helpText: 'Open Collection Manager after cloning'
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
    function handleInput (cb, checked) {
      stigMappingsComboBox.setDisabled(!assetsCb.checked)
      pinRevisionsComboBox.setDisabled(!assetsCb.checked)
      cloneBtn.setDisabled(nameField.getValue() === '' || (!assetsCb.checked && !labelsCb.checked && !grantsCb.checked))
    }
    const config = {
      baseCls: 'x-plain',
      cls: 'sm-collection-manage-layout sm-round-panel',
      bodyStyle: 'padding: 9px;',
      border: false,
      labelWidth: 100,
      getApiValues,
      nameField,
      items: [
        {
          xtype: 'fieldset',
          title: 'New Collection information',
          items: [nameField, descriptionField]
        },
        {
          xtype: 'fieldset',
          title: 'Cloning Options',
          items: [cbGroup, stigMappingsComboBox, pinRevisionsComboBox]
        },
        // manageCb
      ],
      buttons: [
        cloneBtn
      ]
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this);
  }
})

SM.CollectionClone.CloneProgressPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const _this = this
    const pb = new Ext.ProgressBar({
      flex: 0
    })
    const config = {
      baseCls: 'x-plain',
      cls: 'sm-collection-manage-layout sm-round-panel',
      bodyStyle: 'padding: 9px;',
      border: false,
      items: [pb],
      pb
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this);
  }
})

SM.CollectionClone.PostClonePanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const _this = this
    const manageBtn = new Ext.Button({
      action: 'manage', 
      text: 'Manage the Collection',
      iconCls: 'sm-setting-icon',
      margins: '0 5 0 0',
      handler: this.btnHandler
    })
    const viewBtn = new Ext.Button({
      action: 'view', 
      text: 'View the Dashboard',
      iconCls: 'sm-collection-icon',
      margins: '0 0 0 5',
      handler: this.btnHandler
    })

    const config = {
      // baseCls: 'x-plain',
      // cls: 'sm-collection-manage-layout sm-round-panel',
      bodyStyle: 'padding: 9px;',
      border: false,
      layout: 'hbox',
      layoutConfig: {
        pack: 'center'
      },
      items: [manageBtn, viewBtn]
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this);
  }
})

function NDJSONStream(separator = '\n') {
  let buffer = ''
  return new TransformStream({
    transform(chunk, controller) {
      buffer = buffer ? buffer + chunk : chunk
      const segments = buffer.split(separator)
      for (const segment of segments) {
        const jsObj = SM.safeJSONParse(segment)
        if (jsObj) {
          controller.enqueue(jsObj)
        }
      }
      buffer = buffer.endsWith(separator) ? '' : segments[segments.length - 1]
    }
  })
}

SM.CollectionClone.showCollectionClone = async function ({collectionId, sourceName}) {
  try {
    let showWarning = !curUser.noCloneWarning
    // if (!curUser.noCloneWarning) {
    //   const collectionSummary = await Ext.Ajax.requestPromise({
    //     responseType: 'json',
    //     url: `${STIGMAN.Env.apiBase}/collections/${collectionId}/metrics/summary/collection`
    //   })
    //   showWarning = collectionSummary.assets > 500 || collectionSummary.metrics.assessed > 50000
    // }
    const width = 420
    const height = 405
    const fp = new SM.CollectionClone.CloneFormPanel({
      sourceName,
      btnHandler: cloneBtnHandler
    })
    const wp = new SM.CollectionClone.WarningFormPanel({btnHandler: warnBtnHandler})

    function warnBtnHandler () {
      fpwindow.removeAll()
      fpwindow.add(fp)
      fpwindow.doLayout()
      fp.nameField.focus(true, true)
    }
    async function cloneBtnHandler (btn) {
      try {
        const jsonData = fp.getApiValues()
        fpwindow.removeAll()
        fpwindow.setTitle(`Creating "${jsonData.name}"`)
        fpwindow.getTool('close').hide()
        fpwindow.getTool('minimize').show()
        const progressPanel = new SM.CollectionClone.CloneProgressPanel()
        fpwindow.add(progressPanel)
        fpwindow.setHeight(80)
        // fpwindow.center()
        fpwindow.minimize()

        progressPanel.pb.updateProgress(0, "Cloning")

        await window.oidcProvider.updateToken(10)
        let response = await fetch(`${STIGMAN.Env.apiBase}/collections/${collectionId}/clone?projection=owners&projection=labels&projection=statistics`, {
          method: 'POST',
          headers: new Headers({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${window.oidcProvider.token}`
          }),
          body: JSON.stringify(jsonData)
        })
        const reader = response.body
          .pipeThrough(new TextDecoderStream())
          .pipeThrough(NDJSONStream())
          .getReader()

        let isdone = false
        let iserror = false
        let apiCollection
        const jsons = []
        do {
          const {value, done} = await reader.read()
          isdone = done
          if (value) {
            if (value.stage === 'error' && !fpwindow.isDestroyed) {
              const message =  value.message === 'Unhandled error' ? `${value.message}. Click to copy details to the clipboard.` : value.message
              progressPanel.pb.updateProgress(1, message)
              progressPanel.pb.addClass('sm-pb-error')
              fpwindow.getTool('close').show()
              isdone = true
              iserror = true
            }
            else if (value.stage === 'collection' && !fpwindow.isDestroyed) {
              const progress = (value.step - 1)/value.stepCount
              progressPanel.pb.updateProgress(progress, value.message)
            }
            else if (value.stage === 'reviews' && value.stepName === "cloneReviews" && !fpwindow.isDestroyed) {
              const progress = value.reviewsCopied/value.reviewsTotal
              progressPanel.pb.updateProgress(progress, `Cloning reviews (${value.reviewsCopied.toLocaleString()} of ${value.reviewsTotal.toLocaleString()})`)
            }
            else if (value.stage === 'result') {
              apiCollection = value.collection
            }
            jsons.push(value)
            console.log(`chunk: ${JSON.stringify(value)}`)
          }
        } while (!isdone)

        if (!fpwindow.isDestroyed && !iserror) {
          fpwindow.removeAll()
          fpwindow.setTitle(`Created "${apiCollection.name}"`)
          fpwindow.add(new SM.CollectionClone.PostClonePanel({ 
            btnHandler: function (btn) {
              if (apiCollection) {
                const openMethod = btn.action === 'manage' ? addCollectionManager : SM.CollectionPanel.showCollectionTab
                openMethod({
                  collectionId: apiCollection.collectionId,
                  collectionName: apiCollection.name,
                  treePath: SM.Global.mainNavTree.getCollectionLeaf(apiCollection.collectionId)?.getPath()
                })
                fpwindow.close()
              }
            }
           }))
          fpwindow.getTool('minimize').hide()
          fpwindow.getTool('close').show()
          fpwindow.doLayout()
        }

       if (!iserror) {
        // Refresh the curUser global to include any new grants
        await SM.GetUserObject()

        SM.Dispatcher.fireEvent( 'collectioncreated', apiCollection, {
          elevate: false,
          showManager: false
        })
       } 
      }
      catch (e) {
        SM.Error.handleError(e)
        fpwindow.close()
      }
    }

    function vpResize (vp, adjWidth, adjHeight) {
      if (fpwindow.minimized) {
        const offset = 20
        fpwindow.setPosition(adjWidth - fpwindow.getWidth()- offset, adjHeight - fpwindow.getHeight() - offset) 
      }
      else {
        fpwindow.center()
      }
    }

    const fpwindow = new Ext.Window({
      title: 'Clone Collection',
      cls: 'sm-dialog-window sm-round-panel',
      modal: true,
      resizable: false,
      closable: true,
      minimizable: true,
      maximizable: true,
      constrain: true,
      width,
      height,
      layout: 'fit',
      plain: true,
      bodyStyle: 'padding:5px;',
      buttonAlign: 'right',
      items: showWarning ? wp : fp,
      listeners: {
        minimize: function() {
          const offset = 20
          fpwindow.mask.hide()
          fpwindow.getTool('minimize').hide()
          const vpSize = Ext.getCmp('app-viewport').getSize()
          fpwindow.setPosition(vpSize.width - fpwindow.getWidth()- offset, vpSize.height - fpwindow.getHeight() - offset)
          fpwindow.minimized = true
        },
        destroy: function () {
          Ext.getCmp('app-viewport').removeListener('resize', vpResize)
        },
        // show: function () {
        //   fp.nameField.focus(true, true)
        // }
      }

      // buttons: [
      //   cloneBtn
      // ]
    })
    fpwindow.render(document.body)
    
    fpwindow.getTool('minimize').hide()
    fpwindow.getTool('maximize').hide()
    fpwindow.show()
    if (!showWarning) fp.nameField.focus(true, true)
    Ext.getCmp('app-viewport').addListener('resize', vpResize)

  }
  catch (e) {
    SM.Error.handleError(e)
  }
}
