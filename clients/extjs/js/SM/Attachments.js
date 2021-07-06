Ext.ns('SM.Attachments')

SM.Attachments.Grid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function() {
    const me = this
    const nonce = Ext.id()
    const fields = [
      'name',
      'size',
      'type',
      'description',
      'digest',
      {
        name: 'date',
        type: 'date',
        dateFormat: 'c'
      }
    ]
    const totalTextCmp = new Ext.Toolbar.TextItem ({
      text: '0 records',
      width: 80
    })
    const store = new Ext.data.JsonStore({
      grid: this,
      root: '',
      fields: fields,
      idProperty: 'digest',
      sortInfo: {
        field: 'name',
        direction: 'ASC'
      }
    })
    const columns = [
      {
        header: "Artifact",
        id: `name-${nonce}`,
        width: 100,
        dataIndex: 'name',
        sortable: true,
        align: 'left',
        renderer: function (value, metadata, record) {
          var returnStr = '<img src="' + getFileIcon(value) + '" class="sm-artifact-file-icon">';
          returnStr += '<b>' + value + '</b>';
          returnStr += '<br><b>Type:</b> ' + record.data.type;
          returnStr += '<br><b>Size:</b> ' + record.data.size;
          // returnStr += '<br><br>';
          return returnStr;
        }
      },
      {
        width: 25,
        header: 'download', // not shown, used in cellclick handler
        fixed: true,
        dataIndex: 'none',
        renderer: function (value, metadata, record) {
          metadata.css = 'artifact-view';
          metadata.attr = 'ext:qtip="View artifact"';
          return '';
        }
      },
      {
        width: 25,
        header: 'delete',
        fixed: true,
        dataIndex: 'none',
        renderer: function (value, metadata, record) {
          metadata.css = 'artifact-delete';
          metadata.attr = 'ext:qtip="Unattach the artifact from this review"';
          return '';
        }
      }
    ]
    const loadArtifacts = async function () {
      try {
        store.removeAll()
        const artifactValue = await getMetadataValue('artifacts')
        store.loadData(JSON.parse(artifactValue))
      }
      catch (e) {
        console.log(e)
      }
    }
    const putArtifact = async function (file) {
      try {
        const fields = await SM.Attachments.getMetadataFromFile(file)
        console.log(fields)
        store.loadData([fields.attachment], true) // append
        await putMetadataValue(fields.attachment.digest, fields.data)
        const records = store.getRange()
        const data = records.map( record => record.data)
        await putMetadataValue('artifacts', JSON.stringify(data))
      }
      catch (e) {
        console.log(e)
      }
    }
    const removeArtifact = async function (record) {
      try {
        store.remove(record)
        await deleteMetadataKey(record.data.digest)
        const records = store.getRange()
        const data = records.map( record => record.data)
        await putMetadataValue('artifacts', JSON.stringify(data))
      }
      catch (e) {
        console.log(e)
      }
    }

    const putMetadataValue = async function (key, value) {
      try {
        let result = await Ext.Ajax.requestPromise({
          url: `${STIGMAN.Env.apiBase}/collections/${me.collectionId}/reviews/${me.assetId}/${me.ruleId}/metadata/keys/${key}`,
          method: 'PUT',
          jsonData: JSON.stringify(value)
        })
      }
      catch (e) {
        console.log(e)
      }
    }
    const getMetadataValue = async function (key) {
      try {
        let result = await Ext.Ajax.requestPromise({
          url: `${STIGMAN.Env.apiBase}/collections/${me.collectionId}/reviews/${me.assetId}/${me.ruleId}/metadata/keys/${key}`,
          method: 'GET'
        })
        return JSON.parse(result.response.responseText)  
      }
      catch (e) {
        console.log(e)
      }
    }
    const deleteMetadataKey = async function (key) {
      try {
        let result = await Ext.Ajax.requestPromise({
          url: `${STIGMAN.Env.apiBase}/collections/${me.collectionId}/reviews/${me.assetId}/${me.ruleId}/metadata/keys/${key}`,
          method: 'DELETE'
        })
        return JSON.parse(result.response.responseText)  
      }
      catch (e) {
        console.log(e)
      }
    }

    const showImage = async function (artifactObj) {
      console.log(artifactObj)
      // image panel
      const imagePanel = new Ext.Panel()
      const vpSize = Ext.getBody().getViewSize()
      let height = vpSize.height * 0.75
      let width = vpSize.width * 0.75 <= 1024 ? vpSize.width * 0.75 : 1024
      const fpwindow = new Ext.Window({
        title: `Image`,
        modal: true,
        resizable: true,
        width: width,
        height: height,
        layout: 'fit',
        plain: true,
        bodyStyle: 'padding:5px;',
        buttonAlign: 'center',
        items: imagePanel
      })
      fpwindow.show()
      const imageB64 = await getMetadataValue(artifactObj.digest)
      imagePanel.update(`<img style='height: 100%; width: 100%; object-fit: contain' src='data:${artifactObj.type};base64,${encodeURI(imageB64)}'></img>`)
    }

    const config = {
      loadArtifacts: loadArtifacts,
      disableSelection: true,
      layout: 'fit',
      cls: 'custom-artifacts',
      hideHeaders: true,
      border: false,
      store: store,
      columns: columns,
      stripeRows: true,
      view: new Ext.grid.GridView({
        forceFit: true,
        emptyText: 'No attachments to display.',
        deferEmptyText: false
      }),
      tbar: new Ext.Toolbar({
        items: [
          {
            xtype: 'fileuploadfield',
            buttonOnly: true,
            name: 'importFile',
            accept: '.gif,.jpg,.jpeg,.svg,.png,.pdf',
            webkitdirectory: false,
            multiple: false,
            style: 'width: 95px;',
            buttonText: `Attach artifact...`,
            buttonCfg: {
                icon: "img/attach-16.png"
            },
            listeners: {
                fileselected: async function (uploadField) {
                  try {
                    let input = uploadField.fileInput.dom
                    const files = [...input.files]
                    putArtifact(files[0])
                    uploadField.reset()
                  }
                  catch (e) {
                    uploadField.reset()
                    alert(e.message)
                  }
                }
            }
          }
        ]
      }),
      loadMask: true,
      autoExpandColumn: `name-${nonce}`,
      emptyText: 'No attachments to display',
      listeners: {
        cellclick: function (grid, rowIndex, columnIndex, e) {
          var r = grid.getStore().getAt(rowIndex)
          var header = grid.getColumnModel().getColumnHeader(columnIndex)
          switch (header) {
            case 'download':
              showImage(r.data)
              break;
            case 'delete':
              removeArtifact(r)
              break;
          }
        }
      }
    }   
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    SM.Attachments.Grid.superclass.initComponent.call(this)
  },
  setContext: function ({ collectionId, assetId, ruleId }) {
    this.context = { collectionId, assetId, ruleId }
  },
})

SM.Attachments.getMetadataFromFile = async function (file, description) {
  const hasher = new asmCrypto.Sha256()
  const dataBuffer = await readArrayBufferAsync(file)
  const dataArray = new Uint8Array(dataBuffer)
  const base64 = asmCrypto.bytes_to_base64(dataArray)
  hasher.process(dataArray)
  hasher.finish()
  const shahex = asmCrypto.bytes_to_hex(hasher.result)
  return {
    attachment: {
      name: file.name,
      date: file.lastModifiedDate,
      size: file.size,
      type: file.type,
      description: description,
      digest: shahex
    },
    data: base64
  }
}

function readBinaryStringAsync(file) {
  return new Promise((resolve, reject) => {
    let reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result);
    }

    reader.onerror = reject;

    reader.readAsBinaryString(file)
  })
}

function readArrayBufferAsync(file) {
  return new Promise((resolve, reject) => {
    let reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result);
    }

    reader.onerror = reject;

    reader.readAsArrayBuffer(file)
  })
}
