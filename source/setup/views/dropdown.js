import _                from 'underscore';
import Backbone         from 'backbone';
import TmplDropdownView from '../templates/view-dropdown.jade';


class DropdownView extends Backbone.View {
	get template() { return TmplDropdownView; }
	get events() { return { 'click a': 'clickAction' } }

	bindEventClass(eventClass) {
		this.event = eventClass;
	}

	clickAction(e) {
		e.preventDefault();
		this.set($(e.target).data('value'));
	}

	set(index) {
		let element = this.$('li a').eq(index);
		this.$('.input-group-dropdown-text').text(element.data('text')).data('value', element.data('value'));
		this.event.trigger('change', index);
	}

	render(list) {
		this.$el.html(this.template());

		this.$el.addClass('input-group-btn dropup');

		let ul = this.$('ul');
		list.forEach((item, index) => {
			let textLong, textShort;
			if(_.isArray(item)) {
				textShort = item[0];
				textLong = item[1];
			} else {
				textLong = item;
				textShort = item;
			}

			let a = $('<a/>').attr('data-value', index).attr('data-text', textShort).text(textLong);
			ul.append($('<li/>').append(a));
		});

		this.set(0);
	}
}

export default (listArray, options = {}) => {
	let view = new DropdownView()
	  , size = options.size ? options.size : 'normal';

	let ret = {
		attach: (element) => {
			$(element).append(view.$el);
		},

		detach: () => {
			view.remove();
		},

		set: (index) => {
			view.set(index)
		},

		value: () => {
			return view.text.data('value');
		}
	};

	_.extend(ret, Backbone.Events);
	view.bindEventClass(ret);

	view.render(listArray);
	view.$('.btn').addClass('btn-' + size);

	return ret;
};