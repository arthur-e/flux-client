Ext.define('Flux.model.Geometry', {
    extend: 'Ext.data.Model',

    requires: [],

    fields: [{
        name: 'type',
        type: 'string'
    }, {
        name: 'coordinates',
        type: 'auto'
    }]

});
