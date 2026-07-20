import * as THREE from 'three';

/* 이름표 */
export function nameSprite(name: string, color?: string) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 64;
  const x = c.getContext('2d')!;
  x.font = 'bold 34px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.strokeStyle = 'rgba(0,0,0,.7)'; x.lineWidth = 7; x.strokeText(name, 128, 32);
  x.fillStyle = color || '#fff'; x.fillText(name, 128, 32);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true }));
  s.scale.set(1.7, .42, 1); return s;
}

/* 머리 위 "?" 스프라이트 (갸웃 제스처용) */
export function makeQSprite() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d')!;
  x.font = 'bold 96px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.strokeStyle = 'rgba(0,0,0,.5)'; x.lineWidth = 10; x.strokeText('?', 64, 70);
  x.fillStyle = '#ffd94a'; x.fillText('?', 64, 70);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true }));
  s.scale.set(.8, .8, 1); s.visible = false; return s;
}
