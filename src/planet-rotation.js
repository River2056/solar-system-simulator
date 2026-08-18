export const PLANET_AXIAL_TILTS = {
  Mercury:.034,
  Venus:3.095,
  Earth:.409,
  Mars:.44,
  Jupiter:.054,
  Saturn:.466,
  Uranus:1.706,
  Neptune:.494
};

export function orientPlanet(mesh, name) {
  mesh.rotation.order='ZYX';
  mesh.rotation.z=PLANET_AXIAL_TILTS[name];
}

export function advancePlanetRotation(mesh, deltaSeconds, angularSpeed) {
  mesh.rotation.y+=deltaSeconds*angularSpeed;
}
