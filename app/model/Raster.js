Ext.define('Flux.model.Raster', {
    extend: 'Flux.model.AbstractFeature',

    fields: ['_id', {
        name: 'timestamp',
        type: Ext.data.Types.Moment
    }, {
        name: 'features',
        type: 'auto'
    }, {
        name: 'properties',
        type: 'auto'
    }]

});
