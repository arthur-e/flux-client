Ext.define('Flux.field.EnumeratedSlider', {
    extend: 'Ext.form.FieldContainer',
    alias: 'widget.enumslider',

    requires: [
        'Ext.Array',
        'Ext.form.field.Number',
        'Ext.slider.Multi',
        'Ext.slider.Single'
    ],

    /**
        Flag to indicate that the slider has multiple thumbs; currently only
        supports two thumbs (left and right).
     */
    isMulti: false,

    /**
        Returns an Array of the lower and upper bounds.
     */
    getValues: function () {
        var arr = [];
        Ext.Array.each(this.query('numberfield'), function (cmp) {
            arr.push(cmp.getValue());
        });

        return arr;
    },

    initComponent: function () {
        var values = this.values || this.value;

        if (Ext.isArray(values)) {
            this.isMulti = true;
        }

        this.addEvents('boundschange');
        this.callParent(arguments);
    },

    layout: {
        type: 'hbox',
        align: 'middle'
    },

    listeners: {
        beforerender: function () {
            var config, values;

            values = this.values || this.value;
            config = {
                xtype: 'slider',
                itemId: 'slider',
                padding: '0 7px 0 0',
                value: values,
                minValue: this.minValue,
                maxValue: this.maxValue,
                flex: 1,
                listeners: {
                    changecomplete: function () {
                        var v = this.getValues();

                        this.up('fieldcontainer').queryById('lower-bound').setValue(v[0]);

                        if (this.up('fieldcontainer').isMulti) {
                            this.up('fieldcontainer').queryById('upper-bound').setValue(v[1]);
                        }
                    }
                }
            };

            if (this.isMulti) {
                Ext.Object.merge(config, {
                    xtype: 'multislider',
                    values: values,
                    minValue: values[0],
                    maxValue: values[values.length - 1]
                });

                this.add({
                    xtype: 'numberfield',
                    itemId: 'upper-bound',
                    hideTrigger: true,
                    width: 50,
                    value: values[1],
                    minValue: this.minValue,
                    maxValue: this.maxValue,
                    listeners: {
                        blur: function () {
                            this.up('fieldcontainer').fireEvent('boundschange');
                        }
                    }
                });
            }

            this.insert(1, config);
        },
        boundschange: function () {
            this.queryById('slider').setValue(this.getValues());
        }
    },

    items: [{
        xtype: 'numberfield',
        itemId: 'lower-bound',
        hideTrigger: true,
        padding: '0 7px 0 0',
        width: 50,
        value: -1,
        minValue: -1,
        maxValue: 1,
        listeners: {
            blur: function () {
                this.up('fieldcontainer').fireEvent('boundschange');
            }
        }
    }]
});
