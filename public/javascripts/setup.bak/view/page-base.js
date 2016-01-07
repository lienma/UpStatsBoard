define(['backbone', 'underscore','setup/model/page-base', 'setup/view/tab-item', 'jquery-ui', 'bootstrap'], function(Backbone, _, ModelPage, ViewTabItem) {
	function ViewPageBase(Wizard, options) {

		var ViewOptions = {
			el: options.page,

			events: {
				'keypress input': 'checkForEnter',
				'click .btn-previous-page': 'clickPreviousPage',
				'click .btn-next-page': 'clickNextPage'
			},

			currentSubTab: 0,

			initialize: function() {
				var self = this;

				this.Model = new ModelPage({ id: options.id, title: options.title, page: options.page }),
				this.TabView = new ViewTabItem({ model: this.Model, Wizard: Wizard, Page: this });
				this.Model.Page = this;

				this.get = this.Model.get.bind(this.Model);
				this.set = this.Model.set.bind(this.Model);

				Wizard.add(this.Model);

				if(!this.hasSubTabs) {
					this.listenTo(this.Model.errors, 'update', function() {
						var btn = this.$('.btn-next-page, .btn-accept-next');
						if(this.Model.hasErrors()) {
							btn.switchClass('btn-primary', 'btn-danger');

							$(btn).tooltip({
								container: 'body',
								placement: 'top',
								title: 'This page contains errors',
								trigger: 'hover'
							});
						} else {
							btn.switchClass('btn-danger', 'btn-primary')
							$(btn).tooltip('destroy');
						}
					}.bind(this));

					this.currentSubTab = 0;
					var tabs = this.$('.wizard-sub-tabs li a');
					tabs.on('show.bs.tab', function(e) {
						tabs.each(function(index) {
							if($(e.target).attr('id') === $(this).attr('id')) {
								self.currentSubTab = index;
							}
						});

						self.resetNextBtn();
						self.resetTestAppBtn();
					});
				}

				this.$('input').each(function(index) {
					var el = $(this), model = el.data('model-field')
					  , type = el.prop('type'), validate = el.data('model-validate');

					el.on('validate', function() {
						if(validate && self['validate' + validate]) {
							self['validate' + validate].call(self);
						}
					});

					el.on('setModel', function() {
						el.trigger('validate');
						if(!self.hasError(model)) {
							if(type == 'checkbox') {
								self.set(model, el.prop('checked'));
								Wizard.Data.set(model, el.prop('checked'));
							} else if(type == 'text' || type == 'password' || type == 'number') {
								var val = $.trim(el.val());
								self.set(model, _.isNumber(val) ? parseInt(val) : val);
								Wizard.Data.set(model, _.isNumber(val) ? parseInt(val) : val);
							}
						}
					});

					if(model) {
						var eventName = (type == 'checkbox') ? 'change' : 'keyup';
						el.on(eventName, function(e) {
							el.trigger('setModel');
						});

						if(type != 'checkbox') {
							el.on('blur', function(e) {	
								el.trigger('validate');
							});
						}

						if($.trim(el.val()) != '' || el.prop('checked')) {
							el.trigger('setModel');
						} else {
							self.set(model, (type == 'checkbox') ? false : '');
							Wizard.Data.set(model, (type == 'checkbox') ? false : '');
						}
					}
				});

				if(options.initialize) {
					options.initialize.call(this);
				}
			},

			checkForEnter: function(e) {
				if(e.keyCode == '13') {
					e.preventDefault();

					$(e.target).blur();
					if(this.actionValidate && this.actionValidate()) {
						Wizard.openNext();
					}
				}
			},

			clickPreviousPage: function(e) {
				e.preventDefault();
				if(this.hasSubTabs) {
				} else {
					Wizard.openPervious();
				}
			},

			clickNextPage: function(e) {
				e.preventDefault();

				if(this.actionValidate && this.actionValidate()) {
					if(this.hasSubTabs) {
						this.openNextTab(e);
					} else {
						Wizard.openNext();
					}
				} else {
					$(e.target).parent().effect('shake');
				}
			},

			addError: function(id, msg) {
				if(!_.isString(id)) {
					$(id).parents('.form-group').addClass('has-error');
					id = $(id).data('model-field');
				}
				this.Model.errors.add({id: id, msg: msg});
			},

			hasError: function(id) {
				return this.Model.errors.get(id) !== undefined;
			},

			removeError: function(id) {
				if(!_.isString(id)) {
					$(id).parents('.form-group').removeClass('has-error');
					id = $(id).data('model-field');
				}
				this.Model.errors.remove(id);
			},

			setEmpties: function(keys) {
				keys.forEach(function(key) {
					this.set(key, '');
				}.bind(this))
			},

			app: function() {
				return this.at(this.currentSubTab);
			},

			isValidAt: function(index) {
				return this.at(index).validate();
			},

			openNextTab: function(e) {
				e.preventDefault();

				var tabs = this.$('.wizard-sub-tabs li');
				var nextTab = -1;
				for(var i = this.currentSubTab + 1; i < tabs.size(); i++) {
					if(!this.isValidAt(i) && nextTab == -1) {
						nextTab = i;
					}
				}

				if(nextTab == -1) {
					wizard.openNext();
				} else {
					$($(tabs[nextTab]).find('a')).tab('show');
				}
			}
		};

		if(options.events) {
			_.extend(ViewOptions.events, options.events);
		}

		_.extend(ViewOptions, _.omit(options, ['initialize', 'el', 'page', 'title', 'id', 'events']));

		return new (Backbone.View.extend(ViewOptions));
	}

	return ViewPageBase;
});