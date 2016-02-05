import ViewSubTab from '../base-sub-tab';
import Template   from '../../templates/view-plex-plexpy.jade';
import DataSchema from './plexpy-schema';
import Notify     from '../../utils/notify';

class PlexPyView extends ViewSubTab {
	get enabledRequired() { return true; }
	get template() { return Template; }
	get events() {
		return {
			'click .btn-app-test': 'clickTestConnection',
			'click .btn-switch-usenet': '_clickSwitchBtn'
		}
	}

	get fields() { return ['host', 'port', 'web-root', 'api-key', 'use-ssl']; }
	get isEnabled() { return this.get('plexPyEnabled'); }

	initialize(options) {
		super.initialize(options);

		this.setTabIcon('plexpy');
		this.setDataSchema(DataSchema(this));

		this.listenToData('change:plexPyEnabled', this.updateEnabledField);
	}

	_clickSwitchBtn(e) {
		e.preventDefault();

		let target = $(e.target)
		  , model = target.data('model')
		  , value = target.data('value');

		if(value === 'false') {
			value = false;
		}

		if(value === 'true') {
			value = true;
		}

		target.blur();

		this._setSwitchBtn(model, value);
		this.set(model, value);
	}

	_setSwitchBtn(model, value) {
		this.$('button[data-model="' + model +'"].btn-switch-usenet').each(function () {
			if($(this).data('value') === value) {
				$(this).addClass('active');
			} else {
				$(this).removeClass('active');
			}
		});
	}

	clickTestConnection(e) {
		e.preventDefault();

		let btn = $(e.target);
		let msg = this.$('.btn-app-test-msg');

		if(this.isEnabled) {
			this.$('.has-warning').removeClass('has-warning');

			btn.removeClass('btn-danger btn-success').addClass('btn-info active');
			msg.removeClass('text-danger text-success').addClass('text-info').text('');

			if(!this.validator.validate()) return;

			$.ajax({
				url: Config.WebRoot + '/setup/plex/plexpy',
				method: 'POST',
				data: {
					host    : this.get('plexPyHost'),
					port    : this.get('plexPyPort'),
					webRoot : this.get('plexPyWebRoot'),
					apiKey  : this.get('plexPyApiKey'),
					useSSL  : this.get('plexPySSLEnable')
				}
			}).done((data) => {
				btn.removeClass('active');
				if(data.connection) {
					btn.addClass('btn-success').removeClass('btn-info');
					msg.text('Connection was successful!').addClass('text-success').removeClass('text-info');
					Notify.successConnection();
				} else {
					btn.addClass('btn-danger').removeClass('btn-info');
					msg.addClass('text-danger').removeClass('text-info');
					let message = '';
					if(data.hostNotFound) {
						message = '<b>Failed:</b> IP/Host Address not found.';
						this.$('.app-host').parents('.form-group').addClass('has-warning');
					} else if(data.connectionRefused) {
						message = '<b>Failed:</b> Connection was refused. Check ip address and port.';
						this.$('.app-host, .app-port').parents('.form-group').addClass('has-warning');
					} else if(data.pathNotFound) {
						message = '<b>Failed:</b> Service not found. Possibly wrong web root or ssl?';
						this.$('.app-web-root, .app-use-ssl').parents('.form-group').addClass('has-warning');
					} else if(data.wrongApiKey) {
						message = '<b>Failed:</b> Invalid API Key.';
						this.$('.app-api-key').parents('.form-group').addClass('has-warning');
					}

					msg.html(message);
					Notify.failed(message);
				}
			});
		}
	}

	preRequired() {
		let self = this;
		return (validator, id) => {
			if(!self.isEnabled) {
				validator.trigger('error', id, false, validator.getElement(id));
			}
			return self.isEnabled;
		}
	}

	updateEnabledField() {
		this._setSwitchBtn('plexPyEnabled', this.isEnabled);
		this.$('.btn-app-test').prop('disabled', !this.isEnabled);
		this.fields.forEach((field) => this.$('.app-' + field).prop('disabled', !this.isEnabled) );
	}

	render() {
		this.$el.html(this.template({
			title: 'PlexPy',
			id: 'plexPy',
			apiUiLocation: 'Settings > Access Control > API',
			default_port: 8181
		}));

		this.updateEnabledField()
	}
}

export default PlexPyView;