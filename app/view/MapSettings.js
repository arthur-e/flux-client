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
        stateId: 'showLegends',
        boxLabel: 'Show legend(s)'

    }, {
        xtype: 'checkbox',
        name: 'showLinePlot',
        disabled: true,//TODO
        stateId: 'showLinePlot',
        boxLabel: 'Show line plot'

    }]
});


