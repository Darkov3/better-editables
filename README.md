# Better Editables
Highly Customizable JavaScript Editables

Demo:
https://darkov3.github.io/


TODO:

Bug Fixes:
- clicking on autocomplete list will not prevent the on blur event from submitting the editable
- datetimepicker type shows incorrect value on error in input field
- bool type does not initialize value to true or false
- empty style added to the submitting display, if value was empty before

Improvements:
- add step setting for number type
- setOption method should do nothing if new option value is same as current
- fix recreating input for bool, instead of skipping it
- rename onError and onSuccess events to onAjaxError and onAjaxSuccess
- add 'be.' prefix to all events

Features:
- add option to create custom types
- add function to apply option on all editables at once
- add documentation
- add more comments
- create getValue and setValue functions
- add on value change event
- add option to imitate a form submit(send FormData)
