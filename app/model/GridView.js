Ext.define('Flux.model.GridView', {
    extend: 'Ext.data.Model',
    fields: ['source', 'time', {
        name: 'date',
        type: 'date',
        dateFormat: 'Y-m-d'
    }]

});
