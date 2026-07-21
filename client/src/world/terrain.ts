import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { scene } from './scene';
import { rand, M } from '../utils';

export let ground: THREE.Mesh;

/* 배경 소품: Quaternius Ultimate Stylized Nature (CC0).
 * 로딩 실패 시 기존 절차(원뿔 나무/대나무)로 폴백. */
const NATURE = {
  // [이름, 바닥 오프셋(모델 최저점 보정), 최소스케일, 최대스케일]
  trees: [
    ['BirchTree_1', .02, .8, 1.2],
    ['BirchTree_2', .02, .8, 1.2],
    ['BirchTree_3', .01, .7, 1.1],
  ],
  shrubs: [
    ['Bush', .64, .9, 1.5],
    ['Bush_Large', .78, .9, 1.4],
    ['Bush_Flowers', .64, .9, 1.5],
    ['Flower_1_Clump', .0, .9, 1.3],
  ],
} as const;

type NatureEntry = readonly [string, number, number, number];
let natureTemplate: { trees: THREE.Object3D[]; shrubs: THREE.Object3D[] } | null = null;

export async function loadNatureAssets(): Promise<boolean> {
  try {
    const loader = new GLTFLoader();
    const load = (e: NatureEntry) => loader.loadAsync(`/models/nature/${e[0]}.gltf`).then(g => g.scene);
    const [trees, shrubs] = await Promise.all([
      Promise.all(NATURE.trees.map(load)),
      Promise.all(NATURE.shrubs.map(load)),
    ]);
    natureTemplate = { trees, shrubs };
    return true;
  } catch (e) {
    console.error('nature assets load failed:', e);
    return false;
  }
}

function scatter(templates: THREE.Object3D[], entries: readonly NatureEntry[], count: number, range: number, clear: number) {
  for (let i = 0; i < count; i++) {
    const k = Math.floor(Math.random() * templates.length);
    const inst = templates[k].clone(true);
    const [, yOff, sMin, sMax] = entries[k];
    const s = rand(sMin, sMax);
    inst.scale.setScalar(s);
    inst.rotation.y = rand(0, Math.PI * 2);
    inst.traverse(o => { if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).castShadow = true; });
    let x, z;
    do { x = rand(-range, range); z = rand(-range, range); } while (Math.hypot(x, z) < clear);
    inst.position.set(x, yOff * s, z);
    scene.add(inst);
  }
}

export function buildTerrain() {
  ground = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), M(0x2c5e38));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  for (let i = 0; i < 120; i++) {
    const p = new THREE.Mesh(new THREE.CircleGeometry(rand(.6, 2.4), 10), M(Math.random() < .5 ? 0x275434 : 0x336b40));
    p.rotation.x = -Math.PI / 2; p.position.set(rand(-90, 90), .01, rand(-90, 90)); scene.add(p);
  }
  if (natureTemplate) {
    scatter(natureTemplate.trees, NATURE.trees, 48, 90, 8);
    scatter(natureTemplate.shrubs, NATURE.shrubs, 40, 80, 6);
    return;
  }
  // 폴백: 절차 나무/대나무
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
