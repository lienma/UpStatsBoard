define([
	'backbone', 'setup/model/page-base',
], function(Backbone, PageBase) {
	var Data = Backbone.Model.extend();

	return Backbone.Collection.extend({
		model: PageBase,

		currentPage: false,
		inEffect: false,

		initialize: function() {
			this.Data = new Data();

			this.Data.on('change', function(model) {
				var changed = model.changedAttributes();

				console.log('Model Changed:', changed, this.Data.attributes)
			}, this);
		},

		openPrevious: function() {

			var pos = this.indexOf(this.getCurrent());
			var last = this.at(pos - 1).id;
			this.setCurrent(last);
		},

		openNext: function() {
			var self = this;
			this.forEach(function(model) {
				if(!model.isSuccess()) {
					self.setCurrent(model.id)
				}
			});
		},

		setCurrent: function(id) {
			if(this.inEffect) return;
			var self = this;
			var lastCurrent = this.currentPage;
			var currPage = this.get(id).page();

			var slideDown = function() {
				self.get(id).set('hasOpened', true);
				currPage.slideDown({
					complete: function() {
						self.enableBtns();
					}
				});
			};

			this.disableBtns();
			if(this.currentPage) {
				var last = this.get(lastCurrent);
				(last.Page.actionValidate && last.Page.actionValidate())
				last.page().slideUp({ complete: slideDown });
			} else {
				slideDown();
			}

			this.currentPage = id;	
			this.forEach(function(model, i) {
				if(model.id == id) {
					model.set('current', true);
				} else {
					model.set('current', false);
				}
			});
		},

		getCurrent: function() {
			return this.get(this.currentPage);
		},

		enableBtns: function() {
			this.inEffect = false;
			this.forEach(function(model) {
				model.Page.TabView.enableBtn();
			});
		},

		disableBtns: function() {
			this.inEffect = true;
			this.forEach(function(model) {
				model.Page.TabView.disableBtn();
			});
		},

		verify: function() {
			var verify = this.at(this.currentStep).get('verify');

			if(verify()) {
				this.setCurrent(this.currentStep + 1);
			}
		}
	});
});
