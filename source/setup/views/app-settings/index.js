import BaseTab   from '../base-tab';
import dataSchema from './schema';
import Template   from '../../templates/app-settings-step.jade';


export default BaseTab({
	dataSchema: dataSchema,
	template: Template,

	initialize(options) {

		this.validator.on('appPortNumber.warning', (hasWarning) => {
			let field = this.$('#appPortNumber').parents('.form-group');
			field.toggleClass('has-warning', hasWarning);
			this.$('#appPortNumberHelpNote').toggleClass('bold', hasWarning);
		});

		this.validator.on('appAdminPasswordConfirm.error', (hasError) => {
			this.$('#appAdminPassword').parents('.form-group').toggleClass('has-error', hasError);
		});
	}
});