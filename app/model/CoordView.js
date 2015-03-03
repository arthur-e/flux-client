// This model defines a "Coordinated View;" one of the map panels that is displayed in a grid in the Coordinated View visualization. Practically, these are used to populate the grid on the left-hand side. Each `CoordView` remembers the data source (scenario name), the time stamp of the current data view, and human-readable date date string(s). Most importantly, it contains a reference to the Panel instance on the right-hand side to which it corresponds.

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
