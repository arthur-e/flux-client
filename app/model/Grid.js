Ext.define('Flux.model.Grid', {
    extend: 'Ext.data.Model',

    requires: [],

    fields: [{
        name: 'timestamp',
        type: 'date',
        dateFormat: 'c' // ISO 8601 date
    }, {
        name: 'features',
        type: 'auto'
    }]

});
