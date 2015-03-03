// Data model for a raster's grid--the coordinate index that describes the gridded layout for a gridded dataset. The unique `_id` matches that of the `Metadata`; it is the scenario name.

Ext.define('Flux.model.RasterGrid', {
    extend: 'Ext.data.Model',
    idProperty: '_id',

    fields: [
        '_id', {

        name: 'type',
        type: 'string'
    }, {
        name: 'coordinates',
        type: 'auto'
    }],

    // Returns the Array index of the provided latitude-longitude coordinates.
    //
    //     @param  coords  {Array}
    //     @return         {Number}

    getCoordIndex: function (coords) {
        var i = -1;
        var r;

        coords = Ext.Array.map(coords, Number);
        r = Ext.Array.findBy(this.get('coordinates'), function (c) {
            i += 1;
            return (c[0] === coords[0] && c[1] === coords[1]);
        });
        return (Ext.isEmpty(r)) ? -1 : i;
    }

});
