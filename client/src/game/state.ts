import * as THREE from 'three';
import type { AnyHero } from '../hero/updateHero';
import type { Transport } from '../net/transport';

export type NetMode = 'solo' | 'host' | 'guest';

export interface Mob {
  group: THREE.Group;
  body?: THREE.Mesh;              // 절차(슬라임) 폴백 전용 — 스켈레톤은 mixer 사용
  mixer?: THREE.AnimationMixer;   // 글TF 몹 애니메이션
  hp: number;
  speed: number;
  atkCd: number;
  wob: number;
}

/* 게스트 쪽 몹: 호스트 스냅샷 위치(tx,tz)로 보간만 한다 */
export interface GuestMob {
  group: THREE.Group;
  body?: THREE.Mesh;
  mixer?: THREE.AnimationMixer;
  tx?: number;
  tz?: number;
  wob?: number;
  cd?: number;
}

export interface Remote {
  group: THREE.Group;
  visual: AnyHero;
  tag: THREE.Sprite;
  bubbleEl: HTMLDivElement;
  bubbleT: number;
  tx: number;
  tz: number;
  yaw: number;
  walking: boolean;
  shrugT: number;
  slashT: number;
  lastName?: string;
}

export interface PlayerState {
  group: THREE.Group;
  visual: AnyHero;
  yaw: number;
  walking: boolean;
  tx: number;
  tz: number;
  speed: number;
  atkCd: number;
}

/* 원본 HTML의 전역 변수들을 모은 공유 게임 상태.
 * 게임 루프가 매 프레임 갱신하는 값이라 의도적으로 mutable 컨테이너로 둔다. */
export const state = {
  myName: '무명객',
  mode: 'solo' as NetMode,
  net: null as Transport | null,
  player: {
    group: new THREE.Group(),
    visual: null as unknown as AnyHero, // initPlayer()에서 할당
    yaw: 0, walking: false, tx: 0, tz: 0, speed: .075, atkCd: 0,
  } as PlayerState,
  remotes: {} as Record<string, Remote>,
  mobs: [] as Mob[],
  guestMobs: [] as GuestMob[],
  kills: 0,
  hp: 100,
  /* 갸웃 제스처: 150프레임 카운터. >0인 동안 카메라 camYaw 갱신이 중단된다(시그니처 UX) */
  confusion: 0,
  preYaw: 0,
  slashT: 0,
};
