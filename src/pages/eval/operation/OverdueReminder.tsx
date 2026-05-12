import { useState } from 'react';

interface PendingSubmitter {
  id: string;
  name: string;
  dept: string;
  lastActivity: string;
}

interface ReminderLog {
  date: string;
  targetCount: number;
  channel: string;
  sender: string;
}

const selfPending: PendingSubmitter[] = [
  { id: '26040003', name: '박지훈', dept: '마케팅팀', lastActivity: '미접속' },
  { id: '26040006', name: '한승우', dept: '개발팀', lastActivity: '2024-06-08 접속' },
];

const peerPending: PendingSubmitter[] = [
  { id: '26040003', name: '박지훈', dept: '마케팅팀', lastActivity: '미접속' },
  { id: '26040004', name: '최유진', dept: '영업팀', lastActivity: '2024-06-10 접속' },
  { id: '26040005', name: '정하은', dept: '재무팀', lastActivity: '2024-06-09 접속' },
  { id: '26040006', name: '한승우', dept: '개발팀', lastActivity: '미접속' },
  { id: '26040007', name: '오나영', dept: '경영지원팀', lastActivity: '2024-06-11 접속' },
];

const managerPending: PendingSubmitter[] = [
  { id: '26040001', name: '김민수', dept: '개발팀', lastActivity: '미접속' },
  { id: '26040002', name: '이서연', dept: '인사팀', lastActivity: '2024-06-10 접속' },
  { id: '26040003', name: '박지훈', dept: '마케팅팀', lastActivity: '미접속' },
  { id: '26040004', name: '최유진', dept: '영업팀', lastActivity: '미접속' },
  { id: '26040005', name: '정하은', dept: '재무팀', lastActivity: '2024-06-09 접속' },
  { id: '26040006', name: '한승우', dept: '개발팀', lastActivity: '미접속' },
  { id: '26040007', name: '오나영', dept: '경영지원팀', lastActivity: '미접속' },
];

const mockLogs: ReminderLog[] = [
  { date: '2024-06-11 10:00', targetCount: 5, channel: '시스템알림, 이메일', sender: '이서연' },
  { date: '2024-06-09 09:00', targetCount: 8, channel: '시스템알림', sender: '이서연' },
  { date: '2024-06-07 14:00', targetCount: 3, channel: '이메일, SMS', sender: '이서연' },
];

export default function OverdueReminder() {
  const [activeTab, setActiveTab] = useState<'self' | 'peer' | 'manager'>('self');
  const [channels, setChannels] = useState({ system: true, email: true, sms: false });

  const pendingMap = { self: selfPending, peer: peerPending, manager: managerPending };
  const labelMap = { self: '자기평가', peer: '동료평가', manager: '상위자평가' };
  const pending = pendingMap[activeTab];

  const avatarColor = (name: string) => {
    const colors = ['bg-[#1D9E75]', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-red-500'];
    return colors[name.charCodeAt(0) % colors.length];
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › 성과평가 › 평가 운영 › <span className="text-[#1D9E75] font-medium">미제출자 독촉 알림</span>
      </div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">미제출자 독촉 알림</h1>
        <p className="text-xs text-gray-400 mt-1">평가 미제출자에게 독촉 알림을 발송합니다 (eval-10)</p>
      </div>

      {/* Season/deadline info */}
      <div className="card p-4 mb-5 flex items-center gap-6">
        <div>
          <div className="text-xs text-gray-400">평가 시즌</div>
          <div className="text-sm font-semibold text-gray-800">2024년 상반기 정기평가</div>
        </div>
        <div>
          <div className="text-xs text-gray-400">자기평가 마감</div>
          <div className="text-sm font-semibold text-red-500">2024-06-15 (D-4)</div>
        </div>
        <div>
          <div className="text-xs text-gray-400">동료평가 마감</div>
          <div className="text-sm font-semibold text-orange-500">2024-06-17 (D-6)</div>
        </div>
        <div>
          <div className="text-xs text-gray-400">상위자평가 마감</div>
          <div className="text-sm font-semibold text-gray-600">2024-06-25 (D-14)</div>
        </div>
      </div>

      {/* Stage tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-lg p-1 w-fit">
        {(['self', 'peer', 'manager'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab ? 'bg-white text-[#1D9E75] shadow-sm' : 'text-gray-500'}`}
          >
            {labelMap[tab]}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${activeTab === tab ? 'bg-[#1D9E75] text-white' : 'bg-gray-300 text-gray-600'}`}>
              {pendingMap[tab].length}
            </span>
          </button>
        ))}
      </div>

      {/* Summary + bulk action */}
      <div className="card p-5 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-semibold text-gray-800">미제출자 {pending.length}명</span>
            <span className="text-xs text-gray-400 ml-2">/ 마감까지 D-4</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-3">
              {([{ key: 'system', label: '시스템' }, { key: 'email', label: '이메일' }, { key: 'sms', label: 'SMS' }] as const).map(c => (
                <label key={c.key} className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={channels[c.key]} onChange={e => setChannels({ ...channels, [c.key]: e.target.checked })} className="accent-[#1D9E75]" />
                  <span className="text-xs text-gray-600">{c.label}</span>
                </label>
              ))}
            </div>
            <button className="flex items-center gap-1.5 bg-[#1D9E75] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0F6E56] transition-colors">
              <i className="fas fa-bullhorn"></i>일괄 독촉 발송
            </button>
          </div>
        </div>
      </div>

      {/* Pending submitters */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {pending.map(p => (
          <div key={p.id} className="card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm ${avatarColor(p.name)}`}>
                {p.name[0]}
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-800">{p.name}</div>
                <div className="text-xs text-gray-400">{p.dept} · {p.id}</div>
                <div className={`text-xs mt-0.5 ${p.lastActivity === '미접속' ? 'text-red-500' : 'text-gray-400'}`}>
                  <i className="fas fa-clock mr-1"></i>{p.lastActivity}
                </div>
              </div>
            </div>
            <button className="border border-gray-200 bg-white text-gray-600 px-4 py-2.5 rounded-lg text-sm font-medium hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all">
              독촉
            </button>
          </div>
        ))}
      </div>

      {/* Reminder log */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">발송 이력</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">발송일시</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">대상수</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">채널</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">발송자</th>
            </tr>
          </thead>
          <tbody>
            {mockLogs.map((log, idx) => (
              <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 text-xs text-gray-600">{log.date}</td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-700">{log.targetCount}명</td>
                <td className="px-4 py-3 text-xs text-gray-600">{log.channel}</td>
                <td className="px-4 py-3 text-xs text-gray-600">{log.sender}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
