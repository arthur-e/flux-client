Ext.define('Flux.field.StatefulComboBox', {
    extend: 'Ext.form.field.ComboBox',
    alias: 'widget.recombo',
    stateful: true,
    stateEvents: ['select'],

    getState: function () {
        return {
            value: this.getValue()
        };
    },

    applyState: function (state) {
        this.setValue(state && state.value);

        // applyState() is called before rendering or before the component is
        //  laid out, which means ComponentQuery operations (up() and down())
        //  aren't available; the propagateChange() function provides the same
        //  downstream logic while handling these exceptions
        if (typeof this.propagateChange === 'function') {
            this.propagateChange(state.value);
        }
    },

    listeners: {
        afterrender: function () {
            if (typeof this.propagateChange === 'function') {
                this.propagateChange(this.getValue());
            }
        },
        change: function (rg, sel) {
            if (typeof this.propagateChange === 'function') {
                this.propagateChange(sel);
            }
        }
    }
});
