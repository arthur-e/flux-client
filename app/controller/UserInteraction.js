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
        ref: 'viewport',
        selector: 'viewport'
    }],

    requires: [
        'Ext.data.ArrayStore',
        'Ext.state.CookieProvider',
        'Flux.model.Geometry',
        'Flux.model.Grid',
        'Flux.model.Metadata',
        'Flux.store.Geometries',
        'Flux.store.Grids',
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

        Ext.create('Flux.store.Geometries', {
            storeId: 'geometries'
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

            'field[name=showLinePlot]': {
                change: this.toggleLinePlotDisplay
            },

            'field[name=source], field[name=source2]': {
                change: this.onSourceChange
            },

            'field[name=date], field[name=time]': {
                change: this.onDateTimeSelection,
                expand: this.onDateTimeExpansion
            },

            'sourcesgridpanel': {
                beforeedit: this.onSourceGridEntry,
                canceledit: this.onSourceGridCancel
            },

            'sourcepanel fieldset checkbox': {
                change: this.onAggOrDiffToggle
            },

            'sourcepanel #aggregation-fields field': {
                change: this.onAggregationChange
            },

            'sourcepanel #difference-fields field': {
                change: this.onDifferenceChange
            },

            'toolbar button[cls=anim-btn]': {
                click: this.onAnimation
            }

        });
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

        Ext.each(query, function (view, i) {
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
        var grid, source;
        
        if (!view.getMetadata()) {
            return;
        }
        source = view.getMetadata().getId();

        // Check for the unique ID, a hash of the parameters passed in this
        //  request
        grid = view.store.getById(Ext.Object.toQueryString(params));
        if (grid) {
            this.bindGrid(view, grid);
            this.onMapLoad(grid);
            return;
        }

        Ext.Ajax.request({
            method: 'GET',
            url: Ext.String.format('/flux/api/scenarios/{0}/xy.json', source),
            params: params,
            callback: function (opts, success, response) {
                var grid;

                if (!success) {
                    return;
                }

                grid = Ext.create('Flux.model.Grid',
                    Ext.JSON.decode(response.responseText));

                // Create a unique ID that can be used to find this grid
                grid.set('_id', Ext.Object.toQueryString(opts.params));

                this.bindGrid(view, grid);
                this.onMapLoad(grid);
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

                    grid = Ext.create('Flux.model.Grid',
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

        Ext.Ajax.request({
            method: 'GET',
            url: Ext.String.format('/flux/api/scenarios/{0}/t.json',
                metadata.getId()),
            params: {
                start: dates[0].toISOString(),
                end: dates[dates.length - 1].toISOString(),
                //TODO aggregate: this.getGlobalSettings().tendency,
                aggregate: 'mean',
                interval: 'daily'
            },
            callback: function (o, s, response) {
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
        Binds a Flux.model.Geometry instance to the provided view, a
        Flux.view.D3GeographicMap instance.
        @param  view    {Flux.view.D3GeographicMap}
        @param  grid    {Flux.model.Geometry}
     */
    bindGeometry: function (view, geometry) {
        view.setGridGeometry(geometry);
    },

    /**
        Binds a Flux.model.Grid instance to the provided view, a
        Flux.view.D3GeographicMap instance. The view's store is updated
        with the new Grid instance.
        @param  view    {Flux.view.D3Panel}
        @param  grid    {Flux.model.Grid}
     */
    bindGrid: function (view, grid) {
        if (!Ext.isEmpty(grid.get('_id'))) {
            view.store.add(grid);
        }

        view.draw(grid, true);

        // The color scale can only be properly adjusted AFTER data are bound
        //  to the view
        if (!view._usePopulationStats) {
            view.updateScale(this.getSymbology().getForm().getValues());
        }
    },

    /**
        Binds a Flux.model.Metadata instance to the provided view, a
        Flux.view.D3GeographicMap instance.
        @param  view    {Flux.view.D3Panel}
        @param  grid    {Flux.model.Metadata}
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
    onAggregationChange: function (field, value) {
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
            // NOTE: Only available for the Single Map visualization thus far
            params = {
                aggregate: args.aggregate,
                start: view.getMoment().toISOString(),
                end: view.getMoment().clone().add(args.intervals,
                    args.intervalGrouping).toISOString()
            };

        } else {
            params = {
                time: view.getMoment().toISOString()
            }
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
        When the Animate button is pressed, checks/unchecks the
        "Show Aggregation" and "Show Difference" checkboxex in the FieldSets.
        @param  btn {Ext.button.Button}
     */
    onAnimation: function (btn) {
        if (btn.pressed || btn.getItemId() !== 'animate-btn') {
            Ext.each(this.getSourcePanel().query('fieldset checkbox'), function (cb) {
                cb.setValue(false);
            });
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
        Unchecks the "Show aggregation" checkbox.
     */
    onDateTimeExpansion: function () {
        cb = this.getSourcePanel()
            .down('checkbox[name=showAggregation]');
        cb.setValue(false);
    },

    /**
        Handles a change in the "date" or "time" fields signifying the user is
        ready to load map data for that date and time.
        @param  field   {Ext.form.field.*}
        @param  value   {String}
     */
    onDateTimeSelection: function (field, value) {
        var cb, dates, theDate, view;
        var editor = field.up('roweditor');
        var values = field.up('panel').getForm().getValues();

        if (!value) {
            return; // Ignore undefined, null values
        }

        // Uncheck the "Show Aggregation" and "Show Difference" checkboxes
        this.uncheckAggregates();

        if (editor) {
            view = editor.editingPlugin.getCmp().getView().getSelectionModel()
                .getSelection()[0].get('view');

        } else {
            view = this.getMap();
        }

        // Do nothing if not all of these fields are filled out
        if (Ext.isEmpty(values.source) || Ext.isEmpty(values.date)
            || Ext.isEmpty(values.time)) {
            return;
        }

        dates = view.getMetadata().get('dates');
        theDate = moment.utc(Ext.String.format('{0}T{1}:00.000Z',
            values.date, values.time));

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
    onDifferenceChange: function (field, value) {
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
                var grid;
                var f1 = g1.get('features');
                var f2 = g2.get('features');

                if (f1.length !== f2.length) {
                   Ext.Msg.alert('Data Error', 'Cannot display the difference of two maps with difference grids. Choose instead maps from two different data sources and/or times that have the same underlying grid.');
                }

                // Add these model instances to the view's store
                view.store.add(g1, g2);

                grid = Ext.create('Flux.model.Grid', {
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

                this.bindGrid(view, grid);
                this.onMapLoad(grid);
            }, this));

        } else {
            this.fetchMap(view, {
                time: view.getMoment().toISOString()
            });
        }
    },

    /**
        Propagates wider changes following the loading of a new Grid instance.
        Specifically, this updates the D3LinePlot instance.
        @param  grid    {Flux.model.Grid}
     */
    onMapLoad: function (grid) {
        var props = grid.get('properties');
        var moments = [
            grid.get('timestamp')
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
        this.getController('Animation').enableAnimation(metadata);

        // Initialize the values of the domain bounds and threshold sliders
        Ext.each(this.getSymbology().query('enumslider'), function (cmp) {
            cmp.setBounds([
                metadata.get('stats').min,
                metadata.get('stats').max
            ]);
        });
    },

    /**
        Handles a change in the data "source" from a ComboBox configured for
        selecting from among sources (e.g. scenarios, model runs, etc.).
        @param  field   {Ext.form.field.ComboBox}
        @param  source  {String}
        @param  last    {String}
     */
    onSourceChange: function (field, source, last) {
        var container = field.up('panel');
        var editor = field.up('roweditor');
        var metadata, geometry, view;

        if (Ext.isEmpty(source) || source === last) {
            return;
        }

        if (editor) {
            view = editor.editingPlugin.getCmp().getView().getSelectionModel()
                .getSelection()[0].get('view');

        } else {
            view = this.getMap();
        }

        metadata = this.getStore('metadata').getById(source);
        geometry = this.getStore('geometries').getById(source);

        if (metadata) {
            this.bindMetadata(view, metadata);
            this.propagateMetadata(container, metadata);
            if (this.getLinePlot() && !this.getLinePlot().isDrawn) {
                this.bindMetadata(this.getLinePlot(), metadata);
            }
            
        } else {
            Ext.Ajax.request({
                method: 'GET',
                url: '/flux/api/scenarios.json',
                params: {
                    scenario: source
                },
                callback: function (o, s, response) {
                    var metadata = Ext.create('Flux.model.Metadata',
                        Ext.JSON.decode(response.responseText));

                    this.getStore('metadata').add(metadata);

                    this.bindMetadata(view, metadata);
                    this.propagateMetadata(container, metadata);
                    if (this.getLinePlot()) {
                        this.bindMetadata(this.getLinePlot(), metadata);
                    }
                },

                scope: this
            });
        }

        if (geometry) {
            this.bindGeometry(view, geometry);

        } else {
            Ext.Ajax.request({
                method: 'GET',
                url: Ext.String.format('/flux/api/scenarios/{0}/geometry.json', source),
                callback: function (o, s, response) {
                    var geometry = Ext.create('Flux.model.Geometry',
                        Ext.JSON.decode(response.responseText));

                    this.getStore('geometries').add(geometry);

                    this.bindGeometry(view, geometry);
                },
                scope: this
            });
        }

    },

    /**
        When the user cancels the editing/addition of a row to the RowEditor,
        remove the associated view that was created.
        @param  editor  {Ext.grid.plugin.Editing}
        @param  context {Object}
     */
    onSourceGridCancel: function (editor, context) {
        var view = context.record.get('view');

        // Remove the view associated with the Flux.model.GridView instance
        if (view.ownerCt) {
            view.ownerCt.remove(view);
        }
    },

    /**
        When the user adds a new row to the RowEditor, set the "view" property
        on the associated Flux.model.GridView instance that is created.
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
        var change = {};
        var query = Ext.ComponentQuery.query('d3panel');
        var opts, store;

        if (!checked) {
            return;
        }

        change[cb.group] = cb.name;
        opts = this.getGlobalSettings();

        // Measure of central tendency /////////////////////////////////////////
        if (change.tendency !== undefined) {
            // Update the additive offset for anomalies, in case they're used
            Ext.each(query, function (view) {
                view.toggleAnomalies((opts.display === 'anomalies'),
                    opts.tendency);
            });
            this.getController('MapController').updateScales({
                tendency: change.tendency
            });
        }

        // Statistics from... //////////////////////////////////////////////////
        if (change.statsFrom !== undefined ) {
            store = this.getStore('metadata');

            Ext.each(query, function (view) {
                if (Ext.isEmpty(view.getMetadata())) {
                    return;
                }

                view.togglePopulationStats(opts.statsFrom === 'population',
                    store.getById(view.getMetadata().get('_id')));
            });

            this.getController('MapController').updateScales();
        }

        // Values displayed as.... /////////////////////////////////////////////
        if (change.display !== undefined) {
            Ext.each(query, function (view) {
                view.toggleAnomalies((opts.display === 'anomalies'),
                    opts.tendency).redraw();
            });
        }

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
        var datePicks = container.query('datefield');
        var timePicks = container.query('combo[name=time], combo[name=time2]');

        if (datePicks) {
            Ext.each(datePicks, function (target) {
                var fmt = 'YYYY-MM-DD';
                var dates = metadata.get('dates');
                var firstDate = dates[0].format(fmt);
                target.setDisabledDates(metadata.getInvalidDates(fmt));
                target.on('expand', function (f) {
                    if (!f.isDirty()) {
                        f.suspendEvent('change');
                        f.setValue(firstDate);
                        f.resumeEvent('change');
                    }
                });
            });
        }

        if (timePicks) {
            // For every Ext.form.field.Time found...
            Ext.each(timePicks, function (target) {
                var mins = (Ext.Array.min(metadata.get('steps')) / 60);
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



