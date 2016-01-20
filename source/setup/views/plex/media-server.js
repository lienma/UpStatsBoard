import ViewSubTab        from '../base-sub-tab';
import Template          from '../../templates/view-plex-media-server.jade';
import DataSchema        from './media-server-schema';
import SelectLibraryView from './select-library';
import Notify            from '../../utils/notify';

class MediaServerView extends ViewSubTab {
	get template() { return Template; }

	get events() {
		return {
			'click .btn-plex-text-connection': 'clickTestConnection',
			'click .btn-plex-pick-library': 'clickPickLibrary'
		}
	}

	initialize(options) {
		super.initialize(options);

		this.setTabIcon('plex');
		this.setDataSchema(DataSchema);

		this.listenToData('change:plexMediaServerHost', this.updateTestConnectionBtn);
		this.listenToData('change:plexMediaServerPortNumber', this.updateTestConnectionBtn);
		this.listenToData('change:plexMediaServerSSLEnable', this.updateTestConnectionBtn);

		this.SelectLibrary = new SelectLibraryView({ view: this });
	}

	clickTestConnection(e) {
		e.preventDefault();

		let btn = $(e.target).removeClass('btn-success btn-danger').addClass('btn-default');
		let msg = this.$('.btn-plex-text-connection-msg').text('').removeClass('text-success text-danger');
		let btnAndFields = this.$('.btn-plex-text-connection, .plex-media-server');

		if(this.validator.validate('plexMediaServerHost') && this.validator.validate('plexMediaServerPortNumber')) {
			btnAndFields.prop('disabled', true);

			$.ajax({
				url: Config.WebRoot + '/setup/plex/test',
				method: 'POST',
				data: {
					username: this.get('plexTvUsername'),
					password: this.get('plexTvPassword'),
					token: this.get('plexToken'),
					host: this.get('plexMediaServerHost'),
					port: this.get('plexMediaServerPortNumber'),
					useSSL: this.get('plexMediaServerSSLEnable')
				}
			}).done((data) => {
				btnAndFields.prop('disabled', false);

				if(data.connection) {
					btn.addClass('btn-success').removeClass('btn-default');
					msg.text('Connection was successful!').addClass('text-success');
					Notify.successConnection();
				} else {
					btn.addClass('btn-danger').removeClass('btn-default');
					msg.addClass('text-danger');

					let message = '';
					if(data.hostNotFound) {
						message = '<b>Failed:</b> IP/Host Address not found.';
						this.$('#plexMediaServerHost').parents('.form-group').addClass('has-warning');
					} else if(data.connectionRefused) {
						message = '<b>Failed:</b> Connection was refused. Check ip address and port.';
						this.$('#plexMediaServerHost, #plexMediaServerPortNumber').parents('.form-group').addClass('has-warning');
					} else if(data.unauthorized) {
						message = '<b>Failed:</b> Unauthorized access. Check username and password for Plex.tv account.';
						this.$('#plexTvUsername, #plexTvPassword').parents('.form-group').addClass('has-warning');
					} else if(data.wrongCredentials) {
						message = '<b>Failed:</b> Unabled to retrieve plex token. Check username and password for Plex.tv account.';
						this.$('#plexTvUsername, #plexTvPassword').parents('.form-group').addClass('has-warning');
					}

					msg.html(message);
					Notify.failed(message);
				}
			});
		}
	}

	clickPickLibrary(e) {
		e.preventDefault();

		let btn = $(e.target);
		let type = btn.data('type');
		this.currentSelectLibraryBtn = btn;
		this.SelectLibrary.open(type);
	}

	selectPlexLibrary(id) {
		let btn = this.currentSelectLibraryBtn;
		let field = btn.data('field');
		$('#' + field).val(id);
		this.set(field, id);
	}

	updateTestConnectionBtn() {
		let btn = this.$('.btn-plex-text-connection');
		let msg = this.$('.btn-plex-text-connection-msg');
		let disabled = (this.get('plexMediaServerHost') === '' || this.get('plexMediaServerPortNumber') === '');
		btn.prop('disabled', disabled).removeClass('btn-success btn-danger').addClass('btn-default');
		msg.text('').removeClass('text-success text-danger');

		this.$('.btn-plex-pick-library').prop('disabled', disabled);
	}

	render() {
		super.render();
		this.SelectLibrary.renderTo(this.$el);
		this.updateTestConnectionBtn();
	}
}

export default MediaServerView