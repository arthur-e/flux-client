Ext.define('Flux.controller.FormInteraction', {
    extend: 'Ext.app.Controller',

    requires: [
        'Ext.Array',
        'Flux.store.Metadata'
    ],

    init: function () {
        // Create a new state Provider if one doesn't already exist
        if (Ext.state.Manager.getProvider().path === undefined) {
            Ext.state.Manager.setProvider(Ext.create('Ext.state.CookieProvider'));
        }

        ////////////////////////////////////////////////////////////////////////
        // Event Listeners /////////////////////////////////////////////////////
        this.control({

            'sourcespanel combo[name=source]': {
                select: this.getMetadataForSource
            },

            'sourcespanel > field[name=date], field[name=time]': {
                change: this.getSourceData
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
    getMetadataForSource: function (field, sources) {
        var panel = field.up('panel');
        var store = Ext.StoreManager.get('metadata') || Ext.create('Flux.store.Metadata', {
            storeId: 'metadata'
        });

        panel.getEl().mask('Loading...');

        store.load({
            params: {
                scenario: sources[0].get('_id')
            },
            callback: Ext.Function.bind(function (recs, op, success) {
                var meta = recs.pop();

                panel.getEl().unmask();

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
                
            }, this)
        });
    },

    getSourceData: function (field, value) {
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
    }

});




