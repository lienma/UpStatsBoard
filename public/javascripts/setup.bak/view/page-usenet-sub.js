define(['backbone'], function(Backbone) {

	return function(View, Apps) {

		var CurrentSelected = false;

		Apps.forEach(function(AppName) {

			View[AppName].appBtn.click(clickAction);

			View.listenTo(View[AppName].model, 'change:enabled', updateTabIcon);

			View.listenTo(View[AppName].model.errors, 'update', View.updateNextBtn.bind(View));
		});

		function updateTabIcon() {
			Apps.forEach(function(AppName) {
				var App = View[AppName];
				App.tabIcon.toggleClass('icos-' + AppName, App.isEnabled());
			});
		}

		function clickAction(e) {
			e.preventDefault();

			var self = this;
			var target = $(e.target);

			if(target[0].nodeName != 'A') {
				target = target.parent();
			}

			Apps.forEach(function(AppName) {
				var App = View[AppName];
				var isSelected = (App.name == target.data('service'));
				var page = $(App.$el);
				var appBtn = App.appBtn;

				var iconClassName = 'wizard-select-service-selected';

				if(isSelected) {
					if(CurrentSelected === App) {
						page.fadeOut({complete: function() { App.disableService(); }});
						appBtn.removeClass(iconClassName);
						CurrentSelected = false;
						App.appSelected = false;
						View.resetTestAppBtn();
					} else {
						if(CurrentSelected) {
							CurrentSelected.appSelected = false;
							$(CurrentSelected.$el).fadeOut({complete: function() {
								CurrentSelected.disableService();
								CurrentSelected.appBtn.removeClass(iconClassName);
								appBtn.addClass(iconClassName);
								page.fadeIn();
								CurrentSelected = App;
								App.appSelected = true;
								View.resetTestAppBtn();
							}});
						} else {
							page.fadeIn();
							CurrentSelected = App;
							App.appBtn.addClass(iconClassName);
							App.appSelected = true;
							View.resetTestAppBtn();
						}
					}
				}
			});
		}
	}

});