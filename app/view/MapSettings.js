Ext.define('Flux.view.MapSettings', {
    extend: 'Flux.view.FormPanel',
    alias: 'widget.mapsettings',

    requires: [
        'Ext.tip.ToolTip'
    ],

    items: [{
        xtype: 'combo',
        name: 'projection',
        stateful: true,
        stateId: 'projection',
        fieldLabel: 'Map projection',
        queryMode: 'local',
        valueField: 'id',
        store: Ext.create('Ext.data.ArrayStore', {
            storeId: 'projections',
            fields: ['id', 'text', 'proj']
        }),
        getRecord: function (id) {
            return this.getStore().findRecord('id', id || this.getValue());
        }

    }, {
        xtype: 'combo',
        name: 'basemap',
        stateful: true,
        stateId: 'basemap',
        fieldLabel: 'Basemap',
        queryMode: 'local',
        valueField: 'id',
        store: Ext.create('Ext.data.ArrayStore', {
            storeId: 'basemaps',
            fields: ['id', 'text', 'url']
        }),
        getRecord: function (id) {
            return this.getStore().findRecord('id', id || this.getValue());
        },
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
        xtype: 'statefulcheckbox',
        cls: 'basemap-options',
        name: 'showBasemapOutlines',
        stateful: true,
        stateId: 'showBasemapOutlines',
        boxLabel: 'Basemap outlines only',
        applyState: function (state) {
            this.setValue(state && state.value);
            // Need to enable/disable AFTER rendering, as when applyState()
            //  is called this component is laid out with its siblings!
            this.on('afterrender', function () {
                var target = this.up('panel').down('checkbox[name=showPoliticalBoundaries]');
                if (state && state.value) {
                    target.disable();
                } else {
                    target.enable();
                }
            });
        }

    }, {
        xtype: 'statefulcheckbox',
        cls: 'basemap-options',
        name: 'showPoliticalBoundaries',
        stateful: true,
        stateId: 'showPoliticalBoundaries',
        boxLabel: 'Show political boundaries'

    }, {
        xtype: 'statefulcheckbox',
        boxLabel: 'Show legends',
        name: 'showLegends',
        stateful: true,
        stateId: 'showLegends'

    }, {
        xtype: 'statefulcheckbox',
        boxLabel: 'Show line plot',
        name: 'showLinePlot',
        stateful: true,
        stateId: 'showLinePlot'

    }]
});


