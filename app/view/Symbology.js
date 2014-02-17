Ext.define('Flux.view.Symbology', {
    extend: 'Flux.view.FormPanel',
    alias: 'widget.symbology',
    items: [{
        xtype: 'fieldcontainer',
        fieldLabel: 'Color palette type',
        defaultType: 'radiofield',
        defaults: {
            flex: 1
        },
        layout: 'vbox',
        items: [{
            boxLabel: 'Sequential',
            name: 'paletteType',
            inputValue: 'sequential',
            id: 'sequential',
            checked: true // Checked by default
        }, {
            boxLabel: 'Diverging',
            name: 'paletteType',
            inputValue: 'diverging',
            id: 'diverging'
        }]

    }, {
        xtype: 'numberfield',
        fieldLabel: 'Color bins',
        labelAlign: 'left',
        value: 11,
        minValue: 0,
        maxValue: 11

    }, {
        xtype: 'combo',
        fieldLabel: 'Select palette'

    }, {
        xtype: 'fieldset',
        title: 'Scaling',
        defaults: {
            labelAlign: 'top'
        },
        items: [{
            xtype: 'checkbox',
            boxLabel: 'Autoscale',
            checked: true,
            listeners: {
                change: function (cb, checked) {
                    var stddev, range;
                    stddev = this.up('fieldset').queryById('std-deviations');
                    range = this.up('fieldset').queryById('output-range');

                    if (checked) {
                        stddev.enable();
                        range.disable();
                    } else {
                        stddev.disable();
                        range.enable();
                    }
                }
            }
        }, {
            xtype: 'numberfield',
            itemId: 'std-deviations',
            width: 150,
            fieldLabel: 'Std. deviations',
            labelAlign: 'left',
            value: 3,
            minValue: 1,
            maxValue: 9

        }, {
            xtype: 'enumslider',
            disabled: true,
            width: '90%',
            itemId: 'output-range',
            fieldLabel: 'Output range'
        }]

    }]
});


