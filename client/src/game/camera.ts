import * as THREE from 'three';
import { camera, sun } from '../world/scene';
import { lerpAngle } from '../utils';
import { state } from './state';

let camYaw = 0;

/* 오버숄더 카메라. confusion(갸웃 제스처) 중에는 camYaw 갱신을 중단해
 * 캐릭터만 뒤돌아 "화면 밖의 나를 본다"는 연출을 만든다 — 절대 제거 금지. */
export function updateCamera() {
  const p = state.player.group.position;
  if (state.confusion <= 0) camYaw = lerpAngle(camYaw, state.player.yaw, .05);
  const dist = 4.8, h = 2.8;
  camera.position.lerp(new THREE.Vector3(p.x - Math.sin(camYaw) * dist, h, p.z - Math.cos(camYaw) * dist), .12);
  camera.lookAt(new THREE.Vector3(p.x + Math.sin(camYaw) * 2.2, 1.5, p.z + Math.cos(camYaw) * 2.2));
  sun.position.set(p.x + 12, 20, p.z + 8);
  sun.target.position.set(p.x, 0, p.z);
}
