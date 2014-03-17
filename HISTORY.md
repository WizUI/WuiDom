# Release history

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