/* 네트워크 추상화 계층.
 * 게임 로직은 이 인터페이스만 알고, 구현체(p2p/PeerJS → 이후 ws/Colyseus)는 main.ts에서 주입한다.
 * wire 프로토콜은 docs/02_feature_spec.md §7의 JSON 메시지를 그대로 따른다. */

export interface PlayerNetState {
  x: number;
  z: number;
  yaw: number;
  w: 0 | 1; // walking
}

export interface SnapshotPlayer extends PlayerNetState {
  id: string;
  n: string;
}

export interface Snapshot {
  ps: SnapshotPlayer[];
  mobs: [number, number][];
  k: number; // kills
}

/* 게스트 → 호스트 */
export type GuestMessage =
  | { t: 'hello'; name: string }
  | ({ t: 'me' } & PlayerNetState)
  | { t: 'chat'; text: string }
  | { t: 'huh' };

/* 호스트 → 게스트 (브로드캐스트) */
export type HostMessage =
  | ({ t: 'snap' } & Snapshot)
  | { t: 'chat'; id: string; n: string; text: string }
  | { t: 'huh'; id: string };

/* 10Hz 상태 송신에 필요한 로컬 데이터를 transport가 당겨가는 인터페이스 */
export interface LocalStateProvider {
  getName(): string;
  getPlayerState(): PlayerNetState;
  getMobPositions(): [number, number][]; // 호스트 전용 (몹 권위)
  getKills(): number;
}

/* 네트워크 이벤트 → 게임 쪽 콜백 */
export interface TransportCallbacks {
  onStatus(msg: string): void;                    // 로비 상태 메시지
  onRoomOpen(code: string): void;                 // 호스트: 방 생성 완료
  onJoined(code: string): void;                   // 게스트: 접속 완료
  onPeerJoin(id: string, name: string): void;     // 호스트: 게스트 입장
  onPeerLeave(id: string, name?: string): void;   // 호스트: 게스트 퇴장
  onPeerState(id: string, name: string | undefined, s: PlayerNetState): void; // 호스트: 게스트 상태 수신
  onChat(id: string, name: string, text: string): void;
  onHuh(id: string): void;
  onSnapshot(snap: Snapshot): void;               // 게스트: 자기 자신은 제거된 스냅샷
  onHostDisconnected(): void;                     // 게스트: 호스트 연결 끊김
}

export interface Transport {
  readonly mode: 'host' | 'guest' | null;
  host(): void;
  join(code: string): void;
  sendChat(text: string): void;
  sendHuh(): void;
}
