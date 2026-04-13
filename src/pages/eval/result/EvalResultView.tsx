import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { personResults, gradeColors } from './resultData';
import Pagination from '../../../components/Pagination';

const seasons = ['2024년 상반기 정기평가', '2023년 하반기 정기평가', '2024년 하반기 정기평가'];
const RESULT_PAGE_SIZE = 10;

export default function EvalResultView() {
  const navigate = useNavigate();
  const [selectedSeason, setSelectedSeason] = useState(seasons[0]);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('전체');

  const filteredPerson = personResults.filter(e => {
    if (deptFilter !== '전체' && e.dept !== deptFilter) return false;
    if (search && !e.name.includes(search) && !e.id.includes(search)) return false;
    return true;
  });

  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [search, deptFilter, selectedSeason]);
  const pagedPerson = filteredPerson.slice((page - 1) * RESULT_PAGE_SIZE, page * RESULT_PAGE_SIZE);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › 성과평가 › 평가 결과 처리 › <span className="text-[#1D9E75] font-medium">평가 결과 조회</span>
      </div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">평가 결과 조회</h1>
          <p className="text-xs text-gray-400 mt-1">최종 확정된 평가 결과를 조회합니다.</p>
        </div>
        <select value={selectedSeason} onChange={e => setSelectedSeason(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1D9E75]">
          {seasons.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 flex-1">
          <i className="fas fa-search text-gray-400 text-xs"></i>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="이름/사번 검색" className="flex-1 text-sm focus:outline-none" />
        </div>
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1D9E75]">
          {['전체', '개발팀', '인사팀', '마케팅팀', '영업팀', '재무팀', '경영지원팀'].map(d => <option key={d}>{d}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">사번</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">성명</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">부서</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">직급</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">종합</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">예정등급</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">확정등급</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">보정</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs w-24">상세</th>
              </tr>
            </thead>
            <tbody>
              {pagedPerson.map(e => (
                <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 text-xs text-gray-500">{e.id}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{e.name}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{e.dept}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{e.rank}</td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-800">{e.totalScore ?? '-'}</td>
                  <td className="px-4 py-3">
                    {e.autoGrade ? (
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${gradeColors[e.autoGrade]}`}>{e.autoGrade}</span>
                    ) : <span className="text-xs text-gray-400">미산정</span>}
                  </td>
                  <td className="px-4 py-3">
                    {e.finalGrade ? (
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${gradeColors[e.finalGrade]}`}>{e.finalGrade}</span>
                    ) : <span className="text-xs text-gray-400">미산정</span>}
                  </td>
                  <td className="px-4 py-3">
                    {e.isCalibrated ? (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full">보정</span>
                    ) : <span className="text-xs text-gray-300">-</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {e.detail ? (
                      <button
                        onClick={() => navigate(`/eval/result/view/${e.id}`)}
                        className="text-[11px] px-3 py-1 border border-[#1D9E75] text-[#1D9E75] rounded-md hover:bg-[#f2faf6]"
                      >
                        상세 보기
                      </button>
                    ) : <span className="text-[11px] text-gray-300">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      <Pagination
        page={page}
        total={filteredPerson.length}
        pageSize={RESULT_PAGE_SIZE}
        onChange={setPage}
      />
    </div>
  );
}
