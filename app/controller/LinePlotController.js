Ext.define('Flux.controller.LinePlotController', {
    extend: 'Ext.app.Controller',

    requires: [
    ],

    init: function () {
        // Create a new state Provider if one doesn't already exist
        if (Ext.state.Manager.getProvider().path === undefined) {
            Ext.state.Manager.setProvider(Ext.create('Ext.state.CookieProvider'));
        }

        ////////////////////////////////////////////////////////////////////////
        // Event Listeners /////////////////////////////////////////////////////

        this.control({

            'd3lineplot': {
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




