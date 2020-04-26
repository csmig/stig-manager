function addStigAdmin() {
	var stigFields = Ext.data.Record.create([
		{	name:'benchmarkId',
			type: 'string'
		},{
			name: 'title',
			type: 'string'
		},{
			name: 'lastRevisionStr',
			type: 'string'
		},{
			name: 'lastRevisionDate',
			type: 'date',
			dateFormat: 'Y-m-d'
		}
	]);

	var stigStore = new Ext.data.JsonStore({
		proxy: new Ext.data.HttpProxy({
			url: `${STIGMAN.Env.apiBase}/stigs`,
			method: 'GET'
		}),
		root: '',
		fields: stigFields,
		totalProperty: 'records',
		idProperty: 'benchmarkId',
		sortInfo: {
			field: 'benchmarkId',
			direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
		},
		listeners: {
			load: function (store,records) {
				store.isLoaded = true,
				Ext.getCmp('stigGrid-totalText').setText(records.length + ' records');
				stigGrid.getSelectionModel().selectFirstRow();
			},
			remove: function (store,record,index) {
				Ext.getCmp('stigGrid-totalText').setText(store.getCount() + ' records');
			}
		}
	});

	var stigGrid = new Ext.grid.GridPanel({
		id: 'stigGrid',
		store: stigStore,
		stripeRows:true,
		sm: new Ext.grid.RowSelectionModel({ singleSelect: true }),
		columns: [{ 	
				header: "Benchmark ID",
				width: 300,
				dataIndex: 'benchmarkId',
				sortable: true
			},{ 	
				header: "Title",
				id: 'stigGrid-title-column',
				width: 350,
				dataIndex: 'title',
				sortable: true
			},{ 	
				header: "Current revision",
				width: 150,
				dataIndex: 'lastRevisionStr',
				sortable: true
			}
			,{ 	
				header: "Revision date",
				width: 150,
				dataIndex: 'lastRevisionDate',
				xtype: 'datecolumn',
				format: 'Y-m-d',
				sortable: true
			}
		],
		autoExpandColumn: 'stigGrid-title-column',
		view: new Ext.grid.GridView({
			forceFit:false,
			// These listeners keep the grid in the same scroll position after the store is reloaded
			listeners: {
				beforerefresh: function(v) {
				   v.scrollTop = v.scroller.dom.scrollTop;
				   v.scrollHeight = v.scroller.dom.scrollHeight;
				},
				refresh: function(v) {
					setTimeout(function() { 
						v.scroller.dom.scrollTop = v.scrollTop + (v.scrollTop == 0 ? 0 : v.scroller.dom.scrollHeight - v.scrollHeight);
					}, 100);
				}
			},
			deferEmptyText:false
		}),
		listeners: {
			rowdblclick: {
				fn: function(grid,rowIndex,e) {
					var r = grid.getStore().getAt(rowIndex);
					Ext.getBody().mask('Getting assignments for ' + r.get('benchmarkId') + '...');
					showStigAssignments(r.get('benchmarkId'));
				}
			}
		},
		tbar: [{
			iconCls: 'sm-asset-icon',
			text: 'Assign assets',
			disabled: false,
			handler: function() {
				var r = stigGrid.getSelectionModel().getSelected();
				Ext.getBody().mask('Getting assignments for ' + r.get('benchmarkId') + '...');
				showStigAssignments(r.get('benchmarkId'));
			}
		}],
		bbar: new Ext.Toolbar({
			items: [
			{
				xtype: 'tbbutton',
				id: 'stigGrid-csvBtn',
				iconCls: 'icon-save',
				tooltip: 'Download this table\'s data as Comma Separated Values (CSV)',
				width: 20,
				handler: function(btn){
					var ourStore = stigGrid.getStore();
					var lo = ourStore.lastOptions;
					window.location=ourStore.url + '?csv=1&xaction=read';
				}
			},{
				xtype: 'tbfill'
			},{
				xtype: 'tbseparator'
			},{
				xtype: 'tbtext',
				id: 'stigGrid-totalText',
				text: '0 records',
				width: 80
			}]
		}),
		loadMask: true
	});

	var thisTab = Ext.getCmp('admin-center-tab').add({
		id: 'stig-admin-tab',
		iconCls: 'sm-stig-icon',
		title: 'STIG checklists',
		closable:true,
		layout: 'fit',
		items: [stigGrid]
		});


	async function showStigAssignments(benchmarkId) {

		var assetFields = Ext.data.Record.create([
			{
				name:'assetId',
				type: 'number'
			},{
				name:'name',
				type: 'string'
			},{
				name:'dept',
				type: 'string'
			}
		]);	
		var assetStore = new Ext.data.JsonStore({
			url: `${STIGMAN.Env.apiBase}/assets?elevate=true`,
			fields: assetFields,
			root: '',
			sortInfo: {
				field: 'name',
				direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
			},
			idProperty: 'assetId'	
		});
		var assetSm = new Ext.grid.CheckboxSelectionModel({
			checkOnly: true,
			onRefresh: function() {
				var ds = this.grid.store, index;
				var s = this.getSelections();
				for(var i = 0, len = s.length; i < len; i++){
					var r = s[i];
					if((index = ds.indexOfId(r.id)) != -1){
						this.grid.view.addRowClass(index, this.grid.view.selectedRowClass);
					}
				}
			}
		});
		var assetGrid = new Ext.grid.GridPanel({
			title:'Asset assignments',
			hideHeaders: false,
			flex: 30,
			id: 'stigs-assetsGrid',
			hideLabel: true,
			isFormField: true,
			store: assetStore,
			columns: [
				assetSm,
				{ header: "Assets", 
					width: 95,
					dataIndex: 'name',
					sortable: true
				}
				,{ header: "Dept", 
					width: 55,
					dataIndex: 'dept',
					sortable: true
				}
			],
			viewConfig: {
				forceFit: true
			},
			sm: assetSm,
			setValue: function(assets) {
				var selRecords = []
				assets.forEach(asset => {
					let record = assetStore.getById(asset.assetId)
					selRecords.push(record)
				})
				assetSm.selectRecords(selRecords);
			},
			getValue: function() {},
			markInvalid: function() {},
			clearInvalid: function() {},
			validate: function() { return true},
			isValid: function() { return true;},
			getName: function() {return this.name},
			fieldLabel: 'Assets',
			tbar: new Ext.Toolbar({
				items: [
				{
				// START Filter control
					xtype: 'buttongroup',
					title: 'Filtering',
					items: [
					{
						xtype: 'trigger',
						fieldLabel: 'Filter',
						triggerClass: 'x-form-clear-trigger',
						onTriggerClick: function() {
							this.triggerBlur();
							this.blur();
							this.setValue('');
							filterAssetStore();
						},
						id: 'stigs-assetsGrid-filterField',
						width: 140,
						submitValue: false,
						enableKeyEvents:true,
						emptyText:'Enter an asset filter...',
						listeners: {
							keyup: function (field,e) {
								filterAssetStore();
								return false;
							}
						}
					},{
						xtype: 'tbseparator'
					},{
						xtype: 'tbbutton',
						icon: 'img/tick_white.png',
						tooltip: 'Show assignments only',
						id: 'stigs-assetsGrid-filterButton',
						toggleGroup: 'asset-selector',
						enableToggle:true,
						allowDepress: true,
						toggleHandler: function (btn,state) {
							filterAssetStore();
						}
					}]
				}]
			}),
			name: 'assetAssignments'
		});

		/******************************************************/
		// Form panel
		/******************************************************/
		var stigAssignmentsFormPanel = new Ext.form.FormPanel({
			baseCls: 'x-plain',
			labelWidth: 65,
			url:'pl/updateStigAssignments.pl',
			monitorValid: true,
			items: [
			{
				layout: 'hbox',
				anchor: '100% -30',
				baseCls: 'x-plain',
				border: false,
				layoutConfig: {
					align: 'stretch'
				},
				items: [
					assetGrid
				]
			}
			], // end form items
			buttons: [{
				text: 'Cancel',
				handler: function(){
					appwindow.close();
				}
			},{
				text: 'Save',
				formBind: true,
				id: 'submit-button',
				handler: function(){
					stigAssignmentsFormPanel.getForm().submit({
						submitEmptyText: false,
						params : {
							benchmarkId: benchmarkId,
							assetIds: encodeSm(assetSm,'assetId'),
							req: 'update'
						},
						waitMsg: 'Saving changes...',
						success: function (f,a) {
							if (a.result.success == 'true') {
								Ext.getCmp('stigGrid').getView().holdPosition = true; //sets variable used in override in varsUtils.js
								Ext.getCmp('stigGrid').getStore().reload();
								//Ext.Msg.alert('Success','Asset ID ' + a.result.id + ' has been updated.');
								appwindow.close();
							} else {
								Ext.Msg.alert('Failure!','The database update has failed.');
								appwindow.close();
							}	
						},
						failure: function(f,a) {
							Ext.Msg.alert('AJAX Failure!','AJAX call has completely failed.');
							appwindow.close();
						}	
					});
				}
		   }]
		});

		/******************************************************/
		// Form window
		/******************************************************/
		var appwindow = new Ext.Window({
			id: 'stigAssignmentWindow',
			title: benchmarkId,
			modal: true,
			hidden: true,
			width: 330,
			height:520,
			layout: 'fit',
			plain:true,
			bodyStyle:'padding:5px;',
			buttonAlign:'right',
			items: stigAssignmentsFormPanel
		});


		/******************************************************/
		// filterAssetStore ()
		/******************************************************/
		function filterAssetStore () {
			var value = Ext.getCmp('stigs-assetsGrid-filterField').getValue();
			var selectionsOnly = Ext.getCmp('stigs-assetsGrid-filterButton').pressed;
			if (value == '') {
				if (selectionsOnly) {
					assetStore.filterBy(filterChecked,assetSm);
				} else {
					assetStore.clearFilter();
				}
			} else {
				if (selectionsOnly) {
					assetStore.filter([
						{
							property:'assetName',
							value:value,
							anyMatch:true,
							caseSensitive:false
						},{
							fn: filterChecked,
							scope: assetSm
						}
					]);
				} else {
					assetStore.filter({property:'assetName',value:value,anyMatch:true,caseSensitive:false});
				}
			}
		};

		appwindow.render(document.body);
		assetStore.load({
			callback: async function (r,o,s) {
				try {
					let result = await Ext.Ajax.requestPromise({
						url: `${STIGMAN.Env.apiBase}/assets`,
						params: {
							elevate: true,
							benchmarkId: benchmarkId
						},
						method: 'GET'
					})
					let stigProps = {
						assetAssignments: JSON.parse(result.response.responseText)
					}
					stigAssignmentsFormPanel.getForm().setValues(stigProps)
					Ext.getBody().unmask();
					appwindow.show(document.body);
				}
				catch (e) {
					alert (e.message)
				}
			}
		})
	}
	// Show the tab
	thisTab.show();
	stigGrid.getStore().load();
} // end addStigAdmin()