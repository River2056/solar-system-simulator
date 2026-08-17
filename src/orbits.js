export const TAU = Math.PI * 2;

export function orbitalAngle(elapsedSimSeconds, orbitalPeriodDays, initialAngle = 0) {
  const periodSeconds = orbitalPeriodDays * 86400;
  return (initialAngle + (elapsedSimSeconds / periodSeconds) * TAU) % TAU;
}

export function orbitalPosition(radius, angle) {
  return { x: Math.cos(angle) * radius, z: Math.sin(angle) * radius };
}

export function advanceSimulation(currentSimMs, realDeltaSeconds, speed, playing = true) {
  return playing ? currentSimMs + realDeltaSeconds * speed * 1000 : currentSimMs;
}
