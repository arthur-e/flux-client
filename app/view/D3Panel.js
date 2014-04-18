Ext.define('Flux.view.D3Panel', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.d3panel',
    requires: [
        'Ext.Component',
        'Ext.layout.container.Fit',
        'Ext.toolbar.Item',
        'Ext.toolbar.Toolbar'
    ],

    layout: {
        type: 'fit'
    },

    items: {
        xtype: 'component',
        autoEl: {
            tag: 'div'
        }
    },

    bodyStyle: {
        backgroundColor: '#aaa'
    },

    /**
        Updates the color scale configuration of a specific view, as provided.
        Creates a new color scale based on changes in the scale configuration
        (measure of central tendency, number of standard deviations, or a switch
        between sequential and diverging palette types).
        @param  view    {Ext.Component}
        @param  opts    {Object}    Properties are palette configs e.g. sigmas, tendency, paletteType
     */
    updateColorScale: function (opts) {
        var palette, scale;
        var metadata = this.getMetadata();

        if (!metadata) {
            return;
        }

        // Get the color palette
        palette = Ext.StoreManager.get('palettes').getById(opts.palette);

        if (opts.threshold) {
            scale = metadata.getThresholdScale(opts.thresholdValues, palette.get('colors')[0]);
        } else {
            scale = metadata.getQuantileScale(opts).range(palette.get('colors'));
        }

        this.setScale(scale);
    },

});
