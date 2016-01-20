import BaseTab   from '../base-tab';
import dataSchema from './schema';
import Template   from '../../templates/app-settings-step.jade';


export default BaseTab({
	dataSchema: dataSchema,
	template: Template,

	initialize(options) {

		this.listenTo(this.validator, 'warning:appPortNumber', (hasWarning) => {
			let field = this.$('#appPortNumber').parents('.form-group');
			field.toggleClass('has-warning', hasWarning);
			this.$('#appPortNumberHelpNote').toggleClass('bold', hasWarning);
		});

		this.listenTo(this.validator, 'error:appAdminPasswordConfirm', (hasError) => {
			this.$('#appAdminPassword').parents('.form-group').toggleClass('has-error', hasError);
		});
	}
});