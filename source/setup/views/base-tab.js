import _                 from 'underscore';
import jqueryui          from 'jquery-ui';
import Backbone          from 'backbone';
import Validator         from '../utils/validator';
import TemplateSubTabs   from '../templates/view-wizard.jade';
import CollectionSubTabs from '../collections/sub-tabs';
import ViewSubTabBtn     from '../views/btn-sub-tab';
import Notify            from '../utils/notify';

function BaseTab(stepOptions) {
	const ContainsSubTabs = (stepOptions.SubTabs && stepOptions.SubTabs.length > 0);

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
			this.AppData = options.AppData;

			this.get = this.model.data.get.bind(this.model.data);
			this.set = this.model.data.set.bind(this.model.data);

			this.validator = new Validator({ dataSchema: this.dataSchema, body: this.$el });
			this.listenTo(this.validator, 'error', this.updateErrorModel);
			this.listenTo(this.validator, 'update', (id, value) => this.set(id, value) );

			_.each(this.dataSchema, (data, id) => {
				let def = data.default;
				def = (def === undefined) ? '' : def;
				this.set(id, def);
				this.AppData.set(id, def);
			});

			if(ContainsSubTabs) {
				this.template = TemplateSubTabs;
				this.pane._currentSubTab = stepOptions.SubTabs[0].id;

				this.subTabs = new CollectionSubTabs();
				this.listenTo(this.subTabs, 'add', this.buildSubTab);
				this.buildSubTabs();
			} else {
				this.listenTo(this.model.errors, 'update', () => {
					this.updateNextBtnForErrors(this.model.hasErrors);
				});
			}

			this.$el.css('display', 'none');

			if(_.isFunction(stepOptions.initialize)) {
				stepOptions.initialize.call(this);
			}
		},

		isSuccessful: function() {
			return this.model.isSuccessful;
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
			if(ContainsSubTabs) {
				let View = model.get('view');
				let data = { model: model, basePane: this.pane, parentPane: this };
				model.tab = new ViewSubTabBtn(data);
				model.body = new View(data);
				model.index = this.subTabs.indexOf(model);
			}
		},

		buildSubTabs: function () {
			if(ContainsSubTabs) {
				this.subTabs.add(stepOptions.SubTabs);
			}
		},

		hasSubTabs: function () {
			return ContainsSubTabs;
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

			let btn = $(e.target);
			let valid = (ContainsSubTabs) ? this.currentTab().validate() : this.validate();


			if(valid) {
				this.pane.nextStep();
			} else {
				Notify.failed('Validation failed. Check fields and try again.');
			}
			btn.blur();
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
			if(ContainsSubTabs) {
				this.pane._currentSubTab = id;
			}
		},

		setDefaults: function (data) {
			if(ContainsSubTabs) {
				this.subTabs.setDefaults(data);
			} else {
				this.validator.setDefaults(data);
			}
		},

		render: function () {
			this.$el.html(this.template(this.templateVars));

			if(ContainsSubTabs) {
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

			if(ContainsSubTabs) {
				this.subTabs.afterRender();
			} else {
				this.afterRender();
			}

			return this;
		},

		renderSubTabs: function () {
			if(ContainsSubTabs) {
				this.subTabs.each((model) => {
					this.$('ul.wizard-sub-tabs').append(model.tab.$el);
					this.$('.tab-content').append(model.body.$el)
				});

				this.$('.extra-buttons').html(stepOptions.tmplExtraButtons);
			}
		},

		afterRender: function () {

		},

		validate: function () {
			if(ContainsSubTabs) {

				return this.subTabs.validate();
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

export default BaseTab;