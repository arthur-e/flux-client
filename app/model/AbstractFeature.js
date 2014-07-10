Ext.define('Flux.model.AbstractFeature', {
    extend: 'Ext.data.Model',

    requires: [
        'Ext.data.Types',
        'Flux.type.Moment'
    ],

    idProperty: '_id',

    /**
        Returns a formatted timestamp that most accurately represents the time
        or span of time of the data.
        @param  fmt {String}    A moment.js format string
        @return     {String}
     */
    getTimestampDisplay: function (fmt) {
        var d0, d1, ts;
        var p = this.get('properties');

        if (this.get('timestamp')) {
            return this.get('timestamp').format(fmt);
        }

        // Infer timestamp range
        if (p) { // From the properties
            if (p.start && p.end) {
                d0 = moment.utc(p.start).format(fmt);
                d1 = moment.utc(p.end).format(fmt);
            }

        } else { // From the data points (non-gridded)
            ts = Ext.Array.pluck(this.get('features'), 'timestamp');
            d0 = moment.utc(Ext.Array.min(ts)).format(fmt);
            d1 = moment.utc(Ext.Array.max(ts)).format(fmt);
        }

        // Template for a timestamp range display
        return Ext.String.format('{0} >>> {1}', d0, d1);
    },

    /**
        Returns an object which can be used to calculate statistics on the
        the passed numeric Array.
        @param  arr {Array}
        @return     {Stats}
     */
    Stats: function (arr) {
        arr = Ext.Array.clean(arr || []);

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
    }

});