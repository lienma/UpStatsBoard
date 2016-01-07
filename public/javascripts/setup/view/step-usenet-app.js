define([
	'backbone', 'underscore',
	'util/validator',
	'setup/model/usenet-app',
	'tmpl!setup/step-usenet-app'
], function (Backbone, _, Validator, AppModel, TmplUsenetApp) {

	var dataSchema = {
		'enabled': {
			el: '.app-enable'
		},

		'host': {
			el: '.app-host',
			constraints: {
				required: [true, 'A host address is required.']
			}
		},

		'port': {
			el: '.app-port',
			constraints: {
				message: 'Invalid port number.',
				required: [true, 'A port address is required.'],
				portNumber: true
			}
		},

		'webRoot': {
			el: '.app-web-root'
		},

		'apiKey': {
			el: '.app-api-key',
			constraints: {
				message: 'A api key is required.',
				required: true
			}
		},

		'useSSL': {
			el: '.app-use-ssl'
		}
	};

	function App(AppOptions) {

		var ViewOptions = {

			events: {
				'click .app-enable': 'updateEnabledModel',
			},

			initialize: function () {
				var self = this;

				this.id = AppOptions.id;
				this.title = AppOptions.title;
				this.model = new AppModel({id: AppOptions.id});
				this.validator = new Validator({ dataSchema: dataSchema, body: this.$el });

				this.validator.on('error', function (id, hasError, el, value, msg) {
					if(hasError) {
						self.addError(id, msg, el);
					} else {
						self.removeError(id, el);
					}
				});

				this.validator.on('update', function (id, value) {
					self.model.set(id, value);
				});

				this.listenTo(this.model, 'change:enabled', this.updateEnabledField);
			},

			isEnabled: function () {
				return this.model.isEnabled();
			},

			isSelected: function () {
				return this.model.get('selected');
			},

			clickTestConnection: function(btn, msg) {
				var self = this;
				if(this.isEnabled()) {
					if(!this.validator.validate()) return;

					this.fields.forEach(function(field) {
						self.$(field).parents('.form-group').removeClass('has-warning');
					});

					$.ajax({
						url: Config.WebRoot + '/setup/usenet/test/' + this.model.id,
						method: 'POST',
						data: this.model.attributes
					}).done(function(data) {
						btn.removeClass('active');
						if(data.connection) {
							btn.addClass('btn-success').removeClass('btn-info');
							msg.text('Connection was successful!').addClass('text-success');
						} else {
							btn.addClass('btn-danger');
							msg.addClass('text-danger');
							if(data.hostNotFound) {
								msg.html('<b>Failed:</b> IP/Host Address not found.');
								self.$('.app-host').parents('.form-group').addClass('has-warning');
							} else if(data.connectionRefused) {
								msg.html('<b>Failed:</b> Connection was refused. Check ip address and port.');
								self.$('.app-host, .app-port').parents('.form-group').addClass('has-warning');
							} else if(data.pathNotFound) {
								msg.html('<b>Failed:</b> Service not found. Possibly wrong web root or ssl?');
								self.$('.app-web-root, .app-use-ssl').parents('.form-group').addClass('has-warning');
							} else if(data.wrongApiKey) {
								msg.html('<b>Failed:</b> Invalid API Key.');
								self.$('.app-api-key').parents('.form-group').addClass('has-warning');
							}
						}
					});
				}
			},

			close: function (callback) {
				var self = this;
				$(this.$el).fadeOut({ complete: function () {
					self.model.set('enabled', false);
					self.model.set('selected', false);
					callback();
				} });
			},

			open: function () {
				var self = this;
				$(this.$el).fadeIn({ complete: function () {
					self.model.set('selected', true);
				} });
			},

			fields: ['host', 'port', 'web-root', 'api-key', 'use-ssl'],

			updateEnabledField: function () {
				var isEnabled = this.isEnabled();
				this.$('.app-enable').prop('checked', isEnabled);

				var self = this;
				this.fields.forEach(function (field) {
					self.$('.app-' + field).prop('disabled', !isEnabled);
				});

				this.validator.validate();
			},

			updateEnabledModel: function () {
				this.model.set('enabled', this.$('.app-enable').prop('checked'));
			},

			addError: function (id, msg, el) {
				if(!_.isUndefined(el)) {
					el.parents('.form-group').addClass('has-error');
				}
				this.model.errors.add({id: id, msg: msg});
			},

			removeError: function (id, el) {
				if(!_.isUndefined(el)) {
					el.parents('.form-group').removeClass('has-error');
				}
				this.model.errors.remove(id);
			},

			hasErrors: function () {
				return this.model.errors.size() > 0;
			},

			render: function () {
				var tmplObj = {
					id: 'usenet-' + AppOptions.id,
					title: AppOptions.title,
					default_port: AppOptions.defaultPort,
					apiUiLocation: AppOptions.apiUiLocation
				};
				this.$el.html(TmplUsenetApp(tmplObj));

				return this;
			},

			renderDefaults: function () {
				this.validator.renderDefaults();
			},

			setDefaults: function(defaultData) {
				this.validator.setDefaults(defaultData);
			},

			validate: function () {
				if(this.isEnabled()) {
					return !this.validator.validate();
				}
				return true;
			}
		};

		return new (Backbone.View.extend(ViewOptions));
	}

	return App;
});