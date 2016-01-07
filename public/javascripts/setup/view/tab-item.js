define([
	'backbone', , 'bootstrap'
], function (Backbone) {
	return Backbone.View.extend({
		tagName: 'a',

		initialize: function (options) {
			this.pane = options.pane;
			
			this.listenTo(this.model, 'change:current', this.updateCurrent);
			this.listenTo(this.model.errors, 'update', this.updateErrorsTooltip);


			this.$el.click(this.linkClick.bind(this));

			this.build();
		},

		build: function () {
			this.$el.addClass('btn btn-tab-item');
			this.$el.text(this.model.get('title'));
		},

		disableBtn: function() {
			this.$el.addClass('bti-disabled');
		},

		enableBtn: function() {
			this.$el.removeClass('bti-disabled');
		},

		linkClick: function (e) {
			if(!this.pane.isCurrent() && !this.pane.isDisabled()) {
				this.pane.wizard.setCurrentTab(this.pane.id());
			}
		},

		resetClass: function () {
			this.$el.removeClass('bti-current bti-success bti-error');
		},

		updateCurrent: function () {
			var link = this.$el;

			this.resetClass();

			if(this.model.isCurrent()) {
				link.addClass('bti-current');
			} else if(this.model.isSuccessful()) {
				link.addClass('bti-success');
			} else if(this.model.hasErrors()) {
				link.addClass('bti-error');
			}
		},

		hasTooltip: false,
		updateErrorsTooltip: function () {
			if(this.model.hasErrors()) {
				var msgs = ['<b>This page contains errors:</b><ul class="tooltip-errors-list">'];
				this.model.errors.forEach(function (model) {
					msgs.push('<li>' + model.get('msg') + '</li>');
				});
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
			
			this.updateCurrent();
		}
	});
});