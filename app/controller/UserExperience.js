Ext.define('Flux.controller.UserExperience', {
    extend: 'Ext.app.Controller',

    requires: [
        'Ext.Object'
    ],

    init: function () {
        // Create a new state Provider if one doesn't already exist
        if (Ext.state.Manager.getProvider().path === undefined) {
            Ext.state.Manager.setProvider(Ext.create('Ext.state.CookieProvider'));
        }

        foo = this;//FIXME
        this.control({
        });
    },

    /**TODO
     */
    initialize: function () {
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


