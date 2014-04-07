Ext.define('Flux.field.StatefulCheckbox', {
    extend: 'Ext.form.field.Checkbox',
    alias: 'widget.recheckbox',
    stateful: true,
    stateEvents: ['change'],
    inputValue: true,
    uncheckedValue: false,

    initComponent: function () {
        this.on('afterrender', function () {
            if (typeof this.propagateChange === 'function') {
                this.propagateChange(this.getValue());
            }
        });
        this.on('change', function (cb, checked) {
            if (typeof this.propagateChange === 'function') {
                this.propagateChange(checked);
            }
        });
        this.callParent(arguments);
    },

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
