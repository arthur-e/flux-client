Ext.define('Flux.view.Viewport', {
    extend: 'Ext.container.Viewport',
    requires: [
        'Ext.layout.container.Border',
        'Ext.layout.container.Fit',
        'Ext.menu.Menu',
        'Ext.menu.Item',
        'Ext.menu.Separator',
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
            itemId: 'top-toolbar',
            dock: 'top',
            border: false,
            defaults: {
                scale: 'medium'
            },
            items: [{
                xtype: 'button',
                text: 'Select Visualization',
                disabled: true//TODO
            }, {
                xtype: 'button',
                text: 'Settings',
                menu: {
                    itemId: 'settings-menu',
                    showSeparator: false,
                    items: [{
                        text: 'Clear Local Settings',
                        itemId: 'clear-local-state',
                        iconCls: 'icon-app-form-del icon-medium'
                    }, {
                        xtype: 'menuseparator'
                    }, {
                        text: 'Measure of Central Tendency:',
                        cls: 'ui-menu-group-text'
                    }, {
                        xtype: 'menucheckitem',
                        name: 'mean',
                        stateful: true,
                        stateId: 'tendencyMean',
                        text: 'Mean',
                        group: 'm'
                    }, {
                        xtype: 'menucheckitem',
                        name: 'median',
                        stateful: true,
                        stateId: 'tendencyMedian',
                        text: 'Median',
                        group: 'm'
                    }]
                }
            }, {
                xtype: 'button',
                itemId: 'animate-btn',
                iconCls: 'icon-control-play-gray',
                text: 'Animate',
                enableToggle: true,
                tooltip: 'Animate the visualization with time',
                disabled: true//TODO
            }, {
                xtype: 'button',
                itemId: 'animation-settings-btn',
                iconCls: 'icon-cog',
                tooltip: 'Change animation settings...',
                disabled: true//TODO
            }, {
                xtype: 'slider',
                name: 'animationDelay',
                stateful: true,
                stateId: 'animationDelay',
                width: '10%',
                maxWidth: 150,
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
            }, {
                xtype: 'button',
                iconCls: 'icon-control-left',
                tooltip: 'Step backwards'
            }, {
                xtype: 'button',
                iconCls: 'icon-control-right',
                tooltip: 'Step forwards'
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
