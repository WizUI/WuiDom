var inherit = require('util').inherits;
var EventEmitter = require('events').EventEmitter;

var documentObj = window.document;


/**
 * Mouse event lock timer
 * @type False|Number
 */
var mouseLock = false;

/**
 * Mouse event lock threshold
 * @type Number
 */
var mouseLockThreshold = 500;


/**
 * Function which updates timestamp on mouse lock. This is used to determine if mouse events occur
 * within the locked threshold.
 * 
 * @returns {undefined}
 */
function updateMouseLock() {
	mouseLock = Date.now();
}


/**
 * Function which clears mouse events lock.
 * 
 * @returns {undefined}
 */
function clearMouseLock() {
	mouseLock = false;
}


/**
 * Function which checks if a mouse event occured within the mouse lock threshold. If so it will
 * return true. Otherwise it will return false.
 * 
 * @returns {Boolean}
 */
function mouseLocked() {
	return (Date.now() - mouseLock) < mouseLockThreshold;
}


/**
 * HTML creation helper
 * @private
 * @param {String} tagName
 * @param {Object} [options]
 */
function createHtmlElement(tagName, options) {
	var key, elm = documentObj.createElement(tagName);

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
 * @class
 * @classDesc blah
 * @augments EventEmitter
 * @param {String} tagName
 * @param {Object} [options]
 */
function WuiDom(tagName, options) {
	EventEmitter.call(this);
	this.elementIsVisible = true;
	this.currentTextContent = null;
	this.rootElement = null;
	this.text = null;
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

	if (options && options.hidden) {
		// start hidden
		this.hide();
	}

	return this.rootElement;
};


/**
 * Creates an instance of WuiDom and assigns a newly built HTML element to it,
 * following the logic of the private createHtmlElement function. It is then appended to
 * this component.
 * @param {String} tagName
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


// override this function to implement custom appendChild behavior
/**
 * @param {WuiDom} newChild
 */
WuiDom.prototype.appendChild = function (newChild) {
	this.rootElement.appendChild(newChild.rootElement);

	// touch events are known to get lost, so rebind them

	newChild.rebindTouchListeners();

	return newChild;
};


// override this function to implement custom insertBefore behavior
/**
 * @param {WuiDom} newNextSibling
 */
WuiDom.prototype.insertBefore = function (newNextSibling) {
	newNextSibling.rootElement.parentNode.insertBefore(this.rootElement, newNextSibling.rootElement);

	// touch events are known to get lost, so rebind them

	this.rebindTouchListeners();
};

// override this function to implement custom insertAsFirstChild behavior
/**
 * @param {WuiDom} newChild
 */
WuiDom.prototype.insertAsFirstChild = function (newChild) {
	var firstChild = this.rootElement.firstChild;

	if (firstChild) {
		this.rootElement.insertBefore(newChild.rootElement, firstChild);
	} else {
		this.rootElement.appendChild(newChild.rootElement);
	}

	// touch events are known to get lost, so rebind them

	newChild.rebindTouchListeners();

	return newChild;
};

/**
 * @param {WuiDom} newChild
 * @param {WuiDom} newNextSibling
 */
WuiDom.prototype.insertChildBefore = function (newChild, newNextSibling) {
	this.rootElement.insertBefore(newChild.rootElement, newNextSibling.rootElement);

	// touch events are known to get lost, so rebind them

	newChild.rebindTouchListeners();
};


/**
 * Timers (for internal use)
 * @param {Number} id
 * @param {Function} fn
 * @param {Number} interval
 */
WuiDom.prototype.setTimer = function (id, fn, interval) {
	this.clearTimer(id);

	this.timers = this.timers || {};

	var handle = window.setTimeout(function (that) {
		delete that.timers[handle];

		fn.call(that);
	}, interval, this);

	this.timers[id] = handle;
};

/**
 * Timers (for internal use)
 * @param {Number} id
 */
WuiDom.prototype.clearTimer = function (id) {
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
 * Content: html and text
 * - if value is a function, execute it and use the return value as text
 * - if an interval is given, repeat the given function every N msec until setHtml is called again, or the component is destroyed
 * - if value is not a function, use its string representation as html string
 * @param {String|Function} value
 * @param {Number} [interval]
 */
WuiDom.prototype.setHtml = function (value, interval) {

	if (typeof value === 'function') {
		var fn = value;
		value = fn();

		if (interval) {
			this.setTimer('content', function () {
				this.setHtml(fn, interval);
			}, interval);
		} else {
			this.clearTimer('content');
		}
	} else {
		this.clearTimer('content');
	}

	this.rootElement.innerHTML = value;
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
	if (value === null || value === undefined) {
		return;
	}

	value = value.valueOf();

	if (typeof value === 'function') {
		var fn = value;
		value = fn();

		if (interval) {
			this.setTimer('content', function () {
				this.setText(fn, interval);
			}, interval);
		} else {
			this.clearTimer('content');
		}
	} else {
		this.clearTimer('content');
	}

	if (this.currentTextContent === null) {
		this.text = documentObj.createTextNode("");
		this.rootElement.appendChild(this.text);
	}

	if (value !== this.currentTextContent) {
		this.currentTextContent = value;
		this.text.nodeValue = value;
	}
};

/**
 * @returns {String}
 */
WuiDom.prototype.getText = function () {
	return this.currentTextContent;
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
	var uniqueClassNamesObj = {};

	for (var i = 0, len = classNames.length; i < len; i += 1) {
		var className = classNames[i];
		uniqueClassNamesObj[className] = null;
	}

	return Object.keys(uniqueClassNamesObj).join(' ');
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
 * @returns {*}
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
 * @returns {*}
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
 * Cleanup
 */
WuiDom.prototype.destroy = function () {
	this.emit('destroy');

	// destroy caches

	delete this._queryCache;
	delete this._queryAllCache;

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
			this.clearTimer(id);
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
	this.elementIsVisible = true;
	this.showMethod();
};

/**
 * @param {*} data
 */
WuiDom.prototype.hide = function (data) {
	this.emit('hide', data);
	this.elementIsVisible = false;
	this.hideMethod();
};

/**
 * @returns {Boolean}
 */
WuiDom.prototype.isVisible = function () {
	return this.elementIsVisible;
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

	// Initialize dom event listeners object
	this.domListeners = {};

	// Bind relavent DOM event listeners wuiDom event listener is created
	this.on('newListener', function (evt) {
		var that = this;

		// Separate DOM event prefix from DOM event name
		var evtNameParts = evt.split('.');
		var domEventName = evtNameParts[1];

		// Ensure first part is in fact the prefix
		if (evtNameParts[0] !== domEventPrefix) {
			return;
		}

		// Check if DOM event name is valid and also make sure we are not already listening for
		// these DOM events
		if (!domEventName || this.domListeners[domEventName]) {
			return;
		}

		switch (domEventName) {
		case 'touchstart':
			// If this event is a touchstart event, attach mousedown compatibility bindings along
			// with the touchstart event
			var mouseDownFn = function (e) {
				if (mouseLocked() || e.which !== 1) {
					return;
				}

				that.emit('dom.touchstart', e);
			};

			var touchStartFn = function (e) {
				updateMouseLock();
				that.emit('dom.touchstart', e);
			};

			this.domListeners[domEventName] = {
				'mousedown': mouseDownFn,
				'touchstart': touchStartFn
			};

			this.rootElement.addEventListener('mousedown', mouseDownFn);
			this.rootElement.addEventListener('touchstart', touchStartFn);
			break;
		case 'touchmove':
			// If this event is a touchmove event, attach mousemove compatibility bindings along
			// with the touchmove event
			var mouseMoveFn = function (e) {
				if (mouseLock || e.which !== 1) {
					return;
				}

				that.emit('dom.touchmove', e);
			};

			var touchMoveFn = function (e) {
				that.emit('dom.touchmove', e);
			};

			this.domListeners[domEventName] = {
				'mousemove': mouseMoveFn,
				'touchmove': touchMoveFn
			};

			this.rootElement.addEventListener('mousemove', mouseMoveFn);
			this.rootElement.addEventListener('touchmove', touchMoveFn);
			break;
		case 'touchend':
			// If this event is a touchend event, attach mouseup compatibility bindings along with
			// the touchend event
			var mouseUpFn = function (e) {
				if (mouseLocked() || e.which !== 1) {
					clearMouseLock();
					return;
				}

				that.emit('dom.touchend', e);
			};

			var touchEndFn = function (e) {
				updateMouseLock();
				that.emit('dom.touchend', e);
			};

			this.domListeners[domEventName] = {
				'mouseup': mouseUpFn,
				'touchend': touchEndFn
			};

			this.rootElement.addEventListener('mouseup', mouseUpFn);
			this.rootElement.addEventListener('touchend', touchEndFn);
			break;
		default:
			// Otherwise the default is to bind event as is
			var defaultFn = function (e) {
				that.emit(evt, e);
			};

			this.domListeners[domEventName] = defaultFn;
			this.rootElement.addEventListener(domEventName, defaultFn);
		}
	});

	// Remove DOM listeners when the last event listener for that event gets removed
	this.on('removeListener', function (evt) {
		if (this.listeners(evt).length === 0) {
			var evtNameParts = evt.split('.');

			if (evtNameParts[0] !== domEventPrefix) {
				return;
			}

			var domEventName = evtNameParts[1];
			var domListener = this.domListeners[domEventName];

			// Ensure dom event listener exists
			if (!domListener) {
				return;
			}
			
			// Destroy grouped event listeners
			if (typeof domListener === 'object') {
				for (var eventName in domListener) {
					var evtFn = domListener[eventName];
					this.rootElement.removeEventListener(eventName, evtFn);
				}

				delete this.domListeners[domEventName];
				return;
			}

			// Default event listener destruction
			this.rootElement.removeEventListener(domEventName, domListener);
			delete this.domListeners[domEventName];
		}
	});

	// Destroy DOM event listeners on destroy
	this.on('destroy', function () {
		for (var domEventName in this.domListeners) {
			var domListener = this.domListeners[domEventName];

			// Destroy grouped event listeners
			if (typeof domListener === 'object') {
				for (var eventName in domListener) {
					var evtFn = domListener[eventName];
					this.rootElement.removeEventListener(eventName, evtFn);
				}

				continue;
			}

			// Default event listener destruction
			this.rootElement.removeEventListener(domEventName, domListener);
		}

		this.domListeners = {};
	});
};
