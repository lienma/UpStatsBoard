define(['backbone', 'setup/view/select-plex-library', 'bootstrap'], function(Backbone, ViewSelectLibrary) {

	return Backbone.View.extend({

		events: {
			'click .btn-plex-tv-auth': 'clickAuth',
			'click .btn-plex-text-conn': 'clickTestConnection',
			'click .btn-plex-pick-library': 'clickPickLibrary'
		},

		initialize: function(options) {
			this.View = options.View;
			this.set = this.View.set.bind(this.View);
			this.get = this.View.get.bind(this.View)

			this.SelectLibrary = new ViewSelectLibrary({View: this});
		},

		isEmpty: function(key) {
			return this.get(key) == '';
		},

		getAjaxData: function() {
			return {
				username: this.get('plexUsername'),
				password: this.View.get('plexPassword'),
				token: this.get('plexToken'),
				host: this.get('plexServerHost'),
				port: this.get('plexServerPort'),
				useSSL: this.get('plexServerUseSSL')
			};
		},

		clickAuth: function(e) {
			e.preventDefault();

			var btn = $(e.target).removeClass('btn-success btn-danger').addClass('btn-default')
			  , msg = this.$('.btn-plex-tv-auth-msg').text('').removeClass('text-success text-danger')
			  , btnAndFields = this.$('.btn-plex-tv-auth, .plex-tv-account');

			this.View.validateUsername();
			this.View.validatePassword();

			if(this.isEmpty('plexUsername') || this.isEmpty('plexPassword')) {
				return;
			}

			btnAndFields.prop('disabled', true);

			$.ajax({
				url: Config.WebRoot + '/setup/plex/auth',
				method: 'POST',
				data: { username: this.get('plexUsername'), password: this.get('plexPassword') }
			}).done(function(data) {

				btnAndFields.prop('disabled', false);

				if(data.error) {
					btn.addClass('btn-danger').removeClass('btn-default');
					msg.text(data.error).addClass('text-danger');
				} else if(data.token) {
					btn.addClass('btn-success').removeClass('btn-default');
					msg.text('Successfully authenicated!').addClass('text-success');

					this.set('plexToken', data.token);
				}
			}.bind(this));
		},

		clickTestConnection: function(e) {
			e.preventDefault();

			var btn = $(e.target).removeClass('btn-success btn-danger').addClass('btn-default')
			  , msg = this.$('.btn-plex-text-conn-msg').text('').removeClass('text-success text-danger')
			  , btnAndFields = this.$('.btn-plex-text-conn, .plex-media-server');

			if(this.isEmpty('plexServerHost') || this.isEmpty('plexServerPort')) {
				return;
			}

			this.$('#plexMediaServerHost, #plexMediaServerPortNumber').parents('.form-group').removeClass('has-warning');

			$.ajax({
				url: Config.WebRoot + '/setup/plex/test',
				method: 'POST',
				data: this.getAjaxData()
			}).done(function(data) {
				if(data.connection) {
					btn.addClass('btn-success').removeClass('btn-info');
					msg.text('Connection was successful!').addClass('text-success');
				} else {
					btn.addClass('btn-danger');
					msg.addClass('text-danger');
					if(data.hostNotFound) {
						msg.html('<b>Failed:</b> IP/Host Address not found.');
						this.$('#plexMediaServerHost').parents('.form-group').addClass('has-warning');
					} else if(data.connectionRefused) {
						msg.html('<b>Failed:</b> Connection was refused. Check ip address and port.');
						this.$('#plexMediaServerHost, #plexMediaServerPortNumber').parents('.form-group').addClass('has-warning');
					} else if(data.unauthorized) {
						msg.html('<b>Failed:</b> Unauthorized access. Check username and password.');
						this.$('#plexAccountUsername, #plexAccountPassword').parents('.form-group').addClass('has-warning');
					} else if(data.wrongCredentials) {
						msg.html('<b>Failed:</b> Unabled to retrieve plex token. Check username and password.');
						this.$('#plexAccountUsername, #plexAccountPassword').parents('.form-group').addClass('has-warning');
					}
				}
			}.bind(this));
		},

		clickPickLibrary: function(e) {
			e.preventDefault();
			var btn = $(e.target);
			this.SelectLibrary.open(btn.data('type'), btn.data('field'));
		},

		updateAuthBtn: function() {
			this.$('.btn-plex-tv-auth').prop('disabled', (this.isEmpty('plexUsername') || this.isEmpty('plexPassword')));
		},

		updateTestBtn: function() {
			this.$('.btn-plex-text-conn, .btn-plex-pick-library').prop('disabled', (this.isEmpty('plexServerHost') || this.isEmpty('plexServerPort')));
		},

		validate: function() {
			return this.View.actionValidatePlexServer();
		}
	});
});