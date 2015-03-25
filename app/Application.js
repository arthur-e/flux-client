Ext.require([
    'Ext.data.ArrayStore',
    'Ext.form.Label',
    'Ext.data.Request',
    'Ext.grid.plugin.RowEditing',
    'Ext.state.*',
    'Flux.field.EnumeratedSlider',
    'Flux.field.StatefulCheckItem',
    'Flux.field.StatefulCheckbox',
    'Flux.field.StatefulComboBox',
    'Flux.field.StatefulFieldSet',
    'Flux.field.StatefulHiddenField',
    'Flux.field.StatefulNumberField',
    'Flux.field.StatefulRadioGroup',
    'Flux.field.StatefulSlider',
    'Flux.store.Scenarios',
    'Flux.type.Moment'
]);

Ext.define('Flux.Application', {
    name: 'Flux',

    extend: 'Ext.app.Application',

    views: [
        'D3Panel',
        'D3GeographicMap',
        'D3LinePlot',
        'FormPanel',
        'MapSettings',
        'NongriddedPanel',
        'RoiOverlayForm',
        'RoiOverlayFormGeoJSON',
        'RoiOverlayFormWKT',
        'SidePanel',
        'SourcePanel',
        'SourcesGridPanel',
        'SourceSelectionCarousel',
        'Symbology',
        'TabbedPanel',
        'Viewport'
    ],

    controllers: [
        'Animation',
        'LinePlotController',
        'MapController',
        'UserExperience',
        'UserInteraction'
    ],

    stores: [
        'Rasters',
        'RasterGrids',
        'Metadata',
        'Palettes',
        'Scenarios',
        'TimeSeries'
    ]
});
