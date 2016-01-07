define([
	'backbone',
	'bootstrap',
	'tmpl!setup/modal-add-server',
	'setup/model/server',
	'util/validator',
	'util/view/dropdown-inline',
	'setup/model/drive'
], function (Backbone, bootstrap, TmplModalBody, ModelServer, ValidatorClass, ViewDropdown, ModelDrive) {

	return Backbone.View.extend({
		passphraseRequired: false,

		events: {
			'click .btn-server-location': 'clickServerRemote',
			'click .btn-server-switch': 'clickSwitch',
			'click .btn-test-connection': 'clickTestConnection',
			'click #addServerAddDriveBtn': 'clickAddDrive',
			'click #addServerCloseModal': 'clickClose',
			'click #addServerBtn': 'clickSubmit'
		},

		initialize: function (options) {
			var self = this;

			this.view = options.view;
			this.oldModel = options.oldModel || false;
			this.model = this.oldModel ? this.oldModel.clone() : new ModelServer();

			this.validator = new ValidatorClass({ body: this.$el, displayFormValidation: true });
			this._setDataSchema();
			if(this.oldModel) {
				this.validator.setOnlyDefaults(this.model.attributes);
			}

			var speedUnits = [['KBit/s', 'KiloBits per second'], ['MBit/s', 'MegaBits per second'], ['GBit/s', 'GigaBits per second']];
			this.viewBandwidthMaxUpload = new ViewDropdown(speedUnits, { size: 'sm' });
			this.viewBandwidthMaxDownload = new ViewDropdown(speedUnits, { size: 'sm' });

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

			['host', 'port', 'username', 'authentication', 'password', 'privateKey', 'passphrase'].forEach(function (key) {
				self.listenTo(self.model, 'change:' + key, self.clearConnectionBtnAndMsg);
			});

			this.render();
		},

		_setDataSchema: function () {
			var self = this;

			var isRemote = function () {
				return self.model.get('remote');
			};

			var isAuthentication = function (type) {
				return function () { return isRemote() && self.model.get('authentication') == type; };
			};

			var isBandwidth = function () {
				return self.model.get('monitorBandwidth');
			};

			this.validator.setDataSchema({
				'label': {
					el: '#addServerLabel',
					constraints: {
						required: [true, 'A unique server name is required.'],
						func: [function (value) {
							return self.view.servers.where({ label: value }).length == 0 || _.isObject(self.oldModel);
						}, 'The server name is already being used.'],
						lessThan: [41, 'Max length of the name can only be 40 characters.']
					}
				},

				'host': {
					el: '#addServerHost',
					preRequirement: isRemote,
					constraints: {
						required: [true, 'A host address is required.']
					}
				},

				'port': {
					el: '#addServerPortNumber',
					preRequirement: isRemote,
					constraints: {
						required: [true, 'A port number is required.'],
						portNumber: [true, 'The port number is invalid for the remote server.']
					}
				},

				'username': {
					el: '#addServerUsername',
					preRequirement: isRemote,
					constraints: {
						required: [true, 'A username is required.'],
						lessThan: [33, 'Max lenght of a username is 32 characters.']
					}
				},

				'password': {
					el: '#addServerPassword',
					preRequirement: isAuthentication('password'),
					constraints: {
						required: [true, 'A password is required.']
					}
				},

				'privateKey': {
					el: '#addServerPrivateKey',
					preRequirement: isAuthentication('privateKey'),
					constraints: {
						required: [true, 'A private key is requred.'],
						privateKey: [true, 'this is an invalid private key.']
					}
				},

				'passphrase': {
					el: '#addServerPassphrase',
					preRequirement: function () {
						return isAuthentication('privateKey')() && self.passphraseRequired;
					},
					constraints: {
						message: 'Passphrase is required with this Private Key.',
						func: function (value) {
							return value != '';
						}
					}
				},

				'maxUploadSpeed': {
					el: '#addServerBandwidthMaxUpload',
					preRequirement: isBandwidth,
					constraints: {
						number: [true, 'This is an invalid number.']
					}
				},

				'maxDownloadSpeed': {
					el: '#addServerBandwidthMaxDownload',
					preRequirement: isBandwidth,
					constraints: {
						number: [true, 'This is an invalid number.']
					}
				},

				'vnstatPath': {
					el: '#addServerBandwidthVnstatPath',
					preRequirement: isBandwidth,
					constraints: {
						linuxPath: [true, 'This is an invalid linux path.']
					}
				},

				'vnstatDB': {
					el: '#addServerBandwidthVnstatDB',
					preRequirement: isBandwidth,
					constraints: {
						linuxPath: [true, 'This is an invalid linux path.']
					}
				},

				'vnstatInterface': {
					el: '#addServerBandwidthInterface',
					preRequirement: isBandwidth,
					constraints: {
						wordOnly: [true, 'This is an invalid interface name.']
					}
				}
			});
		},

		_removeModal: function () {
			this.viewBandwidthMaxUpload.detach();
			this.viewBandwidthMaxDownload.detach();

			this.remove();
		},

		clearConnectionBtnAndMsg: function () {
			this.$('.test-connection-failed').text('').addClass('hide');
			this.$('.test-connection-success').addClass('hide');
			this.$('.btn-test-connection').removeClass('btn-danger btn-success').addClass('btn-info');
		},

		clickSubmit: function (e) {
			e.preventDefault();

			var server = this.validator.validate()
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
		},

		clickClose: function (e) {
			e.preventDefault();
			$(this.$('.modal')).modal('hide');
			this.view.validate();
		},

		clickAddDrive: function (e) {
			e.preventDefault();

			var model = new ModelDrive();
			model.server = this.model;
			this.model.drives.add(model);
			this.$('#addServerDrivesTable tbody').append(model.view());
		},

		clickServerRemote: function (e) {
			e.preventDefault();

			var self = this, target = $(e.target)
			  , remote = target.data('remote');
			target.blur();

			this.setBtnRemote(remote);
			this.model.set('remote', remote);
		},

		clickSwitch: function (e) {
			e.preventDefault();

			var self = this
			  , target = $(e.target)
			  , model = target.data('model')
			  , value = target.data('value');

			target.blur();

			this.setSwitchBtn(model, value)
			this.model.set(model, value);
		},

		clickTestConnection: function (e) {
			e.preventDefault();

			var self = this, btn = $(e.target)
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
					data: this.model.getServerLogin()
				}).done(function (data) {
					btnAndFields.prop('disabled', false);

					var message = (data.error) ? '<b>Connection Failed!</b> ' + data.message : '';
					btnClass(data.error, message);

					if(data.passphraseRequired) {
						self.passphraseRequired = true;
						self.validator.validate('passphrase');
					}

					if(data.loginSuccessful) {
						btnClass(false, '', true);
					}
				});
			} else {
				btnClass(true, '<b>Validation Failed!</b> Please double check the fields and try again.');
			}
		},

		openModal: function () {
			var self = this;

			$(this.$('.modal')).modal({
				backdrop: 'static'
			}).on('hidden.bs.modal', function (e) {
				self._removeModal();
				$(e.target).remove();
			}).on('shown.bs.modal', function (e) {
				self.$('.icon-drive-total-space').tooltip({
					html: true, placement: 'bottom',
					title: '<b>Optional:</b> Allow you to define the total drive space.'
				});
			});
		},

		render: function () {
			var self = this;

			this.$el.html(TmplModalBody({
				btnText: (this.oldModel) ? 'Update Server' : 'Add Server'
			}))

			this.view.$el.append(this.$el);

			if(this.oldModel) {
				var model = this.oldModel;

				if(this.view.servers.hasLocalhost() && model.get('remote')) {
					this.$('[data-remote="false"].btn-server-location').prop('disabled', true);
				}

				this.setBtnRemote(model.get('remote'));
				if(model.get('authentication') != 'password') {
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

				this.oldModel.drives.each(function (model) {
					self.model.drives.add(model);

					model.server = self.model;
					self.$('#addServerDrivesTable tbody').append(model.view());
				});
			} else {
				if(this.view.servers.hasLocalhost()) {
					this.$('[data-remote="false"].btn-server-location').prop('disabled', true);
					this.setBtnRemote(true);
					this.model.set('remote', true);
				}
			}

			this.viewBandwidthMaxUpload.attach(this.$('#addServerBandwidthMaxUploadBox'));
			this.viewBandwidthMaxDownload.attach(this.$('#addServerBandwidthMaxDownloadBox'));

			this.openModal();
			this.validator.renderDefaults();
		},

		setBtnRemote: function(remote) {
			this.$('.btn-server-location').each(function () {
				if($(this).data('remote') == remote) {
					$(this).addClass('active');
				} else {
					$(this).removeClass('active');
				}
			});

			var self = this
			  , remoteBox = this.$('.remote-server-details')
			  , isVisible = remoteBox.is(':visible');

			if(remote && !isVisible) {
				remoteBox.slideDown();
			} else if(!remote &&isVisible) {
				remoteBox.slideUp({ complete: function () {
					self.clearConnectionBtnAndMsg();
				} });
			}
		},

		setSwitchBtn: function (model, value) {
			this.$('button[data-model="' + model +'"].btn-server-switch').each(function () {
				if($(this).data('value') == value) {
					$(this).addClass('active');
				} else {
					$(this).removeClass('active');
				}
			});
		},

		updateDrivesTable: function () {
			this.$('#addServerDrivesTableNone').css('display', (this.model.drives.length > 0) ? 'none' : '');
		},

		updateErrorBtn: function () {
			var hasErrors = this.model.hasErrors();
			this.$('#addServerBtn')
				.toggleClass('btn-primary', !hasErrors)
				.toggleClass('btn-danger', hasErrors);
		},

		updateMaxUnit: function (key) {
			var self = this;
			return function (value) {
				self.model.set(key, value);
			};
		},

		updateModelAuthentication: function () {
			var self = this
			  , type = this.model.get('authentication')
			  , formPassword = this.$('.server-authentication-password')
			  , formPrivateKey = this.$('.server-authentication-privatekey');

			function closeOthers (callback) {
				var count = 0;
				self.$('.server-authentication').each(function () {
					if($(this).is(':visible')) {
						count += 1;
						$(this).slideUp({
							complete: function () {
								callback && callback();
							}
						})
					}
				});

				if(count == 0) {
					callback && callback();
				}
			}

			if(type == 'password') {
				closeOthers(function () {
					formPassword.slideDown();
				});
			} else if(type == 'privateKey') {
				closeOthers(function () {
					formPrivateKey.slideDown();
				});
			} else {
				closeOthers();	
			}
		},

		toggleBandwidth: function () {
			var enabled = this.model.get('monitorBandwidth')
			  , box = this.$('.server-bandwidth');

			if(enabled) {
				box.slideDown();
			} else {
				box.slideUp();
			}
		},


		validatePassphrase: function (value) {
			this.passphraseRequired = false;
			this.validator.validate('passphrase');
		},

		validateUpdateErrors: function (id, hasError, el, value, msg) {
			if(hasError) {
				this.model.errors.add({id: id, msg: msg});
			} else {
				this.model.errors.remove(id);
			}
		},

		validateSetModel: function (id, value) {
			this.model.set(id, value);
		}
	});
});