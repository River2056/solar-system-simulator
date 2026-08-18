import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { updateTrackedCamera } from '../src/camera.js';
import { advanceSimulation, orbitalAngle, orbitalPosition } from '../src/orbits.js';

test('cinematic camera keeps a stable distance while tracking a planet at 1M speed', () => {
  const dt=1/60;
  const speed=1000000;
  const orbitRadius=33;
  const orbitalPeriodDays=365.25;
  let simMs=0;
  let position=orbitalPosition(orbitRadius,0);
  const target=new THREE.Vector3(position.x,0,position.z);
  const controlsTarget=target.clone();
  const cameraPosition=target.clone().add(new THREE.Vector3(18,3,0));
  const initialDistance=cameraPosition.distanceTo(target);

  for(let frame=0;frame<120;frame+=1) {
    simMs=advanceSimulation(simMs,dt,speed);
    position=orbitalPosition(orbitRadius,orbitalAngle(simMs/1000,orbitalPeriodDays));
    target.set(position.x,0,position.z);
    updateTrackedCamera(cameraPosition,controlsTarget,target,dt,true);
  }

  assert.ok(Math.abs(cameraPosition.distanceTo(target)-initialDistance)<.01);
  assert.ok(controlsTarget.distanceTo(target)<Number.EPSILON);
});
