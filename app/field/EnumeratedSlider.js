Ext.define('Flux.field.EnumeratedSlider', {
    extend: 'Ext.form.FieldContainer',
    alias: 'widget.enumslider',

    requires: [
        'Ext.Array',
        'Ext.form.field.Number',
        'Ext.slider.Multi'
    ],

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
        this.addEvents('boundschange');
        this.callParent(arguments);
    },

    layout: {
        type: 'hbox',
        align: 'middle'
    },

    listeners: {
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
    }, {
        xtype: 'multislider',
        itemId: 'slider',
        padding: '0 7px 0 0',
        values: [-1, 1],
        minValue: -1,
        maxValue: 1,
        flex: 1,
        listeners: {
            changecomplete: function () {
                var v = this.getValues();
                this.up('fieldcontainer').queryById('lower-bound').setValue(v[0]);
                this.up('fieldcontainer').queryById('upper-bound').setValue(v[1]);
            }
        }
    }, {
        xtype: 'numberfield',
        itemId: 'upper-bound',
        hideTrigger: true,
        width: 50,
        value: 1,
        minValue: -1,
        maxValue: 1,
        listeners: {
            blur: function () {
                this.up('fieldcontainer').fireEvent('boundschange');
            }
        }
    }]
});
