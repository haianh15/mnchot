import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarClock, FileText, MessageSquare, Save, Search } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { resolveRoomContract } from '../../../utils/roomLinks';
import type { Room, TenantContactLog } from '../../../types';

type ContactSource = 'trực tiếp' | 'điện thoại' | 'tin nhắn' | 'khác';
type ContactResult = TenantContactLog['contactResult'];

interface Props {
  focusRoomCode?: string;
  focusLeaseId?: string;
  focusContractId?: string;
  onSelectContract: (contractId: string) => void;
  onBack: () => void;
  onOpenRoom?: (roomCode: string) => void;
}

const currentLocalDateTime = () => {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const todayLocal = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

/** Return-date follow-up is a contract-related list, not a second room-management menu. */
export const ContractReturnTracking: React.FC<Props> = ({
  focusRoomCode, focusLeaseId, focusContractId, onSelectContract, onBack, onOpenRoom
}) => {
  const {
    rooms, contracts, returnPlans, contactLogs, returnInspections,
    updateExpectedReturnDatePH11_12, recordTenantContactPH13
  } = useApp();
  const [roomQuery, setRoomQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState<'has-plan' | 'all' | 'not-set'>('has-plan');
  const [selectedRoomCode, setSelectedRoomCode] = useState('');
  const [editingDate, setEditingDate] = useState(false);
  const [editingContact, setEditingContact] = useState(false);
  const [expectedDate, setExpectedDate] = useState('');
  const [confirmSource, setConfirmSource] = useState<ContactSource>('điện thoại');
  const [confirmedAt, setConfirmedAt] = useState(currentLocalDateTime);
  const [exchangeContent, setExchangeContent] = useState('');
  const [reason, setReason] = useState('');
  const [contactAt, setContactAt] = useState(currentLocalDateTime);
  const [contactSource, setContactSource] = useState<ContactSource>('điện thoại');
  const [contactResult, setContactResult] = useState<ContactResult>('Chưa phản hồi');
  const [contactContent, setContactContent] = useState('');
  const [contactNextDate, setContactNextDate] = useState('');
  const [message, setMessage] = useState<{success: boolean; text: string} | null>(null);

  const liveRecords = useMemo(() => rooms.flatMap(room => {
    if (room.status === 'Trống' || !room.currentLeaseId) return [];
    const contract = resolveRoomContract(room, contracts, returnInspections);
    if (!contract || contract.roomCode !== room.roomCode || contract.leaseId !== room.currentLeaseId) return [];
    const plan = returnPlans.find(p => p.roomCode === room.roomCode && p.leaseId === contract.leaseId &&
      p.status === 'Còn theo dõi' && p.expectedDate === room.expectedReturnDate);
    const latestContact = contactLogs.find(log => log.roomCode === room.roomCode && log.leaseId === contract.leaseId);
    return [{ room, contract, plan, latestContact }];
  }), [rooms, contracts, returnInspections, returnPlans, contactLogs]);

  const matchingFocus = liveRecords.find(r => r.room.roomCode === focusRoomCode &&
    (!focusLeaseId || r.contract.leaseId === focusLeaseId) &&
    (!focusContractId || r.contract.id === focusContractId));

  useEffect(() => {
    if (!focusRoomCode) return;
    setSelectedRoomCode(matchingFocus?.room.roomCode || '');
    setRoomQuery('');
    setDateFrom('');
    setDateTo('');
    setStatusFilter('all');
    setPlanFilter('all');
    setEditingDate(false);
    setEditingContact(false);
    setMessage(null);
  }, [focusRoomCode, focusLeaseId, focusContractId]);

  const listed = liveRecords.filter(({room, contract}) => {
    if (focusRoomCode && (room.roomCode !== focusRoomCode ||
      (focusLeaseId && contract.leaseId !== focusLeaseId) ||
      (focusContractId && contract.id !== focusContractId))) return false;
    if (statusFilter !== 'all' && room.status !== statusFilter) return false;
    if (planFilter === 'has-plan' && !room.expectedReturnDate) return false;
    if (planFilter === 'not-set' && !!room.expectedReturnDate) return false;
    if (roomQuery && ![room.roomCode, contract.id, contract.tenantName].join(' ').toLocaleLowerCase('vi')
      .includes(roomQuery.toLocaleLowerCase('vi'))) return false;
    if (dateFrom && (!room.expectedReturnDate || room.expectedReturnDate < dateFrom)) return false;
    if (dateTo && (!room.expectedReturnDate || room.expectedReturnDate > dateTo)) return false;
    return true;
  }).sort((a, b) => (a.room.expectedReturnDate || '9999').localeCompare(b.room.expectedReturnDate || '9999'));

  const selected = liveRecords.find(r => r.room.roomCode === selectedRoomCode);
  const showDateForm = (room: Room) => {
    const entry = liveRecords.find(r => r.room.roomCode === room.roomCode);
    if (!entry) return;
    setSelectedRoomCode(room.roomCode);
    setExpectedDate(room.expectedReturnDate || '');
    setReason('');
    setExchangeContent('');
    setConfirmedAt(currentLocalDateTime());
    setEditingContact(false);
    setEditingDate(true);
    setMessage(null);
  };

  const saveDate = () => {
    if (!selected) return;
    if (!expectedDate || expectedDate < selected.contract.startDate ||
      !exchangeContent.trim() || !confirmedAt || new Date(confirmedAt).getTime() > Date.now()) {
      setMessage({success: false, text: 'Kiểm tra lại ngày dự kiến trả, thời điểm xác nhận và nội dung xác nhận của khách.'});
      return;
    }
    if (selected.room.expectedReturnDate && !reason.trim()) {
      setMessage({success: false, text: 'Vui lòng nhập lý do khi thay đổi ngày dự kiến trả.'});
      return;
    }
    const result = updateExpectedReturnDatePH11_12({
      roomCode: selected.room.roomCode,
      leaseId: selected.contract.leaseId,
      expectedDate, confirmSource, confirmedAt, exchangeContent: exchangeContent.trim(), reason: reason.trim() || undefined
    });
    setMessage({success: result.success, text: result.message});
    if (result.success) setEditingDate(false);
  };

  const saveContact = () => {
    if (!selected) return;
    if (!contactAt || new Date(contactAt).getTime() > Date.now() || !contactContent.trim()) {
      setMessage({success: false, text: 'Nhập thời điểm hợp lệ và nội dung liên hệ thực tế.'});
      return;
    }
    const result = recordTenantContactPH13({
      roomCode: selected.room.roomCode,
      leaseId: selected.contract.leaseId,
      contactTimeActual: contactAt, contactSource, contactResult, content: contactContent.trim(),
      nextContactDate: contactNextDate || undefined
    });
    setMessage({success: result.success && !result.isConflict, text: result.message});
    if (result.success) {
      setEditingContact(false);
      setContactContent('');
    }
  };

  return <div className="space-y-4">
    <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-bold text-lg flex items-center gap-2"><CalendarClock className="w-5 h-5 text-blue-700"/> Theo dõi trả phòng</h2>
          <p className="text-sm text-slate-600 mt-1">Ngày khách dự kiến trả phòng được theo dõi riêng với ngày hết hạn hợp đồng.</p>
        </div>
        <button onClick={onBack} className="px-3 py-2 text-sm rounded-lg border border-slate-300 font-semibold">← Danh sách hợp đồng</button>
      </div>
      {focusRoomCode && <div className="mt-3 px-3 py-2 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 text-sm">
        Đang xem phòng <strong>{focusRoomCode}</strong>{focusLeaseId && <> · lần thuê <strong>{focusLeaseId}</strong></>}
        {!matchingFocus && <p className="mt-1 text-amber-800">Không tìm thấy lần thuê hiện tại phù hợp. Không hiển thị dữ liệu của lần thuê cũ.</p>}
      </div>}
    </section>
    {!focusRoomCode && <section className="bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 text-sm">
      <label className="font-semibold">Tìm phòng, hợp đồng, khách thuê
        <span className="relative block mt-1"><Search className="w-4 h-4 absolute top-2.5 left-3 text-slate-400"/>
          <input value={roomQuery} onChange={e => setRoomQuery(e.target.value)} placeholder="Tìm theo hồ sơ" className="pl-9 pr-3 py-2 w-full border rounded-lg font-normal"/>
        </span>
      </label>
      <label className="font-semibold">Tình trạng phòng
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="block mt-1 px-3 py-2 w-full border rounded-lg font-normal">
          <option value="all">Tất cả</option><option value="Đang thuê">Đang thuê</option><option value="Sắp trả">Sắp trả phòng</option>
        </select>
      </label>
      <label className="font-semibold">Kế hoạch trả
        <select value={planFilter} onChange={e => setPlanFilter(e.target.value as 'has-plan' | 'all' | 'not-set')} className="block mt-1 px-3 py-2 w-full border rounded-lg font-normal">
          <option value="has-plan">Đã ghi ngày dự kiến trả</option><option value="not-set">Chưa ghi ngày dự kiến trả</option><option value="all">Tất cả lần thuê hiện tại</option>
        </select>
      </label>
      <label className="font-semibold">Dự kiến trả từ ngày
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="block mt-1 px-3 py-2 w-full border rounded-lg font-normal"/>
      </label>
      <label className="font-semibold">Dự kiến trả đến ngày
        <input type="date" min={dateFrom || undefined} value={dateTo} onChange={e => setDateTo(e.target.value)} className="block mt-1 px-3 py-2 w-full border rounded-lg font-normal"/>
      </label>
    </section>}
    <section className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
      <table className="w-full text-left text-sm min-w-[750px]">
        <thead className="bg-slate-50 text-slate-600"><tr>
          {['Phòng','Hợp đồng / Khách thuê','Tình trạng','Ngày dự kiến trả','Theo dõi','Phản hồi','Thao tác'].map(h => <th key={h} className="p-3">{h}</th>)}
        </tr></thead>
        <tbody>{listed.map(({room, contract, latestContact}) => {
          const dayDiff = room.expectedReturnDate ? Math.round((new Date(`${room.expectedReturnDate}T12:00:00`).getTime() - new Date(`${todayLocal()}T12:00:00`).getTime()) / 86400000) : null;
          return <tr key={`${room.roomCode}-${contract.leaseId}`} className={`border-t ${selectedRoomCode === room.roomCode ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
            <td className="p-3 font-semibold">{room.roomCode}</td>
            <td className="p-3"><span className="font-semibold block">{contract.id}</span><span className="text-slate-600">{contract.tenantName}</span></td>
            <td className="p-3">{room.status === 'Sắp trả' ? 'Sắp trả phòng' : room.status}</td>
            <td className="p-3 font-medium">{room.expectedReturnDate || <span className="text-slate-400">Chưa ghi nhận</span>}</td>
            <td className="p-3">{dayDiff === null ? '—' : dayDiff < 0 ? `Quá ngày ${-dayDiff} ngày` : dayDiff === 0 ? 'Dự kiến trả hôm nay' : `Còn ${dayDiff} ngày`}</td>
            <td className="p-3">{latestContact?.contactResult || 'Chưa ghi nhận'}</td>
            <td className="p-3"><div className="flex gap-2 flex-wrap">
              <button className="font-semibold text-blue-700 hover:underline" onClick={() => onSelectContract(contract.id)}><FileText className="inline w-4 h-4 mr-1"/>Hợp đồng</button>
              <button className="font-semibold text-amber-800 hover:underline" onClick={() => showDateForm(room)}>{room.expectedReturnDate ? 'Cập nhật ngày trả' : 'Ghi ngày trả'}</button>
              <button className="font-semibold text-indigo-700 hover:underline" onClick={() => {setSelectedRoomCode(room.roomCode);setEditingContact(true);setEditingDate(false);setMessage(null);}}><MessageSquare className="inline w-4 h-4 mr-1"/>Liên hệ</button>
              {onOpenRoom && <button className="text-slate-600 hover:underline" onClick={() => onOpenRoom(room.roomCode)}>Xem phòng</button>}
            </div></td>
          </tr>;
        })}</tbody>
      </table>
      {listed.length === 0 && <p className="p-5 text-slate-600 text-sm">Không có hồ sơ trả phòng phù hợp. Phòng trống và lần thuê cũ không được đưa vào danh sách hiện tại.</p>}
    </section>
    {message && <div role="status" className={`p-3 border rounded-lg text-sm ${message.success ? 'bg-green-50 border-green-200 text-green-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>{message.text}</div>}
    {selected && <details className="bg-white border border-slate-200 rounded-xl p-4 text-sm">
      <summary className="cursor-pointer font-semibold text-slate-800">Các ghi nhận liên hệ của phòng {selected.room.roomCode}</summary>
      <div className="mt-3 space-y-2">
        {contactLogs.filter(log => log.roomCode === selected.room.roomCode && log.leaseId === selected.contract.leaseId)
          .map(log => <div key={log.id} className="border rounded-lg px-3 py-2 bg-slate-50">
            <div className="font-semibold">{log.contactResult} · {log.contactTimeActual.replace('T', ' ')}</div>
            <p className="text-slate-600 mt-1">{log.content}</p>
            {log.nextContactDate && <span className="text-blue-700 text-xs">Hẹn liên hệ lại: {log.nextContactDate}</span>}
          </div>)}
        {!contactLogs.some(log => log.roomCode === selected.room.roomCode && log.leaseId === selected.contract.leaseId) &&
          <p className="text-slate-500">Chưa có ghi nhận liên hệ.</p>}
      </div>
    </details>}
    {selected && (editingDate || editingContact) && <section className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 space-y-4">
      <div className="flex justify-between items-center gap-3"><h3 className="font-bold text-base">{editingDate ? 'Ghi nhận ngày dự kiến trả' : 'Ghi nhận liên hệ'} · {selected.room.roomCode} ({selected.contract.id})</h3>
        <button type="button" onClick={() => {setEditingContact(false);setEditingDate(false);}} className="border rounded-lg px-3 py-1.5 text-sm">Đóng</button>
      </div>
      {editingDate ? <>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <label>Ngày dự kiến trả phòng *<input type="date" value={expectedDate} onChange={e => setExpectedDate(e.target.value)} className="block mt-1 w-full rounded-lg border px-3 py-2"/></label>
          <label>Thời điểm khách xác nhận *<input type="datetime-local" max={currentLocalDateTime()} value={confirmedAt} onChange={e => setConfirmedAt(e.target.value)} className="block mt-1 w-full rounded-lg border px-3 py-2"/></label>
          <label>Nguồn xác nhận *<select value={confirmSource} onChange={e => setConfirmSource(e.target.value as ContactSource)} className="block mt-1 w-full rounded-lg border px-3 py-2"><option value="điện thoại">Điện thoại</option><option value="tin nhắn">Tin nhắn</option><option value="trực tiếp">Trực tiếp</option><option value="khác">Khác</option></select></label>
          {selected.room.expectedReturnDate && <label>Lý do điều chỉnh *<input value={reason} onChange={e => setReason(e.target.value)} className="block mt-1 w-full rounded-lg border px-3 py-2"/></label>}
        </div>
        <label className="block text-sm">Nội dung trao đổi đã xác nhận *<textarea value={exchangeContent} onChange={e => setExchangeContent(e.target.value)} rows={3} className="block mt-1 w-full border rounded-lg px-3 py-2"/></label>
        <button onClick={saveDate} className="bg-blue-600 text-white rounded-lg px-4 py-2 font-semibold text-sm flex items-center gap-2"><Save className="w-4 h-4"/>Lưu ngày dự kiến trả</button>
      </> : <>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <label>Thời điểm liên hệ *<input type="datetime-local" max={currentLocalDateTime()} value={contactAt} onChange={e=>setContactAt(e.target.value)} className="block mt-1 w-full border rounded-lg px-3 py-2"/></label>
          <label>Kênh liên hệ *<select value={contactSource} onChange={e=>setContactSource(e.target.value as ContactSource)} className="block mt-1 w-full border rounded-lg px-3 py-2"><option value="điện thoại">Điện thoại</option><option value="tin nhắn">Tin nhắn</option><option value="trực tiếp">Trực tiếp</option><option value="khác">Khác</option></select></label>
          <label>Kết quả liên hệ *<select value={contactResult} onChange={e=>setContactResult(e.target.value as ContactResult)} className="block mt-1 w-full border rounded-lg px-3 py-2"><option value="Chưa phản hồi">Chưa phản hồi</option><option value="Không tiếp tục thuê – Chưa xác nhận ngày dự kiến trả">Không tiếp tục thuê – Chưa xác nhận ngày dự kiến trả</option><option value="Chờ đối chiếu">Chờ đối chiếu</option><option value="Đồng ý tiếp tục thuê">Đồng ý tiếp tục thuê</option></select></label>
          <label>Ngày hẹn liên hệ lại<input type="date" value={contactNextDate} onChange={e=>setContactNextDate(e.target.value)} className="block mt-1 w-full border rounded-lg px-3 py-2"/></label>
        </div>
        <label className="text-sm block">Nội dung liên hệ thực tế *<textarea value={contactContent} onChange={e=>setContactContent(e.target.value)} rows={3} className="block mt-1 w-full border rounded-lg px-3 py-2"/></label>
        <button onClick={saveContact} className="bg-blue-600 text-white rounded-lg px-4 py-2 font-semibold text-sm flex items-center gap-2"><Save className="w-4 h-4"/>Lưu liên hệ</button>
      </>}
    </section>}
    <button className="text-sm text-slate-600 flex items-center gap-1 hover:underline" onClick={onBack}><ArrowLeft className="w-4 h-4"/>Danh sách hợp đồng</button>
  </div>;
};
