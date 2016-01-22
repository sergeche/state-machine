'use strict';

const assert = require('assert');
const extend = require('xtend');
const FSM = require('../');

const states = {
    initial: {
        next: 'ready',
    },
    ready: {
        next: 'progress'
    },
    progress: {
        _enter() {
            this.handle('next');
        },
        next: 'ready'
    }
};

describe('FSM', () => {
    it('basic use', () => {
        var initEnter = false, initExit = false;
        var fsm = new FSM(extend(states, {
            initial: {
                _enter() {
                    initEnter = true;
                    this.handle('next');
                },
                next: 'ready',
                _exit() {
                    initExit = true;
                }
            }
        }));

        assert(initEnter);
        assert(initExit);
        assert.equal(fsm.current, 'ready');

        // call unsupported handler
        fsm.handle('reset');
        assert.equal(fsm.current, 'ready');
    });

    it('event emitter', () => {
        var actions = [];
        var unhandled = [];
        var transitions = [];

        var fsm = new FSM(states, {
            next() {
                this.handle('next');
            }
        });
        fsm.on('transition', event => transitions.push(event))
        .on('handled', event => actions.push(event))
        .on('no-handler', event => unhandled.push(event));

        assert.equal(fsm.current, 'initial');
        fsm.next();
        assert.equal(fsm.current, 'ready');
        fsm.handle('not-exists');
        fsm.next(); // progress -> ready
        assert.equal(fsm.current, 'ready');

        var transitionChain = [transitions[0].from].concat(transitions.map(t => t.to))
        assert.deepEqual(transitionChain, ['initial', 'ready', 'progress', 'ready']);
        assert.deepEqual(actions, [
            {action: 'next', state: 'initial'},
            {action: 'next', state: 'progress'},
            {action: 'next', state: 'ready'}
        ]);

        assert.deepEqual(unhandled, [
            {action: 'not-exists', state: 'ready'}
        ]);
    });

    it('catch all', () => {
        var fsm = new FSM({
            initial: {
                '*': 's1',
                next: 's2'
            },
            s1: {
                '*': 's2',
                reset: 'initial'
            },
            s2: {
                reset: 'initial'
            }
        });

        assert.equal(fsm.current, 'initial');
        fsm.handle('foo');
        assert.equal(fsm.current, 's1');
        fsm.handle('reset');
        assert.equal(fsm.current, 'initial');

        fsm.handle('next');
        assert.equal(fsm.current, 's2');
        fsm.handle('reset');
        assert.equal(fsm.current, 'initial');
    });
});
