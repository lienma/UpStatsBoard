import _         from 'underscore';
import Backbone  from 'backbone';
import Validator from '../utils/validator';

class ViewSubTab extends Backbone.View {
	get tagName() { return 'div'; }
	get enabledRequired() { return false; }

	initialize(options) {
		this.basePane = options.basePane;
		this.parentPane = options.parentPane;

		this.get = this.parentPane.get.bind(this.parentPane);
		this.set = this.parentPane.set.bind(this.parentPane);

		this.validator = new Validator({ body: this.$el, displayFormValidation: true });

		this.listenTo(this.validator, 'update', (id, value) => this.set(id, value) );
		this.listenTo(this.validator, 'error', this.updateOnValidatorError);
		this.listenTo(this.validator, 'validate', this.updateOnValidate);
		this.listenTo(this.model.errors, 'update', this.updateOnModelError);

		this.$el.addClass('tab-pane fade');
		this.$el.prop('role', 'tabpanel');
		this.$el.attr('id', options.basePane.id + '-' + this.model.id);


		let events = {};
		_.extend(events, this.events, {
			'click .btn-switch': '_clickSwitchBtn'
		});
		this.delegateEvents(events);
	}

	_clickSwitchBtn(e) {
		e.preventDefault();

		let target = $(e.target)
		  , model = target.data('model')
		  , value = target.data('value');

		target.blur();

		this._setSwitchBtn(model, value);
		this.set(model, value);
	}

	_setSwitchBtn(model, value) {
		this.$('button[data-model="' + model +'"].btn-switch').each(function () {
			if($(this).data('value') === value) {
				$(this).addClass('active');
			} else {
				$(this).removeClass('active');
			}
		});
	}

	updateOnModelError() {
		this.parentPane.updateNextBtnForErrors(this.model.hasErrors);
		this.updateErrorsModel();
	}

	updateOnValidatorError(id, hasError, el, value, msg) {
		if(hasError) {
			this.addError(id, msg, el);
		} else {
			this.removeError(id, el);
		}
	}

	updateOnValidate(valid) {
		this.model.tab.updateTabClass(valid);
	}

	listenToData(eventName, callback) {
		this.listenTo(this.parentPane.model.data, eventName, callback);
	}

	addApps(apps) {
		this.model.tab.setApps(apps);
	}

	setTabIcon(icon) {
		this.model.tab.setIcon(icon);
	}

	setDataSchema(data) {
		this.dataSchema = data;
		this.validator.setDataSchema(data);
	}

	setDefaults(data) {
		this.validator.setDefaults(data);
	}

	updateErrorsModel() {
		if(this.model.hasErrors) {
			this.parentPane.addError(this.model.id, this.model.get('title') + ' has error(s).');
		} else {
			this.parentPane.removeError(this.model.id);
		}
	}

	open(callback) {
		this.model.set('current', true);
	}

	toggleError(id, msg, hasErr) {
		if(hasErr) {
			this.addError(id, msg);
		} else {
			this.removeError(id);
		}
	}

	addError(id, msg) {
		this.model.errors.add({id: id, msg: msg});
	}

	removeError(id) {
		this.model.errors.remove(id);
	}

	render() {
		this.$el.html(this.template());
		return this;
	}

	renderDefaults() {
		this.validator.renderDefaults();
	}

	afterRender() {

	}

	validate(validateOnly = false) {
		let results = this.validator.validate(validateOnly);
		return results;
	}
}

export default ViewSubTab;