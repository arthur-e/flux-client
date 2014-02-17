Ext.define('Flux.view.Viewport', {
    extend: 'Ext.container.Viewport',
    requires: [
        'Ext.layout.container.Border'
    ],

    layout: {
        type: 'border'
    },

    items: [{
        region: 'west',
        xtype: 'sidepanel',
        title: 'Data Sources',
        width: '20%',
        items: {
            xtype: 'sourcespanel'
        }
    }, {
        region: 'center',
        xtype: 'panel',
        html: 'view.MapPanel.js'
    }, {
        region: 'east',
        xtype: 'sidepanel',
        title: 'Map Settings',
        width: '20%',
        items: {
            xtype: 'configpanel',
            items: [{
                xtype: 'symbology',
                title: 'Symbology'
            }]
        }
    }]
});
