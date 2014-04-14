Ext.define('Flux.view.MapSettings', {
    extend: 'Flux.view.FormPanel',
    alias: 'widget.mapsettings',

    requires: [
        'Ext.tip.ToolTip'
    ],

    /**
        The default settings for map-related controls. These should match the
        settings on the components (with these keys as their `name` or 
        `stateId` attributes, which should be the same) i.e. the value of the
        `value` or `checked` attributes; currently this is ONLY needed for the
        ComboBox instances in the MapSettings panel.
     */
    defaultState: {
        basemap: { value: '/flux-client/political-small.topo.json' },
        projection: { value: 'equirectangular' },
    },

    /**TODO
     */
//    initComponent: function () {
//        this.on('render', function () {
//            var state = {};

//            // Retrieve previous state, if any, or use default values
//            Ext.Object.each(this.defaultState, function (key, value) {
//                var result = Ext.state.Manager.get(key, value); // Second argument is default value
//                state[key] = (result === undefined) ? value : result;
//            });

//            // Initialize the the user interface for ComboBoxes
//            Ext.Object.each(state, function (key, value) {
//                var target = Ext.ComponentQuery.query('combo[name=' + key + ']')[0];
//                if (target) {
//                    target.applyState(value);
//                }
//            });
//        });

//        this.callParent(arguments);
//    },

    items: [{
        xtype: 'recombo',
        name: 'projection',
        stateful: true,
        stateId: 'projection',
        fieldLabel: 'Map projection',
        queryMode: 'local',
        valueField: 'id',
        value: 'equirectangular',
        store: Ext.create('Ext.data.ArrayStore', {
            storeId: 'projections',
            fields: ['id', 'text'],
            data: [
                ['equirectangular', 'Equirectangular (Plate Carrée)'],
                ['mercator', 'Mercator']
            ]
        }),
        //TODO Get rid of this
        getRecord: function (id) {
            return this.getStore().findRecord('id', id || this.getValue());
        }

    }, {
        xtype: 'recombo',
        name: 'basemap',
        stateful: true,
        stateId: 'basemap',
        fieldLabel: 'Basemap',
        queryMode: 'local',
        valueField: 'id',
        value: '/flux-client/political-small.topo.json',
        store: Ext.create('Ext.data.ArrayStore', {
            storeId: 'basemaps',
            fields: ['id', 'text', 'url'],
            data: [
                ['/flux-client/political-usa.topo.json', 'U.S.A.'],
                ['/flux-client/political-north-america.topo.json', 'North America'],
                ['/flux-client/political.topo.json', 'Global'],
                ['/flux-client/political-small.topo.json', 'Global (Small Scale)']
            ]
        }),
        listeners: {
            afterrender: function () {
                Ext.create('Ext.tip.ToolTip', {
                    target: this.getEl(),
                    html: '<b>Note:</b> Changing basemaps will consume more memory and affects performance',
                    showDelay: 0
                });
            }
        }
    }, {
        xtype: 'recheckbox',
        cls: 'basemap-options',
        name: 'showBasemapOutlines',
        stateId: 'showBasemapOutlines',
        boxLabel: 'Basemap outlines only',
        propagateChange: function (nowChecked) {
            var target;

            if (this.up('panel') === undefined) {
                return;
            }

            target = this.up('panel').down('checkbox[name=showPoliticalBoundaries]');
            if (nowChecked) {
                target.disable();
            } else {
                target.enable();
            }
        },
        listeners: {
            afterrender: function () {
                // Need to enable/disable AFTER rendering, as when applyState()
                //  is called this component is laid out with its siblings!
                this.propagateChange(this.getValue());
            }
        }

    }, {
        xtype: 'recheckbox',
        cls: 'basemap-options',
        name: 'showPoliticalBoundaries',
        stateId: 'showPoliticalBoundaries',
        boxLabel: 'Show political boundaries'

    }, {
        xtype: 'checkbox',
        name: 'showLegends',
        checked: true,
        inputValue: true,
        stateId: 'showLegends',
        boxLabel: 'Show legend(s)'

    }, {
        xtype: 'checkbox',
        name: 'showLinePlot',
        disabled: true,//TODO
        inputValue: true,
        stateId: 'showLinePlot',
        boxLabel: 'Show line plot'

    }]
});


