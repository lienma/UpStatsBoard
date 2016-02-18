import Backbone          from 'backbone';
import PasswordFieldTmpl from '../../templates/view-password-field.jade';

class ViewPasswordField extends Backbone.View {
	get template() { return PasswordFieldTmpl; }

	get events() { return {
		'click .password-link': '_click'
	}; }

	get value() {
		return this.AppData.get(this.field);
	}

	initialize(options) {
		this.field = options.field;
		this.AppData = options.AppData;

		this.hidden = true;

		this.listenTo(this.AppData, 'change:' + this.field, this.update);
	}

	_click() {
		this.hidden = this.hidden ? false : true;
		this.$('.password-link').text(this.hidden ? 'Show' : 'Hide');
		this.update();
	}

	update() {
		let password = this.value;

		if(this.hidden) {
			password = password.split('').map(() => {
				return $('<i />').addClass('glyphicon glyphicon-asterisk smaller');
			});
		}

		this.$('.password').html(password);
	}

	render() {
		this.$el.html(this.template());
		this.update();
	}
}

export default ViewPasswordField;