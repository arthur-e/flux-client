Ext.require([
    'Ext.Array',
    'Ext.data.ArrayStore',
    'Ext.menu.Menu',
    'Ext.menu.Item',
    'Ext.view.View',
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
        'FormInteraction',
        'MapController',
        'UserExperience'
    ],

    stores: [
        'Metadata',
        'Palettes',
        'Scenarios'
    ]
});
