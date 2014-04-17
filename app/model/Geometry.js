Ext.define('Flux.model.Geometry', {
    extend: 'Ext.data.Model',
    idProperty: '_id',

    fields: [
        '_id', {

        name: 'type',
        type: 'string'
    }, {
        name: 'coordinates',
        type: 'auto'
    }]

});
