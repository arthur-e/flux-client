Ext.define('Flux.controller.LinePlotController', {
    extend: 'Ext.app.Controller',

    requires: [
    ],

    refs: [{
        ref: 'map',
        selector: 'd3geomap'
    }],

    init: function () {
        // Create a new state Provider if one doesn't already exist
        if (Ext.state.Manager.getProvider().path === undefined) {
            Ext.state.Manager.setProvider(Ext.create('Ext.state.CookieProvider'));
        }

        ////////////////////////////////////////////////////////////////////////
        // Event Listeners /////////////////////////////////////////////////////

        this.control({

            'd3lineplot': {
                plotclick: this.onPlotClick,
                resize: this.onResize
            },

            'd3lineplot > component[autoEl]': {
                boxready: this.initialize
            }

        });
    },

    ////////////////////////////////////////////////////////////////////////////
    // Event Handlers //////////////////////////////////////////////////////////

    /**
        Begin D3 rendering.
        @param  cmp     {Ext.Component}
        @param  width   {Number}
        @param  height  {Number}
     */
    initialize: function (cmp, width, height) {
        cmp.up('d3lineplot').init(width, height);
    },

    /**TODO
     */
    onPlotClick: function (view, coords) {
        var t = moment.utc(view.scales.x.invert(coords[0]));
        var s;

        if (!Ext.isEmpty(view.getMetadata().get('steps'))) {
            s = view.getMetadata().get('steps');
        } else if (!Ext.isEmpty(view.getMetadata().get('spans'))) {
            //TODO
        }

        // Fix the "precision" of this timestamp
        t.milliseconds(0)
        t.seconds(0);
        if (s % 3600 === 0) {
            // Step/span on the order of hours...
            t.minutes(0);
            if (t.hours() % (s / 3600) !== 0) {
                t.hours(0)
            }
        }
        if (s % 86400 === 0) {
            // Step/span on the order of days...
            t.hours(0);
            if (t.days() % (s / 86400) !== 0) {
                t.hours(0)
            }
        }

        this.getController('UserInteraction').fetchMap(this.getMap(), {
            time: t.toISOString()
        });
    },

    /** TODO Combine with MapController.onResize() ?
        Handles changes in the size of the D3 drawing area by replacing the
        SVG element with a new instance.
        @param  view        {Flux.view.D3Panel}
        @param  width       {Number}        The resized width
        @param  height      {Number}        The resized height
        @param  oldWidth    {Number}        The original width
        @param  oldHeight   {Number}        The original height
     */
    onResize: function (view, width, height, oldWidth, oldHeight) {
        // oldWidth and oldHeight undefined when 'resize' event fires as part
        //  of the initial layout; we want to avoid acting on this firing
        if (oldWidth && oldHeight) {
            if (width !== oldWidth || height !== oldHeight) {
                // Update the projections ComboBox; rescale each projection contained
                view.init(width, height).redraw()
            }
        }
    },

});




