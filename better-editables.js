(function(){
	"use strict";

	// betterEditableData scope
	{
		$.betterEditableData = {};
		$.betterEditableData.version = "0.22.87";

		// utility functions
		$.betterEditableData.utils = {
			// for IE compatibility
			stopPropagation: function (event) {
				if (event.stopPropagation) {
					event.stopPropagation();
				} else {
					event.returnValue = false;
				}
			},
			// for IE compatibility
			preventDefault: function (event) {
				if (event.preventDefault) {
					event.preventDefault();
				} else {
					event.returnValue = false;
				}
			},
			// for IE compatibility
			getIEVersion: function () {
				var userAgent = window.navigator.userAgent;

				var msie = userAgent.indexOf('MSIE ');
				if (msie > -1) {
					// IE 10 or older => return version number
					return parseInt(userAgent.substring(msie + 5, userAgent.indexOf('.', msie)), 10);
				}

				var trident = userAgent.indexOf('Trident/');
				if (trident > -1) {
					// IE 11 => return version number
					var rv = userAgent.indexOf('rv:');
					return parseInt(userAgent.substring(rv + 3, userAgent.indexOf('.', rv)), 10);
				}

				var edge = userAgent.indexOf('Edge/');
				if (edge > -1) {
					// Edge (IE 12+) => return version number
					return parseInt(userAgent.substring(edge + 5, userAgent.indexOf('.', edge)), 10);
				}

				// other browser
				return 0;
			},
			// checks if value type is array
			isArray: function (value) {
				var toString = Object.prototype.toString;
				var strArray = Array.toString();

				return typeof value == "object" && (toString.call(value) == "[object Array]" || ("constructor" in value && String(value.constructor) == strArray));
			},
			// turns any value to a boolean type
			normalizeBoolean: function (value) {
				if (typeof value !== 'boolean') {
					if (typeof value === 'string' && value.toLowerCase() === 'true') {
						value = true;
					} else if (typeof value === 'number' && value === 1) {
						value = true;
					} else {
						value = false;
					}
				}
				return value;
			},
			// turns any value to a number type
			normalizeNumber: function (value) {
				if (typeof value === 'string') {
					value = value.replace(',', '.');
				}
				if (value === null || isNaN(value) || (typeof value === 'string' && value.trim() === '')) {
					return value = null;
				}
				return Number(value);
			},
			// turns any value to a string type
			normalizeString: function (value) {
				if (typeof value === 'undefined' || value === null) {
					value = ''
				}
				value = String(value);
				return value;
			},
			// attempts to create a date from string, then format it according to the date time picker object
			formatNewDate: function (dateObj, newDate) {
				var formatedString = '';
				if (typeof newDate === 'undefined' || newDate === null || dateObj.date() === null) {
					return formatedString;
				}
				var currentDate = dateObj.date();
				if (isNaN(Date.parse(newDate))) {
					dateObj.date(newDate);
				} else {
					dateObj.date(new Date(newDate));
				}
				var newDateObj = dateObj.date();
				if (newDateObj !== null) {
					formatedString = newDateObj.format(dateObj.format());
				}
				dateObj.date(currentDate);
				return formatedString;
			},
			// these options require the input field to be recreated
			requireRecreateInput: [
				'submitOnBlur',
				'clearButton',
				'buttonsOn',
				'inputClass',
				'buttonClass',
				'type',
				'mode',
				'typeSettings'
			],
			// these options require the option value to be normalized
			requireBoolNormalization: [
				'submitNoChange',
				'submitOnBlur',
				'clearButton',
				'buttonsOn',
				'tabbingOn',
				'readOnly'
			],
			// these are the currently possible types
			possibleTypes: [
				'text',
				'password',
				'number',
				'tel',
				'email',
				'textarea',
				'select',
				'bool',
				'inputmask',
				'datetimepicker',
				'autocomplete',
				'multifield'
			],
			// these are the text types
			textTypes: [
				'text',
				'password',
				'tel',
				'email',
				'textarea'
			]
		};
		var utils = $.betterEditableData.utils;

		// default functions definitions:
		$.betterEditableData.default = {
			displayFunction: function (editable, value) {
				if (editable.options.enableDisplay === false) {
					return false;
				}
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
					} else if (editable.options.type == 'multifield') {
						value = editable.options.multifieldDisplay(editable, value);
					}
				}
				editable.$element.html(value);
				if (typeof value === 'undefined' || value === null || String(value).trim() === '') {
					editable.$element.html(editable.options.emptyDisplay);
					if (!editable.$element.hasClass('empty')) {
						editable.$element.addClass('empty');
					}
				} else {
					editable.$element.removeClass('empty');
				}
				return true;
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
			onAjaxError: function (errorObj, xhr, settings, exception, errorValue, editable) {
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
					hasError: true
				}, editable);
				editable.options.errorHandler(statusCode + ": " + statusTxt, editable, true);
				editable.show();
				editable.setInputValue(errorValue);
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
						var $errorElement = $("<span></span>").addClass(editable.options.errorClass).addClass('editable-error').attr('data-for', elementId).attr('data-valmsg-for', elementId).text(errorMsg);
						if (editable.options.mode === 'popup' && editable.options.type != 'bool') {
							if (editable.options.type === 'multifield' && editable.options.buttonsOn === true) {
								editable.$inputDiv.find('.editable-button-wrapper').append($errorElement);
							} else {
								editable.$inputDiv.find('.editable-input-wrapper').append($errorElement);
							}
						} else {
							editable.$inputDiv.after($errorElement);
						}
						$errorElement.on('click', function (event) {
							if (editable.options.submitOnBlur === true && editable.state.readOnly === false && editable.isShown()) {
								utils.stopPropagation(event);
							}
						});
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
			destroyError: function (editable) {
				var elementId = editable.$element.attr('id');
				var $errorElement = $('[data-valmsg-for="' + elementId + '"]').first();
				if ($errorElement.length == 0) {
					$errorElement = $('[data-for="' + elementId + '"]').first();
				}
				if ($errorElement.length > 0) {
					$errorElement.remove();
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
				var dataSource = editable.options.typeSettings;
				if (utils.isArray(dataSource)) {
					for (var index = 0; index < dataSource.length; ++index) {
						if (typeof dataSource[index] === 'object') {
							if (utils.isArray(dataSource[index])) {
								if (dataSource[index].length >= 2 && dataSource[index][0] == value) {
									value = dataSource[index][1];
									break;
								}
							} else if (dataSource[index]["value"] == value) {
								value = dataSource[index]["text"];
								break;
							}
						}
					}
				}
				return value;
			},
			textareaDisplay: function (editable, value) {
				value = String(value);
				var regex = new RegExp('(\r|\n|\r\n)', 'g');
				return value.replace(regex, '<br/>');
			},
			dateDisplay: function (editable, value) {
				return utils.formatNewDate(editable.$input.data('DateTimePicker'), value);
			},
			multifieldDisplay: function (editable, value) {
				if (typeof value === 'object' && value !== null) {
					var returnValue = '';
					for (var index = 0; index < value.length; ++index) {
						Object.keys(value[index]).forEach(function (name) {
							if (typeof value[index][name] !== undefined && value[index][name] !== null && String(value[index][name]).trim() !== '') {
								returnValue += String(value[index][name]) + ", ";
							}
						});
					}
					if (returnValue !== '') {
						returnValue = returnValue.slice(0, -2);
					}
					return returnValue;
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
					if (validatorValue === "false" || validatorValue === false) {
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
					if (validatorValue === "false" || validatorValue === false) {
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

		// methods:
		$.betterEditableData.methods = {
			getVersion: function (editable) {
				return $.betterEditableData.version;
			},
			getValue: function (editable) {
				return editable.getValue();
			},
			setValue: function (editable, newValue) {
				editable.setValue(newValue);
				editable.options.displayFunction(editable);
			},
			submit: function (editable) {
				editable.setInputValue();
				editable.initiateSubmit(undefined, true);
			},
			setOption: function (editable, optionName, optionValue) {
				if ($.inArray(optionName, utils.requireBoolNormalization) !== -1) {
					optionValue = utils.normalizeBoolean(optionValue);
				}
				if (optionName == "readOnly") {
					editable.toggleReadOnly(optionValue);
					return;
				}
				var oldVal = editable.options[optionName];
				editable.options[optionName] = optionValue;
				if (optionName == "tabIndex" && editable.options.tabbingOn === true) {
					editable.$element.attr('data-tab-index', editable.options.tabIndex);
				} else if (optionName == "tabbingOn" && (typeof editable.options.tabIndex === 'string' || typeof editable.options.tabIndex === 'number')) {
					editable.$element.attr('data-tab-index', editable.options.tabIndex);
				} else if ($.inArray(optionName, utils.requireRecreateInput) !== -1) {
					if (editable.options.type != 'bool' || optionName == 'type') {
						var preserveOldValue = (optionName != 'type');
						var wasPopup = (optionName == 'mode' && oldVal == 'popup');
						editable.recreateInputField(preserveOldValue, wasPopup);
					}
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
					editable.focus();
				}
			},
			clear: function (editable) {
				if (editable.isShown()) {
					editable.clear();
				}
			},
			destroy: function (editable) {
				editable.resetState();
				editable.hideInput();
				editable.$inputDiv.remove();
				editable.$element.off();
				editable.$element.data('betterEditable', null);
				editable = null;
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
				if (editable.isShown() && editable.canTab()) {
					if (direction !== -1) {
						direction = 1;
					}
					editable.state.doTab = direction;
					editable.initiateSubmit();
				}
			},
			createValidator: function (editable, validatorName, validatorFunction, messageFunction) {
				if (typeof $.betterEditableData.validators[validatorName] !== 'undefined') {
					throw "Validator '" + validatorName + "' already exists!";
				}
				$.betterEditableData.validators[validatorName] = {
					errorMsg: messageFunction,
					validator: validatorFunction
				}
			},
			attachValidator: function (editable, validatorName, validatorValue) {
				if (typeof $.betterEditableData.validators[validatorName] === 'undefined') {
					throw "Validator '" + validatorName + "' does not exist!";
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
			detachValidator: function (editable, validatorName) {
				for (var index = 0; index < editable.validators.length; ++index) {
					if (editable.validators[index] == validatorName) {
						editable.validators.splice(index, 1);
						return;
					}
				}
			},
			overwriteValidator: function (editable, validatorName, validatorFunction, messageFunction) {
				if (typeof $.betterEditableData.validators[validatorName] === 'undefined') {
					throw "Validator '" + validatorName + "' does not exist!";
				}
				$.betterEditableData.validators[validatorName] = {
					errorMsg: messageFunction,
					validator: validatorFunction
				}
			}
		};

		$.betterEditableData.submitting = 0;
		$.betterEditableData.blockTab = true;
		$.betterEditableData.asyncRequests = false;
		$.betterEditableData.requestBeingExecuted = false;
		$.betterEditableData.requests = [];
		
		$.betterEditableData.functions = {
			// when this function is ran, it will automatically run betterEditable function to all html elements with data-editable, 
			// unless they have data-editable-no-init, with the given arguments.
			// this can be used to initilize editables in the first place
			applyToAll: function () {
				var argumentArray = [].slice.call(arguments);
				$('[data-editable]:not([data-editable-ignore-apply])').each(function () {
					var methodArguments = $.extend([], argumentArray);
					methodArguments.shift();
					methodArguments.unshift($(this).data('betterEditable'));
					$(this).betterEditable.apply($(this), argumentArray);
				});
			},
			addToQueue: function (ajaxObj) {
				$.betterEditableData.requests.push(ajaxObj);
			},
			attemptRequestExecution: function (skipCheck) {
				if (skipCheck === true || !$.betterEditableData.requestBeingExecuted) {
					var ajaxObj = $.betterEditableData.requests.shift();
					if (typeof ajaxObj === 'undefined') {
						return false;
					}
					$.betterEditableData.requestBeingExecuted = true;
					if (ajaxObj["doTab"] !== false) {
						++$.betterEditableData.submitting;
					}
					$.ajax(ajaxObj);
					return true;
				}
				return false;
			},
			requestExecutionEnd: function () {
				$.betterEditableData.requestBeingExecuted = $.betterEditableData.functions.attemptRequestExecution(true);
			}
		};
	}

	// Initialization scope
	{
		window.BetterEditable = function(settings) {
			this.$element = settings.$element;
			var self = this;

			// setter function
			function setIfDefined(valArray, boolType) {
				for (var index = 0; index < valArray.length; ++index) {
					if (typeof valArray[index] !== "undefined") {
						if (boolType === true) {
							return utils.normalizeBoolean(valArray[index]);
						}
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
			this.options.fieldName = setIfDefined([this.$element.data('name'), settings.fieldName, this.$element.attr('name'), this.$element.attr('title'), this.$element.attr('id')]);
			this.options.pk = setIfDefined([this.$element.data('pk'), settings.pk]);
			this.options.toggle = setIfDefined([this.$element.data('toggle'), settings.toggle, 'click']);
			this.options.mode = setIfDefined([this.$element.data('mode'), settings.mode]);
			if (this.options.mode !== 'popup') {
				this.options.mode = 'inline';
			}
			this.options.placement = setIfDefined([this.$element.data('placement'), settings.placement, "right"]);
			this.options.type = setIfDefined([this.$element.data('type'), this.$element.attr('type'), settings.type, "text"]);
			this.options.typeSettings = setIfDefined([this.$element.data('type-settings'), settings.typeSettings]);
			this.options.ajaxObject = settings.ajaxObject;
			this.options.ajaxParams = settings.ajaxParams;
			if (typeof this.options.ajaxParams === 'undefined') {
				this.options.ajaxParams = {};
			}
			var dataIndex = 0;
			while(typeof this.$element.data("ajax-param" + dataIndex + "-name") !== 'undefined') {
				this.options.ajaxParams[this.$element.data("ajax-param" + dataIndex + "-name")] = this.$element.data("ajax-param" + dataIndex + "-value");
				++dataIndex;
			}
			this.options.load = setIfDefined([settings.load, {
				start: function (editable) {
					return $.betterEditableData.default.load.start(editable);
				},
				end: function (dataObj, editable) {
					return $.betterEditableData.default.load.end(dataObj, editable);
				}
			}]);
			this.options.onAjaxError = setIfDefined([settings.onAjaxError, function (errorObj, xhr, settings, exception, errorValue, editable) {
				return $.betterEditableData.default.onAjaxError(errorObj, xhr, settings, exception, errorValue, editable);
			}]);
			this.options.onAjaxSuccess = setIfDefined([settings.onAjaxSuccess, function (data, editable) {
				return $.betterEditableData.default.onAjaxSuccess(data, editable);
			}]);
			this.options.errorHandler = setIfDefined([settings.errorHandler, function (errorMsg, editable, show) {
				return $.betterEditableData.default.errorHandler(errorMsg, editable, show);
			}]);
			this.options.destroyError = setIfDefined([settings.destroyError, function (editable) {
				return $.betterEditableData.default.destroyError(editable);
			}]);
			// features:
			this.options.submitNoChange = setIfDefined([this.$element.data('submit-no-change'), settings.submitNoChange, false], true);
			this.options.submitOnBlur = setIfDefined([this.$element.data('submit-on-blur'), settings.submitOnBlur, true], true);
			this.options.enableDisplay = setIfDefined([this.$element.data('enable-display'), settings.enableDisplay, true], true);
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
			this.options.multifieldDisplay = setIfDefined([settings.multifieldDisplay, function (editable, value) {
				return $.betterEditableData.default.multifieldDisplay(editable, value);
			}]);
			this.options.clearButton = setIfDefined([this.$element.data('clear-button'), settings.clearButton, true], true);
			this.options.buttonsOn = setIfDefined([this.$element.data('buttons-on'), settings.buttonsOn, true], true);
			this.options.inputClass = setIfDefined([this.$element.data('input-class'), settings.inputClass]);
			this.options.buttonClass = setIfDefined([this.$element.data('button-class'), settings.buttonClass]);
			this.options.errorClass = setIfDefined([this.$element.data('error-class'), settings.errorClass]);
			this.options.tabIndex = setIfDefined([this.$element.data('tab-index'), settings.tabIndex]);
			this.options.tabbingOn = setIfDefined([this.$element.data('tabbing-on'), settings.tabbingOn, false], true);

			// initialization:
			this.$element.attr('data-editable', '');
			if (this.options.tabbingOn === true && (typeof this.options.tabIndex === 'string' || typeof this.options.tabIndex === 'number')) {
				this.$element.attr('data-tab-index', this.options.tabIndex);
			}
			this.state = {};
			this.resetState();
			this.state.popupOpen = false;
			this.createInputField();
			this.setValue(setIfDefined([this.$element.data('value'), settings.value, this.$element.attr('value'), this.$element.text()]));
			this.setInputValue();
			this.initializeValidators();
			this.options.displayFunction(this);
			if (settings.readOnly === true) {
				this.toggleReadOnly(true);
			} else {
				this.state.readOnly = false;
			}
			var initiationFunction = function (event) {
				utils.stopPropagation(event);
				self.show();

				// if bool, trigger input click
				if (self.options.type == 'bool' && !self.isReadOnly()) {
					self.$input.trigger('click');
				}
			}
			// set all possible events, so toggle option can be changed dynamically
			this.$element.on('click', function (event) {
				if (self.options.toggle === 'click') {
					initiationFunction(event);
				}
			});
			this.$element.on('dblclick', function (event) {
				if (self.options.toggle === 'doubleclick') {
					initiationFunction(event);
				}
			});
			this.$element.on('mouseenter', function (event) {
				if (self.options.toggle === 'mouseenter') {
					initiationFunction(event);
				}
			});

			// on blur, trigger submit, if conditions are met:
			$(document).on('click', function (event) {
				if (typeof event.originalEvent !== 'undefined') {
					event = event.originalEvent;
				}
				if (self.options.type != 'bool' && self.options.submitOnBlur === true && self.state.readOnly === false && self.isShown()) {
					// do not submit, if an autocomplete element is clicked or element has data-editable-no-submit or has class js-editable-no-submit
					var pathArray = [];
					if (typeof event.path === 'undefined') {
						// for IE compatibility
						var currentTarget = event.target;
						while (typeof currentTarget !== 'undefined' && currentTarget.tagName !== 'HTML') {
							pathArray.push(currentTarget);
							currentTarget = currentTarget.parentNode;
						}
						if (typeof currentTarget === 'object' && currentTarget !== null && currentTarget.tagName === 'HTML') {
							pathArray.push(currentTarget);
						}
						pathArray.push(document);
						pathArray.push(window);
					} else {
						pathArray = event.path;
					}
					for (var index = 0; index < pathArray.length; ++index) {
						if ($(pathArray[index]).hasClass('js-editable-no-submit') || (typeof $(pathArray[index]).data('editable-no-submit') !== 'undefined' && 
							!($(pathArray[index]).data('editable-no-submit') === false || String($(pathArray[index]).data('editable-no-submit')).toLowerCase() === 'false'))) {
							return;
						}
					}
					self.initiateSubmit();
				}
			});
			this.$element.addClass('editable-ready');
			this.$element.trigger("be.init", this);
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
			if ($.inArray(inputType, utils.possibleTypes) === -1) {
				inputType = 'text';
			}
			this.$inputDiv = $("<div></div>").attr('data-editable-div', this.$element.attr('id')).addClass(this.options.mode).addClass(inputType).addClass('editable-input-div').addClass(this.options.inputClass);
			this.$input = null;
			if (inputType == 'textarea') {
				this.$input = $('<textarea></textarea>');
			} else if (inputType == 'select') {
				this.$input = $('<select></select>');
				var dataSource = this.options.typeSettings;
				if (utils.isArray(dataSource)) {
					for (var index = 0; index < dataSource.length; ++index) {
						if (typeof dataSource[index] === 'object') {
							if (utils.isArray(dataSource[index])) {
								if (dataSource[index].length >= 2) {
									this.$input.append($('<option>', {
										value: dataSource[index][0],
										text: dataSource[index][1]
									}));
								}
							} else {
								this.$input.append($('<option>', {
									value: dataSource[index]["value"],
									text: dataSource[index]["text"]
								}));
							}
						}
					}
				}
			} else if (inputType == 'bool') {
				this.$input = $('<input></input>').attr('type', 'hidden');
			} else if (inputType == 'inputmask') {
				this.$input = $('<input></input>').attr('type', 'text');
				if (typeof this.options.typeSettings !== 'undefined') {
					this.$input.inputmask(this.options.typeSettings["mask"], this.options.typeSettings["settings"]);
				} else {
					this.$input.inputmask();
				}
			} else if (inputType == 'datetimepicker') {
				this.$input = $('<input></input>').attr('type', 'text').attr('onkeydown', "return false");
			} else if (inputType == 'autocomplete') {
				this.$input = $('<input></input>').attr('type', 'text');
				var autocompleteSettings = $.extend({}, this.options.typeSettings);
				var classToAdd = "js-editable-no-submit editable-autocomplete-list editable-autocomplete-" + this.options.mode;
				// below code adds editable-autocomplete-list to the classes settings, if possible, without overwriting any current data
				if (typeof autocompleteSettings["classes"] === 'undefined') {
					autocompleteSettings["classes"] = {
						"ui-autocomplete": classToAdd
					};
				} else if (typeof autocompleteSettings['classes'] === 'object' && !utils.isArray(autocompleteSettings["classes"])) {
					if (typeof autocompleteSettings["classes"]["ui-autocomplete"] === 'undefined') {
						autocompleteSettings["classes"]["ui-autocomplete"] = classToAdd;
					} else if (typeof autocompleteSettings["classes"]["ui-autocomplete"] === 'string') {
						autocompleteSettings["classes"]["ui-autocomplete"] += " " + classToAdd;
					}
				}
				this.$input.autocomplete(autocompleteSettings);
			} else if (inputType == 'multifield') {
				this.$input = $('<div></div>').addClass('editable-multifield-wrapper');
				var dataSource;
				if (typeof this.options.typeSettings === 'object' && !utils.isArray(this.options.typeSettings)) {
					dataSource = this.options.typeSettings;
				} else if (this.options.typeSettings === "data") {
					dataSource = {};
					var inputDataSource = [];
					var dataIndex = 0;
					while(typeof this.$element.data("input" + dataIndex + "-name") !== 'undefined') {
						var fname = this.$element.data("input" + dataIndex + "-name");
						var ftype = this.$element.data("input" + dataIndex + "-type");
						var fval = this.$element.data("input" + dataIndex + "-value");
						var flabel = this.$element.data("input" + dataIndex + "-label");
						if (typeof fname === 'string') {
							if (typeof ftype !== 'string') {
								ftype = "text";
							}
							if (typeof fval === 'undefined') {
								fval = "";
								if (ftype === 'checkbox'){
									fval = utils.normalizeBoolean(fval);
								}
							}
							dataSource[fname] = [ftype, flabel, fval];
							var objToAdd = {};
							objToAdd[fname] = fval;
							inputDataSource.push($.extend({}, objToAdd));
						}
						++dataIndex;
					}
					// set value if its not defined in data, so the flow can set the value correctly
					if (typeof this.$element.data('value') === 'undefined') {
						this.$element.data('value', inputDataSource);
					}
				}
				if (typeof dataSource === 'object' && !utils.isArray(dataSource)) {
					Object.keys(dataSource).forEach(function (name) {
						var fieldLabel = name;
						var fieldName = name;
						var fieldType = dataSource[name];
						var fieldValue = undefined;
						if (utils.isArray(fieldType)) {
							if (fieldType.length === 0) {
								throw "Empty array given as field type!";
							} else if (fieldType.length === 1) {
								fieldType = fieldType[0];
								fieldLabel += ": ";
							} else {
								if (typeof fieldType[1] === 'string') {
									fieldLabel = fieldType[1];
								} else {
									fieldLabel += ": ";
								}
								if (fieldType.length > 2) {
									fieldValue = fieldType[2];
								}
								fieldType = fieldType[0];
							}
						} else {
							fieldLabel += ": ";
						}
						var $fieldWrapper = $('<div></div>').addClass('editable-multifield-input-wrapper').addClass(fieldType + "-type");
						var $newField;
						var $labelElement;
						if (fieldType === 'textarea') {
							$newField = $('<textarea></textarea>').val(fieldValue);
						} else {
							$newField = $('<input></input>').attr('type', fieldType);
						}
						$newField.attr('name', fieldName).addClass('editable-multifield-input');
						if (fieldType === 'checkbox') {
							$newField.prop('checked', utils.normalizeBoolean(fieldValue));
							$labelElement = $('<label></label>').addClass('editable-multifield-label').addClass('checkbox-type');
							$labelElement.append($newField).append(fieldLabel);
							$fieldWrapper.append($labelElement);
						} else {
							$newField.val(fieldValue);
							$labelElement = $('<div></div>').addClass('editable-multifield-label');
							if (typeof fieldLabel === 'string' && fieldLabel.trim() !== '' && fieldType !== 'hidden') {
								$labelElement.text(fieldLabel);
							}
							$fieldWrapper.append($labelElement);
							$fieldWrapper.append($newField);
						}
						self.$input.append($fieldWrapper);
					});
				}
			} else {
				this.$input = $('<input></input>').attr('type', inputType);
			}
			var $inputWrapper = $("<div></div>").addClass('editable-input-wrapper');

			// submit on focusing outside the editable, unless its set to false or its a bool
			if (this.options.type != 'bool' && this.options.submitOnBlur !== false) {
				// do not submit when clicking inside the div
				this.$inputDiv.on('click', function (event) {
					if (self.options.submitOnBlur === true && self.state.readOnly === false && self.isShown()) {
						utils.stopPropagation(event);
					}
				});
			}

			//bool type has no key events, but has click event
			if (this.options.type === 'bool') {
				this.$input.on('click', function () {
					// inverse the bool value
					self.setInputValue(!self.getValue());
					self.initiateSubmit();
				});
			} else {
				var $eventTriggerer = this.$input;
				var onEscape = function (event) {
					// escape pressed => do cancel
					utils.preventDefault(event);
					self.cancel();
				};
				var onEnter = function (event, isMultiField) {
					// enter pressed => initiate submit, textarea requires ctrl + enter
					if ($(event.target).prop("tagName") != 'TEXTAREA' || event.ctrlKey) {
						utils.preventDefault(event);
						// do not tab on enter if type is multifield
						if (self.canTab() && isMultiField !== true) {
							if (event.shiftKey) {
								self.state.doTab = -1;
							} else {
								self.state.doTab = 1;
							}
						}
						self.initiateSubmit();
					}
				};
				var onTab = function (event) {
					// tab pressed => trigger tabbing and submit, if enabled
					if (self.canTab()) {
						utils.preventDefault(event);
						if (event.shiftKey) {
							self.state.doTab = -1;
						} else {
							self.state.doTab = 1;
						}
						self.initiateSubmit();
					}
				};
				if (this.options.type === 'multifield') {
					// if type is multifield, then only the last input will trigger tabbing events
					// taking advantage that jquery always returns the elements in the order they are in the dom
					var $inputArray = this.$input.find('input:not([type="hidden"]), textarea').toArray();
					if ($inputArray.length > 0) {
						var $lastTabElement = $($inputArray.pop());
						if ($inputArray.length > 1) {
							var $firstTabElement = $($inputArray.shift());
							// if type is multifield, then every input(thats not hidden) can submit with Enter and cancel with ESC
							$.each($inputArray, function (index, element) {
								$(element).on('keydown', function (event) {
									if (event.which == 27) {
										onEscape(event);
									} else if (event.which == 13) {
										onEnter(event, true);
									}
								});
							});
							$lastTabElement.on('keydown', function (event) {
								if (event.which == 27) {
									onEscape(event);
								} else if (event.which == 13) {
									onEnter(event);
									// only tab forward, this is the last input
								} else if (event.which == 9 && !event.shiftKey) {
									onTab(event);
								}
							});
							$firstTabElement.on('keydown', function (event) {
								if (event.which == 27) {
									onEscape(event);
								} else if (event.which == 13) {
									onEnter(event);
									// only tab backwards, this is the first input
								} else if (event.which == 9 && event.shiftKey) {
									onTab(event);
								}
							});
						} else {
							// if there is one element, then treat it as default
							$lastTabElement.on('keydown', function (event) {
								if (event.which == 27) {
									onEscape(event);
								} else if (event.which == 13) {
									onEnter(event);
								} else if (event.which == 9) { // tab pressed => trigger tabbing and submit, if enabled
									onTab(event);
								}
							});
						}
					}
				} else {
					$eventTriggerer.on('keydown', function (event) {
						if (event.which == 27) {
							onEscape(event);
						} else if (event.which == 13) {
							onEnter(event);
						} else if (event.which == 9) { // tab pressed => trigger tabbing and submit, if enabled
							onTab(event);
						}
					});
				}
			}

			this.$inputDiv.hide();
			if (this.options.mode == 'popup') {
				$('body').append(this.$inputDiv);
			} else {
				this.$element.after(this.$inputDiv);
			}
			this.$inputDiv.append($inputWrapper);

			// create clear button to clear the input value, if enabled and correct type and its not IE: IE has its own clear button
			if (inputType != 'select' && inputType != 'datetimepicker' && this.options.clearButton === true &&
				utils.getIEVersion() === 0) {
				var $clearButton = $("<span></span>").addClass('editable-clear-button').text('✖');
				// multifield has special clear function
				if (inputType == 'multifield') {
					$clearButton.text('Clear').addClass('editable-button');
				} else {
					$clearButton.text('✖');
				}
				$clearButton.on('click', function () {
					self.clearInputValue();
					self.focus();
				});
				var $clearWrapper = $('<div></div>').addClass('editable-clear-wrapper');
				$clearWrapper.append(this.$input);
				$clearWrapper.append($clearButton);
				$inputWrapper.append($clearWrapper);
			} else {
				$inputWrapper.append(this.$input);
			}
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
				// sets current value if the conditions are met, or sets to null
				if ((typeof dateTimeSettings['useCurrent'] === 'undefined' || dateTimeSettings['useCurrent'] === true) ||
					typeof dateTimeSettings['defaultDate'] !== 'undefined') {
					this.setValue(this.getInputValue());
				} else {
					this.$input.datetimepicker('clear');
					this.setInputValue(this.getValue());
				}
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
				var popupWrap = $('<div></div>').addClass('editable-popup-wrapper').addClass(this.options.placement);
				this.$inputDiv.wrapInner(popupWrap);
			}
		};

		BetterEditable.prototype.recreateInputField = function (preserveOldValue, wasPopup) {
			if (preserveOldValue !== false) {
				preserveOldValue = true;
			}
			var returnData = {};
			this.$element.trigger("be.beforeRecreate", {
				editable: this,
				preserveOldValue: preserveOldValue,
				wasPopup: wasPopup,
				returnData: returnData
			});
			// cancel recreate if event set to false
			if (returnData.flag === false) {
				return false;
			}
			var oldValue = this.getValue();
			if (this.isShown()) {
				this.hideInput(wasPopup);
			}
			this.options.destroyError(this);
			this.$inputDiv.remove();
			this.createInputField();
			if (preserveOldValue) {
				this.setValue(oldValue);
				this.setInputValue();
			}
			this.options.displayFunction(this);

			this.$element.trigger("be.afterRecreate", this);
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

		BetterEditable.prototype.isReadOnly = function () {
			return this.state.readOnly;
		};

		BetterEditable.prototype.canTab = function () {
			return this.options.tabbingOn === true && !this.isReadOnly() &&
			(typeof this.options.tabIndex === 'string' || typeof this.options.tabIndex === 'number');
		};
	}

	// Main action scope
	{
		BetterEditable.prototype.show = function (tabDirection) {
			if (!this.canBeShown()) {
				return false;
			}

			if (this.state.isValid) {
				this.options.errorHandler('', this, false);
			}
			if (this.options.mode !== 'popup') {
				this.$element.hide();
				this.$inputDiv.show();
			}
			this.setInputValue();
			this.$inputDiv.show();
			if (this.options.mode === 'popup') {
				// move the popup so it doesn't appear on top of the editable element.
				this.togglePopupOpen(true);
				var topPos = this.$element.offset()['top'];
				var leftPos = this.$element.offset()['left'];
				if (this.options.placement === 'bottom') {
					topPos += 7;
				} else if (this.options.placement === 'top') {
					var heightOffset = this.$element.outerHeight();
					if (this.$inputDiv.children().first().outerHeight() > heightOffset) {
						heightOffset = this.$inputDiv.children().first().outerHeight();
					}
					topPos -= heightOffset + 7;
				} else if (this.options.placement === 'right') {
					leftPos += this.$element.outerWidth() + 7;
					topPos -= 7;
				} else if (this.options.placement === 'left') {
					var widthOffset = this.$element.outerWidth();
					if (this.$inputDiv.children().first().outerWidth() > widthOffset) {
						widthOffset = this.$inputDiv.children().first().outerWidth();
					}
					leftPos -= widthOffset + 7;
					topPos -= 7;
				}
				this.$inputDiv.css('top', topPos + 'px');
				this.$inputDiv.css('left', leftPos + 'px');
			}
			this.focus(tabDirection);

			this.$element.trigger("be.shown", this);
		};

		BetterEditable.prototype.hideInput = function (wasPopup) {
			var self = this;
			this.$inputDiv.hide()
			this.$element.show();

			if (this.options.mode === 'popup' || wasPopup === true) {
				this.togglePopupOpen(false);
			}

			this.$element.trigger("be.hidden", this);
		};

		BetterEditable.prototype.initiateSubmit = function (newValue, forceSubmit) {
			if (typeof newValue !== 'undefined') {
				this.$input.val(newValue);
			}

			if (forceSubmit !== true && this.options.submitNoChange === false && this.compare()) {
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

			this.$element.trigger("be.cancelled", this);
		};

		BetterEditable.prototype.triggerTabbing = function (tabDirection, $nextEditable) {
			if (!this.canTab()) {
				return false;
			}
			var nextTab = Number(this.options.tabIndex);
			if (typeof $nextEditable === 'object' && $nextEditable !== null) {
				nextTab = $nextEditable.data('tab-index');
			} else {
				nextTab += tabDirection;
				$nextEditable = $('[data-editable][data-tab-index="' + nextTab + '"]');
			}
			if ($nextEditable.length > 0) {
				var returnData = {};
				var continueTab = this.$element.trigger("be.beforeTab", {
					direction: tabDirection,
					nextTab: nextTab,
					editable: this,
					returnData: returnData
				});
				if (returnData.flag !== false) {
					$nextEditable = $nextEditable.first();
					// if type is bool or its not visible, skip it and go to next tab
					if ($nextEditable.is(":visible") && $nextEditable.betterEditable().options.type !== 'bool') {
						$nextEditable.betterEditable().show(tabDirection);
					} else {
						$nextEditable.betterEditable().triggerTabbing(tabDirection);
					}
				}
			}

			return true;
		};

		BetterEditable.prototype.focus = function (tabDirection) {
			if (this.options.type == 'multifield') {
				// find the first input and focus it
				var $focusWrapper = this.$input.children();
				if (tabDirection === -1) {
					$focusWrapper = $focusWrapper.last();
				} else {
					$focusWrapper = $focusWrapper.first();
				}
				while ($focusWrapper.length > 0) {
					if ($focusWrapper.hasClass("editable-multifield-input-wrapper")) {
						var $focus;
						if (tabDirection === -1) {
							$focus = $focusWrapper.find('input:not([type="checkbox"])').last();
						} else {
							$focus = $focusWrapper.find('input:not([type="checkbox"])').first();
						}
						if ($focus.length > 0) {
							$focus.focus();
							break;
						} else {
							if (tabDirection === -1) {
								$focus = $focusWrapper.find('textarea').last();
							} else {
								$focus = $focusWrapper.find('textarea').first();
							}
							if ($focus.length > 0) {
								$focus.focus();
								break;
							}
						}
					}
					if (tabDirection === -1) {
						$focusWrapper = $focusWrapper.prev();
					} else {
						$focusWrapper = $focusWrapper.next();
					}
				}
			} else {
				// default focus
				this.$input.focus();
			}
		};

		BetterEditable.prototype.compare = function (value1, value2, type) {
			if (typeof value1 === 'undefined') {
				value1 = this.getValue();
			}
			if (typeof value2 === 'undefined') {
				value2 = this.getInputValue();
			}
			if (typeof type === 'undefined') {
				type = this.options.type;
			}
			if (typeof value1 === 'undefined' || typeof value2 === 'undefined') {
				if (typeof value1 === 'undefined') {
					if (typeof value2 === 'undefined') {
						return true;
					} else {
						return false;
					}
				} else {
					return false;
				}
			}
			if (value1 === null || value2 === null) {
				if (value1 === null) {
					if (value2 === null) {
						return true;
					} else {
						return false;
					}
				} else {
					return false;
				}
			}
			if (type === 'datetimepicker') {
				if (typeof value1 === 'object') {
					return value1.isSame(value2);
				} else if (typeof value2 === 'object') {
					return value2.isSame(value1);
				}
			} else if (type === 'multifield' && utils.isArray(value1) && utils.isArray(value2)) {
				if (value1.length !== value2.length) {
					return false;
				}
				for (var index = 0; index < value1.length; ++index) {
					var notEqual = false;
					Object.keys(value1[index]).forEach(function (name) {
						if (value1[index][name] !== value2[index][name]) {
							notEqual = true;
						}
					});
					if (notEqual) {
						return false;
					}
				}
				return true;
			}

			return (value1 === value2);
		};
	}

	// Getters, setters, toggle, reset scope
	{
		BetterEditable.prototype.setValue = function (newValue) {
			// convert value to boolean type, if type is bool
			if (this.options.type == 'bool') {
				newValue = utils.normalizeBoolean(newValue);
			} else if (this.options.type == 'number') {
				// convert value to number type, if type is number
				newValue = utils.normalizeNumber(newValue);
			} else if ($.inArray(this.options.type, utils.textTypes) !== -1) {
				// convert value to string type, if type is text
				newValue = utils.normalizeString(newValue);
			}

			var oldValue = this.getValue();
			this.value = newValue;

			this.$element.trigger("be.change", {
				newValue: newValue,
				oldValue: oldValue,
				editable: this
			});

			return oldValue;
		};

		BetterEditable.prototype.getValue = function () {
			if (typeof this.value === 'object' && this.value !== null) {
				if (this.options.type === 'datetimepicker') {
					return this.value.clone();
				} else if (this.options.type === 'multifield') {
					return $.extend(true, [], this.value);
				}
			}
			return this.value;
		};

		BetterEditable.prototype.setInputValue = function (newValue) {
			var self = this;
			if (typeof newValue === 'undefined') {
				newValue = this.getValue();
			}
			if (this.options.type == 'datetimepicker') {
				var dateObj = this.$input.data('DateTimePicker');
				if (newValue === null || typeof newValue === 'undefined' || (typeof newValue === 'string' && newValue.trim() === '')) {
					this.$input.datetimepicker('clear');
					newValue = '';
				} else {
					if (isNaN(Date.parse(newValue))) {
						dateObj.date(newValue);
					} else {
						dateObj.date(new Date(newValue));
					}
					if (dateObj.date() !== null) {
						newValue = dateObj.date().format(this.$input.data('DateTimePicker').format());
					} else {
						newValue = '';
					}
				}
				this.$input.val(newValue);
			} else if (this.options.type == 'multifield') {
				for (var index = 0; index < newValue.length; ++index) {
					Object.keys(newValue[index]).forEach(function (name) {
						var $field = self.$input.find('input[name="' + name + '"]').first();
						if ($field.length > 0) {
							if ($field.attr('type') === 'checkbox') {
								$field.prop('checked', utils.normalizeBoolean(newValue[index][name]));
							} else {
								$field.val(newValue[index][name]);
							}
						} else {
							$field = self.$input.find('textarea[name="' + name + '"]').first();
							if ($field.length > 0) {
								$field.val(newValue[index][name]);
							}
						}
					});
				}
			} else {
				this.$input.val(newValue);
			}
		};

		BetterEditable.prototype.getInputValue = function () {
			var returnValue = this.$input.val();
			if (this.options.type == 'bool') {
				returnValue = utils.normalizeBoolean(returnValue);
			} else if (this.options.type == 'number') {
				// convert value to number type, if type is number
				returnValue = utils.normalizeNumber(returnValue);
			} else if (this.options.type == 'text') {
				// convert value to string type, if type is text
				returnValue = String(returnValue);
			} else if (this.options.type == 'datetimepicker') {
				if (this.$input.data('DateTimePicker').date() !== null) {
					returnValue = this.$input.data('DateTimePicker').date().clone();
				} else {
					returnValue = null;
				}
			} else if (this.options.type == 'multifield') {
				returnValue = [];
				var inputName = '';
				var inputValue = '';
				this.$input.children().each(function() {
					var $innerInput = $(this).find('input');
					if ($innerInput.length === 0) {
						$innerInput = $(this).find('textarea');
					}
					if ($innerInput.length === 1) {
						inputName = $innerInput.attr('name');
						if (typeof inputName === 'string' && inputName.trim() !== '') {
							if ($innerInput.attr('type') == 'checkbox') {
								inputValue = $innerInput[0].checked;
							} else {
								inputValue = $innerInput.val();
							}
							var objToPush = {};
							objToPush[inputName] = inputValue
							returnValue.push(objToPush);
						}
					}
				});
			}
			return returnValue;
		};

		BetterEditable.prototype.clearInputValue = function () {
			if (this.options.type == 'datetimepicker') {
				this.$input.datetimepicker('clear');
			} else if (this.options.type == 'multifield') {
				// multifield clear: clear all inputs and uncheck checkboxes
				this.$input.find('input').each(function () {
					if ($(this).attr('type') == 'checkbox') {
						$(this).prop('checked', false);
					} else {
						$(this).val('');
					}
				});
				this.$input.find('textarea').each(function () {
					$(this).val('');
				});
			} else {
				// default clear
				this.$input.val('');
			}
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
				if (this.isShown()) {
					this.cancel();
				}

				if (!this.$element.hasClass('disabled')) {
					this.$element.addClass('disabled');
				}
			} else {
				this.$element.removeClass('disabled');
			}
			this.$element.prop("disabled", toggleFlag)
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
				newValue = this.getValue();
			}
			var self = this;
			// trigger before validate event
			var returnData = {
				newValue: newValue
			};
			this.$element.trigger("be.beforeValidate", {
				editable: self,
				returnData: returnData
			});
			if (returnData.flag === false) {
				return false;
			}
			// gets a new value before validation, if changed in the event
			newValue = returnData.newValue;

			for (var index = 0; index < this.validators.length; ++index) {
				var validatorValue = this.$element.data(this.validators[index] + "-val");
				if (typeof validatorValue === 'undefined') {
					validatorValue = this.$element.data(this.validators[index]);
				}
				var validatorResult = $.betterEditableData.validators[this.validators[index]].validator(newValue, validatorValue, this.$element);
				if (validatorResult === false) {
					var errorMsg = this.$element.data(this.validators[index] + "-msg");
					if (typeof errorMsg !== 'string') {
						errorMsg = $.betterEditableData.validators[this.validators[index]].errorMsg(this.options.fieldName, validatorValue, this.$element);
					}
					if (triggerErrors !== false) {
						this.options.errorHandler(errorMsg, this, true);
					}
					this.state.isValid = false;
					this.$element.trigger("be.failedValidation", {
						newValue: newValue,
						editable: self
					});
					return false;
				}
			}
			return true;
		};

		// processed data is only send to server, but not saved, by default
		BetterEditable.prototype.processSubmitData = function (submitData) {
			if (this.options.type === 'datetimepicker') {
				if (submitData !== null) {
					submitData = submitData.format(this.$input.data('DateTimePicker').format());
				}
			} else if (this.options.type === 'multifield' && utils.isArray(submitData)) {
				if (submitData.length === 0) {
					submitData = null;
				} else {
					var newData = {};
					for (var index = 0; index < submitData.length; ++index) {
						Object.keys(submitData[index]).forEach(function (name) {
							newData[name] = submitData[index][name];
						});
					}
					submitData = newData;
				}
			}

			return submitData;
		};

		BetterEditable.prototype.submitData = function () {
			var submitData = this.getInputValue();
			if (!this.isShown()) {
				submitData = this.getValue();
			}
			var oldValue = this.getValue();
			this.setValue(submitData);
			var self = this;

			// process the data
			submitData = this.processSubmitData(submitData);
			// trigger before submit event
			var returnData = {
				submitData: submitData,
				oldValue: oldValue
			};
			this.$element.trigger("be.beforeSubmit", {
				editable: self,
				returnData: returnData
			});
			if (returnData.flag === false) {
				// set back the value to the old value, since there is a pre-submit custom error
				oldValue = returnData.oldValue;
				this.setValue(oldValue);
				this.state.isValid = false;
				// returns true for a pre-submit error ; returning false is for after submit error
				return true;
			}
			// get submit value again, if it was changed in the event above.
			// Note: does not change the actual value of the editable, but the one that will be submited
			submitData = returnData.submitData;

			// use custom data if defined
			var dataToSent = $.extend({}, this.options.ajaxParams);
			if (typeof submitData === 'object' && submitData !== null) {
				Object.keys(submitData).forEach(function (key) {
					if (typeof dataToSent[key] === 'undefined') {
						dataToSent[key] = submitData[key];
					}
				});
			} else if (typeof dataToSent["value"] === 'undefined') {
				dataToSent["value"] = submitData;
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
					if (!$.betterEditableData.asyncRequests) {
						self.options.load.start(self);
					}
				};
			}
			if (typeof ajaxObj["success"] === 'undefined') {
				ajaxObj["success"] = function (data) {
					self.options.onAjaxSuccess(data, self);
					if (self.state.doTab !== false) {
						--$.betterEditableData.submitting;
						self.triggerTabbing(self.state.doTab);
					}
					self.$element.trigger("be.ajaxSuccess", {
						response: data,
						editable: self,
						oldValue: oldValue
					});
					self.afterProcess();
					if ($.betterEditableData.asyncRequests) {
						$.betterEditableData.functions.requestExecutionEnd();
					}
				};
			}
			if (typeof ajaxObj["error"] === 'undefined') {
				ajaxObj["error"] = function (errorObj, xhr, settings, exception) {
					self.state.isValid = false;
					var errorValue = self.getValue();
					self.setValue(oldValue);
					self.options.onAjaxError(errorObj, xhr, settings, exception, errorValue, self);
					if (self.state.doTab !== false) {
						--$.betterEditableData.submitting;
					}
					self.$element.trigger("be.ajaxError", {
						errorObj: errorObj,
						xhr: xhr,
						settings: settings,
						exception: exception,
						errorValue: errorValue,
						editable: self
					});
					self.afterProcess();
					if ($.betterEditableData.asyncRequests) {
						$.betterEditableData.functions.requestExecutionEnd();
					}
				};
			}

			// only submit if url is defined
			if (typeof ajaxObj["url"] === 'string' && ajaxObj["url"] !== '') {
				// handle async requests
				if ($.betterEditableData.asyncRequests) {
					ajaxObj["doTab"] = this.state.doTab;
					this.options.load.start(this);
					$.betterEditableData.functions.addToQueue(ajaxObj);
					$.betterEditableData.functions.attemptRequestExecution();
				} else {
					if (self.state.doTab !== false) {
						++$.betterEditableData.submitting;
					}
					$.ajax(ajaxObj);
				}
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
				if (typeof this.data('betterEditable') === 'object' && this.data('betterEditable') !== null && typeof $.betterEditableData.methods[method] === 'function') {
					var methodArguments = [].slice.call(arguments);
					methodArguments.shift();
					methodArguments.unshift(this.data('betterEditable'));
					return $.betterEditableData.methods[method].apply(null, methodArguments);
				}
			}
		};
	}

	// Global scope
	{
		$(document).on('keydown', function (event) {
			if (event.which == 9) {
				if ($.betterEditableData.submitting > 0 && $.betterEditableData.blockTab === true) {
					utils.preventDefault(event);
				} else if ($.betterEditableData.submitting === 0 && $('[data-editable-div]:visible').length == 0) {
					var $firstTabElement = $('[data-editable-first-tab]:visible').first();
					var $lastTabElement = $('[data-editable-last-tab]:visible').first();
					if (!event.shiftKey && $firstTabElement.length > 0 && typeof $firstTabElement.betterEditable() === 'object' &&
						$firstTabElement.betterEditable() !== null && $firstTabElement.betterEditable().options.tabbingOn == true) {
						utils.preventDefault(event);
						$firstTabElement.betterEditable().triggerTabbing(1, $firstTabElement);
					} else if (event.shiftKey && $lastTabElement.length > 0 && typeof $lastTabElement.betterEditable() === 'object' &&
						$lastTabElement.betterEditable() !== null && $lastTabElement.betterEditable().options.tabbingOn == true) {
						utils.preventDefault(event);
						$lastTabElement.betterEditable().triggerTabbing(-1, $lastTabElement);
					}
				}
			}
		});
	}
})();
