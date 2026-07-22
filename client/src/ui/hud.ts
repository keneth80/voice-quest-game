import { state } from '../game/state';

const chatlog = document.getElementById('chatlog')!;

export function addChat(who: string, text: string, cls: 'me' | 'other' | 'sys') {
  const d = document.createElement('div'); d.className = 'msg ' + cls;
  d.innerHTML = cls === 'sys' ? text : '<span class="who">' + who + '</span>' + text;
  chatlog.appendChild(d);
  while (chatlog.children.length > 8) chatlog.removeChild(chatlog.firstChild!);
}

export const pbub = document.getElementById('pbub') as HTMLDivElement;
/* 내 말풍선 표시 잔여 프레임 — 루프와 confuse()가 함께 만지는 mutable 컨테이너 */
export const bubbleState = { pbubT: 0 };

export function sayMe(text: string, confusedStyle?: boolean) {
  addChat(state.myName, text, 'me');
  pbub.textContent = text; pbub.className = 'bubble' + (confusedStyle ? ' confused' : ''); bubbleState.pbubT = 240;
}

export function setKills(n: number) {
  document.getElementById('kills')!.textContent = String(n);
}

export function setCoins(n: number) {
  document.getElementById('coins')!.textContent = String(n);
}

export function setPCount(n: number) {
  document.getElementById('pcount')!.textContent = String(n);
}

export function setHP(pct: number) {
  (document.getElementById('hpfill') as HTMLDivElement).style.width = pct + '%';
}

export function setMyNameLabel(name: string) {
  document.getElementById('myname')!.textContent = name;
}
