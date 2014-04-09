Ext.define('Flux.model.Grid', {
    extend: 'Ext.data.Model',

    requires: [],

    fields: [{
        name: 'timestamp',
        type: 'moment',
        dateFormat: 'c' // ISO 8601 date
    }, {
        name: 'features',
        type: 'auto'
    }]

});
