import Backbone from 'backbone';
import _        from 'underscore';

const DataModel = Backbone.Model.extend();
const ErrorModel = Backbone.Model.extend({
	defaults: {
		msg: ''
	}
});

class WizardModel extends Backbone.Model {
	get defaults() {
		return {
			body:            null,
			containsSubTabs: false,
			current:         false,
			disabled:        false,
			title:           '',
			success:         false
		};
	}

	initialize() {
		this.data = new DataModel();
		this.errors = new Backbone.Collection([], {
			model: ErrorModel
		});

		this.listenTo(this.errors, 'update', () => {
			if(this.hasErrors()) {
				this.set('success', false);
			}
		});
	}

	isCurrent() {
		return this.get('current')
	}

	isDisabled() {
		return this.get('disabled')
	}

	isSuccessful() {
		return this.get('success');
	}

	hasError(id) {
		let error = this.errors.get(id);
		return !_.isUndefined(error);
	}

	hasErrors() {
		return this.errors.size() > 0;
	}

	setDefaults(data) {
		this.pane._body.setDefaults(data);
	}

}

export default WizardModel;
