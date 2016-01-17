import _               from 'underscore';
import ViewSubTab     from '../base-sub-tab';
import AppView         from './app';
import ViewAppSelector from './app-selector';

export default (apps, title = '') => {
	let Apps = [];
	apps.forEach((app) => {
		let App = new AppView(app);
		Apps.push(App);
	});


	class UsenetBase extends ViewSubTab {
		get enabledRequired() { return true; }

		initialize(options) {
			super.initialize(options);

			this._currentApp = Apps[0];
			this.addApps(Apps);
			this.apps = Apps;

			Apps.forEach((app) => {
				app.parentPane = this;
				this.listenTo(app.model.errors, 'update', this.updateErrorsModel);
				this.listenTo(app.model, 'change:selected', this.updateCurrent);
			});

			if(this.hasMultipleApps) {
				this.appSelector = new ViewAppSelector({ apps: Apps, parentPane: this, title: title });
			}
		}

		get app() { return this.getApp(this._currentApp.id); }
		get hasMultipleApps () { return Apps.length > 1; }

		getApp(id) {
			let _app = false;

			Apps.forEach((app) => {
				if(!_.isBoolean(_app)) return;

				if(id === app.id) {
					_app = app;
				}
			});
			return _app;
		}

		get isEnabled() {
			let enabled = false;

			Apps.forEach((app) => {
				if(app.isEnabled) {
					enabled = true;
				}
			});

			return enabled;
		}

		setDefaults(defaults) {
			Apps.forEach((app) => {

				if(defaults.hasOwnProperty(app.id)) {
					app.setDefaults(defaults[app.id]);
				}
			});
		}

		updateCurrent(model) {
			if(model.isSelected) {
				this._currentApp = this.getApp(model.id);
			} else {
				this.parentPane.resetTestConnectionBtn();
			}
		}

		updateErrorsModel() {
			let hasErrorApp = false;
			Apps.forEach((app) => {
				if(app.hasErrors) {
					hasErrorApp = app;
				}
			});

			if(_.isObject(hasErrorApp)) {
				this.parentPane.addError(this.model.id, hasErrorApp.title + ' app has error(s).');
			} else {
				this.parentPane.removeError(this.model.id);
			}
		}

		render() {
			if(this.hasMultipleApps) {
				this.appSelector.render();
				this.$el.append(this.appSelector.$el);
			}

			Apps.forEach((app) => {
				app.render();

				if(this.hasMultipleApps) {
					app.$el.css('display', 'none');
				}

				this.$el.append(app.$el);
			});

			return this;
		}

		renderDefaults() {
			Apps.forEach((app) => app.renderDefaults() );
		}

		validate() {
			return this.app.validate();
		}
	}

	return UsenetBase;
};