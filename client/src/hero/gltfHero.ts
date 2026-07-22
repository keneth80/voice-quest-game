import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { SkeletonUtils } from 'three/examples/jsm/utils/SkeletonUtils';
import { blobShadow } from '../world/terrain';

/* KayKit Adventurers 캐릭터 (CC0, Kay Lousberg — www.kaylousberg.com).
 * 캐릭터 glb에는 클립이 없고, 같은 Rig_Medium 골격을 쓰는 애니메이션 glb에서
 * 클립을 가져와 이름 기반(PropertyBinding)으로 재생한다.
 * 캐릭터/클립/무기 교체는 아래 상수만 바꾸면 된다. */
export const CHARACTERS = ['Knight', 'Barbarian', 'Rogue', 'Rogue_Hooded', 'Mage', 'Ranger'];
const MY_CHARACTER = 'Knight'; // 내 캐릭터 (원본도 로컬은 고정 청색 도포였던 것과 동일한 정책)
const ANIM_URLS = [
  '/models/Rig_Medium_MovementBasic.glb',
  '/models/Rig_Medium_General.glb',
  '/models/Rig_Medium_CombatMelee.glb',
];
const SWORD_URL = '/models/sword_1handed.gltf';
const CLIP = { idle: 'Idle_A', move: 'Running_A', slash: 'Melee_1H_Attack_Slice_Diagonal' };
const SCALE = .8;       // Rig_Medium 신장 ~2.54u → ~2.0u. 치비 비율(큰 머리)이라 기존(2.3u)보다 약간 작게
const FACE_Y = 0; // KayKit은 정면이 이미 +z(전진 방향) — 회전 불필요 (Soldier는 π 필요했음)

interface Bones {
  lArm?: THREE.Object3D;
  rArm?: THREE.Object3D;
  head?: THREE.Object3D;
  spine?: THREE.Object3D;
}

export interface GltfHeroVisual {
  type: 'gltf';
  root: THREE.Group;
  mixer: THREE.AnimationMixer;
  actions: Record<string, THREE.AnimationAction>;
  current: string;
  attacking: boolean;
  bones: Bones;
  sword: THREE.Object3D | null;
}

let template: { scenes: Record<string, THREE.Object3D>; clips: THREE.AnimationClip[]; sword: THREE.Object3D | null } | null = null;

export async function loadHeroModel(): Promise<boolean> {
  try {
    const loader = new GLTFLoader();
    const [chrs, anims] = await Promise.all([
      Promise.all(CHARACTERS.map(n => loader.loadAsync(`/models/${n}.glb`))),
      Promise.all(ANIM_URLS.map(u => loader.loadAsync(u))),
    ]);
    let sword: THREE.Object3D | null = null;
    try { sword = (await loader.loadAsync(SWORD_URL)).scene; } catch (_) { /* 검 로딩 실패해도 캐릭터는 진행 */ }
    const scenes: Record<string, THREE.Object3D> = {};
    CHARACTERS.forEach((n, i) => { scenes[n] = chrs[i].scene; });
    template = {
      scenes,
      clips: anims.flatMap(a => a.animations),
      sword,
    };
    return true;
  } catch (e) {
    console.error('hero model load failed:', e);
    return false;
  }
}

/* 원격 플레이어 캐릭터 배정 — peer id 해시로 6종 중 하나 (모든 클라이언트에서 동일 결과) */
export function pickCharacter(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return CHARACTERS[h % CHARACTERS.length];
}

/* 로드된 템플릿에서 인스턴스 생성.
 * character: 6종 중 하나(기본 Knight). tint는 폴백/특수용 — 캐릭터가 다양해져 기본 미사용 */
export function makeGltfHero(tint?: number, character: string = MY_CHARACTER): GltfHeroVisual | null {
  if (!template) return null;
  const scene = template.scenes[character] ?? template.scenes[MY_CHARACTER];
  const model = SkeletonUtils.clone(scene) as THREE.Object3D;
  const root = new THREE.Group();
  model.rotation.y = FACE_Y;
  model.scale.setScalar(SCALE);
  root.add(model);
  model.traverse(o => {
    const mesh = o as THREE.Mesh;
    if (mesh.isMesh) {
      mesh.castShadow = true;
      mesh.material = (mesh.material as THREE.Material).clone();
      if (tint) (mesh.material as THREE.MeshStandardMaterial).color = new THREE.Color(tint);
    }
  });
  // 으쓱(갸웃) 오버레이용 본 — GLTFLoader가 이름의 '.'을 제거하므로 'upperarm.l' → 'upperarml'
  const bones: Bones = {};
  model.traverse(o => {
    if (o.name === 'upperarml') bones.lArm = o;
    else if (o.name === 'upperarmr') bones.rArm = o;
    else if (o.name === 'head') bones.head = o;
    else if (o.name === 'spine') bones.spine = o;
  });
  // 오른손 슬롯에 검 부착 (검격 중에만 표시 — 발도 연출)
  let sword: THREE.Object3D | null = null;
  const slot = model.getObjectByName('handslotr');
  if (slot && template.sword) {
    sword = template.sword.clone(true);
    sword.visible = false;
    slot.add(sword);
  }
  const mixer = new THREE.AnimationMixer(model);
  const actions: Record<string, THREE.AnimationAction> = {};
  for (const c of template.clips) actions[c.name] = mixer.clipAction(c);
  const startName = actions[CLIP.idle] ? CLIP.idle : Object.keys(actions)[0];
  if (actions[startName]) actions[startName].play();
  root.add(blobShadow(.48));
  return { type: 'gltf', root, mixer, actions, current: startName, attacking: false, bones, sword };
}

/* 매 프레임 갱신 — 절차 캐릭터의 animateHero와 동일한 의미의 인자 */
export function updateGltfHero(v: GltfHeroVisual, walking: boolean, time: number, shrugK: number, slashT: number, dt: number) {
  const atk = v.actions[CLIP.slash];
  // 검격 시작 시 원샷 재생 + 발도 (루프가 slashT-- 후 호출하므로 >0으로 판정,
  // 클립(~1초)이 slashT 창(14프레임)보다 길어 attacking 플래그가 재트리거를 막는다)
  if (slashT > 0 && !v.attacking && atk) {
    atk.setLoop(THREE.LoopOnce, 1);
    if (v.actions[v.current]) v.actions[v.current].fadeOut(.08);
    atk.reset().fadeIn(.08).play();
    v.attacking = true;
    if (v.sword) v.sword.visible = true;
  }
  // 원샷 종료 → 납도 후 기존 상태로 복귀
  if (v.attacking && atk && !atk.isRunning()) {
    v.attacking = false;
    if (v.sword) v.sword.visible = false;
    if (v.actions[v.current]) v.actions[v.current].reset().fadeIn(.15).play();
  }
  if (!v.attacking) {
    const want = walking ? (v.actions[CLIP.move] ? CLIP.move : CLIP.idle) : CLIP.idle;
    if (v.actions[want] && v.current !== want) {
      if (v.actions[v.current]) v.actions[v.current].fadeOut(.25);
      v.actions[want].reset().fadeIn(.25).play();
      v.current = want;
    }
  }
  v.mixer.update(dt);
  /* 으쓱: 모캡 위에 본 회전 덮어쓰기 */
  if (shrugK > 0) {
    const b = v.bones;
    if (b.lArm) b.lArm.rotation.z += 1.15 * shrugK;
    if (b.rArm) b.rArm.rotation.z -= 1.15 * shrugK;
    if (b.head) b.head.rotation.z += Math.sin(time * 3) * .28 * shrugK;
    if (b.spine) b.spine.rotation.x -= .08 * shrugK;
  }
}
