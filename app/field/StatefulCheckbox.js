// A Checkbox that remembers its state.

Ext.define('Flux.field.StatefulCheckbox', {
    extend: 'Ext.form.field.Checkbox',
    alias: 'widget.recheckbox',
    stateful: true,
    stateEvents: ['enable', 'disable', 'change'],
    inputValue: true,
    uncheckedValue: false,

    getState: function () {
        return {
            disabled: this.isDisabled(),
            value: this.getValue()
        };
    },

    applyState: function (state) {
        if (state) {
            this.setDisabled(state.disabled);
            this.setValue(state.value);
        }
    }
});
