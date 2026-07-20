import * as THREE from 'three';

export const rand = (a: number, b: number) => a + Math.random() * (b - a);

export const lerpAngle = (a: number, b: number, t: number) => {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
};

export const M = (c: number) => new THREE.MeshLambertMaterial({ color: c });
