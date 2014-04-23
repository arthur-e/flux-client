Ext.define('Flux.field.StatefulFieldSet', {
    extend: 'Ext.form.FieldSet',
    alias: 'widget.refieldset',
    stateful: true,
    stateEvents: ['enable', 'disable'],

    getState: function () {
        return {
            disabled: this.isDisabled()
        };
    },

    applyState: function (state) {
        this.setDisabled(state && state.disabled);
    }
});
