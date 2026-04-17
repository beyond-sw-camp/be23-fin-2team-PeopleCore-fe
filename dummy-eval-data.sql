-- ============================================================
--  PeopleCore 성과관리 시연용 더미 데이터
--  DB: MySQL (peoplecore)
--  실행 전: 회사(company), 부서(department), 직급(grade-조직),
--           직위(title), 사원(employee)이 이미 있으면 STEP 0~2 건너뛰기
-- ============================================================

-- ────────────────────────────────────────────────────
-- STEP 0. 회사 (이미 있으면 생략)
-- ────────────────────────────────────────────────────
SET @company_id = UUID_TO_BIN('11111111-1111-1111-1111-111111111111');

INSERT IGNORE INTO company
  (company_id, company_name, founded_at, contract_start_at, contract_end_at,
   contract_type, max_employees, company_status, force_password_change)
VALUES
  (@company_id, 'PeopleCore Demo', '2020-01-01', '2026-01-01', '2027-12-31',
   'YEARLY', 100, 'ACTIVE', false);

-- ────────────────────────────────────────────────────
-- STEP 1. 부서 3개 (이미 있으면 생략)
-- ────────────────────────────────────────────────────
INSERT INTO department (company_id, dept_name, dept_code, is_use, created_at)
VALUES
  (@company_id, '개발팀',   'DEV',  'Y', NOW()),
  (@company_id, '마케팅팀', 'MKT',  'Y', NOW()),
  (@company_id, '영업팀',   'SALE', 'Y', NOW())
ON DUPLICATE KEY UPDATE dept_name = VALUES(dept_name);

SET @dept_dev  = (SELECT dept_id FROM department WHERE company_id = @company_id AND dept_code = 'DEV'  LIMIT 1);
SET @dept_mkt  = (SELECT dept_id FROM department WHERE company_id = @company_id AND dept_code = 'MKT'  LIMIT 1);
SET @dept_sale = (SELECT dept_id FROM department WHERE company_id = @company_id AND dept_code = 'SALE' LIMIT 1);

-- ────────────────────────────────────────────────────
-- STEP 2. 직급 (조직 grade 테이블 - EvalGrade와 테이블 공유 주의)
--   ※ EvalGrade와 같은 "grade" 테이블에 들어가므로
--     직급 데이터는 별도 테이블이 있거나 이미 존재하면 생략
--     → 실제 프로젝트에서 grade 테이블에 grade_name 컬럼이 있으면 직급용,
--       emp_id 컬럼이 있으면 평가등급용 row입니다.
-- ────────────────────────────────────────────────────
-- 직급 테이블이 별도로 있다면 (예: org_grade) 아래를 그 테이블명으로 변경
-- 없으면 employee FK가 grade_id를 쓰므로 아래처럼 넣기
-- (Hibernate ddl-auto가 grade 테이블에 두 엔티티 컬럼을 합쳐놓은 상태)

-- 직급 ID 확인용 (이미 있으면 조회만)
SET @grade_s1 = (SELECT grade_id FROM grade WHERE company_id = @company_id AND grade_name = '사원' LIMIT 1);
SET @grade_s2 = (SELECT grade_id FROM grade WHERE company_id = @company_id AND grade_name = '대리' LIMIT 1);
SET @grade_s3 = (SELECT grade_id FROM grade WHERE company_id = @company_id AND grade_name = '과장' LIMIT 1);
SET @grade_s4 = (SELECT grade_id FROM grade WHERE company_id = @company_id AND grade_name = '차장' LIMIT 1);

-- 직급이 없으면 생성
INSERT INTO grade (company_id, grade_name, grade_code, grade_order)
SELECT @company_id, '사원', 'S1', 1 FROM DUAL WHERE @grade_s1 IS NULL;
INSERT INTO grade (company_id, grade_name, grade_code, grade_order)
SELECT @company_id, '대리', 'S2', 2 FROM DUAL WHERE @grade_s2 IS NULL;
INSERT INTO grade (company_id, grade_name, grade_code, grade_order)
SELECT @company_id, '과장', 'S3', 3 FROM DUAL WHERE @grade_s3 IS NULL;
INSERT INTO grade (company_id, grade_name, grade_code, grade_order)
SELECT @company_id, '차장', 'S4', 4 FROM DUAL WHERE @grade_s4 IS NULL;

-- 재조회
SET @grade_s1 = (SELECT grade_id FROM grade WHERE company_id = @company_id AND grade_name = '사원' LIMIT 1);
SET @grade_s2 = (SELECT grade_id FROM grade WHERE company_id = @company_id AND grade_name = '대리' LIMIT 1);
SET @grade_s3 = (SELECT grade_id FROM grade WHERE company_id = @company_id AND grade_name = '과장' LIMIT 1);
SET @grade_s4 = (SELECT grade_id FROM grade WHERE company_id = @company_id AND grade_name = '차장' LIMIT 1);


-- ────────────────────────────────────────────────────
-- STEP 3. 사원 15명 (이미 있으면 생략)
--   비밀번호: BCrypt('1234')
-- ────────────────────────────────────────────────────
SET @pw = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'; -- '1234'

INSERT IGNORE INTO employee
  (company_id, dept_id, grade_id, emp_name, emp_email, emp_phone, emp_num,
   emp_hire_date, emp_type, emp_status, emp_password, emp_role,
   dependents_count, tax_rate_option, retirement_type, must_change_password)
VALUES
-- ── 개발팀 (5명) ──
(@company_id, @dept_dev, @grade_s3, '김태현', 'kim.th@demo.com',  '010-1111-0001', 'EMP001', '2020-03-01', 'FULL_TIME', 'ACTIVE', @pw, 'EMPLOYEE', 1, 100, 'DC', false),
(@company_id, @dept_dev, @grade_s2, '이수진', 'lee.sj@demo.com',  '010-1111-0002', 'EMP002', '2021-06-15', 'FULL_TIME', 'ACTIVE', @pw, 'EMPLOYEE', 1, 100, 'DC', false),
(@company_id, @dept_dev, @grade_s1, '박지훈', 'park.jh@demo.com', '010-1111-0003', 'EMP003', '2022-01-10', 'FULL_TIME', 'ACTIVE', @pw, 'EMPLOYEE', 1, 100, 'DC', false),
(@company_id, @dept_dev, @grade_s2, '최유리', 'choi.yr@demo.com', '010-1111-0004', 'EMP004', '2021-09-01', 'FULL_TIME', 'ACTIVE', @pw, 'EMPLOYEE', 1, 100, 'DC', false),
(@company_id, @dept_dev, @grade_s1, '정민서', 'jung.ms@demo.com', '010-1111-0005', 'EMP005', '2023-03-01', 'FULL_TIME', 'ACTIVE', @pw, 'EMPLOYEE', 1, 100, 'DC', false),

-- ── 마케팅팀 (5명) ──
(@company_id, @dept_mkt, @grade_s4, '한예진', 'han.yj@demo.com',  '010-2222-0001', 'EMP006', '2018-05-01', 'FULL_TIME', 'ACTIVE', @pw, 'EMPLOYEE', 1, 100, 'DC', false),
(@company_id, @dept_mkt, @grade_s2, '오승현', 'oh.sh@demo.com',   '010-2222-0002', 'EMP007', '2020-11-01', 'FULL_TIME', 'ACTIVE', @pw, 'EMPLOYEE', 1, 100, 'DC', false),
(@company_id, @dept_mkt, @grade_s1, '서다은', 'seo.de@demo.com',  '010-2222-0003', 'EMP008', '2022-07-01', 'FULL_TIME', 'ACTIVE', @pw, 'EMPLOYEE', 1, 100, 'DC', false),
(@company_id, @dept_mkt, @grade_s3, '윤재호', 'yoon.jh@demo.com', '010-2222-0004', 'EMP009', '2019-02-01', 'FULL_TIME', 'ACTIVE', @pw, 'EMPLOYEE', 1, 100, 'DC', false),
(@company_id, @dept_mkt, @grade_s2, '임소율', 'lim.sy@demo.com',  '010-2222-0005', 'EMP010', '2021-04-01', 'FULL_TIME', 'ACTIVE', @pw, 'EMPLOYEE', 1, 100, 'DC', false),

-- ── 영업팀 (5명) ──
(@company_id, @dept_sale, @grade_s3, '강도윤', 'kang.dy@demo.com', '010-3333-0001', 'EMP011', '2019-08-01', 'FULL_TIME', 'ACTIVE', @pw, 'EMPLOYEE', 1, 100, 'DC', false),
(@company_id, @dept_sale, @grade_s2, '조하린', 'cho.hr@demo.com',  '010-3333-0002', 'EMP012', '2020-12-01', 'FULL_TIME', 'ACTIVE', @pw, 'EMPLOYEE', 1, 100, 'DC', false),
(@company_id, @dept_sale, @grade_s1, '배준혁', 'bae.jh@demo.com',  '010-3333-0003', 'EMP013', '2023-01-15', 'FULL_TIME', 'ACTIVE', @pw, 'EMPLOYEE', 1, 100, 'DC', false),
(@company_id, @dept_sale, @grade_s4, '송이서', 'song.es@demo.com', '010-3333-0004', 'EMP014', '2017-04-01', 'FULL_TIME', 'ACTIVE', @pw, 'EMPLOYEE', 1, 100, 'DC', false),
(@company_id, @dept_sale, @grade_s1, '남지우', 'nam.jw@demo.com',  '010-3333-0005', 'EMP015', '2024-02-01', 'FULL_TIME', 'ACTIVE', @pw, 'EMPLOYEE', 1, 100, 'DC', false);

-- 사원 ID 조회
SET @emp01 = (SELECT emp_id FROM employee WHERE emp_num = 'EMP001' AND company_id = @company_id LIMIT 1);
SET @emp02 = (SELECT emp_id FROM employee WHERE emp_num = 'EMP002' AND company_id = @company_id LIMIT 1);
SET @emp03 = (SELECT emp_id FROM employee WHERE emp_num = 'EMP003' AND company_id = @company_id LIMIT 1);
SET @emp04 = (SELECT emp_id FROM employee WHERE emp_num = 'EMP004' AND company_id = @company_id LIMIT 1);
SET @emp05 = (SELECT emp_id FROM employee WHERE emp_num = 'EMP005' AND company_id = @company_id LIMIT 1);
SET @emp06 = (SELECT emp_id FROM employee WHERE emp_num = 'EMP006' AND company_id = @company_id LIMIT 1);
SET @emp07 = (SELECT emp_id FROM employee WHERE emp_num = 'EMP007' AND company_id = @company_id LIMIT 1);
SET @emp08 = (SELECT emp_id FROM employee WHERE emp_num = 'EMP008' AND company_id = @company_id LIMIT 1);
SET @emp09 = (SELECT emp_id FROM employee WHERE emp_num = 'EMP009' AND company_id = @company_id LIMIT 1);
SET @emp10 = (SELECT emp_id FROM employee WHERE emp_num = 'EMP010' AND company_id = @company_id LIMIT 1);
SET @emp11 = (SELECT emp_id FROM employee WHERE emp_num = 'EMP011' AND company_id = @company_id LIMIT 1);
SET @emp12 = (SELECT emp_id FROM employee WHERE emp_num = 'EMP012' AND company_id = @company_id LIMIT 1);
SET @emp13 = (SELECT emp_id FROM employee WHERE emp_num = 'EMP013' AND company_id = @company_id LIMIT 1);
SET @emp14 = (SELECT emp_id FROM employee WHERE emp_num = 'EMP014' AND company_id = @company_id LIMIT 1);
SET @emp15 = (SELECT emp_id FROM employee WHERE emp_num = 'EMP015' AND company_id = @company_id LIMIT 1);


-- ============================================================
-- STEP 4. 평가 시즌 (OPEN 상태)
-- ============================================================
INSERT INTO season
  (company_id, name, period, start_date, end_date, status, created_at, updated_at)
VALUES
  (@company_id, '2026년 상반기 성과평가', '상반기', '2026-01-01', '2026-06-30', 'OPEN', NOW(), NOW());

SET @season_id = LAST_INSERT_ID();


-- ============================================================
-- STEP 5. 단계 5개 (목표등록~상위자평가: FINISHED, 등급산정: IN_PROGRESS)
-- ============================================================
INSERT INTO stage (season_id, name, order_no, start_date, end_date, status, created_at, updated_at)
VALUES
  (@season_id, '목표등록',           1, '2026-01-01', '2026-02-14', 'FINISHED',    NOW(), NOW()),
  (@season_id, '자기평가',           2, '2026-02-15', '2026-03-15', 'FINISHED',    NOW(), NOW()),
  (@season_id, '상위자평가',         3, '2026-03-16', '2026-04-05', 'FINISHED',    NOW(), NOW()),
  (@season_id, '등급 산정 및 보정',  4, '2026-04-06', '2026-04-25', 'IN_PROGRESS', NOW(), NOW()),
  (@season_id, '결과확정',           5, '2026-04-26', '2026-05-10', 'WAITING',     NOW(), NOW());


-- ============================================================
-- STEP 6. 평가 규칙 (formValues + formSnapshot 동결)
--   - 자기평가 30% + 상위자평가 70%
--   - 등급: S(10%), A(20%), B(40%), C(20%), D(10%)
--   - 편향보정 ON, weight=1.0, minTeamSize=5
-- ============================================================
SET @form_json = '{
  "items": [
    {"id": "self",    "name": "자기평가",   "weight": 30, "locked": true, "enabled": true},
    {"id": "manager", "name": "상위자평가", "weight": 70, "locked": true, "enabled": true}
  ],
  "grades": [
    {"id": "g1", "label": "S", "ratio": 10, "color": "#2563EB"},
    {"id": "g2", "label": "A", "ratio": 20, "color": "#16A34A"},
    {"id": "g3", "label": "B", "ratio": 40, "color": "#CA8A04"},
    {"id": "g4", "label": "C", "ratio": 20, "color": "#EA580C"},
    {"id": "g5", "label": "D", "ratio": 10, "color": "#DC2626"}
  ],
  "adjustments": [
    {"id": "adj1", "name": "지각",     "points": -2, "enabled": true},
    {"id": "adj2", "name": "무단결근", "points": -5, "enabled": true}
  ],
  "rawScoreTable": [
    {"gradeId": "g1", "rawScore": 95},
    {"gradeId": "g2", "rawScore": 85},
    {"gradeId": "g3", "rawScore": 75},
    {"gradeId": "g4", "rawScore": 65},
    {"gradeId": "g5", "rawScore": 50}
  ],
  "kpiScoring": {
    "cap": 120,
    "scaleTo": 100,
    "maintainTolerance": 5,
    "underperformanceThreshold": 80,
    "underperformanceFactor": 0.8
  },
  "taskGradeWeights": {"상": 3, "중": 2, "하": 1},
  "useBiasAdjustment": true,
  "biasWeight": 1.0,
  "minTeamSize": 5
}';

INSERT INTO evaluation_rules
  (season_id, task_weight_sang, task_weight_jung, task_weight_ha,
   use_bias_adjustment, bias_weight, min_team_size,
   form_values, form_snapshot, form_version, created_at, updated_at)
VALUES
  (@season_id, 3, 2, 1,
   true, 1.00, 5,
   @form_json, @form_json, 1, NOW(), NOW());


-- ============================================================
-- STEP 7. EvalGrade - 15명 평가 등급 데이터
--
--  ★ 핵심: aggregateScoreByItem()이 TODO라 calculateGrades가 동작하지 않으므로
--    selfScore, managerScore, weightedScore, adjustmentScore, totalScore를
--    미리 채워넣습니다.
--
--  ★ 데모 시나리오별 사용법:
--    A) "등급 자동산정 목록 조회"만 보여줄 때
--       → 아래 데이터 그대로 사용 (totalScore + autoGrade 표시됨)
--
--    B) "편향보정 → 강제배분" 파이프라인 시연
--       → autoGrade/biasAdjustedScore/rankInSeason 컬럼을 NULL로 두고
--         applyBiasAdjustment → applyDistribution API 호출
--
--    C) "보정(Calibration)" 시연
--       → autoGrade까지 채운 상태에서 batchSaveCalibration API 호출
--
--  현재 데이터: 모든 점수 + autoGrade까지 채워진 상태 (시나리오 A, C용)
--  시나리오 B 원하면 맨 아래 UPDATE문 실행
-- ============================================================

-- grade 테이블에 EvalGrade 데이터 삽입
-- (grade 테이블이 직급/평가등급 공유 → emp_id가 있는 row = 평가등급)
INSERT INTO grade
  (emp_id, season_id,
   self_score, manager_score, manager_score_adjusted,
   weighted_score, adjustment_score, total_score,
   bias_adjusted_score, rank_in_season, auto_grade, final_grade,
   is_calibrated, locked_at,
   team_avg, team_std_dev, company_avg, company_std_dev,
   rank_in_team, team_size,
   dept_id_snapshot, dept_name_snapshot, position_snapshot,
   created_at, updated_at)
VALUES
-- ═══ 개발팀 (5명) ═══
-- 1. 김태현 (과장) - 우수 성과자
(@emp01, @season_id, 88.00, 92.00, 91.50, 90.80, -2.00, 88.80, 88.80, 1,  'S', NULL, false, NULL,
 82.40, 7.23, 78.50, 9.12, 1, 5, @dept_dev, '개발팀', '과장', NOW(), NOW()),

-- 2. 이수진 (대리) - 상위 성과자
(@emp02, @season_id, 82.00, 86.00, 85.80, 84.80, 0.00, 84.80, 84.80, 3, 'A', NULL, false, NULL,
 82.40, 7.23, 78.50, 9.12, 2, 5, @dept_dev, '개발팀', '대리', NOW(), NOW()),

-- 3. 박지훈 (사원) - 중간
(@emp03, @season_id, 75.00, 78.00, 77.50, 77.10, 0.00, 77.10, 77.10, 7, 'B', NULL, false, NULL,
 82.40, 7.23, 78.50, 9.12, 3, 5, @dept_dev, '개발팀', '사원', NOW(), NOW()),

-- 4. 최유리 (대리) - 중간
(@emp04, @season_id, 70.00, 80.00, 79.50, 77.00, 0.00, 77.00, 77.00, 8, 'B', NULL, false, NULL,
 82.40, 7.23, 78.50, 9.12, 4, 5, @dept_dev, '개발팀', '대리', NOW(), NOW()),

-- 5. 정민서 (사원) - 하위
(@emp05, @season_id, 65.00, 70.00, 70.20, 68.50, -5.00, 63.50, 63.50, 14, 'D', NULL, false, NULL,
 82.40, 7.23, 78.50, 9.12, 5, 5, @dept_dev, '개발팀', '사원', NOW(), NOW()),

-- ═══ 마케팅팀 (5명) ═══
-- 6. 한예진 (차장) - 상위
(@emp06, @season_id, 85.00, 90.00, 89.30, 88.50, 0.00, 88.50, 88.50, 2, 'S', NULL, false, NULL,
 80.80, 6.50, 78.50, 9.12, 1, 5, @dept_mkt, '마케팅팀', '차장', NOW(), NOW()),

-- 7. 오승현 (대리) - 상위
(@emp07, @season_id, 80.00, 84.00, 83.50, 82.80, 0.00, 82.80, 82.80, 4, 'A', NULL, false, NULL,
 80.80, 6.50, 78.50, 9.12, 2, 5, @dept_mkt, '마케팅팀', '대리', NOW(), NOW()),

-- 8. 서다은 (사원) - 중간
(@emp08, @season_id, 78.00, 76.00, 76.50, 76.60, 0.00, 76.60, 76.60, 9, 'B', NULL, false, NULL,
 80.80, 6.50, 78.50, 9.12, 3, 5, @dept_mkt, '마케팅팀', '사원', NOW(), NOW()),

-- 9. 윤재호 (과장) - 중간
(@emp09, @season_id, 73.00, 79.00, 78.80, 77.20, -2.00, 75.20, 75.20, 10, 'B', NULL, false, NULL,
 80.80, 6.50, 78.50, 9.12, 4, 5, @dept_mkt, '마케팅팀', '과장', NOW(), NOW()),

-- 10. 임소율 (대리) - 하위
(@emp10, @season_id, 68.00, 72.00, 72.30, 70.80, 0.00, 70.80, 70.80, 12, 'C', NULL, false, NULL,
 80.80, 6.50, 78.50, 9.12, 5, 5, @dept_mkt, '마케팅팀', '대리', NOW(), NOW()),

-- ═══ 영업팀 (5명) ═══
-- 11. 강도윤 (과장) - 상위
(@emp11, @season_id, 83.00, 87.00, 86.50, 85.80, 0.00, 85.80, 85.80, 5, 'A', NULL, false, NULL,
 79.20, 7.80, 78.50, 9.12, 1, 5, @dept_sale, '영업팀', '과장', NOW(), NOW()),

-- 12. 조하린 (대리) - 중간
(@emp12, @season_id, 76.00, 81.00, 80.50, 79.50, 0.00, 79.50, 79.50, 6, 'B', NULL, false, NULL,
 79.20, 7.80, 78.50, 9.12, 2, 5, @dept_sale, '영업팀', '대리', NOW(), NOW()),

-- 13. 배준혁 (사원) - 중간~하위
(@emp13, @season_id, 72.00, 74.00, 74.20, 73.40, 0.00, 73.40, 73.40, 11, 'C', NULL, false, NULL,
 79.20, 7.80, 78.50, 9.12, 3, 5, @dept_sale, '영업팀', '사원', NOW(), NOW()),

-- 14. 송이서 (차장) - 하위
(@emp14, @season_id, 69.00, 71.00, 71.50, 70.40, 0.00, 70.40, 70.40, 13, 'C', NULL, false, NULL,
 79.20, 7.80, 78.50, 9.12, 4, 5, @dept_sale, '영업팀', '차장', NOW(), NOW()),

-- 15. 남지우 (사원) - 최하위
(@emp15, @season_id, 60.00, 65.00, 65.80, 63.50, -2.00, 61.50, 61.50, 15, 'D', NULL, false, NULL,
 79.20, 7.80, 78.50, 9.12, 5, 5, @dept_sale, '영업팀', '사원', NOW(), NOW());


-- ============================================================
-- STEP 8. 보정 이력 샘플 2건 (Calibration 시연용)
-- ============================================================
-- 송이서: C → B로 보정 (영업 실적 미반영 사유)
SET @grade_emp14 = (SELECT grade_id FROM grade WHERE emp_id = @emp14 AND season_id = @season_id LIMIT 1);
-- HR담당자 = 김태현 (시연용으로 아무나 지정)

INSERT INTO calibration
  (grade_id, from_grade, to_grade, reason, actor_id, created_at, updated_at)
VALUES
  (@grade_emp14, 'C', 'B', '하반기 대형 계약 실적이 점수에 미반영됨. 영업 실적 가산 적용', @emp01, NOW(), NOW());

-- 송이서 EvalGrade에 보정 반영
UPDATE grade
SET auto_grade = 'B', is_calibrated = true
WHERE grade_id = @grade_emp14;

-- 임소율: C → B로 보정
SET @grade_emp10 = (SELECT grade_id FROM grade WHERE emp_id = @emp10 AND season_id = @season_id LIMIT 1);

INSERT INTO calibration
  (grade_id, from_grade, to_grade, reason, actor_id, created_at, updated_at)
VALUES
  (@grade_emp10, 'C', 'B', '마케팅 캠페인 ROI 기여도 추가 반영', @emp01, NOW(), NOW());

UPDATE grade
SET auto_grade = 'B', is_calibrated = true
WHERE grade_id = @grade_emp10;


-- ============================================================
-- [선택] 시나리오 B: 편향보정 → 강제배분 파이프라인 시연 시
-- 아래 UPDATE를 실행하면 점수만 남고 autoGrade/biasAdjustedScore가 초기화됩니다.
-- applyBiasAdjustment → applyDistribution API를 순서대로 호출하여 시연하세요.
-- ============================================================
/*
UPDATE grade
SET
  manager_score_adjusted = NULL,
  bias_adjusted_score = NULL,
  auto_grade = NULL,
  rank_in_season = NULL,
  is_calibrated = false,
  team_avg = NULL,
  team_std_dev = NULL,
  company_avg = NULL,
  company_std_dev = NULL,
  rank_in_team = NULL,
  team_size = NULL
WHERE season_id = @season_id AND emp_id IS NOT NULL;

-- 보정 이력도 삭제
DELETE FROM calibration WHERE grade_id IN (
  SELECT grade_id FROM grade WHERE season_id = @season_id AND emp_id IS NOT NULL
);
*/


-- ============================================================
-- 최종 등급 분포 확인
-- ============================================================
SELECT
  auto_grade AS '등급',
  COUNT(*) AS '인원수',
  ROUND(COUNT(*) * 100.0 / 15, 1) AS '비율(%)',
  GROUP_CONCAT(dept_name_snapshot, '-', position_snapshot ORDER BY total_score DESC) AS '사원목록'
FROM grade
WHERE season_id = @season_id AND emp_id IS NOT NULL
GROUP BY auto_grade
ORDER BY FIELD(auto_grade, 'S', 'A', 'B', 'C', 'D');

-- ============================================================
-- 데이터 요약
-- ============================================================
-- 시즌: 2026년 상반기 성과평가 (OPEN)
-- 단계: 목표등록~상위자평가 완료, 등급산정 진행중, 결과확정 대기
-- 규칙: 자기평가30% + 상위자평가70%, S/A/B/C/D (10/20/40/20/10%)
-- 인원: 15명 (개발5 / 마케팅5 / 영업5)
--
-- 등급 분포 (보정 전 기준):
--   S: 2명 (13.3%) - 김태현, 한예진
--   A: 3명 (20.0%) - 이수진, 오승현, 강도윤
--   B: 4명 (26.7%) - 박지훈, 최유리, 서다은, 윤재호 → 목표 6명(40%)
--   C: 3명 (20.0%) - 임소율, 배준혁, 송이서 → 목표 3명(20%)
--   D: 2명 (13.3%) - 정민서, 남지우 → 목표 1~2명(10%)
--
-- 보정 샘플: 송이서 C→B, 임소율 C→B (보정 후 B=6명으로 목표 일치)
--
-- ★ 주의: "등급 재산정" 버튼 클릭 시 calculateGrades()가
--   aggregateScoreByItem() TODO로 인해 전체 점수를 NULL로 초기화합니다.
--   시연 시 재산정 버튼은 누르지 마세요!
