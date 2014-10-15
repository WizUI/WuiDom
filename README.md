# WuiDom

## Motivation for WUI

Wizcorp UI (hereafter referred to as 'WUI') is a series of UI elements that were created to minimize
programmer interaction with the DOM and eliminate the need for programmers to create HTML.
Here at Wizcorp, we make single-page applications that often have many thousands of lines of
generated HTML. Therefore, even a single DOM query can be very slow, resulting in an unacceptably
slow user experience. WUI allows the programmer to create HTML elements while minimizing
interaction with the DOM, and maintain fine-level control over exactly when, where and in what
manner data is displayed and how events are handled.

WUI also allows for simple interaction with Tomes, another Wizcorp API, to allow DOM elements to be
updated whenever the underlying data associated with them changes. This is useful for such things as
validation, real-time data display and for asynchronous processing. By fully leveraging the
non-blocking nature of Node.js, WUI will perform nearly real-time updating of data and allow the
programmer to avoid DOM calls, have more compact code and allow for more reusable user interface
components.

## What WuiDom is

WuiDom is the base object of the WUI system. It represents the smallest unit of programmatic logic,
an object corresponding to an underlying HTML element and that associated data (including, but not
limited to, a Tome), events and other properties. WuiDom allows the programmer to keep a reference
to generated elements (if desired) or to create throw-away elements. A simple function can create a
generic UI template or create a custom view. Because WuiDom inherits from EventEmitter,
programmer-defined events can be conditionally emitted and handled by WUI or other modules.

## WUI Components

One of the major goals of WUI, aside from reducing interaction with the DOM, is to enable developers
to create re-usable user interface components, common behaviours and reusable views. When creating
WUI components, please try to keep that goal in mind. The ideal WUI component can be used on many
views and ideally that means to not making too many assumptions about the underlying data or the the
business logic of the game.

Below is a partial list of the existing WUI components, and what their primary functions are:

### WuiButton

You can read the WuiButton documentation [here](https://github.com/Wizcorp/wui-button).

### WuiView

You can read about the WuiView documentation [here](https://github.com/Wizcorp/wui-view).

### WuiImage

You can read more about the WuiImage documentation [here](https://github.com/Wizcorp/wui-image).

### Creating a new WuiDom element

There are a few ways to create a WuiDom element.
The first, and easiest, way is to create a WuiDom element is to use the createChild method.
Another way to create a WuiDom is to use the WuiDom constructor, which is more useful for creating the
first WuiDom element on a page.



#### Using the constructor

It takes an HTML tag and an object map for options.
Valid options include className, text, attr (an object of HTML attributes, user-defined) and the option 'hidden',
to allow the element to not be immediately displayed.

Each WuiDom object represents an HTML element.
The constructor will tell the WuiDom element which HTML element it is representing.

```javascript
var container = new WuiDom('div', { className: 'container' });
```

You can also give an DOM element as first arguments.

```javascript
var htmlElement = document.querySelector('#main');
var main = new WuiDom(htmlElement);
```

Here an existing HTML element is been attached to a new instance of WuiDom.
It's usually the method used to create the parent WuiDom of a web application.
Once an initial WuiDom element exists, we should be able to use it to create any other new WuiDom elements.
This allows for pages to be built iteratively.


#### createChild

NOTE: To use this method, you **must** have an existing WuiDom parent element.

Calling the method:

```javascript
parentElement.createChild(tagName, { name: 'myElement' });
```

The method createChild will create a WuiDom object and then immediately call appendChild to insert the element.
The result is a new child element is immediately inserted as the last child of parentElement.
Please note that this method is the preferred way to create new WuiDom elements.

The createChild method takes an HTML tag name (such as 'input', 'label', 'div' or so forth)
and a list of associated options. WUI created an underlying rootElement (discussed at length below)
and appends the element as the last child element of the parent (caller) element.

An options element can contain numerous keys that are used by WuiDom to create the HTML element.
Consider the following example:

The option `name` represent an identifier with which it can be retrieve using `getChild`.

```javascript
var options = { text: 'Example', className: 'exampleClass', style: { margin: '5px', display:
'inline-block' }, attr: { type: 'text', maxlength: '4' }};
var newInputElement = parentElement.createChild('input', options);
```

In the above example, the code assumes parentElement already exists and is also a WuiDom object
(see above for creating the first WuiDom object in your code!). Here we create an input tag
(could just as easily be a 'div' or 'button'.)

WUI reads the options object next, and creating a child text-node based on the user-supplied 'text'
option, in this case using 'Example' for the text. It then applies the style and class name.
Finally, WUI will add each attribute specified by the keys in the 'attr' object. The resulting
HTML markup can be seen below:

```html
<input style="margin: 5px; display: inline-block;" class="exampleClass" type="text" maxlength="4" value="Example" />
```

This element is created, and immediately appended to the parentElement. In general, it is better
for you to add attributes under the 'attr' object at object initialization time. This minimizes the
number of repeated DOM calls (which are slow) and allows you to leverage WuiDom's attribute cache
for even greater performance.

After the underlying element is created, it is stored in the variable called 'newInputElement'.
This allows you to perform other operations on the newly created WuiDom element.


### Inserting a WuiDom element

There are many methods for inserting a WuiDom element on to the document. Note that these methods
all assume that a WuiDom element is being attached to another WuiDom element. For an example of
creating new WuiDom elements, please read above.

#### appendChild

Calling the method:

```javascript
var childElement = new WuiDom('label', { name: 'child', text: 'Example' });
parentElement.appendChild(childElement);
```

In the above code, we see that a childElement is created as a label with the text 'Example', and
then appended to a previously existing parentElement. Usually it is better to call
parentElement.createChild(), since it will perform the appendChild automatically. It is
sometimes however, useful not to append an element immediately after it is created.
The newly created WuiDom element also got a named assign to retrieve it easily using `getChild`.

#### appendTo

Calling the method:

```javascript
if (someValue >= 5) {
    var childElement = new WuiDom('label', { text: 'Example' });
    childElement.appendTo(parentElement); // Equivalent to parentElement.appendChild(childElement);
}
```

In the above example code, if the value of someValue is greater than or equal to 5, a child
element is created, and then appended to a previously existing parentElement.
One of the main advantages of appendTo and appendChild, is that elements can be conditionally or
dynamically added based on programmatic logic. This is useful for views that will change depending
on program execution or external factors.

Please note that this method requires an existing parentElement.

#### insertBefore

Calling the method:

```javascript
var ListElement = function(textValue) {
    WuiDom.call(this, 'li', { text: textValue });
}

var ulElement = pageElement.createChild('ul');
var secondElement = ulElement.createChild(new ListElement('Item 2' ));
var firstElement = new WuiDom(new ListElement('Item 1'));
firstElement.insertBefore(secondElement);
```

In this example, we create a ul element, and two li elements. The first element is defined using
a new WuiDom and then inserted before the second element on the last line of the example.
This method is mostly useful for when you need to prepend an element to a list of existing elements,
such as a validation message notification panel.

Please note that the argument passed to this function must be a WuiDom element.
Also, it **must** have a parent node for this method to work successfully.

#### insertAsFirstChild

Calling the method:

```javascript
var ListElement = function(textValue) {
    WuiDom.call(this, 'li', { text: textValue });
}

var ulElement = pageElement.createChild('ul');
ulElement.createChild(new ListElement('Second child'));
ulElement.insertAsFirstChild(new ListElement('First child'));
```

In this example, we create a ul element, and then append a ListElement second child.
The final line creates the first child, and inserts it as the first child. This method is useful for
when you want to prepend an item to a list, but might not have a readily available reference to the
current firstChild element (such as a dropdown list).

Please note that the object this method is called from is assumed to be the parent node. The
programmer should of course be careful to not try and make invalid child elements.

#### insertChildBefore

Calling the method:

```javascript
parentElement.insertChildBefore(newChildElement, elementToInsertBefore);

var ListElement = function(textValue) {
    WuiDom.call(this, 'li', { text: textValue });
};
var ulElement = pageElement.createChild('ul');
ulElement.createChild(new ListElement('First child'));
var thirdChild = ulElement.createChild(new ListElement('Third child'));
ulElement.insertChildBefore(new ListElement('Second child'), thirdChild);
```

This method is different from the insertBefore method, in that it allows you to explicitly specify
the parentElement. The first argument of this function specifies a new child element, and the second
specifies a WuiDom element that the new child Element should be inserted before.

As in the previous examples, the parameters mentioned are all assumed to be WuiDom objects.


#### getChildren

Calling the method:

```javascript
    var myElements = myContainer.getChildren();

    for (var i= 0, len = myElements.length; i < len; i += 1) {
        myElements[i].addClassNames('read');
    }
```

The method will return a copy of the children list.
Using it can help to iterate through elements easily for specific task.


#### getWuiName

Calling the method:

```javascript
    var myComponentName = myContainer.getWuiName();
```
This method will return the name of the WuiDom given at the creation.


#### getChild

Calling the method:

```javascript
    var myTitle = myContainer.getChild('title');
    myTitle.hide();
```

This method will return a child by its name if assigned, or `undefined` if not.


#### removeChild
Calling the method:

```javascript
    var oldChild = myContainer.removeChild(titleBoxElement);
```
or
```javascript
    var oldChild = myContainer.removeChild('title');
```

It's possible to remove a child by using the object itself or its name if any;
It will return the WuiDom child itself.


#### destroy

Calling the method:

```javascript
    var myElement = myContainer.getChild('name');
    myElement.destroy();
```

Calling this, the WuiDom will remove itself from its parent and destroy all its children.
Then cleanup all event listener on itself and its rootElement (Node).


#### clearContent

Calling the method:

```javascript
myContainer.clearContent();
```

Calls destroy on all the children of the WuiDom recursively through the whole three.
Also empties the current text or html if any.


### Display logic

WuiDom display can be easily manipulated.
It has default method implementations of show and hide that can be overridden‎.
These methods will be called when `show` or `hide` is used and will emit a corresponding event.
The method `isVisible` is also available to know the current status of the WuiDom, but does not depend on its parent.

##### showMethod
Default method to show the element.
Sets the display css property to ''.

##### hideMethod
Default method to hide the element.
Sets the display css property to 'none'.

##### show
Calls the `showMethod` and emits a 'show' event.

##### hide
Calls the `hideMethod` and emits a 'hide' event.

##### toggleDisplay
Will call `hide` or `show` depending of the visibility status.
Can receive a boolean as argument to force the display.
- `true` to show
- `false` to hide

##### isVisible
Returns the current visibility status of the wuiDom object.
When given `true` as argument, it will look at the ancestor tree
to check the visibility status of them.

##### Examples

```javascript
if (shouldHide) {
    myWuiDom.hide();
}

myWuiDom.on('show', function () {
    console.log('I am visible');
}
```

#### Binding to a Tome

WuiDom supports binding to a [Tome][1] object, and updating the underlying HTML element with
specific data. By binding a Tome to a WuiDom element, the programmer can leverage the full power
of Node.js to allow for real-time updating of interfaces when changes are made at a data-level.

The code below demonstrates how the contents of a Tome might be bound to a WuiDom element.

[1]: https://github.com/Wizcorp/node-tomes/blob/master/README.md

##### Example

```javascript
var questDisplay = pageElement.createChild('div');
questDisplay.bindToTome(tomeObject, function () {
    questDisplay.setHtml('');

    for (var quest in tomeObject) {
        if (tomeObject.hasOwnProperty(quest)) {
            var questLineInput = questDisplay.createChild('input', { type: 'checkbox',
            disabled: 'disabled', checked: quest.isComplete ? 'checked' : ''});
            questLineInput.setText(quest.title);
        }
    }
});
```

In the example above, we bind the 'tomeObject' Tome to the element questDisplay.
The first argument tells the questDisplay div which Tome it will use. The second argument is a
function that is called every time data within the Tome changes. So every time the questLog changes,
Tomes will fire an event and WuiDom will run this update function in order to refresh the player
quest log display.

In the case of this example, the quest log renders as a checkbox list.
Each checkbox is checked if the quest has been completed, and contains the title of the quest.
It is important to note that the function provided for argument 2 is executed every single time a
data change occurs, regardless of how significant the change is. Because of this, it's often best to
provide concise, efficient update functions.

If you don't provide a second argument, a default function will call the setText method on the binded
element with the tome value.

#### Events

WuiDom inherits from EventEmitter, and as such it allows the programmer to define and catch their
own custom events. In addition, WuiDom can be configured to support the normal DOM events such as
onchange, onclick and others.

##### allowDomEvents

The allowDomEvents function can be called from any WuiDom element, in order to tell WUI that
the element will listen for DOM events. The correct syntax for DOM events is 'dom.event'.
Therefore the change event would be emitted as 'dom.change'.

Note that by default, DOM events are **not** propagated through WUI. **This method must be
called in order to enable DOM events on a WuiDom object.**

##### Example

```javascript
var playerXPElement = pageElement.createChild('input', { type: 'text', disabled: 'disabled' });

playerXPElement.allowDomEvents();

playerXPElement.on('dom.change', function() {
    var xp = playerXPElement.rootElement.value;
    var isLevelUp = checkLevelUp(xp);

    if (isLevelUp) {
        showLevelUpAnimation();
        playerXPElement.emit('levelUp');
    }
});
```

In this example, we create a WuiDom element called playerXPElement.
The function call to allowDomEvents tells WUI that the element that wants to consume DOM events.
In the final line, we tell the element to run the function every time the dom.change event is fired.

When the method runs, it will check to see if the player has gained a level, and then
possibly display an animation. If the player levels up, an event called levelUp is emitted.
This is just one example of how events might be used with WUI. Please see [here][0] for a list of
DOM events.

[0]: https://developer.mozilla.org/en-US/docs/DOM_Client_Object_Cross-Reference/DOM_Events

### Operations on a WuiDom element

WuiDom supports a number of functions that can be used to interact with the underlying element,
even after the element has already been added to the DOM. One primary purpose of WUI, is to allow
these operations to be performed without having to pay the cost of an inefficient DOM lookup every
time we wish to run a command.

Example 1:

```javascript
var newElement = new WuiDom('div', { className: 'box' });
```
Here we create a new WuiDom object which would be a div with the css class set to 'box'.


Example 2:

```javascript
var inherit = require('inherit');
var WuiDom = require('WuiDom');
var buttonBehavior = require('wuiButtonBehavior');

function MyButton(caption) {
	WuiDom.call(this, 'div', { className: 'MyButton', text: caption });
	buttonBehavior(this);
}

inherit(MyButton, WuiDom);
module.exports = MyButton;
```
In this example, we define a button called MyButton. Then call the WuiDom constructor
with arguments to tell the element is a 'div' with a css class and a text.


#### setText

The setText method is used to set the inner text of a WuiDom element. The initial text value of a
WuiDom can also be set using the text property of the 'options' object, as described above.

Calling the method:

```javascript
newElement.setText('someText');
```

The setText method takes a text argument and sets the innerText property of the rootElement of the
WuiDom element. It's important to note that this does **not** change the value of the rootElement,
just the display text.

**Another use of this function**

```javascript
newElement.setText(value, interval);
```

The 'value' can also be a function, in which case the function is called repeatedly every 'interval'
milliseconds, until the element is destroyed using `destroy` or this function is called again.

#### getText

The getText method will retrieve the current innerText property of a WuiDom element.
**Note** that this value may very well be undefined if the text property has not yet been set

Calling the method:

```javascript
var text = newElement.getText();
```

#### setStyle

The setStyle method is used to set the style properties of an already-defined WuiDom element.

```javascript
childElement.setStyle(property, value);
```

Here the method will take a single style property and set its value. No validation is done on the
parameters, so the user should be careful to not set invalid styles with this method.


#### setStyles

The setStyles method is used to set multiple style properties of an WuiDom element.

```javascript
childElement.setStyles({ width: '30px', height: '20px' });
```
#### getStyle

The getStyle method is used to check the value of specific properties of the style attribute.
The method will return the value of the specified property, if it exists. If the property does
not exist, then the method will return 'undefined'.

Calling the method:

```javascript
childElement.getStyle(property);
```

#### unSetStyle

The unSetStyle method will set a specified style to null. It is equivalent to calling
setStyle(property, null).

Calling the method:

```javascript
childElement.unsetStyle(property);
```

#### getComputedStyle

The getComputedStyle method will return the computed style (CSS style text) for a given property
of the style element. If the property is not defined, WuiDom will return 'undefined'.

Calling the method:

```javascript
childElement.getComputedStyle(property);
```
#### getClassNames

The getClassNames function will return the class names associated with the WuiDom element.
If there is more than one class name, the class names are returned as an Array of strings.
If there is only one class name, then it is returned as a string.

**Note** If there are no class names, then this method will return undefined

Calling the method:

```javascript
childElement.getClassNames();
```

#### setClassNames

The setClassNames function is used to set the class names associated with a WuiDom element.
The method takes one or multiple strings and overwrites the current classes
(if any) associated with the WuiDom element.

Calling the function:

```javascript
childElement.setClassNames('big', 'unread');
```

**Note** that the old class names will be overwritten by this call.

#### addClassNames

The addClassNames function works like the setClassNames function, except that existing class names
are preserved. You can use this function without worrying about specifying duplicate class names,
since WuiDom will take care of that for you.

Calling the method:

```javascript
childElement.addClassNames('long');
```

#### hasClassName

The hasClassName function takes a class name as a string, and then will check if it exists or not
in the class names associated with the WuiDom element.

Calling the method:

```javascript
var hasClassName = childElement.hasClassName('long');
```

#### delClassNames

The delClassNames method will take one or multiple string of class names and delete them from the class names,
if they exist.

Calling the method:

```javascript
childElement.delClassNames('big');
```


#### toggleClassNames

The toggleClassNames method will switch the presence of a the given list of class names.
Can receive a boolean as second argument to force the switch and call respectively addClassNames or delClassNames.

Calling the method:

```javascript
var isRead = someFunction();
childElement.toggleClassNames(['read'], isRead);
```

#### replaceClassNames

The replaceClassNames method effectively calls addClassNames and then delClassNames,
adding an array of classNames and then deleting others. Either parameter can be empty.

Calling the method:

```javascript
childElement.replaceClassNames(['unread'], ['read', 'stroke']);
```
