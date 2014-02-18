Ext.define('Flux.view.SourcesPanel', {
    extend: 'Flux.view.FormPanel',
    alias: 'widget.sourcespanel',
    items: [{
        xtype: 'combo',
        name: 'source',
        fieldLabel: 'Select dataset (e.g. model run) and date/time',
        emptyText: 'Select...',
        style: {maxWidth: '200px'},
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
        dateFormat: 'Y-m-d'

    }, {
        xtype: 'timefield',
        name: 'time',
        disabled: true,
        emptyText: 'Select time...',
        format: 'H:i',
        increment: 30 // 30-minute increments

    }, {
        xtype: 'checkbox',
        name: 'showUncertainty',
        boxLabel: 'Show uncertainty',

    }, {
        xtype: 'fieldcontainer',
        fieldLabel: 'Statistics from',
        defaultType: 'radiofield',
        defaults: {
            flex: 1
        },
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
        xtype: 'fieldcontainer',
        fieldLabel: 'Display',
        defaultType: 'radiofield',
        defaults: {
            flex: 1
        },
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
            labelAlign: 'top'
        },
        items: [{
            xtype: 'combo',
            name: 'interval',
            fieldLabel: 'Grouping interval'
        }, {
            xtype: 'combo',
            name: 'aggregate',
            fieldLabel: 'Statistic'
        }]

    }, {
        xtype: 'fieldset',
        title: 'Difference',
        defaults: {
            labelAlign: 'top'
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
            emptyText: 'Select time...',
            format: 'H:i',
            increment: 30,// 30-minute increments
            disabled: true
        }]

    }]
});


