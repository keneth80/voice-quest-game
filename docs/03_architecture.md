# Voice Quest — 설계 문서 (아키텍처)

버전: 0.1

## 1. 현재 MVP 구조

모든 MVP는 **의존성 없는 단일 HTML 파일**이다. CDN에서 Three.js r128 (+멀티 버전은 PeerJS)만 로드한다.

```
voice_quest_multiplayer.html (최신 MVP)
├─ 렌더링   : Three.js r128, WebGL, 그림자(PCFSoft), 안개, Lambert 재질
├─ 월드     : 300x300 평면, 나무/대나무/풀 절차 배치
├─ 캐릭터   : makeHero(robeColor) — 절차적 조립 휴머노이드
│             animateHero(v, walking, time, shrugK, slashT) — 절차 애니메이션
├─ 입력     : pointerdown 레이캐스트(이동), Web Speech API(음성)
├─ 게임로직 : 메인 루프(rAF) — 이동/전투/몹AI/이펙트/카메라
├─ 네트워크 : PeerJS DataChannel, host-authoritative 스타 토폴로지
└─ UI       : DOM 오버레이(HUD, 채팅로그, 말풍선 3D투영, 로비)
```

### 주요 코드 모듈 (파일 내 섹션 주석 기준)

| 섹션 | 역할 |
|---|---|
| `makeHero` / `animateHero` | 캐릭터 생성/애니메이션. 색상 파라미터로 플레이어 구분 |
| `handleUtterance(text, conf)` | 음성 분류기 — 명령/채팅/갸웃 판정의 단일 진입점 |
| `softenChat(text)` | 욕설 순화 — 금칙어를 미칭(왕자님/공자님 등)으로 치환. 분류 직전 + 원격 채팅 표시 시 적용 (02 §2.1) |
| `confuse(reason)` | 갸웃 제스처 상태 시작 (150프레임 시퀀스는 메인 루프에서 처리) |
| `NET` + `remotes{}` | 네트워크 상태와 원격 아바타 관리 |
| `startHost/startGuest/onHostData/onGuestData` | P2P 세션 수립과 메시지 라우팅 |
| `updateCamera` | 오버숄더 카메라 (confusion 중 camYaw 고정이 핵심) |
| `placeBubble` | 3D 좌표 → 화면 투영으로 DOM 말풍선 배치 |

### 알려진 제약 (P2P MVP)
- 호스트가 나가면 방 소멸 (호스트 마이그레이션 없음)
- NAT 환경에 따라 연결 실패 가능 (TURN 서버 없음)
- 치트 방어 없음 (클라이언트 신뢰 모델)
- 적정 인원 ~8명

## 2. 목표 아키텍처 (서비스 단계)

```
[클라이언트: 웹/모바일]
  Three.js(또는 엔진 전환) + STT
      │ WebSocket (상태 동기화, 20Hz)
      │ HTTPS (계정/인벤토리/거래 REST)
      ▼
[게임 서버] Node.js + Colyseus (권장) 또는 uWebSockets 자체 구현
  ├─ Room: 존 단위 (광장/사냥터/운동장/시장)
  │   ├─ 상태 스키마: players, mobs, gameState(미니게임 상태머신)
  │   ├─ 관심 영역 필터(AOI): 가까운 엔티티만 전송
  │   └─ 서버 권위 판정: 이동 검증, 전투, 거래
  ├─ 매치메이커: 존 입장/이동 라우팅
  └─ 채팅 파이프라인: 텍스트 필터 → 브로드캐스트 → 로그 보관
      ▼
[영속 계층]
  PostgreSQL: 계정, 아바타, 인벤토리, 유대치(플레이어 쌍), 거래 원장,
              재화 원장(은자 잔고·이체·후원 — 모든 증감을 원장 기록으로 감사 가능),
              소유물(탈것/코스튬), 하우징(부지·건설 단계·가구 배치)
  Redis: 세션, 존 간 pub/sub, 랭킹
```

### 존(Zone) 설계 — 생활 콘텐츠의 기본 단위
- 존 = Colyseus Room 1개. 입장 시 클라이언트가 해당 존의 룰셋 UI를 로드.
- **광장**: 기본 소셜. 말풍선 밀도 제한(스팸 방지), 이모트.
- **운동장**: `gameState: idle → lobby → countdown → playing → result`.
  경기 로직은 서버 틱에서 판정(달리기 체크포인트, 줄다리기 게이지).
- **시장**: 좌판 엔티티(소유자, 아이템 목록). 거래는 2단계 커밋:
  `offer → 양측 confirm → 서버가 원자적 교환 + 원장 기록`.
- **사냥터**: 현 MVP 전투를 서버 권위로 이식. 몹 처치 드랍 → 인벤토리 지급(서버 판정).
- **주거 존(아지트)**: 플레이어별 하우징 인스턴스. 부지 구매·건설·가구 배치는
  서버 권위(재화 원장 차감과 원자적으로 처리), 방문은 유대 단계 해금(01 §5) 검증.
  후원(은자 이체)도 동일하게 서버 원장 트랜잭션 — 클라이언트는 요청만 한다.

### 음성 파이프라인 고도화
```
브라우저 STT (현행 유지, 무료·저지연)
   → 텍스트를 서버로 전송
   → 서버측 분류:
      1) 금칙어/모더레이션 필터 — MVP의 클라이언트 미칭 치환(softenChat)을 서버로 이식,
         치환 연출(왕자님/공자님)은 유지하고 사전 확장 + AI 모더레이션 추가
      2) 의도 분류 (LLM API — 명령|대화|감정표현)
      3) 명령이면 검증 후 실행, 대화면 AOI 브로드캐스트
```
- 갸웃 제스처는 클라이언트 선행 연출(낙관적) + 서버 판정 결과로 보정.

## 3. 마이그레이션 경로 (MVP → 서비스)

1. **1단계 (현재)**: 단일 HTML + P2P. 친구 단위 테스트, UX 검증.
2. **2단계 (완료, 2026-07-17)**: 코드 모듈화 — Vite + TypeScript로 분리
   (`/src/world`, `/src/hero`, `/src/voice`, `/src/net`, `/src/ui`). → `client/` 참조.
   P2P 코드를 `net/transport.ts` 인터페이스 뒤로 숨겨 서버 전환 대비.
3. **3단계**: Colyseus 서버 도입. `transport` 구현체만 WebSocket으로 교체.
   호스트 권위 로직(몹AI/전투)을 서버 room 코드로 이동.
4. **4단계**: 계정/DB, 광장 존 오픈. 이후 운동장/시장 존 순차 추가.
5. **(선택) 그래픽 고도화**: 리깅 글TF 캐릭터 교체 → 필요시 Unity/UE5 클라이언트 전환.
   서버와 프로토콜은 유지 가능하도록 JSON/스키마 기반으로 설계.

## 4. 기술 선택 근거

| 선택 | 이유 |
|---|---|
| Web Speech API | 무료, 브라우저 내장, 한국어 인식 양호, 지연 낮음. 대안: Whisper API(비용), Deepgram(스트리밍 유료) |
| Three.js (MVP) | 설치 없는 웹 배포 = 초기 유저 획득 마찰 최소화 |
| PeerJS (MVP) | 서버 0원으로 진짜 멀티 검증 가능 |
| Colyseus (목표) | Room/상태동기화/스키마 내장, Node 생태계, 존 모델과 정합 |
| host-authoritative → server-authoritative | MVP 속도 우선 → 서비스 신뢰성 |

## 5. 폴더 구조 제안 (2단계 이후)

```
voice-quest/
├─ client/
│  ├─ src/
│  │  ├─ world/      # 지형, 조명, 소품
│  │  ├─ hero/       # makeHero, animateHero, 커스터마이징
│  │  ├─ voice/      # STT, handleUtterance, confuse
│  │  ├─ net/        # transport 인터페이스, p2p/, ws/
│  │  ├─ game/       # 루프, 전투, 카메라
│  │  └─ ui/         # HUD, 채팅, 로비, 말풍선
│  └─ index.html
├─ server/
│  ├─ rooms/         # PlazaRoom, HuntRoom, SportsRoom, MarketRoom
│  ├─ schema/        # 상태 스키마
│  └─ services/      # 인증, 거래, 유대, 모더레이션
└─ docs/             # 본 문서들
```
