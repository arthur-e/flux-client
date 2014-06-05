Ext.define('Flux.controller.Animation', {
    extend: 'Ext.app.Controller',

    refs: [{
        'ref': 'settingsMenu',
        'selector': '#settings-menu'
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
        'Flux.model.RasterGrid',
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

            '#settings-menu combo': {
                select: this.onStepSizeChange
            },

            '#animate-btn': {
                toggle: this.toggleAnimation
            },

            '#animate-delay': {
                dragend: this.onDelayChange
            },

            '#forward-btn, #backward-btn': {
                click: this.onStepButton
            }

        });
    },

    /**
        Calculates either the step size (unit length of time in an interval
        between data frames) or the number of such steps (if step size provided)
        to take in an animation frame.
        @param  s0          {Number}    Initial number of seconds between each step/span
        @param  stepSize    {String}    The size of the step/span
     */
    calcStepOrSize: function (s0, stepSize) {
        if (stepSize) {
            switch (stepSize) {
                case 'months':
                steps = s0 / 2678400;
                break;

                case 'days':
                steps = s0 / 86400;
                break;

                default:
                steps = s0 / 3600; // 'hours'
            }

            return Math.floor(steps);
        }

        if (s0 / 86400 < 1) { // Less than 1 day (86400 seconds)?
            return 'hours';
        } else if (s0 / 2678400 < 1) { // Less than 1 month?
            return 'days';
        } else {
            return 'months';
        }
    },

    /**
        Creates or clears the timing function for an animation.
        @param  state   {Boolean}
        @param  delay   {Number}
     */
    animate: function (state, delay) {
        if (state) {
            this._animation = window.setInterval(Ext.bind(this.stepBy,
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
        s0 = metadata.getTimeOffsets()[0];
        stepSize = this.calcStepOrSize(s0);
        steps = this.calcStepOrSize(s0, stepSize);

        // Enable all the toolbar buttons related to animation
        Ext.each(this.getTopToolbar().query('button[cls=anim-btn]'), function (btn) {
            btn.enable();
        });

        // Configure the Animation Settings ////////////////////////////////////
        this.updateStepSelector(steps);

        c = this.getSettingsMenu().down('field[name=stepSize]');

        // We can't reliably animate a time series that changes its time
        //  interval, so disable the selection of a different time interval
        if (metadata.getTimeOffsets().length > 1) {
            d = [[s0, 'steps']];
            c.disable();
        } else {
            switch (stepSize) {
                case 'days':
                d = [
                    ['days', 'day(s)']
                ];
                break;

                case 'months':
                d = [
                    ['days', 'day(s)'],
                    ['months', 'month(s)']
                ];
                break;

                default:
                d = [
                    ['hours', 'hour(s)'],
                    ['days', 'day(s)']
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
        Causes the corresponding view to "step" forwards or backwards in time
        with the animation according to a specified number of steps.
        @param  steps   {Number}    Negative steps are steps taken backwards
     */
    stepBy: function (steps) {
        var query = Ext.ComponentQuery.query('d3geomap');

        Ext.each(query, Ext.Function.bind(function (view) {
            var ts = view.getMoment();

            if (Ext.isEmpty(ts)) {
                return;
            }

            this.getController('UserInteraction').fetchMap(view, {
                time: ts.clone()
                    .add(steps, this._stepSize)
                    .toISOString()
            });
        }, this));
    },

    ////////////////////////////////////////////////////////////////////////////
    // Event Handlers //////////////////////////////////////////////////////////

    /**
        Handles a change in the animation delay from the Slider instance in the
        top Toolbar.
        @param  slider  {Ext.slide.Multi}
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
        // Uncheck the "Show Aggregation" and "Show Difference" checkboxes
        this.getController('UserInteraction').uncheckAggregates();

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
        steps = this.calcStepOrSize(this._metadata.getTimeOffsets()[0],
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
        Pause/Play the animation.
        @param  btn     {Ext.button.Button}
        @param  pressed {Boolean}
     */
    toggleAnimation: function (btn, pressed) {
        // Uncheck the "Show Aggregation" and "Show Difference" checkboxes
        this.getController('UserInteraction').uncheckAggregates();

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
        var menu = this.getSettingsMenu();
        if (menu.query('field[name=steps]').length !== 0) {
            menu.remove('steps');
        }
        menu.insert(menu.items.length - 1, Ext.create('Ext.form.field.Number', {
            xtype: 'numberfield',
            itemId: 'steps',
            name: 'steps',
            value: steps,
            minValue: steps,
            step: steps,
            listeners: {
                change: Ext.bind(this.onStepsChange, this)
            }
        }));
    }

});




