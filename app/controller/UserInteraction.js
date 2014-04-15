Ext.define('Flux.controller.UserInteraction', {
    extend: 'Ext.app.Controller',

    refs: [{
        ref: 'aggregationFields',
        selector: '#aggregation-fields'
    }, {
        ref: 'contentPanel',
        selector: '#content'
    }, {
        ref: 'symbology',
        selector: 'symbology'
    }, {
        ref: 'sourceCarousel',
        selector: 'sourcecarousel'
    }, {
        ref: 'viewport',
        selector: 'viewport'
    }],

    requires: [
        'Ext.data.ArrayStore',
        'Ext.form.field.ComboBox',
        'Ext.form.field.Number',
        'Ext.resizer.Splitter',
        'Ext.window.Window',
        'Flux.model.Geometry',
        'Flux.store.Metadata'
    ],

    init: function () {
        // Create a new state Provider if one doesn't already exist
        if (Ext.state.Manager.getProvider().path === undefined) {
            Ext.state.Manager.setProvider(Ext.create('Ext.state.CookieProvider'));
        }

        this._vis = 'single-map';

        ////////////////////////////////////////////////////////////////////////
        // Event Listeners /////////////////////////////////////////////////////

        this.control({

            '#vis-menu': {
                click: this.onVisChange
            },

            'combo[name=source]': {
                select: this.onSourceChange
            },

            'sourcepanel #aggregation-fields': {
                afterrender: this.initAggregationFields
            },

            'sourcepanel #aggregation-fields field': {
                change: this.onAggregationChange
            },

            'sourcepanel field[name=date], sourcepanel field[name=time]': {
                change: this.loadSingleMap
            },

            'sourcesgridpanel': {
                edit: this.loadCoordinatedView
            }

        });
    },

    ////////////////////////////////////////////////////////////////////////////
    // Event Handlers //////////////////////////////////////////////////////////

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
        Handles a change in the aggregation fields in the SourcesPanel. When all
        of the fields are appropriately configured, it performs a request for
        aggregated data according to the user's specifications.
     */
    onAggregationChange: function () {
        var args = {};
        var vals;

        Ext.each(this.getAggregationFields().query('trigger'), function (cmp) {
            args[cmp.getName()] = cmp.getValue();
        });

        vals = Ext.Object.getValues(args);
        if (Ext.Array.clean(vals).length === vals.length) {
            this.getController('Dispatch').aggregate(args);
        }
    },

    /**
        Fetches the metadata for a selected dataset/source (scenario name);
        propagates effects of the selection throughout the user interface
        including initializing the date selection fields (with disabled dates).
     */
    onSourceChange: function (field, sources) {
        var ct = field.up('container');
        var geometry = this.getStore('geometries');
        var metadata = this.getStore('metadata');
        var src = sources[0].get('_id');

        if (ct.getEl().mask) {
            ct.getEl().mask('Loading...');
        }

        // Tell the dispatch to use this scenario name in all requests
        this.getController('Dispatch').setRequestNamespace(src);

        metadata.fetch({
            params: {
                scenario: src
            },
            callback: Ext.Function.bind(function (recs, op, success) {
                var meta = recs.pop();

                this.getController('Animation').enableAnimation(meta);

                geometry.load({
                    callback: function () {
                        if (ct.getEl().mask) {
                            ct.getEl().unmask();
                        }
                    }
                });

                // Guard against a fatal browser hang-up in Google Chrome that
                //  occurs when the Model created doesn't have the right fields
                if (!success || (!meta.raw.hasOwnProperty('spans') && !meta.raw.hasOwnProperty('steps'))) {
                    return;
                }

                // If the data represent spans of times, evaluate what kind of
                //  DateField is needed
                if (meta.get('spans')) {
                    if (Ext.Array.every(meta.get('spans'), function (rng) {
                        return (/^\d*[Dd]$/.test(rng)); // Some number of days...
                    })) {
                        // TODO Need to support multi-day spans...

                    } else if (Ext.Array.every(meta.get('spans'), function (rng) {
                        return (/^\d*[Mm]$/.test(rng)); // Some number of months...
                    })) {
                        // TODO Need to support multi-month spans...

                    } else {
                        // TODO Provide some kind of generic date/time accessor...
                    }

                } else { // Assume steps are specified instead
                    this.initializeDateFields(meta, ct);
                    this.initializeTimeFields(meta, ct);

                }

                // If any error/uncertainty data are available...
                if (meta.get('uncertainty')) {
                    // TODO Something about that...

                } else {
                    if (ct.down('checkbox[name=showUncertainty]')) {
                        ct.down('checkbox[name=showUncertainty]').disable();
                    }
                }

            }, this)

        });
    },

    /**
        Handles a change in the Visualization type (from 'Select Visualization').
        @param  m       {Ext.menu.Menu}
        @param  item    {Ext.menu.Item}
     */
    onVisChange: function (m, item) {
        var mapQuery = Ext.ComponentQuery.query('d3geopanel');
        var w;

        if (this._vis === item.getItemId()) {
            return;
        }

        // Remove any and all d3geopanel instances
        Ext.each(mapQuery, function (cmp) {
            cmp.ownerCt.remove(cmp);
        });

        switch (item.getItemId()) {
            case 'single-map':
            w = '20%';
            if (mapQuery.length === 0) {
                this.getContentPanel().add({
                    xtype: 'd3geopanel',
                    title: 'Single Map',
                    anchor: '100% 100%'
                });
            }
            break;

            default:
            w = 300;
            this.getSymbology().up('sidepanel').collapse();
        }

        this.getSourceCarousel()
            .setWidth(w)
            .getLayout().setActiveItem(item.idx);

        this._vis = item.getItemId();
    },

    /**
        Initializes the Ext.form.field.DateField instances within the application.
        @param  metadata    {Flux.model.Metadata}
     */
    initializeDateFields: function (metadata) {
        var dates = metadata.get('dates');
        var lastDate = Ext.Date.format(dates[dates.length - 1], 'Y-m-d');
        var targets = Ext.ComponentQuery.query('datefield[name=date]');

        Ext.each(targets, function (target) {
            target.setDisabledDates(metadata.getInvalidDates());
            target.setMaxValue(lastDate);
            target.on('expand', function (f) {
                f.suspendEvent('change');
                f.setValue(lastDate);
                f.resumeEvent('change');
            });
            target.on('focus', function (f) {
                f.suspendEvent('change');
                f.setValue(undefined);
                f.resumeEvent('change');
            });
        });
    },

    /**
        Initializes the Ext.form.field.Time instances contained by the
        topNode provided (those that can be reached with topNode.down()).
        @param  metadata    {Flux.model.Metadata}
        @param  topNode     {Ext.Component}
     */
    initializeTimeFields: function (metadata, topNode) {
        var targets = Ext.ComponentQuery.query('combo[name=time], combo[name=time2]');
        if (targets) {

            // For every Ext.form.field.Time found...
            Ext.each(targets, function (target) {
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

    /**TODO
     */
    loadCoordinatedView: function (editor) {
        var cmp;
        var container = this.getContentPanel();
        var values = editor.getCmp().getFieldValues();
        var query = Ext.ComponentQuery.query('d3geopanel');
        var n = (container.items.length + 1);
        var s = Ext.String.format('{0}%', 100 / n);
        var x = (container.getWidth() / n);
        var y = (container.getHeight() / n);

        if (query.length !== 0) {
            console.log('resizing...');//FIXME
            Ext.each(query, function (cmp) {
                console.log(cmp);//FIXME
                cmp.setSize(s, s);//.anchorTo(container.getEl(), 'tl-bl?', [x, y]);
            });
        } else {//FIXME
            cmp = container.add({
                xtype: 'd3geopanel',
                title: Ext.String.format('{0} at {1}', values.date, values.time),
                anchor: Ext.String.format('{0} {0}', s)
            });

            this.getController('Dispatch').loadMap({
                time: Ext.String.format('{0}T{1}:00', values.date, values.time)
            }, '#' + cmp.getId());
        }
    },

    /**
        Loads source data corresponding to the date and time selected so long
        as the change in value that triggered the load results in a different
        value from the last.
        @param  field   {Ext.form.field.*}
        @param  value   {String}
        @param  last    {String}
     */
    loadSingleMap: function (field, value, last) {
        var values = field.up('panel').getForm().getValues();
        if (!value) {
            return; // Ignore undefined, null values
        }

        if (values.date && values.time && values.date !== '' && values.time !== '') {
            this.getController('Dispatch').loadMap({
                time: Ext.String.format('{0}T{1}:00', values.date, values.time)
            });
        }
    }

});



