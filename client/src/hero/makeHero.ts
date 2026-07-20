import * as THREE from 'three';
import { rand, M } from '../utils';
import { blobShadow } from '../world/terrain';

export interface HeroVisual {
  root: THREE.Group;
  head: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
  skirt: THREE.Mesh;
  ribbons: THREE.Group[];
  swordBack: THREE.Group;
  swordHand: THREE.Group;
}

/* 무협 캐릭터 (인체 개선판) */
export function makeHero(robeColor?: number): HeroVisual {
  const SKIN = 0xf5cfa4, ROBE = robeColor || 0x2f5fc4, TRIM = 0xe9edf7, SASH = 0x1c2340,
        PANTS = 0x27304f, HAIR = 0x171a22, BAND = 0xd42a2a;
  const g = new THREE.Group();

  /* 다리: 더 길고 곧게 */
  function leg(x: number) {
    const pivot = new THREE.Group(); pivot.position.set(x, .72, 0);
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(.1, .11, .42, 8), M(PANTS));
    thigh.position.y = -.2; thigh.castShadow = true; pivot.add(thigh);
    const calf = new THREE.Mesh(new THREE.CylinderGeometry(.085, .07, .34, 8), M(PANTS));
    calf.position.y = -.55; pivot.add(calf);
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(.095, 8, 8), M(0x14161c));
    shoe.position.set(0, -.72, .05); shoe.scale.set(.9, .5, 1.5); pivot.add(shoe);
    g.add(pivot); return pivot;
  }
  // 팔과 같은 이유로 좌우 반전 (팔·다리를 함께 바꿔야 좌우 교차 보행 위상이 유지됨)
  const legL = leg(.15), legR = leg(-.15);

  /* 도포 자락 */
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(.34, .5, .6, 12, 1, true), M(ROBE));
  skirt.position.y = .9; skirt.castShadow = true; g.add(skirt);
  const skirtTrim = new THREE.Mesh(new THREE.CylinderGeometry(.495, .515, .08, 12, 1, true), M(TRIM));
  skirtTrim.position.y = .64; g.add(skirtTrim);

  /* 상체: 어깨가 넓고 허리가 좁은 실루엣 */
  const waist = new THREE.Mesh(new THREE.CylinderGeometry(.24, .3, .35, 12), M(ROBE));
  waist.position.y = 1.32; g.add(waist);
  const chest = new THREE.Mesh(new THREE.CylinderGeometry(.32, .24, .55, 12), M(ROBE));
  chest.position.y = 1.75; chest.castShadow = true; g.add(chest);
  // 어깨
  for (const sx of [-.32, .32]) {
    const sh = new THREE.Mesh(new THREE.SphereGeometry(.13, 10, 10), M(ROBE));
    sh.position.set(sx, 1.98, 0); g.add(sh);
  }
  // 앞섶 흰 깃 (V자)
  const collarL = new THREE.Mesh(new THREE.BoxGeometry(.08, .46, .03), M(TRIM));
  collarL.position.set(-.09, 1.85, .26); collarL.rotation.z = .32; g.add(collarL);
  const collarR = collarL.clone(); collarR.position.x = .09; collarR.rotation.z = -.32; g.add(collarR);
  /* 허리띠 */
  const sash = new THREE.Mesh(new THREE.CylinderGeometry(.305, .32, .13, 12), M(SASH));
  sash.position.y = 1.18; g.add(sash);
  const knot = new THREE.Mesh(new THREE.SphereGeometry(.08, 8, 8), M(SASH));
  knot.position.set(.22, 1.18, .24); g.add(knot);

  /* 팔: 어깨→소매→손목→손 */
  function arm(x: number) {
    const pivot = new THREE.Group(); pivot.position.set(x, 1.96, 0);
    const upper = new THREE.Mesh(new THREE.CylinderGeometry(.085, .1, .36, 8), M(ROBE));
    upper.position.y = -.18; upper.castShadow = true; pivot.add(upper);
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(.1, .15, .34, 8), M(ROBE));
    sleeve.position.y = -.5; pivot.add(sleeve);
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(.15, .155, .06, 8), M(TRIM));
    cuff.position.y = -.67; pivot.add(cuff);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(.075, 8, 8), M(SKIN));
    hand.position.y = -.76; hand.scale.set(.85, 1.15, .6); pivot.add(hand);
    g.add(pivot); return pivot;
  }
  // 모델 정면이 +z이므로 해부학상 오른팔은 로컬 -x (원본의 +x 배치는 좌우가 반대였음)
  const armL = arm(.36), armR = arm(-.36);

  /* 목 */
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(.09, .11, .14, 8), M(SKIN));
  neck.position.y = 2.08; g.add(neck);

  /* 머리: 갸름한 얼굴 + 코 + 입 + 귀 */
  const head = new THREE.Group(); head.position.y = 2.36; g.add(head);
  const face = new THREE.Mesh(new THREE.SphereGeometry(.26, 18, 14), M(SKIN));
  face.scale.set(.92, 1.08, .95); face.castShadow = true; head.add(face);
  // 눈
  for (const sx of [-.1, .1]) {
    const white = new THREE.Mesh(new THREE.SphereGeometry(.05, 8, 8), M(0xffffff));
    white.position.set(sx, .02, .22); white.scale.set(1, 1.25, .45); head.add(white);
    const iris = new THREE.Mesh(new THREE.SphereGeometry(.026, 8, 8), M(0x1a1a1a));
    iris.position.set(sx, .02, .245); head.add(iris);
  }
  // 눈썹
  for (const sx of [-.1, .1]) {
    const brow = new THREE.Mesh(new THREE.BoxGeometry(.1, .022, .02), M(HAIR));
    brow.position.set(sx, .11, .235); brow.rotation.z = sx < 0 ? -.18 : .18; head.add(brow);
  }
  // 코
  const nose = new THREE.Mesh(new THREE.ConeGeometry(.03, .09, 6), M(0xeec090));
  nose.position.set(0, -.045, .26); nose.rotation.x = Math.PI / 2.2; head.add(nose);
  // 입
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(.09, .018, .015), M(0xb35b4a));
  mouth.position.set(0, -.13, .23); head.add(mouth);
  // 귀
  for (const sx of [-.24, .24]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(.05, 8, 8), M(SKIN));
    ear.position.set(sx, -.01, .02); ear.scale.set(.5, 1, .7); head.add(ear);
  }
  // 뒷머리
  const hairBack = new THREE.Mesh(new THREE.SphereGeometry(.275, 16, 12), M(HAIR));
  hairBack.position.set(0, .06, -.06); hairBack.scale.set(.98, 1, .92); head.add(hairBack);
  // 뻗친 머리
  for (let i = 0; i < 9; i++) {
    const s = new THREE.Mesh(new THREE.ConeGeometry(.075, rand(.24, .36), 6), M(HAIR));
    const a = (i / 9) * Math.PI * 2;
    s.position.set(Math.cos(a) * .14, .26, Math.sin(a) * .12 - .03);
    s.rotation.x = Math.sin(a) * .5 - .15; s.rotation.z = -Math.cos(a) * .5;
    head.add(s);
  }
  const topSpike = new THREE.Mesh(new THREE.ConeGeometry(.09, .38, 6), M(HAIR));
  topSpike.position.set(0, .32, 0); head.add(topSpike);
  // 붉은 두건
  const band = new THREE.Mesh(new THREE.CylinderGeometry(.27, .27, .09, 16, 1, true), M(BAND));
  band.position.y = .1; head.add(band);
  const ribbons: THREE.Group[] = [];
  for (const sx of [-.06, .06]) {
    const pivot = new THREE.Group(); pivot.position.set(sx, .08, -.26); head.add(pivot);
    const rb = new THREE.Mesh(new THREE.BoxGeometry(.055, .5, .02), M(BAND));
    rb.position.y = -.25; pivot.add(rb);
    ribbons.push(pivot);
  }
  /* 등의 검 (납도 상태) */
  const swordBack = new THREE.Group();
  const scab = new THREE.Mesh(new THREE.BoxGeometry(.06, 1.1, .04), M(0x20263c));
  scab.position.y = -.1; swordBack.add(scab);
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .26, 8), M(0x7a2020));
  grip.position.y = .56; swordBack.add(grip);
  const guard = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, .028, 10), M(0xc9a227));
  guard.position.y = .42; swordBack.add(guard);
  swordBack.position.set(.1, 1.75, -.3); swordBack.rotation.z = .5; swordBack.rotation.x = .08; g.add(swordBack);

  /* 손의 검 (발도 상태) — 오른팔 피벗에 붙여 검격 중에만 표시 */
  const swordHand = new THREE.Group();
  const hGrip = new THREE.Mesh(new THREE.CylinderGeometry(.028, .028, .22, 8), M(0x7a2020));
  hGrip.position.y = -.7; swordHand.add(hGrip);
  const hGuard = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, .025, 10), M(0xc9a227));
  hGuard.position.y = -.8; swordHand.add(hGuard);
  const hBlade = new THREE.Mesh(new THREE.BoxGeometry(.05, .82, .015), M(0xdfe6f0));
  hBlade.position.y = -1.23; swordHand.add(hBlade);
  const hTip = new THREE.Mesh(new THREE.ConeGeometry(.032, .12, 4), M(0xdfe6f0));
  hTip.position.y = -1.7; hTip.rotation.x = Math.PI; swordHand.add(hTip);
  swordHand.visible = false;
  armR.add(swordHand);

  g.add(blobShadow(.48));
  g.scale.setScalar(.88);
  return { root: g, head, armL, armR, legL, legR, skirt, ribbons, swordBack, swordHand };
}
