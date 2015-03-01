// The Store where all color Palette instances are stored.

Ext.define('Flux.store.Palettes', {
    extend: 'Ext.data.Store',
    model: 'Flux.model.Palette',
    storeId: 'palettes',

    requires: [
        'Flux.model.Palette'
    ]

});
