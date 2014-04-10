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

        // Toolbar Items ///////////////////////////////////////////////////////
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
                menu: {
                    items: [{
                        text: 'Single Map'
                    }, {
                        text: 'Coordinated View'
                    }]
                }
            }, {
                xtype: 'button',
                itemId: 'get-share-link',
                tooltip: 'Get a link to share the current view...',
                iconCls: 'icon-link'
            }, {
                xtype: 'button',
                itemId: 'settings-btn',
                iconCls: 'icon-cog',
                menu: {
                    itemId: 'settings-menu',
                    items: [{
                        text: 'Clear Local Settings',
                        itemId: 'clear-local-state',
                        iconCls: 'icon-app-form-del icon-medium'
                    }, {
                        xtype: 'menuseparator'
                    }, {
                        text: 'Measure of central tendency:',
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
                    }, {
                        xtype: 'menuseparator'
                    }, {
                        text: 'Steps each animation frame:',
                        cls: 'ui-menu-group-text',
                        name: 'steps',
                        plain: true
                    }, {
                        xtype: 'combo',
                        name: 'stepSize',
                        valueField: 'stepSize',
                        queryMode: 'local'
                    }]
                }
            }, {
                xtype: 'button',
                cls: 'anim-btn',
                itemId: 'animate-btn',
                iconCls: 'icon-control-play',
                text: 'Animate',
                enableToggle: true,
                tooltip: 'Animate the visualization with time',
                disabled: true
            }, {
                xtype: 'slider',
                itemId: 'animate-delay',
                stateful: true,
                stateId: 'animateDelay',
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

        ////////////////////////////////////////////////////////////////////////
        // Layout Items ////////////////////////////////////////////////////////
        items: [{
            region: 'west',
            xtype: 'sidepanel',
            resizeHandles: 'e',
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
            resizeHandles: 'w',
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
