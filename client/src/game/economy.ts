import { state } from './state';
import { addChat, setCoins } from '../ui/hud';
import { setPlayerCharacter } from './player';
import { CHARACTERS } from '../hero/gltfHero';

/* 경제 데모 (기획 01 §6.3 축소판, P2P 호스트 권위):
 * 몹 처치 드랍 → 은자 → 상점(의상/축지 신발) 구매 + 후원.
 * 잔고는 세션 내 로컬 유지 — 원장·검증은 서버 전환(3단계) 시 이식. */
export const DROP_COIN = 5;
export const GIFT_AMOUNT = 10;

export interface ShopItem {
  id: string;
  name: string;
  price: number;
  desc: string;
  buy(): boolean; // 적용 성공 여부 (중복 구매 등 거부 가능)
}

export function addCoins(amount: number, reason?: string) {
  state.coins += amount;
  setCoins(state.coins);
  if (reason) addChat('', `💰 은자 +${amount} — ${reason}`, 'sys');
}

/* 몹 처치 시 처치자에게 드랍 지급 (호스트/솔로 판정 시 호출) */
export function awardKill(killerId: string) {
  if (killerId === 'H') addCoins(DROP_COIN, '요괴 퇴치');
  else state.net?.grantCoins(killerId, DROP_COIN);
}

export function trySpend(price: number): boolean {
  if (state.coins < price) {
    addChat('', `💸 은자가 부족합니다 (필요 ${price}, 보유 ${state.coins})`, 'sys');
    return false;
  }
  state.coins -= price;
  setCoins(state.coins);
  return true;
}

const CHAR_LABEL: Record<string, string> = {
  Barbarian: '야만전사 복장', Rogue: '도적 복장', Rogue_Hooded: '후드 도적 복장',
  Mage: '술사 복장', Ranger: '유랑객 복장',
};

export function shopItems(): ShopItem[] {
  const items: ShopItem[] = CHARACTERS.filter(c => c !== 'Knight').map(c => ({
    id: `char_${c}`,
    name: `👘 ${CHAR_LABEL[c] ?? c}`,
    price: 30,
    desc: '구매 즉시 갈아입고, 다른 플레이어에게도 보인다',
    buy() {
      if (state.myChar === c) { addChat('', '이미 입고 있는 복장입니다.', 'sys'); return false; }
      state.myChar = c;
      setPlayerCharacter(c);
      addChat('', `👘 ${CHAR_LABEL[c] ?? c}으로 갈아입었다!`, 'sys');
      return true;
    },
  }));
  items.push({
    id: 'boots',
    name: '👟 축지 신발',
    price: 50,
    desc: '이동 속도 1.5배 (탈것 데모 — 세계관 각색판)',
    buy() {
      if (state.player.speed > .08) { addChat('', '이미 축지 신발을 신고 있습니다.', 'sys'); return false; }
      state.player.speed = .075 * 1.5;
      addChat('', '👟 축지법 발동! 몸이 가벼워졌다.', 'sys');
      return true;
    },
  });
  return items;
}

/* 후원: 가장 가까운 원격 플레이어에게 은자 보내기 */
export function giftNearest(): void {
  const entries = Object.entries(state.remotes);
  if (!state.net || entries.length === 0) {
    addChat('', '후원할 상대가 근처에 없습니다 (멀티플레이 전용)', 'sys');
    return;
  }
  const p = state.player.group.position;
  let bestId = entries[0][0], bd = 1e9;
  for (const [id, r] of entries) {
    const d = r.group.position.distanceTo(p);
    if (d < bd) { bd = d; bestId = id; }
  }
  if (!trySpend(GIFT_AMOUNT)) return;
  state.net.sendGift(bestId, GIFT_AMOUNT);
  addChat('', `💝 은자 ${GIFT_AMOUNT}을 후원했습니다`, 'sys');
}
