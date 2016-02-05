import $         from 'jquery';
import Backbone  from 'backbone';
import bootstrap from 'bootstrap';

class SelctorItemView extends Backbone.View {
	get tagName() { return 'a' }

	initialize(options) {
		this.parentPane = options.parentPane;
		this.id         = options.id;
		this.location   = options.location;
		this.title      = options.title;
		this.app        = options.app;

		this.$el.click(this.click.bind(this));
		this.listenTo(this.app.model, 'change:selected', this.updateSelected);
	}

	click(e) {
		e.preventDefault();
		this.parentPane.selectApp(this.id);
	}

	toggleClass(hasClass) {
		this.$el.toggleClass('wizard-select-service-selected', hasClass);
	}

	updateSelected(model) {
		this.toggleClass(model.get('selected'));
	}

	render() {
		let icon = $('<span />').addClass('icos icos-72 icos-' + this.id);
		this.$el.addClass('wizard-select-service').attr('href', this.location).append(icon);

		$(this.$el).tooltip({
			container: 'body',
			title: this.title,
			trigger: 'hover'
		});
		return this;
	}
}

export default SelctorItemView;