# Voice Quest

**"내 목소리가 곧 조작이자 대화가 되는, 사람 사는 것 같은 3인칭 소셜 월드"**

음성으로 캐릭터를 조종하고, 명령이 아닌 말은 그대로 채팅 말풍선이 되는 무협 소셜 게임 (MVP).
욕설은 "왕자님/공자님" 같은 존칭으로 승화되는 **바른말 고운말** 컨셉을 담고 있다.

## 실행

```bash
cd client
npm install
npm run dev     # http://localhost:5173
```

- Chrome/Edge 필요 (Web Speech API), 음성 기능은 마이크 권한 허용 필요
- 멀티플레이: 방 만들기 → 4자리 코드를 친구에게 공유 (PeerJS 무료 클라우드 시그널링, 서버 불필요)
- `mvp/` 폴더의 HTML들은 초기 프로토타입 (각각 브라우저에서 바로 열림)

## 배포 (Vercel)

정적 빌드만으로 동작한다. 저장소 루트의 `vercel.json`이 빌드를 구성하므로 추가 설정 없이 import만 하면 된다.

## 문서

- [기획서 (컨셉)](docs/01_game_concept.md)
- [기능 명세서](docs/02_feature_spec.md)
- [설계 문서 (아키텍처)](docs/03_architecture.md)

## 크레딧

- 캐릭터/무기/애니메이션: [KayKit Adventurers](https://kaylousberg.itch.io/kaykit-adventurers) & [KayKit Character Animations](https://kaylousberg.itch.io/kaykit-character-animations) — Kay Lousberg (CC0)
- Soldier.glb (대체 캐릭터): three.js 공식 예제 에셋 (Mixamo 리그)
