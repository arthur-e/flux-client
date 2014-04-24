Ext.define('Flux.view.MapSettings', {
    extend: 'Flux.view.FormPanel',
    alias: 'widget.mapsettings',

    requires: [
        'Ext.tip.ToolTip'
    ],

    items: [{
        xtype: 'recombo',
        name: 'projection',
        stateful: true,
        stateId: 'projection',
        fieldLabel: 'Map projection',
        anchor: '100%',
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
        })

    }, {
        xtype: 'recombo',
        name: 'basemap',
        stateful: true,
        stateId: 'basemap',
        fieldLabel: 'Basemap',
        anchor: '100%',
        queryMode: 'local',
        valueField: 'id',
        value: '/flux-client/resources/political-small.topo.json',
        store: Ext.create('Ext.data.ArrayStore', {
            storeId: 'basemaps',
            fields: ['id', 'text', 'url'],
            data: [
                ['/flux-client/resources/political-usa.topo.json', 'U.S.A.'],
                ['/flux-client/resources/political-north-america.topo.json', 'North America'],
                ['/flux-client/resources/political.topo.json', 'Global'],
                ['/flux-client/resources/political-small.topo.json', 'Global (Small Scale)']
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
        listeners: {
            change: function (cb, checked) {
                if (this.up('panel')) {
                    this.up('panel').down('checkbox[name=showPoliticalBoundaries]')
                        .setDisabled(checked);
                }
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

    }]
});


