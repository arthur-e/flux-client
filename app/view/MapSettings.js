Ext.define('Flux.view.MapSettings', {
    extend: 'Flux.view.FormPanel',
    alias: 'widget.mapsettings',

    requires: [
        'Ext.tip.ToolTip'
    ],

    items: [{
        xtype: 'combo',
        name: 'projection',
        fieldLabel: 'Map projection',
        queryMode: 'local',
        valueField: 'id',
        store: Ext.create('Ext.data.ArrayStore', {
            storeId: 'projections',
            fields: ['id', 'text', 'proj']
        })

    }, {
        xtype: 'combo',
        name: 'basemap',
        fieldLabel: 'Basemap',
        queryMode: 'local',
        valueField: 'id',
        store: Ext.create('Ext.data.ArrayStore', {
            storeId: 'basemaps',
            fields: ['id', 'text', 'url']
        }),
        getRecord: function () {
            return this.getStore().findRecord('id', this.getValue());
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
        inputValue: 'showBasemapOutlines',
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
        itemId: 'show-political-boundaries',
        cls: 'basemap-options',
        inputValue: 'showPoliticalBoundaries',
        boxLabel: 'Show political boundaries',
        checked: true

    }, {
        xtype: 'checkbox',
        boxLabel: 'Show legends'

    }, {
        xtype: 'checkbox',
        boxLabel: 'Show line plot'

    }]
});


