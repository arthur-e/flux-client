Ext.define('Flux.model.Overlay', {
    extend: 'Flux.model.AbstractFeature',

    fields: ['_id', {
        name: 'timestamp',
        type: Ext.data.Types.Moment
    }, {
        name: 'features',
        type: 'auto'
    }]

});
