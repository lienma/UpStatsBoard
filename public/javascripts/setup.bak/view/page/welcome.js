define(['backbone', 'setup/view/page-base', 'tmpl!setup/welcome-page'], function(Backbone, ViewPageBase, BodyHTML) {

	return function(wizard) {
		return ViewPageBase(wizard, {
			id: 'Welcome',
			page: '#setupWelcome',
			title: 'Welcome',

			events: {
				'click .btn-accept-next': 'clickAction'
			},

			initialize: function() {
				
				this.$el.html(BodyHTML());
			},

			actionValidate: function() {
				if(!this.Model.isSuccess()) {
					this.addError('declinedTOS', 'Must accept thie terms of server.');
					return false;
				}
				return true;
			},

			clickAction: function(e) {
				e.preventDefault();
				this.removeError('declinedTOS');
				this.Model.set('success', true);
				wizard.openNext();
			},

			getData: function() {
				return {
					accepted: this.Model.isSuccess()
				}
			}
		});
	};
});