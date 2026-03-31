import { useState } from 'react';

interface NoticeHistory {
  id: number;
  date: string;
  title: string;
  status: '발송완료' | '예약중' | '실패';
}

const mockHistory: NoticeHistory[] = [
  { id: 1, date: '2024-05-28', title: '2024년 상반기 성과평가 사전 안내', status: '발송완료' },
  { id: 2, date: '2024-06-01', title: '2024년 상반기 성과평가 시작 안내', status: '발송완료' },
  { id: 3, date: '2024-06-20', title: '평가 마감 D-10 리마인더', status: '예약중' },
];

export default function ScheduleNotice() {
  const [title, setTitle] = useState('2024년 상반기 성과평가 일정 안내');
  const [target, setTarget] = useState<'전체대상자' | '부서선택' | '미제출자'>('전체대상자');
  const [channels, setChannels] = useState({ system: true, email: true, sms: false });
  const [content, setContent] = useState(`안녕하세요.\n\n2024년 상반기 성과평가가 시작됩니다.\n\n■ 평가 일정\n - 목표등록: 2024-06-01 ~ 2024-06-07\n - 자기평가: 2024-06-08 ~ 2024-06-15\n - 동료평가: 2024-06-10 ~ 2024-06-17\n - 상위자평가: 2024-06-18 ~ 2024-06-25\n\n기한 내 제출 부탁드립니다.\n\n감사합니다.`);
  const [sendType, setSendType] = useState<'즉시' | '예약'>('즉시');
  const [scheduleDate, setScheduleDate] = useState('');

  const historyBadge = (s: NoticeHistory['status']) => {
    if (s === '발송완료') return 'bg-green-100 text-green-700';
    if (s === '예약중') return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › 성과평가 › 평가 운영 › <span className="text-[#1D9E75] font-medium">평가 일정 공지</span>
      </div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">평가 일정 공지</h1>
          <p className="text-xs text-gray-400 mt-1">평가 대상자에게 일정을 공지합니다 (eval-6)</p>
        </div>
        <button className="flex items-center gap-1.5 bg-[#1D9E75] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0F6E56] transition-colors">
          <i className="fas fa-paper-plane"></i>공지 발송
        </button>
      </div>

      {/* Season info */}
      <div className="card p-4 mb-5 flex items-center gap-3">
        <i className="fas fa-calendar-check text-[#1D9E75]"></i>
        <span className="text-sm font-medium text-gray-800">2024년 상반기 정기평가</span>
        <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-green-100 text-green-700">진행중</span>
        <span className="text-xs text-gray-400 ml-auto">2024-06-01 ~ 2024-06-30</span>
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* Left: compose */}
        <div className="col-span-8 card p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">공지 작성</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">제목</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1D9E75]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">수신대상</label>
              <div className="flex gap-4">
                {(['전체대상자', '부서선택', '미제출자'] as const).map(t => (
                  <label key={t} className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" checked={target === t} onChange={() => setTarget(t)} className="accent-[#1D9E75]" />
                    <span className="text-sm text-gray-600">{t}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">발송채널</label>
              <div className="flex gap-4">
                {([{ key: 'system', label: '시스템알림' }, { key: 'email', label: '이메일' }, { key: 'sms', label: 'SMS' }] as const).map(c => (
                  <label key={c.key} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={channels[c.key]}
                      onChange={e => setChannels({ ...channels, [c.key]: e.target.checked })}
                      className="accent-[#1D9E75]"
                    />
                    <span className="text-sm text-gray-600">{c.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">내용</label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={8}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1D9E75] font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">발송예약</label>
              <div className="flex gap-4 items-center">
                {(['즉시', '예약'] as const).map(t => (
                  <label key={t} className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" checked={sendType === t} onChange={() => setSendType(t)} className="accent-[#1D9E75]" />
                    <span className="text-sm text-gray-600">{t === '즉시' ? '즉시발송' : '예약발송'}</span>
                  </label>
                ))}
                {sendType === '예약' && (
                  <input
                    type="datetime-local"
                    value={scheduleDate}
                    onChange={e => setScheduleDate(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1D9E75]"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: preview + history */}
        <div className="col-span-4 space-y-4">
          <div className="card p-4">
            <h3 className="text-xs font-semibold text-gray-600 mb-3">미리보기</h3>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs font-semibold text-gray-800 mb-1">{title}</div>
              <div className="text-xs text-gray-500 whitespace-pre-line leading-relaxed line-clamp-6">{content}</div>
            </div>
          </div>
          <div className="card p-4">
            <h3 className="text-xs font-semibold text-gray-600 mb-3">발송 이력</h3>
            <div className="space-y-2">
              {mockHistory.map(h => (
                <div key={h.id} className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-medium text-gray-700 line-clamp-1">{h.title}</div>
                    <div className="text-xs text-gray-400">{h.date}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${historyBadge(h.status)}`}>
                    {h.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
