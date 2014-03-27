Ext.define('Flux.controller.UserInteraction', {
    extend: 'Ext.app.Controller',

    requires: [
        'Ext.Array',
        'Flux.model.Geometry',
        'Flux.store.Metadata'
    ],

    refs: [{
        ref: 'paletteField',
        selector: 'symbology > combo[name=palette]'
    }],

    init: function () {
        // Create a new state Provider if one doesn't already exist
        if (Ext.state.Manager.getProvider().path === undefined) {
            Ext.state.Manager.setProvider(Ext.create('Ext.state.CookieProvider'));
        }

        ////////////////////////////////////////////////////////////////////////
        // Event Listeners /////////////////////////////////////////////////////

        this.control({

            'sourcespanel combo[name=source]': {
                select: this.handleSourceChange
            },

            'sourcespanel > field[name=date], field[name=time]': {
                change: this.loadSourceData
            }

        });
    },

    ////////////////////////////////////////////////////////////////////////////
    // Event Handlers //////////////////////////////////////////////////////////

    /**
        Fetches the metadata for a selected dataset/source (scenario name);
        propagates effects of the selection throughout the user interface
        including initializing the date selection fields (with disabled dates).
     */
    handleSourceChange: function (field, sources) {
        var panel = field.up('panel');
        var store = Ext.StoreManager.get('metadata') || Ext.create('Flux.store.Metadata', {
            storeId: 'metadata'
        });
        var src = sources[0].get('_id');

        panel.getEl().mask('Loading...');

        store.load({
            params: {
                scenario: src
            },
            callback: Ext.Function.bind(function (recs, op, success) {
                var meta = recs.pop();

                Ext.Ajax.request({
                    url: Ext.String.format('/flux/api/scenarios/{0}/geometry.json', src),
                    callback: function () {
                        panel.getEl().unmask();
                    },
                    success: function (response) {
                        var geom = Ext.create('Flux.model.Geometry',
                            Ext.JSON.decode(response.responseText));
                        Ext.each(Ext.ComponentQuery.query('d3geopanel'), function (p) {
                            p.setGridGeometry(geom);
                        });
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
                    this.initializeDateFields(meta, panel);
                    this.initializeTimeFields(meta, panel);

                }

                // If any error/uncertainty data are available...
                if (meta.get('uncertainty')) {
                    // TODO Something about that...

                } else {
                    panel.down('checkbox[name=showUncertainty]').disable();
                }

                // Pretend the color palette just changed so as to acquire a scale
                this.getPaletteField().fireEventArgs('change', [
                    this.getPaletteField()
                ]);
                
            }, this)

        });

        // Tell the dispatch to use this scenario name in all requests
        this.getController('Dispatch').setRequestNamespace(src);

    },

    /**
        Initializes the Ext.form.field.DateField instances contained by the
        topNode provided (those that can be reached with topNode.down()).
        @param  metadata    {Flux.model.Metadata}
        @param  topNode     {Ext.Component}
     */
    initializeDateFields: function (metadata, topNode) {
        var dates = metadata.get('dates');
        var lastDate = Ext.Date.format(dates[dates.length - 1], 'Y-m-d');
        var targets = topNode.down('datefield');

        Ext.each(targets, function (target) {
            target.setDisabledDates(metadata.getInvalidDates());
            target.setMaxValue(lastDate);
            target.on('expand', function (f) {
                f.setValue(lastDate);
            });
            target.on('focus', function (f) {
                f.setValue(undefined);
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
        var targets = topNode.down('timefield');
        if (targets) {

            // For every Ext.form.field.Time found...
            Ext.each(targets, function (target) {
                topNode.cascade(function (cmp) {
                    var config = {
                        emptyText: 'Select time...',
                        format: 'H:i',
                        increment: (Ext.Array.min(metadata.get('steps')) / 60)
                    }; // Increment values are in minutes
                    var parent = cmp.ownerCt;

                    if (cmp.isXType('timefield')) {
                        if (parent === undefined) {
                            parent = cmp.findParentBy(function (container, cmp) {
                                if (cmp.name === 'time') {
                                    return container.isXType('sourcespanel');
                                } else {
                                    return container.isXType('fieldcontainer');
                                }
                            });
                        }

                        Ext.Object.merge(config, {
                            name: cmp.name,
                            index: Number(cmp.index),
                            disabled: cmp.isDisabled(),
                        });

                        // Replace the old instance with a new one
                        parent.remove(config.index, true); // And destroy it!
                        parent.insert(config.index,
                            Ext.create('Ext.form.field.Time', config));
                    }
                });
            });
        }
    },

    /**TODO
     */
    loadSourceData: function (field, value, last) {
        var values;

        if (!value || value === last) {
            return; // Ignore undefined, null, or unchanged values
        }

        values = field.up('panel').getForm().getValues();

        if (values.date && values.time && values.date !== '' && values.time !== '') {
            this.getController('Dispatch').loadMap({
                time: Ext.String.format('{0}T{1}:00', values.date, values.time)
            });
        }
    },

});




