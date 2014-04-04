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

    items: [],

    layout: {
        type: 'hbox',
        align: 'middle'
    },

    /**
        Configures the component instance with values and isMulti properties.
     */
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

    listeners: {
        beforerender: function () {
            var numberCfg, sliderCfg, values;

            // Add initial Number field ////////////////////////////////////////
            numberCfg = Ext.clone(this.numberDefaults);
            Ext.Object.merge(numberCfg, {
                itemId: 'lower-bound',
                name: Ext.String.format('{0}{1}', this.name, 'LowerBound'),
                padding: '0 7px 0 0',
                value: -1,
                minValue: -1,
                maxValue: 1
            });

            this.add(numberCfg);

            values = this.values; // Get either "value" or "values" property
            if (values === undefined) {
                values = this.value;
            }

            // Configure slider field //////////////////////////////////////////
            sliderCfg = Ext.clone(this.sliderDefaults);
            Ext.Object.merge(sliderCfg, {
                value: values,
                minValue: this.minValue,
                maxValue: this.maxValue,
                name: this.name
            });

            if (this.isMulti) {
                Ext.Object.merge(sliderCfg, {
                    xtype: 'multislider',
                    values: values,
                    minValue: values[0],
                    maxValue: values[values.length - 1]
                });

                // Set the initial value of the left (lower) bound
                this.items.getAt(0).setValue(values[0]);

                // Add second Number field /////////////////////////////////////
                numberCfg = Ext.clone(this.numberDefaults);
                Ext.Object.merge(numberCfg, {
                    xtype: 'numberfield',
                    itemId: 'upper-bound',
                    name: Ext.String.format('{0}{1}', this.name, 'UpperBound'),
                    value: values[1],
                    minValue: this.minValue,
                    maxValue: this.maxValue
                });

                this.add(numberCfg);
            } else {
                // Set the initial value of the right (upper) bound
                this.items.getAt(0).setValue(values);
            }

            // Insert slider field /////////////////////////////////////////////
            this.insert(1, sliderCfg);
        },

        boundschange: function () {
            // Update the slider's thumb position(s) when the NumberFields change
            this.queryById('slider').setValue(this.getValues());
        }
    },

    /**
        Default configuration for each Ext.form.field.Number that is generated.
     */
    numberDefaults: {
        xtype: 'numberfield',
        hideTrigger: true,
        width: 50,
        enableKeyEvents: true,
        listeners: {
            blur: function () {
                this.up('fieldcontainer').fireEventArgs('boundschange', [this]);
            },
            keydown: function (f, e) {
                if (e.getKey() === Ext.EventObject.ENTER) {
                    this.up('fieldcontainer').fireEventArgs('boundschange', [this]);
                }
            }
        }
    },

    /**
        Default configuration for each Ext.slider.* that is generated.
     */
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

                this.ownerCt.fireEventArgs('boundschange', [this, v]);

            }
        }
    },

    getName: function () {
        return this.name;
    },

    /**
        Returns an Array of the lower and upper bounds.
     */
    getValue: function () {
        return this.getValues()
    },

    /**
        Returns an Array of the lower and upper bounds.
     */
    getValues: function () {
        var arr = [];
        Ext.each(this.query('numberfield'), function (cmp) {
            arr.push(cmp.getValue());
        });

        return arr;
    },

    /**
        Sets the values of the Number fields and Slider and also adjusts the
        minValue and maxValue properties accordingly.
        @param  values  {Array}
     */
    setValues: function (values) {
        var slider = this.down('multislider');

        if (this.forceIntegers) {
            values = Ext.Array.map(values, function (v) {
                return Math.floor(v);
            });
        }

        slider.setMinValue(values[0]);
        slider.setMaxValue(values[1]);

        if (this.isMulti) {
            slider.setValue(values);
        } else {
            slider.setValue(values[0]);
        }

        Ext.each(this.query('numberfield'), function (field, i) {
            field.setMinValue(values[0]);
            field.setMaxValue(values[1]);
            field.setValue(values[i]);
        });

        this.fireEvent('boundschange', this, values);
    },

    /**
        Toggles between a MultiSlider and a (single-thumb) Slider.
     */
    toggleMulti: function (multiState, values) {
        var config;

        // Do nothing if the Slider is already configured this way
        if (multiState && this.isMulti) {
            return; // e.g. toggle a MultiSlider to a MultiSlider
        }

        // Remove the old slider
        this.remove('slider');

        // Set up a new slider configuration
        config = Ext.clone(this.sliderDefaults);

        config.name = this.name;

        // Determine the appropriate type of slider
        if (multiState) {
            config.xtype = 'multislider';
            Ext.Object.merge(config, {
                values: values
            });
        } else {
            config.xtype = 'slider';
            Ext.Object.merge(config, {
                value: values
            });
        }

        // Toggle the isMulti attribute and insert the new slider
        this.isMulti = multiState;
        this.insert(1, config);

        // Add or remove the right-bounding NumberField
        if (multiState) {
            this.add({
                xtype: 'numberfield',
                itemId: 'upper-bound',
                name: Ext.String.format('{0}{1}', this.name, 'UpperBound'),
                hideTrigger: true,
                width: 50,
                value: values,
                minValue: this.minValue,
                maxValue: this.maxValue,
                listeners: {
                    blur: function () {
                        this.up('fieldcontainer').fireEventArgs('boundschange', [this]);
                    }
                }
            });
        } else {
            this.remove('upper-bound');
        }

        this.down('#slider').fireEvent('changecomplete');
    }
});
