/**
 * @module WuiDom
 */

var inherit = require('util').inherits;
var EventEmitter = require('events').EventEmitter;

var document = window.document;

// non-touch enabled browser workarounds

var canTouch = ('ontouchstart' in window && 'ontouchend' in window && 'ontouchmove' in window);

var touchToMouseMap = {
	touchstart: 'mousedown',
	touchmove: 'mousemove',
	touchend: 'mouseup',
	touchcancel: false
};


/**
 * Fixes for unsupported dom events
 * @private
 * @param {DomEvent} domEventName
 */
function translateDomEventName(domEventName) {
	if (!canTouch && touchToMouseMap.hasOwnProperty(domEventName)) {
		return touchToMouseMap[domEventName];
	}

	return domEventName;
}


/**
 * HTML creation helper
 * @private
 * @param {String} tagName
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
 * @alias module:WuiDom
 * @augments EventEmitter
 * @param {String} tagName
 * @param {Object} [options]
 */
function WuiDom(tagName, options) {
	EventEmitter.call(this);
	this._elementIsVisible = true;
	this._currentTextContent = null;
	this.rootElement = null;
	this._text = null;
	this._name = null;
	this._childrenList = [];
	this._childrenMap = {};
	this._parent = null;
	if (tagName) {
		this.assign(tagName, options);
	}
}

inherit(WuiDom, EventEmitter);
module.exports = WuiDom;


/**
 * Makes the given element the rootElement for this component.
 * If instead of an HTML element, a tagName and options are given, the element is created and assigned.
 * The logic for HTML creation follows the rules of the private createHtmlElement function.
 * @param {String} tagName
 * @param {Object} [options]
 */
WuiDom.prototype.assign = function (tagName, options) {
	if (this.rootElement) {
		throw new Error('WuiDom has already an element assigned');
	}
	options = options || {};
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

	if (options.name) {
		this._name = options.name;
	}

	if (options.hidden) {
		// start hidden
		this.hide();
	}

	return this.rootElement;
};

/**
 * @param {WuiDom|String} child
 * @returns {WuiDom} - oldChild
 */
WuiDom.prototype.removeChild = function (child) {
	if (typeof child === 'string') {
		child = this.getChild(child);
	}
	var siblingIndex = this._childrenList.indexOf(child);
	if (siblingIndex === -1) {
		return child;
	}

	child._parent = null;
	this.rootElement.removeChild(child.rootElement);
	delete this._childrenMap[child._name];
	return this._childrenList.splice(siblingIndex, 1)[0];
};


/**
 * @param {WuiDom} parent
 * @private
 */
WuiDom.prototype._setParent = function (parent) {
	if (this._name) {
		if (parent._childrenMap[this._name]) {
			throw new Error('WuiDom: Parent already has a child with this name');
		}
		parent._childrenMap[this._name] = this;
	}

	if (this._parent) {
		this._parent.removeChild(this);
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
 *
 * @param {WuiDom} newChild
 * @returns {WuiDom}
 */
WuiDom.prototype.appendChild = function (newChild) {
	if (this._currentTextContent) {
		this._clearLinearContent();
	}
	newChild._setParent(this);

	this._childrenList.push(newChild);
	this.rootElement.appendChild(newChild.rootElement);

	// touch events are known to get lost, so rebind them
	newChild.rebindTouchListeners();
	return newChild;
};


/**
 * Creates an instance of WuiDom and assigns a newly built HTML element to it,
 * following the logic of the private createHtmlElement function. It is then appended to
 * this component.
 * @param {String} tagName
 * @param {Object} [options]
 * @param {String} [name]
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
	if (this._currentTextContent) {
		this._clearLinearContent();
	}
	var siblingIndex = 0;

	if (!newNextSibling) {
		siblingIndex = this._childrenList.length;
	} else {
		siblingIndex = this._childrenList.indexOf(newNextSibling);
	}

	if (siblingIndex === -1) {
		throw new Error('WuiDom: Wanted sibling is not a child');
	}

	newChild._setParent(this);
	this.rootElement.insertBefore(newChild.rootElement, newNextSibling.rootElement);

	// touch events are known to get lost, so rebind them
	newChild.rebindTouchListeners();

	this._childrenList.splice(siblingIndex, 0, newChild);
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
		return newChild.insertChildBefore(newChild, firstChild);
	}

	return this.appendChild(newChild);
};

/**
 * @returns {Array} - List of children attach to this WuiDom
 */
WuiDom.prototype.getChildren = function () {
	return this._childrenList.concat();
};

/**
 * @param {String} childName
 * @returns {WuiDom|undefined}
 */
WuiDom.prototype.getChild = function (childName) {
	return this._childrenMap[childName];
};


/**
 * Timers (for internal use)
 * @param {String} id
 * @private
 */
WuiDom.prototype._clearTimer = function (id) {
	if (!this.timers) {
		return;
	}

	var handle = this.timers[id];

	if (handle) {
		window.clearTimeout(handle);

		delete this.timers[id];
	}
};

/**
 * @deprecated
 * @param id
 */
WuiDom.prototype.clearTimer = function (id) {
	console.warn("clearTimer is deprecated");
	this._clearTimer(id);
};

/**
 * Timers (for internal use)
 * @param {String} id
 * @param {Function} fn
 * @param {Number} interval
 * @private
 */
WuiDom.prototype._setTimer = function (id, fn, interval) {
	this._clearTimer(id);

	this.timers = this.timers || {};

	var handle = window.setTimeout(function (that) {
		delete that.timers[handle];

		fn.call(that);
	}, interval, this);

	this.timers[id] = handle;
};

/**
 * @deprecated
 * @param id
 * @param fn
 * @param interval
 */
WuiDom.prototype.setTimer = function (id, fn, interval) {
	console.warn("setTimer is deprecated");
	this._setTimer(id, fn, interval);
};


/**
 * Content: html and text
 * - if value is a function, execute it and use the return value as text
 * - if an interval is given, repeat the given function every N msec until setHtml is called again, or the component is destroyed
 * - if value is not a function, use its string representation as html string
 * @param {String|Function} value
 * @param {Number} [interval]
 */
WuiDom.prototype.setHtml = function (value, interval) {
	if (this._childrenList.length) {
		this.clearContent();
	}
	if (typeof value === 'function') {
		var fn = value;
		value = fn();

		if (interval) {
			this._setTimer('content', function () {
				this.setHtml(fn, interval);
			}, interval);
		} else {
			this._clearTimer('content');
		}
	} else {
		this._clearTimer('content');
	}
	this.rootElement.innerHTML = value;
	this._currentTextContent = value;
};

/**
 * Clean text or html content
 * @private
 */
WuiDom.prototype._clearLinearContent = function () {
	this._clearTimer('content');
	this._text = null;
	this._currentTextContent = null;
	this.rootElement.innerHTML = "";
};

/**
 * - if value is a function, execute it and use the return value as text
 * - if an interval is given, repeat the given function every N msec until setText is called again, or the component is destroyed
 * - if value is not a function, use its string representation as text
 *
 * Current implementation allow to add children AND edit a text.
 * Might be change in the future to have a behavior closer to setHtml
 * @param {String|Function} value
 * @param {Number} [interval]
 */
WuiDom.prototype.setText = function (value, interval) {
	if (this._childrenList.length) {
		this.clearContent();
	}
	if (value === null || value === undefined) {
		return;
	}

	value = value.valueOf();

	if (typeof value === 'function') {
		var fn = value;
		value = fn();

		if (interval) {
			this._setTimer('content', function () {
				this.setText(fn, interval);
			}, interval);
		} else {
			this._clearTimer('content');
		}
	} else {
		this._clearTimer('content');
	}

	if (!this._text) {
		this._text = document.createTextNode("");
		this.rootElement.appendChild(this._text);
	}

	if (value !== this._currentTextContent) {
		this._currentTextContent = value;
		this._text.nodeValue = value;
	}
};

/**
 * @returns {String}
 */
WuiDom.prototype.getText = function () {
	return this._currentTextContent;
};


/**
 * style accessors
 * @param {String} property
 * @param {String|Number} value
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
 * @param {String} property
 */
WuiDom.prototype.unsetStyle = function (property) {
	this.rootElement.style[property] = null;
};

/**
 * @param {String} property
 * @returns {String}
 */
WuiDom.prototype.getStyle = function (property) {
	return this.rootElement.style[property];
};

/**
 * @param {String} property
 * @returns {String}
 */
WuiDom.prototype.getComputedStyle = function (property) {
	var computedStyle = window.getComputedStyle(this.rootElement);
	if (!computedStyle) {
		return undefined;
	}

	var cssValue = computedStyle.getPropertyCSSValue(property);
	return cssValue ? cssValue.cssText : undefined;
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


function removeClassNames(baseList, args) {
	// removes the (unparsed) class names in args from baseList
	// baseList is required to be an array (not a string)
	// args is expected to be an arguments object or array

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
 * @returns {Array}
 */
WuiDom.prototype.getClassNames = function () {
	// returns an array of all class names

	return parseClassNames(this.rootElement.className);
};

/**
 * @param {String} className
 * @returns {Boolean}
 */
WuiDom.prototype.hasClassName = function (className) {
	// returns true/false depending on the given className being present

	return this.getClassNames().indexOf(className) !== -1;
};

/**
 * @param {...String} className
 */
WuiDom.prototype.setClassNames = function (className) {
	// allows for adding multiples in separate arguments, space separated or a mix

	if (arguments.length > 1) {
		className = joinArgumentsAsClassNames('', arguments);
	}

	this.rootElement.className = className;
};

/**
 * @param {...String} classNames
 */
WuiDom.prototype.addClassNames = function (classNames) {
	// allows for adding multiples in separate arguments, space separated or a mix

	classNames = joinArgumentsAsClassNames(this.rootElement.className, arguments);
	this.rootElement.className = uniqueClassNames(classNames);
};

/**
 * @param {Array} delList
 * @param {Array} addList
 */
WuiDom.prototype.replaceClassNames = function (delList, addList) {
	// adds all classNames in addList and removes the ones in delList

	var current = parseClassNames(joinArgumentsAsClassNames(this.rootElement.className, addList));

	this.rootElement.className = removeClassNames(current, delList);
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
 * @param {String} selector
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
 * @param {String} selector
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
	this._destroyChildren();
	this._clearLinearContent();
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

	if (this._parent) {
		this._parent.removeChild(this);
		this._parent = null;
	}

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

	// drop any built-in timers

	if (this.timers) {
		for (var id in this.timers) {
			this._clearTimer(id);
		}
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
 * @param {*} data
 */
WuiDom.prototype.show = function (data) {
	this.emit('show', data);
	this._elementIsVisible = true;
	this.showMethod();
};

/**
 * @param {*} data
 */
WuiDom.prototype.hide = function (data) {
	this.emit('hide', data);
	this._elementIsVisible = false;
	this.hideMethod();
};

/**
 * @returns {Boolean}
 */
WuiDom.prototype.isVisible = function () {
	return this._elementIsVisible;
};


// DOM events

var domEventPrefix = 'dom';

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

			var fn = this.domListeners[domEventName];

			elm.removeEventListener(domEventName, fn);
			elm.addEventListener(domEventName, fn);
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
	if (this.domListeners) {
		// already set
		return;
	}

	var that = this;
	this.domListeners = {};


	this.on('newListener', function (evt) {
		var evtNameParts = evt.split('.');

		if (evtNameParts[0] !== domEventPrefix) {
			return;
		}

		// translate the dom event name for compatibility reasons

		var domEventName = translateDomEventName(evtNameParts[1]);

		// if we're not yet listening for this event, add a dom event listener that emits dom events

		if (domEventName && !that.domListeners[domEventName]) {
			var fn = function (e) {
				that.emit(evt, e);
			};

			if (domEventName === 'mousedown' || domEventName === 'mousemove') {
				// on desktop, only allow left-mouse clicks to fire events

				fn = function (e) {
					if (e.which === 1) {
						that.emit(evt, e);
					}
				};
			}

			that.domListeners[domEventName] = fn;

			that.rootElement.addEventListener(domEventName, fn);
		}
	});

	this.on('removeListener', function (evt) {
		// when the last event listener for this event gets removed, we stop listening for DOM events

		if (that.listeners(evt).length === 0) {
			var evtNameParts = evt.split('.');

			if (evtNameParts[0] !== domEventPrefix) {
				return;
			}

			var domEventName = translateDomEventName(evtNameParts[1]);

			var fn = that.domListeners[domEventName];

			if (fn) {
				that.rootElement.removeEventListener(domEventName, fn);

				delete that.domListeners[domEventName];
			}
		}
	});

	this.on('destroy', function () {
		// destroy DOM event listeners

		for (var domEventName in that.domListeners) {
			var fn = that.domListeners[domEventName];

			that.rootElement.removeEventListener(domEventName, fn);
		}

		that.domListeners = {};
	});
};
