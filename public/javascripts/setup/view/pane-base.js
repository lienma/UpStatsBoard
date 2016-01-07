define([
	'backbone',
	'underscore',

	'setup/view/tab-item'
], function (Backbone, _, TabItemView) {

	var PaneBase = Backbone.View.extend({
		tagName: 'div',

		_currentSubTab: '',

		initialize: function (options) {
			this.wizard = options.wizard;

			this._tab = new TabItemView({ model: this.model, pane: this });
			this._body = new (this.model.get('body'))({ model: this.model, pane: this });

			this.get = this.model.get.bind(this.model);
			this.set = this.model.set.bind(this.model);
		},

		build: function (tab, body) {
			this._tab.render();
			this._body.render();

			$(tab).append(this._tab.$el);
			$(body).append(this._body.$el);
		},

		id: function () {
			return this.model.id;
		},

		isCurrent: function () {
			return this.model.isCurrent();
		},

		isDisabled: function () {
			return this.model.isDisabled();
		},

		close: function (callback) {
			var self = this;
			$(this._body.$el).slideUp({ complete: function () {
				self._body.validate();
				if(!self.model.hasErrors()) {
					self.set('success', true);
				}
				self.set('current', false);
				callback();
			}});
		},

		open: function (id, callback) {
			var self = this;
			this.set('current', true);

			if(id !== '') {
				this._currentSubTab = id;
				this.openAt(id);
			}

			$(this._body.$el).slideDown({ complete: function () {
				self.set('hasOpened', true);
				callback();

				if(self._body.hasSubTabs()) {
					self.wizard.Router.navigate(self.id() + '/' + self._currentSubTab);
				} else {
					self.wizard.Router.navigate(self.id());
				}
			}});
		},

		openAt: function (id) {
			if(this._body.hasSubTabs()) {
				this._body.subTabs.each(function (model) {
					model.tab.$el.removeClass('active');
					model.body.$el.removeClass('in active');
				});

				this._body.subTabs.activateCurrent(id);
			}
		},

		getCurrentTab: function () {
			return this._body.getTab(this._currentSubTab);
		},

		nextStep: function () {
			if(this._body.hasSubTabs()) {
				var index = this.getCurrentTab().index;

				if(index + 1 >= this._body.subTabs.size()) {
					this.wizard.nextStep();
				} else {
					var tabs = this._body.$('.wizard-sub-tabs li a');
					$(tabs[index + 1]).tab('show');
				}
			} else {
				this.wizard.nextStep();
			}
		},

		previousStep: function () {
			if(this._body.hasSubTabs()) {
				var index = this.getCurrentTab().index;

				if(index == 0) {
					this.wizard.previousStep();
				} else {
					var tabs = this._body.$('.wizard-sub-tabs li a');
					$(tabs[index - 1]).tab('show');
				}
			} else {
				this.wizard.previousStep();
			}
		}
	});

	return PaneBase;
});