Ext.require([
    'Ext.data.ArrayStore',
    'Flux.field.EnumeratedSlider'
]);

Ext.define('Flux.Application', {
    name: 'Flux',

    extend: 'Ext.app.Application',

    views: [
        'ConfigurationPanel',
        'D3Panel',
        'D3GeographicPanel',
        'FormPanel',
        'MapSettings',
        'SidePanel',
        'SourcesPanel',
        'Symbology',
        'TabbedPanel',
        'Viewport'
    ],

    controllers: [
        'MapController'
    ],

    stores: [
        'Palettes'
    ]
});
