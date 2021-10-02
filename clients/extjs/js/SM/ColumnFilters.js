Ext.ns('SM.ColumnFilters')

SM.ColumnFilters.BaseMenu = Ext.extend(Ext.menu.Menu, {
  initComponent: function () {
    const _this = this
    let items
    if (this.column.sortable) {
      items = [
        {itemId:'asc',  text: 'Sort Ascending',  cls: 'xg-hmenu-sort-asc'},
        {itemId:'desc',  text: 'Sort Descending',  cls: 'xg-hmenu-sort-desc'},
      ]
    }
    else {
      items = []
    }
    const config = {
      items: items
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    SM.ColumnFilters.BaseMenu.superclass.initComponent.call(this)
  }
})

SM.ColumnFilters.GridView = Ext.extend(Ext.grid.GridView, {
  handleHdOver : function(e, target) {
    var header = this.findHeaderCell(target);
    
    if (header && !this.headersDisabled) {
        var fly = this.fly(header);
        
        this.activeHdRef = target;
        this.activeHdIndex = this.getCellIndex(header);
        this.activeHdRegion = fly.getRegion();
        
        if (!this.isMenuDisabled(this.activeHdIndex, fly)) {
            fly.addClass('x-grid3-hd-over');
            // this.activeHdBtn = fly.child('.x-grid3-hd-btn');
            
            // if (this.activeHdBtn) {
            //     this.activeHdBtn.dom.style.height = (header.firstChild.offsetHeight - 1) + 'px';
            // }
        }
    }
  },
  handleHdDown: function (e, target) {
    // Modifies superclass method to support lastHide
    e.stopEvent()
    if (!this.lastHide || this.lastHide.getElapsed() > 100) {
      var colModel  = this.cm,
      header    = this.findHeaderCell(target),
      index     = this.getCellIndex(header),
      sortable  = colModel.isSortable(index),
      menu      = this.hmenu,
      menuItems = menu.items,
      menuCls   = this.headerMenuOpenCls,
      sep;
  
      this.hdCtxIndex = index;
      
      Ext.fly(header).addClass(menuCls);
      if (this.hideSortIcons) {
          menuItems.get('asc').setVisible(sortable);
          menuItems.get('desc').setVisible(sortable);
          sep = menuItems.get('sortSep');
          if (sep) {
              sep.setVisible(sortable);    
          }
      } else {
          menuItems.get('asc').setDisabled(!sortable);
          menuItems.get('desc').setDisabled(!sortable);
      }
      
      menu.on('hide', function() {
          Ext.fly(header).removeClass(menuCls);
          this.lastHide = new Date()
      }, this, {single:true});
      
      menu.show(target, 'tl-bl?');    
    }
  },
  afterRenderUI: function () {
    console.log("In SM.ColumnFilters.GridView.afterRenderUI")

    const _this = this
    SM.ColumnFilters.GridView.superclass.afterRenderUI.call(this)

    this.hmenu.on('beforeshow', function (menu) {
      const property = _this.cm.config[_this.hdCtxIndex].dataIndex
      for (const menuitem of menu.items.items) {
        if (menuitem.filter) {
          menuitem.setVisible(menuitem.filter.property === property)
        }
      }    
    })

    for (const col of this.cm.config) {
      switch (col.filter?.type) {
        case 'string':
          // search for string value
          console.log(`Column ${col.header} Type string `)
          this.hmenu.add(new Ext.form.TextField({
            emptyText: "Filter",
            filter: { property: col.dataIndex},
            enableKeyEvents: true,
            hideParent: true,
            listeners: {
              keyup: _this.onFilterChange
            }
          }))
          break
        case 'values':
          // calculate 
          console.log(`Column ${col.header} Type values `)
          break
      }
    }   
  }
})