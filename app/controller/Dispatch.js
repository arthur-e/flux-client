Ext.define('Flux.controller.Dispatch', {
    extend: 'Ext.app.Controller',

    refs: [{
        ref: 'viewport',
        selector: 'viewport'
    }, {
        ref: 'symbology',
        selector: 'symbology'
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

        this.control({});

    },

    ////////////////////////////////////////////////////////////////////////////
    // Event Handlers //////////////////////////////////////////////////////////

    /**
        Fires a request for new map data using the passed params. Optionally
        masks a target component's element until response is received.
        @param  params      {Object}
        @param  maskTarget  {Ext.Component}
     */
    loadMap: function (params, maskTarget) {
        var meta = this.getStore('metadata').getById(this._namespaceId);

        if (maskTarget) {
            maskTarget.getEl().mask('Loading...');
        }

        this.getStore('grids').load({
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

    /**
        Handles a change to the measure of central tendency through one of the
        global checkboxes.
        @param  cb  {Ext.form.field.Checkbox}
     */
    onGlobalTendencyChange: function (cb) {
        this.getController('MapController').updateColorScale({
            tendency: cb.name
        }, this.getStore('metadata').getById(this._namespaceId));
    },

    /**
        Handles the callback from the Metadata store when loaded.
        @param  store   {Ext.data.Store}
        @param  recs    {Array}
     */
    onMetadataLoad: function (store, recs) {
        // This is not needed as long as the "domain" field is set next
        // this.getController('MapController').updateColorScale({}, recs[0]);

        // Initialize the values of the domain bounds slider
        this.getSymbology().down('fieldcontainer[name=domain]').setValues([
            recs[0].get('stats').min,
            recs[0].get('stats').max
        ]);
    },

    /**
        Retains a reference to the namespace ID (data source or scenario name
        used in future API requests) and calls on stores to update their proxies
        accordingly.
        @param  ns  {String}
     */
    setRequestNamespace: function (ns) {
        this._namespaceId = ns;
        this.getStore('grids').setProxyNamespace(ns, false);
    }

});


