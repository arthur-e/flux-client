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
            border: false,
            defaults: {
                scale: 'medium'
            },
            items: [{
                xtype: 'button',
                text: 'Select Visualization'
            }, {
                xtype: 'button',
                text: 'Settings',
                menu: {
                    showSeparator: false,
                    items: [{
                        text: 'Clear Local Settings',
                        itemId: 'clear-local-state',
                        iconCls: 'icon-app-form-del icon-medium'
                    }]
                }
            }, {
                xtype: 'button',
                iconCls: 'icon-control-play-gray',
                text: 'Animate',
                enableToggle: true
            }, {
                xtype: 'slider',
                name: 'animationDelay',
                stateful: true,
                stateId: 'animationDelay',
                width: '10%',
                maxWidth: 200,
                value: 1,
                minValue: 1,
                maxValue: 5,
                tipText: function (thumb) {
                    return '<b>Animation Speed: </b>' + String(thumb.slider.getValue()) + ' seconds';
                },
                stateEvents: ['dragend'],
                applyState: function (state) {
                    this.setValue(state.value);
                },
                getState: function () {
                    return {
                        value: this.getValue()
                    }
                }
            }]
        },

        items: [{
            region: 'west',
            xtype: 'sidepanel',
            stateId: 'westSidePanel',
            title: 'Data Sources',
            border: true,
            width: '20%',
            items: {
                xtype: 'sourcespanel'
            }
        }, {
            region: 'center',
            xtype: 'd3geopanel',
            title: 'Single Map',
            border: true
        }, {
            region: 'east',
            xtype: 'sidepanel',
            stateId: 'eastSidePanel',
            title: 'Plot Configuration',
            border: true,
            width: '20%',
            items: {
                xtype: 'configpanel',
                items: [{
                    xtype: 'symbology',
                    title: 'Symbology'
                }, {
                    xtype: 'mapsettings',
                    title: 'Map Settings'
                }]
            }
        }]
    }
});
