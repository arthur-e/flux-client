Ext.define('Flux.view.MapSettings', {
    extend: 'Flux.view.FormPanel',
    alias: 'widget.mapsettings',

    items: [{
        xtype: 'combo',
        name: 'projection',
        fieldLabel: 'Map projection',
        queryMode: 'local',
        valueField: 'id',
        value: 'equirectangular',
        store: Ext.create('Ext.data.ArrayStore', {
            storeId: 'projections',
            fields: ['id', 'text'],
            data: [
                ['equirectangular', 'Equirectangular (Plate Carrée)'],
                ['hammer', 'Hammer (Equal-Area)'],
                ['mercator', 'Mercator'],
                ['miller', 'Miller'],
                ['naturalEarth', 'Natural Earth'],
                ['robinson', 'Robinson']
            ]
        }),
        listeners: {
            afterrender: function () {
                this.store.each(function (rec) {
                    var proj = rec.get('id');
                    rec.set('projection', d3.geo[proj]);
                });
            }
        }

    }, {
        xtype: 'combo',
        name: 'basemap',
        fieldLabel: 'Basemap',
        queryMode: 'local',
        valueField: 'id',
        value: 'usa',
        store: Ext.create('Ext.data.ArrayStore', {
            storeId: 'basemaps',
            fields: ['id', 'text', 'url'],
            data: [
                ['usa', 'U.S.A.', '/flux-client/political-usa.topo.json'],
                ['northAmerica', 'North America', '/flux-client/political-north-america.topo.json'],
                ['global', 'Global', '/flux-client/political.topo.json'],
            ]
        })

    }, {
        xtype: 'checkbox',
        boxLabel: 'Show legends'

    }, {
        xtype: 'checkbox',
        boxLabel: 'Show line plot'

    }]
});


