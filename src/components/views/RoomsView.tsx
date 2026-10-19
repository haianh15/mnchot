import { toUserMessage } from '../../utils/userMessages';
import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Room, ContractExpiryBadge, TenantFeedbackBadge, RoomHistoryLog, TenantContactLog } from '../../types';
import {
  Home, Plus, Search, Filter, CheckCircle2, AlertCircle, Clock,
  Calendar, Eye, Edit3, ArrowRight, ShieldCheck, Key, FileText, CheckSquare, X,
  Info, ExternalLink, UserCheck, PackageCheck, Receipt, Scale, AlertTriangle, ArrowUpRight,
  History, ArrowLeft, RotateCcw, Building2, FileCheck2
} from 'lucide-react';

export const RoomsView: React.FC<{onNavigate?: (tab: 'contracts' | 'tenants' | 'handover', target: {roomCode?: string; contractId?: string; tenantId?: string}) => void; initialRoomCode?: string}> = ({onNavigate, initialRoomCode}) => {
  const {
    currentUser,
    currentSession,
    rooms,
    roomHistory,
    returnPlans,
    contactLogs,
    initialPaymentRecords,
    missingConditionLogs,
    unfinishedHandoverLogs,
    leaseStartEvents,
    contracts,
    tenants,
    coTenants,
    handoverReports,
    settlementSlips,
    returnInspections,
    addRoom,
    updateRoom,
    recordInitialPaymentPH07,
    correctInitialPaymentPH07,
    confirmCheckInPH05,
    saveMissingConditionPH06,
    updateExpectedReturnDatePH11_12,
    recordTenantContactPH13,
    autoCancelReturnPlanPH14,
    checkExtensionResultPH15,
    confirmReturnStep305AndVacantPH08,
    saveUnfinishedHandoverPH09,
    activeBankAccount
  } = useApp();

  // Active sub-tab (bổ sung các luồng,,,, )
  const [subTab, setSubTab] = useState<'list' | 'checkin' | 'return' | 'expiry' | 'plans'>('list');
  const [activeCheckInRoomCode, setActiveCheckInRoomCode] = useState<string>('');
  const [checkInStage, setCheckInStage] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [activeReturnRoomCode, setActiveReturnRoomCode] = useState<string>('');
  const [returnStage, setReturnStage] = useState<0 | 1 | 2>(0);
  const [checkInPersonMatch, setCheckInPersonMatch] = useState<'match' | 'mismatch'>('match');

  // Search & Filter
  const [searchCode, setSearchCode] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Tất cả' | 'Trống' | 'Đang thuê' | 'Sắp trả'>('Tất cả');

  // The selected room identifies the record used by actions. It does NOT open the room detail dialog.
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isRoomDetailOpen, setIsRoomDetailOpen] = useState(false);

  const openRoomDetails = (room: Room) => {
    setSelectedRoom(room);
    setSubTab('list');
    setIsRoomDetailOpen(true);
  };
  const closeRoomDetails = () => setIsRoomDetailOpen(false);

  // A room code supplied by another screen intentionally opens that room once.
  // Do not depend on `rooms`: refreshing room data must never reopen a dialog just closed.
  useEffect(() => {
    if (!initialRoomCode) return;
    const room = rooms.find(r => r.roomCode === initialRoomCode);
    if (room) openRoomDetails(room);
  }, [initialRoomCode]);

  const openLinkedRecord = (tab: 'contracts' | 'tenants' | 'handover', room: Room) => {
    if (!onNavigate) return;
    closeRoomDetails();
    const contract = contracts.find(c=>c.id===room.currentContractId) || contracts.find(c=>c.roomCode===room.roomCode && c.leaseId===room.currentLeaseId);
    onNavigate(tab,{roomCode:room.roomCode,contractId:contract?.id,tenantId:contract?.tenantId});
  };
  // Modals for Actions & Links in Chi tiết phòng
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showPayment07Modal, setShowPayment07Modal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showExpectedDateModal, setShowExpectedDateModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showCheckRentableModal, setShowCheckRentableModal] = useState(false);
  const [checkRentableRoom, setCheckRentableRoom] = useState<Room | null>(null);
  const [simulateEF01, setSimulateEF01] = useState(false);
  const [showMissingConditionModal, setShowMissingConditionModal] = useState(false);
  const [showUnfinishedHandoverModal, setShowUnfinishedHandoverModal] = useState(false);
  const [showExtensionModal, setShowExtensionModal] = useState(false);

  // Expiry Tracking () states
  const [expiryFilter, setExpiryFilter] = useState<ContractExpiryBadge | 'Tất cả'>('Tất cả');
  const [expiryTimeMode, setExpiryTimeMode] = useState<'none' | 'range' | 'days'>('none');
  const [expiryStartDate, setExpiryStartDate] = useState('');
  const [expiryEndDate, setExpiryEndDate] = useState('');
  const [expiryDaysCount, setExpiryDaysCount] = useState<number | string>(30);
  const [expiryError, setExpiryError] = useState<string | null>(null);
  const [simulateExpiryEF01, setSimulateExpiryEF01] = useState(false);

  // Return Plans & Feedback () states
  const [plansSubTab, setPlansSubTab] = useState<'plans' | 'feedback'>('plans');
  const [planSearchRoom, setPlanSearchRoom] = useState('');
  const [planStatusFilter, setPlanStatusFilter] = useState<'Tất cả' | 'Đang thuê' | 'Sắp trả'>('Tất cả');
  const [planStartDate, setPlanStartDate] = useState('');
  const [planEndDate, setPlanEndDate] = useState('');
  const [showReturnPlanHistory, setShowReturnPlanHistory] = useState(false);
  const [feedbackSelectedRoomCode, setFeedbackSelectedRoomCode] = useState('');
  const [conflictModalItem, setConflictModalItem] = useState<TenantContactLog | null>(null);

  // Specific Related Profile Modals
  const [showContractModal, setShowContractModal] = useState(false);
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);

  // When another operation is active, the room detail dialog must not remain underneath
  // it and unexpectedly reappear when that operation is closed.
  useEffect(() => {
    if (subTab !== 'list' || showAddModal || showEditModal || showHistoryModal ||
        showCheckInModal || showPayment07Modal || showReturnModal ||
        showExpectedDateModal || showContactModal || showCheckRentableModal ||
        showMissingConditionModal || showUnfinishedHandoverModal || showExtensionModal ||
        showContractModal || showTenantModal || showHandoverModal || showDepositModal) {
      setIsRoomDetailOpen(false);
    }
  }, [subTab, showAddModal, showEditModal, showHistoryModal,
      showCheckInModal, showPayment07Modal, showReturnModal,
      showExpectedDateModal, showContactModal, showCheckRentableModal,
      showMissingConditionModal, showUnfinishedHandoverModal, showExtensionModal,
      showContractModal, showTenantModal, showHandoverModal, showDepositModal]);

  // Toast feedback state
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4500);
  };

  // Form states - Add Room ()
  const [newCode, setNewCode] = useState('');
  const [newFloor, setNewFloor] = useState<number | string>(1);
  const [newArea, setNewArea] = useState<number | string>(25);
  const [newNote, setNewNote] = useState('');
  const [addErrors, setAddErrors] = useState<{
    roomCode?: string;
    floor?: string;
    area?: string;
    note?: string;
    general?: string;
  }>({});

  // Form states - Edit Room ()
  const [editFloor, setEditFloor] = useState<number | string>(1);
  const [editArea, setEditArea] = useState<number | string>(25);
  const [editNote, setEditNote] = useState('');
  const [editErrors, setEditErrors] = useState<{
    floor?: string;
    area?: string;
    note?: string;
    general?: string;
  }>({});

  // Payment 07 Form ()
  const [pay07Amount, setPay07Amount] = useState(0);
  const [pay07Txn, setPay07Txn] = useState('');
  const [pay07Date, setPay07Date] = useState('2026-10-16');
  const [pay07BankActual, setPay07BankActual] = useState('');
  const [pay07Proof, setPay07Proof] = useState('');
  const [pay07CorrectionMode, setPay07CorrectionMode] = useState(false);
  const [pay07CorrectionReason, setPay07CorrectionReason] = useState('');
  const [pay07SelectedRecordId, setPay07SelectedRecordId] = useState<string | null>(null);

  // Check In 05 Form ()
  const [checkInStep, setCheckInStep] = useState<number>(1);
  const [checkInPreHandoverChecked, setCheckInPreHandoverChecked] = useState(false);
  const [checkInPostHandoverChecked, setCheckInPostHandoverChecked] = useState(false);
  const [checkInDate, setCheckInDate] = useState(() => new Date().toLocaleDateString('en-CA'));
  const [checkInSimulateEF01, setCheckInSimulateEF01] = useState(false);
  const [checkInSimulateEF02, setCheckInSimulateEF02] = useState(false);
  const [checkInHandoverSigned, setCheckInHandoverSigned] = useState(false);

  // Missing Condition 06 Form ()
  const [missingNotes, setMissingNotes] = useState('');
  const [missingIsStop, setMissingIsStop] = useState(false);
  const [missingStopReason, setMissingStopReason] = useState('Chưa rõ lý do');
  const [missingStopContent, setMissingStopContent] = useState('');

  // Return Check 08 Form ()
  const [returnChecked, setReturnChecked] = useState(false);
  const [returnSimulateEF01, setReturnSimulateEF01] = useState(false);
  const [returnSimulateAF05, setReturnSimulateAF05] = useState(false);
  const [returnActualDate, setReturnActualDate] = useState(() => new Date().toLocaleDateString('en-CA'));

  // Unfinished Handover 09 Form ()
  const [unfinishedReason, setUnfinishedReason] = useState('Khách còn đồ đạc cá nhân chưa dọn hết');
  const [unfinishedObstacle, setUnfinishedObstacle] = useState('Tủ quần áo còn đồ đạc, hẹn thứ Bảy quay lại dọn nốt.');
  const [unfinishedExistingId, setUnfinishedExistingId] = useState<string | null>(null);
  const [unfinishedEditMode, setUnfinishedEditMode] = useState(false);

  // Expected date 11/12 Form
  const [expDateInput, setExpDateInput] = useState('');
  const [expSource, setExpSource] = useState<'trực tiếp' | 'điện thoại' | 'tin nhắn' | 'khác'>('tin nhắn');
  const [expTime, setExpTime] = useState(new Date().toISOString().substring(0, 16));
  const [expContent, setExpContent] = useState('');
  const [expReason, setExpReason] = useState('');

  // Contact 13 Form
  const [contactTime, setContactTime] = useState(new Date().toISOString().substring(0, 16));
  const [contactSource, setContactSource] = useState<'trực tiếp' | 'điện thoại' | 'tin nhắn' | 'khác'>('tin nhắn');
  const [contactResult, setContactResult] = useState<'Chưa phản hồi' | 'Không tiếp tục thuê – Chưa xác nhận ngày dự kiến trả' | 'Chờ đối chiếu' | 'Đồng ý tiếp tục thuê'>('Chưa phản hồi');
  const [contactContent, setContactContent] = useState('');
  const [contactNextDate, setContactNextDate] = useState('');

  // Helper: compute contract expiry badge
  const getExpiryBadge = (contractEndDate?: string): ContractExpiryBadge => {
    if (!contractEndDate) return 'Chưa có dữ liệu';
    const end = new Date(contractEndDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff > 30) return 'Còn hạn';
    if (diff >= 1 && diff <= 30) return 'Sắp hết hạn hợp đồng';
    if (diff === 0) return 'Đến hạn hôm nay';
    return 'Đã hết hạn hợp đồng';
  };

  // Helper: compute days remaining or overdue for expectedReturnDate (chỉ xem, không sửa, nếu có)
  const getDaysRemainingOrOverdue = (expectedReturnDate?: string): { text: string; isOverdue: boolean; days: number } | null => {
    if (!expectedReturnDate) return null;
    const target = new Date(expectedReturnDate);
    target.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return { text: `Còn ${diffDays} ngày`, isOverdue: false, days: diffDays };
    } else if (diffDays === 0) {
      return { text: 'Đến hạn trả hôm nay', isOverdue: false, days: 0 };
    } else {
      return { text: `Quá ngày trả ${Math.abs(diffDays)} ngày`, isOverdue: true, days: Math.abs(diffDays) };
    }
  };

  // Helper: compute feedback badge (theo  nếu có căn cứ; chưa từng liên hệ và chưa có căn cứ phản hồi hiển thị "Chưa có ghi nhận liên hệ", không gán Chưa phản hồi)
  const getFeedbackBadge = (room: Room): TenantFeedbackBadge => {
    const logs = contactLogs.filter(c => c.roomCode === room.roomCode);
    if (room.expectedReturnDate) {
      return 'Đã phản hồi – Đã xác nhận ngày trả';
    }
    if (room.returnPlanCancelled) {
      return 'Đã phản hồi – Tiếp tục thuê';
    }
    // Chưa từng liên hệ và chưa có căn cứ phản hồi hiển thị “Chưa có ghi nhận liên hệ”, không gán Chưa phản hồi.
    if (logs.length === 0) {
      return 'Chưa có ghi nhận liên hệ';
    }
    const last = logs[0];
    if (last.contactResult === 'Không tiếp tục thuê – Chưa xác nhận ngày dự kiến trả') {
      return 'Đã phản hồi – Chưa xác nhận ngày trả';
    }
    if (last.contactResult === 'Đồng ý tiếp tục thuê') {
      return 'Đã phản hồi – Tiếp tục thuê';
    }
    if (last.contactResult === 'Chưa phản hồi') {
      return 'Chưa phản hồi';
    }
    return 'Chưa có ghi nhận liên hệ';
  };

  // Filtered rooms
  const filteredRooms = rooms.filter(r => {
    const matchCode = !searchCode || r.roomCode.toLowerCase().includes(searchCode.toLowerCase());
    const matchStatus = statusFilter === 'Tất cả' || r.status === statusFilter;
    return matchCode && matchStatus;
  });

  // Handler: Open Add Room Modal ()
  const handleOpenAddModal = () => {
    setNewCode('');
    setNewFloor(1);
    setNewArea(25);
    setNewNote('');
    setAddErrors({});
    setShowAddModal(true);
  };

  // Handler: Open Edit Room Modal ()
  const handleOpenEditModal = () => {
    if (!selectedRoom) return;
    setEditFloor(selectedRoom.floor);
    setEditArea(selectedRoom.area);
    setEditNote(selectedRoom.note || '');
    setEditErrors({});
    setShowEditModal(true);
  };

  // Xử lý submit Thêm phòng mới ()
  const handleAddRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: typeof addErrors = {};

    // Kiểm tra phiên đăng nhập & vai trò
    if (!currentUser || !currentSession || currentSession.expiresAt < Date.now()) {
      errors.general = 'Phiên làm việc đã hết hiệu lực. Yêu cầu đăng nhập lại.';
    } else if (currentUser.role !== 'Quản lý/Chủ nhà') {
      errors.general = 'Chức năng chỉ dành cho User có vai trò Quản lý hoặc Chủ nhà.';
    }

    // (trùng/rỗng): Mã phòng trống, chỉ gồm khoảng trắng hoặc trùng Mã phòng đã có
    const code = newCode.trim();
    if (!code) {
      errors.roomCode = 'Mã phòng không hợp lệ hoặc đã tồn tại (không được để trống).';
    } else if (rooms.some(r => r.roomCode.toLowerCase() === code.toLowerCase())) {
      errors.roomCode = 'Mã phòng không hợp lệ hoặc đã tồn tại';
    }

    // Tầng trống/sai định dạng (phải là số nguyên từ 0 trở lên)
    const parsedFloor = Number(newFloor);
    if (newFloor === '' || isNaN(parsedFloor) || parsedFloor < 0 || !Number.isInteger(parsedFloor)) {
      errors.floor = 'Tầng trống hoặc sai định dạng (phải là số nguyên từ 0 trở lên).';
    }

    // Diện tích trống/không lớn hơn 0
    const parsedArea = Number(newArea);
    if (newArea === '' || isNaN(parsedArea) || parsedArea <= 0) {
      errors.area = 'Diện tích trống hoặc không lớn hơn 0 (phải là số dương).';
    }

    // Ghi chú vượt 500 ký tự
    if (newNote.length > 500) {
      errors.note = 'Ghi chú vượt 500 ký tự. Vui lòng sửa trước khi lưu.';
    }

    if (Object.keys(errors).length > 0) {
      setAddErrors(errors);
      return;
    }

    setAddErrors({});
    const res = addRoom(code, parsedFloor, parsedArea, newNote);
    if (!res.success) {
      if (res.field === 'roomCode') setAddErrors({ roomCode: res.message });
      else if (res.field === 'floor') setAddErrors({ floor: res.message });
      else if (res.field === 'area') setAddErrors({ area: res.message });
      else if (res.field === 'note') setAddErrors({ note: res.message });
      else setAddErrors({ general: res.message });
    } else {
      setShowAddModal(false);
      showToast('success', `Thêm phòng ${res.room?.roomCode || code} thành công! Đang mở Chi tiết phòng mới tạo.`);
      // Trường hợp 02, bước 3: "Hệ thống tạo một phòng trạng thái Trống, ghi người tạo và thời điểm, sau đó mở Chi tiết phòng mới."
      if (res.room) {
        openRoomDetails(res.room);
      }
    }
  };

  // Main Flow Bước 3: Xử lý submit Chỉnh sửa thông tin phòng ()
  const handleEditRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;
    const errors: typeof editErrors = {};

    // Kiểm tra phiên đăng nhập & vai trò
    if (!currentUser || !currentSession || currentSession.expiresAt < Date.now()) {
      errors.general = 'Phiên làm việc đã hết hiệu lực. Yêu cầu đăng nhập lại.';
    } else if (currentUser.role !== 'Quản lý/Chủ nhà') {
      errors.general = 'Chức năng chỉ dành cho User có vai trò Quản lý hoặc Chủ nhà.';
    }

    // Tầng trống/sai định dạng (phải là số nguyên từ 0 trở lên)
    const parsedFloor = Number(editFloor);
    if (editFloor === '' || isNaN(parsedFloor) || parsedFloor < 0 || !Number.isInteger(parsedFloor)) {
      errors.floor = 'Tầng trống hoặc sai định dạng (phải là số nguyên từ 0 trở lên).';
    }

    // Diện tích trống/không lớn hơn 0
    const parsedArea = Number(editArea);
    if (editArea === '' || isNaN(parsedArea) || parsedArea <= 0) {
      errors.area = 'Diện tích trống hoặc không lớn hơn 0 (phải là số dương).';
    }

    // Ghi chú vượt 500 ký tự
    if (editNote.length > 500) {
      errors.note = 'Ghi chú vượt 500 ký tự. Vui lòng sửa trước khi lưu.';
    }

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    setEditErrors({});
    const res = updateRoom(selectedRoom.roomCode, parsedFloor, parsedArea, editNote);
    if (!res.success) {
      if (res.field === 'floor') setEditErrors({ floor: res.message });
      else if (res.field === 'area') setEditErrors({ area: res.message });
      else if (res.field === 'note') setEditErrors({ note: res.message });
      else setEditErrors({ general: res.message });
    } else {
      setShowEditModal(false);
      showToast('success', `Cập nhật thông tin phòng ${selectedRoom.roomCode} thành công! Lịch sử thay đổi đã được lưu.`);
      // Bước 4: Hệ thống hiển thị dữ liệu mới nhất
      if (res.room) {
        setSelectedRoom(res.room);
      } else {
        setSelectedRoom({...selectedRoom, floor: parsedFloor, area: parsedArea, note: editNote });
      }
    }
  };

  // Find related records for selectedRoom
  const relatedContract = selectedRoom
    ? contracts.find(c => c.id === selectedRoom.currentContractId || c.roomCode === selectedRoom.roomCode): null;

  const relatedTenant = selectedRoom
    ? tenants.find(t => t.id === selectedRoom.currentTenantId || t.fullName === selectedRoom.currentTenantName): null;

  const relatedCoTenants = selectedRoom
    ? coTenants.filter(ct => ct.roomCode === selectedRoom.roomCode): [];

  const relatedHandover = selectedRoom
    ? handoverReports.find(h => h.roomCode === selectedRoom.roomCode): null;

  const relatedSettlement = selectedRoom
    ? settlementSlips.find(s => s.roomCode === selectedRoom.roomCode): null;

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification Container */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 transition-all duration-300 transform scale-100 animate-in fade-in slide-in-from-top-4">
          <div className={`px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-semibold border ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-900/30': 'bg-red-600 text-white border-red-500 shadow-red-900/30'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-200" />
            ): (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-200" />
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
            
            <h1 className="text-lg font-bold text-slate-900">Quản lý phòng</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Xem tình trạng phòng, khách đang thuê và các công việc cần xử lý. </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {subTab !== 'list' && <button onClick={()=>setSubTab('list')} className="rounded-lg border px-3 py-2 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50">← Danh sách phòng</button>}
          <button onClick={() => setSubTab('expiry')} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50">Theo dõi hạn hợp đồng</button>
          <button onClick={() => setSubTab('plans')} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50">Kế hoạch trả phòng</button>
        </div>

      </div>

      {/* ==================== SUB-TAB 1: ROOMS LIST (, 02) ==================== */}
      {subTab === 'list' && (
        <div className="space-y-4">
          {/* Controls: Search, Filter & Add */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-[280px]">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  placeholder="Lọc theo mã phòng (VD: P.101, P.202)..."
                  className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="Tất cả">Tất cả trạng thái</option>
                <option value="Trống">Trống</option>
                <option value="Đang thuê">Đang thuê</option>
                <option value="Sắp trả">Sắp trả phòng</option>
              </select>

              {/*  Main Flow Bước 1: User mở danh sách phòng Trống */}
              <button
                onClick={() => setStatusFilter(statusFilter === 'Trống' ? 'Tất cả': 'Trống')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer ${
                  statusFilter === 'Trống'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs': 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                }`}
                title=" Mở danh sách phòng Trống để kiểm tra khả năng cho thuê"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Phòng Trống ({rooms.filter(r => r.status === 'Trống').length})</span>
              </button>

              {(searchCode || statusFilter !== 'Tất cả') && (
                <button
                  onClick={() => { setSearchCode(''); setStatusFilter('Tất cả'); }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                >
                  Xóa lọc </button>
              )}
            </div>

            <button
              onClick={handleOpenAddModal}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Thêm phòng mới </button>
          </div>

          {/* 1. Quản lý phòng > Danh sách phòng (bảng): 
              Số thứ tự, Mã phòng, Tầng, Diện tích (mét vuông), Trạng thái phòng, Đã cọc, Đã thanh toán tiền thuê kỳ đầu, 
              Kỳ thuê trả trước, Khách thuê hiện tại, Ngày bắt đầu thuê, Hạn hợp đồng, Ngày dự kiến trả, Tổng số người, Ghi chú (chỉ xem, không sửa) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3">Số thứ tự</th>
                    <th className="py-3 px-3">Mã phòng</th>
                    <th className="py-3 px-3">Tầng</th>
                    <th className="py-3 px-3">Diện tích (mét vuông)</th>
                    <th className="py-3 px-3">Trạng thái phòng</th>
                    <th className="py-3 px-3">Đã cọc</th>
                    <th className="py-3 px-3">Đã thanh toán tiền thuê kỳ đầu</th>
                    <th className="py-3 px-3">Kỳ thuê trả trước</th>
                    <th className="py-3 px-3">Khách thuê hiện tại</th>
                    <th className="py-3 px-3">Ngày bắt đầu thuê</th>
                    <th className="py-3 px-3">Hạn hợp đồng</th>
                    <th className="py-3 px-3">Ngày dự kiến trả</th>
                    <th className="py-3 px-3">Tổng số người</th>
                    <th className="py-3 px-3">Ghi chú (chỉ xem, không sửa)</th>
                    <th className="py-3 px-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredRooms.length === 0 ? (
                    <tr>
                      <td colSpan={15} className="py-8 text-center text-slate-400">
                        Không tìm thấy phòng phù hợp với bộ lọc. </td>
                    </tr>
                  ): (
                    filteredRooms.map((room, idx) => {
                      const expBadge = getExpiryBadge(room.contractEndDate);
                      return (
                        <tr
                          key={room.id}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          {/* 1. Số thứ tự */}
                          <td className="py-3 px-3 text-slate-400 font-mono text-center">{idx + 1}</td>

                          {/* 2. Mã phòng */}
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">{room.roomCode}</td>

                          {/* 3. Tầng */}
                          <td className="py-3 px-3 text-center">{room.floor}</td>

                          {/* 4. Diện tích (mét vuông) */}
                          <td className="py-3 px-3 font-mono">{room.area} m²</td>

                          {/* 5. Trạng thái phòng */}
                          <td className="py-3 px-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                              room.status === 'Trống' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200':
                              room.status === 'Sắp trả' ? 'bg-amber-50 text-amber-700 border border-amber-200':
                              'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}>
                              {room.status === 'Sắp trả' ? 'Sắp trả phòng' : room.status}
                            </span>
                          </td>

                          {/* 6. Đã cọc */}
                          <td className="py-3 px-3">
                            <span className={`text-[11px] font-semibold ${room.hasDeposit ? 'text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200': 'text-slate-400'}`}>
                              {room.hasDeposit ? 'Đã cọc': 'Chưa'}
                            </span>
                          </td>

                          {/* 7. Đã thanh toán tiền thuê kỳ đầu */}
                          <td className="py-3 px-3">
                            <span className={`text-[11px] font-semibold ${room.firstMonthRentPaid ? 'text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200': 'text-slate-400'}`}>
                              {room.firstMonthRentPaid ? 'Đã thanh toán': 'Chưa'}
                            </span>
                          </td>

                          {/* 8. Kỳ thuê trả trước */}
                          <td className="py-3 px-3 font-mono text-slate-700">
                            {room.firstMonthPeriod || <span className="text-slate-400">—</span>}
                          </td>

                          {/* 9. Khách thuê hiện tại */}
                          <td className="py-3 px-3 font-medium text-slate-800">
                            {room.currentTenantName || <span className="text-slate-400 italic">Chưa ghi nhận</span>}
                          </td>

                          {/* 10. Ngày bắt đầu thuê */}
                          <td className="py-3 px-3 font-mono text-slate-600">
                            {room.contractStartDate || <span className="text-slate-400">—</span>}
                          </td>

                          {/* 11. Hạn hợp đồng */}
                          <td className="py-3 px-3">
                            {room.contractEndDate ? (
                              <div className="space-y-0.5">
                                <span className="font-mono text-slate-700">{room.contractEndDate}</span>
                                <span className={`text-[10px] block font-semibold ${
                                  expBadge === 'Sắp hết hạn hợp đồng' ? 'text-amber-600':
                                  expBadge === 'Đã hết hạn hợp đồng' ? 'text-red-600':
                                  expBadge === 'Đến hạn hôm nay' ? 'text-rose-600 font-bold':
                                  'text-slate-500'
                                }`}>
                                  {expBadge}
                                </span>
                              </div>
                            ): (
                              <span className="text-slate-400">Chưa có dữ liệu</span>
                            )}
                          </td>

                          {/* 12. Ngày dự kiến trả */}
                          <td className="py-3 px-3">
                            {room.expectedReturnDate ? (
                              <span className="font-mono font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                {room.expectedReturnDate}
                              </span>
                            ): (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>

                          {/* 13. Tổng số người */}
                          <td className="py-3 px-3 text-center font-mono font-semibold text-slate-800">
                            {room.totalOccupants}
                          </td>

                          {/* 14. Ghi chú (chỉ xem, không sửa) */}
                          <td className="py-3 px-3 text-slate-600 max-w-xs truncate" title={room.note}>
                            {room.note || <span className="text-slate-400 italic">Không có ghi chú</span>}
                          </td>

                          {/* Thao tác: 4. Danh sách phòng có các nút thao tác nghiệp vụ trực tiếp (, 07, 08, 09) & Xem chi tiết */}
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {room.status === 'Trống' ? (
                                <>
                                  <button
                                    onClick={() => { setSelectedRoom(room); setShowPayment07Modal(true); }}
                                    className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-[11px] font-semibold transition-colors cursor-pointer"
                                    title="Ghi nhận cọc 1 tháng & thuê đầu 1 tháng "
                                  >
                                    Thu cọc/thuê </button>
                                  <button
                                    onClick={() => { setSelectedRoom(room); setActiveCheckInRoomCode(room.roomCode); setCheckInStage(0); setSubTab('checkin'); }}
                                    className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                                    title="Kiểm tra điều kiện nhận phòng "
                                  >
                                    <Key className="w-3 h-3" />
                                    <span>Nhận phòng</span>
                                  </button>
                                </>
                              ): (
                                <>
                                  <button
                                    onClick={() => { setSelectedRoom(room); setActiveReturnRoomCode(room.roomCode); setReturnStage(0); setSubTab('return'); }}
                                    className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                                    title="Kiểm tra kết quả trả phòng "
                                  >
                                    <PackageCheck className="w-3 h-3" />
                                    <span>Trả phòng</span>
                                  </button>
                                  <button
                                    onClick={() => { setSelectedRoom(room); setShowUnfinishedHandoverModal(true); }}
                                    className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-[11px] font-semibold transition-colors cursor-pointer"
                                    title="Ghi nhận chưa bàn giao xong "
                                  >
                                    Chưa BG </button>
                                </>
                              )}
                              <button
                                onClick={() => openRoomDetails(room)}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Chi tiết</span>
                              </button>
                            </div>
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

      {/* ==================== SUB-TAB: TIẾP NHẬN PHÒNG (,, ) ==================== */}
      {subTab === 'checkin' && (() => {
        const room = rooms.find(r => r.roomCode === activeCheckInRoomCode);
        const contract = room && (contracts.find(c => c.id === room.currentContractId) || contracts.find(c => c.roomCode === room.roomCode && c.leaseId === room.currentLeaseId));
        const payment = room && initialPaymentRecords.find(p => p.leaseId === room.currentLeaseId && p.roomCode === room.roomCode);
        const report = room && handoverReports.find(h => h.roomCode === room.roomCode && h.leaseId === room.currentLeaseId);
        const contractValid = !!contract && (['Hiệu lực', 'Đã ký', 'Chờ hiệu lực'].includes(contract.status) || !!contract.isSignedPaper);
        const paymentsValid = !!(room?.hasDeposit && room?.firstMonthRentPaid && contract?.firstMonthRentPaid && payment);
        const handoverValid = !!report && report.status === 'Đã xác nhận' && report.tenantSignedPaper === 'Đã ký giấy' && report.ownerSignedPaper === 'Đã ký giấy';
        const btn = 'rounded-lg px-4 py-2 text-sm font-semibold transition-colors';
        return <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div><h2 className="font-bold text-lg">Nhận phòng</h2><p className="text-sm text-slate-500">Hoàn thành thông tin đang hiển thị để tiếp tục.</p></div>
            <label className="text-sm text-slate-600">Phòng <select className="block mt-1 border border-slate-300 rounded-lg px-3 py-2 bg-white" value={activeCheckInRoomCode} onChange={e => { setActiveCheckInRoomCode(e.target.value); setCheckInStage(0); }}>
                <option value="">Chọn phòng</option>{rooms.filter(r=>r.status!=='Đang thuê').map(r=><option key={r.id} value={r.roomCode}>{r.roomCode} – {r.status}</option>)}
              </select>
            </label>
          </div>
          {!room ? <div className="bg-white rounded-xl border p-5 text-sm text-slate-500">Vui lòng chọn phòng cần nhận.</div> : <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-5">
            {checkInStage === 0 && <>
              <div><h3 className="font-semibold text-lg">Kiểm tra hợp đồng và khoản thu ban đầu</h3><p className="text-sm text-slate-500 mt-1">Chỉ tiếp tục khi hợp đồng đã ký và các khoản cần thu đã được xác nhận.</p></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="border rounded-xl p-4"><div className="text-slate-500">Hợp đồng</div><div className="font-semibold mt-1">{contract?.id || 'Chưa có hợp đồng'}</div><p className={contractValid?'text-emerald-700 mt-2':'text-red-700 mt-2'}>{contractValid?'Đã ký hợp lệ':'Chưa đáp ứng điều kiện'}</p></div>
                <div className="border rounded-xl p-4"><div className="text-slate-500">Tiền cọc và tiền thuê đầu</div><div className="font-semibold mt-1">{payment ? `${payment.depositAmount.toLocaleString('vi-VN')}đ tiền cọc` : 'Chưa có chứng từ hợp lệ'}</div><p className={paymentsValid?'text-emerald-700 mt-2':'text-red-700 mt-2'}>{paymentsValid?'Đã xác nhận thu đủ':'Chưa xác nhận đầy đủ'}</p></div>
              </div>
              <div className="flex flex-wrap gap-2 justify-end">
                <button className={`${btn} border border-slate-300 text-slate-700`} onClick={()=>{setSelectedRoom(room);setShowPayment07Modal(true)}}>Xem / ghi nhận khoản thu</button>
                <button disabled={!contractValid || !paymentsValid} className={`${btn} ${contractValid&&paymentsValid?'bg-blue-600 text-white hover:bg-blue-700':'bg-slate-100 text-slate-400 cursor-not-allowed'}`} onClick={()=>setCheckInStage(1)}>Tiếp tục <ArrowRight className="inline w-4 h-4"/></button>
              </div>
            </>}
            {checkInStage === 1 && <>
              <div><h3 className="font-semibold text-lg">Kiểm tra bàn giao phòng</h3><p className="text-sm text-slate-500 mt-1">Bản giấy phải được ký và kết quả bàn giao phải được xác nhận.</p></div>
              <div className="rounded-xl bg-slate-50 border p-4 space-y-2 text-sm"><p>Biên bản: <strong>{report?.reportNumber || 'Chưa có'}</strong></p><p>Trạng thái: <strong>{report?.status || 'Chưa xác nhận'}</strong></p><p className={handoverValid?'text-emerald-700':'text-amber-800'}>{handoverValid?'Đã đủ chữ ký và xác nhận':'Cần hoàn thiện hồ sơ bàn giao trước khi tiếp tục'}</p></div>
              <div className="flex flex-wrap gap-2 justify-between"><button className={`${btn} border`} onClick={()=>setCheckInStage(0)}>Quay lại</button><div className="flex flex-wrap gap-2"><button className={`${btn} border`} onClick={()=>onNavigate?.('handover',{roomCode:room.roomCode,contractId:contract?.id})}>Mở hồ sơ bàn giao</button><button disabled={!handoverValid} className={`${btn} ${handoverValid?'bg-blue-600 text-white':'bg-slate-100 text-slate-400 cursor-not-allowed'}`} onClick={()=>setCheckInStage(2)}>Tiếp tục <ArrowRight className="inline w-4 h-4"/></button></div></div>
            </>}
            {checkInStage === 2 && <>
              <div><h3 className="font-semibold text-lg">Đối chiếu người nhận phòng</h3><p className="text-sm text-slate-500 mt-1">Xác nhận người đến nhận là người trong hợp đồng và biên bản.</p></div>
              <p className="text-sm">Khách thuê theo hợp đồng: <strong>{contract?.tenantName || room.currentTenantName}</strong></p>
              <label className="block text-sm font-medium">Kết quả đối chiếu <select className="mt-1 block border rounded-lg px-3 py-2 w-full sm:w-auto" value={checkInPersonMatch} onChange={e=>setCheckInPersonMatch(e.target.value as 'match'|'mismatch')}><option value="match">Người nhận trùng hồ sơ đã kiểm tra</option><option value="mismatch">Không trùng thông tin – chưa thể nhận phòng</option></select>
              </label>
              <div className="flex flex-wrap justify-between gap-2"><button className={`${btn} border`} onClick={()=>setCheckInStage(1)}>Quay lại</button><button disabled={checkInPersonMatch!=='match'||!handoverValid} className={`${btn} ${checkInPersonMatch==='match'&&handoverValid?'bg-blue-600 text-white':'bg-slate-100 text-slate-400 cursor-not-allowed'}`} onClick={()=>setCheckInStage(3)}>Tiếp tục <ArrowRight className="inline w-4 h-4"/></button></div>
            </>}
            {checkInStage === 3 && <>
              <div><h3 className="font-semibold text-lg">Xác nhận nhận phòng</h3><p className="text-sm text-slate-500 mt-1">Kiểm tra ngày nhận thực tế trước khi lưu.</p></div>
              <label className="text-sm font-medium block">Ngày nhận phòng thực tế <input type="date" required value={checkInDate} onChange={e=>setCheckInDate(e.target.value)} className="block mt-1 border rounded-lg px-3 py-2" /></label>
              <div className="flex flex-wrap justify-between gap-2"><button className={`${btn} border`} onClick={()=>setCheckInStage(2)}>Quay lại</button><button disabled={!contractValid || !paymentsValid || !handoverValid || checkInPersonMatch!=='match' || !checkInDate || room.status==='Đang thuê'} className={`${btn} bg-blue-600 text-white disabled:bg-slate-200 disabled:text-slate-400`} onClick={()=>{const res=confirmCheckInPH05(room.roomCode,room.currentLeaseId||contract?.leaseId||'',checkInDate,report?.id,'v1.0');if(res.success){showToast('success',res.message);setCheckInStage(4)}else showToast('error',res.message)}}>Xác nhận nhận phòng</button></div>
            </>}
            {checkInStage === 4 && <div className="text-center space-y-3 py-6"><CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto"/><h3 className="text-xl font-bold">Đã ghi nhận nhận phòng</h3><p className="text-sm text-slate-600">Phòng {room.roomCode} đã được cập nhật theo kết quả xác nhận.</p><button className={`${btn} bg-blue-600 text-white`} onClick={()=>{setSubTab('list');setCheckInStage(0)}}>Về danh sách phòng</button></div>}
          </div>}
        </div>;
      })()}

      {subTab === 'return' && (() => {
        const room=rooms.find(r=>r.roomCode===activeReturnRoomCode);
        const inspection=room && returnInspections.find(i=>i.roomCode===room.roomCode && i.leaseId===room.currentLeaseId);
        const canVacate=!!inspection && inspection.step304Status==='Đã nhận lại' && !!inspection.step305Confirmed;
        const btn='rounded-lg px-4 py-2 text-sm font-semibold';
        return <div className="space-y-4">
          <div className="rounded-2xl bg-white border p-5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div><h2 className="text-lg font-bold">Trả phòng</h2><p className="text-sm text-slate-500">Kiểm tra hồ sơ nhận lại phòng trước khi cập nhật trạng thái.</p></div>
            <label className="text-sm">Chọn phòng <select value={activeReturnRoomCode} onChange={e=>{setActiveReturnRoomCode(e.target.value);setReturnStage(0)}} className="mt-1 block border rounded-lg px-3 py-2 bg-white"><option value="">Chọn phòng</option>{rooms.filter(r=>r.status!=='Trống').map(r=><option value={r.roomCode} key={r.id}>{r.roomCode} – {r.status}</option>)}</select></label>
          </div>
          {!room ? <div className="bg-white border rounded-xl p-5 text-sm text-slate-500">Chọn phòng cần nhận lại.</div> : <div className="bg-white border rounded-2xl p-5 space-y-5">
            {returnStage===0 && <>
              <h3 className="font-semibold text-lg">Kiểm tra kết quả nhận lại phòng</h3>
              <div className="rounded-xl border bg-slate-50 p-4 text-sm space-y-2"><p>Phòng: <strong>{room.roomCode}</strong></p><p>Biên bản nhận lại: <strong>{inspection?.id || 'Chưa có'}</strong></p><p>Thực tế: <strong>{inspection?.step304Status || 'Chưa ghi nhận'}</strong></p><p>Chủ nhà xác nhận: <strong>{inspection?.step305Confirmed?'Đã xác nhận':'Chưa xác nhận'}</strong></p>{!canVacate && <p className="text-amber-800">Chưa đủ điều kiện trả phòng. Vui lòng hoàn thiện biên bản trước.</p>}</div>
              <div className="flex flex-wrap justify-end gap-2"><button className={`${btn} border`} onClick={()=>onNavigate?.('handover',{roomCode:room.roomCode})}>Mở hồ sơ bàn giao</button><button disabled={!canVacate} className={`${btn} ${canVacate?'bg-blue-600 text-white':'bg-slate-100 text-slate-400 cursor-not-allowed'}`} onClick={()=>setReturnStage(1)}>Tiếp tục <ArrowRight className="inline w-4 h-4"/></button></div>
            </>}
            {returnStage===1 && <>
              <h3 className="font-semibold text-lg">Xác nhận kết thúc thuê</h3><p className="text-sm text-slate-600">Sau khi nhận lại phòng, hệ thống cập nhật trạng thái Trống; quyết toán cọc được theo dõi riêng trong hồ sơ hợp đồng.</p>
              <label className="block text-sm font-semibold">Ngày nhận lại thực tế <input type="date" className="block mt-1 border rounded-lg px-3 py-2" value={returnActualDate} onChange={e=>setReturnActualDate(e.target.value)}/></label>
              <div className="flex flex-wrap justify-between gap-2"><button className={`${btn} border`} onClick={()=>setReturnStage(0)}>Quay lại</button><button disabled={!canVacate||!returnActualDate} className={`${btn} bg-blue-600 text-white disabled:bg-slate-100 disabled:text-slate-400`} onClick={()=>{const res=confirmReturnStep305AndVacantPH08(room.roomCode,room.currentLeaseId||inspection?.leaseId||'',returnActualDate);if(res.success){showToast('success',res.message);setReturnStage(2)}else showToast('error',res.message)}}>Xác nhận trả phòng</button></div>
            </>}
            {returnStage===2 && <div className="text-center space-y-3 py-6"><CheckCircle2 className="mx-auto w-12 h-12 text-emerald-600"/><h3 className="text-xl font-bold">Đã ghi nhận trả phòng</h3><p className="text-sm text-slate-600">Có thể theo dõi quyết toán cọc trong Chi tiết hợp đồng.</p><button className={`${btn} bg-blue-600 text-white`} onClick={()=>{setReturnStage(0);setSubTab('list')}}>Về danh sách phòng</button></div>}
          </div>}
        </div>;
      })()}

      {subTab === 'expiry' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800"></span>
                <h2 className="text-sm font-bold text-slate-900">Theo dõi thời hạn thuê</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Theo dõi ngày hết hạn hợp đồng theo Hết hạn hợp đồng không đồng nghĩa khách đã trả phòng. </p>
            </div>

            {/* Toggle mô phỏng */}
            <label className="hidden flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer self-start md:self-auto">
              <input
                type="checkbox"
                checked={simulateExpiryEF01}
                onChange={(e) => setSimulateExpiryEF01(e.target.checked)}
                className="rounded border-slate-300 text-red-600 focus:ring-red-500"
              />
              <span className="font-medium text-red-700">Mô phỏng lỗi tải </span>
            </label>
          </div>

          {/* Lỗi truy xuất  */}
          {simulateExpiryEF01 ? (
            <div className="p-4 bg-red-50 border-2 border-red-300 rounded-xl space-y-2 text-red-900">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                <strong className="text-sm font-bold">Không tải được dữ liệu hợp đồng từ </strong>
              </div>
              <p className="text-xs">
                Không thể truy xuất thông tin hạn hợp đồng hoặc ngày hiệu lực. Hệ thống không tạo cảnh báo 30 ngày hay kết luận quá hạn khi thiếu nguồn. </p>
              <div className="flex justify-end pt-1">
                <button
                  onClick={() => setSimulateExpiryEF01(false)}
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Thử lại tải dữ liệu </button>
              </div>
            </div>
          ): (
            <>
              {/* Bộ lọc nhãn thời hạn & thời gian */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-700">1. Nhãn thời hạn:</span>
                  {(['Tất cả', 'Còn hạn', 'Sắp hết hạn hợp đồng', 'Đến hạn hôm nay', 'Đã hết hạn hợp đồng', 'Chưa có dữ liệu'] as const).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        setExpiryFilter(tag);
                        if (tag === 'Chưa có dữ liệu') {
                          // vô hiệu hóa và xóa lọc thời gian
                          setExpiryTimeMode('none');
                          setExpiryStartDate('');
                          setExpiryEndDate('');
                          setExpiryError(null);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                        expiryFilter === tag
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs': 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                {/* Bộ lọc thời gian: Chỉ chọn 1 trong 2 chế độ hoặc Không lọc */}
                <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center gap-4">
                  <span className="font-semibold text-slate-700">2. Lọc thời gian:</span>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="expiryTimeMode"
                      value="none"
                      disabled={expiryFilter === 'Chưa có dữ liệu'}
                      checked={expiryTimeMode === 'none'}
                      onChange={() => {
                        setExpiryTimeMode('none');
                        setExpiryError(null);
                      }}
                    />
                    <span className="text-slate-700">Không lọc thời gian</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="expiryTimeMode"
                      value="range"
                      disabled={expiryFilter === 'Chưa có dữ liệu'}
                      checked={expiryTimeMode === 'range'}
                      onChange={() => {
                        setExpiryTimeMode('range');
                        setExpiryDaysCount('');
                        setExpiryError(null);
                      }}
                    />
                    <span className="text-slate-700">Khoảng ngày hết hạn (từ - đến)</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="expiryTimeMode"
                      value="days"
                      disabled={expiryFilter === 'Chưa có dữ liệu'}
                      checked={expiryTimeMode === 'days'}
                      onChange={() => {
                        setExpiryTimeMode('days');
                        setExpiryStartDate('');
                        setExpiryEndDate('');
                        setExpiryError(null);
                      }}
                    />
                    <span className="text-slate-700">Số ngày cần theo dõi (N &ge; 0)</span>
                  </label>
                </div>

                {/* Inputs theo chế độ thời gian */}
                {expiryTimeMode === 'range' && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-slate-500">Từ ngày:</span>
                    <input
                      type="date"
                      value={expiryStartDate}
                      onChange={(e) => setExpiryStartDate(e.target.value)}
                      className="px-2.5 py-1 border border-slate-300 rounded bg-white font-mono text-xs"
                    />
                    <span className="text-slate-500">Đến ngày:</span>
                    <input
                      type="date"
                      value={expiryEndDate}
                      onChange={(e) => setExpiryEndDate(e.target.value)}
                      className="px-2.5 py-1 border border-slate-300 rounded bg-white font-mono text-xs"
                    />
                    <button
                      onClick={() => {
                        if (expiryStartDate && expiryEndDate && expiryStartDate > expiryEndDate) {
                          setExpiryError('Khoảng ngày đảo ngược (Từ ngày lớn hơn Đến ngày). Vui lòng chọn lại.');
                        } else {
                          setExpiryError(null);
                        }
                      }}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold cursor-pointer"
                    >
                      Áp dụng </button>
                  </div>
                )}

                {expiryTimeMode === 'days' && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-slate-500">Theo dõi trong vòng:</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={expiryDaysCount}
                      onChange={(e) => setExpiryDaysCount(e.target.value)}
                      placeholder="Số ngày N"
                      className="w-24 px-2.5 py-1 border border-slate-300 rounded bg-white font-mono text-xs"
                    />
                    <span className="text-slate-500">ngày tới (từ hôm nay đến hôm nay + N)</span>
                    <button
                      onClick={() => {
                        const num = Number(expiryDaysCount);
                        if (isNaN(num) || num < 0 || !Number.isInteger(num)) {
                          setExpiryError('Số ngày cần theo dõi N phải là số nguyên không âm (&ge; 0).');
                        } else {
                          setExpiryError(null);
                        }
                      }}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold cursor-pointer"
                    >
                      Áp dụng </button>
                  </div>
                )}

                {/* Error Banner */}
                {expiryError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-800 text-[11px] flex items-center justify-between">
                    <span className="font-semibold">{expiryError}</span>
                    <button
                      onClick={() => setExpiryError(null)}
                      className="text-red-600 hover:text-red-900 font-bold ml-2"
                    >
                      X </button>
                  </div>
                )}
              </div>

              {/* Bảng Danh sách Theo dõi thời hạn thuê */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-2.5 px-3">Mã phòng</th>
                      <th className="py-2.5 px-3">Mã hợp đồng</th>
                      <th className="py-2.5 px-3">Ngày bắt đầu</th>
                      <th className="py-2.5 px-3">Ngày hết hạn</th>
                      <th className="py-2.5 px-3">Hiệu lực hợp đồng</th>
                      <th className="py-2.5 px-3">Số ngày còn lại/Đã qua</th>
                      <th className="py-2.5 px-3">Ngày dự kiến trả</th>
                      <th className="py-2.5 px-3">Nhãn thời hạn</th>
                      <th className="py-2.5 px-3">Nhãn phản hồi </th>
                      <th className="py-2.5 px-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rooms.filter(r => {
                        const badge = getExpiryBadge(r.contractEndDate);
                        if (expiryFilter !== 'Tất cả' && badge !== expiryFilter) return false;

                        // Lọc thời gian nếu đang bật và không lỗi
                        if (expiryTimeMode === 'range' && expiryStartDate && expiryEndDate && !expiryError) {
                          if (!r.contractEndDate) return false;
                          if (r.contractEndDate < expiryStartDate || r.contractEndDate > expiryEndDate) return false;
                        } else if (expiryTimeMode === 'days' && expiryDaysCount !== '' && !expiryError) {
                          if (!r.contractEndDate) return false;
                          const target = new Date(r.contractEndDate);
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                          const maxDays = Number(expiryDaysCount);
                          if (diff < 0 || diff > maxDays) return false;
                        }

                        return true;
                      }).map(r => {
                        const badge = getExpiryBadge(r.contractEndDate);
                        const fbBadge = getFeedbackBadge(r);
                        const targetContract = contracts.find(c => c.id === r.currentContractId || c.roomCode === r.roomCode);
                        const rem = getDaysRemainingOrOverdue(r.contractEndDate);
                        const isOverdue = rem?.isOverdue;

                        return (
                          <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{r.roomCode}</td>
                            <td className="py-2.5 px-3 font-mono text-slate-700">
                              {r.currentContractId || <span className="text-slate-400 italic">Chưa có</span>}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-600">
                              {r.contractStartDate || <span className="text-slate-400 italic">—</span>}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">
                              {r.contractEndDate || <span className="text-slate-400 italic">Chưa xác định</span>}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                targetContract?.status === 'Hiệu lực' ? 'bg-emerald-100 text-emerald-800':
                                targetContract?.status === 'Chờ hiệu lực' ? 'bg-indigo-100 text-indigo-800':
                                'bg-slate-100 text-slate-600'
                              }`}>
                                {targetContract?.status || (r.status === 'Đang thuê' ? 'Hiệu lực': 'Chưa xác định')}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-medium">
                              {rem ? (
                                <span className={isOverdue ? 'text-red-700 font-bold': 'text-slate-700'}>
                                  {rem.text}
                                </span>
                              ): (
                                <span className="text-slate-400 italic">—</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-amber-800 font-semibold">
                              {r.expectedReturnDate || <span className="text-slate-400 font-normal italic">Chưa có</span>}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                                badge === 'Sắp hết hạn hợp đồng' ? 'bg-amber-100 text-amber-800':
                                badge === 'Đến hạn hôm nay' ? 'bg-orange-100 text-orange-900 font-bold':
                                badge === 'Đã hết hạn hợp đồng' ? 'bg-red-100 text-red-800':
                                badge === 'Chưa có dữ liệu' ? 'bg-slate-100 text-slate-500':
                                'bg-emerald-50 text-emerald-700'
                              }`}>
                                {badge}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-[11px] font-medium text-slate-700">
                              {fbBadge}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {/* 1. Xem hợp đồng */}
                                <button
                                  onClick={() => { setSelectedRoom(r); setShowContractModal(true); }}
                                  className="px-2 py-1 bg-white hover:bg-slate-100 text-blue-700 border border-slate-300 rounded text-[11px] font-medium cursor-pointer"
                                  title="Xem hợp đồng"
                                >
                                  Xem HĐ </button>

                                {/* 2. Theo dõi phản hồi (mở, thẻ Phản hồi) */}
                                <button
                                  onClick={() => {
                                    setFeedbackSelectedRoomCode(r.roomCode);
                                    setPlansSubTab('feedback');
                                    setSubTab('plans');
                                  }}
                                  className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-[11px] font-medium cursor-pointer"
                                  title="Theo dõi phản hồi tại "
                                >
                                  Phản hồi </button>

                                {/* 3. Kiểm tra kết quả trả phòng () */}
                                <button
                                  onClick={() => { setSelectedRoom(r); setActiveReturnRoomCode(r.roomCode); setReturnStage(0); setSubTab('return'); }}
                                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-[11px] font-medium cursor-pointer"
                                  title="Kiểm tra kết quả nhận lại phòng tại "
                                >
                                  Kiểm tra trả </button>

                                {/* 4. Ghi nhận ngày trả () hoặc Cập nhật () */}
                                {r.status === 'Đang thuê' || r.status === 'Sắp trả' ? (
                                  <button
                                    onClick={() => {
                                      setSelectedRoom(r);
                                      setExpDateInput(r.expectedReturnDate || '');
                                      setShowExpectedDateModal(true);
                                    }}
                                    className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded text-[11px] font-semibold cursor-pointer"
                                    title={r.expectedReturnDate ? 'Cập nhật ngày dự kiến trả': 'Ghi nhận ngày dự kiến trả'}
                                  >
                                    {r.expectedReturnDate ? 'Sửa ngày trả': 'Ghi ngày trả'}
                                  </button>
                                ): (
                                  <span className="text-[10px] text-slate-400 italic px-1">Chỉ xem</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ==================== SUB-TAB 3: RETURN PLANS & FEEDBACK () ==================== */}
      {subTab === 'plans' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800"></span>
                <h2 className="text-sm font-bold text-slate-900">Theo dõi kế hoạch và phản hồi trả phòng</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Quản lý 2 thẻ độc lập: Kế hoạch trả (theo dõi ngày khách trả) và Phản hồi (nhật ký liên hệ trao đổi). </p>
            </div>

            {/* Sub-tab 13 navigation (Thẻ Kế hoạch trả vs Thẻ Phản hồi) */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                onClick={() => setPlansSubTab('plans')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  plansSubTab === 'plans' ? 'bg-white text-slate-900 shadow-xs': 'text-slate-600 hover:text-slate-900'
                }`}
              >
                1. Thẻ Kế hoạch trả </button>
              <button
                onClick={() => setPlansSubTab('feedback')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  plansSubTab === 'feedback' ? 'bg-white text-slate-900 shadow-xs': 'text-slate-600 hover:text-slate-900'
                }`}
              >
                2. Thẻ Phản hồi &amp; Liên hệ </button>
            </div>
          </div>

          {/* ==================== THẺ 1: KẾ HOẠCH TRẢ ==================== */}
          {plansSubTab === 'plans' && (
            <div className="space-y-4">
              {/* Filter Bar Kế hoạch trả */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[300px]">
                  <input
                    type="text"
                    value={planSearchRoom}
                    onChange={(e) => setPlanSearchRoom(e.target.value)}
                    placeholder="Lọc mã phòng..."
                    className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                  />
                  <select
                    value={planStatusFilter}
                    onChange={(e) => setPlanStatusFilter(e.target.value as any)}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-medium"
                  >
                    <option value="Tất cả">Tất cả trạng thái</option>
                    <option value="Đang thuê">Đang thuê</option>
                    <option value="Sắp trả">Sắp trả phòng</option>
                  </select>
                  <span className="text-xs font-semibold text-slate-700">Ngày dự kiến trả phòng:</span>
                  <input
                    type="date"
                    value={planStartDate}
                    onChange={(e) => setPlanStartDate(e.target.value)}
                    className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono text-xs"
                    title="Từ ngày dự kiến trả phòng" aria-label="Từ ngày dự kiến trả phòng"
                  />
                  <input
                    type="date"
                    value={planEndDate}
                    onChange={(e) => setPlanEndDate(e.target.value)}
                    className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono text-xs"
                    title="Đến ngày dự kiến trả phòng" aria-label="Đến ngày dự kiến trả phòng"
                  />
                  {(planSearchRoom || planStatusFilter !== 'Tất cả' || planStartDate || planEndDate) && (
                    <button
                      onClick={() => { setPlanSearchRoom(''); setPlanStatusFilter('Tất cả'); setPlanStartDate(''); setPlanEndDate(''); }}
                      className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                    >
                      Xóa lọc </button>
                  )}
                </div>

                <select value={planSearchRoom} onChange={e=>setPlanSearchRoom(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white" aria-label="Chọn phòng cần ghi ngày dự kiến trả">
                  <option value="">Chọn phòng cần ghi ngày trả</option>
                  {rooms.filter(r=>r.status==='Đang thuê'||r.status==='Sắp trả').map(r=><option key={r.roomCode} value={r.roomCode}>{r.roomCode} - {r.currentTenantName||'Chưa có tên'}</option>)}
                </select>
                <button
                  onClick={() => {
                    const rentedRoom = rooms.find(r => r.roomCode === planSearchRoom && (r.status === 'Đang thuê' || r.status === 'Sắp trả')); 
                    if (rentedRoom) {
                      setSelectedRoom(rentedRoom);
                      setExpDateInput(rentedRoom.expectedReturnDate || '');
                      setShowExpectedDateModal(true);
                    } else {
                      showToast('error', 'Hãy nhập mã phòng đang thuê vào ô tìm kiếm rồi bấm Ghi ngày dự kiến trả mới, hoặc mở chức năng từ Chi tiết phòng.');
                    }
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Ghi ngày dự kiến trả mới </button>
              </div>

              <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                Khoảng ngày trên chỉ lọc các kế hoạch trả đã ghi nhận. Phòng được hiển thị <strong>Sắp trả phòng</strong> khi ngày dự kiến trả đã xác nhận còn trong 15 ngày hoặc đã qua mà chưa nhận lại thực tế; ngày hết hạn hợp đồng không tự làm phòng chuyển trạng thái.
              </p>

              {/* Bảng Kế hoạch trả đang theo dõi */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-2.5 px-3">Mã phòng</th>
                      <th className="py-2.5 px-3">Hợp đồng / Lần thuê</th>
                      <th className="py-2.5 px-3">Trạng thái phòng</th>
                      <th className="py-2.5 px-3">Ngày dự kiến trả</th>
                      <th className="py-2.5 px-3">Số ngày còn lại/Đã qua</th>
                      <th className="py-2.5 px-3">Kết quả bàn giao (bàn giao trả phòng)</th>
                      <th className="py-2.5 px-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rooms.filter(r => r.expectedReturnDate).filter(r => {
                        if (planSearchRoom && !r.roomCode.toLowerCase().includes(planSearchRoom.toLowerCase())) return false;
                        if (planStatusFilter !== 'Tất cả' && r.status !== planStatusFilter) return false;
                        if (planStartDate && r.expectedReturnDate! < planStartDate) return false;
                        if (planEndDate && r.expectedReturnDate! > planEndDate) return false;
                        return true;
                      }).map(r => {
                        const rem = getDaysRemainingOrOverdue(r.expectedReturnDate);
                        const inspection = returnInspections.find(i => i.roomCode === r.roomCode);
                        return (
                          <tr key={r.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{r.roomCode}</td>
                            <td className="py-2.5 px-3">
                              <span className="font-mono font-semibold text-slate-800">{r.currentContractId || '—'}</span>
                              <span className="block text-[10px] text-slate-500 font-mono">{r.currentLeaseId}</span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                r.status === 'Sắp trả' ? 'bg-amber-100 text-amber-800': 'bg-blue-100 text-blue-800'
                              }`}>
                                {r.status === 'Sắp trả' ? 'Sắp trả phòng' : r.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-amber-800">
                              {r.expectedReturnDate}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`font-semibold ${rem?.isOverdue ? 'text-red-700 font-bold': 'text-slate-800'}`}>
                                {rem?.text}
                              </span>
                              <span className="block text-[10px] text-slate-400 italic">(chỉ xem, không sửa)</span>
                            </td>
                            <td className="py-2.5 px-3">
                              {inspection ? (
                                <span className={`text-[11px] font-medium ${inspection.step304Status === 'Đã nhận lại' ? 'text-emerald-700': 'text-amber-700'}`}>
                                  {inspection.step304Status} · {inspection.step305Confirmed ? 'xác nhận của chủ nhà Đã xác nhận': 'Chưa xác nhận của chủ nhà'}
                                </span>
                              ): (
                                <span className="text-slate-400 italic">Chưa bàn giao</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => {
                                    setSelectedRoom(r);
                                    setExpDateInput(r.expectedReturnDate || '');
                                    setShowExpectedDateModal(true);
                                  }}
                                  className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded text-[11px] font-semibold cursor-pointer"
                                  title="Cập nhật ngày dự kiến trả "
                                >
                                  Cập nhật ngày </button>
                                <button
                                  onClick={() => { setSelectedRoom(r); setActiveReturnRoomCode(r.roomCode); setReturnStage(0); setSubTab('return'); }}
                                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-[11px] font-medium cursor-pointer"
                                  title="Kiểm tra kết quả trả phòng "
                                >
                                  Kiểm tra trả </button>
                                <button
                                  onClick={() => { setSelectedRoom(r); setShowExtensionModal(true); }}
                                  className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded text-[11px] font-medium cursor-pointer"
                                  title="Kiểm tra kết quả tiếp tục thuê "
                                >
                                  Tiếp tục thuê </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3">
                Khi hợp đồng nối tiếp đã ký và có hiệu lực, kế hoạch trả cũ được cập nhật tự động. Bạn có thể xem thay đổi trong lịch sử kế hoạch trả.
              </p>

              {/* Lịch sử chỉ mở khi người dùng yêu cầu; không phải một màn hình thao tác song song. */}
              <div className="pt-2 space-y-2">
                <button type="button" onClick={() => setShowReturnPlanHistory(v => !v)}
                  aria-expanded={showReturnPlanHistory}
                  className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 font-semibold text-xs hover:bg-slate-50 flex items-center gap-2">
                  <History className="w-4 h-4" />
                  {showReturnPlanHistory ? 'Ẩn lịch sử kế hoạch trả' : `Xem lịch sử kế hoạch trả (${returnPlans.length})`}
                </button>
                {showReturnPlanHistory && <p className="text-xs text-slate-500">Theo dõi những lần ghi nhận, sửa ngày dự kiến trả, hủy kế hoạch hoặc kết thúc để đối chiếu với lần thuê. Lịch sử không làm thay đổi ngày trả hiện tại.</p>}
                {showReturnPlanHistory && (<>
                {returnPlans.length === 0 ? (
                  <p className="text-slate-400 italic text-center py-4 border border-dashed border-slate-200 rounded-xl text-xs">
                    Chưa có lịch sử kế hoạch trả phòng nào phát sinh. </p>
                ): (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-56 overflow-y-auto">
                    <table className="w-full text-left text-xs divide-y divide-slate-200">
                      <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0 text-[11px]">
                        <tr>
                          <th className="py-2 px-3">Phòng</th>
                          <th className="py-2 px-3">Lần thuê</th>
                          <th className="py-2 px-3">Ngày trả đã ghi</th>
                          <th className="py-2 px-3">Trạng thái</th>
                          <th className="py-2 px-3">Lý do / Căn cứ</th>
                          <th className="py-2 px-3">Người ghi</th>
                          <th className="py-2 px-3">Thời điểm</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {returnPlans.map(p => (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-mono font-bold text-slate-900">{p.roomCode}</td>
                            <td className="py-2 px-3 font-mono text-slate-600">{p.leaseId}</td>
                            <td className="py-2 px-3 font-mono font-bold text-amber-800">{p.expectedDate}</td>
                            <td className="py-2 px-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                p.status === 'Đã hủy' ? 'bg-rose-100 text-rose-800':
                                p.status === 'Đã kết thúc' ? 'bg-slate-200 text-slate-700':
                                'bg-emerald-100 text-emerald-800'
                              }`}>
                                {p.status}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-600">{p.reason || 'Kế hoạch ban đầu'}</td>
                            <td className="py-2 px-3 font-semibold text-slate-700">{p.loggedBy}</td>
                            <td className="py-2 px-3 font-mono text-slate-500 text-[10px]">
                              {p.loggedAt.replace('T', ' ').substring(0, 16)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                </>)}
              </div>
            </div>
          )}

          {/* ==================== THẺ 2: PHẢN HỒI & LIÊN HỆ () ==================== */}
          {plansSubTab === 'feedback' && (
            <div className="space-y-4">
              {/* Chọn phòng & lần thuê để ghi nhận phản hồi */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Chọn phòng &amp; lần thuê:</span>
                  <select
                    value={feedbackSelectedRoomCode || (rooms[0]?.roomCode || '')}
                    onChange={(e) => setFeedbackSelectedRoomCode(e.target.value)}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-mono font-bold text-blue-700"
                  >
                    {rooms.map(r => (
                      <option key={r.id} value={r.roomCode}>
                        {r.roomCode} - {r.currentTenantName || 'Trống'} ({r.status}) </option>
                    ))}
                  </select>
                </div>

                {/* Nhãn phản hồi hiện hành của phòng theo */}
                {(() => {
                  const currRoom = rooms.find(r => r.roomCode === (feedbackSelectedRoomCode || rooms[0]?.roomCode));
                  const fbBadge = currRoom ? getFeedbackBadge(currRoom): 'Chưa có ghi nhận liên hệ';
                  return (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">Nhãn phản hồi hiện hành:</span>
                      <span className="px-2.5 py-1 rounded-md bg-indigo-100 text-indigo-900 font-bold">
                        {fbBadge}
                      </span>
                    </div>
                  );
                })()}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form Ghi nhận kết quả liên hệ thực tế (Bước 4) */}
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 text-xs shadow-xs">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    Ghi nhận kết quả liên hệ khách thuê </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Thời điểm liên hệ thực tế <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={contactTime}
                        onChange={(e) => setContactTime(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-[11px]"
                      />
                      <span className="text-[10px] text-slate-400 block mt-0.5">Không được ở tương lai</span>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Kênh liên hệ <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={contactSource}
                        onChange={(e) => setContactSource(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                      >
                        <option value="tin nhắn">Tin nhắn Zalo/SMS</option>
                        <option value="điện thoại">Điện thoại</option>
                        <option value="trực tiếp">Gặp trực tiếp</option>
                        <option value="khác">Khác</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Kết quả phản hồi của khách <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={contactResult}
                      onChange={(e) => setContactResult(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-semibold text-slate-800"
                    >
                      <option value="Chưa phản hồi">Chưa phản hồi (đã liên hệ nhưng chưa nhận trả lời)</option>
                      <option value="Không tiếp tục thuê – Chưa xác nhận ngày dự kiến trả">
                        Không tiếp tục thuê – Chưa xác nhận ngày dự kiến trả </option>
                      <option value="Đồng ý tiếp tục thuê">Đồng ý tiếp tục thuê</option>
                      <option value="Chờ đối chiếu">Chờ đối chiếu</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nội dung trao đổi xác minh được <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={contactContent}
                      onChange={(e) => setContactContent(e.target.value)}
                      placeholder="Chi tiết câu trả lời của khách thuê..."
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Ngày hẹn liên hệ lại tiếp theo (tùy chọn) </label>
                    <input
                      type="date"
                      value={contactNextDate}
                      onChange={(e) => setContactNextDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    {/* Trường hợp 09: Hẹn liên hệ lại khi chưa liên hệ */}
                    <button
                      type="button"
                      onClick={() => {
                        const targetCode = feedbackSelectedRoomCode || rooms[0]?.roomCode;
                        if (!contactNextDate) {
                          showToast('error', 'Vui lòng chọn Ngày hẹn liên hệ lại trước khi lưu lịch hẹn.');
                          return;
                        }
                        const res = recordTenantContactPH13({
                          roomCode: targetCode,
                          leaseId: 'THUE-' + targetCode,
                          contactTimeActual: contactTime,
                          contactSource,
                          contactResult: 'Chưa phản hồi',
                          content: 'Lưu lịch hẹn liên hệ tiếp theo (Trường hợp 09)',
                          nextContactDate: contactNextDate,
                          isAppointmentOnly: true
                        });
                        showToast('success', toUserMessage(res.message));
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium cursor-pointer"
                    >
                      Lưu lịch hẹn riêng </button>

                    <button
                      type="button"
                      onClick={() => {
                        const targetCode = feedbackSelectedRoomCode || rooms[0]?.roomCode;
                        if (!contactContent.trim()) {
                          showToast('error', 'Nội dung trao đổi không được để trống.');
                          return;
                        }
                        const res = recordTenantContactPH13({
                          roomCode: targetCode,
                          leaseId: 'THUE-' + targetCode,
                          contactTimeActual: contactTime,
                          contactSource,
                          contactResult,
                          content: contactContent,
                          nextContactDate: contactNextDate
                        });
                        if (res.isConflict) {
                          showToast('error', toUserMessage(res.message));
                        } else {
                          showToast('success', toUserMessage(res.message));
                          setContactContent('');
                        }
                      }}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold cursor-pointer"
                    >
                      Lưu ghi nhận liên hệ </button>
                  </div>
                </div>

                {/* Nhật ký liên hệ (Phản hồi) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-blue-600" />
                      Nhật ký phản hồi liên hệ khách thuê </h3>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {contactLogs.length} bản ghi </span>
                  </div>

                  <div className="space-y-2 max-h-[460px] overflow-y-auto">
                    {contactLogs.map((log) => (
                      <div
                        key={log.id}
                        className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                          log.conflictFlag
                            ? 'bg-rose-50 border-rose-300 text-rose-950': 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="font-bold text-slate-900">
                            Phòng {log.roomCode} · Kênh: {log.contactSource}
                          </span>
                          <span className="font-mono text-slate-500">
                            {log.contactTimeActual.replace('T', ' ')}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-700">Kết quả:</span>
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            log.contactResult === 'Chờ đối chiếu' ? 'bg-rose-200 text-rose-900':
                            log.contactResult === 'Chưa phản hồi' ? 'bg-amber-100 text-amber-900':
                            'bg-blue-100 text-blue-900'
                          }`}>
                            {log.contactResult}
                          </span>
                          {log.conflictFlag && (
                            <span className="text-[10px] font-mono text-rose-700 font-bold">
                              [{log.hdt06Reference}] </span>
                          )}
                        </div>

                        <p className="text-slate-700 text-[11px] leading-relaxed">
                          {log.content}
                        </p>

                        <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                          <span>Người ghi: <strong>{log.loggedBy}</strong> (Hệ thống nhập: {log.systemInputTime.substring(11, 19)})</span>
                          {log.nextContactDate && (
                            <span className="font-semibold text-blue-700">
                              Hẹn liên hệ lại: {log.nextContactDate}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {contactLogs.length === 0 && (
                      <p className="text-slate-400 italic text-center py-8 border border-dashed border-slate-200 rounded-xl text-xs">
                        Chưa có ghi nhận liên hệ nào. </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== 3. & 4. CHI TIẾT PHÒNG (MODAL/PANEL CHÍNH) ==================== */}
      {/* User chọn một phòng. Hệ thống hiển thị khách thuê, hợp đồng, số người ở, thông tin bàn giao, ngày dự kiến trả và các khoản đã thanh toán.
          Ngày dự kiến trả và Số ngày còn lại/Quá ngày trả (chỉ xem, không sửa, nếu có); Có kế hoạch trả có thể đồng thời Đang thuê.
          Nhãn thời hạn hợp đồng theo Nhãn phản hồi hiện hành theo  (nếu có căn cứ): Chưa phản hồi, Đã phản hồi – Chưa xác nhận ngày trả, Đã phản hồi – Đã xác nhận ngày trả, hoặc Đã phản hồi – Tiếp tục thuê; chưa từng liên hệ và chưa có căn cứ phản hồi hiển thị “Chưa có ghi nhận liên hệ”, không gán Chưa phản hồi.
          Hiển thị riêng Đã cọc và Đã thanh toán tiền thuê kỳ đầu (kèm kỳ thuê trả trước, chỉ xem, không sửa từ ); không gộp hai khoản.
          Chi tiết phòng có nút Chỉnh sửa thông tin phòng (mở ).
          Các liên kết Xem hợp đồng, Xem hồ sơ khách thuê, Xem bàn giao, Xem kế hoạch trả (mở, thẻ Kế hoạch trả) và Xem thông tin cọc mở hồ sơ liên quan. */}
      {isRoomDetailOpen && selectedRoom && subTab === 'list' && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Home className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Chi tiết phòng: <span className="font-mono text-blue-700">{selectedRoom.roomCode}</span>
                </h3>
                <span className={`ml-2 px-2.5 py-0.5 rounded text-xs font-semibold ${
                  selectedRoom.status === 'Trống' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300':
                  selectedRoom.status === 'Sắp trả' ? 'bg-amber-100 text-amber-800 border border-amber-300':
                  'bg-blue-100 text-blue-800 border border-blue-300'
                }`}>
                  Trạng thái: {selectedRoom.status === 'Sắp trả' ? 'Sắp trả phòng' : selectedRoom.status}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/*: Kiểm tra khả năng cho thuê */}
                <button
                  onClick={() => {
                    setCheckRentableRoom(selectedRoom);
                    setSimulateEF01(false);
                    setShowCheckRentableModal(true);
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  title="Kiểm tra khả năng cho thuê "
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Kiểm tra cho thuê </button>
                {/* 4. Nút Chỉnh sửa thông tin phòng (mở ) */}
                <button
                  onClick={handleOpenEditModal}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Chỉnh sửa thông tin phòng (mở ) </button>
                <button
                  onClick={() => setShowHistoryModal(true)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Xem lịch sử điều chỉnh theo "
                >
                  <History className="w-3.5 h-3.5 text-slate-500" />
                  Lịch sử ({roomHistory.filter(h => h.roomCode === selectedRoom.roomCode).length}) </button>
                <button
                  onClick={closeRoomDetails}
                  aria-label="Đóng chi tiết phòng"
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Lưu ý Lưu ý: Có kế hoạch trả có thể đồng thời Đang thuê */}
              {selectedRoom.expectedReturnDate && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 flex items-start gap-2.5 shadow-xs">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Lưu ý: </span>
                    <span>Có kế hoạch trả có thể đồng thời Đang thuê. Khách có kế hoạch trả phòng vào ngày {selectedRoom.expectedReturnDate}, nhưng hợp đồng và quyền cư trú vẫn có hiệu lực cho tới khi bàn giao nhận lại phòng thực tế.</span>
                  </div>
                </div>
              )}

              {/* 1. THÔNG TIN CƠ BẢN PHÒNG */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  1. Thông tin cơ bản phòng </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Mã phòng</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">{selectedRoom.roomCode}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Tầng</span>
                    <span className="font-bold text-slate-800 text-sm">Tầng {selectedRoom.floor}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Diện tích</span>
                    <span className="font-bold text-slate-800 text-sm font-mono">{selectedRoom.area} m²</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Trạng thái</span>
                    <span className="font-bold text-slate-800 text-sm">{selectedRoom.status === 'Sắp trả' ? 'Sắp trả phòng' : selectedRoom.status}</span>
                  </div>
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-baseline gap-2">
                  <span className="text-slate-500 font-semibold shrink-0">Ghi chú (chỉ xem, không sửa):</span>
                  <span className="text-slate-700 italic">{selectedRoom.note || 'Không có ghi chú.'}</span>
                </div>
              </div>

              {/* 2. KHÁCH THUÊ & SỐ NGƯỜI Ở */}
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    2. Khách thuê &amp; Số người ở </span>
                  {/* Liên kết Xem hồ sơ khách thuê */}
                  <button
                    onClick={() => selectedRoom && openLinkedRecord('tenants', selectedRoom)}
                    className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Xem hồ sơ khách thuê </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-500 block text-[11px]">Khách thuê hiện tại:</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {selectedRoom.currentTenantName || <span className="text-slate-400 font-normal italic">Chưa có khách thuê</span>}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-500 block text-[11px]">Số người ở (Tổng số người):</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {selectedRoom.totalOccupants} người {selectedRoom.totalOccupants > 1 && '(bao gồm khách ở ghép)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. HỢP ĐỒNG & THỜI HẠN THUÊ */}
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    3. Hợp đồng &amp; Thời hạn thuê </span>
                  {/* Liên kết Xem hợp đồng */}
                  <button
                    onClick={() => selectedRoom && openLinkedRecord('contracts', selectedRoom)}
                    className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Xem hợp đồng </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Mã hợp đồng</span>
                    <span className="font-mono font-semibold text-slate-800">{selectedRoom.currentContractId || 'Chưa có'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Ngày bắt đầu thuê</span>
                    <span className="font-mono text-slate-700">{selectedRoom.contractStartDate || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Hạn hợp đồng</span>
                    <span className="font-mono font-semibold text-slate-800">{selectedRoom.contractEndDate || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Nhãn thời hạn</span>
                    <span className={`inline-block font-bold px-2 py-0.5 rounded text-[11px] ${
                      getExpiryBadge(selectedRoom.contractEndDate) === 'Sắp hết hạn hợp đồng' ? 'bg-amber-100 text-amber-800':
                      getExpiryBadge(selectedRoom.contractEndDate) === 'Đã hết hạn hợp đồng' ? 'bg-red-100 text-red-800':
                      getExpiryBadge(selectedRoom.contractEndDate) === 'Đến hạn hôm nay' ? 'bg-rose-100 text-rose-800 font-bold':
                      getExpiryBadge(selectedRoom.contractEndDate) === 'Còn hạn' ? 'bg-emerald-100 text-emerald-800':
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {getExpiryBadge(selectedRoom.contractEndDate)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. THÔNG TIN BÀN GIAO */}
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <PackageCheck className="w-4 h-4 text-emerald-600" />
                    4. Thông tin bàn giao </span>
                  {/* Liên kết Xem bàn giao */}
                  <button
                    onClick={() => selectedRoom && openLinkedRecord('handover', selectedRoom)}
                    className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Xem bàn giao </button>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Biên bản bàn giao nhận phòng:</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {relatedHandover ? relatedHandover.reportNumber: `BBBG-${selectedRoom.roomCode}`}
                    </span>
                    <span className="text-slate-500 text-[11px] ml-2">
                      (Bàn giao đầy đủ điều hòa, nóng lạnh, giường tủ, chìa khóa &amp; thẻ từ) </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 font-semibold self-start sm:self-auto shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {relatedHandover?.tenantSignedPaper === 'Đã ký giấy' && relatedHandover?.ownerSignedPaper === 'Đã ký giấy' ? 'Đã xác nhận ký biên bản' : 'Chưa xác nhận đủ chữ ký'}
                  </span>
                </div>
              </div>

              {/* 5. NGÀY DỰ KIẾN TRẢ & PHẢN HỒI HIỆN HÀNH THEO  */}
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-amber-600" />
                    5. Ngày dự kiến trả &amp; Phản hồi khách thuê </span>
                  {/* Liên kết Xem kế hoạch trả (mở, thẻ Kế hoạch trả) */}
                  <button
                    onClick={() => {
                      setSubTab('plans');
                      setSelectedRoom(null);
                    }}
                    className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    Xem kế hoạch trả (mở, thẻ Kế hoạch trả) </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-500 block text-[11px]">Ngày dự kiến trả (chỉ xem, không sửa, nếu có):</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {selectedRoom.expectedReturnDate || <span className="text-slate-400 font-normal italic">Chưa ghi nhận</span>}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-500 block text-[11px]">Số ngày còn lại/Quá ngày trả (chỉ xem, không sửa, nếu có):</span>
                    {selectedRoom.expectedReturnDate ? (
                      (() => {
                        const rem = getDaysRemainingOrOverdue(selectedRoom.expectedReturnDate);
                        return (
                          <span className={`font-mono font-bold text-sm ${rem?.isOverdue ? 'text-red-700': 'text-amber-800'}`}>
                            {rem?.text}
                          </span>
                        );
                      })()
                    ): (
                      <span className="text-slate-400 font-normal italic">Chưa phát sinh</span>
                    )}
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-500 block text-[11px]">Nhãn phản hồi hiện hành:</span>
                    <span className={`inline-block font-bold px-2 py-0.5 rounded text-[11px] mt-0.5 ${
                      getFeedbackBadge(selectedRoom) === 'Đã phản hồi – Đã xác nhận ngày trả' ? 'bg-amber-100 text-amber-800':
                      getFeedbackBadge(selectedRoom) === 'Đã phản hồi – Tiếp tục thuê' ? 'bg-emerald-100 text-emerald-800':
                      getFeedbackBadge(selectedRoom) === 'Đã phản hồi – Chưa xác nhận ngày trả' ? 'bg-orange-100 text-orange-800':
                      getFeedbackBadge(selectedRoom) === 'Chưa phản hồi' ? 'bg-red-100 text-red-800':
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {getFeedbackBadge(selectedRoom)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 6. CÁC KHOẢN ĐÃ THANH TOÁN (HIỂN THỊ RIÊNG BIỆT, KHÔNG GỘP HAI KHOẢN) */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Receipt className="w-4 h-4 text-emerald-600" />
                      6. Các khoản đã thanh toán </span>
                    <span className="text-[11px] text-slate-500">
                      Hiển thị riêng Đã cọc và Đã thanh toán tiền thuê kỳ đầu (kèm kỳ thuê trả trước, chỉ xem, không sửa từ ); không gộp hai khoản. </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Khoản 1: Đã cọc */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800">Khoản 1: Tiền cọc giữ chỗ/bảo đảm</span>
                      {/* Liên kết Xem thông tin cọc */}
                      <button
                        onClick={() => setShowDepositModal(true)}
                        className="text-blue-600 hover:text-blue-800 text-[11px] font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Xem thông tin cọc </button>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">Trạng thái cọc:</span>
                      <span className={`font-bold ${selectedRoom.hasDeposit ? 'text-emerald-700': 'text-slate-400'}`}>
                        {selectedRoom.hasDeposit ? 'Đã cọc (1 tháng tiền cọc)': 'Chưa thu tiền cọc'}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">Số tiền cọc:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {initialPaymentRecords.find(p=>p.leaseId===selectedRoom.currentLeaseId && p.roomCode===selectedRoom.roomCode)?.depositAmount.toLocaleString('vi-VN') ? `${initialPaymentRecords.find(p=>p.leaseId===selectedRoom.currentLeaseId && p.roomCode===selectedRoom.roomCode)!.depositAmount.toLocaleString('vi-VN')} đ` : 'Chưa xác minh'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                      Khoản tiền cọc bảo đảm theo hợp đồng, lưu giữ độc lập và không gộp với tiền thuê. </p>
                  </div>

                  {/* Khoản 2: Đã thanh toán tiền thuê kỳ đầu */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800">Khoản 2: Tiền thuê kỳ đầu</span>
                      <span className="text-[10px] text-slate-400 italic font-mono">(chỉ xem, không sửa từ )</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">Trạng thái thanh toán:</span>
                      <span className={`font-bold ${selectedRoom.firstMonthRentPaid ? 'text-emerald-700': 'text-slate-400'}`}>
                        {selectedRoom.firstMonthRentPaid ? 'Đã thanh toán tiền thuê kỳ đầu': 'Chưa thanh toán'}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">Kỳ thuê trả trước:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {selectedRoom.firstMonthPeriod || <span className="text-slate-400 font-normal italic">Chưa ghi nhận</span>}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                      Tiền thuê kỳ đầu thu qua chuyển khoản ngân hàng, đối soát riêng biệt. </p>
                  </div>
                </div>
              </div>

              {/* 7. LỊCH SỬ THAY ĐỔI THÔNG TIN PHÒNG */}
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <History className="w-4 h-4 text-blue-600" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                      7. Lịch sử thay đổi thông tin phòng </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {roomHistory.filter(h => h.roomCode === selectedRoom.roomCode).length} lần điều chỉnh </span>
                </div>

                <div className="p-2 bg-blue-50/60 rounded-lg border border-blue-200 text-[11px] text-blue-900">
                  <strong className="text-blue-950">Lưu ý:</strong> Cập nhật phòng và lưu vết thay đổi được ghi nhận tự động (ghi nhận trường cũ, trường mới, người sửa và thời điểm). </div>

                {roomHistory.filter(h => h.roomCode === selectedRoom.roomCode).length === 0 ? (
                  <p className="text-[11px] text-slate-400 py-3 italic text-center">
                    Chưa có lịch sử thay đổi phát sinh cho phòng này. </p>
                ): (
                  <div className="overflow-x-auto max-h-48 overflow-y-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-[11px] divide-y divide-slate-200">
                      <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0">
                        <tr>
                          <th className="py-2 px-2.5">Thời điểm</th>
                          <th className="py-2 px-2.5">Người sửa</th>
                          <th className="py-2 px-2.5">Trường sửa</th>
                          <th className="py-2 px-2.5">Giá trị cũ</th>
                          <th className="py-2 px-2.5">Giá trị mới</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {roomHistory.filter(h => h.roomCode === selectedRoom.roomCode).map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50">
                              <td className="py-2 px-2.5 font-mono text-slate-600 whitespace-nowrap">
                                {log.changedAt.replace('T', ' ').substring(0, 19)}
                              </td>
                              <td className="py-2 px-2.5 font-semibold text-slate-800 whitespace-nowrap">
                                {log.changedBy}
                              </td>
                              <td className="py-2 px-2.5 font-bold text-blue-700 whitespace-nowrap">
                                {log.field}
                              </td>
                              <td className="py-2 px-2.5 text-slate-500 whitespace-nowrap">
                                {log.oldValue}
                              </td>
                              <td className="py-2 px-2.5 text-emerald-700 font-medium whitespace-nowrap">
                                {log.newValue}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* 8. CÁC NGHIỆP VỤ LIÊN QUAN */}
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  8. Các chức năng nghiệp vụ liên quan </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCheckRentableRoom(selectedRoom);
                      setSimulateEF01(false);
                      setShowCheckRentableModal(true);
                    }}
                    className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Kiểm tra khả năng cho thuê </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPayment07Modal(true)}
                    className="p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer"
                  >
                    Thu tiền cọc &amp; thuê đầu </button>

                  <button
                    type="button"
                    onClick={() => (setActiveCheckInRoomCode(selectedRoom?.roomCode || ''), setCheckInStage(0), setSubTab('checkin'))}
                    className="p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer"
                  >
                    Kiểm tra điều kiện nhận phòng </button>

                  <button
                    type="button"
                    onClick={() => setShowExpectedDateModal(true)}
                    className="p-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer"
                  >
                    Ghi/Cập nhật ngày dự kiến trả </button>

                  <button
                    type="button"
                    onClick={() => setShowMissingConditionModal(true)}
                    className="p-2.5 bg-orange-50 hover:bg-orange-100 text-orange-800 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer"
                  >
                    Ghi nhận điều kiện còn thiếu </button>

                  <button
                    type="button"
                    onClick={() => (setActiveReturnRoomCode(selectedRoom?.roomCode || ''), setReturnStage(0), setSubTab('return'))}
                    className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer"
                  >
                    Kiểm tra kết quả trả phòng </button>

                  <button
                    type="button"
                    onClick={() => setShowUnfinishedHandoverModal(true)}
                    className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer"
                  >
                    Ghi nhận chưa bàn giao xong </button>

                  <button
                    type="button"
                    onClick={() => setShowContactModal(true)}
                    className="p-2.5 bg-sky-50 hover:bg-sky-100 text-sky-800 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer"
                  >
                    Ghi nhận liên hệ &amp; phản hồi </button>

                  <button
                    type="button"
                    onClick={() => setShowExtensionModal(true)}
                    className="p-2.5 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer"
                  >
                    Kiểm tra kết quả tiếp tục thuê </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Đặc tả &amp;: Quản lý và cập nhật thông tin phòng </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={closeRoomDetails}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Quay lại danh sách phòng </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 4. CHỈNH SỬA THÔNG TIN PHÒNG (MỞ ) ==================== */}
      {showEditModal && selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Chỉnh sửa thông tin phòng </h3>
                  <p className="text-[11px] text-slate-500">Phòng: <span className="font-mono font-bold text-blue-700">{selectedRoom.roomCode}</span></p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                title="Hủy thao tác"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thông báo nếu phiên hết hạn hoặc lỗi hệ thống */}
            {editErrors.general && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold block">Lỗi </span>
                  <span>{editErrors.general}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleEditRoomSubmit} className="space-y-3.5 text-xs">
              {/* Bước 1: Mã phòng không thể sửa theo */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mã phòng <span className="text-slate-400 font-normal">(Cố định, không được phép sửa theo )</span>
                </label>
                <input
                  type="text"
                  disabled
                  value={selectedRoom.roomCode}
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-100 rounded-lg font-mono font-bold text-slate-700 cursor-not-allowed select-none"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  * Mã phòng duy nhất và không được thay đổi qua chức năng sửa. </span>
              </div>

              {/* Bước 2: Sửa Tầng & Diện tích */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tầng (≥ 0) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editFloor}
                    onChange={(e) => {
                      setEditFloor(e.target.value === '' ? '': Number(e.target.value));
                      if (editErrors.floor) setEditErrors(prev => ({...prev, floor: undefined }));
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none ${
                      editErrors.floor ? 'border-red-500 bg-red-50/40 text-red-900': 'border-slate-300'
                    }`}
                    placeholder="VD: 1, 2, 3..."
                    required
                  />
                  {editErrors.floor && (
                    <span className="text-[11px] text-red-600 font-medium flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {editErrors.floor}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Diện tích m² (&gt; 0) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={editArea}
                    onChange={(e) => {
                      setEditArea(e.target.value === '' ? '': Number(e.target.value));
                      if (editErrors.area) setEditErrors(prev => ({...prev, area: undefined }));
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none ${
                      editErrors.area ? 'border-red-500 bg-red-50/40 text-red-900': 'border-slate-300'
                    }`}
                    placeholder="VD: 25, 30..."
                    required
                  />
                  {editErrors.area && (
                    <span className="text-[11px] text-red-600 font-medium flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {editErrors.area}
                    </span>
                  )}
                </div>
              </div>

              {/* Bước 2: Sửa Ghi chú */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">
                    Ghi chú </label>
                  <span className={`text-[10px] font-mono ${
                    String(editNote).length > 500 ? 'text-red-600 font-bold': 'text-slate-400'
                  }`}>
                    {String(editNote).length}/500 ký tự </span>
                </div>
                <textarea
                  value={editNote}
                  onChange={(e) => {
                    setEditNote(e.target.value);
                    if (editErrors.note) setEditErrors(prev => ({...prev, note: undefined }));
                  }}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none ${
                    editErrors.note || String(editNote).length > 500 ? 'border-red-500 bg-red-50/40 text-red-900': 'border-slate-300'
                  }`}
                  placeholder="Ghi chú về vị trí, hiện trạng, ban công, tiện nghi..."
                />
                {editErrors.note && (
                  <span className="text-[11px] text-red-600 font-medium flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {editErrors.note}
                  </span>
                )}
              </div>

              {/* Thay đổi sẽ lưu vết theo */}
              {(editFloor !== selectedRoom.floor || editArea !== selectedRoom.area || (editNote.trim() !== (selectedRoom.note || '').trim())) && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px] space-y-1">
                  <span className="font-bold block flex items-center gap-1 text-amber-950">
                    <History className="w-3.5 h-3.5 text-amber-700" />
                    Thay đổi sẽ được lưu vết vào lịch sử: </span>
                  {editFloor !== selectedRoom.floor && (
                    <div>• Tầng: <strong>Tầng {selectedRoom.floor}</strong> → <strong>Tầng {editFloor}</strong></div>
                  )}
                  {editArea !== selectedRoom.area && (
                    <div>• Diện tích: <strong>{selectedRoom.area} m²</strong> → <strong>{editArea} m²</strong></div>
                  )}
                  {(editNote.trim() !== (selectedRoom.note || '').trim()) && (
                    <div>• Ghi chú: <em>"{selectedRoom.note || '(Trống)'}"</em> → <em>"{editNote.trim() || '(Trống)'}"</em></div>
                  )}
                </div>
              )}

              {/* Footer buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                {/* Trường hợp 01 – Hủy thao tác */}
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium cursor-pointer transition-colors"
                >
                  Hủy thao tác </button>
                {/* Bước 3: User chọn Lưu */}
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold cursor-pointer shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Lưu thay đổi phòng </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== 4. LIÊN KẾT: XEM HỢP ĐỒNG ==================== */}
      {showContractModal && selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Hồ sơ Hợp đồng thuê phòng {selectedRoom.roomCode}</h3>
              </div>
              <button onClick={() => setShowContractModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Mã hợp đồng:</span>
                <span className="font-mono font-bold text-slate-900">{selectedRoom.currentContractId || 'HD-' + selectedRoom.roomCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bên thuê (Khách thuê):</span>
                <span className="font-semibold text-slate-800">{selectedRoom.currentTenantName || 'Chưa có'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ngày bắt đầu thuê:</span>
                <span className="font-mono">{selectedRoom.contractStartDate || '2026-09-01'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Hạn kết thúc hợp đồng:</span>
                <span className="font-mono font-semibold text-indigo-700">{selectedRoom.contractEndDate || '2027-03-01'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nhãn thời hạn theo </span>
                <span className="font-bold text-emerald-700">{getExpiryBadge(selectedRoom.contractEndDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Giá thuê mỗi tháng:</span>
                <span className="font-mono font-bold text-slate-900">3.500.000 đ/tháng</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tiền cọc cam kết:</span>
                <span className="font-mono font-bold text-slate-900">3.500.000 đ (1 tháng)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Chu kỳ thanh toán:</span>
                <span>Thu định kỳ từ ngày 25 đến 30 hàng tháng</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500">Hiệu lực văn bản:</span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Bản giấy đã ký đầy đủ hai bên </span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowContractModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold cursor-pointer"
              >
                Đóng </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 4. LIÊN KẾT: XEM HỒ SƠ KHÁCH THUÊ ==================== */}
      {showTenantModal && selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Hồ sơ Khách thuê: {selectedRoom.currentTenantName || selectedRoom.roomCode}</h3>
              </div>
              <button onClick={() => setShowTenantModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Họ và tên khách thuê:</span>
                <span className="font-bold text-slate-900">{selectedRoom.currentTenantName || 'Chưa ghi nhận'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số CCCD/CMND:</span>
                <span className="font-mono font-semibold text-slate-800">
                  {relatedTenant?.idNumber || '001201018899'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số điện thoại liên hệ:</span>
                <span className="font-mono text-blue-700 font-semibold">
                  {relatedTenant?.phoneNumber || '0988 123 456'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Địa chỉ thường trú:</span>
                <span>{relatedTenant?.address || 'TP. Hà Nội'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tình trạng đăng ký tạm trú:</span>
                <span className="font-semibold text-emerald-700">Đã khai báo với Công an phường</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tổng số người ở tại phòng:</span>
                <span className="font-bold text-slate-900 font-mono">{selectedRoom.totalOccupants} người</span>
              </div>

              {/* Danh sách người ở cùng nếu có */}
              {relatedCoTenants.length > 0 && (
                <div className="pt-2 border-t border-slate-200 space-y-1.5">
                  <span className="font-semibold text-slate-700 block text-[11px]">Người ở ghép / người ở cùng:</span>
                  {relatedCoTenants.map(ct => (
                    <div key={ct.id} className="p-2 bg-white rounded border border-slate-200 flex justify-between">
                      <span>{ct.fullName} (CCCD: {ct.idNumber || '001201018898'})</span>
                      <span className="font-semibold text-blue-700">{ct.relationship}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowTenantModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold cursor-pointer"
              >
                Đóng </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 4. LIÊN KẾT: XEM BÀN GIAO ==================== */}
      {showHandoverModal && selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Thông tin Bàn giao phòng {selectedRoom.roomCode}</h3>
              </div>
              <button onClick={() => setShowHandoverModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Mã biên bản bàn giao:</span>
                <span className="font-mono font-bold">{relatedHandover?.reportNumber || `BBBG-${selectedRoom.roomCode}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ngày bàn giao nhận phòng:</span>
                <span className="font-mono">{selectedRoom.contractStartDate || '2026-09-01'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Trạng thái chữ ký:</span>
                <span className="font-bold text-emerald-700">Đại diện Chủ nhà ĐÃ KÝ &amp; Khách thuê ĐÃ KÝ</span>
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-800 block mb-1.5 uppercase text-[11px]">
                Danh mục trang thiết bị &amp; tài sản bàn giao: </span>
              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                {[
                  { name: 'Điều hòa Daikin 9000 BTU Inverter', qty: '1 cái', status: 'Hoạt động tốt, nguyên tem bảo dưỡng' },
                  { name: 'Bình nóng lạnh Ferroli 20L', qty: '1 cái', status: 'Làm nóng nhanh, role an toàn chống giật' },
                  { name: 'Tủ lạnh mini Funiki 90L', qty: '1 cái', status: 'Làm đá tốt, đầy đủ khay ngăn' },
                  { name: 'Giường gỗ sồi 1.6m x 2m kèm đệm', qty: '1 bộ', status: 'Đệm mới sạch sẽ, dát giường chắc chắn' },
                  { name: 'Tủ quần áo 2 cánh gỗ MDF', qty: '1 cái', status: 'Đầy đủ bản lề và tay nắm' },
                  { name: 'Bàn ghế làm việc', qty: '1 bộ', status: 'Mặt gỗ khung sắt nguyên vẹn' },
                  { name: 'Thiết bị vệ sinh & vòi sen Inax', qty: '1 bộ', status: 'Sạch sẽ, cấp thoát nước hoạt động tốt' },
                  { name: 'Chìa khóa phòng & thẻ từ cổng', qty: '2 bộ', status: 'Đã giao đủ 2 chìa cơ + 2 thẻ từ ra vào' }
                ].map((item, i) => (
                  <div key={i} className="p-2 bg-slate-50 border border-slate-200 rounded flex justify-between items-center text-[11px]">
                    <div>
                      <span className="font-semibold text-slate-800">{item.name}</span>
                      <span className="text-slate-500 block text-[10px]">{item.status}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0">
                      {item.qty}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowHandoverModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold cursor-pointer"
              >
                Đóng </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 4. LIÊN KẾT: XEM THÔNG TIN CỌC ==================== */}
      {showDepositModal && selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Thông tin Cọc &amp; Quyết toán cọc: {selectedRoom.roomCode}</h3>
              </div>
              <button onClick={() => setShowDepositModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Phòng:</span>
                <span className="font-bold text-slate-900">{selectedRoom.roomCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Khách thuê:</span>
                <span className="font-semibold text-slate-800">{selectedRoom.currentTenantName || 'Chưa ghi nhận'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Trạng thái khoản cọc:</span>
                <span className={`font-bold ${selectedRoom.hasDeposit ? 'text-emerald-700': 'text-slate-400'}`}>
                  {selectedRoom.hasDeposit ? 'Đã thu cọc bảo đảm hợp đồng': 'Chưa thu cọc'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số tiền cọc gốc theo hợp đồng:</span>
                <span className="font-mono font-bold text-blue-700 text-sm">3.500.000 đ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phương thức lưu giữ:</span>
                <span>Tài khoản ngân hàng quản lý chung cư mini (MB Bank)</span>
              </div>

              {relatedSettlement && (
                <div className="pt-2 border-t border-slate-200 space-y-1.5">
                  <div className="flex justify-between text-amber-900 font-semibold">
                    <span>Phiếu quyết toán cọc liên quan:</span>
                    <span className="font-mono">{relatedSettlement.id}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span>Trạng thái quyết toán:</span>
                    <span className="font-bold text-blue-700">{relatedSettlement.status}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span>Số tiền hoàn trả thực tế:</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {relatedSettlement.calculatedResult.toLocaleString('vi-VN')} đ </span>
                  </div>
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-500">
              * Lưu ý: Tiền cọc được theo dõi độc lập với tiền thuê kỳ đầu tại mục Quyết toán cọc, không gộp hai khoản. </p>

            <div className="flex justify-end">
              <button
                onClick={() => setShowDepositModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold cursor-pointer"
              >
                Đóng </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ADD ROOM MODAL () ==================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Thêm phòng mới </h3>
                  <p className="text-[11px] text-slate-500">Khởi tạo phòng mới vào danh mục hệ thống</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                title="Hủy thao tác"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thông báo nếu phiên hết hạn hoặc lỗi vai trò */}
            {addErrors.general && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold block">Lỗi </span>
                  <span>{addErrors.general}</span>
                </div>
              </div>
            )}

            
            <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-900 text-[11px] space-y-0.5">
              <strong className="block text-blue-950 font-semibold">Lưu ý: </strong>
              <span>Phòng tạo mới khởi tạo trạng thái <strong>Trống</strong>; không tự có khách thuê, hợp đồng, cọc hoặc ngày dự kiến trả.</span>
            </div>

            <form onSubmit={handleAddRoomSubmit} className="space-y-3.5 text-xs">
              {/*.2: Nhập Mã phòng */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mã phòng <span className="text-red-500">*</span>
                  <span className="text-slate-400 font-normal ml-1">(Duy nhất, không đổi sau khi tạo)</span>
                </label>
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => {
                    setNewCode(e.target.value);
                    if (addErrors.roomCode) setAddErrors(prev => ({...prev, roomCode: undefined }));
                  }}
                  placeholder="Ví dụ: P.501, P.502..."
                  className={`w-full px-3 py-2 border rounded-lg font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none ${
                    addErrors.roomCode ? 'border-red-500 bg-red-50/40 text-red-900': 'border-slate-300'
                  }`}
                  required
                />
                {addErrors.roomCode && (
                  <span className="text-[11px] text-red-600 font-medium flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {addErrors.roomCode}
                  </span>
                )}
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  * Mã phòng tự động bỏ khoảng trắng đầu/cuối, phải duy nhất trong hệ thống. </span>
              </div>

              {/*.2: Nhập Tầng & Diện tích */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tầng (≥ 0) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={newFloor}
                    onChange={(e) => {
                      setNewFloor(e.target.value === '' ? '': Number(e.target.value));
                      if (addErrors.floor) setAddErrors(prev => ({...prev, floor: undefined }));
                    }}
                    placeholder="VD: 1, 2..."
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none ${
                      addErrors.floor ? 'border-red-500 bg-red-50/40 text-red-900': 'border-slate-300'
                    }`}
                    required
                  />
                  {addErrors.floor && (
                    <span className="text-[11px] text-red-600 font-medium flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {addErrors.floor}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Diện tích m² (&gt; 0) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={newArea}
                    onChange={(e) => {
                      setNewArea(e.target.value === '' ? '': Number(e.target.value));
                      if (addErrors.area) setAddErrors(prev => ({...prev, area: undefined }));
                    }}
                    placeholder="VD: 25, 30..."
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none ${
                      addErrors.area ? 'border-red-500 bg-red-50/40 text-red-900': 'border-slate-300'
                    }`}
                    required
                  />
                  {addErrors.area && (
                    <span className="text-[11px] text-red-600 font-medium flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {addErrors.area}
                    </span>
                  )}
                </div>
              </div>

              {/*.2: Nhập Ghi chú */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">
                    Ghi chú </label>
                  <span className={`text-[10px] font-mono ${
                    newNote.length > 500 ? 'text-red-600 font-bold': 'text-slate-400'
                  }`}>
                    {newNote.length}/500 ký tự </span>
                </div>
                <textarea
                  value={newNote}
                  onChange={(e) => {
                    setNewNote(e.target.value);
                    if (addErrors.note) setAddErrors(prev => ({...prev, note: undefined }));
                  }}
                  rows={2.5}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none ${
                    addErrors.note || newNote.length > 500 ? 'border-red-500 bg-red-50/40 text-red-900': 'border-slate-300'
                  }`}
                  placeholder="Ghi chú về tiện ích ban công, hướng cửa sổ, hiện trạng..."
                />
                {addErrors.note && (
                  <span className="text-[11px] text-red-600 font-medium flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {addErrors.note}
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                {/* Trường hợp 01 – Hủy thao tác */}
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium cursor-pointer transition-colors"
                >
                  Hủy thao tác </button>
                {/* Trường hợp 02, bước 3: Nhấn Lưu */}
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold cursor-pointer shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Lưu phòng mới </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== STANDALONE HISTORY MODAL ==================== */}
      {showHistoryModal && selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Lịch sử thay đổi thông tin phòng {selectedRoom.roomCode}</h3>
                  <p className="text-[11px] text-slate-500">Lưu vết thay đổi giá trị cũ/mới, người sửa và thời điểm theo </p>
                </div>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-blue-900 text-[11px]">
              <strong>Lưu ý:</strong> Tạo phòng phải lưu trọn vẹn; cập nhật phòng và lưu vết thay đổi phải diễn ra cùng giao dịch. Ghi nhận chi tiết người sửa và mốc thời gian thực hiện. </div>

            {roomHistory.filter(h => h.roomCode === selectedRoom.roomCode).length === 0 ? (
              <p className="text-slate-400 italic text-center py-8">
                Chưa có lịch sử thay đổi phát sinh cho phòng này. </p>
            ): (
              <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-72 overflow-y-auto">
                <table className="w-full text-left divide-y divide-slate-200">
                  <thead className="bg-slate-50 font-semibold text-slate-600 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Thời điểm</th>
                      <th className="py-2.5 px-3">Người thực hiện</th>
                      <th className="py-2.5 px-3">Trường thay đổi</th>
                      <th className="py-2.5 px-3">Giá trị cũ</th>
                      <th className="py-2.5 px-3">Giá trị mới</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {roomHistory.filter(h => h.roomCode === selectedRoom.roomCode).map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-mono text-slate-600 whitespace-nowrap">
                            {log.changedAt.replace('T', ' ').substring(0, 19)}
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-800 whitespace-nowrap">
                            {log.changedBy}
                          </td>
                          <td className="py-2 px-3 font-bold text-blue-700 whitespace-nowrap">
                            {log.field}
                          </td>
                          <td className="py-2 px-3 text-slate-500 whitespace-nowrap">
                            {log.oldValue}
                          </td>
                          <td className="py-2 px-3 font-medium text-emerald-700 whitespace-nowrap">
                            {log.newValue}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold cursor-pointer"
              >
                Đóng </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== CHECK RENTABLE MODAL () ==================== */}
      {showCheckRentableModal && (checkRentableRoom || selectedRoom) && (() => {
        const targetRoom = checkRentableRoom || selectedRoom!;
        
        // Bước 2: Hệ thống kiểm tra trạng thái sử dụng, lần thuê hiện tại và dữ liệu hợp đồng liên quan
        const pendingContract = contracts.find(
          c => c.roomCode === targetRoom.roomCode && (c.status === 'Đã ký' || c.status === 'Chờ hiệu lực')
        );
        const activeContract = contracts.find(
          c => c.roomCode === targetRoom.roomCode && c.status === 'Hiệu lực'
        ) || (targetRoom.currentContractId ? contracts.find(c => c.id === targetRoom.currentContractId): undefined);

        const pastReturnInspection = returnInspections.find(
          ri => ri.roomCode === targetRoom.roomCode && (ri.step304Status === 'Đã nhận lại' || ri.step305Confirmed)
        );

        const expBadge = getExpiryBadge(targetRoom.contractEndDate);
        const daysRem = getDaysRemainingOrOverdue(targetRoom.expectedReturnDate);

        // Kiểm tra phiên làm việc & vai trò (Điều kiện trước 1)
        const isSessionValid = Boolean(currentUser && currentSession && currentSession.expiresAt > Date.now());
        const hasManagerRole = Boolean(currentUser && (currentUser.role === 'Quản lý/Chủ nhà'));

        // Xác định phân loại luồng
        const isCase01 = targetRoom.status === 'Đang thuê' || targetRoom.status === 'Sắp trả';
        const isCase02 = targetRoom.status === 'Trống' && Boolean(pendingContract);
        const isCase03 = targetRoom.status === 'Trống' && !pendingContract;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden text-xs">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800">
                        
                      </span>
                      <h3 className="font-bold text-slate-900 text-base">
                        Kiểm tra khả năng cho thuê phòng: <span className="font-mono text-indigo-700">{targetRoom.roomCode}</span>
                      </h3>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Độ ưu tiên: Must · Tác nhân chính: User có role Quản lý/Chủ nhà </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCheckRentableModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-4">
                {/* 1. Kiểm tra Điều kiện trước & Phiên làm việc */}
                {(!isSessionValid || !hasManagerRole) ? (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold">Lỗi / Điều kiện trước không thỏa:</strong>
                      <span>
                        {!isSessionValid
                          ? 'Phiên làm việc đã hết hiệu lực. Yêu cầu đăng nhập lại để thực hiện kiểm tra.': 'Chức năng chỉ dành cho User có vai trò Quản lý hoặc Chủ nhà.'}
                      </span>
                    </div>
                  </div>
                ): (
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>
                        Người thực hiện: <strong className="text-slate-900">{currentUser?.fullName}</strong> ({currentUser?.role}) · Phiên hợp lệ </span>
                    </div>
                    {/* Toggle mô phỏng Exception Flow */}
                    <label className="hidden flex items-center gap-1.5 text-slate-500 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={simulateEF01}
                        onChange={(e) => setSimulateEF01(e.target.checked)}
                        className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                      />
                      <span className="text-[10px] font-medium text-slate-600">Mô phỏng lỗi tải </span>
                    </label>
                  </div>
                )}

                {/* Exception Flow: - Không tải được trạng thái, hợp đồng hoặc bàn giao */}
                {simulateEF01 ? (
                  <div className="p-4 bg-red-50 border-2 border-red-300 rounded-xl space-y-2 text-red-900 animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                      <strong className="text-sm font-bold">Lỗi tải dữ liệu đối chiếu phòng {targetRoom.roomCode}</strong>
                    </div>
                    <p className="text-xs leading-relaxed">
                      Không thể truy xuất dữ liệu trạng thái sử dụng, danh sách hợp đồng hoặc biên bản bàn giao phòng từ hệ thống máy chủ. </p>
                    <div className="p-2.5 bg-white/80 rounded-lg border border-red-200 text-[11px]">
                      <strong className="text-red-950 block mb-0.5">Yêu cầu nghiệp vụ </strong>
                      <span>
                        Nếu dữ liệu cần đối chiếu không truy xuất được: <strong>Không kết luận khả năng giới thiệu</strong> và <strong>không sửa dữ liệu</strong>. </span>
                    </div>
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => setSimulateEF01(false)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold cursor-pointer"
                      >
                        Khôi phục dữ liệu bình thường </button>
                    </div>
                  </div>
                ): (
                  <>
                    {/* Bước 2: Hệ thống kiểm tra trạng thái sử dụng, lần thuê hiện tại và dữ liệu hợp đồng liên quan */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          <Search className="w-3.5 h-3.5 text-blue-600" />
                           Dữ liệu hệ thống đối chiếu thực tế </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Phòng {targetRoom.roomCode} · Tầng {targetRoom.floor} · {targetRoom.area} m² </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        {/* 1. Trạng thái phòng & Lần thuê */}
                        <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500">Trạng thái phòng:</span>
                            <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                              targetRoom.status === 'Trống' ? 'bg-emerald-100 text-emerald-800':
                              targetRoom.status === 'Sắp trả' ? 'bg-amber-100 text-amber-800':
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {targetRoom.status === 'Sắp trả' ? 'Sắp trả phòng' : targetRoom.status}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Khách thuê hiện tại:</span>
                            <span className="font-semibold text-slate-800">
                              {targetRoom.currentTenantName || <span className="text-slate-400 italic">Chưa có</span>}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Mã lần thuê:</span>
                            <span className="font-mono text-slate-700">
                              {targetRoom.currentLeaseId || <span className="text-slate-400 italic">—</span>}
                            </span>
                          </div>
                        </div>

                        {/* 2. Hạn HĐ & Kế hoạch trả */}
                        <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1.5">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Hạn hợp đồng:</span>
                            <span className="font-mono font-semibold text-slate-800">
                              {targetRoom.contractEndDate || <span className="text-slate-400 italic">—</span>}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Nhãn thời hạn:</span>
                            <span className="font-semibold text-slate-700">{expBadge}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Ngày dự kiến trả:</span>
                            <span className="font-mono text-amber-700 font-semibold">
                              {targetRoom.expectedReturnDate || <span className="text-slate-400 italic">Chưa có</span>}
                              {daysRem && ` (${daysRem.text})`}
                            </span>
                          </div>
                        </div>

                        {/* 3. Hợp đồng đã ký chờ giao phòng */}
                        <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1 sm:col-span-2">
                          <span className="text-slate-500 block text-[11px] font-semibold">Hợp đồng đã ký chờ giao (nếu có):</span>
                          {pendingContract ? (
                            <div className="p-2 bg-rose-50 border border-rose-200 rounded text-rose-950 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <div>
                                <span className="font-bold">{pendingContract.id}</span> - Khách: <strong className="font-semibold">{pendingContract.tenantName}</strong> (Ngày bắt đầu: {pendingContract.startDate}) <span className="block text-[10px] text-rose-700">Trạng thái HĐ: {pendingContract.status} · Cọc gốc: {pendingContract.depositAmount.toLocaleString('vi-VN')} đ (Đã ký văn bản)</span>
                              </div>
                              <span className="px-2 py-0.5 rounded bg-rose-200 text-rose-800 font-bold text-[10px] self-start sm:self-auto shrink-0">
                                Đã ký chờ giao </span>
                            </div>
                          ): (
                            <span className="text-slate-400 italic block">Không có hợp đồng đã ký chờ giao phòng cho khách khác.</span>
                          )}
                        </div>

                        {/* 4. Biên bản bàn giao nhận lại phòng thực tế */}
                        <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1 sm:col-span-2">
                          <span className="text-slate-500 block text-[11px] font-semibold">Biên bản nhận lại phòng thực tế (lần thuê cũ):</span>
                          {pastReturnInspection ? (
                            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <div>
                                <span className="font-bold">Biên bản kiểm tra {pastReturnInspection.id}</span> (Lần thuê: {pastReturnInspection.leaseId}) <span className="block text-[10px] text-emerald-800">
                                  Ngày kiểm tra: {pastReturnInspection.inspectionDate} · Kết quả: {pastReturnInspection.step304Status} · Chủ nhà xác nhận xác nhận của chủ nhà: {pastReturnInspection.step305Confirmed ? 'Đã xác nhận': 'Chưa'}
                                </span>
                              </div>
                              <span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 font-bold text-[10px] self-start sm:self-auto shrink-0">
                                Đã nhận lại thực tế </span>
                            </div>
                          ): (
                            <span className="text-slate-400 italic block">
                              {targetRoom.status === 'Trống' ? 'Phòng trống ban đầu, chưa phát sinh lần thuê trước cần bàn giao lại.': 'Chưa thực hiện nhận lại phòng thực tế (phòng đang trong thời gian thuê).'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bước 3: Hệ thống hiển thị kết quả Có thể cho thuê hoặc Chưa thể cho thuê và nêu lý do */}
                    {/* TRƯỜNG HỢP 01: Phòng Đang thuê hoặc Sắp trả */}
                    {isCase01 && (
                      <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-amber-700 shrink-0" />
                            <div>
                              <span className="text-[10px] font-mono uppercase font-bold text-amber-800 block">
                                Alternative Flow – </span>
                              <h4 className="text-sm font-bold text-amber-950">
                                Kết luận: Chưa phù hợp (Chưa thể cho thuê) </h4>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-md bg-amber-200 text-amber-900 font-bold text-xs">
                            Chưa phù hợp </span>
                        </div>

                        <div className="p-3 bg-white/90 rounded-lg border border-amber-200 space-y-1.5 text-amber-950">
                          <strong className="block font-semibold">Lý do chi tiết:</strong>
                          <p className="leading-relaxed">
                            Phòng <strong>{targetRoom.roomCode}</strong> đang ở trạng thái <strong>{targetRoom.status === 'Sắp trả' ? 'Sắp trả phòng' : targetRoom.status}</strong> (Khách thuê: <strong>{targetRoom.currentTenantName || 'Chưa ghi nhận'}</strong>, Hợp đồng: {targetRoom.currentContractId || 'Đang hiệu lực'}). </p>
                          <p className="leading-relaxed text-amber-900">
                            <strong>Căn cứ </strong> Kể cả phòng đã có ngày dự kiến trả ({targetRoom.expectedReturnDate || 'chưa ghi nhận'}), trạng thái Sắp trả phòng hay việc hết hạn hợp đồng ({expBadge}) đều <strong>không thay thế kết quả nhận lại phòng thực tế</strong>. </p>
                          <p className="text-[11px] text-slate-600 italic pt-1 border-t border-amber-100">
                            * Lưu ý: Có kế hoạch trả có thể đồng thời Đang thuê, nhưng khách thuê hiện tại vẫn có quyền cư trú hợp pháp cho đến khi hoàn tất nhận lại phòng thực tế tại. </p>
                        </div>
                      </div>
                    )}

                    {/* TRƯỜNG HỢP 02: Phòng Trống nhưng có hợp đồng đã ký chờ giao */}
                    {isCase02 && pendingContract && (
                      <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0" />
                            <div>
                              <span className="text-[10px] font-mono uppercase font-bold text-rose-800 block">
                                Alternative Flow – </span>
                              <h4 className="text-sm font-bold text-rose-950">
                                Kết luận: Chưa phù hợp; không cho giới thiệu cho người khác </h4>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-md bg-rose-200 text-rose-900 font-bold text-xs">
                            Chưa phù hợp (Cấm giới thiệu) </span>
                        </div>

                        <div className="p-3 bg-white/90 rounded-lg border border-rose-200 space-y-1.5 text-rose-950">
                          <strong className="block font-semibold">Lý do chi tiết:</strong>
                          <p className="leading-relaxed">
                            Phòng <strong>{targetRoom.roomCode}</strong> hiện đang Trống nhưng <strong>đã có hợp đồng đã ký ({pendingContract.id})</strong> cam kết giao phòng cho khách <strong>{pendingContract.tenantName}</strong> vào ngày <strong>{pendingContract.startDate}</strong> (đã nộp cọc bảo đảm: {pendingContract.depositAmount.toLocaleString('vi-VN')} đ). </p>
                          <p className="leading-relaxed text-rose-900">
                            <strong>Căn cứ &amp; </strong> Chỉ kết luận Có thể giới thiệu khi phòng Trống và không có hợp đồng đã ký còn cam kết giao phòng cho khách khác. Hợp đồng đã ký không có chức năng hủy/ký lại trong phần mềm; không tự giải phóng phòng dựa trên đề nghị hủy. </p>
                          <div className="p-2 bg-rose-100/70 rounded border border-rose-300 text-rose-900 font-semibold text-[11px]">
                            ⛔ Nghiêm cấm giới thiệu hoặc tư vấn phòng này cho bất kỳ khách hàng nào khác! </div>
                        </div>
                      </div>
                    )}

                    {/* TRƯỜNG HỢP 03: Lần thuê cũ đã nhận lại thực tế và không có hợp đồng khác chờ giao */}
                    {isCase03 && (
                      <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            <div>
                              <span className="text-[10px] font-mono uppercase font-bold text-emerald-800 block">
                                Alternative Flow – </span>
                              <h4 className="text-sm font-bold text-emerald-950">
                                Kết luận: Có thể giới thiệu (Có thể cho thuê) </h4>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-md bg-emerald-200 text-emerald-900 font-bold text-xs">
                            Có thể giới thiệu </span>
                        </div>

                        <div className="p-3 bg-white/90 rounded-lg border border-emerald-200 space-y-1.5 text-emerald-950">
                          <strong className="block font-semibold">Lý do chi tiết:</strong>
                          <p className="leading-relaxed">
                            Phòng <strong>{targetRoom.roomCode}</strong> đang ở trạng thái <strong>Trống</strong> hoàn toàn. {pastReturnInspection ? (
                              <span> Lần thuê cũ ({pastReturnInspection.leaseId}) đã hoàn tất nhận lại phòng thực tế theo biên bản ngày {pastReturnInspection.inspectionDate} (Chủ nhà xác nhận xác nhận của chủ nhà).</span>
                            ): (
                              <span> Phòng sạch sẽ, trang thiết bị sẵn sàng đón khách thuê mới.</span>
                            )}
                          </p>
                          <p className="leading-relaxed text-emerald-900">
                            <strong>Căn cứ </strong> Hệ thống xác nhận phòng Trống và không có hợp đồng đã ký nào còn cam kết giao phòng cho khách khác. </p>
                          <div className="p-2 bg-emerald-100/70 rounded border border-emerald-300 text-emerald-900 font-semibold text-[11px]">
                            ✅ Phòng đủ điều kiện để Quản lý/Chủ nhà trao đổi, tư vấn và giới thiệu cho khách thuê mới. </div>
                        </div>
                      </div>
                    )}

                    {/* Bước 3: User có thể xem hồ sơ liên quan (Mở hồ sơ liên quan) */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                        Các hồ sơ liên quan để đối chiếu (Main Flow ): </span>
                      <div className="flex flex-wrap items-center gap-2">
                        {/* 1. Xem hợp đồng */}
                        {(activeContract || pendingContract || targetRoom.currentContractId) && (
                          <button
                            onClick={() => {
                              setSelectedRoom(targetRoom);
                              setShowContractModal(true);
                            }}
                            className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-blue-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                            Xem hợp đồng ({pendingContract ? pendingContract.id: (activeContract?.id || targetRoom.currentContractId)}) </button>
                        )}

                        {/* 2. Xem hồ sơ khách thuê */}
                        {(targetRoom.currentTenantName || pendingContract?.tenantName) && (
                          <button
                            onClick={() => {
                              setSelectedRoom(targetRoom);
                              setShowTenantModal(true);
                            }}
                            className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                          >
                            <UserCheck className="w-3.5 h-3.5 text-slate-600" />
                            Xem hồ sơ khách thuê ({targetRoom.currentTenantName || pendingContract?.tenantName}) </button>
                        )}

                        {/* 3. Xem bàn giao */}
                        <button
                          onClick={() => {
                            setSelectedRoom(targetRoom);
                            setShowHandoverModal(true);
                          }}
                          className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-emerald-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                        >
                          <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
                          Xem thông tin bàn giao </button>

                        {/* 4. Xem kế hoạch trả (mở, thẻ Kế hoạch trả) */}
                        {targetRoom.expectedReturnDate && (
                          <button
                            onClick={() => {
                              setShowCheckRentableModal(false);
                              setSelectedRoom(null);
                              setSubTab('plans');
                            }}
                            className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-amber-800 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5 text-amber-600" />
                            Xem kế hoạch trả (mở, thẻ Kế hoạch trả) </button>
                        )}

                        {/* 5. Xem thông tin cọc */}
                        {(targetRoom.hasDeposit || pendingContract) && (
                          <button
                            onClick={() => {
                              setSelectedRoom(targetRoom);
                              setShowDepositModal(true);
                            }}
                            className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-indigo-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                          >
                            <Scale className="w-3.5 h-3.5 text-indigo-600" />
                            Xem thông tin cọc </button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">: Kết quả dựa trên hồ sơ đang được ghi nhận. </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowCheckRentableModal(false)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Đóng </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ==================== 1.7. GHI NHẬN HOÀN TẤT TIỀN CỌC & THUÊ ĐẦU () ==================== */}
      {showPayment07Modal && selectedRoom && (() => {
        const targetContract = contracts.find(c => c.id === selectedRoom.currentContractId || c.roomCode === selectedRoom.roomCode);
        const isRenewal = targetContract?.contractType === 'Hợp đồng nối tiếp';
        const initialPayment = initialPaymentRecords.find(p => p.roomCode === selectedRoom.roomCode);
        const depositAmt = targetContract?.depositAmount || 3500000;
        const rentAmt = targetContract?.monthlyRent || 3500000;
        const totalReq = depositAmt + rentAmt;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-indigo-600" />
                  <div>
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800"></span>
                    <h3 className="font-bold text-slate-900 text-base">
                      Ghi nhận hoàn tất 1 tháng tiền cọc và 1 tháng tiền thuê đầu </h3>
                  </div>
                </div>
                <button
                  onClick={() => { setShowPayment07Modal(false); setPay07CorrectionMode(false); }}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Thông báo hợp đồng gia hạn (Trường hợp 04 / ) */}
              {isRenewal ? (
                <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl space-y-2 text-purple-950">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-700 shrink-0" />
                    <strong className="text-xs font-bold">Hợp đồng gia hạn: Chỉ xem, không thu lại</strong>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Hợp đồng nối tiếp <strong>{targetContract.id}</strong> thuộc chuỗi thuê liên tục của khách <strong>{targetContract.tenantName}</strong>. theo quy định, hợp đồng nối tiếp kế thừa mã cọc gốc ({targetContract.initialDepositCode || 'COC-GOC'}) từ hợp đồng lần đầu; không phát sinh thu một tháng tiền cọc và một tháng tiền thuê đầu mới. </p>
                  <div className="p-2.5 bg-white/80 rounded border border-purple-200 text-[11px] flex justify-between">
                    <span>Mã cọc gốc kế thừa:</span>
                    <span className="font-mono font-bold text-purple-900">{targetContract.initialDepositCode || 'COC-' + selectedRoom.roomCode + '-L1'}</span>
                  </div>
                </div>
              ): (
                <>
                  {/* Biểu mẫu Thanh toán ban đầu */}
                  <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl space-y-2 text-slate-700">
                    <div className="flex justify-between items-center text-blue-950 font-bold border-b border-blue-200/60 pb-1.5">
                      <span>Thông tin đối chiếu thanh toán:</span>
                      <span className="font-mono">Phòng: {selectedRoom.roomCode}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>Khách thuê: <strong className="text-slate-900">{selectedRoom.currentTenantName || targetContract?.tenantName || 'Chưa ghi nhận'}</strong></div>
                      <div>Hợp đồng: <strong className="font-mono text-slate-900">{targetContract?.id || selectedRoom.currentContractId || 'HĐ lần đầu'}</strong></div>
                      <div>Tiền cọc 1 tháng: <strong className="text-indigo-800">{depositAmt.toLocaleString('vi-VN')} đ</strong></div>
                      <div>Tiền thuê kỳ đầu 1 tháng: <strong className="text-blue-800">{rentAmt.toLocaleString('vi-VN')} đ</strong></div>
                      <div className="col-span-2 pt-1 border-t border-blue-200 flex justify-between text-xs font-bold text-blue-900">
                        <span>Tổng số tiền cần chuyển khoản:</span>
                        <span>{totalReq.toLocaleString('vi-VN')} đ</span>
                      </div>
                    </div>
                    {selectedRoom.status === 'Đang thuê' && selectedRoom.contractStartDate && (
                      <div className="text-[10px] text-emerald-800 bg-emerald-50 p-1.5 rounded border border-emerald-200">
                        * Đã nhận phòng ngày: <strong>{selectedRoom.contractStartDate}</strong> · Kỳ thuê đầu xác nhận: <strong>{selectedRoom.firstMonthPeriod || 'Từ ngày nhận đến hết kỳ'}</strong>
                      </div>
                    )}
                  </div>

                  {/* Chế độ đính chính thông tin chứng cứ */}
                  {pay07CorrectionMode ? (
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2.5 text-amber-950">
                      <div className="flex items-center justify-between">
                        <strong className="text-xs font-bold flex items-center gap-1.5">
                          <Edit3 className="w-4 h-4 text-amber-700" />
                          Đính chính thông tin chứng cứ chuyển khoản </strong>
                        <button
                          onClick={() => setPay07CorrectionMode(false)}
                          className="text-slate-500 hover:text-slate-700 text-[11px] underline cursor-pointer"
                        >
                          Quay lại </button>
                      </div>
                      <p className="text-[11px]">
                        Khi nhập nhầm chứng cứ, vui lòng ghi rõ lý do. Mọi thay đổi đều được lưu lịch sử; tiền cọc gốc không tự thay đổi. </p>
                      <div>
                        <label className="block font-semibold mb-1">Lý do đính chính <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          value={pay07CorrectionReason}
                          onChange={(e) => setPay07CorrectionReason(e.target.value)}
                          placeholder="Ví dụ: Nhập nhầm mã giao dịch ngân hàng do lỗi gõ..."
                          className="w-full px-2.5 py-1.5 border border-amber-300 rounded bg-white text-xs"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block font-semibold mb-1">Mã giao dịch đúng</label>
                          <input
                            type="text"
                            value={pay07Txn}
                            onChange={(e) => setPay07Txn(e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono text-xs"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">Tài khoản nhận đối chiếu</label>
                          <input
                            type="text"
                            value={pay07BankActual}
                            onChange={(e) => setPay07BankActual(e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => {
                            if (!pay07CorrectionReason.trim()) {
                              showToast('error', 'Vui lòng nhập lý do đính chính.');
                              return;
                            }
                            if (initialPayment) {
                              correctInitialPaymentPH07(initialPayment.id, pay07CorrectionReason, {
                                transactionCode: pay07Txn,
                                bankAccountReceived: pay07BankActual
                              });
                            }
                            setPay07CorrectionMode(false);
                            setPay07CorrectionReason('');
                            showToast('success', 'Đã lưu đính chính và ghi nhận lịch sử.');
                          }}
                          className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-semibold text-xs cursor-pointer"
                        >
                          Lưu đính chính chứng cứ </button>
                      </div>
                    </div>
                  ): (
                    /* Form nhập thông tin thanh toán bình thường */
                    <div className="space-y-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Phương thức thanh toán <span className="text-slate-400 font-normal">(Cố định theo quy định)</span>
                        </label>
                        <div className="px-3 py-1.5 bg-slate-100 rounded-lg text-slate-700 font-medium">
                          Chuyển khoản ngân hàng (Không tích hợp tiền mặt theo ) </div>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Tài khoản ngân hàng áp dụng </label>
                        <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium font-mono text-xs">
                          {activeBankAccount?.bankName || 'MB Bank'} · {activeBankAccount?.accountNumber || '0988123456'} ({activeBankAccount?.accountHolder || 'NGUYEN VAN AN'}) </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            Số tiền thực nhận (đ) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            value={pay07Amount}
                            onChange={(e) => setPay07Amount(Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-blue-700 text-xs"
                          />
                          {pay07Amount !== totalReq && (
                            <span className="text-[10px] text-red-600 font-medium block mt-0.5">
                              Số tiền không khớp {totalReq.toLocaleString('vi-VN')} đ </span>
                          )}
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            Ngày nhận tiền <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            value={pay07Date}
                            onChange={(e) => setPay07Date(e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            Mã giao dịch ngân hàng <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={pay07Txn}
                            onChange={(e) => setPay07Txn(e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-xs"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            Tài khoản thực nhận (đối chiếu) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={pay07BankActual}
                            onChange={(e) => setPay07BankActual(e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Lịch sử chứng từ đã ghi nhận cho phòng này */}
                  {initialPayment && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                      <div className="flex justify-between items-center text-[11px] font-bold text-slate-800">
                        <span>Chứng từ thanh toán ban đầu đã ghi nhận:</span>
                        <button
                          type="button"
                          onClick={() => setPay07CorrectionMode(true)}
                          className="text-blue-600 hover:text-blue-800 underline text-xs font-semibold cursor-pointer"
                        >
                          Đính chính chứng từ </button>
                      </div>
                      <div className="text-[11px] text-slate-600 space-y-0.5 font-mono">
                        <div>Mã GD: <strong>{initialPayment.transactionCode}</strong> · Ngày: {initialPayment.receivedDate}</div>
                        <div>Mã cọc gốc: <strong className="text-indigo-800">{initialPayment.depositCode}</strong> ({initialPayment.depositAmount.toLocaleString('vi-VN')} đ)</div>
                        <div>Kỳ thuê đầu: <strong className="text-blue-800">{initialPayment.firstMonthRentAmount.toLocaleString('vi-VN')} đ</strong> ({initialPayment.rentPeriodNote})</div>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPayment07Modal(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium cursor-pointer"
                >
                  Đóng </button>
                {!isRenewal && (
                  <button
                    type="button"
                    onClick={() => {
                      if (pay07Amount !== totalReq) {
                        showToast('error', `Số tiền thực nhận (${pay07Amount.toLocaleString('vi-VN')} đ) không khớp tổng 1 tháng cọc + 1 tháng tiền thuê (${totalReq.toLocaleString('vi-VN')} đ). Không xác nhận và không cho nhận phòng.`);
                        return;
                      }
                      const res = recordInitialPaymentPH07({
                        roomCode: selectedRoom.roomCode,
                        leaseId: selectedRoom.currentLeaseId || 'THUE-' + selectedRoom.roomCode,
                        contractId: selectedRoom.currentContractId || 'HD-' + selectedRoom.roomCode,
                        depositAmount: depositAmt,
                        firstMonthRentAmount: rentAmt,
                        actualAmount: pay07Amount,
                        receivedDate: pay07Date,
                        transactionCode: pay07Txn,
                        bankAccountReceived: pay07BankActual,
                        proofFile: pay07Proof
                      });
                      if (res.success) {
                        setShowPayment07Modal(false);
                        setSelectedRoom(rooms.find(r => r.roomCode === selectedRoom.roomCode) || null);
                        showToast('success', toUserMessage(res.message));
                      } else {
                        showToast('error', toUserMessage(res.message));
                      }
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold cursor-pointer shadow-xs"
                  >
                    Xác nhận đã thu đủ </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ==================== 1.5. KIỂM TRA ĐIỀU KIỆN NHẬN PHÒNG () ==================== */}
      {showCheckInModal && selectedRoom && (() => {
        const targetContract = contracts.find(c => c.id === selectedRoom.currentContractId || c.roomCode === selectedRoom.roomCode);
        const report = handoverReports.find(h => h.roomCode === selectedRoom.roomCode);

        // Đánh giá 4 tiêu chí riêng biệt: Đạt / Chưa đạt / Chưa xác minh
        const contractCriteria: 'Đạt' | 'Chưa đạt' | 'Chưa xác minh' =
          checkInSimulateEF01 ? 'Chưa xác minh':
          checkInSimulateEF02 ? 'Chưa đạt':
          (targetContract && (targetContract.status === 'Hiệu lực' || targetContract.status === 'Đã ký' || targetContract.isSignedPaper)) ? 'Đạt': 'Chưa đạt';

        const depositCriteria: 'Đạt' | 'Chưa đạt' | 'Chưa xác minh' =
          checkInSimulateEF01 ? 'Chưa xác minh':
          selectedRoom.hasDeposit ? 'Đạt': 'Chưa đạt';

        const rentCriteria: 'Đạt' | 'Chưa đạt' | 'Chưa xác minh' =
          checkInSimulateEF01 ? 'Chưa xác minh':
          selectedRoom.firstMonthRentPaid ? 'Đạt': 'Chưa đạt';

        const handoverCriteria: 'Đạt' | 'Chưa đạt' | 'Chưa xác minh' =
          checkInSimulateEF01 ? 'Chưa xác minh':
          (report && (report.status === 'Đã xác nhận' || report.tenantSignedPaper === 'Đã ký giấy') && checkInHandoverSigned) ? 'Đạt': 'Chưa đạt';

        const allFourPassed = contractCriteria === 'Đạt' && depositCriteria === 'Đạt' && rentCriteria === 'Đạt' && handoverCriteria === 'Đạt';
        const twoPaymentsPassed = depositCriteria === 'Đạt' && rentCriteria === 'Đạt';
        const personPassed = checkInPersonMatch === 'match';
        const canConfirmCheckIn = allFourPassed && personPassed;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-blue-600" />
                  <div>
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800"></span>
                    <h3 className="font-bold text-slate-900 text-base">
                      Kiểm tra điều kiện nhận phòng: <span className="font-mono text-blue-700">{selectedRoom.roomCode}</span>
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setShowCheckInModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Thông tin hồ sơ nguồn */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Mã phòng</span>
                  <strong className="font-mono text-slate-900 text-xs">{selectedRoom.roomCode}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Khách nhận</span>
                  <strong className="text-slate-900 text-xs">{selectedRoom.currentTenantName || targetContract?.tenantName || 'Chưa ghi nhận'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Hợp đồng & Lần thuê</span>
                  <strong className="font-mono text-slate-900 text-xs">{targetContract?.id || selectedRoom.currentContractId || '—'} ({selectedRoom.currentLeaseId || 'THUE-' + selectedRoom.roomCode})</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Trạng thái phòng</span>
                  <span className={`inline-block font-bold px-2 py-0.5 rounded text-[11px] ${
                    selectedRoom.status === 'Đang thuê' ? 'bg-blue-100 text-blue-800':
                    selectedRoom.status === 'Trống' ? 'bg-emerald-100 text-emerald-800':
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {selectedRoom.status === 'Sắp trả' ? 'Sắp trả phòng' : selectedRoom.status}
                  </span>
                </div>
              </div>

              {/* 5-Step Flow Stepper (Luồng chính Bước 1 -> Bước 5) */}
              <div className="p-3 bg-slate-100/80 rounded-xl border border-slate-200/80">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Tiến độ nhận phòng </div>
                <div className="grid grid-cols-5 gap-1.5 text-center">
                  <div className={`p-1.5 rounded-lg border transition-all ${
                    checkInStep >= 1 ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold': 'bg-white border-slate-200 text-slate-400'
                  }`}>
                    <span className="w-4 h-4 mx-auto mb-1 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">1</span>
                    <span className="text-[10px] leading-tight block">Mở tiếp nhận</span>
                  </div>
                  <div className={`p-1.5 rounded-lg border transition-all ${
                    checkInPreHandoverChecked ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold':
                    checkInStep === 2 ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold': 'bg-white border-slate-200 text-slate-400'
                  }`}>
                    <span className={`w-4 h-4 mx-auto mb-1 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      checkInPreHandoverChecked ? 'bg-emerald-600 text-white': 'bg-slate-300 text-slate-700'
                    }`}>2</span>
                    <span className="text-[10px] leading-tight block">Trước bàn giao</span>
                  </div>
                  <div className={`p-1.5 rounded-lg border transition-all ${
                    checkInHandoverSigned ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold': 'bg-white border-slate-200 text-slate-400'
                  }`}>
                    <span className={`w-4 h-4 mx-auto mb-1 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      checkInHandoverSigned ? 'bg-emerald-600 text-white': 'bg-slate-300 text-slate-700'
                    }`}>3</span>
                    <span className="text-[10px] leading-tight block">Bàn giao giấy</span>
                  </div>
                  <div className={`p-1.5 rounded-lg border transition-all ${
                    checkInPostHandoverChecked ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold':
                    checkInStep === 4 ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold': 'bg-white border-slate-200 text-slate-400'
                  }`}>
                    <span className={`w-4 h-4 mx-auto mb-1 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      checkInPostHandoverChecked ? 'bg-emerald-600 text-white': 'bg-slate-300 text-slate-700'
                    }`}>4</span>
                    <span className="text-[10px] leading-tight block">Đối chiếu sau BG</span>
                  </div>
                  <div className={`p-1.5 rounded-lg border transition-all ${
                    selectedRoom.status === 'Đang thuê' ? 'bg-blue-600 text-white font-bold border-blue-700':
                    allFourPassed ? 'bg-emerald-100 border-emerald-400 text-emerald-950 font-bold': 'bg-white border-slate-200 text-slate-400'
                  }`}>
                    <span className={`w-4 h-4 mx-auto mb-1 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      selectedRoom.status === 'Đang thuê' ? 'bg-white text-blue-700': 'bg-slate-300 text-slate-700'
                    }`}>5</span>
                    <span className="text-[10px] leading-tight block">Xác nhận Đang thuê</span>
                  </div>
                </div>
              </div>

              {/* Toggles mô phỏng kiểm thử ngoại lệ, */}
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
                <span className="hidden font-semibold text-slate-700">Mô phỏng kiểm thử ngoại lệ:</span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkInSimulateEF01}
                      onChange={(e) => setCheckInSimulateEF01(e.target.checked)}
                      className="rounded border-slate-300 text-amber-600"
                    />
                    <span>(Dữ liệu chưa xác minh)</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkInSimulateEF02}
                      onChange={(e) => setCheckInSimulateEF02(e.target.checked)}
                      className="rounded border-slate-300 text-red-600"
                    />
                    <span>(HĐ chưa có hiệu lực)</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkInHandoverSigned}
                      onChange={(e) => setCheckInHandoverSigned(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600"
                    />
                    <span>Biên bản nhận phòng đã ký tay 2 bên</span>
                  </label>
                </div>
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200">
                  <span className="font-semibold text-slate-700">Người đến nhận phòng:</span>
                  <select
                    value={checkInPersonMatch}
                    onChange={(e) => setCheckInPersonMatch(e.target.value as any)}
                    className="px-2.5 py-1 border border-slate-300 rounded bg-white text-xs font-medium"
                  >
                    <option value="match">Đúng khách thuê trong HĐ ({selectedRoom.currentTenantName || targetContract?.tenantName || 'Hợp lệ'})</option>
                    <option value="mismatch">Người khác không khớp HĐ / biên bản (Chặn nhận phòng)</option>
                  </select>
                </div>
              </div>

              {!personPassed && (
                <div className="p-3 bg-red-50 border border-red-300 rounded-xl text-red-900 text-xs">
                  <strong className="block font-bold">Người đến nhận không khớp hợp đồng hoặc biên bản:</strong>
                  <p className="text-[11px] mt-0.5">
                    Hệ thống không cho xác nhận. User phải làm rõ hoặc sửa ở hồ sơ có thẩm quyền trước khi bàn giao. </p>
                </div>
              )}

              {/* Thao tác Bước 2 & Bước 4 */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl">
                <span className="font-bold text-blue-950 text-xs">Thao tác kiểm tra theo thứ tự:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setCheckInPreHandoverChecked(true);
                      setCheckInStep(2);
                      if (contractCriteria === 'Đạt' && depositCriteria === 'Đạt' && rentCriteria === 'Đạt') {
                        showToast('success', "Kiểm tra trước bàn giao ĐẠT: HĐ có hiệu lực, 1 tháng cọc & 1 tháng thuê đầu đã thu đủ tại. Tiến hành bàn giao thực tế.");
                      } else {
                        showToast('error', "Kiểm tra trước bàn giao CHƯA ĐẠT: Không cho nhận phòng trước rồi nộp bổ sung. Vui lòng tra soát tại /.");
                      }
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs cursor-pointer shadow-xs flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                     Kiểm tra trước bàn giao </button>
                  <button
                    onClick={() => {
                      setCheckInPostHandoverChecked(true);
                      setCheckInStep(4);
                      if (allFourPassed) {
                        showToast('success', "Đối chiếu sau bàn giao ĐẠT: Cả 4 tiêu chí đều Đạt, số điện nước ban đầu và chữ ký 2 bên đã hợp lệ. Sẵn sàng xác nhận nhận phòng.");
                      } else {
                        showToast('error', 'Đối chiếu sau bàn giao: Còn tiêu chí Chưa đạt hoặc Chưa xác minh. Vui lòng kiểm tra chi tiết bên dưới.');
                      }
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs cursor-pointer shadow-xs flex items-center gap-1"
                  >
                    <FileCheck2 className="w-3.5 h-3.5" />
                     Đối chiếu sau bàn giao </button>
                </div>
              </div>

              {/* Bốn tiêu chí với 3 kết quả riêng Đạt / Chưa đạt / Chưa xác minh */}
              <div className="space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                  Bảng đối chiếu 4 tiêu chí bắt buộc: </span>

                {/* Tiêu chí 1: Hợp đồng đã ký & đang có hiệu lực */}
                <div className={`p-3 rounded-xl border transition-all ${
                  contractCriteria === 'Đạt' ? 'bg-emerald-50/70 border-emerald-300':
                  contractCriteria === 'Chưa xác minh' ? 'bg-amber-50/70 border-amber-300':
                  'bg-red-50/70 border-red-300'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <span>1. Hợp đồng đã ký và đang có hiệu lực pháp lý</span>
                      </div>
                      <span className="text-[11px] text-slate-600 block mt-0.5">
                        Căn cứ: Hợp đồng <strong>{targetContract?.id || 'Chưa lập'}</strong> ({targetContract?.status || 'Chưa ký'}) · Ngày ký: {targetContract?.signedDate || 'Chưa ký'}
                      </span>
                      {contractCriteria !== 'Đạt' && (
                        <span className="text-[10px] text-red-700 font-semibold block mt-0.5">
                          Lý do: Hợp đồng chưa được ký hợp lệ hoặc chưa có hiệu lực. </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setShowCheckInModal(false); setShowContractModal(true); }}
                        className="px-2 py-1 bg-white hover:bg-slate-100 text-blue-700 rounded border border-blue-200 text-xs font-semibold cursor-pointer"
                      >
                        Xem HĐ </button>
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                        contractCriteria === 'Đạt' ? 'bg-emerald-200 text-emerald-900':
                        contractCriteria === 'Chưa xác minh' ? 'bg-amber-200 text-amber-900':
                        'bg-red-200 text-red-900'
                      }`}>
                        {contractCriteria}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tiêu chí 2: Cọc một tháng thu đủ đúng hợp đồng () */}
                <div className={`p-3 rounded-xl border transition-all ${
                  depositCriteria === 'Đạt' ? 'bg-emerald-50/70 border-emerald-300':
                  depositCriteria === 'Chưa xác minh' ? 'bg-amber-50/70 border-amber-300':
                  'bg-red-50/70 border-red-300'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <span>Cọc một tháng thu đủ đúng hợp đồng</span>
                      </div>
                      <span className="text-[11px] text-slate-600 block mt-0.5">
                        Số tiền cọc: <strong className="font-mono text-indigo-900">{targetContract?.depositAmount.toLocaleString('vi-VN') || '3.500.000'} đ</strong> · Ghi nhận độc lập theo mã cọc gốc {targetContract?.initialDepositCode || 'COC-' + selectedRoom.roomCode + '-L1'}
                      </span>
                      {depositCriteria !== 'Đạt' && (
                        <span className="text-[10px] text-red-700 font-semibold block mt-0.5">
                          Lý do: Chưa xác nhận thực nhận tiền cọc vào tài khoản ngân hàng tại. </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setShowCheckInModal(false); setShowPayment07Modal(true); }}
                        className="px-2 py-1 bg-white hover:bg-slate-100 text-indigo-700 rounded border border-indigo-200 text-xs font-semibold cursor-pointer"
                      >
                        Tra soát </button>
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                        depositCriteria === 'Đạt' ? 'bg-emerald-200 text-emerald-900':
                        depositCriteria === 'Chưa xác minh' ? 'bg-amber-200 text-amber-900':
                        'bg-red-200 text-red-900'
                      }`}>
                        {depositCriteria}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tiêu chí 3: Tiền thuê kỳ đầu một tháng đã trả trước đúng kỳ () */}
                <div className={`p-3 rounded-xl border transition-all ${
                  rentCriteria === 'Đạt' ? 'bg-emerald-50/70 border-emerald-300':
                  rentCriteria === 'Chưa xác minh' ? 'bg-amber-50/70 border-amber-300':
                  'bg-red-50/70 border-red-300'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <span>3. Tiền thuê kỳ đầu một tháng đã trả trước đúng kỳ </span>
                      </div>
                      <span className="text-[11px] text-slate-600 block mt-0.5">
                        Số tiền thuê đầu: <strong className="font-mono text-blue-900">{targetContract?.monthlyRent.toLocaleString('vi-VN') || '3.500.000'} đ</strong> · Kỳ thuê: {selectedRoom.firstMonthPeriod || 'Kỳ đầu'}
                      </span>
                      {rentCriteria !== 'Đạt' && (
                        <span className="text-[10px] text-red-700 font-semibold block mt-0.5">
                          Lý do: Tiền thuê kỳ đầu chưa được đối soát thanh toán chuyển khoản đủ tại. </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setShowCheckInModal(false); setShowPayment07Modal(true); }}
                        className="px-2 py-1 bg-white hover:bg-slate-100 text-blue-700 rounded border border-blue-200 text-xs font-semibold cursor-pointer"
                      >
                        Tra soát </button>
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                        rentCriteria === 'Đạt' ? 'bg-emerald-200 text-emerald-900':
                        rentCriteria === 'Chưa xác minh' ? 'bg-amber-200 text-amber-900':
                        'bg-red-200 text-red-900'
                      }`}>
                        {rentCriteria}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tiêu chí 4: Bàn giao nhận thực tế hoàn tất & Biên bản nhận phòng Đã xác nhận */}
                <div className={`p-3 rounded-xl border transition-all ${
                  handoverCriteria === 'Đạt' ? 'bg-emerald-50/70 border-emerald-300':
                  handoverCriteria === 'Chưa xác minh' ? 'bg-amber-50/70 border-amber-300':
                  'bg-red-50/70 border-red-300'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <span>4. Bàn giao nhận thực tế hoàn tất &amp; Biên bản nhận phòng Đã xác nhận</span>
                      </div>
                      <span className="text-[11px] text-slate-600 block mt-0.5">
                        Biên bản {report?.reportNumber || 'BB-BG03'} ({report?.status || 'Bản nháp'}) · Khách ký: <strong>{report?.tenantSignedPaper || (checkInHandoverSigned ? 'Đã ký giấy': 'Chưa ký')}</strong> · Chủ nhà ký: <strong>{report?.ownerSignedPaper || (checkInHandoverSigned ? 'Đã ký giấy': 'Chưa ký')}</strong>
                      </span>
                      {handoverCriteria !== 'Đạt' && (
                        <span className="text-[10px] text-red-700 font-semibold block mt-0.5">
                          Lý do: Hai bên chưa ký tay đầy đủ vào biên bản giấy hoặc chưa xác nhận Biên bản nhận phòng. </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setShowCheckInModal(false); setShowHandoverModal(true); }}
                        className="px-2 py-1 bg-white hover:bg-slate-100 text-emerald-700 rounded border border-emerald-200 text-xs font-semibold cursor-pointer"
                      >
                        Ký giấy Biên bản nhận phòng </button>
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                        handoverCriteria === 'Đạt' ? 'bg-emerald-200 text-emerald-900':
                        handoverCriteria === 'Chưa xác minh' ? 'bg-amber-200 text-amber-900':
                        'bg-red-200 text-red-900'
                      }`}>
                        {handoverCriteria}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Điều hướng thông minh theo  */}
              {!allFourPassed && (
                <div className="p-3.5 rounded-xl border space-y-2 text-xs">
                  {twoPaymentsPassed ? (
                    <div className="bg-orange-50/90 p-3 rounded-lg border border-orange-200 text-orange-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <strong className="text-orange-950 font-bold block">Thiếu hiệu lực hợp đồng hoặc bàn giao:</strong>
                        <span className="block text-[11px] text-orange-900 mt-0.5">
                          Hai khoản cọc 1 tháng và tiền thuê đầu 1 tháng đã ĐẠT và liên kết đúng. Bạn có thể mở <strong></strong> để theo dõi phần điều kiện còn thiếu. </span>
                      </div>
                      <button
                        onClick={() => {
                          setShowCheckInModal(false);
                          setShowMissingConditionModal(true);
                        }}
                        className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold text-xs cursor-pointer shrink-0 shadow-xs"
                      >
                        Mở Ghi nhận còn thiếu → </button>
                    </div>
                  ): (
                    <div className="bg-red-50 p-3 rounded-lg border border-red-200 text-red-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <strong className="text-red-950 font-bold block">Chứng cứ thanh toán chưa Đạt / Chưa xác minh:</strong>
                        <span className="block text-[11px] text-red-900 mt-0.5">
                          Khóa chức năng nhận phòng và <strong>khóa </strong>. Bắt buộc tra soát tại <strong></strong>. Tuyệt đối không cho nhận phòng trước rồi nộp bổ sung! </span>
                      </div>
                      <button
                        onClick={() => {
                          setShowCheckInModal(false);
                          setShowPayment07Modal(true);
                        }}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs cursor-pointer shrink-0 shadow-xs"
                      >
                        Tra soát ngay → </button>
                    </div>
                  )}
                </div>
              )}

              {/* Form chọn ngày nhận thực tế khi cả 4 tiêu chí Đạt (Bước 5) */}
              {allFourPassed && selectedRoom.status !== 'Đang thuê' && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl space-y-2 text-emerald-950">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Cả 4 tiêu chí đã ĐẠT đồng thời! Sẵn sàng xác nhận nhận phòng hoàn tất.</span>
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    Hệ thống sẽ lưu ngày nhận phòng thực tế, chuyển phòng sang <strong>Đang thuê</strong>, cập nhật thời gian kỳ thuê đầu đã trả trước và cập nhật danh sách người ở cùng. </p>
                  <div className="flex items-center gap-2 pt-1 border-t border-emerald-200">
                    <span className="font-semibold text-xs">Ngày nhận phòng thực tế:</span>
                    <input
                      type="date"
                      value={checkInDate}
                      onChange={(e) => setCheckInDate(e.target.value)}
                      className="px-2.5 py-1.5 border border-emerald-300 rounded-lg bg-white font-mono text-xs font-bold text-emerald-900"
                    />
                  </div>
                </div>
              )}

              {/* Kết quả thành công nếu phòng đã Đang thuê */}
              {selectedRoom.status === 'Đang thuê' && (
                <div className="p-3.5 bg-blue-50 border border-blue-300 rounded-xl space-y-2 text-blue-950">
                  <div className="flex items-center gap-2 font-bold text-blue-900">
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                    <span>Kết quả nhận phòng thành công đã ghi nhận tại:</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-blue-200">
                    <div>Trạng thái phòng: <strong className="text-blue-900">Đang thuê </strong></div>
                    <div>Ngày nhận thực tế: <strong className="font-mono text-slate-900">{selectedRoom.contractStartDate || checkInDate}</strong></div>
                    <div>Mã sự kiện: <strong className="font-mono text-purple-900">{leaseStartEvents.find(e => e.roomCode === selectedRoom.roomCode)?.eventId || 'EVT-LS-' + selectedRoom.roomCode}</strong></div>
                    <div>Trạng thái cư trú: <strong className="text-emerald-800">Đã ghi nhận người ở cùng</strong></div>
                    <div className="col-span-2 text-slate-600">
                      * Kỳ thuê đầu: <strong>{selectedRoom.firstMonthPeriod || 'Đã trả trước tại '}</strong> (Không thu lại tiền thuê đầu). </div>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => { setShowCheckInModal(false); setShowContractModal(true); }}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-blue-700 rounded text-xs font-medium cursor-pointer"
                  >
                    Xem HĐ </button>
                  <button
                    onClick={() => { setShowCheckInModal(false); setShowPayment07Modal(true); }}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-indigo-700 rounded text-xs font-medium cursor-pointer"
                  >
                    Xem chứng cứ </button>
                  <button
                    onClick={() => { setShowCheckInModal(false); setShowHandoverModal(true); }}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-emerald-700 rounded text-xs font-medium cursor-pointer"
                  >
                    Xem biên bản </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowCheckInModal(false)}
                    className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-medium cursor-pointer"
                  >
                    Quay lại </button>
                  {selectedRoom.status !== 'Đang thuê' && (
                    <button
                      disabled={!canConfirmCheckIn}
                      onClick={() => {
                        if (!canConfirmCheckIn) return;
                        const res = confirmCheckInPH05(
                          selectedRoom.roomCode,
                          selectedRoom.currentLeaseId || 'THUE-' + selectedRoom.roomCode,
                          checkInDate,
                          report?.id,
                          'v1.0'
                        );
                        if (res.success) {
                          setShowCheckInModal(false);
                          setSelectedRoom(rooms.find(r => r.roomCode === selectedRoom.roomCode) || null);
                          showToast('success', toUserMessage(res.message));
                        } else {
                          showToast('error', toUserMessage(res.message));
                        }
                      }}
                      className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer shadow-xs ${
                        canConfirmCheckIn
                          ? 'bg-blue-600 hover:bg-blue-700 text-white': 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      Xác nhận nhận phòng hoàn tất </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ==================== 1.6. GHI NHẬN ĐIỀU KIỆN CÒN THIẾU () ==================== */}
      {showMissingConditionModal && selectedRoom && (() => {
        const targetContract = contracts.find(c => c.id === selectedRoom.currentContractId || c.roomCode === selectedRoom.roomCode);
        const report = handoverReports.find(h => h.roomCode === selectedRoom.roomCode);
        const twoPaymentsPassed = selectedRoom.hasDeposit && selectedRoom.firstMonthRentPaid;
        const roomLogs = missingConditionLogs.filter(m => m.roomCode === selectedRoom.roomCode);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <div>
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-800"></span>
                    <h3 className="font-bold text-slate-900 text-base">
                      Ghi nhận điều kiện còn thiếu: <span className="font-mono text-orange-700">{selectedRoom.roomCode}</span>
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setShowMissingConditionModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Kiểm tra điều kiện tiên quyết: 2 khoản tiền phải Đạt */}
              {!twoPaymentsPassed ? (
                <div className="p-4 bg-red-50 border-2 border-red-300 rounded-xl space-y-2 text-red-900">
                  <strong className="block font-bold">Khóa chức năng theo </strong>
                  <p className="text-xs leading-relaxed">
                    Chức năng chỉ được mở khi hai khoản tiền cọc 1 tháng và tiền thuê đầu 1 tháng đã được xác minh Đạt tại. Hiện tại phòng {selectedRoom.roomCode} chưa hoàn tất thu đủ. </p>
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => {
                        setShowMissingConditionModal(false);
                        setShowPayment07Modal(true);
                      }}
                      className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded font-semibold text-xs cursor-pointer"
                    >
                      Chuyển sang tra soát </button>
                  </div>
                </div>
              ): (
                <>
                  {/* Trạng thái chỉ đọc */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-[11px] text-slate-700">
                    <div className="flex justify-between">
                      <span>Hiệu lực hợp đồng:</span>
                      <strong className="text-slate-900">{targetContract?.status || 'Chưa ký'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Biên bản bàn giao Biên bản nhận phòng:</span>
                      <strong className="text-slate-900">{report?.status || 'Chưa bàn giao'}</strong>
                    </div>
                    <div className="flex justify-between text-emerald-800 font-semibold pt-1 border-t border-slate-200">
                      <span>Xác nhận thu đủ 1 tháng cọc + 1 tháng thuê đầu:</span>
                      <span>ĐÃ ĐẠT </span>
                    </div>
                  </div>

                  {/* Form Ghi nhận điều kiện còn thiếu hoặc khách dừng thủ tục */}
                  <div className="space-y-3">
                    <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer font-semibold text-amber-950">
                        <input
                          type="checkbox"
                          checked={missingIsStop}
                          onChange={(e) => setMissingIsStop(e.target.checked)}
                          className="rounded border-amber-300 text-amber-600"
                        />
                        <span>Khách chủ động dừng làm thủ tục thuê </span>
                      </label>

                      {missingIsStop && (
                        <div className="space-y-2 pt-1 border-t border-amber-200 text-xs">
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Lý do dừng</label>
                            <select
                              value={missingStopReason}
                              onChange={(e) => setMissingStopReason(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                            >
                              <option value="Chưa rõ lý do">Chưa rõ lý do</option>
                              <option value="Khách đổi kế hoạch công việc/chỗ ở">Khách đổi kế hoạch công việc/chỗ ở</option>
                              <option value="Khách không đồng ý hiện trạng bàn giao">Khách không đồng ý hiện trạng bàn giao</option>
                              <option value="Lý do cá nhân khác">Lý do cá nhân khác</option>
                            </select>
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Nội dung trao đổi thực tế</label>
                            <textarea
                              rows={2}
                              value={missingStopContent}
                              onChange={(e) => setMissingStopContent(e.target.value)}
                              placeholder="Chi tiết phản hồi khi khách dừng thủ tục..."
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                            />
                          </div>
                          <span className="text-[10px] text-amber-900 block">
                            * Căn cứ Ghi nhận sự kiện riêng, không tự hủy hợp đồng, không tự hoàn tiền hay đổi trạng thái phòng. </span>
                        </div>
                      )}
                    </div>

                    {!missingIsStop && (
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Nội dung ghi chú điều kiện còn thiếu <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          rows={3}
                          value={missingNotes}
                          onChange={(e) => setMissingNotes(e.target.value)}
                          placeholder="Ví dụ: Chờ khách bổ sung bản ký tay biên bản Biên bản nhận phòng, hẹn ngày 18/10 hoàn tất..."
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                        />
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          * Ghi chú không được để trống khi lưu điều kiện còn thiếu. </span>
                      </div>
                    )}
                  </div>

                  {/* Lịch sử ghi nhận điều kiện còn thiếu của phòng */}
                  {roomLogs.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <span className="font-semibold text-slate-700 block text-[11px]">Lịch sử ghi nhận trước đó:</span>
                      <div className="space-y-1 max-h-36 overflow-y-auto">
                        {roomLogs.map((log) => (
                          <div key={log.id} className="p-2 bg-slate-50 border border-slate-200 rounded text-[11px] space-y-0.5">
                            <div className="flex justify-between font-bold text-slate-800">
                              <span>Trạng thái: {log.status}</span>
                              <span className="font-mono text-slate-500 text-[10px]">{log.loggedAt.substring(0, 16).replace('T', ' ')}</span>
                            </div>
                            <p className="text-slate-600">{log.notes || log.tenantStopContent}</p>
                            <span className="text-[10px] text-slate-400 block">Người ghi: {log.loggedBy}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setShowMissingConditionModal(false);
                          (setActiveCheckInRoomCode(selectedRoom?.roomCode || ''), setCheckInStage(0), setSubTab('checkin'));
                        }}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-blue-700 rounded text-xs font-semibold cursor-pointer"
                      >
                        Kiểm tra lại </button>
                      <button
                        type="button"
                        onClick={() => { setShowMissingConditionModal(false); setShowContractModal(true); }}
                        className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium cursor-pointer"
                      >
                        Xem HĐ </button>
                      <button
                        type="button"
                        onClick={() => { setShowMissingConditionModal(false); setShowHandoverModal(true); }}
                        className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium cursor-pointer"
                      >
                        Xem bàn giao </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowMissingConditionModal(false)}
                        className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium cursor-pointer"
                      >
                        Hủy </button>
                      <button
                        type="button"
                        onClick={() => {
                          const res = saveMissingConditionPH06({
                            roomCode: selectedRoom.roomCode,
                            contractId: selectedRoom.currentContractId || 'HD-' + selectedRoom.roomCode,
                            leaseId: selectedRoom.currentLeaseId || 'THUE-' + selectedRoom.roomCode,
                            missingContractEffect: !targetContract || targetContract.status !== 'Hiệu lực',
                            missingHandover: !report || report.status !== 'Đã xác nhận',
                            notes: missingNotes,
                            isTenantStoppedProcedure: missingIsStop,
                            tenantStopReason: missingIsStop ? missingStopReason: undefined,
                            tenantStopContent: missingIsStop ? missingStopContent: undefined
                          });
                          if (res.success) {
                            setShowMissingConditionModal(false);
                            setMissingNotes('');
                            setMissingIsStop(false);
                            showToast('success', toUserMessage(res.message));
                          } else {
                            showToast('error', toUserMessage(res.message));
                          }
                        }}
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold cursor-pointer shadow-xs"
                      >
                        Lưu ghi nhận </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })()}

      {/* ==================== 1.8. KIỂM TRA KẾT QUẢ TRẢ PHÒNG () ==================== */}
      {showReturnModal && selectedRoom && (() => {
        const inspection = returnInspections.find(i => i.roomCode === selectedRoom.roomCode);
        
        // Mô phỏng kiểm thử
        const step304Val = returnSimulateEF01 ? 'Chưa nhận lại': (inspection?.step304Status || 'Đã nhận lại');
        const step305Val = returnSimulateEF01 ? false: (inspection?.step305Confirmed ?? true);
        const canVacate = step304Val === 'Đã nhận lại' && step305Val;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <PackageCheck className="w-5 h-5 text-emerald-600" />
                  <div>
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800"></span>
                    <h3 className="font-bold text-slate-900 text-base">
                      Kiểm tra kết quả trả phòng: <span className="font-mono text-emerald-700">{selectedRoom.roomCode}</span>
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setShowReturnModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Thông tin tra cứu */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-[11px] text-slate-700">
                <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
                  <span className="font-semibold">Hợp đồng &amp; lần thuê hiện hành:</span>
                  <strong className="font-mono text-slate-900 text-xs">
                    {selectedRoom.currentContractId || '—'} ({selectedRoom.currentLeaseId || 'THUE-' + selectedRoom.roomCode}) </strong>
                </div>
                <div className="flex justify-between items-center">
                  <span>Biên bản trả phòng:</span>
                  <div className="flex items-center gap-1.5">
                    <strong className="font-mono text-slate-900">{inspection?.id || 'BB-BG09-01'}</strong>
                    <button
                      type="button"
                      onClick={() => { setShowReturnModal(false); setShowHandoverModal(true); }}
                      className="text-blue-600 hover:text-blue-800 underline text-[10px] cursor-pointer"
                    >
                      (Xem hồ sơ bàn giao) </button>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                  <span className="font-semibold">Kết quả nhận lại thực tế tại biên bản kiểm tra:</span>
                  <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                    step304Val === 'Đã nhận lại' ? 'bg-emerald-100 text-emerald-800': 'bg-amber-100 text-amber-800'
                  }`}>
                    {step304Val}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Xác nhận độc lập của Chủ nhà tại chủ nhà xác nhận:</span>
                  <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                    step305Val ? 'bg-emerald-100 text-emerald-800': 'bg-red-100 text-red-800'
                  }`}>
                    {step305Val ? 'Đã xác nhận độc lập (Chủ nhà ký & có bằng chứng)': 'Chưa có xác nhận hợp lệ'}
                  </span>
                </div>
                {step305Val && inspection && (
                  <div className="p-2 bg-emerald-50 rounded-lg text-[10px] text-emerald-900 border border-emerald-200 space-y-0.5">
                    <div>Người xác nhận: <strong>{inspection.step305ConfirmedBy || 'Chủ nhà'}</strong> · Thời điểm: <strong>{inspection.step305ConfirmedAt?.substring(0, 16).replace('T', ' ') || 'Đã xác nhận'}</strong></div>
                    <div>Bằng chứng nghiệm thu: <em>{inspection.step305Evidence || 'Ảnh chụp hoàn trả chìa khóa & phòng sạch sẽ'}</em></div>
                  </div>
                )}
              </div>

              {/* Nút Bước 1: Kiểm tra kết quả bàn giao (luôn khả dụng theo ) */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between">
                <div>
                  <strong className="text-xs text-blue-950 block"> Tra cứu kết quả bàn giao </strong>
                  <span className="text-[11px] text-blue-800">
                    Hệ thống truy xuất dữ liệu độc lập tại biên bản kiểm tra và xác nhận xác nhận của chủ nhà của Chủ nhà. </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setReturnChecked(true);
                    showToast('success', `Đã tra cứu hồ sơ: kết quả nhận lại phòng = ${step304Val}, xác nhận của chủ nhà = ${step305Val ? 'Đã xác nhận': 'Chưa xác nhận'}.`);
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs cursor-pointer shadow-xs flex items-center gap-1 shrink-0"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  Kiểm tra kết quả bàn giao </button>
              </div>

              {/* Tình huống 1: kết quả nhận lại phòng = Chưa nhận lại */}
              {step304Val === 'Chưa nhận lại' && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-amber-950">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertCircle className="w-4 h-4 text-amber-700" />
                    <span>Nhánh chưa nhận lại: Phòng tiếp tục duy trì trạng thái Đang thuê</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Chủ nhà chưa nhận lại phòng thực tế. Nếu khách còn tiếp tục bàn giao, giữ nguyên trạng thái. Nếu khách không thể tiếp tục, bạn có thể mở <strong></strong> để ghi nhận lý do vướng mắc (không cảnh báo thiếu xác nhận của chủ nhà). </p>
                  <div className="flex justify-end gap-2 pt-1 border-t border-amber-200">
                    <button
                      onClick={() => {
                        setShowReturnModal(false);
                        setShowHandoverModal(true);
                      }}
                      className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded font-semibold text-xs cursor-pointer"
                    >
                      Xem hồ sơ bàn giao </button>
                    <button
                      onClick={() => {
                        setShowReturnModal(false);
                        setShowUnfinishedHandoverModal(true);
                      }}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded font-semibold text-xs cursor-pointer shadow-xs"
                    >
                      Mở Ghi nhận chưa bàn giao xong </button>
                  </div>
                </div>
              )}

              {/* Tình huống 2: kết quả nhận lại phòng = Đã nhận lại nhưng thiếu xác nhận của chủ nhà */}
              {step304Val === 'Đã nhận lại' && !step305Val && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl space-y-2 text-red-950">
                  <div className="flex items-center gap-1.5 font-bold text-red-900">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span>Chờ Chủ nhà xác nhận độc lập tại </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-red-900">
                    Kết quả kết quả nhận lại phòng = Đã nhận lại nhưng chưa có xác nhận độc lập tại chủ nhà xác nhận của Chủ nhà (thiếu người thực hiện, thời điểm và bằng chứng). <strong>Tuyệt đối không được cập nhật Trống từ bản nháp</strong> và không phát sinh nút xác nhận lần hai tại đây. </p>
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => {
                        setShowReturnModal(false);
                        setShowHandoverModal(true);
                      }}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded font-semibold text-xs cursor-pointer"
                    >
                      Mở hồ sơ để Chủ nhà xác nhận xác nhận của chủ nhà → </button>
                  </div>
                </div>
              )}

              {/* Tình huống 3: Đủ điều kiện cập nhật Trống (kết quả nhận lại phòng = Đã nhận lại & xác nhận của chủ nhà = Đã xác nhận) */}
              {canVacate && selectedRoom.status !== 'Trống' && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl space-y-2 text-emerald-950">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Đủ điều kiện ghi Trống: kết quả nhận lại phòng = Đã nhận lại &amp; xác nhận của chủ nhà = Đã xác nhận độc lập</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-emerald-800">
                    Phòng được cập nhật Trống ngay, <strong>không cần chờ quyết toán tiền cọc</strong> (tiền cọc tiếp tục theo dõi độc lập). Hệ thống tự động liên kết hợp đồng, khách thuê, người ở cùng và biên bản vào lịch sử lần thuê để tra cứu. </p>
                  <div className="flex items-center gap-2 pt-1 border-t border-emerald-200">
                    <span className="font-semibold text-xs">Ngày nhận lại thực tế (kết thúc lần thuê):</span>
                    <input
                      type="date"
                      value={returnActualDate}
                      onChange={(e) => setReturnActualDate(e.target.value)}
                      className="px-2.5 py-1.5 border border-emerald-300 rounded-lg bg-white font-mono text-xs font-bold text-emerald-900"
                    />
                  </div>
                </div>
              )}

              {/* Tình huống 4: Phòng đã Trống thành công */}
              {selectedRoom.status === 'Trống' && (
                <div className="p-3.5 bg-slate-100 border border-slate-300 rounded-xl space-y-2 text-slate-800">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Phòng hiện đang ở trạng thái Trống (Đã hoàn tất nhận lại thực tế):</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-200">
                    <div>Ngày kết thúc thuê thực tế: <strong className="font-mono text-slate-900">{returnActualDate}</strong></div>
                    <div>Lịch sử cư trú: <strong className="text-emerald-700">Đã ghi nhận kết thúc cư trú</strong></div>
                    <div>Căn cứ: <strong className="font-mono">kết quả nhận lại phòng = Đã nhận lại (Xác nhận xác nhận của chủ nhà v1.0)</strong></div>
                    <div>Quyết toán cọc: <span className="text-slate-500 italic">Theo dõi độc lập tại mục Quyết toán cọc</span></div>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowReturnModal(false); setShowHandoverModal(true); }}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-blue-700 rounded text-xs font-medium cursor-pointer"
                  >
                    Xem hồ sơ bàn giao </button>
                  <label className="hidden flex items-center gap-1 text-[11px] text-slate-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={returnSimulateEF01}
                      onChange={(e) => setReturnSimulateEF01(e.target.checked)}
                      className="rounded border-slate-300"
                    />
                    <span>Mô phỏng chưa nhận lại</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowReturnModal(false)}
                    className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium cursor-pointer"
                  >
                    Đóng </button>
                  {selectedRoom.status !== 'Trống' && (
                    <button
                      type="button"
                      disabled={!canVacate}
                      onClick={() => {
                        if (!canVacate) return;
                        const res = confirmReturnStep305AndVacantPH08(
                          selectedRoom.roomCode,
                          selectedRoom.currentLeaseId || 'THUE-' + selectedRoom.roomCode,
                          returnActualDate
                        );
                        if (res.success) {
                          setShowReturnModal(false);
                          setSelectedRoom(rooms.find(r => r.roomCode === selectedRoom.roomCode) || null);
                          showToast('success', toUserMessage(res.message));
                        } else {
                          showToast('error', toUserMessage(res.message));
                        }
                      }}
                      className={`px-4 py-2 rounded-lg font-semibold text-xs cursor-pointer shadow-xs ${
                        canVacate
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white': 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      Cập nhật trạng thái Trống </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ==================== 1.9. GHI NHẬN CHƯA BÀN GIAO XONG () ==================== */}
      {showUnfinishedHandoverModal && selectedRoom && (() => {
        const roomLogs = unfinishedHandoverLogs.filter(u => u.roomCode === selectedRoom.roomCode);
        const existingRecord = roomLogs[0];

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                  <div>
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800"></span>
                    <h3 className="font-bold text-slate-900 text-base">
                      Ghi nhận chưa bàn giao xong: <span className="font-mono text-rose-700">{selectedRoom.roomCode}</span>
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setShowUnfinishedHandoverModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Chỉ báo nghiệp vụ & thông tin chỉ xem */}
              <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1.5 text-[11px] text-rose-950">
                <div className="flex justify-between items-center">
                  <span>Kết quả kiểm tra thực tế:</span>
                  <span className="font-bold text-rose-800">kết quả nhận lại phòng = Chưa nhận lại</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Chỉ báo nghiệp vụ:</span>
                  <span className="px-2 py-0.5 rounded bg-rose-200 text-rose-900 font-bold">
                    Chưa kết thúc thuê </span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Mã phiên bản Biên bản trả phòng:</span>
                  <span className="font-mono font-semibold">v1.0-RETURN</span>
                </div>
                <p className="text-[10px] text-slate-500 pt-1 border-t border-rose-200">
                  * Ghi nhận này không phải trạng thái sử dụng phòng và không làm phòng chuyển Trống. Việc liên hệ tiếp được quản lý tại. </p>
              </div>

              {/* Form nhập hoặc Xem nội dung vướng mắc */}
              {existingRecord && !unfinishedEditMode ? (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-800 text-xs">Ghi nhận hiện hành của lần bàn giao đang xử lý:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setUnfinishedReason(existingRecord.reason);
                        setUnfinishedObstacle(existingRecord.obstacleContent);
                        setUnfinishedEditMode(true);
                      }}
                      className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded font-bold text-xs cursor-pointer flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Cập nhật nội dung </button>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Lý do:</span>
                    <p className="font-bold text-slate-900 text-xs mt-0.5">{existingRecord.reason}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Nội dung vướng mắc thực tế:</span>
                    <p className="text-slate-700 text-xs mt-0.5 leading-relaxed">{existingRecord.obstacleContent}</p>
                  </div>
                  <div className="text-[10px] text-slate-500 pt-1.5 border-t border-slate-200 flex justify-between">
                    <span>Người ghi: <strong>{existingRecord.loggedBy}</strong></span>
                    <span>Thời điểm: <strong className="font-mono">{existingRecord.loggedAt.substring(0, 16).replace('T', ' ')}</strong></span>
                  </div>
                </div>
              ): (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs">
                      {existingRecord ? 'Cập nhật nội dung vướng mắc:': 'Nhập thông tin chưa hoàn tất bàn giao (Bước 2):'}
                    </span>
                    {existingRecord && (
                      <button
                        type="button"
                        onClick={() => setUnfinishedEditMode(false)}
                        className="text-slate-500 hover:text-slate-700 text-xs underline cursor-pointer"
                      >
                        Hủy chế độ sửa </button>
                    )}
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Lý do khách chưa thể tiếp tục bàn giao <span className="text-red-500">* (Bắt buộc theo )</span>
                    </label>
                    <input
                      type="text"
                      value={unfinishedReason}
                      onChange={(e) => setUnfinishedReason(e.target.value)}
                      placeholder="Ví dụ: Khách còn đồ đạc cá nhân chưa dọn hết..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nội dung vướng mắc thực tế <span className="text-red-500">* (Bắt buộc theo )</span>
                    </label>
                    <textarea
                      rows={3}
                      value={unfinishedObstacle}
                      onChange={(e) => setUnfinishedObstacle(e.target.value)}
                      placeholder="Mô tả cụ thể hiện trạng, thỏa thuận tạm hoãn..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                    />
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      * Lý do và Nội dung vướng mắc là bắt buộc, không được để trống. </span>
                  </div>
                </div>
              )}

              {/* Bảng Lịch sử ghi nhận */}
              {existingRecord?.history && existingRecord.history.length > 0 && (
                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <span className="font-semibold text-slate-700 block text-[11px]">Lịch sử điều chỉnh nội dung:</span>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {existingRecord.history.map((h, i) => (
                      <div key={i} className="p-2 bg-slate-50 border border-slate-200 rounded text-[11px] space-y-0.5">
                        <div className="flex justify-between text-slate-600 font-mono text-[10px]">
                          <span>{h.changedBy}</span>
                          <span>{h.changedAt.substring(0, 16).replace('T', ' ')}</span>
                        </div>
                        <div className="font-medium text-slate-800">{h.reason}</div>
                        <p className="text-slate-500 text-[10px]">{h.obstacleContent}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => { setShowUnfinishedHandoverModal(false); setShowHandoverModal(true); }}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-blue-700 rounded text-xs font-medium cursor-pointer"
                  >
                    Xem hồ sơ bàn giao </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUnfinishedHandoverModal(false);
                      setFeedbackSelectedRoomCode(selectedRoom.roomCode);
                      setPlansSubTab('feedback');
                      setSubTab('plans');
                    }}
                    className="px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 rounded text-xs font-semibold cursor-pointer"
                  >
                    Xem nhật ký liên hệ </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUnfinishedHandoverModal(false);
                      setUnfinishedEditMode(false);
                    }}
                    className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium cursor-pointer"
                  >
                    Đóng </button>
                  {(!existingRecord || unfinishedEditMode) && (
                    <button
                      type="button"
                      onClick={() => {
                        if (!unfinishedReason.trim() || !unfinishedObstacle.trim()) {
                          showToast('error', 'Lý do và nội dung vướng mắc không được để trống.');
                          return;
                        }
                        const res = saveUnfinishedHandoverPH09({
                          roomCode: selectedRoom.roomCode,
                          leaseId: selectedRoom.currentLeaseId || 'THUE-' + selectedRoom.roomCode,
                          contractId: selectedRoom.currentContractId || 'HD-' + selectedRoom.roomCode,
                          handoverVersion: 'v1.0-RETURN',
                          reason: unfinishedReason,
                          obstacleContent: unfinishedObstacle,
                          existingId: existingRecord?.id
                        });
                        if (res.success) {
                          setShowUnfinishedHandoverModal(false);
                          setUnfinishedEditMode(false);
                          showToast('success', toUserMessage(res.message));
                        } else {
                          showToast('error', toUserMessage(res.message));
                        }
                      }}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold cursor-pointer shadow-xs"
                    >
                      {existingRecord ? 'Lưu cập nhật nội dung': 'Lưu ghi nhận (Bước 3 / )'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ==================== 1.11 / 1.12. GHI / CẬP NHẬT NGÀY DỰ KIẾN TRẢ ==================== */}
      {showExpectedDateModal && selectedRoom && (() => {
        const isUpdate = Boolean(selectedRoom.expectedReturnDate);
        const rem = getDaysRemainingOrOverdue(expDateInput);
        const targetContract = contracts.find(c => c.id === selectedRoom.currentContractId || c.roomCode === selectedRoom.roomCode);
        const isPastContractEnd = targetContract?.endDate && expDateInput && expDateInput > targetContract.endDate;
        const isPastToday = rem?.isOverdue;
        const roomPlanHistory = returnPlans.filter(p => p.roomCode === selectedRoom.roomCode);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-600" />
                  <div>
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                      {isUpdate ? '': ''}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base">
                      {isUpdate ? 'Cập nhật ngày dự kiến trả': 'Ghi nhận ngày dự kiến trả lần đầu'}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setShowExpectedDateModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Thông tin hồ sơ chỉ xem */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-700">
                <div>Mã phòng: <strong className="font-mono text-slate-900">{selectedRoom.roomCode}</strong></div>
                <div>Lần thuê: <strong className="font-mono text-slate-900">{selectedRoom.currentLeaseId || 'THUE-' + selectedRoom.roomCode}</strong></div>
                <div>Ngày bắt đầu: <strong className="font-mono text-slate-900">{selectedRoom.contractStartDate || 'Chưa có'}</strong></div>
                <div>Hạn hợp đồng: <strong className="font-mono text-slate-900">{selectedRoom.contractEndDate || 'Chưa có'}</strong></div>
                <div>Trạng thái hiện tại: <strong className="text-blue-800">{selectedRoom.status === 'Sắp trả' ? 'Sắp trả phòng' : selectedRoom.status}</strong></div>
                <div>Ngày hiện hành: <strong className="font-mono text-amber-800">{selectedRoom.expectedReturnDate || 'Chưa có'}</strong></div>
              </div>

              {/* Form nhập dữ liệu */}
              <div className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Ngày dự kiến trả phòng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={expDateInput}
                    onChange={(e) => setExpDateInput(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs font-bold text-slate-900"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    * Không được trước ngày bắt đầu thuê ({selectedRoom.contractStartDate || 'ngày bắt đầu'}). </span>
                </div>

                {/* Dự báo Còn N ngày và Trạng thái phòng */}
                {expDateInput && rem && (
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Dự báo khoảng cách:</span>
                      <strong className={rem.isOverdue ? 'text-red-700': 'text-amber-800'}>{rem.text}</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Trạng thái phòng sau khi lưu:</span>
                      <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                        rem.days <= 15 ? 'bg-amber-100 text-amber-900': 'bg-blue-100 text-blue-900'
                      }`}>
                        {rem.days <= 15 ? 'Sắp trả phòng (mốc ≤ 15 ngày)': 'Đang thuê (> 15 ngày)'}
                      </span>
                    </div>
                    {isPastContractEnd && (
                      <span className="text-[10px] text-orange-700 font-semibold block pt-1 border-t border-amber-200">
                        ⚠️ Cảnh báo Ngày dự kiến trả sau hạn hợp đồng ({selectedRoom.contractEndDate}). Hệ thống không tự sửa hợp đồng. </span>
                    )}
                    {isPastToday && (
                      <span className="text-[10px] text-red-700 font-semibold block pt-1 border-t border-amber-200">
                        ⚠️ Cảnh báo Ngày trả đã qua nhưng chưa bàn giao. Phòng vẫn ở trạng thái Sắp trả phòng, không tự chuyển thành Trống. </span>
                    )}
                  </div>
                )}

                {/* Lý do thay đổi (Bắt buộc với  / ) */}
                {isUpdate && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Lý do thay đổi ngày trả <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={expReason}
                      onChange={(e) => setExpReason(e.target.value)}
                      placeholder="Ví dụ: Khách xin gia hạn thêm 1 tuần để tìm phòng mới..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nguồn khách xác nhận <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={expSource}
                      onChange={(e) => setExpSource(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                    >
                      <option value="tin nhắn">Tin nhắn Zalo/SMS</option>
                      <option value="điện thoại">Điện thoại</option>
                      <option value="trực tiếp">Gặp trực tiếp</option>
                      <option value="khác">Khác</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Thời điểm xác nhận thực tế <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={expTime}
                      onChange={(e) => setExpTime(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-[11px]"
                    />
                    <span className="text-[10px] text-slate-400 block mt-0.5">Không ở tương lai</span>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nội dung hoặc tham chiếu trao đổi xác minh được <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={expContent}
                    onChange={(e) => setExpContent(e.target.value)}
                    placeholder="Ghi rõ nội dung tin nhắn hoặc bằng chứng khách chốt ngày trả phòng..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Lịch sử thay đổi ngày dự kiến trả ( ) */}
              {roomPlanHistory.length > 0 && (
                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <span className="font-semibold text-slate-700 block text-[11px]">Lịch sử kế hoạch trả phòng:</span>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {roomPlanHistory.map((p) => (
                      <div key={p.id} className="p-2 bg-slate-50 border border-slate-200 rounded text-[11px] space-y-0.5">
                        <div className="flex justify-between font-mono text-slate-800">
                          <span>Ngày trả: <strong>{p.expectedDate}</strong> {p.oldDate ? `(cũ: ${p.oldDate})`: ''}</span>
                          <span className="text-[10px] text-slate-500">{p.loggedAt.substring(0, 16).replace('T', ' ')}</span>
                        </div>
                        <div className="text-slate-600">{p.reason || p.exchangeContent}</div>
                        <span className="text-[10px] text-slate-400 block">Người ghi: {p.loggedBy} · Nguồn: {p.confirmSource}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                {/* Trường hợp 01: Khách chưa chốt ngày */}
                <button
                  type="button"
                  onClick={() => {
                    setShowExpectedDateModal(false);
                    setFeedbackSelectedRoomCode(selectedRoom.roomCode);
                    setPlansSubTab('feedback');
                    setSubTab('plans');
                    showToast('success', "Đã chuyển sang thẻ Phản hồi để ghi nhận kết quả liên hệ.");
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium cursor-pointer"
                >
                  Khách chưa chốt ngày (Mở ) </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowExpectedDateModal(false)}
                    className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium cursor-pointer"
                  >
                    Hủy </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!expDateInput) {
                        showToast('error', 'Ngày dự kiến trả không được để trống.');
                        return;
                      }
                      if (selectedRoom.contractStartDate && expDateInput < selectedRoom.contractStartDate) {
                        showToast('error', `Ngày dự kiến trả không được trước ngày bắt đầu thuê (${selectedRoom.contractStartDate}).`);
                        return;
                      }
                      if (isUpdate && !expReason.trim()) {
                        showToast('error', "Lý do thay đổi ngày trả là bắt buộc.");
                        return;
                      }
                      if (!expContent.trim()) {
                        showToast('error', '/05: Nội dung trao đổi xác minh được là bắt buộc.');
                        return;
                      }
                      const res = updateExpectedReturnDatePH11_12({
                        roomCode: selectedRoom.roomCode,
                        leaseId: selectedRoom.currentLeaseId || 'THUE-' + selectedRoom.roomCode,
                        expectedDate: expDateInput,
                        confirmSource: expSource,
                        confirmedAt: expTime,
                        exchangeContent: expContent,
                        reason: isUpdate ? expReason: undefined
                      });
                      if (res.success) {
                        setShowExpectedDateModal(false);
                        setSelectedRoom(rooms.find(r => r.roomCode === selectedRoom.roomCode) || null);
                        showToast('success', toUserMessage(res.message));
                      } else {
                        showToast('error', toUserMessage(res.message));
                      }
                    }}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold cursor-pointer shadow-xs"
                  >
                    {isUpdate ? 'Lưu thay đổi ()': 'Lưu ngày dự kiến trả ()'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ==================== 1.15. KIỂM TRA KẾT QUẢ TIẾP TỤC THUÊ () ==================== */}
      {showExtensionModal && selectedRoom && (() => {
        const extCheck = checkExtensionResultPH15(selectedRoom.roomCode);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-purple-600" />
                  <div>
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800"></span>
                    <h3 className="font-bold text-slate-900 text-base">
                      Kiểm tra kết quả tiếp tục thuê: <span className="font-mono text-purple-700">{selectedRoom.roomCode}</span>
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setShowExtensionModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Thông tin Hợp đồng hiện tại vs Hợp đồng mới */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Hợp đồng hiện tại */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <span className="font-bold text-slate-800 text-[11px] block">Hợp đồng hiện tại:</span>
                  <div className="space-y-1 text-[11px]">
                    <div>Mã: <strong className="font-mono">{extCheck.activeContract?.id || selectedRoom.currentContractId || '—'}</strong></div>
                    <div>Khách: <strong>{extCheck.activeContract?.tenantName || selectedRoom.currentTenantName || '—'}</strong></div>
                    <div>Hạn HĐ: <span className="font-mono">{extCheck.activeContract?.endDate || selectedRoom.contractEndDate || '—'}</span></div>
                    <div>Trạng thái: <strong className="text-blue-700">{extCheck.activeContract?.status || 'Hiệu lực'}</strong></div>
                  </div>
                </div>

                {/* Hợp đồng mới */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <span className="font-bold text-slate-800 text-[11px] block">Hợp đồng nối tiếp mới:</span>
                  {extCheck.renewalContract ? (
                    <div className="space-y-1 text-[11px]">
                      <div>Mã: <strong className="font-mono text-purple-800">{extCheck.renewalContract.id}</strong></div>
                      <div>Ngày ký: <span className="font-mono">{extCheck.renewalContract.signedDate || 'Đã ký giấy'}</span></div>
                      <div>Bắt đầu: <span className="font-mono">{extCheck.renewalContract.startDate}</span></div>
                      <div>Trạng thái: <strong className="text-purple-700">{extCheck.renewalContract.status}</strong></div>
                    </div>
                  ): (
                    <p className="text-slate-400 italic text-[11px] py-2">
                      Chưa có hợp đồng nối tiếp mới được tạo trên hệ thống. </p>
                  )}
                </div>
              </div>

              {/* Kết quả kiểm tra */}
              <div className={`p-4 rounded-xl border space-y-2 ${
                extCheck.result === 'Có bằng chứng hợp lệ về việc tiếp tục thuê'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950': 'bg-amber-50 border-amber-300 text-amber-950'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {extCheck.result === 'Có bằng chứng hợp lệ về việc tiếp tục thuê' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ): (
                      <AlertCircle className="w-5 h-5 text-amber-700 shrink-0" />
                    )}
                    <div>
                      <span className="text-[10px] font-mono uppercase font-bold block">
                        {extCheck.caseType}
                      </span>
                      <strong className="text-sm font-bold">{extCheck.result}</strong>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                    extCheck.result === 'Có bằng chứng hợp lệ về việc tiếp tục thuê'
                      ? 'bg-emerald-200 text-emerald-900': 'bg-amber-200 text-amber-900'
                  }`}>
                    {extCheck.result === 'Có bằng chứng hợp lệ về việc tiếp tục thuê' ? 'Đạt': 'Chưa đạt'}
                  </span>
                </div>
                <p className="text-xs leading-relaxed">
                  {extCheck.reason}
                </p>
              </div>

              {/* Cọc gốc kế thừa */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500">Cọc gốc chuyển tiếp:</span>
                  <span className="block font-semibold text-slate-800">
                    Kế thừa nguyên vẹn từ hợp đồng ban đầu, không thu cọc lại </span>
                </div>
                <span className="font-mono font-bold text-indigo-700 text-sm">
                  {(extCheck.activeContract?.depositAmount || 3500000).toLocaleString('vi-VN')} đ </span>
              </div>

              {/* Footer hành động */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  {extCheck.renewalContract && (
                    <button
                      type="button"
                      onClick={() => { setShowExtensionModal(false); setShowContractModal(true); }}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-purple-700 border border-slate-300 rounded text-xs font-semibold cursor-pointer"
                    >
                      Xem HĐ mới ({extCheck.renewalContract.id}) </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setShowExtensionModal(false);
                      setPlansSubTab('plans');
                      setSubTab('plans');
                    }}
                    className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-amber-800 border border-slate-300 rounded text-xs font-semibold cursor-pointer"
                  >
                    Xem Kế hoạch trả </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowExtensionModal(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Đóng </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
