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

                    }
                }

                this.initializeDateFields(meta, panel);
                this.initializeTimeFields(meta, panel);
                
            }, this)
        });
    },

    /**
     */
    initializeDateFields: function (metadata, topNode) {
        // TODO Generalize this to disable the dates of the "Difference" date picker, too
        var dates = metadata.get('dates');
        var lastDate = Ext.Date.format(dates[dates.length - 1], 'Y-m-d');
        var target = topNode.down('field[name=date]');
        target.setDisabledDates(metadata.getInvalidDates());
        target.setMaxValue(lastDate);
        target.on('expand', function (f) {
            f.setValue(lastDate);
        });
        target.on('focus', function (f) {
            f.setValue(undefined);
        });
    },

    initializeTimeFields: function (metadata, topNode) {
        var target = topNode.down('field[name=time]');
        if (target) {
            topNode.updateTimeField(target, 2, {
                name: 'time',
                emptyText: 'Select time...',
                format: 'H:i',
                increment: (Ext.Array.min(metadata.get('intervals')) / 60)
            });
        }
    }

});




