import { state } from '../game/state';
import { addChat, pbub, bubbleState } from '../ui/hud';

/* 어리둥절(갸웃) 제스처 시작 — 시그니처 UX.
 * 150프레임 시퀀스(카메라 고정→뒤돌기→으쓱+갸웃→복귀)는 game/loop.ts에서 처리한다. */
export function confuse(reason: 'nohear' | 'unknown') {
  if (state.confusion > 0) return;
  state.preYaw = state.player.yaw;
  state.confusion = 150;
  pbub.textContent = reason === 'nohear' ? '뭐라고...? 🤔' : '음? 무슨 뜻인지 모르겠는데 🤔';
  pbub.className = 'bubble confused'; bubbleState.pbubT = 150;
  addChat('', '😕 캐릭터가 명령을 이해하지 못했습니다', 'sys');
  state.net?.sendHuh();
}
