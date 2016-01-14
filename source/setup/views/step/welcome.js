import BaseStep from '../base-step';
import Template from '../../templates/welcome-step.jade';

export default BaseStep({
	template: Template,

	events: {
		'click .btn-accept-next': 'clickAction'
	},

	clickAction: function (e) {
		e.preventDefault();
		this.pane.set('success', true);
		this.removeError('declinedTOS');
		this.nextStep();
	},

	validate: function () {
		if(!this.isSuccessful()) {
			this.addError('declinedTOS', 'You must accept the terms of service.');
			return false;
		}
		return true;
	}
});