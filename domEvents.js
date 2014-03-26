/**
 * Mouse event lock timer. Set to 0 when not locked.
 * 
 * Note: This lock is required to overcome an issue with touch and mouse event compatibility across
 * browsers. The main issue being that when touch events are present the mouse events are fired
 * 300ms later. As such using just mouse events proves to be too slow on mobile devices. Further to
 * this when actually using the touch events, we would end up with double events, and what's worse
 * is that mouse events don't only occur 300ms later, but they also don't exactly fire on the DOM
 * where the touch event fired. But rather so, it would fire on any element which ends up there
 * after the touch event is processed. This resulted in ghost clicks on links etc, that would appear
 * after the touch event.
 * 
 * References:
 *  - http://www.html5rocks.com/en/mobile/touchandmouse/
 *  - https://github.com/Polymer/PointerEvents
 *  - http://blogs.msdn.com/b/davrous/archive/2013/02/20/handling-touch-in-your-html5-apps-thanks-to-the-pointer-events-of-ie10-and-windows-8.aspx
 * 
 * @type Number
 */
var mouseLock = 0;

/**
 * Mouse event lock threshold
 * @type Number
 */
var mouseLockThreshold = 500;


/**
 * Function which updates timestamp on mouse lock. This is used to determine if mouse events occur
 * within the locked threshold.
 */
function updateMouseLock() {
	mouseLock = Date.now();
}


/**
 * Function which clears mouse events lock.
 */
function clearMouseLock() {
	mouseLock = 0;
}


/**
 * Function which checks if a mouse event occured within the mouse lock threshold. If so it will
 * return true. Otherwise it will return false.
 * 
 * @returns {Boolean}
 */
function isMouseLocked() {
	return mouseLock !== 0 && (Date.now() - mouseLock) < mouseLockThreshold;
}


/**
 * DOM event prefix
 * @type String
 */
var domEventPrefix = 'dom';


/**
 * Function which created DOM event listeners according to the given wui-dom events.
 */
exports.new = function (evt) {
	var that = this;

	// Separate DOM event prefix from DOM event name
	var evtNameParts = evt.split('.');

	// Ensure first part is in fact the prefix
	if (evtNameParts[0] !== domEventPrefix) {
		return;
	}

	// Check if DOM event name is valid and also make sure we are not already listening for
	// these DOM events
	var domEventName = evtNameParts[1];
	if (!domEventName || this.domListeners[domEventName]) {
		return;
	}

	switch (domEventName) {
	case 'touchstart':
		// If this event is a touchstart event, attach mousedown compatibility bindings along
		// with the touchstart event
		var mouseDownFn = function (e) {
			if (isMouseLocked() || e.which !== 1) {
				return;
			}

			that.emit('dom.touchstart', e);
		};

		var touchStartFn = function (e) {
			updateMouseLock();
			that.emit('dom.touchstart', e);
		};

		this.domListeners['dom.touchstart'] = {
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

		this.domListeners['dom.touchmove'] = {
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
			if (isMouseLocked() || e.which !== 1) {
				clearMouseLock();
				return;
			}

			that.emit('dom.touchend', e);
		};

		var touchEndFn = function (e) {
			updateMouseLock();
			that.emit('dom.touchend', e);
		};

		this.domListeners['dom.touchend'] = {
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
};

/**
 * Function which removes DOM event listeners for a given wui-dom event
 */
exports.remove = function (evt) {
	if (this.listeners(evt).length !== 0) {
		return;
	}

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
	if (domListener !== null && typeof domListener === 'object') {
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
};

/**
 * Function which destroys all bound event listeners on the current wui-dom object
 */
exports.destroy = function () {
	for (var domEventName in this.domListeners) {
		var domListener = this.domListeners[domEventName];

		// Destroy grouped event listeners
		if (domListener !== null && typeof domListener === 'object') {
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
};