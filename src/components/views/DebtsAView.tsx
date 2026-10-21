import { toUserMessage } from '../../utils/userMessages';
import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { PaymentNotice, DebtHistoryReminder, DebtPromise, Contract, Room } from '../../types';
import {
  AlertTriangle, Phone, MessageCircle, UserCheck, Calendar,
  Clock, Plus, Search, FileText, CheckCircle2, AlertCircle, X,
  ShieldAlert, ExternalLink, RefreshCw, Eye, ArrowRight, Check,
  History, Paperclip, ChevronRight, Scale, AlertOctagon, Info,
  Wallet, UserX, HelpCircle, Layers, ChevronDown, ChevronUp,
  Filter, Tag, Building2, QrCode, CheckSquare, Square,
  Download, Copy, Send, Lock
} from 'lucide-react';

// Bảng ánh xạ mã ngân hàng chuẩn VietQR
const banksMap: { [key: string]: string } = {
  'mb bank': 'MB',
  'vietcombank': 'VCB',
  'techcombank': 'TCB',
  'bidv': 'BIDV',
  'vietinbank': 'CTG',
  'vpbank': 'VPB',
  'acb': 'ACB',
  'tpbank': 'TPB',
  'hdbank': 'HDB',
  'sacombank': 'STB',
  'vib': 'VIB',
  'shb': 'SHB',
  'ocb': 'OCB',
  'msb': 'MSB',
  'seabank': 'SSB',
  'nam a bank': 'NAB',
  'bac a bank': 'BAB',
  'pvcombank': 'PVCOM',
  'dong a bank': 'DAB',
  'saigonbank': 'SGB',
  'kienlongbank': 'KLB',
  'vietbank': 'VIETBANK',
  'pgbank': 'PGB',
  'public bank': 'PBVN',
  'viet capital bank': 'BVBank'
};

const getBankCodeFromName = (bankName: string): string => {
  const bLower = (bankName || '').toLowerCase();
  return Object.entries(banksMap).find(([name]) => bLower.includes(name))?.[1] || '';
};

/**
 * Interface cho từng kỳ công nợ độc lập
 * Mỗi kỳ nợ của phòng được tách riêng thành một dòng dữ liệu
 */
export interface PeriodDebtItem {
  id: string; // ID định danh duy nhất cho kỳ công nợ
  noticeId: string; // ID thông báo nguồn
  noticeCode: string;
  roomCode: string;
  tenantName: string;
  contractId?: string;
  leaseId: string;
  periodCode: string; // Tên kỳ công nợ, ví dụ: 'Kỳ 08/2026', 'Kỳ 09/2026', 'Kỳ 10/2026'
  dueDate: string; // Hạn thanh toán gốc của kỳ (YYYY-MM-DD)
  overdueDays: number; // Số ngày quá hạn
  rentAmount: number; // Tiền thuê phòng kỳ này
  utilityAmount: number; // Tiền điện nước và phí dịch vụ kỳ này
  totalAmount: number; // Tổng tiền phải thu kỳ này
  uncollectedBalance: number; // Dư nợ còn phải thu sau các khoản bù cọc đã ghi nhận
  isPaid: boolean;
  isOverdue: boolean;
  isRoomVacant: boolean;
  noticeType?: 'PERIOD' | 'DEBT';
  breakdownNote?: string;
  room?: Room;
  contract?: Contract;
  originalNotice: PaymentNotice;
}

// Format ngày YYYY-MM-DD sang DD/MM/YYYY
const formatDateDMY = (dateStr?: string): string => {
  if (!dateStr) return '—';
  const clean = dateStr.slice(0, 10);
  const parts = clean.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

// Chuẩn hóa tên kỳ nợ (ví dụ: 'Kỳ 08/2026')
const normalizePeriodCode = (raw?: string): string => {
  if (!raw) return 'Kỳ không xác định';
  const match = raw.match(/Kỳ\s*\d{1,2}\/\d{4}/i);
  if (match) return match[0].trim();
  const monthMatch = raw.match(/\d{1,2}\/\d{4}/);
  if (monthMatch) return `Kỳ ${monthMatch[0]}`;
  return raw.trim();
};

// Phân giải hạn thanh toán YYYY-MM-DD
const parseDueDateISO = (dateStr?: string, fallback = '2026-10-05'): string => {
  if (!dateStr) return fallback;
  const clean = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(clean)) return clean.slice(0, 10);
  const dmy = clean.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dmy) {
    return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
  }
  return fallback;
};

export interface DebtsViewProps {
  onNavigate?: (tab: any, record?: { roomCode?: string; contractId?: string; tenantId?: string; leaseId?: string; billId?: string; noticeId?: string }) => void;
}

export const DebtsAView: React.FC<DebtsViewProps> = ({ onNavigate }) => {
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
    updateNoticeDueDate,
    contracts,
    rooms,
    tenants,
    bankAccounts,
    activeBankAccount,
    currentUser,
    currentSession
  } = useApp();

  // Multi-selection of debt period items for reminder / promise (Giới hạn theo phòng)
  const [selectedPeriodIds, setSelectedPeriodIds] = useState<string[]>([]);

  // State hỗ trợ sao chép và chia sẻ ngoài cho khách hàng
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [historyQrModalReminder, setHistoryQrModalReminder] = useState<DebtHistoryReminder | null>(null);

  // Navigation tab for QT09
  const [activeTab, setActiveTab] = useState<'overdue_list' | 'reminders' | 'promises' | 'long_debt_cn04'>('overdue_list');

  // View mode for debts: 'flat_periods' (Tách từng kỳ) vs 'grouped_by_room' (Gom theo phòng & tách kỳ bên dưới)
  const [viewMode, setViewMode] = useState<'flat_periods' | 'grouped_by_room'>('flat_periods');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [roomFilter, setRoomFilter] = useState('Tất cả');
  const [selectedPeriodFilter, setSelectedPeriodFilter] = useState('Tất cả');
  const [leaseStatusFilter, setLeaseStatusFilter] = useState<'Tất cả' | 'Đang thuê' | 'Đã trả phòng'>('Tất cả');

  // Toast feedback
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; message: string } | null>(null);
  const showToast = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4500);
  };

  // Test Simulation Toggles for QT09
  const [simulateEF01, setSimulateEF01] = useState(false); // Không tải được nghĩa vụ/thu tiền từ nguồn
  const [simulateEF02, setSimulateEF02] = useState(false); // Liên kết thông báo và khoản thu không khớp

  // Selected Debt Item for modals / CN-04 detail view
  const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null);

  // Expanded room cards in 'grouped_by_room' mode
  const [expandedRooms, setExpandedRooms] = useState<Record<string, boolean>>({});
  const toggleRoomExpand = (roomCode: string) => {
    setExpandedRooms(prev => ({ ...prev, [roomCode]: !prev[roomCode] }));
  };

  // Modals
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showPromiseModal, setShowPromiseModal] = useState(false);
  const [showAllInvoicesModal, setShowAllInvoicesModal] = useState(false);

  // Form states - Reminder
  const [remDate, setRemDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [remChannel, setRemChannel] = useState<'Zalo' | 'Điện thoại' | 'Gặp trực tiếp'>('Zalo');
  const [remResult, setRemResult] = useState('');
  const [remNotes, setRemNotes] = useState('');
  const [remProofFile, setRemProofFile] = useState('');
  const [remIsRetrospective, setRemIsRetrospective] = useState(false);
  const [remConfirmedContact, setRemConfirmedContact] = useState(true);

  // State kiểm soát chỉ hiển thị mã QR khi đã ấn lưu lịch sử nhắc nợ
  const [remSavedSuccess, setRemSavedSuccess] = useState(false);
  const [savedReminderDetails, setSavedReminderDetails] = useState<{
    loggedAt: string;
    channel: string;
    result: string;
    roomCode: string;
    periods: string;
  } | null>(null);

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

  // Base date helpers
  const todayDateOnly = (d: Date) => {
    const copy = new Date(d);
    copy.setHours(0, 0, 0, 0);
    return copy;
  };
  const todayMs = todayDateOnly(new Date()).getTime();

  // =========================================================================
  // ==================== TÁCH CÁC KỲ CÔNG NỢ RA & BỎ BÙ CỌC ====================
  // =========================================================================
  // 1. Tách từng kỳ công nợ:
  //    - Không gom nợ chung hay gộp nhiều kỳ thành 1 dòng.
  //    - Nếu thông báo có nhiều kỳ nợ thành phần (noticeType === 'DEBT' có items),
  //      tách thành từng dòng kỳ công nợ tương ứng (Kỳ 08, Kỳ 09,...).
  // 2. Bỏ hoàn toàn cơ chế xử lý bù cọc:
  //    - Dư nợ chưa thu = Tổng tiền phải thu trừ số tiền đã thu chuyển khoản.
  //    - Không cấn trừ cọc gốc của phòng vào công nợ.
  const allPeriodDebtItems = useMemo<PeriodDebtItem[]>(() => {
    const items: PeriodDebtItem[] = [];

    paymentNotices.forEach(n => {
      // Bỏ qua thông báo gộp (DEBT): các kỳ nguồn đã được hạch toán phía dưới.
      // DEBT chỉ là phương thức thu gộp, không được cộng thêm nghĩa vụ lần hai.
      if (n.status === 'Đã thay thế' || (n.noticeType === 'DEBT' && n.debtNoticeIds?.some(id => paymentNotices.some(p => p.id === id)))) return;

      const room = rooms.find(r => r.roomCode === n.roomCode);
      const contract = contracts.find(c => c.roomCode === n.roomCode && (c.id === room?.currentContractId || c.status === 'Hiệu lực'));
      const activeReceipt = paymentReceipts.find(r => r.noticeId === n.id && r.status === 'Đang hiệu lực');
      const isPaid = !!activeReceipt || n.paymentStatus === 'Đã thu' || n.paymentStatus === 'Đã xử lý bằng cọc';
      // B là nguồn chuẩn cho quyết toán cọc; giữ cấn trừ theo từng chứng từ gốc.
      const settlement = settlementSlips.find(sl => sl.roomCode === n.roomCode && sl.leaseId === n.leaseId && sl.step58Published && ['Đã có kết quả – chờ ký biên bản', 'Hoàn tất'].includes(sl.status));
      const debtOffset = (settlement?.deductions || []).filter(d => d.category === 'Công nợ kỳ trước' && (d.id === 'ded_overdue_' + n.id || d.description.includes(n.noticeCode))).reduce((sum, d) => sum + d.amount, 0);
      const remainingDebt = isPaid ? 0 : Math.max(0, n.totalAmount - debtOffset);
      const isRoomVacant = room?.status === 'Trống';
      const tenantName = n.tenantName || contract?.tenantName || room?.currentTenantName || 'Khách thuê';

      // Trường hợp 1: Thông báo công nợ gộp nhiều kỳ (noticeType === 'DEBT')
      // TÁCH RA THÀNH TỪNG KỲ CÔNG NỢ RIÊNG BIỆT
      if (n.noticeType === 'DEBT' && n.breakdown?.items && n.breakdown.items.length > 0) {
        n.breakdown.items.forEach((subItem, idx) => {
          const subPeriod = normalizePeriodCode(subItem.name) || normalizePeriodCode(n.periodCode);
          const subDueDate = parseDueDateISO(subItem.note, n.originalDueDate || n.dueDate);
          const subDueTime = todayDateOnly(new Date(subDueDate)).getTime();
          const subOverdue = !isPaid && subItem.amount > 0 && todayMs > subDueTime;
          const subOverdueDays = subOverdue ? Math.max(1, Math.ceil((todayMs - subDueTime) / (1000 * 60 * 60 * 24))) : 0;
          const subRentAmount = subItem.amount > 1000000 ? Math.round(subItem.amount * 0.85) : 0;
          const subUtilityAmount = subItem.amount - subRentAmount;

          items.push({
            id: `${n.id}_sub_${idx}`,
            noticeId: n.id,
            noticeCode: n.noticeCode,
            roomCode: n.roomCode,
            tenantName,
            contractId: contract?.id,
            leaseId: n.leaseId,
            periodCode: subPeriod,
            dueDate: subDueDate,
            overdueDays: subOverdueDays,
            rentAmount: subRentAmount,
            utilityAmount: subUtilityAmount,
            totalAmount: subItem.amount,
            uncollectedBalance: isPaid ? 0 : subItem.amount, // Bỏ bù cọc
            isPaid,
            isOverdue: subOverdue,
            isRoomVacant,
            noticeType: 'DEBT',
            breakdownNote: subItem.name,
            room,
            contract,
            originalNotice: n
          });
        });
      } else {
        // Trường hợp 2: Thông báo theo kỳ chuẩn
        const periodCode = normalizePeriodCode(n.periodCode);
        const dueDate = n.originalDueDate || n.dueDate;
        const dueTime = todayDateOnly(new Date(dueDate)).getTime();
        const isOverdue = !isPaid && remainingDebt > 0 && todayMs > dueTime;
        const overdueDays = isOverdue ? Math.max(1, Math.ceil((todayMs - dueTime) / (1000 * 60 * 60 * 24))) : 0;

        const rentAmount = n.breakdown?.nextRentAmount || 0;
        const utilityAmount = (n.breakdown?.electricityAmount || 0) +
          (n.breakdown?.waterAmount || 0) +
          (n.breakdown?.serviceFees?.reduce((sum, f) => sum + f.amount, 0) || 0) +
          (n.breakdown?.adjustmentAmount || 0);

        items.push({
          id: n.id,
          noticeId: n.id,
          noticeCode: n.noticeCode,
          roomCode: n.roomCode,
          tenantName,
          contractId: contract?.id,
          leaseId: n.leaseId,
          periodCode,
          dueDate,
          overdueDays,
          rentAmount,
          utilityAmount,
          totalAmount: n.totalAmount,
          uncollectedBalance: remainingDebt, // Đã trừ cấn cọc đúng khoản theo B
          isPaid,
          isOverdue,
          isRoomVacant,
          noticeType: n.noticeType || 'PERIOD',
          room,
          contract,
          originalNotice: n
        });
      }
    });

    return items;
  }, [paymentNotices, rooms, contracts, paymentReceipts, settlementSlips, todayMs]);

  // Danh sách các kỳ công nợ QUÁ HẠN chưa thu
  const overdueDebtList = useMemo(() => {
    if (simulateEF01) return [];

    return allPeriodDebtItems.filter(item => {
      // Chỉ lấy các kỳ đang quá hạn và chưa thu
      if (!item.isOverdue || item.uncollectedBalance <= 0) return false;

      // Bộ lọc theo phòng
      if (roomFilter !== 'Tất cả' && item.roomCode !== roomFilter) return false;

      // Bộ lọc theo kỳ công nợ
      if (selectedPeriodFilter !== 'Tất cả' && item.periodCode !== selectedPeriodFilter) return false;

      // Bộ lọc theo tình trạng cư trú
      if (leaseStatusFilter === 'Đang thuê' && item.isRoomVacant) return false;
      if (leaseStatusFilter === 'Đã trả phòng' && !item.isRoomVacant) return false;

      // Tìm kiếm từ khóa
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = item.noticeCode.toLowerCase().includes(q);
        const matchRoom = item.roomCode.toLowerCase().includes(q);
        const matchTenant = item.tenantName.toLowerCase().includes(q);
        const matchPeriod = item.periodCode.toLowerCase().includes(q);
        return matchCode || matchRoom || matchTenant || matchPeriod;
      }

      return true;
    }).sort((a, b) => {
      // Sắp xếp kỳ quá hạn lâu nhất lên đầu
      return b.overdueDays - a.overdueDays;
    });
  }, [allPeriodDebtItems, roomFilter, selectedPeriodFilter, leaseStatusFilter, searchQuery, simulateEF01]);

  // Danh sách duy nhất các kỳ công nợ để lọc
  const uniqueDebtPeriods = useMemo(() => {
    const periods = Array.from(new Set(allPeriodDebtItems.filter(i => i.isOverdue && i.uncollectedBalance > 0).map(i => i.periodCode)));
    return periods.sort().reverse();
  }, [allPeriodDebtItems]);

  // Đếm số lượng khoản nợ theo từng kỳ
  const periodDebtCounts = useMemo(() => {
    const counts: Record<string, { count: number; totalAmount: number }> = {};
    allPeriodDebtItems.filter(i => i.isOverdue && i.uncollectedBalance > 0).forEach(i => {
      if (!counts[i.periodCode]) {
        counts[i.periodCode] = { count: 0, totalAmount: 0 };
      }
      counts[i.periodCode].count += 1;
      counts[i.periodCode].totalAmount += i.uncollectedBalance;
    });
    return counts;
  }, [allPeriodDebtItems]);

  // Gom nợ theo phòng (kèm chi tiết các kỳ nợ bên trong)
  const groupedByRoomList = useMemo(() => {
    const map = new Map<string, {
      roomCode: string;
      tenantName: string;
      isRoomVacant: boolean;
      totalRoomDebt: number;
      maxOverdueDays: number;
      periods: PeriodDebtItem[];
    }>();

    overdueDebtList.forEach(item => {
      const existing = map.get(item.roomCode);
      if (!existing) {
        map.set(item.roomCode, {
          roomCode: item.roomCode,
          tenantName: item.tenantName,
          isRoomVacant: item.isRoomVacant,
          totalRoomDebt: item.uncollectedBalance,
          maxOverdueDays: item.overdueDays,
          periods: [item]
        });
      } else {
        existing.totalRoomDebt += item.uncollectedBalance;
        existing.maxOverdueDays = Math.max(existing.maxOverdueDays, item.overdueDays);
        existing.periods.push(item);
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalRoomDebt - a.totalRoomDebt);
  }, [overdueDebtList]);

  // Xác định mã phòng đang được chọn (giới hạn chọn kỳ nợ trong cùng 1 phòng)
  const selectedRoomCode = useMemo(() => {
    if (selectedPeriodIds.length === 0) return null;
    const firstItem = overdueDebtList.find(i => selectedPeriodIds.includes(i.id)) ||
      allPeriodDebtItems.find(i => selectedPeriodIds.includes(i.id));
    return firstItem ? firstItem.roomCode : null;
  }, [selectedPeriodIds, overdueDebtList, allPeriodDebtItems]);

  // Toggle selection for a single period item - GIỚI HẠN CHỈ TRONG CÙNG MỘT PHÒNG
  const toggleSelectPeriod = (target: PeriodDebtItem | string) => {
    const item = typeof target === 'string'
      ? (overdueDebtList.find(i => i.id === target) || allPeriodDebtItems.find(i => i.id === target))
      : target;
    if (!item) return;

    // Nếu chưa chọn kỳ nào hoặc kỳ thuộc cùng phòng với phòng đang chọn
    if (!selectedRoomCode || selectedRoomCode === item.roomCode) {
      setSelectedPeriodIds(prev =>
        prev.includes(item.id) ? prev.filter(x => x !== item.id) : [...prev, item.id]
      );
      setSelectedDebtId(item.id);
    } else {
      // Khi bấm sang kỳ của phòng khác: chuyển toàn bộ vùng chọn sang phòng mới này
      setSelectedPeriodIds([item.id]);
      setSelectedDebtId(item.id);
      showToast('info', `Giới hạn theo phòng: Đã chuyển sang chọn các kỳ nợ của Phòng ${item.roomCode}`);
    }
  };

  // Toggle select all visible overdue items - GIỚI HẠN CHỈ TRONG CÙNG MỘT PHÒNG
  const toggleSelectAllVisible = () => {
    if (overdueDebtList.length === 0) return;
    if (selectedRoomCode) {
      const roomVisibleIds = overdueDebtList.filter(i => i.roomCode === selectedRoomCode).map(i => i.id);
      const isRoomAllSelected = roomVisibleIds.length > 0 && roomVisibleIds.every(id => selectedPeriodIds.includes(id));
      if (isRoomAllSelected) {
        setSelectedPeriodIds([]);
      } else {
        setSelectedPeriodIds(roomVisibleIds);
      }
    } else {
      // Chưa chọn phòng nào: Chọn tất cả các kỳ của phòng đầu tiên hiển thị
      const firstRoom = overdueDebtList[0].roomCode;
      const roomVisibleIds = overdueDebtList.filter(i => i.roomCode === firstRoom).map(i => i.id);
      setSelectedPeriodIds(roomVisibleIds);
      showToast('info', `Đã chọn tất cả ${roomVisibleIds.length} kỳ nợ của Phòng ${firstRoom} (giới hạn theo phòng)`);
    }
  };

  // Toggle selection for all periods of a specific room
  const toggleSelectRoom = (roomCode: string) => {
    const roomPeriodIds = overdueDebtList.filter(i => i.roomCode === roomCode).map(i => i.id);
    const isRoomAllSelected = roomPeriodIds.length > 0 && roomPeriodIds.every(id => selectedPeriodIds.includes(id));
    if (isRoomAllSelected) {
      setSelectedPeriodIds([]);
    } else {
      setSelectedPeriodIds(roomPeriodIds);
      if (roomPeriodIds.length > 0) {
        setSelectedDebtId(roomPeriodIds[0]);
      }
      showToast('info', `Đã chọn tất cả ${roomPeriodIds.length} kỳ nợ của Phòng ${roomCode}`);
    }
  };

  // Items currently selected by checkboxes
  const selectedPeriodDebtItems = useMemo(() => {
    if (selectedPeriodIds.length > 0) {
      return overdueDebtList.filter(i => selectedPeriodIds.includes(i.id));
    }
    if (selectedDebtId) {
      const item = allPeriodDebtItems.find(i => i.id === selectedDebtId);
      return item ? [item] : [];
    }
    return [];
  }, [selectedPeriodIds, selectedDebtId, overdueDebtList, allPeriodDebtItems]);

  const totalSelectedDebt = useMemo(() => {
    return selectedPeriodDebtItems.reduce((sum, item) => sum + item.uncollectedBalance, 0);
  }, [selectedPeriodDebtItems]);

  // Khoản nợ đang được chọn để xem hoặc ghi nhận hành động
  const activeSelectedDebt = useMemo(() => {
    if (selectedPeriodDebtItems.length > 0) {
      return selectedPeriodDebtItems[0];
    }
    if (selectedDebtId) {
      return allPeriodDebtItems.find(i => i.id === selectedDebtId) || overdueDebtList[0] || null;
    }
    return overdueDebtList[0] || null;
  }, [selectedPeriodDebtItems, allPeriodDebtItems, selectedDebtId, overdueDebtList]);

  // Thông tin VietQR tương ứng với lần nhắc nợ đang mở (hỗ trợ gửi ngoài cho khách hàng)
  const reminderQrDetails = useMemo(() => {
    if (!activeSelectedDebt) {
      return {
        bankName: 'MB Bank',
        accountNumber: '',
        accountHolder: '',
        bankCode: 'MB',
        transferContent: '',
        amount: 0,
        qrUrl: '',
        tenantPhone: ''
      };
    }

    const snapshot = activeSelectedDebt.originalNotice?.qrBankSnapshot;
    const defaultBank = activeBankAccount || (bankAccounts && bankAccounts[0]) || {
      bankName: 'MB Bank',
      accountNumber: '0987654321',
      accountHolder: 'CHỦ NHÀ'
    };

    const bankName = snapshot?.bankName || defaultBank.bankName || ''; 
    const accountNumber = snapshot?.accountNumber || defaultBank.accountNumber || '';
    const accountHolder = snapshot?.accountHolder || defaultBank.accountHolder || '';
    const amount = totalSelectedDebt > 0 ? totalSelectedDebt : activeSelectedDebt.uncollectedBalance;

    const roomClean = activeSelectedDebt.roomCode.replace(/\s+/g, '').toUpperCase();
    const periodsList = selectedPeriodDebtItems.length > 0 ? selectedPeriodDebtItems : [activeSelectedDebt];
    const periodTokens = periodsList
      .map(p => p.periodCode.replace(/Kỳ\s*/i, '').replace('/', ''))
      .join(' ');
    const transferContent = snapshot?.transferContent || `${roomClean} TT NO ${periodTokens}`.trim();

    const bankCode = getBankCodeFromName(bankName);
    const qrUrl = bankCode && accountNumber
      ? `https://img.vietqr.io/image/${bankCode}-${encodeURIComponent(accountNumber)}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(accountHolder)}`
      : '';

    const room = rooms.find(r => r.roomCode === activeSelectedDebt.roomCode);
    const tenant = tenants?.find(t => t.id === room?.currentTenantId || t.fullName === activeSelectedDebt.tenantName);
    const tenantPhone = activeSelectedDebt.contract?.tenantPhone ||
      contracts.find(c => c.roomCode === activeSelectedDebt.roomCode)?.tenantPhone ||
      tenant?.phoneNumber || '';

    return {
      bankName,
      accountNumber,
      accountHolder,
      bankCode,
      transferContent,
      amount,
      qrUrl,
      tenantPhone
    };
  }, [activeSelectedDebt, selectedPeriodDebtItems, totalSelectedDebt, activeBankAccount, bankAccounts, rooms, contracts, tenants]);

  // Soạn sẵn tin nhắn nhắc nợ gửi khách hàng (hỗ trợ gửi ngoài qua Zalo / SMS / Messenger)
  const getCustomerMessageText = (customDebt?: PeriodDebtItem, customQr?: typeof reminderQrDetails) => {
    const debt = customDebt || activeSelectedDebt;
    if (!debt) return '';
    const qr = customQr || reminderQrDetails;
    const periodsList = selectedPeriodDebtItems.length > 0 && (!customDebt || customDebt.id === activeSelectedDebt?.id)
      ? selectedPeriodDebtItems
      : [debt];
    const periodNames = periodsList
      .map(p => `${p.periodCode} (${p.uncollectedBalance.toLocaleString('vi-VN')} đ)`)
      .join(', ');

    return `[THÔNG BÁO NHẮC NỢ TIỀN PHÒNG]
Kính gửi: Anh/Chị ${debt.tenantName} (Phòng ${debt.roomCode})
Ban Quản lý xin gửi thông tin nhắc thanh toán các kỳ công nợ hiện còn chưa thu:
- Các kỳ nợ: ${periodNames}
- Tổng số tiền cần thanh toán: ${qr.amount.toLocaleString('vi-VN')} đ
- Hạn thanh toán: ${formatDateDMY(debt.dueDate)}

THÔNG TIN CHUYỂN KHOẢN THANH TOÁN:
- Ngân hàng: ${qr.bankName}
- Số tài khoản: ${qr.accountNumber}
- Chủ tài khoản: ${qr.accountHolder}
- Số tiền: ${qr.amount.toLocaleString('vi-VN')} đ
- Nội dung CK: ${qr.transferContent}

(Quý khách vui lòng quét mã VietQR kèm theo hoặc chuyển khoản chính xác thông tin trên để hệ thống tự động gạch nợ. Trân trọng cảm ơn!)`;
  };

  // Tải ảnh mã VietQR xuống thiết bị để gửi khách ngoài
  const handleDownloadQrImage = async (url?: string, roomCode?: string) => {
    const targetUrl = url || reminderQrDetails.qrUrl;
    const targetRoom = roomCode || activeSelectedDebt?.roomCode || 'Phong';
    if (!targetUrl) return;
    try {
      const response = await fetch(targetUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `VietQR_No_Phong_${targetRoom}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      showToast('success', 'Đã tải ảnh mã VietQR xuống thiết bị thành công!');
    } catch {
      const a = document.createElement('a');
      a.href = targetUrl;
      a.target = '_blank';
      a.download = `VietQR_No_Phong_${targetRoom}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('info', 'Đang mở ảnh QR để bạn lưu hoặc gửi cho khách!');
    }
  };

  // Sao chép ảnh mã QR hoặc đường link QR vào bộ nhớ đệm
  const handleCopyQrImage = async (url?: string) => {
    const targetUrl = url || reminderQrDetails.qrUrl;
    if (!targetUrl) return;
    try {
      const res = await fetch(targetUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      setCopiedField('qrImage');
      showToast('success', 'Đã sao chép ảnh mã QR vào clipboard! Bạn có thể dán (Ctrl+V) ngay vào Zalo.');
      setTimeout(() => setCopiedField(null), 2500);
    } catch {
      await navigator.clipboard.writeText(targetUrl);
      setCopiedField('qrLink');
      showToast('info', 'Đã sao chép đường link ảnh VietQR để gửi cho khách!');
      setTimeout(() => setCopiedField(null), 2500);
    }
  };

  // Sao chép văn bản với toast phản hồi
  const handleCopyText = (text: string, fieldName: string, successMsg: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(fieldName);
      showToast('success', successMsg);
      setTimeout(() => setCopiedField(null), 2500);
    }).catch(() => {
      showToast('warning', 'Không thể tự động sao chép. Vui lòng chọn và copy thủ công.');
    });
  };

  // Mở Zalo và tự động sao chép tin nhắn nhắc nợ
  const handleOpenZalo = (phone?: string, customMsg?: string) => {
    const msg = customMsg || getCustomerMessageText();
    const targetPhone = (phone || reminderQrDetails.tenantPhone || '').replace(/\D/g, '');
    navigator.clipboard.writeText(msg).then(() => {
      showToast('success', 'Đã sao chép tin nhắn nhắc nợ! Đang mở Zalo để bạn dán (Ctrl+V) gửi khách...');
      if (targetPhone) {
        window.open(`https://zalo.me/${targetPhone}`, '_blank');
      } else {
        window.open('https://chat.zalo.me', '_blank');
      }
    });
  };

  // Thông tin VietQR tương ứng khi xem lại một lần nhắc nợ lịch sử trong Tab 2
  const historyQrDetails = useMemo(() => {
    if (!historyQrModalReminder) return null;
    const item = allPeriodDebtItems.find(i => i.noticeId === historyQrModalReminder.noticeId || i.roomCode === historyQrModalReminder.roomCode);
    const snapshot = item?.originalNotice?.qrBankSnapshot;
    const defaultBank = activeBankAccount || (bankAccounts && bankAccounts[0]) || {
      bankName: 'MB Bank',
      accountNumber: '0987654321',
      accountHolder: 'CHỦ NHÀ'
    };
    const bankName = snapshot?.bankName || defaultBank.bankName || ''; 
    const accountNumber = snapshot?.accountNumber || defaultBank.accountNumber || '';
    const accountHolder = snapshot?.accountHolder || defaultBank.accountHolder || '';
    const amount = item?.uncollectedBalance || item?.totalAmount || 0;
    const bankCode = getBankCodeFromName(bankName);
    const roomClean = historyQrModalReminder.roomCode.replace(/\s+/g, '').toUpperCase();
    const transferContent = snapshot?.transferContent || `${roomClean} TT NO`.trim();
    const qrUrl = bankCode && accountNumber
      ? `https://img.vietqr.io/image/${bankCode}-${encodeURIComponent(accountNumber)}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(accountHolder)}`
      : '';
    const room = rooms.find(r => r.roomCode === historyQrModalReminder.roomCode);
    const tenant = tenants?.find(t => t.id === room?.currentTenantId);
    const tenantPhone = item?.contract?.tenantPhone ||
      contracts.find(c => c.roomCode === historyQrModalReminder.roomCode)?.tenantPhone ||
      tenant?.phoneNumber || '';

    return {
      item,
      bankName,
      accountNumber,
      accountHolder,
      bankCode,
      amount,
      transferContent,
      qrUrl,
      tenantPhone
    };
  }, [historyQrModalReminder, allPeriodDebtItems, activeBankAccount, bankAccounts, rooms, contracts, tenants]);

  // Open modal helpers
  const openReminderModal = (item?: PeriodDebtItem) => {
    if (item) {
      setSelectedDebtId(item.id);
      setSelectedPeriodIds([item.id]);
    } else if (selectedPeriodIds.length === 0 && overdueDebtList.length > 0) {
      setSelectedPeriodIds([overdueDebtList[0].id]);
      setSelectedDebtId(overdueDebtList[0].id);
    }
    setRemSavedSuccess(false);
    setSavedReminderDetails(null);
    setShowReminderModal(true);
  };

  const openPromiseModal = (item?: PeriodDebtItem) => {
    if (item) {
      setSelectedDebtId(item.id);
      setSelectedPeriodIds([item.id]);
      setPromDate(item.dueDate || new Date().toISOString().split('T')[0]);
    } else if (selectedPeriodDebtItems.length > 0) {
      setPromDate(selectedPeriodDebtItems[0].dueDate || new Date().toISOString().split('T')[0]);
    } else if (overdueDebtList.length > 0) {
      setSelectedPeriodIds([overdueDebtList[0].id]);
      setSelectedDebtId(overdueDebtList[0].id);
      setPromDate(overdueDebtList[0].dueDate || new Date().toISOString().split('T')[0]);
    }
    setShowPromiseModal(true);
  };

  // Summary statistics (sau bù cọc đúng khoản theo bản B)
  const totalOverduePeriodsCount = overdueDebtList.length;
  const totalOverdueAmount = overdueDebtList.reduce((sum, item) => sum + item.uncollectedBalance, 0);
  const totalDebtorRoomsCount = groupedByRoomList.length;

  // Kỳ nợ quá hạn lâu nhất
  const oldestOverdueDebt = overdueDebtList[0];

  // Các khoản chưa thu nhưng còn trong hạn (theo dõi ở Thu tiền)
  const pendingWithinDueDateCount = allPeriodDebtItems.filter(i => !i.isPaid && !i.isOverdue && i.uncollectedBalance > 0).length;

  // Reminders and Promises cho khoản nợ đang chọn
  const activeNoticeReminders = useMemo(() => {
    if (!activeSelectedDebt) return [];
    return debtReminders.filter(r => r.noticeId === activeSelectedDebt.noticeId || r.roomCode === activeSelectedDebt.roomCode);
  }, [debtReminders, activeSelectedDebt]);

  const activeNoticePromises = useMemo(() => {
    if (!activeSelectedDebt) return [];
    return debtPromises.filter(p => p.noticeId === activeSelectedDebt.noticeId || p.roomCode === activeSelectedDebt.roomCode);
  }, [debtPromises, activeSelectedDebt]);

  // Đánh giá căn cứ xử lý nợ kéo dài (UC-CN-04)
  const prolongedDebtAssessment = useMemo(() => {
    if (!activeSelectedDebt) return { status: 'Chưa chọn khoản nợ', badgeColor: 'bg-slate-100 text-slate-600', reasons: [] };
    const reasons = [
      `Kỳ công nợ: ${activeSelectedDebt.periodCode} (Hạn thanh toán gốc: ${formatDateDMY(activeSelectedDebt.dueDate)}).`,
      `Số ngày quá hạn: ${activeSelectedDebt.overdueDays} ngày; dư nợ kỳ này: ${activeSelectedDebt.uncollectedBalance.toLocaleString('vi-VN')} đ.`,
      `Đã ghi nhận ${activeNoticeReminders.length} lần nhắc thanh toán.`,
      `Có ${activeNoticePromises.length} lần ghi nhận phản hồi hoặc hẹn thanh toán của khách.`,
    ];
    if (activeNoticePromises.some(p => p.needsVerificationASIS08)) {
      reasons.push('Có thông tin khách báo chuyển tiền đang chờ xác minh giao dịch tại Thu tiền.');
    }
    return {
      status: 'Căn cứ để Chủ nhà xem xét',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-300',
      reasons
    };
  }, [activeSelectedDebt, activeNoticeReminders, activeNoticePromises]);

  // =========================================================================
  // ==================== FORM ACTIONS ====================
  // =========================================================================

  // Lưu nhật ký nhắc nợ và điều hướng lấy mã QR tương ứng
  const handleSaveReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSelectedDebt) return;

    if (!remConfirmedContact) {
      showToast('error', 'Lỗi: User chưa xác nhận đã thực sự liên hệ khách. Không thể lưu lịch sử nhắc nợ.');
      return;
    }

    const targetItems = selectedPeriodDebtItems.length > 0 ? selectedPeriodDebtItems : [activeSelectedDebt];
    const periodListText = targetItems.map(t => t.periodCode).join(', ');
    const primaryItem = targetItems[0];

    let lastResult = { success: false, message: '' };
    targetItems.forEach(item => {
      lastResult = recordDebtReminder09_2({
        noticeId: item.noticeId,
        roomCode: item.roomCode,
        leaseId: item.leaseId,
        contactDate: remDate,
        channel: remChannel,
        result: `[${item.periodCode}] ${remResult.trim()}`,
        notes: remNotes.trim() ? `[Kỳ: ${item.periodCode}] ${remNotes.trim()}` : `[Kỳ: ${item.periodCode}]`,
        proofFile: remProofFile.trim() || undefined,
        isRetrospective: remIsRetrospective,
        tenantConfirmedContact: remConfirmedContact
      });
    });

    if (lastResult.success) {
      showToast('success', `Đã lưu thành công lịch sử nhắc nợ cho ${targetItems.length} kỳ của Phòng ${primaryItem.roomCode}! Mã QR thanh toán nợ đã được xuất kèm.`);
      setRemSavedSuccess(true);
      setSavedReminderDetails({
        loggedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + formatDateDMY(new Date().toISOString().split('T')[0]),
        channel: remChannel,
        result: remResult.trim(),
        roomCode: primaryItem.roomCode,
        periods: periodListText
      });
    } else {
      showToast('error', toUserMessage(lastResult.message));
    }
  };

  // Đóng form nhắc nợ và đặt lại trạng thái
  const handleCloseReminderModal = () => {
    setShowReminderModal(false);
    setRemSavedSuccess(false);
    setSavedReminderDetails(null);
    setRemResult('');
    setRemNotes('');
    setRemProofFile('');
    setSelectedPeriodIds([]);
  };

  // Lưu phản hồi & hẹn thanh toán (đồng bộ với hạn thanh toán bên chức năng thu tiền)
  const handleSavePromise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSelectedDebt) return;

    if (promHasDate && !promDate) {
      showToast('error', 'Lỗi: Vui lòng nhập ngày hẹn thanh toán (hoặc tắt tùy chọn Có hẹn).');
      return;
    }

    const targetItems = selectedPeriodDebtItems.length > 0 ? selectedPeriodDebtItems : [activeSelectedDebt];
    const periodListText = targetItems.map(t => t.periodCode).join(', ');

    targetItems.forEach(item => {
      recordDebtPromise09_3({
        noticeId: item.noticeId,
        roomCode: item.roomCode,
        contactTime: promContactTime,
        channel: promChannel,
        content: `[${item.periodCode}] ${promContent.trim()}`,
        hasPromiseDate: promHasDate,
        promisedDate: promHasDate ? promDate : undefined,
        proofFile: promProofFile.trim() || undefined,
        needsVerificationASIS08: promCustomerReportedPaid,
        verificationNote: promCustomerReportedPaid ? `Khách báo đã chuyển khoản cho ${item.periodCode}, chờ tra soát tài khoản ngân hàng` : undefined
      });

      // Cập nhật ngày hẹn thanh toán nợ tương ứng với ngày hạn thanh toán bên chức năng thu tiền
      if (promHasDate && promDate) {
        updateNoticeDueDate(item.noticeId, promDate);
      }
    });

    showToast('success', `Đã ghi nhận phản hồi và đồng bộ hạn thanh toán bên chức năng thu tiền (${periodListText})!`);
    setShowPromiseModal(false);
    setPromContent('');
    setPromProofFile('');
    setPromCustomerReportedPaid(false);
    setSelectedPeriodIds([]);
  };

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification Container */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 transition-all duration-300 transform scale-100 animate-in fade-in slide-in-from-top-4">
          <div className={`px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-semibold border ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-900/30' : toast.type === 'warning'
              ? 'bg-amber-600 text-white border-amber-500 shadow-amber-900/30' : toast.type === 'info'
              ? 'bg-blue-600 text-white border-blue-500 shadow-blue-900/30' : 'bg-red-600 text-white border-red-500 shadow-red-900/30'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-200" />
            ) : toast.type === 'info' ? (
              <Info className="w-4 h-4 shrink-0 text-blue-200" />
            ) : (
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
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
              Tách theo từng kỳ nợ
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi chi tiết công nợ quá hạn độc lập theo từng kỳ, đôn đốc nhắc nợ và ghi nhận ngày hẹn thanh toán.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAllInvoicesModal(true)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            Tra cứu tất cả khoản (Hiệu lực / Tất toán)
          </button>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="rounded-xl bg-white border border-slate-200 p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('overdue_list')}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === 'overdue_list' ? 'bg-blue-600 text-white shadow-xs' : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            Danh sách nợ quá hạn ({totalOverduePeriodsCount} kỳ)
          </button>
          <button
            onClick={() => setActiveTab('reminders')}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === 'reminders' ? 'bg-blue-600 text-white shadow-xs' : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            Lịch sử nhắc nợ ({debtReminders.length})
          </button>
          <button
            onClick={() => setActiveTab('promises')}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === 'promises' ? 'bg-blue-600 text-white shadow-xs' : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            Phản hồi & hẹn trả ({debtPromises.length})
          </button>
          <button
            onClick={() => setActiveTab('long_debt_cn04')}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === 'long_debt_cn04' ? 'bg-purple-600 text-white shadow-xs' : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            Căn cứ nợ kéo dài
          </button>
        </div>

        {/* Quick Debt Item Selector */}
        {overdueDebtList.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Khoản nợ đang thao tác:</span>
            <select
              value={activeSelectedDebt?.id || ''}
              onChange={(e) => setSelectedDebtId(e.target.value)}
              className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-xs font-mono font-bold text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[280px] truncate"
            >
              {overdueDebtList.map(item => (
                <option key={item.id} value={item.id}>
                  {item.roomCode} · {item.periodCode} ({item.uncollectedBalance.toLocaleString('vi-VN')} đ)
                </option>
              ))}
            </select>
          </div>
        )}
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
                <strong>Nguyên tắc quản lý công nợ theo từng kỳ:</strong>
                <p className="mt-0.5 text-slate-700">
                  Mỗi kỳ thanh toán quá hạn được tách riêng một dòng để theo dõi minh bạch. Số dư còn phải thu được tính theo từng kỳ, có đối chiếu khoản cấn trừ cọc đã hoàn tất trong bản B. {pendingWithinDueDateCount} khoản còn hạn được theo dõi tại mục Thu tiền.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-white border border-blue-200 rounded-lg font-semibold text-[11px] text-blue-900">
                Khoản còn hạn: <strong>{pendingWithinDueDateCount}</strong>
              </span>
            </div>
          </div>

          {/* Exception Notice */}
          {simulateEF01 && (
            <div className="p-6 bg-red-50 border border-red-300 rounded-xl text-center space-y-2 text-xs">
              <AlertOctagon className="w-8 h-8 text-red-600 mx-auto" />
              <strong className="text-red-900 block text-sm">Ngoại lệ: Không thể tải dữ liệu nghĩa vụ/thu tiền từ nguồn</strong>
              <p className="text-red-700 max-w-md mx-auto">
                Hệ thống bảo vệ tính toàn vẹn: Không tự gán trạng thái Đã thu hay suy đoán số dư khi thiếu dữ liệu nguồn.
              </p>
              <button
                onClick={() => setSimulateEF01(false)}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold cursor-pointer shadow-xs"
              >
                Thử lại tải dữ liệu nguồn
              </button>
            </div>
          )}

          {/* KPI Cards - ĐÃ BỎ "ĐÃ XỬ LÝ BÙ CỌC", TẬP TRUNG VÀO CÁC KỲ CÔNG NỢ */}
          {!simulateEF01 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Tổng dư nợ quá hạn
                </span>
                <span className="text-2xl font-bold font-mono text-red-700 mt-1 block">
                  {totalOverdueAmount.toLocaleString('vi-VN')} đ
                </span>
                <span className="text-[10px] text-slate-400">
                  Tổng cộng từ {totalOverduePeriodsCount} kỳ nợ chưa thanh toán
                </span>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Số kỳ công nợ quá hạn
                </span>
                <span className="text-2xl font-bold font-mono text-blue-700 mt-1 block">
                  {totalOverduePeriodsCount} kỳ nợ
                </span>
                <span className="text-[10px] text-blue-600 font-medium">
                  Tách riêng biệt theo từng tháng/kỳ nợ
                </span>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Số phòng phát sinh nợ
                </span>
                <span className="text-2xl font-bold font-mono text-amber-700 mt-1 block">
                  {totalDebtorRoomsCount} phòng
                </span>
                <span className="text-[10px] text-slate-400">
                  {groupedByRoomList.map(g => g.roomCode).join(', ') || 'Không có phòng nợ'}
                </span>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Kỳ nợ quá hạn lâu nhất
                </span>
                <span className="text-lg font-bold font-mono text-purple-700 mt-1 block truncate">
                  {oldestOverdueDebt ? `${oldestOverdueDebt.periodCode} (+${oldestOverdueDebt.overdueDays} ngày)` : '—'}
                </span>
                <span className="text-[10px] text-slate-400 truncate block">
                  {oldestOverdueDebt ? `Phòng ${oldestOverdueDebt.roomCode} · Hạn ${formatDateDMY(oldestOverdueDebt.dueDate)}` : 'Không có nợ'}
                </span>
              </div>
            </div>
          )}

          {/* Quick Filter Bar by Period (Thanh chọn nhanh theo từng kỳ nợ) */}
          {!simulateEF01 && uniqueDebtPeriods.length > 0 && (
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  Kỳ công nợ:
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedPeriodFilter('Tất cả')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                    selectedPeriodFilter === 'Tất cả'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Tất cả các kỳ ({totalOverduePeriodsCount})
                </button>
                {uniqueDebtPeriods.map(p => {
                  const stat = periodDebtCounts[p];
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setSelectedPeriodFilter(p)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 ${
                        selectedPeriodFilter === p
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-800 border border-slate-200'
                      }`}
                    >
                      <span>{p}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                        selectedPeriodFilter === p ? 'bg-purple-800 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {stat?.count || 0}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* View Mode Toggle: Tách từng kỳ vs Gom theo phòng */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('flat_periods')}
                  className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                    viewMode === 'flat_periods' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Hiển thị từng kỳ nợ thành từng dòng riêng biệt"
                >
                  Tách chi tiết từng kỳ
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grouped_by_room')}
                  className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                    viewMode === 'grouped_by_room' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Gom theo phòng và mở rộng bảng các kỳ nợ bên dưới"
                >
                  Gom theo phòng
                </button>
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
                    placeholder="Tìm theo phòng, khách thuê, kỳ nợ, mã thông báo..."
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
                  value={selectedPeriodFilter}
                  onChange={(e) => setSelectedPeriodFilter(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-medium"
                >
                  <option value="Tất cả">Tất cả kỳ công nợ</option>
                  {uniqueDebtPeriods.map(p => (
                    <option key={p} value={p}>{p}</option>
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
                Hiển thị <strong>{overdueDebtList.length}</strong> kỳ nợ quá hạn
              </div>
            </div>
          )}

          {/* Selection Action Toolbar */}
          {!simulateEF01 && selectedPeriodIds.length > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <span className="font-bold text-blue-900">
                  Đã chọn <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full text-xs font-mono">{selectedPeriodIds.length}</span> kỳ công nợ
                </span>
                <span className="text-slate-400">|</span>
                <span className="text-slate-700">
                  Tổng dư nợ: <strong className="font-mono text-red-700 font-bold">{totalSelectedDebt.toLocaleString('vi-VN')} đ</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openReminderModal()}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  title="Ghi nhật ký nhắc nợ cho các kỳ đã chọn và chuyển sang lấy mã QR thanh toán"
                >
                  <Phone className="w-3.5 h-3.5" />
                  Nhắc nợ ({selectedPeriodIds.length} kỳ)
                </button>
                <button
                  type="button"
                  onClick={() => openPromiseModal()}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  title="Ghi nhận hẹn trả cho các kỳ đã chọn và đồng bộ hạn thanh toán bên chức năng thu tiền"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Hẹn trả ({selectedPeriodIds.length} kỳ)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPeriodIds([])}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 rounded-lg font-medium cursor-pointer"
                >
                  Bỏ chọn
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ==================== VIEW MODE 1: TÁCH TỪNG KỲ CÔNG NỢ ==================== */}
          {/* ========================================================================= */}
          {!simulateEF01 && viewMode === 'flat_periods' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                      <th className="py-2.5 px-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={overdueDebtList.length > 0 && overdueDebtList.every(i => selectedPeriodIds.includes(i.id))}
                          onChange={toggleSelectAllVisible}
                          className="rounded border-slate-300 text-blue-600 cursor-pointer"
                          title="Chọn tất cả các kỳ nợ đang hiển thị"
                        />
                      </th>
                      <th className="py-2.5 px-3">Kỳ công nợ</th>
                      <th className="py-2.5 px-3">Phòng</th>
                      <th className="py-2.5 px-3">Khách thuê</th>
                      <th className="py-2.5 px-3">Mã thông báo</th>
                      <th className="py-2.5 px-3">Hạn thanh toán</th>
                      <th className="py-2.5 px-3 text-center">Quá hạn</th>
                      <th className="py-2.5 px-3 text-right">Tiền phòng</th>
                      <th className="py-2.5 px-3 text-right">Điện nước & DV</th>
                      <th className="py-2.5 px-3 text-right font-bold text-red-700">Dư nợ Chưa thu</th>
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
                            Các khoản chưa thu còn trong hạn được theo dõi tại màn hình Theo dõi thanh toán.
                          </span>
                        </td>
                      </tr>
                    ) : (
                      overdueDebtList.map((item) => {
                        const isSelected = selectedPeriodIds.includes(item.id);
                        const itemPromise = debtPromises.find(p => p.noticeId === item.noticeId);

                        return (
                          <tr
                            key={item.id}
                            className={`hover:bg-slate-50 transition-colors ${
                              isSelected ? 'bg-blue-50/70' : selectedDebtId === item.id ? 'bg-blue-50/40' : ''
                            }`}
                          >
                            {/* Checkbox chọn kỳ để nhắc nợ, hẹn trả */}
                            <td className="py-2.5 px-3 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectPeriod(item.id)}
                                className="rounded border-slate-300 text-blue-600 cursor-pointer"
                                title="Tích chọn kỳ này để nhắc nợ hoặc hẹn trả"
                              />
                            </td>

                            {/* 1. Kỳ công nợ nổi bật */}
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-200 font-mono">
                                <Calendar className="w-3 h-3 text-purple-600" />
                                {item.periodCode}
                              </span>
                            </td>

                            {/* 2. Phòng */}
                            <td className="py-2.5 px-3">
                              <span className="font-mono font-bold text-blue-700 block">{item.roomCode}</span>
                              {item.isRoomVacant && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                  Đã trả phòng
                                </span>
                              )}
                            </td>

                            {/* 3. Khách thuê */}
                            <td className="py-2.5 px-3 font-medium text-slate-900">
                              {item.tenantName}
                              <span className="block font-mono text-[10px] text-slate-400">{item.contractId || '—'}</span>
                            </td>

                            {/* 4. Mã thông báo */}
                            <td className="py-2.5 px-3 font-mono text-slate-700">
                              {item.noticeCode}
                            </td>

                            {/* 5. Hạn thanh toán (đồng bộ tương ứng chức năng thu tiền) */}
                            <td className="py-2.5 px-3 font-mono">
                              <span className="font-semibold text-slate-800 block">{formatDateDMY(item.dueDate)}</span>
                              {itemPromise?.hasPromiseDate && itemPromise.promisedDate && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 mt-0.5" title="Đã có hẹn trả (đồng bộ hạn TT bên Thu tiền)">
                                  <Clock className="w-2.5 h-2.5 text-blue-600" />
                                  Hẹn: {formatDateDMY(itemPromise.promisedDate)}
                                </span>
                              )}
                            </td>

                            {/* 6. Quá hạn */}
                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800 font-mono">
                                +{item.overdueDays} ngày
                              </span>
                            </td>

                            {/* 7. Tiền phòng */}
                            <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                              {item.rentAmount > 0 ? `${item.rentAmount.toLocaleString('vi-VN')} đ` : '—'}
                            </td>

                            {/* 8. Điện nước & DV */}
                            <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                              {item.utilityAmount > 0 ? `${item.utilityAmount.toLocaleString('vi-VN')} đ` : '—'}
                            </td>

                            {/* 9. Dư nợ còn phải thu sau đối chiếu */}
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-red-700 text-sm whitespace-nowrap">
                              {item.uncollectedBalance.toLocaleString('vi-VN')} đ
                            </td>

                            {/* 10. Hành động */}
                            <td className="py-2.5 px-3 text-right space-x-1 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => openReminderModal(item)}
                                className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded text-[11px] font-semibold cursor-pointer"
                                title="Ghi nhật ký nhắc nợ và xuất mã QR thanh toán kèm theo"
                              >
                                Nhắc nợ
                              </button>

                              <button
                                type="button"
                                onClick={() => openPromiseModal(item)}
                                className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded text-[11px] font-semibold cursor-pointer"
                                title="Ghi nhận phản hồi và đồng bộ ngày hẹn trả với hạn thanh toán bên chức năng thu tiền"
                              >
                                Hẹn trả
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedDebtId(item.id);
                                  setActiveTab('long_debt_cn04');
                                }}
                                className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded text-[11px] font-semibold cursor-pointer"
                                title="Tra cứu căn cứ hợp đồng và điều khoản xử lý"
                              >
                                Căn cứ
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ==================== VIEW MODE 2: GOM THEO PHÒNG (BẢNG TÁCH KỲ) ==================== */}
          {/* ========================================================================= */}
          {!simulateEF01 && viewMode === 'grouped_by_room' && (
            <div className="space-y-3.5">
              {groupedByRoomList.length === 0 ? (
                <div className="p-10 text-center bg-white border border-slate-200 rounded-xl text-slate-400">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5 opacity-80" />
                  <p className="font-semibold text-slate-700">Không có phòng nào đang nợ quá hạn!</p>
                </div>
              ) : (
                groupedByRoomList.map(grp => {
                  const isExpanded = expandedRooms[grp.roomCode] ?? true;
                  const isRoomSelected = grp.periods.length > 0 && grp.periods.every(p => selectedPeriodIds.includes(p.id));

                  return (
                    <div
                      key={grp.roomCode}
                      className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
                    >
                      {/* Room Header Strip */}
                      <div
                        className="p-3.5 bg-slate-50/80 hover:bg-slate-100/80 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isRoomSelected}
                            onChange={() => toggleSelectRoom(grp.roomCode)}
                            className="rounded border-slate-300 text-blue-600 cursor-pointer"
                            title="Tích chọn tất cả các kỳ nợ của phòng này"
                          />
                          <span
                            onClick={() => toggleRoomExpand(grp.roomCode)}
                            className="font-mono text-base font-bold text-blue-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs cursor-pointer"
                          >
                            {grp.roomCode}
                          </span>
                          <div onClick={() => toggleRoomExpand(grp.roomCode)} className="cursor-pointer">
                            <span className="font-bold text-slate-900 text-sm">{grp.tenantName}</span>
                            {grp.isRoomVacant && (
                              <span className="ml-2 px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                Đã trả phòng
                              </span>
                            )}
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Gồm <strong>{grp.periods.length} kỳ nợ</strong> · Quá hạn lâu nhất: <strong>+{grp.maxOverdueDays} ngày</strong>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Tổng dư nợ phòng</span>
                            <span className="text-base font-bold font-mono text-red-700">
                              {grp.totalRoomDebt.toLocaleString('vi-VN')} đ
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPeriodIds(grp.periods.map(p => p.id));
                              openReminderModal(grp.periods[0]);
                            }}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold cursor-pointer"
                            title="Nhắc nợ tất cả kỳ của phòng này"
                          >
                            Nhắc nợ
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPeriodIds(grp.periods.map(p => p.id));
                              openPromiseModal(grp.periods[0]);
                            }}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg text-xs font-semibold cursor-pointer"
                            title="Hẹn trả các kỳ của phòng này"
                          >
                            Hẹn trả
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleRoomExpand(grp.roomCode)}
                            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 cursor-pointer"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Subtable of Separated Periods */}
                      {isExpanded && (
                        <div className="overflow-x-auto p-1">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-50/50 text-slate-500 font-semibold uppercase text-[10px] border-b border-slate-100">
                                <th className="py-2 px-3 w-8 text-center"></th>
                                <th className="py-2 px-3">Kỳ công nợ</th>
                                <th className="py-2 px-3">Mã thông báo</th>
                                <th className="py-2 px-3">Hạn thanh toán</th>
                                <th className="py-2 px-3 text-center">Quá hạn</th>
                                <th className="py-2 px-3 text-right">Tiền phòng</th>
                                <th className="py-2 px-3 text-right">Điện nước & DV</th>
                                <th className="py-2 px-3 text-right font-bold text-red-700">Dư nợ kỳ này</th>
                                <th className="py-2 px-3 text-right">Hành động</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {grp.periods.map(item => {
                                const isItemSel = selectedPeriodIds.includes(item.id);
                                const pPromise = debtPromises.find(p => p.noticeId === item.noticeId);

                                return (
                                  <tr key={item.id} className={`hover:bg-slate-50/80 ${isItemSel ? 'bg-blue-50/60' : ''}`}>
                                    <td className="py-2 px-3 text-center">
                                      <input
                                        type="checkbox"
                                        checked={isItemSel}
                                        onChange={() => toggleSelectPeriod(item.id)}
                                        className="rounded border-slate-300 text-blue-600 cursor-pointer"
                                        title="Tích chọn kỳ này"
                                      />
                                    </td>
                                    <td className="py-2 px-3 font-mono font-bold text-purple-900">
                                      <span className="px-2 py-0.5 bg-purple-50 text-purple-800 border border-purple-200 rounded text-[11px]">
                                        {item.periodCode}
                                      </span>
                                    </td>
                                    <td className="py-2 px-3 font-mono text-slate-600 text-[11px]">{item.noticeCode}</td>
                                    <td className="py-2 px-3 font-mono text-slate-800">
                                      <span>{formatDateDMY(item.dueDate)}</span>
                                      {pPromise?.hasPromiseDate && pPromise.promisedDate && (
                                        <span className="block text-[10px] text-blue-700 font-bold">
                                          Hẹn: {formatDateDMY(pPromise.promisedDate)}
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-2 px-3 text-center">
                                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 font-mono">
                                        +{item.overdueDays} ngày
                                      </span>
                                    </td>
                                    <td className="py-2 px-3 text-right font-mono text-slate-700">
                                      {item.rentAmount > 0 ? `${item.rentAmount.toLocaleString('vi-VN')} đ` : '—'}
                                    </td>
                                    <td className="py-2 px-3 text-right font-mono text-slate-700">
                                      {item.utilityAmount > 0 ? `${item.utilityAmount.toLocaleString('vi-VN')} đ` : '—'}
                                    </td>
                                    <td className="py-2 px-3 text-right font-mono font-bold text-red-700 text-xs">
                                      {item.uncollectedBalance.toLocaleString('vi-VN')} đ
                                    </td>
                                    <td className="py-2 px-3 text-right space-x-1 whitespace-nowrap">
                                      <button
                                        type="button"
                                        onClick={() => openReminderModal(item)}
                                        className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded text-[10px] font-semibold cursor-pointer"
                                      >
                                        Nhắc nợ
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => openPromiseModal(item)}
                                        className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded text-[10px] font-semibold cursor-pointer"
                                      >
                                        Hẹn trả
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedDebtId(item.id);
                                          setActiveTab('long_debt_cn04');
                                        }}
                                        className="px-2 py-0.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded text-[10px] font-semibold cursor-pointer"
                                      >
                                        Căn cứ
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
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
                  Ghi nhận Lịch sử Nhắc thanh toán
                </h2>
              </div>
              <p className="text-slate-500 mt-0.5">
                Chủ nhà liên hệ đại diện khách thuê qua Zalo, điện thoại hoặc gặp trực tiếp sau ngày hạn thanh toán.
              </p>
            </div>

            {activeSelectedDebt && (
              <button
                type="button"
                onClick={() => setShowReminderModal(true)}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                Ghi lần nhắc mới ({activeSelectedDebt.roomCode} · {activeSelectedDebt.periodCode})
              </button>
            )}
          </div>

          {/* Context Selector Strip */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Đang chọn kỳ nợ:</span>
              <select
                value={activeSelectedDebt?.id || ''}
                onChange={(e) => setSelectedDebtId(e.target.value)}
                className="px-2.5 py-1 border border-slate-300 rounded-lg bg-white font-mono font-bold text-blue-900"
              >
                {overdueDebtList.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.roomCode} · {item.periodCode} ({item.tenantName} - {item.uncollectedBalance.toLocaleString('vi-VN')} đ)
                  </option>
                ))}
              </select>
            </div>

            {activeSelectedDebt && (
              <div className="flex items-center gap-4 text-[11px]">
                <span>Kỳ nợ: <strong className="font-mono text-purple-800">{activeSelectedDebt.periodCode}</strong></span>
                <span>Hạn gốc: <strong className="font-mono text-slate-900">{formatDateDMY(activeSelectedDebt.dueDate)}</strong></span>
                <span>Quá hạn: <strong className="font-mono text-red-600">+{activeSelectedDebt.overdueDays} ngày</strong></span>
                <span>Số dư nợ: <strong className="font-mono text-red-700">{activeSelectedDebt.uncollectedBalance.toLocaleString('vi-VN')} đ</strong></span>
              </div>
            )}
          </div>

          {/* List of Reminders */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              Nhật ký các lần đôn đốc nhắc nợ đã ghi nhận ({activeNoticeReminders.length} lần):
            </h3>

            {activeNoticeReminders.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-xl text-slate-400">
                <Phone className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                <p className="font-semibold text-slate-600">Chưa có lịch sử nhắc nợ nào được ghi nhận cho khoản này.</p>
                <span className="text-[11px] text-slate-400">
                  Bấm "Ghi lần nhắc mới" sau khi Chủ nhà đã thực sự liên hệ trao đổi với khách thuê.
                </span>
              </div>
            ) : (
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
                            Ghi hồi cứu
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                        <span>Ngày liên hệ: <strong className="text-slate-900">{formatDateDMY(r.contactDate)}</strong></span>
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

                    <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/50 gap-2">
                      <span>Người ghi: <strong>{r.loggedBy}</strong></span>
                      <div className="flex items-center gap-2">
                        {r.proofFile && (
                          <span className="flex items-center gap-1 text-blue-600 font-medium mr-1">
                            <Paperclip className="w-3 h-3" />
                            {r.proofFile}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => setHistoryQrModalReminder(r)}
                          className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                          title="Xem mã VietQR gắn liền với lần nhắc nợ đã lưu này"
                        >
                          <QrCode className="w-3 h-3 text-amber-600" />
                          Xem mã QR đã lưu
                        </button>
                      </div>
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
                  Ghi nhận Phản hồi & Ngày hẹn Thanh toán
                </h2>
              </div>
              <p className="text-slate-500 mt-0.5">
                Ghi nhận cam kết ngày trả tiền của khách. <strong>Hạn thanh toán gốc và số dư nợ không bị thay đổi</strong>.
              </p>
            </div>

            {activeSelectedDebt && (
              <button
                type="button"
                onClick={() => setShowPromiseModal(true)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                Ghi nhận phản hồi mới ({activeSelectedDebt.roomCode} · {activeSelectedDebt.periodCode})
              </button>
            )}
          </div>

          {/* Context Selector Strip */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Đang chọn kỳ nợ:</span>
              <select
                value={activeSelectedDebt?.id || ''}
                onChange={(e) => setSelectedDebtId(e.target.value)}
                className="px-2.5 py-1 border border-slate-300 rounded-lg bg-white font-mono font-bold text-blue-900"
              >
                {overdueDebtList.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.roomCode} · {item.periodCode} ({item.tenantName} - {item.uncollectedBalance.toLocaleString('vi-VN')} đ)
                  </option>
                ))}
              </select>
            </div>

            {activeSelectedDebt && (
              <div className="flex items-center gap-4 text-[11px]">
                <span>Kỳ nợ: <strong className="font-mono text-purple-800">{activeSelectedDebt.periodCode}</strong></span>
                <span>Hạn thanh toán gốc: <strong className="font-mono text-slate-900">{formatDateDMY(activeSelectedDebt.dueDate)}</strong></span>
                <span>Số dư nợ: <strong className="font-mono text-red-700">{activeSelectedDebt.uncollectedBalance.toLocaleString('vi-VN')} đ</strong></span>
              </div>
            )}
          </div>

          {/* List of Promises */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              Lịch sử các phản hồi & cam kết thanh toán ({activeNoticePromises.length} lần):
            </h3>

            {activeNoticePromises.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-xl text-slate-400">
                <MessageCircle className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                <p className="font-semibold text-slate-600">Chưa có phản hồi hoặc lịch hẹn nào từ khách cho khoản này.</p>
                <span className="text-[11px] text-slate-400">
                  Khi khách nêu lý do khó khăn hoặc hứa ngày trả tiền, nhấn "Ghi nhận phản hồi mới".
                </span>
              </div>
            ) : (
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
                            Hẹn thanh toán: {formatDateDMY(p.promisedDate)}
                          </span>
                        )}
                        {p.needsVerificationASIS08 && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                            Chờ xác minh
                          </span>
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
                          * Khách báo đã chuyển khoản. Cần tra soát tại chức năng <strong>Thu tiền</strong>. Số dư nợ chưa được tự động giảm.
                        </span>
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
                    Tra cứu Căn cứ Xử lý Nợ kéo dài
                  </h2>
                </div>
                <p className="text-slate-500 mt-0.5">
                  Tổng hợp điều khoản hợp đồng vi phạm, lịch sử đôn đốc và tình trạng chậm trả theo từng kỳ nợ.
                </p>
              </div>

              {activeSelectedDebt && (
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
                <span className="font-semibold text-slate-700">Chọn kỳ nợ cần tra cứu:</span>
                <select
                  value={activeSelectedDebt?.id || ''}
                  onChange={(e) => setSelectedDebtId(e.target.value)}
                  className="px-2.5 py-1 border border-slate-300 rounded-lg bg-white font-mono font-bold text-purple-900"
                >
                  {overdueDebtList.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.roomCode} · {item.periodCode} ({item.tenantName} - {item.uncollectedBalance.toLocaleString('vi-VN')} đ)
                    </option>
                  ))}
                </select>
              </div>

              {activeSelectedDebt && (
                <div className="flex items-center gap-3 text-[11px]">
                  <span>Hợp đồng: <strong className="font-mono text-slate-900">{activeSelectedDebt.contractId || '—'}</strong></span>
                  <span>Kỳ nợ: <strong className="font-mono text-purple-800">{activeSelectedDebt.periodCode}</strong></span>
                  <span>Hạn gốc: <strong className="font-mono text-slate-900">{formatDateDMY(activeSelectedDebt.dueDate)}</strong></span>
                  <span>Quá hạn: <strong className="font-mono text-red-600">+{activeSelectedDebt.overdueDays} ngày</strong></span>
                </div>
              )}
            </div>

            {activeSelectedDebt ? (
              <div className="space-y-4">
                {/* Khối 1: Thông tin số dư và kỳ nợ độc lập */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <span className="font-bold text-slate-800 uppercase tracking-wider block text-xs">
                    1. Chi tiết nghĩa vụ & số dư nợ theo đúng kỳ nợ:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                    <div className="p-3 bg-white rounded border border-slate-200">
                      <span className="text-slate-400 block">Phòng & Khách thuê:</span>
                      <strong className="text-slate-900 text-sm font-bold block">{activeSelectedDebt.roomCode}</strong>
                      <span className="text-slate-600">{activeSelectedDebt.tenantName}</span>
                    </div>
                    <div className="p-3 bg-white rounded border border-slate-200">
                      <span className="text-slate-400 block">Kỳ nợ & Mã thông báo:</span>
                      <strong className="text-purple-800 text-sm font-mono block">{activeSelectedDebt.periodCode}</strong>
                      <span className="text-slate-500 font-mono text-[10px]">{activeSelectedDebt.noticeCode}</span>
                    </div>
                    <div className="p-3 bg-white rounded border border-slate-200">
                      <span className="text-slate-400 block">Hạn thanh toán gốc:</span>
                      <strong className="text-red-600 text-sm font-mono block">{formatDateDMY(activeSelectedDebt.dueDate)}</strong>
                      <span className="text-red-700 font-bold">Quá hạn: +{activeSelectedDebt.overdueDays} ngày</span>
                    </div>
                    <div className="p-3 bg-white rounded border border-slate-200">
                      <span className="text-slate-400 block">Dư nợ Chưa thu:</span>
                      <strong className="text-red-700 text-base font-mono font-bold block">
                        {activeSelectedDebt.uncollectedBalance.toLocaleString('vi-VN')} đ
                      </strong>
                      <span className="text-[10px] text-slate-400">
                        (Tiền phòng: {activeSelectedDebt.rentAmount.toLocaleString('vi-VN')} đ · Dịch vụ: {activeSelectedDebt.utilityAmount.toLocaleString('vi-VN')} đ)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Danh sách các kỳ nợ khác của cùng phòng (nếu có) */}
                {(() => {
                  const otherPeriods = overdueDebtList.filter(i => i.roomCode === activeSelectedDebt.roomCode);
                  if (otherPeriods.length <= 1) return null;
                  return (
                    <div className="p-4 border border-amber-200 bg-amber-50/60 rounded-xl space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <strong className="text-amber-950 font-bold flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-700" />
                          Phòng {activeSelectedDebt.roomCode} có tổng cộng {otherPeriods.length} kỳ nợ chưa trả:
                        </strong>
                        <span className="font-mono font-bold text-red-700 text-sm">
                          Tổng nợ phòng: {otherPeriods.reduce((sum, p) => sum + p.uncollectedBalance, 0).toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                        {otherPeriods.map(p => (
                          <div
                            key={p.id}
                            onClick={() => setSelectedDebtId(p.id)}
                            className={`p-2.5 rounded-lg border cursor-pointer transition-colors ${
                              p.id === activeSelectedDebt.id
                                ? 'bg-white border-purple-400 shadow-xs ring-1 ring-purple-300'
                                : 'bg-white/80 border-amber-200 hover:bg-white'
                            }`}
                          >
                            <div className="flex justify-between font-mono font-bold text-[11px]">
                              <span className="text-purple-900">{p.periodCode}</span>
                              <span className="text-red-700">+{p.overdueDays} ngày</span>
                            </div>
                            <div className="text-right font-mono font-bold text-slate-900 text-xs mt-1">
                              {p.uncollectedBalance.toLocaleString('vi-VN')} đ
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Khối 2: Điều khoản hợp đồng liên quan */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 uppercase tracking-wider block text-xs">
                      2. Căn cứ điều khoản Hợp đồng thuê nhà:
                    </span>
                    <span className="font-mono text-[11px] font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded">
                      {activeSelectedDebt.contractId || 'HĐ chưa xác định'}
                    </span>
                  </div>

                  {activeSelectedDebt.contract ? (
                    <div className="space-y-2.5 text-[11px]">
                      <div className="p-3 bg-white rounded border border-slate-200 space-y-1">
                        <strong className="text-slate-900 block font-semibold">
                          Điều 3. Thời hạn và phương thức thanh toán tiền thuê:
                        </strong>
                        <p className="text-slate-700 leading-relaxed">
                          "Bên B có nghĩa vụ thanh toán đầy đủ tiền thuê nhà và các chi phí dịch vụ sử dụng (điện, nước, phí vệ sinh) trước hoặc đúng hạn của kỳ thanh toán thông qua hình thức chuyển khoản ngân hàng vào tài khoản chỉ định của Bên A."
                        </p>
                      </div>

                      <div className="p-3 bg-white rounded border border-slate-200 space-y-1">
                        <strong className="text-slate-900 block font-semibold text-red-900">
                          Điều 6. Xử lý vi phạm và đơn phương chấm dứt hợp đồng do chậm trả nợ:
                        </strong>
                        <p className="text-slate-700 leading-relaxed italic bg-red-50/50 p-2 rounded border border-red-100">
                          "Trường hợp Bên B chậm thanh toán tiền thuê hoặc các chi phí dịch vụ quá <strong>15 ngày</strong> kể từ ngày đến hạn thanh toán mà không có thỏa thuận gia hạn bằng văn bản, Bên A có quyền đơn phương chấm dứt hợp đồng thuê, thu hồi lại phòng theo quy định pháp luật."
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 rounded border border-amber-200 text-amber-900 text-[11px]">
                      Không tìm thấy bản ghi hợp đồng tương ứng cho lần thuê này.
                    </div>
                  )}
                </div>

                {/* Khối 3: Bằng chứng đôn đốc & cam kết phản hồi */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <span className="font-bold text-slate-800 uppercase tracking-wider block text-xs">
                    3. Bằng chứng đôn đốc & cam kết phản hồi:
                  </span>

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
                                <span>{formatDateDMY(r.contactDate)} · {r.channel}</span>
                                <span>{r.loggedBy}</span>
                              </div>
                              <p className="text-slate-800 font-medium">{r.result}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
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
                                {p.promisedDate && <span className="text-purple-700 font-bold">Hẹn: {formatDateDMY(p.promisedDate)}</span>}
                              </div>
                              <p className="text-slate-800">{p.content}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
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
                      Đánh giá bộ hồ sơ căn cứ (Hỗ trợ tra cứu nội bộ):
                    </strong>
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
                    * Chức năng cung cấp bảng tổng hợp căn cứ tra cứu theo từng kỳ nợ. Hệ thống không tự động áp dụng chế tài, không tự phạt nợ và không tự ý chấm dứt hợp đồng.
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400">
                Vui lòng chọn một kỳ nợ quá hạn để tra cứu căn cứ xử lý nợ kéo dài.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ==================== MODAL: GHI NHẬN LỊCH SỬ NHẮC NỢ ==================== */}
      {/* ========================================================================= */}
      {showReminderModal && activeSelectedDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto text-xs animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {remSavedSuccess ? 'Mã VietQR xuất kèm lần nhắc nợ' : 'Ghi nhận lịch sử nhắc nợ & Xuất mã QR'}
                  </h3>
                  <span className="text-[11px] font-semibold text-purple-700 font-mono">
                    {selectedPeriodDebtItems.length > 0 ? `${selectedPeriodDebtItems.length} kỳ nợ` : activeSelectedDebt.periodCode} · Phòng {activeSelectedDebt.roomCode}
                  </span>
                </div>
              </div>
              <button
                onClick={handleCloseReminderModal}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thông tin khoản nợ tóm tắt */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-[11px] text-slate-700">
              <div className="flex justify-between items-center text-slate-900 font-bold border-b border-slate-200 pb-1.5">
                <span>Khoản nợ áp dụng ({selectedPeriodDebtItems.length > 0 ? selectedPeriodDebtItems.length : 1} kỳ):</span>
                <span className="font-mono text-xs bg-blue-100 text-blue-900 px-2 py-0.5 rounded font-bold">
                  Phòng: {activeSelectedDebt.roomCode}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>Khách thuê: <strong className="text-slate-900">{activeSelectedDebt.tenantName}</strong></div>
                <div>Mã thông báo: <strong className="font-mono text-slate-900">{activeSelectedDebt.noticeCode}</strong></div>
                <div className="col-span-2">
                  <span className="font-semibold text-slate-600 block mb-1">Các kỳ công nợ áp dụng:</span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-white rounded border border-slate-200">
                    {(selectedPeriodDebtItems.length > 0 ? selectedPeriodDebtItems : [activeSelectedDebt]).map(it => (
                      <span key={it.id} className="font-mono font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded text-[10px] border border-purple-200">
                        {it.periodCode} ({it.uncollectedBalance.toLocaleString('vi-VN')} đ)
                      </span>
                    ))}
                  </div>
                </div>
                <div>Hạn thanh toán: <strong className="font-mono text-slate-900">{formatDateDMY(activeSelectedDebt.dueDate)}</strong></div>
                <div>Quá hạn lâu nhất: <strong className="font-mono text-red-600 font-bold">+{activeSelectedDebt.overdueDays} ngày</strong></div>
                <div className="col-span-2 pt-1.5 border-t border-slate-200 flex justify-between text-xs font-bold text-red-700">
                  <span>Tổng dư nợ cần thanh toán:</span>
                  <span className="font-mono text-sm">{totalSelectedDebt.toLocaleString('vi-VN')} đ</span>
                </div>
              </div>
            </div>

            {/* TRƯỜNG HỢP 1: CHƯA LƯU LỊCH SỬ NHẮC NỢ (remSavedSuccess === false) */}
            {!remSavedSuccess ? (
              <form onSubmit={handleSaveReminder} className="space-y-4">
                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1 text-[11px] text-amber-950">
                  <strong className="block font-semibold text-amber-900 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                    Quy định ràng buộc mã QR công nợ:
                  </strong>
                  <p className="text-amber-900/90 leading-relaxed">
                    Mã QR thanh toán <strong>chỉ được hiển thị và xuất kèm khi ấn Lưu lịch sử nhắc nợ</strong>. Hệ thống nghiêm cấm và không hỗ trợ lấy mã QR riêng lẻ khi không lưu lịch sử đôn đốc nợ.
                  </p>
                </div>

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
                    placeholder={`Ví dụ: Đã gọi điện nhắc số dư nợ ${activeSelectedDebt.periodCode}, khách báo đang thu xếp...`}
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
                    Đính kèm tệp chứng cứ <span className="text-slate-400 font-normal">(Tùy chọn)</span>
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
                      Xác nhận Chủ nhà/Quản lý đã thực sự liên hệ khách thuê <span className="text-red-500">*</span>
                    </span>
                  </label>

                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={remIsRetrospective}
                      onChange={(e) => setRemIsRetrospective(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-slate-600"
                    />
                    <span className="text-[11px] text-slate-500">
                      Chế độ ghi hồi cứu: Ghi lại sự kiện đã liên hệ trước khi khoản nợ thay đổi
                    </span>
                  </label>
                </div>

                {/* MỤC MÃ QR THANH TOÁN (TRẠNG THÁI KHÓA TRƯỚC KHI LƯU) */}
                <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-amber-300 text-slate-600 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-amber-600" />
                      <strong className="text-slate-900 font-semibold text-xs">Mục Mã QR thanh toán nợ</strong>
                    </div>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded border border-amber-200">
                      Đang khóa (Chưa lưu nhắc nợ)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Mã VietQR chuyển khoản chính xác <strong className="font-mono text-red-700 font-bold">{totalSelectedDebt.toLocaleString('vi-VN')} đ</strong> sẽ được <strong>tự động mở khóa kèm thông tin tài khoản và nút gửi Zalo</strong> ngay khi bạn bấm nút <strong>"Lưu lịch sử nhắc & Mở mã QR"</strong> bên dưới.
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleCloseReminderModal}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium cursor-pointer transition-colors"
                  >
                    Hủy (Không lưu & Không lấy QR)
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold cursor-pointer shadow-xs flex items-center gap-1.5 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Lưu lịch sử nhắc & Mở mã QR
                  </button>
                </div>
              </form>
            ) : (
              /* TRƯỜNG HỢP 2: ĐÃ LƯU LỊCH SỬ NHẮC NỢ THÀNH CÔNG -> HIỂN THỊ MỤC MÃ QR ĐÃ ĐƯỢC XUẤT KÈM */
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                {/* Thông báo đã ghi nhận thành công */}
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5 text-xs text-emerald-950">
                  <div className="flex items-center gap-2 font-bold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>ĐÃ LƯU LỊCH SỬ NHẮC NỢ VÀO HỆ THỐNG THÀNH CÔNG</span>
                  </div>
                  <p className="text-[11px] text-emerald-900 leading-relaxed">
                    Đã ghi nhận lần đôn đốc qua kênh <strong>{savedReminderDetails?.channel || remChannel}</strong> cho <strong>Phòng {activeSelectedDebt.roomCode}</strong> ({savedReminderDetails?.periods || activeSelectedDebt.periodCode}). Mã VietQR thanh toán nợ tương ứng đã được xuất kèm hợp lệ:
                  </p>
                </div>

                {/* MỤC MÃ QR THANH TOÁN (ĐÃ MỞ KHÓA KÈM LỊCH SỬ NHẮC NỢ) */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4 text-center">
                  <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-emerald-600" />
                      Mã VietQR thanh toán nợ kèm lần nhắc này
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                      Đã xác thực & xuất kèm
                    </span>
                  </div>

                  {reminderQrDetails.qrUrl ? (
                    <div className="space-y-3">
                      <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl inline-block">
                        <img
                          src={reminderQrDetails.qrUrl}
                          alt={`Mã VietQR nợ Phòng ${activeSelectedDebt.roomCode}`}
                          className="w-52 h-52 object-contain mx-auto rounded-lg bg-white p-2 border border-slate-200 shadow-xs"
                        />
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Quét mã bằng app Ngân hàng để thanh toán chính xác không cần nhập số tiền
                      </p>

                      {/* Chi tiết tài khoản */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left space-y-1.5 text-[11px]">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Ngân hàng:</span>
                          <strong className="text-slate-900">{reminderQrDetails.bankName}</strong>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Số tài khoản:</span>
                          <div className="flex items-center gap-1.5">
                            <strong className="font-mono text-slate-900 font-bold">{reminderQrDetails.accountNumber}</strong>
                            <button
                              type="button"
                              onClick={() => handleCopyText(reminderQrDetails.accountNumber, 'accNum', 'Đã sao chép số tài khoản!')}
                              className="text-blue-600 hover:text-blue-800 p-0.5"
                              title="Sao chép số tài khoản"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Chủ tài khoản:</span>
                          <strong className="text-slate-900 uppercase">{reminderQrDetails.accountHolder}</strong>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Số tiền thanh toán:</span>
                          <strong className="font-mono text-red-700 font-bold text-xs">{reminderQrDetails.amount.toLocaleString('vi-VN')} đ</strong>
                        </div>
                        <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                          <span className="text-slate-500">Nội dung CK:</span>
                          <div className="flex items-center gap-1.5">
                            <strong className="font-mono text-blue-900 font-bold">{reminderQrDetails.transferContent}</strong>
                            <button
                              type="button"
                              onClick={() => handleCopyText(reminderQrDetails.transferContent, 'remContent', 'Đã sao chép nội dung chuyển khoản!')}
                              className="text-blue-600 hover:text-blue-800 p-0.5"
                              title="Sao chép nội dung chuyển khoản"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Các nút hành động thao tác với mã QR đã xuất */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleDownloadQrImage()}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-600" />
                          Tải ảnh QR
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyQrImage()}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5 text-slate-600" />
                          {copiedField === 'qrImage' ? 'Đã sao chép!' : 'Sao chép ảnh QR'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyText(getCustomerMessageText(), 'fullMsg', 'Đã sao chép nội dung tin nhắn nhắc nợ!')}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-600" />
                          Sao chép tin nhắn
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenZalo()}
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Gửi qua Zalo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-slate-400">
                      Chưa có thông tin số tài khoản ngân hàng để tạo mã QR. Vui lòng thiết lập tại mục Cấu hình tài khoản.
                    </div>
                  )}
                </div>

                {/* Footer hoàn tất */}
                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleCloseReminderModal}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold cursor-pointer shadow-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    Hoàn tất & Đóng
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ==================== MODAL: GHI NHẬN PHẢN HỒI & HẸN TRẢ ==================== */}
      {/* ========================================================================= */}
      {showPromiseModal && activeSelectedDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Ghi nhận phản hồi & Ngày hẹn thanh toán</h3>
                  <span className="text-[11px] font-semibold text-purple-700 font-mono">
                    Áp dụng cho {selectedPeriodDebtItems.length > 0 ? `${selectedPeriodDebtItems.length} kỳ nợ` : activeSelectedDebt.periodCode}
                  </span>
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
            <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl space-y-2 text-[11px] text-slate-700">
              <div className="flex justify-between items-center text-blue-950 font-bold border-b border-blue-200/60 pb-1.5">
                <span>Khoản nợ ghi nhận phản hồi ({selectedPeriodDebtItems.length > 0 ? selectedPeriodDebtItems.length : 1} kỳ):</span>
                <span className="font-mono text-xs bg-blue-200/60 text-blue-900 px-2 py-0.5 rounded">
                  Phòng: {activeSelectedDebt.roomCode}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>Khách thuê: <strong className="text-slate-900">{activeSelectedDebt.tenantName}</strong></div>
                <div>Mã thông báo: <strong className="font-mono text-slate-900">{activeSelectedDebt.noticeCode}</strong></div>
                <div className="col-span-2">
                  <span className="font-semibold text-slate-600 block mb-1">Các kỳ công nợ hẹn trả:</span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-white/70 rounded border border-blue-200">
                    {(selectedPeriodDebtItems.length > 0 ? selectedPeriodDebtItems : [activeSelectedDebt]).map(it => (
                      <span key={it.id} className="font-mono font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded text-[10px] border border-purple-200">
                        {it.periodCode}
                      </span>
                    ))}
                  </div>
                </div>
                <div>Hạn thanh toán bên Thu tiền: <strong className="font-mono text-slate-900">{formatDateDMY(activeSelectedDebt.dueDate)}</strong></div>
                <div>Dư nợ hiện tại: <strong className="font-mono text-red-700 font-bold">{totalSelectedDebt.toLocaleString('vi-VN')} đ</strong></div>
              </div>
              <p className="text-[10px] text-blue-800 italic pt-1 border-t border-blue-200/60">
                * Ngày hẹn thanh toán nợ sẽ tự động đồng bộ làm Hạn thanh toán của thông báo bên chức năng Thu tiền.
              </p>
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
                  placeholder={`Ví dụ: Khách phản hồi về ${activeSelectedDebt.periodCode}, hẹn thứ Hai sẽ chuyển khoản...`}
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
                      Ngày khách cam kết thanh toán (Đồng bộ hạn TT bên Thu tiền) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={promDate}
                      onChange={(e) => setPromDate(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-xs focus:ring-1 focus:ring-blue-500"
                      required={promHasDate}
                    />
                    <span className="text-[10px] text-blue-700 font-medium mt-0.5 block">
                      Hạn thanh toán hiện tại bên chức năng Thu tiền: <strong>{formatDateDMY(activeSelectedDebt.dueDate)}</strong>. Khi lưu, hạn thanh toán của thông báo sẽ được đồng bộ thành ngày này.
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
                      Khách báo đã chuyển khoản & gửi chứng từ
                    </span>
                    <span className="text-[10px] text-purple-800">
                      Hệ thống sẽ gắn cờ chuyển xác minh; không tự giảm nợ tại màn hình này.
                    </span>
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
                  * Tự động đồng bộ hạn thanh toán bên chức năng Thu tiền
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPromiseModal(false)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold cursor-pointer shadow-xs"
                  >
                    Lưu hẹn trả & Đồng bộ hạn TT
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ==================== MODAL: TRA CỨU TOÀN BỘ KHOẢN PHẢI THU ==================== */}
      {/* ========================================================================= */}
      {showAllInvoicesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Tra cứu Toàn bộ Khoản Phải thu theo từng kỳ</h3>
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
              Bảng tra cứu lịch sử các khoản Đang hiệu lực, Đã thu chuyển khoản ngân hàng hoặc Chưa thu, tách biệt rõ ràng theo từng kỳ thanh toán.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                    <th className="py-2.5 px-3">Phòng</th>
                    <th className="py-2.5 px-3">Mã thông báo</th>
                    <th className="py-2.5 px-3">Kỳ thanh toán</th>
                    <th className="py-2.5 px-3">Hạn thanh toán</th>
                    <th className="py-2.5 px-3 text-right">Tổng tiền</th>
                    <th className="py-2.5 px-3 text-right">Dư nợ chưa thu</th>
                    <th className="py-2.5 px-3 text-center">Trạng thái thanh toán</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allPeriodDebtItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{item.roomCode}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">{item.noticeCode}</td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-purple-800">{item.periodCode}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{formatDateDMY(item.dueDate)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                        {item.totalAmount.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {item.uncollectedBalance.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.isPaid
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.isOverdue
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {item.isPaid ? 'Đã thu chuyển khoản' : item.isOverdue ? `Chưa thu (Quá hạn ${item.overdueDays} ngày)` : 'Chưa thu (Còn hạn)'}
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
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ==================== MODAL: XEM MÃ QR KÈM LẦN NHẮC NỢ ĐÃ LƯU ==================== */}
      {/* ========================================================================= */}
      {historyQrModalReminder && historyQrDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto text-xs animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Mã VietQR gắn với lần nhắc nợ</h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Phòng {historyQrModalReminder.roomCode} · Ngày {formatDateDMY(historyQrModalReminder.contactDate)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setHistoryQrModalReminder(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5 text-[11px] text-amber-950">
              <div className="flex justify-between font-bold">
                <span>Kênh liên hệ: {historyQrModalReminder.channel}</span>
                <span>Người nhắc: {historyQrModalReminder.loggedBy}</span>
              </div>
              <div className="text-slate-800">
                <strong>Kết quả:</strong> {historyQrModalReminder.result}
              </div>
              <span className="text-[10px] text-amber-800 block pt-0.5">
                * Mã QR này xuất kèm theo lịch sử nhắc nợ đã được lưu hợp lệ vào hệ thống.
              </span>
            </div>

            {historyQrDetails.qrUrl ? (
              <div className="space-y-3 text-center">
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 inline-block">
                  <img
                    src={historyQrDetails.qrUrl}
                    alt={`VietQR nợ Phòng ${historyQrModalReminder.roomCode}`}
                    className="w-48 h-48 mx-auto object-contain bg-white rounded-lg p-2 border border-slate-200 shadow-xs"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ngân hàng:</span>
                    <strong className="text-slate-900">{historyQrDetails.bankName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Số tài khoản:</span>
                    <strong className="font-mono text-slate-900 font-bold">{historyQrDetails.accountNumber}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Chủ tài khoản:</span>
                    <strong className="text-slate-900 uppercase">{historyQrDetails.accountHolder}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Số tiền:</span>
                    <strong className="font-mono text-red-700 font-bold">{historyQrDetails.amount.toLocaleString('vi-VN')} đ</strong>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200">
                    <span className="text-slate-500">Nội dung CK:</span>
                    <strong className="font-mono text-blue-900 font-bold">{historyQrDetails.transferContent}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleDownloadQrImage(historyQrDetails.qrUrl, historyQrModalReminder.roomCode)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    Tải ảnh QR
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyQrImage(historyQrDetails.qrUrl)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-600" />
                    Sao chép QR
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyText(getCustomerMessageText(historyQrDetails.item, historyQrDetails), 'historyMsg', 'Đã sao chép tin nhắn nhắc nợ!')}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-600" />
                    Sao chép tin nhắn
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenZalo(historyQrDetails.tenantPhone, getCustomerMessageText(historyQrDetails.item, historyQrDetails))}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Gửi qua Zalo
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400">
                Chưa có thông tin tài khoản ngân hàng để tạo mã QR.
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setHistoryQrModalReminder(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold cursor-pointer transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
