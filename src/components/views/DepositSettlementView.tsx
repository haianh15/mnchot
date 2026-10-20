import { toUserMessage } from '../../utils/userMessages';
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { DepositSettlementSlip, DeductionItem, SettlementContactLog } from '../../types';
import { canEditSettlement, canRecordSettlement, getCurrentSettlementSlip, terminalSettlementStatuses } from '../../utils/settlementUi';
import {
  Scale, Plus, CheckCircle2, AlertCircle, Clock, FileCheck, ArrowRight,
  Landmark, AlertTriangle, MessageSquare, History, X, Search, Filter,
  FileText, ShieldCheck, ChevronRight, Lock, RotateCcw, Ban, Check,
  ExternalLink, PhoneCall, Paperclip, Upload, Eye, RefreshCw, Info, DollarSign
} from 'lucide-react';

export const DepositSettlementView: React.FC<{leaseId?: string; contractId?: string; initialMode?: 'list'|'create'|'edit'|'result'|'view'; initialSlipId?: string; onCreateClose?: () => void}> = ({leaseId, contractId, initialMode='list', initialSlipId='', onCreateClose}) => {
  const {
    settlementSlips,
    rooms,
    contracts,
    returnInspections,
    periodBills,
    paymentNotices,
    assetComparisonResults,
    initialPaymentRecords,
    currentUser,
    activeBankAccount,
    saveSettlementSlipQTC01,
    updateSettlementFeedbackQTC02,
    adjustSettlementDeductionsQTC02,
    lockDisputeSettlementQTC02,
    reopenDisputedSettlementQTC02,
    cancelSettlementSlipQTC02,
    confirmSettlementTransferReceiptQTC03
  } = useApp();

  // Selected slip state
  const contractFocus = contracts.find(c => c.id === contractId && (!leaseId || c.leaseId === leaseId));
  const [selectedSlipId, setSelectedSlipId] = useState<string>(initialSlipId || (leaseId ? getCurrentSettlementSlip(settlementSlips, leaseId, contractFocus?.roomCode)?.id : settlementSlips[0]?.id) || '');
  const [isEditMode, setIsEditMode] = useState(initialMode === 'edit');
  const selectedSlip = useMemo(() => settlementSlips.find(s => s.id === selectedSlipId && (!leaseId || s.leaseId === leaseId) && (!contractFocus || s.roomCode === contractFocus.roomCode)) || (leaseId ? getCurrentSettlementSlip(settlementSlips, leaseId, contractFocus?.roomCode) : settlementSlips[0] || null), [settlementSlips, selectedSlipId, leaseId, contractId]);

  useEffect(() => { if (initialSlipId) setSelectedSlipId(initialSlipId); else setSelectedSlipId(leaseId ? (getCurrentSettlementSlip(settlementSlips, leaseId, contractFocus?.roomCode)?.id || '') : (settlementSlips[0]?.id || '')); }, [leaseId, contractId, initialSlipId]);
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(initialMode === 'create');
  const [createCalculation, setCreateCalculation] = useState<{fingerprint: string; result: number; totalDeductions: number} | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showQTC03Modal, setShowQTC03Modal] = useState(false);
  const [showConfirmQTC03Popup, setShowConfirmQTC03Popup] = useState(false);

  // Form states for UC-QTC-01 (Create slip)
  const [createSelectedRoom, setCreateSelectedRoom] = useState<string>(contractFocus?.roomCode || '');
  const [earlyTerminationClause, setEarlyTerminationClause] = useState('');
  const [earlyTerminationReason, setEarlyTerminationReason] = useState('');
  const [earlyTerminationAmount, setEarlyTerminationAmount] = useState<number>(0);
  const [earlyTerminationEvidence, setEarlyTerminationEvidence] = useState('');
  const [createCustomDeductions, setCreateCustomDeductions] = useState<DeductionItem[]>([]);
  const [createNoticeMsg, setCreateNoticeMsg] = useState<{ type: 'error' | 'warning' | 'info'; text: string } | null>(null);

  // Form states for UC-QTC-02 (Feedback & contact log)
  const [contactChannel, setContactChannel] = useState<'Điện thoại' | 'Zalo' | 'Trực tiếp' | 'Khác'>('Zalo');
  const [contactPerson, setContactPerson] = useState('');
  const [contactContent, setContactContent] = useState('');
  const [feedbackResult, setFeedbackResult] = useState<'Đồng ý' | 'Không đồng ý' | 'Chưa phản hồi' | 'Không liên hệ được'>('Đồng ý');
  const [contactEvidence, setContactEvidence] = useState('');
  const [agreementProofFile, setAgreementProofFile] = useState('');
  const [agreementProofNote, setAgreementProofNote] = useState('');
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  // Form states for UC-QTC-02 (Adjust deductions)
  const [adjustReason, setAdjustReason] = useState('');
  const [tempAdjustDeductions, setTempAdjustDeductions] = useState<DeductionItem[]>([]);
  const [adjustError, setAdjustError] = useState<string | null>(null);

  // Form states for Dispute / Reopen / Cancel
  const [disputeReasonInput, setDisputeReasonInput] = useState('');
  const [disputeItemsInput, setDisputeItemsInput] = useState('');
  const [disputeBasisInput, setDisputeBasisInput] = useState('');
  const [reopenReasonInput, setReopenReasonInput] = useState('');
  const [cancelReasonInput, setCancelReasonInput] = useState('');

  // Form states for UC-QTC-03 (Confirm result & 1 single transfer receipt)
  const [receiptBank, setReceiptBank] = useState('');
  const [receiptAccNumber, setReceiptAccNumber] = useState('');
  const [receiptAccHolder, setReceiptAccHolder] = useState('');
  const [receiptTxnCode, setReceiptTxnCode] = useState('');
  const [receiptDate, setReceiptDate] = useState('');
  const [receiptProofFile, setReceiptProofFile] = useState('');
  const [qtc03Error, setQtc03Error] = useState<string | null>(null);

  // -------------------------------------------------------------
  // Filtered slips list
  // -------------------------------------------------------------
  const filteredSlips = useMemo(() => {
    return settlementSlips.filter(slip => {
      if (leaseId && slip.leaseId !== leaseId) return false;
      if (contractFocus && slip.roomCode !== contractFocus.roomCode) return false;
      const matchSearch =
        slip.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        slip.roomCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        slip.leaseId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        slip.contractChain?.some(id => id.toLowerCase().includes(searchQuery.toLowerCase())) ||
        contracts.some(c => c.roomCode === slip.roomCode && c.leaseId === slip.leaseId && c.tenantName.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchSearch) return false;

      if (statusFilter === 'all') return true;
      // The dropdown exposes only the seven agreed business statuses.
      if (statusFilter === 'Hoàn tất') return slip.status === 'Hoàn tất';
      return slip.status === statusFilter;
    });
  }, [settlementSlips, searchQuery, statusFilter, leaseId, contractId, contracts]);

  useEffect(() => {
    if (filteredSlips.length > 0 && !filteredSlips.some(s=>s.id === selectedSlipId)) setSelectedSlipId(filteredSlips[0].id);
  }, [filteredSlips, selectedSlipId]);

  // -------------------------------------------------------------
  // UC-QTC-01: Calculate eligible rooms (Bước 1)
  // Condition 1: Đã có kết quả nhận lại phòng thực tế được xác nhận tại /xác nhận của chủ nhà (step304Status: 'Đã nhận lại' && step305Confirmed: true)
  // Condition 2: Lần thuê chưa có phiếu quyết toán hiệu lực (hoặc chỉ có phiếu Đang lập để mở lại, hoặc chưa có phiếu)
  // Phòng đã Trống, cọc chưa quyết toán: vẫn cho lập phiếu QT05; không quay phòng về Đang thuê
  // -------------------------------------------------------------
  const eligibleRooms = useMemo(() => {
    return returnInspections.filter(inspection => {
      if (leaseId && inspection.leaseId !== leaseId) return false;
      if (contractFocus && inspection.roomCode !== contractFocus.roomCode) return false;
      if (inspection.step304Status !== 'Đã nhận lại' || !inspection.step305Confirmed) {
        return false;
      }
      // Check if lease already has completed/locked slip
      const existingSlip = getCurrentSettlementSlip(settlementSlips, inspection.leaseId, inspection.roomCode);
      if (existingSlip) return false;
      return true;
    });
  }, [returnInspections, settlementSlips, leaseId, contractId]);

  // -------------------------------------------------------------
  // UC-QTC-01: Preparation when opening create modal for a room
  // -------------------------------------------------------------
  const handleOpenCreateModal = (roomCodeCandidate?: string) => {
    setCreateNoticeMsg(null);
    setEarlyTerminationClause('');
    setEarlyTerminationReason('');
    setEarlyTerminationAmount(0);
    setEarlyTerminationEvidence('');
    setCreateCustomDeductions([]);
    setCreateCalculation(null);

    if (eligibleRooms.length === 0) {
      alert("Hiện tại không có phòng nào đủ điều kiện lập quyết toán cọc! Điều kiện: Phòng phải được nhận lại thực tế và xác nhận tại /xác nhận của chủ nhà và chưa có phiếu quyết toán hiệu lực.");
      return;
    }

    const defaultRoomCode = eligibleRooms.find(i => i.roomCode === (contractFocus?.roomCode || roomCodeCandidate))?.roomCode || (contractFocus ? '' : eligibleRooms[0]?.roomCode || ''); 
    setCreateSelectedRoom(defaultRoomCode);
    setShowCreateModal(true);
  };

  // Inspect data for currently selected room in create modal
  const roomCandidateData = useMemo(() => {
    if (!createSelectedRoom) return null;

    const inspection = returnInspections.find(i => i.roomCode === createSelectedRoom && (!leaseId || i.leaseId === leaseId) && i.step304Status === 'Đã nhận lại' && i.step305Confirmed);
    const targetLeaseId = inspection?.leaseId || leaseId || '';

    // Consecutive contract chain for this lease
    const chainContracts = contracts.filter(c => c.roomCode === createSelectedRoom && c.leaseId === targetLeaseId).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    // Initial contract of consecutive chain
    const firstContract = chainContracts[0];

    // Initial deposit from PH-07 or first contract
    const initialPayment = initialPaymentRecords.find(p => p.roomCode === createSelectedRoom && p.leaseId === targetLeaseId);
    const depositAmount = initialPayment?.depositAmount ?? 0;
    const depositCode = initialPayment?.depositCode || '';

    // Final period bill from TT-03 (Bước 4 / )
    const finalBill = [...periodBills].filter(b => b.roomCode === createSelectedRoom && b.leaseId === targetLeaseId).sort((a,b)=>b.periodCode.localeCompare(a.periodCode))[0];
    const isFinalBillConfirmed = !!finalBill && finalBill.isConfirmed;

    // Remaining debts from previous notices
    const overdueNotices = paymentNotices.filter(n => n.roomCode === createSelectedRoom && n.leaseId === targetLeaseId && n.paymentStatus === 'Chưa thu' && n.status === 'Đang hiệu lực' && n.dueDate < new Date().toLocaleDateString('en-CA'));
    const overdueRentDebt = overdueNotices.reduce((sum, n) => sum + (n.breakdown?.nextRentAmount || 0), 0);

    // Asset damages from BG07
    const bg07Result = assetComparisonResults.find(r => r.roomCode === createSelectedRoom && r.leaseId === targetLeaseId);
    const assetDamageAmount = bg07Result?.compensationAmount || 0;

    // Existing slip check (Bước 2)
    const existingDraftSlip = settlementSlips.find(s => s.roomCode === createSelectedRoom && s.leaseId === targetLeaseId && s.status !== 'Đã hủy');

    return {
      inspection,
      leaseId: targetLeaseId,
      chainContracts,
      firstContract,
      depositAmount,
      depositCode,
      finalBill,
      isFinalBillConfirmed,
      overdueNotices,
      overdueRentDebt,
      bg07Result,
      assetDamageAmount,
      existingDraftSlip,
      actualReturnDate: inspection?.inspectionDate || ''
    };
  }, [createSelectedRoom, returnInspections, contracts, initialPaymentRecords, periodBills, paymentNotices, assetComparisonResults, settlementSlips, leaseId]);

  // -------------------------------------------------------------
  // UC-QTC-01: Calculate initial deductions list and result
  // -------------------------------------------------------------
  const calculatedCreateItems = useMemo(() => {
    if (!roomCandidateData) return { deductions: [], totalDeductions: 0, result: 0 };

    const deductions: DeductionItem[] = [];

    // (a) Toàn bộ công nợ còn lại của lần thuê: kỳ trước Chưa thu
    if (roomCandidateData.overdueNotices.length > 0) {
      roomCandidateData.overdueNotices.forEach(n => {
        deductions.push({
          id: 'ded_overdue_' + n.id,
          category: 'Công nợ kỳ trước',
          description: `Công nợ chưa thu ${n.noticeCode} (${n.periodCode})`,
          amount: n.totalAmount,
          reason: 'Theo thông báo thanh toán quá hạn chưa thanh toán'
        });
      });
    }

    // (a2) Nghĩa vụ kỳ cuối từ bảng tính TT-03 đã xác nhận: điện/nước đến ngày trả, phí dịch vụ cố định đủ kỳ
    if (roomCandidateData.isFinalBillConfirmed && roomCandidateData.finalBill) {
      const fb = roomCandidateData.finalBill;
      const utilityTotal = (fb.electricityAmount || 0) + (fb.waterAmount || 0) + (fb.serviceFees?.reduce((s, f) => s + f.amount, 0) || 0);
      if (utilityTotal > 0) {
        deductions.push({
          id: 'ded_final_bill_' + fb.id,
          category: 'Điện nước dịch vụ kỳ cuối',
          description: `Điện nước & phí dịch vụ kỳ cuối (${fb.periodCode}) đến ngày nhận lại thực tế`,
          amount: utilityTotal,
          reason: `Điện: ${(fb.electricityAmount || 0).toLocaleString('vi-VN')} đ, Nước: ${(fb.waterAmount || 0).toLocaleString('vi-VN')} đ, Dịch vụ cố định thu đủ kỳ: ${(fb.serviceFees?.reduce((s, f) => s + f.amount, 0) || 0).toLocaleString('vi-VN')} đ`
        });
      }
    }

    // (b) Chi phí tài sản theo kết quả đối chiếu BG07
    if (roomCandidateData.assetDamageAmount > 0) {
      deductions.push({
        id: 'ded_asset_' + (roomCandidateData.bg07Result?.id || Date.now()),
        category: 'Thiệt hại tài sản',
        description: 'Chi phí bồi thường hư hỏng theo kết quả đối chiếu tài sản BG07',
        amount: roomCandidateData.assetDamageAmount,
        reason: roomCandidateData.bg07Result?.solutionPlan || 'Căn cứ biên bản đối chiếu tài sản trả phòng BG07'
      });
    }

    // (c) Khoản trừ theo điều khoản hợp đồng khi kết thúc trước hạn/đơn phương
    if (earlyTerminationAmount > 0 && earlyTerminationClause.trim()) {
      deductions.push({
        id: 'ded_contract_term',
        category: 'Khoản trừ theo điều khoản hợp đồng',
        description: `Khoản trừ kết thúc trước hạn: ${earlyTerminationClause}`,
        amount: earlyTerminationAmount,
        clauseRef: earlyTerminationClause,
        reason: earlyTerminationReason || 'Khách kết thúc thuê trước hạn hợp đồng theo thỏa thuận',
        evidence: earlyTerminationEvidence
      });
    }

    // Additional custom deductions if any
    createCustomDeductions.forEach(d => deductions.push(d));

    const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
    const result = roomCandidateData.depositAmount - totalDeductions;

    return { deductions, totalDeductions, result };
  }, [roomCandidateData, earlyTerminationAmount, earlyTerminationClause, earlyTerminationReason, earlyTerminationEvidence, createCustomDeductions]);

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    onCreateClose?.();
  };

  // -------------------------------------------------------------
  // UC-QTC-01: Submit create slip (Bước 7 & 8)
  // -------------------------------------------------------------
  const createFingerprint = JSON.stringify({ room: createSelectedRoom, lease: roomCandidateData?.leaseId, deposit: roomCandidateData?.depositCode, amount: roomCandidateData?.depositAmount, bill: roomCandidateData?.finalBill?.id, billConfirmed: roomCandidateData?.isFinalBillConfirmed, items: calculatedCreateItems.deductions.map(d=>[d.id,d.amount,d.clauseRef,d.reason,d.evidence]) });
  const calculationIsCurrent = createCalculation?.fingerprint === createFingerprint;

  const handleCalculateQTC01 = () => {
    if (!roomCandidateData) { setCreateNoticeMsg({type:'error',text:'Vui lòng chọn hồ sơ nhận lại phòng hợp lệ.'}); return; }
    if (!Number.isFinite(earlyTerminationAmount) || earlyTerminationAmount < 0) { setCreateNoticeMsg({type:'error',text:'Số tiền khấu trừ phải là số không âm.'}); return; }
    if (earlyTerminationAmount > 0 && (!earlyTerminationClause.trim() || !earlyTerminationReason.trim() || !earlyTerminationEvidence.trim())) {
      setCreateNoticeMsg({type:'error',text:'Khoản khấu trừ theo hợp đồng cần có điều khoản, lý do và chứng cứ cụ thể.'}); return;
    }
    setCreateNoticeMsg(null);
    setCreateCalculation({fingerprint:createFingerprint, result:calculatedCreateItems.result, totalDeductions:calculatedCreateItems.totalDeductions});
  };

  const handleSaveNewSlipQTC01 = () => {
    if (!roomCandidateData) return;
    if (!calculationIsCurrent) { setCreateNoticeMsg({type:'error',text:'Vui lòng bấm Tính kết quả sau khi nhập hoặc thay đổi các khoản khấu trừ.'}); return; }

    // Bước 2: Kiểm tra phiếu đang lập của lần thuê
    if (roomCandidateData.existingDraftSlip) {
      const proceed = confirm(`Phòng ${createSelectedRoom} đã có phiếu quyết toán (${roomCandidateData.existingDraftSlip.id}). Bạn có muốn xem phiếu này không?`);
      if (proceed) {
        // Đóng form tạo mới và hiển thị phiếu hiện có ngay trong màn quản lý quyết toán.
        // Không gọi onCreateClose ở nhánh này vì người dùng chọn xem phiếu, không rời phân hệ.
        setSelectedSlipId(roomCandidateData.existingDraftSlip.id);
        setShowCreateModal(false);
      }
      return;
    }

    // Không xác định được mã cọc gốc
    if (!roomCandidateData.depositAmount || roomCandidateData.depositAmount <= 0) {
      alert("Lỗi: Không xác định được mã cọc gốc hoặc số tiền cọc gốc hợp lệ. Yêu cầu kiểm tra hợp đồng đầu tiên /.");
      return;
    }

    if (!roomCandidateData.firstContract || !roomCandidateData.depositCode || !roomCandidateData.inspection) {
      alert('Thiếu hợp đồng đầu, mã cọc gốc hoặc xác nhận nhận lại phòng thực tế. Cần kiểm tra hồ sơ nguồn trước khi lập phiếu.');
      return;
    }

    // Chưa có tiền kỳ cuối được xác nhận
    if (!roomCandidateData.isFinalBillConfirmed) {
      const allowDraftWithoutBill = confirm(
        'Cảnh báo: Chưa có bảng tính tiền kỳ cuối Đã xác nhận từ TT-03!\n\ntheo quy định, hệ thống sẽ lưu phiếu ở trạng thái Đang lập nhưng CHƯA KẾT LUẬN số tiền hoàn cho đến khi hoàn tất TT-03.\n\nBạn có muốn lưu phiếu Đang lập ngay bây giờ không?'
      );
      if (!allowDraftWithoutBill) return;
    }

    const slipId = 'QTC-' + createSelectedRoom.replace(/[^a-zA-Z0-9-]/g, '') + '-' + roomCandidateData.leaseId.replace(/[^a-zA-Z0-9-]/g, '') + '-' + Date.now().toString(36);

    const newSlip: DepositSettlementSlip = {
      id: slipId,
      roomCode: createSelectedRoom,
      leaseId: roomCandidateData.leaseId,
      contractChain: roomCandidateData.chainContracts.map(c => c.id),
      initialContractId: roomCandidateData.firstContract.id,
      initialDepositAmount: roomCandidateData.depositAmount,
      initialDepositCode: roomCandidateData.depositCode,
      handoverReturnDate: roomCandidateData.actualReturnDate,
      actualReturnDate: roomCandidateData.actualReturnDate,
      bg07Ref: roomCandidateData.bg07Result?.id,
      bg07Linked: true, // Trả mã hồ sơ để BG07 ghi Đã liên kết (Bước 2)
      finalBillId: roomCandidateData.finalBill?.id,
      finalBillPeriod: roomCandidateData.finalBill?.periodCode,
      finalBillConfirmed: roomCandidateData.isFinalBillConfirmed,
      prepaidRentAmount: roomCandidateData.firstContract?.monthlyRent || 0,
      deductions: calculatedCreateItems.deductions,
      calculatedResult: roomCandidateData.isFinalBillConfirmed ? createCalculation!.result: 0,
      calculationStatus: roomCandidateData.isFinalBillConfirmed ? 'Đã tính': 'Chưa đủ căn cứ',
      status: 'Đang lập', // Phiếu không có trạng thái Nháp riêng (Bước 7)
      version: 1,
      reviewRequired: false,
      tenantFeedback: 'Chưa phản hồi',
      contactLogs: [],
      step58Published: false,
      auditHistory: [
        {
          timestamp: new Date().toISOString(),
          user: currentUser?.fullName || 'Nguyễn Văn An (Chủ nhà)',
          action: 'Lập phiếu quyết toán cọc ',
          schemeVersion: 1,
          note: `Khởi tạo phiếu quyết toán cọc ${slipId} trong hồ sơ chờ quyết toán cọc do BG07 chuyển giao (Đã liên kết). Cọc gốc: ${roomCandidateData.depositAmount.toLocaleString('vi-VN')} đ lấy từ hợp đồng đầu tiên.`
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const res = saveSettlementSlipQTC01(newSlip);
    if (res.success) {
      setSelectedSlipId(newSlip.id);
      setShowCreateModal(false);
      alert(toUserMessage(res.message));
      onCreateClose?.();
    } else {
      alert('Lỗi: ' + res.message);
    }
  };

  // -------------------------------------------------------------
  // UC-QTC-02: Submit tenant feedback & contact history (Bước 3 & 5)
  // -------------------------------------------------------------
  const handleSaveFeedbackQTC02 = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackError(null);
    if (!selectedSlip) return;

    if (!contactContent.trim()) {
      setFeedbackError('Bắt buộc nhập nội dung trao đổi / kết quả liên hệ với khách.');
      return;
    }

    if (feedbackResult === 'Đồng ý' && !agreementProofFile.trim()) {
      setFeedbackError('Bắt buộc đính kèm bằng chứng khách đồng ý hợp lệ đúng phiên bản v' + selectedSlip.version + '.');
      return;
    }

    const res = updateSettlementFeedbackQTC02({
      slipId: selectedSlip.id,
      feedback: feedbackResult,
      contactLog: {
        channel: contactChannel,
        contactPerson: contactPerson || 'Khách thuê phòng ' + selectedSlip.roomCode,
        content: contactContent,
        result: feedbackResult,
        evidence: contactEvidence || agreementProofFile
      },
      agreementEvidence: feedbackResult === 'Đồng ý' ? {
        evidenceFile: agreementProofFile,
        evidenceNote: agreementProofNote
      }: undefined
    });

    if (res.success) {
      setShowFeedbackModal(false);
      alert(toUserMessage(res.message));
    } else {
      setFeedbackError(res.message);
    }
  };

  // -------------------------------------------------------------
  // UC-QTC-02: Prepare & Submit deduction adjustments (Bước 4)
  // -------------------------------------------------------------
  const handleOpenAdjustModal = () => {
    if (!selectedSlip) return;
    if (terminalSettlementStatuses.includes(selectedSlip.status) || selectedSlip.status === 'Đã hủy') {
      alert('Phiếu đã có kết quả quyết toán cọc hoặc đã khóa, chỉ được xem.');
      return;
    }
    setAdjustReason('');
    setAdjustError(null);
    // Clone deductions with initial adjustment proposals
    setTempAdjustDeductions(selectedSlip.deductions.map(d => ({...d,
      originalAmount: d.originalAmount || d.amount,
      adjustmentProposal: d.adjustmentProposal || 'giữ nguyên',
      adjustmentReason: d.adjustmentReason || ''
    })));
    setShowAdjustModal(true);
  };

  const handleSaveAdjustmentsQTC02 = (e: React.FormEvent) => {
    e.preventDefault();
    setAdjustError(null);
    if (!selectedSlip) return;

    if (!adjustReason.trim()) {
      setAdjustError('Bắt buộc nhập lý do tổng thể cho lần điều chỉnh phương án này.');
      return;
    }

    // Verify all adjusted items have individual reason if modified
    for (const item of tempAdjustDeductions) {
      if (item.adjustmentProposal !== 'giữ nguyên' && !item.adjustmentReason?.trim()) {
        setAdjustError(`Khoản "${item.description}" có đề xuất '${item.adjustmentProposal}' nhưng chưa nhập lý do cụ thể.`);
        return;
      }
    }

    const res = adjustSettlementDeductionsQTC02({
      slipId: selectedSlip.id,
      updatedDeductions: tempAdjustDeductions,
      adjustReason: adjustReason.trim()
    });

    if (res.success) {
      setShowAdjustModal(false);
      alert(toUserMessage(res.message));
    } else {
      setAdjustError(res.message);
    }
  };

  // -------------------------------------------------------------
  // UC-QTC-02: Dispute / Reopen / Cancel actions
  // -------------------------------------------------------------
  const handleLockDisputeQTC02 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlip) return;
    if (!disputeReasonInput.trim()) {
      alert('Bắt buộc nhập lý do tranh chấp.');
      return;
    }
    const res = lockDisputeSettlementQTC02({
      slipId: selectedSlip.id,
      disputeReason: disputeReasonInput.trim(),
      disputeItems: disputeItemsInput.trim() || 'Các khoản khấu trừ chưa thống nhất',
      disputeBasis: disputeBasisInput.trim() || 'Hồ sơ bàn giao và đối chiếu'
    });
    if (res.success) {
      setShowDisputeModal(false);
      alert(toUserMessage(res.message));
    } else {
      alert(toUserMessage(res.message));
    }
  };

  const handleReopenDisputeQTC02 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlip) return;
    if (!reopenReasonInput.trim()) {
      alert('Bắt buộc nhập lý do mở lại phiếu tranh chấp.');
      return;
    }
    const res = reopenDisputedSettlementQTC02({
      slipId: selectedSlip.id,
      reopenReason: reopenReasonInput.trim()
    });
    if (res.success) {
      setShowReopenModal(false);
      alert(toUserMessage(res.message));
    } else {
      alert(toUserMessage(res.message));
    }
  };

  const handleCancelSlipQTC02 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlip) return;
    if (!cancelReasonInput.trim()) {
      alert('Bắt buộc nhập lý do hủy phiếu quyết toán.');
      return;
    }
    const res = cancelSettlementSlipQTC02({
      slipId: selectedSlip.id,
      cancelReason: cancelReasonInput.trim()
    });
    if (res.success) {
      setShowCancelModal(false);
      alert(toUserMessage(res.message));
    } else {
      alert(toUserMessage(res.message));
    }
  };

  // -------------------------------------------------------------
  // UC-QTC-03: Open & Process Single Transfer Receipt (Bước 1 -> 6)
  // -------------------------------------------------------------
  const handleOpenQTC03Modal = () => {
    setQtc03Error(null);
    if (!selectedSlip) return;

    // Bước 1: Kiểm tra trạng thái phiếu
    if (selectedSlip.status !== 'Khách đồng ý') {
      alert(`Chặn (Bước 1): Phiếu đang ở trạng thái '${selectedSlip.status}', không thể ghi nhận kết quả quyết toán.\n\nĐiều kiện tiên quyết: Hai bên phải thống nhất phương án và phiếu ở trạng thái 'Khách đồng ý' với bằng chứng đồng ý đúng phiên bản v${selectedSlip.version}.`);
      return;
    }

    if (!selectedSlip.tenantAgreementEvidence || selectedSlip.tenantAgreementEvidence.schemeVersion !== selectedSlip.version) {
      alert(`Chặn: Thiếu bằng chứng khách đồng ý hợp lệ cho phiên bản hiện hành v${selectedSlip.version}. Vui lòng ghi nhận lại phản hồi khách thuê.`);
      return;
    }

    if (selectedSlip.reviewRequired || !selectedSlip.finalBillConfirmed || selectedSlip.calculationStatus !== 'Đã tính') {
      alert(`Chặn: Phiếu đang bị cắm cờ 'Cần rà soát' do bảng tính kỳ cuối hoặc nguồn công nợ đã thay đổi. Cần tính lại và khách đồng ý lại trước khi hoàn tất.`);
      return;
    }

    if (selectedSlip.step58Published) {
      alert('Phiếu đã ghi kết quả quyết toán cọc trước đó. Chế độ chỉ xem.');
      return;
    }

    // Pre-fill fields for single transfer receipt (Bước 2)
    // Chứng từ và tài khoản phải được nhập theo giao dịch thực tế.
    setReceiptBank('');
    setReceiptAccNumber('');
    setReceiptAccHolder('');
    setReceiptTxnCode('');
    setReceiptProofFile('');
    setReceiptDate('');
    setShowQTC03Modal(true);
  };

  useEffect(() => {
    if (initialMode === 'result' && selectedSlip?.id === initialSlipId) handleOpenQTC03Modal();
  }, [initialMode, initialSlipId, selectedSlip?.id]);

  const handleProceedToConfirmPopupQTC03 = (e: React.FormEvent) => {
    e.preventDefault();
    setQtc03Error(null);
    if (!selectedSlip) return;

    // Validate if transfer amount required
    if (selectedSlip.calculatedResult !== 0) {
      if (!receiptBank.trim() || !receiptAccNumber.trim() || !receiptAccHolder.trim() || !receiptTxnCode.trim() || !receiptDate.trim() || !receiptProofFile.trim()) {
        setQtc03Error('Vui lòng nhập đủ ngân hàng, số tài khoản, chủ tài khoản, mã giao dịch, ngày chuyển và chứng từ chuyển khoản thực tế.');
        return;
      }
      if (selectedSlip.calculatedResult > 0 && activeBankAccount && receiptAccNumber.trim() === activeBankAccount.accountNumber) {
        setQtc03Error('Khoản hoàn cọc phải chuyển vào tài khoản khách thuê đã xác minh, không dùng tài khoản nhận tiền của Chủ nhà.');
        return;
      }
    }

    setShowConfirmQTC03Popup(true);
  };

  const handleFinalConfirmQTC03 = () => {
    if (!selectedSlip) return;

    const mustTransferAmount = Math.abs(selectedSlip.calculatedResult);

    const receiptData = selectedSlip.calculatedResult === 0 ? undefined: {
      receiptType: selectedSlip.calculatedResult > 0 ? ('Hoàn cọc' as const): ('Thu thêm' as const),
      amount: mustTransferAmount,
      bankName: receiptBank.trim(),
      accountNumber: receiptAccNumber.trim(),
      accountHolder: receiptAccHolder.trim(),
      transferDate: receiptDate,
      transactionCode: receiptTxnCode.trim(),
      evidenceFile: receiptProofFile,
      verifiedBy: currentUser?.fullName || 'Nguyễn Văn An (Chủ nhà)',
      confirmedAt: new Date().toISOString()
    };

    const res = confirmSettlementTransferReceiptQTC03({
      slipId: selectedSlip.id,
      receipt: receiptData
    });

    if (res.success) {
      setShowConfirmQTC03Popup(false);
      setShowQTC03Modal(false);
      alert(toUserMessage(res.message));
    } else {
      setQtc03Error(res.message);
      setShowConfirmQTC03Popup(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* 1. Header with Process Reference & Actions */}
      {/* ======================================================== */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            
            <h1 className="text-lg font-bold text-slate-900">
              Quyết toán cọc </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-4xl">
            Tra cứu phiếu, điều chỉnh khoản trừ và ghi nhận kết quả từ đúng hồ sơ hợp đồng và lần thuê. </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            disabled={eligibleRooms.length === 0}
            onClick={() => handleOpenCreateModal()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            Lập quyết toán cọc </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. Top Metric Cards / Workflow Stages */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        <div
          onClick={() => setStatusFilter('all')}
          className={`p-3 rounded-xl border cursor-pointer transition-all text-xs space-y-1 ${statusFilter === 'all' ? 'border-blue-500 bg-blue-50/40 shadow-sm': 'border-slate-200 bg-white hover:border-slate-300'}`}
        >
          <div className="text-slate-500 font-medium">Tất cả hồ sơ</div>
          <div className="text-xl font-bold font-mono text-slate-900">{filteredSlips.length}</div>
          <div className="text-[11px] text-slate-400">Toàn bộ phiếu quyết toán</div>
        </div>

        <div
          onClick={() => setStatusFilter('pending')}
          className={`p-3 rounded-xl border cursor-pointer transition-all text-xs space-y-1 ${statusFilter === 'pending' ? 'border-amber-500 bg-amber-50/40 shadow-sm': 'border-slate-200 bg-white hover:border-slate-300'}`}
        >
          <div className="text-amber-800 font-medium">Đang trao đổi</div>
          <div className="text-xl font-bold font-mono text-amber-700">
            {settlementSlips.filter(s => ['Đang lập', 'Không đồng ý', 'Không liên hệ được'].includes(s.status)).length}
          </div>
          <div className="text-[11px] text-amber-600">Đang lập / Không đồng ý</div>
        </div>

        <div
          onClick={() => setStatusFilter('agreed')}
          className={`p-3 rounded-xl border cursor-pointer transition-all text-xs space-y-1 ${statusFilter === 'agreed' ? 'border-emerald-500 bg-emerald-50/40 shadow-sm': 'border-slate-200 bg-white hover:border-slate-300'}`}
        >
          <div className="text-emerald-800 font-medium">Khách đồng ý</div>
          <div className="text-xl font-bold font-mono text-emerald-700">
            {settlementSlips.filter(s => s.status === 'Khách đồng ý').length}
          </div>
          <div className="text-[11px] text-emerald-600">Sẵn sàng ghi nhận QTC-03</div>
        </div>

        <div
          onClick={() => setStatusFilter('dispute')}
          className={`p-3 rounded-xl border cursor-pointer transition-all text-xs space-y-1 ${statusFilter === 'dispute' ? 'border-red-500 bg-red-50/40 shadow-sm': 'border-slate-200 bg-white hover:border-slate-300'}`}
        >
          <div className="text-red-800 font-medium">Tranh chấp</div>
          <div className="text-xl font-bold font-mono text-red-700">
            {settlementSlips.filter(s => s.status === 'Tranh chấp').length}
          </div>
          <div className="text-[11px] text-red-600">Khóa sửa / Chờ mở lại</div>
        </div>

        <div
          onClick={() => setStatusFilter('published')}
          className={`p-3 rounded-xl border cursor-pointer transition-all text-xs space-y-1 ${statusFilter === 'published' ? 'border-indigo-500 bg-indigo-50/40 shadow-sm': 'border-slate-200 bg-white hover:border-slate-300'}`}
        >
          <div className="text-indigo-800 font-medium">Đã có quyết toán cọc (Chờ )</div>
          <div className="text-xl font-bold font-mono text-indigo-700">
            {settlementSlips.filter(s => terminalSettlementStatuses.includes(s.status)).length}
          </div>
          <div className="text-[11px] text-indigo-600">Đã phát hành kết quả</div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. Main Master-Detail Workspace */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Filter & Slip List (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Danh sách phiếu ({filteredSlips.length}) </span>
            <span className="text-[11px] text-slate-400 font-mono">Phiếu quyết toán</span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Tìm theo phòng, mã phiếu, lần thuê..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <select aria-label="Lọc trạng thái phiếu quyết toán" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white">
            <option value="all">Tất cả trạng thái</option>
            <option value="Đang lập">Đang lập</option>
            <option value="Không đồng ý">Không đồng ý</option>
            <option value="Khách đồng ý">Khách đồng ý</option>
            <option value="Không liên hệ được">Không liên hệ được</option>
            <option value="Tranh chấp">Tranh chấp</option>
            <option value="Hoàn tất">Hoàn tất</option>
            <option value="Đã hủy">Đã hủy</option>
          </select>
          {/* Slips Cards */}
          <div className="space-y-2 max-h-[680px] overflow-y-auto pr-1">
            {filteredSlips.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                <Scale className="w-8 h-8 text-slate-300 mx-auto" />
                <p>Không có phiếu quyết toán nào phù hợp bộ lọc.</p>
              </div>
            ): (
              filteredSlips.map((slip) => {
                const isSelected = selectedSlip?.id === slip.id;
                const isRefund = slip.calculatedResult > 0;
                const isDebt = slip.calculatedResult < 0;

                return (
                  <div
                    key={slip.id}
                    onClick={() => { setSelectedSlipId(slip.id); setIsEditMode(false); }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer text-xs space-y-2 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-1 ring-blue-500/20': 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-900">{slip.id}</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[10px] text-slate-700 font-bold">
                          {slip.roomCode}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        terminalSettlementStatuses.includes(slip.status)
                          ? 'bg-indigo-100 text-indigo-800': slip.status === 'Khách đồng ý'
                          ? 'bg-emerald-100 text-emerald-800': slip.status === 'Tranh chấp'
                          ? 'bg-red-100 text-red-800': slip.status === 'Không liên hệ được'
                          ? 'bg-purple-100 text-purple-800': slip.status === 'Không đồng ý'
                          ? 'bg-rose-100 text-rose-800': slip.status === 'Đã hủy'
                          ? 'bg-slate-200 text-slate-600': 'bg-amber-100 text-amber-800'
                      }`}>
                        {slip.status}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-slate-600">
                      <span>Lần thuê: <strong className="font-mono">{slip.leaseId}</strong></span>
                      <span className="text-slate-400">Trả: {slip.handoverReturnDate}</span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500">
                        Phương án (v{slip.version}): </span>
                      <strong className={`font-mono font-bold ${isRefund ? 'text-emerald-700': isDebt ? 'text-red-700': 'text-slate-700'}`}>
                        {isRefund
                          ? `Hoàn: +${slip.calculatedResult.toLocaleString('vi-VN')} đ`: isDebt
                          ? `Thu thêm: ${slip.calculatedResult.toLocaleString('vi-VN')} đ`: 'Đối trừ hết (0 đ)'}
                      </strong>
                    </div>

                    {slip.reviewRequired && (
                      <div className="p-1.5 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-800 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        Cần rà soát phiên bản </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed Slip View & Operational Actions (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          {selectedSlip && filteredSlips.some(s => s.id === selectedSlip.id) ? (
            <div className="space-y-6 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                {initialMode === 'list' && selectedSlip && (canEditSettlement(selectedSlip) || selectedSlip.status === 'Tranh chấp') && <button onClick={()=>setIsEditMode(true)} className="rounded-lg bg-blue-600 text-white px-3 py-2 font-semibold">Sửa phiếu</button>}
                {initialMode === 'list' && canRecordSettlement(selectedSlip) && <button onClick={handleOpenQTC03Modal} className="rounded-lg bg-emerald-600 text-white px-3 py-2 font-semibold">Ghi nhận kết quả quyết toán</button>}
                {isEditMode && <button onClick={()=>setIsEditMode(false)} className="rounded-lg border px-3 py-2">Kết thúc sửa</button>}
              </div>
              {isEditMode && (canEditSettlement(selectedSlip) || selectedSlip.status === 'Tranh chấp') && (
                <div className="border rounded-xl p-4 space-y-3 bg-blue-50/50">
                  <div className="font-bold text-sm">Sửa quyết toán cọc · {selectedSlip.id}</div>
                  <div className="flex flex-wrap gap-2">
                    {canEditSettlement(selectedSlip) && <button onClick={handleOpenAdjustModal} className="rounded-lg border bg-white px-3 py-2">Điều chỉnh khoản khấu trừ</button>}
                    {canEditSettlement(selectedSlip) && <button onClick={()=>{setFeedbackResult('Chưa phản hồi');setAgreementProofFile('');setAgreementProofNote('');setContactContent('');setContactPerson('');setFeedbackError(null);setShowFeedbackModal(true);}} className="rounded-lg border bg-white px-3 py-2">Ghi nhận phản hồi</button>}
                    {canEditSettlement(selectedSlip) && !selectedSlip.transferReceipt && <button onClick={()=>{setCancelReasonInput('');setShowCancelModal(true);}} className="rounded-lg border bg-white px-3 py-2">Hủy phiếu</button>}
                    {canEditSettlement(selectedSlip) && <button onClick={()=>{setDisputeReasonInput('');setDisputeItemsInput('');setDisputeBasisInput('');setShowDisputeModal(true);}} className="rounded-lg border bg-white px-3 py-2">Xác lập tranh chấp</button>}
                    {selectedSlip.status === 'Tranh chấp' && <button onClick={()=>{setReopenReasonInput('');setShowReopenModal(true);}} className="rounded-lg border bg-white px-3 py-2">Mở lại phiếu tranh chấp</button>}
                  </div>
                </div>
              )}
              {/* Slip Header Banner */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl font-bold font-mono text-slate-900">{selectedSlip.id}</h2>
                    <span className="px-2.5 py-0.5 rounded-lg bg-blue-100 text-blue-900 font-bold font-mono">
                      Phòng {selectedSlip.roomCode}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono font-medium">
                      Phiên bản v{selectedSlip.version}
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px] mt-1 space-x-2">
                    <span>Lần thuê: <strong className="font-mono text-slate-800">{selectedSlip.leaseId}</strong></span>
                    <span>•</span>
                    <span>Ngày nhận lại phòng: <strong className="font-mono text-slate-800">{selectedSlip.handoverReturnDate}</strong></span>
                    <span>•</span>
                    <span>Mã cọc gốc: <strong className="font-mono text-blue-700">{selectedSlip.initialDepositCode}</strong></span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className={`px-3 py-1 rounded-lg font-bold text-xs ${
                    terminalSettlementStatuses.includes(selectedSlip.status)
                      ? 'bg-indigo-100 text-indigo-800': selectedSlip.status === 'Khách đồng ý'
                      ? 'bg-emerald-100 text-emerald-800': selectedSlip.status === 'Tranh chấp'
                      ? 'bg-red-100 text-red-800': selectedSlip.status === 'Không liên hệ được'
                      ? 'bg-purple-100 text-purple-800': selectedSlip.status === 'Không đồng ý'
                      ? 'bg-rose-100 text-rose-800': selectedSlip.status === 'Đã hủy'
                      ? 'bg-slate-200 text-slate-600': 'bg-amber-100 text-amber-800'
                  }`}>
                    {selectedSlip.status}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Cập nhật: {new Date(selectedSlip.updatedAt).toLocaleString('vi-VN')}
                  </span>
                </div>
              </div>

              {/* Status Warning Banners */}
              {terminalSettlementStatuses.includes(selectedSlip.status) && selectedSlip.status !== 'Hoàn tất' && (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-start gap-2.5 text-indigo-900">
                  <FileCheck className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                  <div className="space-y-0.5 text-xs">
                    <div className="font-bold">Đã phát hành kết quả quyết toán cọc – Phiếu đã khóa</div>
                    <p className="text-[11px] text-indigo-700">
                      Mã kết quả: <strong>{selectedSlip.step58ResultCode || 'KQ58-' + selectedSlip.roomCode}</strong>. Đã đồng bộ sang biên bản bàn giao trả phòng và hoàn tất một chứng từ chuyển khoản duy nhất. Chế độ chỉ xem. </p>
                  </div>
                </div>
              )}

              {selectedSlip.status === 'Tranh chấp' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start justify-between gap-3 text-red-900">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                    <div className="space-y-0.5 text-xs">
                      <div className="font-bold">Hồ sơ đang Tranh chấp – Khóa sửa trực tiếp</div>
                      <p className="text-[11px] text-red-700">
                        Lý do: <strong>{selectedSlip.disputeReason}</strong>
                        {selectedSlip.disputeItems && <> • Khoản liên quan: <strong>{selectedSlip.disputeItems}</strong></>}
                      </p>
                    </div>
                  </div>

                  {isEditMode && <button
                    onClick={() => {
                      setReopenReasonInput('');
                      setShowReopenModal(true);
                    }}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shrink-0 cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Mở lại phiếu </button>}
                </div>
              )}

              {selectedSlip.reviewRequired && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div className="space-y-0.5 text-xs">
                    <div className="font-bold">Cần rà soát lại phương án</div>
                    <p className="text-[11px] text-amber-700">
                      Bảng tính kỳ cuối hoặc công nợ nguồn đã thay đổi. Nút Ghi nhận kết quả (QTC-03) bị khóa cho đến khi User tính lại và khách đồng ý lại đúng phiên bản mới. </p>
                  </div>
                </div>
              )}

              {/* SECTION 1: Chuỗi thuê liên tục & Cọc gốc */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    1. Xác định khoản cọc gốc trong chuỗi thuê liên tục </span>
                  <span className="font-mono text-xs font-bold text-blue-700">
                    {selectedSlip.initialDepositAmount.toLocaleString('vi-VN')} đ </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <div className="text-slate-500">Hợp đồng đầu tiên:</div>
                    <div className="font-mono font-bold text-slate-800">{selectedSlip.initialContractId}</div>
                    <div className="text-[10px] text-slate-400">Xác lập khoản cọc gốc tại </div>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <div className="text-slate-500">Chuỗi hợp đồng kế thừa:</div>
                    <div className="font-mono font-semibold text-slate-800">
                      {selectedSlip.contractChain?.length ? selectedSlip.contractChain.join(' → '): selectedSlip.initialContractId}
                    </div>
                    <div className="text-[10px] text-emerald-600 font-semibold">Cọc không cộng dồn khi gia hạn</div>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <div className="text-slate-500">Tiền thuê đã trả trước (đối chiếu):</div>
                    <div className="font-mono font-bold text-slate-800">
                      {(selectedSlip.prepaidRentAmount || selectedSlip.initialDepositAmount).toLocaleString('vi-VN')} đ </div>
                    <div className="text-[10px] text-amber-700 font-semibold">Không hoàn tiền ngày chưa ở</div>
                  </div>
                </div>

                {/* Warning note for mid-month departure */}
                <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg text-[11px] text-blue-900 flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Lưu ý:</strong> Khách trả phòng giữa kỳ đã trả tiền thuê trước: không hoàn tiền thuê cho phần ngày chưa ở và không đưa phần này vào quyết toán cọc. Hệ thống không tự tạo tiền thuê tháng tiếp theo. </div>
                </div>
              </div>

              {/* SECTION 2: Bảng chi tiết khấu trừ có căn cứ */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-xs">
                    2. Tổng hợp các khoản khấu trừ có căn cứ (Phiên bản v{selectedSlip.version}) </span>
                  <span className="font-mono text-xs font-bold text-red-600">
                    - {selectedSlip.deductions.reduce((s, d) => s + d.amount, 0).toLocaleString('vi-VN')} đ </span>
                </div>

                {selectedSlip.deductions.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-lg border border-dashed border-slate-300 text-center text-slate-500 text-xs">
                    Không phát sinh khoản khấu trừ nào. Kết quả dự kiến hoàn toàn bộ cọc gốc. </div>
                ): (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                        <tr>
                          <th className="p-2.5">Khoản mục</th>
                          <th className="p-2.5">Phân loại</th>
                          <th className="p-2.5">Căn cứ / Lý do</th>
                          <th className="p-2.5 text-right">Số tiền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedSlip.deductions.map((d) => (
                          <tr key={d.id} className="hover:bg-slate-50/50">
                            <td className="p-2.5 font-medium text-slate-900">
                              {d.description}
                              {d.clauseRef && (
                                <div className="text-[10px] text-blue-700 font-mono">
                                  Điều khoản: {d.clauseRef}
                                </div>
                              )}
                            </td>
                            <td className="p-2.5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                                {d.category}
                              </span>
                            </td>
                            <td className="p-2.5 text-[11px] text-slate-600 max-w-xs">
                              {d.reason || d.evidence || '—'}
                            </td>
                            <td className="p-2.5 text-right font-mono font-bold text-red-600">
                              -{d.amount.toLocaleString('vi-VN')} đ </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                        <tr>
                          <td colSpan={3} className="p-2.5 text-slate-700 text-right">Tổng khấu trừ:</td>
                          <td className="p-2.5 text-right font-mono text-red-700">
                            -{selectedSlip.deductions.reduce((s, d) => s + d.amount, 0).toLocaleString('vi-VN')} đ </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                {/* Calculated Result Breakdown (Bước 6) */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">
                      Kết quả quyết toán cọc: </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Cọc gốc ({selectedSlip.initialDepositAmount.toLocaleString('vi-VN')} đ) − Tổng khấu trừ ({selectedSlip.deductions.reduce((s, d) => s + d.amount, 0).toLocaleString('vi-VN')} đ) </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-base font-bold font-mono px-3 py-1 rounded-lg ${
                      selectedSlip.calculatedResult > 0
                        ? 'bg-emerald-100 text-emerald-800': selectedSlip.calculatedResult < 0
                        ? 'bg-red-100 text-red-800': 'bg-slate-200 text-slate-800'
                    }`}>
                      {selectedSlip.calculationStatus !== 'Đã tính' ? 'Chưa đủ căn cứ tính kết quả' : selectedSlip.calculatedResult > 0
                        ? `Hoàn cọc: +${selectedSlip.calculatedResult.toLocaleString('vi-VN')} đ`: selectedSlip.calculatedResult < 0
                        ? `Thu thêm: ${selectedSlip.calculatedResult.toLocaleString('vi-VN')} đ`: 'Đối trừ hết (0 đ)'}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {selectedSlip.calculatedResult > 0
                        ? 'Chủ nhà sẽ hoàn 1 lần vào tài khoản khách thuê': selectedSlip.calculatedResult < 0
                        ? 'Khách nộp thêm 1 lần vào tài khoản chủ nhà': 'Không phát sinh giao dịch chuyển khoản'}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: Bằng chứng thống nhất & Lịch sử trao đổi  */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-xs flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    3. Phản hồi khách & Lịch sử liên hệ </span>

                  {false && isEditMode && canEditSettlement(selectedSlip) && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleOpenAdjustModal}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1"
                      >
                        <Scale className="w-3.5 h-3.5 text-blue-600" />
                        Điều chỉnh khoản trừ </button>

                      <button
                        onClick={() => {
                          setFeedbackResult(selectedSlip.tenantFeedback === 'Không đồng ý' ? 'Không đồng ý': 'Đồng ý');
                          setContactContent('');
                          setContactPerson('Khách thuê phòng ' + selectedSlip.roomCode);
                          setFeedbackError(null);
                          setShowFeedbackModal(true);
                        }}
                        className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1 shadow-sm"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Ghi nhận phản hồi </button>
                    </div>
                  )}
                </div>

                {/* Current Agreement Evidence Status */}
                {selectedSlip.tenantAgreementEvidence ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 space-y-1">
                    <div className="flex items-center justify-between font-bold text-xs">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Bằng chứng khách đồng ý hợp lệ (Phiên bản v{selectedSlip.tenantAgreementEvidence.schemeVersion}) </span>
                      <span className="font-mono text-emerald-700 font-bold">
                        Số tiền: {selectedSlip.tenantAgreementEvidence.agreedAmount.toLocaleString('vi-VN')} đ </span>
                    </div>
                    <div className="text-[11px] text-emerald-800">
                      File: <strong className="font-mono">{selectedSlip.tenantAgreementEvidence.evidenceFile}</strong> • Ghi chú: {selectedSlip.tenantAgreementEvidence.evidenceNote}
                    </div>
                  </div>
                ): (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      Chưa có bằng chứng khách đồng ý cho phiên bản hiện tại v{selectedSlip.version}. {selectedSlip.status === 'Không liên hệ được' && ' (Trạng thái: Không liên hệ được - Khóa xác nhận quyết toán cọc theo ).'}
                    </span>
                  </div>
                )}

                {/* Contact Logs Table */}
                {selectedSlip.contactLogs && selectedSlip.contactLogs.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-semibold text-slate-700">Nhật ký các lần liên hệ:</div>
                    <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg bg-white overflow-hidden">
                      {selectedSlip.contactLogs.map((log) => (
                        <div key={log.id} className="p-2.5 text-[11px] flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="font-semibold text-slate-900 flex items-center gap-2">
                              <span>{log.contactTime}</span>
                              <span className="px-1.5 py-0.2 rounded bg-slate-100 font-mono text-[10px] text-slate-700">
                                {log.channel}
                              </span>
                              <span>• {log.contactPerson}</span>
                            </div>
                            <div className="text-slate-600">{log.content}</div>
                            {log.evidence && (
                              <div className="text-[10px] text-blue-600 flex items-center gap-1 font-mono">
                                <Paperclip className="w-3 h-3" />
                                Bằng chứng: {log.evidence}
                              </div>
                            )}
                          </div>

                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                            log.result === 'Đồng ý'
                              ? 'bg-emerald-100 text-emerald-800': log.result === 'Không đồng ý'
                              ? 'bg-rose-100 text-rose-800': 'bg-slate-100 text-slate-700'
                          }`}>
                            {log.result} (v{log.schemeVersion}) </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* BG07 opinion notice */}
                <div className="p-2 bg-slate-100 rounded-lg text-[10px] text-slate-500 italic">
                  * Ghi chú Lưu ý: Ý kiến về hiện trạng tài sản từ chỉ để tra cứu, không suy ra khách đã đồng ý số tiền quyết toán cọc. </div>
              </div>

              {/* SECTION 4: Kết quả quyết toán cọc & Chứng từ chuyển khoản duy nhất  */}
              <div className="p-4 bg-blue-50/40 border border-blue-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-900 uppercase tracking-wider text-xs flex items-center gap-1.5">
                    <Landmark className="w-4 h-4 text-blue-600" />
                    4. Ghi nhận kết quả quyết toán & Chứng từ chuyển khoản </span>

                  {selectedSlip.step58Published ? (
                    <span className="px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Đã phát hành kết quả quyết toán cọc </span>
                  ): (
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-xs">
                      Chưa phát hành quyết toán cọc </span>
                  )}
                </div>

                {selectedSlip.transferReceipt ? (
                  <div className="p-3 bg-white rounded-lg border border-blue-200 space-y-2 text-xs">
                    <div className="font-bold text-slate-900 flex items-center justify-between">
                      <span>MỘT chứng từ chuyển khoản duy nhất:</span>
                      <span className="font-mono text-blue-700 text-sm font-bold">
                        {selectedSlip.transferReceipt.amount.toLocaleString('vi-VN')} đ </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-700">
                      <div>Loại: <strong>{selectedSlip.transferReceipt.receiptType}</strong></div>
                      <div>Ngân hàng: <strong>{selectedSlip.transferReceipt.bankName}</strong></div>
                      <div>Số tài khoản: <strong className="font-mono">{selectedSlip.transferReceipt.accountNumber}</strong></div>
                      <div>Chủ tài khoản: <strong>{selectedSlip.transferReceipt.accountHolder}</strong></div>
                      <div>Mã GD: <strong className="font-mono">{selectedSlip.transferReceipt.transactionCode}</strong></div>
                      <div>Ngày chuyển: <strong className="font-mono">{selectedSlip.transferReceipt.transferDate}</strong></div>
                      <div>Người xác nhận: <strong>{selectedSlip.transferReceipt.verifiedBy}</strong></div>
                      <div>File chứng từ: <strong className="font-mono">{selectedSlip.transferReceipt.evidenceFile || 'Không đính kèm'}</strong></div>
                    </div>
                  </div>
                ): selectedSlip.calculatedResult === 0 && selectedSlip.step58Published ? (
                  <div className="p-3 bg-white rounded-lg border border-blue-200 text-xs text-slate-700">
                    Đối trừ vừa hết (0 đ) theo quy định,. Khoản nợ được bù đủ bằng cọc gốc, không phát sinh chuyển khoản. </div>
                ): (
                  <div className="text-[11px] text-slate-600 space-y-1">
                    <p>
                      Việc hoàn cọc hoặc thu thêm phải hoàn tất trong <strong>MỘT lần chuyển khoản duy nhất</strong> bằng đúng số tiền <strong className="font-mono text-blue-700"> {Math.abs(selectedSlip.calculatedResult).toLocaleString('vi-VN')} đ</strong>. Không cho phép chia nhiều lần, không thu/hoàn một phần. </p>
                    {selectedSlip.calculatedResult > 0 && (
                      <p className="text-amber-800 font-medium">
                        * Khoản hoàn cọc bắt buộc chuyển vào tài khoản ngân hàng của KHÁCH thuê được xác minh, không chuyển tài khoản chủ nhà. </p>
                    )}
                  </div>
                )}
              </div>

              {/* Audit history retained internally; not displayed in the landlord-facing UI. */}
              {false && selectedSlip.auditHistory && selectedSlip.auditHistory.length > 0 && (
                <div className="border-t border-slate-200 pt-3 space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <History className="w-3.5 h-3.5 text-slate-400" />
                    Nhật ký kiểm toán hồ sơ quyết toán: </div>
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {selectedSlip.auditHistory.map((h, idx) => (
                      <div key={idx} className="text-[10px] text-slate-500 flex items-start gap-2">
                        <span className="font-mono text-slate-400 shrink-0">{h.timestamp?.slice(0, 16)}</span>
                        <span><strong>{h.user}:</strong> {h.action} {h.note ? `— ${h.note}`: ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Toolbar Bottom */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  {/* Cancel slip button */}
                  {false && isEditMode && canEditSettlement(selectedSlip) && (
                    <button
                      onClick={() => {
                        setCancelReasonInput('');
                        setShowCancelModal(true);
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1"
                    >
                      <Ban className="w-3.5 h-3.5 text-slate-500" />
                      Hủy phiếu </button>
                  )}

                  {/* Lock dispute button */}
                  {false && isEditMode && canEditSettlement(selectedSlip) && (
                    <button
                      onClick={() => {
                        setDisputeReasonInput('');
                        setDisputeItemsInput('');
                        setDisputeBasisInput('');
                        setShowDisputeModal(true);
                      }}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                      Chưa thống nhất / Tranh chấp </button>
                  )}
                </div>

                {/* Main QTC-03 Action Button */}
                <div className="flex items-center gap-2">
                  {false && selectedSlip.status === 'Khách đồng ý' && !selectedSlip.step58Published && (
                    <button
                      onClick={handleOpenQTC03Modal}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Ghi nhận kết quả quyết toán </button>
                  )}
                </div>
              </div>
            </div>
          ): (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <Scale className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold">Chọn một phiếu quyết toán ở cột bên trái để xem chi tiết.</p>
              <p className="text-xs">Hoặc nhấn "Lập quyết toán cọc" ở góc trên để tạo phiếu mới cho phòng đã nhận lại.</p>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: UC-QTC-01 Lập quyết toán cọc                    */}
      {/* ======================================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 text-xs my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Lập phiếu quyết toán cọc</h3>
                <p className="text-slate-500 text-[11px]">
                  Lấy cọc gốc từ hợp đồng đầu tiên trong chuỗi thuê liên tục, tổng hợp khấu trừ từ &. </p>
              </div>
              <button type="button" onClick={handleCloseCreateModal} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step 1: Select Eligible Room */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-800">
                1. Chọn phòng đủ điều kiện (Đã nhận lại thực tế tại /xác nhận của chủ nhà): </label>
              <select
                value={createSelectedRoom}
                onChange={(e) => setCreateSelectedRoom(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-xs bg-white focus:ring-1 focus:ring-blue-500"
              >
                {eligibleRooms.map(r => (
                  <option key={r.id} value={r.roomCode}>
                    Phòng {r.roomCode} (Nhận lại ngày: {r.inspectionDate} - {r.step305Confirmed ? 'Đã xác nhận xác nhận của chủ nhà': ''}) </option>
                ))}
              </select>
            </div>

            {roomCandidateData && (
              <div className="space-y-3.5">
                {/* Step 2 & 3: Consecutive Contract Chain & Deposit Details */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-[11px]">
                  <div className="flex justify-between items-center font-bold text-slate-900">
                    <span>Chuỗi hợp đồng thuê & Khoản cọc gốc:</span>
                    <span className="font-mono text-blue-700 text-xs">
                      {roomCandidateData.depositAmount.toLocaleString('vi-VN')} đ </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-600">
                    <div>Mã lần thuê: <strong className="font-mono text-slate-800">{roomCandidateData.leaseId}</strong></div>
                    <div>Hợp đồng đầu: <strong className="font-mono text-slate-800">{roomCandidateData.firstContract?.id}</strong></div>
                    <div>Mã cọc gốc: <strong className="font-mono text-blue-700">{roomCandidateData.depositCode}</strong></div>
                    <div>Ngày nhận lại phòng: <strong className="font-mono text-slate-800">{roomCandidateData.actualReturnDate}</strong></div>
                  </div>
                  {roomCandidateData.chainContracts.length > 1 && (
                    <div className="p-2 bg-emerald-50 rounded border border-emerald-200 text-emerald-800">
                      <strong>Lưu ý:</strong> Chuỗi có {roomCandidateData.chainContracts.length} hợp đồng gia hạn ({roomCandidateData.chainContracts.map(c => c.id).join(' → ')}). Hệ thống lấy đúng 1 khoản cọc gốc ban đầu, không cộng dồn cọc của hợp đồng gia hạn. </div>
                  )}
                </div>

                {/* Step 4: Final Period Bill Status */}
                <div className={`p-3 rounded-xl border text-[11px] space-y-1.5 ${
                  roomCandidateData.isFinalBillConfirmed
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900': 'bg-amber-50 border-amber-200 text-amber-900'
                }`}>
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5">
                      {roomCandidateData.isFinalBillConfirmed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ): (
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                      )}
                      Kiểm tra bảng tính tiền kỳ cuối: </span>
                    <span className="font-mono">
                      {roomCandidateData.finalBill ? roomCandidateData.finalBill.periodCode: 'Chưa lập kỳ cuối'}
                    </span>
                  </div>

                  {roomCandidateData.isFinalBillConfirmed ? (
                    <p className="text-emerald-800">
                      Đã có bảng tính kỳ cuối Đã xác nhận từ. Điện nước đến ngày nhận lại: {(roomCandidateData.finalBill?.electricityAmount || 0) + (roomCandidateData.finalBill?.waterAmount || 0)} đ, phí dịch vụ cố định thu đủ cả kỳ: {roomCandidateData.finalBill?.serviceFees?.reduce((s, f) => s + f.amount, 0) || 0} đ. </p>
                  ): (
                    <p className="text-amber-800 font-medium">
                      Cảnh báo: Chưa có bảng tính kỳ cuối Đã xác nhận từ! Nếu lập phiếu lúc này, hệ thống sẽ giữ phiếu ở trạng thái Đang lập, chưa kết luận số tiền hoàn cho đến khi được xác nhận. </p>
                  )}
                </div>

                {/* Step 5: Early termination penalty input */}
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between font-bold text-slate-800 text-xs">
                    <span>Khoản trừ theo điều khoản hợp đồng khi kết thúc trước hạn:</span>
                    <span className="text-[10px] text-slate-400 font-normal">Không bắt buộc nếu đúng hạn</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <label className="block text-slate-600 font-medium mb-0.5">Điều khoản áp dụng (bắt buộc):</label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Điều 6.2 HĐTHUE - Trả trước hạn"
                        value={earlyTerminationClause}
                        onChange={(e) => setEarlyTerminationClause(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium mb-0.5">Số tiền trừ phạt (VNĐ):</label>
                      <input
                        type="number" min="0" step="1"
                        placeholder="0"
                        value={earlyTerminationAmount || ''}
                        onChange={(e) => setEarlyTerminationAmount(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs font-mono font-bold"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-slate-600 font-medium mb-0.5">Lý do & Căn cứ chứng cứ cụ thể (PND-02):</label>
                      <input
                        type="text"
                        placeholder="Ghi rõ thỏa thuận và lý do, không có lựa chọn mất cọc tự động..."
                        value={earlyTerminationReason}
                        onChange={(e) => setEarlyTerminationReason(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-0.5">Chứng cứ liên quan đến khoản khấu trừ</label>
                    <input type="text" value={earlyTerminationEvidence} onChange={e=>setEarlyTerminationEvidence(e.target.value)} placeholder="Tên chứng từ hoặc tham chiếu hồ sơ thực tế" className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"/>
                  </div>
                </div>

                {/* Deductions Summary Preview */}
                {calculationIsCurrent && <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center font-bold text-xs text-slate-900">
                    <span>Tổng khấu trừ tổng hợp được ({calculatedCreateItems.deductions.length} khoản):</span>
                    <span className="font-mono text-red-600 font-bold">
                      - {calculatedCreateItems.totalDeductions.toLocaleString('vi-VN')} đ </span>
                  </div>

                  <div className="divide-y divide-slate-200 text-[11px]">
                    {calculatedCreateItems.deductions.map(d => (
                      <div key={d.id} className="py-1 flex justify-between text-slate-600">
                        <span>{d.description}:</span>
                        <span className="font-mono text-red-600 font-semibold">-{d.amount.toLocaleString('vi-VN')} đ</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center font-bold text-xs">
                    <span className="text-slate-900">{roomCandidateData.isFinalBillConfirmed ? 'Kết quả dự kiến:' : 'Tạm tính (chưa đủ bảng tiền kỳ cuối):'}</span>
                    <span className={`font-mono text-sm ${
                      calculatedCreateItems.result > 0
                        ? 'text-emerald-700': calculatedCreateItems.result < 0
                        ? 'text-red-700': 'text-slate-800'
                    }`}>
                      {calculatedCreateItems.result > 0
                        ? `Hoàn cọc: +${calculatedCreateItems.result.toLocaleString('vi-VN')} đ`: calculatedCreateItems.result < 0
                        ? `Thu thêm: ${calculatedCreateItems.result.toLocaleString('vi-VN')} đ`: 'Đối trừ vừa hết (0 đ)'}
                    </span>
                  </div>
                </div>}

                {!calculationIsCurrent && <div className="p-3 text-xs text-slate-600 border rounded-lg">Chưa tính kết quả. Bấm <strong>Tính kết quả</strong> để xem số tiền dự kiến hoàn hoặc thu thêm.</div>}
                {/* Warning note for prepaid rent */}
                <div className="text-[11px] text-slate-500 italic">
                  * Hệ thống không tự tạo tiền thuê tháng tiếp theo, không hoàn tiền thuê còn lại của kỳ đã trả trước nếu khách trả giữa tháng. </div>
              </div>
            )}

            {createNoticeMsg && <div className="p-3 border rounded text-xs text-red-700 bg-red-50">{createNoticeMsg.text}</div>}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button type="button" onClick={handleCalculateQTC01} className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold">Tính kết quả</button>
              <button
                type="button"
                onClick={handleCloseCreateModal}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Hủy </button>
              <button
                type="button"
                onClick={handleSaveNewSlipQTC01}
                disabled={!calculationIsCurrent}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer"
              >
                Lưu </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: UC-QTC-02 Ghi nhận phản hồi & Lịch sử liên hệ   */}
      {/* ======================================================== */}
      {showFeedbackModal && selectedSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <form onSubmit={handleSaveFeedbackQTC02} className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Ghi nhận phản hồi khách thuê</h3>
                <p className="text-slate-500 text-[11px]">
                  Phiếu {selectedSlip.id} • Phương án phiên bản <strong>v{selectedSlip.version}</strong>
                </p>
              </div>
              <button type="button" onClick={() => setShowFeedbackModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {feedbackError && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                {feedbackError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Kênh liên hệ</label>
                <select
                  value={contactChannel}
                  onChange={(e) => setContactChannel(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  <option value="Zalo">Zalo</option>
                  <option value="Điện thoại">Điện thoại</option>
                  <option value="Trực tiếp">Trực tiếp</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Người liên hệ</label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="Khách thuê / Người đại diện"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Phản hồi của khách (cho phiên bản v{selectedSlip.version})</label>
              <select
                value={feedbackResult}
                onChange={(e) => setFeedbackResult(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold"
              >
                <option value="Đồng ý">Đồng ý (Khách thống nhất phương án hoàn/thu)</option>
                <option value="Không đồng ý">Không đồng ý (Có thắc mắc / đề nghị giảm trừ)</option>
                <option value="Chưa phản hồi">Chưa phản hồi (Đã gửi nhưng chưa có câu trả lời)</option>
                <option value="Không liên hệ được">Không liên hệ được (Sau ít nhất 2 lượt và 48h - )</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Nội dung trao đổi / Lý do chi tiết</label>
              <textarea
                value={contactContent}
                onChange={(e) => setContactContent(e.target.value)}
                rows={3}
                placeholder="Ghi nhận chi tiết nội dung cuộc gọi, tin nhắn Zalo hoặc trao đổi trực tiếp..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            {feedbackResult === 'Đồng ý' && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                <div className="font-bold text-emerald-900 text-xs">
                  Bằng chứng khách đồng ý: </div>
                <div>
                  <label className="block text-[11px] text-emerald-800 font-medium mb-0.5">Tên file ảnh / Chứng từ:</label>
                  <input
                    type="text"
                    value={agreementProofFile}
                    onChange={(e) => setAgreementProofFile(e.target.value)}
                    placeholder="zalo_dong_y_phuong_an.jpg"
                    className="w-full px-2.5 py-1.5 border border-emerald-300 rounded bg-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-emerald-800 font-medium mb-0.5">Ghi chú xác nhận số tiền:</label>
                  <input
                    type="text"
                    value={agreementProofNote}
                    onChange={(e) => setAgreementProofNote(e.target.value)}
                    placeholder="Khách đồng ý số tiền hoàn/thu..."
                    className="w-full px-2.5 py-1.5 border border-emerald-300 rounded bg-white text-xs"
                  />
                </div>
              </div>
            )}

            {feedbackResult === 'Không liên hệ được' && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-900 text-xs space-y-1">
                <div className="font-bold">Lưu ý kiểm tra </div>
                <p className="text-[11px] text-purple-800">
                  Không đồng nghĩa khách đồng ý; không có sự thống nhất với khách thì không được phát hành kết quả quyết toán cọc. Hệ thống sẽ khóa xác nhận quyết toán cọc theo. </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowFeedbackModal(false)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Hủy </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer"
              >
                Lưu phản hồi & Lịch sử </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: UC-QTC-02 Điều chỉnh khoản khấu trừ (Bước 4)    */}
      {/* ======================================================== */}
      {showAdjustModal && selectedSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <form onSubmit={handleSaveAdjustmentsQTC02} className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 text-xs my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Sửa phiếu quyết toán</h3>
                <p className="text-slate-500 text-[11px]">
                  Phiếu {selectedSlip.id} • Sau khi tính lại sẽ nâng lên phiên bản <strong>v{(selectedSlip.version || 1) + 1}</strong>. </p>
              </div>
              <button type="button" onClick={() => setShowAdjustModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {adjustError && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                {adjustError}
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Lý do tổng thể điều chỉnh phương án (Bắt buộc theo ): </label>
              <input
                type="text"
                placeholder="Ví dụ: Hai bên trao đổi, chủ nhà đồng ý hỗ trợ giảm 50% tiền hư hỏng tủ gỗ..."
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium"
              />
            </div>

            {/* Deductions Adjustment Table */}
            <div className="space-y-2">
              <label className="block font-bold text-slate-700">
                Danh sách khoản trừ và đề xuất điều chỉnh: </label>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                    <tr>
                      <th className="p-2">Khoản trừ</th>
                      <th className="p-2">Gốc</th>
                      <th className="p-2">Đề xuất</th>
                      <th className="p-2">Số tiền mới (đ)</th>
                      <th className="p-2">Lý do cụ thể</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tempAdjustDeductions.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="p-2 font-medium text-slate-800 max-w-[140px] truncate">
                          {item.description}
                        </td>
                        <td className="p-2 font-mono text-slate-500">
                          {(item.originalAmount || item.amount).toLocaleString('vi-VN')} đ </td>
                        <td className="p-2">
                          <select
                            value={item.adjustmentProposal || 'giữ nguyên'}
                            onChange={(e) => {
                              const proposal = e.target.value as 'giảm' | 'bỏ' | 'giữ nguyên';
                              setTempAdjustDeductions(prev => prev.map((d, i) => {
                                if (i !== idx) return d;
                                let newAmt = d.amount;
                                if (proposal === 'bỏ') newAmt = 0;
                                else if (proposal === 'giữ nguyên') newAmt = d.originalAmount || d.amount;
                                return {...d, adjustmentProposal: proposal, amount: newAmt };
                              }));
                            }}
                            className="px-2 py-1 border border-slate-300 rounded text-xs"
                          >
                            <option value="giữ nguyên">Giữ nguyên</option>
                            <option value="giảm">Giảm bớt</option>
                            <option value="bỏ">Bỏ khoản này (0 đ)</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            disabled={item.adjustmentProposal === 'bỏ' || item.adjustmentProposal === 'giữ nguyên'}
                            value={item.amount}
                            onChange={(e) => {
                              const val = Math.max(0, Number(e.target.value));
                              setTempAdjustDeductions(prev => prev.map((d, i) => i === idx ? {...d, amount: val }: d));
                            }}
                            className="w-24 px-2 py-1 border border-slate-300 rounded font-mono font-bold text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            placeholder="Lý do điều chỉnh..."
                            value={item.adjustmentReason || ''}
                            onChange={(e) => {
                              const r = e.target.value;
                              setTempAdjustDeductions(prev => prev.map((d, i) => i === idx ? {...d, adjustmentReason: r }: d));
                            }}
                            className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recalculation Preview */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between font-bold text-xs">
              <div>
                <span>Cọc gốc: {selectedSlip.initialDepositAmount.toLocaleString('vi-VN')} đ</span>
                <span className="text-slate-400 mx-2">−</span>
                <span className="text-red-600">
                  Tổng khấu trừ mới: {tempAdjustDeductions.reduce((s, d) => s + d.amount, 0).toLocaleString('vi-VN')} đ </span>
              </div>
              <div className="text-right">
                <span className="text-blue-700">
                  Kết quả mới: {(selectedSlip.initialDepositAmount - tempAdjustDeductions.reduce((s, d) => s + d.amount, 0)).toLocaleString('vi-VN')} đ </span>
              </div>
            </div>

            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800">
              <strong>Lưu ý </strong> Bằng chứng khách đồng ý cũ sẽ tự động bị hủy vì đã thay đổi số tiền. Sau khi lưu, bạn cần liên hệ lại khách để xác nhận phiên bản phương án mới v{(selectedSlip.version || 1) + 1}. </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowAdjustModal(false)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Hủy </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer"
              >
                Tính lại & Nâng phiên bản v{(selectedSlip.version || 1) + 1}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: Popup Tranh chấp                        */}
      {/* ======================================================== */}
      {showDisputeModal && selectedSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <form onSubmit={handleLockDisputeQTC02} className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-slate-900 text-base">Xác lập Tranh chấp</h3>
              </div>
              <button type="button" onClick={() => setShowDisputeModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-600 text-[11px]">
              Hai bên chưa thể thống nhất phương án quyết toán cọc. Hệ thống sẽ chuyển phiếu sang trạng thái <strong> Tranh chấp</strong> và khóa sửa trực tiếp. </p>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Lý do tranh chấp (Bắt buộc):</label>
              <textarea
                value={disputeReasonInput}
                onChange={(e) => setDisputeReasonInput(e.target.value)}
                rows={2}
                placeholder="Ghi rõ nội dung khách phản đối..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Khoản tiền / Hạng mục liên quan:</label>
              <input
                type="text"
                value={disputeItemsInput}
                onChange={(e) => setDisputeItemsInput(e.target.value)}
                placeholder="Ví dụ: Khoản bồi thường cửa kính 800.000đ"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Căn cứ giải quyết:</label>
              <input
                type="text"
                value={disputeBasisInput}
                onChange={(e) => setDisputeBasisInput(e.target.value)}
                placeholder="Biên bản bàn giao nhận phòng..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowDisputeModal(false)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Hủy </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer"
              >
                Xác nhận khóa Tranh chấp </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: Popup Mở lại phiếu tranh chấp           */}
      {/* ======================================================== */}
      {showReopenModal && selectedSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <form onSubmit={handleReopenDisputeQTC02} className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base">Mở lại phiếu Tranh chấp</h3>
              <button type="button" onClick={() => setShowReopenModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-600 text-[11px]">
              Khi mở lại thành công, phiếu sẽ chuyển từ <strong>Tranh chấp</strong> về <strong>Không đồng ý</strong> để tiếp tục điều chỉnh khoản trừ và tính lại phương án mới. </p>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Lý do mở lại (Bắt buộc theo ):</label>
              <textarea
                value={reopenReasonInput}
                onChange={(e) => setReopenReasonInput(e.target.value)}
                rows={2}
                placeholder="Ví dụ: Khách chủ động liên hệ lại đề nghị thương lượng mức bồi thường..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowReopenModal(false)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Hủy </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer"
              >
                Mở lại phiếu </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 6: Popup Hủy phiếu quyết toán               */}
      {/* ======================================================== */}
      {showCancelModal && selectedSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <form onSubmit={handleCancelSlipQTC02} className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base">Hủy phiếu quyết toán cọc</h3>
              <button type="button" onClick={() => setShowCancelModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-600 text-[11px]">
              Chỉ được hủy khi phiếu chưa có giao dịch tiền thu/hoàn và chưa phát hành kết quả quyết toán cọc. </p>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Lý do hủy phiếu (Bắt buộc):</label>
              <textarea
                value={cancelReasonInput}
                onChange={(e) => setCancelReasonInput(e.target.value)}
                rows={2}
                placeholder="Nhập lý do hủy phiếu..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Đóng </button>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer"
              >
                Xác nhận hủy phiếu </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 7: UC-QTC-03 Ghi nhận kết quả & Chứng từ chuyển khoản duy nhất */}
      {/* ======================================================== */}
      {showQTC03Modal && selectedSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <form onSubmit={handleProceedToConfirmPopupQTC03} className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4 text-xs my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Ghi nhận kết quả quyết toán cọc </h3>
                <p className="text-slate-500 text-[11px]">
                  Phiếu {selectedSlip.id} • Phương án thống nhất v{selectedSlip.version}
                </p>
              </div>
              <button type="button" onClick={() => setShowQTC03Modal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {qtc03Error && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                {qtc03Error}
              </div>
            )}

            {/* Agreed Scheme Summary */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-[11px]">
              <div className="flex justify-between font-bold text-slate-900">
                <span>Khoản tiền cọc gốc:</span>
                <span className="font-mono">{selectedSlip.initialDepositAmount.toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tổng các khoản khấu trừ ({selectedSlip.deductions.length} khoản):</span>
                <span className="font-mono text-red-600">-{selectedSlip.deductions.reduce((s, d) => s + d.amount, 0).toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="pt-1.5 border-t border-slate-200 flex justify-between font-bold text-xs">
                <span className="text-slate-900">
                  Số tiền phải {selectedSlip.calculatedResult > 0 ? 'hoàn cọc cho khách': selectedSlip.calculatedResult < 0 ? 'thu thêm từ khách': 'đối trừ'}: </span>
                <span className={`font-mono text-sm ${selectedSlip.calculatedResult >= 0 ? 'text-emerald-700': 'text-red-700'}`}>
                  {Math.abs(selectedSlip.calculatedResult).toLocaleString('vi-VN')} đ </span>
              </div>
            </div>

            <div className="rounded-lg border border-emerald-200 p-3 bg-emerald-50 text-xs space-y-1">
              <div className="font-semibold">Phương án khách đã đồng ý</div>
              <div>Phiên bản: v{selectedSlip.tenantAgreementEvidence?.schemeVersion || '—'}</div>
              <div>Chứng cứ: {selectedSlip.tenantAgreementEvidence?.evidenceFile || 'Chưa có'}</div>
              <div>Số tiền thống nhất: {selectedSlip.tenantAgreementEvidence ? Math.abs(selectedSlip.tenantAgreementEvidence.agreedAmount).toLocaleString('vi-VN') + ' đ' : 'Chưa có'}</div>
            </div>
            {/* Single Transfer Receipt Fields */}
            {selectedSlip.calculatedResult !== 0 ? (
              <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between font-bold text-blue-900 text-xs">
                  <span>MỘT chứng từ chuyển khoản duy nhất:</span>
                  <span className="text-[10px] text-blue-700 font-mono font-normal">Không chia nhiều lần / Không tiền mặt</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Số tiền chuyển khoản (Điền sẵn, không sửa): </label>
                    <input
                      type="text"
                      disabled
                      value={`${Math.abs(selectedSlip.calculatedResult).toLocaleString('vi-VN')} đ`}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-xs bg-slate-100 text-blue-700"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {selectedSlip.calculatedResult > 0 ? 'Ngân hàng nhận của KHÁCH:': 'Ngân hàng nhận (Chủ nhà):'}
                    </label>
                    <input
                      type="text"
                      value={receiptBank}
                      onChange={(e) => setReceiptBank(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {selectedSlip.calculatedResult > 0 ? 'Số tài khoản nhận của KHÁCH:': 'Số tài khoản nhận:'}
                    </label>
                    <input
                      type="text"
                      value={receiptAccNumber}
                      onChange={(e) => setReceiptAccNumber(e.target.value)}
                      placeholder="Không nhập số tài khoản chủ nhà..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Tên chủ tài khoản nhận:</label>
                    <input
                      type="text"
                      value={receiptAccHolder}
                      onChange={(e) => setReceiptAccHolder(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg uppercase text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Mã giao dịch ngân hàng (FT...):</label>
                    <input
                      type="text"
                      value={receiptTxnCode}
                      onChange={(e) => setReceiptTxnCode(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Ngày chuyển:</label>
                    <input
                      type="date"
                      value={receiptDate}
                      onChange={(e) => setReceiptDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Đính kèm chứng từ (Ủy nhiệm chi / Ảnh chụp giao dịch):</label>
                  <input
                    type="text"
                    value={receiptProofFile}
                    onChange={(e) => setReceiptProofFile(e.target.value)}
                    placeholder="unc_chuyen_khoan_mb.pdf"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs bg-white"
                  />
                </div>
              </div>
            ): (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs">
                Khoản nợ được bù vừa đủ bằng cọc (kết quả = 0 đ). Không có giao dịch tiền phát sinh, bỏ qua kiểm tra chứng từ chuyển khoản. </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowQTC03Modal(false)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Hủy </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer"
              >
                Tiếp tục xác nhận hoàn tất </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* POPUP: Bước 4 Popup xác nhận trước khi phát hành quyết toán cọc     */}
      {/* ======================================================== */}
      {showConfirmQTC03Popup && selectedSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center gap-2.5 text-emerald-700 pb-2 border-b border-slate-100">
              <ShieldCheck className="w-5 h-5" />
              <h4 className="font-bold text-slate-900 text-base">Xác nhận hoàn tất quyết toán & phát hành quyết toán cọc</h4>
            </div>

            <p className="text-slate-600 text-xs">
              Bạn có chắc chắn muốn xác nhận hoàn tất quyết toán cọc cho phòng <strong>{selectedSlip.roomCode}</strong>? </p>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-[11px]">
              <div>Phiếu quyết toán: <strong className="font-mono">{selectedSlip.id}</strong> (v{selectedSlip.version})</div>
              <div>Kết quả: <strong className="font-mono text-emerald-700">{Math.abs(selectedSlip.calculatedResult).toLocaleString('vi-VN')} đ</strong> ({selectedSlip.calculatedResult > 0 ? 'Hoàn cọc': selectedSlip.calculatedResult < 0 ? 'Thu thêm': 'Đối trừ hết'})</div>
              {selectedSlip.calculatedResult !== 0 && (
                <div>Chứng từ: <strong className="font-mono">{receiptTxnCode}</strong> ({receiptBank} - {receiptAccNumber})</div>
              )}
            </div>

            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-[10px] text-blue-900 space-y-1">
              <div><strong>Xử lý trong một lần:</strong></div>
              <div>• Cập nhật công nợ (Đã xử lý bằng cọc / Đã thu).</div>
              <div>• Chuyển trạng thái phiếu sang "Đã có kết quả – chờ ký biên bản".</div>
              <div>• Đồng bộ kết quả quyết toán cọc sang Biên bản trả phòng /.</div>
              <div>• Phòng giữ nguyên trạng thái Trống từ lúc nhận lại.</div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowConfirmQTC03Popup(false)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Quay lại </button>
              <button
                type="button"
                onClick={handleFinalConfirmQTC03}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer"
              >
                Xác nhận phát hành kết quả quyết toán cọc </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
