import { useState } from 'react';

interface EvalItem {
  id: number;
  category: string;
  name: string;
  type: '정량' | '정성';
  weight: number;
}

const mockItems: EvalItem[] = [
  { id: 1, category: '업무성과', name: 'KPI달성률', type: '정량', weight: 30 },
  { id: 2, category: '업무성과', name: '프로젝트기여도', type: '정성', weight: 20 },
  { id: 3, category: '역량', name: '직무전문성', type: '정성', weight: 15 },
  { id: 4, category: '역량', name: '문제해결력', type: '정성', weight: 10 },
  { id: 5, category: '조직기여', name: '협업소통', type: '정성', weight: 15 },
  { id: 6, category: '조직기여', name: '리더십', type: '정성', weight: 10 },
];

export default function ItemWeightSetting() {
  const [typeWeights, setTypeWeights] = useState({ self: 20, peer: 30, manager: 50 });
  const [editingTypes, setEditingTypes] = useState(false);
  const [tempWeights, setTempWeights] = useState({ self: 20, peer: 30, manager: 50 });
  const [items, setItems] = useState<EvalItem[]>(mockItems);

  const totalTypeWeight = tempWeights.self + tempWeights.peer + tempWeights.manager;
  const totalItemWeight = items.reduce((s, i) => s + i.weight, 0);

  const handleTypeSave = () => {
    if (totalTypeWeight !== 100) return;
    setTypeWeights(tempWeights);
    setEditingTypes(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › 성과평가 › 평가 설계 › <span className="text-[#1D9E75] font-medium">평가 항목·가중치 설정</span>
      </div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">평가 항목·가중치 설정</h1>
        <p className="text-xs text-gray-400 mt-1">평가 유형별 비중과 항목별 가중치를 설정합니다 (eval-2)</p>
      </div>

      {/* Type weights */}
      <div className="card p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-800">평가 유형별 비중</h2>
          {!editingTypes ? (
            <button
              onClick={() => { setEditingTypes(true); setTempWeights(typeWeights); }}
              className="border border-gray-200 bg-white text-gray-600 px-4 py-2.5 rounded-lg text-sm font-medium hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all"
            >
              수정
            </button>
          ) : (
            <div className="flex gap-2">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${totalTypeWeight === 100 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                합계 {totalTypeWeight}%
              </span>
              <button onClick={handleTypeSave} className="flex items-center gap-1.5 bg-[#1D9E75] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0F6E56] transition-colors">저장</button>
              <button onClick={() => setEditingTypes(false)} className="border border-gray-200 bg-white text-gray-600 px-4 py-2.5 rounded-lg text-sm font-medium hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all">취소</button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: '자기평가', key: 'self' as const, icon: 'fa-user' },
            { label: '동료평가', key: 'peer' as const, icon: 'fa-users' },
            { label: '상위자평가', key: 'manager' as const, icon: 'fa-user-tie' },
          ].map(item => (
            <div key={item.key} className="border border-gray-100 rounded-xl p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-[#1D9E75]/10 flex items-center justify-center mx-auto mb-2">
                <i className={`fas ${item.icon} text-[#1D9E75] text-sm`}></i>
              </div>
              <div className="text-xs text-gray-500 mb-1">{item.label}</div>
              {editingTypes ? (
                <input
                  type="number"
                  value={tempWeights[item.key]}
                  onChange={e => setTempWeights({ ...tempWeights, [item.key]: Number(e.target.value) })}
                  className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-center text-lg font-bold text-[#1D9E75] focus:outline-none focus:border-[#1D9E75]"
                />
              ) : (
                <div className="text-2xl font-bold text-[#1D9E75]">{typeWeights[item.key]}%</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Item weights */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">평가 항목 및 가중치</h2>
            <p className="text-xs text-gray-400 mt-0.5">총 가중치: <span className={totalItemWeight === 100 ? 'text-[#1D9E75] font-semibold' : 'text-red-500 font-semibold'}>{totalItemWeight}%</span></p>
          </div>
          <button className="flex items-center gap-1.5 bg-[#1D9E75] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0F6E56] transition-colors">
            <i className="fas fa-plus"></i>항목 추가
          </button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">카테고리</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">항목명</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">유형</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">가중치</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">관리</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 text-xs text-gray-600">{item.category}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-800">{item.name}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${item.type === '정량' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                    {item.type}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#1D9E75] rounded-full" style={{ width: `${item.weight}%` }}></div>
                    </div>
                    <span className="text-xs font-semibold text-gray-700 w-8">{item.weight}%</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button className="text-xs text-gray-500 hover:text-[#1D9E75] px-2 py-1 rounded border border-gray-100 hover:border-[#1D9E75] transition-all">수정</button>
                    <button className="text-xs text-gray-500 hover:text-red-500 px-2 py-1 rounded border border-gray-100 hover:border-red-200 transition-all">삭제</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
