Ext.require([
    'Ext.Array',
    'Ext.layout.container.Border',
    'Ext.layout.container.Fit',
    'Ext.panel.Panel',
    'Flux.field.EnumeratedSlider'
]);

Ext.define('Flux.Application', {
    name: 'Flux',

    extend: 'Ext.app.Application',

    views: [
        'ConfigurationPanel',
        'FormPanel',
        'SidePanel',
        'SourcesPanel',
        'Symbology',
        'TabbedPanel'
    ],

    controllers: [
        // TODO: add controllers here
    ],

    stores: [
        // TODO: add stores here
    ]
});
