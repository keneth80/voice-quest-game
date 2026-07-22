import { state } from '../game/state';
import { shopItems, giftNearest, trySpend } from '../game/economy';

/* 상점(저잣거리) 패널 — 경제 데모 UI (02 §8) */
const shop = () => document.getElementById('shop') as HTMLDivElement;

function render() {
  (document.getElementById('shopcoins') as HTMLElement).textContent = String(state.coins);
  const list = document.getElementById('shopitems') as HTMLDivElement;
  list.innerHTML = '';
  for (const item of shopItems()) {
    const row = document.createElement('div');
    row.className = 'shop-item';
    const info = document.createElement('div');
    info.className = 'info';
    info.innerHTML = `<div class="name">${item.name}</div><div class="desc">${item.desc}</div>`;
    const btn = document.createElement('button');
    btn.textContent = `${item.price} 은자`;
    btn.onclick = () => {
      if (state.coins < item.price) { alertCoins(item.price); return; }
      if (item.buy()) trySpend(item.price); // 적용 성공 시에만 차감 (HUD 동기화 포함)
      render();
    };
    row.appendChild(info);
    row.appendChild(btn);
    list.appendChild(row);
  }
}

function alertCoins(price: number) {
  (document.getElementById('shopcoins') as HTMLElement).textContent =
    `${state.coins} (부족! ${price} 필요)`;
}

export function openShop() {
  render();
  shop().style.display = 'flex';
}

export function closeShop() {
  shop().style.display = 'none';
}

export function isShopOpen() {
  return shop().style.display === 'flex';
}

export function initShop() {
  document.getElementById('shopbtn')!.onclick = () => (isShopOpen() ? closeShop() : openShop());
  document.getElementById('shopclose')!.onclick = closeShop;
  document.getElementById('giftbtn')!.onclick = () => { giftNearest(); render(); };
  // 패널 바깥 클릭으로 닫기
  shop().addEventListener('pointerdown', e => { if (e.target === shop()) closeShop(); });
}
