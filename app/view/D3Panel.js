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
        this.addEvents(['beforedraw', 'draw', 'plotclick', 'scalechange']);

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
        Returns the stored reference to the Flux.model.Metadata used for an
        Overlay layer
        @return {Flux.model.Metadata}
     */
    getMetadataOverlay: function () {
        return this._metadataOverlay;
    },
    /**
        Returns the timestamp currently associated with this view.
        @return {moment}
     */
    getMoment: function () {
        if (!this._model) {
            return;
        }
        return this._model.get('timestamp');
    },

    /**
        Returns the timestamp currently associated with the differenced map
        @return {moment}
     */
    getMomentOfDifference: function () {
        return this._model.get('properties').timestamp_diff;
    },

    /**
        Returns the appropriate offset for the selected central tendency.
        Needed for displaying anomalies data.

        @return {Number}
    */
    getTendencyOffset: function() {
        var offset;
        
        if (['mean','median'].indexOf(this._tendency) > -1) {
            offset = this.getMetadata().getSummaryStats()[this._tendency];
        } else {
            offset = parseFloat(this._tendency);
        }
        
        return offset;

    },
    
    /**
        Set the metadata; retains a reference to Flux.model.Metadata instance.
        @param  metadata    {Flux.model.Metadata}
        @return             {Flux.view.D3Panel}
        @return             {Flux.view.D3Panel}
     */
    setMetadata: function (metadata) {
        this._metadata = metadata;
        return this;
    },

    /**
        Set the metadata; retains a reference to Flux.model.Metadata instance.
        @param  metadata    {Flux.model.Metadata}
        @return             {Flux.view.D3Panel}
        @return             {Flux.view.D3Panel}
     */
    setMetadataOverlay: function (metadata) {
        this._metadataOverlay = metadata;
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
        this._tendency = tendency;
        return this;
    },

    /**
        Toggles on/off whether to use (and expect to be bound to) population
        statistics. If population statistics are not used, this view will
        recalculated the summary statistics for its bound data every time
        updateColorScale() is called.
        @param  state       {Boolean}
        @param  metadata    {Flux.model.Metadata}
        @return             {Flux.view.D3Panel}
     */
    togglePopulationStats: function (state, metadata, isOverlay) {
        if ((!isOverlay && Ext.isEmpty(this.getMetadata())) ||
            (isOverlay && Ext.isEmpty(this.getMetadataOverlay()))) {
            return;
        }

        this._usePopulationStats = state;

        if (metadata) {
            if (!isOverlay) {
                this.setMetadata(metadata);
            } else {
                this.setMetadataOverlay(metadata);
            }
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
