Ext.define('Flux.store.UserPreferences', {
    extend: 'Ext.data.Store',
    model: 'Flux.model.UserPreference',
    autoLoad: false,

    getMergedAttributes: function () {
        var prefs = {};

        // Check that the user preference is stored and, if so, that it has a certain value
        Ext.Array.each(this.data.items, function (item) {
            // Transform the object into {property: value}
            if (item) {
                prefs[item.get('property')] = item.get('value');
            }
        });

        return prefs;
    }
});

