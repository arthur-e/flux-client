Ext.define('Flux.controller.Dispatch', {
    extend: 'Ext.app.Controller',

    requires: [
        'Flux.model.Metadata',
        'Flux.store.Grids',
        'Flux.store.Metadata'
    ],

    refs: [{
        ref: 'settingsMenu',
        selector: '#settings-menu'
    }, {
        ref: 'sourcePanel',
        selector: 'sourcepanel'
    }, {
        ref: 'symbology',
        selector: 'symbology'
    }],

    init: function () {

        Ext.create('Flux.store.Scenarios', {
            autoLoad: true,
            storeId: 'scenarios'
        });

        Ext.create('Flux.store.Grids', {
            storeId: 'grids'
        });

        Ext.create('Flux.store.Metadata', {
            storeId: 'metadata',
            listeners: {
                load: Ext.Function.bind(this.onMetadataLoad, this)
            }
        });

        ////////////////////////////////////////////////////////////////////////
        // Event Listeners /////////////////////////////////////////////////////

        this.control({});

    },

    /**
        An associative array (Object) mapping views by their IDs to their
        attributes (e.g. the current timestamp) which may be needed by this
        Controller to assess the current application state.
     */
    activeViews: {},

    /**
        Adds a new view to the activeViews associative array, registering its
        attributes (e.g. the current timestamp) by its ID ("id" property") so
        that they are available to this Controller for assessing current
        application state.
        @param  view    {String|Ext.Component}
        @param  attrs   {Object}
     */
    addViewAttrs: function (view, attrs) {
        var id = view;
        if (typeof view !== 'string') {
            id = view.getId();
        }

        if (this.activeViews[id]) {
            this.activeViews[id] = Ext.Object.merge(this.activeViews[id], attrs);
        } else {
            this.activeViews[id] = attrs;
        }
    },

    /**
        Return the attributes associated with a registered active view.
        @param  id  {String}
     */
    getViewAttrs: function (id) {
        return this.activeViews[id];
    },

    /**TODO
        Convenience function for determining the currently selected global
        tendency--mean or median.
        @return {String}
     */
    getGlobalSettings: function () {
        var opts = {};

        Ext.each(this.getSettingsMenu().query('menucheckitem'), function (item) {
            if (item.checked) {
                opts[item.group] = item.name;
            }
        });

        return opts;
    },

    ////////////////////////////////////////////////////////////////////////////
    // Event Handlers //////////////////////////////////////////////////////////

    /**
        Prepares and executes an aggregation request; calls loadMap() with the
        parameters needed for aggregation in the REST API.
        @param  args    {Object}
     */
    aggregate: function (args) {
        Ext.each(Ext.ComponentQuery.query('d3geopanel'), Ext.Function.bind(function (view) {
            var attrs = this.getViewAttrs(view.getId());
            var date;
            var params;

            if (!attrs) {
                return;
            }

            params = {
                aggregate: args.aggregate,
                start: attrs.moment.toISOString(),
                end: attrs.moment.clone().add(args.intervals,
                    args.intervalGrouping).toISOString()
            };

            //FIXME Do for a specific view
            this.loadMap(params, 'd3geopanel', this.getSourcePanel());
        }, this));
    },

    /** 
        Fires a request for new map data using the passed params. Optionally
        masks a target component's element until response is received.
        @param  params      {Object}
        @param  selector    {String}
        @param  maskTarget  {Ext.Component}
     */
    loadMap: function (params, selector, maskTarget) {
        var cb = this.onMapLoad;
        var dispatch = this;
        var store = this.getStore('grids');

        if (maskTarget) {
            maskTarget.getEl().mask('Loading...');
            cb = Ext.Function.createSequence(cb, function () {
                maskTarget.getEl().unmask();
            });
        }

        Ext.each(Ext.ComponentQuery.query(selector || 'd3geopanel'), function (view) {
            cb = Ext.Function.createSequence(cb, function (recs, op) {
                var ts = moment.utc(recs[0].get('timestamp'));
                var start, end;

                dispatch.getController('Animation').setTimestamp(this.getId(), ts);
                dispatch.addViewAttrs(this, {
                    moment: ts
                });

                this.draw(recs[0]);

                if (op) {
                    if (op.params.aggregate) {
                        return this.updateTimestamp([
                            moment.utc(op.params.start),
                            moment.utc(op.params.end)
                        ]);
                    }
                }

                this.updateTimestamp(ts);
            }, view);
        });

        if (params) {
            store.load({
                params: params,
                callback: cb,
                scope: this
            });
        } else {
            if (store.data.items.length !== 0) {
                store.reload({
                    callback: cb,
                    scope: this
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
        The callback function for when a map is loaded; can be called on its own
        with cached records.
        @param  recs    {Array|Flux.model.Grid}
        @param  op      {Ext.data.Operation}
     */
    onMapLoad: function (recs, op) {
        var m, measure, rec;
        var meta = this.getStore('metadata').getById(this._namespaceId);
        var opts = this.getGlobalSettings();

        if (Ext.isArray(recs)) {        
            rec = recs[0];
        } else {
            rec = recs;
        }

        measure = meta.get('stats')[opts.tendency];

        // In the case that population statistics are not used, we need to
        //  calculate summary statistics for this individual data frame
        if (opts.statsFrom === 'data') {
            // We modify a copy of the Metadata so that it has summary stats
            //  specific to this data frame
            m = meta.copy();
            m.set('stats', this.summarizeMap(rec.get('features')));
            this.onMetadataLoad(undefined, [m]);

            // Find the new measure of central tendency
            measure = m.get('stats')[opts.tendency];
        }

        // If viewing anomalies, take the difference of each value and the measure
        //  of central tendency
        if (opts.display === 'anomalies') {
            rec = rec.copy();
            rec.set('features', Ext.Array.map(rec.get('features'), function (v) {
                return v - measure;
            }));
        }
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
        if (this.getStore('metadata').data.items.length !== 0) {
            if (value.statsFrom === 'population') {
                this.onMetadataLoad(undefined, [
                    this.getStore('metadata').getById(this._namespaceId).copy()
                ]);
            } else {
                this.onMapLoad(this.getStore('grids').last());
            }
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


