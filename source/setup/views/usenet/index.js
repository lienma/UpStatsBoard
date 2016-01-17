import _               from 'underscore';
import BaseTab         from '../base-tab';
import TemplateButtons from '../../templates/usenet-extra-buttons.jade';
import DownloadersView from './downloaders';
import TVShowsView     from './tvshows';
import MoviesView      from './movies';
import MusicsView      from './music';

export default BaseTab({
	templateVars: { title: 'Supported Usenet Apps' },
	tmplExtraButtons: TemplateButtons,
	SubTabs: [
		{ id: 'downloader', title: 'Downloader App', view: DownloadersView },
		{ id: 'tvshow',     title: 'TV Show App',    view: TVShowsView },
		{ id: 'movie',      title: 'Movie App',      view: MoviesView },
		{ id: 'music',      title: 'Music App',      view: MusicsView },
	],

	events: {
		'click .btn-app-test': 'clickTestConnection'
	},

	initialize: function() {
		this.setCurrentSubTab('downloader');

		this.subTabs.each((pane) => {
			if(!pane.body.apps) return;

			pane.body.apps.forEach((app) => {
				this.listenTo(app.model, 'change:enabled', this.updateTestConnectionBtn);
				this.listenTo(app.model, 'change:selected', (model) => {
					if(model.isSelected) {
						this.resetTestConnectionBtn();
					}
				});

				this.listenTo(app.model.errors, 'update', this.updateOnErrors);
			});
		});
	},

	afterOpen: function () {
		let extras = this.$('.extra-buttons');
		if(extras.css('display') === 'none') {
			extras.fadeIn();
		}
	},

	hasApps: function() {
		return _.isObject(this.currentTab().app);
	},

	updateOnErrors: function() {
		this.currentTab().model.errors.set(this.currentTab().app.model.errors.models);
	},

	clickTestConnection: function(e) {
		e.preventDefault();
		this.currentTab().app.clickTestConnection(this.$('.btn-app-test'), this.$('.btn-app-test-msg'));
	},

	updateTestConnectionBtn: function() {
		let isAppDisabled = (this.hasApps()) ? !this.currentTab().app.isEnabled : false;
		this.$('.btn-app-test').prop('disabled', isAppDisabled);
	},

	setDefaults: function(data) {
		this.subTabs.each((tab) => {
			tab.body.setDefaults(data);
		});
	},

	renderDefaults: function() {
		this.subTabs.each((tab) => {
			tab.body.renderDefaults();
		});
	},

	resetNextStepBtn: function() {
		let app = this.currentTab();
		if(this.hasApps()) {
			app = app.app;
		}

		this.updateNextBtnForErrors(app.hasErrors);
	},

	resetTestConnectionBtn: function() {
		let tab = this.currentTab();
		let btn = this.$('.btn-app-test');
		let msg = this.$('.btn-app-test-msg');
		let extras = this.$('.extra-buttons');

		btn.addClass('btn-info').removeClass('btn-danger btn-success');
		msg.removeClass('text-danger').text('');

		const isVisible = extras.css('display') !== 'none';

		if(this.hasApps()) {
			if(tab.hasMultipleApps) {
				if(tab.app.isSelected) {
					if(!isVisible) {
						extras.fadeIn();
					}
				} else {
					if(isVisible) {
						extras.fadeOut();
					}
				}
			} else {
				if(!isVisible) {
					extras.fadeIn();
				}
			}
		} else {
			if(isVisible) {
				extras.fadeOut();
			}
		}

		this.updateTestConnectionBtn();
	},

	render: function() {
		this.subTabs.each((model) => {
			model.tab.$('a').on('show.bs.tab', (e) => {
				this.resetNextStepBtn();
				this.resetTestConnectionBtn();
			});
		});
	}
});