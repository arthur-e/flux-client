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
        xtype: 'checkbox',
        cls: 'basemap-options',
        name: 'showBasemapOutlines',
        stateful: true,
        stateId: 'showBasemapOutlines',
        boxLabel: 'Basemap outlines only',
        handler: function () {
            if (this.getValue()) {
                this.nextSibling().disable();
            } else {
                this.nextSibling().enable();
            }
        }

    }, {
        xtype: 'checkbox',
        cls: 'basemap-options',
        name: 'showPoliticalBoundaries',
        stateful: true,
        stateId: 'showPoliticalBoundaries',
        boxLabel: 'Show political boundaries'

    }, {
        xtype: 'checkbox',
        boxLabel: 'Show legends',
        name: 'showLegends',
        stateful: true,
        stateId: 'showLegends'

    }, {
        xtype: 'checkbox',
        boxLabel: 'Show line plot',
        name: 'showLinePlot',
        stateful: true,
        stateId: 'showLinePlot'

    }]
});


