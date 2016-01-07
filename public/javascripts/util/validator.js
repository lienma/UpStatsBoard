define(['backbone', 'underscore'], function (Backbone, _) {
	function Validator (options) {
		_.extend(this, Backbone.Events);

		_.defaults(options, {
			body: '',
			dataSchema: {},
			displayFormValidation: false
		});

		this.body = $(options.body);

		this.is = Validator.is;
		this._fieldIsvalid = {};

		this.setDataSchema(jQuery.extend(true, {}, options.dataSchema));

		if(options.displayFormValidation) {
			this.on('error', function (id, hasError, el, value, msg) {
				var formGroup = el.parents('.form-group');
				if(hasError) {
					if(formGroup.find('.form-control-feedback').length == 0) {
						var icon = $('<span />').addClass('glyphicon glyphicon-remove form-control-feedback');
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

	Validator.prototype.getKeys = function () {
		return _.keys(this.dataSchema);
	};

	Validator.prototype.getElement = function (id) {
		var data = this.dataSchema[id];
		return this.body.find((data.el) ? data.el : '#' + id);
	};

	Validator.prototype.getValue = function (id) {
		var element = this.getElement(id);

		if(element.attr('type') == 'checkbox') {
			return element.prop('checked');
		} else {
			return element.val();
		}
	};

	Validator.prototype.setValue = function (id, value) {
		var element = this.getElement(id);
		if(element.attr('type') == 'checkbox') {
			return element.prop('checked', value);
		} else {
			return element.val(value);
		}
	};

	Validator.prototype.setDefaults = function (defaultData) {
		var self = this;
		_.each(defaultData, function (value, key) {
			if(!self.dataSchema.hasOwnProperty(key)) {
				self.dataSchema[key] = {};
			}

			self.dataSchema[key].default = value;
			self.trigger('update', key, value, true);
		});
	};

	Validator.prototype.setOnlyDefaults = function (defaultData) {
		this.setDefaults(_.pick(defaultData, this.getKeys()));
	};

	Validator.prototype.renderDefaults = function () {
		var self = this;
		_.each(this.dataSchema, function (data, id) {
			self.setValue(id, data.default);
		});
	};

	Validator.prototype.setDataSchema = function (dataSchema) {
		var self = this;
		_.each(dataSchema, function (data, id) {
			self._fieldIsvalid[id] = false;
			self.bindToElement(data, id);
		});

		this.dataSchema = dataSchema;
	};

	Validator.prototype.bindToElement = function (data, id) {
		var self = this, el = (data.el) ? data.el : '#' + id;

		this.body.on('keyup blur', 'input[type!=checkbox]' + el + ', textarea' + el, function (e) {
			self.validateItem(id, data);
		});

		this.body.on('click', 'input[type=checkbox]' + el, function (e) {
			self.trigger('update', id, $(e.target).prop('checked'));
		});
	};

	Validator.prototype.validate = function (id) {
		if(id !== undefined) {
			if(_.isArray(id)) {
				var self = this, errorCount = 0;
				id.forEach(function (item) {
					errorCount += self.validateItem(item, self.dataSchema[item]) ? 0 : 1;
				});
				return (errorCount == 0);
			} else {
				if(this.dataSchema[id]) {
					return this.validateItem(id, this.dataSchema[id]);
				} else {
// throw an error
throw new Error('ID not found')
				}
			}
		} else {
			var self = this, errorCount = 0;
			_.each(this.dataSchema, function (data, id) {
				errorCount += self.validateItem(id, data) ? 0 : 1;
			});
			return (errorCount == 0);
		}
	};

	Validator.prototype.validateItem = function (id, data) {

		var self = this, hasError = false, hasWarning = true;

		var value = this.getValue(id)
		  , element = this.getElement(id)
		  , constraints = data.constraints;

		var updateEvent = function () { self.trigger('update', id, value); self.trigger('update.' + id, value); errorEvent(); return true }
		  , msg = function (rule) { return (_.isArray(rule)) ? rule[1] : constraints.message; }
		  , get = function (rule) { return (_.isArray(rule)) ? rule[0] : rule; }
		  , errorEvent = function () {
			var errorPresent = _.isString(hasError);
			if(self._fieldIsvalid[id] != errorPresent || hasError) {
				self._fieldIsvalid[id] = errorPresent;
				self.trigger('error', id, errorPresent, element, value, hasError);
			}
		 };

		if(!_.isObject(constraints)) return updateEvent();

		if(value == '' && !_.has(constraints, 'required') && !_.has(constraints, 'func')) return updateEvent();

		if(data.preRequirement && !data.preRequirement()) return updateEvent();

		if(_.has(constraints, 'required')) {
			var rule = get(constraints.required);

			if(!Validator.is.required.call(null, value, rule)) {
				hasError = msg(constraints.required);
				self.trigger(id + '.error', true, 'required', rule);
			} else {
				self.trigger(id + '.error', false, 'required', rule);
			}
		}

		_.each(_.omit(constraints, ['required', 'message', 'warning']), function (constraint, key) {
			if(hasError) return;

			var rule = get(constraint);
			if(!Validator.is[key].call(null, value, rule)) {
				hasError = msg(constraint);
				self.trigger(id + '.error', true, key, rule);
			} else {
				self.trigger(id + '.error', false, key, rule);
			}
		});

		if(_.isObject(constraints.warning)) {
			if(!hasError) {
				_.each(constraints.warning, function (rule, key) {
					hasWarning =  hasWarning && Validator.is[key].call(null, value, rule);
				});
				self.trigger(id + '.warning', hasWarning);
			} else {
				self.trigger(id + '.warning', false);
			}
		}

		if(!hasError) return updateEvent();
		else {
			errorEvent();
			return false;
		}
	};

	Validator.is = {
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

			return el.val() == value;
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

			if(value.charAt(0) != '/') return !rule;
			if(value.charAt(0) == '/' && value.charAt(1) == '/') return !rule;
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

	_.each(Validator.is, function (func, key) {
		Validator.is[key] = Validator.is[key].bind(Validator.is);

		var newKey = key.charAt(0).toUpperCase() + key.slice(1);
		newKey = 'not' + newKey;
		Validator.is[newKey] = function (value, rule) {
			return !func.call(this, value, rule);
		};
	});

	return Validator;
});
