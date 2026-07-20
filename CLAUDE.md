# Voice Quest

음성으로 조종하고, 음성이 곧 채팅이 되는 3인칭 무협 소셜 월드 게임. MVP 단계.

## 프로젝트 이해를 위한 필독 순서
1. `docs/01_game_concept.md` — 기획 (비전, 코어루프, 유대/운동회/중고시장 콘텐츠)
2. `docs/02_feature_spec.md` — 기능 명세 (구현됨 ✅ / 로드맵 🔜, P2P 프로토콜)
3. `docs/03_architecture.md` — 설계 (현 구조, 목표 서버 아키텍처, 마이그레이션 경로)

## MVP 파일 (mvp/ — 각각 독립 실행되는 단일 HTML, 진화 순서대로)
- `voice_quest_prototype.html` — v1: 2D 캔버스 개념검증
- `voice_quest_3rd_person.html` — v2: Three.js 오버숄더 3인칭 + 갸웃 제스처
- `voice_quest_realistic.html` — v3: 리깅 글TF(Soldier.glb) + 모캡 애니메이션 로드 예제
- `voice_quest_hero.html` — v4: 무협풍 절차적 캐릭터, 동료 NPC 제거
- `voice_quest_multiplayer.html` — **v5 최신**: PeerJS P2P 멀티플레이 + 인체 개선

새 작업은 v5 기준으로. v3는 글TF 로딩 파이프라인 참고용으로 유지.

## 실행 방법
Chrome에서 HTML 파일을 직접 열면 됨 (빌드 불필요, 인터넷 필요 — CDN/PeerJS).
음성 기능은 마이크 권한 허용 필요. 멀티 테스트: 창 2개로 방 생성/코드 참가.

## 핵심 설계 결정 (변경 시 신중히)
- **음성 분류 단일 진입점**: `handleUtterance(text, conf)` — 명령/채팅/갸웃 판정.
- **갸웃 제스처 = 시그니처 UX**: 인식 실패 시 카메라를 고정한 채 캐릭터만 뒤돌아
  으쓱+갸웃. 에러를 캐릭터 연기로 바꾸는 것이 이 게임의 정체성.
- **오버숄더 카메라**: 항상 뒷모습. `camYaw`는 confusion 중 갱신 중단.
- **host-authoritative P2P**: 몹/전투는 방장이 판정. 서버 전환 시 이 로직을 이식.

## 다음 작업 후보 (우선순위 순)
1. Vite+TS 모듈화 (docs/03 §3의 2단계, 폴더 구조는 §5)
2. Colyseus 서버 전환 + 광장 존
3. LLM 의도 분류로 명령/대화 판정 고도화
4. 운동회 미니게임 1종 (달리기)
5. 캐릭터 커스터마이징
