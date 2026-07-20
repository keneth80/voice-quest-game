import * as THREE from 'three';
import { scene } from '../world/scene';
import { makeHero } from '../hero/makeHero';
import { makeGltfHero } from '../hero/gltfHero';
import { makeQSprite } from '../hero/sprites';
import { lerpAngle } from '../utils';
import { state } from './state';

export let qmark: THREE.Sprite;

export function initPlayer() {
  // 글TF(Mixamo 리그) 우선, 로딩 실패 시 절차 캐릭터 폴백
  state.player.visual = makeGltfHero() ?? makeHero(0x2f5fc4);
  state.player.group.add(state.player.visual.root);
  scene.add(state.player.group);
  qmark = makeQSprite(); qmark.position.y = 2.8; state.player.group.add(qmark);
}

export function moveMe() {
  const player = state.player;
  const p = player.group.position;
  const dx = player.tx - p.x, dz = player.tz - p.z, d = Math.hypot(dx, dz);
  player.walking = d > .25;
  if (player.walking) {
    const ty = Math.atan2(dx, dz);
    player.yaw = lerpAngle(player.yaw, ty, .15);
    p.x += Math.sin(player.yaw) * player.speed; p.z += Math.cos(player.yaw) * player.speed;
  }
  player.group.rotation.y = player.yaw;
}

export function moveForward(d: number) {
  const player = state.player;
  player.tx = player.group.position.x + Math.sin(player.yaw) * d;
  player.tz = player.group.position.z + Math.cos(player.yaw) * d;
}

export function moveSide(d: number) {
  // 화면(카메라) 기준 오른쪽 = yaw - 90°. 원본의 yaw + 90°는 좌우가 반대였음
  const player = state.player;
  player.tx = player.group.position.x + Math.sin(player.yaw - Math.PI / 2) * d;
  player.tz = player.group.position.z + Math.cos(player.yaw - Math.PI / 2) * d;
}
