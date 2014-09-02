/**
 * @module WuiDom
 */

var inherit = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
var domEvents = require('./domEvents.js');

var cType = {
	EMPTY: null,
	WUI: 'wui',
	TEXT: 'text',
	HTML: 'html'
};

/* jshint -W079 */
var document = window.document;
/* jshint +W079 */

/**
 * HTML creation helper
 * @private
 * @param {string} tagName
 * @param {Object} [options]
 */
function createHtmlElement(tagName, options) {
	var key, elm = document.createElement(tagName);

	if (options) {
		if (options.className) {
			elm.className = options.className;
		}

		if (options.style) {
			for (key in options.style) {
				elm.style[key] = options.style[key];
			}
		}

		if (options.attr) {
			for (key in options.attr) {
				elm.setAttribute(key, options.attr[key]);
			}
		}

	}

	return elm;
}


/**
 * @constructor
 * @augments EventEmitter
 * @param {string} tagName
 * @param {Object} [options]
 */
function WuiDom(tagName, options) {
	EventEmitter.call(this);
	this._elementIsVisible = true;
	this._currentTextContent = null;
	this.rootElement = null;
	this._text = null;
	this._name = '';
	this._childrenList = [];
	this._childrenMap = {};
	this._contentType = cType.EMPTY;
	this._parent = null;
	if (tagName) {
		this._assign(tagName, options);
	}
}

inherit(WuiDom, EventEmitter);
module.exports = WuiDom;


/**
 * Makes the given element the rootElement for this component.
 * If instead of an HTML element, a tagName and options are given, the element is created and assigned.
 * The logic for HTML creation follows the rules of the private createHtmlElement function.
 * @param {string} tagName
 * @param {Object} [options]
 * @private
 */
WuiDom.prototype._assign = function (tagName, options) {
	if (this.rootElement) {
		throw new Error('WuiDom has already an element assigned');
	}

	if (typeof tagName === 'string') {
		// if tagName is a real tag name, create the HTML Element with it

		this.rootElement = createHtmlElement(tagName, options);
		if (options && options.hasOwnProperty('text')) {
			this.setText(options.text);
		}
	} else if (tagName instanceof window.Element) {
		// the first passed argument already is a real HTML Element

		this.rootElement = tagName;
	} else {
		throw new Error('WuiDom.assign requires the given argument to be a DOM Element or tagName.');
	}

	if (options && options.name) {
		this._name = options.name;
	}

	if (options && options.hidden) {
		// start hidden
		this.hide();
	}

	return this.rootElement;
};

/**
 * @deprecated
 * @param {string} tagName
 * @param {Object} [options]
 */
WuiDom.prototype.assign = function (tagName, options) {
	this._assign(tagName, options);
};

/**
 * Return the name of the WuiDom given on creation
 * @returns {string}
 */
WuiDom.prototype.getWuiName = function () {
	return this._name;
};


/**
 * @param {WuiDom|String} child
 * @returns {WuiDom} - oldChild
 */
WuiDom.prototype.removeChild = function (child) {
	if (typeof child === 'string' && this._childrenMap[child]) {
		child = this._childrenMap[child];
	} else if (typeof child === 'string') {
		throw new Error('WuiDom: Given name is not a current child');
	}

	var siblingIndex = this._childrenList.indexOf(child);
	if (siblingIndex === -1) {
		throw new Error('WuiDom: Not a current child');
	}

	this.rootElement.removeChild(child.rootElement);
	this._childrenList.splice(siblingIndex, 1);
	if (this._childrenMap.hasOwnProperty(child._name)) {
		delete this._childrenMap[child._name];
	}
	child._parent = null;
	return child;
};

/**
 * @private
 */
WuiDom.prototype._unsetParent = function () {
	if (this._parent) {
		this._parent.removeChild(this);
	}
};

/**
 * @param {WuiDom} parent
 * @private
 */
WuiDom.prototype._setParent = function (parent) {
	if (parent === this._parent) {
		// Already set, nothing to do
		return;
	}

	if (this._name) {
		if (parent._childrenMap[this._name]) {
			throw new Error('WuiDom: Parent already has a child with this name');
		}
		parent._childrenMap[this._name] = this;
	}

	this._parent = parent;
};


/**
 * @returns {WuiDom|null}
 */
WuiDom.prototype.getParent = function () {
	return this._parent;
};


/**
 * @param {WuiDom} newChild
 * @returns {WuiDom}
 */
WuiDom.prototype.appendChild = function (newChild) {
	if (this._contentType && this._contentType !== cType.WUI) {
		this._clearLinearContent();
	}

	if (this === newChild._parent) {
		var siblingIndex = this._childrenList.indexOf(newChild);
		if (siblingIndex !== -1) {
			this._childrenList.splice(siblingIndex, 1);
		}
	} else {
		newChild._unsetParent();
		newChild._setParent(this);
	}

	this._childrenList.push(newChild);
	this.rootElement.appendChild(newChild.rootElement);

	// touch events are known to get lost, so rebind them
	newChild.rebindTouchListeners();
	this._contentType = cType.WUI;
	return newChild;
};


/**
 * Creates an instance of WuiDom and assigns a newly built HTML element to it,
 * following the logic of the private createHtmlElement function. It is then appended to
 * this component.
 * @param {string} tagName
 * @param {Object} [options]
 * @returns {WuiDom}
 */
WuiDom.prototype.createChild = function (tagName, options) {
	return this.appendChild(new WuiDom(tagName, options));
};


/**
 * @param {WuiDom} newParent
 */
WuiDom.prototype.appendTo = function (newParent) {
	newParent.appendChild(this);
};


/**
 * @param {WuiDom} newChild
 * @param {WuiDom} [newNextSibling]
 * @returns {WuiDom} - newChild
 */
WuiDom.prototype.insertChildBefore = function (newChild, newNextSibling) {
	if (this._contentType && this._contentType !== cType.WUI) {
		this._clearLinearContent();
	}

	var siblingIndex;

	if (this === newChild._parent) {
		var childIndex = this._childrenList.indexOf(newChild);
		if (childIndex !== -1) {
			this._childrenList.splice(childIndex, 1);
		}
	} else {
		newChild._unsetParent();
	}

	if (!newNextSibling) {
		siblingIndex = this._childrenList.length;
	} else {
		siblingIndex = this._childrenList.indexOf(newNextSibling);
		if (siblingIndex === -1) {
			throw new Error('WuiDom: Wanted sibling is not a child');
		}
	}

	newChild._setParent(this);
	this.rootElement.insertBefore(newChild.rootElement, newNextSibling && newNextSibling.rootElement);

	// touch events are known to get lost, so rebind them
	newChild.rebindTouchListeners();

	this._childrenList.splice(siblingIndex, 0, newChild);
	this._contentType = cType.WUI;
	return newChild;
};


// override this function to implement custom insertBefore behavior
/**
 * @param {WuiDom} newNextSibling
 * @returns {WuiDom} - newNextSibling
 */
WuiDom.prototype.insertBefore = function (newNextSibling) {
	if (!newNextSibling._parent) {
		throw new Error('WuiDom: sibling has no parent');
	}
	newNextSibling._parent.insertChildBefore(this, newNextSibling);

	return newNextSibling;
};

// override this function to implement custom insertAsFirstChild behavior
/**
 * @param {WuiDom} newChild
 * @returns {WuiDom} - newChild
 */
WuiDom.prototype.insertAsFirstChild = function (newChild) {
	var firstChild = this._childrenList[0];

	if (firstChild) {
		return this.insertChildBefore(newChild, firstChild);
	}

	return this.appendChild(newChild);
};

/**
 * @returns {WuiDom[]} - List of children attached to this WuiDom
 */
WuiDom.prototype.getChildren = function () {
	return this._childrenList.concat();
};

/**
 * @param {string} childName
 * @returns {WuiDom|undefined}
 */
WuiDom.prototype.getChild = function (childName) {
	return this._childrenMap[childName];
};

/**
 * Clean text or html content
 * @private
 */
WuiDom.prototype._clearLinearContent = function () {
	this._text = null;
	this._currentTextContent = null;
	this.rootElement.innerHTML = "";
};

/**
 * Set the html content of the WuiDom.
 * Be aware this will wipe out WuiDom child or text content.
 * @param {string} value
 */
WuiDom.prototype.setHtml = function (value) {
	// Clean if contain children
	if (this._contentType === cType.WUI) {
		this._destroyChildren();
	}

	// Clean if contain text
	if (this._contentType === cType.TEXT) {
		this._clearLinearContent();
	}

	this.rootElement.innerHTML = value;
	this._contentType = cType.HTML;
};

/**
 * Set a textNode as a child and inject the string value
 * Be aware this will wipe out WuiDom child or html content.
 * @param {string} value
 */
WuiDom.prototype.setText = function (value) {
	// Clean if contain children
	if (this._contentType === cType.WUI) {
		this._destroyChildren();
	}

	// Clean if contain html
	if (this._contentType === cType.HTML) {
		this._clearLinearContent();
	}

	if (value === null || value === undefined) {
		return;
	}

	value = value.valueOf();

	if (!this._text) {
		this._text = document.createTextNode("");
		this.rootElement.appendChild(this._text);
	}

	if (value !== this._currentTextContent) {
		this._currentTextContent = value;
		this._text.nodeValue = value;
	}
	this._contentType = cType.TEXT;
};

/**
 * @returns {string}
 */
WuiDom.prototype.getText = function () {
	return this._currentTextContent;
};


/**
 * Style accessors
 * @param {string} property
 * @param {string|number} value
 */
WuiDom.prototype.setStyle = function (property, value) {
	this.rootElement.style[property] = value;
};

/**
 * @param {Object} map - CSS properties
 */
WuiDom.prototype.setStyles = function (map) {
	var s = this.rootElement.style;

	for (var key in map) {
		s[key] = map[key];
	}
};

/**
 * @param {string} property
 */
WuiDom.prototype.unsetStyle = function (property) {
	this.rootElement.style[property] = '';
};

/**
 * @param {string} property
 * @returns {string}
 */
WuiDom.prototype.getStyle = function (property) {
	return this.rootElement.style[property];
};

/**
 * @param {string} property
 * @returns {string}
 */
WuiDom.prototype.getComputedStyle = function (property) {
	var computedStyle = window.getComputedStyle(this.rootElement);
	if (!computedStyle) {
		return null;
	}

	return computedStyle.getPropertyValue(property);
};


// className accessors

function parseClassNames(str) {
	return (str.indexOf(' ') === -1) ? [str] : str.trim().split(/\s+/);
}


function joinArgumentsAsClassNames(base, args) {
	var str = base;

	if (!str) {
		str = args[0];
	} else {
		str += ' ' + args[0];
	}

	for (var i = 1, len = args.length; i < len; i += 1) {
		str += ' ' + args[i];
	}

	return str;
}


function uniqueClassNames(str) {
	var classNames = parseClassNames(str);
	var classNameMap = {};

	for (var i = 0, len = classNames.length; i < len; i += 1) {
		classNameMap[classNames[i]] = null;
	}

	return Object.keys(classNameMap).join(' ');
}

/**
 * Removes the (unparsed) class names in args from `baseList`
 * `baseList` is required to be an array (not a string)
 * `args` is expected to be an arguments object or array
 * @param {string[]} baseList
 * @param {Object|string[]} args
 * @returns {string}
 * @private
 */
function removeClassNames(baseList, args) {
	for (var i = 0, len = args.length; i < len; i += 1) {
		var parsed = parseClassNames(args[i]);

		for (var j = 0, jlen = parsed.length; j < jlen; j += 1) {
			var index = baseList.indexOf(parsed[j]);

			if (index !== -1) {
				baseList.splice(index, 1);
			}
		}
	}

	return baseList.join(' ');
}

/**
 * Returns an array of all class names
 * @returns {Array}
 */
WuiDom.prototype.getClassNames = function () {
	return parseClassNames(this.rootElement.className);
};

/**
 * Returns true/false depending on the given className being present
 * @param {string} className
 * @returns {boolean}
 */
WuiDom.prototype.hasClassName = function (className) {
	return this.getClassNames().indexOf(className) !== -1;
};

/**
 * Allows for adding multiples in separate arguments, space separated or a mix
 * @param {...String} className
 */
WuiDom.prototype.setClassNames = function (className) {
	if (arguments.length > 1) {
		className = joinArgumentsAsClassNames('', arguments);
	}

	this.rootElement.className = className;
};

/**
 * Allows for adding multiples in separate arguments, space separated or a mix
 * @param {...String} classNames
 */
WuiDom.prototype.addClassNames = function (classNames) {
	classNames = joinArgumentsAsClassNames(this.rootElement.className, arguments);
	this.rootElement.className = uniqueClassNames(classNames);
};

/**
 * Adds all classNames in addList and removes the ones in delList
 * @param {Array} delList
 * @param {Array} addList
 */
WuiDom.prototype.replaceClassNames = function (delList, addList) {
	// remove delList from the current
	var classNames = removeClassNames(this.getClassNames(), delList);

	// join the addList to the previous result
	classNames = joinArgumentsAsClassNames(classNames, addList);

	// make sure classes are unique
	this.rootElement.className = uniqueClassNames(classNames);
};

/**
 * Allows for deleting multiples in separate arguments, space separated or a mix
 * @param {...String} classNames
 */
WuiDom.prototype.delClassNames = function (classNames) {
	classNames = classNames;
	this.rootElement.className = removeClassNames(this.getClassNames(), arguments);
};


/**
 * Finding sub-elements
 * @param {string} selector
 * @returns {Node|null}
 */
WuiDom.prototype.query = function (selector) {
	var elm;

	if (this._queryCache) {
		elm = this._queryCache[selector];
	} else {
		this._queryCache = {};
	}

	if (!elm) {
		elm = this._queryCache[selector] = this.rootElement.querySelector(selector);
	}

	return elm;
};

/**
 * @param {string} selector
 * @returns {NodeList}
 */
WuiDom.prototype.queryAll = function (selector) {
	var elm;

	if (this._queryAllCache) {
		elm = this._queryAllCache[selector];
	} else {
		this._queryAllCache = {};
	}

	if (!elm) {
		elm = this._queryAllCache[selector] = this.rootElement.querySelectorAll(selector);
	}

	return elm;
};

/**
 * Destroy all children of a WuiDom
 * @private
 */
WuiDom.prototype._destroyChildren = function () {
	var children = this._childrenList.concat();
	for (var i = 0, len = children.length; i < len; i += 1) {
		children[i].destroy();
	}
};

/**
 * Clear any actual content of the WuiDom
 * Emitting 'cleared' so extra cleanup can be done
 */
WuiDom.prototype.clearContent = function () {
	switch (this._contentType) {
	case cType.HTML:
	case cType.TEXT:
		this._clearLinearContent();
		break;
	case cType.WUI:
		this._destroyChildren();
		break;
	}

	this._contentType = cType.EMPTY;
	this.emit('cleared');
};


/**
 * Removing the domElement and
 */
WuiDom.prototype.destroy = function () {
	this.emit('destroy');

	// destroy caches

	delete this._queryCache;
	delete this._queryAllCache;

	// clean siblings

	this._unsetParent();
	this._destroyChildren();

	// cleanup DOM tree

	var elm = this.rootElement;

	if (elm) {
		// release DOM from parent element

		if (elm.parentElement) {
			elm.parentElement.removeChild(elm);
		}

		// drop DOM references

		this.rootElement = null;
	}

	// drop any remaining event listeners

	this.removeAllListeners();
};



/**
 * Default show implementation
 */
WuiDom.prototype.showMethod = function () {
	this.rootElement.style.display = '';
};

/**
 * Default hide implementation
 */
WuiDom.prototype.hideMethod = function () {
	this.rootElement.style.display = 'none';
};

/**
 * @param {*} [data]
 */
WuiDom.prototype.show = function () {
	if (this._elementIsVisible) {
		return;
	}
	this._elementIsVisible = true;
	this.showMethod();
	this.emit('show');
};

/**
 * @param {*} [data]
 */
WuiDom.prototype.hide = function () {
	if (!this._elementIsVisible) {
		return;
	}
	this._elementIsVisible = false;
	this.hideMethod();
	this.emit('hide');
};

/**
 * Toggle the visibility of the WuiDom
 * @param {boolean} [shouldShow]
 * @param {*} [data]
 */
WuiDom.prototype.toggleDisplay = function (shouldShow) {
	if (arguments.length === 0) {
		shouldShow = !this._elementIsVisible;
	}

	if (shouldShow) {
		this.show();
	} else  {
		this.hide();
	}
};

/**
 * @returns {boolean}
 */
WuiDom.prototype.isVisible = function () {
	return this._elementIsVisible;
};


/**
 * rebindTouchListeners
 */
WuiDom.prototype.rebindTouchListeners = function () {
	if (this.domListeners) {
		var elm = this.rootElement;

		for (var domEventName in this.domListeners) {
			if (!domEventName.match(/^touch/)) {
				continue;
			}

			var domListener = this.domListeners[domEventName];
			for (var eventName in domListener) {
				var evtFn = domListener[eventName];
				elm.removeEventListener(eventName, evtFn);
				elm.addEventListener(eventName, evtFn);
			}
		}
	}
};

/**
 * @param {Tome} tome
 * @param {Function} cb - Update function. Receive current and old value
 */
WuiDom.prototype.bindToTome = function (tome, cb) {
	var self = this;

	if (!cb) {
		cb = function (value) {
			self.setText(value);
		};
	}

	function update(was) {
		cb(this.valueOf(), was);
	}

	tome.on('readable', update);
	cb(tome.valueOf());

	this.on('destroy', function () {
		tome.removeListener('readable', update);
	});
};


/**
 * allowDomEvents
 */
WuiDom.prototype.allowDomEvents = function () {
	// Check if DOM event listeners are already set
	if (this.domListeners) {
		return;
	}

	// Initialize DOM event listeners object
	this.domListeners = {};

	// Bind relevant DOM event listeners when the corresponding wuiDom event listener is created
	this.on('newListener', domEvents.new);

	// Remove DOM listeners when the last event listener for that event gets removed
	this.on('removeListener', domEvents.remove);

	// Destroy DOM event listeners on destroy
	this.on('destroy', domEvents.destroy);
};
