Ext.define('Flux.model.Grid', {
    extend: 'Ext.data.Model',

    requires: [
        'Ext.data.Types',
        'Flux.type.Moment'
    ],

    idProperty: '_id',

    fields: ['_id', {
        name: 'timestamp',
        type: Ext.data.Types.Moment
    }, {
        name: 'features',
        type: 'auto'
    }, {
        name: 'properties',
        type: 'auto'
    }],

    /**
        Returns a formatted timestamp that most accurately represents the time
        or span of time of the data.
        @param  fmt {String}    A moment.js format string
        @return     {String}
     */
    getTimestampDisplay: function (fmt) {
        var d0, d1;
        var props = this.get('properties');
        if (props) {
            if (props.start && props.end) {
                d0 = moment.utc(props.start).format(fmt);
                d1 = moment.utc(props.end).format(fmt);
                return Ext.String.format('{0} >>> {1}', d0, d1);
            }
        }

        return this.get('timestamp').format(fmt);
    },

    /**
        Returns an object which can be used to calculate statistics on the
        the passed numeric Array.
        @param  arr {Array}
        @return {Stats}
     */
    Stats: function (arr) {
        arr = arr || [];

        this.arithmeticMean = function () {
            var i, sum = 0;
     
            for (i = 0; i < arr.length; i += 1) {
                sum += arr[i];
            }
     
            return sum / arr.length;
        };
     
        this.mean = this.arithmeticMean;
     
        this.stdDev = function () {
            var mean, i, sum = 0;
     
            mean = this.arithmeticMean();
            for (i = 0; i < arr.length; i += 1) {
                sum += Math.pow(arr[i] - mean, 2);
            }
     
            return Math.pow(sum / arr.length, 0.5);
        };
     
        this.median = function () {
            var middleValueId = Math.floor(arr.length / 2);
     
            return arr.slice().sort(function (a, b) {
                return a - b;
            })[middleValueId];
        };
     
        return this;
    },

    /**
        Summarizes the values of a given Array.
        @param  data    {Array}
        @return         {Object}
     */
    summarize: function () {
        var data = this.get('features');
        var s = this.Stats(data);
        return {
            min: Ext.Array.min(data),
            max: Ext.Array.max(data),
            mean: s.mean(),
            std: s.stdDev(),
            median: s.median()
        };
    }

});
