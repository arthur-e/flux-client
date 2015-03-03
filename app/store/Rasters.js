// The Store where all Raster instances are stored.

Ext.define('Flux.store.Rasters', {
    extend: 'Flux.store.AbstractStore',
    autoLoad: false,
    model: 'Flux.model.Raster',
    resource: 'xy.json'
});
