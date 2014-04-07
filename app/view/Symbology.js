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
            var combo = this.down('combo[name=palette]');
            var palettes = combo.getStore();
            var paletteNames;
            var type = this.down('#palette-type').getValue()['paletteType'];
            var segments = this.down('#segments').getValue();
            var selection = combo.getValue();

            palettes.removeAll();

            this._lastPaletteType = type;
            this._lastSegments = segments;
            
            if (type === 'sequential') {
                paletteNames = [
                    'BuGn', 'BuPu', 'GnBu', 'OrRd', 'PuBu', 'PuBuGn', 'PuRd', 'RdPu',
                    'YlGn', 'YlGnBu', 'YlOrBr', 'YlOrRd'
                ];

                // Create all possible sequential palettes
                Ext.each(paletteNames, function (name) {
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
                paletteNames = [
                    'BrBG', 'PiYG', 'PRGn', 'PuOr', 'RdBu', 'RdGy', 'RdYlBu'
                ];

                // Create all possible diverging palettes
                Ext.each(paletteNames, function (name) {
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

            if (selection && Ext.Array.contains(paletteNames, selection)) {
                combo.setValue(selection);
            } else {
                combo.setValue(combo.getStore().getAt(0).get('name'));
            }
        }
    },

    items: [{
        xtype: 'hiddenfield',
        name: 'tendency'
    }, {
        xtype: 'reradiogroup',
        itemId: 'palette-type',
        stateId: 'paletteType',
        fieldLabel: 'Color palette type',
        layout: 'vbox',
        items: [{
            boxLabel: 'Sequential',
            name: 'paletteType',
            inputValue: 'sequential',
            id: 'sequential'
        }, {
            boxLabel: 'Diverging',
            name: 'paletteType',
            inputValue: 'diverging',
            id: 'diverging',
            checked: true // Checked by default
        }],
        propagateChange: function (sel) {
            var segments;

            if (this.up('form') === undefined) {
                return;
            }

            segments = this.up('form').down('#segments');

            // Update the maxValue limit of the segments NumberField
            if (sel['paletteType'] === 'sequential') {
                segments.setMaxValue(9);
            } else {
                segments.setMaxValue(11);
            }

            segments.reset();
            this.up('form').fireEvent('palettechange');
        }

    }, {
        xtype: 'numberfield',
        name: 'segments',
        itemId: 'segments',
        stateful: true,
        stateId: 'segments',
        fieldLabel: 'Color bins',
        labelAlign: 'left',
        value: 9,
        minValue: 3,
        maxValue: 9,
        listeners: {
            change: function (rg, selection) {
                if (this.up('form') === undefined) {
                    return;
                }

                // Redraw palettes; re-populate the Palettes store
                this.up('form').fireEvent('palettechange');
            }
        }

    }, {
        xtype: 'recombo',
        name: 'palette',
        itemId: 'palette',
        stateful: true,
        stateId: 'palette',
        fieldLabel: 'Select palette',
        queryMode: 'local',
        displayField: 'name',
        valueField: 'name',
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
            xtype: 'recheckbox',
            name: 'autoscale',
            stateId: 'autoscale',
            boxLabel: 'Autoscale',
            checked: true,
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
            }
        }, {
            xtype: 'numberfield',
            name: 'sigmas',
            itemId: 'std-deviations',
            stateful: true,
            stateId: 'sigmas',
            width: 150,
            fieldLabel: 'Std. deviations',
            labelAlign: 'left',
            value: 3,
            minValue: 1,
            maxValue: 5

        }, {
            xtype: 'enumslider',
            name: 'domain',
            disabled: true,
            stateful: true,
            stateId: 'domain',
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
            xtype: 'recheckbox',
            name: 'threshold',
            itemId: 'threshold-toggle',
            boxLabel: 'Binary mask',
            stateful: true,
            stateId: 'threshold',
            propagateChange: function (checked) {
                if (this.up('form') === undefined) {
                    return;
                }

                // Enable all the fields in this fieldset when checked
                Ext.each(this.up('fieldset').query('field:not(#threshold-toggle), enumslider'), function (cmp) {
                    if (checked) {
                        cmp.enable();
                    } else {
                        cmp.disable();
                    }
                });
            }
        }, {
            xtype: 'recheckbox',
            name: 'thresholdRange',
            disabled: true,
            itemId: 'thresholdRange',
            stateful: true,
            stateId: 'thresholdRange',
            boxLabel: 'Show values within range',
            listeners: {
                change: function (cb, checked) {
                    var slider = this.up('fieldset').down('#thresholdValues');

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
            itemId: 'thresholdValues',
            stateful: true,
            stateId: 'thresholdValues',
            forceIntegers: true,
            disabled: true,
            width: '90%',
            values: 0,
            minValue: -1,
            maxValue: 1
        }]

    }]
});


