import { state } from '../game/state';
import { sayMe } from '../ui/hud';
import { moveForward, moveSide } from '../game/player';
import { commandAttack } from '../game/combat';
import { confuse } from './confusion';
import { softenChat } from './soften';

const COMMANDISH = /(해줘|해봐|해라|하라|하자|가자|해|줘|봐|라|자|춰|쳐|어라|아라)\s*[.!?]*$/;

function netSendChat(text: string) {
  state.net?.sendChat(text);
}

/* 음성 분류 단일 진입점 — 명령/채팅/갸웃 판정 (docs/02 §2) */
export function handleUtterance(text: string, conf?: number) {
  // 욕설 순화를 분류보다 먼저 — "닥쳐"가 공격 명령("쳐")으로 오분류되는 것 방지 (docs/02 §2.1)
  const t = softenChat(text.trim()); if (!t) return;
  if (conf !== undefined && conf > 0 && conf < 0.5) { confuse('nohear'); return; }
  if (t.replace(/[\s.!?~]/g, '').length <= 1) { confuse('nohear'); return; }
  const has = (...ws: string[]) => ws.some(w => t.includes(w));
  if (has('공격', '싸워', '잡아', '쳐', '때려', '베어')) { sayMe(t); netSendChat(t); commandAttack(); return; }
  if (has('멈춰', '정지', '스탑', '그만')) { const p = state.player.group.position; state.player.tx = p.x; state.player.tz = p.z; sayMe(t); netSendChat(t); return; }
  if (has('앞으로', '전진')) { sayMe(t); netSendChat(t); moveForward(6); return; }
  if (has('뒤로', '후진')) { sayMe(t); netSendChat(t); moveForward(-6); return; }
  if (has('왼쪽')) { sayMe(t); netSendChat(t); moveSide(-6); return; }
  if (has('오른쪽')) { sayMe(t); netSendChat(t); moveSide(6); return; }
  if (COMMANDISH.test(t) && t.length <= 14) { confuse('unknown'); return; }
  sayMe(t); netSendChat(t); // 일반 대화 → 모두에게 전송
}
