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
    
    }, {
        ref: 'aoGeoJSON',
        selector: 'ao_geojson'
    }, {
        ref: 'aoWKT',
        selector: 'ao_wkt'
    }],

    requires: [
        'Ext.data.ArrayStore',
        'Ext.state.CookieProvider',
        'Flux.model.Overlay',
        'Flux.model.Raster',
        'Flux.model.RasterGrid',
        'Flux.model.Metadata',
        'Flux.store.Rasters',
        'Flux.store.RasterGrids',
        'Flux.store.Metadata'
    ],

    _initLoad: false,
    
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
	    // triggers a change if the custom central tendency field is modifeid
	    '#settings-menu numberfield[name=tendencyCustomValue]': { 
		change: this.onStatsChange
	    },

            '#settings-menu slider[name=markerSize]': {
                change: this.onOverlayMarkerChange
            },

            '#single-map': {
                tabchange: this.onSingleMapTabChange
            },

            '#visual-menu': {
                click: this.onVisualChange
            },
            'd3geomap': {
                plotclick: this.onPlotClick,
                fetchstats: this.fetchRoiSummaryStats,
                removeTimeSeries: this.removeRoiTimeSeries
            },
            'd3geomap #btn-ao-draw': {
                click: this.onDrawRoi
            },
            'd3geomap #btn-ao-wkt': {
                click: this.onAddWKT
            },
            'd3geomap #btn-ao-geojson': {
                click: this.onAddGeoJSON
            },
	    'd3geomap #btn-draw-polygon': {
		click: this.onDrawRoi
	    },
	    'd3geomap #btn-erase-polygon': {
		click: this.onEraseRoiDrawing
	    },

	    'd3geomap #btn-cancel-polygon': {
		click: this.onCancelRoiDrawing
	    },
            'd3geomap #btn-fetch-roi-time-series': {
                click: this.onFetchRoiTimeSeriesClick
            },
	    
            'd3geomap #btn-save-image': {
                click: this.onSaveImage
            },

            'field[name=source]': {
                change: this.onSourceChange
            },

            'field[name=source2]': {
                change: this.onSourceDifferenceChange
            },

            'field[name=date], field[name=time], field[name=end]': {
                change: this.onDateTimeSelection,
                expand: this.uncheckAggregates
            },

            'overlayspanel datefield': {
                afterselect: this.onOverlayDateSelection
            },
            'roioverlayform' : {
                submit: this.onSubmitRoiOverlay,
                loadRoi: this.onLoadMostRecentRoi
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
            enableDisplay: true,
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
        Given a GeoJSON Polygon string OR object, extracts and returns the coordinates:
        NOTE: does not currently support MULTIPOLYGON type
    
        @param  wktPolygonString  {String OR Object}  e.g. ""
        @return                   {Array}   An array of lat/long arrays,
                                            e.g. [[-83 42],[-84 31],...]
    */
    convertGeoJSONtoRoiCoords: function (gj) {
        var proj = this.getMap().getProjection();

        // If the GeoJSON isn't already an object, try parsing as a string
        if (typeof gj == 'string') {
            try {
                gj = gj.replace(/\\n/gm,'').replace(/\\"/gm,'"').trim();
                gj = JSON.parse(gj);
            } catch (err) {
                alert('Syntax error in the provided GeoJSON text');
                return
            }
        }
        
        
        // Find the geometry key... accounting here for a number of possible nesting levels
        if (gj.hasOwnProperty('features')) { // i.e. if nested in a "FeatureCollection"...
            gj = gj.features[0];
        }
        
        if (gj.hasOwnProperty('geometry')) { // i.e. if nested in a "Feature"
            gj = gj.geometry;
        }
        
        if (gj.hasOwnProperty('coordinates')) { // i.e. if nested in a "geometry"
            if (gj.type != 'Polygon') {
                alert(Ext.String.format('GeoJSON geometry type must be "Polygon"; the provided type is: "{0}".', gj.type));
                return;
            }
            gj = gj.coordinates[0];
        } else {
            alert('Could not parse GeoJSON text; does "coordinates" property exist?');
            return;
        }
        
        // Remove the closing vertex at the end; unnecessary for roiCoords
        gj.pop();

        return Ext.Array.map(gj, function(l) {return proj(l);});

    },
    
    /**
        Given an array of coordinates representing a single polygon,
        converts and returns WKT representation

            @param      cs      {Array}
            @param      sep     {String} string separator to use for coordinate pairs
            @return             {String}   e.g. "POLYGON((-83 42, -84 31,...))"
    */
    convertRoiCoordsToWKT: function (cs, sep) {
        var map = this.getMap();
        var proj = map.getProjection();
        
        cs.push(cs[0]);
        
        var wkt = [];
        cs.forEach(function(c) {
            wkt.push(Ext.Array.map(proj.invert(c), function (l) {
                    return l.toFixed(4);
                }).join(sep))
            });
        
        return Ext.String.format('POLYGON(({0}))', wkt.join(','))
    },
    
    /**
        Given a WKT Polygon string, extracts and returns the GeoJSON object:
        NOTE: does not currently support MULTIPOLYGON type

            @param  wktPolygonString  {String}  e.g. "POLYGON((-83 42, -84 31,...))"
            @return                   {Object}  GeoJSON
    */
    convertWKTtoGeoJSON: function (wktPolyString) {
        //var coords, lls;
        //var proj = this.getMap().getProjection();
        var c = wktPolyString.replace('POLYGON((', '').replace('))', '').split(',');
        
//         // Remove the closing vertex at the end; unnecessary for roiCoords
//         c.pop();
        
        // Parse into a list of lat/lon coordinates
        lls = c.map(function (v) {
            return v.split(' ').map(Number);

        });

        return {
                'type' : 'Feature',
                'geometry' : {
                    'type': 'Polygon',
                    'coordinates': [lls]
                }
        };
        
//         // And project those coordinates into x/y pixel positions
//         coords = Ext.Array.map(lls, function(l) {return proj(l);});
//         
//         if (coords.length < 3) {
//             alert(Ext.String.format('Could not parse WKT text; check for proper syntax:\n\n{0}', wktPolyString));
//             return;
//         }
//         return coords;

    },
    
    /**
        Given a WKT Polygon string, extracts and returns the coordinates:
        NOTE: does not currently support MULTIPOLYGON type

            @param  wktPolygonString  {String}  e.g. "POLYGON((-83 42, -84 31,...))"
            @return                   {Array}   An array of lat/long arrays,
                                                e.g. [[-83 42],[-84 31],...]
    */
    convertWKTtoRoiCoords: function (wktPolyString) {
        var coords, lls;
        var proj = this.getMap().getProjection();
        var c = wktPolyString.replace('POLYGON((', '').replace('))', '').split(',');
        
        // Remove the closing vertex at the end; unnecessary for roiCoords
        c.pop();
        
        // Parse into a list of lat/lon coordinates
        lls = c.map(function (v) {
            return v.split(' ').map(Number);

        });

        // And project those coordinates into x/y pixel positions
        coords = Ext.Array.map(lls, function(l) {return proj(l);});
        
        if (coords.length < 3) {
            alert(Ext.String.format('Could not parse WKT text; check for proper syntax:\n\n{0}', wktPolyString));
            return;
        }
        return coords;

    },
    
    
    /**
        Makes a request for a map based on the given parameters, where the map
        is a non-gridded xy.json response (an overlay).

        @param  view    {Flux.view.D3GeographicMap}
        @param  params  {Object}
     */
    fetchOverlay: function (view, params) {
        var overlay;

        if (view.mostRecentOverlayParams != params) {
            delete view._storedTendencyOffset;
        }
        
	view.mostRecentOverlayParams = params;
	
        if (!view.getMetadata()) {
            return;
        }

        Ext.Ajax.request({
            method: 'GET',
            url: Ext.String.format('/flux/api/scenarios/{0}/xy.json',
                view.getMetadata().getId()),
            params: params,
            callback: function (opts, success, response) {
                var ov;

                if (!success) {
                    return;
                }

                ov = Ext.create('Flux.model.Overlay',
                    Ext.JSON.decode(response.responseText));

                this.bindLayer(view, ov);
                this.onMapLoad(ov);
            },
            failure: function (response) {
                Ext.Msg.alert('Request Error', response.responseText);
            },
            scope: this
        });
    },

    /**
        Makes a requests for a map based on the given parameters, first checking
        to see if the map has already been loaded by the view; requests it from
        the server only if it has not been loaded.
        @param  view    {Flux.view.D3GeographicMap}
        @param  params  {Object}
     */
    fetchRaster: function (view, params, forceFetch) {
        var raster, source, opts;
        
        if (view.mostRecentRasterParams != params) {
            delete view._storedTendencyOffset;
        }
        
        
	view.mostRecentRasterParams = params;
	
	if (!view.getMetadata()) {
            return;
        }

	source = view.getMetadata().getId();

        // Check for the unique ID, a hash of the parameters passed in this
        //  request
        var rastId = Ext.String.format('source={0}&{1}', source, Ext.Object.toQueryString(params))
        
        
        raster = view.store.getById(rastId);
        if (raster && !forceFetch) { 
            this.bindLayer(view, raster, params.dontResetSteps);
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
                rast.set('_id', Ext.String.format(rastId));
	
                this.bindLayer(view, rast, params.dontResetSteps);
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
    fetchRasters: function (view, params, operation) {
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
        Submits request to server to retrieve ROI summary stats
        
        @param start    
        @param end
        @param onSuccess        {Function} callback function if request is successful
    */
    fetchRoiSummaryStats: function (start, end, onSuccess) {
        var view = this.getMap();
        var polygon = view.wrapper.selectAll('polygon');
        var proj = view.getProjection();
        var meta = view.getMetadata();

        if ((meta && !view._currentSummaryStats) ||
            (meta && (start != end))) {
            var params, interval;
            
            if (meta.get('gridded')) {
                start = start || view.mostRecentRasterParams.time || meta.get('dates')[0].toISOString();
                end = end || view.mostRecentRasterParams.time || meta.get('dates')[0].toISOString();
                interval = this.getInterval(meta);
            } else {
                start = start || view.mostRecentOverlayParams.start;
                end = end || view.mostRecentOverlayParams.end;
                interval = undefined;
            }
            
            onSuccess = onSuccess || view.displaySummaryStats;
        
            var wkt = this.convertRoiCoordsToWKT(view._roiCoords.slice(0), '+');

            params = {
                start: start,
                end: end,//meta.get('dates')[meta.get('dates').length - 1].toISOString(),
                interval:  interval,
                //TODO aggregate: this.getGlobalSettings().tendency,
                // aggregate: 'mean',
                geom: wkt
            };
            
            Ext.Ajax.request({
                method: 'GET',
                url: Ext.String.format('/flux/api/scenarios/{0}/roi.json', meta.getId()),
                params: params,
                callback: function () {},
                failure: function (response) {
                    Ext.Msg.alert('Request Error', response.responseText);
                },
                success: function (response) {
                    onSuccess(Ext.JSON.decode(response.responseText), view, this);
                },
                scope: this
            });
        }
        
    },
    
    /**
        Makes a requests for a time series based on the passed Metadata instance.
        The time series to be returned is an aggregate (coarser) time series
        than the underlying data may represent, particularly if no "steps" or
        "spans" are indicated in the Metadata.
        @param  view        {Flux.view.D3LinePlot}
        @param  metadata    {Flux.model.Metadata}
     */
    fetchTimeSeries: function (view, metadata) {
        var dates = metadata.get('dates');
        var params = {
            start: dates[0].toISOString(),
            end: dates[dates.length - 1].toISOString(),
            //TODO aggregate: this.getGlobalSettings().tendency,
            aggregate: 'mean'
        };

        if (metadata.get('gridded')) {
            params.interval = this.getInterval(metadata);
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

    
    getInterval: function (metadata) {
        var step = Ext.Array.min(metadata.getTimeOffsets());

        if (step < 3600) { // Less than 1 hour (3600 seconds)?
            return 'hourly';
        }

        if (step < 86400) { // Less than 1 day?
            return 'daily';
        }

        return  'monthly';
        
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
	if (opts['tendency'] === 'custom') {
	    opts['tendency'] = this.getSettingsMenu().down('field[name=tendencyCustomValue]').getValue();
	}
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
        Binds a Flux.model.Raster or Flux.model.Overlay instance to the
        provided view, a Flux.view.D3GeographicMap instance. If an _id is
        provided (on Raster instances), the view's store is updated with that
        instance.
        @param  view    {Flux.view.D3Panel}
        @param  raster  {Flux.model.Raster}
     */
    bindLayer: function (view, feat, dontResetSteps) {
        var opts = this.getGlobalSettings();

        if (!Ext.isEmpty(feat.get('_id'))) {
            view.store.add(feat);
        }
        
        // Adjust data if anomalies view selected
	if (opts.display === 'anomalies') {
            var offset = view.getTendencyOffset();
            
	    f1 = feat.get('features');
            
            // Gridded data
            if (view.getMetadata().get('gridded')) {
                feat.set('features', (function () {
                            var i;
                            var g = [];
                            for (i = 0; i < f1.length; i += 1) {
                                g.push(f1[i] - offset);
                            }
                            return g;
                        }()));
            // Non-gridded data
            } else {
                feat.set('features', (function () {
                var i;
                var g = [];
                for (i = 0; i < f1.length; i += 1) {
                    f1[i].properties.value = f1[i].properties.value - offset;
                    g.push(f1[i]);
                }
                return g;
            }()));
            }

            
	}	

        view.draw(feat, true);

        if (opts.statsFrom === 'data') {
            // Also update the slider bounds
            this.onMetadataAdded(undefined, [view.getMetadata()], dontResetSteps);

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
        Retrieves aggregation parameters.
	@return {Object}
     */
    getAggregationArgs: function () {
	var args = {};
	var cmps = Ext.ComponentQuery.query('#aggregation-fields')[0]
		.query('trigger');
	Ext.each(cmps, function (t) {
	      args[t.getName()] = t.getValue();
	  });
	return args;
    },
    
    /**
        Populates date/time fields with parameter values
        from GET request (or to default values if not specified)
        Called only when application first loads.
        
        @param  params          {Ext.Object.fromQueryString}
        @param  metadata        {Ext.model.Metadata}
     */
    loadDateTimeParams: function (params, metadata) {
        var fmt = 'YYYY-MM-DD';
        
        // This conditional indicates a non-gridded dataset was requested
        if (params.hasOwnProperty('start') && params.start.length > 0 &&
            params.hasOwnProperty('end') && params.end.length > 0) {
            
            ['start','end'].forEach(function (x) {
                var cmp = Ext.ComponentQuery.query(Ext.String.format('field[name={0}]',x))[0];
                cmp.setValue(params[x]);
                cmp.setRawValue(params[x]);
                cmp.enable();
            });
            
            this.onOverlayDateSelection(Ext.ComponentQuery.query('field[name=end]')[0]);
        
        } else {
        
            // Set date to specified 'date' parameter if specified
            var date = metadata.get('dates')[0].format(fmt);
            if  (params.hasOwnProperty('date') && params.date.length > 0) {
                date = params.date;
            }
            
            var cmp = Ext.ComponentQuery.query('field[name=date]')[0];
            cmp.setValue(date);
            cmp.setRawValue(date);
            
            // Set time to specified 'time' parameter if specified
            var time = metadata.getTimes()[0];
            if (params.hasOwnProperty('time') && params.time.length > 0) {
                time = params.time;
            }
                
            var cmp = Ext.ComponentQuery.query('field[name=time]')[0];
            cmp.setValue(time);
            cmp.enable();
            
            // Hard trigger the date/time selection method to propagate changes
            this.onDateTimeSelection(cmp, time, date);
        }
    },
    
    /**
        Handles a click of the Add ROI Overlay - GeoJSON button by creating/showing
        the form panel
        
        @param  btn             {Ext.button.Button}
     */
    onAddGeoJSON: function(btn) {
        var form = this.getAoGeoJSON();
        
        if (!form) {
            this.getContentPanel().add({
                xtype: 'ao_geojson',
                title: 'Add ROI from GeoJSON',
            });
            
            form = this.getAoGeoJSON();
            
            // Add some default values to use as examples
            form.show(); // <-- form has to be rendered first or the text field will not exist
            form.down('textfield[name=roi_url]').setValue('https://rawgit.com/johan/world.geo.json/master/countries/USA/CA.geo.json');
            form.down('textarea[name=roi_text]').setValue('{"type":"Feature","geometry":{ "type": "Polygon","coordinates": [[[-100.0,50.0],[-105.0,50.0],[-105.0,55.0],[-100.0,55.0],[-100.0,50.0]]]}}');
           
           // And enabled the "load most recent ROI" button if recently drawn ROI exists
           if (this.getMap()._roiCoordsMostRecent) {
               form.down('button[name=load_recent]').setDisabled(false);
           }  
        } else {        
            form.show();
        }

    },
    
    
    /**
        Handles a click of the Add ROI Overlay - WKT button by creating/showing
        the form panel
        
        @param  btn             {Ext.button.Button}
     */
    onAddWKT: function(btn) {
        var form = this.getAoWKT();
        
        if (!form) {
            this.getContentPanel().add({
                xtype: 'ao_wkt',
                title: 'Add ROI from WKT',
            });
            
            form = this.getAoWKT();
           
           // Add some default values to use as examples
           form.show(); // <-- form has to be rendered first or the text field will not exist
           form.down('textfield[name=roi_url]').setValue('http://mapproxy.org/static/polygons/US.txt');
           form.down('textarea[name=roi_text]').setValue('POLYGON((-107.1 52.7,-107.8 19.1785,-79.1 19.1,-83.9 54.3,-107.1 52.7))');

           // And enabled the "load most recent ROI" button if recently drawn ROI exists
           if (this.getMap()._roiCoordsMostRecent) {
               form.down('button[name=load_recent]').setDisabled(false);
           }
        } else {
            form.show();
        }
    },

    onLoadMostRecentRoi: function(btn) {
        var wkt, ao_form, txt;
        var format = btn.up('panel').format;
        var coords = this.getMap()._roiCoordsMostRecent;
        
        if (coords) {
            wkt = this.convertRoiCoordsToWKT(coords.slice(0), ' ');
            
            if (format == 'geojson') {
                ao_form = this.getAoGeoJSON();
                txt = JSON.stringify(this.convertWKTtoGeoJSON(wkt));
                
            } else if (format == 'wkt') {
                ao_form = this.getAoWKT();
                txt = wkt;
            }
            
            if (ao_form) {
                ao_form.down('textarea[name=roi_text]').setValue(txt);
            }
        }
  
    },
    
    /**
        Callback for when ROI data is successfully retrieved
        from URL or pasted-in text; draws ROI on map and makes
        UI changes.
        
        @param  btn             {Ext.Button.button}        
        @param  roi             {String} representing WKT or GeoJSON ROI
     */
    onReceiveRoiOverlay: function(btn, roi) {
        var map = this.getMap();
        var format = btn.up('panel').format;
        
        // Convert ROI to roiCoords and draw the polygon
        if (format == 'geojson') {
            map._roiCoords = this.convertGeoJSONtoRoiCoords(roi);
        } else if (format == 'wkt') {
            map._roiCoords = this.convertWKTtoRoiCoords(roi);
        }

        if (map._roiCoords && map._roiCoords.length > 2) {
            // Make UI changes
            map.setTbarForDrawnROI();
            
            // Draw the polygon 
            map.redrawPolygon();   
             
            // Zoom to ROI
            map.setZoomToRoiCenter();            
        }
    },
    
    /**
        Handles the click event for the "Submit" button on the
        RoiOverlayForm.js form
        
        @param  btn             {Ext.button.Button}
     */
    onSubmitRoiOverlay: function(btn) {
        var view = this;
        
        if (btn.up('panel').down('radiofield[inputValue=url]').checked) {
            var url = btn.up('panel').down('textfield[name=roi_url]').value;
            
            // This is a really specific fix b/c the default example URL requires it
            url = url.replace('raw.githubusercontent','rawgit');
            
            var xhr = new XMLHttpRequest();
            var view = this;
            
            // Load the JSON object from URL
            xhr.open('get',url, true);   
            xhr.responseType = 'json'; // <- this is critical to include; otherwise will encounter cross-origin request errors
            xhr.onreadystatechange = function() {
                if (xhr.readyState == 4) {
                    var status = xhr.status;
                    if (status == 200) {
                        view.onReceiveRoiOverlay(btn, xhr.response);
                    } else {
                        alert('Error loading from requested URL', xhr.response);
                    } 
                }
            }
            xhr.send();
            
        } else {
            view.onReceiveRoiOverlay(btn, btn.up('panel').down('textarea[name=roi_text]').value);
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

//         Ext.each(field.up('fieldset').query('trigger'), function (t) {
//             args[t.getName()] = t.getValue();
//         });

	args = this.getAggregationArgs();
	
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

        this.fetchRaster(view, params);
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
    onDateTimeSelection: function (field, value, date) {
        var d, dates, steps, view;
        var editor = field.up('roweditor');
        var values = field.up('panel').getForm().getValues();
        values.date = values.date || date;

        if (!value) {
            return; // Ignore undefined, null values
        }

        if (editor) {
            view = editor.editingPlugin.getCmp().getView().getSelectionModel()
                .getSelection()[0].get('view');

        } else {
            view = this.getMap();
        }

        if (Ext.isEmpty(values.source) || Ext.isEmpty(values.date)) {
            return;
        }

        // If the data are less than daily in step/span and no time is yet
        //  specified, do nothing
        steps = view.getMetadata().getTimeOffsets();
        if (!Ext.isEmpty(steps)) {
            if (Ext.Array.min(steps) < 86400
                    && Ext.isEmpty(values.time)) {
                return;
            }
        }

        dates = view.getMetadata().get('dates');

        // Gridded /////////////////////////////////////////////////////////////
        if (view.getMetadata().get('gridded')) {
            // Format the time string accordingly; just a date or with date and time
            if (values.date && values.time) {
                d = moment.utc(Ext.String.format('{0}T{1}:00.000Z',
                    values.date, values.time));

            } else {
                d = moment.utc(values.date);
            }

            // Raise an error, do nothing if the requested date/time is out of range
            if (dates[0].isAfter(d) || dates[dates.length - 1].isBefore(d)) {
                return this.raiseInvalidDateTime(d, dates[0],
                    dates[dates.length - 1]);
            }

            if (!this._initLoad) {
                this.fetchRaster(view, {
                    time: d.toISOString()
                });
            }
        }
//         // Non-gridded /////////////////////////////////////////////////////////
//         // ***THIS is not needed b/c non-gridded date-time selection has it's own listener***
//         } else {
//             if (values.date && values.end) {
//                 this.fetchOverlay(view, {
//                     start: Ext.String.format('{0}T00:00Z', values.date),
//                     end: Ext.String.format('{0}T23:59Z', values.end)
//                 });
//             }
//         }

        // Enable the FieldSets in this form
        if (this.getGlobalSettings().statsFrom === 'data') {
            Ext.each(this.getSourcePanel().query('fieldset'), function (fs) {
                fs.enable();
            });
        }

    },

    /**
        Handles a change in the differencing parameters; fires a new map
        request depending on whether differencing is requested.
        @param  field   {Ext.form.field.Base}
        @param  value   {Number|String}
     */
    onDifferenceChange: function (field) {
        if (!this._initLoad) {
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

                this.fetchRasters(view, [{
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

                    this.bindLayer(view, rast);
                    this.onMapLoad(rast);
                }, this));

            } else {
                this.fetchRaster(view, {
                    time: view.getMoment().toISOString()
                });
            }
        }
    },
    
    /**
	Activates polygon draw functionality
	@param  btn {Ext.button.Button}
    */
    	
    onDrawRoi: function (btn) {
	var view = btn.up('d3geomap');
        var menu = btn.up('menu');
        var menu_btn = btn.up('button');
	var tbar = menu.up('toolbar');

	menu.hide();
        menu_btn.hide();
	tbar.down('button[itemId="btn-cancel-polygon"]').show();

	// this toggles header text
	view.panes.hud.selectAll('.info').style('font-size',(0.03 * view.svg.attr('width')).toString() + 'px')
	view.updateDisplay([{
                id: 'tooltip',
                text: 'Click to place vertices; Double-click to finish'
            }]);

	if (d3.selectAll('.roiCanvas')[0].length === 0) {
	    view.panes.roiCanvas = view.wrapper.append('g').attr('class', 'pane');
	  
	    view.panes.roiCanvas.append('rect')
				    .attr({
					'class': 'roiCanvas',
					'width': view.svg.attr('width'),
					'height': view.svg.attr('height'),
					'fill': 'none',
					'x': 0,
					'y': 0
				    })
				    .style({
					'cursor': 'crosshair',
					'pointer-events': 'all'
				    });
	}
	
	// Remove any lingering drawing coordinates from
	// a drawing that may have been interrupted on map resizing
        delete view._tmpDrawingCoords;
	
	// Add listeners to drawing element
	view.addListenersForDrawing(d3.selectAll('.roiCanvas'),tbar);
    },
    
     /** Handles click of the 'actively drawing polygon' button
         (btn-cancel-polygon); removes polygon elements and
         handles UI implications
	@param btn	{Ext button}
     */
    onCancelRoiDrawing: function (btn) {
	this.removeRoiOverlay(btn);
	
	btn.hide();
	btn.up('toolbar').down('button[itemId="btn-add-overlay"]').show();
    },
    
    /** Removes polygon elements and handles UI implications
	@param btn	{Ext button}
     */ 
    onEraseRoiDrawing: function (btn) {
	 this.removeRoiOverlay(btn);
         this.removeRoiTimeSeries();
	 
	 // hide yourself since no polygon exists to erase anymore
	 btn.hide();
         
         // hide time-series fetcher for same reason
         btn.up('toolbar').down('button[itemId="btn-fetch-roi-time-series"]').hide();
	 
	 // and reenable draw button
	 btn.up('toolbar').down('button[itemId="btn-add-overlay"]').show();

    },
    
    /** Removes all polygon drawing element including drawing pane
        and any stored coordinates and shapes
	@param btn	{Ext button}
    */ 
    removeRoiOverlay: function (btn) {
         var ao_gj = this.getAoGeoJSON();
         var ao_wkt = this.getAoWKT();
	 var view = btn.up('d3geomap'); 
      
	  // Remove the rectangular drawing overlay that blocks pointer-events
	  // from reaching other elements
	 delete view.panes.roiCanvas;
	 d3.selectAll('.roiCanvas').remove();
	 
	 d3.selectAll('.roi-stats').remove();
	 d3.selectAll('.roi-polygon').remove(); // this removes the drawn polygon
	 d3.selectAll('.roi-vertex').remove(); // remove vertices
	 d3.selectAll('.roi-tracker').remove();
         
         // Store the coords temporarily in case user wants to load them
         // again via one of the RoiOverlayForms
         if (view._roiCoords) {
            view._roiCoordsMostRecent = view._roiCoords.slice(0);
            if (ao_gj) {ao_gj.down('button[name=load_recent]').setDisabled(false)};
            if (ao_wkt) {ao_wkt.down('button[name=load_recent]').setDisabled(false)};
         }
         
         
	 delete view.polygon; // 
	 delete view._roiCoords; // remove memory of previous drawing coords
	 delete view._tmpRoiCoords;
	 
	 // Clear HUD text
	 view.updateDisplay([{
                id: 'tooltip',
                text: ''
            }]);
	 
	 // Re-enable zoom
         view.filler.style('pointer-events', 'all');
	 view.zoom.on('zoom', Ext.bind(view.zoomFunc, view));
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

        // Recalculate summary stats if a drawn polygon exists
        if (this.getMap()._roiCoords) {
            delete this.getMap()._currentSummaryStats;

            this.fetchRoiSummaryStats();
        }
        
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
        @param  store		{Flux.store.Metadata}
        @param  recs    	{Array}
        @param	dontResetSTeps 	{Boolean}
     */
    onMetadataAdded: function (store, recs, dontResetSteps) {
        var metadata = recs[0];

        if (!metadata) {
            return;
        } 
         
        if (metadata.get('gridded') && !dontResetSteps) {
            this.getController('Animation').enableAnimation(metadata);
        }

        // Initialize the values of the domain bounds and threshold sliders
        // Applying the anomaly offset may be better implemented earlier in the
        // metadata get/set/bind process...
        var offset = 0
        if (this.getGlobalSettings().display === 'anomalies') {
	    offset = this.getMap().getTendencyOffset();
	}
	
        Ext.each(this.getSymbology().query('enumslider'), function (cmp) {
            var s = metadata.get('stats');
            var v = s.values || s.value;
            cmp.setBounds([v.min-offset, v.max-offset]);
        });
    },

    /**
        Handles a change in the start/end date selection for (non-gridded)
        overlays.
        @param  f   {Ext.form.Field}
     */
    onOverlayDateSelection: function (f) {
        var editor = f.up('roweditor');
        var values = f.up('panel').getForm().getValues();
        var view;

        if (Ext.isEmpty(values.start) || Ext.isEmpty(values.end)) {
            return;
        }

        if (editor) {
            view = editor.editingPlugin.getCmp().getView().getSelectionModel()
                .getSelection()[0].get('view');

        } else {
            view = this.getMap();
        }

        this.fetchOverlay(view, {
            start: moment.utc(values.start).toISOString(),
            end: moment.utc(values.end).toISOString()
        });
    },

    /**
        Handles a change in the vector overlay marker symbol size.
        @param  s       {Ext.slider.Single}
        @param  size    {Number}
     */
    onOverlayMarkerChange: function (s, size) {
        Ext.each(Ext.ComponentQuery.query('d3geomap'), function (v) {
            v.setMarkerSize(size).redraw();
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
                var linePlot = this.getLinePlot();
                var series = Ext.create('Flux.model.TimeSeries',
                    Ext.JSON.decode(response.responseText));
                
                linePlot._currentTimeSeries = series;
                linePlot._currentTimeSeriesLegendEntry = Ext.String.format(
                        '{0} {1} of {1} at {2}, {3}',
                        params.interval,
                        params.aggregate,
                        geom[0].trim('00'), geom[1].trim('00'));
                linePlot.addSeries(series,
                                   linePlot._currentTimeSeriesLegendEntry);
            },
            scope: this
        });
    },
    

    onFetchRoiTimeSeriesClick: function () {
        var meta = this.getMap().getMetadata();
        
        if (!meta) {
            return;
        }
        
        var dates = this.getMap().getMetadata().get('dates');

        // Temporarily mask out the line plot...
        this.getLinePlot().getEl().mask('Loading...');

        this.fetchRoiSummaryStats(dates[0].toISOString(),
                                  dates[dates.length - 1].toISOString(),
                                  this.onFetchRoiTimeSeriesSuccess);
        
    },
    
    /**
        Takes the response of a successful time-series
        request and passes it along to be drawn on the
        line plot.
        
        @param series
        @param view     {D3GeographicMap view}
        @param parent   {UserInteraction controller} 
    */
    onFetchRoiTimeSeriesSuccess: function (series, view, parent) {
        var meta = view.getMetadata();
        var step = Ext.Array.min(meta.getTimeOffsets());
        var linePlot = parent.getLinePlot();
        var params, interval, series;
        
        if (!linePlot) {
            return;
        }

        linePlot.unmask();
        
        if (step < 86400) { // Less than 1 day?
            interval = 'daily';
        } else {
            interval = 'monthly';
        }

        series['properties']['interval'] = interval;
        
        linePlot._currentTimeSeries = series;
        
        linePlot.addSeriesRoi(series);

    },

    /**
        Saves an image out as an SVG file.
        @param  btn {Ext.button.Button}
     */
    onSaveImage: function (btn) {
        var view = btn.up('d3geomap');
        var html, node, win, svgsrc;
        var w = Number(view.svg.attr('width'));
        var h = Number(view.svg.attr('height'));
        var i, j;
        var defsEl = view.svg.select('defs');
        var styleEl = defsEl.select('style');
        var styles = '';
        var styleSheets = document.styleSheets;

        function proc (ss) {
            if (ss.cssRules) {
                for (j = 0; j < ss.cssRules.length; j += 1) {
                    var rule = ss.cssRules[j];
                    if (rule.type === 3) {
                        // Import Rule
                        proc(rule.styleSheet);
                    } else {
                        // Hack for Illustrator crashing on descendent selectors
                        if (rule.selectorText) {
                            if (rule.selectorText.indexOf(">") === -1) {
                                styles += "\n" + rule.cssText;
                            }
                        }
                    }
                }
            }
        };

        // Encode as HTML entities the UTF-8 characters
        if (view._legend) {
            view.toggleLegendUnitsEncoding(true);
        }

        // Allow for previously defined <defs> and <style> elements to be used
        if (defsEl.empty()) {
            defsEl = document.createElement('defs');
        }
        if (styleEl.empty()) {
            styleEl = document.createElement('style');
        }

        // Get only the rules from d3.css
        for (i = 0; i < styleSheets.length; i += 1) {
            if (Ext.String.endsWith(styleSheets[i].href, 'd3.css')) {
                proc(styleSheets[i]);
            }
        }

        node = view.svg
            .attr('version', 1.1)
            .attr('xmlns', 'http://www.w3.org/2000/svg')
            .node();

        // Inset the <defs> element; set 'type' attribute on <style> element
        node.insertBefore(defsEl, node.firstChild);
        defsEl.appendChild(styleEl);
        styleEl.setAttribute('type', 'text/css');

        // Capture SVG data as a String
        html = Ext.String.htmlEncode(node.parentNode.innerHTML)
            .replace('</style>', '<![CDATA[' + styles + ']]></style>');

        svgsrc = 'data:image/svg+xml;base64,' + window.btoa(html);

        var win = Ext.create('Ext.window.Window', {
            title: view._display,
            width: w,
            height: h,
            style: {
                display: 'none' // Don't actually show the Window; just use to render <canvas>
            },
            bodyStyle: {
                backgroundColor: '#aaa'
            },
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
        // Eliminate the Window instance after the file is saved
        // so that Window never actually shows
        }).show().close();

    },

    /**
        Resets the form and clears the map when the Single Map active tab is
        changed.
        @param  panel   {Ext.panel.TabPanel}
     */
    onSingleMapTabChange: function (panel) {
        panel.getActiveTab().getForm().reset();

        if (panel.getActiveTab.title !== 'gridded-map') {
            panel.down('field[name=showLinePlot]').setValue(false);
        }

        // Clear any currently drawn features
        this.getMap().clear();
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
        
        // Reset aggregate view
        this.uncheckAggregates();

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
            
            // (Re)load the line plot if the source has actually changed
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

                    operation(meta, field);
                },

                scope: this
            });
        }

        // Do not continue if the source is non-gridded
        //console.log(field.getStore().getById(source).get('gridded'));
//         var store = field.getStore().getById(source);
//         var store = Ext.StoreManager.get('scenarios');//.getById(source);
// 
//         if (!store) {
//             return;
//         }
//         
        if (!field.getStore().getById(source).get('gridded')) {
            return;
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
        var container = field.up('fieldset');
        var metadata;

        if (Ext.isEmpty(source) || source === last) {
            return;
        }

        // Metadata ////////////////////////////////////////////////////////////
        metadata = this.getStore('metadata').getById(source);
        if (metadata) {
            this.propagateMetadata(container, metadata);

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

                    this.propagateMetadata(container, meta);
                },

                scope: this
            });
        }
    },

    /**
        When the user adds a new row to the RowEditor, set the "view" property
        on the associated Flux.model.CoordView instance that is created.
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
	var map = this.getMap();
	var suppressUpdate = false;
	
        if (!checked) {
            return;
        }

        opts = this.getGlobalSettings();

	// do nothing if tendency custom value is modified but custom is not checked
	if (cb.name === 'tendencyCustomValue' &&
	    ['mean','median'].indexOf(opts.tendency) > -1) {
	    return;
	}
        
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
            
	    // redraw should NOT be needed here because updateScales()
	    // called below cascades to a redraw...but turns out in some instances it is needed.
            if (opts.statsFrom === 'data') {
                view.redraw();
            }
        });
	
	if (opts.display === 'anomalies') {
	    this.uncheckAggregates();
	    this.toggleAggregateParams(true);
	} else if (opts.display === 'values') {
	    this.toggleAggregateParams(false);
	}
    
        
	if ((opts.display === 'anomalies' || cb.name === 'values')) {
            if (!map.getMetadata()) {
                return;
            }
	    suppressUpdate = true; // this disables redundant map update trigger
	    if (map.getMetadata().get('gridded')) {
		this.fetchRaster(map,map.mostRecentRasterParams,true);
	    } else {
		this.fetchOverlay(map, map.mostRecentOverlayParams);
	    }
	}

        this.getController('MapController').updateScales({'suppressUpdate':suppressUpdate});

        // For what it's worth, grab the Metadata on the one (first) map and
        //  use it to propagate the population summary statistics
        this.onMetadataAdded(undefined, [map.getMetadata()]);
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
                w = 350;
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
        var calendars = container.query('datefield');
        var clocks = container.query('combo[valueField=time]');
        var dates = metadata.getDisabledDates(fmt);
        var step = Ext.Array.min(metadata.getTimeOffsets() || []);
        var params = window.location.href.split('?');
        params = Ext.Object.fromQueryString(params.pop());
        
        // Create date picker calendar
        if (calendars) {
            Ext.each(calendars, function (cal) {
                var clock = cal.nextSibling('combo[valueField=time]');
                cal.initDate = metadata.get('dates')[0].format(fmt);
                cal.reset();
                cal.setDisabledDates(['^(?!).*$']);
                cal.setDisabledDates(dates);

                // When date picker (calendar) is opened, show the first date                
                cal.on('expand', function () {
                    this.suspendEvent('change');
                    this.setRawValue(this.initDate);
                    this.resumeEvent('change');
                }, cal, {single: true});

                // If no information about the interval between data is known...
                if (!step && clock) {
                    // Update the available times to choose from with each date chosen
                    cal.on('change', function (f, date) {
                        clock.reset();
                        clock.bindStore(Ext.create('Ext.data.ArrayStore', {
                            fields: ['time'],
                            data: metadata.getTimes(date)
                        }));
                    });

                // If data are sub-daily enable the TimeField
                } else if (step < 86400) {
                    cal.on('change', function () {
                        clock.enable();
                    }, cal, {single: true});
                }
            });

        }

        //TODO Use the step/span indicated by the given date (from above)?
        if (clocks) {
            // For every Ext.form.field.Time found...
            Ext.each(clocks, function (clock) {
                clock.reset();
                clock.bindStore(Ext.create('Ext.data.ArrayStore', {
                    fields: ['time'],
                    data: metadata.getTimes()
                }));
                clock.disable();
            });
        }
        
        // After calendars/clocks are set up, load parameters from URL query
        // string if application is first loading according to URL parameters.
        //
        // This gets triggered here b/c calendars/clocks need to be set up before
        // field values are changed.
        if (this._initLoad && params.hasOwnProperty('source') && params.source.length > 1) {
            this.loadDateTimeParams(params, metadata);
        }
    },

    // Deletes ROI time-series if drawn on D3LinePlot
    removeRoiTimeSeries: function () {
        var linePlot = this.getLinePlot();
        
        if (!linePlot) {
            return;
        }
    
        if (linePlot.panes.plot.selectAll('.series-std-d')[0].length > 0) {
            ['.series','.series-std-u','.series-std-d'].forEach( function (s) {
                linePlot.panes.plot.selectAll(s).remove();
            });
            linePlot.panes.title.selectAll('.legend-entry').text('');
            delete linePlot._currentTimeSeries;
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

        // Toggle visibility of the ROI fetch time series button
        var cmp = map.down('toolbar').down('button[itemId="btn-fetch-roi-time-series"]');
        cmp.setDisabled(!checked);

        if (map._roiCoords) {
            cmp.setVisible(checked);
        }
        
        
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
		
		// Draw the previous series or load a new one
		if (series) {
		    linePlot.draw(series);

		} else {
		    this.bindMetadata(this.getLinePlot(), map.getMetadata());
		}
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
    },
    
    /**
        Disables/enables the aggregation checkbox and parameter fields
        @param disable {Boolean}
     */
    toggleAggregateParams: function (disable) {
	Ext.each(['#aggregation-fields','#difference-fields'], function (id) {
	    var cmps = Ext.ComponentQuery.query(id)[0]
	    Ext.each(cmps.query('trigger'), function (field) {
		field.setDisabled(disable);
	    });
	    cmps.query('checkbox')[0].setDisabled(disable);
	});
    }

});



