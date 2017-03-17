// betterEditableData scope
{
	$.betterEditableData = {};
	$.betterEditableData.version = "0.10.6";

	// default functions definitions:
	$.betterEditableData.default = {
		displayFunction: function (editable, value) {
			if (typeof value === 'undefined') {
				value = editable.value;
				if (editable.options.type == 'select') {
					value = editable.options.selectDisplay(editable, value);
				} else if (editable.options.type == 'textarea') {
					value = editable.options.textareaDisplay(editable, value);
				} else if (editable.options.type == 'bool') {
					value = editable.options.boolDisplay(editable, value);
				} else if (editable.options.type == 'datetimepicker') {
					value = editable.options.dateDisplay(editable, value);
				}
			}
			editable.$element.html(value);
			if (value.toString().trim() === '') {
				editable.$element.html(editable.options.emptyDisplay);
				if (!editable.$element.hasClass('empty')) {
					editable.$element.addClass('empty');
				}
			} else {
				editable.$element.removeClass('empty');
			}
		},
		load: {
			start: function (editable) {
				editable.toggleReadOnly(true);
				editable.$element.text('Submitting...');
			},
			end: function (dataObj, editable) {
				editable.options.displayFunction(editable);
				editable.toggleReadOnly(false);
			}
		},
		onAjaxSuccess: function (data, editable) {
			editable.options.load.end({
				data: data,
				hasError: false
			}, editable);
		},
		onAjaxError: function (errorObj, xhr, settings, exception, editable) {
			var statusTxt = xhr.statusText;
			var statusCode = xhr.status;
			if (typeof statusTxt !== 'string' || statusTxt.trim() === '') {
				statusTxt = errorObj.statusText;
			}
			if (typeof statusCode !== 'number' && (typeof statusCode !== 'string' || statusCode.trim() === '')) {
				statusCode = errorObj.status;
			}
			var errorMsg = statusCode + ": " + statusTxt;
			editable.options.load.end({
				data: errorMsg,
				hasError: false
			}, editable);
			editable.options.errorHandler(statusCode + ": " + statusTxt, editable, true);
			editable.show();
			editable.setInputValue(editable.errorValue);
		},
		errorHandler: function (errorMsg, editable, show) {
			var elementId = editable.$element.attr('id');
			if (show) {
				var makeErrorElem = true;
				if (typeof elementId === 'string' && elementId !== '') {
					var $errorElement = $('[data-valmsg-for="' + elementId + '"]').first();
					if ($errorElement.length == 0) {
						$errorElement = $('[data-for="' + elementId + '"]').first();
					}
					if ($errorElement.length > 0) {
						makeErrorElem = false;
						$errorElement.text(errorMsg).show();
					}
				}

				if (makeErrorElem) {
					var $errorElement = $("<label></label>").addClass('field-validation-error').attr('data-for', elementId).attr('data-valmsg-for', elementId).text(errorMsg);
					if (editable.options.type != 'bool') {
						editable.$inputDiv.find('.editable-input-wrapper').after($errorElement);
					} else {
						editable.$inputDiv.after($errorElement);
					}
				}
			} else {
				var $errorElement = $('[data-valmsg-for="' + elementId + '"]').first();
				if ($errorElement.length == 0) {
					$errorElement = $('[data-for="' + elementId + '"]').first();
				}
				if ($errorElement.length > 0) {
					$errorElement.hide();
				}
			}
		},
		boolDisplay: function (editable, boolValue) {
			if (boolValue) {
				return "True";
			} else {
				return "False";
			}
		},
		selectDisplay: function (editable, value) {
			if (Object.prototype.toString.call(editable.options.dataSource) === '[object Array]') {
				for (var index = 0; index < editable.options.dataSource.length; ++index) {
					if (typeof editable.options.dataSource[index] === 'object') {
						if (Object.prototype.toString.call(editable.options.dataSource[index]) === '[object Array]') {
							if (editable.options.dataSource[index].length >= 2 && editable.options.dataSource[index][0] == value) {
								value = editable.options.dataSource[index][1];
								break;
							}
						} else if (editable.options.dataSource[index]["value"] == value) {
							value = editable.options.dataSource[index]["text"];
							break;
						}
					}
				}
			}
			return value;
		},
		textareaDisplay: function (editable, value) {
			var regex = new RegExp('(\r|\n|\r\n)', 'g');
			return value.replace(regex, '<br/>');
		},
		dateDisplay: function (editable, value) {
			var dateObj = editable.$input.data('DateTimePicker').date();
			if (dateObj !== null) {
				return dateObj.format(editable.$input.data('DateTimePicker').format());
			} else {
				return '';
			}
		}
	};

	// default validators:
	$.betterEditableData.validators = {
		required: {
			errorMsg: function (name, validatorValue, $element) {
				return name + " is required!";
			},
			validator: function (value, validatorValue, $element) {
				if (validatorValue === "false") {
					return true;
				}
				if (typeof value === "undefined" || value == null || value === '') {
					return false;
				}
				return true;
			}
		},
		minlen: {
			errorMsg: function (name, validatorValue, $element) {
				return name + " must be atleast " + validatorValue + " characters long!";
			},
			validator: function (value, validatorValue, $element) {
				if (value.length > 0 && value.length < Number(validatorValue)) {
					return false;
				}
				return true;
			}
		},
		maxlen: {
			errorMsg: function (name, validatorValue, $element) {
				return name + " must not be longer then " + validatorValue + " characters!";
			},
			validator: function (value, validatorValue, $element) {
				if (value.length > Number(validatorValue)) {
					return false;
				}
				return true;
			}
		},
		length: {
			errorMsg: function (name, validatorValue, $element) {
				return name + " must be exactly " + validatorValue + " characters long!";
			},
			validator: function (value, validatorValue, $element) {
				if (value.length > 0 && value.length != Number(validatorValue)) {
					return false;
				}
				return true;
			}
		},
		email: {
			errorMsg: function (name, validatorValue, $element) {
				return name + " is not a valid email input!";
			},
			validator: function (value, validatorValue, $element) {
				if ((typeof value === 'undefined' || value === null || value === "") &&
					(validatorValue === "false" || validatorValue === false)) {
					return true;
				}
				return (value.length == 0 || /^.+?@.+?\..+?$/.test(value));
			}
		},
		phone: {
			errorMsg: function (name, validatorValue, $element) {
				return name + " is not a valid phone number!";
			},
			validator: function (value, validatorValue, $element) {
				if ((typeof value === 'undefined' || value === null || value === "") &&
					(validatorValue === "false" || validatorValue === false)) {
					return true;
				}
				return (value.length == 0 || /^[+]{0,1}[0-9]+$/.test(value));
			}
		},
		disable: {
			errorMsg: function (name, validatorValue, $element) {
				return name + " can't be changed at the moment!";
			},
			validator: function (value, validatorValue, $element) {
				if (!validatorValue) {
					return true;
				}
				return false;
			}
		},
		requiredif: {
			errorMsg: function (name, validatorValue, $element) {
				return name + " is required!";
			},
			validator: function (value, validatorValue, $element) {
				var required;
				var defaultDesiredValue = validatorValue;
				if (typeof $element.data("requiredif-dependentpropertyid") !== 'undefined') {
					required = RequiredIf(defaultDesiredValue, $element.data("requiredif-dependentpropertyid"));
				} else {
					var index = 0;
					var desiredValue;
					while (typeof $element.data("requiredif-dependentpropertyid-" + index) !== 'undefined') {
						desiredValue = $element.data("requiredif-desiredvalue-" + index);
						if (typeof desiredValue === 'undefined' || desiredValue === null) {
							desiredValue = defaultDesiredValue;
						}
						required = RequiredIf(desiredValue, $element.data("requiredif-dependentpropertyid-" + index));
						if (required && !$.betterEditableData.validators.required.validator(value, validatorValue, $element)) {
							return false;
						}
						++index;
					}
					required = false;
				}
				if (required) {
					return $.betterEditableData.validators.required.validator(value, validatorValue, $element);
				} else {
					return true;
				}
			}
		},
		inputmaskvalidate: {
			errorMsg: function (name, validatorValue, $element) {
				return name + " is invalid!";
			},
			validator: function (value, validatorValue, $element) {
				var $input = $element.betterEditable().$input;
				if (typeof $input === 'undefined' || typeof value === 'undefined' || value === null || value === "") {
					return true;
				}
				return $input.inputmask("isComplete");
			}
		}
	};

	$.betterEditableData.methods = {
		getVersion: function (editable) {
			return $.betterEditableData.version;
		},
		getValue: function (editable) {
			return editable.value;
		},
		setValue: function (editable, newValue) {
			editable.value = newValue
			editable.options.displayFunction(editable);
		},
		submit: function (editable) {
			editable.setInputValue();
			editable.initiateSubmit();
		},
		setOption: function (editable, optionName, optionValue) {
			if (optionName == "readOnly") {
				editable.toggleReadOnly(optionValue);
				return;
			}
			editable.options[optionName] = optionValue;
			if (optionName == "tabIndex" && editable.options.tabbingOn === true) {
				editable.$element.attr('data-tab-index', editable.options.tabIndex);
			} else if (optionName == "tabbingOn" && (typeof editable.options.tabIndex === 'string' || typeof editable.options.tabIndex === 'number')) {
				editable.$element.attr('data-tab-index', editable.options.tabIndex);
			} else if (optionName == 'submitOnBlur' || optionName == 'clearButton' || optionName == 'buttonsOn' ||
				optionName == 'inputClass' || optionName == 'buttonClass' || optionName == 'type' || optionName == 'mode') {
				editable.recreateInputField();
			}
		},
		getOption: function (editable, optionName) {
			if (optionName == "readOnly") {
				return editable.state.readOnly;
			}
			return editable.options[optionName];
		},
		getOptions: function (editable) {
			return editable.options;
		},
		validate: function (editable) {
			return editable.validate(false);
		},
		toggleEnable: function (editable, toggleFlag) {
			editable.toggleReadOnly(!toggleFlag);
		},
		enable: function (editable) {
			editable.toggleReadOnly(false);
		},
		disable: function (editable) {
			editable.toggleReadOnly(true);
		},
		focus: function (editable) {
			if (editable.isShown()) {
				editable.$input.focus();
			}
		},
		destroy: function (editable) {
			editable.resetState();
			editable.hideInput();
			editable.$inputDiv.remove();
			delete editable;
		},
		toggle: function (editable, toggleFlag) {
			if (toggleFlag === true) {
				if (!editable.isShown()) {
					editable.show();
				}
			} else if (editable.isShown()) {
				editable.cancel();
			}
		},
		show: function (editable) {
			if (!editable.isShown()) {
				editable.show();
			}
		},
		hide: function (editable) {
			if (editable.isShown()) {
				editable.cancel();
			}
		},
		tab: function (editable, direction) {
			if (editable.isShown() && editable.options.tabbingOn === true) {
				if (direction !== -1) {
					direction = 1;
				}
				editable.state.doTab = direction;
				editable.initiateSubmit();
			}
		},
		createValidator(editable, validatorName, validatorFunction, messageFunction) {
			if ($.betterEditableData.validators[validatorName] !== 'undefined') {
				throw "This validator already exists!";
			}
			$.betterEditableData.validators[validatorName] = {
				errorMsg: messageFunction,
				validator: validatorFunction
			}
		},
		attachValidator(editable, validatorName, validatorValue) {
			if ($.betterEditableData.validators[validatorName] === 'undefined') {
				throw "This validator does not exist!";
			}
			var found = -1;
			for (var index = 0; index < editable.validators.length; ++index) {
				if (editable.validators[index] == validatorName) {
					found = index;
					break;
				}
			}
			if (found === -1) {
				editable.validators.push(validatorName);
			}
			if (typeof validatorValue !== 'undefined') {
				editable.$element.data(validatorName, validatorValue);
			}
		},
		detachValidator(editable, validatorName) {
			for (var index = 0; index < editable.validators.length; ++index) {
				if (editable.validators[index] == validatorName) {
					editable.validators.splice(index, 1);
					return;
				}
			}
		}
	};

	$.betterEditableData.submitting = 0;
	$.betterEditableData.blockTab = false;
}

// Initialization scope
{
	function BetterEditable(settings) {
		this.$element = settings.$element;

		// setter function
		function setIfDefined(valArray) {
			for (var index = 0; index < valArray.length; ++index) {
				if (typeof valArray[index] !== "undefined") {
					return valArray[index];
				}
			}

			return undefined;
		}
		// load settings, or use defaults:
		this.options = {};
		this.options.url = setIfDefined([this.$element.data('url'), settings.url]);
		this.options.displayFunction = setIfDefined([settings.displayFunction, function (editable, value) {
			return $.betterEditableData.default.displayFunction(editable, value);
		}]);
		this.options.fieldName = setIfDefined([this.$element.data('name'), settings.fieldName, this.$element.attr('name'), this.$element.attr('id')]);
		this.options.pk = setIfDefined([this.$element.data('pk'), settings.pk]);
		this.options.mode = setIfDefined([this.$element.data('mode'), settings.mode]);
		if (this.options.mode !== 'popup') {
			this.options.mode = 'inline';
		}
		this.options.placement = setIfDefined([this.$element.data('placement'), settings.placement, "right"]);
		this.options.type = setIfDefined([this.$element.data('type'), this.$element.attr('type'), settings.type]);
		this.options.typeSettings = settings.typeSettings;
		this.options.ajaxObject = settings.ajaxObject;
		this.options.ajaxParams = settings.ajaxParams;
		this.options.dataSource = settings.dataSource;
		this.options.load = setIfDefined([settings.load, {
			start: function (editable) {
				return $.betterEditableData.default.load.start(editable);
			},
			end: function (dataObj, editable) {
				return $.betterEditableData.default.load.end(dataObj, editable);
			}
		}]);
		this.options.onAjaxError = setIfDefined([settings.onAjaxError, function (errorObj, xhr, settings, exception, editable) {
			return $.betterEditableData.default.onAjaxError(errorObj, xhr, settings, exception, editable);
		}]);
		this.options.onAjaxSuccess = setIfDefined([settings.onAjaxSuccess, function (data, editable) {
			return $.betterEditableData.default.onAjaxSuccess(data, editable);
		}]);
		this.options.errorHandler = setIfDefined([settings.errorHandler, function (errorMsg, editable, show) {
			return $.betterEditableData.default.errorHandler(errorMsg, editable, show);
		}]);
		// features:
		this.options.submitNoChange = setIfDefined([this.$element.data('submit-no-change'), settings.submitNoChange, false]);
		this.options.submitOnBlur = setIfDefined([this.$element.data('submit-on-blur'), settings.submitOnBlur, true]);
		this.options.emptyDisplay = setIfDefined([this.$element.data('empty-display'), settings.emptyDisplay, "n/a"]);
		this.options.boolDisplay = setIfDefined([settings.boolDisplay, function (editable, boolValue) {
			return $.betterEditableData.default.boolDisplay(editable, boolValue);
		}]);
		this.options.selectDisplay = setIfDefined([settings.selectDisplay, function (editable, value) {
			return $.betterEditableData.default.selectDisplay(editable, value);
		}]);
		this.options.textareaDisplay = setIfDefined([settings.textareaDisplay, function (editable, value) {
			return $.betterEditableData.default.textareaDisplay(editable, value);
		}]);
		this.options.dateDisplay = setIfDefined([settings.dateDisplay, function (editable, value) {
			return $.betterEditableData.default.dateDisplay(editable, value);
		}]);
		this.options.clearButton = setIfDefined([this.$element.data('clear-button'), settings.clearButton, true]);
		this.options.buttonsOn = setIfDefined([this.$element.data('buttons-on'), settings.buttonsOn, true]);
		this.options.inputClass = setIfDefined([this.$element.data('input-class'), settings.inputClass]);
		this.options.buttonClass = setIfDefined([this.$element.data('button-class'), settings.buttonClass]);
		this.options.tabIndex = setIfDefined([this.$element.data('tab-index'), settings.tabIndex]);
		this.options.tabbingOn = setIfDefined([this.$element.data('tabbing-on'), settings.tabbingOn, false]);

		// initialization:
		this.$element.attr('data-editable', '');
		if (this.options.tabbingOn === true && (typeof this.options.tabIndex === 'string' || typeof this.options.tabIndex === 'number')) {
			this.$element.attr('data-tab-index', this.options.tabIndex);
		}
		this.value = setIfDefined([this.$element.data('value'), settings.value, this.$element.attr('value'), this.$element.text()]);
		this.state = {};
		this.resetState();
		this.state.popupOpen = false;
		this.createInputField();
		this.initializeValidators();
		this.options.displayFunction(this);
		if (settings.readOnly === true) {
			this.toggleReadOnly(true);
		} else {
			this.state.readOnly = false;
		}

		var self = this;
		this.$element.on('click', function () {
			event.stopPropagation();
			self.show();

			// if bool, trigger input click
			if (self.options.type == 'bool') {
				self.$input.trigger('click');
			}
		});
		this.$element.addClass('editable-ready');
		this.$element.trigger("init", {
			editable: self
		});
	}

	BetterEditable.prototype.initializeValidators = function () {
		this.validators = [];

		var data = this.$element.data();
		for (var key in data) {
			// only memorize the key to the validator in the editable object
			if (typeof $.betterEditableData.validators[key] !== 'undefined') {
				this.validators.push(key);
			}
		}
	};

	BetterEditable.prototype.createInputField = function () {
		var self = this;
		var inputType = this.options.type;
		if (inputType != 'number' && inputType != 'tel' && inputType != 'email' && inputType != 'textarea' && inputType != 'select'
			&& inputType != 'bool' && inputType != 'inputmask' && inputType != 'datetimepicker' && inputType != 'autocomplete') {
			inputType = 'text';
		}
		this.$inputDiv = $("<div></div>").attr('data-editable-div', '').addClass(this.options.mode).addClass(inputType).addClass('editable-input-div').addClass(this.options.inputClass);
		this.$input = null;
		if (inputType == 'textarea') {
			this.$input = $('<textarea></textarea>');
		} else if (inputType == 'select') {
			this.$input = $('<select></select>');
			if (Object.prototype.toString.call(this.options.dataSource) === '[object Array]') {
				for (var index = 0; index < this.options.dataSource.length; ++index) {
					if (typeof this.options.dataSource[index] === 'object') {
						if (Object.prototype.toString.call(this.options.dataSource[index]) === '[object Array]') {
							if (this.options.dataSource[index].length >= 2) {
								this.$input.append($('<option>', {
									value: this.options.dataSource[index][0],
									text: this.options.dataSource[index][1]
								}));
							}
						} else {
							this.$input.append($('<option>', {
								value: this.options.dataSource[index]["value"],
								text: this.options.dataSource[index]["text"]
							}));
						}
					}
				}
			}
		} else if (inputType == 'bool') {
			this.$input = $('<input></input>').attr('type', 'hidden');
		} else if (inputType == 'inputmask') {
			this.$input = $('<input></input>').attr('type', 'text');
			this.$input.inputmask(this.options.typeSettings["mask"], this.options.typeSettings["settings"]);
		} else if (inputType == 'datetimepicker') {
			this.$input = $('<input></input>').attr('type', 'text').attr('onkeydown', "return false");
		} else if (inputType == 'autocomplete') {
			this.$input = $('<input></input>').attr('type', 'text');
			var autocompleteSettings = $.extend({}, this.options.typeSettings);
			var classToAdd = "editable-autocomplete-list editable-autocomplete-" + this.options.mode;
			// below code adds editable-autocomplete-list to the classes settings, if possible, without overwriting any current data
			if (typeof autocompleteSettings["classes"] === 'undefined') {
				autocompleteSettings["classes"] = {
					"ui-autocomplete": classToAdd
				};
			} else if (Object.prototype.toString.call(autocompleteSettings["classes"]) === '[object Object]') {
				if (typeof autocompleteSettings["classes"]["ui-autocomplete"] === 'undefined') {
					autocompleteSettings["classes"]["ui-autocomplete"] = classToAdd;
				} else if (typeof autocompleteSettings["classes"]["ui-autocomplete"] === 'string') {
					autocompleteSettings["classes"]["ui-autocomplete"] += " " + classToAdd;
				}
			}
			this.$input.autocomplete(autocompleteSettings);
		} else {
			this.$input = $('<input></input>').attr('type', inputType);
		}
		var $inputWrapper = $("<div></div>").addClass('editable-input-wrapper');

		// submit on focusing outside the editable, unless its set to false or its a bool
		if (this.options.type != 'bool' && this.options.submitOnBlur !== false) {
			$(document).on('click', function () {
				if (self.state.readOnly === false && self.isShown()) {
					self.initiateSubmit();
				}
			});
			// do not submit when clicking inside the div
			this.$inputDiv.on('click', function (event) {
				event.stopPropagation();
			});
		}

		//bool type has no key events, but has click event
		if (this.options.type === 'bool') {
			this.$input.on('click', function () {
				// convert the current value to bool type
				self.setInputValue(self.value);
				self.value = self.getInputValue();
				// inverse the bool value
				self.setInputValue(!self.value);
				self.initiateSubmit();
			});
		} else {
			this.$input.on('keydown', function (event) {
				if (event.which == 27) { // escape pressed => do cancel
					event.preventDefault();
					self.cancel();
				} else if (event.which == 13 && self.options.type != 'textarea') { // enter pressed and type is not textarea => initiate submit
					event.preventDefault();
					if (self.options.tabbingOn) { // trigger tabbing, if enabled
						if (event.shiftKey) {
							self.state.doTab = -1;
						} else {
							self.state.doTab = 1;
						}
					}
					self.initiateSubmit();
				} else if (self.options.tabbingOn === true && event.which == 9) { // tab pressed => trigger tabbing and submit, if enabled
					event.preventDefault();
					if (event.shiftKey) {
						self.state.doTab = -1;
					} else {
						self.state.doTab = 1;
					}
					self.initiateSubmit();
				}
			});
		}

		this.$inputDiv.hide();
		this.$element.after(this.$inputDiv);
		this.$inputDiv.append($inputWrapper);
		$inputWrapper.append(this.$input);
		if (inputType == 'datetimepicker') {
			var dateTimeSettings = $.extend({}, this.options.typeSettings);
			// debug is set to true, to make the picker not hide on blur
			if (typeof dateTimeSettings['debug'] === 'undefined') {
				dateTimeSettings['debug'] = true;
			}
			if (typeof dateTimeSettings['inline'] === 'undefined') {
				dateTimeSettings['inline'] = true;
			}
			if (this.options.clearButton === true && typeof dateTimeSettings['showClear'] === 'undefined') {
				dateTimeSettings['showClear'] = true;
			}
			if (this.options.buttonsOn === false && typeof dateTimeSettings['showClose'] === 'undefined') {
				dateTimeSettings['showClose'] = true;
				this.$input.on('dp.hide', function () {
					self.cancel();
				});
			}
			this.$input.datetimepicker(dateTimeSettings);
		}

		// create clear button to clear the input value, if enabled and correct type
		if (inputType != 'select' && inputType != 'datetimepicker' && this.options.clearButton === true) {
			var clearButton = $("<span></span>").addClass('editable-clear-button').text('✖');
			clearButton.on('click', function () {
				self.$input.val('');
				self.$input.focus();
			});
			$inputWrapper.append(clearButton);
		}
		// create submit and cancel buttons, if enabled
		if (this.options.buttonsOn === true) {
			var buttonWrapper = $('<div></div>').addClass('editable-button-wrapper');
			var submitButton = $("<span></span>").addClass('editable-button').addClass(self.options.buttonClass).text('✓');
			submitButton.on('click', function () {
				self.initiateSubmit();
			});
			var cancelButton = $("<span></span>").addClass('editable-button').addClass(self.options.buttonClass).text('✖');
			cancelButton.on('click', function () {
				self.cancel();
			});
			this.$inputDiv.append(buttonWrapper);
			buttonWrapper.append(submitButton);
			buttonWrapper.append(cancelButton);
		}
		// add popup div
		if (this.options.mode == 'popup') {
			var popupWrap = $('<div></div>').addClass('editable-popup-wrapper').addClass('dropdown-menu').addClass(this.options.placement);
			this.$inputDiv.wrapInner(popupWrap);
		}
	};

	BetterEditable.prototype.recreateInputField = function () {
		var visible = this.isShown();
		var currentValue = this.getInputValue();
		this.$inputDiv.remove();
		this.createInputField();
		if (visible) {
			this.setInputValue(currentValue);
			this.$inputDiv.show();
			this.$input.focus();
		}
		var self = this;
		this.$element.trigger("recreateInput", {
			editable: self
		});
	};
}

// State check scope
{
	BetterEditable.prototype.canBeShown = function () {
		return this.state.readOnly === false && this.state.popupOpen === false && !this.isShown() && this.options.type !== 'bool';
	};

	BetterEditable.prototype.isShown = function () {
		// if its bool, its always shown
		return this.options.type == 'bool' || this.$inputDiv.is(":visible");
	};
}

// Main action scope
{
	BetterEditable.prototype.show = function () {
		if (!this.canBeShown()) {
			return false;
		}

		if (this.state.isValid) {
			this.options.errorHandler('', this, false);
		}
		if (this.options.mode !== 'popup') {
			this.$element.hide();
		}
		this.setInputValue();
		this.$inputDiv.show();
		if (this.options.mode === 'popup') {
			// move the popup so it doesn't appear on top of the editable element.
			this.togglePopupOpen(true);
			if (this.options.placement === 'bottom') {
				this.$inputDiv.css('top', (this.$element.outerHeight() + 7) + 'px');
			} else if (this.options.placement === 'top') {
				var heightOffset = this.$element.outerHeight();
				if (this.$inputDiv.children().first().outerHeight() > heightOffset) {
					heightOffset = this.$inputDiv.children().first().outerHeight();
				}
				this.$inputDiv.css('top', '-' + (heightOffset + 8) + 'px');
			} else if (this.options.placement === 'right') {
				this.$inputDiv.css('right', '-' + (this.$element.outerWidth() + 7) + 'px');
				this.$inputDiv.css('top', '-' + 6 + 'px');
			} else if (this.options.placement === 'left') {
				var widthOffset = this.$element.outerWidth();
				if (this.$inputDiv.children().first().outerWidth() > widthOffset) {
					widthOffset = this.$inputDiv.children().first().outerWidth();
				}
				this.$inputDiv.css('right', (widthOffset + 7) + 'px');
				this.$inputDiv.css('top', '-' + 6 + 'px');
			}
		}
		this.$input.focus();

		this.$element.trigger("shown", {
			editable: self
		});
	};

	BetterEditable.prototype.hideInput = function () {
		this.$inputDiv.hide();
		this.$element.show();

		if (this.options.mode === 'popup') {
			// move the popup so it doesn't appear on the element. the 7 px are for the popup arrow
			this.togglePopupOpen(false);
		}

		this.$element.trigger("hidden", {
			editable: self
		});
	};

	BetterEditable.prototype.initiateSubmit = function (newValue) {
		if (typeof newValue !== 'undefined') {
			this.$input.val(newValue);
		}

		if (this.options.submitNoChange === false && this.value == this.getInputValue()) {
			this.cancel();
			if (this.state.doTab !== false) {
				this.triggerTabbing(this.state.doTab);
			}
			return this.resetState();
		}

		var result = this.submitProcess();
		// if result is true, then there was a pre-submit error
		if (result !== true) {
			this.hideInput();
		}
	};

	BetterEditable.prototype.cancel = function () {
		this.options.errorHandler('', this, false);
		this.hideInput();

		this.$element.trigger("cancelled", {
			editable: self
		});
	};

	BetterEditable.prototype.triggerTabbing = function (tabDirection) {
		var nextTab = Number(this.options.tabIndex);
		nextTab += tabDirection;
		var $nextEditable = $('[data-editable][data-tab-index="' + nextTab + '"]');
		if ($nextEditable.length > 0) {
			var continueTab = this.$element.trigger("beforeTab", {
				direction: tabDirection,
				nextTab: nextTab,
				editable: self
			});
			if (continueTab !== false) {
				$nextEditable = $nextEditable.first();
				// if type is bool, skip it and go to next tab, unless tabbing is disabled
				if ($nextEditable.betterEditable().options.type !== 'bool') {
					$nextEditable.betterEditable().show();
				} else if ($nextEditable.betterEditable().options.tabbingOn === true) {
					$nextEditable.betterEditable().triggerTabbing(tabDirection);
				}
			}
		}
	};
}

// Getters, setters, toggle, reset scope
{
	BetterEditable.prototype.setInputValue = function (newValue) {
		if (typeof newValue === 'undefined') {
			newValue = this.value;
			if (this.options.type == 'datetimepicker') {
				var dateObj = this.$input.data('DateTimePicker').date();
				if (dateObj !== null) {
					newValue = dateObj.format(this.$input.data('DateTimePicker').format());
				} else {
					newValue = '';
				}
			}
		}
		this.$input.val(newValue);
	};

	BetterEditable.prototype.getInputValue = function () {
		var returnValue = this.$input.val();
		if (this.options.type == 'bool') {
			// convert the current value to bool type
			if (typeof returnValue !== 'boolean') {
				if (typeof returnValue === 'string') {
					if (returnValue.toLowerCase() == 'true') {
						returnValue = true;
					} else {
						returnValue = false;
					}
				} else {
					returnValue = false;
				}
			}
		} else if (this.options.type == 'datetimepicker') {
			returnValue = this.$input.data('DateTimePicker').date();
			if (returnValue !== null) {
				returnValue = returnValue._d;
			}
		}
		return returnValue;
	};

	BetterEditable.prototype.togglePopupOpen = function (toggleFlag) {
		if (toggleFlag !== true && toggleFlag !== false) {
			toggleFlag = !this.state.popupOpen;
		}
		if (toggleFlag === true) {
			if (!this.$element.hasClass('popup-open')) {
				this.$element.addClass('popup-open');
			}
		} else {
			this.$element.removeClass('popup-open');
		}
		this.state.popupOpen = toggleFlag;
	};

	BetterEditable.prototype.toggleReadOnly = function (toggleFlag) {
		if (toggleFlag !== true && toggleFlag !== false) {
			toggleFlag = !this.state.readOnly;
		}
		if (toggleFlag === true) {
			if (!this.$input.hasClass('disabled')) {
				this.$input.addClass('disabled');
			}
			this.$input.attr('disabled', '');

			if (!this.$element.hasClass('disabled')) {
				this.$element.addClass('disabled');
			}
			this.$element.attr('disabled', '');
		} else {
			this.$input.removeClass('disabled');
			this.$input.removeAttr('disabled');

			this.$element.removeClass('disabled');
			this.$element.removeAttr('disabled');
		}
		this.state.readOnly = toggleFlag;
	};

	BetterEditable.prototype.resetState = function () {
		this.state.isValid = true;
		this.state.doTab = false;
	};
}

// Submit process scope
{
	BetterEditable.prototype.submitProcess = function () {
		this.options.errorHandler('', this, false);
		var result = this.validate();
		if (!result) {
			return true;
		}

		result = this.submitData();

		return result;
	};

	BetterEditable.prototype.validate = function (triggerErrors) {
		var newValue = this.getInputValue();
		if (!this.isShown()) {
			newValue = this.value;
		}
		var self = this;
		// trigger before validate event
		var returnData = {};
		this.$element.trigger("beforeValidate", {
			newValue: newValue,
			editable: self,
			returnData: returnData
		});
		if (returnData.data === false) {
			return false;
		}
		// get new value again, if it was changed in the event above
		newValue = this.getInputValue();
		if (!this.isShown()) {
			newValue = this.value;
		}

		for (var index = 0; index < this.validators.length; ++index) {
			var validatorValue = this.$element.data(this.validators[index] + "-val") || this.$element.data(this.validators[index]);
			var validatorResult = $.betterEditableData.validators[this.validators[index]].validator(newValue, validatorValue, this.$element);
			if (validatorResult === false) {
				var errorMsg = $.betterEditableData.validators[this.validators[index]].errorMsg(this.options.fieldName, validatorValue, this.$element);
				if (triggerErrors !== false) {
					this.options.errorHandler(errorMsg, this, true);
				}
				this.state.isValid = false;
				this.$element.trigger("failedValidation", {
					newValue: newValue,
					editable: self
				});
				return false;
			}
		}
		return true;
	};

	BetterEditable.prototype.submitData = function () {
		var newValue = this.getInputValue();
		if (!this.isShown()) {
			newValue = this.value;
		}
		var oldValue = this.value;
		var self = this;

		// trigger before submit event
		var returnData = {};
		this.$element.trigger("beforeSubmit", {
			newValue: newValue,
			editable: self,
			returnData: returnData
		});
		if (returnData.data === false) {
			// returns true for a pre-submit error ; returning false is for after submit error
			return true;
		}
		// get new value again, if it was changed in the event above
		newValue = this.getInputValue();
		if (!this.isShown()) {
			newValue = this.value;
		}

		this.value = newValue;
		// use custom data if defined
		var dataToSent = $.extend({}, this.options.ajaxParams);
		if (typeof dataToSent["value"] === 'undefined') {
			dataToSent["value"] = this.value;
		}
		if (typeof dataToSent["fieldName"] === 'undefined') {
			dataToSent["fieldName"] = this.options.fieldName;
		}
		if (typeof dataToSent["pk"] === 'undefined') {
			dataToSent["pk"] = this.options.pk;
		}

		// use custom ajax object, if defined
		var ajaxObj = $.extend({}, this.options.ajaxObject);
		if (typeof ajaxObj["url"] === 'undefined') {
			ajaxObj["url"] = this.options.url;
		}
		if (typeof ajaxObj["type"] === 'undefined') {
			ajaxObj["type"] = 'POST';
		}
		if (typeof ajaxObj["data"] === 'undefined') {
			ajaxObj["data"] = dataToSent;
		}
		if (typeof ajaxObj["beforeSend"] === 'undefined') {
			ajaxObj["beforeSend"] = function () {
				self.options.load.start(self);
			};
		}
		if (typeof ajaxObj["success"] === 'undefined') {
			ajaxObj["success"] = function (data) {
				self.$element.trigger("onSuccess", {
					data: data,
					editable: self
				});
				self.options.onAjaxSuccess(data, self);
				if (self.state.doTab !== false) {
					--$.betterEditableData.submitting;
					self.triggerTabbing(self.state.doTab);
				}
				self.afterProcess();
			};
		}
		if (typeof ajaxObj["error"] === 'undefined') {
			ajaxObj["error"] = function (errorObj, xhr, settings, exception) {
				self.state.isValid = false;
				self.errorValue = self.value;
				self.value = oldValue;
				self.$element.trigger("onError", {
					errorObj: errorObj,
					xhr: xhr,
					settings: settings,
					exception: exception,
					editable: self
				});
				self.options.onAjaxError(errorObj, xhr, settings, exception, self);
				if (self.state.doTab !== false) {
					--$.betterEditableData.submitting;
				}
				self.afterProcess();
			};
		}

		// only submit if url is defined
		if (typeof ajaxObj["url"] === 'string' && ajaxObj["url"] !== '') {
			if (self.state.doTab !== false) {
				++$.betterEditableData.submitting;
			}
			$.ajax(ajaxObj);
		} else {
			this.options.displayFunction(this);
			if (self.state.doTab !== false) {
				self.triggerTabbing(self.state.doTab);
			}
			this.afterProcess();
		}
	};

	BetterEditable.prototype.afterProcess = function () {
		this.resetState();
	};
}

// Main controllers scope
{
	$.fn.betterEditable = function (settings) {
		if (typeof settings !== 'string') {
			if (typeof this.data('betterEditable') !== 'object') {
				if (typeof settings !== 'object' || settings === null) {
					settings = {};
				}
				settings.$element = this;
				this.data('betterEditable', new BetterEditable(settings));
			}

			return this.data('betterEditable');
		} else {
			var method = settings;
			if (typeof this.data('betterEditable') === 'object' && typeof $.betterEditableData.methods[method] === 'function') {
				var methodArguments = [].slice.call(arguments);
				methodArguments.shift();
				methodArguments.unshift(this.data('betterEditable'));
				return $.betterEditableData.methods[method].apply(null, methodArguments);
			}
		}
	};

	// when this function is ran, it will automatically make all html elements with data-editable into editables, with the sepcified settings.
	// after that each one can be changed individually
	$.initializeEditables = function (settings) {
		$('[data-editable]').each(function () {
			$(this).betterEditable(settings);
		});
	};
}

// Global scope
{
	$(document).on('keydown', function (event) {
		if (event.which == 9) {
			if ($.betterEditableData.submitting > 0 && $.betterEditableData.blockTab === false) {
				event.preventDefault();
			} else if (!event.shiftKey && $.betterEditableData.submitting === 0 &&
				$('[data-editable-div]:visible').length == 0 && $('[data-editable-first-tab]:visible').length > 0) {
				event.preventDefault();
				$('[data-editable-first-tab]:visible').first().betterEditable().show();
			}
		}
	});
}
