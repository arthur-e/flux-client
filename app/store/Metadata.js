Ext.define('Flux.store.Metadata', {
    extend: 'Ext.data.Store',
    requires: [
        'Ext.data.proxy.Rest'
    ],
    model: 'Flux.model.Metadata',
    storeId: 'metadata',
    proxy: {
        type: 'rest',
        url: '/flux-client/_example_metadata.json', //TODO
        noCache: false
    },
    reader: {
        type: 'json',
        idProperty: 'rid'
    }
});
