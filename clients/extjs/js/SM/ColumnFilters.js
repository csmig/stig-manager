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
  constructor: function (config) {
    // Ext.apply(this, config);
    this.addEvents(
      'filterschanged',
      'columnfiltered',
      'columnunfiltered'
    ) 
    SM.ColumnFilters.GridView.superclass.constructor.call(this, config);
  },
  handleHdOver : function(e, target) {
    var header = this.findHeaderCell(target);
        
    if (header && !this.headersDisabled) {
        var fly = this.fly(header);
        
        this.activeHdRef = target;
        this.activeHdIndex = this.getCellIndex(header);
        this.activeHdRegion = fly.getRegion();
        
        if (!this.isMenuDisabled(this.activeHdIndex, fly)) {
            fly.addClass('x-grid3-hd-over');
            this.activeHdBtn = fly.child('.x-grid3-hd-btn');
            
            if (this.activeHdBtn) {
                this.activeHdBtn.dom.style.height = (header.firstChild.offsetHeight - 1) + 'px';
            }
        }
    }
  },
  handleHdDownOrig : function(e, target) {
    if (Ext.fly(target).hasClass('x-grid3-hd-btn')) {
        e.stopEvent();
        
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
        }, this, {single:true});
        
        menu.show(target, 'tl-bl?');
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
      
      // menu.show(target, 'tl-bl?');    
      menu.showAt(e.xy);    
    }
  },
  onDataChange : function(){
    SM.ColumnFilters.GridView.superclass.onDataChange.call(this)
    const colCount = this.cm.getColumnCount()
    for (let i = 0; i < colCount; i++) {
      const td = this.getHeaderCell(i)
      td.getElementsByTagName("a")[0].style.height = (td.firstChild.offsetHeight - 1) + 'px'
      if (this.cm.config[i].filtered) {
        td.classList.add('sm-grid3-col-filtered')
      }
      else {
        td.classList.remove('sm-grid3-col-filtered')
      }  
    }
  },
  getFilterFns: function () {
    const hmenu = this.hmenu
    const stringItems = hmenu.filterItems.stringItems
    const selectItems = hmenu.filterItems.selectItems
    const conditions = {}
    const filterFns = []

    for (const stringItem of stringItems) {
      const dataIndex = stringItem.filter.dataIndex
      const value = stringItem.getValue()
      if (value) {
        conditions[dataIndex] = value
      }
    }
    for (const selectItem of selectItems) {
      if (!selectItem.checked) {
        const dataIndex = selectItem.filter.dataIndex
        conditions[dataIndex] = []
        for (const valueItem of selectItem.valueItems) {
          if (valueItem.checked === true) {
            conditions[dataIndex].push(valueItem.filter.value)
          }
        }
      }
    }
    // // iterate the menu items and set the condition(s) for each dataIndex
    // for (const menuitem of hmenu.items.items) {
    //   if (menuitem.filter) {
    //     const dataIndex = menuitem.filter.dataIndex
    //     if (menuitem.filter.type === 'selectall' && menuitem.checked) {
    //       continue
    //     }
    //     else if (menuitem.filter.hasOwnProperty('value')) {
    //       if (!conditions[dataIndex]) {
    //         conditions[dataIndex] = []
    //       }
    //       if (menuitem.checked === true) {
    //         conditions[dataIndex].push(menuitem.filter.value)
    //       }
    //     }
    //     else {
    //       conditions[dataIndex] = menuitem.getValue()
    //     }
    //   }
    // }
    // create an OR function for each dataIndex
    for (const dataIndex of Object.keys(conditions)) {
        filterFns.push({
          fn: function (record) {
            const value = record.data[dataIndex]
            if (Array.isArray(conditions[dataIndex])) {
              return conditions[dataIndex].includes(value) 
            }
            else {
              // will find dataIndex substring anywhere in value
              return value.includes(conditions[dataIndex])
            }
          }
        })  
    }
    return filterFns
  },
  onFilterChange: function (item, value) {
    let initialFiltered = item.column.filtered
    switch (item.filter.type) {
      case 'string':
        item.column.filtered = !!(item.getValue())
        break
      case 'values':
        const hmenuItems = this.hmenu.items.items
        const hmenuPeers = hmenuItems.filter( i => i.filter?.type === 'values' && i.filter?.dataIndex === item.filter.dataIndex)
        const hmenuPeersChecked = hmenuPeers.map( i => i.checked)
        item.column.filtered = hmenuPeersChecked.includes(false)
        break
      case 'selectall':
        item.column.filtered = !(!!value)
        break
    }
    console.log(`HYANDLER Filter changed: ${item.filter?.dataIndex} IS ${value}`)
    this.fireEvent('filterschanged', this, item, value)
  }, 
  afterRenderUI: function () {
    console.log("In SM.ColumnFilters.GridView.afterRenderUI")
    const _this = this
    const dynamicColumns = []

    SM.ColumnFilters.GridView.superclass.afterRenderUI.call(this)

    const hmenu = this.hmenu
    hmenu.filterItems = {
      stringItems: [],
      selectItems: []
    }
    const hmenuItems = hmenu.items.items
    const itemSeparator = hmenu.addItem('-')
    let initial = true

    // (Re)build the dynamic value items
    function buildDynamicValues (records) {
      // iterate the dynamic menu items, save their current values, and remove them
      const cVals = {}
      const dynamicItems = hmenuItems.filter( item => item.filter?.type === 'values' )
      for (const menuItem of dynamicItems) {
        const dataIndex = menuItem.filter.dataIndex
        if (menuItem.checked) {
          (cVals[dataIndex] = cVals[dataIndex] || []).push(menuItem.filter.value)
        }      
        hmenu.remove(menuItem)
      }
      
      // iterate the dynamic columns and create menu items, restoring saved values
      for (const col of dynamicColumns) {
        const itemConfigs = []
        // get unique values for this column from the record set
        const uniqueSet = new Set(records.map( r => r.data[col.dataIndex] ))
        for ( const value of uniqueSet.values()) {
          itemConfigs.push({
            text: col.filter.renderer ? col.filter.renderer(value) : value,
            xtype: 'menucheckitem',
            column: col,
            hideOnClick: false,
            checked: initial ? true : cVals[col.dataIndex] ? cVals[col.dataIndex].includes(value) : false,
            filter: {
              dataIndex: col.dataIndex,
              type: 'values',
              value
            },
            listeners: {
              checkchange: function (item, value) {
                item.selectAllItem.onValueItemChanged()
                _this.onFilterChange(item, value)
              }
            }
          })
        }
        // add the Select All item
        const selectAllItem = hmenu.addItem({
          text: '(Select All)',
          xtype: 'menucheckitem',
          column: col,
          hideOnClick: false,
          checked: initial ? true : itemConfigs.every( i => i.checked ),
          filter: {
            dataIndex: col.dataIndex,
            type: 'selectall'
          },
          valueItems: [],
          onValueItemChanged: function () {
            const state = this.valueItems.every( i => i.checked )
            this.setChecked(state, true)
          },
          listeners: {
            checkchange: function (item, checked) {
              for (const valueItem of item.valueItems) {
                valueItem.setChecked(checked, true)
              }
              _this.onFilterChange(item, checked)
            }
          }
        })
        // add the child items
        for (const itemConfig of itemConfigs) {
          itemConfig.selectAllItem = selectAllItem
          const valueItem = hmenu.addItem(itemConfig)
          selectAllItem.valueItems.push(valueItem)
        }
        hmenu.filterItems.selectItems.push(selectAllItem)
      }
      initial = false
    }

    this.grid.store.on('load', function (store, records, opt) {
      buildDynamicValues(records)
    })
    this.grid.store.on('update', function (store, record) {
      buildDynamicValues(store.snapshot ? store.snapshot.items : store.data.items)
    })


    // Hide menuitems not associated with the clicked column
    hmenu.on('beforeshow', function (menu) {
      const dataIndex = _this.cm.config[_this.hdCtxIndex].dataIndex
      let showSep = false
      for (const menuitem of menu.items.items) {
        if (menuitem.filter) {
          const isVisible = menuitem.filter.dataIndex === dataIndex
          if (isVisible) showSep = true
          menuitem.setVisible(isVisible)
        }
      }
      itemSeparator.setVisible(showSep)    
    })

    for (const col of this.cm.config) {
      switch (col.filter?.type) {
        case 'string':
          // search for string value
          console.log(`Column ${col.header} Type string `)
          const stringItem = hmenu.add(new Ext.form.TextField({
            emptyText: "Filter",
            column: col,
            filter: { dataIndex: col.dataIndex, type: 'string'},
            enableKeyEvents: true,
            hideParent: true,
            autoCreate: {tag: 'input', type: 'search', size: '20', autocomplete: 'off'},            listeners: {
              keyup: function (item, e) {
                const k = e.getKey()
                if (k == e.RETURN) {
                    e.stopEvent();
                    hmenu.hide(true)
                    return
                }
                _this.onFilterChange(item, item.value)
              }
            }
          }))
          hmenu.filterItems.stringItems.push(stringItem)
          break
        case 'values':
          // calculate 
          console.log(`Column ${col.header} Type values `)
          dynamicColumns.push(col)
          break
      }
    }   
  }
})