import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { moveWithSphereCollisions } from '../src/free-roam.js';

const PLANET = { center:new THREE.Vector3(0,0,0), radius:2 };

test('free-roam movement applies the full displacement in open space', () => {
  const position=new THREE.Vector3(-5,0,0);
  const result=moveWithSphereCollisions(position,new THREE.Vector3(0,0,3),[PLANET],.1);

  assert.deepEqual(result.toArray(),[-5,0,3]);
});

test('a spaceship cannot fly through a planet', () => {
  const position=new THREE.Vector3(-5,0,0);
  const result=moveWithSphereCollisions(position,new THREE.Vector3(10,0,0),[PLANET],.1);

  assert.ok(result.x <= -2.1);
  assert.ok(Math.abs(result.distanceTo(PLANET.center)-2.1)<.001);
});

test('an angled collision glides along the planet surface', () => {
  const position=new THREE.Vector3(-5,0,0);
  const result=moveWithSphereCollisions(position,new THREE.Vector3(7,0,3),[PLANET],.1);

  assert.ok(result.z>1.5,'the tangential part of the movement should be preserved');
  assert.ok(result.distanceTo(PLANET.center)>=2.099,'the ship should remain outside the collision hull');
});
