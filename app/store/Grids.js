Ext.define('Flux.store.Grids', {
    extend: 'Flux.store.AbstractStore',
    autoLoad: false,
    model: 'Flux.model.Grid',
    resource: 'xy.json',

    /**TODO
     */
    fetch: function (operation, finder) {
        var f;

        if (typeof finder === 'function') {
            f = this.findBy(finder);
        } else {
            f = this.find('timestamp', operation.params.time);
        }

        if (f !== -1) {
            operation.callback.call(operation.scope || this);
            return f;
        }

        this.load(operation);
    }
});
