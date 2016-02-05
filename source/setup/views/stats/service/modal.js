import _                from 'underscore';
import Backbone         from 'backbone';
import Validator        from '../../../utils/validator';
import ServiceModel     from '../../../models/service';
import ServiceSchema    from './schema';
import TmplServiceModal from '../../../templates/modal-service.jade';

class ServiceModalView extends Backbone.View {
	get template() { return TmplServiceModal; }
	get events() { return {
		'click .btn-switch': 'clickSwitch',
		'click .btn-close-modal': 'clickClose',
		'click .btn-submit-modal': 'clickSubmit'
	} }

	initialize(options) {
		_.extend(this, Backbone.Events);

console.log('options:',options);

		if(options.model) {
			this.model = options.model.clone();
			this.modelCid = options.model.cid;
			this.isEditMode = true;
		} else {
			this.model = new ServiceModel();
			this.isEditMode = false;
		}

		this.validator = new Validator({ body: this.$el, displayFormValidation: true });

		this._setDataSchema();
		this.validator.setOnlyDefaults(this.isEditMode ? this.model.attributes : {});
		this._setupListenEvents();
		this.render();
		this.validator.renderDefaults();
		this.openModal();
	}

	_setDataSchema() {
		this.validator.setDataSchema(ServiceSchema(this));
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

	_setupListenEvents() {
		this.listenTo(this.model.errors, 'update', this._updateBtnForErrors);
		this.listenTo(this.validator, 'update', this._updateModel);
		this.listenTo(this.validator, 'error', this._updateErrors);
	}

	_updateBtnForErrors() {
		const hasErrors = this.model.hasErrors;
		this.$('.btn-submit-modal')
			.toggleClass('btn-primary', !hasErrors)
			.toggleClass('btn-danger', hasErrors);
	}

	_updateErrors(id, hasError, el, value, msg) {
		if(hasError) {
			this.model.errors.add({id: id, msg: msg});
		} else {
			this.model.errors.remove(id);
		}
	}

	_updateModel(id, value) {
		if(id === 'timeout') {
			value = (value === '') ? 0 : parseInt(value);
		}
		this.model.set(id, value)
	}

	clickClose(e) {
		e.preventDefault();
		$(this.$('.modal')).modal('hide');
	}

	clickSubmit(e) {
		e.preventDefault();

		if(this.validator.validate()) {
			if(this.isEditMode) {
				let model = this.collection.get(this.modelCid);
				model.set(this.model.attributes);
			} else {
				this.collection.add(this.model);
			}
			$(this.$('.modal')).modal('hide');
		}
	}

	clickSwitch(e) {
		e.preventDefault();

		let target = $(e.target)
		  , model = target.data('model')
		  , value = target.data('value');

		target.blur();

		this._setSwitchBtn(model, value)
		this.model.set(model, value);
	}

	openModal() {
		$(this.$('.modal')).modal({
			backdrop: 'static'
		});
	}

	render() {
		this.$el.html(this.template({
			action: 'Add Service'
		}));

		$('body').append(this.$el);
	}
}

export default ServiceModalView;
