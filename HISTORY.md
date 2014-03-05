# Release history

## v0.2.0

### Welcome to simplicity
The assign method is now **deprecated**.
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