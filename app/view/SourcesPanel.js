Ext.define('Flux.view.SourcesPanel', {
    extend: 'Flux.view.FormPanel',
    alias: 'widget.sourcespanel',

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
        queryMode: 'local',
        displayField: 'name',
        valueField: 'name',
        store: Ext.create('Flux.store.Scenarios', {
            storeId: 'scenarios'
        }),
        listeners: {
            dirtychange: function () {
                Ext.Array.each(this.up('form').query('field[name=date], field[name=time]'), function (cmp) {
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
        xtype: 'timefield',
        name: 'time',
        index: 2, // Index position within the container's items
        disabled: true,
        emptyText: 'Select time...',
        format: 'H:i',
        increment: 30 // 30-minute increments

    }, {
        xtype: 'checkbox',
        name: 'showUncertainty',
        boxLabel: 'Show uncertainty'

    }, {
        xtype: 'radiogroup',
        fieldLabel: 'Statistics from',
        layout: 'vbox',
        items: [{
            boxLabel: 'Population',
            name: 'statsFrom',
            inputValue: 'population',
            id: 'population',
            checked: true // Checked by default
        }, {
            boxLabel: 'Current Data Frame',
            name: 'statsFrom',
            inputValue: 'current-data-frame',
            id: 'current-data-frame'
        }]

    }, {
        xtype: 'radiogroup',
        fieldLabel: 'Display',
        layout: 'vbox',
        items: [{
            boxLabel: 'Values',
            name: 'display',
            inputValue: 'values',
            id: 'values',
            checked: true // Checked by default
        }, {
            boxLabel: 'Anomalies',
            name: 'display',
            inputValue: 'anomalies',
            id: 'anomalies'
        }]

    }, {
        xtype: 'fieldset',
        title: 'Aggregation',
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
                        ['weeks', 'Weeks'],
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
            }),
        }]

    }, {
        xtype: 'fieldset',
        title: 'Difference',
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
                    Ext.Array.each(this.up('fieldset').query('field:not(checkbox)'), function (cmp) {
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
            xtype: 'timefield',
            name: 'time2',
            index: 3, // Index position within the container's items
            emptyText: 'Select time...',
            format: 'H:i',
            increment: 30,// 30-minute increments
            disabled: true
        }]

    }]
});


