Ext.define('Flux.store.Scenarios', {
    extend: 'Ext.data.Store',
    requires: [
        'Ext.data.Request',
        'Ext.data.proxy.Rest'
    ],
    model: 'Flux.model.Scenario',
    storeId: 'scenarios',
    proxy: {
        type: 'rest',
        url: '/flux/api/scenarios.json',
        noCache: false
    },
    reader: {
        type: 'json',
        idProperty: '_id'
    }
});
