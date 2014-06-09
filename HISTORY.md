# Release history

## vNext

### Tell me when you are done, not before
The emission of the events `'show'` and '`hide'` will now happened when the actions are done.

### What's your name?
Added the method `getWuiName` to get the name given to the WuiDom.

### Controlling your visibility, the ninja way
Added the method `toggle` to be able to switch visibility.
The method can also receive a boolean as argument to avoid extra code for that:
```javascript
if (shouldDisplay) {
    myDiv.show();
} else {
    myDiv.hide();
}
```
Now becomes:
```javascript
myDiv.toggle(shouldDisplay);
```

## v0.3.3

### Mouse or finger? I'll take them all
For a better support of both and for the upcoming desktop browsers supporting both we no longer choose one
or the other when requiring WuiDom, but make the right choice when getting the events instead.
This possibly mean that a user should be able to switch between using his finger or his mouse.

### You have some style, let me see it
The `getComputedCSSStyle` were using `getPropertyValue` which is not supported by all browsers.
Using directly `getComputedStyle` instead, which return the same as the `cssText` wanted from `getComputedCSSStyle`.


## v0.3.2

### Don't you know, I just told you so
In `#replaceClassNames` when a class name was present from the `delList` and the `addList` it wouldn't be added.


## v0.3.1

### Dependencies update
`Wizcorp/events` is now v0.1.2


## v0.3.0

### Family matters
Added a way to get access to the children with two new methods
- `getChildren` which will return an array of WuiDom in the order they are supposed to be.
- `getChild` take a string as argument and return the wanted WuiDom

To use the latest, just need to add a name of the WuiDom when using `createChild` or `appendChild`.

And because we are evil, we can now clear the content of a WuiDom, which will empty the text or html of this one,
and recursively destroys all its children along with it.


## v0.2.0

### Welcome to simplicity
What does it really means?
Well, you can now pass the argument you were giving to this method to the constructor.
```javascript
var myElement = new WuiDom('div', { className: 'box' };
```
Or the following for inheritance.

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


### Bye bye createElement
The method `createElement` wasn't really use because of it's redundancy with the creation of a new WuiDom.
And since we can pass argument to the constructor of WuiDom it has no more reason to exist.

## v0.1.0

First version