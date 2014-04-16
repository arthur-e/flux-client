Ext.define('Flux.model.GridView', {
    extend: 'Ext.data.Model',
    requires: [
        'Ext.data.Types',
        'Flux.type.Moment'
    ],
    fields: ['source', 'time', {
        name: 'date',
        type: 'date',
        dateFormat: 'Y-m-d'
    }, {
        name: 'view',
        type: 'auto'
    }]

});
