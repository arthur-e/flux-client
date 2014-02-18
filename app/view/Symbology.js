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
        name: 'segments',
        fieldLabel: 'Color bins',
        labelAlign: 'left',
        value: 11,
        minValue: 0,
        maxValue: 11

    }, {
        xtype: 'combo',
        name: 'palette',
        fieldLabel: 'Select palette'

    }, {
        xtype: 'fieldset',
        title: 'Scaling',
        defaults: {
            labelAlign: 'top',
            anchor: '100%'
        },
        items: [{
            xtype: 'checkbox',
            name: 'autoscale',
            boxLabel: 'Autoscale',
            checked: true,
            listeners: {
                change: function (cb, checked) {
                    var stddev, domain;

                    // Selectively enable fields based on checked condition
                    stddev = this.up('fieldset').query('numberfield')[0];
                    domain = this.up('fieldset').query('enumslider')[0];

                    if (checked) {
                        stddev.enable();
                        domain.disable();
                    } else {
                        stddev.disable();
                        domain.enable();
                    }
                }
            }
        }, {
            xtype: 'numberfield',
            name: 'sigmas',
            itemId: 'std-deviations',
            width: 150,
            fieldLabel: 'Std. deviations',
            labelAlign: 'left',
            value: 3,
            minValue: 1,
            maxValue: 9

        }, {
            xtype: 'enumslider',
            name: 'domain',
            disabled: true,
            width: '90%',
            itemId: 'input-domain',
            fieldLabel: 'Input domain',
            values: [-1, 1]
        }]

    }, {
        xtype: 'fieldset',
        title: 'Threshold',
        defaults: {
            labelAlign: 'top',
            anchor: '100%'
        },
        items: [{
            xtype: 'checkbox',
            name: 'threshold',
            itemId: 'threshold-toggle',
            boxLabel: 'Binary mask',
            listeners: {
                change: function (cb, checked) {
                    // Enable all the fields in this fieldset when checked
                    Ext.Array.each(this.up('fieldset').query('field:not(#threshold-toggle), enumslider'), function (cmp) {
                        if (checked) {
                            cmp.enable();
                        } else {
                            cmp.disable();
                        }
                    });
                }
            }
        }, {
            xtype: 'checkbox',
            name: 'thresholdRange',
            disabled: true,
            itemId: 'range',
            boxLabel: 'Show values within range',
            listeners: {
                change: function (cb, checked) {
                    var slider = this.up('fieldset').down('#threshold');

                    if (checked) {
                        slider.toggleMulti(true, [-1, 1]);
                    } else {
                        slider.toggleMulti(false, 0);
                    }
                }
            }

        }, {
            xtype: 'enumslider',
            name: 'thresholdValues',
            disabled: true,
            itemId: 'threshold',
            width: '90%',
            values: 0,
            minValue: -1,
            maxValue: 1
        }]

    }]
});


