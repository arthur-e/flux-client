Ext.define('Flux.view.Viewport', {
    extend: 'Ext.container.Viewport',
    requires: [
        'Ext.layout.container.Border',
        'Ext.layout.container.Fit',
        'Ext.panel.Panel',
        'Ext.slider.Single'
    ],

    layout: {
        type: 'fit'
    },

    items: {
        xtype: 'panel',

        layout: {
            type: 'border'
        },

        tbar: {
            xtype: 'toolbar',
            dock: 'top',
            items: [{
                xtype: 'button',
                disabled: true,
                text: 'Select Visualization'
            }, {
                xtype: 'button',
                disabled: true,
                text: 'Settings'
            }, {
                xtype: 'button',
                disabled: true,
                iconCls: 'icon-control-play-gray',
                text: 'Animate'
            }, {
                xtype: 'slider',
                disabled: true,
                width: '10%',
                maxWidth: 200,
                value: 1,
                minValue: 1,
                maxValue: 5,
                tipText: function (thumb) {
                    return '<b>Animation Speed: </b>' + String(thumb.slider.getValue()) + ' seconds';
                }
            }]
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
    }
});
