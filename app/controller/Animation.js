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

            '#animate-btn': {
                toggle: this.toggleAnimation
            },

            '#animate-delay': {
                dragend: this.onDelayChange
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
    animate: function (state, delay) {
        if (!this._timestamp) {
            return;
        }

        if (state) {
            this._animation = window.setInterval(Ext.Function.bind(this.stepBy,
                this, [this._steps]), delay * 1000); // Delay in milliseconds
        } else {
            window.clearInterval(this._animation);
        }
    },

    /**
        To be executed when the dataset (metadata) changes, this function
        calculates the default step size (e.g. an hour) and the number of steps
        (e.g. 3 steps == 3 hours) between each animation frame. The animation
        controls in the top toolbar are thus enabled and initialized.
        @param  metadata    {Flux.model.Metadata}
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
        this._delay = this.getTopToolbar().down('#animate-delay').getValue();
    },

    /**
        Returns the current timestamp known to this Controller.
        @return {Date}
     */
    getTimestamp: function () {
        return this._timestamp;
    },

    /**TODO
     */
    onDelayChange: function (slider) {
        this._delay = slider.getValue();
        this.getTopToolbar().down('#animate-btn').toggle(false);
    },

    /**
        Handles forwards/backwards iteration through a time series dataset;
        responds to "forward" or "backward" button being clicked.
        @param  btn {Ext.button.Button}
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

    /**
        Handles a change in the step size as set by the user.
        @param  cmp     {Ext.form.field.ComboBox}
        @param  recs    {Array}
     */
    onStepSizeChange: function (cmp, recs) {
        var steps;

        this._stepSize = recs[0].get('stepSize');
        steps = this.calcStepOrSize(this._metadata.get('steps')[0],
            recs[0].get('stepSize'));

        this.updateStepSelector((steps === 0) ? 1 : steps);
    },

    /**
        Handles a change in the number of steps as set by the user.
        @param  cmp     {Ext.form.field.Number}
        @param  value   {Number}
     */
    onStepsChange: function (cmp, value) {
        this._steps = value;
    },

    /**
        Sets the timestamp as known by this Controller.
        @param  timestamp   {Date}
     */
    setTimestamp: function (timestamp) {
        this._timestamp = timestamp;
    },

    /**
        Causes the corresponding view to "step" forwards or backwards in time
        with the animation according to a specified number of steps.
        @param  steps   {Number}    Negative steps are steps taken backwards
     */
    stepBy: function (steps) {
        if (!this._timestamp) {
            return;
        }
        this._timestamp = Ext.Date.add(this._timestamp, this._stepSize, steps);
        this.getController('Dispatch').loadMap({
            time: Ext.Date.format(this._timestamp, 'c')
        });
    },

    /**TODO
     */
    toggleAnimation: function (btn, pressed) {
        if (!this._timestamp) {
            return;
        }

        if (pressed) {
            btn.setText('Pause');
            btn.setIconCls('icon-control-pause');
        } else {
            btn.setText('Animate');
            btn.setIconCls('icon-control-play');
        }

        this.animate(pressed, this._delay);
    },

    /**
        Removes and inserts the Ext.form.field.Number instance that represents
        the number of steps to be taken in an animation frame.
        @param  steps   {Number}
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




