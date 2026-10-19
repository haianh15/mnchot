import { toUserMessage } from '../../utils/userMessages';
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { PaymentNotice, PeriodBill, ReceivableReconciliation } from '../../types';
import {
  QrCode, Share2, Download, CheckCircle2, AlertCircle, RefreshCw,
  Landmark, Calendar, Plus, Eye, Copy, ArrowRight, X, ShieldAlert,
  FileCheck2, Search, Info, ExternalLink, ArrowLeft, Clock, AlertTriangle, Sparkles
} from 'lucide-react';

// Compare due dates as local calendar days, not timestamps with hours/timezone offsets.
const localDateISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

interface PaymentNoticesViewProps {
  onNavigateToReceipts?: (noticeId: string) => void;
  initialBillId?: string;
}

export const PaymentNoticesView: React.FC<PaymentNoticesViewProps> = ({ onNavigateToReceipts, initialBillId }) => {
  const {
    paymentNotices,
    periodBills,
    reconciliations,
    activeBankAccount,
    performReconciliationUC07_1,
    confirmReconciliationUC07_1,
    generatePaymentNotice07_2,
    replacePaymentNotice07_2,
    rooms,
    contracts
  } = useApp();

  // Active top tab in QT07
  const [activeTab, setActiveTab] = useState<'uc07_1' | 'uc07_2' | 'uc07_3'>('uc07_3');

  // UC07.1 State
  const [selectedBillId, setSelectedBillId] = useState<string>(
    initialBillId || periodBills.find(b => b.isConfirmed)?.id || ''
  );
  const [currentReconciliation, setCurrentReconciliation] = useState<ReceivableReconciliation | null>(null);
  const [showBillSourceModal, setShowBillSourceModal] = useState<boolean>(false);
  const [reconcileCheckDone, setReconcileCheckDone] = useState<boolean>(false);

  // UC07.2 State
  const [selectedNotice, setSelectedNotice] = useState<PaymentNotice | null>(
    paymentNotices[0] || null
  );
  const [pendingOpenNoticeId, setPendingOpenNoticeId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createBillId, setCreateBillId] = useState(selectedBillId);
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split('T')[0];
  });
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [replaceNoticeId, setReplaceNoticeId] = useState('');
  const [replaceReason, setReplaceReason] = useState('');

  // UC07.3 State
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [showShareGuideModal, setShowShareGuideModal] = useState(false);
  const [showOldDebtModal, setShowOldDebtModal] = useState(false);
  const [noticeFilter, setNoticeFilter] = useState<'ALL' | 'ACTIVE' | 'REPLACED' | 'UNPAID' | 'PAID'>('ALL');

  const noticeCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialBillId) {
      setSelectedBillId(initialBillId);
      setCreateBillId(initialBillId);
      setActiveTab('uc07_1');
    }
  }, [initialBillId]);

  // State updates after issuing/replacing a notice are asynchronous. Open only the new record.
  useEffect(() => {
    if (!pendingOpenNoticeId) return;
    const record = paymentNotices.find(n => n.id === pendingOpenNoticeId);
    if (record) {
      setSelectedNotice(record);
      setPendingOpenNoticeId(null);
      setActiveTab('uc07_3');
    }
  }, [paymentNotices, pendingOpenNoticeId]);

  // Initialize reconciliation for selected bill
  useEffect(() => {
    if (selectedBillId) {
      const existing = reconciliations.find(r => r.billId === selectedBillId);
      if (existing) {
        setCurrentReconciliation(existing);
        const currentBill = periodBills.find(b => b.id === selectedBillId);
        setReconcileCheckDone(Boolean(currentBill && existing.billVersion === currentBill.version));
      } else {
        setReconcileCheckDone(false);
        setCurrentReconciliation(null);
      }
    }
  }, [selectedBillId, reconciliations]);

  // Hiển thị ảnh VietQR thanh toán trực tiếp; không mã hoá URL ảnh thành một QR khác.
  // Với ngân hàng chưa xác định mã VietQR, không tạo QR có nội dung không hợp lệ.
  useEffect(() => {
    setQrDataUrl('');
    if (!selectedNotice || selectedNotice.status !== 'Đang hiệu lực' || selectedNotice.paymentStatus === 'Đã thu') return;
    const bankName = selectedNotice.qrBankSnapshot.bankName.toLowerCase();
    const banks: { [key: string]: string } = {'mb bank':'MB','ngân hàng quân đội':'MB','vietcombank':'VCB','vcb':'VCB','vietinbank':'ICB','bidv':'BIDV','techcombank':'TCB','acb':'ACB','vpbank':'VPB','tpbank':'TPB','sacombank':'STB','vib':'VIB'};
    const bankCode = Object.entries(banks).find(([name])=>bankName.includes(name))?.[1];
    if (!bankCode) return;
    const snapshot = selectedNotice.qrBankSnapshot;
    setQrDataUrl(`https://img.vietqr.io/image/${bankCode}-${encodeURIComponent(snapshot.accountNumber)}-compact2.png?amount=${snapshot.amount}&addInfo=${encodeURIComponent(snapshot.transferContent)}&accountName=${encodeURIComponent(snapshot.accountHolder)}`);
  }, [selectedNotice]);

  const selectedBill = periodBills.find(b => b.id === selectedBillId);

  // Step 2 in UC07.1: Perform Check
  const handlePerformCheck = () => {
    if (!selectedBillId) return;
    const res = performReconciliationUC07_1(selectedBillId);
    if (res.result) {
      setCurrentReconciliation(res.result);
      setReconcileCheckDone(true);
      alert(toUserMessage(res.message));
    } else {
      alert(toUserMessage(res.message));
    }
  };

  // Step 3 in UC07.1: Confirm and move to UC07.2
  const handleConfirmReconciliation = () => {
    if (!currentReconciliation) return;
    const res = confirmReconciliationUC07_1(currentReconciliation.id);
    if (res.success) {
      alert(toUserMessage(res.message));
      setCreateBillId(currentReconciliation.billId);
      setActiveTab('uc07_2');
      setShowCreateModal(true);
    } else {
      alert(toUserMessage(res.message));
    }
  };

  // UC07.2: Create Notice
  const handleCreateNoticeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createBillId) return;

    const res = generatePaymentNotice07_2(createBillId, dueDate, currentReconciliation?.id);
    if (!res.success) {
      alert(toUserMessage(res.message));
    } else {
      setShowCreateModal(false);
      if (res.noticeId) setPendingOpenNoticeId(res.noticeId);
      alert(toUserMessage(res.message));
      setActiveTab('uc07_3');
    }
  };

  // UC07.2: Replace Notice
  const handleReplaceNoticeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replaceNoticeId) return;

    const res = replacePaymentNotice07_2(replaceNoticeId, replaceReason);
    if (!res.success) {
      alert(toUserMessage(res.message));
    } else {
      setShowReplaceModal(false);
      setReplaceReason('');
      if (res.noticeId) setPendingOpenNoticeId(res.noticeId);
      alert(toUserMessage(res.message));
      setActiveTab('uc07_3');
    }
  };

  // UC07.3: Real Canvas image download
  const handleDownloadNoticeCard = () => {
    if (!selectedNotice) return;
    
    // Condition check (Điều kiện trước 3 & )
    if (selectedNotice.status === 'Đã thay thế') {
      alert('Thông báo này đã bị thay thế bởi bản mới. Không được phép tải ảnh mã QR đã vô hiệu hóa.');
      return;
    }
    if (selectedNotice.paymentStatus === 'Đã thu') {
      alert('Thông báo này đã thu tiền đầy đủ. Không tiếp tục chia sẻ mã QR để đòi tiền.');
      return;
    }

    // Render Canvas
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background & Card
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 800, 1000);

    ctx.fillStyle = '#ffffff';
    ctx.roundRect(40, 40, 720, 920, 24);
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Top Header Banner
    ctx.fillStyle = '#1e3a8a';
    ctx.roundRect(40, 40, 720, 120, [24, 24, 0, 0]);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('THÔNG BÁO THANH TOÁN', 70, 90);
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#93c5fd';
    ctx.fillText('HỆ THỐNG QUẢN LÝ DÀNH CHO CHỦ NHÀ · THÔNG BÁO THU TIỀN', 70, 125);

    // Notice info block
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(`Mã thông báo: ${selectedNotice.noticeCode}`, 70, 190, 660);
    ctx.font = '15px sans-serif';
    ctx.fillStyle = '#64748b';
    const noticeContract = contracts.find(c => c.leaseId === selectedNotice.leaseId && c.roomCode === selectedNotice.roomCode);
    ctx.fillText(`Khách thuê: ${noticeContract?.tenantName || 'Theo hợp đồng thuê'} · Phòng: ${selectedNotice.roomCode}`, 70, 216, 660);
    ctx.fillText(`Kỳ thu: ${selectedNotice.periodCode} · Hạn thanh toán: ${selectedNotice.dueDate} · Ngày lập: ${selectedNotice.createdAt.slice(0, 10)}`, 70, 239, 660);

    // Group 1: Next rent
    ctx.fillStyle = '#f1f5f9';
    ctx.roundRect(70, 260, 660, 90, 12);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('Tiền thuê kỳ tiếp theo (thu trước)', 90, 290);
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText(`Thời gian: ${selectedNotice.nextRentPeriod}`, 90, 320);
    ctx.fillStyle = '#1e40af';
    ctx.font = 'bold 16px sans-serif';
    const rentVal = selectedNotice.breakdown?.nextRentAmount || 0;
    ctx.fillText(`${rentVal.toLocaleString('vi-VN')} đ`, 600, 320);

    // Group 2: Services
    ctx.fillStyle = '#f1f5f9';
    ctx.roundRect(70, 370, 660, 120, 12);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('Tiền điện, nước và dịch vụ vừa sử dụng (thu sau)', 90, 400);
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText(`Kỳ dịch vụ: ${selectedNotice.servicePeriod}`, 90, 430);
    ctx.fillText(`Điện & Nước: ${((selectedNotice.breakdown?.electricityAmount || 0) + (selectedNotice.breakdown?.waterAmount || 0)).toLocaleString('vi-VN')} đ | Phí khác: ${(selectedNotice.breakdown?.serviceFees?.reduce((s, f) => s + f.amount, 0) || 0).toLocaleString('vi-VN')} đ`, 90, 460);
    ctx.fillStyle = '#1e40af';
    ctx.font = 'bold 16px sans-serif';
    const srvVal = (selectedNotice.totalAmount - (selectedNotice.breakdown?.nextRentAmount || 0));
    ctx.fillText(`${srvVal.toLocaleString('vi-VN')} đ`, 600, 460);

    // Total Amount highlight
    ctx.fillStyle = '#eff6ff';
    ctx.roundRect(70, 510, 660, 70, 12);
    ctx.fill();
    ctx.strokeStyle = '#bfdbfe';
    ctx.stroke();
    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('TỔNG PHẢI THANH TOÁN:', 90, 552);
    ctx.fillStyle = '#2563eb';
    ctx.font = 'bold 24px monospace';
    ctx.fillText(`${selectedNotice.totalAmount.toLocaleString('vi-VN')} đ`, 540, 554);

    // Bank details
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`Ngân hàng: ${selectedNotice.qrBankSnapshot.bankName}`, 70, 620, 340);
    ctx.fillText(`Số tài khoản: ${selectedNotice.qrBankSnapshot.accountNumber}`, 70, 650, 340);
    ctx.fillText(`Chủ tài khoản: ${selectedNotice.qrBankSnapshot.accountHolder}`, 70, 680, 340);
    ctx.fillStyle = '#dc2626';
    ctx.fillText(`Nội dung CK: ${selectedNotice.qrBankSnapshot.transferContent}`, 70, 710, 340);

    // Load QR Image
    if (qrDataUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onerror = () => alert('Không tải được ảnh VietQR. Hãy kiểm tra kết nối và cấu hình ngân hàng trước khi tải thông báo.');
      img.onload = () => {
        ctx.drawImage(img, 450, 600, 260, 260);
        // Footer note
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px sans-serif';
        ctx.fillText('Vui lòng quét mã QR hoặc chuyển khoản đúng nội dung và số tiền trên.', 70, 920);

        // Download PNG
        const a = document.createElement('a');
        a.download = `thong_bao_thu_tien_${selectedNotice.roomCode}_${selectedNotice.periodCode.replace(/\s+/g, '_')}.png`;
        try { a.href = canvas.toDataURL('image/png'); a.click(); }
        catch { alert('Nguồn VietQR không cho phép xuất ảnh trên trình duyệt. Hãy mở ảnh QR riêng để tải, hoặc cấu hình lưu ảnh QR tại máy chủ.'); }
      };
      img.src = qrDataUrl;
    } else {
      alert('Không tạo được mã VietQR do chưa xác định được ngân hàng nhận. Vui lòng kiểm tra Cài đặt.');
    }
  };

  // UC07.3: Manual Zalo sharing
  const handleShareZaloManual = () => {
    if (!selectedNotice) return;
    
    if (selectedNotice.status === 'Đã thay thế') {
      alert('Thông báo này đã bị thay thế bởi bản mới. Không được phép chia sẻ mã QR đã vô hiệu hóa.');
      return;
    }
    if (selectedNotice.paymentStatus === 'Đã thu') {
      alert('Thông báo này đã thu tiền xong. Không chia sẻ mã QR đòi tiền.');
      return;
    }

    setShowShareGuideModal(true);
  };

  // Filtered payment notices list
  const filteredNotices = paymentNotices.filter(n => {
    if (noticeFilter === 'ACTIVE') return n.status === 'Đang hiệu lực';
    if (noticeFilter === 'REPLACED') return n.status === 'Đã thay thế';
    if (noticeFilter === 'UNPAID') return n.paymentStatus === 'Chưa thu';
    if (noticeFilter === 'PAID') return n.paymentStatus === 'Đã thu';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header and Sub-Tab Navigation */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            
            <h1 className="text-lg font-bold text-slate-900">Thông báo thanh toán</h1>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={()=>setActiveTab('uc07_3')} className={`px-3 py-2 rounded-lg text-sm font-semibold ${activeTab==='uc07_3'?'bg-blue-50 text-blue-700 border border-blue-200':'border border-slate-200 text-slate-700 bg-white hover:bg-slate-50'}`}>Danh sách thông báo</button>
          <button onClick={()=>setActiveTab('uc07_1')} className="px-3 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700">+ Đối chiếu để lập thông báo</button>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* TAB 1: 7.1. ĐỐI CHIẾU KHOẢN PHẢI THU                               */}
      {/* ========================================================================= */}
      {activeTab === 'uc07_1' && (
        <div className="space-y-6">
          {/* Guide banner */}
          <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-2xl flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-900 space-y-1">
              <p className="font-bold">Lưu ý: </p>
              <ul className="list-disc list-inside space-y-0.5 text-blue-800">
                <li> Phân tách rõ ràng 2 nhóm: Tiền thuê kỳ tiếp theo (trả trước) và Tiền điện, nước, phí dịch vụ kỳ vừa sử dụng (trả sau).</li>
                <li> Nợ cũ giữ thông báo và QR riêng; chỉ hiển thị để tra cứu, tuyệt đối KHÔNG cộng dồn vào tổng tiền kỳ mới.</li>
                <li> Tiền thuê kỳ đầu đã nhận trước không được thu lại.</li>
                <li> Phòng đã nhận lại thực tế (kỳ cuối) không tự sinh tiền thuê kỳ tiếp theo.</li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Bill Selector */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Chọn Bảng tính tiền nguồn </span>
                <span className="font-mono text-xs text-slate-400">({periodBills.length})</span>
              </div>

              <div className="space-y-2">
                {periodBills.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => {
                      setSelectedBillId(b.id);
                      setReconcileCheckDone(false);
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer text-xs space-y-1.5 ${
                      selectedBillId === b.id
                        ? 'border-blue-500 bg-blue-50/60 shadow-xs': 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900">Phòng {b.roomCode}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        b.isConfirmed ? 'bg-emerald-100 text-emerald-800': 'bg-amber-100 text-amber-800'
                      }`}>
                        {b.isConfirmed ? 'Đã xác nhận TT-03': 'Bản nháp TT-03'}
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-500">
                      <span>Kỳ: <strong>{b.periodCode}</strong></span>
                      <span className="font-mono font-bold text-blue-700">{b.totalAmount.toLocaleString('vi-VN')} đ</span>
                    </div>

                    {b.isRentPeriodEnded && (
                      <span className="inline-block px-1.5 py-0.5 bg-purple-50 text-purple-700 text-[10px] rounded font-semibold">
                        Kỳ cuối sau trả phòng (0đ tiền thuê mới) </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Reconciliation Sheet */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              {selectedBill ? (
                <div className="space-y-6 text-xs">
                  {/* Bill Top Summary */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-slate-900">Bảng đối chiếu khoản phải thu </h2>
                        <span className="px-2.5 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800">
                          Phòng {selectedBill.roomCode}
                        </span>
                        <span className="font-mono text-slate-500">{selectedBill.periodCode}</span>
                      </div>
                      <p className="text-slate-500 mt-1">
                        Mã bảng tính: <strong className="font-mono text-slate-700">{selectedBill.id}</strong> (Phiên bản {selectedBill.version}) · Hợp đồng: <strong className="font-mono">{selectedBill.leaseId}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowBillSourceModal(true)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer"
                        title="Kiểm tra nguồn dữ liệu từ "
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Xem lại nguồn </button>
                      <button
                        onClick={handlePerformCheck}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <FileCheck2 className="w-3.5 h-3.5" />
                        Kiểm tra khoản phải thu </button>
                    </div>
                  </div>

                  {/* Warning: Bill not confirmed */}
                  {!selectedBill.isConfirmed && (
                    <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl space-y-2 text-amber-900">
                      <div className="flex items-center gap-2 font-bold text-xs text-amber-950">
                        <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>Bảng tính tiền nguồn chưa được xác nhận</span>
                      </div>
                      <p className="text-[11px] text-amber-800">
                        Bảng tính tiền chưa được xác nhận. Vui lòng xác nhận bảng tính nguồn trước khi đối chiếu và lập thông báo. </p>
                      <div className="pt-1">
                        <button
                          onClick={() => setShowBillSourceModal(true)}
                          className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Xem chi tiết & Chuyển sang → </button>
                      </div>
                    </div>
                  )}

                  {/* Notification: Version updated */}
                  {selectedBill.version > 1 && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-[11px] flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-blue-600" />
                        <strong></strong> Bảng tính nguồn đã có phiên bản điều chỉnh (v{selectedBill.version}). Dữ liệu đã tự động đồng bộ để đối chiếu mới nhất. </span>
                    </div>
                  )}

                  {/* 2 Separate Groups Table */}
                  <div className="space-y-4">
                    {/* Nhóm 1: Tiền thuê kỳ tiếp theo */}
                    <div className="p-4 border border-blue-200 bg-blue-50/30 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          
                          <span className="font-bold text-sm text-blue-950">Tiền thuê kỳ tiếp theo (thu trước)</span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                          selectedBill.isRentPeriodEnded
                            ? 'bg-purple-100 text-purple-800': (currentReconciliation?.nextRentStatus === 'Đã thu' ? 'bg-emerald-100 text-emerald-800': 'bg-amber-100 text-amber-800')
                        }`}>
                          {selectedBill.isRentPeriodEnded
                            ? 'Không phát sinh khi trả phòng': (currentReconciliation?.nextRentStatus === 'Đã thu' ? 'Đã thu trước': 'Chưa thanh toán')}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-blue-100 text-slate-700">
                        <div>
                          <span className="text-slate-400 block text-[11px]">Khoảng thời gian thuê:</span>
                          <span className="font-mono font-medium">{selectedBill.nextRentPeriodFrom} → {selectedBill.nextRentPeriodTo}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Thông tin hợp đồng:</span>
                          <span>
                            {selectedBill.isRentPeriodEnded
                              ? 'Khách đã trả phòng thực tế, dừng tính tiền thuê': (currentReconciliation?.nextRentPrepaidAtPH07 ? 'Đã nhận tiền thuê tháng đầu': 'Thu trước đầu kỳ')}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 block text-[11px]">Số tiền thuê kỳ tới:</span>
                          <span className="font-mono font-bold text-blue-800 text-sm">
                            {selectedBill.isRentPeriodEnded ? '0 đ': `${(currentReconciliation?.nextRentAmount ?? selectedBill.nextMonthRentAmount).toLocaleString('vi-VN')} đ`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Nhóm 2: Tiền điện, nước, phí dịch vụ */}
                    <div className="p-4 border border-slate-200 bg-slate-50 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          
                          <span className="font-bold text-sm text-slate-900">Tiền điện, nước và dịch vụ kỳ vừa sử dụng (thu sau)</span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
                          Chưa thanh toán </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Kỳ tính dịch vụ: <strong className="font-mono text-slate-700">{selectedBill.servicePeriodFrom} → {selectedBill.servicePeriodTo}</strong>
                      </p>
                      <div className="space-y-1.5 pt-2 border-t border-slate-200">
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span>Điện năng tiêu thụ ({selectedBill.electricityUsage} kWh × {selectedBill.electricityRate.toLocaleString()} đ):</span>
                          <span className="font-mono font-bold text-slate-800">{selectedBill.electricityAmount.toLocaleString('vi-VN')} đ</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span>Nước sinh hoạt ({selectedBill.waterUsage} m³ × {selectedBill.waterRate.toLocaleString()} đ):</span>
                          <span className="font-mono font-bold text-slate-800">{selectedBill.waterAmount.toLocaleString('vi-VN')} đ</span>
                        </div>
                        {selectedBill.serviceFees?.map((fee, idx) => (
                          <div key={idx} className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                            <span>{fee.name}:</span>
                            <span className="font-mono">{fee.amount.toLocaleString('vi-VN')} đ</span>
                          </div>
                        ))}
                        {selectedBill.adjustmentAmount !== undefined && selectedBill.adjustmentAmount !== 0 && (
                          <div className="flex justify-between py-1 text-purple-700 font-medium">
                            <span>Khoản điều chỉnh hợp lệ ({selectedBill.adjustmentReason}):</span>
                            <span className="font-mono">{selectedBill.adjustmentAmount > 0 ? '+': ''}{selectedBill.adjustmentAmount.toLocaleString('vi-VN')} đ</span>
                          </div>
                        )}
                        <div className="flex justify-between pt-1.5 font-bold text-slate-900 text-xs">
                          <span>Tổng dịch vụ vừa sử dụng:</span>
                          <span className="font-mono text-blue-700">
                            {(selectedBill.totalAmount - (selectedBill.isRentPeriodEnded ? 0: selectedBill.nextMonthRentAmount)).toLocaleString('vi-VN')} đ </span>
                        </div>
                      </div>
                    </div>

                    {/* Khu vực Nợ cũ kỳ trước */}
                    {(() => {
                      const oldDebtNotice = paymentNotices.find(n =>
                        n.roomCode === selectedBill.roomCode && n.leaseId === selectedBill.leaseId &&
                        n.paymentStatus === 'Chưa thu' &&
                        n.status === 'Đang hiệu lực' &&
                        n.periodCode !== selectedBill.periodCode
                      );
                      if (oldDebtNotice) {
                        return (
                          <div className="p-4 border border-amber-300 bg-amber-50 rounded-xl space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-amber-900 flex items-center gap-1.5 text-xs">
                                <AlertTriangle className="w-4 h-4 text-amber-700" />
                                Nợ cũ từ kỳ trước: {oldDebtNotice.noticeCode} ({oldDebtNotice.periodCode}) </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900">
                                {oldDebtNotice.dueDate < localDateISO() ? 'Quá hạn' : 'Chưa đến hạn'} (Hạn: {oldDebtNotice.dueDate}) </span>
                            </div>
                            <p className="text-[11px] text-amber-800 leading-relaxed">
                               Khoản nợ cũ <strong>{oldDebtNotice.totalAmount.toLocaleString('vi-VN')} đ</strong> chỉ hiển thị để tra cứu. Tuyệt đối <strong>KHÔNG cộng dồn vào tổng tiền thông báo mới</strong>. Nợ cũ giữ thông báo và mã QR riêng. </p>
                            <div className="flex justify-end pt-1">
                              <button
                                onClick={() => {
                                  setSelectedNotice(oldDebtNotice);
                                  setShowOldDebtModal(true);
                                }}
                                className="px-3 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded font-semibold text-xs flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3 h-3" />
                                Xem thông báo & QR nợ cũ riêng </button>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div className="p-3 border border-emerald-200 bg-emerald-50/50 rounded-xl text-emerald-800 text-[11px] flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Phòng {selectedBill.roomCode} không có nợ tồn đọng từ kỳ trước.</span>
                        </div>
                      );
                    })()}

                    {/* Reconciliation Result Banner (Bước 2 hoàn tất) */}
                    {reconcileCheckDone && currentReconciliation && (
                      <div className={`p-4 rounded-xl border space-y-2 transition-all ${
                        currentReconciliation.netReceivableAmount === 0
                          ? 'bg-emerald-100/70 border-emerald-400 text-emerald-950': 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                            Kết quả kiểm tra đối chiếu (hoàn tất) </span>
                          <span className="font-mono text-xs font-bold text-emerald-900">
                            Mã: {currentReconciliation.id}
                          </span>
                        </div>

                        {/* Breakdown of exclusions */}
                        <div className="p-2.5 bg-white/80 rounded-lg space-y-1 text-[11px] text-slate-700 border border-emerald-200">
                          <div className="font-semibold text-slate-800">Các khoản đã loại trừ theo quy định:</div>
                          <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                            <li><strong>Tiền cọc phòng:</strong> Được theo dõi trong hồ sơ hợp đồng và quyết toán riêng, không cộng vào thông báo kỳ này.</li>
                            {currentReconciliation.nextRentPrepaidAtPH07 && (
                              <li><strong>Tiền thuê kỳ đầu:</strong> Đã thanh toán tại biên bản bàn giao nhận phòng, không thu lại.</li>
                            )}
                            {selectedBill.isRentPeriodEnded && (
                              <li><strong>Tiền thuê kỳ sau trả phòng:</strong> Kỳ cuối sau khi nhận lại phòng, ngừng sinh tiền thuê.</li>
                            )}
                          </ul>
                        </div>

                        {/* Notice if net amount is 0 */}
                        {currentReconciliation.netReceivableAmount === 0 ? (
                          <div className="p-3 bg-emerald-200/60 border border-emerald-400 rounded-lg text-emerald-950 space-y-1">
                            <div className="font-bold flex items-center gap-1.5 text-xs">
                              <CheckCircle2 className="w-4 h-4 text-emerald-800" />
                              Không có khoản còn phải thu (Tổng = 0 đ) </div>
                            <p className="text-[11px]">
                              Trạng thái: <strong>Đã thanh toán</strong>. Hệ thống <strong>không tạo khoản phải thu mới</strong> và <strong>không tạo mã QR có số tiền bằng 0 đ</strong>. </p>
                          </div>
                        ): (
                          <div className="flex justify-between items-center text-xs pt-1 border-t border-emerald-200">
                            <span className="text-emerald-900 font-medium">
                              Số tiền còn phải thanh toán thực tế (Chưa thu): </span>
                            <strong className="font-mono text-base text-blue-900 font-extrabold">
                              {currentReconciliation.netReceivableAmount.toLocaleString('vi-VN')} đ </strong>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions for UC07.1 */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
                    <div className="space-y-1 text-[11px] text-slate-500">
                      <span>Chỉ lập thông báo sau khi kết quả đối chiếu được xác nhận.</span>
                      {reconcileCheckDone && (
                        <span className="block text-blue-700">
                          * Phát hiện sai sót? Bấm &quot;Xem lại nguồn &quot; để điều chỉnh lại trước khi xác nhận. </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {currentReconciliation?.netReceivableAmount === 0 ? (
                        <div className="px-4 py-2 bg-emerald-100 text-emerald-800 rounded-xl font-bold text-xs flex items-center gap-1.5 border border-emerald-300">
                          <CheckCircle2 className="w-4 h-4" />
                          Đã thanh toán đủ – Không tạo QR 0đ </div>
                      ): (
                        <button
                          disabled={!reconcileCheckDone || !currentReconciliation || !selectedBill.isConfirmed || currentReconciliation.billVersion !== selectedBill.version}
                          onClick={handleConfirmReconciliation}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-all"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                           Xác nhận đối chiếu & Lập thông báo → </button>
                      )}
                    </div>
                  </div>
                </div>
              ): (
                <div className="py-16 text-center text-slate-400 text-xs">
                  Chọn một bảng tính tiền từ cột bên trái để bắt đầu đối chiếu. </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: 7.2. LẬP THÔNG BÁO THANH TOÁN                               */}
      {/* ========================================================================= */}
      {activeTab === 'uc07_2' && (
        <div className="space-y-6">
          {/* Top Bar for UC07.2 */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Bộ lọc danh sách thông báo:</span>
              {(['ALL', 'ACTIVE', 'REPLACED', 'UNPAID', 'PAID'] as const).map(filter => (
                <button
                  key={filter}
                  onClick={() => setNoticeFilter(filter)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    noticeFilter === filter
                      ? 'bg-blue-600 text-white': 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {filter === 'ALL' && 'Tất cả'}
                  {filter === 'ACTIVE' && 'Đang hiệu lực'}
                  {filter === 'REPLACED' && 'Đã thay thế'}
                  {filter === 'UNPAID' && 'Chưa thu'}
                  {filter === 'PAID' && 'Đã thu'}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setShowCreateModal(false);
                setCurrentReconciliation(null);
                setReconcileCheckDone(false);
                setActiveTab('uc07_1');
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              Kiểm tra khoản phải thu và lập thông báo </button>
          </div>

          {/* Notices Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotices.map((n) => {
              const today = new Date();
              const localToday = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
              const isOverdue = n.status === 'Đang hiệu lực' && n.paymentStatus === 'Chưa thu' && n.dueDate < localToday;
              const isSelected = selectedNotice?.id === n.id;

              return (
                <div
                  key={n.id}
                  className={`p-4 rounded-2xl border transition-all text-xs space-y-3 ${
                    n.status === 'Đã thay thế'
                      ? 'border-slate-200 bg-slate-50/70 opacity-75': isSelected
                        ? 'border-blue-500 bg-blue-50/40 shadow-sm': 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-slate-900 text-sm">{n.noticeCode}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      n.status === 'Đang hiệu lực' ? 'bg-emerald-100 text-emerald-800': 'bg-slate-200 text-slate-600 line-through'
                    }`}>
                      {n.status}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>Phòng: <strong className="text-blue-700">Phòng {n.roomCode}</strong></span>
                    <span className="font-mono">{n.periodCode}</span>
                  </div>

                  <div className="p-2.5 bg-slate-100/70 rounded-xl space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tiền thuê kỳ tiếp theo:</span>
                      <span className="font-mono">{n.breakdown?.nextRentAmount ? `${n.breakdown.nextRentAmount.toLocaleString('vi-VN')} đ`: '0 đ'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Dịch vụ kỳ vừa sử dụng:</span>
                      <span className="font-mono">{(n.totalAmount - (n.breakdown?.nextRentAmount || 0)).toLocaleString('vi-VN')} đ</span>
                    </div>
                    <div className="flex justify-between font-bold text-blue-900 pt-1 border-t border-slate-200">
                      <span>Tổng tiền QR cố định:</span>
                      <span className="font-mono">{n.totalAmount.toLocaleString('vi-VN')} đ</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">Hạn: {n.dueDate}</span>
                    <div className="flex items-center gap-1.5">
                      {isOverdue && (
                        <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-bold text-[10px]">
                          Quá hạn </span>
                      )}
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        n.paymentStatus === 'Đã thu' ? 'bg-emerald-100 text-emerald-800': 'bg-amber-100 text-amber-800'
                      }`}>
                        {n.paymentStatus}
                      </span>
                    </div>
                  </div>

                  {n.status === 'Đã thay thế' && n.replacedByNoticeId && (
                    <div className="p-2 bg-slate-200/60 rounded text-[10px] text-slate-600 font-medium">
                      Đã được thay thế bởi bản mới: <strong>{n.replacedByNoticeId}</strong>
                    </div>
                  )}

                  {/* Actions on Card */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setSelectedNotice(n);
                        setActiveTab('uc07_3');
                      }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      Xem chi tiết </button>

                    {n.status === 'Đang hiệu lực' && n.paymentStatus === 'Chưa thu' && (
                      <button
                        onClick={() => {
                          setReplaceNoticeId(n.id);
                          setShowReplaceModal(true);
                        }}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Phát hành bản thay thế </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: 7.3. CHI TIẾT & CHIA SẺ ZALO                                */}
      {/* ========================================================================= */}
      {activeTab === 'uc07_3' && (
        <div className="space-y-6">
          {selectedNotice ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Notice Card Render Preview (2 cols) */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900">{selectedNotice.noticeCode}</h2>
                      <span className="font-mono px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                        Phòng {selectedNotice.roomCode}
                      </span>
                      <span className="font-mono text-slate-500">{selectedNotice.periodCode}</span>
                    </div>
                    <span className="text-slate-500 text-xs">
                      Ngày phát hành: <strong>{new Date(selectedNotice.createdAt).toLocaleDateString('vi-VN')}</strong> · Hạn thanh toán: <strong>{selectedNotice.dueDate}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      selectedNotice.status === 'Đang hiệu lực' ? 'bg-emerald-100 text-emerald-800': 'bg-slate-200 text-slate-600 line-through'
                    }`}>
                      {selectedNotice.status}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      selectedNotice.paymentStatus === 'Đã thu' ? 'bg-emerald-100 text-emerald-800': 'bg-amber-100 text-amber-800'
                    }`}>
                      {selectedNotice.paymentStatus}
                    </span>
                  </div>
                </div>

                {/* Status Warning if replaced or paid */}
                {selectedNotice.status === 'Đã thay thế' && (
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex items-start gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block">Thông báo này đã bị thay thế bởi bản mới.</strong>
                      <span>Mã QR của thông báo cũ đã bị vô hiệu hóa. Chức năng Tải ảnh và Chia sẻ Zalo bị khóa để tránh gửi nhầm cho khách.</span>
                    </div>
                  </div>
                )}

                {selectedNotice.paymentStatus === 'Đã thu' && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block">Thông báo đã thu đủ tiền chuyển khoản vào tài khoản ngân hàng.</strong>
                      <span>Đã chuyển thành công sang chứng từ thu tiền tại UC08.2.</span>
                    </div>
                  </div>
                )}

                {/* 2 Breakdown Sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Next Rent Group */}
                  <div className="p-4 border border-blue-200 bg-blue-50/40 rounded-xl space-y-2">
                    <span className="font-bold text-blue-900 block uppercase tracking-wider text-[11px]">
                      Tiền thuê kỳ tiếp theo (thu trước) </span>
                    <div className="space-y-1 text-slate-700">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Thời gian:</span>
                        <span className="font-mono font-medium">{selectedNotice.nextRentPeriod}</span>
                      </div>
                      <div className="flex justify-between font-bold pt-1 border-t border-blue-100">
                        <span>Tiền phòng:</span>
                        <span className="font-mono text-blue-800">
                          {selectedNotice.breakdown?.nextRentAmount ? `${selectedNotice.breakdown.nextRentAmount.toLocaleString('vi-VN')} đ`: '0 đ'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Services Group */}
                  <div className="p-4 border border-slate-200 bg-slate-50 rounded-xl space-y-2">
                    <span className="font-bold text-slate-900 block uppercase tracking-wider text-[11px]">
                      2. Tiền dịch vụ vừa ở (Trả sau) </span>
                    <div className="space-y-1 text-slate-700">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Thời gian:</span>
                        <span className="font-mono font-medium">{selectedNotice.servicePeriod}</span>
                      </div>
                      <div className="flex justify-between font-bold pt-1 border-t border-slate-200">
                        <span>Tiền điện, nước & phí:</span>
                        <span className="font-mono text-blue-800">
                          {(selectedNotice.totalAmount - (selectedNotice.breakdown?.nextRentAmount || 0)).toLocaleString('vi-VN')} đ </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Grand Total Bar */}
                <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block">TỔNG THANH TOÁN (MÃ QR CỐ ĐỊNH):</span>
                    <span className="text-xl font-bold font-mono text-emerald-400">
                      {selectedNotice.totalAmount.toLocaleString('vi-VN')} đ </span>
                  </div>
                  <span className="text-xs text-slate-400">Phương thức: Chuyển khoản ngân hàng</span>
                </div>

                {/* Export Buttons  */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => setActiveTab('uc07_2')}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Quay lại danh sách </button>

                  <div className="flex items-center gap-2">
                    <button
                      disabled={selectedNotice.status === 'Đã thay thế' || selectedNotice.paymentStatus === 'Đã thu'}
                      onClick={handleDownloadNoticeCard}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                      title={selectedNotice.status === 'Đã thay thế' ? 'Bản đã thay thế không được xuất ảnh': 'Tải file ảnh PNG về thiết bị'}
                    >
                      <Download className="w-4 h-4" />
                      Tải ảnh thông báo </button>

                    <button
                      disabled={selectedNotice.status === 'Đã thay thế' || selectedNotice.paymentStatus === 'Đã thu'}
                      onClick={handleShareZaloManual}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                      title={selectedNotice.status === 'Đã thay thế' ? 'Bản đã thay thế không được chia sẻ': 'Chia sẻ thủ công qua Zalo'}
                    >
                      <Share2 className="w-4 h-4" />
                      Chia sẻ Zalo thủ công </button>
                  </div>
                </div>
              </div>

              {/* Right: Dedicated VietQR Card Box */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 flex flex-col items-center text-center">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                  Mã QR Chuyển khoản VietQR </span>

                {/* QR Canvas Box */}
                <div className="p-3 bg-white border-2 border-slate-900 rounded-2xl shadow-sm space-y-2">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="VietQR Code"
                      className="w-48 h-48 object-contain rounded-lg"
                    />
                  ): (
                    <div className="w-48 h-48 bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                      Đang tạo mã QR... </div>
                  )}
                  <span className="font-mono font-bold text-[11px] text-slate-900 block tracking-tight">
                    VIETQR · {selectedNotice.totalAmount.toLocaleString('vi-VN')} Đ </span>
                </div>

                {/* Bank Snapshot Info */}
                <div className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs space-y-1.5">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Ngân hàng nhận:</span>
                    <strong className="text-slate-900">{selectedNotice.qrBankSnapshot.bankName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Số tài khoản:</span>
                    <strong className="font-mono text-blue-700 text-sm">{selectedNotice.qrBankSnapshot.accountNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Chủ tài khoản:</span>
                    <span className="uppercase font-bold text-slate-800">{selectedNotice.qrBankSnapshot.accountHolder}</span>
                  </div>
                  <div className="pt-1 border-t border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Nội dung chuyển khoản cố định:</span>
                    <span className="font-mono font-bold text-red-700 text-[11px] block bg-red-50 p-1.5 rounded border border-red-100">
                      {selectedNotice.qrBankSnapshot.transferContent}
                    </span>
                  </div>
                </div>

                {selectedNotice.status === 'Đang hiệu lực' && selectedNotice.paymentStatus === 'Chưa thu' && onNavigateToReceipts && (
                  <button
                    onClick={() => onNavigateToReceipts(selectedNotice.id)}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all"
                  >
                    Xác nhận thu tiền tại ngân hàng → </button>
                )}
              </div>
            </div>
          ): (
            <div className="py-16 text-center text-slate-400 text-xs">
              Vui lòng chọn một thông báo từ tab 7.2 để xem chi tiết và chia sẻ. </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VIEW SOURCE BILL                                           */}
      {/* ========================================================================= */}
      {showBillSourceModal && selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Bảng tính tiền nguồn</h3>
              <button
                onClick={() => setShowBillSourceModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-slate-700">
              <div className="flex justify-between">
                <span>Phòng:</span> <strong>Phòng {selectedBill.roomCode}</strong>
              </div>
              <div className="flex justify-between">
                <span>Kỳ tính tiền:</span> <strong>{selectedBill.periodCode}</strong>
              </div>
              <div className="flex justify-between">
                <span>Tiền thuê phòng kỳ tiếp theo:</span> <strong>{selectedBill.nextMonthRentAmount.toLocaleString('vi-VN')} đ</strong>
              </div>
              <div className="flex justify-between">
                <span>Tiền điện ({selectedBill.electricityUsage} kWh):</span> <strong>{selectedBill.electricityAmount.toLocaleString('vi-VN')} đ</strong>
              </div>
              <div className="flex justify-between">
                <span>Tiền nước ({selectedBill.waterUsage} m³):</span> <strong>{selectedBill.waterAmount.toLocaleString('vi-VN')} đ</strong>
              </div>
              <div className="flex justify-between font-bold text-blue-900 pt-2 border-t border-slate-200 text-sm">
                <span>Tổng tiền tính toán:</span> <span>{selectedBill.totalAmount.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px]">
              <strong></strong> Nếu phát hiện số liệu công tơ hoặc đơn giá chưa chính xác, hãy quay lại chức năng <strong>Tính tiền điện nước </strong> để điều chỉnh và tính toán lại trước khi đối chiếu. </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowBillSourceModal(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl font-semibold cursor-pointer"
              >
                Đóng </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE NOTICE UC07.2                                               */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Lập thông báo thanh toán </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Chọn bảng tính tiền nguồn đã xác nhận </label>
              <select
                value={createBillId}
                onChange={(e) => setCreateBillId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
              >
                {periodBills.filter(b => b.isConfirmed).map(b => (
                  <option key={b.id} value={b.id}>
                    Phòng {b.roomCode} · {b.periodCode} ({b.totalAmount.toLocaleString('vi-VN')} đ) </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Hạn thanh toán <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold"
              />
              <span className="text-[11px] text-slate-400 block mt-1">
                Khi lập thông báo mới, User phải chọn hạn thanh toán không trước ngày phát hành (≥ {new Date().toISOString().split('T')[0]}). </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tài khoản nhận tiền</label>
              <div className="p-3 bg-slate-100 rounded-xl space-y-1">
                <span className="font-bold text-slate-900">{activeBankAccount?.bankName}</span>
                <div className="font-mono text-blue-700 font-bold">{activeBankAccount?.accountNumber}</div>
                <div className="uppercase text-[11px] text-slate-600">{activeBankAccount?.accountHolder}</div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium cursor-pointer"
              >
                Hủy </button>
              <button
                type="button"
                onClick={handleCreateNoticeSubmit}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer shadow-xs"
              >
                Lập thông báo & Tạo mã QR </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REPLACE NOTICE */}
      {/* ========================================================================= */}
      {showReplaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Phát hành thông báo thay thế</h3>
              <button
                onClick={() => setShowReplaceModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1">
              <p className="font-bold">Lưu ý: </p>
              <p className="text-[11px]">
                Hệ thống sẽ <strong>giữ nguyên hạn thanh toán ban đầu của thông báo gốc</strong>, tạo thông báo mới kèm mã QR mới, đồng thời <strong>đánh dấu thông báo cũ là Đã thay thế và vô hiệu hóa mã QR cũ</strong>. </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Lý do phát hành bản thay thế <span className="text-red-500">*</span>
              </label>
              <textarea
                value={replaceReason}
                onChange={(e) => setReplaceReason(e.target.value)}
                rows={3}
                placeholder="Ví dụ: Thay đổi tài khoản ngân hàng nhận tiền / Điều chỉnh chỉ số điện nước..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowReplaceModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium cursor-pointer"
              >
                Hủy </button>
              <button
                type="button"
                onClick={handleReplaceNoticeSubmit}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold cursor-pointer shadow-xs"
              >
                Xác nhận thay thế thông báo </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ZALO SHARE GUIDE                                           */}
      {/* ========================================================================= */}
      {showShareGuideModal && selectedNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Chia sẻ thông báo qua Zalo </h3>
              <button
                onClick={() => setShowShareGuideModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 space-y-2">
              <p className="font-bold">Quy định kỹ thuật phiên bản đầu:</p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-blue-800">
                <li>Phần mềm <strong>không tự động kết nối Zalo ngầm</strong> và không tự đánh dấu Đã gửi hay Đã thu.</li>
                <li>Chủ nhà bấm nút <strong>Tải ảnh thông báo</strong> rồi tự gửi ảnh này qua ứng dụng Zalo tới khách đại diện.</li>
                <li>Khách thuê nhận ảnh, quét mã QR đúng tổng tiền <strong>{selectedNotice.totalAmount.toLocaleString('vi-VN')} đ</strong> để chuyển khoản.</li>
              </ul>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowShareGuideModal(false);
                  handleDownloadNoticeCard();
                }}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4" />
                Tải ảnh thông báo PNG về máy ngay </button>
              <button
                type="button"
                onClick={() => setShowShareGuideModal(false)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium cursor-pointer"
              >
                Đã hiểu & Đóng </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VIEW OLD DEBT SEPARATELY                            */}
      {/* ========================================================================= */}
      {showOldDebtModal && selectedNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Thông báo nợ cũ riêng</h3>
              <button
                onClick={() => setShowOldDebtModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1">
              <span className="font-bold">Mã thông báo: {selectedNotice.noticeCode}</span>
              <p className="text-[11px]">
                Khoản nợ: <strong>{selectedNotice.totalAmount.toLocaleString('vi-VN')} đ</strong> · Hạn gốc: <strong>{selectedNotice.dueDate}</strong>
              </p>
              <p className="text-[10px] text-amber-800 mt-1">
                Nợ cũ giữ thông báo, mã khoản thu và mã QR riêng; không chuyển nợ sang thông báo kỳ sau hoặc cộng vào mã QR của kỳ mới. </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowOldDebtModal(false)}
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
