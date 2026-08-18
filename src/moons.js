const EARTH_MOON_PERIOD_DAYS = 27.321661;
const BASE_VISUAL_ANGULAR_SPEED = 0.18;
const MAX_VISUAL_ANGULAR_SPEED = 1.4;

// The simulator renders a representative set of major moons. Orbital periods and
// directions preserve their relative real-world behavior while animation rates
// are compressed so that the motion remains visible at this scale.
export const MOONS_BY_PLANET = Object.freeze({
  Earth: [
    { name:'Moon', orbitPeriodDays:27.321661, eclipticInclinationDeg:5.145 }
  ],
  Mars: [
    { name:'Phobos', orbitPeriodDays:0.31891, eclipticInclinationDeg:26.0 },
    { name:'Deimos', orbitPeriodDays:1.26244, eclipticInclinationDeg:27.6 }
  ],
  Jupiter: [
    { name:'Io', orbitPeriodDays:1.76914, eclipticInclinationDeg:3.1 },
    { name:'Europa', orbitPeriodDays:3.55118, eclipticInclinationDeg:3.5 },
    { name:'Ganymede', orbitPeriodDays:7.15455, eclipticInclinationDeg:3.2 },
    { name:'Callisto', orbitPeriodDays:16.68902, eclipticInclinationDeg:3.3 }
  ],
  Saturn: [
    { name:'Mimas', orbitPeriodDays:0.94242, eclipticInclinationDeg:28.3 },
    { name:'Enceladus', orbitPeriodDays:1.37022, eclipticInclinationDeg:26.7 },
    { name:'Titan', orbitPeriodDays:15.94542, eclipticInclinationDeg:27.0 }
  ],
  Uranus: [
    { name:'Miranda', orbitPeriodDays:1.41348, eclipticInclinationDeg:102.2 },
    { name:'Titania', orbitPeriodDays:8.70587, eclipticInclinationDeg:97.8 }
  ],
  Neptune: [
    { name:'Triton', orbitPeriodDays:5.87685, eclipticInclinationDeg:50.0, direction:-1 }
  ]
});

export function moonAngularVelocity(orbitPeriodDays, direction = 1) {
  const visualSpeed = BASE_VISUAL_ANGULAR_SPEED * Math.sqrt(EARTH_MOON_PERIOD_DAYS / orbitPeriodDays);
  return Math.sign(direction || 1) * Math.min(visualSpeed, MAX_VISUAL_ANGULAR_SPEED);
}

export function advanceSynchronousMoon(system, deltaSeconds) {
  const angleDelta=deltaSeconds*system.angularVelocity;
  system.pivot.rotation.y+=angleDelta;
  system.orientation.rotation.y=-system.pivot.rotation.y;
  system.moon.rotation.y+=angleDelta;
}
