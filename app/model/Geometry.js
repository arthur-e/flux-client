Ext.define('Flux.model.Geometry', {
    extend: 'Ext.data.Model',
    idProperty: 'viewId',

    fields: [
        // The ID of the view (Flux.view.*) instance
        'viewId', {

        name: 'type',
        type: 'string'
    }, {
        name: 'coordinates',
        type: 'auto'
    }]

});
