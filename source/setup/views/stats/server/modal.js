import Backbone        from 'backbone';
import TmplServerModal from '../../../templates/modal-server.jade';
import ServerModel     from '../../../models/server';
import ServerSchema    from './schema';
import DropdownView    from '../../dropdown';
import Validator       from '../../../utils/validator';
import DriveModel      from '../../../models/drive';

class ServerModalView extends Backbone.View {
	get template() { return TmplServerModal; }
	get events() {
		return {
			'click .btn-server-location'  : 'clickServerRemote',
			'click .btn-server-switch'    : 'clickSwitch',
			'click .btn-test-connection'  : 'clickTestConnection',
			'click #addServerAddDriveBtn' : 'clickAddDrive',
			'click #addServerCloseModal'  : 'clickClose',
			'click #addServerBtn'         : 'clickSubmit'
		};
	}

	initialize(options) {
		this.passphraseRequired = false;

		this.view = options.view;
		this.oldModel = options.oldModel || false;
		this.model = this.oldModel ? this.oldModel.clone() : new ServerModel();

		this.validator = new Validator({ body: this.$el, displayFormValidation: true });
		this._setDataSchema();
		if(this.oldModel) {
			this.validator.setOnlyDefaults(this.model.attributes);
		}

		let speedUnits = [['KBit/s', 'KiloBits per second'], ['MBit/s', 'MegaBits per second'], ['GBit/s', 'GigaBits per second']];
		this.viewBandwidthMaxUpload = new DropdownView(speedUnits, { size: 'sm' });
		this.viewBandwidthMaxDownload = new DropdownView(speedUnits, { size: 'sm' });

		this.listenTo(this.model, 'change:remote', this.updateModelRemote);
		this.listenTo(this.model, 'change:authentication', this.updateModelAuthentication);
		this.listenTo(this.model, 'change:monitorBandwidth', this.toggleBandwidth);
		this.listenTo(this.model.drives, 'update', this.updateDrivesTable);
		this.listenTo(this.model.errors, 'update', this.updateErrorBtn);
		this.listenTo(this.viewBandwidthMaxUpload, 'change', this.updateMaxUnit('maxUploadSpeedUnit'));
		this.listenTo(this.viewBandwidthMaxDownload, 'change', this.updateMaxUnit('maxDownloadSpeedUnit'));
		this.listenTo(this.validator, 'update', this.validateSetModel);
		this.listenTo(this.validator, 'error', this.validateUpdateErrors);
		this.listenTo(this.validator, 'update.privateKey', this.validatePassphrase);

		['host', 'port', 'username', 'authentication', 'password', 'privateKey', 'passphrase'].forEach((key) => {
			this.listenTo(this.model, 'change:' + key, this.clearConnectionBtnAndMsg);
		});

		this.render();
	}


	_setDataSchema() {
		this.validator.setDataSchema(ServerSchema(this));
	}

	_removeModal() {
		this.viewBandwidthMaxUpload.detach();
		this.viewBandwidthMaxDownload.detach();

		this.remove();
	}

	clearConnectionBtnAndMsg() {
		this.$('.test-connection-failed').text('').addClass('hide');
		this.$('.test-connection-success').addClass('hide');
		this.$('.btn-test-connection').removeClass('btn-danger btn-success').addClass('btn-info');
	}

	clickSubmit(e) {
		e.preventDefault();

		let server = this.validator.validate()
		  , drives = this.model.drives.validate()

		if(server && drives) {
			$(this.$('.modal')).modal('hide');
			if(this.oldModel) {
				this.oldModel.set(this.model.attributes)
			} else {
				this.view.servers.add(this.model);
			}
			this.view.validate();
		}
	}

	clickClose(e) {
		e.preventDefault();
		$(this.$('.modal')).modal('hide');
		this.view.validate();
	}

	clickAddDrive(e) {
		e.preventDefault();

		let model = new DriveModel();
		model.server = this.model;
		this.model.drives.add(model);
		this.$('#addServerDrivesTable tbody').append(model.view());
	}

	clickServerRemote(e) {
		e.preventDefault();

		let target = $(e.target)
		  , remote = target.data('remote');
		target.blur();

		this.setBtnRemote(remote);
		this.model.set('remote', remote);
	}

	clickSwitch(e) {
		e.preventDefault();

		let target = $(e.target)
		  , model = target.data('model')
		  , value = target.data('value');

		target.blur();

		this.setSwitchBtn(model, value)
		this.model.set(model, value);
	}

	clickTestConnection(e) {
		e.preventDefault();

		let btn = $(e.target)
		  , errMsgSpan = this.$('.test-connection-failed')
		  , successMsgSpan = this.$('.test-connection-success')
		  , btnAndFields = this.$('.btn-test-connection, .input-remote-server');

		function btnClass (hasErrors, errMsg, successful) {
			btn.toggleClass('btn-danger', hasErrors).toggleClass('btn-info', !hasErrors).removeClass('btn-success');
			errMsgSpan.toggleClass('hide', !hasErrors).html(errMsg || '');

			if(successful) {
				successMsgSpan.removeClass('hide');
				btn.addClass('btn-success').removeClass('btn-info');
			} else {
				successMsgSpan.addClass('hide');
			}
		}

		btnClass(false);
		if(this.validator.validate(['host', 'port', 'username', 'password', 'privateKey', 'passphrase'])) {
			btnAndFields.prop('disabled', true);

			$.ajax({
				url: Config.WebRoot + '/setup/server/test',
				method: 'POST',
				data: this.model.serverLogin
			}).done((data) => {
				btnAndFields.prop('disabled', false);

				let message = (data.error) ? '<b>Connection Failed!</b> ' + data.message : '';
				btnClass(data.error, message);

				if(data.passphraseRequired) {
					this.passphraseRequired = true;
					this.validator.validate('passphrase');
				}

				if(data.loginSuccessful) {
					btnClass(false, '', true);
				}
			});
		} else {
			btnClass(true, '<b>Validation Failed!</b> Please double check the fields and try again.');
		}
	}

	openModal() {
		$(this.$('.modal')).modal({
			backdrop: 'static'
		}).on('hidden.bs.modal', (e) => {
			this._removeModal();
			$(e.target).remove();
		}).on('shown.bs.modal', (e) => {
			self.$('.icon-drive-total-space').tooltip({
				html: true, placement: 'bottom',
				title: '<b>Optional:</b> Allow you to define the total drive space.'
			});
		});
	}

	render() {

		this.$el.html(this.template({
			btnText: (this.oldModel) ? 'Update Server' : 'Add Server'
		}))

		this.view.$el.append(this.$el);

		if(this.oldModel) {
			var model = this.oldModel;

			if(this.view.servers.hasLocalhost && model.get('remote')) {
				this.$('[data-remote="false"].btn-server-location').prop('disabled', true);
			}

			this.setBtnRemote(model.get('remote'));
			if(model.get('authentication') !== 'password') {
				this.setSwitchBtn('authentication', model.get('authentication'));
				this.$('.server-authentication-password').css('display', 'none');
				this.updateModelAuthentication();
			}
			this.setSwitchBtn('monitorCpu', model.get('monitorCpu'));
			this.setSwitchBtn('monitorMemory', model.get('monitorMemory'));
			this.setSwitchBtn('monitorBandwidth', model.get('monitorBandwidth'));

			this.viewBandwidthMaxUpload.set(model.get('maxUploadSpeedUnit'));
			this.viewBandwidthMaxDownload.set(model.get('maxDownloadSpeedUnit'));

			if(!model.get('monitorBandwidth')) {
				this.$('.server-bandwidth').css('display', 'none');
			}

			this.oldModel.drives.each((model) => {
				this.model.drives.add(model);

				model.server = this.model;
				this.$('#addServerDrivesTable tbody').append(model.view());
			});
		} else {
			if(this.view.servers.hasLocalhost) {
				this.$('[data-remote="false"].btn-server-location').prop('disabled', true);
				this.setBtnRemote(true);
				this.model.set('remote', true);
			}
		}

		this.viewBandwidthMaxUpload.attach(this.$('#addServerBandwidthMaxUploadBox'));
		this.viewBandwidthMaxDownload.attach(this.$('#addServerBandwidthMaxDownloadBox'));

		this.openModal();
		this.validator.renderDefaults();
	}

	setBtnRemote(remote) {
		this.$('.btn-server-location').each(() => {
			if($(this).data('remote') === remote) {
				$(this).addClass('active');
			} else {
				$(this).removeClass('active');
			}
		});

		let remoteBox = this.$('.remote-server-details')
		  , isVisible = remoteBox.is(':visible');

		if(remote && !isVisible) {
			remoteBox.slideDown();
		} else if(!remote &&isVisible) {
			remoteBox.slideUp({ complete: () => this.clearConnectionBtnAndMsg() });
		}
	}

	setSwitchBtn(model, value) {
		this.$('button[data-model="' + model +'"].btn-server-switch').each(() => {
			if($(this).data('value') === value) {
				$(this).addClass('active');
			} else {
				$(this).removeClass('active');
			}
		});
	}

	updateDrivesTable() {
		this.$('#addServerDrivesTableNone').css('display', (this.model.drives.length > 0) ? 'none' : '');
	}

	updateErrorBtn() {
		let hasErrors = this.model.hasErrors();
		this.$('#addServerBtn')
			.toggleClass('btn-primary', !hasErrors)
			.toggleClass('btn-danger', hasErrors);
	}

	updateMaxUnit(key) {
		return (value) => { this.model.set(key, value); };
	}

	updateModelAuthentication() {
		let type = this.model.get('authentication')
		  , formPassword = this.$('.server-authentication-password')
		  , formPrivateKey = this.$('.server-authentication-privatekey');

		let closeOthers = (callback) => {
			let count = 0;
			this.$('.server-authentication').each(function each() {
				if($(this).is(':visible')) {
					count += 1;
					$(this).slideUp({ complete: () => callback && callback() })
				}
			});

			if(count === 0) {
				callback && callback();
			}
		}

		if(type === 'password') {
			closeOthers(() => formPassword.slideDown() );
		} else if(type === 'privateKey') {
			closeOthers(() => formPrivateKey.slideDown() );
		} else {
			closeOthers();
		}
	}

	toggleBandwidth() {
		let enabled = this.model.get('monitorBandwidth')
		  , box = this.$('.server-bandwidth');

		if(enabled) {
			box.slideDown();
		} else {
			box.slideUp();
		}
	}

	validatePassphrase(value) {
		this.passphraseRequired = false;
		this.validator.validate('passphrase');
	}

	validateUpdateErrors(id, hasError, el, value, msg) {
		if(hasError) {
			this.model.errors.add({id: id, msg: msg});
		} else {
			this.model.errors.remove(id);
		}
	}

	validateSetModel(id, value) {
		this.model.set(id, value);
	}
}

export default ServerModalView;