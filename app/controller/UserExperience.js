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

        ////////////////////////////////////////////////////////////////////////
        // Event Listeners /////////////////////////////////////////////////////

        this.control({

            '#clear-local-state': {
                click: this.clearLocalState
            },

            '#settings-menu menucheckitem[name=tendency]': {
                checkchange: this.saveFieldState
            },

            '#top-toolbar': {
                afterrender: this.initGlobalState
            }

        });
    },

    /**
        The default settings for global controls. These should match the
        settings on the components (with these keys as their `name` or 
        `stateId` attributes, which should be the same) i.e. the value of the
        `value` or `checked` attributes; currently this is ONLY needed for the
        CheckItem instances in the Settings menu.
     */
    defaultState: {
        tendencyMean: true,
        tendencyMedian: false
    },

    ////////////////////////////////////////////////////////////////////////////
    // Event Handlers //////////////////////////////////////////////////////////

    /**
        Wipes out all state information stored on the client's web browser.
     */
    clearLocalState: function () {
        Ext.Array.each(this.getFieldNames(), function (key) {
            Ext.state.Manager.clear(key);
        });
    },

    /**
        Returns an Array of all the field names in the application.
        @return {Array}
     */
    getFieldNames: function () {
        var query = Ext.ComponentQuery.query('form');
        var names = [];

        Ext.Array.each(query, function (form) {
            names = names.concat(form.getForm().getFields().collect('name'));
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
    },

    /**
        Applies saved state to global components and fields that cannot be
        applied, for various reasons (usually because they lack setters/getters,
        through their individual applyState() methods.
     */
    initGlobalState: function () {
        Ext.each(Ext.ComponentQuery.query('#settings-menu menucheckitem[name=tendency]'),
            Ext.Function.bind(function (it) {
                it.setChecked(Ext.state.Manager.get(it.stateId,
                    this.defaultState[it.stateId]));
        }, this));
    },

    /**
        Saves state for a given field that cannot otherwise save its own state
        (usually because it lacks a setter/getter method).
     */
    saveFieldState: function (field, value) {
        Ext.state.Manager.set(field.stateId, value);
    }

});


