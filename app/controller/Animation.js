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
            },
            
            '#reset-btn': {
                click: this.onResetButton
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
        var steps;

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
        }

        if (s0 / 2678400 < 1) { // Less than 1 month?
            return 'days';
        }

        return 'months';
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
        var d, steps, stepSize;
        var cmp = this.getSettingsMenu().down('field[name=stepSize]');
        var offsets = metadata.getTimeOffsets();

        if (!metadata) {
            return;
        }

        this._metadata = metadata;

        // Enable all the toolbar buttons related to animation
        Ext.each(this.getTopToolbar().query('button[cls=anim-btn]'), function (btn) {
            btn.enable();
        });

        // Figure out the default size of step (e.g. an hour) and the number of
        //  steps to take in each frame
        if (Ext.isEmpty(offsets)) {
            stepSize = steps = 1;
            d = [[1, 'steps']];
            cmp.disable();

        } else {
            stepSize = this.calcStepOrSize(offsets[0]);
            steps = this.calcStepOrSize(offsets[0], stepSize);

            // We can't reliably animate a time series that changes its time
            //  interval, so disable the selection of a different time interval
            if (offsets.length > 1) {
                d = [[offsets[0], 'steps']];
                cmp.disable();

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
        }

        // Removes and inserts the Ext.form.field.Number instance that represents
        //  the number of steps to be taken in an animation frame
        this.updateStepSelector(steps, Ext.isEmpty(offsets));

        // Create and bind a new store to hold the appropriate step sizes
        cmp.bindStore(Ext.create('Ext.data.ArrayStore', {
            fields: ['stepSize', 'text'],
            data: d
        }));

        // Apply the default settings to the UI
        cmp.setValue(stepSize);

        this._steps = steps;
        this._stepSize = stepSize;
        this._delay = this.getTopToolbar().down('#animate-delay').getValue();
    },

    /**
        Causes the corresponding view to "step" forwards or backwards in time
        with the animation according to a specified number of steps.
        @param  steps   {Number}        Negative steps are steps taken backwards
        @param  reset   {Boolean}       Get timestamp from whatever is set in the UI
                                        instead of drawn map
     */
    stepBy: function (steps, reset) {
        var ui = this.getController('UserInteraction');
        var map = ui.getMap();
        
        this.getTopToolbar().down('button[itemId=reset-btn]').show();

        Ext.each(map, Ext.Function.bind(function (view) {
	    var params, args, ts, ts_diff, vals;  
            var agg_toggle = Ext.ComponentQuery.query('field[name=showAggregation]')[0].getValue();
            var diff_toggle = Ext.ComponentQuery.query('field[name=showDifference]')[0].getValue();
            var diff_sync = Ext.ComponentQuery.query('checkbox[name=syncDifference]')[0].checked;
            
            ts = view.getMoment();
            ts_diff = view.getMomentOfDifference();
            if (reset) {
                steps = 0;
                
                var date = Ext.ComponentQuery.query('datefield[name=date]')[0].rawValue;
                var time = Ext.ComponentQuery.query('combo[name=time]')[0].value;
        
                ts = moment.utc(Ext.String.format('{0}T{1}:00.000Z', date, time));
                
                if (diff_toggle) {
                    var date = Ext.ComponentQuery.query('datefield[name=date2]')[0].rawValue;
                    var time = Ext.ComponentQuery.query('combo[name=time2]')[0].value;
                    ts_diff = moment.utc(Ext.String.format('{0}T{1}:00.000Z', date, time));
                }
            }
            
            if (Ext.isEmpty(ts)) {
                return;
            }

            ui._dontResetSteps = true;
            
            ///////////////////////////////////////////////////////
            // Non-agg/Non-diff views
            params = {
                time: ts.clone()
                    .add(steps, this._stepSize)
                    .toISOString()
            };
                
            ///////////////////////////////////////////////////////
            // Aggregation views
            if (agg_toggle) {
		args = ui.getAggregationArgs();
		vals = Ext.Object.getValues(args);
		if (Ext.Array.clean(vals).length !== vals.length) {
		    // Throw an alert and turn off animation if not all of the aggregation fields are filled out
		    Ext.Msg.alert('Request Error', 'All aggregation fields must be filled out before animating');
		    this.getTopToolbar().down('#animate-btn').toggle(false);
		    return;
		}
		params = {
		    aggregate: args.aggregate,
		    start: ts.clone()
			  .add(steps, this._stepSize)
			  .toISOString(),
		    end: ts.clone()
			  .add(args.intervals,args.intervalGrouping)
			  .add(steps, this._stepSize)
			  .toISOString()
		};
	    }
	    
	    ///////////////////////////////////////////////////////
	    // Differenced views
	    if (diff_toggle) {
                var vals = ui.getSourcePanel().getForm().getValues();
                ui._diffTime = ts_diff;
                if (diff_sync) {
                    ui._diffTime = ts_diff.clone()
                                     .add(steps, this._stepSize)
                }
                
                params = [{
                    time: ts.clone()
                            .add(steps, this._stepSize)
                            .toISOString()
                }, {
                    time: ui._diffTime.toISOString()
                }]

                ui.fetchRasters(view, params, Ext.Function.bind(ui.onDifferenceReceive, ui));

            } else {
                ui.fetchRaster(view, params);
            }
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
        Handles reset to starting dataset specified in the source panel.
        
        @param  btn {Ext.button.Button}
     */
    onResetButton: function (btn) {
        this.stepBy(0, true);
        btn.hide();
    },

    /**
        Handles forwards/backwards iteration through a time series dataset;
        responds to "forward" or "backward" button being clicked.
        @param  btn {Ext.button.Button}
     */
    onStepButton: function (btn) {
        // Uncheck the "Show Aggregation" and "Show Difference" checkboxes
        //this.getController('UserInteraction').uncheckAggregates();

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
        @param  c       {Ext.form.field.ComboBox}
        @param  recs    {Array}
     */
    onStepSizeChange: function (c, recs) {
        var steps;

        this._stepSize = recs[0].get('stepSize');
        steps = this.calcStepOrSize(this._metadata.getTimeOffsets()[0],
            recs[0].get('stepSize'));

        this.updateStepSelector((steps === 0) ? 1 : steps);
    },

    /**
        Handles a change in the number of steps as set by the user.
        @param  c       {Ext.form.field.Number}
        @param  value   {Number}
     */
    onStepsChange: function (c, value) {
        this._steps = value;
    },

    /**
        Pause/Play the animation.
        @param  btn     {Ext.button.Button}
        @param  pressed {Boolean}
     */
    toggleAnimation: function (btn, pressed) {
        // Uncheck the "Show Aggregation" and "Show Difference" checkboxes
        //this.getController('UserInteraction').uncheckAggregates();
	this.getController('UserInteraction').toggleAggregateParams(pressed);
	
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
        @param  steps       {Number}
        @param  disabled    {Boolean}
     */
    updateStepSelector: function (steps, disabled) {
        var menu = this.getSettingsMenu();
        if (menu.query('field[name=steps]').length !== 0) {
            menu.remove('steps');
        }
        menu.insert(menu.items.length - 1, Ext.create('Ext.form.field.Number', {
            xtype: 'numberfield',
            disabled: disabled,
            itemId: 'steps',
            name: 'steps',
            value: steps,
            minValue: steps,
            step: steps,
            listeners: {
                change: Ext.bind(this.onStepsChange, this)
            }
        }));
        
        // Call onStepsChange so that newly added 'steps' value registers
        this.onStepsChange(undefined, steps);
    }

});




