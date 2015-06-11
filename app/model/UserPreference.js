Ext.define('Flux.model.UserPreference', {
    extend: 'Ext.data.Model',

    fields: [
        'property',
        'value'
    ],

    proxy: {
        type: 'localstorage',
        id: 'user-preferences'
    }

});
