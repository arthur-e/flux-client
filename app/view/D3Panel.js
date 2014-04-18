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
        Indicates that anomalies should be displayed instead of raw values.
        @private
     */
    _showAnomalies: false,

    /**
        Indicates that population statistics are being used in adjusting
        the color scale.
        @private
     */
    _usePopulationStats: true,

    /**
        Initializes the component.
     */
    initComponent: function () {
        this.addEvents(['beforedraw', 'draw', 'scalechange']);

        /**
            Indicates whether or not attribute transformations should be allowed
            to transition smoothly.
            @private
          */
        this._transitions = this.enableTransitions;

        this.callParent(arguments);
    },

    /**
        Returns the associated Flux.model.* instance.
        @return {Flux.model.*}
     */
    getModel: function () {
        return this._model;
    },

    /**
        Returns the stored reference to the Flux.model.Metadata used to drive
        this visualizations.
        @return {Flux.model.Metadata}
     */
    getMetadata: function () {
        return this._metadata;
    },

    /**
        Returns the timestamp currently associated with this view.
        @return {moment}
     */
    getMoment: function () {
        return this._moment;
    },

    /**
        Set the metadata; retains a reference to Flux.model.Metadata instance.
        @param  metadata    {Flux.model.Metadata}
        @return             {Flux.view.D3Panel}
        @return         {Flux.view.D3Panel}
     */
    setMetadata: function (metadata) {
        this._metadata = metadata;
        return this;
    },

    /**
        Toggles the display of anomalies in the data.
        @param  state       {Boolean}
        @param  tendency    {String}
        @return             {Flux.view.D3GeographicPanel}
     */
    toggleAnomalies: function (state, tendency) {
        this._showAnomalies = state;
        if (state) {
            // Rescale the data points subtracting the measure of central tendency
            this._addOffset = -this.getMetadata().get('stats')[tendency];
        }

        return this;
    },

    /**
        Toggles on/off whether to use (and expect to be bound to) population
        statistics. If population statistics are not used, this view will
        recalculated the summary statistics for its bound data every time
        updateColorScale() is called.
        @param  state       {Boolean}
        @param  metadata    {Flux.model.Metadata}
        @return         {Flux.view.D3Panel}
     */
    togglePopulationStats: function (state, metadata) {
        var m;

        if (Ext.isEmpty(this.getMetadata())) {
            return;
        }

        this._usePopulationStats = state;

        if (this._usePopulationStats && metadata) {
            this.setMetadata(metadata);
        }

        return this;
    },

    /**
        Allow or disallow transitions in attribute transformations.
        @param  state   {Boolean}
        @return         {Flux.view.D3Panel}
     */
    toggleTransitions: function (state) {
        this._transitions = state;
        return this;
    },

    /**
        Updates the color scale configuration of a specific view, as provided.
        Creates a new color scale based on changes in the scale configuration
        (measure of central tendency, number of standard deviations, or a switch
        between sequential and diverging palette types).
        @param  view    {Ext.Component}
        @param  opts    {Object}    Properties are palette configs e.g. sigmas, tendency, paletteType
        //TODO Could add a "_lastOptions" property to this view that stores
        //  the opts argument and makes it optional? That ways the view could
        //  call this method on its own
     */
    updateColorScale: function (opts) {
        var palette, scale;
        var metadata;

        if (!this.getMetadata()) {
            return;
        }

        if (!this._usePopulationStats && this.getModel()) {
            metadata = this.getMetadata().copy();
            metadata.set('stats', this.getModel().summarize());

            this.setMetadata(metadata);

        } else {
            metadata = this.getMetadata();
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
