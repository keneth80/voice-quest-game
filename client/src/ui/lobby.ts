import { state } from '../game/state';
import { spawnMob } from '../game/mobs';
import { nameSprite } from '../hero/sprites';
import { setMyNameLabel } from './hud';

const lobby = document.getElementById('lobby')!;

export function isLobbyOpen() {
  return lobby.style.display !== 'none';
}

export function setLobbyMsg(s: string) {
  document.getElementById('lobbymsg')!.innerHTML = s;
}

export function showRoomCode(code: string) {
  const el = document.getElementById('roomcode')!;
  el.style.display = 'block';
  el.textContent = code;
}

function grabName() {
  const v = (document.getElementById('nameinput') as HTMLInputElement).value.trim();
  state.myName = v || '무명객';
  setMyNameLabel(state.myName);
}

export function closeLobby() {
  lobby.style.display = 'none';
  if (state.mode === 'solo' || state.mode === 'host') {
    for (let i = 0; i < 6; i++) spawnMob();
    setInterval(() => { if ((state.mode === 'solo' || state.mode === 'host') && state.mobs.length < 8) spawnMob(); }, 4000);
  }
  const myTag = nameSprite(state.myName, '#8fd4ff'); myTag.position.y = 2.75; state.player.group.add(myTag);
}

/* 네트워크 시작 함수는 main.ts(조립 지점)에서 주입 — 로비는 transport 구현체를 모른다 */
export function initLobby(handlers: { startHost(): void; startGuest(code: string): void }) {
  document.getElementById('mkroom')!.onclick = () => {
    grabName();
    handlers.startHost();
  };
  document.getElementById('joinroom')!.onclick = () => {
    grabName();
    const code = (document.getElementById('codeinput') as HTMLInputElement).value.trim();
    if (code.length !== 4) { setLobbyMsg('4자리 코드를 입력해주세요'); return; }
    handlers.startGuest(code);
  };
  document.getElementById('solobtn')!.onclick = () => { grabName(); closeLobby(); };
}
