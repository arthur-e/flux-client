Ext.define('Flux.field.StatefulCheckbox', {
    extend: 'Ext.form.field.Checkbox',
    alias: 'widget.statefulcheckbox',
    stateEvents: ['change'],
    inputValue: true,
    uncheckedValue: false,
    getState: function () {
        return {
            value: this.getValue()
        };
    },
    applyState: function (state) {
        this.setValue(state && state.value);
    }
});
