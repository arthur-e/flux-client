Ext.define('Flux.controller.LinePlotController', {
    extend: 'Ext.app.Controller',

    requires: [
    ],

    refs: [{
        ref: 'map',
        selector: 'd3geomap'
    }, {
        ref: 'topToolbar',
        selector: 'viewport toolbar'
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

    /**TODO fetchRaster()
        Handles a mouse click event on the plot area, effectively firing off
        a new map load request for the time represented by that point on the plot.
        @param  view    {D3LinePlot}
        @param  coords  {Array}
     */
    onPlotClick: function (view, coords) {
        var meta = view.getMetadata();
        //TODO var dates = meta.getAllDates();
        var t = moment.utc(view.scales.x.invert(coords[0]));

        // Find the nearest date actually in the dates Array
        var d = meta.getNearestDate(t);

        // Uncheck the "Show Aggregation" and "Show Difference" checkboxes
        this.getController('UserInteraction').uncheckAggregates();

        this.getController('UserInteraction').fetchRaster(this.getMap(), {
            time: d.toISOString()
        });
        
        // Show the "Reset" button
        this.getTopToolbar().down('button[itemId=reset-btn]').show();
        
    },

    /**
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
                view.init(width, height).redraw();
            }
        }
    }

});




