import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { orbitalAngle, orbitalPosition, advanceSimulation, TAU } from '../src/orbits.js';
import { MOONS_BY_PLANET, moonAngularVelocity, advanceSynchronousMoon } from '../src/moons.js';
import { MOON_APPEARANCES, createMoonGeometry, createMoonMaterial } from '../src/moon-visuals.js';
import { orientPlanet, advancePlanetRotation } from '../src/planet-rotation.js';

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

test('Venus and Uranus rotate clockwise around their tilted axes', () => {
  function worldSpinAxis(name) {
    const planet=new THREE.Object3D();
    orientPlanet(planet,name);
    const before=planet.quaternion.clone();
    advancePlanetRotation(planet,.001,1);
    const delta=planet.quaternion.clone().multiply(before.invert()).normalize();
    const sinHalfAngle=Math.hypot(delta.x,delta.y,delta.z);
    return new THREE.Vector3(delta.x,delta.y,delta.z).divideScalar(sinHalfAngle);
  }

  assert.ok(worldSpinAxis('Earth').y>.9);
  assert.ok(worldSpinAxis('Venus').y<-.9);
  assert.ok(worldSpinAxis('Uranus').y<0);
  assert.ok(Math.abs(worldSpinAxis('Uranus').x)>.9);
});

test('representative moons use their real orbital direction and relative period', () => {
  const moon=MOONS_BY_PLANET.Earth[0];
  const phobos=MOONS_BY_PLANET.Mars[0];
  const triton=MOONS_BY_PLANET.Neptune[0];

  assert.ok(moonAngularVelocity(phobos.orbitPeriodDays) > moonAngularVelocity(moon.orbitPeriodDays));
  assert.ok(moonAngularVelocity(triton.orbitPeriodDays,triton.direction) < 0);
});

test('a synchronous moon spins once in the same direction as it orbits', () => {
  const system={
    angularVelocity:0.2,
    pivot:{rotation:{y:0.5}},
    orientation:{rotation:{y:-0.5}},
    moon:{rotation:{y:0.5}}
  };

  advanceSynchronousMoon(system,2);

  assert.equal(system.pivot.rotation.y,0.9);
  assert.equal(system.orientation.rotation.y,-0.9);
  assert.equal(system.moon.rotation.y,0.9);
});

test('every rendered moon has a dedicated appearance profile', () => {
  const renderedMoons=Object.values(MOONS_BY_PLANET).flat().map(moon=>moon.name);

  assert.deepEqual(Object.keys(MOON_APPEARANCES).sort(),renderedMoons.sort());
  assert.equal(MOON_APPEARANCES.Phobos.style,'rocky');
  assert.equal(MOON_APPEARANCES.Io.style,'volcanic');
  assert.equal(MOON_APPEARANCES.Titan.atmosphere,'#e8903b');
});

test('irregular moons use distorted geometry while major icy moons remain smooth', () => {
  const phobos=createMoonGeometry('Phobos',1);
  const europa=createMoonGeometry('Europa',1);

  assert.notEqual(phobos.type,europa.type);
  assert.deepEqual(MOON_APPEARANCES.Phobos.shape,[1,.81,.67]);
  assert.equal(europa.type,'SphereGeometry');
});

test('color-only features are not reused as artificial topography', () => {
  const texture=new THREE.Texture();
  const io=createMoonMaterial('Io',texture);
  const titan=createMoonMaterial('Titan',texture);
  const phobos=createMoonMaterial('Phobos',texture);

  assert.equal(io.bumpMap,null);
  assert.equal(titan.bumpMap,null);
  assert.equal(phobos.bumpMap,texture);
  assert.equal(phobos.bumpScale,.04);
});
