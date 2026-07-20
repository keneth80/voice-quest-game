import type { HeroVisual } from './makeHero';
import { animateHero } from './animateHero';
import type { GltfHeroVisual } from './gltfHero';
import { updateGltfHero } from './gltfHero';

/* 절차(폴백) 캐릭터와 글TF 캐릭터를 같은 인터페이스로 구동 */
export type AnyHero = HeroVisual | GltfHeroVisual;

export function updateHero(v: AnyHero, walking: boolean, time: number, shrugK: number, slashT: number, dt: number) {
  if ('mixer' in v) updateGltfHero(v, walking, time, shrugK, slashT, dt);
  else animateHero(v, walking, time, shrugK, slashT);
}
