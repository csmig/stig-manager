Ext.ns('SM.ColumnFilters')

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
    SM.ColumnFilters.GridView.superclass.constructor.prototype.afterRenderUI.call(this)
    
    console.log("In SM.ColumnFilters.GridView.afterRenderUI")
  }
})