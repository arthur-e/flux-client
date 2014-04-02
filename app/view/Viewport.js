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
                    width: 220,
                    items: [{
                        text: 'Clear Local Settings',
                        itemId: 'clear-local-state',
                        iconCls: 'icon-app-form-del icon-medium'
                    }, {
                        xtype: 'menuseparator'
                    }, {
                        text: 'Measure of Central Tendency:',
                        cls: 'ui-menu-group-text',
                        plain: true
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
                cls: 'anim-btn',
                itemId: 'animate-btn',
                iconCls: 'icon-control-play-gray',
                text: 'Animate',
                enableToggle: true,
                tooltip: 'Animate the visualization with time',
                disabled: true
            }, {
                xtype: 'button',
                cls: 'anim-btn',
                itemId: 'animation-settings-btn',
                iconCls: 'icon-cog',
                tooltip: 'Change animation settings...',
                disabled: true,
                menu: {
                    itemId: 'anim-settings-menu',
                    items: [{
                        text: 'Steps each frame:',
                        cls: 'ui-menu-group-text',
                        plain: true
                    }, {
                        xtype: 'combo',
                        valueField: 'stepSize',
                        queryMode: 'local'
                    }]
                }
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
                cls: 'anim-btn',
                itemId: 'backward-btn',
                iconCls: 'icon-control-left',
                tooltip: 'Step backwards',
                disabled: true
            }, {
                xtype: 'button',
                cls: 'anim-btn',
                itemId: 'forward-btn',
                iconCls: 'icon-control-right',
                tooltip: 'Step forwards',
                disabled: true
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
