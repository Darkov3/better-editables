# Better Editables
Highly Customizable JavaScript Editables v0.14.63

Demo:
https://darkov3.github.io/


TODO:

Bug Fixes:
- enter on last element does not trigger tabbing to first element
- when date time picker input is focused, all key events are prevented

Improvements:
- add step setting for number type
- setOption method should do nothing if new option value is same as current
- fix recreating input for bool, instead of skipping it
- make popup smart in displaying
- add different classes for submit and cancel buttons
- remove dataSource option and use typeSettings for select
- create validator method should auto attach the validator to an element after create, if called from an element
- methods and functions should return appropriate objects

Features:
- add typeahead type <- priority
- add checklist type (with radio buttons support) <- priority
- add select2 type <- priority
- add multiple input type <- priority
- add documentation <- priority
- add function to apply option on all editables at once
- add more comments
- add option to imitate a form submit(send FormData)
- enable tabbing for Bool by converting it to select on tab
- add isEmpty check function, which checks if value is empty
- add canHide check function
- add validators option
- add options to change button text
- add animation capabilities on show/hide/value change
- add send: true/false option
- add submit success class
- add trigger display method
- add normal and empty value display option
- add canSubmit check function
- add value to date value normalization function
- add checkbox type
