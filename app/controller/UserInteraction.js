Ext.define('Flux.controller.UserInteraction', {
    extend: 'Ext.app.Controller',

    refs: [{
        ref: 'contentPanel',
        selector: '#content'
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
            storeId: 'metadata'
        });

        Ext.create('Flux.store.Scenarios', {
            autoLoad: true,
            storeId: 'scenarios'
        });

        ////////////////////////////////////////////////////////////////////////
        // Event Listeners /////////////////////////////////////////////////////

        this.control({

            'sourcepanel combo[name=source]': {
                change: this.onSingleSourceChange
            },

            'sourcepanel #aggregation-fields': {
                afterrender: this.initAggregationFields
            }

        });
    },

    /**TODO
     */
    getMap: function () {
        var view;
        var viewQuery = Ext.ComponentQuery.query('d3geopanel');

        // Get the target view
        if (viewQuery.length === 0) {
            view = this.getContentPanel().add({
                xtype: 'd3geopanel',
                title: 'Single Map',
                anchor: '100% 100%'
            });
        } else {
            view = viewQuery[0];
        }

        return view;
    },

    ////////////////////////////////////////////////////////////////////////////
    // Event Handlers //////////////////////////////////////////////////////////

    bindMetadata: function (response) {
        console.log(response);//FIXME
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
        Called as a method of an Ext.container.Container instance. Propagates
        metadata response as a Flux.model.Metadata instance.
        @param  opts        {Object}
        @param  success     {Boolean}
        @param  response    {Object}
     */
    onMetadataLoad: function (opts, success, response) {
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

    /**TODO
     */
    onSingleSourceChange: function (field, source) {
        var view = this.getMap();

        Ext.Ajax.request({
            method: 'GET',

            url: '/flux/api/scenarios.json',

            params: {
                scenario: source
            },

            callback: Ext.Function.bind(this.onMetadataLoad,
                field.up('container')),

            success: this.bindMetadata,

            scope: view

        });
    },

});



