Ext.define('Flux.model.CoordView', {
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
        name: 'end',
        type: 'date',
        dateFormat: 'Y-m-d'
    }, {
        name: 'view',
        type: 'auto'
    }]

});
