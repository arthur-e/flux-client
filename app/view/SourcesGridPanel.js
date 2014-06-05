Ext.define('Flux.view.SourcesGridPanel', {
    extend: 'Ext.grid.Panel',
    alias: 'widget.sourcesgridpanel',
    requires: [
        'Ext.form.field.ComboBox',
        'Ext.form.field.Date',
        'Ext.grid.column.Date',
        'Ext.grid.plugin.RowEditing',
        'Flux.model.RasterView',
        'Flux.store.Scenarios'
    ],

    initComponent: function () {
        this.store = Ext.create('Ext.data.ArrayStore', {
            storeId: 'gridviews',
            model: 'Flux.model.RasterView'
        });
        this.addEvents(['itemchange', 'beforeedit', 'canceledit', 'edit']);
        this.callParent(arguments);
    },

    plugins: Ext.create('Ext.grid.plugin.RowEditing', {
        clicksToMoveEditor: 1,
        autoCancel: true
    }),

    viewConfig: {
        markDirty: false
    },

    listeners: {
        edit: function (e, context) {
            var rec = context.record;

            // Require both of these fields to be filled out
            if (Ext.isEmpty(rec.get('source')) || Ext.isEmpty(rec.get('date'))) {
                this.fireEventArgs('canceledit', arguments)
            }
        },

        canceledit: function (e, context) {
            var view = context.record.get('view');

            // Remove the view associated with the Flux.model.RasterView instance
            if (view.ownerCt) {
                view.ownerCt.remove(view);
            }

            this.getStore().remove(context.record);
        },

        itemchange: function () {
            var vals = Ext.Object.getValues(this.getFieldValues());

            // Automatically save the grid entry when all three fields are filled out
            if (Ext.clean(vals).length === 3) {
                this.findPlugin('rowediting').completeEdit();
            }
        }
    },

    getFieldValues: function () {
        vals = {};
        Ext.each(this.findPlugin('rowediting').editor.query('field'), function (f) {
            vals[f.getName()] = f.getRawValue();
        });
        return vals;
    },

    tbar: [{
        text: 'Add View',
        iconCls: 'icon-add',
        handler: function () {
            var rowEditor = this.up('panel').findPlugin('rowediting');
            var r = Ext.create('Flux.model.RasterView');
            var store = Ext.StoreManager.get('gridviews');

            if (store.count() < 9) {
                rowEditor.cancelEdit();
                store.insert(0, r);
                rowEditor.startEdit(0, 0);
            }

            if (store.count() === 9) {
                this.disable();
            }
        }
    }],

    columns: [{
        text: 'Source',
        dataIndex: 'source',
        name: 'source',
        width: 120,
        editor: {
            xtype: 'combo',
            emptyText: 'Select...',
            matchFieldWidth: false,
            listConfig: {
                width: 200
            },
            displayField: '_id',
            valueField: '_id',
            queryMode: 'local',
            listeners: {
                render: function () {
                    this.bindStore(Ext.StoreManager.get('scenarios'));
                },
                focus: function () {
                    var store = this.ownerCt.editingPlugin.getCmp().getStore();
                    var data = Ext.Array.map(store.getModifiedRecords(), function (item) {
                        return item.get('date');
                    });

                    // Only disable the sibling fields if this is a new record,
                    //  determined by comparing the total number of records to
                    //  the length of an Array of data for one field
                    if (store.count() > Ext.Array.clean(data).length) {
                        this.nextSibling().disable();
                        this.nextSibling().nextSibling().disable();
                    }
                },
                select: function () {
                    this.nextSibling().enable();
                    this.nextSibling().nextSibling().enable();
                }
            }
        }
    }, {
        xtype: 'datecolumn',
        header: 'Date',
        dataIndex: 'date',
        name: 'date',
        flex: 1,
        format: 'Y-m-d',
        editor: {
            xtype: 'datefield',
            format: 'Y-m-d',
            disabled: true,
            listeners: {
                change: function () {
                    this.up('sourcesgridpanel').fireEventArgs('itemchange', arguments);
                }
            }
        }
    }, {
        text: 'Time',
        dataIndex: 'time',
        name: 'time',
        index: 2,
        width: 70,
        editor: {
            xtype: 'combo',
            emptyText: 'Select...',
            disabled: true,
            matchFieldWidth: false,
            listConfig: {
                width: 100
            },
            displayField: 'time',
            valueField: 'time',
            queryMode: 'local',
            listeners: {
                select: function () {
                    this.up('sourcesgridpanel').fireEventArgs('itemchange', arguments);
                }
            }
        }
    }]
});


