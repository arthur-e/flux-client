Ext.define('Flux.view.Symbology', {
    extend: 'Flux.view.FormPanel',
    alias: 'widget.symbology',

    require: [
        'Flux.model.Palette',
        'Flux.store.Palettes'
    ],

    initComponent: function () {
        Ext.create('Flux.store.Palettes');
        this.addEvents('palettechange');
        this.callParent(arguments);
    },

    listeners: {
        afterrender: function () {
            var palettes = Ext.StoreManager.get('palettes');

            // Bind the Palettes store to the palette picker
            this.down('combo[name=palette]').bindStore(palettes);

            // Populate the Palettes store
            this.fireEvent('palettechange');
        },

        // Whenever the form changes with respect to the palette choice; either
        //  the number of segments or palette type; (re-)populate the Palettes
        palettechange: function () {
            var palettes = this.down('combo[name=palette]').getStore();
            var type = this.down('#paletteType').getValue()['paletteType'];
            var segments = this.down('#segments').getValue();

            palettes.removeAll();
            
            if (type === 'sequential') {
                // Create all possible sequential palettes
                Ext.Array.each([
                    'BuGn', 'BuPu', 'GnBu', 'OrRd', 'PuBu', 'PuBuGn', 'PuRd', 'RdPu',
                    'YlGn', 'YlGnBu', 'YlOrBr', 'YlOrRd'
                ], function (name) {
                    var scale = chroma.scale(name).domain([
                        0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
                    ], (segments), 'quantiles').out('hex');

                    palettes.add(Ext.create('Flux.model.Palette', {
                        name: name,
                        type: 'sequential',
                        segments: segments,
                        colors: (function () {
                            var colors, domain, i;

                            colors = [];
                            domain = scale.domain();
                            i = 0;
                            while (i < (domain.length - 1)) {
                                colors.push(scale(domain[i]))
                                i += 1;
                            }

                            return colors;
                        }())
                    }));

                });

            } else {
                // Create all possible diverging palettes
                Ext.Array.each([
                    'BrBG', 'PiYG', 'PRGn', 'PuOr', 'RdBu', 'RdGy', 'RdYlBu'
                ], function (name) {
                    var scale = chroma.scale(name).domain([
                        -10, -9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
                    ], (segments), 'quantiles').out('hex');

                    palettes.add(Ext.create('Flux.model.Palette', {
                        name: name,
                        type: 'diverging',
                        segments: segments,
                        colors: (function () {
                            var colors, domain, i;

                            colors = [];
                            domain = scale.domain();
                            i = 0;
                            while (i < (domain.length - 1)) {
                                colors.push(scale(domain[i]))
                                i += 1;
                            }

                            return colors;
                        }())
                    }));

                });

            }
        }
    },

    items: [{
        xtype: 'radiogroup',
        itemId: 'paletteType',
        fieldLabel: 'Color palette type',
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
        }],
        listeners: {
            change: function (rg, selection) {
                var segments = this.up('form').down('#segments');

                // Update the maxValue limit of the segments NumberField
                if (selection['paletteType'] === 'sequential') {
                    segments.setMaxValue(9);
                } else {
                    segments.setMaxValue(11);
                }

                segments.reset();
                this.up('form').fireEvent('palettechange');
            }
        }

    }, {
        xtype: 'numberfield',
        name: 'segments',
        itemId: 'segments',
        fieldLabel: 'Color bins',
        labelAlign: 'left',
        value: 9,
        minValue: 3,
        maxValue: 9,
        listeners: {
            change: function (rg, selection) {
                // Redraw palettes; re-populate the Palettes store
                this.up('form').fireEvent('palettechange');
            }
        }

    }, {
        xtype: 'combo',
        name: 'palette',
        itemId: 'palette',
        fieldLabel: 'Select palette',
        queryMode: 'local',
        displayField: 'name',
        valueField: 'id',
        tpl: Ext.create('Ext.XTemplate', [
            '<tpl for=".">',
                '<div class="ui-palette-ramp x-boundlist-item" title="{name}">',
                    '<tpl for="colors">',
                        '<div class="ui-palette-cell" style="background-color:{.}">',
                        '</div>',
                    '</tpl>',
                '</div>',
            '</tpl>'
        ].join(''))

    }, {
        xtype: 'fieldset',
        title: 'Scaling',
        defaults: {
            labelAlign: 'top',
            anchor: '100%'
        },
        items: [{
            xtype: 'statefulcb',
            name: 'autoscale',
            stateId: 'autoscale',
            boxLabel: 'Autoscale',
            propagateChange: function (nowChecked) {
                var stddev, domain;

                if (this.up('fieldset') === undefined) {
                    return;
                }

                // Selectively enable fields based on checked condition
                stddev = this.up('fieldset').query('numberfield')[0];
                domain = this.up('fieldset').query('enumslider')[0];

                if (nowChecked) {
                    stddev.enable();
                    domain.disable();
                } else {
                    stddev.disable();
                    domain.enable();
                }
            },
            listeners: {
                afterrender: function () {
                    this.propagateChange(this.getValue());
                },
                change: function (cb, checked) {
                    this.propagateChange(checked);
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


