Ext.define('Flux.model.Palette', {
    extend: 'Ext.data.Model',

    idProperty: 'name',

    fields: [
        'name',
        'type',
        {
            name: 'segments',
            type: 'int'
        }, {
            name: 'colors',
            type: 'auto'
        }
    ]

});
