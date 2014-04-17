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
        selector: 'sourcecarousel',
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

        Ext.create('Flux.store.Geometries', {
            storeId: 'geometries'
        });

        Ext.create('Flux.store.Grids', {
            storeId: 'grids'
        });

        Ext.create('Flux.store.Metadata', {
            storeId: 'metadata',
            listeners: {
                add: Ext.Function.bind(this.onMetadataAdded, this)
            }
        });

        Ext.create('Flux.store.Scenarios', {
            autoLoad: true,
            storeId: 'scenarios'
        });

        ////////////////////////////////////////////////////////////////////////
        // Event Listeners /////////////////////////////////////////////////////

        this.control({

            '#content': {
                resize: this.onContentResize
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

            'sourcepanel #aggregation-fields': {
                afterrender: this.initAggregationFields
            },

            'sourcesgridpanel': {
                beforeedit: this.onSourceGridEntry,
                canceledit: this.onSourceGridCancel
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
            return; //TODO Warn the user
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
            container.doLayout();
        });

        this.onContentResize();

        view = container.add({
            xtype: 'd3geopanel',
            title: title,
            anchor: anchor,
            enableDisplay: false
        });

        // j works here because we want the new item to be positioned below
        //  the item at index (n - j) where n is the previous number of panels:
        //  0   1   2   or  0   1
        //  3   4   5       2   3
        //  6   7   8
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
        var query = Ext.ComponentQuery.query('d3geopanel');

        if (query.length !== 0) {
            return query[0];
        }

        return this.getContentPanel().add({
            xtype: 'd3geopanel',
            title: 'Single Map',
            anchor: '100% 100%',
            enableZoomControls: true
        }).toggleTransitions(true);
    },

    /**TODO
     */
    requestMap: function (view, source, params) {
        Ext.Ajax.request({
            method: 'GET',

            url: Ext.String.format('/flux/api/scenarios/{0}/xy.json', source),

            params: params,

            callback: Ext.Function.bind(this.onMapLoad, this),

            success: this.bindGrid,

            scope: view
        });
    },

    ////////////////////////////////////////////////////////////////////////////
    // Event Handlers //////////////////////////////////////////////////////////

    /**
        Called as a method of the Flux.view.D3Panel instance (or subclass
        instance) that is to receive the Flux.model.Metadata instance.
        @param  response    {Object}
     */
    bindMetadata: function (response) {
        var metadata = Ext.create('Flux.model.Metadata',
            Ext.JSON.decode(response.responseText));

        metadata.set('viewId', this.getId());
        Ext.StoreManager.get('metadata').add(metadata);

        this.setMetadata(metadata);
    },

    /**
        Called as a method of the Flux.view.D3Panel instance (or subclass
        instance) that is to receive the Flux.model.Geometry instance.
        @param  response    {Object}
     */
    bindGeometry: function (response) {
        var geometry = Ext.create('Flux.model.Geometry',
            Ext.JSON.decode(response.responseText));

        geometry.set('viewId', this.getId());
        Ext.StoreManager.get('metadata').add(geometry);

        this.setGridGeometry(geometry);
    },

    /**
        Called as a method of the Flux.view.D3Panel instance (or subclass
        instance) which then calls its draw() method, receiving the Grid model
        as the data.
        @param  response    {Object}
     */
    bindGrid: function (response) {
        var grid = Ext.create('Flux.model.Grid',
            Ext.JSON.decode(response.responseText));

        grid.set('viewId', this.getId());
        Ext.StoreManager.get('grids').add(grid);

        this.draw(grid, true);
    },

    /**
        Ensures that the Aggreation Fieldset is enabled if the
        "Statistics from..." setting is set to the "Current Data Frame."
        @param  fieldset    {Ext.form.Fieldset}
     */
    initAggregationFields: function (fieldset) {
        if (this.getSymbology().down('hiddenfield[name=statsFrom]').getValue() === 'data') {
            fieldset.enable();
        }
    },

    /**
        Propagates the resize to child Components which may not have been
        automatically resized correctly.
     */
    onContentResize: function () {
        var query = Ext.ComponentQuery.query('d3geopanel');

        if (query.length > 1) {
            Ext.each(query, function (view, i) {
                var j = (query.length < 4) ? 2 : 3;

                // Align those odd-indexed (towards-the-right) panels
                if (i !== 0) {
                    if (i % j !== 0) {
                        view.alignTo(query[i - 1].getEl(), 'tl-tr');
                    } else {
                        view.alignTo(query[i - j].getEl(), 'tl-bl');
                    }
                }
            });
        }
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

        if (!Ext.isEmpty(values.date) && !Ext.isEmpty(values.time)) {
            this.requestMap(view, values.source, {
                time: Ext.String.format('{0}T{1}:00', values.date, values.time)
            });
        }
    },

    /**TODO
        @param  opts        {Object}
        @param  success     {Boolean}
        @param  response    {Object}
     */
    onMapLoad: function (opts, success, response) {
    },

    /**TODO
     */
    onMetadataAdded: function (store, recs) {
    },

    /**
        Propagates changes in the Metadata (most recently received
        Flux.model.Metadata instance) to other Components that need e.g.
        population summary statistics.
        @param  opts        {Object}
        @param  success     {Boolean}
        @param  response    {Object}
     */
    onMetadataLoad: function (opts, success, response) {
        var metadata = Ext.create('Flux.model.Metadata',
            Ext.JSON.decode(response.responseText));

        // Initialize the values of the domain bounds and threshold sliders
        Ext.each(this.getSymbology().query('enumslider'), function (cmp) {
            cmp.setBounds([
                metadata.get('stats').min,
                metadata.get('stats').max
            ]);
        });

        this.getController('MapController').updateColorScales();
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
        var view;

        if (Ext.isEmpty(source) || source === last) {
            return;
        }

        if (editor) {
            view = editor.editingPlugin.getCmp().getView().getSelectionModel()
                .getSelection()[0].get('view');

        } else {
            view = this.getMap();
        }

        // Load Metadata
        Ext.Ajax.request({
            method: 'GET',
            url: '/flux/api/scenarios.json',
            params: {
                scenario: source
            },
            callback: Ext.Function.createSequence(
                Ext.Function.bind(this.onMetadataLoad, this), 
                Ext.Function.bind(this.propagateMetadata, container)),

            success: this.bindMetadata,

            scope: view
        });

        // Load Geometry
        Ext.Ajax.request({
            method: 'GET',
            url: Ext.String.format('/flux/api/scenarios/{0}/geometry.json', source),
            success: this.bindGeometry,
            scope: view
        });

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

        this.onContentResize();
    },

    /**
        When the user adds a new row to the RowEditor, set the "view" property
        on the associated Flux.model.GridView instance that is created.
        @param  editor  {Ext.grid.plugin.Editing}
        @param  context {Object}
     */
    onSourceGridEntry: function (editor, context) {
        view = this.addMap('New Map');
        context.record.set('view', view);
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
        Called as a method of an Ext.container.Container instance. Propagates
        metadata response as a Flux.model.Metadata instance.
        @param  opts        {Object}
        @param  success     {Boolean}
        @param  response    {Object}
     */
    propagateMetadata: function (opts, success, response) {
        var metadata = Ext.create('Flux.model.Metadata',
            Ext.JSON.decode(response.responseText));

        var dates = this.query('datefield[name=date], datefield[name=date2]');
        var times = this.query('combo[name=time], combo[name=time2]');

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



