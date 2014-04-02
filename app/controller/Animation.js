Ext.define('Flux.controller.Animation', {
    extend: 'Ext.app.Controller',

    refs: [{
        'ref': 'animationSettings',
        'selector': '#anim-settings-menu'
    }, {
        'ref': 'sourcesPanel',
        'selector': 'sourcespanel'
    }, {
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

        ////////////////////////////////////////////////////////////////////////
        // Event Listeners /////////////////////////////////////////////////////

        this.control({

            '#anim-settings-menu combo': {
                select: this.onStepSizeChange
            },

            '#backward-btn': {
                click: this.onStepButton
            },

            '#forward-btn': {
                click: this.onStepButton
            }

        });
    },

    calcStepOrSize: function (s0, stepSize) {
        if (stepSize) {
            switch (stepSize) {
                case Ext.Date.MONTH:
                steps = s0 / 2678400;
                break;

                case Ext.Date.DAY:
                steps = s0 / 86400;
                break;

                default:
                steps = s0 / 3600; // Ext.Date.HOUR
            }

            return Math.floor(steps);
        }

        if (s0 / 86400 < 1) { // Less than 1 day (86400 seconds)?
            return Ext.Date.HOUR;
        } else if (s0 / 2678400 < 1) { // Less than 1 month?
            return Ext.Date.DAY;
        } else {
            return Ext.Date.MONTH;
        }
    },

    ////////////////////////////////////////////////////////////////////////////
    // Event Handlers //////////////////////////////////////////////////////////

    /**TODO
     */
    enableAnimation: function (metadata) {
        var c, d, s0, steps, stepSize;
        this._metadata = metadata;

        // Figure out the default size of step (e.g. an hour) and the number of
        //  steps to take in each frame
        s0 = metadata.get('steps')[0];
        stepSize = this.calcStepOrSize(s0);
        steps = this.calcStepOrSize(s0, stepSize);

        // Enable all the toolbar buttons related to animation
        Ext.each(this.getTopToolbar().query('button[cls=anim-btn]'), function (btn) {
            btn.enable();
        });

        // Configure the Animation Settings ////////////////////////////////////
        this.updateStepSelector(steps);

        c = this.getAnimationSettings().down('combo');
        if (metadata.get('steps').length > 1) {
            d = [[s0, 'steps']];
            c.disable();
        } else {
            switch (stepSize) {
                case Ext.Date.DAY:
                d = [
                    [Ext.Date.DAY, 'day(s)']
                ];
                break;

                case Ext.Date.MONTH:
                d = [
                    [Ext.Date.DAY, 'day(s)'],
                    [Ext.Date.MONTH, 'month(s)']
                ];
                break;

                default:
                d = [
                    [Ext.Date.HOUR, 'hour(s)'],
                    [Ext.Date.DAY, 'day(s)']
                ];
            }
        }

        // Create and bind a new store to hold the appropriate step sizes
        c.bindStore(Ext.create('Ext.data.ArrayStore', {
            fields: ['stepSize', 'text'],
            data: d
        }));

        // Apply the default settings to the UI
        c.setValue(stepSize);

        this._steps = steps;
        this._stepSize = stepSize;
    },

    /**
     */
    getTimestamp: function () {
        return this._timestamp;
    },

    /**TODO
     */
    onStepButton: function (btn) {
        switch (btn.getItemId()) {
            case 'backward-btn':
            this.stepBy(this._steps * -1);
            break;

            default:
            this.stepBy(this._steps);
        }
    },

    /**TODO
     */
    onStepSizeChange: function (cmp, recs) {
        var steps;

        this._stepSize = recs[0].get('stepSize');
        steps = this.calcStepOrSize(this._metadata.get('steps')[0],
            recs[0].get('stepSize'));

        this.updateStepSelector((steps === 0) ? 1 : steps);
    },

    /**TODO
     */
    onStepsChange: function (cmp, value) {
        this._steps = value;
    },

    /**TODO
     */
    setTimestamp: function (timestamp) {
        this._timestamp = timestamp;
    },

    /**TODO
     */
    stepBy: function (steps) {
        this._timestamp = Ext.Date.add(this._timestamp, this._stepSize, steps);
        this.getController('Dispatch').loadMap({
            time: Ext.Date.format(this._timestamp, 'c')
        });
    },

    /**TODO
     */
    updateStepSelector: function (steps) {
        var menu = this.getAnimationSettings();
        if (menu.query('numberfield').length !== 0) {
            menu.remove('steps');
        }
        menu.insert(1, Ext.create('Ext.form.field.Number', {
            xtype: 'numberfield',
            itemId: 'steps',
            value: steps,
            minValue: steps,
            step: steps,
            listeners: {
                change: Ext.Function.bind(this.onStepsChange, this)
            }
        }));
    }

});




