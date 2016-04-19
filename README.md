# Minimalistic finite state machine

A small [finite state machine](https://en.wikipedia.org/wiki/Finite-state_machine) implementation inspired by [machina.js](http://machina-js.org). Works in browsers and Node.js.

## Usage

Module exposes a single `FSM(states, ...mixins)` class that you use to create state machine. The first argument is *states object*: it represents each possible state in which machine can exist. Each state contains *input handlers* which, when invoked, can do something and transition machine into another state. Each state may contain `_enter()` and `_exit()` handlers which invoked when machine enters or exits given state.

You can also pass objects as additional arguments to constructor, each object’s property will be mixed-in to FSM instance.

```js
var myFsm = new FSM({
    // by default FSM transitions to `initial` state. If you need
    // another state to be initial, simply put into `initial` property
    // require state name:
    // initial: "my-state"
    initial: {
        _enter() {
            console.log('initialize');
            // invoke `next` handler of current state with additional arguments
            this.handle('next', {foo: 'bar'});
        },
        next(obj) {
            console.log('invoked with', obj.foo);
            // transition to `ready` state
            this.transition('ready');
        }
    },
    ready: {
        // if you simply need to transition to another state when
        // handler invoked, use state name instead of function
        login: 'authorize',
        logout() {
            console.log('bye-bye');
            this.transition('initial');
        }
    },
    authorize() {
        console.log('Enter your username')
    }
});
```

## API

* `fsm.current` — current state name of FSM
* `fsm.handle(action, ...args)` — invoke `action` handler of current state, if exists. Additional arguments will be passed to action handler.
* `fsm.transition(state)` — transitions to given `state`.

All `FSM` instances are event emitters and allows to subscribe/unsubscribe to FSM life cycle events via `on`, `once`, `off` methods.

Available events:

* `transition` – emitted when machine is about to enter into new state. Emits object with `{from, to, action}` properties.
* `no-handler` — emitted when action handler that is not available for current state was invoked. Emits object with `{action, state}` properties.
* `handling` — emitted when action handler for current state is about to be invoked. Emits object with `{action, state}` properties.
* `handling` — emitted after action handler for current state was invoked. Emits object with `{action, state}` properties.
