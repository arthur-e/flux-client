Ext.define('Flux.view.SourcePanel', {
    extend: 'Flux.view.FormPanel',
    alias: 'widget.sourcepanel',

    requires: [
        'Ext.form.FieldContainer',
        'Ext.form.FieldSet',
        'Ext.form.field.Checkbox',
        'Ext.form.field.ComboBox',
        'Ext.form.field.Date',
        'Ext.form.field.Time',
        'Ext.form.RadioGroup',
        'Flux.store.Scenarios'
    ],

    /**
        Replaces a TimeField with a new instance. Used to change the "increment"
        property despite the lack of a "setIncrement()" method.
        @param  cmp     {Ext.form.field.Time}
        @param  index   {Number}    The position index in this container
        @param  config  {Object}    New configuration options
     */
    updateTimeField: function (cmp, index, config) {
        var newConfig = cmp.getInitialConfig();
        Ext.Object.merge(newConfig, config);
        this.remove(cmp);
        this.insert(index, Ext.create('Ext.form.field.Time', config));
    },

    items: [{
        xtype: 'combo',
        name: 'source',
        fieldLabel: 'Select dataset (e.g. model run) and date/time',
        emptyText: 'Select...',
        style: {maxWidth: '200px'},
        displayField: '_id',
        valueField: '_id',
        queryMode: 'local',
        listeners: {
            render: function () {
                this.bindStore(Ext.StoreManager.get('scenarios'));
            },
            dirtychange: function () {
                Ext.each(this.up('form').query('field[name=date], field[name=time]'), function (cmp) {
                    cmp.enable();
                });
            }
        }

    }, {
        xtype: 'datefield',
        name: 'date',
        disabled: true,
        emptyText: 'Select date...',
        format: 'Y-m-d'

    }, {
        xtype: 'combo',
        name: 'time',
        disabled: true,
        emptyText: 'Select time...',
        displayField: 'time',
        valueField: 'time',
        queryMode: 'local'

    }, {
        xtype: 'checkbox',
        name: 'showUncertainty',
        boxLabel: 'Show uncertainty',
        disabled: true //TODO

    }, {
        xtype: 'fieldset',
        itemId: 'aggregation-fields',
        title: 'Aggregation',
        disabled: true,
        defaults: {
            labelAlign: 'top',
            anchor: '100%'
        },
        items: [{
            xtype: 'fieldcontainer',
            layout: 'hbox',
            fieldLabel: 'Grouping interval',
            items: [{
                xtype: 'numberfield',
                name: 'intervals',
                minValue: 1,
                width: 50
            }, {
                xtype: 'splitter'
            }, {
                xtype: 'combo',
                name: 'intervalGrouping',
                valueField: 'id',
                queryMode: 'local',
                flex: 1,
                store: Ext.create('Ext.data.ArrayStore', {
                    storeId: 'groupingIntervals',
                    fields: ['id', 'text'],
                    data: [
                        ['months', 'Months'],
                        ['days', 'Days'],
                        ['hours', 'Hours']
                    ]
                })
            }]
        }, {
            xtype: 'combo',
            name: 'aggregate',
            fieldLabel: 'Statistic',
            valueField: 'id',
            queryMode: 'local',
            store: Ext.create('Ext.data.ArrayStore', {
                storeId: 'statistics',
                fields: ['id', 'text'],
                data: [
                    ['positive', 'Total positive'],
                    ['negative', 'Total negative'],
                    ['net', 'Total net'],
                    ['mean', 'Mean'],
                    ['min', 'Minimum'],
                    ['max', 'Maximum']
                ]
            })
        }]

    }, {
        xtype: 'fieldset',
        title: 'Difference',
        itemId: 'difference-fields',
        disabled: true,
        defaults: {
            labelAlign: 'top',
            anchor: '100%'
        },
        items: [{
            xtype: 'checkbox',
            name: 'showDifference',
            boxLabel: 'Show difference',
            listeners: {
                change: function (cb, checked) {
                    // Enable all the fields in this fieldset when checked
                    Ext.each(this.up('fieldset').query('field:not(checkbox)'), function (cmp) {
                        if (checked) {
                            cmp.enable();
                        } else {
                            cmp.disable();
                        }
                    });
                }
            }
        }, {
            xtype: 'combo',
            name: 'source2',
            fieldLabel: 'Another dataset',
            disabled: true
        }, {
            xtype: 'datefield',
            name: 'date2',
            emptyText: 'Select date...',
            dateFormat: 'Y-m-d',
            disabled: true
        }, {
            xtype: 'combo',
            name: 'time2',
            disabled: true,
            emptyText: 'Select time...',
            displayField: 'time',
            valueField: 'time',
            queryMode: 'local'
        }]

    }, {
        xtype: 'displayfield',
        labelStyle: 'font-weight:normal;color:#444;',
        labelSeparator: '',
        fieldLabel: 'Note: Aggregation or differencing requires that the <b>Statistics from...</b> setting be set to <b>Current Data Frame</b>.'

    }]
});


