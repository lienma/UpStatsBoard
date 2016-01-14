import Backbone  from 'backbone';
import _         from 'underscore';
import Validator from '../utils/validator';

function BaseStep(stepOptions) {
	let containsSubTabs = (stepOptions.subTabsData && stepOptions.subTabsData.length > 0);

	let ViewOptions = {
		tagName: 'div',

		events: {
			'click .btn-previous-step': 'clickPreviousStep',
			'click .btn-next-step': 'clickNextStep'
		},

		initialize: function (options) {
			this.pane = options.pane;
			this.dataSchema = stepOptions.dataSchema || {};
			this.templateVars = stepOptions.templateVars || {};

			this.get = this.model.data.get.bind(this.model.data);
			this.set = this.model.data.set.bind(this.model.data);
			this.isSuccessful = this.model.isSuccessful.bind(this.model);

			this.validator = new Validator({ dataSchema: this.dataSchema, body: this.$el });
			this.listenTo(this.validator, 'error', this.updateErrorModel);
			this.listenTo(this.validator, 'update', (id, value) => {
				this.set(id, value);
			});

			if(containsSubTabs) {
				this.template = TmplSubTabs;
				this.pane._currentSubTab = stepOptions.subTabsData[0].id;

				this.subTabs = new CollectionSubTabs();
				this.listenTo(this.subTabs, 'add', this.buildSubTab);
				this.buildSubTabs();
			} else {
				this.listenTo(this.model.errors, 'update', () => {
					this.updateNextBtnForErrors(this.model.hasErrors());
				});
			}

			this.$el.css('display', 'none');

			if(_.isFunction(stepOptions.initialize)) {
				stepOptions.initialize.call(this);
			}
		},

		updateErrorModel: function (id, hasError, el, value, msg) {
			if(hasError) {
				this.addError(id, msg, el);
			} else {
				this.removeError(id, el);
			}
		},

		currentTab: function () {
			return this.subTabs.get(this.pane._currentSubTab).body;
		},

		buildSubTab: function (model) {
			if(containsSubTabs) {
				model.tab = new TabSubItemView({ model: model, basePane: this.pane, parentPane: this });
				model.body = new (model.get('view'))({ model: model, basePane: this.pane, parentPane: this });
				model.index = this.subTabs.indexOf(model);
			}
		},

		buildSubTabs: function () {
			if(containsSubTabs) {
				this.subTabs.add(stepOptions.subTabsData);
			}
		},

		hasSubTabs: function () {
			return containsSubTabs;
		},

		getTab: function (id) {
			return this.subTabs.get(id);
		},

		clickPreviousStep: function (e) {
			e.preventDefault();
			this.pane.previousStep();
			$(e.target).blur();
		},

		clickNextStep: function (e) {
			e.preventDefault();

			if(this.validate()) {
				this.pane.nextStep();
			} else {
				$(e.target).parent().effect('shake');
			}
			$(e.target).blur();
		},

		nextStep: function () {
			this.pane.nextStep();
		},

		addError: function (id, msg, el) {
			if(!_.isUndefined(el)) {
				el.parents('.form-group').addClass('has-error');
			}
			this.model.errors.add({id: id, msg: msg});
		},

		hasError: function (id) {
			return this.model.hasError(id);
		},

		removeError: function (id, el) {
			if(!_.isUndefined(el)) {
				el.parents('.form-group').removeClass('has-error');
			}
			this.model.errors.remove(id);
		},

		updateNextBtnForErrors: function (hasErrors) {
			let btn = this.$('.btn-next-step');
			btn.toggleClass('btn-danger', hasErrors);
			btn.toggleClass('btn-primary', !hasErrors);

			if(hasErrors) {
				$(btn).tooltip({
					container: 'body',
					placement: 'top',
					title: 'This page contains error(s)',
					trigger: 'hover'
				});
			} else {
				$(btn).tooltip('destroy');
			}
		},

		setCurrentSubTab: function (id) {
			if(containsSubTabs) {
				this.pane._currentSubTab = id;
			}
		},

		setDefaults: function (data) {
			if(containsSubTabs) {
				this.subTabs.setDefaults(data);
			} else {
				this.validator.setDefaults(data);
			}
		},

		render: function () {
			this.$el.html(this.template(this.templateVars));

			if(containsSubTabs) {
				this._currentSub = this.currentTab();
				this.subTabs.render();
				this.subTabs.activateCurrent(this.pane._currentSubTab);
				this.renderSubTabs();

				this.subTabs.renderDefaults();
			} else {
				this.validator.renderDefaults();
			}

			if(_.isFunction(stepOptions.render)) {
				stepOptions.render.call(this);
			}

			if(containsSubTabs) {
				this.subTabs.afterRender();
			} else {
				this.afterRender();
			}

			return this;
		},

		renderSubTabs: function () {
			if(containsSubTabs) {
				var self = this;

				this.subTabs.each(function (model) {

					self.$('ul.wizard-sub-tabs').append(model.tab.$el);
					self.$('.tab-content').append(model.body.$el)
				});

				this.$('.extra-buttons').html(stepOptions.tmplExtraButtons);
			}
		},

		afterRender: function () {

		},

		validate: function () {
			if(containsSubTabs) {

				return this.currentTab().validate();
			} else {
				return this.validator.validate();
			}
		}
	};

	if(stepOptions.events) {
		_.extend(ViewOptions.events, stepOptions.events);
	}

	_.extend(ViewOptions, _.omit(stepOptions, ['initialize', 'events', 'dataSchema', 'render']));

	return Backbone.View.extend(ViewOptions);

}

export default BaseStep;