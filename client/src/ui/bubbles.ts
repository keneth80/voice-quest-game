import * as THREE from 'three';
import { camera } from '../world/scene';
import { state } from '../game/state';
import { pbub, bubbleState } from './hud';

/* 3D 좌표 → 화면 투영으로 DOM 말풍선 배치 */
export function placeBubble(el: HTMLElement, t: number, obj: THREE.Object3D, yOff: number) {
  if (t <= 0) { el.style.display = 'none'; return; }
  const v = obj.position.clone(); v.y += yOff; v.project(camera);
  if (v.z > 1) { el.style.display = 'none'; return; }
  el.style.display = 'block';
  el.style.left = ((v.x * .5 + .5) * innerWidth) + 'px';
  el.style.top = ((-v.y * .5 + .5) * innerHeight - 8) + 'px';
}

/* 메인 루프 끝에서 매 프레임 호출 — 내/원격 말풍선 수명 감소 + 재배치 */
export function updateBubbles() {
  if (bubbleState.pbubT > 0) bubbleState.pbubT--;
  placeBubble(pbub, bubbleState.pbubT, state.player.group, 2.6);
  for (const r of Object.values(state.remotes)) {
    if (r.bubbleT > 0) r.bubbleT--;
    placeBubble(r.bubbleEl, r.bubbleT, r.group, 2.6);
  }
}
