define(['backbone', 'tmpl!util/view/dropdown-inline'], function (Backbone, TmplDropdown) {

	var View = Backbone.View.extend({
		template: TmplDropdown,

		events: {
			'click a': 'clickAction'
		},

		bindEvents: function (events) {
			this.events = events;
		},

		clickAction: function (e) {
			e.preventDefault();
			this.set($(e.target).data('value'));
		},

		set: function (index) {
			var element = this.$('li a').eq(index);
			this.$('.input-group-dropdown-text').text(element.data('text')).data('value', element.data('value'));
			this.events.trigger('change', index);
		},

		render: function(list) {
			this.$el.html(this.template());

			this.$el.addClass('input-group-btn dropup');

			var ul = this.$('ul');
			list.forEach(function (item, index) {
				var textLong, textShort;
				if(_.isArray(item)) {
					textShort = item[0];
					textLong = item[1];
				} else {
					textLong = item;
					textShort = item;
				}

				var a = $('<a/>').attr('data-value', index).attr('data-text', textShort).text(textLong);
				ul.append($('<li/>').append(a));
			});

			this.set(0);
		}
	});

	return function (listArray, options) {
		var view = new View()
		  , options = options ? options : {}
		  , size = options.size ? options.size : 'normal';


		var ret = {
			attach: function (element) {
				$(element).append(view.$el);
			},

			detach: function () {
				view.remove();
			},

			set: function (index) {
				view.set(index)
			},

			value: function () {
				return view.text.data('value');
			}
		};

		_.extend(ret, Backbone.Events);
		view.bindEvents(ret);

		view.render(listArray);
		view.$('.btn').addClass('btn-' + size);

		return ret;
	};
});