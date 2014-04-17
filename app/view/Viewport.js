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
                    itemId: 'visual-menu',
                    defaults: {
                        height: 36,
                        cls: 'ui-app-menu-item'
                    },
                    items: [{
                        text: 'Single Map',
                        itemId: 'single-map',
                        iconCls: 'icon-single-map ui-app-icon',
                        idx: 0
                    }, {
                        text: 'Coordinated View',
                        itemId: 'coordinated-view',
                        iconCls: 'icon-coord-view ui-app-icon',
                        idx: 1
                    }, {
                        text: 'Multiplot',
                        itemId: 'multiplot',
                        iconCls: 'icon-multiplot ui-app-icon',
                        idx: 2
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
                        xtype: 'recheckitem',
                        name: 'median',
                        checked: true,
                        stateful: true,
                        stateId: 'tendencyMedian',
                        text: 'Median',
                        group: 'tendency',
                        hideOnClick: false
                    }, {
                        xtype: 'recheckitem',
                        name: 'mean',
                        stateful: true,
                        stateId: 'tendencyMean',
                        text: 'Mean',
                        group: 'tendency',
                        hideOnClick: false
                    }, {
                        xtype: 'menuseparator'
                    }, {
                        text: 'Get statistics from:',
                        cls: 'ui-menu-group-text',
                        plain: true
                    }, {
                        xtype: 'recheckitem',
                        name: 'population',
                        checked: true,
                        stateful: true,
                        stateId: 'statsFromPopulation',
                        text: 'Population',
                        group: 'statsFrom',
                        hideOnClick: false
                    }, {
                        xtype: 'recheckitem',
                        name: 'data',
                        stateful: true,
                        stateId: 'statsFromData',
                        text: 'Current Data Frame',
                        group: 'statsFrom',
                        hideOnClick: false
                    }, {
                        xtype: 'menuseparator'
                    }, {
                        text: 'Values displayed as:',
                        cls: 'ui-menu-group-text',
                        plain: true
                    }, {
                        xtype: 'recheckitem',
                        name: 'values',
                        checked: true,
                        stateful: true,
                        stateId: 'displayValues',
                        text: 'Raw Values',
                        group: 'display',
                        hideOnClick: false
                    }, {
                        xtype: 'recheckitem',
                        name: 'anomalies',
                        stateful: true,
                        stateId: 'displayAnomalies',
                        text: 'Anomalies',
                        group: 'display',
                        hideOnClick: false
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
                        queryMode: 'local',
                        hideOnClick: false
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
            xtype: 'sourcecarousel',
            resizeHandles: 'e',
            stateId: 'westSidePanel',
            title: 'Data Sources',
            border: true,
            width: '20%',
            items: [{
//                xtype: 'sourcepanel',
//                id: 'single-map'
//            }, {
                xtype: 'sourcesgridpanel',
                id: 'coordinated-view'
            }]
        }, {
            region: 'center',
            id: 'content',
            xtype: 'panel',
            border: false,
            layout: {
                type: 'anchor',
                reserveScrollbar: false
            },
            bodyStyle: 'background-color:#aaa;',
            items: [],
            bbar: {
                border: true,
                style: {
                    borderColor: '#157fcc',
                    backgroundColor: '#aaa'
                },
                items: ['->', {
                    xtype: 'tbitem',
                    width: 150,
                    height: 45,
                    html: '<a href="http://mtu.edu"><img src="/flux-client/resources/MTRI_logo_dark_bg.png" /></a>'
                }]
            }
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
