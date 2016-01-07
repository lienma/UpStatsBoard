define([
	'setup/view/step-sub-base',
	'tmpl!setup/step-plex-media-server',
	'setup/view/select-plex-library'
], function (SubStepBase, TmplViewBody, ViewSelectLibrary) {
	var dataSchema = {
		'plexTvUsername': {
			constraints: {
				required: [true, 'A plex.tv username is required.']
			}
		},
		'plexTvPassword': {
			constraints: {
				required: [true, 'A plex.tv password is required.']
			}
		},

		'plexMediaServerHost': {
			constraints: {
				required: [true, 'The host address is required for the media server.']
			}
		},

		'plexMediaServerPortNumber': {
			default: 32400,
			constraints: {
				required: [true, 'The port number is required for the plex media server.'],
				portNumber: [true, 'Invalid port number for the plex media serer.']
			}
		},

		'plexMediaServerSSLEnable': {
			default: false
		},

		'plexDefaultMovie': {
			constraints: {
				required: [true, 'An library id is required for the default movie library.'],
				integer: [true, 'Invalided library id for default movie library.']
			}
		},

		'plexDefaultTVShow': {
			constraints: {
				required: [true, 'An library id is required for the default tv show library.'],
				integer: [true, 'Invalided library id for default movie library.']
			}
		},

		'plexDefaultMusic': {
			constraints: {
				integer: [true, 'Invalided library id for default movie library.']
			}
		},

		'plexMediaServerUseBIF': {
			default: false
		}
	};

	return SubStepBase({

		events: {
			'click .btn-plex-tv-authenication': 'clickAccountAuthenication',
			'click .btn-plex-text-connection': 'clickTestConnection',
			'click .btn-plex-pick-library': 'clickPickLibrary'
		},

		initialize: function (options) {
			this.template = TmplViewBody;

			this.SelectLibrary = new ViewSelectLibrary({ view: this });

			this.setTabIcon('plex');
			this.setDataSchema(dataSchema);

			this.listenToData('change:plexTvUsername', this.updateTestPlexAccountBtn);
			this.listenToData('change:plexTvPassword', this.updateTestPlexAccountBtn);

			this.listenToData('change:plexMediaServerHost', this.updateTestConnectionBtn);
			this.listenToData('change:plexMediaServerPortNumber', this.updateTestConnectionBtn);
			this.listenToData('change:plexMediaServerSSLEnable', this.updateTestConnectionBtn);
		},

		clickAccountAuthenication: function (e) {
			e.preventDefault();

			var self = this
			  , btn = $(e.target).removeClass('btn-success btn-danger').addClass('btn-default')
			  , msg = this.$('.btn-plex-tv-authenication-msg').text('').removeClass('text-success text-danger')
			  , btnAndFields = this.$('.btn-plex-tv-authenication, .plex-tv-account');

			if(this.validator.validate('plexTvUsername') && this.validator.validate('plexTvPassword')) {
				btnAndFields.prop('disabled', true);

				$.ajax({
					url: Config.WebRoot + '/setup/plex/auth',
					method: 'POST',
					data: { username: this.get('plexTvUsername'), password: this.get('plexTvPassword') }
				}).done(function(data) {
					btnAndFields.prop('disabled', false);

					if(data.error) {
						btn.addClass('btn-danger').removeClass('btn-default');
						msg.text(data.error).addClass('text-danger');
					} else if(data.token) {
						btn.addClass('btn-success').removeClass('btn-default');
						msg.text('Successfully authenicated!').addClass('text-success');

						self.set('plexToken', data.token);
					}
				});
			}
		},

		clickTestConnection: function(e) {
			e.preventDefault();

			var self = this
			  , btn = $(e.target).removeClass('btn-success btn-danger').addClass('btn-default')
			  , msg = this.$('.btn-plex-text-connection-msg').text('').removeClass('text-success text-danger')
			  , btnAndFields = this.$('.btn-plex-text-connection, .plex-media-server');

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
				}).done(function (data) {
					btnAndFields.prop('disabled', false);

					if(data.connection) {
						btn.addClass('btn-success').removeClass('btn-default');
						msg.text('Connection was successful!').addClass('text-success');
					} else {
						btn.addClass('btn-danger').removeClass('btn-default');
						msg.addClass('text-danger');
						if(data.hostNotFound) {
							msg.html('<b>Failed:</b> IP/Host Address not found.');
							self.$('#plexMediaServerHost').parents('.form-group').addClass('has-warning');
						} else if(data.connectionRefused) {
							msg.html('<b>Failed:</b> Connection was refused. Check ip address and port.');
							self.$('#plexMediaServerHost, #plexMediaServerPortNumber').parents('.form-group').addClass('has-warning');
						} else if(data.unauthorized) {
							msg.html('<b>Failed:</b> Unauthorized access. Check username and password.');
							self.$('#plexTvUsername, #plexTvPassword').parents('.form-group').addClass('has-warning');
						} else if(data.wrongCredentials) {
							msg.html('<b>Failed:</b> Unabled to retrieve plex token. Check username and password.');
							self.$('#plexTvUsername, #plexTvPassword').parents('.form-group').addClass('has-warning');
						}
					}
				});
			}
		},

		clickPickLibrary: function (e) {
			e.preventDefault();

			var btn = $(e.target), type = btn.data('type');
			this.currentSelectLibraryBtn = btn;
			this.SelectLibrary.open(type);
		},

		selectPlexLibrary: function (id) {
			var btn = this.currentSelectLibraryBtn
			  , field = btn.data('field');

			$('#' + field).val(id);
			this.set(field, id);
		},

		updateTestConnectionBtn: function () {
			var btn = this.$('.btn-plex-text-connection')
			  , msg = this.$('.btn-plex-text-connection-msg')
			  , disabled = (this.get('plexMediaServerHost') == '' || this.get('plexMediaServerPortNumber') == '');
			btn.prop('disabled', disabled).removeClass('btn-success btn-danger').addClass('btn-default');
			msg.text('').removeClass('text-success text-danger');

			this.$('.btn-plex-pick-library').prop('disabled', disabled);

		},

		updateTestPlexAccountBtn: function () {
			var disabled = (this.get('plexTvUsername') == '' || this.get('plexTvPassword') == '');
			this.$('.btn-plex-tv-authenication').prop('disabled', disabled);
		},

		afterRender: function () {
			this.SelectLibrary.render();

			this.$el.append(this.SelectLibrary.$el);

			this.updateTestPlexAccountBtn();
			this.updateTestConnectionBtn();
		}
	});
});
