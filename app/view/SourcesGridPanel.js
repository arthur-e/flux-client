Ext.define('Flux.view.SourcesGridPanel', {
    extend: 'Ext.grid.Panel',
    alias: 'widget.sourcesgridpanel',
    requires: [
        'Ext.form.field.ComboBox',
        'Ext.form.field.Date',
        'Ext.grid.column.Date',
        'Ext.grid.plugin.RowEditing',
        'Flux.model.GridView',
        'Flux.store.Scenarios'
    ],

    initComponent: function () {
        this.store = Ext.create('Ext.data.ArrayStore', {
            storeId: 'gridviews',
            model: 'Flux.model.GridView'
        });
        this.callParent(arguments);
    },

    plugins: Ext.create('Ext.grid.plugin.RowEditing', {
        clicksToMoveEditor: 1,
        autoCancel: false
    }),

    tbar: [{
        text: 'Add View',
        iconCls: 'icon-add',
        handler : function() {
            var rowEditor = this.up('panel').findPlugin('rowediting');

            // Create a model instance
            var r = Ext.create('Flux.model.GridView', {
                source: '',
                date: '',
                time: ''
            });

            rowEditor.cancelEdit();
            Ext.StoreManager.get('gridviews').insert(0, r);
            rowEditor.startEdit(0, 0);
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
                    this.nextSibling().disable();
                    this.nextSibling().nextSibling().disable();
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
            disabled: true
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
            queryMode: 'local'
        }
    }]
});


