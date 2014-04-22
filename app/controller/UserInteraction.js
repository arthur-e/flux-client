Ext.define('Flux.controller.UserInteraction', {
    extend: 'Ext.app.Controller',

    refs: [{
        ref: 'contentPanel',
        selector: '#content'
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

        ////////////////////////////////////////////////////////////////////////
        // Event Listeners /////////////////////////////////////////////////////

        this.control({

            '#content': {
                remove: this.onContentRemove,
                resize: this.onContentResize
            },

            '#content d3panel': {
                close: this.onContentItemClose
            },

            '#settings-menu menucheckitem': {
                checkchange: this.onStatsChange
            },

            '#visual-menu': {
                click: this.onVisualChange
            },

            'combo[name=source]': {
                change: this.onSourceChange
            },

            'field[name=date], field[name=time]': {
                change: this.onDateTimeSelection
            },

            'sourcesgridpanel': {
                beforeedit: this.onSourceGridEntry,
                canceledit: this.onSourceGridCancel
            },

            'sourcepanel #aggregation-fields checkbox': {
                change: this.onAggregationToggle
            },

            'sourcepanel #aggregation-fields field': {
                change: this.onAggregationChange
            }

        });
    },

    /**
        Creates a new instance of Flux.view.D3GeographicPanel and inserts it
        into the appropriate place inside a target Anchor layout panel, resizing
        its siblings as necessary.
        @param  title   {String}
        @return         {Flux.view.D3GeographicPanel}
     */
    addMap: function (title) {
        var anchor, view;
        var container = this.getContentPanel();
        var query = Ext.ComponentQuery.query('d3geopanel');
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

        Ext.each(query, function (item, i) {
            item.anchor = anchor;
            container.on('afterlayout', item.redraw, item, {
                buffer: 1
            });
            container.doLayout();
        });

        this.alignContent(query);

        view = container.add({
            xtype: 'd3geopanel',
            title: title,
            anchor: anchor,
            enableDisplay: false,
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
                view.alignTo(query[query.length - 1].getEl(), 'tl-tr');
            } else {
                if ((n - 1) - j < 0) {
                    view.alignTo(query[0].getEl(), 'tl-bl');
                } else {
                    view.alignTo(query[n - j].getEl(), 'tl-bl');
                }
            }

        }

        return view;
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
                var j = (query.length < 4) ? 2 : 3;

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
        Convenience function for determining the currently selected global
        statistics settings; measure of central tendency, raw values versus
        anomalies, and whether to use population statistics or not.
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

    /**
        Finds or creates a single instance of D3GeographicPanel and returns it.
        @return {Flux.view.D3GeographicPanel}
     */
    getMap: function () {
        var opts = this.getGlobalSettings();
        var query = Ext.ComponentQuery.query('d3geopanel');

        if (query.length !== 0) {
            return query[0];
        }

        return this.getContentPanel().add({
            xtype: 'd3geopanel',
            title: 'Single Map',
            anchor: '100% 100%',
            enableTransitions: true,
            enableZoomControls: true
        });
    },

    /**
        Given a request for a map at based on certain parameters, checks to
        see if the map has already been loaded by the view and requests it
        from the server if it has not been loaded.
        @param  view    {Flux.view.D3GeographicPanel}
        @param  params  {Object}
     */
    fetchMap: function (view, params) {
        var grid;
        var source = view.getMetadata().getId();

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
            callback: function (opts, s, response) {
                var grid = Ext.create('Flux.model.Grid',
                    Ext.JSON.decode(response.responseText));

                // Create a unique ID that can be used to find this grid
                grid.set('_id', Ext.Object.toQueryString(opts.params));

                this.bindGrid(view, grid);
                this.onMapLoad(grid);
            },
            scope: this
        });
    },

    ////////////////////////////////////////////////////////////////////////////
    // Event Handlers //////////////////////////////////////////////////////////

    /**
        Binds a Flux.model.Geometry instance to the provided view, a
        Flux.view.D3GeographicPanel instance.
        @param  view    {Flux.view.D3GeographicPanel}
        @param  grid    {Flux.model.Geometry}
     */
    bindGeometry: function (view, geometry) {
        view.setGridGeometry(geometry);
    },

    /**
        Binds a Flux.model.Grid instance to the provided view, a
        Flux.view.D3GeographicPanel instance. The view's store is updated
        with the new Grid instance.
        @param  view    {Flux.view.D3GeographicPanel}
        @param  grid    {Flux.model.Grid}
     */
    bindGrid: function (view, grid) {
        view.store.add(grid);
        view.draw(grid, true);

        // The color scale can only be properly adjusted AFTER data are bound
        //  to the view
        if (!view._usePopulationStats) {
            view.updateColorScale(this.getSymbology().getForm().getValues());
        }
    },

    /**
        Binds a Flux.model.Metadata instance to the provided view, a
        Flux.view.D3GeographicPanel instance.
        @param  view    {Flux.view.D3GeographicPanel}
        @param  grid    {Flux.model.Metadata}
     */
    bindMetadata: function (view, metadata) {
        var opts = this.getGlobalSettings();

        view.setMetadata(metadata)
            .togglePopulationStats(opts.statsFrom === 'population', metadata)
            .toggleAnomalies(opts.display === 'anomalies', opts.tendency);

        // Only when using population statistics will the color scale be ready
        //  before data have been bound to the view
        if (opts.statsFrom === 'population') {
            view.updateColorScale(this.getSymbology().getForm().getValues());
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

        Ext.each(field.up('fieldset').query('trigger'), function (t) {
            args[t.getName()] = t.getValue();
        });

        vals = Ext.Object.getValues(args);
        if (Ext.Array.clean(vals).length !== vals.length) {
            // Do nothing if not all of the fields are filled out
            return;
        }

        view = this.getMap();

        if (field.up('fieldset').down('field[name=showAggregation]').getValue()) {
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
        Disables the "Values displayed as..." menu items when aggregation is
        enabled.
        @param  cb      {Ext.form.field.Checkbox}
        @param  checked {Boolean}
     */
    onAggregationToggle: function (cb, checked) {
        var query = this.getSettingsMenu().query('menuitem[group=display]');
        if (checked) {
            Ext.each(query, function (item) {
                item.setChecked(item.name === 'values');
                item.disable();
            });
        } else {
            Ext.each(query, function (item) {
                item.enable();
            });
        }
    },

    /**
        Removes the corresponding GridView for a D3Panel instance that has
        been closed.
        @param  item    {Ext.Component}
     */
    onContentItemClose: function (item) {
        var store = this.getStore('gridviews');

        store.removeAt(store.findBy(function (rec) {
            return rec.get('view').getId() === item.getId();
        }));
    },

    /**
        Handles content being removed from the #content panel.
        @param  c       {Ext.panel.Panel}
        @param  item    {Flux.view.D3Panel}
     */
    onContentRemove: function (c, item) {
        var query = Ext.ComponentQuery.query('d3panel');

        if (query.length <= 1) {
            return;
        }

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
        var query = Ext.ComponentQuery.query('d3geopanel');

        this.alignContent(query);
    },

    /**
        Handles a change in the "date" or "time" fields signifying the user is
        ready to load map data for that date and time.
        @param  field   {Ext.form.field.*}
        @param  value   {String}
     */
    onDateTimeSelection: function (field, value) {
        var editor = field.up('roweditor');
        var values = field.up('panel').getForm().getValues();
        var view;

        if (!value) {
            return; // Ignore undefined, null values
        }

        if (editor) {
            view = editor.editingPlugin.getCmp().getView().getSelectionModel()
                .getSelection()[0].get('view');

            view.setTitle(Ext.String.format('{0} at {1}', values.date, values.time));

        } else {
            view = this.getMap();
        }

        if (!Ext.isEmpty(values.source) && !Ext.isEmpty(values.date)
            && !Ext.isEmpty(values.time)) {
            this.fetchMap(view, {
                time: Ext.String.format('{0}T{1}:00', values.date, values.time)
            });
        }
    },

    /**TODO
        @param  grid    {Flux.model.Grid}
     */
    onMapLoad: function (grid) {
    },

    /**
        Follows the addition of Metadata to a view's metadata store; enables
        the Animation controls.
        @param  store   {Flux.store.Metadata}
        @param  recs    {Array}
     */
    onMetadataAdded: function (store, recs) {
        this.getController('Animation').enableAnimation(recs[0]);
    },

    /**
        Propagates changes in the Metadata (most recently received
        Flux.model.Metadata instance) to other Components that need e.g.
        population summary statistics.
        @param  metadata    {Flux.model.Metadata}
     */
    onMetadataLoad: function (metadata) {
        if (!metadata) {
            return;
        }

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
            Ext.Function.createSequence(
                this.bindMetadata(view, metadata),
                this.onMetadataLoad(metadata));
            this.propagateMetadata(container, metadata);
            
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

                    Ext.Function.createSequence(
                        this.bindMetadata(view, metadata),
                        this.onMetadataLoad(metadata));
                    this.propagateMetadata(container, metadata);
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
        view.ownerCt.remove(view);
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

        if (change.tendency !== undefined) {
            this.getController('MapController').updateColorScales({
                tendency: change.tendency
            });
        }

        if (change.statsFrom !== undefined ) {
            store = this.getStore('metadata');

            Ext.each(query, function (view) {
                if (Ext.isEmpty(view.getMetadata())) {
                    return;
                }

                view.togglePopulationStats(opts.statsFrom === 'population',
                    store.getById(view.getMetadata().get('_id')));
            });

            this.getController('MapController').updateColorScales();

            if (query.length === 1 && !Ext.isEmpty(query[0].getMetadata())) {
                this.onMetadataLoad(query[0].getMetadata());
            }
        }

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
        var viewQuery = Ext.ComponentQuery.query('d3panel');
        var w;

        if (this._activeViewId === item.getItemId()) {
            return;
        }

        // Remove any and all view instances
        Ext.each(viewQuery, function (cmp) {
            cmp.ownerCt.remove(cmp);
        });

        switch (item.getItemId()) {
            case 'single-map':
                w = '20%';
                if (viewQuery.length === 0) {
                    this.getMap();
                }
                this.getSourcePanel().getForm().reset();
                break;

            case 'coordinated-view':
                w = 300;
                this.getSymbology().up('sidepanel').collapse();
                this.getSourcesGrid().getStore().removeAll();
                break;
        }

        this.getSourceCarousel()
            .setWidth(w)
            .getLayout().setActiveItem(item.idx);

        this._activeViewId = item.getItemId();
    },

    /**
        Propagates changes in the metadata to child components of a given
        container, specifically, setting the DateField and TimeField instances.
     */
    propagateMetadata: function (container, metadata) {
        var dates = container.query('datefield[name=date], datefield[name=date2]');
        var times = container.query('combo[name=time], combo[name=time2]');

        if (dates) {
            Ext.each(dates, function (target) {
                var fmt = 'YYYY-MM-DD';
                var dates = metadata.get('dates');
                var firstDate = dates[0].format(fmt);
                target.setDisabledDates(metadata.getInvalidDates(fmt));
                //target.setMinValue(firstDate);
                target.on('expand', function (f) {
                    f.suspendEvent('change');
                    f.setValue(firstDate);
                    f.resumeEvent('change');
                });
                target.on('focus', function (f) {
                    f.suspendEvent('change');
                    f.setValue(undefined);
                    f.resumeEvent('change');
                });
            });
        }

        if (times) {
            // For every Ext.form.field.Time found...
            Ext.each(times, function (target) {
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
    }

});



