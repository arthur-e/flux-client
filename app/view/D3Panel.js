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
        @return             {Flux.view.D3Panel}
     */
    toggleAnomalies: function (state, tendency) {
        this._showAnomalies = state;
        if (state && this.getMetadata()) {
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
    }

});
