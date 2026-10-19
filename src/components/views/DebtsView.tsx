import { toUserMessage } from '../../utils/userMessages';
import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { PaymentNotice, DebtHistoryReminder, DebtPromise, Contract, Room } from '../../types';
import {
  AlertTriangle, Phone, MessageCircle, UserCheck, Calendar,
  Clock, Plus, Search, FileText, CheckCircle2, AlertCircle, X,
  ShieldAlert, ExternalLink, RefreshCw, Eye, ArrowRight, Check,
  History, Paperclip, ChevronRight, Scale, AlertOctagon, Info,
  Wallet, UserX, HelpCircle, Layers
} from 'lucide-react';

export const DebtsView: React.FC = () => {
  const {
    paymentNotices,
    periodBills,
    reconciliations,
    paymentReceipts,
    settlementSlips,
    debtReminders,
    debtPromises,
    recordDebtReminder09_2,
    recordDebtPromise09_3,
    contracts,
    rooms,
    currentUser,
    currentSession
  } = useApp();

  // Navigation tab for QT09
  const [activeTab, setActiveTab] = useState<'overdue_list' | 'reminders' | 'promises' | 'long_debt_cn04'>('overdue_list');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [roomFilter, setRoomFilter] = useState('Tất cả');
  const [leaseStatusFilter, setLeaseStatusFilter] = useState<'Tất cả' | 'Đang thuê' | 'Đã trả phòng'>('Tất cả');

  // Toast feedback
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);
  const showToast = (type: 'success' | 'error' | 'warning', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4500);
  };

  // Test Simulation Toggles for QT09
  const [simulateEF01, setSimulateEF01] = useState(false); // Không tải được nghĩa vụ/thu tiền từ nguồn
  const [simulateEF02, setSimulateEF02] = useState(false); // Liên kết thông báo và khoản thu không khớp

  // Selected Notice for modals / CN-04 detail view
  const [selectedNoticeId, setSelectedNoticeId] = useState<string | null>(null);

  // Modals
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showPromiseModal, setShowPromiseModal] = useState(false);
  const [showNoticeQrModal, setShowNoticeQrModal] = useState(false);
  const [showAllInvoicesModal, setShowAllInvoicesModal] = useState(false);

  // Form states - Reminder
  const [remDate, setRemDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [remChannel, setRemChannel] = useState<'Zalo' | 'Điện thoại' | 'Gặp trực tiếp'>('Zalo');
  const [remResult, setRemResult] = useState('');
  const [remNotes, setRemNotes] = useState('');
  const [remProofFile, setRemProofFile] = useState('');
  const [remIsRetrospective, setRemIsRetrospective] = useState(false);
  const [remConfirmedContact, setRemConfirmedContact] = useState(true);

  // Form states - Promise & Feedback
  const [promContactTime, setPromContactTime] = useState(() => new Date().toISOString().substring(0, 16));
  const [promChannel, setPromChannel] = useState<'Zalo' | 'Điện thoại' | 'Gặp trực tiếp'>('Điện thoại');
  const [promContent, setPromContent] = useState('');
  const [promHasDate, setPromHasDate] = useState(true);
  const [promDate, setPromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split('T')[0];
  });
  const [promProofFile, setPromProofFile] = useState('');
  const [promCustomerReportedPaid, setPromCustomerReportedPaid] = useState(false);

  // =========================================================================
  // ==================== COMPUTED: OVERDUE NOTICES ====================
  // =========================================================================
  // Danh sách công nợ quá hạn chỉ gồm khoản hiện Chưa thu,
  // số dư > 0 và ngày hiện tại SAU ngày hạn thanh toán đã lưu ở UC07.2.
  // Trước hoặc đúng ngày hạn không ghi là công nợ quá hạn (thuộc UC08.1).
  const now = new Date();
  todayDateOnly(now);

  function todayDateOnly(d: Date) {
    const copy = new Date(d);
    copy.setHours(0, 0, 0, 0);
    return copy;
  }

  // Pre-process all notices with overdue metadata and deposit offsets
  const processedNotices = useMemo(() => {
    return paymentNotices.map(n => {
      const room = rooms.find(r => r.roomCode === n.roomCode);
      const contract = contracts.find(c => c.roomCode === n.roomCode && (c.id === room?.currentContractId || c.status === 'Hiệu lực'));
      const activeReceipt = paymentReceipts.find(r => r.noticeId === n.id && r.status === 'Đang hiệu lực');

      // Check deposit offset from QT05
      const settlement = settlementSlips.find(s => s.roomCode === n.roomCode && s.leaseId === n.leaseId && s.step58Published && ['Đã có kết quả – chờ ký biên bản', 'Hoàn tất'].includes(s.status));
      // Chỉ bù đúng khoản nợ gốc có mã trong phiếu. Không lấy tổng cọc trừ chung cho toàn phòng.
      const debtDeduction = settlement?.deductions
        .filter(d => d.category === 'Công nợ kỳ trước' && (d.id === 'ded_overdue_' + n.id || d.description.includes(n.noticeCode)))
        .reduce((acc, d) => acc + d.amount, 0) || 0;

      // Status resolution
      const isPaid = !!activeReceipt || n.paymentStatus === 'Đã thu';
      const handledByDeposit = n.status !== 'Đã thay thế' && !isPaid && debtDeduction > 0 ? Math.min(debtDeduction, n.totalAmount) : 0;
      const uncollectedBalance = isPaid || n.paymentStatus === 'Đã xử lý bằng cọc' || n.status === 'Đã thay thế' || n.status === 'Đã thanh toán'
        ? 0 : Math.max(0, n.totalAmount - handledByDeposit);

      // Overdue check based on dueDate
      const due = new Date(n.dueDate);
      due.setHours(0, 0, 0, 0);
      const isOverdue = n.status === 'Đang hiệu lực' && !isPaid && uncollectedBalance > 0 && todayDateOnly(new Date()).getTime() > due.getTime();

      const overdueDays = isOverdue
        ? Math.ceil((todayDateOnly(new Date()).getTime() - due.getTime()) / (1000 * 60 * 60 * 24)): 0;

      const isRoomVacant = room?.status === 'Trống';

      return {...n,
        room,
        contract,
        tenantName: contract?.tenantName || room?.currentTenantName || 'Khách thuê',
        isPaid,
        handledByDeposit,
        uncollectedBalance,
        isOverdue,
        overdueDays,
        isRoomVacant
      };
    });
  }, [paymentNotices, rooms, contracts, paymentReceipts, settlementSlips]);

  // Filter only Overdue Debts for UC-CN-01
  const overdueDebtList = useMemo(() => {
    if (simulateEF01) return [];

    return processedNotices.filter(n => {
      if (!n.isOverdue) return false;
      if (roomFilter !== 'Tất cả' && n.roomCode !== roomFilter) return false;
      if (leaseStatusFilter === 'Đang thuê' && n.isRoomVacant) return false;
      if (leaseStatusFilter === 'Đã trả phòng' && !n.isRoomVacant) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = n.noticeCode.toLowerCase().includes(q);
        const matchRoom = n.roomCode.toLowerCase().includes(q);
        const matchTenant = n.tenantName.toLowerCase().includes(q);
        return matchCode || matchRoom || matchTenant;
      }

      return true;
    });
  }, [processedNotices, roomFilter, leaseStatusFilter, searchQuery, simulateEF01]);

  // Notice currently selected for viewing/action
  const activeSelectedNotice = useMemo(() => {
    if (selectedNoticeId) {
      return processedNotices.find(n => n.id === selectedNoticeId) || null;
    }
    return overdueDebtList[0] || processedNotices.find(n => n.isOverdue) || null;
  }, [processedNotices, selectedNoticeId, overdueDebtList]);

  // Summary statistics for UC-CN-01
  const totalOverdueCount = overdueDebtList.length;
  const totalOverdueAmount = overdueDebtList.reduce((sum, n) => sum + n.uncollectedBalance, 0);
  const totalHandledDeposit = processedNotices.reduce((sum, n) => sum + n.handledByDeposit, 0);

  // Notices that are NOT overdue (active within due date) -> for UC08.1 linkage
  const pendingNotOverdueCount = processedNotices.filter(n => !n.isPaid && !n.isOverdue && n.uncollectedBalance > 0).length;

  // Reminders and Promises for active notice
  const activeNoticeReminders = useMemo(() => {
    if (!activeSelectedNotice) return [];
    return debtReminders.filter(r => r.noticeId === activeSelectedNotice.id || r.roomCode === activeSelectedNotice.roomCode);
  }, [debtReminders, activeSelectedNotice]);

  const activeNoticePromises = useMemo(() => {
    if (!activeSelectedNotice) return [];
    return debtPromises.filter(p => p.noticeId === activeSelectedNotice.id || p.roomCode === activeSelectedNotice.roomCode);
  }, [debtPromises, activeSelectedNotice]);

  // Prolonged Debt Ground Analysis for UC-CN-04
  const prolongedDebtAssessment = useMemo(() => {
    if (!activeSelectedNotice) return {status:'Chưa chọn khoản nợ', badgeColor:'bg-slate-100 text-slate-600', reasons:[], hasSufficientGround:false};
    const reasons = [
      `Hạn thanh toán gốc: ${activeSelectedNotice.originalDueDate || activeSelectedNotice.dueDate}.`,
      `Số ngày quá hạn: ${activeSelectedNotice.overdueDays} ngày; số dư: ${activeSelectedNotice.uncollectedBalance.toLocaleString('vi-VN')} đ.`,
      `Đã ghi nhận ${activeNoticeReminders.length} lần nhắc thanh toán.`,
      `Có ${activeNoticePromises.length} lần ghi nhận phản hồi hoặc hẹn thanh toán.`,
    ];
    if (activeNoticePromises.some(p=>p.needsVerificationASIS08)) reasons.push('Có thông tin khách báo chuyển tiền đang chờ xác minh ở Thu tiền.');
    // CN-04 chỉ hiển thị căn cứ; Chủ nhà tự đánh giá, hệ thống không tự phân loại nợ kéo dài.
    return {status:'Căn cứ để Chủ nhà xem xét', badgeColor:'bg-slate-100 text-slate-700 border-slate-300', reasons, hasSufficientGround:false};
  }, [activeSelectedNotice, activeNoticeReminders, activeNoticePromises]);

  // =========================================================================
  // ==================== FORM ACTIONS ====================
  // =========================================================================

  // Save Reminder
  const handleSaveReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSelectedNotice) return;

    if (!remConfirmedContact) {
      showToast('error', 'Lỗi User chưa xác nhận đã thực sự liên hệ khách. Không thể lưu lịch sử nhắc nợ.');
      return;
    }

    const res = recordDebtReminder09_2({
      noticeId: activeSelectedNotice.id,
      roomCode: activeSelectedNotice.roomCode,
      leaseId: activeSelectedNotice.leaseId,
      contactDate: remDate,
      channel: remChannel,
      result: remResult.trim(),
      notes: remNotes.trim() || undefined,
      proofFile: remProofFile.trim() || undefined,
      isRetrospective: remIsRetrospective,
      tenantConfirmedContact: remConfirmedContact
    });

    if (res.success) {
      showToast('success', toUserMessage(res.message));
      setShowReminderModal(false);
      setRemResult('');
      setRemNotes('');
      setRemProofFile('');
    } else {
      showToast('error', toUserMessage(res.message));
    }
  };

  // Save Promise & Feedback
  const handleSavePromise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSelectedNotice) return;

    if (promHasDate && !promDate) {
      showToast('error', 'Lỗi Vui lòng nhập ngày hẹn thanh toán (hoặc tắt tùy chọn Có hẹn).');
      return;
    }

    const res = recordDebtPromise09_3({
      noticeId: activeSelectedNotice.id,
      roomCode: activeSelectedNotice.roomCode,
      contactTime: promContactTime,
      channel: promChannel,
      content: promContent.trim(),
      hasPromiseDate: promHasDate,
      promisedDate: promHasDate ? promDate: undefined,
      proofFile: promProofFile.trim() || undefined,
      needsVerificationASIS08: promCustomerReportedPaid,
      verificationNote: promCustomerReportedPaid ? 'Khách báo đã chuyển khoản, chờ kiểm tra tài khoản ngân hàng': undefined
    });

    if (res.success) {
      showToast('success', `${toUserMessage(res.message)} Hạn thanh toán gốc không thay đổi.`);
      setShowPromiseModal(false);
      setPromContent('');
      setPromProofFile('');
      setPromCustomerReportedPaid(false);
    } else {
      showToast('error', toUserMessage(res.message));
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification Container */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 transition-all duration-300 transform scale-100 animate-in fade-in slide-in-from-top-4">
          <div className={`px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-semibold border ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-900/30': toast.type === 'warning'
              ? 'bg-amber-600 text-white border-amber-500 shadow-amber-900/30': 'bg-red-600 text-white border-red-500 shadow-red-900/30'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-200" />
            ): (
              <AlertCircle className="w-4 h-4 shrink-0 text-white" />
            )}
            <span className="max-w-md">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 hover:bg-white/20 p-1 rounded-md cursor-pointer transition-colors"
            >
              <X className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            
            <h1 className="text-lg font-bold text-slate-900">Quản lý Công nợ Quá hạn</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi các thông báo đã quá hạn, đối chiếu chứng từ thu tiền và các khoản đã xử lý bằng cọc. </p>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAllInvoicesModal(true)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            Tra cứu tất cả khoản (Hiệu lực / Tất toán) </button>
        </div>
      </div>

      <div className="rounded-xl bg-white border border-slate-200 p-3 flex flex-wrap items-center gap-3">
        <button onClick={()=>setActiveTab('overdue_list')} className={`rounded-lg px-3 py-2 text-sm font-semibold ${activeTab==='overdue_list'?'bg-blue-600 text-white':'border border-slate-200 hover:bg-slate-50'}`}>Danh sách nợ quá hạn ({totalOverdueCount})</button>
        <label className="text-xs font-semibold text-slate-600">Tra cứu hoặc ghi nhận theo khoản nợ <select value={activeTab} onChange={e=>setActiveTab(e.target.value as typeof activeTab)} className="block mt-1 border border-slate-300 rounded-lg px-3 py-2 bg-white text-sm min-w-48">
            <option value="overdue_list">Danh sách nợ quá hạn</option>
            <option value="reminders">Lịch sử nhắc nợ</option>
            <option value="promises">Phản hồi và hẹn trả</option>
            <option value="long_debt_cn04">Căn cứ khoản nợ đã chọn</option>
          </select>
        </label>
      </div>

      {/* ========================================================================= */}
      {/* ==================== TAB 1: THEO DÕI SỐ DƯ CÔNG NỢ ==================== */}
      {/* ========================================================================= */}
      {activeTab === 'overdue_list' && (
        <div className="space-y-4">
          {/* Informational Guidance Banner */}
          <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-950 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Info className="w-4 h-4 text-blue-700 shrink-0" />
              <div>
                <strong>Nguồn hình thành công nợ:</strong>
                <p className="mt-0.5 text-slate-700">
                  Bảng tính tiền đã xác nhận → Thông báo thanh toán đang hiệu lực (có hạn phải trả) → Đối chiếu giao dịch ngân hàng và khoản đã bù cọc. Chỉ khoản <strong>còn số dư và đã qua hạn</strong> mới hiển thị tại đây. {pendingNotOverdueCount} khoản còn hạn được theo dõi ở Thu tiền. </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-white border border-blue-200 rounded-lg font-semibold text-[11px] text-blue-900">
                Khoản còn hạn: <strong>{pendingNotOverdueCount}</strong>
              </span>
            </div>
          </div>

          {/* Developer-only simulation controls intentionally hidden from the owner UI */}
          <div className="hidden p-3 bg-slate-100 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-700">Kiểm thử luồng ngoại lệ:</span>
              <label className="flex items-center gap-1 cursor-pointer text-slate-600">
                <input
                  type="checkbox"
                  checked={simulateEF01}
                  onChange={(e) => setSimulateEF01(e.target.checked)}
                  className="rounded border-slate-300 text-red-600"
                />
                <span>(Lỗi tải nguồn nghĩa vụ/thu tiền)</span>
              </label>

              <label className="flex items-center gap-1 cursor-pointer text-slate-600">
                <input
                  type="checkbox"
                  checked={simulateEF02}
                  onChange={(e) => setSimulateEF02(e.target.checked)}
                  className="rounded border-slate-300 text-amber-600"
                />
                <span>(Cảnh báo lệch liên kết thông báo)</span>
              </label>
            </div>

            <span className="text-[11px] text-slate-500 italic">
              * Tuyệt đối không tự động gán Đã thu khi có lỗi nguồn </span>
          </div>

          {/* Exception Notice */}
          {simulateEF01 && (
            <div className="p-6 bg-red-50 border border-red-300 rounded-xl text-center space-y-2 text-xs">
              <AlertOctagon className="w-8 h-8 text-red-600 mx-auto" />
              <strong className="text-red-900 block text-sm">Ngoại lệ Không thể tải dữ liệu nghĩa vụ/thu tiền từ nguồn</strong>
              <p className="text-red-700 max-w-md mx-auto">
                Hệ thống bảo vệ tính toàn vẹn: Không tự gán trạng thái Đã thu hay suy đoán số dư khi thiếu dữ liệu nguồn. </p>
              <button
                onClick={() => setSimulateEF01(false)}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold cursor-pointer shadow-xs"
              >
                Thử lại tải dữ liệu nguồn </button>
            </div>
          )}

          {/* KPI Cards */}
          {!simulateEF01 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Số khoản nợ quá hạn </span>
                <span className="text-2xl font-bold font-mono text-red-700 mt-1 block">
                  {totalOverdueCount} khoản </span>
                <span className="text-[10px] text-slate-400">
                  Dựa trên hạn thanh toán ghi trong thông báo </span>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Tổng dư nợ quá hạn chưa thu </span>
                <span className="text-2xl font-bold font-mono text-red-700 mt-1 block">
                  {totalOverdueAmount.toLocaleString('vi-VN')} đ </span>
                <span className="text-[10px] text-red-600 font-medium">
                  Đã khấu trừ các khoản bù cọc (nếu có) </span>
              </div>

              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-white shadow-xs">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                  Đã xử lý bù bằng cọc </span>
                <span className="text-2xl font-bold font-mono text-indigo-400 mt-1 block">
                  {totalHandledDeposit.toLocaleString('vi-VN')} đ </span>
                <span className="text-[10px] text-slate-400">
                  Theo dõi riêng, không tính là thực thu ngân hàng </span>
              </div>
            </div>
          )}

          {/* Filter Bar */}
          {!simulateEF01 && (
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[300px]">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm theo phòng, khách thuê, mã thông báo..."
                    className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <select
                  value={roomFilter}
                  onChange={(e) => setRoomFilter(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-medium"
                >
                  <option value="Tất cả">Tất cả phòng</option>
                  {rooms.map(r => (
                    <option key={r.id} value={r.roomCode}>{r.roomCode}</option>
                  ))}
                </select>

                <select
                  value={leaseStatusFilter}
                  onChange={(e) => setLeaseStatusFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-medium"
                >
                  <option value="Tất cả">Tất cả tình trạng cư trú</option>
                  <option value="Đang thuê">Khách đang thuê</option>
                  <option value="Đã trả phòng">Khách đã trả phòng</option>
                </select>
              </div>

              <div className="text-[11px] text-slate-500">
                Hiển thị <strong>{overdueDebtList.length}</strong> khoản quá hạn </div>
            </div>
          )}

          {/* Main Overdue Debt Table */}
          {!simulateEF01 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                      <th className="py-2.5 px-3">Phòng</th>
                      <th className="py-2.5 px-3">Khách thuê</th>
                      <th className="py-2.5 px-3">Mã thông báo</th>
                      <th className="py-2.5 px-3">Kỳ thuê trả trước</th>
                      <th className="py-2.5 px-3">Kỳ DV vừa dùng</th>
                      <th className="py-2.5 px-3">Hạn thanh toán gốc</th>
                      <th className="py-2.5 px-3 text-center">Quá hạn</th>
                      <th className="py-2.5 px-3 text-right">Tổng phải thu</th>
                      <th className="py-2.5 px-3 text-right">Bù cọc</th>
                      <th className="py-2.5 px-3 text-right">Dư nợ Chưa thu</th>
                      <th className="py-2.5 px-3 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {overdueDebtList.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-10 text-center text-slate-400">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5 opacity-80" />
                          <p className="font-semibold text-slate-700">Không có khoản nợ quá hạn nào trong danh sách!</p>
                          <span className="text-[11px] text-slate-400">
                            Các khoản chưa thu còn trong hạn được theo dõi tại màn hình Theo dõi thanh toán. </span>
                        </td>
                      </tr>
                    ): (
                      overdueDebtList.map((n) => (
                        <tr
                          key={n.id}
                          className={`hover:bg-slate-50 transition-colors ${
                            selectedNoticeId === n.id ? 'bg-blue-50/50': ''
                          }`}
                        >
                          <td className="py-2.5 px-3">
                            <span className="font-mono font-bold text-blue-700 block">{n.roomCode}</span>
                            {n.isRoomVacant && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                Đã trả phòng </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-900">
                            {n.tenantName}
                            <span className="block font-mono text-[10px] text-slate-400">{n.contract?.id || '—'}</span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-700">
                            {n.noticeCode}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                            {n.nextRentPeriod || 'Kỳ tiếp theo'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                            {n.servicePeriod || 'Kỳ vừa dùng'}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">
                            {n.dueDate}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800 font-mono">
                              +{n.overdueDays} ngày </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-800 font-semibold">
                            {n.totalAmount.toLocaleString('vi-VN')} đ </td>
                          <td className="py-2.5 px-3 text-right font-mono text-indigo-700">
                            {n.handledByDeposit > 0 ? (
                              <span title="Đã xử lý bằng cọc theo quyết toán hoàn tất">
                                -{n.handledByDeposit.toLocaleString('vi-VN')} đ </span>
                            ): (
                              '—'
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-red-700 text-sm">
                            {n.uncollectedBalance.toLocaleString('vi-VN')} đ </td>
                          <td className="py-2.5 px-3 text-right space-x-1 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedNoticeId(n.id);
                                setShowReminderModal(true);
                              }}
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded text-[11px] font-semibold cursor-pointer"
                              title="Ghi nhật ký liên hệ nhắc nợ qua Zalo/Điện thoại/Trực tiếp"
                            >
                              Nhắc nợ </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedNoticeId(n.id);
                                setShowPromiseModal(true);
                              }}
                              className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded text-[11px] font-semibold cursor-pointer"
                              title="Ghi nhận phản hồi và ngày hẹn thanh toán của khách"
                            >
                              Hẹn trả </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedNoticeId(n.id);
                                setActiveTab('long_debt_cn04');
                              }}
                              className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded text-[11px] font-semibold cursor-pointer"
                              title="Tra cứu căn cứ hợp đồng và lịch sử nợ kéo dài"
                            >
                              Căn cứ </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ==================== TAB 2: LỊCH SỬ NHẮC THANH TOÁN ==================== */}
      {/* ========================================================================= */}
      {activeTab === 'reminders' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-amber-600" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Ghi nhận Lịch sử Nhắc thanh toán </h2>
              </div>
              <p className="text-slate-500 mt-0.5">
                Chủ nhà tự liên hệ đại diện khách thuê qua Zalo, điện thoại hoặc gặp trực tiếp sau ngày hạn thanh toán. Hệ thống không tự gửi tin nhắn. </p>
            </div>

            {activeSelectedNotice && (
              <button
                type="button"
                onClick={() => setShowReminderModal(true)}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                Ghi lần nhắc mới (Phòng {activeSelectedNotice.roomCode}) </button>
            )}
          </div>

          {/* Context Selector Strip */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Đang chọn khoản nợ:</span>
              <select
                value={selectedNoticeId || ''}
                onChange={(e) => setSelectedNoticeId(e.target.value)}
                className="px-2.5 py-1 border border-slate-300 rounded-lg bg-white font-mono font-bold text-blue-900"
              >
                {overdueDebtList.map(n => (
                  <option key={n.id} value={n.id}>
                    {n.roomCode} · {n.noticeCode} ({n.tenantName} - {n.uncollectedBalance.toLocaleString('vi-VN')} đ) </option>
                ))}
              </select>
            </div>

            {activeSelectedNotice && (
              <div className="flex items-center gap-4 text-[11px]">
                <span>Hạn gốc: <strong className="font-mono text-slate-900">{activeSelectedNotice.dueDate}</strong></span>
                <span>Quá hạn: <strong className="font-mono text-red-600">+{activeSelectedNotice.overdueDays} ngày</strong></span>
                <span>Số dư còn nợ: <strong className="font-mono text-red-700">{activeSelectedNotice.uncollectedBalance.toLocaleString('vi-VN')} đ</strong></span>
              </div>
            )}
          </div>

          {/* List of Reminders */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              Nhật ký các lần đôn đốc nhắc nợ đã ghi nhận ({activeNoticeReminders.length} lần): </h3>

            {activeNoticeReminders.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-xl text-slate-400">
                <Phone className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                <p className="font-semibold text-slate-600">Chưa có lịch sử nhắc nợ nào được ghi nhận cho khoản này.</p>
                <span className="text-[11px] text-slate-400">
                  Bấm "Ghi lần nhắc mới" sau khi Chủ nhà đã thực sự liên hệ trao đổi với khách thuê. </span>
              </div>
            ): (
              <div className="space-y-2.5">
                {activeNoticeReminders.map((r) => (
                  <div
                    key={r.id}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 hover:bg-slate-100/70 transition-colors"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          {r.channel}
                        </span>
                        <strong className="text-slate-900 font-mono text-xs">Phòng {r.roomCode}</strong>
                        {r.isRetrospective && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-200 text-slate-700">
                            Ghi hồi cứu </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                        <span>Ngày liên hệ: <strong className="text-slate-900">{r.contactDate}</strong></span>
                        <span>•</span>
                        <span>Ghi lúc: {new Date(r.loggedAt).toLocaleTimeString('vi-VN').substring(0, 5)}</span>
                      </div>
                    </div>

                    <div className="text-slate-800 text-xs">
                      <strong>Kết quả trao đổi:</strong> {r.result}
                    </div>

                    {r.notes && (
                      <p className="text-slate-600 text-[11px] italic bg-white p-2 rounded border border-slate-200">
                        {r.notes}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <span>Người ghi: <strong>{r.loggedBy}</strong></span>
                      {r.proofFile && (
                        <span className="flex items-center gap-1 text-blue-600 font-medium">
                          <Paperclip className="w-3 h-3" />
                          Có đính kèm chứng cứ: {r.proofFile}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ==================== TAB 3: PHẢN HỒI & HẸN THANH TOÁN ==================== */}
      {/* ========================================================================= */}
      {activeTab === 'promises' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Ghi nhận Phản hồi & Ngày hẹn Thanh toán </h2>
              </div>
              <p className="text-slate-500 mt-0.5">
                Ghi nhận cam kết ngày trả tiền của khách. <strong>Hạn thanh toán gốc và số dư nợ không bị thay đổi</strong>. </p>
            </div>

            {activeSelectedNotice && (
              <button
                type="button"
                onClick={() => setShowPromiseModal(true)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                Ghi nhận phản hồi mới (Phòng {activeSelectedNotice.roomCode}) </button>
            )}
          </div>

          {/* Context Selector Strip */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Đang chọn khoản nợ:</span>
              <select
                value={selectedNoticeId || ''}
                onChange={(e) => setSelectedNoticeId(e.target.value)}
                className="px-2.5 py-1 border border-slate-300 rounded-lg bg-white font-mono font-bold text-blue-900"
              >
                {overdueDebtList.map(n => (
                  <option key={n.id} value={n.id}>
                    {n.roomCode} · {n.noticeCode} ({n.tenantName} - {n.uncollectedBalance.toLocaleString('vi-VN')} đ) </option>
                ))}
              </select>
            </div>

            {activeSelectedNotice && (
              <div className="flex items-center gap-4 text-[11px]">
                <span>Hạn thanh toán gốc: <strong className="font-mono text-slate-900">{activeSelectedNotice.dueDate}</strong></span>
                <span>Số dư nợ: <strong className="font-mono text-red-700">{activeSelectedNotice.uncollectedBalance.toLocaleString('vi-VN')} đ</strong></span>
              </div>
            )}
          </div>

          {/* List of Promises */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              Lịch sử các phản hồi & cam kết thanh toán ({activeNoticePromises.length} lần): </h3>

            {activeNoticePromises.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-xl text-slate-400">
                <MessageCircle className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                <p className="font-semibold text-slate-600">Chưa có phản hồi hoặc lịch hẹn nào từ khách cho khoản này.</p>
                <span className="text-[11px] text-slate-400">
                  Khi khách nêu lý do khó khăn hoặc hứa ngày trả tiền, nhấn "Ghi nhận phản hồi mới". </span>
              </div>
            ): (
              <div className="space-y-2.5">
                {activeNoticePromises.map((p) => (
                  <div
                    key={p.id}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 hover:bg-slate-100/70 transition-colors"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                          {p.channel}
                        </span>
                        <strong className="text-slate-900 font-mono text-xs">Phòng {p.roomCode}</strong>
                        {p.hasPromiseDate && p.promisedDate && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-900 font-mono">
                            Hẹn thanh toán: {p.promisedDate}
                          </span>
                        )}
                        {p.needsVerificationASIS08 && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                            Chờ xác minh </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">
                        Thời điểm: {p.contactTime.substring(0, 16).replace('T', ' ')}
                      </span>
                    </div>

                    <div className="text-slate-800 text-xs leading-relaxed">
                      <strong>Ý kiến / Nội dung phản hồi:</strong> {p.content}
                    </div>

                    {p.needsVerificationASIS08 && (
                      <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-950 flex items-center justify-between">
                        <span>
                          * Khách báo đã chuyển khoản. Cần tra soát tại chức năng <strong>Thu tiền</strong>. Số dư nợ chưa được tự động giảm. </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <span>Người ghi nhận: <strong>{p.loggedBy}</strong></span>
                      {p.proofFile && (
                        <span className="flex items-center gap-1 text-blue-600 font-medium">
                          <Paperclip className="w-3 h-3" />
                          Đính kèm chứng từ: {p.proofFile}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ==================== TAB 4: CĂN CỨ XỬ LÝ NỢ KÉO DÀI ==================== */}
      {/* ========================================================================= */}
      {activeTab === 'long_debt_cn04' && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-purple-600" />
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Tra cứu Căn cứ Xử lý Nợ kéo dài </h2>
                </div>
                <p className="text-slate-500 mt-0.5">
                  Tổng hợp điều khoản hợp đồng vi phạm, lịch sử đôn đốc và tình trạng chậm trả. <strong>Chỉ hỗ trợ tra cứu, không tự ý áp dụng chế tài hay chấm dứt hợp đồng</strong>. </p>
              </div>

              {activeSelectedNotice && (
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1.5 rounded-lg border font-bold text-xs ${prolongedDebtAssessment.badgeColor}`}>
                    Trạng thái căn cứ: {prolongedDebtAssessment.status}
                  </span>
                </div>
              )}
            </div>

            {/* Context Selector */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Chọn khoản nợ cần tra cứu:</span>
                <select
                  value={selectedNoticeId || ''}
                  onChange={(e) => setSelectedNoticeId(e.target.value)}
                  className="px-2.5 py-1 border border-slate-300 rounded-lg bg-white font-mono font-bold text-purple-900"
                >
                  {overdueDebtList.map(n => (
                    <option key={n.id} value={n.id}>
                      {n.roomCode} · {n.noticeCode} ({n.tenantName} - {n.uncollectedBalance.toLocaleString('vi-VN')} đ) </option>
                  ))}
                </select>
              </div>

              {activeSelectedNotice && (
                <div className="flex items-center gap-3 text-[11px]">
                  <span>Hợp đồng: <strong className="font-mono text-slate-900">{activeSelectedNotice.contract?.id || '—'}</strong></span>
                  <span>Hạn gốc: <strong className="font-mono text-slate-900">{activeSelectedNotice.dueDate}</strong></span>
                  <span>Quá hạn: <strong className="font-mono text-red-600">+{activeSelectedNotice.overdueDays} ngày</strong></span>
                </div>
              )}
            </div>

            {activeSelectedNotice ? (
              <div className="space-y-4">
                {/* Khối 1: Thông tin số dư và nghĩa vụ */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <span className="font-bold text-slate-800 uppercase tracking-wider block text-xs">
                    1. Chi tiết số dư nợ quá hạn theo đúng lần thuê: </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                    <div className="p-3 bg-white rounded border border-slate-200">
                      <span className="text-slate-400 block">Phòng & Khách thuê:</span>
                      <strong className="text-slate-900 text-sm font-bold block">{activeSelectedNotice.roomCode}</strong>
                      <span className="text-slate-600">{activeSelectedNotice.tenantName}</span>
                    </div>
                    <div className="p-3 bg-white rounded border border-slate-200">
                      <span className="text-slate-400 block">Mã thông báo gốc:</span>
                      <strong className="text-slate-900 text-sm font-mono block">{activeSelectedNotice.noticeCode}</strong>
                      <span className="text-slate-500">Kỳ: {activeSelectedNotice.periodCode}</span>
                    </div>
                    <div className="p-3 bg-white rounded border border-slate-200">
                      <span className="text-slate-400 block">Hạn thanh toán gốc:</span>
                      <strong className="text-red-600 text-sm font-mono block">{activeSelectedNotice.dueDate}</strong>
                      <span className="text-red-700 font-bold">Quá hạn: +{activeSelectedNotice.overdueDays} ngày</span>
                    </div>
                    <div className="p-3 bg-white rounded border border-slate-200">
                      <span className="text-slate-400 block">Số dư nợ Chưa thu:</span>
                      <strong className="text-red-700 text-base font-mono font-bold block">
                        {activeSelectedNotice.uncollectedBalance.toLocaleString('vi-VN')} đ </strong>
                      <span className="text-[10px] text-slate-400">
                        (Tổng phải thu: {activeSelectedNotice.totalAmount.toLocaleString('vi-VN')} đ) </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border border-blue-200 bg-blue-50/50 rounded-xl space-y-2 text-xs">
                  <h3 className="font-bold text-blue-950">Nguồn của khoản công nợ này</h3>
                  {(() => {
                    const rec = reconciliations.find(r => r.id === activeSelectedNotice.reconciliationId);
                    const bill = rec ? periodBills.find(b => b.id === rec.billId) : undefined;
                    const receipt = paymentReceipts.find(r => r.noticeId === activeSelectedNotice.id && r.status === 'Đang hiệu lực');
                    return <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                      <p><strong>Bảng tính tiền:</strong> {bill ? `${bill.id} (đã xác nhận: ${bill.isConfirmed ? 'Có' : 'Không'})` : 'Không tìm thấy bảng tính nguồn — cần kiểm tra'}</p>
                      <p><strong>Thông báo gốc:</strong> {activeSelectedNotice.noticeCode}</p>
                      <p><strong>Hạn thanh toán:</strong> {activeSelectedNotice.originalDueDate || activeSelectedNotice.dueDate}</p>
                      <p><strong>Giao dịch đã xác nhận:</strong> {receipt ? 'Đã có — cần đối chiếu lại số dư' : 'Chưa ghi nhận thu đủ'}</p>
                      <p><strong>Đối trừ bằng cọc:</strong> {activeSelectedNotice.handledByDeposit.toLocaleString('vi-VN')} đ</p>
                      <p><strong>Số dư còn lại:</strong> {activeSelectedNotice.uncollectedBalance.toLocaleString('vi-VN')} đ</p>
                    </div>;
                  })()}
                  <p className="text-blue-800">Lịch sử nhắc và ngày khách hẹn trả chỉ là thông tin theo dõi, không thay đổi hạn thanh toán gốc.</p>
                </div>

                {/* Khối 2: Điều khoản hợp đồng liên quan */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 uppercase tracking-wider block text-xs">
                      2. Căn cứ điều khoản Hợp đồng thuê nhà: </span>
                    <span className="font-mono text-[11px] font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded">
                      {activeSelectedNotice.contract?.id || 'HĐ chưa xác định'}
                    </span>
                  </div>

                  {activeSelectedNotice.contract ? (
                    <div className="space-y-2.5 text-[11px]">
                      <div className="p-3 bg-white rounded border border-slate-200 space-y-1">
                        <strong className="text-slate-900 block font-semibold">
                          Điều 3. Thời hạn và phương thức thanh toán tiền thuê: </strong>
                        <p className="text-slate-700 leading-relaxed">
                          "Bên B có nghĩa vụ thanh toán đầy đủ tiền thuê nhà và các chi phí dịch vụ sử dụng (điện, nước, phí vệ sinh) trước hoặc đúng ngày <strong>05</strong> của kỳ thanh toán thông qua hình thức chuyển khoản ngân hàng vào tài khoản chỉ định của Bên A." </p>
                      </div>

                      <div className="p-3 bg-white rounded border border-slate-200 space-y-1">
                        <strong className="text-slate-900 block font-semibold text-red-900">
                          Điều 6. Xử lý vi phạm và đơn phương chấm dứt hợp đồng do chậm trả nợ: </strong>
                        <p className="text-slate-700 leading-relaxed italic bg-red-50/50 p-2 rounded border border-red-100">
                          "Trường hợp Bên B chậm thanh toán tiền thuê hoặc các chi phí dịch vụ quá <strong>15 ngày</strong> kể từ ngày đến hạn thanh toán mà không có thỏa thuận gia hạn bằng văn bản, Bên A có quyền đơn phương chấm dứt hợp đồng thuê, thu hồi lại phòng và khấu trừ toàn bộ tiền cọc để bù đắp các chi phí thiệt hại." </p>
                      </div>
                    </div>
                  ): (
                    <div className="p-3 bg-amber-50 rounded border border-amber-200 text-amber-900 text-[11px]">
                      Không tìm thấy bản ghi hợp đồng tương ứng cho lần thuê này (Lỗi ). Không dùng hợp đồng khác thay thế. </div>
                  )}
                </div>

                {/* Khối 3: Lịch sử đôn đốc và nhật ký trao đổi */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <span className="font-bold text-slate-800 uppercase tracking-wider block text-xs">
                    3. Bằng chứng đôn đốc & cam kết phản hồi: </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                    <div className="p-3 bg-white rounded border border-slate-200 space-y-2">
                      <strong className="text-slate-900 block font-semibold flex items-center justify-between">
                        <span>Lịch sử đôn đốc nhắc nợ:</span>
                        <span className="font-mono text-slate-500 font-normal">{activeNoticeReminders.length} lần</span>
                      </strong>
                      {activeNoticeReminders.length > 0 ? (
                        <div className="space-y-1.5 max-h-36 overflow-y-auto">
                          {activeNoticeReminders.map(r => (
                            <div key={r.id} className="p-1.5 bg-slate-50 rounded border border-slate-200 text-[10px]">
                              <div className="flex justify-between font-mono text-slate-500">
                                <span>{r.contactDate} · {r.channel}</span>
                                <span>{r.loggedBy}</span>
                              </div>
                              <p className="text-slate-800 font-medium">{r.result}</p>
                            </div>
                          ))}
                        </div>
                      ): (
                        <p className="text-slate-400 italic">Chưa có lịch sử nhắc nợ nào.</p>
                      )}
                    </div>

                    <div className="p-3 bg-white rounded border border-slate-200 space-y-2">
                      <strong className="text-slate-900 block font-semibold flex items-center justify-between">
                        <span>Phản hồi & Cam kết ngày hẹn:</span>
                        <span className="font-mono text-slate-500 font-normal">{activeNoticePromises.length} lần</span>
                      </strong>
                      {activeNoticePromises.length > 0 ? (
                        <div className="space-y-1.5 max-h-36 overflow-y-auto">
                          {activeNoticePromises.map(p => (
                            <div key={p.id} className="p-1.5 bg-slate-50 rounded border border-slate-200 text-[10px]">
                              <div className="flex justify-between font-mono text-slate-500">
                                <span>{p.contactTime.substring(0, 10)}</span>
                                {p.promisedDate && <span className="text-purple-700 font-bold">Hẹn: {p.promisedDate}</span>}
                              </div>
                              <p className="text-slate-800">{p.content}</p>
                            </div>
                          ))}
                        </div>
                      ): (
                        <p className="text-slate-400 italic">Chưa có phản hồi hay cam kết nào.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Khối 4: Kết luận tra cứu căn cứ */}
                <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2 text-xs text-indigo-950">
                  <div className="flex items-center justify-between">
                    <strong className="text-xs font-bold flex items-center gap-2">
                      <Scale className="w-4 h-4 text-indigo-700" />
                      Đánh giá bộ hồ sơ căn cứ (Hỗ trợ tra cứu nội bộ): </strong>
                    <span className={`px-2.5 py-1 rounded text-xs font-bold border ${prolongedDebtAssessment.badgeColor}`}>
                      {prolongedDebtAssessment.status}
                    </span>
                  </div>

                  <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-700">
                    {prolongedDebtAssessment.reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>

                  <div className="pt-2 border-t border-indigo-200/60 text-[10px] text-slate-500">
                    * Chức năng chỉ cung cấp bảng tổng hợp căn cứ tra cứu. Hệ thống không tự động áp dụng chế tài, không tự phạt nợ, không tự gửi lệnh thanh lý và không tự ý thay đổi hợp đồng. Chủ nhà tự quyết định các bước xử lý theo pháp lý ngoài hệ thống. </div>
                </div>
              </div>
            ): (
              <div className="p-8 text-center text-slate-400">
                Vui lòng chọn một khoản nợ quá hạn để tra cứu căn cứ xử lý nợ kéo dài. </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ==================== MODAL: GHI NHẬN LỊCH SỬ NHẮC NỢ ==================== */}
      {/* ========================================================================= */}
      {showReminderModal && activeSelectedNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-amber-600" />
                <div>
                  
                  <h3 className="font-bold text-slate-900 text-base">Ghi nhận lịch sử nhắc thanh toán</h3>
                </div>
              </div>
              <button
                onClick={() => setShowReminderModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thông tin khoản nợ chỉ xem */}
            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1.5 text-[11px] text-slate-700">
              <div className="flex justify-between items-center text-amber-950 font-bold border-b border-amber-200/60 pb-1">
                <span>Khoản nợ quá hạn:</span>
                <span className="font-mono">Phòng: {activeSelectedNotice.roomCode}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>Khách thuê: <strong className="text-slate-900">{activeSelectedNotice.tenantName}</strong></div>
                <div>Mã thông báo: <strong className="font-mono text-slate-900">{activeSelectedNotice.noticeCode}</strong></div>
                <div>Hạn thanh toán gốc: <strong className="font-mono text-slate-900">{activeSelectedNotice.dueDate}</strong></div>
                <div>Quá hạn: <strong className="font-mono text-red-600 font-bold">+{activeSelectedNotice.overdueDays} ngày</strong></div>
                <div className="col-span-2 pt-1 border-t border-amber-200 flex justify-between text-xs font-bold text-red-700">
                  <span>Dư nợ Chưa thu hiện hành:</span>
                  <span>{activeSelectedNotice.uncollectedBalance.toLocaleString('vi-VN')} đ</span>
                </div>
              </div>
            </div>

            {/* Biểu mẫu ghi nhắc */}
            <form onSubmit={handleSaveReminder} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Ngày liên hệ thực tế <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={remDate}
                    onChange={(e) => setRemDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-1 focus:ring-amber-500"
                    required
                  />
                  <span className="text-[10px] text-slate-400">Không chọn ngày tương lai</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kênh liên hệ thực tế <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={remChannel}
                    onChange={(e) => setRemChannel(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium text-xs focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="Zalo">Zalo (Thủ công)</option>
                    <option value="Điện thoại">Điện thoại</option>
                    <option value="Gặp trực tiếp">Gặp trực tiếp</option>
                  </select>
                  <span className="text-[10px] text-slate-400">User tự liên hệ ngoài hệ thống</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kết quả trao đổi đôn đốc <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={remResult}
                  onChange={(e) => setRemResult(e.target.value)}
                  rows={2}
                  placeholder="Ví dụ: Đã gọi điện thông báo số dư nợ kỳ 09/2026, khách báo đang thu xếp..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ghi chú nội dung trao đổi <span className="text-slate-400 font-normal">(Tùy chọn)</span>
                </label>
                <input
                  type="text"
                  value={remNotes}
                  onChange={(e) => setRemNotes(e.target.value)}
                  placeholder="Ghi chú chi tiết thêm..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Đính kèm tệp chứng cứ <span className="text-slate-400 font-normal">(Không bắt buộc theo )</span>
                </label>
                <input
                  type="text"
                  value={remProofFile}
                  onChange={(e) => setRemProofFile(e.target.value)}
                  placeholder="Ví dụ: anh_chup_tin_nhan_zalo.jpg..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remConfirmedContact}
                    onChange={(e) => setRemConfirmedContact(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-amber-600"
                  />
                  <span className="text-[11px] text-slate-700 font-semibold">
                    Xác nhận Chủ nhà đã thực sự liên hệ khách thuê (Bắt buộc theo ) </span>
                </label>

                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remIsRetrospective}
                    onChange={(e) => setRemIsRetrospective(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-slate-600"
                  />
                  <span className="text-[11px] text-slate-500">
                    Chế độ ghi hồi cứu: Ghi lại sự kiện đã liên hệ trước khi khoản nợ thay đổi </span>
                </label>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-[10px] text-slate-400 italic">
                  * Tuyệt đối không có nút gửi Zalo tự động </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowReminderModal(false)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium cursor-pointer"
                  >
                    Hủy </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold cursor-pointer shadow-xs"
                  >
                    Lưu lịch sử nhắc nợ </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ==================== MODAL: GHI NHẬN PHẢN HỒI & HẸN TRẢ ==================== */}
      {/* ========================================================================= */}
      {showPromiseModal && activeSelectedNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-600" />
                <div>
                  
                  <h3 className="font-bold text-slate-900 text-base">Ghi nhận phản hồi & Ngày hẹn thanh toán</h3>
                </div>
              </div>
              <button
                onClick={() => setShowPromiseModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thông tin khoản nợ chỉ xem */}
            <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl space-y-1.5 text-[11px] text-slate-700">
              <div className="flex justify-between items-center text-blue-950 font-bold border-b border-blue-200/60 pb-1">
                <span>Khoản nợ ghi nhận phản hồi:</span>
                <span className="font-mono">Phòng: {activeSelectedNotice.roomCode}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>Khách thuê: <strong className="text-slate-900">{activeSelectedNotice.tenantName}</strong></div>
                <div>Mã thông báo: <strong className="font-mono text-slate-900">{activeSelectedNotice.noticeCode}</strong></div>
                <div>Hạn thanh toán gốc: <strong className="font-mono text-slate-900">{activeSelectedNotice.dueDate}</strong></div>
                <div>Số dư nợ hiện tại: <strong className="font-mono text-red-700 font-bold">{activeSelectedNotice.uncollectedBalance.toLocaleString('vi-VN')} đ</strong></div>
              </div>
              <p className="text-[10px] text-blue-800 italic pt-1">
                * Ngày hẹn thanh toán không thay thế hạn thanh toán gốc của khoản nợ và không làm mất nhãn Quá hạn. </p>
            </div>

            {/* Biểu mẫu ghi nhận phản hồi */}
            <form onSubmit={handleSavePromise} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Thời điểm trao đổi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={promContactTime}
                    onChange={(e) => setPromContactTime(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kênh trao đổi <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={promChannel}
                    onChange={(e) => setPromChannel(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-medium text-xs"
                  >
                    <option value="Điện thoại">Điện thoại</option>
                    <option value="Zalo">Zalo</option>
                    <option value="Gặp trực tiếp">Gặp trực tiếp</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nội dung phản hồi của khách <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={promContent}
                  onChange={(e) => setPromContent(e.target.value)}
                  rows={2}
                  placeholder="Ví dụ: Khách giải thích chậm lương công ty, hứa thứ Hai tuần tới sẽ chuyển khoản..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>

              {/* Hẹn ngày thanh toán */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={promHasDate}
                      onChange={(e) => setPromHasDate(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600"
                    />
                    <span className="font-semibold text-slate-800 text-xs">Khách có hẹn ngày thanh toán cụ thể</span>
                  </label>
                </div>

                {promHasDate && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Ngày khách cam kết thanh toán <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={promDate}
                      onChange={(e) => setPromDate(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-xs"
                      required={promHasDate}
                    />
                    <span className="text-[10px] text-slate-400">
                      Lưu ý: Hạn thanh toán gốc vẫn là {activeSelectedNotice.dueDate}
                    </span>
                  </div>
                )}
              </div>

              {/* Khách báo đã chuyển khoản */}
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 space-y-2">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={promCustomerReportedPaid}
                    onChange={(e) => setPromCustomerReportedPaid(e.target.checked)}
                    className="mt-0.5 rounded border-purple-300 text-purple-600"
                  />
                  <div>
                    <span className="font-semibold text-purple-950 text-xs block">
                      Khách báo đã chuyển khoản & gửi chứng từ </span>
                    <span className="text-[10px] text-purple-800">
                      Hệ thống sẽ gắn cờ chuyển xác minh; không tự giảm nợ tại màn hình này. </span>
                  </div>
                </label>

                {promCustomerReportedPaid && (
                  <div>
                    <label className="block font-semibold text-purple-900 mb-1">Tên tệp chứng từ khách gửi</label>
                    <input
                      type="text"
                      value={promProofFile}
                      onChange={(e) => setPromProofFile(e.target.value)}
                      placeholder="Ví dụ: unc_techcombank_khachgui.png..."
                      className="w-full px-3 py-1.5 border border-purple-300 rounded-lg bg-white text-xs"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-[10px] text-slate-400 italic">
                  * Tuyệt đối không có nút Gạch nợ tại đây </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPromiseModal(false)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium cursor-pointer"
                  >
                    Hủy </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold cursor-pointer shadow-xs"
                  >
                    Lưu phản hồi & ngày hẹn </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ==================== MODAL: TRA CỨU TẤT CẢ KHOẢN PHẢI THU (CN-01 ĐK2) ==================== */}
      {/* ========================================================================= */}
      {showAllInvoicesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                <div>
                  
                  <h3 className="font-bold text-slate-900 text-base">Tra cứu Toàn bộ Khoản Phải thu (Hiệu lực / Tất toán / Hủy)</h3>
                </div>
              </div>
              <button
                onClick={() => setShowAllInvoicesModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-500 text-xs">
              Hệ thống hỗ trợ: Cho phép mở tra cứu lịch sử cả các khoản Đang hiệu lực, Đã tất toán (Đã thu), Hủy hoặc Đã xử lý bù cọc mà không bắt buộc khoản nợ phải còn số dư. </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                    <th className="py-2.5 px-3">Phòng</th>
                    <th className="py-2.5 px-3">Mã thông báo</th>
                    <th className="py-2.5 px-3">Kỳ thanh toán</th>
                    <th className="py-2.5 px-3">Hạn thanh toán</th>
                    <th className="py-2.5 px-3 text-right">Tổng tiền</th>
                    <th className="py-2.5 px-3 text-right">Bù cọc</th>
                    <th className="py-2.5 px-3 text-right">Dư nợ</th>
                    <th className="py-2.5 px-3 text-center">Trạng thái thanh toán</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {processedNotices.map((n) => (
                    <tr key={n.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{n.roomCode}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">{n.noticeCode}</td>
                      <td className="py-2.5 px-3">{n.periodCode}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{n.dueDate}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                        {n.totalAmount.toLocaleString('vi-VN')} đ </td>
                      <td className="py-2.5 px-3 text-right font-mono text-indigo-700">
                        {n.handledByDeposit > 0 ? n.handledByDeposit.toLocaleString('vi-VN') + ' đ': '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {n.uncollectedBalance.toLocaleString('vi-VN')} đ </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          n.isPaid
                            ? 'bg-emerald-100 text-emerald-800': n.handledByDeposit >= n.totalAmount
                            ? 'bg-indigo-100 text-indigo-800': n.isOverdue
                            ? 'bg-red-100 text-red-800': 'bg-blue-100 text-blue-800'
                        }`}>
                          {n.isPaid ? 'Đã thu chuyển khoản': n.handledByDeposit >= n.totalAmount ? 'Đã xử lý bù cọc': n.isOverdue ? `Chưa thu (Quá hạn ${n.overdueDays} ngày)`: 'Chưa thu (Còn hạn)'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAllInvoicesModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold cursor-pointer"
              >
                Đóng </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
