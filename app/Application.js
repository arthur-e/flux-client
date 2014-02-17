Ext.require([
    'Ext.Array',
    'Ext.layout.container.Border',
    'Ext.layout.container.Fit',
    'Ext.panel.Panel'
]);

Ext.define('Flux.Application', {
    name: 'Flux',

    extend: 'Ext.app.Application',

    views: [
        'FormPanel',
        'SidePanel',
        'SourcesPanel'
    ],

    controllers: [
        // TODO: add controllers here
    ],

    stores: [
        // TODO: add stores here
    ]
});
