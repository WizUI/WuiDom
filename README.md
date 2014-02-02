# Wizcorp UI

## How to use

TODO

## Roadmap

### Parent-Child ownership

Right now, when we appendChild() component A to component B, and B gets destroyed, A is not touched.
It seems to me that we should auto-destroy all child components. We could do this by making appendChild() not
overridable, making it always register the child with the parent (destroying it when needed), and then call an
"appendHandler" function in order to do the actual DOM injection. There could then be a default handler that
simply calls `this.rootElement.appendChild(wuiComponent.rootElement)` and users could replace that with custom
logic through an API like:

`setAppendHandler(function (wuiComponent) {
  // custom logic to append a wuiComponent to the DOM
});`

