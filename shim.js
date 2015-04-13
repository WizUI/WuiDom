var ElementPrototype = Element.prototype;

if (!ElementPrototype.remove) {
	ElementPrototype.remove = function remove() {
		var parentNode = this.parentNode;
		if (parentNode) {
			parentNode.removeChild(this);
		}
	};
}