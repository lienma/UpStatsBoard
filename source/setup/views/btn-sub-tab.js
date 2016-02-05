import $         from 'jquery';
import Backbone  from 'backbone';
import bootstrap from 'bootstrap';
import Template  from '../templates/btn-sub-tab.jade';

class SubTabBtn extends Backbone.View {
	get tagName() { return 'li'; }
	get template() { return Template; }

	initialize(options) {
		this._hasRendered = false;
		this._tabIcon     = '';
		this.apps         = [];
		this.hasTooltip   = false;

		this.model        = options.model;
		this.basePane     = options.basePane;
		this.parentPane   = options.parentPane;

		this.listenTo(this.model.errors, 'update', this.updateTabForErrors);
	}

	setApps(apps) {
		this.apps = apps;
		apps.forEach((app) => {
			this.listenTo(app.model, 'change:enabled', this.updateTabAppIcon);
			this.listenTo(app.model.errors, 'update', this.updateTabForAppErrors);
		});
	}

	setIcon(icon) {
		this._tabIcon = icon;

		if(this._hasRendered) {
			this.$('.tab-app').addClass('icos-' + icon);
		}
	}

	removeIcon(icon) {
		this._tabIcon = '';

		if(this._hasRendered) {
			this.$('.tab-app').removeClass('icos-' + icon);
		}
	}

	get hasErrors() {
		let containsErrors = false;

		if(this.apps.length > 0) {
			this.apps.forEach((app) => {
				if(app.hasErrors) {
					containsErrors = true;
				}
			});
		} else {
			containsErrors = this.model.hasErrors;
		}

		return containsErrors;
	}

	getErrors() {
		let errors = [];

		if(this.apps.length > 0) {
			this.apps.forEach((app) => {
				app.model.errors.each((error) => {
					errors.push(error.get('msg'))
				});
			});
		} else {
			this.model.errors.each((error) => {
				errors.push(error.get('msg'))
			});
		}

		return errors;
	}

	updateErrorsTooltip() {
		if(this.hasErrors) {
			let msgs = ['<b>This app contains errors:</b><ul class="tooltip-errors-list">'];
			this.getErrors().forEach((msg) => {
				msgs.push('<li>' + msg + '</li>');
			})
			msgs.push('</ul>');

			if(this.hasTooltip) {
				$(this.$el).attr('data-original-title', msgs.join(' '));
				$(this.$el).tooltip('fixTitle');
			} else {
				$(this.$el).tooltip({
					container: 'body',
					html: true,
					placement: 'bottom',
					title: msgs.join(' '),
					trigger: 'hover'
				});
			}

			this.hasTooltip = true;
		} else {
			this.hasTooltip = false;
			$(this.$el).tooltip('destroy');
		}
	}

	updateTabForErrors() {
		let isValidate = this.model.body.validate(true);
		this.updateTabClass(isValidate);
	}

	updateTabClass(isValid) {
		let hasErrors = this.hasErrors;
		let link = this.$('a');
		let icon = this.$('.tab-status');

		link.toggleClass('wizard-sub-tabs-error', hasErrors);
		icon.toggleClass('glyphicon-remove', hasErrors);

		if(this.model.body.enabledRequired) {
			isValid = this.model.body.isEnabled;
		}

		link.toggleClass('wizard-sub-tabs-success', isValid);
		icon.toggleClass('glyphicon-ok', isValid);

		this.updateErrorsTooltip();
	}

	updateTabForAppErrors() {
		let hasErrors = this.hasErrors;
		let isEnabled = this.model.body.isEnabled;
		let link = this.$('a');
		let icon = this.$('.tab-status');

		link.toggleClass('wizard-sub-tabs-error', hasErrors);
		icon.toggleClass('glyphicon-remove', hasErrors);

		link.toggleClass('wizard-sub-tabs-success', isEnabled && !hasErrors);
		icon.toggleClass('glyphicon-ok', isEnabled && !hasErrors);

		this.updateErrorsTooltip();
	}

	updateTabAppIcon(model) {
		this.apps.forEach((app) => this.$('.tab-app').toggleClass('icos-' + model.id, model.isEnabled) );
		this.updateTabForErrors(model);
	}

	render() {
		this._hasRendered = true;
		this.$el.prop('role', 'presentation');

		this.$el.html(this.template({
			location: Config.setup.webRoot + '/setup/' + this.basePane.id + '/' + this.model.id,
			target: this.basePane.id + '-' + this.model.id,
			title: this.model.get('title')
		}));

		this.$('a').on('show.bs.tab', (e) => {
			this.basePane._currentSubTab = this.model.id;
			this.basePane.wizard.Router.navigate(this.basePane.id + '/' + this.model.id);
		});

		this.$('a').on('hide.bs.tab', (e) => {
			this.parentPane.currentTab().validate();
		});

		if(this._tabIcon !== '') {
			this.$('.tab-app').addClass('icos-' + this._tabIcon);
		}

		return this;
	}
}

export default SubTabBtn;