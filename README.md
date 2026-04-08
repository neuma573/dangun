# 단군비즈 CRM

내부 영업 관리 시스템 — 정책자금 상담 고객 파이프라인 관리

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Build | Vite 6 | 빠른 개발서버, ES모듈 번들링, `.env` 지원 |
| Runtime | Vanilla JS (ES Modules) | 프레임워크 불필요, 기존 UI 완전 보존 |
| Data | Supabase (PostgreSQL) | 무료 티어, 실시간, REST API, 브라우저에서 직접 호출 |
| Deploy | GitHub Pages (via `gh-pages`) | 무료, 정적 호스팅 |

---

## 사전 준비

1. [Supabase](https://supabase.com) 계정 생성 (무료)
2. 새 프로젝트 생성
3. SQL Editor에서 `supabase/migrations/001_initial_schema.sql` 전체 실행
4. SQL Editor에서 `supabase/migrations/002_auth_rls.sql` 실행 (anon 정책 제거 → 인증 전용)
5. Authentication → Users → **Add user** 에서 관리자 계정 생성 (이메일 + 비밀번호)
6. Project Settings → API 에서 Project URL과 anon key 복사

---

## 로컬 개발 시작

```bash
# 1. 클론
git clone https://github.com/<your-github-username>/dangun.git
cd dangun

# 2. 의존성 설치
npm install

# 3. 환경변수 설정
cp .env.example .env
# .env 파일 열어서 Supabase 값 입력:
#   VITE_SUPABASE_URL=https://xxxx.supabase.co
#   VITE_SUPABASE_ANON_KEY=eyJhbGc...

# 4. 개발서버 실행
npm run dev
# → http://localhost:5173/dangun/ 에서 확인
```

---

## GitHub Pages 배포

`main` 브랜치에 push하면 GitHub Actions(`.github/workflows/deploy.yml`)가 자동으로 빌드 후 배포합니다.

배포 URL: `https://<your-github-username>.github.io/dangun/`

### 최초 설정 (1회)

1. GitHub 저장소 **Settings → Secrets and variables → Actions** 에서 아래 두 Secret 추가:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
2. GitHub 저장소 **Settings → Pages → Source** 를 `Deploy from a branch` → `gh-pages` 로 설정

이후 `main` push 시마다 자동 배포됩니다. 수동 실행은 GitHub **Actions** 탭 → `Deploy to GitHub Pages` → `Run workflow`.

---

## 프로젝트 구조

```
dangun-crm/
├── index.html                  # UI 마크업 + CSS (변경 금지)
├── src/
│   ├── main.js                 # 진입점: 부트스트랩 + window.* 노출
│   ├── constants.js            # PLANS, STEPS, DOCS_* 등 상수
│   ├── state.js                # 전역 상태 (customers 배열 등)
│   ├── db/
│   │   ├── client.js           # Supabase 클라이언트 초기화
│   │   ├── customers.js        # CRUD: customers 테이블
│   │   ├── trash.js            # CRUD: trash 테이블
│   │   └── migrate.js          # localStorage → Supabase 1회 이전
│   ├── utils/
│   │   ├── format.js           # uid, today, esc, csvField 등
│   │   ├── gender.js           # 주민번호 → 성별 추론
│   │   ├── docs.js             # 서류 체크리스트 유틸
│   │   └── calc.js             # 플랜 / 용역비 계산
│   └── ui/
│       ├── toast.js            # 토스트 알림
│       ├── views.js            # 화면 전환 (슬라이드 애니메이션)
│       ├── list.js             # 고객 목록 렌더링
│       ├── detail.js           # 고객 상세 렌더링
│       ├── modal.js            # 등록/수정 모달
│       ├── actions.js          # 스텝/서류/메모/상태/퀵저장/인라인편집
│       ├── collect.js          # 수금관리 뷰 + 팝업
│       ├── trash.js            # 휴지통 뷰
│       ├── route.js            # 신청 플랫폼 선택 팝업
│       ├── proceed.js          # 부결 후 추가진행 팝업
│       ├── reject.js           # 부결 처리 팝업
│       ├── dragdrop.js         # 드래그 앤 드롭 정렬
│       ├── parse.js            # 상담이력 자동 파싱
│       └── food.js             # 음식점 부가정보 토글
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── .env.example
├── .gitignore
├── package.json
└── vite.config.js
```

---

## 기존 데이터 이전 (localStorage → Supabase)

기존에 localStorage에 저장된 데이터가 있다면, **첫 로드 시 자동으로 Supabase로 이전**됩니다.

이전 완료 후 `localStorage.getItem('dangoon_migrated_v1')` 값이 `'1'`로 설정되어 중복 실행되지 않습니다.

수동으로 다시 실행하려면:
```js
// 브라우저 콘솔에서
localStorage.removeItem('dangoon_migrated_v1');
location.reload();
```

---

## Supabase 무료 티어 주의사항

| 항목 | 무료 제한 |
|-----|---------|
| DB 용량 | 500MB |
| API 요청 | 무제한 |
| **비활성 일시중지** | **7일 미사용 시 프로젝트 중지** |

> 중지된 경우: Supabase 대시보드 → 프로젝트 → Restore 클릭

중지를 방지하려면 Supabase Dashboard에서 `Pause` 설정을 끄거나,
GitHub Actions cron으로 7일마다 ping을 보내는 워크플로를 추가하세요.

---

## 알려진 버그 수정 사항 (이번 리팩토링에서 해결)

- **주민번호 연도 파싱**: 하드코딩된 `>= 25` 기준 → 현재 연도 2자리 기준으로 변경
- **CSV 내보내기**: 쉼표/줄바꿈 포함 필드가 CSV를 깨뜨리는 문제 수정 (`csvField()` 적용)
- **`eval()` 제거**: `data-csonchange` 속성의 `eval` → 명시적 함수 호출로 교체 (consult.js 참고)
- **localStorage 용량 한도 에러**: Supabase 이전으로 근본적 해결

---

## TODO (다음 단계)

- [ ] Supabase Auth 추가 (이메일/비밀번호 로그인) — 현재는 anon key로 전체 접근 가능
- [ ] 메모/상담이력 전문 검색 지원 (현재는 이름/전화/업종만 검색)
- [ ] 키보드 단축키 (Ctrl+N 신규등록, Esc 모달닫기, Enter 저장)
- [ ] 실시간 동기화 (Supabase Realtime 구독 — 여러 기기 동시 사용)
- [ ] Supabase 비활성 방지 cron (GitHub Actions)
- [ ] 전체 DB JSON 내보내기/가져오기 버튼 (백업용)
- [ ] 스텝 날짜 삭제 시 soft-delete (실수 복구 가능하도록)
- [ ] 모달 닫기 확인 팝업 — 기존값과 비교해 실제 변경 시에만 표시
