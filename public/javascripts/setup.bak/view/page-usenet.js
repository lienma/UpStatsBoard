define(['backbone', 'setup/model/page-usenet', 'bootstrap'], function(Backbone, ModelService) {

	function Service(Page, name, body, tab, multi, options) {
		options = options ? options : { };

		var ViewOptions = {
			name: name,
			el: body,
			multi: multi ? true : false,
			appSelected: false,

			events: {
				'click .service-enable': 'updateEnabledModel',
				'click .service-test': 'clickTest',
				'change .service-host': 'updateHostModel',
				'change .service-port': 'updatePortModel',
				'change .service-web-root': 'updateWebRootModel',
				'change .service-api-key': 'updateApiKeyModel',
				'change .service-use-ssl': 'updateSSLModel'
			},

			valid: true,

			initialize: function() {
				this.model = new ModelService({name: name});

				this.tab = $(tab);
				this.tabIcon = $(tab + ' .icos-usenet-app');
				this.tabStatusIcon = $(tab + ' .icos-usenet-app-status');
				this.appBtn = (options.appBtn) ? $(options.appBtn) : false;

				this.listenTo(this.model, 'change:enabled', this.updateEnabledField);
				this.listenTo(this.model, 'change', this.validate);
				this.listenTo(this.model.errors, 'update', this.updateErrors);

				function isEmpty(field) {
					return $.trim(this.$(field).val()) == '';
				}
return;
				if(!isEmpty('.service-host')) {
					this.updateHostModel();
				}

				if(!isEmpty('.service-port')) {
					this.updatePortModel();
				}

				if(!isEmpty('.service-web-root')) {
					this.updateWebRootModel();
				}

				if(!isEmpty('.service-api-key')) {
					this.updateApiKeyModel();
				}

				this.updateSSLModel();
			},

			hasErrors: function() {
				return this.model.errors.size() > 0;
			},

			isEnabled: function() {
				return this.model.isEnabled();
			},

			enableService: function() {
				this.model.set('enabled', true);
			},

			disableService: function() {
				this.model.set('enabled', false);
			},

			clickTest: function(btn, msg) {

				if(!this.validate()) {
					return;
				}

				this.fields.forEach(function(field) {
					self.$(field).parents('.form-group').removeClass('has-warning');
				});

				$.ajax({
					url: Config.WebRoot + '/setup/testApp/' + this.model.get('name'),
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
							this.$('.service-host').parents('.form-group').addClass('has-warning');
						} else if(data.connectionRefused) {
							msg.html('<b>Failed:</b> Connection was refused. Check ip address and port.');
							this.$('.service-host, .service-port').parents('.form-group').addClass('has-warning');
						} else if(data.pathNotFound) {
							msg.html('<b>Failed:</b> Service not found. Possibly wrong web root or ssl?');
							this.$('.service-web-root, .service-use-ssl').parents('.form-group').addClass('has-warning');
						} else if(data.wrongApiKey) {
							msg.html('<b>Failed:</b> Invalid API Key.');
							this.$('.service-api-key').parents('.form-group').addClass('has-warning');
						}
					}
				}.bind(this));
			},

			fields: ['.service-host', '.service-port', '.service-web-root', '.service-api-key', '.service-use-ssl'],

			updateEnabledField: function() {
				this.$('.service-enable').prop('checked', this.model.isEnabled());

				var self = this;
				this.fields.forEach(function(field) {
					self.$(field).prop('disabled', !self.model.isEnabled());
				});

				Page.resetTestAppBtn();
			},

			updateEnabledModel: function() {
				this.model.set('enabled', this.$('.service-enable').prop('checked'));
			},

			updateHostModel: function() {
				this.model.set('host', $.trim(this.$('.service-host').val()));
			},

			updatePortModel: function() {
				this.model.set('port', parseInt($.trim(this.$('.service-port').val())));
			},

			updateWebRootModel: function() {
				this.model.set('webRoot', $.trim(this.$('.service-web-root').val()));
			},

			updateApiKeyModel: function() {
				this.model.set('apiKey', $.trim(this.$('.service-api-key').val()));
			},

			updateSSLModel:  function() {
				this.model.set('useSSL', this.$('.service-use-ssl').prop('checked'));
			},

			updateErrors: function() {
				var icon = $(options.tab + ' .glyphicon');

				if(this.isEnabled() && this.model.errors.size() > 0) {
					this.tab.addClass('wizard-sub-tabs-error');
					this.tabStatusIcon.addClass('glyphicon-remove');
					this.$('.btn-next-page').switchClass('btn-primary', 'btn-danger');

					$(this.tab).tooltip({
						container: 'body',
						placement: 'bottom',
						title: 'There are errors in the settings.',
						trigger: 'hover'
					});
				} else {
					this.tab.removeClass('wizard-sub-tabs-error');
					this.tabStatusIcon.removeClass('glyphicon-remove');
					this.$('.btn-next-page').switchClass('btn-danger', 'btn-primary');

					$(this.tab).tooltip('destroy');					
				}
			},

			validate: function() {
				Page.resetTestAppBtn();

				var errCount = 0;
				['validateHost', 'validatePort', 'validateApiKey'].forEach(function(func) {
					errCount += (this[func]()) ? 0 : 1;
				}.bind(this));

				var tab = $(options.tab), icon = $(options.tab + ' .glyphicon');
				if(this.isEnabled() && errCount == 0) {
					tab.addClass('wizard-sub-tabs-success');
					icon.addClass('glyphicon-ok');
					this.valid = true;
					return true;
				} else {
					tab.removeClass('wizard-sub-tabs-success');
					icon.removeClass('glyphicon-ok');
					this.valid = false;
					return false;
				}
			},

			validateHost: function() {
				var form = this.$('.service-host').parents('.form-group');
				form.removeClass('has-warning');
				if(this.isEnabled() && this.model.get('host') == '') {
					this.model.addError('host', 'IP/Host Address is required for ' + name + '.');
					form.addClass('has-error');
					return false;
				} else {
					this.model.removeError('host');
					form.removeClass('has-error');
					return true;
				}
			},

			validatePort: function() {
				var form = this.$('.service-port').parents('.form-group');
				form.removeClass('has-warning');
				var port = this.model.get('port');
				if(this.isEnabled() && (_.isNaN(port) || port <= 0 || port.toString().length > 5)) {
					this.model.addError('port', 'Port number is required for ' + name + ' & has to be greater than 0.');
					form.addClass('has-error');
					return false;
				} else {
					this.model.removeError('port');
					form.removeClass('has-error');
					return true;
				}
			},

			validateApiKey: function() {
				var form = this.$('.service-api-key').parents('.form-group');
				form.removeClass('has-warning');
				if(this.isEnabled() && this.model.get('apiKey') == '') {
					this.model.addError('apiKey', 'Invalid API Key for ' + name + '.');
					form.addClass('has-error');
					return false;
				} else {
					this.model.removeError('apiKey');
					form.removeClass('has-error');
					return true;
				}
			}
		};


		return new (Backbone.View.extend(ViewOptions));
	}

	return Service;
});