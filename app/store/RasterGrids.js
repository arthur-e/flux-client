// The store where RasterGrid instances, grids for Raster instances, are stored.

Ext.define('Flux.store.RasterGrids', {
    extend: 'Flux.store.AbstractStore',
    autoLoad: false,
    model: 'Flux.model.RasterGrid',
    resource: 'grid.json'
});
