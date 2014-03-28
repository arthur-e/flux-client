Ext.define('Flux.controller.Dispatch', {
    extend: 'Ext.app.Controller',

    refs: [{
        ref: 'viewport',
        selector: 'viewport'
    }],

    init: function () {

        Ext.create('Flux.store.Grids', {
            storeId: 'grids'
        });

        Ext.create('Flux.store.Metadata', {
            storeId: 'metadata',
            listeners: {
                load: Ext.Function.bind(this.onMetadataLoad, this)
            }
        })

        ////////////////////////////////////////////////////////////////////////
        // Event Listeners /////////////////////////////////////////////////////

        this.control({

        });

    },

    ////////////////////////////////////////////////////////////////////////////
    // Event Handlers //////////////////////////////////////////////////////////

    /**TODO ???
     */
    loadMap: function (params, maskTarget) {
        var meta = this.getStore('metadata').getById(this._namespaceId);

        if (maskTarget) {
            maskTarget.getEl().mask('Loading...');
        }

        Ext.StoreManager.get('grids').load({
            params: params,
            callback: function (recs) {
                if (maskTarget) {
                    maskTarget.getEl().unmask();
                }

                Ext.each(Ext.ComponentQuery.query('d3geopanel'), function (view) {
                    view.draw(recs[0].get('features'), meta);
                });
            }
        });

    },

    /**TODO
     */
    onGlobalTendencyChange: function (cb) {
        this.getController('MapController').updateColorScale({
            tendency: cb.name
        }, this.getStore('metadata').getById(this._namespaceId));
    },

    /**
     */
    onMetadataLoad: function (store, recs) {
        this.getController('MapController').updateColorScale({}, recs[0]);
    },

    /**
     */
    setRequestNamespace: function (ns) {
        this._namespaceId = ns;
        Ext.StoreManager.get('grids').setProxyNamespace(ns, false);
    },


});

