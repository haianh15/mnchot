import { toUserMessage } from '../../utils/userMessages';
import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PaymentNotice, PaymentReceipt, ReceiptAuditEntry } from '../../types';
import {
  CreditCard, CheckCircle2, AlertCircle, Clock, RotateCcw,
  Landmark, ArrowRight, ShieldCheck, History, X, Search, Filter,
  FileText, AlertTriangle, ArrowUpRight, Check, Eye, ShieldAlert,
  Calendar, User, Lock, Sparkles
} from 'lucide-react';

export const PaymentReceiptsView: React.FC<{initialNoticeId?: string}> = ({initialNoticeId}) => {
  const {
    paymentNotices,
    paymentReceipts,
    confirmPaymentReceipt08_2,
    revertPaymentReceipt08_2,
    activeBankAccount,
    currentUser
  } = useApp();

  // Tab: UC08.1 vs UC08.2 vs UC08.3 (Audit History)
  const [activeTab, setActiveTab] = useState<'uc08_1' | 'uc08_2' | 'uc08_3'>('uc08_1');

  // Filters for UC08.1
  const [roomFilter, setRoomFilter] = useState<string>('ALL');
  const [periodFilter, setPeriodFilter] = useState<string>('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'ALL' | 'UNPAID' | 'PAID' | 'OVERDUE'>('ALL');
  const [noticeStatusFilter, setNoticeStatusFilter] = useState<'ALL' | 'ACTIVE' | 'REPLACED'>('ALL');

  // Filters for UC08.3 (Audit History)
  const [auditFilter, setAuditFilter] = useState<'ALL' | 'REVERTED' | 'ACTIVE'>('ALL');
  const [auditSearchTerm, setAuditSearchTerm] = useState('');

  // Modal Confirm Receipt 
  const [selectedNotice, setSelectedNotice] = useState<PaymentNotice | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [receivedDate, setReceivedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [txnCode, setTxnCode] = useState<string>('');
  const [proofFile, setProofFile] = useState<string>('');
  const [confirmError, setConfirmError] = useState<string | null>(null);

  // Modal Revert Receipt (Requirement 4: Sửa xác nhận thu nhầm có lý do bắt buộc và lịch sử; không xóa giao dịch nguồn)
  const [showRevertModal, setShowRevertModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceipt | null>(null);
  const [revertReason, setRevertReason] = useState<string>('');
  const [revertError, setRevertError] = useState<string | null>(null);

  // Detail Modal for Inspection
  const [inspectNotice, setInspectNotice] = useState<PaymentNotice | null>(null);
  const [inspectReceiptAudit, setInspectReceiptAudit] = useState<PaymentReceipt | null>(null);

  useEffect(() => {
    if (!initialNoticeId) return;
    const targetNotice = paymentNotices.find(n => n.id === initialNoticeId);
    if (targetNotice) {
      setRoomFilter(targetNotice.roomCode);
      setInspectNotice(targetNotice);
      setActiveTab('uc08_1');
    }
  }, [initialNoticeId, paymentNotices]);

  // Quick suggestion reasons for revert
  const QUICK_REVERT_REASONS = [
    'Khách nộp nhầm tiền cọc sang tiền thuê phòng',
    'Chuyển khoản nhầm số phòng (ví dụ chuyển nhầm giữa P.101 và P.201)',
    'Giao dịch ngân hàng bị tra soát hoàn lại tiền',
    'Nhập nhầm mã giao dịch hoặc thao tác nhầm nút xác nhận'
  ];

  // Filtered Notices for UC08.1
  const filteredNotices = paymentNotices.filter(n => {
    if (roomFilter !== 'ALL' && n.roomCode !== roomFilter) return false;
    if (periodFilter !== 'ALL' && n.periodCode !== periodFilter) return false;
    if (noticeStatusFilter === 'ACTIVE' && n.status !== 'Đang hiệu lực') return false;
    if (noticeStatusFilter === 'REPLACED' && n.status !== 'Đã thay thế') return false;

    const isOverdue = n.paymentStatus === 'Chưa thu' && new Date(n.dueDate) < new Date();
    if (paymentStatusFilter === 'UNPAID' && n.paymentStatus !== 'Chưa thu') return false;
    if (paymentStatusFilter === 'PAID' && n.paymentStatus !== 'Đã thu') return false;
    if (paymentStatusFilter === 'OVERDUE' && (!isOverdue || n.paymentStatus !== 'Chưa thu')) return false;

    return true;
  });

  // Filtered Receipts for UC08.3 Audit History
  const filteredAuditReceipts = paymentReceipts.filter(r => {
    if (auditFilter === 'REVERTED' && r.status !== 'Không còn hiệu lực') return false;
    if (auditFilter === 'ACTIVE' && r.status !== 'Đang hiệu lực') return false;
    if (auditSearchTerm) {
      const term = auditSearchTerm.toLowerCase();
      const matchRoom = r.roomCode.toLowerCase().includes(term);
      const matchTxn = r.transactionCode.toLowerCase().includes(term);
      const matchReason = (r.invalidatedReason || '').toLowerCase().includes(term);
      if (!matchRoom && !matchTxn && !matchReason) return false;
    }
    return true;
  });

  // Financial Stats
  const totalReceivable = paymentNotices.filter(n => n.status === 'Đang hiệu lực').reduce((sum, n) => sum + n.totalAmount, 0);

  const totalCollected = paymentNotices.filter(n => n.status === 'Đang hiệu lực' && n.paymentStatus === 'Đã thu').reduce((sum, n) => sum + n.totalAmount, 0);

  const totalUncollected = totalReceivable - totalCollected;

  const overdueCount = paymentNotices.filter(
    n => n.status === 'Đang hiệu lực' && n.paymentStatus === 'Chưa thu' && new Date(n.dueDate) < new Date()
  ).length;

  const revertedReceiptsCount = paymentReceipts.filter(r => r.status === 'Không còn hiệu lực').length;

  // Open Confirm Modal
  const openConfirmModal = (notice: PaymentNotice) => {
    if (notice.status === 'Đã thay thế') {
      alert('Không được xác nhận thu bằng mã QR hoặc thông báo đã bị thay thế.');
      return;
    }
    if (notice.paymentStatus === 'Đã thu') {
      alert('Thông báo này đã được xác nhận thu đủ. Không thực hiện xác nhận thu lần nữa.');
      return;
    }

    setSelectedNotice(notice);
    setAmountReceived(notice.totalAmount);
    setReceivedDate(new Date().toISOString().split('T')[0]);
    setTxnCode('');
    setProofFile('');
    setConfirmError(null);
    setShowConfirmModal(true);
  };

  // Submit Confirm 
  const handleConfirmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNotice) return;
    setConfirmError(null);

    // Kiểm tra dữ liệu bắt buộc
    if (!txnCode.trim() || !receivedDate || !amountReceived) {
      setConfirmError('Vui lòng nhập đầy đủ Số tiền thực nhận, Ngày nhận tiền và Mã giao dịch ngân hàng.');
      return;
    }

    // Kiểm tra khớp đúng tổng tiền
    if (amountReceived !== selectedNotice.totalAmount) {
      setConfirmError(
        `Số tiền thực nhận (${amountReceived.toLocaleString('vi-VN')} đ) phải bằng đúng 100% tổng tiền trên thông báo QR (${selectedNotice.totalAmount.toLocaleString('vi-VN')} đ). Không chấp nhận trả một phần, tiền mặt hoặc thừa/thiếu.`
      );
      return;
    }

    const bankStr = selectedNotice.qrBankSnapshot.bankName + ' - ' + selectedNotice.qrBankSnapshot.accountNumber;
    const res = confirmPaymentReceipt08_2(
      selectedNotice.id,
      amountReceived,
      receivedDate,
      txnCode.trim(),
      bankStr,
      proofFile.trim()
    );

    if (res.success) {
      setShowConfirmModal(false);
      alert(toUserMessage(res.message));
      setActiveTab('uc08_2');
    } else {
      setConfirmError(res.message);
    }
  };

  // Submit Revert Receipt (Requirement 4: Sửa xác nhận thu nhầm có lý do bắt buộc và lịch sử; không xóa giao dịch nguồn)
  const handleRevertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReceipt) return;
    setRevertError(null);

    // Bắt buộc nhập lý do
    if (!revertReason.trim()) {
      setRevertError('/ Lý do sửa xác nhận thu nhầm là trường BẮT BUỘC. Vui lòng ghi rõ nguyên nhân sửa.');
      return;
    }

    const res = revertPaymentReceipt08_2(selectedReceipt.id, revertReason.trim());
    if (res.success) {
      setShowRevertModal(false);
      setRevertReason('');
      alert(toUserMessage(res.message));
      setActiveTab('uc08_3'); // Switch to audit history tab to view results
    } else {
      setRevertError(res.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            
            <h1 className="text-lg font-bold text-slate-900">Thu tiền</h1>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={()=>setActiveTab('uc08_1')} className={`rounded-lg border px-3 py-2 text-sm font-semibold ${activeTab==='uc08_1'?'bg-blue-50 text-blue-700 border-blue-200':'bg-white text-slate-700 border-slate-200'}`}>Theo dõi thanh toán</button>
          <button onClick={()=>setActiveTab('uc08_3')} className={`rounded-lg border px-3 py-2 text-sm font-semibold ${activeTab==='uc08_3'?'bg-blue-50 text-blue-700 border-blue-200':'bg-white text-slate-700 border-slate-200'}`}>Lịch sử xác nhận thu</button>
          {activeTab==='uc08_2' && <button onClick={()=>setActiveTab('uc08_1')} className="rounded-lg border px-3 py-2 text-sm font-semibold bg-white text-slate-700">← Danh sách</button>}
        </div>

      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 block">Tổng phải thu (Hiệu lực):</span>
          <span className="text-base font-bold font-mono text-slate-900">
            {totalReceivable.toLocaleString('vi-VN')} đ </span>
        </div>
        <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 shadow-xs">
          <span className="text-[11px] text-emerald-800 block">Đã thực thu vào tài khoản:</span>
          <span className="text-base font-bold font-mono text-emerald-700">
            {totalCollected.toLocaleString('vi-VN')} đ </span>
        </div>
        <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 shadow-xs">
          <span className="text-[11px] text-blue-800 block">Còn phải thu:</span>
          <span className="text-base font-bold font-mono text-blue-700">
            {totalUncollected.toLocaleString('vi-VN')} đ </span>
        </div>
        <div className="p-3.5 bg-purple-50/60 rounded-xl border border-purple-200 shadow-xs">
          <span className="text-[11px] text-purple-800 block">Giao dịch đã sửa thu nhầm:</span>
          <span className="text-base font-bold font-mono text-purple-700">
            {revertedReceiptsCount} giao dịch (Bảo toàn) </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: 8.1. THEO DÕI THANH TOÁN                                    */}
      {/* ========================================================================= */}
      {activeTab === 'uc08_1' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-500 flex items-center gap-1 font-medium">
                <Filter className="w-3.5 h-3.5" /> Lọc trạng thái: </span>
              {(['ALL', 'UNPAID', 'PAID', 'OVERDUE'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setPaymentStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
                    paymentStatusFilter === st
                      ? 'bg-slate-900 text-white': 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'ALL' && 'Tất cả'}
                  {st === 'UNPAID' && 'Chưa thu'}
                  {st === 'PAID' && 'Đã thu'}
                  {st === 'OVERDUE' && `Quá hạn (${overdueCount})`}
                </button>
              ))}
            </div>

            <span className="text-slate-400 text-[11px]">
              Hiển thị <strong>{filteredNotices.length}</strong> thông báo </span>
          </div>

          {/* Notices List */}
          <div className="space-y-3">
            {filteredNotices.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
                Không tìm thấy thông báo thanh toán nào phù hợp với bộ lọc. </div>
            ): (
              filteredNotices.map((n) => {
                const isOverdue = n.paymentStatus === 'Chưa thu' && new Date(n.dueDate) < new Date();
                const relatedReceipt = paymentReceipts.find(r => r.noticeId === n.id && r.status === 'Đang hiệu lực');

                return (
                  <div
                    key={n.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      n.status === 'Đã thay thế'
                        ? 'bg-slate-50 border-slate-200 opacity-60': n.paymentStatus === 'Đã thu'
                        ? 'bg-emerald-50/30 border-emerald-200': isOverdue
                        ? 'bg-red-50/30 border-red-200': 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 text-sm">{n.noticeCode}</span>
                          <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                            Phòng {n.roomCode}
                          </span>
                          <span className="font-mono text-slate-500">{n.periodCode}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            n.paymentStatus === 'Đã thu'
                              ? 'bg-emerald-100 text-emerald-800': isOverdue
                              ? 'bg-red-100 text-red-800': 'bg-amber-100 text-amber-800'
                          }`}>
                            {n.paymentStatus === 'Đã thu' ? 'Đã thu': isOverdue ? 'Quá hạn': 'Chưa thu'}
                          </span>
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          Hạn thanh toán: <strong className="font-mono text-slate-700">{n.dueDate}</strong> · Nội dung CK: <strong className="font-mono text-slate-800">{n.qrBankSnapshot.transferContent}</strong>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Tổng tiền QR:</span>
                          <span className="font-mono font-bold text-sm text-blue-900">
                            {n.totalAmount.toLocaleString('vi-VN')} đ </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setInspectNotice(n)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium cursor-pointer"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {n.status === 'Đang hiệu lực' && n.paymentStatus === 'Chưa thu' && (
                            <button
                              onClick={() => openConfirmModal(n)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Xác nhận thu đủ </button>
                          )}

                          {n.status === 'Đang hiệu lực' && n.paymentStatus === 'Đã thu' && relatedReceipt && (
                            <button
                              onClick={() => {
                                setSelectedReceipt(relatedReceipt);
                                setRevertReason('');
                                setRevertError(null);
                                setShowRevertModal(true);
                              }}
                              className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg font-semibold text-xs flex items-center gap-1 cursor-pointer border border-amber-200"
                              title="Sửa xác nhận thu nhầm"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                              Sửa thu nhầm </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: 8.2. CHỨNG TỪ THANH TOÁN                                    */}
      {/* ========================================================================= */}
      {activeTab === 'uc08_2' && (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-emerald-950">
            <div>
              <span className="font-bold block text-sm">Quản lý Chứng từ & Xác nhận Chuyển khoản </span>
              <p className="text-emerald-800 text-[11px] mt-0.5">
                Ghi nhận chứng từ xác nhận chuyển khoản ngân hàng khớp 100% mã QR. Cho phép sửa xác nhận thu nhầm với lý do bắt buộc và bảo toàn tuyệt đối giao dịch nguồn. </p>
            </div>
          </div>

          {/* List of Receipts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paymentReceipts.length === 0 ? (
              <div className="col-span-2 py-16 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
                Chưa có chứng từ thu tiền nào được xác nhận. </div>
            ): (
              paymentReceipts.map((r) => {
                const isInvalid = r.status === 'Không còn hiệu lực';

                return (
                  <div
                    key={r.id}
                    className={`p-4 rounded-2xl border text-xs space-y-3 ${
                      isInvalid
                        ? 'bg-red-50/40 border-red-200 opacity-80': 'bg-white border-slate-200 shadow-xs'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-sm">{r.transactionCode}</span>
                        <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          Phòng {r.roomCode}
                        </span>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.status === 'Đang hiệu lực'
                          ? 'bg-emerald-100 text-emerald-800': 'bg-red-100 text-red-800 line-through'
                      }`}>
                        {r.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-slate-600 text-[11px] bg-slate-50 p-2.5 rounded-xl">
                      <div>Số tiền: <strong className="font-mono text-blue-800 text-xs block">{r.amountReceived.toLocaleString('vi-VN')} đ</strong></div>
                      <div>Ngày nhận: <span className="font-mono text-slate-800 font-semibold block">{r.receivedDate}</span></div>
                      <div className="col-span-2">Tài khoản nhận: <span className="font-mono text-slate-800 block">{r.bankAccountReceived}</span></div>
                      <div>Người xác nhận: <span className="font-semibold text-slate-800 block">{r.confirmedBy}</span></div>
                      <div>Phương thức: <span className="text-emerald-700 font-medium block">Chuyển khoản NH</span></div>
                    </div>

                    {isInvalid && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-1 text-red-900 text-[11px]">
                        <div className="flex items-center gap-1 font-bold text-red-800">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Chứng từ đã bị hủy hiệu lực (Sửa thu nhầm):</span>
                        </div>
                        <p><strong>Lý do bắt buộc:</strong> {r.invalidatedReason}</p>
                        <p className="text-[10px] text-red-700">
                          Thời gian hủy: {new Date(r.invalidatedAt || '').toLocaleString('vi-VN')} · Người hủy: {r.invalidatedBy || 'Chủ nhà'}
                        </p>
                        <span className="inline-block px-1.5 py-0.5 bg-red-100 rounded text-[9px] font-bold text-red-800 mt-1">
                          Giao dịch nguồn được bảo toàn – Không xóa dữ liệu </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                      <button
                        onClick={() => setInspectReceiptAudit(r)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <History className="w-3 h-3 text-purple-600" />
                        Xem lịch sử kiểm toán </button>

                      {!isInvalid && (
                        <button
                          onClick={() => {
                            setSelectedReceipt(r);
                            setRevertReason('');
                            setRevertError(null);
                            setShowRevertModal(true);
                          }}
                          className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg font-semibold text-xs flex items-center gap-1.5 cursor-pointer border border-amber-200"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                          Sửa xác nhận thu nhầm </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: 8.3. LỊCH SỬ & KIỂM TOÁN THU NHẦM (REQUIREMENT 4)                  */}
      {/* ========================================================================= */}
      {activeTab === 'uc08_3' && (
        <div className="space-y-4">
          <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-purple-950">
            <div>
              <div className="flex items-center gap-2 font-bold text-sm">
                <History className="w-4 h-4 text-purple-700" />
                <span>Nhật ký Kiểm toán & Lịch sử Sửa xác nhận thu nhầm (Requirement 4)</span>
              </div>
              <p className="text-purple-800 text-[11px] mt-0.5">
                Bảo toàn tuyệt đối giao dịch nguồn theo & 10. Khi User sửa thu nhầm, hệ thống giữ lại bản ghi chứng từ trong lịch sử và lưu đầy đủ lý do bắt buộc, thời gian, người thực hiện. </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-lg font-bold text-xs border border-purple-200">
                {revertedReceiptsCount} lần sửa thu nhầm </span>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              {(['ALL', 'REVERTED', 'ACTIVE'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setAuditFilter(tab)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    auditFilter === tab
                      ? 'bg-purple-600 text-white shadow-xs': 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab === 'ALL' && 'Tất cả chứng từ'}
                  {tab === 'REVERTED' && `Chứng từ đã sửa thu nhầm (${revertedReceiptsCount})`}
                  {tab === 'ACTIVE' && 'Chứng từ đang hiệu lực'}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Tìm mã GD, phòng, lý do..."
                value={auditSearchTerm}
                onChange={(e) => setAuditSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Audit History Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                    <th className="py-3 px-3">Mã giao dịch nguồn</th>
                    <th className="py-3 px-3">Phòng</th>
                    <th className="py-3 px-3">Số tiền</th>
                    <th className="py-3 px-3">Trạng thái hiện tại</th>
                    <th className="py-3 px-3">Lý do sửa bắt buộc</th>
                    <th className="py-3 px-3">Thời gian & Người sửa</th>
                    <th className="py-3 px-3 text-right">Chi tiết kiểm toán</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAuditReceipts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        Không có bản ghi kiểm toán nào phù hợp. </td>
                    </tr>
                  ): (
                    filteredAuditReceipts.map((r) => {
                      const isReverted = r.status === 'Không còn hiệu lực';
                      const latestAudit = r.auditHistory?.[r.auditHistory.length - 1];

                      return (
                        <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3">
                            <span className="font-mono font-bold text-slate-900 block">{r.transactionCode}</span>
                            <span className="text-[10px] text-slate-400">ID: {r.id}</span>
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-800">
                            Phòng {r.roomCode}
                            <span className="block text-[10px] text-slate-400">{r.periodCode}</span>
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-blue-900">
                            {r.amountReceived.toLocaleString('vi-VN')} đ </td>
                          <td className="py-3 px-3">
                            {isReverted ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                                <AlertTriangle className="w-3 h-3 text-red-600" />
                                Không còn hiệu lực (Đã sửa) </span>
                            ): (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Đang hiệu lực </span>
                            )}
                          </td>
                          <td className="py-3 px-3 max-w-xs">
                            {isReverted && r.invalidatedReason ? (
                              <div className="space-y-0.5">
                                <span className="font-medium text-slate-800 block text-xs">
                                  {r.invalidatedReason}
                                </span>
                                <span className="text-[10px] text-emerald-700 font-semibold block">
                                  ✓ Không xóa giao dịch nguồn </span>
                              </div>
                            ): (
                              <span className="text-slate-400 text-[11px]">— Không sửa đổi —</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-slate-600">
                            {isReverted && r.invalidatedAt ? (
                              <div>
                                <span className="font-mono text-[11px] block">
                                  {new Date(r.invalidatedAt).toLocaleString('vi-VN')}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  Bởi: <strong>{r.invalidatedBy || 'Chủ nhà'}</strong>
                                </span>
                              </div>
                            ): (
                              <div>
                                <span className="font-mono text-[11px] block">{r.receivedDate}</span>
                                <span className="text-[10px] text-slate-400">Tạo bởi: {r.confirmedBy}</span>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => setInspectReceiptAudit(r)}
                              className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-lg text-xs font-semibold cursor-pointer border border-purple-200 inline-flex items-center gap-1"
                            >
                              <History className="w-3.5 h-3.5" />
                              Xem dòng thời gian </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONFIRM RECEIPT                                            */}
      {/* ========================================================================= */}
      {showConfirmModal && selectedNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Xác nhận thu tiền chuyển khoản</h3>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {confirmError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-[11px] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{confirmError}</span>
              </div>
            )}

            {/* Notice Quick Card */}
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1.5 text-slate-700">
              <div className="flex justify-between">
                <span>Thông báo thu tiền:</span>
                <strong className="font-mono text-slate-900">{selectedNotice.noticeCode}</strong>
              </div>
              <div className="flex justify-between">
                <span>Phòng & Kỳ:</span>
                <strong>Phòng {selectedNotice.roomCode} - {selectedNotice.periodCode}</strong>
              </div>
              <div className="flex justify-between">
                <span>Tài khoản nhận tiền:</span>
                <span className="font-mono">{selectedNotice.qrBankSnapshot.bankName} - {selectedNotice.qrBankSnapshot.accountNumber}</span>
              </div>
              <div className="flex justify-between font-bold text-blue-900 pt-1.5 border-t border-blue-200 text-sm">
                <span>Tổng tiền yêu cầu trên QR:</span>
                <span className="font-mono text-base">{selectedNotice.totalAmount.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleConfirmSubmit} className="space-y-3.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Số tiền thực nhận vào tài khoản (đ) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-sm text-blue-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Ngày nhận tiền <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={receivedDate}
                    onChange={(e) => setReceivedDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Mã giao dịch ngân hàng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={txnCode}
                    onChange={(e) => setTxnCode(e.target.value)}
                    required
                    placeholder="Mã FT..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tệp ảnh minh chứng chuyển khoản </label>
                <input
                  type="text"
                  value={proofFile}
                  onChange={(e) => setProofFile(e.target.value)}
                  placeholder="Tên tệp ảnh hoặc liên kết minh chứng..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium cursor-pointer"
                >
                  Hủy </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer shadow-xs"
                >
                  Xác nhận đã thu đủ </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SỬA XÁC NHẬN THU NHẦM (REQUIREMENT 4: LÝ DO BẮT BUỘC & LỊCH SỬ)   */}
      {/* ========================================================================= */}
      {showRevertModal && selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Sửa xác nhận thu nhầm</h3>
                <span className="text-[11px] text-purple-700 font-semibold">
                  Ghi nhận điều chỉnh và lưu vết lịch sử giao dịch </span>
              </div>
              <button
                onClick={() => setShowRevertModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {revertError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-[11px] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span className="font-semibold">{revertError}</span>
              </div>
            )}

            {/* Callout explaining source transaction preservation */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1 text-[11px]">
              <p className="font-bold flex items-center gap-1.5 text-amber-950">
                <ShieldAlert className="w-4 h-4 text-amber-700" />
                Bảo toàn dữ liệu kiểm toán & giao dịch nguồn: </p>
              <p>
                Hệ thống <strong>giữ lại nguyên vẹn bản ghi chứng từ nguồn</strong> trong cơ sở dữ liệu và đánh dấu trạng thái <strong>&quot;Không còn hiệu lực&quot;</strong>. Thông báo thanh toán tương ứng sẽ hoàn tác về <strong>&quot;Chưa thu&quot;</strong> để tính lại công nợ chính xác. </p>
            </div>

            <div className="p-3 bg-slate-100 rounded-xl space-y-1 text-slate-700 text-xs">
              <div className="flex justify-between">
                <span>Mã giao dịch ngân hàng nguồn:</span>
                <strong className="font-mono text-slate-900">{selectedReceipt.transactionCode}</strong>
              </div>
              <div className="flex justify-between">
                <span>Số tiền giao dịch:</span>
                <strong className="font-mono text-blue-900">{selectedReceipt.amountReceived.toLocaleString('vi-VN')} đ (Phòng {selectedReceipt.roomCode})</strong>
              </div>
              <div className="flex justify-between">
                <span>Ngày xác nhận ban đầu:</span>
                <span className="font-mono">{selectedReceipt.receivedDate}</span>
              </div>
            </div>

            <form onSubmit={handleRevertSubmit} className="space-y-3.5">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Lý do sửa xác nhận thu nhầm <span className="text-red-500">* (Bắt buộc theo )</span>
                </label>
                <textarea
                  value={revertReason}
                  onChange={(e) => setRevertReason(e.target.value)}
                  rows={3}
                  required
                  placeholder="Bắt buộc nhập lý do cụ thể (VD: Khách chuyển nhầm tiền cọc sang tiền thuê, thao tác nhầm nút, đối soát ngân hàng bị tra soát...)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                />

                {/* Quick suggestions */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  <span className="text-[10px] text-slate-500 w-full font-medium">Gợi ý lý do nhanh:</span>
                  {QUICK_REVERT_REASONS.map((rText, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setRevertReason(rText)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] cursor-pointer transition-colors"
                    >
                      + {rText}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowRevertModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium cursor-pointer"
                >
                  Hủy </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold cursor-pointer shadow-xs"
                >
                  Xác nhận sửa thu nhầm & Lưu lịch sử </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: INSPECT RECEIPT AUDIT TIMELINE (REQUIREMENT 4)                     */}
      {/* ========================================================================= */}
      {inspectReceiptAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Dòng thời gian Kiểm toán Chứng từ </h3>
                <span className="font-mono text-[11px] text-slate-500">
                  Mã giao dịch: {inspectReceiptAudit.transactionCode} (Phòng {inspectReceiptAudit.roomCode}) </span>
              </div>
              <button
                onClick={() => setInspectReceiptAudit(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-950 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Giao dịch nguồn được lưu trữ vĩnh viễn trong nhật ký đối soát, không bị xóa bỏ.</span>
            </div>

            {/* Audit History Timeline */}
            <div className="space-y-3 relative pl-4 border-l-2 border-slate-200">
              {(inspectReceiptAudit.auditHistory || [
                {
                  action: 'Tạo chứng từ thu tiền',
                  timestamp: inspectReceiptAudit.confirmedAt,
                  user: inspectReceiptAudit.confirmedBy,
                  transactionCode: inspectReceiptAudit.transactionCode,
                  amount: inspectReceiptAudit.amountReceived,
                  newStatus: 'Đang hiệu lực',
                  details: `Xác nhận thu đủ ${inspectReceiptAudit.amountReceived.toLocaleString('vi-VN')} đ`
                }
              ]).map((entry, idx) => (
                <div key={idx} className="relative space-y-1">
                  <div className="absolute -left-[21px] top-0.5 w-3 h-3 rounded-full bg-blue-600 border-2 border-white"></div>
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900 text-xs">{entry.action}</strong>
                    <span className="font-mono text-[10px] text-slate-400">
                      {new Date(entry.timestamp).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Người thực hiện: <strong>{entry.user}</strong>
                  </div>
                  {entry.reason && (
                    <div className="p-2 bg-amber-50 text-amber-900 rounded-lg text-[11px] border border-amber-200">
                      <strong>Lý do bắt buộc:</strong> {entry.reason}
                    </div>
                  )}
                  {entry.details && (
                    <div className="text-[10px] text-slate-500 italic">{entry.details}</div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setInspectReceiptAudit(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl font-semibold cursor-pointer"
              >
                Đóng </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: INSPECT NOTICE DETAIL                                              */}
      {/* ========================================================================= */}
      {inspectNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Chi tiết thông báo {inspectNotice.noticeCode}</h3>
              <button
                onClick={() => setInspectNotice(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-slate-700">
              <div className="flex justify-between">
                <span>Phòng & Kỳ:</span> <strong>Phòng {inspectNotice.roomCode} · {inspectNotice.periodCode}</strong>
              </div>
              <div className="flex justify-between">
                <span>Trạng thái hiệu lực:</span> <span className="font-bold">{inspectNotice.status}</span>
              </div>
              <div className="flex justify-between">
                <span>Trạng thái thanh toán:</span> <span className="font-bold text-emerald-700">{inspectNotice.paymentStatus}</span>
              </div>
              <div className="flex justify-between">
                <span>Hạn thanh toán:</span> <span className="font-mono font-bold">{inspectNotice.dueDate}</span>
              </div>

              <div className="p-3 bg-slate-100 rounded-xl space-y-1">
                <span className="font-bold text-slate-900 block">Tài khoản nhận tiền ghi nhận lúc tạo:</span>
                <div>Ngân hàng: <strong>{inspectNotice.qrBankSnapshot.bankName}</strong></div>
                <div>Số tài khoản: <strong className="font-mono text-blue-700">{inspectNotice.qrBankSnapshot.accountNumber}</strong></div>
                <div>Chủ tài khoản: <span className="uppercase">{inspectNotice.qrBankSnapshot.accountHolder}</span></div>
                <div>Nội dung CK: <strong className="font-mono text-red-700">{inspectNotice.qrBankSnapshot.transferContent}</strong></div>
              </div>

              <div className="flex justify-between font-bold text-blue-900 text-sm pt-2 border-t border-slate-200">
                <span>Tổng tiền QR cố định:</span>
                <span>{inspectNotice.totalAmount.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setInspectNotice(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl font-semibold cursor-pointer"
              >
                Đóng </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
