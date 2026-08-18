import * as THREE from 'three';

const Y_AXIS = new THREE.Vector3(0,1,0);

export function updateTrackedCamera(cameraPosition, controlsTarget, targetWorld, dt, cinematic) {
  const delta=targetWorld.clone().sub(controlsTarget);
  cameraPosition.add(delta);
  controlsTarget.copy(targetWorld);

  if(cinematic) {
    const offset=cameraPosition.clone().sub(targetWorld);
    offset.applyAxisAngle(Y_AXIS,dt*.055);
    cameraPosition.copy(targetWorld).add(offset);
  }
}
