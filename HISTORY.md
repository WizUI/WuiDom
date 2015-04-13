# Release history

## v0.5.3

### toggle with undefined style
The `toggleClassNames` method was partially broken.
When second arguments, `shouldAdd`, is `undefined` it will trigger a real toggle, which is now fixed.

## v0.5.2

### toggle the display and tell me what
The `toggleDisplay` now returns the status of the display.
Also fixed a bug where passing an `undefined` variable will always toggle on.


## v0.5.1

### Pimp my style
A new method `getComputedStyles` allows to retrieve multiple computed style properties in one call.

### Now you see me
The method `isVisible` can now go up the tree of ancestor if it's really visible or not.


## v0.5.0

### Assign no more
:warning: The `assign` method is now deprecated.
Since v0.2.0 you can _assign_ from the constructor.
It's time to move on.

### Back to the source
The use of setting a function and timer for `setText` and `setHtml` disappeared long time ago.
Perhaps because of the arrival of [Tomes](https://github.com/Wizcorp/node-tomes) and `bindToTome`.
This is why from now on, those 2 methods will do simply what they have to do.

### Dom query nothing
:warning: The methods `query` and `queryAll` has been removed.
Those was returning a Dom which seems useless since we wanna work WuiDoms

### Let's change your class
A new method called `toggleClassNames` has been added for the good of avoiding silly if/else logic.
Check the API in the [readme](README.md#toggledisplay) for more info.

### Ladybug is cute but problematic
- `removeChild` would accept only string as an ID, it is now more open to numbers.
- `insertChildBefore` were crashing when the second argument was not provided.
- `replaceClassNames` were keeping adding class names from the `addList` argument even if already present.


## v0.4.0

### Tell me when you are done, not before
The emission of the events `'show'` and '`hide'` will now happened when the actions are done.

### What's your name?
Added the method `getWuiName` to get the name given to the WuiDom.

### Controlling your visibility, the ninja way
Added the method `toggleDisplay` to be able to switch visibility.
The method can also receive a boolean as argument to avoid complicated code for a hide/show logic.
```javascript
if (shouldDisplay) {
    myDiv.show();
} else {
    myDiv.hide();
}
```
Now becomes:
```javascript
myDiv.toggleDisplay(shouldDisplay);
```

### No more data for your eyes
:warning: `show` and `hide` methods were used to be able to pass data through the event.
 **This is no longer the case.**


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
