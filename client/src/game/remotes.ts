import * as THREE from 'three';
import { scene } from '../world/scene';
import { makeHero } from '../hero/makeHero';
import { makeGltfHero, pickCharacter } from '../hero/gltfHero';
import { nameSprite } from '../hero/sprites';
import { state } from './state';
import type { Remote } from './state';
import { makeMobVisual } from './mobs';
import { addChat, setKills, setPCount } from '../ui/hud';
import { softenChat } from '../voice/soften';
import type { Snapshot } from '../net/transport';

function colorFromId(id: string) {
  let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return new THREE.Color().setHSL((h % 360) / 360, .55, .42).getHex();
}

export function ensureRemote(id: string, name?: string): Remote {
  if (state.remotes[id]) return state.remotes[id];
  const group = new THREE.Group();
  // 캐릭터 6종을 id 해시로 배정 (모든 클라이언트에서 동일하게 보임) — 틴트 대신 캐릭터로 구분
  const visual = makeGltfHero(undefined, pickCharacter(id)) ?? makeHero(colorFromId(id));
  group.add(visual.root);
  const tag = nameSprite(name || '???', '#ffd47f'); tag.position.y = 2.75; group.add(tag);
  scene.add(group);
  const bubbleEl = document.createElement('div'); bubbleEl.className = 'bubble';
  document.body.appendChild(bubbleEl);
  state.remotes[id] = { group, visual, tag, bubbleEl, bubbleT: 0, tx: 0, tz: 0, yaw: 0, walking: false, shrugT: 0, slashT: 0 };
  updatePCount();
  return state.remotes[id];
}

export function removeRemote(id: string) {
  const r = state.remotes[id]; if (!r) return;
  scene.remove(r.group); r.bubbleEl.remove(); delete state.remotes[id];
  updatePCount();
}

function updatePCount() {
  setPCount(1 + Object.keys(state.remotes).length);
}

export function showRemoteChat(id: string, name: string, text: string) {
  const r = ensureRemote(id, name);
  // 순화 미적용 클라이언트(원본 HTML 등)가 보낸 원문 방어 — 이중 적용은 무해 (docs/02 §2.1)
  const safe = softenChat(text);
  addChat(name, safe, 'other');
  r.bubbleEl.textContent = safe; r.bubbleEl.className = 'bubble'; r.bubbleT = 240;
}

export function showRemoteHuh(id: string) {
  const r = state.remotes[id]; if (!r) return;
  r.shrugT = 90;
  r.bubbleEl.textContent = '뭐라고...? 🤔'; r.bubbleEl.className = 'bubble confused'; r.bubbleT = 90;
}

/* 게스트: 호스트 스냅샷 반영 (원격 플레이어 + 몹 + 처치수) */
export function applySnapshot(d: Snapshot) {
  const seen: Record<string, 1> = {};
  for (const q of d.ps) {
    seen[q.id] = 1;
    const r = ensureRemote(q.id, q.n);
    r.tx = q.x; r.tz = q.z; r.yaw = q.yaw; r.walking = !!q.w;
    if (r.tag && q.n && r.lastName !== q.n) { r.lastName = q.n; }
  }
  for (const id of Object.keys(state.remotes)) if (!seen[id]) removeRemote(id);
  // 몹 동기화
  while (state.guestMobs.length < d.mobs.length) state.guestMobs.push(makeMobVisual());
  while (state.guestMobs.length > d.mobs.length) { const v = state.guestMobs.pop()!; scene.remove(v.group); }
  state.guestMobs.forEach((v, i) => { v.tx = d.mobs[i][0]; v.tz = d.mobs[i][1]; });
  state.kills = d.k; setKills(state.kills);
}
