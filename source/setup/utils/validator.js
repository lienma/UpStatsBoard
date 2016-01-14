import $        from 'jquery';
import _        from 'underscore';
import Backbone from 'backbone';

class Validator {
	constructor(options = {}) {
		_.extend(this, Backbone.Events);
		_.defaults(options, { body: '', dataSchema: {}, displayFormValidation: false});

		this.body = $(options.body);
		this.is = ValidatorMethods;
		this._fieldIsvalid = {};

		this.setDataSchema($.extend(true, {}, options.dataSchema));

		if(options.displayFormValidation) {
			this.on('error', (id, hasError, el, value, msg) => {
				let formGroup = el.parents('.form-group');
				if(hasError) {
					if(formGroup.find('.form-control-feedback').length === 0) {
						let icon = $('<span />').addClass('glyphicon glyphicon-remove form-control-feedback');
						el.after(icon);
						el.tooltip({ container: 'body', title: msg });

						if(el.is(':hover')) {
							el.tooltip('show');
						}
					}
				} else {
					el.tooltip('destroy');
					formGroup.find('.form-control-feedback').remove();
				}
				formGroup.toggleClass('has-error has-feedback', hasError);
			});
		}
	}

	bindToElement(data, id) {
		let el = (data.el) ? data.el : '#' + id;

		this.body.on('keyup blur', 'input[type!=checkbox]' + el + ', textarea' + el, (e) => {
			this.validateItem(id, data);
		});

		this.body.on('click', 'input[type=checkbox]' + el, (e) => {
			this.trigger('update', id, $(e.target).prop('checked'));
		});
	}

	getKeys() {
		return _.keys(this.dataSchema);
	}

	getElement(id) {
		let data = this.dataSchema[id];
		return this.body.find((data.el) ? data.el : '#' + id);
	}

	getValue(id) {
		let element = this.getElement(id);

		if(element.attr('type') === 'checkbox') {
			return element.prop('checked');
		} else {
			return element.val();
		}
	}

	renderDefaults() {
		_.each(this.dataSchema, (data, id) => {
			this.setValue(id, data.default);
		});
	};

	setDataSchema(dataSchema) {
		_.each(dataSchema, (data, id) => {
			this._fieldIsvalid[id] = false;
			this.bindToElement(data, id);
		});

		this.dataSchema = dataSchema;
	}

	setDefaults(defaultData) {
		_.each(defaultData, (value, key) => {
			if(!this.dataSchema.hasOwnProperty(key)) {
				this.dataSchema[key] = {};
			}

			this.dataSchema[key].default = value;
			this.trigger('update', key, value, true);
		});
	}

	setOnlyDefaults(defaultData) {
		this.setDefaults(_.pick(defaultData, this.getKeys()));
	}

	setValue(id, value) {
		var element = this.getElement(id);
		if(element.attr('type') === 'checkbox') {
			return element.prop('checked', value);
		} else {
			return element.val(value);
		}
	}

	validate(id) {
		if(id !== undefined) {
			if(_.isArray(id)) {
				let errorCount = 0;
				id.forEach((item) => {
					errorCount += this.validateItem(item, this.dataSchema[item]) ? 0 : 1;
				});
				return (errorCount === 0);
			} else {
				if(this.dataSchema[id]) {
					return this.validateItem(id, this.dataSchema[id]);
				} else {
// throw an error
throw new Error('ID not found')
				}
			}
		} else {
			let errorCount = 0;
			_.each(this.dataSchema, (data, id) => {
				errorCount += this.validateItem(id, data) ? 0 : 1;
			});
			return (errorCount === 0);
		}
	}

	validateItem(id, data) {
		let hasError = false
		let hasWarning = true;

		let value = this.getValue(id);
		let element = this.getElement(id);
		let constraints = data.constraints;

		let updateEvent = () => { this.trigger('update', id, value); this.trigger('update.' + id, value); errorEvent(); return true }
		let msg = (rule) => { return (_.isArray(rule)) ? rule[1] : constraints.message; }
		let get = (rule) => { return (_.isArray(rule)) ? rule[0] : rule; }
		let errorEvent = () => {
			let errorPresent = _.isString(hasError);
			if(this._fieldIsvalid[id] !== errorPresent || hasError) {
				this._fieldIsvalid[id] = errorPresent;
				this.trigger('error', id, errorPresent, element, value, hasError);
			}
		 };

		if(!_.isObject(constraints)) return updateEvent();
		if(value === '' && !_.has(constraints, 'required') && !_.has(constraints, 'func')) return updateEvent();
		if(data.preRequirement && !data.preRequirement()) return updateEvent();

		if(_.has(constraints, 'required')) {
			let rule = get(constraints.required);

			if(!ValidatorMethods.required.call(null, value, rule)) {
				hasError = msg(constraints.required);
				this.trigger(id + '.error', true, 'required', rule);
			} else {
				this.trigger(id + '.error', false, 'required', rule);
			}
		}

		_.each(_.omit(constraints, ['required', 'message', 'warning']), (constraint, key) => {
			if(hasError) return;

			let rule = get(constraint);
			if(!ValidatorMethods[key].call(null, value, rule)) {
				hasError = msg(constraint);
				this.trigger(id + '.error', true, key, rule);
			} else {
				this.trigger(id + '.error', false, key, rule);
			}
		});

		if(_.isObject(constraints.warning)) {
			if(!hasError) {
				_.each(constraints.warning, (rule, key) => {
					hasWarning =  hasWarning && ValidatorMethods[key].call(null, value, rule);
				});
				this.trigger(id + '.warning', hasWarning);
			} else {
				this.trigger(id + '.warning', false);
			}
		}

		if(!hasError) {
			return updateEvent();
		} else {
			errorEvent();
			return false;
		}
	}
}


const ValidatorMethods = {
	contain: function (value, rule) {
		return value.indexOf(rule) > -1;
	},

	email: function (value) {
		var pattern = /^[a-z0-9\u007F-\uffff!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9\u007F-\uffff!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i;
		return pattern.test(value);
	},

	empty: function (value) {
		return value === '';
	},

	endsWith: function (value, rule) {
		var position = value.length - rule.length;
		return value.indexOf(rule, position) === position;
	},

	equalsEl: function (value, rule) {
		var el = $(rule);

		return el.val() === value;
	},

	func: function (value, rule) {
		return rule(value, this);
	},

	greaterThan: function (value, rule) {
		value = (this.integer(value)) ? parseInt(value) : value.length;
		return value > rule;
	},

	integer: function (value, rule) {
		var rule = rule ? rule : true;
		value = parseInt(value);
		return typeof value === 'number' && isFinite(value) && Math.floor(value) === value && rule;
	},

	ipv4: function (value, rule) {
		var pattern = /^(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)$/i;
		return pattern.test(value) && rule;
	},

	lessThan: function (value, rule) {
		value = (this.integer(value)) ? parseInt(value) : value.length;
		return value < rule;
	},

	linuxPath: function (value, rule) {
		for(var k = 0; k < value.length; k++) {
			if(value.charAt(k).match(/^[\\]$/) ) {
				return !rule;
			}
		}

		if(value.charAt(0) !== '/') return !rule;
		if(value.charAt(0) === '/' && value.charAt(1) === '/') return !rule;
		return rule;
	},

	maxSize: function (value, rule) {
		return this.lessThan(value.length, rule);
	},

	number: function (value, rule) {
		var pattern = /^(\-|\+)?([0-9]+(\.[0-9]+)?|Infinity)$/i;
		return pattern.test(value) && rule;
	},

	portNumber: function (value, rule) {
		return this.integer(value) && this.greaterThan(value, 0) && this.lessThan(value, 65536);
	},

	privateKey: function (value, rule) {
		value = value.trim();
		return this.startsWith(value, '-----BEGIN RSA PRIVATE KEY-----') && this.endsWith(value, '-----END RSA PRIVATE KEY-----')
	},

	required: function (value, rule) {
		if(_.isFunction(value)) {
			return value();
		}
		return !(value === '' && rule);
	},

	startsWith: function (value, rule) {
		return value.indexOf(rule) === 0 && rule;
	},

	wordOnly: function (value, rule) {
		return (this.empty(value) || /^\w+$/i.test(value)) && rule;
	}
};

_.each(ValidatorMethods, (func, key) => {
	ValidatorMethods[key] = ValidatorMethods[key].bind(ValidatorMethods);

	var newKey = key.charAt(0).toUpperCase() + key.slice(1);
	newKey = 'not' + newKey;
	ValidatorMethods[newKey] = (value, rule) => {
		return !func.call(this, value, rule);
	};
});

export default Validator;