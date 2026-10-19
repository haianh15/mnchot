import React, { useState } from 'react';
import { CalendarClock, Search } from 'lucide-react';
import { useApp } from '../../../context/AppContext';

interface Props { onSelectContract: (id: string) => void; }

/** Read-only view of lease dates; not the return-plan status of a room. */
export const HDT05ContractExpiry: React.FC<Props> = ({onSelectContract}) => {
  const { contracts } = useApp();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const todayDate = new Date();
  const today = `${todayDate.getFullYear()}-${String(todayDate.getMonth()+1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;
  const listed = contracts.filter(c => {
    if (status !== 'all' && c.status !== status) return false;
    if (from && c.endDate < from) return false;
    if (to && c.endDate > to) return false;
    return [c.id,c.roomCode,c.tenantName].join(' ').toLocaleLowerCase('vi').includes(query.trim().toLocaleLowerCase('vi'));
  }).sort((a,b)=>a.endDate.localeCompare(b.endDate));
  return <div className="space-y-4">
    <div className="p-4 sm:p-5 bg-white rounded-xl border border-slate-200">
      <h2 className="font-bold text-base flex items-center gap-2"><CalendarClock className="w-5 h-5 text-blue-700"/> Theo dõi thời hạn hợp đồng</h2>
      <p className="text-sm text-slate-600 mt-1">Theo dõi ngày hết hạn hợp đồng; không tự xác nhận ngày dự kiến trả phòng. Ngày dự kiến trả được ghi nhận riêng trong Quản lý phòng.</p>
    </div>
    <div className="p-4 bg-white border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <label className="text-xs font-semibold text-slate-700">Tìm hợp đồng <span className="relative block mt-1"><Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400"/><input className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm" placeholder="Mã, phòng, khách thuê" value={query} onChange={e=>setQuery(e.target.value)}/></span>
      </label>
      <label className="text-xs font-semibold text-slate-700">Trạng thái <select className="block w-full mt-1 border rounded-lg px-3 py-2 text-sm" value={status} onChange={e=>setStatus(e.target.value)}><option value="all">Tất cả</option>{[...new Set(contracts.map(c=>c.status))].map(s=><option key={s}>{s}</option>)}</select>
      </label>
      <label className="text-xs font-semibold text-slate-700">Hết hạn từ ngày <input type="date" className="block w-full mt-1 border rounded-lg px-3 py-2 text-sm" value={from} onChange={e=>setFrom(e.target.value)}/>
      </label>
      <label className="text-xs font-semibold text-slate-700">Hết hạn đến ngày <input type="date" min={from||undefined} className="block w-full mt-1 border rounded-lg px-3 py-2 text-sm" value={to} onChange={e=>setTo(e.target.value)}/>
      </label>
    </div>
    <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
      <table className="w-full text-sm text-left min-w-[630px]"><thead className="bg-slate-50 text-slate-600"><tr>{['Mã hợp đồng','Phòng','Khách thuê','Ngày kết thúc','Trạng thái',''].map(h=><th key={h} className="p-3">{h}</th>)}</tr></thead>
        <tbody>{listed.map(c=><tr className="border-t border-slate-100" key={c.id}>
          <td className="p-3 font-semibold">{c.id}</td><td className="p-3">{c.roomCode}</td><td className="p-3">{c.tenantName}</td>
          <td className="p-3">{c.endDate}{c.endDate < today && c.status !== 'Kết thúc' && <span className="block text-xs text-amber-700">Đã qua ngày kết thúc — kiểm tra hồ sơ</span>}</td>
          <td className="p-3">{c.status}</td>
          <td className="p-3"><button onClick={()=>onSelectContract(c.id)} className="text-blue-700 hover:underline font-semibold">Xem hợp đồng</button></td>
        </tr>)}</tbody>
      </table>
      {listed.length===0 && <p className="p-5 text-slate-500 text-sm">Không có hợp đồng phù hợp bộ lọc.</p>}
    </div>
  </div>;
};
