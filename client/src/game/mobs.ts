import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { SkeletonUtils } from 'three/examples/jsm/utils/SkeletonUtils';
import { scene } from '../world/scene';
import { blobShadow } from '../world/terrain';
import { rand, M } from '../utils';
import { state } from './state';
import type { GuestMob, Mob } from './state';

/* 몹: KayKit Skeletons(CC0) — Rig_Medium 리그라 보유한 Skeletons_* 클립이 그대로 재생된다.
 * 로딩 실패 시 기존 절차(슬라임) 비주얼로 폴백. */
const MOB_MODELS = ['Skeleton_Minion', 'Skeleton_Warrior'];
const MOB_ANIM_URL = '/models/Rig_Medium_Special.glb';
const MOB_CLIP = 'Skeletons_Walking';
const MOB_SCALE = .62; // 신장 ~2.17u → ~1.35u (플레이어 ~2.0u보다 작게)

let mobTemplate: { scenes: THREE.Object3D[]; clips: THREE.AnimationClip[] } | null = null;

export async function loadMobModel(): Promise<boolean> {
  try {
    const loader = new GLTFLoader();
    const [chrs, anim] = await Promise.all([
      Promise.all(MOB_MODELS.map(n => loader.loadAsync(`/models/${n}.glb`))),
      loader.loadAsync(MOB_ANIM_URL),
    ]);
    mobTemplate = { scenes: chrs.map(c => c.scene), clips: anim.animations };
    return true;
  } catch (e) {
    console.error('mob model load failed:', e);
    return false;
  }
}

export function makeMobVisual(): { group: THREE.Group; body?: THREE.Mesh; mixer?: THREE.AnimationMixer } {
  if (mobTemplate) {
    const src = mobTemplate.scenes[Math.floor(Math.random() * mobTemplate.scenes.length)];
    const model = SkeletonUtils.clone(src) as THREE.Object3D;
    model.scale.setScalar(MOB_SCALE);
    model.traverse(o => { if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).castShadow = true; });
    const g = new THREE.Group();
    g.add(model);
    const mixer = new THREE.AnimationMixer(model);
    const clip = mobTemplate.clips.find(c => c.name === MOB_CLIP) ?? mobTemplate.clips[0];
    if (clip) {
      const action = mixer.clipAction(clip);
      action.time = Math.random() * clip.duration; // 개체별 위상 분산
      action.play();
    }
    g.add(blobShadow(.42));
    scene.add(g);
    return { group: g, mixer };
  }
  // 폴백: 절차 슬라임
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
