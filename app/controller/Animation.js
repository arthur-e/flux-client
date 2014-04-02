Ext.define('Flux.controller.Animation', {
    extend: 'Ext.app.Controller',

    refs: [{
        'ref': 'topToolbar',
        'selector': 'viewport toolbar'
    }],

    requires: [
        'Ext.data.ArrayStore',
        'Ext.form.field.ComboBox',
        'Ext.form.field.Number',
        'Ext.resizer.Splitter',
        'Ext.window.Window',
        'Flux.model.Geometry',
        'Flux.store.Metadata'
    ],

    init: function () {
        // Create a new state Provider if one doesn't already exist
        if (Ext.state.Manager.getProvider().path === undefined) {
            Ext.state.Manager.setProvider(Ext.create('Ext.state.CookieProvider'));
        }

        this.defaults = {
            steps: 1
        };

        ////////////////////////////////////////////////////////////////////////
        // Event Listeners /////////////////////////////////////////////////////

        this.control({

            '#animation-settings-btn': {
                click: this.launchAnimationSettings
            }

        });
    },

    ////////////////////////////////////////////////////////////////////////////
    // Event Handlers //////////////////////////////////////////////////////////

    /**TODO
     */
    enableAnimation: function (metadata) {
        var step, steps, stepSize;
        this._metadata = metadata;

        step = metadata.get('steps')[0];
        if (step / 86400 < 1) { // Less than 1 day (86400 seconds)?
            stepSize = Ext.Date.HOUR;
            steps = Math.floor(step / 3600);
        } else {
            stepSize = Ext.Date.DAY
            steps = Math.floor(step / 86400);
        }

        this.defaults = Ext.Object.merge(this.defaults, {
            steps: steps,
            stepSize: stepSize
        });

        this.getTopToolbar().down('#animate-btn').enable();
        this.getTopToolbar().down('#animation-settings-btn').enable();
    },

    /**TODO
     */
    launchAnimationSettings: function () {
        var c, d, n, metadata, steps, numSteps;
        var w = Ext.create('Ext.window.Window', {
            title: 'Animation Settings',
            layout: 'form',
            width: 400,
            bodyPadding: '3px 10px 10px 10px',
            items: [{
                xtype: 'fieldcontainer',
                layout: 'hbox',
                fieldLabel: 'Steps each animation frame',
                labelAlign: 'top',
                items: [{
                    xtype: 'numberfield',
                    name: 'steps',
                    width: 80,
                    value: 1,
                    minValue: 1,
                    maxValue: 31
                }, {
                    xtype: 'splitter',
                }, {
                    xtype: 'combo',
                    name: 'stepSize',
                    queryMode: 'local',
                    valueField: 'stepSize',
                    flex: 1
                }]
            }]
        });

        c = w.down('combo');
        n = w.down('numberfield');

        if (this._metadata) {
            steps = this._metadata.get('steps');

            // TODO Currently only checks step data, not span data
            if (steps.length === 1) { // Step size is...
                if (steps[0] / 86400 <= 1) { // Less than/equal to 1 day
                    d = [
                        [Ext.Date.HOUR, 'hour(s)'],
                        [Ext.Date.DAY, 'day(s)']
                    ];
                    numSteps = Math.floor(steps[0] / 3600);
                } else if (steps[0] / 2678400 < 1) { // Less than 1 month
                    d = [
                        [Ext.Date.DAY, 'day(s)']
                    ];
                    numSteps = Math.floor(steps[0] / 86400);
                } else {
                    d = [
                        [Ext.Date.DAY, 'day(s)'],
                        [Ext.Date.MONTH, 'month(s)']
                    ];
                    numSteps = Math.floor(steps[0] / 86400);
                }
            } else {
                d = [[steps[0], 'steps']];
            }

            c.setDisabled(!(steps.length === 1));
        } else {
            d = [[0, 'steps']];
            numSteps = 1;
            c.disable();
        }

        // Create and bind a new store to hold the appropriate step sizes
        c.bindStore(Ext.create('Ext.data.ArrayStore', {
            fields: ['stepSize', 'text'],
            data: d
        }));

        // Apply these default settings to the UI and remember them
        c.setValue(d[0][0]);
        n.setValue(numSteps);
        this.defaults.steps = numSteps;
        this.defaults.stepSize = d[0][0];

        // Listen for changes in the step sizes or number of steps
        c.on('select', Ext.Function.bind(function (c, recs) {
            this.defaults.stepSize = recs[0].get('stepSize');
        }, this));

        // Listen for changes in the step sizes or number of steps
        n.on('change', Ext.Function.bind(function (n, v) {
            this.defaults.steps = v;
        }, this));

        w.show();
    }

});




