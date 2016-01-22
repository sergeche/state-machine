/**
 * A very basic and simple finite state machine implementation
 */
'use strict';

const EventEmitter = require('eventemitter3');
const assign = require('xtend/mutable');

module.exports = class FSM extends EventEmitter {
    constructor(states) {
        super();

        this.states = states;
        this._current = null;
        this._currenAction = null;
        this._inExitHandler = false;

        if (!states.initial) {
            throw new Error('No initial state specified');
        }

        // add mixins
        toArray(arguments, 1).forEach(mixin => assign(this, mixin));

        var target = typeof states.initial === 'string' ? states.initial : 'initial';
        this.transition(target)
    }

    get current() {
        return this._current;
    }

    transition(target) {
        var curState = this.states[this.current];
        var newState = this.states[target];

        if (!newState) {
            this.emit('invalid-state', target);
            return;
        }

        if (!this._inExitHandler && curState !== newState) {
            if (curState && curState._exit) {
                this._inExitHandler = true;
                curState._exit.call(this);
                this._inExitHandler = false;
            }

            this.emit('transition', {
                from: this.current,
                to: target,
                action: this._currenAction
            });

            this._current = target;
            if (newState._enter) {
                newState._enter.call(this);
            }
        }
    }

    handle(action) {
        var args = toArray(arguments, 1);
        var curState = this.states[this.current];
        var handler = curState[action] || curState['*'];
        if (this._inExitHandler) {
            return;
        }

        var eventPayload = {action, state: this.current};
        if (!handler) {
            this.emit('no-handler', eventPayload);
            return;
        }

        var result;
        this._currenAction = action;
        this.emit('handling', eventPayload);
        if (typeof handler === 'function') {
            result = handler.apply(this, args);
        } else {
            result = handler;
            this.transition(handler);
        }
        this.emit('handled', eventPayload);
    }
}

function toArray(obj, ix) {
    return Array.prototype.slice.call(obj, ix || 0);
}
