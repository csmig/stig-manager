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
          //var returnStr = '<img src="' + getFileIcon(value) + '" width=12px height=12px>&nbsp;';
          var returnStr = '<img src="' + getFileIcon(value) + '" class="sm-artifact-file-icon">';
          returnStr += '<b>' + value + '</b>';
          returnStr += '<br><br><b>Type:</b> ' + record.data.type;
          returnStr += '<br><br><b>Size:</b> ' + record.data.size;
          returnStr += '<br><b>Description:</b> ' + record.data.description;
          returnStr += '<br><br>';
          return returnStr;
        }
      },
      {
        width: 25,
        header: 'download', // not shown, used in cellclick handler
        fixed: true,
        dataIndex: 'none',
        renderer: function (value, metadata, record) {
          metadata.css = 'artifact-download';
          metadata.attr = 'ext:qtip="Download artifact"';
          return '';
        }
      },
      {
        width: 25,
        header: 'delete',
        fixed: true,
        dataIndex: 'none',
        renderer: function (value, metadata, record) {
          if (attachGrid.groupGridRecord.data.statusId == 0 || attachGrid.groupGridRecord.data.statusId == 2) {
            metadata.css = 'artifact-delete';
            metadata.attr = 'ext:qtip="Unattach the artifact from this review"';
          }
          return '';
        }
      }
    ]
    const config = {
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
            xtype: 'tbbutton',
            text: 'Attach artifact...',
            icon: 'img/attach-16.png',
            handler: function (btn) {
              attachArtifact()
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
              alert('Clicked download')
              // window.location = 'pl/getArtifact.pl?artId=' + r.data.artId;
              break;
            case 'delete':
              alert('Clicked delete')
              // removeMap(r);
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
  loadArtifacts: async function () {
    const context = this.context
    let result = await Ext.Ajax.requestPromise({
      url: `${STIGMAN.Env.apiBase}/collections/${context.collectionId}/reviews/${context.assetId}WORKING NHERE`,
      method: 'GET'
    })
    let apiCollection = JSON.parse(result.response.responseText)
  
  }
})

SM.Attachments.getArtifacts = 


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
