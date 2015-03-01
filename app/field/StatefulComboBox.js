// A ComboBox that remembers its state.

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
    }

});
