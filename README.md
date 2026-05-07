# PeopleCore Front - 워크플로우 가이드

화면을 클릭했을 때 어떤 흐름으로 동작하는지를 모듈별로 정리한 문서입니다.
(코드 구조 설명이 아니라 "사용자가 무엇을 클릭하면 무슨 일이 일어나는가" 관점)

---

## 1. 인증 (`/login`, `/find-email`, `/reset-password`)

- **로그인**: 이메일/비밀번호 입력 → 성공 시 JWT 저장 → `/` (대시보드)로 이동.
- **이메일 찾기**: 사번/이름 입력 → 마스킹된 이메일 노출.
- **비밀번호 재설정**: 이메일 입력 → 인증 메일 발송 → 링크 클릭 시 신규 비밀번호 입력 화면.
- **얼굴 로그인**: 등록된 사용자에 한해 카메라 캡처 → 얼굴 인증 통과 시 토큰 발급.

---

## 2. 대시보드 (`/`)

- 로그인 직후 진입 화면.
- 위젯 클릭 → 해당 모듈로 이동 (오늘 일정 → 캘린더, 결재 알림 → 결재 상세 모달, 근태 카드 → 근태 페이지).
- 상단 알림 벨 클릭 → 알림 목록 → 알림 클릭 시 `canonicalizeAlarmLink`로 정규화된 경로로 라우팅.

---

## 3. 전자결재 (`/approval`)

```
[결재함 진입]
  └─ 사이드바: 받은 문서함 / 보낸 문서함 / 임시저장함 / 부서함 / 개인함
       └─ 문서 행 클릭 → 결재 상세 모달 (ApprovalModalHost)
            ├─ [승인] → 의견 입력 → 다음 결재자에게 자동 전달 (순차/병렬)
            ├─ [반려] → 사유 입력 → 기안자에게 반송, doc_status=반려
            ├─ [회수] (기안자 전용) → 진행 중 문서 회수 (낙관적 락)
            └─ [전결] → 즉시 완료 처리 (라벨 "전결", emerald 톤)

[기안하기]
  └─ 양식 선택 (form_html 동적 로드)
       └─ doc_data 입력 + 결재선/참조/열람 지정
            └─ [임시저장] or [상신] → 채번 (부서-양식-날짜-순번)
```

- 부서 문서함 설정은 인사과 권한만 가능.
- 긴급(`isEmergency=true`) 문서는 목록 상단 우선 정렬.

---

## 4. 근태 (`/attendance`)

```
[근태 메인]
  ├─ [출근] 버튼 → 위치/IP 검증 → 출근 기록 (allowed_ip 정책)
  ├─ [퇴근] 버튼 → 퇴근 기록 + 초과근무 자동 계산
  │     └─ 인증/미인증 초과근무 분리 표시 (recognized / unrecognized)
  ├─ [근태 정정 신청] → 출/퇴 한쪽만 정정 가능 (반대쪽 null 허용)
  └─ [초과근무 신청] (OvertimeApplyModal) → 사전/사후 신청 분리

[휴가/연차]
  ├─ [휴가 신청] (LeaveApplyModal) → 연차/반차/특별휴가 종류 선택
  │     └─ vacationFormShared 로 결재 양식과 동일한 폼 사용
  ├─ [잔여 연차 조회] (LeaveStatusView)
  └─ [연차 사용 이력] (LeaveHistoryView)
```

- 주간 최대 근로시간은 정책 API(`/overtime/policy`)에서 받아옴 (하드코딩 금지).

---

## 5. 근태 관리자 (`/attendance-admin`)

- 부서원 출퇴근 현황 조회 → 행 클릭 → 정정 상세 모달.
- 휴가 신청 승인/반려 (HrVacationRequestAdminView).
- 연차 부여/조정 (HrVacationGrantModal, HrVacationAdjustmentHistoryModal).

---

## 6. 캘린더 (`/calendar`)

```
[캘린더 화면]
  ├─ 날짜 셀 클릭 → QuickEventModal (간단 일정)
  ├─ 빈 영역 드래그 → EventModal (상세 일정)
  ├─ 기존 이벤트 클릭 → EventDetailModal → [수정/삭제]
  ├─ 사이드바 [공유 캘린더] → ShareCalendarModal (구성원 선택)
  └─ 검색 아이콘 → SearchModal
```

---

## 7. 게시판 (`/board`)

- 카테고리 트리 클릭 → 게시글 목록 → 행 클릭 → 상세.
- [글쓰기] 버튼 → TinyMCE 에디터 → 첨부 (MinIO Pre-signed URL).

---

## 8. 드라이브 (`/drive`)

```
[드라이브]
  ├─ 사이드바: 내 드라이브 / 공유받은 / 휴지통 / 활동로그
  ├─ 파일 더블클릭 → 미리보기 (hwp.js, mammoth, xlsx)
  ├─ 우클릭 → DriveModals (이름변경/이동/삭제/공유)
  └─ 드래그 앤 드롭 업로드 (multipart)
```

---

## 9. 평가 (`/eval/*`)

```
[직원] /eval/employee
  └─ MyResult: 내 평가 결과 조회 (이의제기 가능)

[평가자] /eval/view
  └─ AllEvalList → 평가 대상 클릭 → ManagerEvalView / PeerEvalView 입력 → 제출

[관리자] /eval/manager, /eval/grading
  └─ TeamStatus, TeamEvalResult, DeptGradeDistribution, GradeFinalLock (등급 확정)
```

- `/eval-admin`: 시즌 생성, 평가 룰 설정, 스케줄러 제어.

---

## 10. 인사 (`/hr/*`)

- `EmployeeList` → 사원 행 클릭 → `EmployeeDetail` (개인정보/소속/이력).
- `Certificate`: 재직증명서 등 발급.
- `PersonnelAppointment`: 인사발령.
- `RetirementDetail`: 퇴직 처리.
- `FaceLoginManagement`: 얼굴 등록/관리.

---

## 11. 인사관리자 (`/hr-admin`)

- 사이드바 [인사통합] 클릭 → **PIN 입력 모달** → 인증 성공 시 별도 세션 발급 (15분, 연장 가능).
- 세션 만료 시 자동 로그아웃, 화면 우상단 뱃지에 잔여 시간 표시.
- 탭: 사원 정보 / 결재 설정 / 근태 정책 / 파일함 관리 / 양식 관리.

---

## 12. 급여 (`/payroll`, `/salary`)

- `/salary`: 본인 급여명세서 조회 (월별).
- `/payroll`: 관리자 급여 처리 (계산/지급/보고서).

---

## 13. 메신저 (`/messenger`, 패널)

- 헤더 메신저 아이콘 → 우측 패널(MessengerPanel) 슬라이드 인.
- 조직도에서 사람 클릭 → "메시지 보내기" → 패널이 해당 사용자로 열림.
- STOMP WebSocket 기반 실시간 송수신.

---

## 14. 조직도 / 조직관리

- 사이드바 [조직도] 또는 `window.dispatchEvent('open-orgchart')` → OrgChartModal.
- `/org-management/*`: 부서/직급/직책 탭, 인사명령 탭, 권한 탭.

---

## 15. 공통 흐름

- **알림 클릭**: 알림 → 링크 정규화 → 해당 모듈 라우팅 (BE/FE 경로 차이 흡수).
- **메뉴 설정**: 사이드바 톱니바퀴 → MenuSettingsModal → 드래그로 순서 변경/표시 토글 → 닫을 때 서버 저장.
- **권한 체크**: `@RoleRequired` 기반, Gateway가 `X-User-Role` 헤더 주입 → 백엔드 인터셉터 검증.

---

## 라우팅 한 눈에 보기

| 경로 | 화면 | 보호 |
|---|---|---|
| `/login`, `/find-email`, `/reset-password` | 인증 | 공개 |
| `/` | 대시보드 | 로그인 |
| `/approval` | 전자결재 | 로그인 |
| `/attendance`, `/attendance-admin` | 근태 / 근태관리 | 로그인 |
| `/calendar` | 캘린더 | 로그인 |
| `/board` | 게시판 | 로그인 |
| `/drive` | 드라이브 | 로그인 |
| `/eval/*`, `/eval-admin` | 평가 / 평가관리 | 로그인 |
| `/hr/*`, `/hr-admin` | 인사 / 인사통합 | 로그인 + (PIN) |
| `/payroll/*`, `/salary` | 급여 / 명세서 | 로그인 |
| `/org`, `/org-management/*` | 조직도 / 조직관리 | 로그인 |
| `/messenger` | 메신저 풀화면 | 로그인 |
| `/filebox-admin` | 파일함 관리 | 로그인 |
