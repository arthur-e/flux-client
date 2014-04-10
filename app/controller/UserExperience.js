Ext.define('Flux.controller.UserExperience', {
    extend: 'Ext.app.Controller',

    requires: [
        'Ext.form.field.Display',
        'Ext.form.field.TextArea',
        'Ext.window.Window'
    ],

    refs: [{
        ref: 'symbology',
        selector: 'symbology'
    }, {
        ref: 'topToolbar',
        selector: 'viewport toolbar'
    }],

    init: function () {
        var params = window.location.href.split('?'); // Get the HTTP GET query parameters, if any

        // Create a new state Provider if one doesn't already exist
        if (Ext.state.Manager.getProvider().path === undefined) {
            Ext.state.Manager.setProvider(Ext.create('Ext.state.CookieProvider'));
        }

        // If HTTP GET query parameters were specified, use them to set the
        //  application state
        if (params.length > 1) {
            params = Ext.Object.fromQueryString(params.pop());

            Ext.Object.each(params, function (key, value) {
                // Replace "true" or "false" (String) with Boolean
                if (value === 'true' || value === 'false') {
                    params[key] = value = (value === 'true');
                }

                // IMPORTANT: Makes sure that applyState() recalls the correct state
                Ext.state.Manager.set(key, {value: value})
                //console.log(key);//FIXME
            });

            Ext.Object.merge(this.defaultState, params);
        }

        ////////////////////////////////////////////////////////////////////////
        // Event Listeners /////////////////////////////////////////////////////

        this.control({

            '#clear-local-state': {
                click: this.clearLocalState
            },

            '#get-share-link': {
                click: this.displaySharingLink
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
        animateDelay: 1
    },

    ////////////////////////////////////////////////////////////////////////////
    // Event Handlers //////////////////////////////////////////////////////////

    /**
        Wipes out all state information stored on the client's web browser.
     */
    clearLocalState: function () {
        Ext.each(this.getFieldNames(), function (key) {
            Ext.state.Manager.clear(key);
        });
    },

    /**
        Displays a pop-up utility that has a link (URI) that can be used to
        load the application with the user's current state and data view.
     */
    displaySharingLink: function () {
        var w = Ext.create('Ext.window.Window', {
            modal: true,
            width: 400,
            height: 300,
            bodyPadding: '5 10 0 10',
            layout: 'form',
            title: 'Share the Current View',
            buttons: [{
                text: 'OK',
                handler: function () {
                    this.up('window').close();
                }
            }],
            items: [{
                xtype: 'displayfield',
                labelWidth: '100%',
                labelSeparator: '',
                fieldLabel: "Use this link to restore the application to the way it looks right now. Share this link with someone else so they can see exactly what you're seeing."
            }, {
                xtype: 'textarea',
                height: 150,
                readOnly: true,
                fieldStyle: 'font-family:monospace;',
                value: Ext.String.format('{0}?{1}', window.location.href,
                    this.getStateHash())
            }]
        });

        w.show();
    },

    /**
        Returns an Array of all the field names in the application.
        @return {Array}
     */
    getFieldNames: function () {
        var names = Ext.Array.map(Ext.ComponentQuery.query('field[name]'), function (c) {
            return (Ext.String.endsWith(c.getName(), '-inputEl')) ? undefined : c.getName(); 
        });

        return Ext.Array.clean(names);
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

        Ext.each(query, function (form) {
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
        Ext.each(Ext.ComponentQuery.query('#settings-menu menucheckitem'),
            Ext.Function.bind(function (it) {
                if (it.stateId) {
                    it.setChecked(Ext.state.Manager.get(it.stateId,
                        this.defaultState[it.stateId]));

                    it.on('checkchange', this.onTendencyChange, this);
                }
        }, this));

        if (Ext.state.Manager.get('animateDelay', undefined)) {
            this.getTopToolbar().down('#animate-delay')
                .setValue(Ext.state.Manager.get('animateDelay').value);
        }

        // For some reason, the hiddenfield gets reset after setting the value
        //  at this point in the execution (it also saves it state even when
        //  'stateful' is set to false). SO, we have to set a late event
        //  listener to set this field to the correct value after it is rendered.
        if (Ext.state.Manager.get('tendencyMean', undefined) !== undefined) {
            this.getSymbology().down('hiddenfield[name=tendency]').on('afterrender', function () {
                this.setValue((Ext.state.Manager.get('tendencyMean')) ? 'mean' : 'median');
            });
        }

    },

    /**
        If checked, update all hidden "tendency" fields with the measure of
        central tendency chosen.
        @param  cb      {Ext.menu.MenuCheckItem}
        @param  checked {Boolean}
     */
    onTendencyChange: function (cb, checked, eOpts) {
        if (checked) {
            this.getSymbology().down('hiddenfield[name=tendency]').setValue(cb.name);
            this.getController('Dispatch').onGlobalTendencyChange(cb);
        }

        this.saveFieldState(cb, checked);
    },

    /**
        Saves state for a given field that cannot otherwise save its own state
        (usually because it lacks a setter/getter method).
        @param  field   {Ext.form.Field}
        @param  value   {Object|Number|String}
     */
    saveFieldState: function (field, value) {
        Ext.state.Manager.set(field.stateId, value);
    }

});


