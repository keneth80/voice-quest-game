import * as THREE from 'three';
import { scene } from './scene';
import { rand, M } from '../utils';

export let ground: THREE.Mesh;

export function buildTerrain() {
  ground = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), M(0x2c5e38));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  for (let i = 0; i < 120; i++) {
    const p = new THREE.Mesh(new THREE.CircleGeometry(rand(.6, 2.4), 10), M(Math.random() < .5 ? 0x275434 : 0x336b40));
    p.rotation.x = -Math.PI / 2; p.position.set(rand(-90, 90), .01, rand(-90, 90)); scene.add(p);
  }
  for (let i = 0; i < 55; i++) {
    const g = new THREE.Group();
    const h = rand(2.4, 4.6);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.14, .2, h * .45, 8), M(0x5b4023));
    trunk.position.y = h * .22; trunk.castShadow = true; g.add(trunk);
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(h * .33, h * .75, 9), M(Math.random() < .5 ? 0x2f6b3a : 0x3d8a4b));
    leaf.position.y = h * .45 + h * .36; leaf.castShadow = true; g.add(leaf);
    let x, z; do { x = rand(-90, 90); z = rand(-90, 90); } while (Math.hypot(x, z) < 8);
    g.position.set(x, 0, z); scene.add(g);
  }
  for (let i = 0; i < 26; i++) {
    const g = new THREE.Group();
    const h = rand(3.5, 5.5);
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(.06, .08, h, 6), M(0x6fa84e));
    stalk.position.y = h / 2; stalk.castShadow = true; g.add(stalk);
    for (let k = 0; k < 3; k++) {
      const lf = new THREE.Mesh(new THREE.ConeGeometry(.16, .7, 5), M(0x8fc45e));
      lf.position.set(rand(-.2, .2), h * rand(.6, .95), rand(-.2, .2));
      lf.rotation.z = rand(-1, 1); g.add(lf);
    }
    let x, z; do { x = rand(-80, 80); z = rand(-80, 80); } while (Math.hypot(x, z) < 7);
    g.position.set(x, 0, z); scene.add(g);
  }
}

export function blobShadow(r: number) {
  const m = new THREE.Mesh(new THREE.CircleGeometry(r, 16),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .22 }));
  m.rotation.x = -Math.PI / 2; m.position.y = .02; return m;
}
