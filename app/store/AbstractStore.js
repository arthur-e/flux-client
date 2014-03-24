/**
    Not meant to be instantiated directly. Subclasses must have a "resource"
    attribute which defines the endpoint of the REST API.
 */
Ext.define('Flux.store.AbstractStore', {
    extend: 'Ext.data.Store',
    autoLoad: false,
    requires: [
        'Ext.data.proxy.Rest'
    ],
    reader: {
        type: 'json',
        idProperty: '_id'
    },

    /**
        Updates the scenario name specified in the Store's Proxy as its URL
        e.g. /flux/api/scenarios/casa_gfed_2004/resource.json where casa_gfed_2004
        is the scenario name.
        @param  ns      {String}
        @param  noCache {Boolean}
     */
    setProxyNamespace: function (ns, noCache) {
        noCache = !(noCache === false);
        this.setProxy(Ext.create('Ext.data.proxy.Rest', {
            url: Ext.String.format('/flux/api/scenarios/{0}/{1}', ns,
                this.resource),
            noCache: noCache
        }));
    }
});