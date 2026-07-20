import * as THREE from 'three';
import { scene } from '../world/scene';
import { blobShadow } from '../world/terrain';
import { rand, M } from '../utils';
import { state } from './state';
import type { GuestMob, Mob } from './state';

export function makeMobVisual() {
  const g = new THREE.Group();
  const hue = rand(.25, .4);
  const body = new THREE.Mesh(new THREE.SphereGeometry(.45, 14, 12),
    new THREE.MeshLambertMaterial({ color: new THREE.Color().setHSL(hue, .55, .45) }));
  body.scale.y = .85; body.position.y = .42; body.castShadow = true; g.add(body);
  for (const sx of [-.16, .16]) {
    const w = new THREE.Mesh(new THREE.SphereGeometry(.1, 8, 8), M(0xffffff)); w.position.set(sx, .52, .38); g.add(w);
    const b = new THREE.Mesh(new THREE.SphereGeometry(.05, 8, 8), M(0x111111)); b.position.set(sx, .52, .46); g.add(b);
  }
  g.add(blobShadow(.42));
  scene.add(g);
  return { group: g, body };
}

export function spawnMob() {
  const v = makeMobVisual();
  const ang = rand(0, Math.PI * 2), d = rand(10, 20);
  const px = state.player.group.position;
  v.group.position.set(px.x + Math.cos(ang) * d, 0, px.z + Math.sin(ang) * d);
  state.mobs.push({ ...v, hp: 40, speed: .032, atkCd: 0, wob: rand(0, 9) });
}

export function activeMobs(): (Mob | GuestMob)[] {
  return state.mode === 'guest' ? state.guestMobs : state.mobs;
}

export function nearestMobOf<T extends { group: THREE.Group }>(list: T[], pos: THREE.Vector3): T | null {
  let best: T | null = null, bd = 1e9;
  for (const m of list) { const d = m.group.position.distanceTo(pos); if (d < bd) { bd = d; best = m; } }
  return best;
}
