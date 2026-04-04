# 전자결재 백엔드 API 전체 목록

## 1. 결재 양식 (Form)

| Method | Endpoint | 설명 | 관련 테이블 |
|--------|----------|------|------------|
| `GET` | `/api/approval/form-folders` | 양식 폴더 트리 조회 | `form_folder` |
| `GET` | `/api/approval/forms` | 양식 목록 조회 (폴더별 필터) | `form` |
| `GET` | `/api/approval/forms/{formId}` | 양식 상세 조회 (form_html 포함) | `form` |
| `GET` | `/api/approval/forms/frequent` | 자주 쓰는 양식 조회 (사원별) | `form` + 별도 매핑 |
| `POST` | `/api/approval/forms/frequent/{formId}` | 자주 쓰는 양식 추가 | |
| `DELETE` | `/api/approval/forms/frequent/{formId}` | 자주 쓰는 양식 삭제 | |

---

## 2. 결재 문서 (Document) - CRUD & 상태변경

| Method | Endpoint | 설명 | 관련 테이블 |
|--------|----------|------|------------|
| `POST` | `/api/approval/documents` | 문서 기안 (결재요청) | `document`, `approval_line`, `attach` |
| `GET` | `/api/approval/documents/{docId}` | 문서 상세 조회 (doc_data + form_html + 결재선) | `document`, `form`, `approval_line` |
| `PUT` | `/api/approval/documents/{docId}` | 문서 수정 (임시저장 문서만) | `document` |
| `DELETE` | `/api/approval/documents/{docId}` | 임시저장 문서 삭제 | `document` |
| `POST` | `/api/approval/documents/temp` | 임시저장 | `document` (status=임시저장) |
| `PUT` | `/api/approval/documents/temp/{docId}` | 임시저장 수정 | `document` |
| `POST` | `/api/approval/documents/{docId}/submit` | 임시저장 → 결재요청 전환 | `document`, `approval_line` |

---

## 3. 결재 처리 (Approval Action)

| Method | Endpoint | 설명 | 관련 테이블 |
|--------|----------|------|------------|
| `POST` | `/api/approval/documents/{docId}/approve` | 승인 (line_comment 포함) | `approval_line` |
| `POST` | `/api/approval/documents/{docId}/reject` | 반려 (반려사유 필수) | `approval_line`, `document` |
| `POST` | `/api/approval/documents/{docId}/recall` | 회수 (기안자가 진행중 문서 회수) | `document`, `approval_line` |
| `POST` | `/api/approval/documents/{docId}/receive` | 수신 접수 | `approval_line` |
| `POST` | `/api/approval/documents/{docId}/read` | 열람 확인 | `approval_line` |
| `POST` | `/api/approval/documents/{docId}/cc-confirm` | 참조 확인 | `approval_line` |

---

## 4. 문서함 목록 조회 (Document Lists)

> 공통 Query Parameters: `page`, `size`, `search`, `startDate`, `endDate`, `formId`, `status`

| Method | Endpoint | 설명 | 비고 |
|--------|----------|------|------|
| `GET` | `/api/approval/documents/waiting` | 결재 대기 문서 (내가 결재할 차례) | line_status=대기 & 내 순서 |
| `GET` | `/api/approval/documents/received` | 결재 수신 문서 | 접수대기/접수 상태 |
| `GET` | `/api/approval/documents/cc-view` | 참조/열람 대기 문서 | line_role=참조/열람 & 미확인 |
| `GET` | `/api/approval/documents/upcoming` | 결재 예정 문서 (내 앞 결재자가 처리 중) | |
| `GET` | `/api/approval/documents/draft` | 기안 문서함 (내가 기안한 문서) | emp_id = 본인 |
| `GET` | `/api/approval/documents/temp` | 임시 저장함 | status=임시저장 |
| `GET` | `/api/approval/documents/approved` | 결재 문서함 (내가 결재한 문서) | |
| `GET` | `/api/approval/documents/cc-view-box` | 참조/열람 문서함 (확인 완료 포함) | |
| `GET` | `/api/approval/documents/sent` | 발송 문서함 | |
| `GET` | `/api/approval/documents/inbox` | 수신 문서함 | |
| `GET` | `/api/approval/documents/dept/waiting` | 부서 결재 대기함 | 부서 기준 필터 |
| `GET` | `/api/approval/documents/dept/received` | 부서 결재 수신함 | |
| `GET` | `/api/approval/documents/dept/sent` | 부서 결재 발신함 | |

---

## 5. 결재선 템플릿 (Approval Line Template)

| Method | Endpoint | 설명 | 관련 테이블 |
|--------|----------|------|------------|
| `GET` | `/api/approval/line-templates` | 저장된 결재선 목록 | `approval_line_template` |
| `POST` | `/api/approval/line-templates` | 결재선 저장 | `approval_line_template` + `_list` |
| `PUT` | `/api/approval/line-templates/{id}` | 결재선 수정 | |
| `DELETE` | `/api/approval/line-templates/{id}` | 결재선 삭제 | |
| `GET` | `/api/approval/line-templates/default` | 기본 결재선 조회 | is_default=true |

---

## 6. 결재 위임/부재 (Delegation)

| Method | Endpoint | 설명 | 관련 테이블 |
|--------|----------|------|------------|
| `GET` | `/api/approval/delegations` | 내 위임 목록 조회 | `approval_delegation` |
| `POST` | `/api/approval/delegations` | 부재/위임 등록 | `approval_delegation` |
| `PUT` | `/api/approval/delegations/{id}` | 위임 수정 | |
| `DELETE` | `/api/approval/delegations/{id}` | 위임 삭제 | |
| `PATCH` | `/api/approval/delegations/{id}/toggle` | 활성/비활성 전환 | is_active 토글 |

---

## 7. 전자 서명 (Signature)

| Method | Endpoint | 설명 | 관련 테이블 |
|--------|----------|------|------------|
| `GET` | `/api/approval/signatures/me` | 내 서명 조회 | `signature` |
| `POST` | `/api/approval/signatures` | 서명 등록/수정 (이미지 업로드) | `signature` |
| `DELETE` | `/api/approval/signatures` | 서명 삭제 | |

---

## 8. 부서 문서함 관리 (Dept Document Box)

| Method | Endpoint | 설명 | 비고 |
|--------|----------|------|------|
| `GET` | `/api/approval/dept-folders` | 부서 문서함 목록 | |
| `POST` | `/api/approval/dept-folders` | 부서 문서함 생성 | 인사과만 가능 |
| `PUT` | `/api/approval/dept-folders/{id}` | 부서 문서함 수정 (이름, 순서) | |
| `DELETE` | `/api/approval/dept-folders/{id}` | 부서 문서함 삭제 | |
| `PUT` | `/api/approval/dept-folders/reorder` | 순서 일괄 변경 | 드래그앤드롭 |
| `POST` | `/api/approval/dept-folders/{id}/managers` | 담당자 추가 | |
| `DELETE` | `/api/approval/dept-folders/{id}/managers/{empId}` | 담당자 삭제 | |

---

## 9. 개인 문서함 관리 (Personal Document Box)

| Method | Endpoint | 설명 |
|--------|----------|------|
| `GET` | `/api/approval/personal-folders` | 개인 문서함 목록 |
| `POST` | `/api/approval/personal-folders` | 개인 문서함 생성 |
| `PUT` | `/api/approval/personal-folders/{id}` | 이름 수정 |
| `DELETE` | `/api/approval/personal-folders/{id}` | 문서함 삭제 |
| `PUT` | `/api/approval/personal-folders/reorder` | 순서 변경 |
| `POST` | `/api/approval/personal-folders/{id}/transfer` | 문서함 이관 (대상자 지정) |

---

## 10. 자동분류 규칙 (Auto-Classify Rules)

| Method | Endpoint | 설명 |
|--------|----------|------|
| `GET` | `/api/approval/auto-classify-rules` | 규칙 목록 조회 |
| `POST` | `/api/approval/auto-classify-rules` | 규칙 생성 (조건: 제목/양식명/기안자/기안부서 포함) |
| `PUT` | `/api/approval/auto-classify-rules/{id}` | 규칙 수정 |
| `DELETE` | `/api/approval/auto-classify-rules/{id}` | 규칙 삭제 |
| `PATCH` | `/api/approval/auto-classify-rules/{id}/toggle` | 활성/비활성 |
| `PUT` | `/api/approval/auto-classify-rules/reorder` | 순서 변경 |

---

## 11. 첨부파일 (Attachment)

| Method | Endpoint | 설명 | 관련 테이블 |
|--------|----------|------|------------|
| `POST` | `/api/approval/documents/{docId}/attachments` | 파일 업로드 (multipart) | `common_attach` |
| `GET` | `/api/approval/documents/{docId}/attachments` | 첨부파일 목록 | |
| `GET` | `/api/approval/attachments/{attachId}/download` | 파일 다운로드 | |
| `DELETE` | `/api/approval/attachments/{attachId}` | 파일 삭제 | |

---

## 12. 결재번호 규칙 (Numbering Rule) - 관리자용

| Method | Endpoint | 설명 | 관련 테이블 |
|--------|----------|------|------------|
| `GET` | `/api/approval/number-rules` | 채번 규칙 조회 | `approval_number_rule` |
| `PUT` | `/api/approval/number-rules` | 채번 규칙 수정 | |

---

## 13. 조직도 조회 (공통 API - 결재선 구성용)

| Method | Endpoint | 설명 |
|--------|----------|------|
| `GET` | `/api/organizations/departments` | 부서 트리 조회 |
| `GET` | `/api/organizations/departments/{deptId}/members` | 부서별 사원 목록 |
| `GET` | `/api/organizations/members/search?keyword=` | 사원 검색 (이름/직위/부서) |

---

## 14. 전자결재 홈 (Dashboard)

| Method | Endpoint | 설명 |
|--------|----------|------|
| `GET` | `/api/approval/home/summary` | 홈 요약 (대기건수, 수신건수, 참조/열람 건수, 예정 건수) |
| `GET` | `/api/approval/home/waiting-cards` | 결재 대기 카드 (상위 4개, 긴급 우선) |
| `GET` | `/api/approval/home/in-progress` | 기안 진행 문서 (최근 5개) |
| `GET` | `/api/approval/home/completed` | 완료 문서 (최근 5개) |

---

## API 수량 요약

| 카테고리 | API 수 |
|----------|--------|
| 양식 관리 | 6개 |
| 문서 CRUD & 임시저장 | 7개 |
| 결재 처리 (승인/반려/회수 등) | 6개 |
| 문서함 목록 조회 | 13개 |
| 결재선 템플릿 | 5개 |
| 위임/부재 | 5개 |
| 전자 서명 | 3개 |
| 부서 문서함 관리 | 7개 |
| 개인 문서함 관리 | 6개 |
| 자동분류 규칙 | 6개 |
| 첨부파일 | 4개 |
| 채번 규칙 | 2개 |
| 조직도 (공통) | 3개 |
| 홈 대시보드 | 4개 |
| **총합** | **~77개** |

---

## 추가 백엔드 작업 사항

### 비즈니스 로직

1. **결재 프로세스 엔진** - 순차합의(다음 결재자 자동 활성화), 병렬합의(동시 결재) 처리
2. **문서번호 자동채번** - `number_rule` 테이블 기반 (부서코드-양식코드-날짜-순번)
3. **위임 자동 처리** - 결재 요청 시 부재자이면 대결자에게 자동 전달 (`is_delegated=true`)
4. **알림 발송** - 결재 요청/승인/반려 시 알림 테이블 INSERT + 실시간 알림(WebSocket/SSE)
5. **문서 상태 자동 변경** - 마지막 결재자 승인 시 `doc_status=완료` 자동 전환
6. **긴급문서 우선처리** - `is_emergency=true` 문서 우선 정렬

### 인프라

7. **파일 업로드** - S3 또는 MinIO 연동, multipart 처리
8. **서명 이미지 업로드** - S3 저장, URL 반환
9. **페이지네이션** - 모든 목록 API에 Pageable 적용
10. **권한 체크** - 부서 문서함 설정은 인사과만 가능, 문서 접근 권한 검증

---

## 주요 Request/Response 참고

### 문서 기안 Request Body

```json
{
  "formId": 1,
  "docTitle": "결재문서 제목",
  "docData": { "field1": "value1", "field2": "value2" },
  "isEmergency": false,
  "opinion": "기안의견",
  "approvers": [
    { "empId": 1, "lineRole": "결재자", "lineStep": 1 },
    { "empId": 2, "lineRole": "결재자", "lineStep": 2 }
  ],
  "ccList": [
    { "empId": 3, "lineRole": "참조" }
  ],
  "viewers": [
    { "empId": 4, "lineRole": "열람" }
  ],
  "deptFolderId": 1,
  "personalFolderId": null
}
```

### 문서 상세 Response Body

```json
{
  "docId": 1,
  "docNum": "인사-채용-260402-001",
  "docTitle": "2026년 상반기 개발팀 채용요청",
  "docStatus": "진행중",
  "isEmergency": false,
  "createdAt": "2026-04-02T10:00:00",
  "form": {
    "formId": 1,
    "formName": "채용요청",
    "formHtml": "<div>...</div>",
    "folderName": "인사",
    "retentionYear": 5
  },
  "docData": { "field1": "value1" },
  "drafter": {
    "empId": 1,
    "empName": "김인재",
    "deptName": "경영",
    "gradeName": "차장",
    "titleName": "차장"
  },
  "approvalLines": [
    {
      "lineId": 1,
      "empId": 2,
      "empName": "강희계",
      "lineRole": "결재자",
      "lineStep": 1,
      "lineStatus": "승인",
      "lineComment": "승인합니다",
      "isDelegated": false,
      "updatedAt": "2026-04-02T11:00:00"
    }
  ],
  "attachments": [
    {
      "attachId": 1,
      "fileName": "첨부파일.pdf",
      "fileSize": 1024000,
      "fileUrl": "https://..."
    }
  ]
}
```

### 문서 목록 공통 Response

```json
{
  "content": [
    {
      "docId": 1,
      "docTitle": "제목",
      "docNum": "인사-채용-260402-001",
      "docStatus": "진행중",
      "isEmergency": true,
      "formName": "채용요청",
      "drafterName": "김인재",
      "drafterDept": "경영",
      "createdAt": "2026-04-02",
      "hasAttachment": true
    }
  ],
  "page": 0,
  "size": 10,
  "totalElements": 50,
  "totalPages": 5
}
```
