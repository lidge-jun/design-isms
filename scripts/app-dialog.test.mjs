// Deterministic frame-scheduler regression; rendered focus is also exercised by qa-recipes.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function fixture() {
  const frames = [];
  let document;
  class Element {
    constructor() { this.isConnected = true; this.attributes = new Map(); this.style = {}; }
    focus() { document.activeElement = this; }
    setAttribute(name, value) { this.attributes.set(name, value); }
    removeAttribute(name) { this.attributes.delete(name); }
    querySelectorAll() { return []; }
    addEventListener() {}
    removeEventListener() {}
    contains(node) { return node === this; }
  }
  document = { body: new Element(), documentElement: { clientWidth: 1000 }, activeElement: null,
    querySelector() { return null; }, addEventListener() {}, removeEventListener() {},
    contains(node) { return node.isConnected; } };
  const context = vm.createContext({ document, HTMLElement: Element,
    window: { innerWidth: 1000, requestAnimationFrame(fn) { frames.push(fn); } } });
  vm.runInContext(readFileSync(new URL('../assets/js/app-dialog.js', import.meta.url), 'utf8'), context);
  const controller = context.AppDialogA11y;
  const trigger = new Element();
  trigger.focus();
  const open = () => {
    const overlay = new Element(), target = new Element();
    controller.open({ overlay, initialFocus: target, trigger, onRequestClose() { controller.close(overlay); } });
    return { overlay, target };
  };
  return { frames, document, controller, trigger, open };
}

test('close before the initial frame preserves restored trigger focus', () => {
  const f = fixture();
  const layer = f.open();
  f.controller.close(layer.overlay);
  assert.equal(f.document.activeElement, f.trigger);
  f.frames.shift()();
  assert.equal(f.document.activeElement, f.trigger);
  assert.equal(f.controller.isOpen(layer.overlay), false);
});

test('an older scheduled frame cannot steal focus from a newer modal layer', () => {
  const f = fixture();
  const first = f.open(), second = f.open();
  second.target.focus();
  f.frames.shift()();
  assert.equal(f.document.activeElement, second.target);
  f.frames.shift()();
  assert.equal(f.document.activeElement, second.target);
  f.controller.close(second.overlay);
  assert.equal(f.document.activeElement, first.overlay);
});

test('detached initial-focus nodes are ignored and connected active nodes still focus', () => {
  const f = fixture();
  const first = f.open();
  first.target.isConnected = false;
  f.frames.shift()();
  assert.equal(f.document.activeElement, f.trigger);
  f.controller.close(first.overlay);
  const second = f.open();
  f.frames.shift()();
  assert.equal(f.document.activeElement, second.target);
});
