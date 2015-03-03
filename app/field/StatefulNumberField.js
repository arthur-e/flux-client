// A NumberField that remembers its state.

Ext.define('Flux.field.StatefulNumberField', {
    extend: 'Ext.form.field.Number',
    alias: 'widget.renumberfield',
    stateful: true,
    stateEvents: ['change'],

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
