/* ── 결재양식 HTML 템플릿 (추후 DB에서 조회) ── */

export const FORM_HTML: Record<string, string> = {
  채용요청: `
<h2 class="form-title">인원 채용 요청</h2>
<table class="form-table">
  <tr>
    <td class="form-label">채용사유</td>
    <td>
      <label><input type="radio" name="hire_reason" value="신규충원" checked> 신규충원</label>
      <label><input type="radio" name="hire_reason" value="조직개편"> 조직개편</label>
      <label><input type="radio" name="hire_reason" value="신규사업"> 신규사업</label>
      <label><input type="radio" name="hire_reason" value="단기작업"> 단기작업</label>
      <label><input type="radio" name="hire_reason" value="결원발생"> 결원발생</label>
      <input type="text" name="hire_reason_etc" style="width:120px; display:inline-block;">
    </td>
  </tr>
  <tr>
    <td class="form-label">채용구분</td>
    <td>
      <label><input type="radio" name="hire_type" value="정규직" checked> 정규직</label>
      <label><input type="radio" name="hire_type" value="계약직"> 계약직</label>
      <label><input type="radio" name="hire_type" value="파견직"> 파견직</label>
      <label><input type="radio" name="hire_type" value="아르바이트"> 아르바이트</label>
    </td>
  </tr>
  <tr>
    <td class="form-label">근무기간</td>
    <td>
      <input type="date" name="work_start" style="width:auto; display:inline-block;">
      <span> - </span>
      <input type="date" name="work_end" style="width:auto; display:inline-block;">
    </td>
  </tr>
  <tr>
    <td class="form-group-label" rowspan="6">인력사항</td>
    <td>
      <table class="form-table" style="margin:-8px -12px; width:calc(100% + 24px);">
        <tr>
          <td class="form-sub-label">경력</td>
          <td>
            <label><input type="radio" name="career" value="신입" checked> 신입</label>
            <label><input type="radio" name="career" value="경력"> 경력</label>
            <label><input type="radio" name="career" value="무관"> 무관</label>
          </td>
        </tr>
        <tr>
          <td class="form-sub-label">성별</td>
          <td>
            <label><input type="radio" name="gender" value="남" checked> 남</label>
            <label><input type="radio" name="gender" value="여"> 여</label>
            <label><input type="radio" name="gender" value="무관"> 무관</label>
          </td>
        </tr>
        <tr>
          <td class="form-sub-label">직책</td>
          <td><input type="text" name="job_title"></td>
        </tr>
        <tr>
          <td class="form-sub-label">직급</td>
          <td><input type="text" name="job_rank"></td>
        </tr>
        <tr>
          <td class="form-sub-label">직무</td>
          <td><input type="text" name="job_duty"></td>
        </tr>
        <tr>
          <td class="form-sub-label">담당업무</td>
          <td><input type="text" name="job_task"></td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td class="form-group-label" rowspan="5">자격요건 및<br>우대사항</td>
    <td>
      <table class="form-table" style="margin:-8px -12px; width:calc(100% + 24px);">
        <tr>
          <td class="form-sub-label">학력</td>
          <td><input type="text" name="education"></td>
        </tr>
        <tr>
          <td class="form-sub-label">전공</td>
          <td><input type="text" name="major"></td>
        </tr>
        <tr>
          <td class="form-sub-label">필요경력</td>
          <td><input type="text" name="required_exp"></td>
        </tr>
        <tr>
          <td class="form-sub-label">자격사항</td>
          <td><input type="text" name="qualification"></td>
        </tr>
        <tr>
          <td class="form-sub-label">우대사항</td>
          <td><input type="text" name="preferred"></td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td class="form-label">기타</td>
    <td><input type="text" name="etc"></td>
  </tr>
</table>`,

  휴가신청: `
<h2 class="form-title">휴가 신청서</h2>
<table class="form-table">
  <tr>
    <td class="form-label">휴가종류</td>
    <td>
      <label><input type="radio" name="leave_type" value="연차" checked> 연차</label>
      <label><input type="radio" name="leave_type" value="반차(오전)"> 반차(오전)</label>
      <label><input type="radio" name="leave_type" value="반차(오후)"> 반차(오후)</label>
      <label><input type="radio" name="leave_type" value="병가"> 병가</label>
      <label><input type="radio" name="leave_type" value="경조"> 경조</label>
      <label><input type="radio" name="leave_type" value="기타"> 기타</label>
    </td>
  </tr>
  <tr>
    <td class="form-label">휴가 시작일</td>
    <td><input type="date" name="start_date"></td>
  </tr>
  <tr>
    <td class="form-label">휴가 종료일</td>
    <td><input type="date" name="end_date"></td>
  </tr>
  <tr>
    <td class="form-label">사용일수</td>
    <td><input type="number" name="use_days" style="width:80px; display:inline-block;"> 일</td>
  </tr>
  <tr>
    <td class="form-label">잔여연차</td>
    <td><input type="number" name="remaining_days" style="width:80px; display:inline-block;" readonly> 일</td>
  </tr>
  <tr>
    <td class="form-label">사유</td>
    <td><textarea name="reason" rows="4"></textarea></td>
  </tr>
  <tr>
    <td class="form-label">비상연락처</td>
    <td><input type="text" name="emergency_contact"></td>
  </tr>
</table>`,

  해외출장신청: `
<h2 class="form-title">해외 출장 신청서</h2>
<table class="form-table">
  <tr>
    <td class="form-label">출장목적</td>
    <td><input type="text" name="purpose"></td>
  </tr>
  <tr>
    <td class="form-label">출장지</td>
    <td><input type="text" name="destination"></td>
  </tr>
  <tr>
    <td class="form-label">출장 시작일</td>
    <td><input type="date" name="start_date"></td>
  </tr>
  <tr>
    <td class="form-label">출장 종료일</td>
    <td><input type="date" name="end_date"></td>
  </tr>
  <tr>
    <td class="form-label">동행자</td>
    <td><input type="text" name="companions"></td>
  </tr>
  <tr>
    <td class="form-label">예상경비</td>
    <td><input type="text" name="estimated_cost"> </td>
  </tr>
  <tr>
    <td class="form-label">세부일정</td>
    <td><textarea name="schedule" rows="5"></textarea></td>
  </tr>
  <tr>
    <td class="form-label">비고</td>
    <td><textarea name="note" rows="3"></textarea></td>
  </tr>
</table>`,

  지출결의: `
<h2 class="form-title">지출 결의서</h2>
<table class="form-table">
  <tr>
    <td class="form-label">지출일자</td>
    <td><input type="date" name="expense_date"></td>
  </tr>
  <tr>
    <td class="form-label">지출구분</td>
    <td>
      <label><input type="radio" name="expense_type" value="업무추진비" checked> 업무추진비</label>
      <label><input type="radio" name="expense_type" value="여비교통비"> 여비교통비</label>
      <label><input type="radio" name="expense_type" value="소모품비"> 소모품비</label>
      <label><input type="radio" name="expense_type" value="기타"> 기타</label>
    </td>
  </tr>
  <tr>
    <td class="form-label">금액</td>
    <td><input type="text" name="amount"> 원</td>
  </tr>
  <tr>
    <td class="form-label">거래처</td>
    <td><input type="text" name="vendor"></td>
  </tr>
  <tr>
    <td class="form-label">적요</td>
    <td><textarea name="description" rows="4"></textarea></td>
  </tr>
  <tr>
    <td class="form-label">비고</td>
    <td><textarea name="note" rows="2"></textarea></td>
  </tr>
</table>`,
}

/* 등록되지 않은 양식용 기본 템플릿 */
export function getFormHtml(formName: string): string {
  return FORM_HTML[formName] ?? `
<h2 class="form-title">${formName}</h2>
<table class="form-table">
  <tr>
    <td class="form-label">제목</td>
    <td><input type="text" name="title" placeholder="제목을 입력하세요"></td>
  </tr>
  <tr>
    <td class="form-label" style="vertical-align:top;">내용</td>
    <td><textarea name="content" rows="14" placeholder="내용을 입력하세요"></textarea></td>
  </tr>
</table>`
}
