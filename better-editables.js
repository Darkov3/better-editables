(function(){
	"use strict";

	// betterEditableData scope
	{
		$.betterEditableData = {};
		$.betterEditableData.version = "0.33.50";

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
			// fills a select element with values from a data source, or creates a radio button set
			createHtmlFromData: function($element, dataSource, type) {
				var name = "";
				if (type == 'radio') {
					name = dataSource.name;
					dataSource = dataSource.data;
				}
				var createHtml = function(valueField, textField, type) {
					switch (type) {
						case "select":
							$element.append($('<option>', {
								value: valueField,
								text: textField
							}));
							break;
						case "radio":
							var $newInput = $('<input></input>').attr('type', 'radio').attr('name', name).val(valueField)
							var $labelElement = $('<label></label>').addClass('radiobox-type').text(textField);
							$labelElement.prepend($newInput);
							$element.append($labelElement);
							break;
					}
				}
				for (var index = 0; index < dataSource.length; ++index) {
					if (typeof dataSource[index] === 'object') {
						if (utils.isArray(dataSource[index])) {
							if (dataSource[index].length >= 1) {
								var valueField = dataSource[index][0];
								var textField = valueField;
								if (dataSource[index].length >= 2) {
									textField = dataSource[index][1];
								}
								createHtml(valueField, textField, type);
							}
						} else {
							var valueField = dataSource[index]["value"];
							var textField = valueField;
							if (typeof dataSource[index]["text"] !== 'undefined') {
								textField = dataSource[index]["text"];
							}
							if (typeof valueField === 'undefined') {
								valueField = textField;
							}
							createHtml(valueField, textField, type);
						}
					}
				}
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
				'readOnly',
				'send'
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
				'multifield',
				'typeahead'
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
					if (editable.options.type == 'password') {
						value = editable.options.passwordDisplay(editable, value);
					} else if (editable.options.type == 'select') {
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
			passwordDisplay: function (editable, value) {
				return String(value).replace(new RegExp('.', 'g'), '*');
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
							} else if (dataSource[index]["value"] == value && typeof dataSource[index]["text"] !== 'undefined') {
								value = dataSource[index]["text"];
								break;
							}
						}
					}
				}
				return value;
			},
			textareaDisplay: function (editable, value) {
				return String(value).replace(new RegExp('\r|\n|\r\n', 'g'), '<br/>');
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
						// remove comma and space at the end
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
			minnumber: {
				errorMsg: function (name, validatorValue, $element) {
					return name + " must be greater or equal to " + validatorValue + "!";
				},
				validator: function (value, validatorValue, $element) {
					if (value < Number(validatorValue)) {
						return false;
					}
					return true;
				}
			},
			maxnumber: {
				errorMsg: function (name, validatorValue, $element) {
					return name + " must be smaller or equal to " + validatorValue + "!";
				},
				validator: function (value, validatorValue, $element) {
					if (value > Number(validatorValue)) {
						return false;
					}
					return true;
				}
			},
			exactnumber: {
				errorMsg: function (name, validatorValue, $element) {
					return name + " must be equal to " + validatorValue + "!";
				},
				validator: function (value, validatorValue, $element) {
					if (value != Number(validatorValue)) {
						return false;
					}
					return true;
				}
			},
			mustbeinteger: {
				errorMsg: function (name, validatorValue, $element) {
					return name + " must be an integer!";
				},
				validator: function (value, validatorValue, $element) {
					return /^(-|\+){0,1}\d+$/.test(String(value));
				}
			},
			validatestep: {
				errorMsg: function (name, validatorValue, $element) {
					if (Number(validatorValue) == 0) {
						validatorValue = 1;
					}
					return name + " must be a step of " + validatorValue + "!";
				},
				validator: function (value, validatorValue, $element) {
					if (Number(validatorValue) == 0) {
						validatorValue = 1;
					}
					var result = Number(value) / Number(validatorValue);
					result = Math.round(result * 100) / 100;
					return -1 === String(result).indexOf('.');
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
					function requiredIfCheck(desiredValue, dependentPropertyId) {
						desiredValue = $.trim(String(typeof desiredValue === 'undefined' || desiredValue == null ? '' : desiredValue)).toLowerCase();
						var tagName = $('#' + dependentPropertyId).get(0).tagName.toLowerCase();
						if (typeof $('#' + dependentPropertyId).get(0) !== 'undefined' && tagName !== 'input' && tagName !== 'textarea') {
							return desiredValue === $.trim($('#' + dependentPropertyId).text()).toLowerCase();
						}
						var controlType = $("input[id$='" + dependentPropertyId + "']").attr("type");

						var actualValue = {};
						if (controlType == "radio") {
							var control = $("input[id$='" + dependentPropertyId + "']:checked");
							actualValue = control.val();
						} else if (controlType == "checkbox") {
							actualValue = $("input[id$='" + dependentPropertyId + "']").is(":checked");
						} else {
							actualValue = $("#" + dependentPropertyId).val();
						}

						return desiredValue === $.trim(actualValue).toLowerCase();
					}

					var required;
					var defaultDesiredValue = validatorValue;
					if (typeof $element.data("requiredif-dependentpropertyid") !== 'undefined') {
						required = requiredIfCheck(defaultDesiredValue, $element.data("requiredif-dependentpropertyid"));
					} else {
						var index = 0;
						var desiredValue;
						while (typeof $element.data("requiredif-dependentpropertyid-" + index) !== 'undefined') {
							desiredValue = $element.data("requiredif-desiredvalue-" + index);
							if (typeof desiredValue === 'undefined' || desiredValue === null) {
								desiredValue = defaultDesiredValue;
							}
							required = requiredIfCheck(desiredValue, $element.data("requiredif-dependentpropertyid-" + index));
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
			getProcessedValue: function (editable, dataToProcess) {
				if (typeof dataToProcess === 'undefined') {
					dataToProcess = editable.getValue();
				}
				return editable.processSubmitData(dataToProcess);
			},
			setValue: function (editable, newValue) {
				editable.setValue(newValue);
				editable.options.displayFunction(editable);
				return editable.$element;
			},
			submit: function (editable) {
				editable.setInputValue();
				editable.initiateSubmit(undefined, true);
				return editable.$element;
			},
			setOption: function (editable, optionName, optionValue) {
				if ($.inArray(optionName, utils.requireBoolNormalization) !== -1) {
					optionValue = utils.normalizeBoolean(optionValue);
				}
				if (optionName == "readOnly") {
					editable.toggleReadOnly(optionValue);
					return editable.$element;
				}
				var oldVal = editable.options[optionName];
				if (oldVal === optionValue) {
					return editable.$element;
				}
				editable.options[optionName] = optionValue;
				if (optionName == "tabIndex" && editable.options.tabbingOn === true) {
					editable.$element.attr('data-tab-index', editable.options.tabIndex);
				} else if (optionName == "tabbingOn" && (typeof editable.options.tabIndex === 'string' || typeof editable.options.tabIndex === 'number')) {
					editable.$element.attr('data-tab-index', editable.options.tabIndex);
				} else if ($.inArray(optionName, utils.requireRecreateInput) !== -1) {
					var preserveOldValue = (optionName != 'type');
					var wasPopup = (optionName == 'mode' && oldVal == 'popup');
					editable.recreateInputField(preserveOldValue, wasPopup);
				}
				return editable.$element;
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
				return editable.$element;
			},
			enable: function (editable) {
				editable.toggleReadOnly(false);
				return editable.$element;
			},
			disable: function (editable) {
				editable.toggleReadOnly(true);
				return editable.$element;
			},
			focus: function (editable) {
				if (editable.isShown()) {
					editable.focus();
				}
				return editable.$element;
			},
			clear: function (editable) {
				if (editable.isShown()) {
					editable.clear();
				}
				return editable.$element;
			},
			destroy: function (editable) {
				var toReturn = editable.$element;
				editable.resetState();
				editable.hideInput();
				editable.$inputDiv.remove();
				editable.$element.off();
				editable.$element.data('betterEditable', null);
				editable = null;
				return toReturn;
			},
			toggle: function (editable, toggleFlag) {
				if (toggleFlag === true) {
					if (!editable.isShown()) {
						editable.show();
					}
				} else if (editable.isShown()) {
					editable.cancel();
				}
				return editable.$element;
			},
			show: function (editable) {
				if (!editable.isShown()) {
					editable.show();
				}
				return editable.$element;
			},
			hide: function (editable) {
				if (editable.isShown()) {
					editable.cancel();
				}
				return editable.$element;
			},
			tab: function (editable, direction) {
				if (editable.isShown() && editable.canTab()) {
					if (direction !== -1) {
						direction = 1;
					}
					editable.state.doTab = direction;
					editable.initiateSubmit();
				}
				return editable.$element;
			},
			createValidator: function (editable, validatorName, validatorFunction, messageFunction) {
				if (typeof $.betterEditableData.validators[validatorName] !== 'undefined') {
					throw "Validator '" + validatorName + "' already exists!";
				}
				$.betterEditableData.validators[validatorName] = {
					errorMsg: messageFunction,
					validator: validatorFunction
				}
				if (typeof editable === 'object' && editable !== null) {
					return editable.$element;
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
				if (typeof editable === 'object' && editable !== null) {
					return editable.$element;
				}
			},
			detachValidator: function (editable, validatorName) {
				for (var index = 0; index < editable.validators.length; ++index) {
					if (editable.validators[index] == validatorName) {
						editable.validators.splice(index, 1);
						break;
					}
				}
				if (typeof editable === 'object' && editable !== null) {
					return editable.$element;
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
				if (typeof editable === 'object' && editable !== null) {
					return editable.$element;
				}
			}
		};

		$.betterEditableData.submitting = 0;
		$.betterEditableData.blockTab = true;
		$.betterEditableData.asyncRequests = false;
		$.betterEditableData.requestBeingExecuted = false;
		$.betterEditableData.requests = [];
		
		$.betterEditableData.functions = {
			// when applyToAll is ran, it will automatically run betterEditable function to all html elements with data-editable, 
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
					if (ajaxObj["editable_option_doTab"] !== false) {
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
			this.options.fieldName = setIfDefined([this.$element.data('name'), settings.fieldName, this.$element.attr('name'), this.$element.data('title'), this.$element.attr('title'), this.$element.attr('id')]);
			this.options.pk = setIfDefined([this.$element.data('pk'), settings.pk]);
			this.options.toggle = setIfDefined([this.$element.data('toggle'), settings.toggle, 'click']);
			this.options.mode = setIfDefined([this.$element.data('mode'), settings.mode]);
			if (this.options.mode !== 'popup') {
				this.options.mode = 'inline';
			}
			this.options.placement = setIfDefined([this.$element.data('placement'), settings.placement, "right"]);
			this.options.placementAlign = setIfDefined([this.$element.data('placement-align'), settings.placementAlign, "center"]);
			this.options.type = setIfDefined([this.$element.data('type'), this.$element.attr('type'), settings.type, "text"]);
			this.options.typeSettings = setIfDefined([this.$element.data('type-settings'), settings.typeSettings]);
			this.options.send = setIfDefined([this.$element.data('send'), settings.send, true], true);
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
			this.options.passwordDisplay = setIfDefined([settings.passwordDisplay, function (editable, value) {
				return $.betterEditableData.default.passwordDisplay(editable, value);
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
			this.options.viewPassword = setIfDefined([this.$element.data('view-password'), settings.viewPassword, true], true);
			this.options.buttonsOn = setIfDefined([this.$element.data('buttons-on'), settings.buttonsOn, true], true);
			this.options.inputClass = setIfDefined([this.$element.data('input-class'), settings.inputClass]);
			this.options.buttonClass = setIfDefined([this.$element.data('button-class'), settings.buttonClass]);
			this.options.errorClass = setIfDefined([this.$element.data('error-class'), settings.errorClass]);
			this.options.tabIndex = setIfDefined([this.$element.data('tab-index'), settings.tabIndex]);
			this.options.tabbingOn = setIfDefined([this.$element.data('tabbing-on'), settings.tabbingOn, false], true);

			//special init for number type:
			if (this.options.type === 'number' && typeof this.options.typeSettings === 'undefined') {
				this.options.typeSettings = setIfDefined([this.$element.data('step'), this.$element.attr('step')]);
			}

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

			return this;
		};

		BetterEditable.prototype.createInputField = function () {
			var self = this;
			var ieVersion = utils.getIEVersion();
			var inputType = this.options.type;
			if ($.inArray(inputType, utils.possibleTypes) === -1) {
				inputType = 'text';
			}
			this.$inputDiv = $("<div></div>").attr('data-editable-div', this.$element.attr('id')).addClass(this.options.mode).addClass(inputType).addClass('editable-input-div').addClass(this.options.inputClass);
			// add special css for IE compatibility
			if (ieVersion !== 0) {
				this.$inputDiv.addClass('ie-browser').addClass('ie-browser-version-' + ieVersion);
			}
			this.$input = null;
			if (inputType == 'textarea') {
				this.$input = $('<textarea></textarea>');
			} else if (inputType == 'number') {
				this.$input = $('<input></input>').attr('type', 'number');
				if (typeof this.options.typeSettings !== 'undefined') {
					this.$input.attr('step', this.options.typeSettings);
				}
			} else if (inputType == 'select') {
				this.$input = $('<select></select>');
				var dataSource = this.options.typeSettings;
				if (utils.isArray(dataSource)) {
					utils.createHtmlFromData(this.$input, dataSource, 'select');
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
						var foptions = this.$element.data("input" + dataIndex + "-options");
						if (typeof fname === 'string') {
							if (typeof ftype !== 'string') {
								ftype = "text";
							}
							if (typeof fval === 'undefined') {
								fval = "";
							}
							if (ftype === 'checkbox'){
								fval = utils.normalizeBoolean(fval);
							}
							dataSource[fname] = [ftype, flabel, fval, foptions];
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
					var createField = function(fieldName, fieldLabel, fieldType, fieldValue, fieldOptions) {
						var $fieldWrapper = $('<div></div>').addClass('editable-multifield-input-wrapper').addClass(fieldType + "-type");
						var $newField;
						var $labelElement;
						if (fieldType === 'textarea') {
							$newField = $('<textarea></textarea>').val(fieldValue);
						} else if (fieldType === 'select') {
							$newField = $('<select></select>');
							if (utils.isArray(fieldOptions)) {
								utils.createHtmlFromData($newField, fieldOptions, 'select');
							}
							$newField.val(fieldValue);
						} else if (fieldType === 'radio') {
							$newField = $('<div></div>').addClass('editable-multifield-radio-wrapper').attr('data-multifield-radio', "");
							if (utils.isArray(fieldOptions)) {
								utils.createHtmlFromData($newField, {
									name: fieldName,
									data: fieldOptions
								}, 'radio');
							}
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
							if (fieldType === 'radio') {
								$('input[type="radio"][name="' + fieldName + '"][value="' + fieldValue + '"]').prop('checked', true);
							} else {
								$newField.val(fieldValue);
							}
							$labelElement = $('<div></div>').addClass('editable-multifield-label');
							if (typeof fieldLabel === 'string' && fieldLabel.trim() !== '' && fieldType !== 'hidden') {
								$labelElement.text(fieldLabel);
							}
							$fieldWrapper.append($labelElement);
							$fieldWrapper.append($newField);
						}
						self.$input.append($fieldWrapper);
					}
					Object.keys(dataSource).forEach(function (name) {
						if (typeof dataSource[name] !== 'object' || utils.isArray(dataSource[name])) {
							var fieldName = name;
							var fieldLabel = name;
							var fieldType = dataSource[name];
							var fieldValue = undefined;
							var fieldOptions = undefined;
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
									if (fieldType.length > 3) {
										fieldOptions = fieldType[3];
									}
									fieldType = fieldType[0];
								}
							} else {
								fieldLabel += ": ";
							}
							createField(fieldName, fieldLabel, fieldType, fieldValue, fieldOptions);
						} else {
							createField(name, dataSource[name].label, dataSource[name].type, dataSource[name].value, dataSource[name].options);
						}
					});
				}
			} else if (inputType == 'typeahead') {
				this.$input = $('<div></div>').addClass('editable-typeahead-wrapper');
				var $tform = $('<form></form>');
				var $tcontainer = $('<div></div>').addClass('typeahead__container');
				var $tfield = $('<div></div>').addClass('typeahead__field');
				var $tinput = $('<input></input>').addClass('js-typeahead').attr('name', 'q').attr('type', 'text').attr('autocomplete', 'off');
				$tfield.append($('<span></span>').addClass('typeahead__query').append($tinput));
				$tcontainer.append($tfield);
				$tform.append($tcontainer);
				this.$input.append($tform);
				if (typeof this.options.typeSettings === 'object' && this.options.typeSettings !== null) {
					// set the clear button option to the editable option
					this.options.typeSettings['cancelButton'] = this.options.clearButton;
				}
				$tinput.typeahead(this.options.typeSettings);
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

			var $buttonWrapper = null;
			// create clear button to clear the input value, if enabled and correct type and its not IE: IE has its own clear button
			if (this.options.clearButton === true && inputType != 'select' && inputType != 'datetimepicker' && inputType != 'typeahead' && 
				(ieVersion === 0 || inputType == 'textarea' || inputType == 'password')) {
				var $clearButton = $("<button></button>").addClass('editable-input-button').addClass('editable-clear-button').text('✖');
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
				$buttonWrapper = $('<div></div>').addClass('editable-input-button-wrapper');
				$buttonWrapper.append(this.$input);
				$buttonWrapper.append($clearButton);
			}
			// create password view button, if enabled. IE default password view is disabled by default with CSS, as it seems to be buggy
			if (inputType == 'password' && this.options.viewPassword === true) {
				var $passwordViewButton = $("<button></button>").addClass('editable-input-button').addClass('editable-password-button').text('?');
				if ($buttonWrapper === null) {
					$buttonWrapper = $('<div></div>').addClass('editable-input-button-wrapper');
					$buttonWrapper.append(this.$input);
				}
				$passwordViewButton.on('mousedown', function () {
					self.$input.attr('type', 'text');
				});
				$passwordViewButton.on('mouseup', function () {
					self.$input.attr('type', 'password');
					self.focus();
				});
				$buttonWrapper.append($passwordViewButton);
			}
			// append the button wrapper if it exists, or just the input. The input wrapper will contain the input if it exists
			if ($buttonWrapper === null) {
				$inputWrapper.append(this.$input);
			} else {
				$inputWrapper.append($buttonWrapper);
			}
			// must create the date picker object after the input has been appended, or it does not work
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
				if (typeof this.$element.data('format') !== 'undefined' && typeof dateTimeSettings['format'] === 'undefined') {
					dateTimeSettings['format'] = this.$element.data('format');
				}
				// warning: if hideInput is set to true, tabbing will be skipped when reaching this element
				if (typeof dateTimeSettings['hideInput'] !== 'undefined') {
					if (dateTimeSettings['hideInput'] === true) {
						this.$input.hide();
					}
					delete dateTimeSettings['hideInput'];
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
				var submitButton = $("<button></button>").attr('type', 'button').addClass('editable-button').addClass('editable-submit-button').addClass(self.options.buttonClass).text('✓');
				submitButton.on('click', function () {
					self.initiateSubmit();
				});
				var cancelButton = $("<button></button>").attr('type', 'button').addClass('editable-button').addClass('editable-cancel-button').addClass(self.options.buttonClass).text('✖');
				cancelButton.on('click', function () {
					self.cancel();
				});
				this.$inputDiv.append(buttonWrapper);
				buttonWrapper.append(submitButton);
				buttonWrapper.append(cancelButton);
			}
			// add popup div
			if (this.options.mode == 'popup') {
				var popupWrap = $('<div></div>').addClass('editable-popup-wrapper');
				this.$inputDiv.wrapInner(popupWrap);
			}
			
			return this;
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
				return this;
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
			} else {
				this.setValue(undefined);
			}
			this.options.displayFunction(this);

			this.$element.trigger("be.afterRecreate", this);
			return this;
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

		BetterEditable.prototype.isEmpty = function () {
			var value = this.getValue();
			return (typeof value === 'undefined' || value === null || value === '');
		};

		BetterEditable.prototype.canTab = function () {
			return this.options.tabbingOn === true && !this.isReadOnly() &&
			(typeof this.options.tabIndex === 'string' || typeof this.options.tabIndex === 'number');
		};

		BetterEditable.prototype.skipTab = function () {
			return !this.$element.is(":visible") || this.options.type === 'bool' || 
					(this.options.type === 'datetimepicker' && typeof this.options.typeSettings !== 'undefined' && this.options.typeSettings['hideInput'] === true);
		};
	}

	// Main action scope
	{
		BetterEditable.prototype.show = function (tabDirection) {
			if (!this.canBeShown()) {
				return this;
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
				this.togglePopupOpen(true);
				var self = this;
				var cycleNextAligment = function(currentPlacement, currentAlign) {
					var nextAligment = {
						placement: currentPlacement,
						placementAlign: currentAlign
					};
					var switchPlacement = false;
					if (currentAlign == "top") {
						nextAligment.placementAlign = "center";
					} else if (currentAlign == "center") {
						if (currentPlacement == "left" || currentPlacement == "right") {
							nextAligment.placementAlign = "bottom";
						} else {
							nextAligment.placementAlign = "right";
						}
					} else if (currentAlign == "left") {
						nextAligment.placementAlign = "center";
					} else if (currentAlign == "bottom") {
						nextAligment.placementAlign = "top";
						switchPlacement = true;
					} else if (currentAlign == "right") {
						nextAligment.placementAlign = "left";
						switchPlacement = true;
					}
					if (switchPlacement) {
						switch (currentPlacement) {
							case "top":
								nextAligment.placement = "right";
								break;
							case "right":
								nextAligment.placement = "bottom";
								break;
							case "bottom":
								nextAligment.placement = "left";
								break;
							case "left":
								nextAligment.placement = "top";
								break;
						}
					}
					return nextAligment;
				}
				var tryAligmentConfiguration = function(placement, align, numberOfTries) {
					var topPos = self.$element.offset()['top'];
					var leftPos = self.$element.offset()['left'];
					if (placement === 'bottom') {
						var heightOffset = self.$element.outerHeight();
						var widthOffset = self.$element.outerWidth();
						var popupWidthOffset = self.$inputDiv.find('.editable-popup-wrapper').outerWidth();
						topPos += 7 + heightOffset;
						switch (align) {
							case "center":
								leftPos -= popupWidthOffset / 2 - widthOffset / 2;
								break;
							case "top":
								align = "left";
							case "left":
								leftPos -= 7;
								break;
							case "bottom":
								align = "right";
							case "right":
								leftPos -= popupWidthOffset - 21;
								break;
						}
					} else if (placement === 'top') {
						var heightOffset = self.$element.outerHeight();
						if (self.$inputDiv.children().first().outerHeight() > heightOffset) {
							heightOffset = self.$inputDiv.children().first().outerHeight();
						}
						var widthOffset = self.$element.outerWidth();
						var popupWidthOffset = self.$inputDiv.find('.editable-popup-wrapper').outerWidth();
						topPos -= heightOffset + 7;
						switch (align) {
							case "center":
								leftPos -= popupWidthOffset / 2 - widthOffset / 2;
								break;
							case "top":
								align = "left";
							case "left":
								leftPos -= 7;
								break;
							case "bottom":
								align = "right";
							case "right":
								leftPos -= popupWidthOffset - 21;
								break;
						}
					} else if (placement === 'right') {
						leftPos += self.$element.outerWidth() + 7;
						var popupHeightOffset = self.$inputDiv.find('.editable-popup-wrapper').outerHeight();
						var heightOffset = self.$element.outerHeight();
						switch (align) {
							case "center":
								topPos -= popupHeightOffset / 2 - heightOffset / 2;
								break;
							case "left":
								align = "top";
							case "top":
								topPos -= 7;
								break;
							case "right":
								align = "bottom";
							case "bottom":
								topPos -= popupHeightOffset - 21;
								break;
						}
					} else if (placement === 'left') {
						var widthOffset = self.$element.outerWidth();
						if (self.$inputDiv.children().first().outerWidth() > widthOffset) {
							widthOffset = self.$inputDiv.children().first().outerWidth();
						}
						var popupHeightOffset = self.$inputDiv.find('.editable-popup-wrapper').outerHeight();
						var heightOffset = self.$element.outerHeight();
						leftPos -= widthOffset + 7;
						switch (align) {
							case "center":
								topPos -= popupHeightOffset / 2 - heightOffset / 2;
								break;
							case "left":
								align = "top";
							case "top":
								topPos -= 7;
								break;
							case "right":
								align = "bottom";
							case "bottom":
								topPos -= popupHeightOffset - 21;
								break;
						}
					}
					var $popUpWrapper = self.$inputDiv.find('.editable-popup-wrapper');
					self.$inputDiv.css('top', topPos + 'px');
					self.$inputDiv.css('left', leftPos + 'px');
					$popUpWrapper.removeClass("center-align").removeClass("top-align").removeClass("bottom-align")
									.removeClass("left-align").removeClass("right-align").addClass(align + "-align")
									.removeClass("top").removeClass("right").removeClass("bottom").removeClass("left").addClass(placement);
					if (numberOfTries < 13) {
						var popUpHeight = $popUpWrapper.offset()['top'] + $popUpWrapper.outerHeight();
						var popUpWidth = $popUpWrapper.offset()['left'] + $popUpWrapper.outerWidth();
						if ($popUpWrapper.offset()['top'] < $(document).scrollTop() || $popUpWrapper.offset()['left'] < $(document).scrollLeft() ||
							popUpHeight > $(document).scrollTop() + $(window).height() || popUpWidth > $(document).scrollLeft() + $(window).width()){
							var newConfiguration = cycleNextAligment(placement, align);
							tryAligmentConfiguration(newConfiguration.placement, newConfiguration.placementAlign, ++numberOfTries);
						}
					}
				}
				tryAligmentConfiguration(this.options.placement, this.options.placementAlign, 1);
			}
			this.focus(tabDirection);

			this.$element.trigger("be.shown", this);
			return this;
		};

		BetterEditable.prototype.hideInput = function (wasPopup) {
			var self = this;
			this.$inputDiv.hide()
			this.$element.show();

			if (this.options.mode === 'popup' || wasPopup === true) {
				this.togglePopupOpen(false);
			}

			this.$element.trigger("be.hidden", this);
			return this;
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

			var resultErrored = this.submitProcess();
			// if resultErrored is true, then there was a pre-submit error
			if (resultErrored !== true) {
				this.hideInput();
			}
			
			return this;
		};

		BetterEditable.prototype.cancel = function () {
			this.options.errorHandler('', this, false);
			this.hideInput();

			this.$element.trigger("be.cancelled", this);
			return this;
		};

		BetterEditable.prototype.triggerTabbing = function (tabDirection, $nextEditable) {
			if (!this.canTab()) {
				return this;
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
					// skip tab if the proper conditions are met
					if ($nextEditable.betterEditable().skipTab()) {
						$nextEditable.betterEditable().triggerTabbing(tabDirection);
					} else {
						$nextEditable.betterEditable().show(tabDirection);
					}
				}
			}

			return this;
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
			} else if (this.options.type == 'typeahead') {
				// find the typeahead input and focus
				this.$input.find('input').focus();
			} else {
				// default focus
				this.$input.focus();
			}
			return this;
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
				return (new Date(value1)).getTime() === (new Date(value2)).getTime();
			} else if (type === 'multifield' && utils.isArray(value1) && utils.isArray(value2)) {
				if (value1.length !== value2.length) {
					return false;
				}
				for (var index = 0; index < value1.length; ++index) {
					var notEqual = false;
					Object.keys(value1[index]).forEach(function (name) {
						// checks for !notEqual to speed up the process if notEqual is already set, as break cant be done in forEach:
						if (!notEqual && value1[index][name] !== value2[index][name]) {
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
			} else if (this.options.type == 'datetimepicker') {
				// convert value to дате type, if type is datetimepicker
				this.$input.data("DateTimePicker").date(newValue);
				newValue = this.$input.data("DateTimePicker").date();
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

			return this;
		};

		BetterEditable.prototype.getValue = function () {
			if (typeof this.value === 'object' && this.value !== null) {
				if (this.options.type === 'datetimepicker') {
					return new Date(this.value);
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
				if (this.isEmpty()) {
					this.$input.datetimepicker('clear');
					newValue = null;
				} else {
					if (isNaN(Date.parse(newValue))) {
						dateObj.date(newValue);
					} else {
						dateObj.date(new Date(newValue));
					}
					if (dateObj.date() !== null) {
						newValue = dateObj.date().format(this.$input.data('DateTimePicker').format());
					} else {
						newValue = null;
					}
				}
				this.$input.val(newValue);
			} else if (this.options.type == 'multifield') {
				for (var index = 0; index < newValue.length; ++index) {
					Object.keys(newValue[index]).forEach(function (name) {
						var $field = self.$input.find('input[name="' + name + '"]').first();
						if ($field.length > 0 && $field.attr('type') != 'radio') {
							if ($field.attr('type') === 'checkbox') {
								$field.prop('checked', utils.normalizeBoolean(newValue[index][name]));
							} else {
								$field.val(newValue[index][name]);
							}
						} else {
							$field = self.$input.find('textarea[name="' + name + '"]').first();
							if ($field.length > 0) {
								$field.val(newValue[index][name]);
							} else {
								$field = self.$input.find('select[name="' + name + '"]').first();
								if ($field.length > 0) {
									$field.val(newValue[index][name]);
								} else {
									$field = self.$input.find('[data-multifield-radio][name="' + name + '"] input[type="radio"][name="' + name + '"][value="' + newValue[index][name] + '"]').first();
									if ($field.length > 0) {
										$field.prop('checked', true);
									}
								}
							}
						}
					});
				}
			} else if (this.options.type == 'typeahead') {
				this.$input.find('input').val(newValue);
			} else {
				this.$input.val(newValue);
			}
			return this;
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
					if ($innerInput.length !== 1) {
						$innerInput = $(this).find('textarea');
					}
					if ($innerInput.length !== 1) {
						$innerInput = $(this).find('select');
					}
					if ($innerInput.length !== 1) {
						$innerInput = $(this).find('[data-multifield-radio]');
						if ($innerInput.length === 1) {
							var radioGroupName = $innerInput.attr('name');
							$innerInput = $(this).find('input[type="radio"][name="' + radioGroupName + '"]:checked');
							if ($innerInput.length === 0) {
								$innerInput = $(this).find('input[type="radio"][name="' + radioGroupName + '"]').first();
							}
						}
					}
					if ($innerInput.length === 1) {
						inputName = $innerInput.attr('name');
						if (typeof inputName === 'string' && inputName.trim() !== '') {
							if ($innerInput.attr('type') == 'checkbox') {
								inputValue = $innerInput[0].checked;
							} else if ($innerInput.attr('type') == 'radio' && !$innerInput.is(':checked')) {
								inputValue = null;
							} else {
								inputValue = $innerInput.val();
							}
							var objToPush = {};
							objToPush[inputName] = inputValue
							returnValue.push(objToPush);
						}
					}
				});
			} else if (this.options.type == 'typeahead') {
				returnValue = this.$input.find('input').val();
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
			} else if (this.options.type == 'typeahead') {
				// typeahead clear
				this.$input.find('input').val('');
			} else {
				// default clear
				this.$input.val('');
			}
			return this;
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
			return this;
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
			return this;
		};

		BetterEditable.prototype.resetState = function () {
			this.state.isValid = true;
			this.state.doTab = false;
			return this;
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
					if (typeof submitData.format !== 'function') {
						submitData = utils.formatNewDate(this.$input.data('DateTimePicker'), submitData)
					} else {
						submitData = submitData.format(this.$input.data('DateTimePicker').format());
					}
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
			var oldValue = this.getValue();
			if (!this.isShown()) {
				submitData = this.getValue();
			}
			this.setValue(submitData);
			var self = this;

			// copy the data
			var unprocessedData;
			if (typeof submitData === 'object') {
				if (submitData === null) {
					unprocessedData = null;
				} else if (utils.isArray(submitData)) {
					unprocessedData = [];
					$.extend(true, unprocessedData, submitData);
				} else {
					unprocessedData = {};
					$.extend(true, unprocessedData, submitData);
				}
			} else {
				unprocessedData = submitData;
			}
			// process the data
			submitData = this.processSubmitData(submitData);
			// trigger before submit event
			var returnData = {
				submitData: submitData,
				oldValue: oldValue
			};
			this.$element.trigger("be.beforeSubmit", {
				editable: self,
				returnData: returnData,
				unprocessedData: unprocessedData
			});
			if (returnData.flag === false) {
				// set back the value to the old value, since there is a pre-submit custom error
				oldValue = returnData.oldValue;
				this.setValue(oldValue);
				this.state.isValid = false;
				// returns true for a pre-submit error ; returning false is for no error
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
					self.$element.trigger("be.ajaxSuccess", {
						response: data,
						editable: self,
						oldValue: oldValue
					});
					if (self.state.doTab !== false) {
						--$.betterEditableData.submitting;
						self.triggerTabbing(self.state.doTab);
					}
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
					self.$element.trigger("be.ajaxError", {
						errorObj: errorObj,
						xhr: xhr,
						settings: settings,
						exception: exception,
						errorValue: errorValue,
						editable: self
					});
					if (self.state.doTab !== false) {
						--$.betterEditableData.submitting;
					}
					self.afterProcess();
					if ($.betterEditableData.asyncRequests) {
						$.betterEditableData.functions.requestExecutionEnd();
					}
				};
			}

			// only submit if url is defined and if send is turned on
			if (this.options.send === true && typeof ajaxObj["url"] === 'string' && ajaxObj["url"] !== '') {
				// handle async requests
				if ($.betterEditableData.asyncRequests) {
					ajaxObj["editable_option_doTab"] = this.state.doTab;
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

			return false;
		};

		BetterEditable.prototype.afterProcess = function () {
			this.resetState();
			return this;
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
