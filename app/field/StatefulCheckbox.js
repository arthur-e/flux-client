Ext.define('Flux.field.StatefulCheckbox', {
    extend: 'Ext.form.field.Checkbox',
    alias: 'widget.recheckbox',
    stateful: true,
    stateEvents: ['change'],
    inputValue: true,

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
    }
});
