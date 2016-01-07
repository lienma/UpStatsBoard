define([
	'backbone',
	'bootstrap',
	'underscore',
	'util/validator'
], function (Backbone, bootstrap, _, Validator) {
	function SubStepBase(stepOptions) {
		var ViewOptions = {
			tagName: 'div',

			events: {

			},

			initialize: function (options) {
				var self = this;

				this.basePane = options.basePane;
				this.parentPane = options.parentPane;

				this.get = this.model.data.get.bind(this.model.data);
				this.set = this.model.data.set.bind(this.model.data);

				this.validator = new Validator({ body: this.$el, displayFormValidation: true });
				this.validator.on('error', function (id, hasError, el, value, msg) {
					if(hasError) {
						self.addError(id, msg, el);
					} else {
						self.removeError(id, el);
					}
				});

				this.validator.on('update', function (id, value) {
					self.set(id, value);
				});

				this.$el.addClass('tab-pane fade');
				this.$el.prop('role', 'tabpanel');
				this.$el.attr('id', options.basePane.id() + '-' + this.model.id)

				this.listenTo(this.model.errors, 'update', function () {
					self.parentPane.updateNextBtnForErrors(this.model.hasErrors());
					self.updateErrorsModel();
				})

				if(_.isFunction(stepOptions.initialize)) {
					stepOptions.initialize.call(this, options);
				}
			},

			listenToData: function (eventName, callback) {
				this.listenTo(this.model.data, eventName, callback);
			},

			addApps: function (apps) {
				this.model.tab.setApps(apps);
			},

			setTabIcon: function (icon) {
				this.model.tab.setIcon(icon);
			},

			setDataSchema: function (data) {
				this.dataSchema = data;
				this.validator.setDataSchema(data);
			},

			setDefaults: function (data) {
				this.validator.setDefaults(data);
			},

			updateErrorsModel: function () {
				if(this.model.hasErrors()) {
					this.parentPane.addError(this.model.id, this.model.get('title') + ' has error(s).');
				} else {
					this.parentPane.removeError(this.model.id);
				}
			},

			open: function (callback) {
				var self = this;
				this.model.set('current', true);
			},

			toggleError: function (id, msg, hasErr) {
				if(hasErr) {
					this.addError(id, msg);
				} else {
					this.removeError(id);
				}
			},

			addError: function (id, msg) {
				this.model.errors.add({id: id, msg: msg});
			},

			removeError: function (id) {
				this.model.errors.remove(id);
			},

			render: function () {
				this.$el.html(this.template());
				return this;
			},

			renderDefaults: function () {
				this.validator.renderDefaults();
			},

			afterRender: function () {

			},

			validate: function () {
				return this.validator.validate();
			}
		};


		if(stepOptions.events) {
			_.extend(ViewOptions.events, stepOptions.events);
		}

		_.extend(ViewOptions, _.omit(stepOptions, ['initialize', 'events', 'dataSchema']));

		return Backbone.View.extend(ViewOptions);
	}

	return SubStepBase;
});