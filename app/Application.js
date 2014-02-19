Ext.require([
    'Flux.field.EnumeratedSlider'
]);

Ext.define('Flux.Application', {
    name: 'Flux',

    extend: 'Ext.app.Application',

    views: [
        'ConfigurationPanel',
        'FormPanel',
        'MapSettings',
        'SidePanel',
        'SourcesPanel',
        'Symbology',
        'TabbedPanel',
        'Viewport'
    ],

    controllers: [
        // TODO: add controllers here
    ],

    stores: [
        'Palettes'
    ]
});
