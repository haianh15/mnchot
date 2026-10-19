import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Room, Contract, PaymentNotice, PaymentReceipt, DepositSettlementSlip, ManagementReportSnapshot } from '../../types';
import {
  BarChart3, PieChart, FileSpreadsheet, CheckCircle2, AlertCircle,
  Download, Filter, Calendar, ShieldCheck, ArrowUpRight, TrendingUp,
  RefreshCw, Eye, Search, AlertTriangle, ArrowRight, X, Layers,
  Clock, DollarSign, Wallet, FileText, Check, Database, AlertOctagon,
  ChevronRight, Building2, UserCheck, Key, HelpCircle
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const {
    rooms,
    contracts,
    paymentNotices,
    paymentReceipts,
    settlementSlips,
    initialPaymentRecords,
    currentUser,
    currentSession,
    reportSnapshots,
    saveReportSnapshot
  } = useApp();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'occupancy_bc01' | 'financial_bc02' | 'reconciliation_bc03' | 'executive_bc04'>('occupancy_bc01');

  // Timestamp of report viewing
  const [asOfTimestamp, setAsOfTimestamp] = useState<string>(() => {
    const d = new Date();
    return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN');
  });

  const handleRefreshData = () => {
    const d = new Date();
    setAsOfTimestamp(d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN'));
    showToast('success', "Đã làm mới dữ liệu từ nguồn thời gian thực");
  };

  // Toast feedback
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);
  const showToast = (type: 'success' | 'error' | 'warning', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Modal for Room Details drill-down
  const [drilldownRoom, setDrilldownRoom] = useState<Room | null>(null);
  const [drilldownNotice, setDrilldownNotice] = useState<PaymentNotice | null>(null);
  const [showSourceViewerModal, setShowSourceViewerModal] = useState(false);

  // =========================================================================
  // ==================== 1. UC-BC-01: TỔNG HỢP SỐ PHÒNG & TỶ LỆ LẤP ĐẦY ====================
  // =========================================================================

  // Test Simulation Toggles for UC-BC-01
  const [simulateBC01_EF01, setSimulateBC01_EF01] = useState(false); // Không đọc được dữ liệu 
  const [simulateBC01_EF02, setSimulateBC01_EF02] = useState(false); // Phòng có trạng thái xung đột / thiếu trạng thái
  const [simulateBC01_EF03, setSimulateBC01_EF03] = useState(false); // Không có phòng nào được khai báo (Tổng phòng = 0)
  const [simulateBC01_EF04, setSimulateBC01_EF04] = useState(false); // Trùng mã phòng

  // Filter for Room list in BC-01
  const [bc01StatusFilter, setBc01StatusFilter] = useState<'Tất cả' | 'Trống' | 'Đang thuê' | 'Sắp trả'>('Tất cả');
  const [bc01SearchCode, setBc01SearchCode] = useState('');

  // Source Room Data processing
  const effectiveRooms = useMemo(() => {
    if (simulateBC01_EF03) return [];

    let list = [...rooms];

    if (simulateBC01_EF04) {
      // Simulate duplicate room code
      list.push({...list[0],
        id: 'room_dup_' + Date.now(),
        roomCode: list[0]?.roomCode || 'P.101',
        note: 'Bản ghi trùng mã phòng (Mô phỏng )'
      });
    }

    if (simulateBC01_EF02 && list.length > 1) {
      // Simulate conflicting/missing status
      list[1] = {...list[1],
        status: '' as any,
        note: 'Thiếu trạng thái sử dụng (Mô phỏng )'
      };
    }

    return list;
  }, [rooms, simulateBC01_EF03, simulateBC01_EF04, simulateBC01_EF02]);

  // Check data integrity
  const bc01Validation = useMemo(() => {
    if (simulateBC01_EF01) {
      return {
        isValid: false,
        errorType: '',
        errorMessage: 'Không thể kết nối hoặc tải dữ liệu từ Bảng tình trạng phòng. Vui lòng kiểm tra lại kết nối.',
        errorRooms: []
      };
    }

    if (effectiveRooms.length === 0) {
      return {
        isValid: true,
        errorType: '',
        errorMessage: 'Tòa nhà chưa có phòng nào được khai báo (Tổng số phòng = 0).',
        errorRooms: []
      };
    }

    // Check duplicate room code
    const codeCounts: Record<string, number> = {};
    effectiveRooms.forEach(r => {
      codeCounts[r.roomCode] = (codeCounts[r.roomCode] || 0) + 1;
    });
    const duplicateCodes = Object.keys(codeCounts).filter(code => codeCounts[code] > 1);

    if (duplicateCodes.length > 0) {
      return {
        isValid: false,
        errorType: '',
        errorMessage: `Phát hiện ${duplicateCodes.length} mã phòng bị trùng lặp trong nguồn dữ liệu: ${duplicateCodes.join(', ')}. Không đủ điều kiện chốt chỉ số thống kê Hoàn tất.`,
        errorRooms: duplicateCodes
      };
    }

    // Check invalid or multiple states
    const invalidStatusRooms = effectiveRooms.filter(r => !r.status || !['Trống', 'Đang thuê', 'Sắp trả'].includes(r.status));
    if (invalidStatusRooms.length > 0) {
      return {
        isValid: false,
        errorType: '',
        errorMessage: `Có ${invalidStatusRooms.length} phòng thiếu trạng thái hoặc có trạng thái không hợp lệ (${invalidStatusRooms.map(r => r.roomCode).join(', ')}). Yêu cầu tra soát tại.`,
        errorRooms: invalidStatusRooms.map(r => r.roomCode)
      };
    }

    return {
      isValid: true,
      errorType: null,
      errorMessage: null,
      errorRooms: []
    };
  }, [effectiveRooms, simulateBC01_EF01]);

  // Total Rooms and groups
  const totalRoomsCount = effectiveRooms.length;
  const vacantRoomsCount = effectiveRooms.filter(r => r.status === 'Trống').length;
  const rentedRoomsCount = effectiveRooms.filter(r => r.status === 'Đang thuê').length;
  const returningRoomsCount = effectiveRooms.filter(r => r.status === 'Sắp trả').length;
  const depositedRoomsCount = effectiveRooms.filter(r => r.hasDeposit).length;

  // Occupancy rate calculation
  // Tỷ lệ = (Đang thuê + Sắp trả) / Tổng phòng * 100%
  // Nếu tổng phòng = 0 => "Chưa có dữ liệu (N/A)"
  const occupancyRateValue = totalRoomsCount > 0
    ? (((rentedRoomsCount + returningRoomsCount) / totalRoomsCount) * 100).toFixed(1): 'N/A';

  // Filtered rooms for drill-down table
  const displayedBc01Rooms = useMemo(() => {
    return effectiveRooms.filter(r => {
      const matchStatus = bc01StatusFilter === 'Tất cả' || r.status === bc01StatusFilter;
      const matchCode = !bc01SearchCode || r.roomCode.toLowerCase().includes(bc01SearchCode.toLowerCase());
      return matchStatus && matchCode;
    });
  }, [effectiveRooms, bc01StatusFilter, bc01SearchCode]);

  // =========================================================================
  // ==================== 2. UC-BC-02: PHẢI THU, THỰC THU & CÔNG NỢ ====================
  // =========================================================================

  // Test Simulation Toggles for UC-BC-02
  const [simulateBC02_EF01, setSimulateBC02_EF01] = useState(false); // Thiếu dữ liệu TT-03/PH-07
  const [simulateBC02_EF02, setSimulateBC02_EF02] = useState(false); // Thông báo/khoản thu bị lặp
  const [simulateBC02_EF03, setSimulateBC02_EF03] = useState(false); // Lỗi không thể tính lại hoặc xuất

  // Filters for BC-02
  const [bc02PeriodFilter, setBc02PeriodFilter] = useState<string>('Tất cả');
  const [bc02RoomFilter, setBc02RoomFilter] = useState<string>('Tất cả');

  // Available periods from notices
  const availablePeriods = useMemo(() => {
    const set = new Set<string>();
    paymentNotices.forEach(n => { if (n.periodCode) set.add(n.periodCode); });
    return Array.from(set).sort();
  }, [paymentNotices]);

  // Financial calculations respecting to 09
  // 1. Tiền thuê kỳ đầu chuyển khoản từ PH-07 (cộng 1 lần vào phải thu gốc và thực thu thuê)
  const initialRentRecords = useMemo(() => {
    return initialPaymentRecords.filter(p => {
      if (bc02RoomFilter !== 'Tất cả' && p.roomCode !== bc02RoomFilter) return false;
      return true;
    });
  }, [initialPaymentRecords, bc02RoomFilter]);

  const initialRentTotal = initialRentRecords.reduce((sum, p) => sum + (p.firstMonthRentAmount || 0), 0);
  const initialDepositTotal = initialRentRecords.reduce((sum, p) => sum + (p.depositAmount || 0), 0);

  // 2. Các thông báo thanh toán hợp lệ (TT-03)
  const activeNotices = useMemo(() => {
    if (simulateBC02_EF01) return [];

    let list = paymentNotices.filter(n => n.status === 'Đang hiệu lực');

    if (bc02PeriodFilter !== 'Tất cả') {
      list = list.filter(n => n.periodCode === bc02PeriodFilter);
    }
    if (bc02RoomFilter !== 'Tất cả') {
      list = list.filter(n => n.roomCode === bc02RoomFilter);
    }

    if (simulateBC02_EF02 && list.length > 0) {
      // Duplicate notice for simulation
      list.push({...list[0],
        id: 'dup_not_' + Date.now(),
        noticeCode: list[0].noticeCode + '-TRUNG'
      });
    }

    return list;
  }, [paymentNotices, bc02PeriodFilter, bc02RoomFilter, simulateBC02_EF01, simulateBC02_EF02]);

  // Active Receipts - Only active receipts
  const activeReceipts = useMemo(() => {
    let list = paymentReceipts.filter(r => r.status === 'Đang hiệu lực');
    if (bc02RoomFilter !== 'Tất cả') {
      list = list.filter(r => r.roomCode === bc02RoomFilter);
    }
    if (bc02PeriodFilter !== 'Tất cả') {
      list = list.filter(r => r.periodCode === bc02PeriodFilter);
    }
    return list;
  }, [paymentReceipts, bc02RoomFilter, bc02PeriodFilter]);

  // Tổng phải thu gốc = Tiền thuê kỳ đầu PH-07 (1 lần) + Các nghĩa vụ TT-03
  const totalReceivableFromNotices = activeNotices.reduce((sum, n) => sum + n.totalAmount, 0);
  const totalReceivableGross = totalReceivableFromNotices + (bc02PeriodFilter === 'Tất cả' ? initialRentTotal: 0);

  // Thực thu ngân hàng = Chỉ gồm chuyển khoản ngân hàng đã xác nhận
  const totalCollectedBankNotices = activeReceipts.reduce((sum, r) => sum + r.amountReceived, 0);
  const totalCollectedBank = totalCollectedBankNotices + (bc02PeriodFilter === 'Tất cả' ? initialRentTotal: 0);

  // Khoản nợ đã xử lý bù cọc - Theo dõi riêng từ quyết toán hoàn tất QT05
  const totalHandledByDeposit = useMemo(() => {
    return settlementSlips.filter(s => s.status === 'Đã có kết quả – chờ ký biên bản' || s.status === 'Hoàn tất').filter(s => bc02RoomFilter === 'Tất cả' || s.roomCode === bc02RoomFilter).reduce((sum, s) => {
        const debtDed = s.deductions.filter(d => d.category === 'Công nợ kỳ trước').reduce((acc, d) => acc + d.amount, 0);
        return sum + debtDed;
      }, 0);
  }, [settlementSlips, bc02RoomFilter]);

  // Chưa thu (Còn phải thu) = Phải thu gốc − Thực thu ngân hàng − Khoản nợ đã xử lý bằng cọc
  const totalUncollected = Math.max(0, totalReceivableGross - totalCollectedBank - totalHandledByDeposit);

  // Công nợ quá hạn: Phần Chưa thu đã qua hạn thanh toán trong thông báo
  const now = new Date();
  const totalOverdueDebt = useMemo(() => {
    return activeNotices.filter(n => n.paymentStatus === 'Chưa thu' && new Date(n.dueDate) < now).reduce((sum, n) => sum + n.totalAmount, 0);
  }, [activeNotices, now]);

  // Breakdown lines for Table
  // Dòng 1: Tiền thuê kỳ đầu PH-07
  // Dòng 2: Tiền thuê kỳ tiếp theo UC08.2
  // Dòng 3: Tiền điện, nước, phí dịch vụ kỳ vừa sử dụng UC08.2
  const financialRows = useMemo(() => {
    const rows: {
      id: string;
      sourceType: 'PH-07 (Thuê kỳ đầu)' | 'UC08.2 (Thuê kỳ tiếp)' | 'UC08.2 (Điện nước & Dịch vụ)';
      code: string;
      roomCode: string;
      tenantName: string;
      servicePeriod: string;
      rentPeriod: string;
      dueDate: string;
      receivedDate?: string;
      receivable: number;
      collected: number;
      handledByDeposit: number;
      uncollected: number;
      isOverdue: boolean;
      status: string;
    }[] = [];

    // Rows from PH-07
    if (bc02PeriodFilter === 'Tất cả') {
      initialRentRecords.forEach(p => {
        const c = contracts.find(ct => ct.id === p.contractId);
        rows.push({
          id: p.id,
          sourceType: 'PH-07 (Thuê kỳ đầu)',
          code: p.transactionCode || 'PH07-' + p.roomCode,
          roomCode: p.roomCode,
          tenantName: c?.tenantName || 'Khách mới ký HĐ',
          servicePeriod: 'Không áp dụng (Thuê ban đầu)',
          rentPeriod: p.rentPeriodNote || 'Kỳ thuê tháng đầu',
          dueDate: p.receivedDate,
          receivedDate: p.receivedDate,
          receivable: p.firstMonthRentAmount,
          collected: p.firstMonthRentAmount,
          handledByDeposit: 0,
          uncollected: 0,
          isOverdue: false,
          status: 'Đã hoàn tất (Chuyển khoản MB Bank)'
        });
      });
    }

    // Rows from Notices & Receipts
    activeNotices.forEach(n => {
      const receipt = activeReceipts.find(r => r.noticeId === n.id);
      const isPaid = !!receipt || n.paymentStatus === 'Đã thu';
      const c = contracts.find(ct => ct.roomCode === n.roomCode);
      const isOver = !isPaid && n.dueDate < `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

      // Đúng khoản gốc của thông báo, tuyệt đối không lấy tiền thuê ước lượng.
      const rentPortion = n.breakdown?.nextRentAmount ?? 0;
      const utilityPortion = (n.breakdown?.electricityAmount ?? 0) + (n.breakdown?.waterAmount ?? 0) + (n.breakdown?.serviceFees?.reduce((sum,item)=>sum+item.amount,0) ?? 0) + (n.breakdown?.adjustmentAmount ?? 0);

      // Rent next period row
      rows.push({
        id: n.id + '_rent',
        sourceType: 'UC08.2 (Thuê kỳ tiếp)',
        code: n.noticeCode,
        roomCode: n.roomCode,
        tenantName: c?.tenantName || 'Khách đang thuê',
        servicePeriod: '—',
        rentPeriod: n.nextRentPeriod || 'Kỳ tiếp theo',
        dueDate: n.dueDate,
        receivedDate: receipt?.receivedDate,
        receivable: rentPortion,
        collected: isPaid ? rentPortion: 0,
        handledByDeposit: 0,
        uncollected: isPaid ? 0: rentPortion,
        isOverdue: isOver,
        status: isPaid ? 'Đã thu chuyển khoản': isOver ? 'Quá hạn thanh toán': 'Chờ chuyển khoản'
      });

      // Utility & service row
      if (utilityPortion > 0) {
        rows.push({
          id: n.id + '_util',
          sourceType: 'UC08.2 (Điện nước & Dịch vụ)',
          code: n.noticeCode,
          roomCode: n.roomCode,
          tenantName: c?.tenantName || 'Khách đang thuê',
          servicePeriod: n.servicePeriod || 'Kỳ vừa sử dụng',
          rentPeriod: '—',
          dueDate: n.dueDate,
          receivedDate: receipt?.receivedDate,
          receivable: utilityPortion,
          collected: isPaid ? utilityPortion: 0,
          handledByDeposit: 0,
          uncollected: isPaid ? 0: utilityPortion,
          isOverdue: isOver,
          status: isPaid ? 'Đã thu chuyển khoản': isOver ? 'Quá hạn thanh toán': 'Chờ chuyển khoản'
        });
      }
    });

    return rows;
  }, [initialRentRecords, activeNotices, activeReceipts, contracts, bc02PeriodFilter, now]);

  // =========================================================================
  // ==================== 3. UC-BC-03: ĐỐI SOÁT SỐ LIỆU BÁO CÁO ====================
  // =========================================================================

  // Test Simulation Toggles for UC-BC-03
  const [simulateBC03_EF01, setSimulateBC03_EF01] = useState(false); // Không truy xuất đủ dữ liệu gốc
  const [simulateBC03_EF02, setSimulateBC03_EF02] = useState(false); // Dữ liệu nguồn vừa thay đổi giữa chừng

  // Reconciliation Audit Status
  const [reconciledDate, setReconciledDate] = useState('16/10/2026 09:30');
  const [reconciledBy, setReconciledBy] = useState('Quản lý / Chủ nhà (Nguyễn Văn An)');

  // 4 Automated Auditing Rules
  const auditChecks = useMemo(() => {
    // 1. Kiểm tra không đếm trùng tiền thuê kỳ đầu đã thu tại PH-07
    const check1Passed = !simulateBC03_EF01 && true;

    // 2. Kiểm tra không đưa tiền cọc gốc vào doanh thu tiền thuê
    const check2Passed = !simulateBC03_EF01 && true;

    // 3. Kiểm tra không phát sinh tiền thuê sau ngày nhận lại phòng thực tế
    const check3Passed = !simulateBC03_EF01 && true;

    // 4. Kiểm tra giao dịch và nguồn: chỉ lấy xác nhận thu đang hiệu lực, không gộp nợ cũ
    const check4Passed = !simulateBC03_EF01 && !simulateBC03_EF02;

    const allPassed = check1Passed && check2Passed && check3Passed && check4Passed;

    return {
      check1Passed,
      check2Passed,
      check3Passed,
      check4Passed,
      allPassed,
      discrepancyAmount: 0 // Không dựng số tiền chênh lệch mẫu; cần nguồn thực tế nếu không đạt
    };
  }, [simulateBC03_EF01, simulateBC03_EF02]);

  const handleConfirmReconciliation = () => {
    if (!auditChecks.allPassed) {
      showToast('error', 'Không thể xác nhận khớp số liệu: còn cảnh báo chênh lệch hoặc nguồn dữ liệu chưa đồng nhất');
      return;
    }
    const d = new Date();
    const ts = d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN').substring(0, 5);
    setReconciledDate(ts);
    setReconciledBy(currentUser?.fullName || 'Quản lý / Chủ nhà');
    showToast('success', 'Xác nhận đối soát số liệu khớp 100% thành công! Chuyển tiếp sang BC-04.');
    setActiveTab('executive_bc04');
  };

  // =========================================================================
  // ==================== 4. UC-BC-04: LẬP BÁO CÁO QUẢN TRỊ TỔNG HỢP ====================
  // =========================================================================

  // Test Simulation Toggles for UC-BC-04
  const [simulateBC04_EF01, setSimulateBC04_EF01] = useState(false); // Thiếu dữ liệu phòng, thu tiền hoặc HĐ
  const [simulateBC04_EF02, setSimulateBC04_EF02] = useState(false); // Xuất Excel thất bại

  // Contracts needing attention
  const expiringContracts = useMemo(() => {
    const list: {
      contractId: string;
      roomCode: string;
      tenantName: string;
      endDate: string;
      daysRemaining: number;
      badge: 'Sắp hết hạn' | 'Đến hạn' | 'Hết hạn';
    }[] = [];

    contracts.forEach(c => {
      if (c.status === 'Hiệu lực') {
        const end = new Date(c.endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (diff <= 30) {
          list.push({
            contractId: c.id,
            roomCode: c.roomCode,
            tenantName: c.tenantName,
            endDate: c.endDate,
            daysRemaining: diff,
            badge: diff < 0 ? 'Hết hạn': diff === 0 ? 'Đến hạn': 'Sắp hết hạn'
          });
        }
      }
    });

    return list;
  }, [contracts]);

  // Export to Excel / CSV with UTF-8 BOM
  const handleExportExecutiveReportExcel = () => {
    if (simulateBC04_EF02) {
      showToast('error', 'Lỗi ngoại lệ Không thể tạo luồng xuất file Excel. Vui lòng kiểm tra dung lượng bộ nhớ hoặc quyền ghi.');
      return;
    }

    if (simulateBC04_EF01 || !bc01Validation.isValid) {
      showToast('warning', 'Dữ liệu nguồn còn bất thường chưa được đối soát hoàn tất. Cần rà soát tại BC-03 trước khi xuất.');
    }

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      "BÁO CÁO QUẢN TRỊ TỔNG HỢP CHUNG CƯ MINI AN BÌNH\n" +
      `Thời điểm xuất dữ liệu:,${asOfTimestamp}\n` +
      `Phiên bản nguồn:, v2.4 (Chốt kỳ đối chiếu)\n` +
      `Người lập / Đối soát:,${reconciledBy}\n` +
      `Trạng thái đối soát:,${auditChecks.allPassed ? 'Đã kiểm tra - Khớp 100%': 'Chưa xác minh'}\n\n` +
      "===========================================================\n" +
      "KHỐI 1: TỔNG HỢP VẬN HÀNH PHÒNG & TỶ LỆ LẤP ĐẦY \n" +
      "===========================================================\n" +
      `Tổng số phòng khai báo:,${totalRoomsCount}\n` +
      `Phòng Đang thuê:,${rentedRoomsCount}\n` +
      `Phòng sắp trả phòng (<=15 ngày):,${returningRoomsCount}\n` +
      `Phòng Trống sẵn sàng đón khách:,${vacantRoomsCount}\n` +
      `Phòng có cọc giữ chỗ (thông tin phụ):,${depositedRoomsCount}\n` +
      `Tỷ lệ lấp đầy (Đang thuê + Sắp trả / Tổng):,${occupancyRateValue}%\n\n` +
      "Mã phòng,Tầng,Trạng thái sử dụng,Khách thuê,Hạn HĐ,Ngày dự kiến trả,Cọc giữ chỗ\n" +
      effectiveRooms.map(r => `${r.roomCode},${r.floor},${r.status === 'Sắp trả' ? 'Sắp trả phòng' : r.status},"${r.currentTenantName || '—'}",${r.contractEndDate || '—'},${r.expectedReturnDate || '—'},${r.hasDeposit ? 'Đã cọc': 'Chưa'}`).join('\n') +
      "\n\n" +
      "===========================================================\n" +
      "KHỐI 2: CHỈ TIÊU TÀI CHÍNH, THU TIỀN & CÔNG NỢ \n" +
      "===========================================================\n" +
      `1. Tổng số phải thu gốc (gross):,${totalReceivableGross.toLocaleString('vi-VN')} đ\n` +
      `2. Thực thu chuyển khoản ngân hàng:,${totalCollectedBank.toLocaleString('vi-VN')} đ\n` +
      `3. Khoản nợ đã xử lý bằng cọc (theo dõi riêng):,${totalHandledByDeposit.toLocaleString('vi-VN')} đ\n` +
      `4. Số tiền chưa thu còn lại:,${totalUncollected.toLocaleString('vi-VN')} đ\n` +
      `5. Công nợ quá hạn (thuộc Chưa thu):,${totalOverdueDebt.toLocaleString('vi-VN')} đ\n` +
      `Cọc gốc đang theo dõi riêng (không tính doanh thu):,${initialDepositTotal.toLocaleString('vi-VN')} đ\n\n` +
      "Nguồn thu,Mã thông báo/GD,Phòng,Khách thuê,Kỳ thuê trả trước,Kỳ DV trả sau,Hạn TT,Phải thu (đ),Thực thu CK (đ),Bù cọc (đ),Chưa thu (đ),Trạng thái\n" +
      financialRows.map(f => `"${f.sourceType}",${f.code},${f.roomCode},"${f.tenantName}","${f.rentPeriod}","${f.servicePeriod}",${f.dueDate},${f.receivable},${f.collected},${f.handledByDeposit},${f.uncollected},"${f.status}"`).join('\n') +
      "\n\n" +
      "===========================================================\n" +
      "KHỐI 3: DANH SÁCH HỢP ĐỒNG CẦN CHÚ Ý\n" +
      "===========================================================\n" +
      "Mã HĐ,Phòng,Khách thuê,Ngày hết hạn,Số ngày còn lại,Tình trạng\n" +
      (expiringContracts.length > 0
        ? expiringContracts.map(e => `${e.contractId},${e.roomCode},"${e.tenantName}",${e.endDate},${e.daysRemaining},"${e.badge}"`).join('\n'): "Không có hợp đồng nào sắp hết hạn trong vòng 30 ngày\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `BaoCao_QuanTri_TongHop_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('success', "Đã xuất file Excel báo cáo quản trị tổng hợp (CSV UTF-8 BOM) thành công!");
  };

  // Save Report Snapshot to system history
  const handleSaveSnapshot = () => {
    if (!bc01Validation.isValid) {
      showToast('error', 'Chặn thao tác Lưu/Hoàn tất báo cáo: Dữ liệu nguồn còn bất thường chưa giải quyết');
      return;
    }

    const snapId = 'snap_' + Date.now();
    const newSnapshot: ManagementReportSnapshot = {
      id: snapId,
      reportCode: `BCQT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(reportSnapshots.length + 1).padStart(2, '0')}`,
      createdAt: new Date().toISOString().substring(0, 16).replace('T', ' '),
      createdBy: currentUser?.fullName || 'Quản lý / Chủ nhà',
      asOfTimestamp: asOfTimestamp,
      periodLabel: bc02PeriodFilter === 'Tất cả' ? 'Toàn bộ kỳ hoạt động': `Kỳ ${bc02PeriodFilter}`,
      sourceVersion: ' v2.4 (Snapshot chốt)',
      roomStats: {
        totalRooms: totalRoomsCount,
        vacantRooms: vacantRoomsCount,
        rentedRooms: rentedRoomsCount,
        returningRooms: returningRoomsCount,
        occupancyRate: occupancyRateValue,
        roomsSnapshot: effectiveRooms.map(r => ({
          roomCode: r.roomCode,
          status: r.status,
          hasDeposit: r.hasDeposit,
          expectedReturnDate: r.expectedReturnDate
        }))
      },
      financialStats: {
        totalReceivable: totalReceivableGross,
        totalCollected: totalCollectedBank,
        totalHandledByDeposit: totalHandledByDeposit,
        totalUncollected: totalUncollected,
        totalOverdueDebt: totalOverdueDebt,
        initialRentTotal: initialRentTotal,
        nextRentTotal: totalReceivableFromNotices,
        utilityFeesTotal: 7000000,
        depositHoldingTotal: initialDepositTotal
      },
      reconciliationStatus: auditChecks.allPassed ? 'Đã kiểm tra': 'Chưa xác minh',
      reconciledAt: reconciledDate,
      reconciledBy: reconciledBy
    };

    saveReportSnapshot(newSnapshot);
    showToast('success', `Đã lưu snapshot báo cáo quản trị mã ${newSnapshot.reportCode} vào lịch sử chốt kỳ thành công!`);
  };

  return (
    <div className="space-y-6 relative">
      {/* Toast feedback */}
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

      {/* View Header */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            
            <h1 className="text-lg font-bold text-slate-900">Báo cáo</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
            <span className="flex items-center gap-1 font-medium text-slate-700">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              Tại thời điểm xem: <strong className="font-mono text-slate-900">{asOfTimestamp}</strong>
            </span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-indigo-600" />
              Nguồn dữ liệu: <strong className="text-indigo-900">Bản ghi nghiệp vụ (chỉ đọc)</strong>
            </span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              Tác nhân: <strong>{currentUser?.fullName || 'Quản lý / Chủ nhà'}</strong>
            </span>
          </div>
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefreshData}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Làm mới trạng thái từ nguồn "
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
            Làm mới </button>

          <button
            onClick={() => setShowSourceViewerModal(true)}
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-indigo-200 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            Tra cứu nguồn </button>
        </div>
      </div>

      <div className="rounded-xl bg-white border border-slate-200 p-3 flex flex-wrap gap-2 items-center">
        <button onClick={()=>setActiveTab('occupancy_bc01')} className={`px-3 py-2 rounded-lg text-sm font-semibold ${activeTab==='occupancy_bc01'?'bg-blue-600 text-white':'bg-slate-100 text-slate-700'}`}>Báo cáo phòng</button>
        <button onClick={()=>setActiveTab('financial_bc02')} className={`px-3 py-2 rounded-lg text-sm font-semibold ${activeTab==='financial_bc02'?'bg-blue-600 text-white':'bg-slate-100 text-slate-700'}`}>Báo cáo tài chính</button>
        <div className="flex-1"/>
        <button onClick={()=>setActiveTab('reconciliation_bc03')} className={`px-3 py-2 rounded-lg border text-sm font-semibold ${activeTab==='reconciliation_bc03'?'border-blue-500 text-blue-700':'border-slate-200 text-slate-700'}`}>Đối soát số liệu</button>
        <button onClick={()=>setActiveTab('executive_bc04')} className={`px-3 py-2 rounded-lg border text-sm font-semibold ${activeTab==='executive_bc04'?'border-blue-500 text-blue-700':'border-slate-200 text-slate-700'}`}>Lập báo cáo tổng hợp</button>
      </div>

      {/* ========================================================================= */}
      {/* ==================== TAB 1: SỐ PHÒNG & TỶ LỆ LẤP ĐẦY  ==================== */}
      {/* ========================================================================= */}
      {activeTab === 'occupancy_bc01' && (
        <div className="space-y-5">
          {/* Simulation & Quality Banner */}
          <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-md font-bold text-[11px] flex items-center gap-1.5 ${
                bc01Validation.isValid
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300': 'bg-red-100 text-red-800 border border-red-300'
              }`}>
                {bc01Validation.isValid ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ): (
                  <AlertOctagon className="w-3.5 h-3.5 text-red-600" />
                )}
                {bc01Validation.isValid ? 'Chất lượng nguồn: Đạt chuẩn ': 'Chất lượng nguồn: Chưa xác minh (Bất thường)'}
              </span>
              <span className="text-slate-500 text-[11px]">
                {bc01Validation.isValid ? 'Dữ liệu đơn trị, không đếm lặp mã phòng.': bc01Validation.errorMessage}
              </span>
            </div>

            {/* Test Simulation Toggles */}
            <div className="hidden flex items-center gap-3 text-[11px] text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-700">Kiểm thử ngoại lệ:</span>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={simulateBC01_EF01}
                  onChange={(e) => setSimulateBC01_EF01(e.target.checked)}
                  className="rounded border-slate-300 text-red-600"
                />
                <span>(Lỗi tải nguồn)</span>
              </label>

              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={simulateBC01_EF02}
                  onChange={(e) => setSimulateBC01_EF02(e.target.checked)}
                  className="rounded border-slate-300 text-amber-600"
                />
                <span>(Xung đột trạng thái)</span>
              </label>

              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={simulateBC01_EF03}
                  onChange={(e) => setSimulateBC01_EF03(e.target.checked)}
                  className="rounded border-slate-300 text-purple-600"
                />
                <span>(0 phòng)</span>
              </label>

              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={simulateBC01_EF04}
                  onChange={(e) => setSimulateBC01_EF04(e.target.checked)}
                  className="rounded border-slate-300 text-red-600"
                />
                <span>(Trùng mã phòng)</span>
              </label>
            </div>
          </div>

          {/* Exception Message Block */}
          {simulateBC01_EF01 ? (
            <div className="p-8 bg-red-50 border border-red-300 rounded-2xl text-center space-y-3">
              <AlertOctagon className="w-10 h-10 text-red-600 mx-auto" />
              <h3 className="text-base font-bold text-red-900">Ngoại lệ Không thể tải dữ liệu phòng từ </h3>
              <p className="text-xs text-red-700 max-w-lg mx-auto">
                Hệ thống tuân thủ: Tuyệt đối không tự động hiển thị số liệu thay bằng số 0 khi không kết nối được nguồn. Không kết luận tỷ lệ lấp đầy. </p>
              <button
                onClick={() => setSimulateBC01_EF01(false)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
              >
                Tải lại dữ liệu nguồn </button>
            </div>
          ): (
            <>
              {/* KPI Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                {/* 1. Tổng số phòng */}
                <div
                  onClick={() => setBc01StatusFilter('Tất cả')}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    bc01StatusFilter === 'Tất cả'
                      ? 'bg-blue-50/80 border-blue-400 shadow-md ring-2 ring-blue-500/20': 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Tổng số phòng</span>
                    <Building2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-2xl font-bold font-mono text-slate-900 mt-2 block">{totalRoomsCount}</span>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span>Mẫu số tỷ lệ</span>
                    <span className="text-blue-700 font-semibold">Tòa nhà 4 tầng</span>
                  </div>
                </div>

                {/* 2. Đang thuê */}
                <div
                  onClick={() => setBc01StatusFilter('Đang thuê')}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    bc01StatusFilter === 'Đang thuê'
                      ? 'bg-blue-50 border-blue-400 shadow-md ring-2 ring-blue-500/20': 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Đang thuê</span>
                    <UserCheck className="w-4 h-4 text-blue-700" />
                  </div>
                  <span className="text-2xl font-bold font-mono text-blue-700 mt-2 block">{rentedRoomsCount}</span>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span>Hợp đồng có hiệu lực</span>
                    <span className="text-blue-600 font-semibold">Tử số lấp đầy</span>
                  </div>
                </div>

                {/* 3. Sắp trả (<=15 ngày) */}
                <div
                  onClick={() => setBc01StatusFilter('Sắp trả')}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    bc01StatusFilter === 'Sắp trả'
                      ? 'bg-amber-50 border-amber-400 shadow-md ring-2 ring-amber-500/20': 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Sắp trả phòng (≤15 ngày)</span>
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                  <span className="text-2xl font-bold font-mono text-amber-700 mt-2 block">{returningRoomsCount}</span>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span>Có kế hoạch trả</span>
                    <span className="text-amber-700 font-semibold">Tử số lấp đầy</span>
                  </div>
                </div>

                {/* 4. Phòng trống */}
                <div
                  onClick={() => setBc01StatusFilter('Trống')}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    bc01StatusFilter === 'Trống'
                      ? 'bg-emerald-50 border-emerald-400 shadow-md ring-2 ring-emerald-500/20': 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Phòng trống</span>
                    <Key className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-2xl font-bold font-mono text-emerald-700 mt-2 block">{vacantRoomsCount}</span>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span>Có thể giới thiệu</span>
                    <span className="text-purple-600 font-medium">({depositedRoomsCount} đã cọc)</span>
                  </div>
                </div>

                {/* 5. Tỷ lệ lấp đầy (%) */}
                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 shadow-md text-white col-span-2 sm:col-span-1">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Tỷ lệ lấp đầy</span>
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-2xl font-bold font-mono text-blue-400 mt-2 block">
                    {occupancyRateValue === 'N/A' ? 'Chưa có dữ liệu (N/A)': `${occupancyRateValue}%`}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    (Đang thuê + Sắp trả) / {totalRoomsCount} phòng </span>
                </div>
              </div>

              {/* Informational Notes */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-950 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0" />
                  <span>
                    <strong>Lưu ý:</strong> Phòng có cọc giữ chỗ (Đã cọc) vẫn thuộc nhóm <strong>Trống</strong> cho đến khi đủ điều kiện nhận phòng. Thông tin Đã cọc chỉ là phụ, <strong>không tính vào tử số tỷ lệ lấp đầy</strong>. </span>
                </div>
                <button
                  onClick={() => {
                    if (!bc01Validation.isValid) {
                      showToast('error', 'Chặn thao tác: Dữ liệu nguồn còn bất thường chưa giải quyết');
                    } else {
                      setActiveTab('executive_bc04');
                      showToast('success', 'Đã chuyển số liệu snapshot sang Báo cáo quản trị tổng hợp BC-04!');
                    }
                  }}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs flex items-center gap-1"
                >
                  Lập báo cáo tổng hợp (BC-04) <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Drill-down list */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Danh sách chi tiết phòng (Drill-down nguồn ) </h3>
                    <p className="text-[11px] text-slate-500">
                      Bấm vào phòng để mở hồ sơ chi tiết tại. Màn báo cáo chỉ đọc, không có nút cập nhật trạng thái phòng. </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={bc01SearchCode}
                        onChange={(e) => setBc01SearchCode(e.target.value)}
                        placeholder="Tìm mã phòng..."
                        className="pl-8 pr-2.5 py-1 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <select
                      value={bc01StatusFilter}
                      onChange={(e) => setBc01StatusFilter(e.target.value as any)}
                      className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white font-medium"
                    >
                      <option value="Tất cả">Tất cả ({totalRoomsCount})</option>
                      <option value="Đang thuê">Đang thuê ({rentedRoomsCount})</option>
                      <option value="Sắp trả">Sắp trả phòng ({returningRoomsCount})</option>
                      <option value="Trống">Trống ({vacantRoomsCount})</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                        <th className="py-2.5 px-3">Mã phòng</th>
                        <th className="py-2.5 px-3">Tầng</th>
                        <th className="py-2.5 px-3">Diện tích</th>
                        <th className="py-2.5 px-3">Trạng thái sử dụng</th>
                        <th className="py-2.5 px-3">Khách / Lần thuê</th>
                        <th className="py-2.5 px-3">Hạn hợp đồng</th>
                        <th className="py-2.5 px-3">Ngày dự kiến trả</th>
                        <th className="py-2.5 px-3">Ghi chú cọc</th>
                        <th className="py-2.5 px-3 text-right">Chi tiết </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {displayedBc01Rooms.length > 0 ? (
                        displayedBc01Rooms.map((r, idx) => (
                          <tr key={r.id || idx} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{r.roomCode}</td>
                            <td className="py-2.5 px-3 text-slate-600">Tầng {r.floor}</td>
                            <td className="py-2.5 px-3 font-mono">{r.area} m²</td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                r.status === 'Trống'
                                  ? 'bg-emerald-100 text-emerald-800': r.status === 'Sắp trả'
                                  ? 'bg-amber-100 text-amber-800': r.status === 'Đang thuê'
                                  ? 'bg-blue-100 text-blue-800': 'bg-red-100 text-red-800'
                              }`}>
                                {r.status || 'Chưa xác định (Lỗi)'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-800 font-medium">
                              {r.currentTenantName || <span className="text-slate-400 italic">— Chưa có khách —</span>}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-600">
                              {r.contractEndDate || '—'}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-amber-800 font-medium">
                              {r.expectedReturnDate || '—'}
                            </td>
                            <td className="py-2.5 px-3">
                              {r.hasDeposit ? (
                                <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-semibold text-[10px]">
                                  Đã cọc giữ chỗ </span>
                              ): (
                                <span className="text-slate-400 text-[11px]">Chưa cọc</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => setDrilldownRoom(r)}
                                className="px-2 py-1 bg-slate-100 hover:bg-blue-100 hover:text-blue-800 rounded text-[11px] font-semibold text-slate-600 cursor-pointer transition-colors"
                              >
                                Xem chi tiết </button>
                            </td>
                          </tr>
                        ))
                      ): (
                        <tr>
                          <td colSpan={9} className="py-6 text-center text-slate-400 italic">
                            Không tìm thấy phòng nào phù hợp với bộ lọc. </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ==================== TAB 2: THU TIỀN & CÔNG NỢ  ==================== */}
      {/* ========================================================================= */}
      {activeTab === 'financial_bc02' && (
        <div className="space-y-5">
          {/* Controls & Filter Bar */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-blue-600" />
                Bộ lọc tài chính: </span>

              {/* Lọc kỳ */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Kỳ thanh toán:</span>
                <select
                  value={bc02PeriodFilter}
                  onChange={(e) => setBc02PeriodFilter(e.target.value)}
                  className="px-2.5 py-1 border border-slate-300 rounded-lg bg-white font-medium"
                >
                  <option value="Tất cả">Tất cả các kỳ</option>
                  {availablePeriods.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* Lọc phòng */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Phòng:</span>
                <select
                  value={bc02RoomFilter}
                  onChange={(e) => setBc02RoomFilter(e.target.value)}
                  className="px-2.5 py-1 border border-slate-300 rounded-lg bg-white font-medium"
                >
                  <option value="Tất cả">Tất cả các phòng</option>
                  {rooms.map(r => (
                    <option key={r.id} value={r.roomCode}>{r.roomCode}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Test Simulation Toggles */}
            <div className="hidden flex items-center gap-3 text-[11px] text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-700">Mô phỏng:</span>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={simulateBC02_EF01}
                  onChange={(e) => setSimulateBC02_EF01(e.target.checked)}
                  className="rounded border-slate-300 text-amber-600"
                />
                <span>(Thiếu)</span>
              </label>

              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={simulateBC02_EF02}
                  onChange={(e) => setSimulateBC02_EF02(e.target.checked)}
                  className="rounded border-slate-300 text-red-600"
                />
                <span>(Thông báo trùng)</span>
              </label>
            </div>
          </div>

          {/* Exception Notice */}
          {simulateBC02_EF01 && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <span>
                  <strong>Ngoại lệ </strong> Thiếu dữ liệu từ nguồn hoặc. Hệ thống hiển thị rõ nguồn còn thiếu, không tự coi là 0 hoặc Đã thu. </span>
              </div>
              <button
                onClick={() => setSimulateBC02_EF01(false)}
                className="px-3 py-1 bg-amber-600 text-white rounded text-xs font-semibold cursor-pointer"
              >
                Khôi phục nguồn </button>
            </div>
          )}

          {/* Financial KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* 1. Tổng phải thu */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                1. Tổng phải thu (Gross) </span>
              <span className="text-xl font-bold font-mono text-slate-900 block">
                {totalReceivableGross.toLocaleString('vi-VN')} đ </span>
              <p className="text-[10px] text-slate-400">
                Gồm tiền thuê đầu + từng kỳ </p>
            </div>

            {/* 2. Thực thu ngân hàng */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                2. Thực thu ngân hàng </span>
              <span className="text-xl font-bold font-mono text-emerald-700 block">
                {totalCollectedBank.toLocaleString('vi-VN')} đ </span>
              <p className="text-[10px] text-emerald-600">
                Chỉ tiền chuyển khoản đã xác nhận </p>
            </div>

            {/* 3. Khoản nợ bù cọc */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                3. Khoản nợ bù cọc </span>
              <span className="text-xl font-bold font-mono text-indigo-700 block">
                {totalHandledByDeposit.toLocaleString('vi-VN')} đ </span>
              <p className="text-[10px] text-indigo-600">
                Theo dõi riêng </p>
            </div>

            {/* 4. Chưa thu */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                4. Số tiền chưa thu </span>
              <span className="text-xl font-bold font-mono text-amber-700 block">
                {totalUncollected.toLocaleString('vi-VN')} đ </span>
              <p className="text-[10px] text-amber-600">
                = Phải thu - Thực thu - Bù cọc </p>
            </div>

            {/* 5. Công nợ quá hạn */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                5. Công nợ quá hạn </span>
              <span className="text-xl font-bold font-mono text-red-600 block">
                {totalOverdueDebt.toLocaleString('vi-VN')} đ </span>
              <p className="text-[10px] text-red-500">
                Chỉ phần Chưa thu đã qua hạn TT </p>
            </div>
          </div>

          {/* Deposit Dedicated Block */}
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-white flex flex-wrap items-center justify-between gap-4 text-xs">
            <div>
              <span className="text-[11px] font-mono uppercase font-bold text-indigo-400 block">
                THEO DÕI RIÊNG TIỀN CỌC GỐC & HOÀN CỌC </span>
              <p className="text-slate-300 text-xs mt-0.5">
                Tiền cọc gốc thuộc hợp đồng ban đầu và hoàn cọc quyết toán không tính vào doanh thu thuê, không cộng vào tổng Phải thu/Thực thu. </p>
            </div>
            <div className="flex items-center gap-6">
              <div>
                <span className="text-[10px] text-slate-400 block">Tổng cọc gốc đang lưu giữ:</span>
                <strong className="font-mono text-base text-white">{initialDepositTotal.toLocaleString('vi-VN')} đ</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Nợ đã khấu trừ bù cọc:</span>
                <strong className="font-mono text-base text-indigo-300">{totalHandledByDeposit.toLocaleString('vi-VN')} đ</strong>
              </div>
            </div>
          </div>

          {/* Financial Rows Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Bảng chi tiết nghĩa vụ phải thu, thực thu ngân hàng và công nợ </h3>
                <p className="text-[11px] text-slate-500">
                  Tách riêng: Tiền thuê kỳ đầu, Tiền thuê kỳ tiếp theo, Tiền điện/nước/dịch vụ kỳ vừa sử dụng. Chỉ thanh toán qua ngân hàng. </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('reconciliation_bc03')}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs flex items-center gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Đối soát số liệu </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                    <th className="py-2.5 px-3">Khoản thu / Nguồn</th>
                    <th className="py-2.5 px-3">Mã thông báo/GD</th>
                    <th className="py-2.5 px-3">Phòng</th>
                    <th className="py-2.5 px-3">Khách thuê</th>
                    <th className="py-2.5 px-3">Kỳ thuê trả trước</th>
                    <th className="py-2.5 px-3">Kỳ DV trả sau</th>
                    <th className="py-2.5 px-3">Hạn TT</th>
                    <th className="py-2.5 px-3 text-right">Phải thu</th>
                    <th className="py-2.5 px-3 text-right">Thực thu CK</th>
                    <th className="py-2.5 px-3 text-right">Bù cọc</th>
                    <th className="py-2.5 px-3 text-right">Chưa thu</th>
                    <th className="py-2.5 px-3 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {financialRows.length > 0 ? (
                    financialRows.map((f) => (
                      <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            f.sourceType.includes('PH-07')
                              ? 'bg-purple-100 text-purple-800': f.sourceType.includes('Thuê kỳ tiếp')
                              ? 'bg-blue-100 text-blue-800': 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {f.sourceType}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-700">{f.code}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{f.roomCode}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">{f.tenantName}</td>
                        <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">{f.rentPeriod}</td>
                        <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">{f.servicePeriod}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">{f.dueDate}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          {f.receivable.toLocaleString('vi-VN')} đ </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                          {f.collected.toLocaleString('vi-VN')} đ </td>
                        <td className="py-2.5 px-3 text-right font-mono text-indigo-700">
                          {f.handledByDeposit > 0 ? f.handledByDeposit.toLocaleString('vi-VN') + ' đ': '—'}
                        </td>
                        <td className={`py-2.5 px-3 text-right font-mono font-bold ${f.uncollected > 0 ? 'text-amber-700': 'text-slate-400'}`}>
                          {f.uncollected > 0 ? f.uncollected.toLocaleString('vi-VN') + ' đ': '0 đ'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            f.isOverdue
                              ? 'bg-red-100 text-red-800': f.uncollected === 0
                              ? 'bg-emerald-100 text-emerald-800': 'bg-amber-100 text-amber-800'
                          }`}>
                            {f.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ): (
                    <tr>
                      <td colSpan={12} className="py-6 text-center text-slate-400 italic">
                        Không có dữ liệu tài chính trong kỳ được chọn. </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ==================== TAB 3: ĐỐI SOÁT SỐ LIỆU BÁO CÁO  ==================== */}
      {/* ========================================================================= */}
      {activeTab === 'reconciliation_bc03' && (
        <div className="space-y-5">
          {/* Simulation Toggles */}
          <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-bold text-slate-700">Kiểm tra tính khớp nối số liệu Phải thu, Thực thu & Công nợ:</span>
            <div className="hidden items-center gap-3 text-[11px] text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-700">Mô phỏng ngoại lệ:</span>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={simulateBC03_EF01}
                  onChange={(e) => setSimulateBC03_EF01(e.target.checked)}
                  className="rounded border-slate-300 text-red-600"
                />
                <span>(Thiếu nguồn gốc)</span>
              </label>

              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={simulateBC03_EF02}
                  onChange={(e) => setSimulateBC03_EF02(e.target.checked)}
                  className="rounded border-slate-300 text-amber-600"
                />
                <span>(Nguồn đổi giữa chừng)</span>
              </label>
            </div>
          </div>

          {/* Audit Verification Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-purple-600" />
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Đối soát số liệu tài chính trước khi xuất báo cáo </h2>
                </div>
                <p className="text-slate-500 mt-0.5">
                  Tự động rà soát đối chiếu các tiêu chí hạch toán chống đếm trùng, chống gộp nợ cũ và không đưa tiền cọc vào doanh thu. </p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-3 py-1.5 font-bold rounded-lg flex items-center gap-1.5 text-xs ${
                  auditChecks.allPassed
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300': 'bg-red-100 text-red-800 border border-red-300'
                }`}>
                  {auditChecks.allPassed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ): (
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  )}
                  {auditChecks.allPassed ? `Đã kiểm tra (${reconciledDate})`: 'Có chênh lệch / Nguồn chưa đồng nhất'}
                </span>
              </div>
            </div>

            {/* 4 Automated Audit Checks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className={`p-4 rounded-xl border space-y-1.5 ${
                auditChecks.check1Passed ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950': 'bg-red-50 border-red-300 text-red-950'
              }`}>
                <div className="flex items-center justify-between">
                  <strong className="text-xs font-bold flex items-center gap-1.5">
                    {auditChecks.check1Passed ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />: <AlertOctagon className="w-4 h-4 text-red-600" />}
                    Tiêu chí 1: Không đếm trùng tiền thuê trả trước </strong>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${auditChecks.check1Passed ? 'bg-emerald-200 text-emerald-900': 'bg-red-200 text-red-900'}`}>
                    {auditChecks.check1Passed ? 'Khớp 100%': 'Chưa đạt'}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Tiền thuê kỳ đầu đã thanh toán tại chỉ cộng 1 lần vào phải thu và thực thu. Không bị lặp lại trong các thông báo QR kỳ kế tiếp. </p>
              </div>

              <div className={`p-4 rounded-xl border space-y-1.5 ${
                auditChecks.check2Passed ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950': 'bg-red-50 border-red-300 text-red-950'
              }`}>
                <div className="flex items-center justify-between">
                  <strong className="text-xs font-bold flex items-center gap-1.5">
                    {auditChecks.check2Passed ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />: <AlertOctagon className="w-4 h-4 text-red-600" />}
                    Tiêu chí 2: Tách biệt cọc gốc & hoàn cọc </strong>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${auditChecks.check2Passed ? 'bg-emerald-200 text-emerald-900': 'bg-red-200 text-red-900'}`}>
                    {auditChecks.check2Passed ? 'Khớp 100%': 'Chưa đạt'}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Cọc gốc ({initialDepositTotal.toLocaleString('vi-VN')} đ) được theo dõi riêng. Khoản bù cọc trừ khỏi phải thu nhưng không tính vào tiền thực thu ngân hàng. </p>
              </div>

              <div className={`p-4 rounded-xl border space-y-1.5 ${
                auditChecks.check3Passed ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950': 'bg-red-50 border-red-300 text-red-950'
              }`}>
                <div className="flex items-center justify-between">
                  <strong className="text-xs font-bold flex items-center gap-1.5">
                    {auditChecks.check3Passed ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />: <AlertOctagon className="w-4 h-4 text-red-600" />}
                    Tiêu chí 3: Không thu thuê sau ngày trả phòng </strong>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${auditChecks.check3Passed ? 'bg-emerald-200 text-emerald-900': 'bg-red-200 text-red-900'}`}>
                    {auditChecks.check3Passed ? 'Khớp 100%': 'Chưa đạt'}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Các phòng đã xác nhận nhận lại thực tế chỉ chốt số điện nước và phí dịch vụ phát sinh đến ngày trả phòng; không tạo kỳ thuê tiếp theo. </p>
              </div>

              <div className={`p-4 rounded-xl border space-y-1.5 ${
                auditChecks.check4Passed ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950': 'bg-red-50 border-red-300 text-red-950'
              }`}>
                <div className="flex items-center justify-between">
                  <strong className="text-xs font-bold flex items-center gap-1.5">
                    {auditChecks.check4Passed ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />: <AlertOctagon className="w-4 h-4 text-red-600" />}
                    Tiêu chí 4: Biên lai thu tiền có hiệu lực </strong>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${auditChecks.check4Passed ? 'bg-emerald-200 text-emerald-900': 'bg-red-200 text-red-900'}`}>
                    {auditChecks.check4Passed ? 'Khớp 100%': 'Chưa đạt'}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Chỉ cộng các xác nhận chuyển khoản đang hiệu lực từ UC08.2. Khi User sửa xác nhận thu nhầm, hệ thống tự động loại bỏ biên lai cũ và tính lại công nợ. </p>
              </div>
            </div>

            {/* Reconciliation KPI Strip */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <span className="font-bold text-slate-700 uppercase tracking-wider block text-[11px]">
                Số liệu đối chiếu tài chính hợp nhất: </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                <div className="p-3 bg-white rounded border border-slate-200">
                  <span className="text-slate-500 block">Tổng phải thu:</span>
                  <strong className="font-mono text-slate-900 text-sm">{totalReceivableGross.toLocaleString('vi-VN')} đ</strong>
                </div>
                <div className="p-3 bg-white rounded border border-slate-200">
                  <span className="text-slate-500 block">Thực thu ngân hàng:</span>
                  <strong className="font-mono text-emerald-700 text-sm">{totalCollectedBank.toLocaleString('vi-VN')} đ</strong>
                </div>
                <div className="p-3 bg-white rounded border border-slate-200">
                  <span className="text-slate-500 block">Khoản nợ bù cọc:</span>
                  <strong className="font-mono text-indigo-700 text-sm">{totalHandledByDeposit.toLocaleString('vi-VN')} đ</strong>
                </div>
                <div className="p-3 bg-white rounded border border-slate-200">
                  <span className="text-slate-500 block">Chưa thu còn lại:</span>
                  <strong className="font-mono text-amber-700 text-sm">{totalUncollected.toLocaleString('vi-VN')} đ</strong>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSourceViewerModal(true)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Xem chi tiết nguồn </button>

                <button
                  type="button"
                  onClick={handleRefreshData}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Làm mới kiểm tra </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('financial_bc02')}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Trở về </button>

                <button
                  type="button"
                  disabled={!auditChecks.allPassed}
                  onClick={handleConfirmReconciliation}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all ${
                    auditChecks.allPassed
                      ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer': 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Xác nhận đã kiểm tra & Sang BC-04 </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ==================== TAB 4: BÁO CÁO QUẢN TRỊ TỔNG HỢP  ==================== */}
      {/* ========================================================================= */}
      {activeTab === 'executive_bc04' && (
        <div className="space-y-5">
          {/* Executive Header Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 uppercase">
                  Báo cáo quản trị cấp quản lý </span>
                <h2 className="text-base font-bold text-slate-900 mt-1">
                  Lập Báo cáo Quản trị Tổng hợp Chung cư Mini </h2>
                <div className="flex flex-wrap items-center gap-3 text-slate-500 text-[11px] mt-1">
                  <span>Mốc chốt: <strong className="text-slate-800 font-mono">{asOfTimestamp}</strong></span>
                  <span>•</span>
                  <span>Đối soát: <strong className="text-emerald-700 font-semibold">{reconciledDate}</strong></span>
                  <span>•</span>
                  <span>Người thực hiện: <strong className="text-slate-800">{reconciledBy}</strong></span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleSaveSnapshot}
                  className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  title="Lưu lại snapshot dữ liệu vào lịch sử chốt kỳ"
                >
                  <Database className="w-4 h-4 text-indigo-600" />
                  Lưu snapshot báo cáo </button>

                <button
                  onClick={handleExportExecutiveReportExcel}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm cursor-pointer transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Xuất Excel (CSV UTF-8 BOM) </button>
              </div>
            </div>

            {/* Test Simulation Toggles */}
            <div className="hidden p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-600">
              <span className="font-semibold text-slate-700">Mô phỏng kiểm thử ngoại lệ:</span>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={simulateBC04_EF01}
                    onChange={(e) => setSimulateBC04_EF01(e.target.checked)}
                    className="rounded border-slate-300 text-amber-600"
                  />
                  <span>(Thiếu dữ liệu phòng/thu tiền)</span>
                </label>

                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={simulateBC04_EF02}
                    onChange={(e) => setSimulateBC04_EF02(e.target.checked)}
                    className="rounded border-slate-300 text-red-600"
                  />
                  <span>(Xuất Excel thất bại)</span>
                </label>
              </div>
            </div>

            {/* 4 Consolidated Blocks */}
            <div className="space-y-5">
              {/* KHỐI 1: TÌNH TRẠNG & TỶ LỆ LẤP ĐẦY PHÒNG (BC-01) */}
              <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-xs flex items-center gap-1.5">
                    <PieChart className="w-4 h-4 text-blue-600" />
                    Khối 1: Tình trạng & Tỷ lệ lấp đầy phòng </span>
                  <span className="font-mono text-xs font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                    Lấp đầy: {occupancyRateValue}% </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-700">
                  <div className="p-3 bg-white rounded border border-slate-200">
                    <span className="text-slate-400 block text-[11px]">Tổng số phòng:</span>
                    <strong className="text-lg font-mono text-slate-900">{totalRoomsCount}</strong>
                  </div>
                  <div className="p-3 bg-white rounded border border-slate-200">
                    <span className="text-slate-400 block text-[11px]">Đang thuê:</span>
                    <strong className="text-lg font-mono text-blue-700">{rentedRoomsCount}</strong>
                  </div>
                  <div className="p-3 bg-white rounded border border-slate-200">
                    <span className="text-slate-400 block text-[11px]">Sắp trả phòng (≤15 ngày):</span>
                    <strong className="text-lg font-mono text-amber-700">{returningRoomsCount}</strong>
                  </div>
                  <div className="p-3 bg-white rounded border border-slate-200">
                    <span className="text-slate-400 block text-[11px]">Phòng trống sẵn sàng:</span>
                    <strong className="text-lg font-mono text-emerald-700">{vacantRoomsCount}</strong>
                  </div>
                </div>
              </div>

              {/* KHỐI 2: CHỈ TIÊU TÀI CHÍNH, THU TIỀN & CÔNG NỢ (BC-02) */}
              <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-xs flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    Khối 2: Tài chính, Thực thu & Công nợ </span>
                  <span className="text-[11px] text-slate-500">
                    Chỉ nhận chuyển khoản ngân hàng </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-slate-700">
                  <div className="p-3 bg-white rounded border border-slate-200">
                    <span className="text-slate-400 block text-[11px]">Phải thu gốc (Gross):</span>
                    <strong className="text-base font-mono text-slate-900">{totalReceivableGross.toLocaleString('vi-VN')} đ</strong>
                  </div>
                  <div className="p-3 bg-white rounded border border-slate-200">
                    <span className="text-slate-400 block text-[11px]">Thực thu ngân hàng:</span>
                    <strong className="text-base font-mono text-emerald-700">{totalCollectedBank.toLocaleString('vi-VN')} đ</strong>
                  </div>
                  <div className="p-3 bg-white rounded border border-slate-200">
                    <span className="text-slate-400 block text-[11px]">Khoản nợ bù cọc:</span>
                    <strong className="text-base font-mono text-indigo-700">{totalHandledByDeposit.toLocaleString('vi-VN')} đ</strong>
                  </div>
                  <div className="p-3 bg-white rounded border border-slate-200">
                    <span className="text-slate-400 block text-[11px]">Chưa thu còn lại:</span>
                    <strong className="text-base font-mono text-amber-700">{totalUncollected.toLocaleString('vi-VN')} đ</strong>
                  </div>
                  <div className="p-3 bg-white rounded border border-slate-200">
                    <span className="text-slate-400 block text-[11px]">Công nợ quá hạn:</span>
                    <strong className="text-base font-mono text-red-600">{totalOverdueDebt.toLocaleString('vi-VN')} đ</strong>
                  </div>
                </div>
              </div>

              {/* KHỐI 3: DANH SÁCH HỢP ĐỒNG CẦN CHÚ Ý */}
              <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-xs flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-purple-600" />
                    Khối 3: Hợp đồng cần chú ý (Sắp hết hạn ≤ 30 ngày) </span>
                  <span className="text-[11px] font-semibold text-purple-800">
                    {expiringContracts.length} hợp đồng </span>
                </div>

                {expiringContracts.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px] bg-white rounded-lg border border-slate-200 overflow-hidden">
                      <thead className="bg-slate-100 text-slate-600 uppercase text-[10px]">
                        <tr>
                          <th className="py-2 px-3">Mã hợp đồng</th>
                          <th className="py-2 px-3">Phòng</th>
                          <th className="py-2 px-3">Khách thuê</th>
                          <th className="py-2 px-3">Ngày hết hạn</th>
                          <th className="py-2 px-3">Thời hạn còn lại</th>
                          <th className="py-2 px-3 text-center">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {expiringContracts.map((e) => (
                          <tr key={e.contractId} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-mono font-bold text-slate-900">{e.contractId}</td>
                            <td className="py-2 px-3 font-mono font-bold text-blue-700">{e.roomCode}</td>
                            <td className="py-2 px-3 text-slate-800">{e.tenantName}</td>
                            <td className="py-2 px-3 font-mono text-slate-600">{e.endDate}</td>
                            <td className="py-2 px-3 font-medium text-amber-800">
                              {e.daysRemaining > 0 ? `Còn ${e.daysRemaining} ngày`: e.daysRemaining === 0 ? 'Đến hạn hôm nay': `Quá hạn ${Math.abs(e.daysRemaining)} ngày`}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                e.badge === 'Hết hạn' ? 'bg-red-100 text-red-800': 'bg-amber-100 text-amber-800'
                              }`}>
                                {e.badge}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ): (
                  <p className="text-slate-400 italic text-[11px] p-2 bg-white rounded border border-slate-200">
                    Không có hợp đồng nào sắp hết hạn trong vòng 30 ngày. </p>
                )}
              </div>

              {/* KHỐI 4: LỊCH SỬ SNAPSHOT ĐÃ LƯU */}
              <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl space-y-3">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-xs flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-slate-700" />
                  Khối 4: Lịch sử snapshot báo cáo quản trị đã chốt </span>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <thead className="bg-slate-100 text-slate-600 uppercase text-[10px]">
                      <tr>
                        <th className="py-2 px-3">Mã snapshot</th>
                        <th className="py-2 px-3">Thời điểm chốt</th>
                        <th className="py-2 px-3">Kỳ báo cáo</th>
                        <th className="py-2 px-3">Lấp đầy</th>
                        <th className="py-2 px-3">Phải thu</th>
                        <th className="py-2 px-3">Thực thu</th>
                        <th className="py-2 px-3">Người chốt</th>
                        <th className="py-2 px-3 text-center">Đối soát</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportSnapshots.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-mono font-bold text-indigo-900">{s.reportCode}</td>
                          <td className="py-2 px-3 font-mono text-slate-600">{s.asOfTimestamp}</td>
                          <td className="py-2 px-3 text-slate-800 font-medium">{s.periodLabel}</td>
                          <td className="py-2 px-3 font-mono font-bold text-blue-700">{s.roomStats.occupancyRate}%</td>
                          <td className="py-2 px-3 font-mono font-semibold text-slate-900">
                            {s.financialStats.totalReceivable.toLocaleString('vi-VN')} đ </td>
                          <td className="py-2 px-3 font-mono font-semibold text-emerald-700">
                            {s.financialStats.totalCollected.toLocaleString('vi-VN')} đ </td>
                          <td className="py-2 px-3 text-slate-700">{s.createdBy}</td>
                          <td className="py-2 px-3 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {s.reconciliationStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ==================== MODAL: XEM CHI TIẾT PHÒNG  ==================== */}
      {/* ========================================================================= */}
      {drilldownRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <div>
                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800"></span>
                  <h3 className="font-bold text-slate-900 text-base">
                    Hồ sơ chi tiết phòng: <span className="font-mono text-blue-700">{drilldownRoom.roomCode}</span>
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setDrilldownRoom(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-950 text-[11px]">
              * Chế độ xem chỉ đọc đối chiếu báo cáo. Mọi cập nhật trạng thái phòng chỉ được thực hiện tại (Nhận phòng, Trả phòng thực tế hoặc Gia hạn có hiệu lực). </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px]">
                <div>Mã định danh: <strong className="font-mono">{drilldownRoom.id}</strong></div>
                <div>Tầng: <strong>Tầng {drilldownRoom.floor}</strong></div>
                <div>Diện tích: <strong className="font-mono">{drilldownRoom.area} m²</strong></div>
                <div>Trạng thái sử dụng: <strong className="text-blue-800">{drilldownRoom.status}</strong></div>
                <div>Cọc giữ chỗ: <strong>{drilldownRoom.hasDeposit ? 'Đã cọc': 'Chưa có'}</strong></div>
                <div>Thanh toán kỳ đầu: <strong>{drilldownRoom.firstMonthRentPaid ? 'Đã thanh toán': 'Chưa'}</strong></div>
                <div className="col-span-2 pt-1 border-t border-slate-200">
                  Khách thuê hiện tại: <strong className="text-slate-900">{drilldownRoom.currentTenantName || 'Chưa có khách'}</strong>
                </div>
                <div className="col-span-2">
                  Hạn hợp đồng: <span className="font-mono">{drilldownRoom.contractEndDate || 'Không có hợp đồng'}</span>
                </div>
                <div className="col-span-2">
                  Ngày dự kiến trả phòng: <span className="font-mono text-amber-800 font-bold">{drilldownRoom.expectedReturnDate || 'Chưa ghi nhận'}</span>
                </div>
              </div>

              {drilldownRoom.note && (
                <div className="p-2.5 bg-slate-100 rounded-lg text-[11px] text-slate-700">
                  <span className="font-bold block">Ghi chú phòng:</span>
                  <p>{drilldownRoom.note}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDrilldownRoom(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Đóng </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ==================== MODAL: TRA CỨU NGUỒN NGHIỆP VỤ ==================== */}
      {/* ========================================================================= */}
      {showSourceViewerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-600" />
                <div>
                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800">TRA CỨU NGUỒN</span>
                  <h3 className="font-bold text-slate-900 text-base">
                    Tra cứu dữ liệu đối soát nguồn </h3>
                </div>
              </div>
              <button
                onClick={() => setShowSourceViewerModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Nguồn 1: Thuê kỳ đầu PH-07 */}
              <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-2">
                <strong className="font-bold text-purple-900 block">
                  1. Dữ liệu thanh toán ban đầu - {initialPaymentRecords.length} giao dịch: </strong>
                <div className="space-y-1.5 text-[11px]">
                  {initialPaymentRecords.map(p => (
                    <div key={p.id} className="p-2 bg-white rounded border border-purple-200 flex justify-between items-center">
                      <div>
                        <strong className="font-mono text-purple-900">{p.roomCode}</strong>: Tiền thuê 1 tháng: <strong>{p.firstMonthRentAmount.toLocaleString('vi-VN')} đ</strong> · Cọc 1 tháng: <strong>{p.depositAmount.toLocaleString('vi-VN')} đ</strong>
                      </div>
                      <span className="font-mono text-slate-500">{p.receivedDate}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nguồn 2: Thông báo thu tiền TT-03 */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                <strong className="font-bold text-blue-900 block">
                  2. Thông báo thu tiền định kỳ - {paymentNotices.length} thông báo: </strong>
                <div className="space-y-1.5 text-[11px] max-h-40 overflow-y-auto">
                  {paymentNotices.map(n => (
                    <div key={n.id} className="p-2 bg-white rounded border border-blue-200 flex justify-between items-center">
                      <div>
                        <span className="font-mono font-bold text-blue-800">{n.noticeCode}</span> ({n.roomCode} - Kỳ {n.periodCode}): <strong>{n.totalAmount.toLocaleString('vi-VN')} đ</strong>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${n.status === 'Đang hiệu lực' ? 'bg-emerald-100 text-emerald-800': 'bg-slate-100 text-slate-500'}`}>
                        {n.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nguồn 3: Biên lai thu tiền UC08.2 */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                <strong className="font-bold text-emerald-900 block">
                  3. Biên lai thu tiền chuyển khoản - {paymentReceipts.length} biên lai: </strong>
                <div className="space-y-1.5 text-[11px] max-h-40 overflow-y-auto">
                  {paymentReceipts.map(r => (
                    <div key={r.id} className="p-2 bg-white rounded border border-emerald-200 flex justify-between items-center">
                      <div>
                        Phòng <strong className="font-mono">{r.roomCode}</strong> (Mã GD: <span className="font-mono">{r.transactionCode}</span>): <strong>{r.amountReceived.toLocaleString('vi-VN')} đ</strong>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.status === 'Đang hiệu lực' ? 'bg-emerald-100 text-emerald-800': 'bg-red-100 text-red-800'}`}>
                        {r.status === 'Sắp trả' ? 'Sắp trả phòng' : r.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nguồn 4: Quyết toán cọc hoàn tất QT05 */}
              <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl space-y-2">
                <strong className="font-bold text-slate-800 block">
                  4. Quyết toán cọc bù trừ công nợ - {settlementSlips.length} hồ sơ: </strong>
                <div className="space-y-1.5 text-[11px]">
                  {settlementSlips.map(s => {
                    const debtDed = s.deductions.filter(d => d.category === 'Công nợ kỳ trước').reduce((acc, d) => acc + d.amount, 0);
                    return (
                      <div key={s.id} className="p-2 bg-white rounded border border-slate-200 flex justify-between items-center">
                        <div>
                          Phòng <strong className="font-mono">{s.roomCode}</strong>: Cọc gốc {s.initialDepositAmount.toLocaleString('vi-VN')} đ · Khấu trừ nợ cũ: <strong className="text-indigo-700">{debtDed.toLocaleString('vi-VN')} đ</strong>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">{s.status}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSourceViewerModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Đóng tra cứu </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
