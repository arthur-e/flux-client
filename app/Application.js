Ext.require([
    'Ext.Array',
    'Ext.data.ArrayStore',
    'Ext.view.View',
    'Ext.state.*',
    'Flux.field.EnumeratedSlider',
    'Flux.field.StatefulCheckbox',
    'Flux.field.StatefulRadioGroup'
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
        'MapController',
        'UserExperience'
    ],

    stores: [
        'Palettes'
    ]
});
