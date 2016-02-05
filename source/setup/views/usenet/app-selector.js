import Backbone       from 'backbone';
import ViewSelectItem from './app-selector-item';
import Template       from '../../templates/usenet-app-select.jade';

class AppSelectorView extends Backbone.View {
	get template() { return Template; }

	initialize(options) {
		this.apps = options.apps;
		this.parentPane = options.parentPane;
		this.title = options.title;

		this.apps.forEach((app) => {

			this[app.id] = new ViewSelectItem({
				app: app,
				parentPane: this,
				id: app.id,
				location: [Config.setup.webRoot, 'setup', this.parentPane.basePane.id, this.parentPane.model.id, app.id].join('/'),
				title: app.title
			});
			this[app.id].app = app;
		});
	}

	selectApp(id) {
		let app = this[id];

		if(this._currentApp === app) {
			app.app.close(() => this._currentApp = false );
		} else {
			if(this._currentApp) {
				this._currentApp.app.close(() => {
					this._currentApp = this[id];
					app.app.open();
				});
			} else {
				this._currentApp = this[id];
				app.app.open();
			}
		}
	}

	render() {
		this.$el.html(this.template({ title: this.title }));

		this.apps.forEach((app) => {
			let appView = this[app.id];
			appView.render();
			this.$('.wizard-select-services').append(appView.$el);
		});

		return this;
	}

}

export default AppSelectorView;
