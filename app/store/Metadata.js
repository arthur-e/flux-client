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
    },

    /**TODO
     */
    fetch: function (operation, finder) {
        var f;

        if (typeof finder === 'function') {
            f = this.findBy(finder);
        } else {
            f = this.find('_id', operation.params.scenario);
        }

        if (f !== -1) {
            operation.callback.call(operation.scope || this);
            return f;
        }

        this.load(operation);
    }
});
