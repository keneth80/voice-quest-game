import * as THREE from 'three';
import { scene } from '../world/scene';
import { rand } from '../utils';
import { state } from './state';
import type { Mob } from './state';
import { activeMobs, nearestMobOf } from './mobs';
import { addChat, setKills } from '../ui/hud';

export interface Burst {
  mesh: THREE.Mesh;
  vx: number; vy: number; vz: number;
  life: number;
}

export const bursts: Burst[] = [];

export function burst(pos: THREE.Vector3, color: number) {
  for (let i = 0; i < 10; i++) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(rand(.04, .09), 6, 6),
      new THREE.MeshBasicMaterial({ color }));
    p.position.copy(pos); p.position.y += .5;
    scene.add(p);
    bursts.push({ mesh: p, vx: rand(-.08, .08), vy: rand(.05, .16), vz: rand(-.08, .08), life: 28 });
  }
}

export function damage(m: Mob, amt: number, from?: { x: number; z: number }) {
  m.hp -= amt;
  burst(m.group.position, 0xffc44a);
  if (m.body) { m.body.scale.set(1.25, .6, 1.25); setTimeout(() => m.body && m.body.scale.set(1, .85, 1), 120); } // 슬라임 폴백 스쿼시
  // 피격 넉백: 공격자 반대 방향으로 밀려남 (게스트에겐 10Hz 스냅샷으로 전파)
  if (from) {
    const mp = m.group.position;
    const dx = mp.x - from.x, dz = mp.z - from.z, d = Math.hypot(dx, dz) || 1;
    mp.x += dx / d * .5; mp.z += dz / d * .5;
  }
  if (m.hp <= 0) {
    burst(m.group.position, 0x8aff9a); burst(m.group.position, 0xffffff);
    scene.remove(m.group); state.mobs = state.mobs.filter(z => z !== m);
    state.kills++; setKills(state.kills);
  }
}

/* 모든 플레이어 위치 (호스트가 몹 AI/전투 판정에 사용) */
export function allPlayerPos() {
  const arr = [{ x: state.player.group.position.x, z: state.player.group.position.z, id: 'H' }];
  for (const [id, r] of Object.entries(state.remotes))
    arr.push({ x: r.group.position.x, z: r.group.position.z, id });
  return arr;
}

export const atkCds: Record<string, number> = {};

export function commandAttack() {
  const m = nearestMobOf(activeMobs(), state.player.group.position);
  if (!m) { addChat('', '주변에 몹이 없습니다.', 'sys'); return; }
  state.player.tx = m.group.position.x; state.player.tz = m.group.position.z;
}
