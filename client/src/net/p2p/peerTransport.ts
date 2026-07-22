import { Peer } from 'peerjs';
import type { DataConnection } from 'peerjs';
import type {
  GuestMessage, HostMessage, LocalStateProvider, PlayerNetState,
  SnapshotPlayer, Transport, TransportCallbacks,
} from '../transport';

/* PeerJS P2P 구현 — host-authoritative 스타 토폴로지.
 * 방 코드 4자리 → peer id 'vqkr-<code>'. 무료 클라우드 시그널링 사용(서버 불필요). */
export class PeerTransport implements Transport {
  mode: 'host' | 'guest' | null = null;

  private peer: Peer | null = null;
  private conns: Record<string, DataConnection> = {};
  private states: Record<string, PlayerNetState> = {};
  private names: Record<string, string> = {};
  private hostConn: DataConnection | null = null;

  constructor(private cb: TransportCallbacks, private local: LocalStateProvider) {}

  /* --- 호스트 --- */
  host() {
    const code = ('' + Math.floor(1000 + Math.random() * 9000));
    this.cb.onStatus('방 생성 중…');
    const peer = new Peer('vqkr-' + code);
    this.peer = peer;
    peer.on('open', () => {
      this.mode = 'host';
      this.cb.onRoomOpen(code);
    });
    peer.on('connection', conn => {
      conn.on('open', () => { this.conns[conn.peer] = conn; });
      conn.on('data', d => this.onHostData(conn, d as GuestMessage));
      conn.on('close', () => {
        const name = this.names[conn.peer];
        delete this.conns[conn.peer]; delete this.states[conn.peer];
        this.cb.onPeerLeave(conn.peer, name);
      });
    });
    peer.on('error', e => this.cb.onStatus('⚠️ 연결 오류: ' + e.type + ' — 다시 시도하거나 혼자 수련하기를 눌러주세요'));
    // 상태 브로드캐스트 (10Hz)
    setInterval(() => {
      if (this.mode !== 'host') return;
      const self = this.local.getPlayerState();
      const ps: SnapshotPlayer[] = [{ id: 'H', n: this.local.getName(), ...self }];
      for (const [id, s] of Object.entries(this.states))
        ps.push({ id, n: this.names[id] || '???', ...s });
      this.broadcast({ t: 'snap', ps, mobs: this.local.getMobPositions(), k: this.local.getKills() });
    }, 100);
  }

  private onHostData(conn: DataConnection, d: GuestMessage) {
    const id = conn.peer;
    if (d.t === 'hello') {
      this.names[id] = d.name;
      this.cb.onPeerJoin(id, d.name);
    } else if (d.t === 'me') {
      const { t: _t, ...s } = d;
      this.states[id] = s;
      this.cb.onPeerState(id, this.names[id], s);
    } else if (d.t === 'chat') {
      const n = this.names[id] || '???';
      this.cb.onChat(id, n, d.text);
      this.broadcast({ t: 'chat', id, n, text: d.text }, id);
    } else if (d.t === 'huh') {
      this.cb.onHuh(id);
      this.broadcast({ t: 'huh', id }, id);
    } else if (d.t === 'gift') {
      const n = this.names[id] || '???';
      this.cb.onGift(n, d.to, d.amount, d.to === 'H'); // 호스트 자신이 수신자면 toMe
      this.broadcast({ t: 'gift', from: id, n, to: d.to, amount: d.amount }, id);
    }
  }

  private broadcast(msg: HostMessage, exceptId?: string) {
    for (const [id, c] of Object.entries(this.conns))
      if (id !== exceptId) try { c.send(msg); } catch (_) {}
  }

  /* --- 게스트 --- */
  join(code: string) {
    this.cb.onStatus('접속 중…');
    const peer = new Peer();
    this.peer = peer;
    peer.on('open', () => {
      const conn = peer.connect('vqkr-' + code, { reliable: true });
      this.hostConn = conn;
      conn.on('open', () => {
        this.mode = 'guest';
        conn.send({ t: 'hello', name: this.local.getName() } satisfies GuestMessage);
        this.cb.onJoined(code);
        setInterval(() => {
          try { conn.send({ t: 'me', ...this.local.getPlayerState() } satisfies GuestMessage); } catch (_) {}
        }, 100);
      });
      conn.on('data', d => this.onGuestData(d as HostMessage));
      conn.on('close', () => this.cb.onHostDisconnected());
    });
    peer.on('error', e => this.cb.onStatus('⚠️ 접속 실패: 코드를 확인해주세요 (' + e.type + ')'));
  }

  private onGuestData(d: HostMessage) {
    if (d.t === 'snap') {
      // 스냅샷에서 나 자신은 제거하고 전달
      const myId = this.peer ? this.peer.id : null;
      const ps = d.ps.filter(q => !(myId && q.id !== 'H' && q.id === myId));
      this.cb.onSnapshot({ ps, mobs: d.mobs, k: d.k });
    } else if (d.t === 'chat') this.cb.onChat(d.id, d.n, d.text);
    else if (d.t === 'huh') this.cb.onHuh(d.id);
    else if (d.t === 'grant') { if (this.peer && d.id === this.peer.id) this.cb.onCoinGrant(d.amount); }
    else if (d.t === 'gift') this.cb.onGift(d.n, d.to, d.amount, !!this.peer && d.to === this.peer.id);
  }

  /* --- 공통 송신 --- */
  sendChat(text: string) {
    if (this.mode === 'host') this.broadcast({ t: 'chat', id: 'H', n: this.local.getName(), text });
    else if (this.mode === 'guest' && this.hostConn) this.hostConn.send({ t: 'chat', text } satisfies GuestMessage);
  }

  sendHuh() {
    if (this.mode === 'host') this.broadcast({ t: 'huh', id: 'H' });
    else if (this.mode === 'guest' && this.hostConn) this.hostConn.send({ t: 'huh' } satisfies GuestMessage);
  }

  /* 호스트 전용: 몹 드랍 은자를 처치자에게 지급 (해당 id의 게스트만 적용) */
  grantCoins(id: string, amount: number) {
    if (this.mode === 'host') this.broadcast({ t: 'grant', id, amount });
  }

  /* 후원 보내기 — 호스트는 직접 중계, 게스트는 호스트를 경유 */
  sendGift(toId: string, amount: number) {
    if (this.mode === 'host') this.broadcast({ t: 'gift', from: 'H', n: this.local.getName(), to: toId, amount });
    else if (this.mode === 'guest' && this.hostConn) this.hostConn.send({ t: 'gift', to: toId, amount } satisfies GuestMessage);
  }
}
