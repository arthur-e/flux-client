// The store where all Metadata instances are stored.

Ext.define('Flux.store.Metadata', {
    extend: 'Ext.data.Store',
    requires: [
        'Ext.data.Request',
        'Ext.data.proxy.Rest'
    ],
    model: 'Flux.model.Metadata',
    storeId: 'metadata',
    proxy: {
        type: 'rest',
        url: '/flux/api/scenarios.json',
        noCache: false,
        pageParam: undefined,
        startParam: undefined,
        limitParam: undefined
    },
    reader: {
        type: 'json',
        idProperty: '_id'
    }

});
