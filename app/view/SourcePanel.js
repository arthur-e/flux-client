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
        Returns true or false indicating whether or not the initial date/time
        selections have all been made in this Panel's Form.
        @return {Boolean}
     */
    initialSelectionsMade: function () {
        var hash = this.getForm().getValues();
        return (Ext.Array.clean([hash.source, hash.date, hash.time]).length === 3);
    },

    items: [{
        xtype: 'combo',
        name: 'source',
        anchor: '100%',
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
        anchor: '100%',
        disabled: true,
        emptyText: 'Select date...',
        format: 'Y-m-d'

    }, {
        xtype: 'combo',
        name: 'time',
        anchor: '100%',
        disabled: true,
        emptyText: 'Select time...',
        displayField: 'time',
        valueField: 'time',
        queryMode: 'local'

    }, {
        xtype: 'checkbox',
        name: 'showLinePlot',
        inputValue: true,
        checked: true,
        stateId: 'showLinePlot',
        boxLabel: 'Show line plot'

    }, {
        xtype: 'fieldset',
        itemId: 'aggregation-fields',
        title: 'Aggregation',
        disabled: true,
        stateful: true,
        stateId: 'aggregationFields',
        defaults: {
            labelAlign: 'top',
            anchor: '100%'
        },
        items: [{
            xtype: 'checkbox',
            name: 'showAggregation',
            stateId: 'showAggregation',
            boxLabel: 'Show aggregation'
        }, {
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
        itemId: 'difference-fields',
        title: 'Difference',
        disabled: true,
        stateful: true,
        stateId: 'differenceFields',
        defaults: {
            labelAlign: 'top',
            anchor: '100%'
        },
        items: [{
            xtype: 'checkbox',
            name: 'showDifference',
            stateId: 'showDifference',
            boxLabel: 'Show difference'
        }, {
            xtype: 'combo',
            name: 'source2',
            fieldLabel: 'Another dataset',
            displayField: '_id',
            valueField: '_id',
            queryMode: 'local',
            listeners: {
                render: function () {
                    this.bindStore(Ext.StoreManager.get('scenarios'));
                },
                dirtychange: function () {
                    Ext.each(this.up('form').query('field[name=date2], field[name=time2]'), function (cmp) {
                        cmp.enable();
                    });
                }
            }
        }, {
            xtype: 'datefield',
            name: 'date2',
            emptyText: 'Select date...',
            format: 'Y-m-d',
            disabled: true
        }, {
            xtype: 'combo',
            name: 'time2',
            emptyText: 'Select time...',
            displayField: 'time',
            valueField: 'time',
            queryMode: 'local',
            disabled: true
        }]

    }, {
        xtype: 'displayfield',
        labelStyle: 'font-weight:normal;color:#444;',
        labelSeparator: '',
        fieldLabel: 'Note: Aggregation or differencing requires that the <b>Statistics from...</b> setting be set to <b>Current Data Frame</b>.'

    }]
});


