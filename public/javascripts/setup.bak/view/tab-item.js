define(['backbone', 'bootstrap'], function(Backbone) {
	return Backbone.View.extend({
		tagName: 'a',

		events: {
			'click a': 'linkClick'
		},

		initialize: function(options) {

			var self = this
			  , model = this.model;

			this.Wizard = options.Wizard;
			this.Page = options.Page;

			this.$el.addClass('btn btn-tab-item');
			this.$el.text(model.get('title'));

			this.$el.click(this.linkClick.bind(this));

			this.listenTo(model, 'change:current', this.updateCurrent);
			this.listenTo(model, 'change:current', this.openPage);
			this.listenTo(model, 'change:warning', this.updateWarning);
			this.listenTo(model.errors, 'update', this.updateTooltip);
		},

		hasOpened: false, 
		openPage: function() {
			if(this.Page.open) {
				this.Page.open(!this.hasOpened);

				if(!this.hasOpened) {
					this.hasOpened = true;
				}
			}
		},

		linkClick: function(e) {
			if(!this.model.get('current')) {
				this.Wizard.setCurrent(this.model.id);
			}
		},

		updateTooltip: function() {

			if(this.model.hasErrors()) {
				$(this.$el).tooltip({
					container: 'body',
					placement: 'bottom',
					title: 'This page contains errors',
					trigger: 'hover'
				});
			} else {
				$(this.$el).tooltip('destroy');
			}
			
			this.updateCurrent();
		},

		resetClass: function() {
			this.$el.removeClass('bti-current bti-success bti-error');
		},

		updateCurrent: function() {
			var link = this.$el;

			this.resetClass();

			if(this.model.isCurrent()) {
				link.addClass('bti-current');
			} else if(this.model.isSuccess()) {
				link.addClass('bti-success');
			} else if(this.model.hasErrors()) {
				link.addClass('bti-error');
			}
		},

		updateWarning: function() {
			var hasWarning = this.model.get('warning');

			//this.$el.toggleClass('bti-warning', hasWarning);
			if(hasWarning) {
				this.resetClass();
			} else {
				this.updateCurrent();
			}
		},

		disableBtn: function() {
			this.$el.addClass('bti-disabled');
		},

		enableBtn: function() {
			this.$el.removeClass('bti-disabled');
		},

		render: function() {
			return this;
		}
	});
});