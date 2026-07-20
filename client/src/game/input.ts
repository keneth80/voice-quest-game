import * as THREE from 'three';
import { scene, camera, renderer } from '../world/scene';
import { ground } from '../world/terrain';
import { state } from './state';
import { isLobbyOpen } from '../ui/lobby';

export interface Marker { mesh: THREE.Mesh; life: number }
export const markers: Marker[] = [];

/* 터치/클릭 이동: 땅 레이캐스트 → 목표점 + 목적지 링 이펙트 */
export function initInput() {
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  renderer.domElement.addEventListener('pointerdown', e => {
    if (isLobbyOpen()) return;
    ptr.x = (e.clientX / innerWidth) * 2 - 1; ptr.y = -(e.clientY / innerHeight) * 2 + 1;
    ray.setFromCamera(ptr, camera);
    const hit = ray.intersectObject(ground)[0];
    if (hit) {
      state.player.tx = hit.point.x; state.player.tz = hit.point.z;
      const ring = new THREE.Mesh(new THREE.RingGeometry(.25, .4, 24),
        new THREE.MeshBasicMaterial({ color: 0x82b4ff, transparent: true, opacity: .9, side: THREE.DoubleSide }));
      ring.rotation.x = -Math.PI / 2; ring.position.set(hit.point.x, .03, hit.point.z);
      scene.add(ring); markers.push({ mesh: ring, life: 30 });
    }
  });
}
