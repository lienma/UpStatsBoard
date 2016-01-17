import $          from 'jquery';
import _          from 'underscore';
import Backbone   from 'backbone';
import DataSchema from './schema';
import AppModel   from '../../models/usenet-app';
import Validator  from '../../utils/validator';
import Template   from '../../templates/usenet-app.jade';

class UsenetApp extends Backbone.View {
	get template() { return Template; }

	initialize(options) {

		this.id            = options.id;
		this.title         = options.title;
		this.defaultPort   = options.defaultPort;
		this.apiUiLocation = options.apiUiLocation;
		this.fields        = ['host', 'port', 'web-root', 'api-key', 'use-ssl'];
		this.model         = new AppModel({ id: options.id });
		this.validator     = new Validator({ dataSchema: DataSchema, body: this.$el });

		this.listenTo(this.validator, 'error', this.updateOnValidatorError);
		this.listenTo(this.validator, 'update', (id, value) => this.model.set(id, value) );
		this.listenTo(this.model, 'change:enabled', this.updateEnabledField);
	}

	clickTestConnection(btn, msg) {
		if(this.isEnabled) {
			this.$('.has-warning').removeClass('has-warning');

			btn.removeClass('btn-danger btn-success').addClass('btn-info active');
			msg.removeClass('text-danger text-success').addClass('text-info');

			if(!this.validator.validate()) return;

			$.ajax({
				url: Config.WebRoot + '/setup/usenet/test/' + this.model.id,
				method: 'POST',
				data: this.model.attributes
			}).done((data) => {
				btn.removeClass('active');
				if(data.connection) {
					btn.addClass('btn-success').removeClass('btn-info');
					msg.text('Connection was successful!').addClass('text-success');
				} else {
					btn.addClass('btn-danger');
					msg.addClass('text-danger');
					if(data.hostNotFound) {
						msg.html('<b>Failed:</b> IP/Host Address not found.');
						this.$('.app-host').parents('.form-group').addClass('has-warning');
					} else if(data.connectionRefused) {
						msg.html('<b>Failed:</b> Connection was refused. Check ip address and port.');
						this.$('.app-host, .app-port').parents('.form-group').addClass('has-warning');
					} else if(data.pathNotFound) {
						msg.html('<b>Failed:</b> Service not found. Possibly wrong web root or ssl?');
						this.$('.app-web-root, .app-use-ssl').parents('.form-group').addClass('has-warning');
					} else if(data.wrongApiKey) {
						msg.html('<b>Failed:</b> Invalid API Key.');
						this.$('.app-api-key').parents('.form-group').addClass('has-warning');
					}
				}
			});
		}
	}

	get isEnabled() { return this.model.isEnabled; }

	get isSelected() { return this.model.get('selected'); }

	updateOnValidatorError(id, hasError, el, value, msg) {
		if(hasError) {
			this.addError(id, msg, el);
		} else {
			this.removeError(id, el);
		}
	}

	close(callback) {
		$(this.$el).fadeOut({ complete: () => {
			this.model.set('enabled', false);
			this.model.set('selected', false);
			callback();
		} });
	}

	open() {
		$(this.$el).fadeIn({ complete: () => this.model.set('selected', true) });
	}

	updateEnabledField() {
		let isEnabled = this.isEnabled;
		this.$('.app-enable').prop('checked', isEnabled);

		this.fields.forEach((field) => this.$('.app-' + field).prop('disabled', !isEnabled) );

		if(!isEnabled) {
			var errors = this.model.errors.clone();
			errors.forEach((model) => this.removeError(model.id, this.validator.getElement(model.id)));
		} else {
			this.validator.validate();
		}
	}

	updateEnabledModel() {
		this.model.set('enabled', this.$('.app-enable').prop('checked'));
	}

	addError (id, msg, el) {
		if(!_.isUndefined(el)) {
			el.parents('.form-group').addClass('has-error');
		}
		this.model.errors.add({id: id, msg: msg});
	}

	removeError(id, el) {
		if(!_.isUndefined(el)) {
			el.parents('.form-group').removeClass('has-error');
		}
		this.model.errors.remove(id);
	}

	get hasErrors() {
		return this.model.errors.size() > 0;
	}

	render() {
		let tmplObj = {
			id: 'usenet-' + this.id,
			title: this.title,
			default_port: this.defaultPort,
			apiUiLocation: this.apiUiLocation
		};
		this.$el.html(this.template(tmplObj));

		return this;
	}

	renderDefaults() {
		this.validator.renderDefaults();
	}

	setDefaults(defaultData) {
		this.validator.setDefaults(defaultData);
	}

	validate() {
		if(this.isEnabled) {
			return !this.validator.validate();
		}
		return true;
	}
}

export default UsenetApp;
