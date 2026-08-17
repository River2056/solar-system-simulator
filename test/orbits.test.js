import test from 'node:test';
import assert from 'node:assert/strict';
import { orbitalAngle, orbitalPosition, advanceSimulation, TAU } from '../src/orbits.js';

test('one orbital period completes one revolution', () => {
  assert.ok(Math.abs(orbitalAngle(365.25 * 86400, 365.25)) < 1e-10);
});

test('quarter orbit position is on positive z axis', () => {
  const p = orbitalPosition(10, TAU / 4);
  assert.ok(Math.abs(p.x) < 1e-10);
  assert.equal(p.z, 10);
});

test('simulation advances at selected speed and pauses', () => {
  assert.equal(advanceSimulation(0, 60, 60), 3600000);
  assert.equal(advanceSimulation(123, 10, 60, false), 123);
});
