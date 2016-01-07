define(['backbone', 'setup/view/page-base', 'setup/view/page/plex-server'], function(Backbone, ViewPageBase, PanePlexServer, ViewSelectLibrary) {

	return function(wizard) {
		return ViewPageBase(wizard, {
			id: 'Plex',
			page: '#setupPlex',
			title: 'Plex Settings',

			hasSubTabs: true,

			initialize: function() {
				//this.setEmpties(['plexUsername', 'plexPassword', 'plexServerHost', 'plexToken']);
				//this.setIf('plexServerPort', 32400);
				//this.setiF('plexServerUseSSL', false);

				this.plexServer = new PanePlexServer({ View: this, el: this.$('#plexMediaServer'), tab: this.$('#plexMediaServerTab') });

				this.listenTo(app.model.errors, 'update', this.updateOnErrors);
			},

			actionValidate: function() {
				var pane = this.app();

				return pane.validate();
			},

			actionValidatePlexServer: function() {
				['Username', 'Password' ,'Host', 'Port', 'DefaultMovie', 'DefaultTVShow', 'DefaultMusic'].forEach(function(func) {
					this['validate' + func].call(this);
				}.bind(this));
				var hasErrors = this.Model.hasErrors();
				//this.Model.set('success', !hasErrors);
				return !hasErrors;
			},

			at: function(index) {
				return this.plexServer;
			},

			isEmpty: function(key) {
				return this.get(key) == '';
			},

			validateUsername: function() {
				var field = this.$('#plexAccountUsername');

				this.plexServer.updateAuthBtn();

				if($.trim(field.val()) == '') {
					this.addError(field, 'Plex.tv username is required.');
				} else {
					this.removeError(field);
				}
			},

			validatePassword: function() {
				var field = this.$('#plexAccountPassword');

				this.plexServer.updateAuthBtn();

				if($.trim(field.val()) == '') {
					this.addError(field, 'Plex.tv password is required.');
				} else {
					this.removeError(field);
				}
			},

			validateHost: function() {
				var field = this.$('#plexMediaServerHost');

				this.plexServer.updateTestBtn();

				if($.trim(field.val()) == '') {
					this.addError(field, 'Host address is required.');
				} else {
					this.removeError(field);
				}
			},

			validatePort: function() {
				var field = this.$('#plexMediaServerPortNumber'), parent = field.parents('.form-group');
				var value = $.trim(field.val());

				this.plexServer.updateTestBtn();
				parent.removeClass('has-warning');

				if(value == '') {
					this.addError('port', 'Port number is required. Plex\'s default port is 32400');
					parent.addClass('has-error');
				} else if(parseInt(value) > 65535) {
					this.addError('portMax', 'Port number is greater than the max port number 65535');
					parent.addClass('has-error');
				} else {
					this.removeError('port');
					this.removeError('portMax');
					parent.removeClass('has-error');
				}
			},

			validateDefaultMovie: function() {
				var field = this.$('#plexDefaultMovie'), value = $.trim(field.val());

				if(value == '' && _.isNaN(parseInt(value))) {
					this.addError(field, 'A default movie library id is required.');
				} else {
					this.removeError(field);
				}
			},

			validateDefaultTVShow: function() {
				var field = this.$('#plexDefaultTVShow'), value = $.trim(field.val());

				if(value == '' && _.isNaN(parseInt(value))) {
					this.addError(field, 'A default tv show library id is required.');
				} else {
					this.removeError(field);
				}
			},

			validateDefaultMusic: function() {
				var field = this.$('#plexDefaultMusic'), value = $.trim(field.val());

				if(value != '' && _.isNaN(parseInt(value))) {
					this.addError(field, 'The default music library id is invalid.');
				} else {
					this.removeError(field);
				}
			}
		});
	};
});
