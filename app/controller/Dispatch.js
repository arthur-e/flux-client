Ext.define('Flux.controller.Dispatch', {
    extend: 'Ext.app.Controller',

    init: function () {

        Ext.create('Flux.store.Grids', {
            storeId: 'grids'
        });        

        ////////////////////////////////////////////////////////////////////////
        // Event Listeners /////////////////////////////////////////////////////

        this.control({

        });

    },

    ////////////////////////////////////////////////////////////////////////////
    // Event Handlers //////////////////////////////////////////////////////////

    /**
     */
    loadMap: function (params) {
        console.log(params);//FIXME

        var meta = Ext.StoreManager.get('metadata').getById(this._namespaceId);
        var view = Ext.ComponentQuery.query('d3geopanel')[0];

        Ext.StoreManager.get('grids').load({
            params: params,
            callback: function (recs) {
                view.draw(recs[0].get('features'), meta);
            }
        });

    },

    /**
     */
    setRequestNamespace: function (ns) {
        this._namespaceId = ns;
        Ext.StoreManager.get('grids').setProxyNamespace(ns, false);
    },


});

