define(['backbone', 'setup/view/page-base', 'setup/view/page-usenet', 'setup/view/page-usenet-sub'], function(Backbone, ViewPageBase, ViewAppPane, ViewServiceSub) {

	return function(wizard) {
		return ViewPageBase(wizard, {
			id: 'usenet',
			page: '#setupUsenet',
			title: 'Usenet App Settings',

			hasSubTabs: true,

			events: {
				'click .wizard-sub-tabs a': 'clickTab',
				'click .btn-app-test': 'clickAppTest'
			},

			initialize: function() {
				var self = this;

				this.btnTestApp 	= this.$('.btn-app-test');
				this.btnTestAppMsg 	= this.$('.btn-app-test-msg');
console.log('step 1')
				this.sabnzbd 		= ViewAppPane(this, 'sabnzbd', '#usenetSabnzbdApp', '#usenetDownloaderAppTab', true, { appBtn: '#usenetSabnzbdAppIcon' });
console.log('step 2')
				this.nzbget 		= ViewAppPane(this, 'nzbget', '#usenetNzbgetApp', '#usenetDownloaderAppTab', true, { appBtn: '#usenetNzbgetAppIcon' });
				this.sonarr 		= ViewAppPane(this, 'sonarr', '#usenetSonarrPage', '#usenetTVShowAppTab', true, { appBtn: '#usenetSonarrAppIcon' });
				this.sickbeard 		= ViewAppPane(this, 'sickbeard', '#usenetSickbeardPage', '#usenetTVShowAppTab', true, { appBtn: '#usenetSickbeardAppIcon' });
				this.couchpotato 	= ViewAppPane(this, 'couchpotato', '#usenetMovieApp', '#usenetMovieAppTab');
				this.headphones 	= ViewAppPane(this, 'headphones', '#usenetMusicApp', '#usenetMusicAppTab');

				ViewServiceSub(this, ['sabnzbd', 'nzbget']);
				ViewServiceSub(this, ['sonarr', 'sickbeard']);

				['sabnzbd', 'nzbget', 'sonarr', 'sickbeard', 'couchpotato', 'headphones'].forEach(function(appName) {
					var app = this[appName];
					this.listenTo(app.model.errors, 'update', function() {
						if(app.hasErrors()) {
							this.addError(appName, 'Usenet App ' + appName + ' contains errors.');
						} else {
							this.removeError(appName);
						}

						this.Model.set('success', (this.Model.errors.size() == 0));
					}.bind(this));

					this.listenTo(app.model, 'change:enabled', this.updateTestAppBtn);
					this.listenTo(app.model, 'change:enabled', this.updateTabForWarning);
				}.bind(this));

				this.listenTo(this.couchpotato.model, 'change:enabled', this.updateMovieAppIcon);
				this.listenTo(this.headphones.model, 'change:enabled', this.updateMusicAppIcon);
			},

			open: function(firstOpen) {
				if(firstOpen){
					this.hasOpened
				} 
			},

			updateTabForWarning: function() {
				var hasWarning = false;

				if(!this.sabnzbd.isEnabled() && !this.nzbget.isEnabled()) {
					hasWarning = true;
				} else if(!this.sonarr.isEnabled() && !this.sickbeard.isEnabled()) {
					hasWarning = true;
				} else if(!this.couchpotato.isEnabled() || !this.headphones.isEnabled()) {
					hasWarning = true;
				}
console.log(hasWarning);
				this.Model.set('warning', hasWarning);
			},

			updateMovieAppIcon: function() {
				this.couchpotato.tabIcon.toggleClass('icos-couchpotato', this.couchpotato.isEnabled());
			},

			updateMusicAppIcon: function() {
				this.headphones.tabIcon.toggleClass('icos-headphones', this.headphones.isEnabled());
			},

			updateTestAppBtn: function() {
				this.btnTestApp.prop('disabled', !this.app().isEnabled());
			},

			updateNextBtn: function() {
				var btn = this.$('.btn-next-page');
				if(this.app().hasErrors()) {
					btn.removeClass('btn-primary').addClass('btn-danger');
					$(btn).tooltip({
						container: 'body',
						placement: 'top',
						title: 'There is an error',
						trigger: 'hover'
					});
				} else {
					btn.addClass('btn-primary').removeClass('btn-danger');
					$(btn).tooltip('destroy');
				}
			},

			resetNextBtn: function() {
				this.$('.btn-next-page').addClass('btn-primary').removeClass('btn-danger').tooltip('destroy');
				this.updateNextBtn();
			},

			resetTestAppBtn: function() {
				var app = this.app();
				if(app) {
					this.btnTestApp.addClass('btn-info').removeClass('btn-danger btn-success');
					this.btnTestAppMsg.removeClass('text-danger').text('');

					var isVisible = this.btnTestApp.css('display') !== 'none';
					if(app.multi) {
						if(app.appSelected) {
							if(!isVisible) {
								this.btnTestApp.fadeIn();
							}
						} else {
							if(isVisible) {
								this.btnTestApp.fadeOut();
							}
						}
					} else {
						if(!isVisible) {
							this.btnTestApp.fadeIn();
						}
					}
					this.updateTestAppBtn();
				}
			},

			clickAppTest: function(e) {
				e.preventDefault();
				this.app().clickTest(this.$('.btn-app-test'), this.$('.btn-app-test-msg'));
			},

			clickTab: function(e) {
				e.preventDefault();
				$(this).tab('show');
			},

			actionValidate: function() {
				return (this.app().isEnabled()) ? this.app().validate() :  true;
			},

			at: function(index) {
				switch(index) {
					case 0:
						return (this.sabnzbd.appSelected) ? this.sabnzbd : this.nzbget;
					case 1:
						return (this.sonarr.appSelected) ? this.sonarr : this.sickbeard;
					case 2:
						return this.couchpotato;
					case 3:
						return this.headphones;
				}
			}
		});
	};
});
