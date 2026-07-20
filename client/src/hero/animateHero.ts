import type { HeroVisual } from './makeHero';

/* 공용 애니메이터 */
export function animateHero(v: HeroVisual, walking: boolean, time: number, shrugK: number, slashT: number) {
  v.ribbons.forEach((r, i) => { r.rotation.x = .35 + Math.sin(time * 2.2 + i * 1.7) * .22 + (walking ? .25 : 0); });
  // 검격 중에만 발도: 등검 숨김 + 손검 표시 (으쓱 중엔 항상 납도)
  const drawn = slashT > 0 && shrugK <= 0;
  v.swordHand.visible = drawn;
  v.swordBack.visible = !drawn;
  if (shrugK > 0) {
    v.armL.rotation.z = 2.3 * shrugK; v.armR.rotation.z = -2.3 * shrugK;
    v.armL.rotation.x = v.armR.rotation.x = 0;
    v.legL.rotation.x = v.legR.rotation.x = 0;
    v.head.rotation.z = Math.sin(time * 3) * .2 * shrugK;
    return;
  }
  v.head.rotation.z *= .9;
  v.armL.rotation.z *= .8; v.armR.rotation.z *= .8;
  if (slashT > 0) v.armR.rotation.x = -2.2 + (14 - slashT) * .16;
  if (walking) {
    const s = Math.sin(time * 9.5);
    v.armL.rotation.x = s * .6; if (!(slashT > 0)) v.armR.rotation.x = -s * .6;
    v.legL.rotation.x = -s * .7; v.legR.rotation.x = s * .7;
    v.skirt.rotation.x = Math.abs(s) * .05;
    v.root.position.y = Math.abs(Math.sin(time * 9.5)) * .05;
  } else {
    v.armL.rotation.x *= .85; if (!(slashT > 0)) v.armR.rotation.x *= .85;
    v.legL.rotation.x *= .85; v.legR.rotation.x *= .85;
    v.skirt.rotation.x *= .85;
    v.root.position.y = Math.sin(time * 1.8) * .02;
  }
}
