Ext.define('Flux.view.SidePanel', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.sidepanel',
    requires:[
        'Ext.layout.container.Fit'
    ],

    collapsible: true,
    resizable: true,
    titleCollapse: true,

    layout: {
        type: 'fit'
    },

    maxWidth: 250
});
