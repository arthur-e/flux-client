Ext.define('Flux.controller.UserInteraction', {
    extend: 'Ext.app.Controller',

    refs: [{
        ref: 'contentPanel',
        selector: '#content'
    }, {
        ref: 'sourceCarousel',
        selector: 'sourcecarousel',
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

            '#view-menu': {
                click: this.onViewChange
            },

            'combo[name=source]': {
                change: this.onSourceChange
            },

            'sourcepanel #aggregation-fields': {
                afterrender: this.initAggregationFields
            },

            'sourcesgridpanel': {
                beforeedit: this.onSourceGridEntry,
                canceledit: this.onSourceGridCancel,
                edit: this.onSourceGridEdit
            }

        });
    },

    /**TODO
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
            if (n < 4) {
                anchor = '50% 50%';
                j = 2;
            } else {
                anchor = '33% 33%';
                j = 3;
            }
        }

        Ext.each(query, function (item, i) {
            item.anchor = anchor;
            container.doLayout();

            // Align those odd-indexed (towards-the-right) panels
            if (i !== 0) {
                if (i % j !== 0) {
                    item.alignTo(query[i - 1].getEl(), 'tr');
                } else {
                    item.alignTo(query[i - j].getEl(), 'tl-bl');
                }
            }
        });

        view = container.add({
            xtype: 'd3geopanel',
            title: title,
            anchor: anchor
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
                view.alignTo(query[query.length - 1].getEl(), 'tr');
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

    /**TODO
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
            cls: 'zoom',
            enableZoom: true
        });
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
    onSourceChange: function (field, source, last) {
        var container;
        var editor = field.up('roweditor');
        var view;

        if (Ext.isEmpty(source) || source === last) {
            return;
        }

        if (editor) {
            container = editor;
            view = editor.editingPlugin.getCmp().getView().getSelectionModel()
                .getSelection()[0].get('view');

        } else {
            container = field.up('container');
            view = this.getMap();
        }

        Ext.Ajax.request({
            method: 'GET',

            url: '/flux/api/scenarios.json',

            params: {
                scenario: source
            },

            callback: Ext.Function.bind(this.onMetadataLoad, container),

            success: this.bindMetadata,

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
        //TODO Need to resize maps after one is removed
    },

    /**
        When the user completes an edit on a new row in the RowEditor...
        @param  editor  {Ext.grid.plugin.Editing}
        @param  context {Object}
     */
    onSourceGridEdit: function (editor, context) {
        var rec = context.record;
        var view = rec.get('view');

        view.setTitle(Ext.String.format('{0} at {1}',
            moment(rec.get('date')).format('YYYY-MM-DD'), rec.get('time')));
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

    /**TODO
     */
    onViewChange: function (menu, item) {
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

        this._activeViewId = item.getItemId();
    }
});



