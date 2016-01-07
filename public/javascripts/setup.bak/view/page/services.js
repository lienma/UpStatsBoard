define(['backbone', 'setup/view/page-base', 'app/model/service'], function(Backbone, ViewPageBase, ModelService) {
	var SerivcesCollection = Backbone.Collection.extend({
		model: ModelService
	});


	return function(wizard) {
		return ViewPageBase(wizard, {
			id: 'Services',
			page: '#setupServices',
			title: 'Services',

			events: {
				'click .btn-add-service': 'addService',
				'blur input#serviceAddLabel': 'validateLabel'
			},



			initialize: function() {
				this.services = new SerivcesCollection();

			},

			addService: function(e) {
				e.preventDefault();
				

				var label = this.$('#serviceAddLabel')
				  , host = this.$('#serviceAddHost')
				  , port = this.$('#serviceAddPortNumber')
				  , url = this.$('#serviceAddUrl')
				  , requireLogin = this.$('#serviceAddRequireLogin')
				  , warningTime = this.$('#serviceAddWarning');

				var hasErrors = false;
				if(!this.validateLabel()){
					hasErrors = true;
				}

				if(hasErrors) {

				} else {
					label.val('');
					host.val('');
					port.val('');
					url.val('');
					requireLogin.removeAttr('checked');
					warningTime.val(0);
				}
			},


			validateLabel: function() {
				var field = this.$('input#serviceAddLabel'), parent = field.parents('.form-group');

				if(field.val().length >= 3) {
					parent.removeClass('has-error');
					return true;
				} else {
					parent.addClass('has-error');
					return false;
				}
			}
		});
	};
});
