define(['backbone', 'setup/view/page-base'], function(Backbone, ViewPageBase) {

	return function(wizard) {
		return ViewPageBase(wizard, {
			id: 'AppSettings',
			page: '#setupApp',
			title: 'App Settings',

			events: {
				'change input#adminPassword': 'validatePassword',
				'change input#adminPasswordConfrim': 'validatePasswordConfrim',
			},

			initialize: function() {

			},

			getData: function() {
				return {
					bindAddress: this.$('input#appBindAddress').val(),
					portNumber: this.$('input#appPortNumber').val(),
					webRoot: this.$('input#appWebRoot').val(),
					logHttpRequests: this.$('input#appLogHttpRequests').val(),

				};
			},

			actionValidate: function() {

				['BindAddress', 'PortNumber', 'Email', 'Username', 'Password', 'PasswordConfrim'].forEach(function(func) {
					this['validate' + func].call(this);
				}.bind(this));

				this.Model.set('success', !this.Model.hasErrors());
				return !this.Model.hasErrors();
			},

			validateBindAddress: function() {
				var field = this.$('#appBindAddress');

				var pattern = /^(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)$/i;
				if(pattern.test(field.val())) {
					this.removeError(field);
				} else {
					this.addError(field, 'Invalid binding address. IPv4 Only.');
				}
			},

			validatePortNumber: function() {
				var field = this.$('#appPortNumber'), parent = field.parents('.form-group');

				var port = parseInt(field.val());
				if(_.isNumber(port) && port.toString().length <= 5) {
					if(port <= 1024) {
						parent.addClass('has-warning');
						this.$('#appPortNumberHelpNote').addClass('bold');
					} else {
						parent.removeClass('has-warning');
						this.$('#appPortNumberHelpNote').removeClass('bold');
					}
					this.removeError(field);
				} else {
					parent.removeClass('has-warning');
					this.addError(field, 'Invalid Port Number. Max 8 numbers.');
				}
			},

			validateEmail: function() {
				var field = this.$('#adminEmail');

				var pattern = /^([a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+(\.[a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)*|"((([ \t]*\r\n)?[ \t]+)?([\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*(([ \t]*\r\n)?[ \t]+)?")@(([a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.)+([a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.?$/i;
				if(pattern.test(field.val())) {
					this.removeError(field);
				} else {
					this.addError(field, 'Invalid Email Address.');
				}
			},

			validateUsername: function() {
				var field = this.$('#adminUsername');

				if(field.val().length >= 3) {
					this.removeError(field);
				} else {
					this.addError(field, 'Invalid username.');
				}
			},

			validatePassword: function() {
				var pass = this.$('#adminPassword'), passp = pass.parents('.form-group')
				  , conf = this.$('#adminPasswordConfirm'), confp = conf.parents('.form-group');

				if(pass.val().length < 6) {
					passp.addClass('has-error');
					this.addError('password', 'Invalid password requirements');
				} else {
					passp.removeClass('has-error');
					this.removeError('password');

					if(conf.val() != '') {
						if(pass.val() == conf.val()) {
							confp.removeClass('has-error');
							this.removeError('passwordConfirm')
						} else {
							confp.addClass('has-error');
							this.addError('passwordConfirm', 'Confirmation password did not match password');
						}
					}
				}
			},

			validatePasswordConfrim: function() {
				var pass = this.$('#adminPassword'), passp = pass.parents('.form-group')
				  , conf = this.$('#adminPasswordConfirm'), confp = conf.parents('.form-group');

				if(conf.val() == '' || conf.val() != pass.val()) {
					confp.addClass('has-error');
					this.addError('passwordConfirm', 'Confirmation password did not match password');
				} else {
					confp.removeClass('has-error');
					this.removeError('passwordConfirm')
				}
			}
		});
	};
});
