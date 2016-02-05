import BaseTab   from '../base-tab';
import dataSchema from './schema';
import Template   from '../../templates/view-app-settings.jade';


export default BaseTab({
	dataSchema: dataSchema,
	template: Template,

	events: {
		'click .btn-switch': 'clickSwitch'
	},

	initialize(options) {

		this.listenTo(this.validator, 'warning:appPortNumber', (hasWarning) => {
			let field = this.$('#appPortNumber').parents('.form-group');
			field.toggleClass('has-warning', hasWarning);
			this.$('#appPortNumberHelpNote').toggleClass('bold', hasWarning);
		});

		this.listenTo(this.validator, 'error:appAdminPasswordConfirm', (hasError) => {
			this.$('#appAdminPassword').parents('.form-group').toggleClass('has-error', hasError);
		});
	},

	clickSwitch(e) {
		e.preventDefault();

		let target = $(e.target)
		  , model = target.data('model')
		  , value = target.data('value');

		target.blur();

		this.setSwitchBtn(model, value)
		this.set(model, value);
	},

	setSwitchBtn(model, value) {
		this.$('button[data-model="' + model +'"].btn-switch').each(function () {
			if($(this).data('value') === value) {
				$(this).addClass('active');
			} else {
				$(this).removeClass('active');
			}
		});
	},

	
	render() {
		['appLogHttpRequests', 'appCheckForUpdates', 'appAutoUpdate', 'appRequireLogin'].forEach((field) => {
			let value = this.get(field);
			if(value !== undefined) {
				this.setSwitchBtn(field, this.get(field));
			}
		});
	}
});