Ext.define('Flux.controller.UserExperience', {
    extend: 'Ext.app.Controller',

    requires: [
        'Ext.form.field.Display',
        'Ext.form.field.TextArea',
        'Ext.window.Window'
    ],

    refs: [{
        ref: 'sourcePanel',
        selector: 'sourcepanel'
    }, {
        ref: 'symbology',
        selector: 'symbology'
    }, {
        'ref': 'topToolbar',
        'selector': 'viewport toolbar'
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
            this.setStateFromParams(params);

//TODO Need to figure out how to automatically load data
//            if (params.hasOwnProperty('source') && params.hasOwnProperty('date')
//                    && params.hasOwnProperty('time')) {
//                Ext.onReady(Ext.bind(function () {
//                }, this));
//            }

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

            '#settings-menu menucheckitem': {
                checkchange: this.onStatsChange
            },
	    
	    '#settings-menu numberfield[name=tendencyCustomValue]': {
		change: this.onStatsChange
	    },

            'sourcepanel fieldset': {
                afterrender: this.initFieldsets
            },

            'viewport #content': {
                beforerender: this.initContent
            }

        });

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
        var names = Ext.Array.map(Ext.ComponentQuery.query('field[name]'), function (i) {
            return i.stateId || ((typeof i.getName === 'function') ? i.getName() : i.name);
        });

        names = names.concat(Ext.Array.map(this.getTopToolbar().query('field[name], menuitem[name]'), function (i) {
            return i.stateId || ((typeof i.getName === 'function') ? i.getName() : i.name);
        }));

        names = Ext.Array.map(names, function (name) {
            return (Ext.String.endsWith(name, '-inputEl')) ? undefined : name;
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
            Ext.merge(params, form.getValues());
        });

        return params;
    },

    /**
        Ensures that the Aggreation Fieldset is enabled if the
        "Statistics from..." setting is set to the "Current Data Frame" and
        the initial date/time fields have been filled out.
        @param  fieldset    {Ext.form.Fieldset}
     */
    initFieldsets: function (fieldset) {
        if (this.getSymbology().down('hiddenfield[name=statsFrom]').getValue() === 'data'
                && this.getSourcePanel().initialSelectionsMade()) {
            fieldset.enable();
        } else {
            fieldset.disable();
        }
    },

    /**
        Initializes the #content panel; determines which view(s) are drawn
        initially.
        @param  panel   {Ext.panel.Panel}   The #content panel
     */
    initContent: function (panel) {
        var opts = this.getUserSelections();

        if (opts.showLinePlot) {
            panel.add([{
                xtype: 'd3geomap',
                title: 'Single Map',
                anchor: '100% 80%',
                enableZoomControls: true,
                enableTransitions: true
            }, {
                xtype: 'd3lineplot',
                anchor: '100% 20%'
            }]);

        } else {
            panel.add([{
                xtype: 'd3geomap',
                title: 'Single Map',
                anchor: '100% 100%',
                enableZoomControls: true,
                enableTransitions: true
            }]);
        }
    },

    /**
        If checked, update all hidden "tendency" fields with the measure of
        central tendency chosen.
        @param  cb      {Ext.menu.MenuCheckItem}
        @param  checked {Boolean}
     */
    onStatsChange: function (cb, checked) {
        var targets;

        if (checked) {
	    if (cb.name === 'tendencyCustomValue') {
	      this.getSymbology().down('hiddenfield[name=tendency]').setValue(cb.value);
	    } else {
	      this.getSymbology().down(Ext.String.format('hiddenfield[name={0}]',
		  cb.group)).setValue(cb.name);

	      if (cb.name === 'population' || cb.name === 'data') {
		  targets = this.getSourcePanel().query('fieldset checkbox');

		  Ext.each(targets, Ext.Function.bind(function (target) {
		      if (cb.name === 'population') {
			  target.setValue(false);
		      }

		      // Enable the FieldSet only if the initial selections at
		      //  the top of the form have been made
		      target.up('fieldset').setDisabled(cb.name === 'population'
			  || !this.getSourcePanel().initialSelectionsMade());
		  }, this));
	      }
	   }
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
    },
    
     /**
        Sets UI state based on params object
        'params' can be either interpreted by fromQueryString or passed directly
        from the getUserSelections() method
        @param 	{Object}
     */    
    setStateFromParams: function (params) {
	Ext.Object.each(params, function (key, value) {
	    // Replace "true" or "false" (String) with Boolean
	    if (value === 'true' || value === 'false') {
		params[key] = value = (value === 'true');
	    }

	    // IMPORTANT: Makes sure that applyState() recalls the correct state
	    Ext.state.Manager.set(key, {value: value});

	    // Initialize global settings (Ext.menu.CheckItem instances)
	    if (Ext.Array.contains(['tendency', 'display', 'statsFrom'], key)) {
		Ext.onReady(function () {
		    var cmp = Ext.ComponentQuery.query(Ext.String.format('menucheckitem[name={0}]', value))[0];
		    if (cmp) {
			cmp.setChecked(true);
		    }
		});
	    }
	    
	    // If a custom central tendency is selected, enable the numberfield
	    // (it is disabled by default) and set the provided value
	    if (key === 'tendency' && ['mean','median'].indexOf(value) === -1) {
		Ext.onReady(function () {
		    var cmp = Ext.ComponentQuery.query('field[name=tendencyCustomValue]')[0];
		    cmp.setDisabled(false);
		    cmp.setValue(value);
		});
	    }
	});
    }

});


