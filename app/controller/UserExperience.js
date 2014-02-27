Ext.define('Flux.controller.UserExperience', {
    extend: 'Ext.app.Controller',

    requires: [
        'Ext.Array',
        'Ext.Object'
    ],

    init: function () {
        // Create a new state Provider if one doesn't already exist
        if (Ext.state.Manager.getProvider().path === undefined) {
            Ext.state.Manager.setProvider(Ext.create('Ext.state.CookieProvider'));
        }

        foo = this;//FIXME
        this.control({
            '#clear-local-state': {
                click: this.clearLocalState
            }
        });
    },

    /**TODO
     */
    initialize: function () {
    },

    /**
        Wipes out all state information stored on the client's web browser.
     */
    clearLocalState: function () {
        Ext.Array.each(Ext.Object.getKeys(this.getUserSelections()), function (key) {
            Ext.state.Manager.clear(key);
        });
    },

    getFieldNames: function () {
        var query = Ext.ComponentQuery.query('form');
        var names = [];

        Ext.Array.each(query, function (form) {
            names.concat(Ext.Array.map(form.getFields(), function (field) {
                return field.getName();
            }));
        });

        return names;
    },

    /**
        Returns an HTTP GET query string encapsulating all the selections made
        by a user.
        @return {String}
     */
    getStateHash: function () {
        return Ext.Object.toQueryString(this.getUserSelections());
    },

    /**
        Returns an Object encapsulating all the selections made by a user.
        @return {Object}
     */
    getUserSelections: function () {
        var query = Ext.ComponentQuery.query('form');
        var params = {};

        Ext.Array.each(query, function (form) {
            Ext.Object.merge(params, form.getValues());
        });

        return params;
    }

});


