Ext.define('Flux.controller.Dispatch', {
    extend: 'Ext.app.Controller',

    requires: [
        'Flux.model.Metadata',
        'Flux.store.Grids',
        'Flux.store.Metadata'
    ],

    refs: [{
        ref: 'mapSettings',
        selector: 'mapsettings'
    }, {
        ref: 'sourcesPanel',
        selector: 'sourcespanel'
    }, {
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

    /**
        Convenience function for finding out if the user has specified that
        population statistics should be used (or otherwise).
        @return {Boolean}
     */
    isUsingPopulationStats: function () {
        return (this.getSourcesPanel().down('#stats-from').getValue().statsFrom === 'population');
    },

    ////////////////////////////////////////////////////////////////////////////
    // Event Handlers //////////////////////////////////////////////////////////

    /**
        Fires a request for new map data using the passed params. Optionally
        masks a target component's element until response is received.
        @param  params          {Object}
     */
    loadMap: function (params) {
        var store = this.getStore('grids');
        var cb = Ext.Function.bind(function (recs) {
            var m;

            this.getController('Animation').setTimestamp(recs[0].get('timestamp'));

            if (!this.isUsingPopulationStats()) {
                m = this.getStore('metadata').getById(this._namespaceId).copy();
                m.set('stats', this.summarizeMap(recs[0].get('features')));
                this.onMetadataLoad(undefined, [m]);
            }

            Ext.each(Ext.ComponentQuery.query('d3geopanel'), function (view) {
                view.draw(recs[0])
                    .updateTimestamp(recs[0].get('timestamp'), 'Y m-d H:i');
            });
        }, this);

        if (params) {
            store.load({
                params: params,
                callback: cb
            });
        } else {
            if (store.data.items.length !== 0) {
                store.reload({
                    callback: cb
                });
            }
        }

    },

    /**
        Handles a change to the measure of central tendency through one of the
        global checkboxes.
        @param  cb  {Ext.form.field.Checkbox}
     */
    onGlobalTendencyChange: function (cb) {
        this.getController('MapController').updateColorScale({
            tendency: cb.name
        });
    },

    /**
        Handles the callback from the Metadata store when loaded.
        @param  store   {Ext.data.Store}
        @param  recs    {Array}
     */
    onMetadataLoad: function (store, recs) {
        // This is not needed as long as the "domain" field is set next
        // this.getController('MapController').updateColorScale({}, recs[0]);
        Ext.each(Ext.ComponentQuery.query('d3geopanel'), function (view) {
            // IMPORTANT: Pass the Metadata to the view if loading a map
            //  for the first time (first-time configuration)
            view.configure(recs[0]);
        });

        // Initialize the values of the domain bounds and threshold sliders
        Ext.each(this.getSymbology().query('enumslider'), function (cmp) {
            cmp.setBounds([
                recs[0].get('stats').min,
                recs[0].get('stats').max
            ]);
        });

        this.getController('MapController').updateColorScale(this.getSymbology().getForm().getValues());

        this.getController('Animation').enableAnimation(recs[0]);
    },

    /**
        Propagates a change in the source of summary statistics. If population
        statistics are used, the downstream effects of loading Metadata are
        activated. Otherwise, the current map is reloaded to trigger the use
        of the current map's summary statistics instead.
        @param  f       {Ext.form.field.*}
        @param  value   {Object}
     */
    onStatsChange: function (f, value) {
        if (value.statsFrom === 'population') {
            this.onMetadataLoad(undefined, [
                this.getStore('metadata').getById(this._namespaceId).copy()
            ]);
        } else {
            this.loadMap();
        }
    },

    /**
        Retains a reference to the namespace ID (data source or scenario name
        used in future API requests) and calls on stores to update their proxies
        accordingly.
        @param  ns  {String}
     */
    setRequestNamespace: function (ns) {
        this._namespaceId = ns;
        this.getStore('grids').setProxyNamespace(ns, true); // No caching
    },

    /**
        Summarizes the values of a given Array.
        @param  data    {Array}
        @return {Object}
     */
    summarizeMap: function (data) {
        var s = this.Stats(data);
        return {
            min: Ext.Array.min(data),
            max: Ext.Array.max(data),
            mean: s.mean(),
            std: s.stdDev(),
            median: s.median()
        };
    },

    /**
        Returns an object which can be used to calculate statistics on the
        the passed numeric Array.
        @param  arr {Array}
        @return {Stats}
     */
    Stats: function (arr) {
        arr = arr || [];

        this.arithmeticMean = function () {
            var i, sum = 0;
     
            for (i = 0; i < arr.length; i += 1) {
                sum += arr[i];
            }
     
            return sum / arr.length;
        };
     
        this.mean = this.arithmeticMean;
     
        this.stdDev = function () {
            var mean, i, sum = 0;
     
            mean = this.arithmeticMean();
            for (i = 0; i < arr.length; i += 1) {
                sum += Math.pow(arr[i] - mean, 2);
            }
     
            return Math.pow(sum / arr.length, 0.5);
        };
     
        this.median = function () {
            var middleValueId = Math.floor(arr.length / 2);
     
            return arr.slice().sort(function (a, b) {
                return a - b;
            })[middleValueId];
        };
     
        return this;
    }

});


