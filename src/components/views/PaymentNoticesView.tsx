import { toUserMessage } from '../../utils/userMessages';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { PaymentNotice, PeriodBill, PaymentNoticeItem } from '../../types';
import { resolveDebtPaymentRoute } from '../../utils/debtPaymentRouting';
import {
  QrCode, Share2, Download, CheckCircle2, AlertCircle, RefreshCw,
  Landmark, Calendar, Plus, Eye, Copy, ArrowRight, X, ShieldAlert,
  Search, Info, ExternalLink, ArrowLeft, Clock, AlertTriangle, CheckSquare, Square,
  Building2, UserCheck, ChevronRight
} from 'lucide-react';

// Compare due dates as local calendar days, not timestamps with hours/timezone offsets.
const localDateISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Format date string from YYYY-MM-DD or ISO to dd/MM/yyyy
export const formatDateDMY = (dateStr?: string): string => {
  if (!dateStr) return '';
  const clean = dateStr.slice(0, 10);
  const parts = clean.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

// Format period label to prevent duplicate "Kỳ" prefix (e.g. "Kỳ 10/2026" stays "Kỳ 10/2026")
export const formatPeriodLabel = (period?: string): string => {
  if (!period) return '';
  const trimmed = period.trim();
  return trimmed.startsWith('Kỳ ') ? trimmed : `Kỳ ${trimmed}`;
};

interface PaymentNoticesViewProps {
  onNavigateToReceipts?: (noticeId: string) => void;
  initialBillId?: string;
  initialNoticeId?: string;
  initialDebtRequest?: { roomCode: string; leaseId: string; sourceNoticeIds: string[] };
}

export const PaymentNoticesView: React.FC<PaymentNoticesViewProps> = ({ onNavigateToReceipts, initialBillId, initialNoticeId, initialDebtRequest }) => {
  const {
    paymentNotices,
    periodBills,
    activeBankAccount,
    bankAccounts,
    issuePeriodNoticeFromA,
    createDebtPaymentNotice,
    replacePaymentNotice07_2,
    debtPromises,
    rooms,
    contracts
  } = useApp();

  // 1. Two Main Tabs: 'period' = Kỳ hiện tại, 'debt' = Thu công nợ
  const [mainTab, setMainTab] = useState<'period' | 'debt'>('period');

  // View state: 'list' = Danh sách, 'detail' = Chi tiết thông báo
  const [activeView, setActiveView] = useState<'list' | 'detail'>('list');

  // Currently viewed notice
  const [selectedNotice, setSelectedNotice] = useState<PaymentNotice | null>(null);
  const [pendingOpenNoticeId, setPendingOpenNoticeId] = useState<string | null>(null);

  // Filters for Period Tab (Kỳ hiện tại)
  const [searchPeriodRoom, setSearchPeriodRoom] = useState<string>('');
  const [selectedPeriodFilter, setSelectedPeriodFilter] = useState<string>('ALL');
  const [periodStatusFilter, setPeriodStatusFilter] = useState<'ALL' | 'ACTIVE' | 'REPLACED' | 'UNPAID' | 'PAID'>('ALL');

  // Filters for Debt Tab (Thu công nợ)
  const [searchDebtQuery, setSearchDebtQuery] = useState<string>('');
  const [selectedDebtMonthFilter, setSelectedDebtMonthFilter] = useState<string>('ALL');
  const [debtStatusFilter, setDebtStatusFilter] = useState<'ALL' | 'ACTIVE' | 'REPLACED' | 'UNPAID' | 'PAID'>('ALL');

  // Form Lập thông báo Kỳ hiện tại modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBillIds, setSelectedBillIds] = useState<string[]>([]);
  const [modalRoomSearch, setModalRoomSearch] = useState<string>('');
  const [modalPeriodFilter, setModalPeriodFilter] = useState<string>('ALL');
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>(
    activeBankAccount?.id || bankAccounts?.[0]?.id || ''
  );
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split('T')[0];
  });

  // Luồng lập thông báo Thu công nợ modal state (3 Bước)
  const [showDebtWizard, setShowDebtWizard] = useState(false);
  const [debtWizardStep, setDebtWizardStep] = useState<1 | 2 | 3>(1);
  const [debtWizardRoomSearch, setDebtWizardRoomSearch] = useState<string>('');
  const [selectedDebtRoomCode, setSelectedDebtRoomCode] = useState<string>('');
  const [selectedDebtLeaseId, setSelectedDebtLeaseId] = useState<string>('');
  const [selectedDebtNoticeIds, setSelectedDebtNoticeIds] = useState<string[]>([]);
  const [debtDueDate, setDebtDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split('T')[0];
  });
  const [selectedDebtBankAccountId, setSelectedDebtBankAccountId] = useState<string>(
    activeBankAccount?.id || bankAccounts?.[0]?.id || ''
  );

  // Replace Notice modal state
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [replaceNoticeId, setReplaceNoticeId] = useState('');
  const [replaceReason, setReplaceReason] = useState('');

  // QR Code & Guide state
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [showShareGuideModal, setShowShareGuideModal] = useState(false);

  const noticeCardRef = useRef<HTMLDivElement>(null);

  // Set default selected notice on mount if none
  useEffect(() => {
    if (!selectedNotice && paymentNotices.length > 0) {
      setSelectedNotice(paymentNotices[0]);
    }
  }, [paymentNotices, selectedNotice]);

  // Thông báo là một bản ghi chung của Công nợ / Thu công nợ / Thu tiền.
  // Khi xác nhận hoặc hoàn tác thu, chi tiết đang mở phải lấy trạng thái mới nhất.
  useEffect(() => {
    setSelectedNotice(previous => {
      if (!previous) return previous;
      const latest = paymentNotices.find(n => n.id === previous.id);
      return latest && latest !== previous ? latest : previous;
    });
  }, [paymentNotices]);

  // List of all unique period codes from period notices and bills
  const allPeriodCodes = useMemo(() => {
    return Array.from(
      new Set([
        ...paymentNotices.filter(n => n.noticeType !== 'DEBT').map(n => n.periodCode),
        ...periodBills.map(b => b.periodCode)
      ])
    ).filter(Boolean).sort().reverse();
  }, [paymentNotices, periodBills]);

  // List of all unique debt months from debt notices or overdue notices
  const allDebtMonthCodes = useMemo(() => {
    const months = new Set<string>();
    paymentNotices.forEach(n => {
      if (n.noticeType === 'DEBT') {
        n.debtPeriods?.forEach(p => months.add(p));
      } else if ((n.originalDueDate || n.dueDate) < localDateISO() && n.paymentStatus === 'Chưa thu') {
        months.add(n.periodCode);
      }
    });
    return Array.from(months).filter(Boolean).sort().reverse();
  }, [paymentNotices]);

  // When initialBillId is passed (e.g. from BillingView "Lập thông báo"), open modal with that bill checked
  useEffect(() => {
    if (initialBillId) {
      setMainTab('period');
      setActiveView('list');
      setSelectedBillIds([initialBillId]);
      const bill = periodBills.find(b => b.id === initialBillId);
      if (bill) {
        setModalPeriodFilter(bill.periodCode);
      }
      setShowCreateModal(true);
    }
  }, [initialBillId, periodBills]);

  // When initialNoticeId is passed (e.g. from DebtsView "Nhắc nợ điều hướng lấy mã QR"), open notice detail with QR
  useEffect(() => {
    if (initialNoticeId) {
      const record = paymentNotices.find(n => n.id === initialNoticeId || n.noticeCode === initialNoticeId);
      if (record) {
        setSelectedNotice(record);
        if (record.noticeType === 'DEBT') {
          setMainTab('debt');
        } else {
          setMainTab('period');
        }
        setActiveView('detail');
      }
    }
  }, [initialNoticeId, paymentNotices]);

  // Keep selectedBankAccountId in sync
  useEffect(() => {
    if (!selectedBankAccountId && activeBankAccount) {
      setSelectedBankAccountId(activeBankAccount.id);
    }
    if (!selectedDebtBankAccountId && activeBankAccount) {
      setSelectedDebtBankAccountId(activeBankAccount.id);
    }
  }, [activeBankAccount, selectedBankAccountId, selectedDebtBankAccountId]);

  // State updates after issuing/replacing a notice are asynchronous. Open only the new record.
  useEffect(() => {
    if (!pendingOpenNoticeId) return;
    const record = paymentNotices.find(n => n.id === pendingOpenNoticeId);
    if (record) {
      setSelectedNotice(record);
      setPendingOpenNoticeId(null);
      if (record.noticeType === 'DEBT') {
        setMainTab('debt');
      } else {
        setMainTab('period');
      }
      setActiveView('detail');
    }
  }, [paymentNotices, pendingOpenNoticeId]);

  // Hiển thị ảnh VietQR thanh toán trực tiếp
  useEffect(() => {
    setQrDataUrl('');
    if (!selectedNotice || selectedNotice.status !== 'Đang hiệu lực' || selectedNotice.paymentStatus === 'Đã thu') return;
    const bankName = selectedNotice.qrBankSnapshot.bankName.toLowerCase();
    const banks: { [key: string]: string } = {
      'mb bank': 'MB',
      'ngân hàng quân đội': 'MB',
      'vietcombank': 'VCB',
      'vcb': 'VCB',
      'vietinbank': 'ICB',
      'bidv': 'BIDV',
      'techcombank': 'TCB',
      'acb': 'ACB',
      'vpbank': 'VPB',
      'tpbank': 'TPB',
      'sacombank': 'STB',
      'vib': 'VIB'
    };
    const bankCode = Object.entries(banks).find(([name]) => bankName.includes(name))?.[1];
    if (!bankCode) return;
    const snapshot = selectedNotice.qrBankSnapshot;
    setQrDataUrl(`https://img.vietqr.io/image/${bankCode}-${encodeURIComponent(snapshot.accountNumber)}-compact2.png?amount=${snapshot.amount}&addInfo=${encodeURIComponent(snapshot.transferContent)}&accountName=${encodeURIComponent(snapshot.accountHolder)}`);
  }, [selectedNotice]);

  // Helper: Find tenant name of room
  const getTenantName = (roomCode: string, leaseId?: string) => {
    const contract = contracts.find(c => c.roomCode === roomCode && c.leaseId === leaseId) ||
      (!leaseId ? contracts.find(c => c.roomCode === roomCode && c.status === 'Hiệu lực') : undefined);
    if (contract?.tenantName) return contract.tenantName;
    const room = rooms.find(r => r.roomCode === roomCode);
    return (!leaseId || room?.currentLeaseId === leaseId || room?.pendingLeaseId === leaseId) ? (room?.currentTenantName || 'Khách thuê') : 'Khách thuê';
  };

  // IDs of notices already bound to an active unpaid debt collection notice (Rule 5)
  const activeDebtNoticeIdsSet = useMemo(() => {
    const ids = new Set<string>();
    paymentNotices.forEach(n => {
      if (n.noticeType === 'DEBT' && n.status === 'Đang hiệu lực' && n.paymentStatus === 'Chưa thu' && n.debtNoticeIds) {
        n.debtNoticeIds.forEach(id => ids.add(id));
      }
    });
    return ids;
  }, [paymentNotices]);

  // ==================== TAB 1: KỲ HIỆN TẠI LOGIC ====================
  // Chỉ cho chọn bảng tính có hợp đồng giấy đã ký khớp phòng + lượt thuê.
  // Bảng tính lịch sử thiếu hồ sơ gốc vẫn giữ nguyên để đối soát, không tự sinh QR.
  const confirmedBills = periodBills.filter(b => b.isConfirmed && contracts.some(c =>
    c.roomCode === b.roomCode && c.leaseId === b.leaseId && c.isSignedPaper));
  const billsMissingSignedContract = periodBills.filter(b => b.isConfirmed && !contracts.some(c =>
    c.roomCode === b.roomCode && c.leaseId === b.leaseId && c.isSignedPaper));
  // Phần trình bày vẫn theo A, số tiền dự kiến phải theo đúng QT07.1 của mã chuẩn B.
  const previewPeriodReceivable = (bill: PeriodBill): number => {
    const room = rooms.find(r => r.roomCode === bill.roomCode);
    const contract = contracts.find(c => c.roomCode === bill.roomCode && c.leaseId === bill.leaseId);
    const prepaidFirstRent = !!(contract?.firstMonthRentPaid && contract.startDate && bill.servicePeriodFrom &&
      (contract.startDate.startsWith(bill.servicePeriodFrom.slice(0, 7)) || contract.startDate.startsWith(bill.nextRentPeriodFrom.slice(0, 7))));
    const rentEnded = !!(bill.isRentPeriodEnded || room?.status === 'Trống');
    const rent = rentEnded || prepaidFirstRent ? 0 : bill.nextMonthRentAmount;
    const services = bill.electricityAmount + bill.waterAmount + (bill.serviceFees || []).reduce((sum, fee) => sum + fee.amount, 0) + (bill.adjustmentAmount || 0);
    return rent + services;
  };

  const handleOpenCreateModal = (preselectId?: string) => {
    if (preselectId) {
      setSelectedBillIds([preselectId]);
      const bill = periodBills.find(b => b.id === preselectId);
      if (bill) setModalPeriodFilter(bill.periodCode);
    } else {
      const availableBillIds = confirmedBills
        .filter(b => !paymentNotices.some(n => n.noticeType !== 'DEBT' && n.roomCode === b.roomCode && n.periodCode === b.periodCode && n.status === 'Đang hiệu lực'))
        .map(b => b.id);
      setSelectedBillIds(availableBillIds.length > 0 ? availableBillIds : (confirmedBills[0] ? [confirmedBills[0].id] : []));
      setModalPeriodFilter('ALL');
    }
    setModalRoomSearch('');
    const d = new Date();
    d.setDate(d.getDate() + 5);
    setDueDate(d.toISOString().split('T')[0]);
    setSelectedBankAccountId(activeBankAccount?.id || bankAccounts?.[0]?.id || '');
    setShowCreateModal(true);
  };

  const handleToggleBillSelection = (billId: string) => {
    setSelectedBillIds(prev =>
      prev.includes(billId) ? prev.filter(id => id !== billId) : [...prev, billId]
    );
  };

  const modalFilteredBills = confirmedBills.filter(b => {
    if (modalPeriodFilter !== 'ALL' && b.periodCode !== modalPeriodFilter) return false;
    if (modalRoomSearch.trim()) {
      const q = modalRoomSearch.trim().toLowerCase();
      if (!b.roomCode.toLowerCase().includes(q) && !b.id.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const handleToggleAllVisibleBills = () => {
    const visibleIds = modalFilteredBills.map(b => b.id);
    const allVisibleSelected = visibleIds.every(id => selectedBillIds.includes(id));
    if (allVisibleSelected) {
      setSelectedBillIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedBillIds(prev => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleCreateNoticeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedBillIds.length === 0) {
      alert(toUserMessage('Vui lòng chọn ít nhất một phòng để lập thông báo thanh toán.'));
      return;
    }

    const todayStr = localDateISO();
    if (dueDate < todayStr) {
      alert(toUserMessage(`Hạn thanh toán (${formatDateDMY(dueDate)}) không được trước ngày phát hành (${formatDateDMY(todayStr)}).`));
      return;
    }

    let successCount = 0;
    const errors: string[] = [];
    let lastCreatedId: string | undefined;

    for (const billId of selectedBillIds) {
      const res = issuePeriodNoticeFromA(billId, dueDate, selectedBankAccountId);
      if (res.success) {
        successCount++;
        if (res.noticeId) lastCreatedId = res.noticeId;
      } else {
        const b = periodBills.find(item => item.id === billId);
        errors.push(`Phòng ${b?.roomCode || billId}: ${res.message}`);
      }
    }

    setShowCreateModal(false);

    if (errors.length > 0) {
      alert(toUserMessage(`Đã lập ${successCount} thông báo. Có ${errors.length} lỗi:\n${errors.join('\n')}`));
    } else {
      alert(toUserMessage(`Lập thành công ${successCount} thông báo thanh toán!`));
    }

    if (successCount === 1 && lastCreatedId) {
      setPendingOpenNoticeId(lastCreatedId);
    } else {
      setActiveView('list');
    }
  };

  // Filtered period notices list
  const filteredPeriodNotices = paymentNotices.filter(n => {
    if (n.noticeType === 'DEBT') return false; // Filter out debt notices in current period tab

    if (periodStatusFilter === 'ACTIVE' && n.status !== 'Đang hiệu lực') return false;
    if (periodStatusFilter === 'REPLACED' && n.status !== 'Đã thay thế') return false;
    if (periodStatusFilter === 'UNPAID' && n.paymentStatus !== 'Chưa thu') return false;
    if (periodStatusFilter === 'PAID' && n.paymentStatus !== 'Đã thu') return false;

    if (selectedPeriodFilter !== 'ALL' && n.periodCode !== selectedPeriodFilter) return false;

    if (searchPeriodRoom.trim()) {
      const q = searchPeriodRoom.trim().toLowerCase();
      const matchRoom = n.roomCode.toLowerCase().includes(q);
      const matchNoticeCode = n.noticeCode.toLowerCase().includes(q);
      const tenant = getTenantName(n.roomCode, n.leaseId);
      const matchTenant = tenant.toLowerCase().includes(q);
      if (!matchRoom && !matchNoticeCode && !matchTenant) return false;
    }

    return true;
  });

  // ==================== TAB 2: THU CÔNG NỢ LOGIC ====================
  // Filtered debt notices list
  const filteredDebtNotices = paymentNotices.filter(n => {
    if (n.noticeType !== 'DEBT') return false; // Only debt notices

    if (debtStatusFilter === 'ACTIVE' && n.status !== 'Đang hiệu lực') return false;
    if (debtStatusFilter === 'REPLACED' && n.status !== 'Đã thay thế') return false;
    if (debtStatusFilter === 'UNPAID' && n.paymentStatus !== 'Chưa thu') return false;
    if (debtStatusFilter === 'PAID' && n.paymentStatus !== 'Đã thu') return false;

    if (selectedDebtMonthFilter !== 'ALL') {
      const hasMonth = n.debtPeriods?.some(p => p === selectedDebtMonthFilter) || n.periodCode.includes(selectedDebtMonthFilter);
      if (!hasMonth) return false;
    }

    if (searchDebtQuery.trim()) {
      const q = searchDebtQuery.trim().toLowerCase();
      const matchRoom = n.roomCode.toLowerCase().includes(q);
      const matchNoticeCode = n.noticeCode.toLowerCase().includes(q);
      const tenant = n.tenantName || getTenantName(n.roomCode, n.leaseId);
      const matchTenant = tenant.toLowerCase().includes(q);
      if (!matchRoom && !matchNoticeCode && !matchTenant) return false;
    }

    return true;
  });

  // Rooms with overdue unpaid debts available to create debt notice (Step 1)
  const roomsWithOverdueDebt = useMemo(() => {
    const today = localDateISO();
    // Overdue period notices that are unpaid, active, and not bound to an active debt notice
    const eligibleOverdueNotices = paymentNotices.filter(n =>
      n.noticeType !== 'DEBT' &&
      n.status === 'Đang hiệu lực' &&
      n.paymentStatus === 'Chưa thu' &&
      (n.originalDueDate || n.dueDate) < today &&
      !activeDebtNoticeIdsSet.has(n.id)
    );

    const roomMap = new Map<string, {
      roomCode: string;
      tenantName: string;
      leaseId: string;
      notices: PaymentNotice[];
      totalDebt: number;
      debtPeriods: string[];
    }>();

    eligibleOverdueNotices.forEach(n => {
      const groupKey = `${n.roomCode}::${n.leaseId}`;
      const existing = roomMap.get(groupKey);
      if (existing) {
        existing.notices.push(n);
        existing.totalDebt += n.totalAmount;
        if (!existing.debtPeriods.includes(n.periodCode)) {
          existing.debtPeriods.push(n.periodCode);
        }
      } else {
        roomMap.set(groupKey, {
          roomCode: n.roomCode,
          tenantName: getTenantName(n.roomCode, n.leaseId),
          leaseId: n.leaseId,
          notices: [n],
          totalDebt: n.totalAmount,
          debtPeriods: [n.periodCode]
        });
      }
    });

    return Array.from(roomMap.values());
  }, [paymentNotices, activeDebtNoticeIdsSet, contracts, rooms]);

  // Điểm đến từ Công nợ khi chưa có thông báo thu gộp: đi vào bước chọn
  // tháng nợ của đúng phòng/lượt thuê, sau khi chủ nhà xác nhận phát hành sẽ
  // mở ngay Chi tiết thanh toán (không sinh QR/nghĩa vụ tự động).
  const consumedDebtRequest = useRef<string | null>(null);
  useEffect(() => {
    if (!initialDebtRequest?.sourceNoticeIds?.length) return;
    const requestKey = `${initialDebtRequest.roomCode}|${initialDebtRequest.leaseId}|${initialDebtRequest.sourceNoticeIds.join(',')}`;
    if (consumedDebtRequest.current === requestKey) return;
    consumedDebtRequest.current = requestKey;
    setMainTab('debt');
    const route = resolveDebtPaymentRoute(paymentNotices, initialDebtRequest.roomCode,
      initialDebtRequest.leaseId, initialDebtRequest.sourceNoticeIds);
    if (route.mode === 'detail') {
      const existing = paymentNotices.find(n => n.id === route.noticeId);
      if (existing) { setSelectedNotice(existing); setActiveView('detail'); }
      return;
    }
    if (route.mode !== 'create') {
      alert(toUserMessage(route.message));
      setActiveView('list');
      return;
    }
    const room = roomsWithOverdueDebt.find(r => r.roomCode === route.roomCode && r.leaseId === route.leaseId);
    if (!room || !route.sourceNoticeIds.every(id => room.notices.some(n => n.id === id))) {
      alert(toUserMessage('Khoản nợ không còn đủ điều kiện để lập thông báo. Hãy kiểm tra các kỳ nợ và thông báo hiện có.'));
      setActiveView('list');
      return;
    }
    setActiveView('list');
    setSelectedDebtRoomCode(room.roomCode);
    setSelectedDebtLeaseId(room.leaseId);
    setSelectedDebtNoticeIds(route.sourceNoticeIds);
    setDebtWizardRoomSearch(room.roomCode);
    setDebtWizardStep(2);
    setSelectedDebtBankAccountId(activeBankAccount?.id || bankAccounts?.[0]?.id || '');
    setShowDebtWizard(true);
  }, [initialDebtRequest, paymentNotices, roomsWithOverdueDebt, activeBankAccount, bankAccounts]);

  // Filtered rooms in Wizard Step 1
  const wizardFilteredRooms = roomsWithOverdueDebt.filter(r => {
    if (!debtWizardRoomSearch.trim()) return true;
    const q = debtWizardRoomSearch.trim().toLowerCase();
    return r.roomCode.toLowerCase().includes(q) || r.tenantName.toLowerCase().includes(q);
  });

  // Selected room's available debt items (Step 2)
  const selectedRoomDebtData = useMemo(() => {
    if (!selectedDebtRoomCode) return null;
    return roomsWithOverdueDebt.find(r => r.roomCode === selectedDebtRoomCode && r.leaseId === selectedDebtLeaseId) || null;
  }, [selectedDebtRoomCode, selectedDebtLeaseId, roomsWithOverdueDebt]);

  // Selected debt items total sum
  const selectedDebtItemsSum = useMemo(() => {
    if (!selectedRoomDebtData) return 0;
    return selectedRoomDebtData.notices
      .filter(n => selectedDebtNoticeIds.includes(n.id))
      .reduce((sum, n) => sum + n.totalAmount, 0);
  }, [selectedRoomDebtData, selectedDebtNoticeIds]);

  // Open Debt Wizard
  const handleOpenDebtWizard = () => {
    setDebtWizardStep(1);
    setDebtWizardRoomSearch('');
    setSelectedDebtRoomCode(roomsWithOverdueDebt[0]?.roomCode || '');
    setSelectedDebtLeaseId(roomsWithOverdueDebt[0]?.leaseId || '');
    if (roomsWithOverdueDebt[0]) {
      setSelectedDebtNoticeIds(roomsWithOverdueDebt[0].notices.map(n => n.id));
    } else {
      setSelectedDebtNoticeIds([]);
    }
    const d = new Date();
    d.setDate(d.getDate() + 5);
    setDebtDueDate(d.toISOString().split('T')[0]);
    setSelectedDebtBankAccountId(activeBankAccount?.id || bankAccounts?.[0]?.id || '');
    setShowDebtWizard(true);
  };

  // Toggle notice selection in Wizard Step 2
  const handleToggleDebtNoticeSelection = (noticeId: string) => {
    setSelectedDebtNoticeIds(prev =>
      prev.includes(noticeId) ? prev.filter(id => id !== noticeId) : [...prev, noticeId]
    );
  };

  // Toggle all notices for the selected room in Wizard Step 2
  const handleToggleAllRoomDebtNotices = () => {
    if (!selectedRoomDebtData) return;
    const allIds = selectedRoomDebtData.notices.map(n => n.id);
    if (selectedDebtNoticeIds.length === allIds.length) {
      setSelectedDebtNoticeIds([]);
    } else {
      setSelectedDebtNoticeIds(allIds);
    }
  };

  // Submit Debt Notice creation (Wizard Step 3)
  const handleConfirmCreateDebtNotice = () => {
    if (!selectedDebtRoomCode) {
      alert(toUserMessage('Vui lòng chọn phòng để lập thông báo thu công nợ.'));
      return;
    }
    if (selectedDebtNoticeIds.length === 0) {
      alert(toUserMessage('Vui lòng chọn ít nhất một tháng công nợ để thu.'));
      return;
    }

    const todayStr = localDateISO();
    if (debtDueDate < todayStr) {
      alert(toUserMessage(`Hạn thanh toán (${formatDateDMY(debtDueDate)}) không được trước ngày phát hành (${formatDateDMY(todayStr)}).`));
      return;
    }

    const res = createDebtPaymentNotice(
      selectedDebtRoomCode,
      selectedDebtNoticeIds,
      debtDueDate,
      selectedDebtBankAccountId
    );

    if (res.success) {
      setShowDebtWizard(false);
      alert(toUserMessage(res.message));
      if (res.noticeId) {
        setPendingOpenNoticeId(res.noticeId);
      }
    } else {
      alert(toUserMessage(res.message));
    }
  };

  // UC07.2: Replace Notice Submit
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
      setActiveView('detail');
    }
  };

  // Build unified itemized list of charges for a notice
  const getNoticeItems = (notice: PaymentNotice): PaymentNoticeItem[] => {
    if (notice.breakdown?.items && notice.breakdown.items.length > 0) {
      return notice.breakdown.items;
    }

    const items: PaymentNoticeItem[] = [];
    const b = notice.breakdown;

    if (notice.noticeType === 'DEBT') {
      // If debt notice without explicit items
      notice.debtPeriods?.forEach(p => {
        items.push({
          name: `Công nợ ${p}`,
          amount: notice.totalAmount / (notice.debtPeriods?.length || 1),
          note: 'Khoản nợ quá hạn kỳ trước'
        });
      });
      if (items.length > 0) return items;
    }

    if (b?.nextRentAmount && b.nextRentAmount > 0) {
      items.push({
        name: `Tiền thuê phòng (${notice.nextRentPeriod})`,
        amount: b.nextRentAmount,
        note: 'Tiền thuê kỳ tiếp theo'
      });
    }

    if (b?.electricityAmount && b.electricityAmount > 0) {
      const usageText = b.electricityUsage !== undefined ? `${b.electricityUsage} kWh` : '';
      const rateText = b.electricityRate ? ` × ${b.electricityRate.toLocaleString('vi-VN')} đ` : '';
      items.push({
        name: `Tiền điện${usageText ? ` (${usageText}${rateText})` : ''}`,
        amount: b.electricityAmount,
        note: `Kỳ dịch vụ: ${notice.servicePeriod}`
      });
    }

    if (b?.waterAmount && b.waterAmount > 0) {
      const usageText = b.waterUsage !== undefined ? `${b.waterUsage} m³` : '';
      const rateText = b.waterRate ? ` × ${b.waterRate.toLocaleString('vi-VN')} đ` : '';
      items.push({
        name: `Tiền nước${usageText ? ` (${usageText}${rateText})` : ''}`,
        amount: b.waterAmount,
        note: `Kỳ dịch vụ: ${notice.servicePeriod}`
      });
    }

    if (b?.serviceFees && b.serviceFees.length > 0) {
      b.serviceFees.forEach(fee => {
        if (fee.amount > 0) {
          items.push({
            name: fee.name,
            amount: fee.amount
          });
        }
      });
    }

    if (b?.adjustmentAmount && b.adjustmentAmount !== 0) {
      items.push({
        name: `Khoản điều chỉnh (${b.adjustmentReason || 'Phát sinh'})`,
        amount: b.adjustmentAmount
      });
    }

    if (items.length === 0) {
      items.push({
        name: notice.noticeType === 'DEBT' ? `Công nợ ${notice.periodCode}` : `Tổng tiền thanh toán kỳ ${notice.periodCode}`,
        amount: notice.totalAmount
      });
    }

    return items;
  };

  const getVietQRUrlForNotice = (notice: PaymentNotice) => {
    const bankName = notice.qrBankSnapshot.bankName.toLowerCase();
    const banks: { [key: string]: string } = {
      'mb bank': 'MB',
      'ngân hàng quân đội': 'MB',
      'vietcombank': 'VCB',
      'vcb': 'VCB',
      'vietinbank': 'ICB',
      'bidv': 'BIDV',
      'techcombank': 'TCB',
      'acb': 'ACB',
      'vpbank': 'VPB',
      'tpbank': 'TPB',
      'sacombank': 'STB',
      'vib': 'VIB'
    };
    const bankCode = Object.entries(banks).find(([name]) => bankName.includes(name))?.[1];
    if (!bankCode) return '';
    const snapshot = notice.qrBankSnapshot;
    return `https://img.vietqr.io/image/${bankCode}-${encodeURIComponent(snapshot.accountNumber)}-compact2.png?amount=${snapshot.amount}&addInfo=${encodeURIComponent(snapshot.transferContent)}&accountName=${encodeURIComponent(snapshot.accountHolder)}`;
  };

  // Real Canvas image download with single unified items list (supports both Period & Debt notices)
  const handleDownloadNoticeCard = (noticeParam?: PaymentNotice) => {
    const targetNotice = noticeParam || selectedNotice;
    if (!targetNotice) return;

    if (targetNotice.status === 'Đã thay thế') {
      alert('Thông báo này đã bị thay thế bởi bản mới. Không được phép tải ảnh mã QR đã vô hiệu hóa.');
      return;
    }
    if (targetNotice.paymentStatus === 'Đã thu') {
      alert('Thông báo này đã thu tiền đầy đủ. Không tiếp tục chia sẻ mã QR để đòi tiền.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isDebt = targetNotice.noticeType === 'DEBT';

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
    ctx.fillStyle = isDebt ? '#7c2d12' : '#1e3a8a'; // Deep amber/brown for debt, blue for period
    ctx.roundRect(40, 40, 720, 120, [24, 24, 0, 0]);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText(isDebt ? 'THÔNG BÁO THU CÔNG NỢ' : 'THÔNG BÁO THANH TOÁN', 70, 90);
    ctx.font = '16px sans-serif';
    ctx.fillStyle = isDebt ? '#fed7aa' : '#93c5fd';
    ctx.fillText(
      isDebt
        ? 'HỆ THỐNG QUẢN LÝ DÀNH CHO CHỦ NHÀ · THU HỒI CÔNG NỢ QUÁ HẠN'
        : 'HỆ THỐNG QUẢN LÝ DÀNH CHO CHỦ NHÀ · THÔNG BÁO THU TIỀN',
      70,
      125
    );

    // Notice info block
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(`Mã thông báo: ${targetNotice.noticeCode}`, 70, 190, 660);
    ctx.font = '15px sans-serif';
    ctx.fillStyle = '#64748b';
    const tenantName = targetNotice.tenantName || getTenantName(targetNotice.roomCode, targetNotice.leaseId);
    ctx.fillText(`Khách thuê: ${tenantName} · Phòng: ${targetNotice.roomCode}`, 70, 216, 660);
    const periodLabel = isDebt ? `Các tháng nợ: ${targetNotice.debtPeriods?.join(', ') || targetNotice.periodCode}` : `Kỳ thu: ${targetNotice.periodCode}`;
    ctx.fillText(`${periodLabel} · Hạn thanh toán: ${formatDateDMY(targetNotice.dueDate)} · Ngày lập: ${formatDateDMY(targetNotice.createdAt.slice(0, 10))}`, 70, 239, 660);

    // Single unified list of charges
    const items = getNoticeItems(targetNotice);
    const boxY = 260;
    const boxHeight = 240;

    ctx.fillStyle = '#f8fafc';
    ctx.roundRect(70, boxY, 660, boxHeight, 14);
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Table Header inside box
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(isDebt ? 'CHI TIẾT CÁC THÁNG CÔNG NỢ CẦN THU' : 'CHI TIẾT CÁC KHOẢN THANH TOÁN', 90, boxY + 30);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(90, boxY + 42);
    ctx.lineTo(710, boxY + 42);
    ctx.stroke();

    // Draw item rows (up to 5 items shown cleanly)
    let currentY = boxY + 68;
    const maxItems = Math.min(items.length, 5);
    for (let i = 0; i < maxItems; i++) {
      const it = items[i];
      ctx.fillStyle = '#1e293b';
      ctx.font = '14px sans-serif';
      ctx.fillText(it.name, 90, currentY, 440);

      ctx.fillStyle = isDebt ? '#c2410c' : '#1e40af';
      ctx.font = 'bold 14px monospace';
      const amtStr = `${it.amount.toLocaleString('vi-VN')} đ`;
      ctx.fillText(amtStr, 610, currentY);

      currentY += 32;
    }

    if (items.length > 5) {
      const remainingCount = items.length - 5;
      const remainingSum = items.slice(5).reduce((s, it) => s + it.amount, 0);
      ctx.fillStyle = '#64748b';
      ctx.font = 'italic 13px sans-serif';
      ctx.fillText(`+ ${remainingCount} khoản khác`, 90, currentY);
      ctx.fillStyle = isDebt ? '#c2410c' : '#1e40af';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(`${remainingSum.toLocaleString('vi-VN')} đ`, 610, currentY);
    }

    // Total Amount highlight
    ctx.fillStyle = isDebt ? '#fff7ed' : '#eff6ff';
    ctx.roundRect(70, 520, 660, 68, 12);
    ctx.fill();
    ctx.strokeStyle = isDebt ? '#fed7aa' : '#bfdbfe';
    ctx.stroke();
    ctx.fillStyle = isDebt ? '#9a3412' : '#1e3a8a';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('TỔNG PHẢI THANH TOÁN:', 90, 562);
    ctx.fillStyle = isDebt ? '#ea580c' : '#2563eb';
    ctx.font = 'bold 24px monospace';
    ctx.fillText(`${targetNotice.totalAmount.toLocaleString('vi-VN')} đ`, 530, 564);

    // Bank details
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`Ngân hàng: ${targetNotice.qrBankSnapshot.bankName}`, 70, 630, 340);
    ctx.fillText(`Số tài khoản: ${targetNotice.qrBankSnapshot.accountNumber}`, 70, 660, 340);
    ctx.fillText(`Chủ tài khoản: ${targetNotice.qrBankSnapshot.accountHolder}`, 70, 690, 340);
    ctx.fillStyle = '#dc2626';
    ctx.fillText(`Nội dung CK: ${targetNotice.qrBankSnapshot.transferContent}`, 70, 720, 340);

    // Target QR URL
    const targetQrCodeUrl = targetNotice.id === selectedNotice?.id && qrDataUrl ? qrDataUrl : getVietQRUrlForNotice(targetNotice);

    // Load QR Image
    if (targetQrCodeUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onerror = () => alert('Không tải được ảnh VietQR. Hãy kiểm tra kết nối và cấu hình ngân hàng trước khi tải thông báo.');
      img.onload = () => {
        ctx.drawImage(img, 450, 610, 260, 260);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px sans-serif';
        ctx.fillText('Vui lòng quét mã QR hoặc chuyển khoản đúng nội dung và số tiền trên.', 70, 920);

        const a = document.createElement('a');
        const filePrefix = isDebt ? 'thong_bao_thu_cong_no' : 'thong_bao_thu_tien';
        a.download = `${filePrefix}_${targetNotice.roomCode}_${targetNotice.periodCode.replace(/\s+/g, '_')}.png`;
        try {
          a.href = canvas.toDataURL('image/png');
          a.click();
        } catch {
          alert('Nguồn VietQR không cho phép xuất ảnh trên trình duyệt. Hãy mở ảnh QR riêng để tải, hoặc cấu hình lưu ảnh QR tại máy chủ.');
        }
      };
      img.src = targetQrCodeUrl;
    } else {
      alert('Không tạo được mã VietQR do chưa xác định được ngân hàng nhận. Vui lòng kiểm tra Cài đặt.');
    }
  };

  const handleShareZaloManual = (noticeParam?: PaymentNotice) => {
    const targetNotice = noticeParam || selectedNotice;
    if (!targetNotice) return;
    if (targetNotice.status === 'Đã thay thế') {
      alert('Thông báo này đã bị thay thế bởi bản mới. Không được phép chia sẻ mã QR đã vô hiệu hóa.');
      return;
    }
    if (targetNotice.paymentStatus === 'Đã thu') {
      alert('Thông báo này đã thu tiền xong. Không chia sẻ mã QR đòi tiền.');
      return;
    }
    setSelectedNotice(targetNotice);
    setShowShareGuideModal(true);
  };

  const selectedBank = bankAccounts?.find(b => b.id === (mainTab === 'debt' ? selectedDebtBankAccountId : selectedBankAccountId)) || activeBankAccount;

  return (
    <div className="space-y-6">
      {/* 1. HAI TAB CHÍNH: Kỳ hiện tại & Thu công nợ */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900">
              {mainTab === 'period' ? 'Thông báo thanh toán' : 'Thông báo thu công nợ'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {mainTab === 'period'
              ? 'Quản lý và lập thông báo thu tiền phòng, tiền điện, nước và dịch vụ kèm mã VietQR chuyển khoản'
              : 'Quản lý và lập thông báo thu các khoản công nợ quá hạn của các kỳ trước kèm mã VietQR riêng'}
          </p>
        </div>

        {/* Tab switch buttons */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl">
          <button
            onClick={() => {
              setMainTab('period');
              setActiveView('list');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
              mainTab === 'period'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Kỳ hiện tại
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              mainTab === 'period' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'
            }`}>
              {paymentNotices.filter(n => n.noticeType !== 'DEBT').length}
            </span>
          </button>

          <button
            onClick={() => {
              setMainTab('debt');
              setActiveView('list');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
              mainTab === 'debt'
                ? 'bg-white text-orange-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            Thu công nợ
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              mainTab === 'debt' ? 'bg-orange-100 text-orange-800' : 'bg-slate-200 text-slate-700'
            }`}>
              {paymentNotices.filter(n => n.noticeType === 'DEBT').length}
            </span>
          </button>
        </div>
      </div>

      {mainTab === 'period' && billsMissingSignedContract.length > 0 && <div role="alert" className="p-3 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 text-xs">
        Có {billsMissingSignedContract.length} bảng tính tiền đã xác nhận nhưng thiếu hợp đồng giấy đã ký khớp phòng/lượt thuê:
        {' '}{billsMissingSignedContract.map(b => `${b.roomCode} (${b.leaseId}, ${b.periodCode})`).join('; ')}.
        Giữ nguyên hồ sơ để đối soát; không cho tạo thông báo/QR cho các bảng tính này.
      </div>}
      {/* ========================================================================= */}
      {/* MÀN HÌNH DANH SÁCH: TAB 1 (KỲ HIỆN TẠI)                                   */}
      {/* ========================================================================= */}
      {mainTab === 'period' && activeView === 'list' && (
        <div className="space-y-6">
          {/* Top Filter and Search Bar */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Tìm kiếm phòng / mã thông báo */}
              <div className="relative flex-1 min-w-[220px] max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm kiếm phòng (ví dụ: 101, 202), mã thông báo..."
                  value={searchPeriodRoom}
                  onChange={(e) => setSearchPeriodRoom(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                {searchPeriodRoom && (
                  <button
                    onClick={() => setSearchPeriodRoom('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* Nút chọn kỳ thu (Dropdown) */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 font-semibold whitespace-nowrap">Kỳ thu:</span>
                  <select
                    value={selectedPeriodFilter}
                    onChange={(e) => setSelectedPeriodFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                  >
                    <option value="ALL">Tất cả kỳ thu</option>
                    {allPeriodCodes.map(p => (
                      <option key={p} value={p}>{formatPeriodLabel(p)}</option>
                    ))}
                  </select>
                </div>

                {/* Nút + Lập thông báo duy nhất */}
                <button
                  onClick={() => handleOpenCreateModal()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Lập thông báo
                </button>
              </div>
            </div>

            {/* Bộ lọc trạng thái */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-700">Trạng thái:</span>
              {(['ALL', 'ACTIVE', 'REPLACED', 'UNPAID', 'PAID'] as const).map(filter => (
                <button
                  key={filter}
                  onClick={() => setPeriodStatusFilter(filter)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    periodStatusFilter === filter
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {filter === 'ALL' && 'Tất cả'}
                  {filter === 'ACTIVE' && 'Đang hiệu lực'}
                  {filter === 'REPLACED' && 'Đã thay thế'}
                  {filter === 'UNPAID' && 'Chưa thu'}
                  {filter === 'PAID' && 'Đã thu'}
                </button>
              ))}

              {(searchPeriodRoom || selectedPeriodFilter !== 'ALL' || periodStatusFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchPeriodRoom('');
                    setSelectedPeriodFilter('ALL');
                    setPeriodStatusFilter('ALL');
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 underline ml-auto cursor-pointer"
                >
                  Đặt lại bộ lọc
                </button>
              )}
            </div>
          </div>

          {/* Notices Grid */}
          {filteredPeriodNotices.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
              Không có thông báo thanh toán nào phù hợp với bộ lọc tìm kiếm.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPeriodNotices.map((n) => {
                const today = localDateISO();
                const isOverdue = n.status === 'Đang hiệu lực' && n.paymentStatus === 'Chưa thu' && n.dueDate < today;
                const isSelected = selectedNotice?.id === n.id;
                const items = getNoticeItems(n);
                const tenant = n.tenantName || getTenantName(n.roomCode, n.leaseId);

                return (
                  <div
                    key={n.id}
                    onClick={() => {
                      setSelectedNotice(n);
                      setActiveView('detail');
                    }}
                    className={`p-4 rounded-2xl border transition-all text-xs space-y-3 cursor-pointer group ${
                      n.status === 'Đã thay thế'
                        ? 'border-slate-200 bg-slate-50/70 opacity-75'
                        : isSelected
                        ? 'border-blue-500 bg-blue-50/40 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-blue-400 hover:shadow-md'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-slate-900 text-sm group-hover:text-blue-700 transition-colors">{n.noticeCode}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        n.status === 'Đang hiệu lực' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600 line-through'
                      }`}>
                        {n.status}
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-600">
                      <div>
                        <span>Phòng: <strong className="text-blue-700">Phòng {n.roomCode}</strong></span>
                        <span className="text-slate-400 text-[11px] block">Khách: {tenant}</span>
                      </div>
                      <span className="font-mono font-medium">{n.periodCode}</span>
                    </div>

                    <div className="p-2.5 bg-slate-100/70 rounded-xl space-y-1">
                      <div className="text-[11px] text-slate-500 font-medium">Chi tiết các khoản:</div>
                      <div className="space-y-0.5 max-h-24 overflow-y-auto">
                        {items.slice(0, 3).map((it, idx) => (
                          <div key={idx} className="flex justify-between text-[11px]">
                            <span className="truncate pr-2 text-slate-600">{it.name}:</span>
                            <span className="font-mono font-medium text-slate-800 shrink-0">{it.amount.toLocaleString('vi-VN')} đ</span>
                          </div>
                        ))}
                        {items.length > 3 && (
                          <div className="text-[10px] text-slate-400 italic">
                            + {items.length - 3} khoản phí khác
                          </div>
                        )}
                      </div>
                      <div className="flex justify-between font-bold text-blue-900 pt-1.5 border-t border-slate-200">
                        <span>Tổng tiền QR cố định:</span>
                        <span className="font-mono">{n.totalAmount.toLocaleString('vi-VN')} đ</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500 font-medium">Hạn: {formatDateDMY(n.dueDate)}</span>
                      <div className="flex items-center gap-1.5">
                        {isOverdue && (
                          <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-bold text-[10px]">
                            Quá hạn
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          n.paymentStatus === 'Đã thu' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
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
                    <div className="flex flex-wrap items-center justify-between gap-1.5 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedNotice(n);
                            setActiveView('detail');
                          }}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          Chi tiết
                        </button>
                        <button
                          disabled={n.status === 'Đã thay thế' || n.paymentStatus === 'Đã thu'}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadNoticeCard(n);
                          }}
                          className="px-2 py-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded font-semibold text-[11px] flex items-center gap-1 cursor-pointer shadow-2xs"
                          title="Tải ảnh PNG"
                        >
                          <Download className="w-3 h-3" />
                          Ảnh
                        </button>
                        <button
                          disabled={n.status === 'Đã thay thế' || n.paymentStatus === 'Đã thu'}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShareZaloManual(n);
                          }}
                          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded font-semibold text-[11px] flex items-center gap-1 cursor-pointer shadow-2xs"
                          title="Chia sẻ Zalo"
                        >
                          <Share2 className="w-3 h-3" />
                          Zalo
                        </button>
                      </div>

                      {n.status === 'Đang hiệu lực' && n.paymentStatus === 'Chưa thu' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setReplaceNoticeId(n.id);
                            setShowReplaceModal(true);
                          }}
                          className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Thay thế
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MÀN HÌNH DANH SÁCH: TAB 2 (THU CÔNG NỢ)                                    */}
      {/* ========================================================================= */}
      {mainTab === 'debt' && activeView === 'list' && (
        <div className="space-y-6">
          {/* Top Filter and Search Bar for Debt Tab */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Ô tìm kiếm theo mã phòng hoặc tên khách thuê */}
              <div className="relative flex-1 min-w-[220px] max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo mã phòng hoặc tên khách thuê..."
                  value={searchDebtQuery}
                  onChange={(e) => setSearchDebtQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                />
                {searchDebtQuery && (
                  <button
                    onClick={() => setSearchDebtQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* Bộ lọc tháng nợ (Dropdown) */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 font-semibold whitespace-nowrap">Tháng nợ:</span>
                  <select
                    value={selectedDebtMonthFilter}
                    onChange={(e) => setSelectedDebtMonthFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer"
                  >
                    <option value="ALL">Tất cả tháng nợ</option>
                    {allDebtMonthCodes.map(p => (
                      <option key={p} value={p}>{formatPeriodLabel(p)}</option>
                    ))}
                  </select>
                </div>

                {/* Nút + Lập thông báo thu công nợ */}
                <button
                  onClick={handleOpenDebtWizard}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Lập thông báo thu công nợ
                </button>
              </div>
            </div>

            {/* Bộ lọc trạng thái */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-700">Trạng thái:</span>
              {(['ALL', 'ACTIVE', 'REPLACED', 'UNPAID', 'PAID'] as const).map(filter => (
                <button
                  key={filter}
                  onClick={() => setDebtStatusFilter(filter)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    debtStatusFilter === filter
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {filter === 'ALL' && 'Tất cả'}
                  {filter === 'ACTIVE' && 'Đang hiệu lực'}
                  {filter === 'REPLACED' && 'Đã thay thế'}
                  {filter === 'UNPAID' && 'Chưa thu'}
                  {filter === 'PAID' && 'Đã thu'}
                </button>
              ))}

              {(searchDebtQuery || selectedDebtMonthFilter !== 'ALL' || debtStatusFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchDebtQuery('');
                    setSelectedDebtMonthFilter('ALL');
                    setDebtStatusFilter('ALL');
                  }}
                  className="text-xs text-orange-600 hover:text-orange-800 underline ml-auto cursor-pointer"
                >
                  Đặt lại bộ lọc
                </button>
              )}
            </div>
          </div>

          {/* Debt Notices Grid */}
          {filteredDebtNotices.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200 space-y-3">
              <p>Chưa có thông báo thu công nợ nào phù hợp.</p>
              <button
                onClick={handleOpenDebtWizard}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                Lập thông báo thu công nợ ngay
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDebtNotices.map((n) => {
                const today = localDateISO();
                const isOverdue = n.status === 'Đang hiệu lực' && n.paymentStatus === 'Chưa thu' && n.dueDate < today;
                const isSelected = selectedNotice?.id === n.id;
                const tenant = n.tenantName || getTenantName(n.roomCode, n.leaseId);
                const debtPeriodsDisplay = n.debtPeriods && n.debtPeriods.length > 0 ? n.debtPeriods.join(', ') : n.periodCode;

                return (
                  <div
                    key={n.id}
                    onClick={() => {
                      setSelectedNotice(n);
                      setActiveView('detail');
                    }}
                    className={`p-4 rounded-2xl border transition-all text-xs space-y-3 cursor-pointer group ${
                      n.status === 'Đã thay thế'
                        ? 'border-slate-200 bg-slate-50/70 opacity-75'
                        : isSelected
                        ? 'border-orange-500 bg-orange-50/30 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-orange-400 hover:shadow-md'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800">
                          Thu công nợ
                        </span>
                        <span className="font-mono font-bold text-slate-900 text-sm group-hover:text-orange-700 transition-colors">{n.noticeCode}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        n.status === 'Đang hiệu lực' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600 line-through'
                      }`}>
                        {n.status}
                      </span>
                    </div>

                    {/* Room & Tenant Info */}
                    <div className="flex justify-between items-start text-slate-700">
                      <div>
                        <span>Mã phòng: <strong className="text-orange-700 font-bold">Phòng {n.roomCode}</strong></span>
                        <div className="text-[11px] text-slate-500 font-medium">Khách thuê: <strong>{tenant}</strong></div>
                      </div>
                      <span className="text-[11px] text-slate-400">Lập: {formatDateDMY(n.createdAt)}</span>
                    </div>

                    {/* Notified Debt Months */}
                    <div className="p-2.5 bg-orange-50/50 border border-orange-100 rounded-xl space-y-1">
                      <div className="text-[10px] text-orange-800 font-semibold uppercase tracking-wider">
                        Các tháng công nợ được thông báo:
                      </div>
                      <div className="font-mono text-xs font-bold text-orange-900">
                        {debtPeriodsDisplay}
                      </div>
                      <div className="flex justify-between font-bold text-slate-900 pt-1.5 border-t border-orange-200/60">
                        <span>Tổng tiền cần thu:</span>
                        <span className="font-mono text-orange-700 text-sm">{n.totalAmount.toLocaleString('vi-VN')} đ</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500 font-medium">Hạn thanh toán: {formatDateDMY(n.dueDate)}</span>
                      <div className="flex items-center gap-1.5">
                        {isOverdue && (
                          <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-bold text-[10px]">
                            Quá hạn
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          n.paymentStatus === 'Đã thu' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {n.paymentStatus}
                        </span>
                      </div>
                    </div>

                    {/* Actions on Card */}
                    <div className="flex flex-wrap items-center justify-between gap-1.5 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedNotice(n);
                            setActiveView('detail');
                          }}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          Chi tiết
                        </button>
                        <button
                          disabled={n.status === 'Đã thay thế' || n.paymentStatus === 'Đã thu'}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadNoticeCard(n);
                          }}
                          className="px-2 py-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded font-semibold text-[11px] flex items-center gap-1 cursor-pointer shadow-2xs"
                          title="Tải ảnh PNG"
                        >
                          <Download className="w-3 h-3" />
                          Ảnh
                        </button>
                        <button
                          disabled={n.status === 'Đã thay thế' || n.paymentStatus === 'Đã thu'}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShareZaloManual(n);
                          }}
                          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded font-semibold text-[11px] flex items-center gap-1 cursor-pointer shadow-2xs"
                          title="Chia sẻ Zalo"
                        >
                          <Share2 className="w-3 h-3" />
                          Zalo
                        </button>
                      </div>

                      {n.status === 'Đang hiệu lực' && n.paymentStatus === 'Chưa thu' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setReplaceNoticeId(n.id);
                            setShowReplaceModal(true);
                          }}
                          className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Thay thế
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. CHI TIẾT THÔNG BÁO (DÙNG CHUNG CHO CẢ KỲ HIỆN TẠI & THU CÔNG NỢ)       */}
      {/* ========================================================================= */}
      {activeView === 'detail' && selectedNotice && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Notice Card Render Preview (2 cols) */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      selectedNotice.noticeType === 'DEBT' ? 'bg-orange-100 text-orange-900 border border-orange-200' : 'bg-blue-100 text-blue-900 border border-blue-200'
                    }`}>
                      Loại thông báo: {selectedNotice.noticeType === 'DEBT' ? 'Thu công nợ' : 'Kỳ hiện tại'}
                    </span>
                    <h2 className="text-lg font-bold text-slate-900">{selectedNotice.noticeCode}</h2>
                    <span className="font-mono px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-bold text-xs">
                      Phòng {selectedNotice.roomCode}
                    </span>
                  </div>
                  <div className="text-slate-600 text-xs mt-1">
                    Khách thuê: <strong>{selectedNotice.tenantName || getTenantName(selectedNotice.roomCode, selectedNotice.leaseId)}</strong> · Ngày phát hành: <strong>{formatDateDMY(selectedNotice.createdAt)}</strong> · Hạn thanh toán: <strong>{formatDateDMY(selectedNotice.dueDate)}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    selectedNotice.status === 'Đang hiệu lực' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600 line-through'
                  }`}>
                    {selectedNotice.status}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    selectedNotice.paymentStatus === 'Đã thu' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
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
                    <span>Đã ghi nhận giao dịch thành công.</span>
                  </div>
                </div>
              )}

              {/* If Debt Notice: Display list of debt months notified */}
              {selectedNotice.noticeType === 'DEBT' && (
                <div className="p-3 bg-orange-50/70 border border-orange-200 rounded-xl text-xs text-orange-950 space-y-1">
                  <span className="font-bold block">Danh sách các tháng công nợ được thông báo:</span>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {(selectedNotice.debtPeriods || [selectedNotice.periodCode]).map((p, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-white border border-orange-200 rounded-lg font-mono font-bold text-orange-800 text-xs">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Đọc trạng thái, số tiền và hẹn trả từ đúng các kỳ nợ nguồn. */}
              {selectedNotice.noticeType === 'DEBT' && !!selectedNotice.debtNoticeIds?.length && (
                <div className="p-3 bg-white border border-orange-200 rounded-xl text-xs space-y-2">
                  <strong className="text-orange-900 block">Đối chiếu các kỳ nợ nguồn trong Công nợ</strong>
                  <div className="divide-y divide-slate-100">
                    {selectedNotice.debtNoticeIds.map(sourceId => {
                      const source = paymentNotices.find(n => n.id === sourceId);
                      const latestPromise = [...debtPromises].filter(p => p.noticeId === sourceId && p.hasPromiseDate && p.promisedDate)
                        .sort((a,b) => b.loggedAt.localeCompare(a.loggedAt))[0];
                      return (
                        <div key={sourceId} className="py-2 flex flex-wrap justify-between gap-2 items-center">
                          <div>
                            <span className="font-bold text-slate-900">{source?.periodCode || sourceId}</span>
                            <span className="ml-2 text-slate-500">{source?.noticeCode || 'Chứng từ gốc không còn tồn tại'}</span>
                            {latestPromise?.promisedDate && <div className="text-blue-700 text-[11px]">Hẹn trả: {formatDateDMY(latestPromise.promisedDate)}</div>}
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-semibold text-slate-800">{source ? `${source.totalAmount.toLocaleString('vi-VN')} đ` : '—'}</span>
                            <div className={source?.paymentStatus === 'Đã thu' ? 'text-emerald-700 font-bold' : 'text-orange-700 font-bold'}>
                              {source?.paymentStatus || 'Cần đối chiếu'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Single unified itemized list of charges */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                    {selectedNotice.noticeType === 'DEBT' ? 'Chi tiết số tiền từng tháng nợ' : 'Danh sách các khoản thanh toán'}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    {getNoticeItems(selectedNotice).length} khoản
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white text-xs">
                  <div className="divide-y divide-slate-100">
                    {getNoticeItems(selectedNotice).map((item, idx) => (
                      <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-slate-900 block">{item.name}</span>
                          {item.note && (
                            <span className="text-[11px] text-slate-500">{item.note}</span>
                          )}
                        </div>
                        <span className={`font-mono font-bold text-sm pl-4 shrink-0 ${
                          selectedNotice.noticeType === 'DEBT' ? 'text-orange-700' : 'text-slate-900'
                        }`}>
                          {item.amount.toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700">Cộng các khoản:</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {selectedNotice.totalAmount.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>
              </div>

              {/* Grand Total Bar */}
              <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block font-medium">TỔNG THANH TOÁN (MÃ QR CỐ ĐỊNH):</span>
                  <span className="text-xl font-bold font-mono text-emerald-400">
                    {selectedNotice.totalAmount.toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <span className="text-xs text-slate-400">Phương thức: Chuyển khoản ngân hàng</span>
              </div>

              {/* Export Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={() => setActiveView('list')}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Quay lại danh sách
                </button>

                <div className="flex items-center gap-2">
                  <button
                    disabled={selectedNotice.status === 'Đã thay thế' || selectedNotice.paymentStatus === 'Đã thu'}
                    onClick={() => handleDownloadNoticeCard()}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                    title={selectedNotice.status === 'Đã thay thế' ? 'Bản đã thay thế không được xuất ảnh' : 'Tải file ảnh PNG về thiết bị'}
                  >
                    <Download className="w-4 h-4" />
                    Tải ảnh thông báo
                  </button>

                  <button
                    disabled={selectedNotice.status === 'Đã thay thế' || selectedNotice.paymentStatus === 'Đã thu'}
                    onClick={() => handleShareZaloManual()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                    title={selectedNotice.status === 'Đã thay thế' ? 'Bản đã thay thế không được chia sẻ' : 'Chia sẻ thủ công qua Zalo'}
                  >
                    <Share2 className="w-4 h-4" />
                    Chia sẻ Zalo thủ công
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Dedicated VietQR Card Box */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 flex flex-col items-center text-center">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                Mã QR Chuyển khoản VietQR
              </span>

              {/* QR Canvas Box */}
              <div className="p-3 bg-white border-2 border-slate-900 rounded-2xl shadow-sm space-y-2">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="VietQR Code"
                    className="w-48 h-48 object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-48 h-48 bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                    {selectedNotice.status !== 'Đang hiệu lực' ? 'Mã QR đã vô hiệu' :
                     selectedNotice.paymentStatus === 'Đã thu' ? 'Đã thanh toán — không sử dụng lại QR' :
                     'Không tạo được ảnh QR. Kiểm tra ngân hàng nhận.'}
                  </div>
                )}
                <span className="font-mono font-bold text-[11px] text-slate-900 block tracking-tight">
                  VIETQR · {selectedNotice.totalAmount.toLocaleString('vi-VN')} Đ
                </span>
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
                  Xác nhận thu tiền tại ngân hàng →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: LẬP THÔNG BÁO KỲ HIỆN TẠI (UC07.2 BƯỚC 4–5)                       */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Lập thông báo thanh toán (Kỳ hiện tại)</h3>
                <p className="text-[11px] text-slate-500">Chọn phòng, hạn thanh toán và tài khoản ngân hàng</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Bước 4: Danh sách phòng có checkbox + Tìm kiếm phòng + Chọn kỳ thu */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-800 text-xs">
                  1. Chọn danh sách phòng lập thông báo <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleToggleAllVisibleBills}
                  className="text-blue-600 hover:text-blue-800 font-semibold text-[11px] cursor-pointer"
                >
                  {modalFilteredBills.length > 0 && modalFilteredBills.every(b => selectedBillIds.includes(b.id))
                    ? 'Bỏ chọn các phòng này'
                    : 'Chọn tất cả phòng hiển thị'}
                </button>
              </div>

              {/* Bộ lọc kỳ và tìm kiếm phòng trong modal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm số phòng (ví dụ: 101, 202)..."
                    value={modalRoomSearch}
                    onChange={(e) => setModalRoomSearch(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {modalRoomSearch && (
                    <button
                      onClick={() => setModalRoomSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500 shrink-0">Kỳ thu:</span>
                  <select
                    value={modalPeriodFilter}
                    onChange={(e) => setModalPeriodFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="ALL">Tất cả kỳ thu</option>
                    {allPeriodCodes.map(p => (
                      <option key={p} value={p}>{formatPeriodLabel(p)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {confirmedBills.length === 0 ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px]">
                  Chưa có bảng tính tiền nào ở trạng thái Đã xác nhận. Vui lòng vào phân hệ <strong>Tính tiền theo kỳ</strong> để xác nhận bảng tính trước khi lập thông báo.
                </div>
              ) : modalFilteredBills.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-center text-[11px]">
                  Không tìm thấy phòng nào phù hợp với bộ lọc trong kỳ đã chọn.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl max-h-52 overflow-y-auto divide-y divide-slate-100 bg-slate-50/50">
                  {modalFilteredBills.map((b) => {
                    const isChecked = selectedBillIds.includes(b.id);
                    const hasActiveNotice = paymentNotices.some(
                      n => n.noticeType !== 'DEBT' && n.roomCode === b.roomCode && n.periodCode === b.periodCode && n.status === 'Đang hiệu lực'
                    );

                    return (
                      <div
                        key={b.id}
                        onClick={() => handleToggleBillSelection(b.id)}
                        className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                          isChecked ? 'bg-blue-50/70' : 'bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">Phòng {b.roomCode}</span>
                              <span className="font-mono text-slate-500">· {b.periodCode}</span>
                              {hasActiveNotice && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                                  Đã có thông báo
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Mã bảng tính: <span className="font-mono">{b.id}</span>
                              {b.isRentPeriodEnded && ' · Kỳ cuối (0đ tiền thuê)'}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-mono font-bold text-blue-700">
                            {previewPeriodReceivable(b).toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="text-[11px] text-slate-500 flex justify-between">
                <span>Đã chọn: <strong className="text-blue-700">{selectedBillIds.length}</strong> / {confirmedBills.length} phòng</span>
              </div>
            </div>

            {/* Bước 5: Hạn thanh toán & Tài khoản ngân hàng */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  2. Hạn thanh toán <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  min={localDateISO()}
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-xs"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  Hạn thanh toán không được trước ngày phát hành (≥ {formatDateDMY(localDateISO())}).
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  3. Tài khoản ngân hàng nhận tiền <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedBankAccountId}
                  onChange={(e) => setSelectedBankAccountId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium text-xs bg-white"
                >
                  {bankAccounts && bankAccounts.length > 0 ? (
                    bankAccounts.filter(b => b.status === 'Đang sử dụng').map(b => (
                      <option key={b.id} value={b.id}>
                        {b.bankName} - {b.accountNumber} ({b.accountHolder})
                      </option>
                    ))
                  ) : activeBankAccount ? (
                    <option value={activeBankAccount.id}>
                      {activeBankAccount.bankName} - {activeBankAccount.accountNumber} ({activeBankAccount.accountHolder})
                    </option>
                  ) : (
                    <option value="">Chưa có tài khoản</option>
                  )}
                </select>
              </div>
            </div>

            {/* Bank Snapshot Preview */}
            {selectedBank && (
              <div className="p-3 bg-slate-100/80 rounded-xl space-y-1 text-slate-700">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500 font-medium">Ngân hàng:</span>
                  <span className="font-bold text-slate-900">{selectedBank.bankName}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500 font-medium">Số tài khoản:</span>
                  <span className="font-mono font-bold text-blue-700">{selectedBank.accountNumber}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500 font-medium">Chủ tài khoản:</span>
                  <span className="uppercase font-semibold text-slate-800">{selectedBank.accountHolder}</span>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={selectedBillIds.length === 0}
                onClick={handleCreateNoticeSubmit}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl font-bold cursor-pointer shadow-xs transition-all"
              >
                Lập {selectedBillIds.length > 0 ? `${selectedBillIds.length} ` : ''}thông báo & Tạo mã QR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MODAL: LUỒNG LẬP THÔNG BÁO THU CÔNG NỢ (3 BƯỚC)                         */}
      {/* ========================================================================= */}
      {showDebtWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4 text-xs">
            {/* Wizard Header */}
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Lập thông báo thu công nợ</h3>
                {/* 3 Steps indicator */}
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    debtWizardStep === 1 ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    Bước 1: Chọn phòng
                  </span>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    debtWizardStep === 2 ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    Bước 2: Chọn tháng nợ
                  </span>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    debtWizardStep === 3 ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    Bước 3: Xác nhận
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowDebtWizard(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* BƯỚC 1: CHỌN PHÒNG */}
            {debtWizardStep === 1 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-800">
                    Chọn phòng có công nợ quá hạn <span className="text-red-500">*</span>
                  </label>
                  <span className="text-slate-500 text-[11px]">
                    {roomsWithOverdueDebt.length} phòng còn nợ
                  </span>
                </div>

                {/* Tìm kiếm phòng */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm theo mã phòng hoặc tên khách..."
                    value={debtWizardRoomSearch}
                    onChange={(e) => setDebtWizardRoomSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                  {debtWizardRoomSearch && (
                    <button
                      onClick={() => setDebtWizardRoomSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {roomsWithOverdueDebt.length === 0 ? (
                  <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-emerald-800 space-y-1">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                    <p className="font-bold">Hiện không có phòng nào có công nợ quá hạn.</p>
                    <p className="text-[11px] text-emerald-700">Tất cả các khoản thu quá hạn đã được thu đủ hoặc đã lập thông báo thu nợ.</p>
                  </div>
                ) : wizardFilteredRooms.length === 0 ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-500">
                    Không tìm thấy phòng nào phù hợp với từ khóa tìm kiếm.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl max-h-56 overflow-y-auto divide-y divide-slate-100 bg-slate-50/50">
                    {wizardFilteredRooms.map((r) => {
                      const isSelected = selectedDebtRoomCode === r.roomCode && selectedDebtLeaseId === r.leaseId;

                      return (
                        <div
                          key={`${r.roomCode}-${r.leaseId}`}
                          onClick={() => {
                            setSelectedDebtRoomCode(r.roomCode);
                            setSelectedDebtLeaseId(r.leaseId);
                            setSelectedDebtNoticeIds(r.notices.map(n => n.id));
                          }}
                          className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected ? 'bg-orange-50/80 border-l-4 border-l-orange-600' : 'bg-white hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="selectedDebtRoom"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-4 h-4 text-orange-600 border-slate-300 focus:ring-orange-500 cursor-pointer"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-sm">Phòng {r.roomCode}</span>
                                <span className="text-slate-600 font-medium text-xs">({r.tenantName})</span>
                              </div>
                              <div className="text-[11px] text-slate-500 flex flex-wrap gap-1 mt-0.5">
                                <span>Các tháng nợ:</span>
                                {r.debtPeriods.map((p, idx) => (
                                  <span key={idx} className="font-mono px-1.5 py-0.2 bg-red-50 text-red-700 rounded text-[10px] font-bold border border-red-100">
                                    {p}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-slate-400 block text-[10px]">Tổng nợ:</span>
                            <span className="font-mono font-bold text-orange-700 text-sm">
                              {r.totalDebt.toLocaleString('vi-VN')} đ
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-[11px]">
                  <strong>Quy tắc:</strong> Mỗi thông báo thu công nợ chỉ áp dụng cho một phòng. Bạn có thể chọn phòng ở trên để tiếp tục sang Bước 2 chọn tháng nợ.
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowDebtWizard(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    disabled={!selectedDebtRoomCode || roomsWithOverdueDebt.length === 0}
                    onClick={() => setDebtWizardStep(2)}
                    className="px-5 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white rounded-xl font-bold cursor-pointer shadow-xs transition-all flex items-center gap-1.5"
                  >
                    Tiếp tục sang bước 2
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* BƯỚC 2: CHỌN THÁNG NỢ */}
            {debtWizardStep === 2 && selectedRoomDebtData && (
              <div className="space-y-3">
                <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Phòng đã chọn:</span>
                    <span className="font-bold text-slate-900 text-sm">Phòng {selectedRoomDebtData.roomCode}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block text-[10px]">Khách thuê:</span>
                    <span className="font-bold text-slate-900 text-sm">{selectedRoomDebtData.tenantName}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-800">
                    Chọn các tháng công nợ cần thu <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleToggleAllRoomDebtNotices}
                    className="text-orange-600 hover:text-orange-800 font-semibold text-[11px] cursor-pointer"
                  >
                    {selectedDebtNoticeIds.length === selectedRoomDebtData.notices.length
                      ? 'Bỏ chọn tất cả'
                      : 'Chọn tất cả các tháng'}
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl max-h-56 overflow-y-auto divide-y divide-slate-100 bg-white">
                  {selectedRoomDebtData.notices.map((n) => {
                    const isChecked = selectedDebtNoticeIds.includes(n.id);

                    return (
                      <div
                        key={n.id}
                        onClick={() => handleToggleDebtNoticeSelection(n.id)}
                        className={`p-3 flex items-start justify-between cursor-pointer transition-colors ${
                          isChecked ? 'bg-orange-50/70' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="w-4 h-4 mt-0.5 text-orange-600 rounded border-slate-300 focus:ring-orange-500 cursor-pointer"
                          />
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-slate-500 font-semibold">Tháng nợ:</span>
                              <span className="font-mono font-bold text-orange-950 text-sm bg-orange-100/70 px-1.5 py-0.2 rounded">{n.periodCode}</span>
                              <span className="font-mono text-slate-400 text-[10px]">({n.noticeCode})</span>
                            </div>
                            <div className="text-[11px] text-slate-600">
                              <span className="text-slate-500">Nội dung khoản thu: </span>
                              <strong>{n.servicePeriod ? `Tiền phòng, điện nước & dịch vụ (${n.servicePeriod})` : `Khoản nợ kỳ ${n.periodCode}`}</strong>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Hạn gốc: {formatDateDMY(n.dueDate)}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-slate-400 block font-medium">Số tiền còn nợ:</span>
                          <span className="font-mono font-bold text-orange-700 text-sm">
                            {n.totalAmount.toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Tổng tiền tự động tính */}
                <div className="p-3.5 bg-orange-100/70 border border-orange-300 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-orange-900 font-bold block">
                      Đã chọn {selectedDebtNoticeIds.length} / {selectedRoomDebtData.notices.length} tháng nợ
                    </span>
                    <span className="text-[11px] text-orange-800">
                      Chỉ bao gồm các khoản nợ chưa thu và chưa thuộc thông báo thu nợ khác.
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-orange-900 text-[11px] block font-semibold">TỔNG TIỀN CẦN THU:</span>
                    <span className="font-mono font-extrabold text-orange-700 text-base">
                      {selectedDebtItemsSum.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setDebtWizardStep(1)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium cursor-pointer flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Quay lại
                  </button>
                  <button
                    type="button"
                    disabled={selectedDebtNoticeIds.length === 0}
                    onClick={() => setDebtWizardStep(3)}
                    className="px-5 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white rounded-xl font-bold cursor-pointer shadow-xs transition-all flex items-center gap-1"
                  >
                    Tiếp tục
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* BƯỚC 3: XÁC NHẬN LẬP THÔNG BÁO */}
            {debtWizardStep === 3 && selectedRoomDebtData && (
              <div className="space-y-3.5">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-900 text-sm">
                      Phòng {selectedRoomDebtData.roomCode} - {selectedRoomDebtData.tenantName}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800">
                      Thu công nợ
                    </span>
                  </div>

                  {/* Danh sách các tháng được chọn và từng khoản tiền */}
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-500 font-semibold block">Danh sách các tháng nợ được thông báo:</span>
                    <div className="divide-y divide-slate-200/60 bg-white rounded-lg border border-slate-200 p-2">
                      {selectedRoomDebtData.notices
                        .filter(n => selectedDebtNoticeIds.includes(n.id))
                        .map(n => (
                          <div key={n.id} className="py-1.5 flex justify-between items-center text-xs">
                            <div>
                              <span className="font-mono font-bold text-slate-800">{n.periodCode}</span>
                              <span className="text-slate-400 text-[10px] block">Mã gốc: {n.noticeCode} · Hạn: {formatDateDMY(n.dueDate)}</span>
                            </div>
                            <span className="font-mono font-bold text-orange-700">
                              {n.totalAmount.toLocaleString('vi-VN')} đ
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                    <span className="font-bold text-slate-900">TỔNG TIỀN CẦN THU:</span>
                    <span className="font-mono font-extrabold text-orange-700 text-base">
                      {selectedDebtItemsSum.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>

                {/* Hạn thanh toán & Tài khoản ngân hàng nhận tiền */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      Hạn thanh toán <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      min={localDateISO()}
                      value={debtDueDate}
                      onChange={(e) => setDebtDueDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-xs"
                    />
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Hạn thanh toán không được trước ngày phát hành (≥ {formatDateDMY(localDateISO())}).
                    </span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      Tài khoản ngân hàng nhận tiền <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedDebtBankAccountId}
                      onChange={(e) => setSelectedDebtBankAccountId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium text-xs bg-white"
                    >
                      {bankAccounts && bankAccounts.length > 0 ? (
                        bankAccounts.map(b => (
                          <option key={b.id} value={b.id}>
                            {b.bankName} - {b.accountNumber} ({b.accountHolder})
                          </option>
                        ))
                      ) : activeBankAccount ? (
                        <option value={activeBankAccount.id}>
                          {activeBankAccount.bankName} - {activeBankAccount.accountNumber} ({activeBankAccount.accountHolder})
                        </option>
                      ) : (
                        <option value="">Chưa có tài khoản</option>
                      )}
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px]">
                  <strong>Lưu ý:</strong> Khi xác nhận, hệ thống sẽ tạo một thông báo thu công nợ riêng cho phòng này, kèm một mã QR cố định đúng tổng số tiền các tháng đã chọn. Các tháng nợ này sẽ không thể chọn lại cho thông báo thu nợ khác.
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowDebtWizard(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium cursor-pointer"
                  >
                    Hủy
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDebtWizardStep(2)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium cursor-pointer flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Quay lại
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmCreateDebtNotice}
                      className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold cursor-pointer shadow-xs transition-all"
                    >
                      Xác nhận lập thông báo
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REPLACE NOTICE                                                     */}
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
                Hệ thống sẽ <strong>giữ nguyên hạn thanh toán ban đầu của thông báo gốc</strong>, tạo thông báo mới kèm mã QR mới, đồng thời <strong>đánh dấu thông báo cũ là Đã thay thế và vô hiệu hóa mã QR cũ</strong>.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Lý do phát hành bản thay thế <span className="text-red-500">*</span>
              </label>
              <textarea
                value={replaceReason}
                onChange={(e) => setReplaceReason(e.target.value)}
                rows={3}
                placeholder="Ví dụ: Thay đổi tài khoản ngân hàng nhận tiền / Điều chỉnh số tiền..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowReplaceModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleReplaceNoticeSubmit}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold cursor-pointer shadow-xs"
              >
                Xác nhận thay thế thông báo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ZALO SHARE GUIDE                                                   */}
      {/* ========================================================================= */}
      {showShareGuideModal && selectedNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {selectedNotice.noticeType === 'DEBT' ? 'Chia sẻ thông báo thu công nợ qua Zalo' : 'Chia sẻ thông báo qua Zalo'}
              </h3>
              <button
                onClick={() => setShowShareGuideModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 space-y-2">
              <p className="font-bold">Quy định kỹ thuật:</p>
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
                Tải ảnh thông báo PNG về máy ngay
              </button>
              <button
                type="button"
                onClick={() => setShowShareGuideModal(false)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium cursor-pointer"
              >
                Đã hiểu & Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
