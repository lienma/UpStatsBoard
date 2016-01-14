import $           from 'jquery';
import Backbone    from 'backbone';
import _           from 'underscore';
import TabItemView from './tab-item';

class BasePane extends Backbone.View {
	get id() { return this.model.id; }
	get isCurrent() { return this.model.isCurrent(); }
	get isDisabled() { return this.model.isDisabled(); }
	get getCurrentTab() { return this._body.getTab(this._currentSubTab); }
	get tagName() { return 'div'; }

	initialize(options) {
		this.wizard = options.wizard;

		let body = this.model.get('body');

		this._tab = new TabItemView({ model: this.model, pane: this });
		this._body = new body({ model: this.model, pane: this });

		this.get = this.model.get.bind(this.model);
		this.set = this.model.set.bind(this.model);
	}

	build(tab, body) {

		this._tab.render();
		this._body.render();

		$(tab).append(this._tab.$el);
		$(body).append(this._body.$el);
	}

	close(callback) {
		$(this._body.$el).slideUp({ complete: () => {
			this._body.validate();
			if(!this.model.hasErrors()) {
				this.set('success', true);
			}
			this.set('current', false);
			callback();
		}});
	}

	open(id, callback) {
		this.set('current', true);

		if(id !== '') {
			this._currentSubTab = id;
			this.openAt(id);
		}

		$(this._body.$el).slideDown({ complete: () => {
			this.set('hasOpened', true);
			callback();

			if(this._body.hasSubTabs()) {
				this.wizard.Router.navigate(this.id + '/' + this._currentSubTab);
			} else {
				this.wizard.Router.navigate(this.id);
			}
		}});
	}

	openAt(id) {
		if(this._body.hasSubTabs()) {
			this._body.subTabs.each((model) => {
				model.tab.$el.removeClass('active');
				model.body.$el.removeClass('in active');
			});

			this._body.subTabs.activateCurrent(id);
		}
	}

	nextStep() {
		if(this._body.hasSubTabs()) {
			let index = this.getCurrentTab().index;

			if(index + 1 >= this._body.subTabs.size()) {
				this.wizard.nextStep();
			} else {
				let tabs = this._body.$('.wizard-sub-tabs li a');
				$(tabs[index + 1]).tab('show');
			}
		} else {
			this.wizard.nextStep();
		}
	}

	previousStep() {
		if(this._body.hasSubTabs()) {
			let index = this.getCurrentTab().index;

			if(index === 0) {
				this.wizard.previousStep();
			} else {
				let tabs = this._body.$('.wizard-sub-tabs li a');
				$(tabs[index - 1]).tab('show');
			}
		} else {
			this.wizard.previousStep();
		}
	}
}

export default BasePane;
