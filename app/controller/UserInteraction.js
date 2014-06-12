Ext.define('Flux.controller.UserInteraction', {
    extend: 'Ext.app.Controller',

    refs: [{
        ref: 'contentPanel',
        selector: '#content'
    }, {
        ref: 'linePlot',
        selector: 'd3lineplot'
    }, {
        ref: 'map',
        selector: 'd3geomap'
    }, {
        ref: 'mapSettings',
        selector: 'mapsettings'
    }, {
        ref: 'settingsMenu',
        selector: '#settings-menu'
    }, {
        ref: 'sourceCarousel',
        selector: 'sourcecarousel'
    }, {
        ref: 'sourcePanel',
        selector: 'sourcepanel'
    }, {
        ref: 'sourcesGrid',
        selector: 'sourcesgridpanel'
    }, {
        ref: 'symbology',
        selector: 'symbology'
    }],

    requires: [
        'Ext.data.ArrayStore',
        'Ext.state.CookieProvider',
        'Flux.model.Raster',
        'Flux.model.RasterGrid',
        'Flux.model.Metadata',
        'Flux.store.Rasters',
        'Flux.store.RasterGrids',
        'Flux.store.Metadata'
    ],

    init: function () {
        // Create a new state Provider if one doesn't already exist
        if (Ext.state.Manager.getProvider().path === undefined) {
            Ext.state.Manager.setProvider(Ext.create('Ext.state.CookieProvider'));
        }

        Ext.create('Flux.store.Scenarios', {
            autoLoad: true,
            storeId: 'scenarios'
        });

        Ext.create('Flux.store.RasterGrids', {
            storeId: 'rastergrids'
        });

        Ext.create('Flux.store.Metadata', {
            storeId: 'metadata',
            listeners: {
                add: Ext.bind(this.onMetadataAdded, this)
            }
        });

        Ext.create('Flux.store.TimeSeries', {
            storeId: 'timeseries'
        });

        ////////////////////////////////////////////////////////////////////////
        // Event Listeners /////////////////////////////////////////////////////

        this.control({

            '#content': {
                remove: this.onContentRemove,
                resize: this.onContentResize
            },

            '#settings-menu menucheckitem': {
                checkchange: this.onStatsChange
            },

            '#visual-menu': {
                click: this.onVisualChange
            },

            'd3geomap': {
                plotclick: this.onPlotClick
            },

            'd3geomap #btn-save-image': {
                click: this.onSaveImage
            },

            'field[name=overlay]': {
                change: this.onOverlayChange
            },

            'field[name=source]': {
                change: this.onSourceChange
            },

            'field[name=source2]': {
                change: this.onSourceDifferenceChange
            },

            'field[name=date], field[name=time]': {
                change: this.onDateTimeSelection,
                expand: this.uncheckAggregates
            },

            'sourcesgridpanel': {
                beforeedit: this.onSourceGridEntry
            },

            'sourcepanel fieldset checkbox': {
                change: this.onAggOrDiffToggle
            },

            'sourcepanel #aggregation-fields field': {
                change: this.onAggregationChange
            },

            'sourcepanel #difference-fields field': {
                change: this.onDifferenceChange
            }

        });

        // Late event listeners (need to be bound after state is recalled)
        Ext.onReady(Ext.Function.bind(function () {
            this.control({
                'field[name=showLinePlot]': {
                    change: this.toggleLinePlotDisplay
                }
            });

        }, this));
    },

    /**
        Creates a new instance of Flux.view.D3GeographicMap and inserts it
        into the appropriate place inside a target Anchor layout panel, resizing
        its siblings as necessary.
        @param  title   {String}
        @return         {Flux.view.D3GeographicMap}
     */
    addMap: function (title) {
        var anchor, newView;
        var basemap = this.getMapSettings().down('combo[name=basemap]').getValue();
        var container = this.getContentPanel();
        var query = Ext.ComponentQuery.query('d3geomap');
        var n = container.items.length;
        // Subtract j from the aligning panel's index to find the target panel's index
        var j;

        if (n > 9) {
            return;
        }

        if (query.length === 0) {
            anchor = '100% 100%';
        } else {
            if (n === 1) {
                anchor = '50% 100%';
                j = 2;
            } else if (n < 4) {
                anchor = '50% 50%';
                j = 2;
            } else if (n >= 4 && n < 6) {
                anchor = '33.33% 50%';
                j = 3;
            } else {
                anchor = '33.33% 33.33%';
                j = 3;
            }
        }

        Ext.each(query, function (view) {
            view.anchor = anchor;

            // Add a listener to re-initialize the D3GeographicMap instance
            //  after it has received its layout from the parent container
            view.on('afterlayout', function () {
                this.init(this.getWidth(), this.getHeight())
                    .setBasemap(basemap)
                    .redraw(true);
            }, view, {
                single: true // Remove this listener
            });

            // Calculate the layout for the child panels again
            container.doLayout();
        });

        this.alignContent(query);

        newView = container.add({
            xtype: 'd3geomap',
            title: title,
            anchor: anchor,
            enableDisplay: false,
            timeFormat: 'YYYY-MM-DD [at] HH:ss',
            closable: true
        });

        // j works here because we want the new item to be positioned below
        //  the item at index (n - j) where n is the previous number of panels
        //  and we want the new panel to appear at the star (*):
        //  1   2   3   or  1   2   3   or  1   2
        //  4   5   6       4   5   *       3   *
        //  7   8   *
        // If this is going to make an even-number of views, align this next
        //  view towards-the-right of the last view
        if (n !== 0) {
            if (n % j !== 0) {
                newView.alignTo(query[query.length - 1].getEl(), 'tl-tr');
            } else {
                if ((n - 1) - j < 0) {
                    newView.alignTo(query[0].getEl(), 'tl-bl');
                } else {
                    newView.alignTo(query[n - j].getEl(), 'tl-bl');
                }
            }

        }

        return newView;
    },

    /**
        Aligns existing D3Panel instances that are children of the #content
        panel.
        @param  query   {Array} Result of Ext.ComponentQuery.query()
     */
    alignContent: function (query) {
        var container = this.getContentPanel();

        if (query.length >= 1) {
            Ext.each(query, function (view, i) {
                var j = (query.length <= 4) ? 2 : 3;

                // i refers to the index of the panel being realigned:
                //  0   1   2   or  0   1   2   or  0   1
                //  3   4   5       3   4   5       2   3
                //  6   7   8
                // Align those odd-indexed (towards-the-right) panels
                if (i === 0) {
                    view.alignTo(container.getEl(), 'tl-tl');
                } else {
                    if (i % j !== 0) {
                        view.alignTo(query[i - 1].getEl(), 'tl-tr');
                    } else {
                        if (i - j < 0) {
                            view.alignTo(query[0].getEl(), 'tl-bl');
                        } else {
                            view.alignTo(query[i - j].getEl(), 'tl-bl');
                        }
                    }
                }
            });
        }
    },

    /**
        Makes a requests for a map based on the given parameters, first checking
        to see if the map has already been loaded by the view; requests it from
        the server only if it has not been loaded.
        @param  view    {Flux.view.D3GeographicMap}
        @param  params  {Object}
     */
    fetchMap: function (view, params) {
        var raster, source;

        if (!view.getMetadata()) {
            return;
        }

        source = view.getMetadata().getId();

        // Check for the unique ID, a hash of the parameters passed in this
        //  request
        raster = view.store.getById(Ext.Object.toQueryString(params));
        if (raster) {
            this.bindRaster(view, raster);
            this.onMapLoad(raster);
            return;
        }

        Ext.Ajax.request({
            method: 'GET',
            url: Ext.String.format('/flux/api/scenarios/{0}/xy.json', source),
            params: params,
            callback: function (opts, success, response) {
                var rast;

                if (!success) {
                    return;
                }

                rast = Ext.create('Flux.model.Raster',
                    Ext.JSON.decode(response.responseText));

                // Create a unique ID that can be used to find this grid
                rast.set('_id', Ext.Object.toQueryString(opts.params));

                this.bindRaster(view, rast);
                this.onMapLoad(rast);
            },
            failure: function (response) {
                Ext.Msg.alert('Request Error', response.responseText);
            },
            scope: this
        });
    },

    /**
        Queues requests for maps based on the given parameters, first checking
        to see if those maps have already been loaded by the view. The request
        queue will fire the callback operation when all the maps have been
        loaded.
        @param  view        {Flux.view.D3GeographicMap}
        @param  params      {Array}
        @param  operation   {Function}
     */
    fetchMaps: function (view, params, operation) {
        var grid1, grid2, mapQueue;
        var source = view.getMetadata().getId();
        var fetch = function (params, callback) {
            Ext.Ajax.request({
                method: 'GET',
                url: Ext.String.format('/flux/api/scenarios/{0}/xy.json', source),
                params: params,
                callback: function (opts, success, response) {
                    var grid;

                    if (!success) {
                        callback(response.responseText);
                    }

                    grid = Ext.create('Flux.model.Raster',
                        Ext.JSON.decode(response.responseText));

                    // Create a unique ID that can be used to find this grid
                    grid.set('_id', Ext.Object.toQueryString(opts.params));

                    callback(null, grid);
                }
            });
        };

        // Check for both of the needed map grids
        grid1 = view.store.getById(Ext.Object.toQueryString(params[0]));
        grid2 = view.store.getById(Ext.Object.toQueryString(params[1]));

        // Create a request queue in case we need to download one or more grids
        mapQueue = queue();

        if (grid1 && grid2) {
            return operation.call(view, grid1, grid2);
        }

        if (grid1) {
            mapQueue.defer(fetch, params[1]); // 1st grid already loaded; get 2nd
        }

        if (grid2) {
            mapQueue.defer(fetch, params[0]); // 2nd grid already loaded; get 1st
        }

        mapQueue.await(function (error, a, b) {
            if (error) {
                Ext.Msg.alert('Request Error', error);
                return;
            }

            if (a && b) {
                return operation.call(view, a, b);
            }

            return operation.call(view, grid1 || grid2, a);
        });
    },

    /**
        Makes a requests for a time series based on the passed Metadata instance.
        @param  view        {Flux.view.D3LinePlot}
        @param  metadata    {Flux.model.Metadata}
     */
    fetchTimeSeries: function (view, metadata) {
        var dates = metadata.get('dates');
        var step = Ext.Array.min(metadata.getTimeOffsets());
        var params = {
            start: dates[0].toISOString(),
            end: dates[dates.length - 1].toISOString(),
            //TODO aggregate: this.getGlobalSettings().tendency,
            aggregate: 'mean'
        };

        if (step < 3600) { // Less than 1 hour (3600 seconds)?
            params.interval = 'hourly';
        } else if (step < 86400) { // Less than 1 day?
            params.interval = 'daily';
        } else {
            params.interval = 'monthly';
        }

        view.getEl().mask('Loading...');

        Ext.Ajax.request({
            method: 'GET',
            params: params,

            url: Ext.String.format('/flux/api/scenarios/{0}/t.json',
                metadata.getId()),

            callback: function () {
                view.getEl().unmask();
            },

            failure: function (response) {
                Ext.Msg.alert('Request Error', response.responseText);
            },

            success: function (response) {
                var series = Ext.create('Flux.model.TimeSeries',
                    Ext.JSON.decode(response.responseText));

                series.set('_id', metadata.getId());
                this.getStore('timeseries').add(series);
                this.getLinePlot().draw(series);
            },

            scope: this
        });
    },

    /**
        Convenience function for determining the currently selected global
        statistics settings; measure of central tendency, raw values versus
        anomalies, and whether to use population statistics or not.
        @return {Object}
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

    /**
        Alerts the user that the date/time requested is invalid.
        @param  moment  {moment}
        @param  d0      {moment}
        @param  d1      {moment}
     */
    raiseInvalidDateTime: function (moment, d0, d1) {
        Ext.Msg.alert('Request Error',
            Ext.String.format('The date/time you requested, {0}, is outside of the range of available dates. Please select a date/time between {1} and {2}',
                moment.toISOString(), d0.toISOString(), d1.toISOString()));
    },

    ////////////////////////////////////////////////////////////////////////////
    // Event Handlers //////////////////////////////////////////////////////////

    /**
        Binds a Flux.model.RasterGrid instance to the provided view, a
        Flux.view.D3GeographicMap instance.
        @param  view    {Flux.view.D3GeographicMap}
        @param  grid    {Flux.model.RasterGrid}
     */
    bindRasterGrid: function (view, grid) {
        view.setRasterGrid(grid);
    },

    /**
        Binds a Flux.model.Raster instance to the provided view, a
        Flux.view.D3GeographicMap instance. The view's store is updated
        with the new Raster instance.
        @param  view    {Flux.view.D3Panel}
        @param  raster  {Flux.model.Raster}
     */
    bindRaster: function (view, raster) {
        var opts = this.getGlobalSettings();

        if (!Ext.isEmpty(raster.get('_id'))) {
            view.store.add(raster);
        }

        view.draw(raster, true);

        if (opts.statsFrom === 'data') {
            // Also update the slider bounds
            this.onMetadataAdded(undefined, [view.getMetadata()]);

            // The color scale can only be properly adjusted AFTER data are bound
            //  to the view
            view.updateScale(this.getSymbology().getForm().getValues());
        }
    },

    /**
        Binds a Flux.model.Metadata instance to the provided view, a
        Flux.view.D3GeographicMap instance.
        @param  view        {Flux.view.D3Panel}
        @param  metaadata   {Flux.model.Metadata}
     */
    bindMetadata: function (view, metadata) {
        var opts = this.getGlobalSettings();

        view.setMetadata(metadata)
            .togglePopulationStats(opts.statsFrom === 'population', metadata)
            .toggleAnomalies(opts.display === 'anomalies', opts.tendency);

        if (view.getXType() === 'd3lineplot') {
            this.fetchTimeSeries(view, metadata);
        }

        // Only when using population statistics will the color scale be ready
        //  before data have been bound to the view
        if (opts.statsFrom === 'population') {
            view.updateScale(this.getSymbology().getForm().getValues());
        }
    },

    /**
        Handles a change in the aggregation parameters; fires a new map
        request depending on whether aggregation is requested.
        @param  field   {Ext.form.field.Base}
        @param  value   {Number|String}
     */
    onAggregationChange: function (field) {
        var args = {};
        var params, vals, view;
        var toggle = field.up('fieldset').down('field[name=showAggregation]');

        Ext.each(field.up('fieldset').query('trigger'), function (t) {
            args[t.getName()] = t.getValue();
        });

        vals = Ext.Object.getValues(args);
        if (Ext.Array.clean(vals).length !== vals.length) {
            // Do nothing if not all of the fields are filled out
            return;
        }

        view = this.getMap();

        if (!field.isVisible(true) || Ext.isEmpty(view.getMoment())) {
            return;
        }

        if (toggle.getValue()) {
            // Clear the legend units for aggregate data
            view.toggleLegendUnits(false);

            // NOTE: Only available for the Single Map visualization thus far
            params = {
                aggregate: args.aggregate,
                start: view.getMoment().toISOString(),
                end: view.getMoment().clone().add(args.intervals,
                    args.intervalGrouping).toISOString()
            };

        } else {
            // Return to displaying the measurement units
            view.toggleLegendUnits(true);

            params = {
                time: view.getMoment().toISOString()
            };
        }

        this.fetchMap(view, params);
    },

    /**
        There can only be one! Only "Show Aggregation" or "Show Difference"
        can be checked, never both; checking one unchecks the other.
        @param  cb      {Ext.form.field.Checkbox}
        @param  checked {Boolean}
     */
    onAggOrDiffToggle: function (cb, checked) {
        var n = 'showAggregation';
        if (cb.getName() === n) {
            n = 'showDifference';
        }
        if (checked) {
            cb.up('form').down(Ext.String.format('checkbox[name={0}]', n))
                .setValue(false);
        }
    },

    /**
        Handles content being removed from the #content panel.
        @param  c       {Ext.panel.Panel}
        @param  item    {Flux.view.D3Panel}
     */
    onContentRemove: function (c, item) {
        var query = Ext.ComponentQuery.query('d3panel');
        var store = this.getStore('gridviews');

        if (query.length <= 1) {
            return;
        }

        store.removeAt(store.findBy(function (rec) {
            return rec.get('view').getId() === item.getId();
        }));

        // By the time this query is run, the removed panel hasn't been
        //  destroyed yet and so is counted among the extant panels e.g. a count
        //  of "2" panels is really just the one that isn't being destroyed
        query = Ext.Array.clean(Ext.Array.map(query, function (v) {
            if (v.getId() === item.getId()) {
                return undefined;
            }

            return v;
        }));

        this.alignContent(query);
    },

    /**
        Propagates the resize to child Components which may not have been
        automatically resized correctly.
     */
    onContentResize: function () {
        var query = Ext.ComponentQuery.query('d3geomap');

        this.alignContent(query);
    },

    /**
        Handles a change in the "date" or "time" fields signifying the user is
        ready to load map data for that date and time.
        @param  field   {Ext.form.field.*}
        @param  value   {String}
     */
    onDateTimeSelection: function (field, value) {
        var dates, theDate, view;
        var editor = field.up('roweditor');
        var values = field.up('panel').getForm().getValues();

        if (!value) {
            return; // Ignore undefined, null values
        }

        if (editor) {
            view = editor.editingPlugin.getCmp().getView().getSelectionModel()
                .getSelection()[0].get('view');

        } else {
            view = this.getMap();
        }

        if (Ext.isEmpty(values.source)) {
            return;
        }

        // If the data are less than daily in step/span and no time is yet
        //  specified, do nothing
        if (Ext.Array.min(view.getMetadata().getTimeOffsets()) < 86400
                && Ext.isEmpty(values.time)) {
            return;
        }

        dates = view.getMetadata().get('dates');

        // Format the time string accordingly; just a date or with date and time
        if (values.date && values.time) {
            theDate = moment.utc(Ext.String.format('{0}T{1}:00.000Z',
                values.date, values.time));
        } else {
            theDate = moment.utc(values.date);
        }

        // Raise an error, do nothing if the requeste date/time is out of range
        if (dates[0].isAfter(theDate) || dates[dates.length - 1].isBefore(theDate)) {
            return this.raiseInvalidDateTime(theDate, dates[0],
                dates[dates.length - 1]);
        }

        // Enable the FieldSets in this form
        if (this.getGlobalSettings().statsFrom === 'data') {
            Ext.each(this.getSourcePanel().query('fieldset'), function (fs) {
                fs.enable();
            });
        }

        this.fetchMap(view, {
            time: theDate.toISOString()
        });
    },

    /**
        Handles a change in the differencing parameters; fires a new map
        request depending on whether differencing is requested.
        @param  field   {Ext.form.field.Base}
        @param  value   {Number|String}
     */
    onDifferenceChange: function (field) {
        var diffTime;
        var vals = field.up('panel').getForm().getValues();
        var view = this.getMap();

        if (Ext.Array.clean([vals.date2, vals.time2, vals.source2]).length !== 3) {
            // Do nothing if not all of the fields are filled out
            return;
        }

        if (!field.isVisible(true) || Ext.isEmpty(view.getMoment())) {
            return;
        }

        if (field.up('fieldset').down('field[name=showDifference]').getValue()) {
            // NOTE: Only available for the Single Map visualization thus far
            diffTime = moment.utc(Ext.String.format('{0}T{1}:00',
                vals.date2, vals.time2));

            if (diffTime.isSame(view.getMoment())) {
                Ext.Msg.alert('Request Error', 'First timestamp and second timestamp are the same in requested difference image; will not display.');
                return;
            }

            this.fetchMaps(view, [{
                time: view.getMoment().toISOString()
            }, {
                time: diffTime.toISOString()
            }], Ext.Function.bind(function (g1, g2) { // Callback function
                var rast;
                var f1 = g1.get('features');
                var f2 = g2.get('features');

                if (f1.length !== f2.length) {
                    Ext.Msg.alert('Data Error', 'Cannot display the difference of two maps with difference grids. Choose instead maps from two different data sources and/or times that have the same underlying grid.');
                }

                // Add these model instances to the view's store
                view.store.add(g1, g2);

                rast = Ext.create('Flux.model.Raster', {
                    features: (function () {
                        var i;
                        var g = [];
                        for (i = 0; i < f1.length; i += 1) {
                            g.push(f1[i] - f2[i]);
                        }
                        return g;
                    }()),
                    timestamp: g1.get('timestamp'),
                    title: Ext.String.format('{0} - {1}',
                        g1.get('timestamp').format(view.timeFormat),
                        g2.get('timestamp').format(view.timeFormat))
                });

                this.bindRaster(view, rast);
                this.onMapLoad(rast);
            }, this));

        } else {
            this.fetchMap(view, {
                time: view.getMoment().toISOString()
            });
        }
    },

    /**
        Propagates wider changes following the loading of a new Raster instance.
        Specifically, this updates the D3LinePlot instance.
        @param  rast    {Flux.model.Raster}
     */
    onMapLoad: function (rast) {
        var props = rast.get('properties');
        var moments = [
            rast.get('timestamp')
        ];

        if (this.getLinePlot()) {
            if (props.start && props.end) {
                moments = [
                    moment.utc(props.start),
                    moment.utc(props.end)
                ];
            }

            this.getLinePlot().updateAnnotation(moments);
        }
    },

    /**
        Follows the addition of Metadata to a view's metadata store; enables
        the Animation controls.
        @param  store   {Flux.store.Metadata}
        @param  recs    {Array}
     */
    onMetadataAdded: function (store, recs) {
        var metadata = recs[0];

        if (!metadata) {
            return;
        }

        this.getController('Animation').enableAnimation(metadata);

        // Initialize the values of the domain bounds and threshold sliders
        Ext.each(this.getSymbology().query('enumslider'), function (cmp) {
            var s = metadata.get('stats');
            var v = s.values || s.value;
            cmp.setBounds([v.min, v.max]);
        });
    },

    /**
        Handles a click event on the D3GeographicMap instance. Initiaties a time
        series data request (to t.json endpoint) and plots the mean daily time
        series for the grid cell or geographic feature that was clicked.
        @param  view    {Flux.view.D3GeographicMap}
        @param  coords  {Array}
     */
    onPlotClick: function (view, coords) {
        var meta = view.getMetadata();
        var geom = view.getProjection().invert(Ext.Array.map(coords, Number));
        var step = Ext.Array.min(meta.getTimeOffsets());
        var params;

        if (!this.getLinePlot()) {
            return;
        }

        // Need to add half the grid spacing as this was subtracted to obtain
        //  the upper-left corner of the grid cell
        geom = meta.calcHalfOffsetCoordinates(geom);

        params = {
            start: meta.get('dates')[0].toISOString(),
            end: meta.get('dates')[meta.get('dates').length - 1].toISOString(),
            //TODO aggregate: this.getGlobalSettings().tendency,
            aggregate: 'mean',
            coords: Ext.String.format('POINT({0})', geom.join('+'))
        };

        if (step < 86400) { // Less than 1 day?
            params.interval = 'daily';
        } else {
            params.interval = 'monthly';
        }

        this.getLinePlot().getEl().mask('Loading...');

        Ext.Ajax.request({
            method: 'GET',
            url: Ext.String.format('/flux/api/scenarios/{0}/t.json', meta.getId()),
            params: params,
            callback: function () {
                this.getLinePlot().unmask();
            },
            failure: function (response) {
                Ext.Msg.alert('Request Error', response.responseText);
            },
            success: function (response) {
                var series = Ext.create('Flux.model.TimeSeries',
                    Ext.JSON.decode(response.responseText));

                this.getLinePlot().addSeries(series,
                    Ext.String.format('{0} {1} of {1} at {2}, {3}',
                        params.interval, params.aggregate,
                        geom[0].trim('00'), geom[1].trim('00')));
            },
            scope: this
        });
    },

    /** TODO
        Handles a change in the data "overlay" from a ComboBox configured for
        selecting from among sources (e.g. scenarios, model runs, etc.).
        @param  f       {Ext.form.field.ComboBox}
        @param  source  {String}
        @param  last    {String}
     */
    onOverlayChange: function (f, source, last) {
        var container = f.up('panel');

        if (Ext.isEmpty(source) || source === last) {
            return;
        }

        // Metadata ////////////////////////////////////////////////////////////
        Ext.Ajax.request({
            method: 'GET',
            url: '/flux/api/scenarios.json',
            params: {
                scenario: source
            },
            callback: function (o, s, response) {
                var metadata = Ext.create('Flux.model.Metadata',
                    Ext.JSON.decode(response.responseText));

                this.propagateMetadata(container, metadata);
            },

            scope: this
        });
    },

    /**
        Saves an image out as an SVG file.
        @param  btn {Ext.button.Button}
     */
    onSaveImage: function (btn) {
        var view = btn.up('d3geomap');
        var html, win, svgsrc;
        var w = Number(view.svg.attr('width'));
        var h = Number(view.svg.attr('height'));

        // Encode as HTML entities the UTF-8 characters
        if (view._legend) {
            view.toggleLegendUnitsEncoding(true);
        }

        // Capture SVG data as a String
        html = Ext.String.htmlEncode(view.svg
            .attr('version', 1.1)
            .attr('xmlns', 'http://www.w3.org/2000/svg')
            .node().parentNode.innerHTML);

//        // Add the external CSS; must be on the web (fully-qualified link)
//        html = '<?xml-stylesheet type="text/css" href="'
//            + window.location.href + '/resources/d3.css" ?>'
//            + html;

        svgsrc = 'data:image/svg+xml;base64,' + window.btoa(html);

        var win = Ext.create('Ext.window.Window', {
            title: view._display,
            width: w,
            height: h,
            items: {
                xtype: 'component',
                id: 'canvas',
                autoEl: 'canvas'
            },
            listeners: {
                afterrender: function () {
                    var canvas = d3.select('#canvas')[0][0];
                    canvas.width = w;
                    canvas.height = h;
                    var context = canvas.getContext('2d');
                    var image = new Image;
                    image.src = svgsrc;

                    image.onload = function () {
                        context.drawImage(image, 0, 0);
                        var a = document.createElement('a');
                        a.download = 'flux.png';
                        a.href = canvas.toDataURL('image/png');
                        a.click();
                    };

                    // Turn back on display of UTF-8 characters
                    if (view._legend) {
                        view.toggleLegendUnitsEncoding(false);
                    }
                }
            }
        }).show();

    },

    /**
        Handles a change in the data "source" from a ComboBox configured for
        selecting from among sources (e.g. scenarios, model runs, etc.).
        @param  field   {Ext.form.field.ComboBox}
        @param  source  {String}
        @param  last    {String}
     */
    onSourceChange: function (field, source, last) {
        var metadata, operation, grid, view;
        var container = field.up('panel');
        var editor = field.up('roweditor');

        if (Ext.isEmpty(source) || source === last) {
            return;
        }

        if (editor) {
            view = editor.editingPlugin.getCmp().getView().getSelectionModel()
                .getSelection()[0].get('view');

        } else {
            view = this.getMap();
        }

        // Callback ////////////////////////////////////////////////////////////
        operation = Ext.Function.bind(function (metadata) {
            this.bindMetadata(view, metadata);
            this.propagateMetadata(container, metadata);

            // Reload the line plot if the source has actually changed
            if (this.getLinePlot()
                    && (!this.getLinePlot().isDrawn || source !== last)) {
                this.bindMetadata(this.getLinePlot(), metadata);
            }
        }, this);


        // Metadata ////////////////////////////////////////////////////////////
        metadata = this.getStore('metadata').getById(source);
        if (metadata) {
            operation(metadata);

        } else {
            Ext.Ajax.request({
                method: 'GET',
                url: '/flux/api/scenarios.json',
                params: {
                    scenario: source
                },
                callback: function (o, s, response) {
                    var meta = Ext.create('Flux.model.Metadata',
                        Ext.JSON.decode(response.responseText));

                    this.getStore('metadata').add(meta);

                    operation(meta);
                },

                scope: this
            });
        }

        // RasterGrid //////////////////////////////////////////////////////////
        grid = this.getStore('rastergrids').getById(source);
        if (grid) {
            this.bindRasterGrid(view, grid);

        } else {
            Ext.Ajax.request({
                method: 'GET',
                url: Ext.String.format('/flux/api/scenarios/{0}/grid.json', source),
                callback: function (o, s, response) {
                    var grid = Ext.create('Flux.model.RasterGrid',
                        Ext.JSON.decode(response.responseText));

                    this.getStore('rastergrids').add(grid);

                    this.bindRasterGrid(view, grid);
                },
                scope: this
            });
        }

    },

    /**
        Handles a change in the data "source" from a ComboBox configured for
        selecting from among sources (e.g. scenarios, model runs, etc.)
        RELATIVE TO an original "source" selection ComboBox for the purpose
        of calculating the difference between data from this source and the
        other.
        @param  field   {Ext.form.field.ComboBox}
        @param  source  {String}
        @param  last    {String}
     */
    onSourceDifferenceChange: function (field, source, last) {
        var metadata;

        if (Ext.isEmpty(source) || source === last) {
            return;
        }

        // Metadata ////////////////////////////////////////////////////////////
        metadata = this.getStore('metadata').getById(source);
        if (metadata) {
            this.propagateMetadata(field.up('fieldset'), metadata);

        } else {
            Ext.Ajax.request({
                method: 'GET',
                url: '/flux/api/scenarios.json',
                params: {
                    scenario: source
                },
                callback: function (o, s, response) {
                    var meta = Ext.create('Flux.model.Metadata',
                        Ext.JSON.decode(response.responseText));

                    this.getStore('metadata').add(meta);

                    this.propagateMetadata(field.up('fieldset'), meta);
                },

                scope: this
            });
        }
    },

    /**
        When the user adds a new row to the RowEditor, set the "view" property
        on the associated Flux.model.RasterView instance that is created.
        @param  editor  {Ext.grid.plugin.Editing}
        @param  context {Object}
     */
    onSourceGridEntry: function (editor, context) {
        var query = Ext.ComponentQuery.query('d3panel');
        var view;

        if (query.length < context.store.count()) {
            view = this.addMap('New Map');
            context.record.set('view', view);
        }
    },

    /**
        Handles changes in the global settings concerned with statistics.
        @param  cb      {Ext.menu.MenuCheckItem}
        @param  checked {Boolean}
     */
    onStatsChange: function (cb, checked) {
        var opts;
        var query = Ext.ComponentQuery.query('d3panel');
        var store = this.getStore('metadata');

        if (!checked) {
            return;
        }

        opts = this.getGlobalSettings();

        // Update the additive offset for anomalies, in case they're used
        Ext.each(query, function (view) {
            if (Ext.isEmpty(view.getMetadata())) {
                return;
            }

            // Update the source of summary statistics
            view.togglePopulationStats(opts.statsFrom === 'population',
                store.getById(view.getMetadata().get('_id')));

            // Recalculate the additive offset for anomalies
            view.toggleAnomalies((opts.display === 'anomalies'),
                opts.tendency);

            if (opts.statsFrom === 'data') {
                view.redraw();
            }
        });

        this.getController('MapController').updateScales();

        // For what it's worth, grab the Metadata on the one (first) map and
        //  use it to propagate the population summary statistics
        this.onMetadataAdded(undefined, [this.getMap().getMetadata()]);

    },

    /**
        Handles a change in the overall visualization type.
        @param  menu    {Ext.menu.Menu}
        @param  item    {Ext.menu.Item}
     */
    onVisualChange: function (menu, item) {
        var carousel = this.getSourceCarousel();
        var items, container, w;

        if (carousel.getLayout().activeItem.getItemId() === item.getItemId()) {
            return;
        }

        // Remove any and all view instances
        Ext.each(Ext.ComponentQuery.query('d3panel'), function (cmp) {
            cmp.ownerCt.remove(cmp);
        });

        switch (item.getItemId()) {
            // Single Map //////////////////////////////////////////////////////
            case 'single-map':
                container = this.getContentPanel();
                w = (Ext.getBody().getWidth() > 1000) ? 250 : '20%';
                this.getSymbology().up('sidepanel').expand(false);

                items = [{
                    xtype: 'd3geomap',
                    title: 'Single Map',
                    anchor: '100% 80%',
                    enableTransitions: true,
                    enableZoomControls: true
                }, {
                    xtype: 'd3lineplot',
                    anchor: '100% 20%'
                }];

                if (!this.getSourcePanel().down('checkbox[name=showLinePlot]')
                    .getValue()) {
                    items = items[0];
                    items.anchor = '100% 100%';
                }

                container.add(items);

                this.getSourcePanel().getForm().reset();
                break;

            // Coordinated View ////////////////////////////////////////////////
            case 'coordinated-view':
                w = 300;
                this.getSymbology().up('sidepanel').collapse();
                this.getSourcesGrid().getStore().removeAll();
                break;
        }

        carousel.setWidth(w).getLayout().setActiveItem(item.idx);
    },

    /**
        Propagates changes in the metadata to child components of a given
        container, specifically, setting the DateField and TimeField instances.
        @param  container   {Ext.container.Contianer}
        @param  metadata    {Ext.model.Metadata}
     */
    propagateMetadata: function (container, metadata) {
        var fmt = 'YYYY-MM-DD';
        var datePicks = container.query('datefield');
        var timePicks = container.query('combo[valueField=time]');
        var dates = metadata.getDisabledDates(fmt);

        if (datePicks) {
            Ext.each(datePicks, function (target) {
                target.initDate = metadata.get('dates')[0].format(fmt);
                target.reset();
                target.setDisabledDates(['^(?!).*$']);
                target.setDisabledDates(dates);

                // When date picker (calendar) is opened, show the first date                
                target.on('expand', function () {
                    this.suspendEvent('change');
                    this.setRawValue(this.initDate);
                    this.resumeEvent('change');
                }, target, {single: true});

                if (Ext.Array.min(metadata.getTimeOffsets()) < 86400) {
                    target.on('change', function () {
                        this.nextSibling().enable();
                    }, target, {single: true});
                }
            });

        }

        //TODO Use the step/span indicated by the given date (from above)?
        if (timePicks) {
            // For every Ext.form.field.Time found...
            Ext.each(timePicks, function (target) {
                var mins = (Ext.Array.min(metadata.getTimeOffsets()) / 60);

                target.reset();
                target.bindStore(Ext.create('Ext.data.ArrayStore', {
                    fields: ['time'],
                    data: (function () {
                        var i;
                        var d0 = moment.utc(Ext.Array.min(metadata.get('dates')));
                        var times = [];
                        var m = 0;
                        for (i = 0; i < (1440 / mins); i += 1) {
                            times.push([
                                d0.clone().add(m, 'minutes').format('HH:mm')
                            ]);
                            m += mins;
                        }
                        return times;
                    }())
                }));

                target.disable();
            });
        }
    },

    /**
        Toggles on/off the Time Series display below the map in the Single Map
        visualization.
        @param  cb      {Ext.form.field.Checkbox}
        @param  checked {Boolean}
     */
    toggleLinePlotDisplay: function (cb, checked) {
        // We either create a new D3LinePlot instance or get the existing one
        var basemap = this.getMapSettings().down('combo[name=basemap]').getValue();
        var linePlot = this.getLinePlot();
        var map = this.getMap();
        var container = map.ownerCt;
        var series;

        if (checked) {
            // Resize the anchor(s) and add a D3LinePlot instance
            map.anchor = '100% 80%';
            linePlot = container.add({
                xtype: 'd3lineplot',
                anchor: '100% 20%'
            });

            // Get the TimeSeries instance, if there is one
            if (map.getMetadata()) {
                series = this.getStore('timeseries')
                    .getById(map.getMetadata().getId());
                linePlot.setMetadata(map.getMetadata());
            }

            if (series) {
                linePlot.draw(series);
            }

        } else {
            if (linePlot) {
                container.remove(linePlot);
            }
            map.anchor = '100% 100%';
        }

        // Add a listener to re-initialize the D3GeographicMap instance
        //  after it has received its layout from the parent container
        map.on('afterlayout', function () {
            this.init(this.getWidth(), this.getHeight())
                .setBasemap(basemap)
                .redraw(true);
        }, map, {
            single: true // Remove this listener
        });
        container.doLayout();
    },

    /**
        Unchecks the "Show Aggregation" and "Show Difference" checkboxes.
     */
    uncheckAggregates: function () {
        Ext.each(this.getSourcePanel().query('fieldset checkbox'), function (cb) {
            cb.setValue(false);
        });
    }

});



