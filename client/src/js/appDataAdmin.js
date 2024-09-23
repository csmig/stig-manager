async function addAppDataAdmin( params ) {
  let detailBodyWrapEl
  try {
    let { treePath } = params
    const tab = Ext.getCmp('main-tab-panel').getItem('appinfo-admin-tab')
    if (tab) {
      tab.show()
      return
    }

    const detailJson = new Ext.Panel({
      region: 'center',
      title: 'Anonymized Deployment Details',
      border: false,
      cls: 'sm-round-panel',
      margins: { top: SM.Margin.top, right: SM.Margin.edge, bottom: SM.Margin.adjacent, left: SM.Margin.edge },
      autoScroll: true,
      buttonAlign: 'left',
      bbar: [
        {
          text: 'JSON',
          iconCls: 'sm-export-icon',
          handler: function (btn) {
            if (detailResponseText) {
              const blob = new Blob([detailResponseText], {type: 'application/json'})
              downloadBlob(blob, SM.Global.filenameEscaped(`stig-manager-details_${SM.Global.filenameComponentFromDate()}.json`))
            }
          }
        }
      ]
    })

    async function getDetail () {
      return Ext.Ajax.requestPromise({
        url: `${STIGMAN.Env.apiBase}/op/details`,
        params: {
          elevate: curUser.privileges.canAdmin
        },
        method: 'GET'
      })
    }

    function downloadBlob (blob, filename) {
      let a = document.createElement('a')
      a.style.display = "none"
      let url = window.URL.createObjectURL(blob)
      a.href = url
      a.download = filename
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url)
    }


    const thisTab = Ext.getCmp('main-tab-panel').add({
      id: 'appinfo-admin-tab',
      sm_treePath: treePath,
      iconCls: 'sm-info-circle-icon',
      title: 'Application Info',
      closable: true,
      layout: 'border',
      border: false,
      items: [detailJson]
    })
    thisTab.show()

    detailBodyWrapEl = detailJson.getEl().child('.x-panel-bwrap')
    detailBodyWrapEl.mask('Getting data...')
    const detailResponseText = (await getDetail()).response.responseText //used by downloadBlob
    const detailTree = JsonView.createTree(JSON.parse(detailResponseText))
    // adjust for rendering
    // the parent and first child (dbInfo) are expanded
    detailTree.key = `GET ${STIGMAN.Env.apiBase}/op/details?elevate=true`
    detailTree.isExpanded = true
    detailTree.children[0].isExpanded = true

    JsonView.render(detailTree, detailJson.body)
  }
  catch (e) {
    SM.Error.handleError(e)
  }
  finally {
    detailBodyWrapEl?.unmask()
  }
}