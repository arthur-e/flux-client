Ext.define('Flux.field.EnumeratedSlider', {
    extend: 'Ext.form.FieldContainer',
    alias: 'widget.enumslider',

    requires: [
        'Ext.Array',
        'Ext.Object',
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

    sliderDefaults: {
        xtype: 'slider',
        itemId: 'slider',
        padding: '0 7px 0 0',
        value: 0,
        minValue: -1,
        maxValue: 1,
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
    },

    /**
        Toggles between a MultiSlider and a (single-thumb) Slider.
     */
    toggleMulti: function (multiState, newConfig) {
        var config;

        foo = this;//FIXME

        // Do nothing if the Slider is already configured this way
        if (multiState && this.isMulti) {
            return; // e.g. toggle a MultiSlider to a MultiSlider
        }

        this.remove('slider');
        config = Ext.clone(this.sliderDefaults);

        if (newConfig) {
            Ext.Object.merge(config, newConfig);
        }

        if (multiState) {
            config.xtype = 'multislider';
            this.isMulti = true;
        } else {
            config.xtype = 'slider';
            this.isMulti = false;
        }

        this.insert(1, config);
    },

    initComponent: function () {
        var values = this.values; // Get either "value" or "values" property
        if (values === undefined) {
            values = this.value;
        }

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

            values = this.values; // Get either "value" or "values" property
            if (values === undefined) {
                values = this.value;
            }

            config = Ext.clone(this.sliderDefaults);

            Ext.Object.merge(config, {
                value: values,
                minValue: this.minValue,
                maxValue: this.maxValue
            });

            if (this.isMulti) {
                Ext.Object.merge(config, {
                    xtype: 'multislider',
                    values: values,
                    minValue: values[0],
                    maxValue: values[values.length - 1]
                });

                // Set the initial value of the left (lower) bound
                this.items.getAt(0).setValue(values[0]);

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
            } else {
                // Set the initial value of the right (upper) bound
                this.items.getAt(0).setValue(values);
            }

            this.insert(1, config);
        },
        boundschange: function () {
            // Update the slider's thumb position(s) when the NumberFields change
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
