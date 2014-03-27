Ext.require([
    'Ext.data.ArrayStore',
    'Ext.data.Request',
    'Ext.state.*',
    'Flux.field.EnumeratedSlider',
    'Flux.field.StatefulCheckbox',
    'Flux.field.StatefulRadioGroup',
    'Flux.store.Scenarios'
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
        'Dispatch',
        'MapController',
        'UserExperience',
        'UserInteraction'
    ],

    stores: [
        'Grids',
        'Metadata',
        'Palettes',
        'Scenarios'
    ]
});
