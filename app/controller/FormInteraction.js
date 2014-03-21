Ext.define('Flux.controller.FormInteraction', {
    extend: 'Ext.app.Controller',

    requires: [
        'Ext.Array'
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

            //'sourcespanel > field[name=date], field[name=time]'

        });
    },

    ////////////////////////////////////////////////////////////////////////////
    // Event Handlers //////////////////////////////////////////////////////////

    /**
        Fetches the metadata for a selected dataset/source (scenario name);
        propagates effects of the selection throughout the user interface
        including initializing the date selection fields (with disabled dates).
     */
    getMetadataForSource: function (field, source) {
        var panel = field.up('panel');
        var store = Ext.StoreManager.get('metadata') || Ext.create('Flux.store.Metadata', {
            storeId: 'metadata'
        });

        panel.getEl().mask('Loading...');

        store.load({
            callback: Ext.Function.bind(function (recs) {
                var meta = recs.pop();

                panel.getEl().unmask();

                // If the data represent ranges of times, evaluate what kind of
                //  DateField is needed
                if (meta.get('ranges') != undefined) {
                    if (Ext.Array.every(meta.get('ranges'), function (rng) {
                        return (/^\d*[Dd]$/.test(rng)); // Some number of days...
                    })) {
                        // Need to support multi-day ranges...

                    } else if (Ext.Array.every(meta.get('ranges'), function (rng) {
                        return (/^\d*[Mm]$/.test(rng)); // Some number of months...
                    })) {
                        // Need to support multi-month ranges...

                    } else {
                        // Provide some kind of generic date/time accessor...
                    }

                } else { // Assume intervals are specified instead
                    this.initializeDateFields(meta, panel);
                    this.initializeTimeFields(meta, panel);

                }
                
            }, this)
        });
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
                        increment: (Ext.Array.min(metadata.get('intervals')) / 60)
                    };
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




