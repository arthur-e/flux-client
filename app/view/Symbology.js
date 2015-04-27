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
            var reversed = this.down('#reverse-palette').getValue();
            var type = this.down('#palette-type').getValue()['paletteType'];
            var segments = this.down('#segments').getValue();
            var selection = combo.getValue();

            palettes.removeAll();
            if (type === 'sequential') {
                paletteNames = [
                    'BuGn', 'BuPu', 'GnBu', 'OrRd', 'PuBu', 'PuBuGn', 'PuRd', 'RdPu',
                    'YlGn', 'YlGnBu', 'YlOrBr', 'YlOrRd'
                ];

                // Create all possible sequential palettes
                Ext.each(paletteNames, function (name) {
                    var colors = colorBrewer[name][segments];

                    palettes.add(Ext.create('Flux.model.Palette', {
                        name: name,
                        type: 'sequential',
                        segments: segments,
                        colors: (function () {
                            var c = colors.slice();
                            if (reversed) {
                                c.reverse();
                            }

                            return c;
                        }())
                    }));

                });

            } else {
                paletteNames = [
                    'BrBG', 'PiYG', 'PRGn', 'PuOr', 'RdBu', 'RdGy', 'RdYlBu'
                ];

                // Create all possible diverging palettes
                Ext.each(paletteNames, function (name) {
                    var colors = colorBrewer[name][segments];

                    palettes.add(Ext.create('Flux.model.Palette', {
                        name: name,
                        type: 'diverging',
                        segments: segments,
                        colors: (function () {
                            var c = colors.slice();
                            if (reversed) {
                                c.reverse();
                            }

                            return c;
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
        xtype: 'rehidden',
        name: 'display',
        value: 'values',
        stateful: true,
        stateId: 'display'
    }, {
        xtype: 'rehidden',
        name: 'statsFrom',
        value: 'population',
        stateful: true,
        stateId: 'statsFrom'
    }, {
        xtype: 'rehidden',
        name: 'tendency',
        value: 'median',
        stateful: true,
        stateId: 'tendency'
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
        anchor: '100%',
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
        anchor: '100%',
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
        xtype: 'recheckbox',
        name: 'reversePalette',
        itemId: 'reverse-palette',
        stateful: true,
        stateId: 'reversePalette',
        boxLabel: 'Reverse palette',
        checked: true,
        listeners: {
            change: function () {
                if (this.up('form')) {
                    this.up('form').fireEvent('palettechange');
                }
            }
        }

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
            listeners: {
                change: function (cb, checked) {
                    var parent = this.up('fieldset');
                    if (parent) {
                        // Selectively enable fields based on checked condition
                        parent.down('renumberfield').setDisabled(!checked);
                        parent.down('enumslider').setDisabled(checked);
                    }
                }
            }
        }, {
            xtype: 'renumberfield',
            name: 'sigmas',
            itemId: 'std-deviations',
            stateful: true,
            stateId: 'sigmas',
            width: 150,
            fieldLabel: 'Std. deviations',
            labelAlign: 'left',
            value: 2,
            minValue: 1,
            maxValue: 5

        }, {
            xtype: 'enumslider',
            name: 'domain',
            itemId: 'input-domain',
            disabled: true,
            stateful: true,
            stateId: 'domain',
            width: '90%',
            fieldLabel: 'Input domain',
            forceIntegers: true,
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
            listeners: {
                afterrender: function () {
                    this.up('fieldset').down('#threshold-values')
                        .on('afterrender', function () {
                                this.toggleMulti(true);
                        })
                },
                change: function (cb, checked) {
                    if (this.up('fieldset')) {
                        // Enable all the fields in this fieldset when checked
                        Ext.each(this.up('fieldset')
                            .query('field:not(#threshold-toggle), enumslider'), function (cmp) {
                                cmp.setDisabled(!checked);
                        });
                    }
                }
            }
        }, {
            xtype: 'fieldcontainer',
            layout: 'hbox',
            fieldLabel: 'Show values within range',
            items: [
            {
                xtype: 'enumslider',
                name: 'thresholdValues',
                itemId: 'threshold-values',
                stateful: true,
                stateId: 'thresholdValues',
                forceIntegers: true,
                disabled: true,
                width: '90%',
                values: -1,
                minValue: -1,
                maxValue: 1
            }]
        }]

    }]
});


