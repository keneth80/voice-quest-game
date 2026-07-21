import * as THREE from 'three';
import { scene, camera, renderer } from '../world/scene';
import { lerpAngle } from '../utils';
import { state } from './state';
import { moveMe, qmark } from './player';
import { updateHero } from '../hero/updateHero';
import { bursts, burst, damage, allPlayerPos, atkCds } from './combat';
import { nearestMobOf } from './mobs';
import { markers } from './input';
import { updateCamera } from './camera';
import { updateBubbles } from '../ui/bubbles';
import { addChat, setHP } from '../ui/hud';

const clock = new THREE.Clock();
let time = 0;

export function startLoop() {
  loop();
}

function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), .05);
  time += dt;
  const ppos = state.player.group.position;

  /* 내 캐릭터 — 갸웃(confusion) 시퀀스는 원본 수치 그대로:
   * 150→130 으쓱 진입, >35 카메라 쪽으로 회전, ≤35 preYaw 복귀, >40 "?" 표시 */
  let shrugK = 0;
  if (state.confusion > 0) {
    state.confusion--;
    state.player.walking = false;
    if (state.confusion > 35) {
      const toCam = Math.atan2(camera.position.x - ppos.x, camera.position.z - ppos.z);
      state.player.yaw = lerpAngle(state.player.yaw, toCam, .2);
    } else {
      state.player.yaw = lerpAngle(state.player.yaw, state.preYaw, .15);
    }
    state.player.group.rotation.y = state.player.yaw;
    shrugK = state.confusion > 130 ? (150 - state.confusion) / 20 : (state.confusion < 40 ? Math.max(0, state.confusion - 15) / 25 : 1);
    qmark.visible = state.confusion > 40;
    if (state.confusion === 0) { qmark.visible = false; state.player.tx = ppos.x; state.player.tz = ppos.z; }
  } else {
    qmark.visible = false;
    moveMe();
  }
  if (state.slashT > 0) state.slashT--;
  updateHero(state.player.visual, state.player.walking, time, shrugK, state.slashT, dt);
  state.player.atkCd--;

  /* 원격 플레이어 보간 */
  for (const r of Object.values(state.remotes)) {
    const p = r.group.position;
    p.x += (r.tx - p.x) * .2; p.z += (r.tz - p.z) * .2;
    r.group.rotation.y = lerpAngle(r.group.rotation.y, r.yaw, .2);
    if (r.shrugT > 0) r.shrugT--;
    if (r.slashT > 0) r.slashT--;
    updateHero(r.visual, r.walking, time + 1.7, r.shrugT > 0 ? 1 : 0, r.slashT, dt);
  }

  /* 전투 판정 (솔로/호스트 — host-authoritative) */
  if (state.mode !== 'guest') {
    // 각 플레이어 자동 공격
    for (const pp of allPlayerPos()) {
      atkCds[pp.id] = (atkCds[pp.id] || 0) - 1;
      const m = nearestMobOf(state.mobs, new THREE.Vector3(pp.x, 0, pp.z));
      if (m && Math.hypot(m.group.position.x - pp.x, m.group.position.z - pp.z) < 1.9 && atkCds[pp.id] <= 0) {
        damage(m, 12, pp); atkCds[pp.id] = 40;
        if (pp.id === 'H') {
          state.slashT = 14;
          // 공격 대상을 향해 몸을 돌림 (갸웃 제스처 중엔 회전 유지 — 시그니처 연출 보호)
          if (state.confusion <= 0) {
            state.player.yaw = Math.atan2(m.group.position.x - pp.x, m.group.position.z - pp.z);
            state.player.group.rotation.y = state.player.yaw;
          }
        } else if (state.remotes[pp.id]) state.remotes[pp.id].slashT = 14;
      }
    }
    // 몹 AI: 가장 가까운 플레이어 추격
    for (const m of state.mobs) {
      const mp = m.group.position;
      if (m.mixer) m.mixer.update(dt);
      if (m.body) m.body.position.y = .42 + Math.abs(Math.sin(time * 4 + m.wob)) * .12; // 슬라임 폴백 바운스
      let tgt: { x: number; z: number; id: string } | null = null, td = 1e9;
      for (const pp of allPlayerPos()) { const d = Math.hypot(mp.x - pp.x, mp.z - pp.z); if (d < td) { td = d; tgt = pp; } }
      if (tgt && td < 9) {
        const dx = tgt.x - mp.x, dz = tgt.z - mp.z;
        if (td > 1.1) { mp.x += dx / td * m.speed; mp.z += dz / td * m.speed; }
        m.group.rotation.y = Math.atan2(dx, dz);
        m.atkCd--;
        if (td < 1.4 && m.atkCd <= 0 && tgt.id === 'H') {
          state.hp = Math.max(0, state.hp - 4); m.atkCd = 70;
          burst(ppos, 0xff5f6d); // 피격 시각 피드백
          setHP(state.hp);
          if (state.hp <= 0) { state.hp = 100; setHP(state.hp);
            addChat('', '💫 쓰러졌다… 내공으로 다시 일어났다!', 'sys'); }
        } else if (td < 1.4 && m.atkCd <= 0) { m.atkCd = 70; }
      } else {
        m.wob += .015;
        mp.x += Math.cos(m.wob) * .008; mp.z += Math.sin(m.wob * .7) * .008;
      }
    }
  } else {
    /* 게스트: 몹 위치 보간 + 내 체력만 로컬 판정 */
    for (const v of state.guestMobs) {
      const mp = v.group.position;
      if (v.mixer) v.mixer.update(dt);
      if (v.tx !== undefined) { mp.x += (v.tx - mp.x) * .2; mp.z += (v.tz! - mp.z) * .2; }
      v.wob = (v.wob || 0);
      const dp = Math.hypot(mp.x - ppos.x, mp.z - ppos.z);
      if (dp < 1.9 && state.player.atkCd <= 0) {
        state.slashT = 14; burst(mp, 0xffc44a); state.player.atkCd = 40;
        // 공격 대상을 향해 몸을 돌림 (갸웃 제스처 중엔 회전 유지)
        if (state.confusion <= 0) {
          state.player.yaw = Math.atan2(mp.x - ppos.x, mp.z - ppos.z);
          state.player.group.rotation.y = state.player.yaw;
        }
      }
      v.cd = (v.cd || 0) - 1;
      if (dp < 1.4 && v.cd <= 0) {
        state.hp = Math.max(0, state.hp - 4); v.cd = 70;
        burst(ppos, 0xff5f6d); // 피격 시각 피드백
        setHP(state.hp);
        if (state.hp <= 0) { state.hp = 100; setHP(state.hp);
          addChat('', '💫 쓰러졌다… 내공으로 다시 일어났다!', 'sys'); }
      }
    }
  }

  /* 이펙트 */
  for (let i = bursts.length - 1; i >= 0; i--) {
    const b = bursts[i]; b.life--;
    b.mesh.position.x += b.vx; b.mesh.position.y += b.vy; b.mesh.position.z += b.vz; b.vy -= .008;
    const mat = b.mesh.material as THREE.MeshBasicMaterial;
    mat.opacity = b.life / 28; mat.transparent = true;
    if (b.life <= 0) { scene.remove(b.mesh); bursts.splice(i, 1); }
  }
  for (let i = markers.length - 1; i >= 0; i--) {
    const mk = markers[i]; mk.life--;
    mk.mesh.scale.setScalar(1 + (30 - mk.life) * .06);
    (mk.mesh.material as THREE.MeshBasicMaterial).opacity = mk.life / 30;
    if (mk.life <= 0) { scene.remove(mk.mesh); markers.splice(i, 1); }
  }

  updateCamera();
  updateBubbles();
  renderer.render(scene, camera);
}
