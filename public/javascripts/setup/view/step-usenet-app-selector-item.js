define(['backbone', 'bootstrap'], function (Backbone) {

	return Backbone.View.extend({
		tagName: 'a',

		initialize: function (options) {
			this.parentPane = options.parentPane;
			this.id = options.id;
			this.location = options.location;
			this.title = options.title;

			this.$el.click(this.click.bind(this));
		},

		click: function (e) {
			e.preventDefault();
			this.parentPane.selectApp(this.id);
		},

		toggleClass: function(hasClass) {
			this.$el.toggleClass('wizard-select-service-selected', hasClass);
		},

		render: function () {
			var icon = $('<span />').addClass('icos icos-72 icos-' + this.id);
			this.$el.addClass('wizard-select-service').attr('href', this.location).append(icon);

			$(this.$el).tooltip({
				container: 'body',
				title: this.title,
				trigger: 'hover'
			});
			return this;
		}
	});
});