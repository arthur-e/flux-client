// Data model for gridded (raster) datasets.

Ext.define('Flux.model.Raster', {
    extend: 'Flux.model.AbstractFeature',

    fields: ['_id', {
        name: 'timestamp',
        type: Ext.data.Types.Moment
    }, {
        name: 'features',
        type: 'auto'
    }, {
        name: 'features_raw',
        type: 'auto'
    }, {
        name: 'properties',
        type: 'auto'
    }, {
        name: 'offset',
        type: 'auto'
    }, {
        name: 'source',
        type: 'auto'
    }],

    // Summarizes the values of a given Array.
    //
    //     @param  data    {Array}
    //     @return         {Object}

    summarize: function () {
        var data = this.get('features_raw');
        var s = this.Stats(data);
        return {
            min: Ext.Array.min(Ext.Array.clean(data)),
            max: Ext.Array.max(data),
            mean: s.mean(),
            std: s.stdDev(),
            median: s.median()
        };
    }

});
