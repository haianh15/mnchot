import { toUserMessage } from '../../utils/userMessages';
import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { resolveMeterBaseline } from '../../utils/meterReadings';
import { MeterReading, PeriodBill, Room } from '../../types';
import {
  Zap, Droplets, Plus, CheckCircle2, AlertCircle, Edit, Calculator,
  Calendar, ArrowRight, ShieldAlert, History, FileText, CheckSquare, X,
  AlertTriangle, Filter, Search, Image as ImageIcon, Camera, RefreshCw,
  ExternalLink, Layers, ArrowDownRight, Eye
} from 'lucide-react';

export const BillingView: React.FC = () => {
  const {
    rooms,
    meterReadings,
    periodBills,
    handoverReports,
    handoverConditions,
    saveMeterReadingTT01,
    updateMeterReadingTT02,
    generatePeriodBillTT03,
    confirmPeriodBillTT03,
    contracts
  } = useApp();

  const [activeTab, setActiveTab] = useState<'readings' | 'bills'>('readings');

  // Filter for room list in UC-TT-01 (Điều kiện trước 2: Đang thuê, Sắp trả, hoặc Đã trả nhưng chưa chốt kỳ cuối)
  const [roomFilterTab, setRoomFilterTab] = useState<'ALL' | 'RENTING' | 'EXPIRING' | 'RETURNED_PENDING'>('ALL');
  const [readingStatusFilter, setReadingStatusFilter] = useState<'ALL' | 'RECORDED' | 'VERIFY'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // UC-TT-01 Reading Modal State
  const [showReadingModal, setShowReadingModal] = useState(false);
  const [readingStage, setReadingStage] = useState<0 | 1 | 2>(0);
  const [readRoom, setReadRoom] = useState('');
  const [readPeriod, setReadPeriod] = useState(() => `Kỳ ${String(new Date().getMonth()+1).padStart(2,'0')}/${new Date().getFullYear()}`);
  const [readType, setReadType] = useState<'Theo kỳ chung' | 'Ngoài kỳ chung'>('Theo kỳ chung');
  const [readingDate, setReadingDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Meters and Readings (Bước 3)
  const [elecMeterCode, setElecMeterCode] = useState('');
  const [initElec, setInitElec] = useState<number | ''>('');
  const [finalElec, setFinalElec] = useState<number | ''>('');
  const [waterMeterCode, setWaterMeterCode] = useState('');
  const [initWater, setInitWater] = useState<number | ''>('');
  const [finalWater, setFinalWater] = useState<number | ''>('');

  // Bất thường chỉ số State (Bước 4)
  const [isAbnormal, setIsAbnormal] = useState(false);
  const [abnormalReason, setAbnormalReason] = useState<'Nhập sai' | 'Quay vòng' | 'Thay công tơ' | 'Công tơ hỏng' | 'Khác'>('Quay vòng');
  const [verifiedElec, setVerifiedElec] = useState<number | ''>('');
  const [verifiedWater, setVerifiedWater] = useState<number | ''>('');
  const [abnormalProof, setAbnormalProof] = useState('');

  // Chốt ngoài kỳ chung date validation warning
  const [readingDateError, setReadingDateError] = useState<string | null>(null);
  const [editingDraftReadingId, setEditingDraftReadingId] = useState<string | null>(null);

  // Edit reading modal (TT-02)
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedReading, setSelectedReading] = useState<MeterReading | null>(null);
  const [editFinalElec, setEditFinalElec] = useState(0);
  const [editFinalWater, setEditFinalWater] = useState(0);
  const [editReason, setEditReason] = useState('');

  // Generate Bill Modal (TT-03)
  const [showGenBillModal, setShowGenBillModal] = useState(false);
  const [billPeriod, setBillPeriod] = useState(() => `Kỳ ${String(new Date().getMonth()+1).padStart(2,'0')}/${new Date().getFullYear()}`);
  const [billConfirmError, setBillConfirmError] = useState<string | null>(null);
  const [billSearchTerm, setBillSearchTerm] = useState('');
  const [billPeriodFilter, setBillPeriodFilter] = useState('ALL');
  const [billStatusFilter, setBillStatusFilter] = useState<'ALL' | 'DRAFT' | 'CONFIRMED'>('ALL');
  const [selectedBillRoomKeys, setSelectedBillRoomKeys] = useState<string[]>([]);
  const [billGenerationFeedback, setBillGenerationFeedback] = useState<string | null>(null);
  const [selectedBillDetail, setSelectedBillDetail] = useState<PeriodBill | null>(null);

  // Detail Modal for Reading / Abnormal Verification
  const [inspectReading, setInspectReading] = useState<MeterReading | null>(null);

  // Available rooms complying with UC-TT-01 Pre-conditions:
  // "Có lần thuê đang hoạt động hoặc đã kết thúc nhưng chưa chốt kỳ cuối; không chỉ lọc theo trạng thái Đang thuê/Sắp trả"
  const eligibleRooms = useMemo(() => {
    return rooms.map(room => {
      const isReturnedPending = room.status === 'Trống' && room.currentLeaseId;
      return {...room,
        isReturnedPending
      };
    });
  }, [rooms]);

  // Chỉ cho tạo bản ghi mới nếu đúng lần thuê chưa có chỉ số trong phạm vi kỳ/ngày đang chọn.
  // Chỉ số đã ghi (kể cả Cần xác minh) được xử lý từ danh sách bằng Sửa/Xác minh, không tạo dòng mới.
  const availableReadingRooms = useMemo(() => eligibleRooms.filter(room => {
    const isInScope = ['Đang thuê', 'Sắp trả'].includes(room.status) || room.isReturnedPending;
    if (!isInScope || !room.currentLeaseId) return false;
    const hasReadingInScope = meterReadings.some(reading => {
      if (reading.roomCode !== room.roomCode || reading.leaseId !== room.currentLeaseId) return false;
      const samePeriod = reading.periodCode.trim() === readPeriod.trim();
      const sameDate = reading.readingDate === readingDate;
      return samePeriod || sameDate;
    });
    return !hasReadingInScope;
  }), [eligibleRooms, meterReadings, readPeriod, readType, readingDate]);

  // Shared with AppContext save validation: no implicit 0 or previous tenant's meter.
  const selectedMeterBaseline = useMemo(() => {
    if (!readRoom) return null;
    const room = rooms.find(r => r.roomCode === readRoom);
    if (!room?.currentLeaseId) return { ok: false as const, message: 'Phòng chưa có lần thuê hiện tại hợp lệ.' };
    return resolveMeterBaseline({
      roomCode: room.roomCode, leaseId: room.currentLeaseId, readingDate,
      meterReadings, contracts, handoverReports, handoverConditions,
      excludeReadingId: editingDraftReadingId || undefined
    });
  }, [readRoom, readingDate, rooms, meterReadings, contracts, handoverReports, handoverConditions, editingDraftReadingId]);

  const filteredMeterReadings = useMemo(() => meterReadings.filter(m => {
    const room = rooms.find(r => r.roomCode === m.roomCode);
    if (roomFilterTab === 'RENTING' && room?.status !== 'Đang thuê') return false;
    if (roomFilterTab === 'EXPIRING' && room?.status !== 'Sắp trả') return false;
    if (roomFilterTab === 'RETURNED_PENDING' && !(room?.status === 'Trống' && room.currentLeaseId)) return false;
    if (readingStatusFilter === 'VERIFY' && !m.pendingVerificationFlag) return false;
    if (readingStatusFilter === 'RECORDED' && m.pendingVerificationFlag) return false;
    if (searchTerm && !m.roomCode.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  }), [meterReadings, rooms, roomFilterTab, readingStatusFilter, searchTerm]);

  // Only show rooms/leases with a recorded reading for the selected period in the "new bill" flow.
  const billCandidateReadings = useMemo(() => {
    const latestByLease = new Map<string, MeterReading>();
    meterReadings.filter(m => m.periodCode.trim() === billPeriod.trim()).forEach(m => {
      const key = `${m.roomCode}::${m.leaseId}`;
      const old = latestByLease.get(key);
      if (!old || m.readingDate > old.readingDate) latestByLease.set(key, m);
    });
    return Array.from(latestByLease.entries()).map(([key, reading]) => {
      const existingBill = periodBills.find(b => b.roomCode === reading.roomCode && b.leaseId === reading.leaseId && b.periodCode === reading.periodCode);
      let unavailableReason = '';
      if (existingBill?.isConfirmed) unavailableReason = 'Đã có bảng tính được xác nhận';
      else if (existingBill) unavailableReason = 'Đã có bảng tính nháp — mở từ lịch sử để tiếp tục';
      else if (reading.pendingVerificationFlag) unavailableReason = 'Cần xác minh chỉ số';
      else if (reading.needsRecalculateFlag || reading.status === 'Nháp – điều chỉnh') unavailableReason = 'Chỉ số cần được kiểm tra lại';
      return { key, reading, existingBill, selectable: !unavailableReason, unavailableReason };
    });
  }, [meterReadings, periodBills, billPeriod]);

  const billPeriods = useMemo(() => Array.from(new Set<string>(periodBills.map((b: PeriodBill) => b.periodCode)))
    .sort((a: string, b: string) => {
      const pa = a.match(/(\d{1,2})\s*\/\s*(\d{4})/);
      const pb = b.match(/(\d{1,2})\s*\/\s*(\d{4})/);
      const ka = pa ? Number(pa[2]) * 12 + Number(pa[1]) : 0;
      const kb = pb ? Number(pb[2]) * 12 + Number(pb[1]) : 0;
      return kb - ka;
    }), [periodBills]);

  const filteredPeriodBills = useMemo(() => periodBills.filter(b => {
    if (billPeriodFilter !== 'ALL' && b.periodCode !== billPeriodFilter) return false;
    if (billStatusFilter === 'DRAFT' && b.isConfirmed) return false;
    if (billStatusFilter === 'CONFIRMED' && !b.isConfirmed) return false;
    const q = billSearchTerm.trim().toLowerCase();
    if (q && !b.roomCode.toLowerCase().includes(q) && !b.leaseId.toLowerCase().includes(q) && !b.periodCode.toLowerCase().includes(q)) return false;
    return true;
  }), [periodBills, billPeriodFilter, billStatusFilter, billSearchTerm]);

  const groupedPeriodBills = useMemo(() => {
    const grouped = new Map<string, PeriodBill[]>();
    filteredPeriodBills.forEach(b => {
      if (!grouped.has(b.periodCode)) grouped.set(b.periodCode, []);
      grouped.get(b.periodCode)!.push(b);
    });
    return Array.from(grouped.entries());
  }, [filteredPeriodBills]);

  const currentDetailBill = selectedBillDetail
    ? (periodBills.find(b => b.id === selectedBillDetail.id) || selectedBillDetail)
    : null;

  // Only confirmed readings of this lease or a signed move-in handover establish meter openings.
  const handleSelectRoomForReading = (roomCode: string) => {
    setEditingDraftReadingId(null);
    setReadRoom(roomCode);
    setIsAbnormal(false);
    setVerifiedElec('');
    setVerifiedWater('');
    setAbnormalProof('');
    setReadingDateError(null);
    setInitElec('');
    setFinalElec('');
    setInitWater('');
    setFinalWater('');
    setElecMeterCode('');
    setWaterMeterCode('');
    if (!roomCode) return;
    const room = rooms.find(r => r.roomCode === roomCode);
    if (room?.status === 'Trống') setReadType('Ngoài kỳ chung');
    if (!room?.currentLeaseId) return;
    const baseline = resolveMeterBaseline({
      roomCode, leaseId: room.currentLeaseId, readingDate,
      meterReadings, contracts, handoverReports, handoverConditions
    });
    if (baseline.ok === false) {
      setReadingDateError(baseline.message);
      return;
    }
    setInitElec(baseline.electric);
    setFinalElec(baseline.electric);
    setInitWater(baseline.water);
    setFinalWater(baseline.water);
    setElecMeterCode(baseline.electricMeterCode);
    setWaterMeterCode(baseline.waterMeterCode);
  };

  const handleContinueDraftReading = (reading: MeterReading) => {
    setEditingDraftReadingId(reading.id);
    setReadRoom(reading.roomCode);
    setReadPeriod(reading.periodCode);
    setReadType(reading.readingType);
    setReadingDate(reading.readingDate);
    setElecMeterCode(reading.electricMeterCode);
    setInitElec(reading.initialElectricKwh);
    setFinalElec(reading.finalElectricKwh);
    setWaterMeterCode(reading.waterMeterCode);
    setInitWater(reading.initialWaterM3);
    setFinalWater(reading.finalWaterM3);
    setIsAbnormal(Boolean(reading.isAbnormal));
    setAbnormalReason(reading.abnormalReason || 'Quay vòng');
    setVerifiedElec(reading.verifiedElectricKwh ?? '');
    setVerifiedWater(reading.verifiedWaterM3 ?? '');
    setAbnormalProof(reading.abnormalEvidence || '');
    setReadingDateError(null);
    setReadingStage(1);
    setShowReadingModal(true);
  };

  // Real-time calculation of electricity and water consumption
  const currentElecUsage = typeof finalElec === 'number' && typeof initElec === 'number' ? finalElec - initElec : 0;
  const currentWaterUsage = typeof finalWater === 'number' && typeof initWater === 'number' ? finalWater - initWater : 0;

  // Auto detect abnormality in real-time
  const autoElecAbnormal = currentElecUsage < 0 || currentElecUsage === 0 || currentElecUsage > 450;
  const autoWaterAbnormal = currentWaterUsage < 0 || currentWaterUsage === 0 || currentWaterUsage > 30;
  const detectedAbnormal = autoElecAbnormal || autoWaterAbnormal;

  // UC-TT-01: lưu chỉ số cho một phòng/lần thuê. Bản ghi bất thường vẫn được lưu nhưng gắn cờ Cần xác minh.
  const handleSaveReadingSubmit = () => {
    setReadingDateError(null);
    if (!readRoom || !readPeriod.trim()) { setReadingDateError('Chọn đúng phòng và kỳ cần ghi chỉ số.'); return; }
    if (!elecMeterCode.trim() || !waterMeterCode.trim()) { setReadingDateError('Cần ghi đúng mã công tơ điện và nước từ hồ sơ nguồn; không được tự điền mã giả.'); return; }
    if (![initElec, finalElec, initWater, finalWater].every(v => typeof v === 'number' && Number.isFinite(v) && v >= 0)) {
      setReadingDateError('Chỉ số đầu/cuối điện nước phải là số hợp lệ và không âm.');
      return;
    }

    // Validation for ngoài kỳ chung
    if (readType === 'Ngoài kỳ chung') {
      const selectedRoom = rooms.find(r => r.roomCode === readRoom);
      const recentReading = meterReadings
        .filter(m => m.roomCode === readRoom && (!selectedRoom?.currentLeaseId || m.leaseId === selectedRoom.currentLeaseId) && m.periodCode !== readPeriod.trim())
        .sort((a, b) => b.readingDate.localeCompare(a.readingDate))[0];
      if (recentReading && readingDate < recentReading.readingDate) {
        setReadingDateError(`Ngày chốt ngoài kỳ (${readingDate}) phải sau ngày chốt gần nhất (${recentReading.readingDate}).`);
        return;
      }
    }

    // Step 4 check: Check abnormal
    const hasAbnormal = isAbnormal || detectedAbnormal;

    const room = rooms.find(r => r.roomCode === readRoom);
    const existingDraft = editingDraftReadingId ? meterReadings.find(m => m.id === editingDraftReadingId) : undefined;
    const leaseId = existingDraft?.leaseId || room?.currentLeaseId;
    if (!leaseId) { setReadingDateError('Không tìm thấy mã lần thuê của phòng được chọn; cần kiểm tra hồ sơ nguồn.'); return; }
    if (!selectedMeterBaseline) { setReadingDateError('Chưa có chỉ số đầu kỳ được xác minh.'); return; }
    if (selectedMeterBaseline.ok === false) { setReadingDateError(selectedMeterBaseline.message); return; }

    // Nếu đã có bản ghi cùng phòng/lần thuê/kỳ, không tạo dòng trùng.
    // Có thể tiếp tục lưu trên chính bản ghi nếu đó là Nháp; bản ghi đã xác nhận
    // phải đi qua UC-TT-02 (Sửa chỉ số) để giữ đúng lịch sử nghiệp vụ.
    const duplicateReading = meterReadings.find(m => m.id !== editingDraftReadingId && m.roomCode === readRoom && m.leaseId === leaseId && (m.periodCode.trim() === readPeriod.trim() || (readType === 'Ngoài kỳ chung' && m.readingDate === readingDate)));
    const reusableDraft = duplicateReading && (duplicateReading.status === 'Nháp' || duplicateReading.status === 'Nháp – điều chỉnh') ? duplicateReading : undefined;
    if (duplicateReading && !reusableDraft) {
      setReadingDateError(`Đã có bản ghi chỉ số ${duplicateReading.status} cho ${readRoom}, lần thuê ${leaseId}, ${readPeriod}. Không tạo bản ghi trùng. Hãy đóng cửa sổ này và bấm “Sửa” ở dòng chỉ số hiện có để điều chỉnh theo UC-TT-02.`);
      return;
    }
    const recordToUpdate = existingDraft || reusableDraft;

    const newReading: MeterReading = {
      id: recordToUpdate?.id || ('mr_' + readRoom.replace(/\D/g, '') + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)),
      roomCode: readRoom,
      leaseId,
      periodCode: readPeriod.trim(),
      readingType: readType,
      readingDate,
      electricMeterCode: elecMeterCode,
      initialElectricKwh: Number(initElec),
      finalElectricKwh: Number(finalElec),
      waterMeterCode: waterMeterCode,
      initialWaterM3: Number(initWater),
      finalWaterM3: Number(finalWater),
      isAbnormal: hasAbnormal,
      abnormalReason: hasAbnormal ? abnormalReason: undefined,
      verifiedElectricKwh: hasAbnormal && verifiedElec !== '' ? Number(verifiedElec) : undefined,
      verifiedWaterM3: hasAbnormal && verifiedWater !== '' ? Number(verifiedWater) : undefined,
      abnormalEvidence: hasAbnormal ? abnormalProof.trim(): undefined,
      // TT-01 stores a draft. TT-03 confirms the reading together with the bill.
      status: 'Nháp',
      pendingVerificationFlag: hasAbnormal && (!editingDraftReadingId || !abnormalProof.trim() || verifiedElec === '' || verifiedWater === '' || Number(verifiedElec) < 0 || Number(verifiedWater) < 0),
      needsRecalculateFlag: false,
      isFinalPeriodForLease: recordToUpdate?.isFinalPeriodForLease ?? (room?.status === 'Trống')
    };

    const saveResult = saveMeterReadingTT01(newReading);
    if (!saveResult.success) {
      setReadingDateError(saveResult.message);
      return;
    }
    setShowReadingModal(false);
    setEditingDraftReadingId(null);

    if (newReading.pendingVerificationFlag) {
      alert('Đã ghi nhận chỉ số với trạng thái Cần xác minh. Vào danh sách chỉ số và chọn “Xác minh” để bổ sung sản lượng thực tế, lý do và chứng cứ trước khi tính tiền.');
    } else {
      alert('Đã ghi nhận chỉ số thành công. Bản ghi sẵn sàng cho bước tính tiền theo kỳ; việc xác nhận tiền vẫn thực hiện tại bảng tính.');
    }
  };

  // UC-TT-02: Update reading
  const handleUpdateReading = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReading || !editReason.trim()) {
      alert('Lý do sửa chỉ số là trường bắt buộc.');
      return;
    }

    updateMeterReadingTT02(selectedReading.id, {
      finalElectricKwh: Number(editFinalElec),
      finalWaterM3: Number(editFinalWater)
    }, editReason.trim());

    setShowEditModal(false);
    alert('Sửa chỉ số thành công! Dòng đã chuyển sang trạng thái "Nháp – điều chỉnh", vui lòng tính lại tiền phòng.');
  };

  // UC-TT-03: Generate bills for the selected rooms/leases with valid meter readings.
  const handleGenerateBill = () => {
    if (!billPeriod.trim()) {
      setBillGenerationFeedback('Vui lòng chọn kỳ tính tiền.');
      return;
    }
    const selectedCandidates = billCandidateReadings.filter(c => selectedBillRoomKeys.includes(c.key) && c.selectable);
    if (selectedCandidates.length === 0) {
      setBillGenerationFeedback('Chọn ít nhất một phòng/lần thuê đủ điều kiện tính tiền.');
      return;
    }

    const results = selectedCandidates.map(({ reading }) => ({
      roomCode: reading.roomCode,
      result: generatePeriodBillTT03(reading.roomCode, billPeriod.trim(), reading.leaseId)
    }));
    const succeeded = results.filter(x => x.result.success);
    const failed = results.filter(x => !x.result.success);
    setSelectedBillRoomKeys([]);
    if (succeeded.length > 0) {
      setShowGenBillModal(false);
      setActiveTab('bills');
      setBillGenerationFeedback(`Đã tạo ${succeeded.length} bảng tính nháp${failed.length ? `; ${failed.length} phòng chưa tính được` : ''}.`);
    }
    if (failed.length > 0) {
      const details = failed.map(x => `${x.roomCode}: ${x.result.message}`).join('\n');
      setBillGenerationFeedback(`${succeeded.length ? `Đã tạo ${succeeded.length} bảng tính. ` : ''}Không thể tính ${failed.length} phòng: ${details}`);
    }
  };

  // UC-TT-03: Confirm Bill with Step 6 check
  const handleConfirmBillAction = (billId: string) => {
    setBillConfirmError(null);
    const res = confirmPeriodBillTT03(billId);
    if (!res.success) {
      setBillConfirmError(res.message);
      alert(toUserMessage(res.message));
      return false;
    } else {
      setBillConfirmError(null);
      alert(toUserMessage(res.message));
      return true;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            
            <h1 className="text-lg font-bold text-slate-900">
              Tính tiền theo kỳ </h1>
          </div>
        </div>

        {/* 2 Tabs Segmented Control */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold shrink-0">
          <button
            onClick={() => setActiveTab('readings')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'readings' ? 'bg-white text-blue-700 shadow-xs': 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-600" />
            Ghi/Sửa chỉ số </button>
          <button
            onClick={() => setActiveTab('bills')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'bills' ? 'bg-white text-blue-700 shadow-xs': 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calculator className="w-4 h-4 text-blue-600" />
            Bảng tính kỳ </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: 6.1 & 6.2 GHI NHẬN & SỬA CHỈ SỐ              */}
      {/* ========================================================================= */}
      {activeTab === 'readings' && (
        <div className="space-y-4">
          {/* Business rules & Quick Info banner */}
          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-blue-900">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-bold">
                <ShieldAlert className="w-4 h-4 text-blue-700" />
                <span>Lưu ý ghi nhận chỉ số:</span>
              </div>
              <p className="text-blue-800 text-[11px]">
                Áp dụng cho phòng <strong>Đang thuê</strong>, <strong>Sắp trả phòng</strong>, và <strong>Đã trả phòng chờ chốt kỳ cuối</strong>. Chỉ hiển thị phòng/lần thuê chưa ghi chỉ số cho kỳ/ngày đã chọn. Nếu có bất thường, hệ thống lưu trạng thái Cần xác minh để xử lý sau. </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  handleSelectRoomForReading('');
                  setReadPeriod(`Kỳ ${String(new Date().getMonth()+1).padStart(2,'0')}/${new Date().getFullYear()}`);
                  setReadType('Theo kỳ chung');
                  setReadingDate(new Date().toISOString().split('T')[0]);
                  setIsAbnormal(false);
                  setAbnormalReason('Quay vòng');
                  setVerifiedElec('');
                  setVerifiedWater('');
                  setAbnormalProof('');
                  setReadingDateError(null);
                  setReadingStage(0);
                  setShowReadingModal(true);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs cursor-pointer text-xs"
              >
                <Plus className="w-4 h-4" />
                Ghi nhận chỉ số mới </button>
            </div>
          </div>

          {/* Room Filter Pills (Pre-condition 2 of UC-TT-01) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Lọc phòng: </span>
              {[
                { id: 'ALL', label: 'Tất cả phòng cần chốt' },
                { id: 'RENTING', label: 'Đang thuê' },
                { id: 'EXPIRING', label: 'Sắp trả phòng' },
                { id: 'RETURNED_PENDING', label: 'Đã trả phòng – Chờ chốt kỳ cuối' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setRoomFilterTab(tab.id as any)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    roomFilterTab === tab.id
                      ? 'bg-blue-100 text-blue-800 font-bold': 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500 mr-1">Trạng thái chỉ số:</span>
              {[
                { id: 'ALL', label: 'Tất cả' },
                { id: 'RECORDED', label: 'Đã ghi nhận' },
                { id: 'VERIFY', label: 'Cần xác minh' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setReadingStatusFilter(tab.id as any)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${readingStatusFilter === tab.id ? 'bg-blue-100 text-blue-800 font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >{tab.label}</button>
              ))}
            </div>

            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Tìm mã phòng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Meter Readings Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                  Danh sách chỉ số đã ghi nhận </span>
                <span className="px-2 py-0.5 bg-slate-100 rounded-full font-mono text-[11px] text-slate-600 font-semibold">
                  {filteredMeterReadings.length} bản ghi </span>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Đã xác nhận (qua tính tiền) </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span> Đã ghi nhận </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span> Cần xác minh </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                    <th className="py-3 px-3">Phòng</th>
                    <th className="py-3 px-3">Kỳ thu</th>
                    <th className="py-3 px-3">Loại chốt</th>
                    <th className="py-3 px-3">Ngày đọc</th>
                    <th className="py-3 px-3">Điện (Đầu → Cuối)</th>
                    <th className="py-3 px-3">Nước (Đầu → Cuối)</th>
                    <th className="py-3 px-3">Lượng dùng tính tiền</th>
                    <th className="py-3 px-3">Bất thường & Minh chứng</th>
                    <th className="py-3 px-3">Trạng thái</th>
                    <th className="py-3 px-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMeterReadings.map((m) => {
                    const elecDiff = m.verifiedElectricKwh !== undefined
                      ? m.verifiedElectricKwh: Math.max(0, m.finalElectricKwh - m.initialElectricKwh);
                    const waterDiff = m.verifiedWaterM3 !== undefined
                      ? m.verifiedWaterM3: Math.max(0, m.finalWaterM3 - m.initialWaterM3);

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3">
                          <span className="font-mono font-bold text-slate-900 block text-xs">{m.roomCode}</span>
                          <span className="font-mono text-[10px] text-slate-400">{m.leaseId}</span>
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-800">{m.periodCode}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            m.readingType === 'Ngoài kỳ chung'
                              ? 'bg-purple-100 text-purple-800': 'bg-slate-100 text-slate-700'
                          }`}>
                            {m.readingType}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600">{m.readingDate}</td>
                        <td className="py-3 px-3 font-mono">
                          <span className="text-slate-400">{m.initialElectricKwh}</span> → <strong className="text-amber-800">{m.finalElectricKwh}</strong>
                          <span className="block text-[10px] text-slate-400">{m.electricMeterCode}</span>
                        </td>
                        <td className="py-3 px-3 font-mono">
                          <span className="text-slate-400">{m.initialWaterM3}</span> → <strong className="text-blue-800">{m.finalWaterM3}</strong>
                          <span className="block text-[10px] text-slate-400">{m.waterMeterCode}</span>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-800">
                          <span className="text-amber-800">{elecDiff} kWh</span> · <span className="text-blue-800">{waterDiff} m³</span>
                        </td>
                        <td className="py-3 px-3">
                          {m.isAbnormal ? (
                            <div className="space-y-1">
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                                ⚠ {m.abnormalReason} (Xác minh: {m.verifiedElectricKwh} kWh) </span>
                              {m.abnormalEvidence && (
                                <span className="block text-[10px] text-slate-500 truncate max-w-xs" title={m.abnormalEvidence}>
                                  📎 {m.abnormalEvidence}
                                </span>
                              )}
                            </div>
                          ): (
                            <span className="text-slate-400 text-[11px]">Bình thường</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {m.pendingVerificationFlag ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200 block text-center">
                              Cần xác minh </span>
                          ): m.status === 'Đã xác nhận' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 block text-center">
                              Đã xác nhận </span>
                          ): (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 block text-center">
                              {m.status === 'Nháp' ? 'Đã ghi nhận' : m.status}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setInspectReading(m)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium cursor-pointer"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {m.status === 'Nháp' ? (
                              <button
                                onClick={() => handleContinueDraftReading(m)}
                                className={`px-2.5 py-1 rounded text-[11px] font-medium cursor-pointer ${m.pendingVerificationFlag ? 'bg-red-50 hover:bg-red-100 text-red-800' : 'bg-blue-50 hover:bg-blue-100 text-blue-700'}`}
                              >
                                {m.pendingVerificationFlag ? 'Xác minh' : 'Sửa'}
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedReading(m);
                                  setEditFinalElec(m.finalElectricKwh);
                                  setEditFinalWater(m.finalWaterM3);
                                  setEditReason('');
                                  setShowEditModal(true);
                                }}
                                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-[11px] font-medium cursor-pointer"
                              >
                                Sửa
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: 6.3 BẢNG TÍNH TIỀN KỲ                                     */}
      {/* ========================================================================= */}
      {activeTab === 'bills' && (
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-wrap justify-between items-center gap-3">
            <div className="text-xs text-slate-600">
              <span className="font-bold text-slate-800">Công thức chuẩn hóa: </span>
              <strong>Tiền thuê kỳ tiếp theo (Trả trước)</strong> + <strong>Điện/nước & phí dịch vụ vừa sử dụng (Trả sau)</strong>. <span className="text-blue-800 block mt-0.5">
                * Dòng chỉ số còn cờ &quot;Cần xác minh&quot; sẽ không được xác nhận cho đến khi hoàn tất. </span>
            </div>

            <button
              onClick={() => {
                setSelectedBillRoomKeys([]);
                setBillGenerationFeedback(null);
                setShowGenBillModal(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Calculator className="w-4 h-4" />
              Tính tiền kỳ mới </button>
          </div>

          {billConfirmError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{billConfirmError}</span>
            </div>
          )}

          {billGenerationFeedback && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs flex items-start justify-between gap-3">
              <span className="whitespace-pre-line">{billGenerationFeedback}</span>
              <button type="button" onClick={() => setBillGenerationFeedback(null)} className="text-blue-700 hover:text-blue-900" aria-label="Đóng thông báo"><X className="w-4 h-4"/></button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl border border-slate-200 bg-white">
              <div className="text-xs text-slate-500">Tổng bảng tính</div>
              <div className="text-xl font-bold text-slate-900">{periodBills.length}</div>
            </div>
            <div className="p-3 rounded-xl border border-amber-200 bg-amber-50">
              <div className="text-xs text-amber-800">Đang nháp</div>
              <div className="text-xl font-bold text-amber-900">{periodBills.filter(b => !b.isConfirmed).length}</div>
            </div>
            <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50">
              <div className="text-xs text-emerald-800">Đã xác nhận</div>
              <div className="text-xl font-bold text-emerald-900">{periodBills.filter(b => b.isConfirmed).length}</div>
            </div>
          </div>

          <div className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col lg:flex-row gap-2 lg:items-center">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5"/>
              <input value={billSearchTerm} onChange={e => setBillSearchTerm(e.target.value)} placeholder="Tìm theo phòng, lần thuê hoặc kỳ..." className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs"/>
            </div>
            <select value={billPeriodFilter} onChange={e => setBillPeriodFilter(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-xs" aria-label="Lọc theo kỳ">
              <option value="ALL">Tất cả các kỳ</option>
              {billPeriods.map(period => <option key={period} value={period}>{period}</option>)}
            </select>
            <select value={billStatusFilter} onChange={e => setBillStatusFilter(e.target.value as 'ALL' | 'DRAFT' | 'CONFIRMED')} className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-xs" aria-label="Lọc trạng thái bảng tính">
              <option value="ALL">Tất cả trạng thái</option>
              <option value="DRAFT">Nháp – Chờ xác nhận</option>
              <option value="CONFIRMED">Đã xác nhận</option>
            </select>
          </div>

          <div className="space-y-4">
            {groupedPeriodBills.length === 0 ? (
              <div className="p-10 bg-white border border-slate-200 rounded-2xl text-center text-sm text-slate-500">
                <History className="w-8 h-8 mx-auto mb-2 text-slate-300"/>
                Không có bảng tính nào phù hợp bộ lọc. Bấm “Tính tiền kỳ mới” để lập bảng tính từ các phòng đã có chỉ số.
              </div>
            ) : groupedPeriodBills.map(([period, bills]) => (
              <section key={period} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{period}</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">{bills.length} bảng tính theo phòng/lần thuê</p>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] text-slate-500">Tổng giá trị các bảng tính</span>
                    <span className="font-mono font-bold text-blue-700">{bills.reduce((sum, b) => sum + b.totalAmount, 0).toLocaleString('vi-VN')} đ</span>
                  </div>
                </div>
                <div className="divide-y divide-slate-100">
                  {bills.map(bill => {
                    const reading = meterReadings.find(m => m.roomCode === bill.roomCode && m.leaseId === bill.leaseId && m.periodCode === bill.periodCode);
                    const hasPendingReading = !reading || Boolean(reading.pendingVerificationFlag || reading.needsRecalculateFlag);
                    return (
                      <div key={bill.id} className="p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">Phòng {bill.roomCode}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{bill.leaseId}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${bill.isConfirmed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                              {bill.isConfirmed ? 'Đã xác nhận' : 'Nháp – Chờ xác nhận'}
                            </span>
                            <span className="text-[10px] text-slate-400">Phiên bản {bill.version}</span>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                            <span>Điện: {bill.electricityUsage} kWh · {bill.electricityAmount.toLocaleString('vi-VN')} đ</span>
                            <span>Nước: {bill.waterUsage} m³ · {bill.waterAmount.toLocaleString('vi-VN')} đ</span>
                            <span>Tổng: <strong className="text-blue-700">{bill.totalAmount.toLocaleString('vi-VN')} đ</strong></span>
                          </div>
                          {hasPendingReading && <p className="text-[11px] text-amber-800 mt-1">Cần kiểm tra chỉ số hoặc cờ xác minh trước khi xác nhận bảng tính.</p>}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button type="button" onClick={() => setSelectedBillDetail(bill)} className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-50">
                            <Eye className="w-3.5 h-3.5 inline mr-1"/> Xem chi tiết
                          </button>
                          {!bill.isConfirmed ? (
                            <button type="button" onClick={() => handleConfirmBillAction(bill.id)} disabled={hasPendingReading} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5 inline mr-1"/> Xác nhận bảng tính
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: 6-STEP GHI NHẬN CHỈ SỐ MỚI                               */}
      {/* ========================================================================= */}
      {showReadingModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto pointer-events-auto">
          <div className="relative z-[101] pointer-events-auto bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 text-xs my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  
                  <h3 className="font-bold text-slate-900 text-base">{editingDraftReadingId ? 'Tiếp tục ghi nhận chỉ số điện và nước' : 'Ghi nhận chỉ số điện và nước'}</h3>
                </div>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Chọn đúng phòng và kỳ cần ghi nhận. </p>
              </div>
              <button
                onClick={() => { setShowReadingModal(false); setEditingDraftReadingId(null); }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {readingStage === 0 && <>
            {/* Bước 1 & 2: Chọn phòng & Loại chốt */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                   Chọn phòng / Lần thuê <span className="text-red-500">*</span>
                </label>
                <select
                  value={readRoom}
                  onChange={(e) => handleSelectRoomForReading(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-mono font-bold text-xs"
                >
                  <option value="">-- Chọn phòng chưa ghi chỉ số --</option>
                  {availableReadingRooms.map(r => (
                    <option key={`${r.id}-${r.currentLeaseId}`} value={r.roomCode}>
                      {r.roomCode} ({r.status}{r.isReturnedPending ? ' – Chờ chốt kỳ cuối' : ''})
                    </option>
                  ))}
                  {availableReadingRooms.length === 0 && <option value="" disabled>Không còn phòng chưa ghi chỉ số cho kỳ/ngày này</option>}
                </select>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Căn cứ lần thuê: {rooms.find(r => r.roomCode === readRoom)?.currentLeaseId || 'Chưa có — cần kiểm tra'}
                </span>
                {readRoom && selectedMeterBaseline && (
                  <p className={`mt-2 text-[11px] ${selectedMeterBaseline.ok ? 'text-emerald-700' : 'text-red-700'}`}>
                    {selectedMeterBaseline.ok === true ? `Nguồn chỉ số đầu: ${selectedMeterBaseline.source}` : selectedMeterBaseline.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                   Loại chốt chỉ số <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { setReadType('Theo kỳ chung'); if (!editingDraftReadingId) setReadRoom(''); }}
                    className={`flex-1 py-1.5 px-2.5 rounded-lg border text-xs font-semibold cursor-pointer text-center ${
                      readType === 'Theo kỳ chung'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs': 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    Theo kỳ chung </button>
                  <button
                    type="button"
                    onClick={() => { setReadType('Ngoài kỳ chung'); if (!editingDraftReadingId) setReadRoom(''); }}
                    className={`flex-1 py-1.5 px-2.5 rounded-lg border text-xs font-semibold cursor-pointer text-center ${
                      readType === 'Ngoài kỳ chung'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs': 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    Ngoài kỳ </button>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <label className="text-[10px] text-slate-500">Mã kỳ:</label>
                    <input
                      type="text"
                      value={readPeriod}
                      onChange={(e) => { setReadPeriod(e.target.value); if (!editingDraftReadingId) setReadRoom(''); }}
                      className="w-full px-2 py-1 border border-slate-300 rounded bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">Ngày ghi nhận:</label>
                    <input
                      type="date"
                      value={readingDate}
                      onChange={(e) => { setReadingDate(e.target.value); if (!editingDraftReadingId) setReadRoom(''); }}
                      className="w-full px-2 py-1 border border-slate-300 rounded bg-white font-mono"
                    />
                  </div>
                </div>

                {readingDateError && (
                  <p className="text-[10px] text-red-600 mt-1 font-semibold">{readingDateError}</p>
                )}
              </div>
            </div>

              <div className="flex justify-end"><button type="button" disabled={!readRoom || !readPeriod.trim() || !readingDate || !selectedMeterBaseline?.ok} onClick={()=>setReadingStage(1)} className="rounded-lg bg-blue-600 px-4 py-2 text-white font-semibold disabled:bg-slate-200 disabled:text-slate-500">Tiếp tục <ArrowRight className="inline h-4 w-4"/></button></div>
            </>}

            {readingStage === 1 && <>
            {/* Bước 3: Nhập chỉ số & Mã công tơ */}
            <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-4">
              <span className="font-bold text-slate-800 text-xs block">
                 Nhập chỉ số & kiểm tra định dạng hợp lệ </span>

              {selectedMeterBaseline && (
                <p className={`text-xs ${selectedMeterBaseline.ok ? 'text-emerald-700' : 'text-red-700'}`}>
                  {selectedMeterBaseline.ok === true
                    ? `Chỉ số đầu kỳ khóa theo: ${selectedMeterBaseline.source}. Nếu có thay công tơ/sai lệch, cần xử lý tại hồ sơ nguồn hoặc quy trình xác minh.`
                    : selectedMeterBaseline.message}
                </p>
              )}

              {/* Điện */}
              <div className="p-3 bg-white border border-amber-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center border-b border-amber-100 pb-1.5">
                  <span className="font-bold text-amber-900 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-600" />
                    Công tơ điện </span>
                  <span className="font-mono text-[11px] text-slate-500">
                    Sản lượng tạm tính: <strong className="text-amber-800">{currentElecUsage} kWh</strong>
                  </span>
                </div>
                <label className="block text-xs text-slate-700">Mã công tơ điện theo hồ sơ nguồn <input value={elecMeterCode} onChange={e=>setElecMeterCode(e.target.value)} placeholder="Nhập đúng mã công tơ điện" className="mt-1 block w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"/>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-500 block mb-1">Chỉ số đầu kỳ (từ / kỳ trước):</label>
                    <input
                      type="number"
                      value={initElec}
                      readOnly
                      title="Được lấy từ biên bản nhận phòng đã xác nhận hoặc chỉ số kỳ trước đã xác nhận"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">
                      Chỉ số cuối kỳ <span className="text-red-500">*</span>: </label>
                    <input
                      type="number"
                      value={finalElec}
                      onChange={(e) => setFinalElec(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-amber-800"
                    />
                  </div>
                </div>
              </div>

              {/* Nước */}
              <div className="p-3 bg-white border border-blue-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center border-b border-blue-100 pb-1.5">
                  <span className="font-bold text-blue-900 flex items-center gap-1.5">
                    <Droplets className="w-4 h-4 text-blue-600" />
                    Công tơ nước </span>
                  <span className="font-mono text-[11px] text-slate-500">
                    Sản lượng tạm tính: <strong className="text-blue-800">{currentWaterUsage} m³</strong>
                  </span>
                </div>
                <label className="block text-xs text-slate-700">Mã công tơ nước theo hồ sơ nguồn <input value={waterMeterCode} onChange={e=>setWaterMeterCode(e.target.value)} placeholder="Nhập đúng mã công tơ nước" className="mt-1 block w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"/>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-500 block mb-1">Chỉ số đầu kỳ (từ / kỳ trước):</label>
                    <input
                      type="number"
                      value={initWater}
                      readOnly
                      title="Được lấy từ biên bản nhận phòng đã xác nhận hoặc chỉ số kỳ trước đã xác nhận"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">
                      Chỉ số cuối kỳ <span className="text-red-500">*</span>: </label>
                    <input
                      type="number"
                      value={finalWater}
                      onChange={(e) => setFinalWater(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-blue-800"
                    />
                  </div>
                </div>
              </div>
            </div>

              
            {/* Bước 4: Kiểm tra bất thường & */}
            <div className={`p-4 rounded-2xl border transition-all ${
              detectedAbnormal || isAbnormal
                ? 'bg-amber-50/80 border-amber-300': 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 font-bold text-slate-900 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={isAbnormal || detectedAbnormal}
                    onChange={(e) => setIsAbnormal(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span> Xử lý bất thường công tơ</span>
                </label>
                {detectedAbnormal && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900 animate-pulse">
                    ⚠ Hệ thống tự động phát hiện bất thường </span>
                )}
              </div>

              {(isAbnormal || detectedAbnormal) && (
                <div className="space-y-3 pt-3 mt-3 border-t border-amber-200 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Lý do bất thường <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={abnormalReason}
                        onChange={(e) => setAbnormalReason(e.target.value as any)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium"
                      >
                        <option value="Quay vòng">Công tơ quay vòng qua 9999 về 0</option>
                        <option value="Thay công tơ">Thay thế công tơ mới giữa kỳ</option>
                        <option value="Công tơ hỏng">Công tơ hỏng / kẹt kim số</option>
                        <option value="Nhập sai">Chỉ số kỳ trước nhập sai</option>
                        <option value="Khác">Khách vắng mặt cả tháng / Lý do khác</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Sản lượng sử dụng thực tế đã xác minh (kWh) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={verifiedElec}
                        onChange={(e) => setVerifiedElec(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-mono font-bold text-amber-900"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Sản lượng nước thực tế đã xác minh (m³) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={verifiedWater}
                        onChange={(e) => setVerifiedWater(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-mono font-bold text-blue-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Chứng cứ ảnh / Biên bản xác minh công tơ (Bắt buộc ) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Camera className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={abnormalProof}
                        onChange={(e) => setAbnormalProof(e.target.value)}
                        placeholder="Nhập tên tệp ảnh (VD: anh_cong_to_101_quay_vong.jpg) hoặc link biên bản..."
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl bg-white"
                      />
                    </div>
                    <span className="text-[10px] text-amber-800 mt-1 block">
                      * Dòng chỉ số thiếu chứng cứ sẽ bị gắn cờ &quot;Cần xác minh&quot; và sẽ không thể xác nhận bảng tính. </span>
                  </div>
                </div>
              )}
            </div>

            {/* Hiển thị lỗi kiểm tra ngay tại bước nhập chỉ số; trước đây lỗi được đặt ở bước chọn phòng nên người dùng tưởng nút Lưu không hoạt động. */}
            {readingDateError && readingStage === 1 && (
              <div role="alert" aria-live="assertive" className="relative z-20 pointer-events-auto rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                {readingDateError}
              </div>
            )}

            {/* Bước 5: Lưu chỉ số của phòng/lần thuê đang chọn */}
            <div className="sticky bottom-0 relative z-30 pointer-events-auto flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 pb-1 border-t border-slate-200 bg-white shadow-[0_-8px_14px_-12px_rgba(15,23,42,0.45)]">
              <span className="text-slate-500 text-[11px]">
                 Lưu chỉ số sẽ ghi nhận một phòng/lần thuê. Dữ liệu bất thường được gắn cờ Cần xác minh. </span>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => { setShowReadingModal(false); setEditingDraftReadingId(null); }}
                  className="relative z-10 pointer-events-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium cursor-pointer"
                >
                  Hủy </button>
                <button
                  type="button"
                  onClick={handleSaveReadingSubmit}
                  className="relative z-10 pointer-events-auto px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer shadow-xs"
                >
                  Lưu chỉ số </button>
              </div>
            </div>
            </>}

            
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SỬA CHỈ SỐ TT-02                                                    */}
      {/* ========================================================================= */}
      {showEditModal && selectedReading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Sửa chỉ số điện/nước </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-500 text-[11px]">
              Chỉ sửa kỳ chưa thu tiền. Sau khi sửa, bảng tính tiền tương ứng sẽ được gắn cờ &quot;Cần tính lại&quot;. </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Chỉ số điện mới (kWh)</label>
                <input
                  type="number"
                  value={editFinalElec}
                  onChange={(e) => setEditFinalElec(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-amber-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Chỉ số nước mới (m³)</label>
                <input
                  type="number"
                  value={editFinalWater}
                  onChange={(e) => setEditFinalWater(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-blue-800"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Lý do sửa chỉ số <span className="text-red-500">*</span>
              </label>
              <textarea
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                rows={3}
                required
                placeholder="Ghi rõ lý do (nhập nhầm số, chốt lại ngày trả phòng...)"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium cursor-pointer"
              >
                Hủy </button>
              <button
                type="button"
                onClick={handleUpdateReading}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold cursor-pointer shadow-xs"
              >
                Lưu sửa chỉ số </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: GENERATE BILL TT-03                                                */}
      {/* ========================================================================= */}
      {showGenBillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Tính tiền kỳ mới</h3>
                <p className="text-slate-500 mt-1">Chỉ hiển thị phòng/lần thuê đã có chỉ số ghi nhận cho kỳ được chọn.</p>
              </div>
              <button type="button" onClick={() => setShowGenBillModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer" aria-label="Đóng">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kỳ tính tiền</label>
              <input
                type="text"
                value={billPeriod}
                onChange={(e) => { setBillPeriod(e.target.value); setSelectedBillRoomKeys([]); setBillGenerationFeedback(null); }}
                placeholder="Kỳ MM/YYYY"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
              <p className="text-[10px] text-slate-500 mt-1">Ví dụ: Kỳ 10/2026. Chỉ chọn phòng có chỉ số đúng kỳ này.</p>
            </div>

            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 border-b border-slate-200">
                <label className="flex items-center gap-2 font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={billCandidateReadings.some(c => c.selectable) && billCandidateReadings.filter(c => c.selectable).every(c => selectedBillRoomKeys.includes(c.key))}
                    disabled={!billCandidateReadings.some(c => c.selectable)}
                    onChange={(e) => setSelectedBillRoomKeys(e.target.checked ? billCandidateReadings.filter(c => c.selectable).map(c => c.key) : [])}
                    className="rounded border-slate-300"
                  />
                  Chọn tất cả phòng đủ điều kiện
                </label>
                <span className="text-slate-500">{billCandidateReadings.filter(c => c.selectable).length} phòng có thể chọn</span>
              </div>
              <div className="divide-y divide-slate-100">
                {billCandidateReadings.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <AlertCircle className="w-7 h-7 mx-auto mb-2 text-slate-300"/>
                    Chưa có phòng/lần thuê nào ghi nhận chỉ số cho {billPeriod || 'kỳ đã chọn'}.
                    <p className="text-[10px] mt-1">Hãy ghi nhận chỉ số trước khi tính tiền.</p>
                  </div>
                ) : billCandidateReadings.map(({key, reading, selectable, unavailableReason}) => (
                  <label key={key} className={`flex items-start gap-3 p-3 ${selectable ? 'cursor-pointer hover:bg-blue-50/50' : 'bg-slate-50 opacity-80'}`}>
                    <input
                      type="checkbox"
                      checked={selectedBillRoomKeys.includes(key)}
                      disabled={!selectable}
                      onChange={(e) => setSelectedBillRoomKeys(old => e.target.checked ? [...old, key] : old.filter(x => x !== key))}
                      className="mt-1 rounded border-slate-300"
                    />
                    <span className="flex-1 min-w-0">
                      <span className="flex flex-wrap items-center gap-2">
                        <strong className="text-slate-900">{reading.roomCode}</strong>
                        <span className="text-[10px] text-slate-500 font-mono">{reading.leaseId}</span>
                        {selectable ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">Đủ điều kiện sơ bộ</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-semibold">{unavailableReason}</span>
                        )}
                      </span>
                      <span className="block text-[11px] text-slate-500 mt-1">
                        Điện {reading.initialElectricKwh} → {reading.finalElectricKwh}; Nước {reading.initialWaterM3} → {reading.finalWaterM3}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {billGenerationFeedback && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 whitespace-pre-line">{billGenerationFeedback}</div>
            )}

            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pt-3 border-t border-slate-100">
              <span className="text-slate-500">Đã chọn {selectedBillRoomKeys.filter(key => billCandidateReadings.some(c => c.key === key && c.selectable)).length} phòng. Kết quả sẽ được lưu thành bảng tính nháp riêng cho từng phòng/lần thuê.</span>
              <div className="flex justify-end gap-2 shrink-0">
                <button type="button" onClick={() => setShowGenBillModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium">Hủy</button>
                <button type="button" onClick={handleGenerateBill} disabled={!selectedBillRoomKeys.some(key => billCandidateReadings.some(c => c.key === key && c.selectable))} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-xs">
                  <Calculator className="w-4 h-4 inline mr-1"/> Tính tiền các phòng đã chọn
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

            {currentDetailBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Chi tiết bảng tính — Phòng {currentDetailBill.roomCode}</h3>
                <p className="text-slate-500 mt-1">Lần thuê {currentDetailBill.leaseId} · {currentDetailBill.periodCode} · Phiên bản {currentDetailBill.version}</p>
              </div>
              <button type="button" onClick={() => setSelectedBillDetail(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600" aria-label="Đóng"><X className="w-5 h-5"/></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 border border-blue-200 bg-blue-50/50 rounded-xl space-y-2">
                <h4 className="font-bold text-blue-950">1. Tiền thuê kỳ tiếp theo (trả trước)</h4>
                <div className="flex justify-between gap-3"><span className="text-slate-600">Khoảng thời gian</span><span className="font-mono text-right">{currentDetailBill.nextRentPeriodFrom} → {currentDetailBill.nextRentPeriodTo}</span></div>
                <div className="flex justify-between gap-3"><span className="text-slate-600">Tiền thuê</span><strong>{(currentDetailBill.isRentPeriodEnded ? 0 : currentDetailBill.nextMonthRentAmount).toLocaleString('vi-VN')} đ</strong></div>
                {currentDetailBill.isRentPeriodEnded && <p className="text-purple-800 bg-purple-50 border border-purple-200 rounded p-2">Đã nhận lại phòng thực tế; không phát sinh tiền thuê kỳ tiếp theo.</p>}
              </div>
              <div className="p-3 border border-slate-200 bg-slate-50 rounded-xl space-y-2">
                <h4 className="font-bold text-slate-900">2. Dịch vụ kỳ vừa sử dụng (trả sau)</h4>
                <div className="flex justify-between gap-3"><span className="text-slate-600">Khoảng thời gian</span><span className="font-mono text-right">{currentDetailBill.servicePeriodFrom} → {currentDetailBill.servicePeriodTo}</span></div>
                <div className="flex justify-between gap-3"><span>Điện ({currentDetailBill.electricityUsage} kWh × {currentDetailBill.electricityRate.toLocaleString('vi-VN')} đ)</span><strong>{currentDetailBill.electricityAmount.toLocaleString('vi-VN')} đ</strong></div>
                <div className="flex justify-between gap-3"><span>Nước ({currentDetailBill.waterUsage} m³ × {currentDetailBill.waterRate.toLocaleString('vi-VN')} đ)</span><strong>{currentDetailBill.waterAmount.toLocaleString('vi-VN')} đ</strong></div>
                {currentDetailBill.serviceFees.map((fee, index) => (
                  <div key={`${fee.name}-${index}`} className="flex justify-between gap-3"><span>{fee.name}</span><strong>{fee.amount.toLocaleString('vi-VN')} đ</strong></div>
                ))}
                {(currentDetailBill.adjustmentAmount || 0) !== 0 && <div className="flex justify-between gap-3"><span>Điều chỉnh {currentDetailBill.adjustmentReason ? `(${currentDetailBill.adjustmentReason})` : ''}</span><strong>{(currentDetailBill.adjustmentAmount || 0).toLocaleString('vi-VN')} đ</strong></div>}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-slate-300">Tổng tiền bảng tính</p>
                <p className="text-2xl font-bold">{currentDetailBill.totalAmount.toLocaleString('vi-VN')} đ</p>
              </div>
              <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${currentDetailBill.isConfirmed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}>
                {currentDetailBill.isConfirmed ? 'Đã xác nhận' : 'Nháp – Chờ xác nhận'}
              </span>
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-slate-200">
              <button type="button" onClick={() => setSelectedBillDetail(null)} className="px-4 py-2 border border-slate-300 rounded-lg font-semibold">Đóng</button>
              {!currentDetailBill.isConfirmed ? (
                <button type="button" onClick={() => { if (handleConfirmBillAction(currentDetailBill.id)) setSelectedBillDetail(null); }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold">
                  <CheckCircle2 className="w-4 h-4 inline mr-1"/> Xác nhận bảng tính
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DETAIL READING INSPECT                                             */}
      {/* ========================================================================= */}
      {inspectReading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                Chi tiết chỉ số: {inspectReading.roomCode} ({inspectReading.periodCode}) </h3>
              <button
                onClick={() => setInspectReading(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-slate-700">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Mã lần thuê:</span>
                <span className="font-mono font-semibold">{inspectReading.leaseId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Loại chốt:</span>
                <span className="font-semibold">{inspectReading.readingType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Ngày đọc:</span>
                <span className="font-mono">{inspectReading.readingDate}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Điện (CT: {inspectReading.electricMeterCode}):</span>
                <span className="font-mono font-bold text-amber-800">
                  {inspectReading.initialElectricKwh} → {inspectReading.finalElectricKwh} ({Math.max(0, inspectReading.finalElectricKwh - inspectReading.initialElectricKwh)} kWh) </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Nước (CT: {inspectReading.waterMeterCode}):</span>
                <span className="font-mono font-bold text-blue-800">
                  {inspectReading.initialWaterM3} → {inspectReading.finalWaterM3} ({Math.max(0, inspectReading.finalWaterM3 - inspectReading.initialWaterM3)} m³) </span>
              </div>
              {inspectReading.isAbnormal && (
                <div className="p-3 bg-amber-50 rounded-xl space-y-1 text-amber-900">
                  <div className="font-bold">Bất thường công tơ: {inspectReading.abnormalReason}</div>
                  <div>Sản lượng xác minh: <strong>{inspectReading.verifiedElectricKwh} kWh</strong> / <strong>{inspectReading.verifiedWaterM3} m³</strong></div>
                  {inspectReading.abnormalEvidence && (
                    <div className="text-[11px] text-amber-800">Minh chứng: {inspectReading.abnormalEvidence}</div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setInspectReading(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium cursor-pointer"
              >
                Đóng </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
