import { mountRenderer } from './world/scene';
import { buildTerrain } from './world/terrain';
import { initPlayer } from './game/player';
import { initInput } from './game/input';
import { initVoice } from './voice/recognition';
import { confuse } from './voice/confusion';
import { handleUtterance } from './voice/classifier';
import { softenChat } from './voice/soften';
import { commandAttack } from './game/combat';
import { state } from './game/state';
import { addChat } from './ui/hud';
import { initLobby, setLobbyMsg, showRoomCode, closeLobby } from './ui/lobby';
import { ensureRemote, removeRemote, showRemoteChat, showRemoteHuh, applySnapshot } from './game/remotes';
import { PeerTransport } from './net/p2p/peerTransport';
import type { LocalStateProvider, Transport, TransportCallbacks } from './net/transport';
import { startLoop } from './game/loop';

import { loadHeroModel } from './hero/gltfHero';
import { loadMobModel } from './game/mobs';
import { loadNatureAssets } from './world/terrain';

mountRenderer();

/* transport가 10Hz 송신 시 당겨가는 로컬 상태 */
const provider: LocalStateProvider = {
  getName: () => state.myName,
  getPlayerState: () => {
    const p = state.player.group.position;
    return { x: +p.x.toFixed(2), z: +p.z.toFixed(2), yaw: +state.player.yaw.toFixed(2), w: state.player.walking ? 1 : 0 };
  },
  getMobPositions: () => state.mobs.map(m => [+m.group.position.x.toFixed(2), +m.group.position.z.toFixed(2)] as [number, number]),
  getKills: () => state.kills,
};

/* 네트워크 이벤트 → 게임 반영 */
const callbacks: TransportCallbacks = {
  onStatus: setLobbyMsg,
  onRoomOpen(code) {
    state.mode = 'host';
    showRoomCode(code);
    setLobbyMsg('친구에게 이 코드를 알려주세요! 잠시 후 입장합니다…');
    setTimeout(closeLobby, 2200);
    addChat('', '🏠 방이 열렸습니다. 코드: <b>' + code + '</b>', 'sys');
  },
  onJoined(code) {
    state.mode = 'guest';
    setLobbyMsg('접속 완료!');
    setTimeout(closeLobby, 600);
    addChat('', '🚪 방 ' + code + '에 입장했습니다.', 'sys');
  },
  onPeerJoin(id, name) { ensureRemote(id, name); addChat('', '⚡ ' + name + ' 님이 입장했습니다!', 'sys'); },
  onPeerLeave(id, name) { addChat('', (name || '누군가') + ' 님이 떠났습니다.', 'sys'); removeRemote(id); },
  onPeerState(id, name, s) { const r = ensureRemote(id, name); r.tx = s.x; r.tz = s.z; r.yaw = s.yaw; r.walking = !!s.w; },
  onChat(id, name, text) { showRemoteChat(id, name, text); },
  onHuh(id) { showRemoteHuh(id); },
  onSnapshot(snap) { applySnapshot(snap); },
  onHostDisconnected() { addChat('', '⚠️ 호스트와 연결이 끊어졌습니다.', 'sys'); },
};

/* transport 교체 지점: Colyseus(WebSocket) 구현체가 생기면 net/ws/의 구현으로 이 팩토리만 바꾼다 */
function createTransport(): Transport {
  return new PeerTransport(callbacks, provider);
}

async function boot() {
  // 글TF 템플릿 로드 (로컬 파일, 실패 시 각각 절차 비주얼로 폴백)
  const [ok] = await Promise.all([loadHeroModel(), loadMobModel(), loadNatureAssets()]);
  if (!ok) addChat('', '⚠️ 리얼 캐릭터 로딩 실패 — 기본 캐릭터로 계속합니다', 'sys');
  buildTerrain(); // 자연 에셋 로드 후 배치 (실패 시 절차 지형 폴백)
  initPlayer();
  initLobby({
    startHost() { const t = createTransport(); state.net = t; t.host(); },
    startGuest(code) { const t = createTransport(); state.net = t; t.join(code); },
  });
  initInput();
  initVoice();
  document.getElementById('testbtn')!.onclick = () => confuse('unknown');
  document.getElementById('atkbtn')!.onclick = () => commandAttack();

  startLoop();

  // 개발 콘솔 디버그 훅 (테스트/검증용 — 게임 로직에서 사용 금지)
  (window as any).__vq = { state, handleUtterance, softenChat };
}
boot();
