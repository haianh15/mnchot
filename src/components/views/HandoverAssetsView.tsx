import { toUserMessage } from '../../utils/userMessages';
import React, { useState, useEffect } from 'react';
import { getConfirmedRoomHandover, getLeaseContractChain, resolveRoomContract } from '../../utils/roomLinks';
import { useApp } from '../../context/AppContext';
import {
  InventoryRecord,
  HandoverCondition,
  HandoverReport,
  AssetIncident,
  ReturnInspection,
  AssetComparisonResult,
  HandoverReturnReport,
  RoomAssetItem
} from '../../types';
import {
  PackageCheck,
  FileSignature,
  AlertOctagon,
  Scale,
  FileText,
  CheckCircle2,
  AlertCircle,
  Plus,
  Eye,
  Check,
  X,
  ShieldAlert,
  ArrowRight,
  ClipboardList,
  Search,
  Filter,
  Camera,
  Video,
  FileSpreadsheet,
  Link2,
  History,
  RotateCcw,
  Zap,
  Droplet,
  ExternalLink,
  ChevronRight,
  Info,
  PhoneCall,
  MessageSquare,
  Calendar,
  DollarSign,
  FileCheck2,
  FolderOpen,
  RefreshCw
} from 'lucide-react';

export const HandoverAssetsView: React.FC<{initialRoomCode?: string; initialLeaseId?: string; initialContractId?: string; initialMode?: 'receive' | 'return' | 'view'}> = ({initialRoomCode, initialLeaseId, initialContractId, initialMode}) => {
  const {
    rooms,
    contracts,
    tenants,
    standardAssets,
    inventoryRecords,
    handoverConditions,
    handoverReports,
    incidents,
    returnInspections,
    assetComparisonResults,
    handoverReturnReports,
    settlementSlips,
    saveInventoryBG01,
    saveHandoverConditionBG02,
    saveHandoverReportBG03,
    confirmHandoverSignaturesBG03,
    recordIncidentBG04,
    recordReturnInspectionBG09,
    confirmReturnInspectionStep305,
    correctReturnInspectionStep305,
    saveAssetComparisonResultBG07,
    initHandoverReturnReportDraftBG08,
    syncDepositSettlementBG10,
    saveHandoverReturnReportBG11,
    confirmFinalReturnReportBG11,
    initialPaymentRecords,
    currentUser
  } = useApp();

  // Active sub-tab covering all 11 requested Use Cases:
  // : inventory_bg01 (Kiểm kê tài sản)
  // : condition_bg02 (Hiện trạng bàn giao)
  // : handover_bg03 (Biên bản nhận phòng)
  // : incident_add_bg04 (Ghi nhận sự cố)
  // : incident_search_bg05 (Tra cứu lịch sử sự cố)
  // : compare_bg06 (Đối chiếu tài sản trả phòng)
  // : result_bg07 (Ghi nhận kết quả đối chiếu tài sản)
  // : init_report_bg08 (Khởi tạo biên bản trả phòng)
  // : return_room_bg09 (Ghi nhận kết quả nhận lại phòng /)
  // : deposit_check_bg10 (Theo dõi kết quả đối soát cọc quyết toán cọc)
  // : final_report_bg11 (Hoàn thiện biên bản trả phòng)
  const [activeTab, setActiveTab] = useState<
    | 'inventory_bg01'
    | 'condition_bg02'
    | 'handover_bg03'
    | 'incident_add_bg04'
    | 'incident_search_bg05'
    | 'compare_bg06'
    | 'result_bg07'
    | 'init_report_bg08'
    | 'return_room_bg09'
    | 'deposit_check_bg10'
    | 'final_report_bg11'
  >('inventory_bg01');

  // Selected room for active operations
  const [selectedRoomCode, setSelectedRoomCode] = useState<string>(initialRoomCode || '');

  useEffect(() => {
    if (!initialRoomCode) return;
    if (!rooms.some(r => r.roomCode === initialRoomCode)) {
      setSelectedRoomCode('');
      return;
    }
    handleRoomChange(initialRoomCode);
    // From Room Details, open the matching lease's handover form, including when
    // the legacy occupied room is missing a paper report that must be reconciled.
    if (initialMode === 'return') setActiveTab(handoverReturnReports.some(r => r.roomCode === initialRoomCode && r.leaseId === initialLeaseId) ? 'return_room_bg09' : 'init_report_bg08');
    else if (initialLeaseId || initialMode === 'receive' || initialMode === 'view') setActiveTab('handover_bg03');
  }, [initialRoomCode, initialLeaseId, initialContractId, initialMode]);
  // Toast feedback
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4500);
  };

  const addEvidenceImage = (
    event: React.ChangeEvent<HTMLInputElement>,
    updatePhotos: React.Dispatch<React.SetStateAction<string[]>>,
    maxPhotos: number
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      showToast('error', 'Chỉ nhận ảnh JPG, PNG hoặc WEBP tối đa 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        showToast('error', 'Không đọc được tệp ảnh.');
        return;
      }
      updatePhotos(previous => previous.length >= maxPhotos ? previous : [...previous, reader.result as string]);
    };
    reader.onerror = () => showToast('error', 'Không thể đọc tệp ảnh trên thiết bị.');
    reader.readAsDataURL(file);
  };

  // Helper: target room
  const selectedRoom = rooms.find(r => r.roomCode === selectedRoomCode)!;
  const selectedLeaseId = initialRoomCode === selectedRoomCode && initialLeaseId
    ? initialLeaseId : (selectedRoom?.currentLeaseId || selectedRoom?.pendingLeaseId);
  const resolvedContract = selectedRoom ? resolveRoomContract(selectedRoom, contracts, returnInspections) : undefined;
  const targetContract = contracts.find(c => c.roomCode === selectedRoomCode &&
    c.leaseId === selectedLeaseId && c.id === (initialRoomCode === selectedRoomCode && initialContractId
      ? initialContractId : (selectedRoom?.currentContractId || selectedRoom?.pendingContractId))) ||
    (resolvedContract?.leaseId === selectedLeaseId ? resolvedContract : undefined);
  const activeCurrentContract = contracts.find(c => c.id === selectedRoom?.currentContractId && c.roomCode === selectedRoomCode);
  const permittedRenewalChain = getLeaseContractChain(activeCurrentContract, contracts);
  const pendingHandoverMatch = Boolean(initialLeaseId && selectedRoom?.status === 'Trống' &&
    selectedRoom?.pendingLeaseId === initialLeaseId &&
    selectedRoom?.pendingContractId === initialContractId &&
    contracts.some(c => c.id === initialContractId && c.roomCode === selectedRoomCode &&
      c.leaseId === initialLeaseId && c.isSignedPaper));
  const linkedRoomMismatch = Boolean(initialRoomCode === selectedRoomCode && (
    (initialLeaseId && selectedRoom?.currentLeaseId !== initialLeaseId &&
      !pendingHandoverMatch &&
      !permittedRenewalChain.some(c => c.leaseId === initialLeaseId)) ||
    (initialContractId && !contracts.some(c => c.roomCode === selectedRoomCode &&
      c.leaseId === initialLeaseId && c.id === initialContractId))));
  const currentInitialPayment = initialPaymentRecords.find(p => p.roomCode === selectedRoomCode && p.leaseId === selectedLeaseId && p.contractId === targetContract?.id);
  const returnInspectionTarget = returnInspections.find(r => r.roomCode === selectedRoomCode && r.leaseId === selectedLeaseId);
  const [comparisonItems, setComparisonItems] = useState<{
    assetName: string;
    qtyReceive: number;
    qtyReturn: number;
    condReceive: string;
    condReturn: string;
    diffResult: 'Đúng như bàn giao' | 'Khác biệt';
    diffNote: string;
  }[]>([]);

  // ==================== STATE : KIỂM KÊ TÀI SẢN PHÒNG ====================
  // If a continuing contract inherited the signed paper handover, display
  // inventory from the original contract in that same lease (read-only).
  const originalReceiveContractId = getLeaseContractChain(targetContract, contracts)
    .map(c => handoverReports.find(r => r.roomCode === selectedRoomCode && r.leaseId === selectedLeaseId && r.contractId === c.id &&
      r.status === 'Đã xác nhận'))
    .find(Boolean)?.contractId || targetContract?.id;
  const existingInventory = inventoryRecords.find(i => i.roomCode === selectedRoomCode &&
    i.linkedLeaseId === selectedLeaseId && i.linkedContractId === originalReceiveContractId);
  const [inventoryReviewed, setInventoryReviewed] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<RoomAssetItem[]>(() => {
    if (existingInventory && existingInventory.items.length > 0) {
      return existingInventory.items;
    }
    return standardAssets.map((ast, idx) => ({
      id: `inv_item_${selectedRoomCode}_${idx}`,
      assetId: ast.id,
      name: ast.name,
      unit: ast.unit,
      standardQuantity: ast.standardQuantity,
      actualQuantity: 0,
      quantityDiff: ast.standardQuantity === 0 ? 'Đủ' as const : 'Thiếu' as const,
      physicalCondition: 'Khác' as const,
      notes: ''
    }));
  });

  // : Modal bổ sung tài sản mới vào kiểm kê
  const [showAddAssetModal, setShowAddAssetModal] = useState(false);
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetUnit, setNewAssetUnit] = useState('Cái');
  const [newAssetQty, setNewAssetQty] = useState<number>(1);
  const [newAssetCondition, setNewAssetCondition] = useState<'Bình thường' | 'Hư hỏng' | 'Khác'>('Bình thường');
  const [newAssetNote, setNewAssetNote] = useState('');

  // Modal liên kết hợp đồng / lần thuê thực tế
  const [showLinkContractModal, setShowLinkContractModal] = useState(false);
  const [linkContractId, setLinkContractId] = useState(targetContract?.id || '');

  // ==================== STATE : GHI NHẬN HIỆN TRẠNG TÀI SẢN ====================
  const existingCondition = handoverConditions.find(c => c.roomCode === selectedRoomCode &&
    c.linkedLeaseId === selectedLeaseId && c.linkedContractId === originalReceiveContractId && c.status === 'Đã hoàn tất' && c.meterPhotos?.length > 0) ||
    handoverConditions.find(c => c.roomCode === selectedRoomCode && c.linkedLeaseId === selectedLeaseId && c.linkedContractId === originalReceiveContractId);
  const [condScope, setCondScope] = useState<'Tài sản cụ thể' | 'Hiện trạng chung của phòng'>('Hiện trạng chung của phòng');
  const [condAssetName, setCondAssetName] = useState<string>(standardAssets[0]?.name || '');
  const [condDesc, setCondDesc] = useState<string>(existingCondition?.description || '');
  const [condPhotos, setCondPhotos] = useState<string[]>(existingCondition?.photos || []);
  const [condVideoUrl, setCondVideoUrl] = useState<string>(existingCondition?.videoUrl || '');
  const [condVideoError, setCondVideoError] = useState<string | null>(null);

  // Bước 1.03: Chốt chỉ số điện nước thực tế ngoài hệ thống
  const [meterElecCode, setMeterElecCode] = useState<string>(existingCondition?.meterElectricCode || '');
  const [meterElecKwh, setMeterElecKwh] = useState<number>(existingCondition?.initialElectricityKwh ?? 0);
  const [meterWaterCode, setMeterWaterCode] = useState<string>(existingCondition?.meterWaterCode || '');
  const [meterWaterM3, setMeterWaterM3] = useState<number>(existingCondition?.initialWaterM3 ?? 0);
  const [meterPhotos, setMeterPhotos] = useState<string[]>(existingCondition?.meterPhotos || []);

  // Bước 1.04 & 1.05: Khách kiểm tra thực tế
  const [tenantCheckOption, setTenantCheckOption] = useState<'Không cần bổ sung' | 'Có bổ sung'>('Không cần bổ sung');
  const [tenantCheckNote, setTenantCheckNote] = useState<string>(existingCondition?.tenantCheckNote || '');
  const [supplementNote, setSupplementNote] = useState<string>(existingCondition?.supplementNote || '');

  // ==================== STATE : LẬP BIÊN BẢN NHẬN PHÒNG ====================
  // A renewed contract reads its original signed handover; it must not modify
  // that report or relabel it with the renewing contract's identifier.
  const handoverContractChain = getLeaseContractChain(targetContract, contracts);
  const existingReport = handoverContractChain.map(c => handoverReports.find(r =>
    r.roomCode === selectedRoomCode && r.leaseId === selectedLeaseId && r.contractId === c.id)).find(Boolean);
  const isInheritedReceiveReport = Boolean(existingReport && existingReport.contractId !== targetContract?.id);
  const matchingTenant = tenants.find(t => t.id === targetContract?.tenantId);
  const [showSignPaperModal, setShowSignPaperModal] = useState(false);
  const [signPaperTenant, setSignPaperTenant] = useState<boolean>(existingReport?.tenantSignedPaper === 'Đã ký giấy');
  const [signPaperOwner, setSignPaperOwner] = useState<boolean>(existingReport?.ownerSignedPaper === 'Đã ký giấy');
  const [paperLocation, setPaperLocation] = useState<string>(existingReport?.paperLocation || '');
  const [signedDocumentScanUrl, setSignedDocumentScanUrl] = useState<string>(existingReport?.signedDocumentScanUrl || '');
  // Never carry signature indicators or evidence from another room/lease.
  useEffect(() => {
    setSignPaperTenant(existingReport?.tenantSignedPaper === 'Đã ký giấy');
    setSignPaperOwner(existingReport?.ownerSignedPaper === 'Đã ký giấy');
    setPaperLocation(existingReport?.paperLocation || '');
    setSignedDocumentScanUrl(existingReport?.signedDocumentScanUrl || '');
  }, [selectedRoomCode, selectedLeaseId, existingReport?.id,
      existingReport?.tenantSignedPaper, existingReport?.ownerSignedPaper]);

  // ==================== STATE : GHI NHẬN SỰ CỐ TÀI SẢN ====================
  const [incScope, setIncScope] = useState<'Tài sản cụ thể' | 'Hiện trạng chung'>('Tài sản cụ thể');
  const [incAsset, setIncAsset] = useState<string>(standardAssets[0]?.name || '');
  const [incDesc, setIncDesc] = useState('');
  const [incCause, setIncCause] = useState('');
  const [incRespStatus, setIncRespStatus] = useState<'Chưa xác định' | 'Đã xác định'>('Chưa xác định');
  const [incRespNote, setIncRespNote] = useState('');
  const [incProcessingStatus, setIncProcessingStatus] = useState<'Chưa xử lý' | 'Đang xử lý' | 'Đã xử lý'>('Đang xử lý');
  const [incSolutionPlan, setIncSolutionPlan] = useState('');
  const [incActualResult, setIncActualResult] = useState('');
  const [incEstimatedCost, setIncEstimatedCost] = useState<number>(0);
  const [incExternalPaymentNote, setIncExternalPaymentNote] = useState('');
  const [incPhotos, setIncPhotos] = useState<string[]>([]);
  const [incVideoUrl, setIncVideoUrl] = useState('');

  // ==================== STATE : TRA CỨU SỰ CỐ TÀI SẢN ====================
  const [bg05FilterAsset, setBg05FilterAsset] = useState<string>('Tất cả');
  const [bg05FilterStatus, setBg05FilterStatus] = useState<string>('Tất cả');
  const [bg05FilterStartDate, setBg05FilterStartDate] = useState<string>('');
  const [bg05FilterEndDate, setBg05FilterEndDate] = useState<string>('');
  const [bg05SearchKeyword, setBg05SearchKeyword] = useState<string>('');
  const [selectedIncidentDetail, setSelectedIncidentDetail] = useState<AssetIncident | null>(null);

  // ==================== STATE : GHI NHẬN KẾT QUẢ ĐỐI CHIẾU TÀI SẢN ====================
  const existingCompResult = assetComparisonResults.find(r => r.roomCode === selectedRoomCode && r.leaseId === selectedLeaseId);
  const [bg07HasPendingWork, setBg07HasPendingWork] = useState<boolean>(existingCompResult?.hasPendingWork ?? false);
  const [bg07PendingWorkNote, setBg07PendingWorkNote] = useState<string>(existingCompResult?.pendingWorkNote || '');
  const [bg07SolutionPlan, setBg07SolutionPlan] = useState<string>(existingCompResult?.solutionPlan || '');
  const [bg07OwnerOpinion, setBg07OwnerOpinion] = useState<string>(existingCompResult?.ownerOpinion || '');
  const [bg07TenantOpinion, setBg07TenantOpinion] = useState<string>(existingCompResult?.tenantOpinion || '');
  const [bg07TenantFeedbackStatus, setBg07TenantFeedbackStatus] = useState<'Đã phản hồi' | 'Chưa phản hồi' | 'Không liên hệ được'>(
    existingCompResult?.tenantFeedbackStatus || 'Chưa phản hồi'
  );
  const [bg07UnanimousStatus, setBg07UnanimousStatus] = useState<'Đã thống nhất' | 'Chưa thống nhất' | 'Chưa xác định'>(
    existingCompResult?.unanimousStatus || 'Chưa xác định'
  );
  const [bg07CompensationAmount, setBg07CompensationAmount] = useState<number>(existingCompResult?.compensationAmount || 0);
  const [bg07ContactLogs, setBg07ContactLogs] = useState<{
    id: string;
    date: string;
    channel: 'Zalo' | 'Điện thoại' | 'Trực tiếp' | 'Khác';
    caller: string;
    result: string;
    evidence: string;
  }[]>(existingCompResult?.contactHistory || []);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [newContactDate, setNewContactDate] = useState(new Date().toISOString().substring(0, 16));
  const [newContactChannel, setNewContactChannel] = useState<'Zalo' | 'Điện thoại' | 'Trực tiếp' | 'Khác'>('Zalo');
  const [newContactCaller, setNewContactCaller] = useState(currentUser?.fullName || 'Chủ nhà');
  const [newContactResult, setNewContactResult] = useState('');
  const [newContactEvidence, setNewContactEvidence] = useState('');

  //  , ,  & 
  const [showAF03SettlementModal, setShowAF03SettlementModal] = useState(false);
  const [step318Transferred, setStep318Transferred] = useState(false);
  const [bg07SaveError, setBg07SaveError] = useState<string | null>(null);
  const bg07SimulateSaveFailure = false;

  // ==================== STATE : KHỞI TẠO BIÊN BẢN TRẢ PHÒNG ====================
  const existingReturnReport = handoverReturnReports.find(r => r.roomCode === selectedRoomCode && r.leaseId === selectedLeaseId);
  const [bg08Date, setBg08Date] = useState(new Date().toISOString().substring(0, 10));
  const [bg08SelectedContractId, setBg08SelectedContractId] = useState(targetContract?.id || '');
  const [bg08Giver, setBg08Giver] = useState(selectedRoom?.currentTenantName || '');
  const [bg08Receiver, setBg08Receiver] = useState(currentUser?.fullName || 'Chủ nhà');
  const [bg08Place, setBg08Place] = useState('Tại phòng ' + selectedRoomCode);
  const [bg08Notes, setBg08Notes] = useState('');

  // ==================== STATE : GHI NHẬN KẾT QUẢ NHẬN LẠI PHÒNG ( & ) ====================
  const existingInspection = returnInspections.find(i => i.roomCode === selectedRoomCode && i.leaseId === selectedLeaseId);
  const [bg09InspectionDate, setBg09InspectionDate] = useState(existingInspection?.inspectionDate || new Date().toISOString().substring(0, 10));
  const [bg09Step304Status, setBg09Step304Status] = useState<'Đã nhận lại' | 'Chưa nhận lại' | 'Chưa có kết quả'>(
    existingInspection?.step304Status || 'Chưa có kết quả'
  );
  const [bg09IncompleteReason, setBg09IncompleteReason] = useState(existingInspection?.incompleteReason || '');
  const [bg09FinalElec, setBg09FinalElec] = useState<number | ''>(existingInspection?.finalElectricityKwh ?? '');
  const [bg09FinalWater, setBg09FinalWater] = useState<number | ''>(existingInspection?.finalWaterM3 ?? '');
  const [bg09Evidence, setBg09Evidence] = useState(existingInspection?.step305Evidence || '');
  const [bg09EvidencePhotos, setBg09EvidencePhotos] = useState<string[]>(existingInspection?.step305EvidencePhotos || []);
  const [bg09EvidenceVideoUrl, setBg09EvidenceVideoUrl] = useState(existingInspection?.step305EvidenceVideoUrl || '');
  const [bg09Items, setBg09Items] = useState(
    existingInspection?.items && existingInspection.items.length > 0
      ? existingInspection.items
      : standardAssets.map(ast => ({
          name: ast.name,
          inspected: false,
          quantity: 0,
          condition: '',
          reasonIfNotInspected: ''
        }))
  );

  // Modal đính chính  ( /  /  & 06)
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctionNewStatus, setCorrectionNewStatus] = useState<'Đã nhận lại' | 'Chưa nhận lại'>('Chưa nhận lại');
  const [correctionReason, setCorrectionReason] = useState('');
  const [correctionEvidence, setCorrectionEvidence] = useState('');
  const [mismatchNoticeSent, setMismatchNoticeSent] = useState(false);

  // ==================== STATE : THEO DÕI ĐỐI SOÁT CỌC ====================
  const matchingSettlementSlip = settlementSlips.find(s => s.roomCode === selectedRoomCode && s.leaseId === selectedLeaseId);
  const [bg10WaitingReason, setBg10WaitingReason] = useState('');
  const [showSettlementDetailModal, setShowSettlementDetailModal] = useState(false);
  const [bg10SaveError, setBg10SaveError] = useState<string | null>(null);
  const [bg10SimulateSaveFailure, setBg10SimulateSaveFailure] = useState(false);

  // ==================== STATE : HOÀN THIỆN BIÊN BẢN TRẢ PHÒNG ====================
  const [bg11TenantSigned, setBg11TenantSigned] = useState<'Khách đã ký' | 'Chưa ký' | 'Khách không ký'>(
    existingReturnReport?.tenantSignedPaper || 'Chưa ký'
  );
  const [bg11NotSignReason, setBg11NotSignReason] = useState<string>(
    existingReturnReport?.tenantNotSignReason || 'Không cung cấp lý do'
  );
  const [bg11NotSignExchangeInfo, setBg11NotSignExchangeInfo] = useState<string>(
    existingReturnReport?.tenantNotSignExchangeInfo || ''
  );
  const [bg11OwnerSigned, setBg11OwnerSigned] = useState<boolean>(existingReturnReport?.ownerSignedPaper === 'Đã ký');
  const [bg11PaperLocation, setBg11PaperLocation] = useState<string>(
    existingReturnReport?.paperLocation || ''
  );
  const [bg11ScanUrl, setBg11ScanUrl] = useState<string>(existingReturnReport?.signedDocumentScanUrl || '');
  const [showConfirm324Modal, setShowConfirm324Modal] = useState(false);

  // Update inventory items and BG07 state when room changes
  const handleRoomChange = (roomCode: string) => {
    setSelectedRoomCode(roomCode);
    setInventoryReviewed(false);
    const room = rooms.find(r => r.roomCode === roomCode);
    const nextContract = room ? resolveRoomContract(room, contracts, returnInspections) : undefined;
    const nextLeaseId = initialRoomCode === roomCode && initialLeaseId
      ? initialLeaseId : (room?.currentLeaseId || room?.pendingLeaseId);
    const receiveContractId = getLeaseContractChain(nextContract, contracts)
      .map(c => handoverReports.find(r => r.roomCode === roomCode && r.leaseId === nextLeaseId && r.contractId === c.id &&
        r.status === 'Đã xác nhận')).find(Boolean)?.contractId || nextContract?.id;
    const existing = inventoryRecords.find(i => i.roomCode === roomCode &&
      i.linkedLeaseId === nextLeaseId && i.linkedContractId === receiveContractId);
    if (existing && existing.items.length > 0) {
      setInventoryItems(existing.items);
    } else {
      setInventoryItems(standardAssets.map((ast, idx) => ({
        id: `inv_item_${roomCode}_${idx}`,
        assetId: ast.id,
        name: ast.name,
        unit: ast.unit,
        standardQuantity: ast.standardQuantity,
        actualQuantity: 0,
        quantityDiff: ast.standardQuantity === 0 ? 'Đủ' as const : 'Thiếu' as const,
        physicalCondition: 'Khác' as const,
        notes: ''
      })));
    }
    const compRes = assetComparisonResults.find(r => r.roomCode === roomCode && r.leaseId === nextLeaseId);
    if (compRes) {
      setBg07HasPendingWork(compRes.hasPendingWork);
      setBg07PendingWorkNote(compRes.pendingWorkNote || '');
      setBg07SolutionPlan(compRes.solutionPlan || '');
      setBg07OwnerOpinion(compRes.ownerOpinion || '');
      setBg07TenantOpinion(compRes.tenantOpinion || '');
      setBg07TenantFeedbackStatus(compRes.tenantFeedbackStatus || 'Chưa phản hồi');
      setBg07UnanimousStatus(compRes.unanimousStatus || 'Chưa xác định');
      setBg07CompensationAmount(compRes.compensationAmount || 0);
      setBg07ContactLogs(compRes.contactHistory || []);
      setStep318Transferred(Boolean(compRes.transferredToSettlement318));
    } else {
      setBg07HasPendingWork(false);
      setBg07PendingWorkNote('');
      setBg07SolutionPlan('');
      setBg07OwnerOpinion('');
      setBg07TenantOpinion('');
      setBg07TenantFeedbackStatus('Chưa phản hồi');
      setBg07UnanimousStatus('Chưa xác định');
      setBg07CompensationAmount(0);
      setStep318Transferred(false);
    }
    // Clear unsaved inputs before moving from one room to another.
    setComparisonItems([]);
    setCondScope('Hiện trạng chung của phòng');
    setCondAssetName(standardAssets[0]?.name || '');
    setTenantCheckOption('Không cần bổ sung');
    setIncDesc(''); setIncCause(''); setIncRespNote(''); setIncSolutionPlan('');
    setIncActualResult(''); setIncExternalPaymentNote(''); setIncPhotos([]); setIncVideoUrl('');
    setSelectedIncidentDetail(null);
    setShowAddAssetModal(false); setShowLinkContractModal(false);
    setShowSignPaperModal(false); setShowCorrectionModal(false);
    setShowSettlementDetailModal(false); setShowAF03SettlementModal(false);
    setShowAddContactModal(false); setShowConfirm324Modal(false);
    setMismatchNoticeSent(false);
    const matchingCondition = handoverConditions.find(cond => cond.roomCode === roomCode &&
      cond.linkedContractId === receiveContractId && cond.linkedLeaseId === nextLeaseId &&
      cond.status === 'Đã hoàn tất' && cond.meterPhotos?.length > 0) ||
      handoverConditions.find(cond => cond.roomCode === roomCode &&
        cond.linkedContractId === receiveContractId && cond.linkedLeaseId === nextLeaseId);
    setCondDesc(matchingCondition?.description || '');
    setCondPhotos(matchingCondition?.photos || []);
    setCondVideoUrl(matchingCondition?.videoUrl || '');
    setMeterElecCode(matchingCondition?.meterElectricCode || '');
    setMeterElecKwh(matchingCondition?.initialElectricityKwh ?? 0);
    setMeterWaterCode(matchingCondition?.meterWaterCode || '');
    setMeterWaterM3(matchingCondition?.initialWaterM3 ?? 0);
    setMeterPhotos(matchingCondition?.meterPhotos || []);
    setTenantCheckNote(matchingCondition?.tenantCheckNote || '');
    setSupplementNote(matchingCondition?.supplementNote || '');
    setLinkContractId(nextContract?.id || '');
    setBg07ContactLogs(compRes?.contactHistory || []);
    setBg07SaveError(null);

    // Sync BG08 & BG11
    const retReport = handoverReturnReports.find(r => r.roomCode === roomCode && r.leaseId === nextLeaseId);
    const rmContract = nextContract;
    if (retReport) {
      setBg08Date(retReport.date);
      setBg08Giver(retReport.giverName);
      setBg08Receiver(retReport.receiverName);
      setBg08Place(retReport.handoverPlace || 'Tại phòng ' + roomCode);
      setBg08Notes(retReport.initialConditionNotes || '');
      setBg08SelectedContractId(retReport.contractId || rmContract?.id || '');
      setBg11TenantSigned(retReport.tenantSignedPaper || 'Chưa ký');
      setBg11NotSignReason(retReport.tenantNotSignReason || 'Không cung cấp lý do');
      setBg11NotSignExchangeInfo(retReport.tenantNotSignExchangeInfo || '');
      setBg11OwnerSigned(retReport.ownerSignedPaper === 'Đã ký');
      setBg11PaperLocation(retReport.paperLocation || '');
      setBg11ScanUrl(retReport.signedDocumentScanUrl || '');
    } else {
      setBg08Date(new Date().toISOString().substring(0, 10));
      setBg08SelectedContractId(rmContract?.id || '');
      setBg08Giver(rmContract?.tenantName || '');
      setBg08Receiver(currentUser?.fullName || 'Chủ nhà');
      setBg08Place('Tại phòng ' + roomCode);
      setBg08Notes('');
      setBg11TenantSigned('Chưa ký');
      setBg11NotSignReason('Không cung cấp lý do');
      setBg11NotSignExchangeInfo('');
      setBg11OwnerSigned(false);
      setBg11PaperLocation('');
      setBg11ScanUrl('');
    }

    // Sync BG09
    const insp = returnInspections.find(i => i.roomCode === roomCode && i.leaseId === nextLeaseId);
    if (insp) {
      setBg09InspectionDate(insp.inspectionDate || new Date().toISOString().substring(0, 10));
      setBg09Step304Status(insp.step304Status || 'Chưa có kết quả');
      setBg09IncompleteReason(insp.incompleteReason || '');
      setBg09FinalElec(insp.finalElectricityKwh ?? '');
      setBg09FinalWater(insp.finalWaterM3 ?? '');
      setBg09Evidence(insp.step305Evidence || '');
      setBg09EvidencePhotos(insp.step305EvidencePhotos || []);
      setBg09EvidenceVideoUrl(insp.step305EvidenceVideoUrl || '');
      if (insp.items && insp.items.length > 0) {
        setBg09Items(insp.items);
      }
    } else {
      setBg09InspectionDate(new Date().toISOString().substring(0, 10));
      setBg09Step304Status('Chưa nhận lại');
      setBg09IncompleteReason('');
      setBg09FinalElec('');
      setBg09FinalWater('');
      setBg09Evidence('');
      setBg09EvidencePhotos([]);
      setBg09EvidenceVideoUrl('');
      setBg09Items(standardAssets.map(ast => ({
        name: ast.name,
        inspected: false,
        quantity: 0,
        condition: '',
        reasonIfNotInspected: ''
      })));
    }
  };

  // Compute quantityDiff based on standard and actual
  const updateActualQty = (index: number, val: number) => {
    setInventoryItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      const actual = Math.max(0, Math.floor(val));
      const diff: 'Đủ' | 'Thiếu' | 'Thừa' = actual === item.standardQuantity ? 'Đủ' : actual < item.standardQuantity ? 'Thiếu' : 'Thừa';
      return {
        ...item,
        actualQuantity: actual,
        quantityDiff: diff
      };
    }));
  };

  const updatePhysicalCondition = (index: number, cond: 'Bình thường' | 'Hư hỏng' | 'Khác') => {
    setInventoryItems(prev => prev.map((item, i) => i === index ? { ...item, physicalCondition: cond } : item));
  };

  const updateItemNotes = (index: number, notes: string) => {
    setInventoryItems(prev => prev.map((item, i) => i === index ? { ...item, notes } : item));
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2 text-xs font-semibold ${
          toast.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-300' :
          toast.type === 'error' ? 'bg-red-50 text-red-900 border-red-300' :
          'bg-blue-50 text-blue-900 border-blue-300'
        }`}>
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-600" />}
          {toast.type === 'info' && <Info className="w-4 h-4 text-blue-600" />}
          <span>{toast.message}</span>
        </div>
      )}

      {linkedRoomMismatch && <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">
        Hồ sơ phòng hoặc lần thuê đã thay đổi. Không thể mở hồ sơ cũ như hồ sơ hiện tại. Vui lòng quay lại Danh sách phòng và chọn lại.
      </div>}
      {/* Main Header */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <PackageCheck className="w-6 h-6 text-blue-600" />
            <h1 className="text-lg font-bold text-slate-900">Bàn giao và tài sản</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Ghi nhận tài sản, tình trạng bàn giao và biên bản theo đúng phòng và lần thuê. </p>
        </div>

        {/* Global Room Selector */}
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
          <span className="font-semibold text-slate-600">Phòng thao tác:</span>
          <select
            value={selectedRoomCode}
            onChange={(e) => { handleRoomChange(e.target.value); setActiveTab('inventory_bg01'); }}
            disabled={Boolean(initialRoomCode && initialLeaseId)}
            className="px-2.5 py-1 border border-slate-300 rounded bg-white font-mono font-bold text-blue-700 cursor-pointer"
          >
            <option value="">-- Chọn phòng --</option>
            {rooms.map(r => (
              <option key={r.id} value={r.roomCode}>
                {r.roomCode} - {r.currentTenantName || 'Trống'} ({r.status}) </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 space-y-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Chọn công việc bàn giao">
          {([
            ['inventory_bg01','Nhận phòng'],
            ['init_report_bg08','Trả phòng'],
            ['incident_search_bg05','Sự cố tài sản']
          ] as const).map(([tab,label])=>{
            const activeGroup = tab==='inventory_bg01' ? ['inventory_bg01','condition_bg02','handover_bg03'].includes(activeTab) :
              tab==='init_report_bg08' ? ['compare_bg06','result_bg07','init_report_bg08','return_room_bg09','deposit_check_bg10','final_report_bg11'].includes(activeTab) :
              ['incident_add_bg04','incident_search_bg05'].includes(activeTab);
            const notApplicable = tab === 'init_report_bg08' && (!selectedRoom || selectedRoom.status === 'Trống');
            return <button key={tab} disabled={notApplicable} title={notApplicable ? 'Phòng chưa có người nhận ở; không có lượt thuê đang trả' : undefined} onClick={()=>setActiveTab(tab)} className={`rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed ${activeGroup?'bg-blue-600 text-white':'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>{label}</button>
          })}
        </div>
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-900" aria-live="polite">
          <span className="font-medium">Đang thực hiện: </span>
          {{inventory_bg01:'Kiểm kê tài sản',condition_bg02:'Ghi nhận hiện trạng',handover_bg03:'Biên bản nhận phòng',init_report_bg08:'Lập biên bản trả phòng',return_room_bg09:'Ghi nhận nhận lại phòng',compare_bg06:'Đối chiếu tài sản',result_bg07:'Kết quả đối chiếu tài sản',deposit_check_bg10:'Theo dõi quyết toán cọc',final_report_bg11:'Hoàn thiện biên bản trả phòng',incident_search_bg05:'Tra cứu sự cố',incident_add_bg04:'Ghi nhận sự cố mới'}[activeTab]}
        </div>
      </div>

      {selectedRoomCode && !targetContract && !linkedRoomMismatch && <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        Phòng này chưa có hợp đồng đã ký đang chờ nhận hoặc lần thuê hiện tại. Không có hồ sơ bàn giao hợp lệ để mở hoặc lập. Hãy lập và ghi nhận hợp đồng trước.
      </div>}
      {!selectedRoomCode && <div className="bg-amber-50 border border-amber-200 text-amber-900 text-sm rounded-xl p-4">Vui lòng chọn phòng cụ thể để mở hồ sơ bàn giao, tài sản và biên bản nguồn.</div>}

      {/* =========================================================================
          TAB 1: KIỂM KÊ TÀI SẢN PHÒNG 
      ========================================================================= */}
      {selectedRoomCode && !linkedRoomMismatch && targetContract && activeTab === 'inventory_bg01' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 text-xs">
          {/* Header Card */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                
                <h2 className="text-sm font-bold text-slate-900">Kiểm kê tài sản chuẩn bị trước khi giao phòng</h2>
              </div>
              <p className="text-slate-500 mt-0.5">
                Kiểm tra danh mục, số lượng và tình trạng vật lý thực tế. Quản lý 2 trạng thái độc lập: Kiểm kê (Nháp/Hoàn tất) &amp; Liên kết HĐ (Chưa/Đã liên kết). </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddAssetModal(true)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w- h-" />
                <span>Bổ sung tài sản</span>
              </button>
              <button
                onClick={() => setShowLinkContractModal(true)}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Link2 className="w- h-" />
                <span>Liên kết HĐ/Lần thuê</span>
              </button>
            </div>
          </div>

          {/* Room & Status Info Bar (Giao diện mục 2) */}
          <div className="p- bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 md:grid-cols-4 gap-3 text-slate-700">
            <div>
              <span className="text-slate-500 block text-[11px]">Mã phòng &amp; Tầng:</span>
              <strong className="font-mono text-slate-900">{selectedRoom.roomCode} (Tầng {selectedRoom.floor})</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Đợt dự kiến &amp; Phiên bản:</span>
              <span className="font-mono text-slate-800">{existingInventory?.expectedBatchCode || 'DOT-2026-K10'} (v{existingInventory?.version || 1})</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">1. Trạng thái kiểm kê:</span>
              <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                existingInventory?.inventoryStatus === 'Đã hoàn tất' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {existingInventory?.inventoryStatus || 'Chưa kiểm kê'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">2. Trạng thái liên kết HĐ:</span>
              <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                existingInventory?.linkStatus === 'Đã liên kết' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'
              }`}>
                {existingInventory?.linkStatus || 'Chưa liên kết'}
              </span>
              {existingInventory?.linkedContractId && (
                <span className="block text-[10px] font-mono text-slate-500">{existingInventory.linkedContractId}</span>
              )}
            </div>
          </div>

          {/* Hướng dẫn cảnh báo nghiệp vụ  */}
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-amber-900 text-[11px] flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Lưu ý: </strong> Bản kiểm kê <em>Đã hoàn tất</em> nhưng <em>Chưa liên kết</em> là hợp lệ để chuẩn bị trước ký HĐ, song <strong>KHÔNG đủ điều kiện</strong> cho Lưu Đã lập. Trước 1.06 phải có đồng thời <strong>Đã hoàn tất</strong> và <strong>Đã liên kết</strong> đúng hợp đồng/lần thuê. </div>
          </div>

          {/* Table of Assets (Giao diện mục 3) */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[11px]">
                  <th className="py-2.5 px-3">Tên tài sản / Thiết bị</th>
                  <th className="py-2.5 px-3">Đơn vị</th>
                  <th className="py-2.5 px-3">SL Danh mục</th>
                  <th className="py-2.5 px-3">SL Thực tế (nguyên &ge; 0)</th>
                  <th className="py-2.5 px-3">Đối chiếu SL</th>
                  <th className="py-2.5 px-3">Tình trạng vật lý</th>
                  <th className="py-2.5 px-3">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {inventoryItems.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{item.name}</td>
                    <td className="py-2.5 px-3 text-slate-500">{item.unit}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">{item.standardQuantity}</td>
                    <td className="py-2.5 px-3">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={item.actualQuantity}
                        onChange={(e) => updateActualQty(idx, Number(e.target.value))}
                        className="w-16 px-2 py-1 border border-slate-300 rounded font-mono font-bold text-center text-blue-700 bg-blue-50/40"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                        item.quantityDiff === 'Đủ' ? 'bg-emerald-100 text-emerald-800' :
                        item.quantityDiff === 'Thiếu' ? 'bg-rose-100 text-rose-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {item.quantityDiff}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <select
                        value={item.physicalCondition}
                        onChange={(e) => updatePhysicalCondition(idx, e.target.value as any)}
                        className="px-2 py-1 border border-slate-300 rounded text-xs bg-white cursor-pointer"
                      >
                        <option value="Bình thường">Bình thường</option>
                        <option value="Hư hỏng">Hư hỏng</option>
                        <option value="Khác">Khác</option>
                      </select>
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        placeholder="Ghi chú chi tiết..."
                        value={item.notes || ''}
                        onChange={(e) => updateItemNotes(idx, e.target.value)}
                        className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-700 p-3 border border-slate-200 rounded-lg bg-slate-50">
            <input type="checkbox" checked={inventoryReviewed} onChange={e => setInventoryReviewed(e.target.checked)} />
            Tôi đã trực tiếp kiểm tra tài sản của phòng {selectedRoomCode} và xác nhận số lượng, tình trạng vừa nhập là thực tế.
          </label>
          {/* Action Buttons (Thao tác thực hiện) */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <button
              onClick={() => {
                // : Hủy bỏ
                handleRoomChange(selectedRoomCode);
                showToast('info', 'Đã hủy các thay đổi chưa lưu và khôi phục dữ liệu gốc.');
              }}
              className="px- py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium cursor-pointer"
            >
              Hủy thay đổi </button>

            <div className="flex items-center gap-2">
              {/* : Lưu nháp */}
              <button
                onClick={() => {
                  const draftRecord: InventoryRecord = {
                    id: existingInventory?.id || 'inv_' + selectedRoomCode.replace(/\D/g, '') + '_' + Date.now().toString().slice(-4),
                    roomCode: selectedRoomCode,
                    expectedBatchCode: existingInventory?.expectedBatchCode || 'DOT-2026-K10',
                    version: (existingInventory?.version || 1),
                    inventoryStatus: 'Nháp',
                    linkStatus: targetContract ? 'Đã liên kết' : 'Chưa liên kết',
                    linkedContractId: targetContract?.id,
                    linkedLeaseId: selectedLeaseId,
                    items: inventoryItems,
                    completedAt: undefined,
                    completedBy: currentUser?.fullName || 'Chủ nhà'
                  };
                  const result = saveInventoryBG01(draftRecord);
                  showToast(result.success ? 'info' : 'error', result.message);
                }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold cursor-pointer"
              >
                Lưu nháp kiểm kê </button>

              {/* Bước 3: Lưu hoàn tất */}
              <button
                onClick={() => {
                  if (!inventoryReviewed) {
                    showToast('error', 'Vui lòng xác nhận đã kiểm kê thực tế tài sản của đúng phòng.');
                    return;
                  }
                  // Validation kiểm kê
                  for (const itm of inventoryItems) {
                    if (itm.actualQuantity < 0 || !Number.isInteger(itm.actualQuantity)) {
                      showToast('error', `: Số lượng của "${itm.name}" không hợp lệ. Phải là số nguyên không âm.`);
                      return;
                    }
                  }
                  const completedRecord: InventoryRecord = {
                    id: existingInventory?.id || 'inv_' + selectedRoomCode.replace(/\D/g, '') + '_' + Date.now().toString().slice(-4),
                    roomCode: selectedRoomCode,
                    expectedBatchCode: existingInventory?.expectedBatchCode || 'DOT-2026-K10',
                    version: (existingInventory?.version || 1),
                    inventoryStatus: 'Đã hoàn tất',
                    linkStatus: targetContract ? 'Đã liên kết' : 'Chưa liên kết',
                    linkedContractId: targetContract?.id,
                    linkedLeaseId: selectedLeaseId,
                    items: inventoryItems,
                    completedAt: new Date().toISOString(),
                    completedBy: currentUser?.fullName || 'Chủ nhà'
                  };
                  const result = saveInventoryBG01(completedRecord);
                  showToast(result.success ? 'success' : 'error', result.message);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold cursor-pointer shadow-xs"
              >
                Lưu kiểm kê hoàn tất </button>

              {/* Bước 4: Tiếp tục ghi hiện trạng  */}
              <button
                disabled={existingInventory?.inventoryStatus !== 'Đã hoàn tất'}
                onClick={() => setActiveTab('condition_bg02')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <span>Tiếp tục ghi hiện trạng </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: GHI NHẬN HIỆN TRẠNG TÀI SẢN 
      ========================================================================= */}
      {selectedRoomCode && !linkedRoomMismatch && targetContract && activeTab === 'condition_bg02' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 text-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                
                <h2 className="text-sm font-bold text-slate-900">Ghi nhận hiện trạng bàn giao</h2>
              </div>
              <p className="text-slate-500 mt-0.5">
                Ghi nhận tình trạng phòng bằng mô tả, ảnh, URL video; chốt công tơ điện nước ngoài hệ thống và ghi nhận kết quả khách kiểm tra (1.04). </p>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                existingInventory?.inventoryStatus === 'Đã hoàn tất' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                Kiểm kê: {existingInventory?.inventoryStatus || 'Chưa kiểm kê'}
              </span>
            </div>
          </div>

          {/* Form ghi nhận hiện trạng */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-emerald-600" />
                <span>1. Mô tả hiện trạng &amp; Bằng chứng (Ảnh/Video)</span>
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Phạm vi ghi nhận <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={condScope}
                    onChange={(e) => setCondScope(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Hiện trạng chung của phòng">Hiện trạng chung của phòng</option>
                    <option value="Tài sản cụ thể">Tài sản cụ thể</option>
                  </select>
                </div>

                {condScope === 'Tài sản cụ thể' && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Tài sản liên quan <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={condAssetName}
                      onChange={(e) => setCondAssetName(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                    >
                      {inventoryItems.map(item => (
                        <option key={item.id} value={item.name}>{item.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mô tả tình trạng thực tế <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={condDesc}
                  onChange={(e) => setCondDesc(e.target.value)}
                  placeholder="Mô tả kỹ hiện trạng màu sơn tường, vết nứt, độ mới của đồ đạc..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                />
              </div>

              {/* Photos & Limits */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-slate-700">
                    Ảnh minh chứng hiện trạng (Tối đa 5MB/ảnh) </label>
                  <span className="text-[10px] text-slate-500">
                    Đã tải {condPhotos.length}/8 ảnh (dành sẵn 2 vị trí cho ảnh công tơ) </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {condPhotos.map((p, idx) => (
                    <div key={idx} className="relative group w-14 h-14 rounded-lg overflow-hidden border border-slate-300">
                      <img src={p} alt="Bằng chứng" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setCondPhotos(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <X className="w- h-" />
                      </button>
                    </div>
                  ))}
                  {condPhotos.length < 8 && (
                    <label className="w-14 h-14 rounded-lg border-2 border-dashed border-slate-300 hover:border-blue-500 flex flex-col items-center justify-center text-slate-400 hover:text-blue-600 transition-colors cursor-pointer">
                      <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                        onChange={e => addEvidenceImage(e, setCondPhotos, 8)} />
                      <Plus className="w-4 h-4" />
                      <span className="text-[9px]">Chọn ảnh</span>
                    </label>
                  )}
                </div>
              </div>

              {/* Video URL HTTP(S) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Đường dẫn video kiểm chứng ngoài (HTTP/HTTPS) </label>
                <input
                  type="url"
                  value={condVideoUrl}
                  onChange={(e) => {
                    const url = e.target.value;
                    setCondVideoUrl(url);
                    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
                      setCondVideoError(': URL video phải có định dạng HTTP hoặc HTTPS hợp lệ.');
                    } else {
                      setCondVideoError(null);
                    }
                  }}
                  placeholder="https://drive.google.com/... hoặc https://youtube.com/..."
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono text-xs"
                />
                {condVideoError ? (
                  <span className="text-[10px] text-red-600 font-semibold block mt-0.5">{condVideoError}</span>
                ) : (
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    * Không upload video trực tiếp. URL đúng cú pháp nhưng chưa kiểm chứng quyền sẽ lưu nhãn "Chưa xác minh". </span>
                )}
              </div>
            </div>

            {/* Bước 1.03 & 1.04: Chốt số công tơ & Khách kiểm tra */}
            <div className="space-y-4">
              {/* Khối Chốt công tơ điện nước (1.03) */}
              <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                  <div className="flex items-center gap-1.5 font-bold text-blue-900">
                    <Zap className="w-4 h-4 text-amber-600" />
                    <span>2. Chốt chỉ số điện nước bàn giao </span>
                  </div>
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">
                    Bắt buộc có 02 ảnh công tơ </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">Mã đồng hồ điện:</label>
                    <input
                      type="text"
                      value={meterElecCode}
                      onChange={(e) => setMeterElecCode(e.target.value)}
                      className="w-full px-2 py-1 border border-slate-300 rounded bg-white font-mono"
                    />
                    <label className="font-semibold text-slate-700 block pt-1">Số điện đầu kỳ (kWh):</label>
                    <input
                      type="number"
                      min="0"
                      value={meterElecKwh}
                      onChange={(e) => setMeterElecKwh(Number(e.target.value))}
                      className="w-full px-2 py-1 border border-slate-300 rounded bg-white font-mono font-bold text-amber-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">Mã đồng hồ nước:</label>
                    <input
                      type="text"
                      value={meterWaterCode}
                      onChange={(e) => setMeterWaterCode(e.target.value)}
                      className="w-full px-2 py-1 border border-slate-300 rounded bg-white font-mono"
                    />
                    <label className="font-semibold text-slate-700 block pt-1">Số nước đầu kỳ (m³):</label>
                    <input
                      type="number"
                      min="0"
                      value={meterWaterM3}
                      onChange={(e) => setMeterWaterM3(Number(e.target.value))}
                      className="w-full px-2 py-1 border border-slate-300 rounded bg-white font-mono font-bold text-blue-800"
                    />
                  </div>
                </div>

                {/* Meter photos (dành sẵn 2 vị trí) */}
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">Ảnh chụp công tơ thực tế đối chứng:</span>
                  <div className="flex items-center gap-2">
                    {meterPhotos.map((m, idx) => (
                      <div key={idx} className="w-16 h-16 rounded border overflow-hidden">
                        <img src={m} alt="Công tơ" className="w-full h-full object-cover" />
                      </div>
                    ))}
                    {meterPhotos.length < 2 && (
                      <label className="px-2 py-1 text-[11px] bg-blue-600 text-white rounded font-medium cursor-pointer">
                        <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                          onChange={e => addEvidenceImage(e, setMeterPhotos, 2)} />
                        + Chọn ảnh công tơ
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* Khối Khách kiểm tra (1.04 & 1.05) */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-900">3. Kết quả khách kiểm tra thực tế </span>
                  <select
                    value={tenantCheckOption}
                    onChange={(e) => setTenantCheckOption(e.target.value as any)}
                    className="px-2 py-0.5 border border-slate-300 rounded font-semibold text-slate-800 bg-white"
                  >
                    <option value="Không cần bổ sung">Không cần bổ sung</option>
                    <option value="Có bổ sung">Có bổ sung</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1">Ghi chú đối chiếu thực tế của khách:</label>
                  <input
                    type="text"
                    value={tenantCheckNote}
                    onChange={(e) => setTenantCheckNote(e.target.value)}
                    className="w-full px-2.5 py-1 border border-slate-300 rounded bg-white"
                  />
                </div>

                {tenantCheckOption === 'Có bổ sung' && (
                  <div>
                    <label className="block text-amber-800 font-semibold mb-1">Nội dung khách yêu cầu bổ sung:</label>
                    <textarea
                      rows={2}
                      value={supplementNote}
                      onChange={(e) => setSupplementNote(e.target.value)}
                      placeholder="Ghi rõ yêu cầu sửa chữa, vệ sinh lại hoặc bổ sung thêm đồ đạc..."
                      className="w-full px-2.5 py-1 border border-amber-300 rounded bg-amber-50/50"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <button
              onClick={() => setActiveTab('inventory_bg01')}
              className="px- py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium cursor-pointer"
            >
              &larr; Quay lại kiểm kê </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const cond: HandoverCondition = {
                    id: existingCondition?.id || 'hc_' + selectedRoomCode.replace(/\D/g, '') + '_' + Date.now().toString().slice(-4),
                    roomCode: selectedRoomCode,
                    expectedBatchCode: existingInventory?.expectedBatchCode || 'DOT-2026-K10',
                    linkedContractId: targetContract?.id,
                    linkedLeaseId: selectedLeaseId,
                    status: 'Nháp',
                    scope: condScope,
                    assetName: condScope === 'Tài sản cụ thể' ? condAssetName : undefined,
                    description: condDesc,
                    photos: condPhotos,
                    videoUrl: condVideoUrl,
                    evidenceStatus: condPhotos.length > 0 ? 'Đã đính kèm' : 'Chưa đính kèm',
                    initialElectricityKwh: meterElecKwh,
                    initialWaterM3: meterWaterM3,
                    meterElectricCode: meterElecCode,
                    meterWaterCode: meterWaterCode,
                    meterPhotos: meterPhotos,
                    tenantChecked: true,
                    tenantCheckNote,
                    tenantCheckSupplement: tenantCheckOption,
                    supplementNote,
                    handoverDoneAt: new Date().toISOString(),
                    loggedBy: currentUser?.fullName || 'Chủ nhà',
                    version: existingCondition ? existingCondition.version + 1 : 1
                  };
                  const result = saveHandoverConditionBG02(cond);
                  showToast(result.success ? 'info' : 'error', result.message);
                }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold cursor-pointer"
              >
                Lưu nháp hiện trạng </button>

              <button
                onClick={() => {
                  if (!condDesc.trim()) {
                    showToast('error', 'Vui lòng nhập mô tả tình trạng thực tế.');
                    return;
                  }
                  if (condVideoError) {
                    showToast('error', condVideoError);
                    return;
                  }
                  const cond: HandoverCondition = {
                    id: existingCondition?.id || 'hc_' + selectedRoomCode.replace(/\D/g, '') + '_' + Date.now().toString().slice(-4),
                    roomCode: selectedRoomCode,
                    expectedBatchCode: existingInventory?.expectedBatchCode || 'DOT-2026-K10',
                    linkedContractId: targetContract?.id,
                    linkedLeaseId: selectedLeaseId,
                    status: existingInventory?.inventoryStatus === 'Đã hoàn tất' ? 'Đã hoàn tất' : 'Nháp',
                    scope: condScope,
                    assetName: condScope === 'Tài sản cụ thể' ? condAssetName : undefined,
                    description: condDesc,
                    photos: condPhotos,
                    videoUrl: condVideoUrl,
                    evidenceStatus: condVideoUrl && !condVideoError ? 'Chưa xác minh' : (condPhotos.length > 0 ? 'Đã đính kèm' : 'Chưa đính kèm'),
                    initialElectricityKwh: meterElecKwh,
                    initialWaterM3: meterWaterM3,
                    meterElectricCode: meterElecCode,
                    meterWaterCode: meterWaterCode,
                    meterPhotos: meterPhotos,
                    tenantChecked: true,
                    tenantCheckNote,
                    tenantCheckSupplement: tenantCheckOption,
                    supplementNote,
                    handoverDoneAt: new Date().toISOString(),
                    loggedBy: currentUser?.fullName || 'Chủ nhà',
                    version: existingCondition ? existingCondition.version + 1 : 1
                  };
                  const result = saveHandoverConditionBG02(cond);
                  showToast(result.success ? 'success' : 'error', result.message);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold cursor-pointer shadow-xs"
              >
                Lưu hiện trạng bàn giao </button>

              <button
                disabled={!existingCondition || existingCondition.status !== 'Đã hoàn tất'}
                onClick={() => setActiveTab('handover_bg03')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <span>Lập biên bản nhận phòng </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: LẬP BIÊN BẢN NHẬN PHÒNG 
      ========================================================================= */}
      {selectedRoomCode && !linkedRoomMismatch && targetContract && activeTab === 'handover_bg03' && (() => {
        // Evaluate Mandatory Prerequisites for 1.06 Lưu Đã lập
        const cond1ContractValid = Boolean(targetContract && (targetContract.status === 'Hiệu lực' || targetContract.isSignedPaper));
        const cond2DepositPaid = Boolean(currentInitialPayment && currentInitialPayment.depositAmount >= targetContract!.depositAmount && targetContract!.depositAmount > 0);
        const cond3FirstRentPaid = Boolean(currentInitialPayment && currentInitialPayment.firstMonthRentAmount >= targetContract!.firstMonthRentAmount && targetContract!.firstMonthRentAmount > 0);
        const cond4InventoryReady = Boolean(existingInventory?.inventoryStatus === 'Đã hoàn tất' &&
          existingInventory?.linkedLeaseId === selectedLeaseId && existingInventory?.linkedContractId === targetContract?.id);
        const cond5MetersReady = Boolean(existingCondition && existingCondition.linkedLeaseId === selectedLeaseId &&
          existingCondition.linkedContractId === targetContract?.id && existingCondition.status === 'Đã hoàn tất' &&
          existingCondition.meterPhotos.length > 0 && existingCondition.initialElectricityKwh >= 0 && existingCondition.initialWaterM3 >= 0);

        const canSaveOfficially106 = !isInheritedReceiveReport && targetContract?.contractType !== 'Hợp đồng nối tiếp' && cond1ContractValid && cond2DepositPaid && cond3FirstRentPaid && cond4InventoryReady && cond5MetersReady;

        return (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 text-xs">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  
                  <h2 className="text-sm font-bold text-slate-900">Biên bản bàn giao nhận phòng</h2>
                </div>
                <p className="text-slate-500 mt-0.5">
                  Lập biên bản nhận phòng từ kết quả kiểm kê và chốt công tơ thực tế. Hai bên ký giấy ngoài hệ thống. Toàn bộ biên bản chỉ có 3 trạng thái: Nháp / Đã lập / Đã xác nhận. </p>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Trạng thái biên bản:</span>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                  existingReport?.status === 'Đã xác nhận' ? 'bg-emerald-100 text-emerald-800' :
                  existingReport?.status === 'Đã lập' ? 'bg-blue-100 text-blue-800' :
                  'bg-slate-200 text-slate-700'
                }`}>
                  {existingReport?.status || 'Chưa lập'}
                </span>
              </div>
            </div>

            {/* Khối kiểm tra điều kiện tiên quyết bắt buộc (Thao tác thực hiện) */}
            <div className="p- bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="font-bold text-slate-800 text-[11px] block uppercase tracking-wider">
                Khối điều kiện bắt buộc để Lưu Đã lập (1.06) &amp; Bắt đầu bàn giao thực tế: </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-[11px]">
                <div className={`p-2 rounded border flex items-center justify-between ${cond1ContractValid ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>
                  <span>1. HĐ đã ký &amp; hiệu lực</span>
                  <strong>{cond1ContractValid ? 'Đạt' : 'Chưa đạt'}</strong>
                </div>
                <div className={`p-2 rounded border flex items-center justify-between ${cond2DepositPaid ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>
                  <span>2. Đã thu cọc 1 tháng </span>
                  <strong>{cond2DepositPaid ? 'Đạt' : 'Chưa đạt'}</strong>
                </div>
                <div className={`p-2 rounded border flex items-center justify-between ${cond3FirstRentPaid ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>
                  <span>3. Thu thuê kỳ đầu 1 tháng</span>
                  <strong>{cond3FirstRentPaid ? 'Đạt' : 'Chưa đạt'}</strong>
                </div>
                <div className={`p-2 rounded border flex items-center justify-between ${cond4InventoryReady ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>
                  <span>4. Hoàn tất &amp; Liên kết</span>
                  <strong>{cond4InventoryReady ? 'Đạt' : 'Chưa đạt'}</strong>
                </div>
                <div className={`p-2 rounded border flex items-center justify-between ${cond5MetersReady ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>
                  <span>5. Số đọc/Ảnh công tơ</span>
                  <strong>{cond5MetersReady ? 'Đạt' : 'Chưa đạt'}</strong>
                </div>
              </div>
              {!canSaveOfficially106 && (
                <div className="p-2 bg-amber-50 border border-amber-200 rounded text-amber-900 text-[11px]">
                  ⚠️ <strong>Chưa đủ điều kiện bắt buộc:</strong> Chỉ cho phép <em>Xem trước / Lưu nháp</em> hồ sơ chuẩn bị. Khóa quyền Lưu Đã lập ở và bàn giao nhận phòng cho đến khi đủ tất cả 5 điều kiện. </div>
              )}
            </div>

            {/* Xem trước nội dung Biên bản bàn giao (Bản giấy chuẩn bị ngoài hệ thống -  & 09) */}
            <div className="p-5 border-2 border-slate-300 rounded-2xl bg-white shadow-xs space-y-4">
              <div className="text-center space-y-1 border-b border-slate-200 pb-3">
                <h3 className="font-bold text-slate-900 text-sm uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h3>
                <p className="text-[11px] text-slate-600 font-medium">Độc lập - Tự do - Hạnh phúc</p>
                <h4 className="font-bold text-slate-900 text-base pt-2">BIÊN BẢN BÀN GIAO NHẬN PHÒNG &amp; TÀI SẢN</h4>
                <div className="flex justify-center items-center gap-3 text-[11px] font-mono text-slate-500">
                  <span>Số BB: <strong>{existingReport?.reportNumber || (targetContract ? 'BB-' + selectedRoomCode.replace(/\W/g, '') + '-' + targetContract.leaseId.replace(/\W/g, '') : 'Chưa lập biên bản')}</strong></span>
                  <span>·</span>
                  <span>Mã HĐ biên bản: <strong>{existingReport?.contractId || targetContract?.id || 'Chưa có hợp đồng'}</strong></span>
                  <span>·</span>
                  <span>Phiên bản nội dung: <strong>v{existingReport?.version || 1}</strong></span>
                </div>
              </div>

              {/* Bên giao và Bên nhận */}
              <div className="grid grid-cols-2 gap-4 text-[11px] p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="font-bold text-slate-900 block mb-1">BÊN GIAO (Đại diện Quản lý/Chủ nhà):</span>
                  <div>Họ tên: <strong>{existingReport?.giverName || currentUser?.fullName || 'Chủ nhà'}</strong></div>
                  <div>Điện thoại: <strong>{targetContract?.lessorPhone || 'Chưa có dữ liệu'}</strong></div>
                </div>
                <div>
                  <span className="font-bold text-slate-900 block mb-1">BÊN NHẬN (Khách thuê phòng {selectedRoom.roomCode}):</span>
                  <div>Họ tên: <strong>{existingReport?.receiverName || targetContract?.tenantName || selectedRoom.currentTenantName || 'Chưa có thông tin khách'}</strong></div>
                  <div>CCCD: <strong>{targetContract?.tenantIdNumber || matchingTenant?.idNumber || 'Chưa có dữ liệu'}</strong></div>
                </div>
              </div>

              {/* Chỉ số công tơ điện nước chỉ đọc từ 1.03 */}
              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1.5 text-[11px]">
                <span className="font-bold text-slate-900 block">CHỈ SỐ CÔNG TƠ KHI BÀN GIAO (CHỈ XEM):</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>Mã ĐH Điện: <strong className="font-mono">{meterElecCode}</strong></div>
                  <div>Chỉ số điện: <strong className="font-mono text-amber-800">{meterElecKwh} kWh</strong></div>
                  <div>Mã ĐH Nước: <strong className="font-mono">{meterWaterCode}</strong></div>
                  <div>Chỉ số nước: <strong className="font-mono text-blue-800">{meterWaterM3} m³</strong></div>
                </div>
              </div>

              {/* Bảng danh sách tài sản */}
              <div>
                <span className="font-bold text-slate-900 block mb-1.5 text-[11px]">DANH MỤC TRANG THIẾT BỊ BÀN GIAO:</span>
                <table className="w-full text-left text-[11px] border border-slate-200">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="p-1.5 border">Tên tài sản</th>
                      <th className="p-1.5 border">ĐVT</th>
                      <th className="p-1.5 border text-center">SL Thực nhận</th>
                      <th className="p-1.5 border">Tình trạng vật lý</th>
                      <th className="p-1.5 border">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryItems.map((itm) => (
                      <tr key={itm.id} className="border-b">
                        <td className="p-1.5 border font-medium">{itm.name}</td>
                        <td className="p-1.5 border">{itm.unit}</td>
                        <td className="p-1.5 border font-mono font-bold text-center">{itm.actualQuantity}</td>
                        <td className="p-1.5 border">{itm.physicalCondition}</td>
                        <td className="p-1.5 border text-slate-500">{itm.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Vị trí chữ ký tay trên bản giấy */}
              <div className="pt-4 border-t border-slate-200 grid grid-cols-2 text-center text-[11px]">
                <div className="space-y-1">
                  <span className="font-bold text-slate-800 block">ĐẠI DIỆN KHÁCH THUÊ</span>
                  <span className="text-slate-400 italic block">(Ký và ghi rõ họ tên trên bản giấy)</span>
                  <div className="h-16 flex items-center justify-center font-serif text-slate-600">
                    {existingReport?.tenantSignedPaper === 'Đã ký giấy' ? '✓ Đã ký bản giấy' : '[Chờ ký tay ngoài hệ thống]'}
                  </div>
                  <strong>{existingReport?.receiverName || targetContract?.tenantName || selectedRoom.currentTenantName || 'Chưa có thông tin khách'}</strong>
                </div>

                <div className="space-y-1">
                  <span className="font-bold text-slate-800 block">ĐẠI DIỆN CHỦ NHÀ / QUẢN LÝ</span>
                  <span className="text-slate-400 italic block">(Ký và ghi rõ họ tên trên bản giấy)</span>
                  <div className="h-16 flex items-center justify-center font-serif text-slate-600">
                    {existingReport?.ownerSignedPaper === 'Đã ký giấy' ? '✓ Đã ký bản giấy' : '[Chờ ký tay ngoài hệ thống]'}
                  </div>
                  <strong>{existingReport?.giverName || currentUser?.fullName || 'Chủ nhà'}</strong>
                </div>
              </div>

              <div className="p-2 bg-slate-50 border border-slate-200 rounded text-center text-[10px] text-slate-500">
                * Phần mềm không có nút In, Xuất để in hoặc ký điện tử. User chuẩn bị bản giấy ngoài hệ thống theo đúng thông tin đã ghi nhận. </div>
            </div>

            {/* Action Buttons for BG03 */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setActiveTab('condition_bg02')}
                className="px- py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium cursor-pointer"
              >
                &larr; Sửa hiện trạng </button>

              <div className="flex items-center gap-2">
                {/* Lưu nháp biên bản */}
                <button
                  onClick={() => {
                    if (!targetContract || !targetContract.isSignedPaper) {
                      showToast('error', 'Chưa có hợp đồng đã ký đúng phòng và lần thuê. Không thể lập biên bản nhận phòng.');
                      return;
                    }
                    const draft: HandoverReport = {
                      id: existingReport?.id || 'bb_' + selectedRoomCode.replace(/\W/g, '_') + '_' + targetContract!.leaseId.replace(/\W/g, '_'),
                      reportNumber: existingReport?.reportNumber || 'BB-' + selectedRoomCode.replace(/\W/g, '') + '-' + targetContract!.leaseId.replace(/\W/g, ''),
                      roomCode: selectedRoomCode,
                      contractId: targetContract!.id,
                      leaseId: targetContract!.leaseId,
                      date: new Date().toISOString().substring(0, 10),
                      giverName: currentUser?.fullName || 'Chủ nhà',
                      receiverName: targetContract!.tenantName,
                      status: 'Nháp',
                      tenantSignedPaper: 'Chưa ký',
                      ownerSignedPaper: 'Chưa ký',
                      version: (existingReport?.version || 1),
                      createdAt: new Date().toISOString(),
                      initialElectricityKwh: meterElecKwh,
                      initialWaterM3: meterWaterM3
                    };
                    const res = saveHandoverReportBG03(draft);
                    showToast(res.success ? 'success' : 'error', res.message);
                  }}
                  disabled={isInheritedReceiveReport || targetContract?.contractType === 'Hợp đồng nối tiếp' || existingReport?.status === 'Đã xác nhận'}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Lưu nháp biên bản </button>

                {/* Bước 5: Lưu Đã lập (1.06) */}
                <button
                  disabled={!canSaveOfficially106 || isInheritedReceiveReport || existingReport?.status === 'Đã xác nhận'}
                  onClick={() => {
                    if (!targetContract || !canSaveOfficially106) {
                      showToast('error', 'Chưa có hợp đồng hợp lệ hoặc chưa đủ điều kiện để lưu biên bản.');
                      return;
                    }
                    const officialReport: HandoverReport = {
                      id: existingReport?.id || 'bb_' + selectedRoomCode.replace(/\W/g, '_') + '_' + targetContract!.leaseId.replace(/\W/g, '_'),
                      reportNumber: existingReport?.reportNumber || 'BB-' + selectedRoomCode.replace(/\W/g, '') + '-' + targetContract!.leaseId.replace(/\W/g, ''),
                      roomCode: selectedRoomCode,
                      contractId: targetContract!.id,
                      leaseId: targetContract!.leaseId,
                      date: new Date().toISOString().substring(0, 10),
                      giverName: currentUser?.fullName || 'Chủ nhà',
                      receiverName: targetContract!.tenantName,
                      status: 'Đã lập',
                      tenantSignedPaper: existingReport?.tenantSignedPaper || 'Chưa ký',
                      ownerSignedPaper: existingReport?.ownerSignedPaper || 'Chưa ký',
                      version: (existingReport?.version || 1),
                      createdAt: new Date().toISOString(),
                      initialElectricityKwh: meterElecKwh,
                      initialWaterM3: meterWaterM3
                    };
                    const res = saveHandoverReportBG03(officialReport);
                    showToast(res.success ? 'success' : 'error', res.message);
                  }}
                  className={`px-4 py-2 rounded-lg font-semibold cursor-pointer shadow-xs ${
                    canSaveOfficially106
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  Lưu Đã lập </button>

                {/* Ghi nhận kết quả ký giấy (Bước 7) */}
                <button
                  disabled={!existingReport || isInheritedReceiveReport || existingReport.status !== 'Đã lập'}
                  onClick={() => setShowSignPaperModal(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <FileSignature className="w-4 h-4" />
                  <span>Ghi nhận ký giấy (1.07 &amp; 1.08)</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* =========================================================================
          TAB 4: GHI NHẬN SỰ CỐ TÀI SẢN 
      ========================================================================= */}
      {selectedRoomCode && !linkedRoomMismatch && targetContract && activeTab === 'incident_add_bg04' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 text-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                
                <h2 className="text-sm font-bold text-slate-900">Ghi nhận sự cố &amp; Hư hỏng tài sản trong thời gian thuê</h2>
              </div>
              <p className="text-slate-500 mt-0.5">
                Chỉ ghi nhận thông tin tường thuật diễn biến thực tế do User cung cấp. KHÔNG xử lý thu tiền, không tạo khoản phải thu hay trừ cọc. </p>
            </div>

            <button
              onClick={() => setActiveTab('incident_search_bg05')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Search className="w- h-" />
              <span>Tra cứu lịch sử sự cố </span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cột trái: Thông tin cơ bản */}
            <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Phạm vi sự cố <span className="text-red-500">*</span>
                </label>
                <select
                  value={incScope}
                  onChange={(e) => setIncScope(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Tài sản cụ thể">Tài sản cụ thể</option>
                  <option value="Hiện trạng chung">Hiện trạng chung của phòng</option>
                </select>
              </div>

              {incScope === 'Tài sản cụ thể' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tài sản liên quan <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={incAsset}
                    onChange={(e) => setIncAsset(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-medium"
                  >
                    {standardAssets.map(a => (
                      <option key={a.id} value={a.name}>{a.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mô tả sự cố &amp; Diễn biến thực tế <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={incDesc}
                  onChange={(e) => setIncDesc(e.target.value)}
                  placeholder="Mô tả cụ thể hiện tượng hư hỏng, chập điện, vỡ kính, rò rỉ nước..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Xác định nguyên nhân/trách nhiệm</label>
                  <select
                    value={incRespStatus}
                    onChange={(e) => setIncRespStatus(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-medium"
                  >
                    <option value="Chưa xác định">Chưa xác định</option>
                    <option value="Đã xác định">Đã xác định</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tình trạng xử lý</label>
                  <select
                    value={incProcessingStatus}
                    onChange={(e) => setIncProcessingStatus(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-medium"
                  >
                    <option value="Chưa xử lý">Chưa xử lý</option>
                    <option value="Đang xử lý">Đang xử lý</option>
                    <option value="Đã xử lý">Đã xử lý</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nguyên nhân sơ bộ (nếu biết)</label>
                <input
                  type="text"
                  value={incCause}
                  onChange={(e) => setIncCause(e.target.value)}
                  placeholder="Ví dụ: Chập điện lưới, hao mòn tự nhiên, sơ suất của khách..."
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>

            {/* Cột phải: Phương án xử lý & Bằng chứng tham khảo */}
            <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phương án xử lý kỹ thuật</label>
                <input
                  type="text"
                  value={incSolutionPlan}
                  onChange={(e) => setIncSolutionPlan(e.target.value)}
                  placeholder="Ví dụ: Gọi thợ bảo trì thay tụ điện, thay vòi nước mới..."
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kết quả xử lý thực tế</label>
                <input
                  type="text"
                  value={incActualResult}
                  onChange={(e) => setIncActualResult(e.target.value)}
                  placeholder="Ví dụ: Đã sửa xong ngày 14/10/2026, thiết bị chạy êm..."
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              {/* Thông tin tham khảo tài chính */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900 text-[11px]">Thông tin chi phí tham khảo:</span>
                  <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-mono font-bold">
                    Do User cung cấp – chưa xác minh độc lập </span>
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Chi phí ước tính trao đổi (nếu có, đ):</label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={incEstimatedCost}
                    onChange={(e) => setIncEstimatedCost(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono font-bold text-blue-700"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    * Không biến số tiền này thành khoản phải thu hay lệnh khấu trừ cọc. </span>
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Ghi chú khách đã thanh toán ngoài (nếu có):</label>
                  <input
                    type="text"
                    value={incExternalPaymentNote}
                    onChange={(e) => setIncExternalPaymentNote(e.target.value)}
                    placeholder="Ví dụ: Khách đã tự trả tiền thợ 150.000đ trực tiếp..."
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                  />
                </div>
              </div>

              {/* URL video hoặc ảnh đính kèm */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Liên kết video kiểm chứng ngoài (nếu có)</label>
                <input
                  type="url"
                  value={incVideoUrl}
                  onChange={(e) => setIncVideoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono text-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => {
                if (!incDesc.trim()) {
                  showToast('error', ': Mô tả sự cố là trường bắt buộc.');
                  return;
                }
                const newIncident: AssetIncident = {
                  id: 'inc_' + Date.now(),
                  roomCode: selectedRoomCode,
                  leaseId: targetContract?.leaseId || '',
                  scope: incScope,
                  assetName: incScope === 'Tài sản cụ thể' ? incAsset : undefined,
                  occurredAt: new Date().toISOString(),
                  description: incDesc,
                  cause: incCause || 'Chưa xác định',
                  responsibilityStatus: incRespStatus,
                  responsibilityNote: incRespNote,
                  processingStatus: incProcessingStatus,
                  solutionPlan: incSolutionPlan,
                  actualResult: incActualResult,
                  estimatedCompensation: incEstimatedCost,
                  tenantPaidExternallyNote: incExternalPaymentNote ? incExternalPaymentNote + ' (Do User cung cấp – chưa xác minh độc lập)' : undefined,
                  photos: incPhotos,
                  videoUrl: incVideoUrl,
                  loggedBy: currentUser?.fullName || 'Chủ nhà',
                  loggedAt: new Date().toISOString()
                };
                const saved = recordIncidentBG04(newIncident);
                if (!saved.success) { showToast('error', saved.message); return; }
                showToast('success', saved.message);
                setIncDesc('');
                setIncCause('');
                setIncSolutionPlan('');
                setIncActualResult('');
                setIncEstimatedCost(0);
                setIncExternalPaymentNote('');
              }}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold cursor-pointer shadow-xs"
            >
              Lưu sự cố tài sản </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: TRA CỨU LỊCH SỬ SỰ CỐ TÀI SẢN 
      ========================================================================= */}
      {selectedRoomCode && !linkedRoomMismatch && targetContract && activeTab === 'incident_search_bg05' && (() => {
        // Filter incidents according to room and criteria
        const roomIncidents = incidents.filter(i => {
          if (i.roomCode !== selectedRoomCode || (selectedLeaseId && i.leaseId !== selectedLeaseId)) return false;
          if (bg05FilterAsset !== 'Tất cả' && i.assetName !== bg05FilterAsset) return false;
          if (bg05FilterStatus !== 'Tất cả' && i.processingStatus !== bg05FilterStatus) return false;
          if (bg05FilterStartDate && i.occurredAt < bg05FilterStartDate) return false;
          if (bg05FilterEndDate && i.occurredAt > bg05FilterEndDate) return false;
          if (bg05SearchKeyword) {
            const kw = bg05SearchKeyword.toLowerCase();
            const matchDesc = i.description.toLowerCase().includes(kw);
            const matchCause = i.cause?.toLowerCase().includes(kw);
            if (!matchDesc && !matchCause) return false;
          }
          return true;
        });

        return (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 text-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  
                  <h2 className="text-sm font-bold text-slate-900">Tra cứu lịch sử sự cố tài sản: Phòng {selectedRoomCode}</h2>
                </div>
                <p className="text-slate-500 mt-0.5">
                  Tra cứu các sự cố đã phát sinh trong thời gian thuê để làm căn cứ đối chiếu khi trả phòng. Dữ liệu chỉ đọc. </p>
              </div>


            </div>

            {/* Filter Bar (Giao diện mục 2) */}
            <div className="p- bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Tài sản:</span>
                <select
                  value={bg05FilterAsset}
                  onChange={(e) => setBg05FilterAsset(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                >
                  <option value="Tất cả">Tất cả tài sản</option>
                  {standardAssets.map(a => (
                    <option key={a.id} value={a.name}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Trạng thái:</span>
                <select
                  value={bg05FilterStatus}
                  onChange={(e) => setBg05FilterStatus(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                >
                  <option value="Tất cả">Tất cả trạng thái</option>
                  <option value="Chưa xử lý">Chưa xử lý</option>
                  <option value="Đang xử lý">Đang xử lý</option>
                  <option value="Đã xử lý">Đã xử lý</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Từ ngày:</span>
                <input
                  type="date"
                  value={bg05FilterStartDate}
                  onChange={(e) => setBg05FilterStartDate(e.target.value)}
                  className="px-2 py-1 border border-slate-300 rounded bg-white font-mono"
                />
                <span className="font-semibold text-slate-700">Đến:</span>
                <input
                  type="date"
                  value={bg05FilterEndDate}
                  onChange={(e) => setBg05FilterEndDate(e.target.value)}
                  className="px-2 py-1 border border-slate-300 rounded bg-white font-mono"
                />
              </div>

              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Tìm theo mô tả / nguyên nhân..."
                  value={bg05SearchKeyword}
                  onChange={(e) => setBg05SearchKeyword(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white"
                />
              </div>

              {(bg05FilterAsset !== 'Tất cả' || bg05FilterStatus !== 'Tất cả' || bg05FilterStartDate || bg05FilterEndDate || bg05SearchKeyword) && (
                <button
                  onClick={() => {
                    setBg05FilterAsset('Tất cả');
                    setBg05FilterStatus('Tất cả');
                    setBg05FilterStartDate('');
                    setBg05FilterEndDate('');
                    setBg05SearchKeyword('');
                  }}
                  className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                >
                  Xóa bộ lọc </button>
              )}
            </div>

            {/* Bảng danh sách sự cố (Giao diện mục 3) */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[11px]">
                    <th className="py-2.5 px-3">Thời điểm</th>
                    <th className="py-2.5 px-3">Tài sản / Phạm vi</th>
                    <th className="py-2.5 px-3">Mô tả sự cố</th>
                    <th className="py-2.5 px-3">Nguyên nhân</th>
                    <th className="py-2.5 px-3">Tình trạng xử lý</th>
                    <th className="py-2.5 px-3">Chi phí tham khảo</th>
                    <th className="py-2.5 px-3 text-right">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {roomIncidents.map((inc) => (
                    <tr key={inc.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-slate-600">
                        {inc.occurredAt.replace('T', ' ').substring(0, 16)}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {inc.assetName || inc.scope}
                      </td>
                      <td className="py-2.5 px-3 max-w-[240px] truncate text-slate-700" title={inc.description}>
                        {inc.description}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{inc.cause || 'Chưa rõ'}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          inc.processingStatus === 'Đã xử lý' ? 'bg-emerald-100 text-emerald-800' :
                          inc.processingStatus === 'Đang xử lý' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-200 text-slate-700'
                        }`}>
                          {inc.processingStatus}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">
                        {inc.estimatedCompensation ? inc.estimatedCompensation.toLocaleString('vi-VN') + ' đ' : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => setSelectedIncidentDetail(inc)}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-[11px] font-semibold cursor-pointer"
                        >
                          Xem chi tiết </button>
                      </td>
                    </tr>
                  ))}
                  {roomIncidents.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                        Không có sự cố nào phù hợp với bộ lọc trong phòng {selectedRoomCode}. </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal xem chi tiết sự cố (Thao tác thực hiện) */}
            {selectedIncidentDetail && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <AlertOctagon className="w-5 h-5 text-amber-600" />
                      <h3 className="font-bold text-slate-900 text-sm">
                        Chi tiết sự cố: {selectedIncidentDetail.assetName || selectedIncidentDetail.scope}
                      </h3>
                    </div>
                    <button
                      onClick={() => setSelectedIncidentDetail(null)}
                      className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-2 text-slate-700 bg-slate-50 p- rounded-xl border border-slate-200">
                    <div>Thời điểm phát sinh: <strong className="font-mono">{selectedIncidentDetail.occurredAt.replace('T', ' ')}</strong></div>
                    <div>Phòng / Lần thuê: <strong className="font-mono">{selectedIncidentDetail.roomCode} ({selectedIncidentDetail.leaseId})</strong></div>
                    <div>Mô tả: <p className="font-medium text-slate-900 mt-0.5">{selectedIncidentDetail.description}</p></div>
                    <div>Nguyên nhân: <strong>{selectedIncidentDetail.cause}</strong></div>
                    <div>Trách nhiệm: <strong>{selectedIncidentDetail.responsibilityStatus}</strong> {selectedIncidentDetail.responsibilityNote ? `(${selectedIncidentDetail.responsibilityNote})` : ''}</div>
                    <div>Phương án xử lý: <strong>{selectedIncidentDetail.solutionPlan || 'Chưa cập nhật'}</strong></div>
                    <div>Kết quả thực tế: <strong>{selectedIncidentDetail.actualResult || 'Đang theo dõi'}</strong></div>
                    {selectedIncidentDetail.estimatedCompensation ? (
                      <div>Chi phí tham khảo: <strong className="font-mono text-blue-700">{selectedIncidentDetail.estimatedCompensation.toLocaleString('vi-VN')} đ</strong> (Do User cung cấp – chưa xác minh độc lập)</div>
                    ) : null}
                    {selectedIncidentDetail.tenantPaidExternallyNote && (
                      <div className="p-2 bg-amber-100/60 rounded text-amber-900 font-medium">
                        {selectedIncidentDetail.tenantPaidExternallyNote}
                      </div>
                    )}
                    <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200">
                      Người ghi nhận: {selectedIncidentDetail.loggedBy} · Lúc: {selectedIncidentDetail.loggedAt.replace('T', ' ')}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <button
                      onClick={() => {
                        setSelectedIncidentDetail(null);
                        setActiveTab('compare_bg06');
                      }}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded font-semibold cursor-pointer"
                    >
                      &larr; Quay lại đối chiếu </button>
                    <button
                      onClick={() => setSelectedIncidentDetail(null)}
                      className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-medium cursor-pointer"
                    >
                      Đóng </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* =========================================================================
          TAB 6: ĐỐI CHIẾU TÀI SẢN KHI TRẢ PHÒNG 
      ========================================================================= */}
      {selectedRoomCode && !linkedRoomMismatch && targetContract && activeTab === 'compare_bg06' && (() => {
        // Evaluate Prerequisites for 
        const step305Confirmed = Boolean(returnInspectionTarget?.step305Confirmed);
        const reportConfirmedBG03 = Boolean(existingReport && existingReport.status === 'Đã xác nhận');

        const canPerformOfficialComparison = step305Confirmed && reportConfirmedBG03;

        return (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 text-xs">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  
                  <h2 className="text-sm font-bold text-slate-900">Đối chiếu tài sản khi trả phòng: {selectedRoomCode}</h2>
                </div>
                <p className="text-slate-500 mt-0.5">
                  So sánh tài sản thực tế lúc khách trả phòng với biên bản nhận phòng đã ký để phát hiện thiếu hụt, hư hỏng hoặc khác biệt. </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('incident_search_bg05')}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Search className="w- h-" />
                  <span>Xem lịch sử sự cố </span>
                </button>
              </div>
            </div>

            {/* Thông tin đầu trang & Điều kiện tiên quyết (Giao diện mục 2 & 7) */}
            <div className="p- bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 md:grid-cols-4 gap-3 text-slate-700">
              <div>
                <span className="text-slate-500 block text-[11px]">Mã phòng / Lần thuê:</span>
                <strong className="font-mono text-slate-900">{selectedRoom.roomCode} ({selectedRoom.currentLeaseId || 'THUE-' + selectedRoom.roomCode})</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Biên bản nhận phòng:</span>
                <span className={`font-semibold ${reportConfirmedBG03 ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {existingReport?.reportNumber || 'Chưa có'} · {reportConfirmedBG03 ? 'Đã xác nhận' : 'Chưa đủ chữ ký'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Xác nhận nhận lại:</span>
                <span className={`font-semibold ${step305Confirmed ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {step305Confirmed ? 'Đã xác nhận nhận lại' : 'Chưa xác nhận '}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Điện / Nước lúc nhận:</span>
                <span className="font-mono font-bold text-slate-800">
                  {existingReport?.initialElectricityKwh || 1250} kWh · {existingReport?.initialWaterM3 || 45} m³ </span>
              </div>
            </div>

            {/* Warning if  or BG03 unconfirmed */}
            {!canPerformOfficialComparison && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Điều kiện đối chiếu chính thức chưa đạt:</span>
                </div>
                <p>
                  Chỉ thực hiện đối chiếu tài sản sau khi <strong>Chủ nhà xác nhận Đã nhận lại tại /</strong> và <strong>Biên bản nhận phòng đã được hai bên ký tay (Đã xác nhận)</strong>. {!step305Confirmed && ' Hiện tại phòng chưa hoàn tất xác nhận .'}
                  {!reportConfirmedBG03 && ' Biên bản nhận phòng BG03 chưa có đủ 2 chữ ký tay xác nhận.'}
                  {' '}Hệ thống chỉ cho phép xem/kiểm tra sơ bộ, <strong>khóa nút Lưu đối chiếu hoàn tất</strong>. </p>
              </div>
            )}

            {/* Comparison Table (Giao diện mục 3) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                  Bảng đối chiếu tình trạng tài sản nhận &amp; trả (Comparison Table): </span>
                <button
                  onClick={() => {
                    // Populate comparison items from inventory and return inspection
                    const items = inventoryItems.map(itm => {
                      const retItm = returnInspectionTarget?.items.find((r: { name: string; quantity: number; condition: string }) => r.name === itm.name);
                      const qtyReturn = retItm ? retItm.quantity : itm.actualQuantity;
                      const condReturn = retItm ? retItm.condition : itm.physicalCondition;
                      const isMatch = itm.actualQuantity === qtyReturn && itm.physicalCondition === condReturn;
                      return {
                        assetName: itm.name,
                        qtyReceive: itm.actualQuantity,
                        qtyReturn,
                        condReceive: itm.physicalCondition,
                        condReturn,
                        diffResult: isMatch ? ('Đúng như bàn giao' as const) : ('Khác biệt' as const),
                        diffNote: isMatch ? 'Số lượng và tình trạng khớp với biên bản nhận phòng' : 'Có chênh lệch cần kiểm tra'
                      };
                    });
                    setComparisonItems(items);
                    showToast('success', "Đã tự động lấy dữ liệu và so sánh với biên bản nhận phòng!");
                  }}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w- h-" />
                  <span>So sánh với biên bản nhận phòng</span>
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[11px]">
                      <th className="py-2.5 px-3">Tài sản / Thiết bị</th>
                      <th className="py-2.5 px-3 text-center">SL Nhận</th>
                      <th className="py-2.5 px-3 text-center">SL Trả</th>
                      <th className="py-2.5 px-3">Tình trạng lúc nhận</th>
                      <th className="py-2.5 px-3">Tình trạng lúc trả</th>
                      <th className="py-2.5 px-3">Kết quả đối chiếu</th>
                      <th className="py-2.5 px-3">Ghi chú chênh lệch / Bằng chứng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {(comparisonItems.length > 0 ? comparisonItems : inventoryItems.map(itm => ({
                      assetName: itm.name,
                      qtyReceive: itm.actualQuantity,
                      qtyReturn: itm.actualQuantity,
                      condReceive: itm.physicalCondition,
                      condReturn: itm.physicalCondition,
                      diffResult: 'Đúng như bàn giao' as const,
                      diffNote: 'Khớp biên bản nhận'
                    }))).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{row.assetName}</td>
                        <td className="py-2.5 px-3 font-mono text-center">{row.qtyReceive}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-center text-blue-700">{row.qtyReturn}</td>
                        <td className="py-2.5 px-3 text-slate-600">{row.condReceive}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-900">{row.condReturn}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            row.diffResult === 'Đúng như bàn giao' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {row.diffResult}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {row.diffNote}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Hướng dẫn không tự phạt tiền */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-[11px]">
              * <strong>Hướng dẫn &amp; 04:</strong> Phát hiện chênh lệch tài sản không tự xác định khách có trách nhiệm hoặc tự tính chi phí bồi thường; đối chiếu tài sản không làm thay đổi trạng thái sử dụng phòng. Việc giải quyết chênh lệch được thực hiện tại. </div>

            {/* Footer Buttons (Thao tác thực hiện) */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setActiveTab('handover_bg03')}
                className="px- py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium cursor-pointer"
              >
                &larr; Xem lại biên bản nhận </button>

              <div className="flex items-center gap-2">
                <button
                  disabled={!canPerformOfficialComparison}
                  onClick={() => {
                    if (!canPerformOfficialComparison) {
                      showToast('error', "Chưa đủ điều kiện và Đã xác nhận để lưu đối chiếu hoàn tất.");
                      return;
                    }
                    const hasDiff = comparisonItems.some((i: { diffResult: string }) => i.diffResult === 'Khác biệt');
                    const compResult: AssetComparisonResult = {
                      id: 'comp_' + selectedRoomCode.replace(/\D/g, '') + '_' + Date.now().toString().slice(-4),
                      roomCode: selectedRoomCode,
                      leaseId: targetContract?.leaseId || '',
                      contractId: targetContract?.id,
                      hasDifference: hasDiff,
                      hasPendingWork: hasDiff,
                      pendingWorkNote: hasDiff ? 'Có chênh lệch tài sản cần xử lý' : 'Không phát hiện chênh lệch khi kiểm tra',
                      tenantFeedbackStatus: 'Chưa phản hồi',
                      unanimousStatus: 'Chưa xác định',
                      transferredToSettlement318: false,
                      version: 1,
                      loggedAt: new Date().toISOString()
                    };
                    const res = saveAssetComparisonResultBG07(compResult);
                    showToast(res.success ? 'success' : 'error', res.message);
                  }}
                  className={`px-4 py-2 rounded-lg font-semibold cursor-pointer shadow-xs ${
                    canPerformOfficialComparison
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  Lưu kết quả đối chiếu </button>

                <button
                  disabled={!canPerformOfficialComparison || !comparisonItems.length}
                  onClick={() => {
                    setActiveTab('result_bg07');
                    showToast('info', "Chuyển sang: Ghi nhận kết quả đối chiếu tài sản và xử lý chênh lệch.");
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <span>Xử lý chênh lệch </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* =========================================================================
          TAB 7: GHI NHẬN KẾT QUẢ ĐỐI CHIẾU TÀI SẢN 
      ========================================================================= */}
      {selectedRoomCode && !linkedRoomMismatch && targetContract && activeTab === 'result_bg07' && (() => {
        // Evaluate sources from BG06 and BG05
        const hasDiffFromBG06 = comparisonItems.length > 0
          ? comparisonItems.some((i: { diffResult: string }) => i.diffResult === 'Khác biệt')
          : (existingCompResult?.hasDifference ?? false);

        const hasBG06Comparison = comparisonItems.length > 0 || Boolean(existingCompResult);

        // Verification condition for "Không liên hệ được"
        // Must have at least 2 unsuccessful contact attempts and >= 48 hours from 1st attempt
        const failedLogs = bg07ContactLogs.filter(l => l.result.toLowerCase().includes('không') || l.result.toLowerCase().includes('chưa'));
        const firstLogTime = bg07ContactLogs.length > 0 ? new Date(bg07ContactLogs[0].date).getTime() : Date.now();
        const hoursElapsed = (Date.now() - firstLogTime) / (1000 * 3600);
        const canMarkUnreachable = failedLogs.length >= 2 && hoursElapsed >= 48;

        const handleSaveBG07 = () => {
          // Validations ,  & 
          if (!hasBG06Comparison) {
            showToast('error', ": Chưa có kết quả so sánh tài sản từ. Không ghi kết luận tùy ý.");
            return;
          }
          if (hasDiffFromBG06 && bg07HasPendingWork && !bg07PendingWorkNote.trim()) {
            showToast('error', ": xác định có chênh lệch thực tế, vui lòng nhập nội dung phát sinh cần xử lý.");
            return;
          }
          if (hasDiffFromBG06 && !bg07HasPendingWork && !bg07PendingWorkNote.trim()) {
            showToast('error', ': Khi có chênh lệch mà chọn không còn xử lý, bắt buộc phải ghi căn cứ đã xử lý.');
            return;
          }
          if (bg07TenantFeedbackStatus !== 'Đã phản hồi' && bg07UnanimousStatus === 'Đã thống nhất') {
            showToast('error', ': Khách chưa phản hồi hoặc không liên hệ được, không thể lưu trạng thái "Đã thống nhất" (không suy đoán im lặng là đồng ý - ).');
            return;
          }

          try {
            const result: AssetComparisonResult = {
              id: existingCompResult?.id || 'comp_' + selectedRoomCode.replace(/\D/g, '') + '_' + Date.now().toString().slice(-4),
              roomCode: selectedRoomCode,
              leaseId: targetContract?.leaseId || '',
              contractId: targetContract?.id,
              hasDifference: hasDiffFromBG06,
              hasPendingWork: bg07HasPendingWork,
              pendingWorkNote: bg07PendingWorkNote,
              solutionPlan: bg07SolutionPlan,
              ownerOpinion: bg07OwnerOpinion,
              tenantOpinion: bg07TenantOpinion,
              tenantFeedbackStatus: bg07TenantFeedbackStatus,
              unanimousStatus: bg07UnanimousStatus,
              compensationAmount: bg07CompensationAmount,
              contactHistory: bg07ContactLogs,
              contactAttemptsCount: bg07ContactLogs.length,
              firstContactAt: bg07ContactLogs[0]?.date,
              unreachableConfirmedAt: bg07TenantFeedbackStatus === 'Không liên hệ được' ? new Date().toISOString() : undefined,
              unreachableConfirmedBy: bg07TenantFeedbackStatus === 'Không liên hệ được' ? (currentUser?.fullName || 'Chủ nhà') : undefined,
              transferredToSettlement318: step318Transferred,
              transferredAt: step318Transferred ? (existingCompResult?.transferredAt || new Date().toISOString()) : undefined,
              version: (existingCompResult?.version || 1),
              loggedAt: new Date().toISOString()
            };

            const saved = saveAssetComparisonResultBG07(result);
            if (!saved.success) { setBg07SaveError(saved.message); showToast('error', saved.message); return; }
            setBg07SaveError(null);
            if (step318Transferred) {
              showToast('success', "Đã lưu kết quả đối chiếu tài sản và ghi nhận chuyển thông tin Thao tác!");
            } else {
              showToast('info', "Đã lưu kết quả đối chiếu tài sản. Nhắc nhở: Hãy thực hiện bàn giao thông tin sang Thao tác ngoài hệ thống.");
            }
          } catch (err: any) {
            // : Giữ dữ liệu nhập, thông báo lỗi và nút Thử lại
            setBg07SaveError(err.message || ': Lỗi lưu kết quả đối chiếu. Toàn bộ thông tin bạn đã nhập được bảo toàn nguyên vẹn.');
            showToast('error', ': Lỗi lưu kết quả đối chiếu! Hệ thống đã giữ nguyên vẹn dữ liệu nhập.');
          }
        };

        return (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 text-xs">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  
                  <h2 className="text-sm font-bold text-slate-900">Ghi nhận kết quả đối chiếu tài sản &amp; Xử lý chênh lệch: {selectedRoomCode}</h2>
                </div>
                <p className="text-slate-500 mt-0.5">
                  Ghi nhận trung thực kết quả xử lý chênh lệch và ý kiến của các bên (kể cả chưa thống nhất). Sau đó chuyển thông tin đối chiếu sang quyết toán cọc tại thao tác ngoài hệ thống. </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    // : Tải lại để đối chiếu thông tin mới; tránh mất ý kiến đã ghi
                    const compRes = assetComparisonResults.find(r => r.roomCode === selectedRoomCode && r.leaseId === selectedLeaseId);
                    if (compRes) {
                      setBg07HasPendingWork(compRes.hasPendingWork);
                      setBg07PendingWorkNote(compRes.pendingWorkNote || '');
                      setBg07SolutionPlan(compRes.solutionPlan || '');
                      setBg07OwnerOpinion(compRes.ownerOpinion || '');
                      setBg07TenantOpinion(compRes.tenantOpinion || '');
                      setBg07TenantFeedbackStatus(compRes.tenantFeedbackStatus || 'Chưa phản hồi');
                      setBg07UnanimousStatus(compRes.unanimousStatus || 'Chưa xác định');
                      setBg07CompensationAmount(compRes.compensationAmount || 0);
                      setBg07ContactLogs(compRes.contactHistory || []);
                      setStep318Transferred(Boolean(compRes.transferredToSettlement318));
                    }
                    setBg07SaveError(null);
                    showToast('info', ": Đã tải lại dữ liệu đối chiếu mới nhất từ và thành công.");
                  }}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium flex items-center gap-1 cursor-pointer"
                  title="Tải lại để đối chiếu thông tin mới"
                >
                  <RefreshCw className="w- h-" />
                  <span>Tải lại</span>
                </button>
                <button
                  onClick={() => setShowAF03SettlementModal(true)}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Search className="w- h-" />
                  <span>Tham chiếu quyết toán quyết toán cọc</span>
                </button>
                <button
                  onClick={() => setActiveTab('compare_bg06')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Scale className="w- h-" />
                  <span>&larr; Xem đối chiếu </span>
                </button>
                <button
                  onClick={() => setShowAddContactModal(true)}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <PhoneCall className="w- h-" />
                  <span>+ Ghi nhận liên hệ khách</span>
                </button>
              </div>
            </div>

            {/* : Chưa có kết quả so sánh tài sản */}
            {!hasBG06Comparison && (
              <div className="p- bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs flex items-start gap-2">
                <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <strong className="block">: Chưa có kết quả so sánh tài sản từ </strong>
                  <p>
                    Hướng dẫn nghiệp vụ yêu cầu thực hiện đối chiếu tại trước khi ghi nhận kết quả; không ghi kết luận tùy ý khi chưa có bảng đối chiếu nguồn. </p>
                  <button
                    onClick={() => setActiveTab('compare_bg06')}
                    className="mt-1 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-semibold cursor-pointer"
                  >
                    Chuyển sang thực hiện đối chiếu tại </button>
                </div>
              </div>
            )}

            {/* Read-Only Source Banner (Giao diện mục 2) */}
            <div className="p- bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 md:grid-cols-4 gap-3 text-slate-700">
              <div>
                <span className="text-slate-500 block text-[11px]">Chênh lệch thực tế:</span>
                <span className={`inline-block px-2 py-0.5 rounded font-bold text-[11px] ${
                  hasDiffFromBG06 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {hasDiffFromBG06 ? 'Có chênh lệch thực tế' : 'Không có chênh lệch'}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">* Chỉ đọc từ, không được sửa</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px]">Biên bản nhận:</span>
                <span className="font-semibold text-emerald-700">
                  {existingReport ? `${existingReport.reportNumber} (${existingReport.status})` : 'Chưa có biên bản xác nhận'} </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Xác nhận nhận lại:</span>
                <span className="font-semibold text-emerald-700">
                  {returnInspectionTarget?.step305Confirmed ? 'Đã xác nhận nhận lại (BG09)' : 'Chờ xác nhận'}
                </span>
              </div>
            </div>

            {/*  Error Banner: Lỗi khi lưu kết quả đối chiếu -> Giữ dữ liệu nhập, thông báo lỗi và nút Thử lại */}
            {bg07SaveError && (
              <div className="p- bg-rose-50 border border-rose-300 rounded-xl text-rose-900 text-xs flex items-start gap-2.5 shadow-xs">
                <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center justify-between">
                    <strong className="block text-rose-800 font-bold">: Lỗi lưu kết quả đối chiếu tài sản</strong>
                    <span className="text-[10px] bg-rose-200 text-rose-900 px-2 py-0.5 rounded font-bold">Dữ liệu đã nhập được bảo toàn nguyên vẹn</span>
                  </div>
                  <p className="text-slate-700">{bg07SaveError}</p>
                  <div className="pt-1 flex items-center gap-2">
                    <button
                      onClick={() => {
                        setBg07SaveError(null);
                        handleSaveBG07();
                      }}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <RotateCcw className="w- h-" />
                      <span>Thử lại ngay</span>
                    </button>
                    <button
                      onClick={() => setBg07SaveError(null)}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-rose-300 text-slate-700 rounded-lg font-medium cursor-pointer"
                    >
                      Đóng </button>
                  </div>
                </div>
              </div>
            )}

            {/*  Banner: Không còn nội dung chênh lệch cần xử lý */}
            {!bg07HasPendingWork && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-[11px] space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span> / Thao tác: Kết luận "Không còn nội dung cần xử lý"</span>
                </div>
                <p>
                  Thao tác ghi kết luận <strong>Không còn nội dung cần xử lý</strong>. Lưu ý: Kết luận này <strong>không đồng nghĩa không cần hoàn trả/đối soát tiền cọc ban đầu tại </strong>. Khoản cọc gốc vẫn phải được chuyển sang Thao tác ngoài hệ thống để thực hiện quyết toán. </p>
              </div>
            )}

            {/*  Banner: Hai bên chưa thống nhất */}
            {bg07UnanimousStatus === 'Chưa thống nhất' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>: Hai bên chưa thống nhất về trách nhiệm, số lượng hoặc phương án xử lý</span>
                </div>
                <p>
                  Hệ thống <strong>lưu nguyên văn ý kiến của từng bên và tình trạng đang chờ</strong>, không tự gán đã chấp thuận hay đã thanh toán. Hồ sơ chuyển sang Thao tác nhưng vẫn giữ cờ Chưa thống nhất. </p>
              </div>
            )}

            {/* Form Inputs (Giao diện mục 3) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cột trái: Đánh giá nội dung cần xử lý & Trách nhiệm */}
              <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">
                      Còn nội dung cần xử lý? <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400">(Trạng thái nghiệp vụ tại - )</span>
                  </div>
                  <select
                    value={bg07HasPendingWork ? 'Có' : 'Không'}
                    onChange={(e) => {
                      const val = e.target.value === 'Có';
                      setBg07HasPendingWork(val);
                      if (!val && hasDiffFromBG06 && !bg07PendingWorkNote.trim()) {
                        showToast('info', "Hướng dẫn: Khi có chênh lệch nhưng chọn Không còn xử lý, User bắt buộc phải ghi căn cứ đã xử lý.");
                      }
                    }}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-semibold"
                  >
                    <option value="Có">Có - Còn nội dung chênh lệch cần tiếp tục xử lý</option>
                    <option value="Không">Không - Không còn nội dung cần xử lý ( / Thao tác)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nội dung phát sinh / Căn cứ đã xử lý {hasDiffFromBG06 && <span className="text-red-500">*</span>}
                  </label>
                  <textarea
                    rows={3}
                    value={bg07PendingWorkNote}
                    onChange={(e) => setBg07PendingWorkNote(e.target.value)}
                    placeholder="Mô tả cụ thể hư hỏng, chênh lệch số lượng hoặc căn cứ xác định không cần xử lý thêm..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                  />
                  {hasDiffFromBG06 && !bg07HasPendingWork && (
                    <span className="text-[10px] text-amber-700 font-semibold block mt-0.5">
                      * Căn cứ giải trình lý do không cần xử lý khi ghi nhận có chênh lệch. </span>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phương án xử lý kỹ thuật / thỏa thuận</label>
                  <textarea
                    rows={2}
                    value={bg07SolutionPlan}
                    onChange={(e) => setBg07SolutionPlan(e.target.value)}
                    placeholder="Ví dụ: Thay mặt kính bếp từ, kiểm tra vệ sinh điều hòa, hoặc trừ vào tiền cọc..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                  />
                </div>

                {/* Thông tin chi phí tham khảo */}
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900 text-[11px]">Chi phí bồi thường ước tính trao đổi (đ):</span>
                    <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-mono font-bold">
                      Tham khảo – Chưa xác minh </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="50000"
                    value={bg07CompensationAmount}
                    onChange={(e) => setBg07CompensationAmount(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono font-bold text-blue-700"
                  />
                  <span className="text-[10px] text-slate-500 block">
                    * <strong> &amp; 10:</strong> Chi phí bồi thường này chỉ là thông tin User ghi nhận, <strong>KHÔNG mặc nhiên là khoản phải thu hay khoản khấu trừ cọc</strong>. Việc cấn trừ tiền cọc do Quyết toán cọc xử lý độc lập; không tạo giao dịch tiền. </span>
                </div>
              </div>

              {/* Cột phải: Ý kiến các bên & Trạng thái phản hồi độc lập */}
              <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ý kiến thực tế của Chủ nhà</label>
                  <textarea
                    rows={2}
                    value={bg07OwnerOpinion}
                    onChange={(e) => setBg07OwnerOpinion(e.target.value)}
                    placeholder="Ghi nhận quan điểm, yêu cầu của chủ nhà..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ý kiến khách thuê (User ghi nhận do khách trao đổi)</label>
                  <textarea
                    rows={2}
                    value={bg07TenantOpinion}
                    onChange={(e) => setBg07TenantOpinion(e.target.value)}
                    placeholder="Ghi lại nguyên văn ý kiến của khách thuê khi trao đổi (giữ nguyên khi chưa thống nhất)..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                  />
                </div>

                {/* Hai trường độc lập: Phản hồi khách & Mức độ thống nhất */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-white border border-slate-200 rounded-lg">
                  <div>
                    <label className="block font-bold text-slate-800 text-[11px] mb-1">
                      1. Phản hồi của khách </label>
                    <select
                      value={bg07TenantFeedbackStatus}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        if (val === 'Không liên hệ được' && !canMarkUnreachable) {
                          showToast('error', " /: Để chọn \"Không liên hệ được\", phải có ít nhất 2 lượt liên hệ không thành công và đã qua tối thiểu 48 giờ từ lượt đầu.");
                          return;
                        }
                        setBg07TenantFeedbackStatus(val);
                        if (val !== 'Đã phản hồi' && bg07UnanimousStatus === 'Đã thống nhất') {
                          setBg07UnanimousStatus('Chưa thống nhất');
                        }
                      }}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs font-semibold bg-white"
                    >
                      <option value="Đã phản hồi">Đã phản hồi</option>
                      <option value="Chưa phản hồi">Chưa phản hồi</option>
                      <option value="Không liên hệ được">Không liên hệ được (&ge;48h, &ge;2 lượt)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 text-[11px] mb-1">
                      2. Mức độ thống nhất </label>
                    <select
                      value={bg07UnanimousStatus}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        if (val === 'Đã thống nhất' && bg07TenantFeedbackStatus !== 'Đã phản hồi') {
                          showToast('error', ': Khách chưa phản hồi hoặc không liên hệ được thì KHÔNG được chọn "Đã thống nhất" (không suy im lặng là đồng ý - ).');
                          return;
                        }
                        setBg07UnanimousStatus(val);
                      }}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs font-semibold bg-white"
                    >
                      <option value="Đã thống nhất">Đã thống nhất</option>
                      <option value="Chưa thống nhất">Chưa thống nhất</option>
                      <option value="Chưa xác định">Chưa xác định</option>
                    </select>
                  </div>
                </div>

                {/* Contact Attempts summary */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700 text-[11px]">
                      Lịch sử liên hệ thực tế ({bg07ContactLogs.length} lượt): </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      canMarkUnreachable ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                    }`}>
                      Điều kiện 48h &amp; &ge;2 lượt: {canMarkUnreachable ? 'Đạt' : 'Chưa đủ'}
                    </span>
                  </div>
                  <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                    {bg07ContactLogs.map(log => (
                      <div key={log.id} className="p-1.5 bg-white border border-slate-200 rounded text-[10px] flex justify-between items-center">
                        <div>
                          <strong className="text-slate-800">{log.channel}</strong> · {log.date.substring(0, 16).replace('T', ' ')}
                          <p className="text-slate-500 truncate max-w-[220px]">{log.result}</p>
                        </div>
                        <span className="text-[9px] text-blue-600 font-medium">Bằng chứng: {log.evidence.substring(0, 20)}...</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Thao tác & : Chuyển thông tin đối chiếu sang Quyết toán cọc ngoài hệ thống */}
            <div className="p- bg-indigo-50 border border-indigo-200 rounded-xl space-y-2 text-indigo-950 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold">
                  <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Thao tác: Chuyển thông tin sang Quyết toán cọc – Quyết toán cọc ngoài hệ thống:</span>
                </div>
                <span className="text-[10px] font-mono bg-indigo-200/70 text-indigo-900 px-2 py-0.5 rounded font-bold">
                  Bàn giao nghiệp vụ ngoài phần mềm </span>
              </div>
              <p className="text-[11px] text-indigo-900">
                Thông tin chuyển tại thao tác gồm: mã phòng <strong>{selectedRoomCode}</strong>, hợp đồng <strong>{targetContract?.id || 'Chưa có'}</strong>, lần thuê <strong>{targetContract?.leaseId || selectedRoom.currentLeaseId}</strong>, kết quả đối chiếu, sự cố liên quan và phiên bản hồ sơ. Sau đó, hồ sơ quyết toán cọc sử dụng dữ liệu này để đối chiếu, <strong>không tự khởi tạo từ </strong>. </p>
              
              <div className="p-2.5 bg-white border border-indigo-200 rounded-lg flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={step318Transferred}
                    onChange={(e) => setStep318Transferred(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <div>
                    <span className="font-bold text-slate-800 block text-[11px]">
                      Chủ nhà đã hoàn tất bàn giao thông tin sang Thao tác ngoài hệ thống </span>
                    <span className="text-[10px] text-slate-500">
                      {step318Transferred ? `Đã xác nhận bàn giao thông tin nghiệp vụ.` : `Chưa hoàn tất thao tác ngoài hệ thống.`}
                    </span>
                  </div>
                </label>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  step318Transferred ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {step318Transferred ? 'Đã chuyển ' : 'Nhắc việc: Chưa chuyển '}
                </span>
              </div>

              {!step318Transferred && (
                <div className="text-[10px] text-amber-800 bg-amber-50 p-2 rounded border border-amber-200">
                  * <strong>:</strong> Kết quả đã lưu vẫn được giữ nguyên. Hồ sơ ghi chú chưa hoàn tất việc chuyển thông tin để Chủ nhà tiếp tục xử lý; không tự mở hoặc tự tạo hồ sơ quyết toán cọc. Việc chờ quyết toán không thay đổi kết quả nhận lại phòng đã được xác nhận ở thao tác. </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setActiveTab('compare_bg06')}
                className="px- py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium cursor-pointer"
              >
                &larr; Quay lại đối chiếu </button>

              <div className="flex flex-wrap items-center gap-2">

                <button
                  disabled={!hasBG06Comparison}
                  onClick={handleSaveBG07}
                  className={`px-4 py-2 rounded-lg font-semibold cursor-pointer shadow-xs ${
                    hasBG06Comparison ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  Lưu kết quả đối chiếu </button>

                <button
                  onClick={() => {
                    setActiveTab('init_report_bg08');
                    showToast('info', "Mở: Khởi tạo biên bản trả phòng.");
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <span>Tạo biên bản trả phòng </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* =========================================================================
          TAB 8: KHỞI TẠO BIÊN BẢN TRẢ PHÒNG 
      ========================================================================= */}
      {selectedRoomCode && !linkedRoomMismatch && targetContract && activeTab === 'init_report_bg08' && (() => {
        const hasReceiveReport = Boolean(existingReport);
        const isReceiveReportConfirmed = Boolean(getConfirmedRoomHandover(targetContract, contracts, handoverReports));

        const selectedContract = contracts.find(c => c.id === bg08SelectedContractId && c.roomCode === selectedRoomCode && c.leaseId === selectedLeaseId) || targetContract;
        const isHistoricContractConflict = Boolean(
          selectedContract &&
          selectedContract.status === 'Kết thúc' &&
          targetContract &&
          targetContract.id !== selectedContract.id
        );

        // Trạng thái nguồn biên bản nhận (Giao diện mục 6)
        const sourceReportStatus: 'Hợp lệ' | 'Chưa xác minh' | 'Thiếu hồ sơ nhận phòng' =
          isReceiveReportConfirmed ? 'Hợp lệ' : existingReport ? 'Chưa xác minh' : 'Thiếu hồ sơ nhận phòng';

        return (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 text-xs">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  
                  <h2 className="text-sm font-bold text-slate-900">Khởi tạo biên bản trả phòng (Thao tác): {selectedRoomCode}</h2>
                </div>
                <p className="text-slate-500 mt-0.5">
                  Khởi tạo biên bản trả phòng sau sự kiện khách tiến hành bàn giao. Hồ sơ ban đầu lưu ở trạng thái <strong>NHÁP</strong>, chưa phải bản ký chính thức. </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2.5 py-1 rounded text-xs font-bold border ${
                  sourceReportStatus === 'Hợp lệ'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : sourceReportStatus === 'Chưa xác minh'
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-rose-50 text-rose-800 border-rose-300'
                }`}>
                  Trạng thái nguồn: {sourceReportStatus}
                </span>

                {existingReturnReport && (
                  <span className="font-mono bg-blue-50 text-blue-800 font-bold px-2.5 py-1 rounded border border-blue-200">
                    Mã hiện hành: {existingReturnReport.reportNumber} ({existingReturnReport.status}) </span>
                )}
              </div>
            </div>

            {/* Check Source BG03 ( &  & 05) */}
            {!isReceiveReportConfirmed && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Chưa có biên bản nhận phòng hợp lệ:</span>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab('handover_bg03');
                      showToast('info', "Chuyển sang xem hồ sơ nhận phòng.");
                    }}
                    className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w- h-" />
                    <span>Xem hồ sơ nhận phòng</span>
                  </button>
                </div>
                <p>
                  Chưa tìm thấy hoặc biên bản nhận phòng chưa có đủ 2 chữ ký tay xác nhận. Hệ thống vẫn cho phép khởi tạo biên bản trả phòng ở trạng thái <strong>Nháp</strong> để ghi nhận thực tế, nhưng sẽ <strong>gắn cờ Thiếu biên bản nhận</strong> và khóa đối chiếu hoàn tất/xác nhận biên bản cuối cùng cho đến khi hồ sơ gốc hợp lệ. </p>
              </div>
            )}

            {/*  Alert if historical contract conflict */}
            {isHistoricContractConflict && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-[11px] space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>: Chọn hợp đồng lịch sử trong khi phòng đã có lần thuê mới</span>
                </div>
                <p>
                  Lưu ý: Không cho phép lưu biên bản trả chính thức sai nguồn hoặc ghi đè hồ sơ hiện hành của người thuê mới. Với hồ sơ cũ, chỉ cho phép tra cứu/chuẩn bị thông tin có kiểm soát trên lịch sử đúng lần thuê. </p>
              </div>
            )}

            {/* : Không tìm thấy phòng hoặc hồ sơ thuê cần trả */}
            {contracts.filter(c => c.roomCode === selectedRoomCode).length === 0 && (
              <div className="p- bg-rose-50 border border-rose-300 rounded-xl text-rose-900 text-xs flex items-start gap-2.5 shadow-sm">
                <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <strong className="block font-bold">: Không tìm thấy hợp đồng hoặc hồ sơ thuê cần trả cho phòng {selectedRoomCode}</strong>
                  <p>Hệ thống không tạo biên bản trả phòng khi thiếu dữ liệu hồ sơ thuê nguồn. Vui lòng chọn lại phòng có hợp đồng liên quan.</p>
                </div>
              </div>
            )}

            {/*  Existing Report Notice */}
            {existingReturnReport && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-[11px] flex items-center justify-between">
                <div>
                  <strong className="block text-blue-950">: Đã tồn tại biên bản trả phòng hiện hành cho lần thuê này</strong>
                  <p className="text-blue-800">
                    Số biên bản: <strong>{existingReturnReport.reportNumber}</strong> · Trạng thái: <strong>{existingReturnReport.status}</strong> · Ngày lập: {existingReturnReport.date}. Một lần thuê chỉ có 1 biên bản trả phòng hiện hành. </p>
                </div>
                <button
                  onClick={() => {
                    showToast('info', `Mở biên bản trả phòng hiện hành ${existingReturnReport.reportNumber}.`);
                    setActiveTab('final_report_bg11');
                  }}
                  className="px- py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shrink-0 cursor-pointer"
                >
                  Mở biên bản hiện có </button>
              </div>
            )}

            {/* Form Fields (Giao diện mục 2 & 3) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Hợp đồng thuê cần trả phòng <span className="text-red-500">*</span> (Lọc đúng lần thuê) </label>
                  <select
                    value={bg08SelectedContractId || targetContract?.id || ''}
                    onChange={(e) => {
                      const cid = e.target.value;
                      setBg08SelectedContractId(cid);
                      const ct = contracts.find(c => c.id === cid);
                      if (ct) {
                        setBg08Giver(ct.tenantName);
                      }
                    }}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono font-medium text-xs text-slate-800"
                  >
                    {contracts.filter(c => c.roomCode === selectedRoomCode && c.leaseId === selectedLeaseId && c.isSignedPaper).map(c => (
                      <option key={c.id} value={c.id}>
                        {c.id} · {c.tenantName} ({c.status}) [Lần thuê: {c.leaseId}] </option>
                    ))}
                    {contracts.filter(c => c.roomCode === selectedRoomCode).length === 0 && (
                      <option value="">Không có hợp đồng nào thuộc phòng {selectedRoomCode}</option>
                    )}
                  </select>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    * Mã phòng: <strong>{selectedRoom.roomCode}</strong> (Tầng {selectedRoom.floor}, {selectedRoom.area} m²) </span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ngày lập biên bản trả phòng <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={bg08Date}
                    onChange={(e) => setBg08Date(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Địa điểm bàn giao trả phòng</label>
                  <input
                    type="text"
                    value={bg08Place}
                    onChange={(e) => setBg08Place(e.target.value)}
                    placeholder="Tại phòng..."
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Bên bàn giao (Khách thuê) <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={bg08Giver}
                      onChange={(e) => setBg08Giver(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Bên nhận (Chủ nhà/Quản lý) <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={bg08Receiver}
                      onChange={(e) => setBg08Receiver(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ghi chú ban đầu khi lập biên bản</label>
                  <textarea
                    rows={3}
                    value={bg08Notes}
                    onChange={(e) => setBg08Notes(e.target.value)}
                    placeholder="Ghi nhận bối cảnh tiếp nhận trả phòng..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Reference Asset Table */}
            <div className="space-y-1.5">
              <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block">
                Danh sách tài sản tham chiếu từ đầu kỳ (Chỉ xem, nguồn đối chứng - ): </span>
              <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-48">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[10px]">
                      <th className="py-2 px-3">Tài sản</th>
                      <th className="py-2 px-3 text-center">SL Danh mục</th>
                      <th className="py-2 px-3 text-center">SL Lúc nhận </th>
                      <th className="py-2 px-3">Tình trạng lúc nhận</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {inventoryItems.map(ast => (
                      <tr key={ast.id} className="hover:bg-slate-50">
                        <td className="py-1.5 px-3 font-semibold text-slate-800">{ast.name}</td>
                        <td className="py-1.5 px-3 font-mono text-center">{ast.standardQuantity}</td>
                        <td className="py-1.5 px-3 font-mono text-center text-blue-700 font-bold">{ast.actualQuantity}</td>
                        <td className="py-1.5 px-3 text-slate-600">{ast.physicalCondition}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Buttons (Thao tác thực hiện) */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  showToast('info', 'Đã hủy khởi tạo biên bản trả phòng.');
                  setActiveTab('compare_bg06');
                }}
                className="px- py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium cursor-pointer"
              >
                Hủy </button>

              <div className="flex items-center gap-2">
                {/* : Mở biên bản Nháp hiện có nếu đã tồn tại */}
                {existingReturnReport ? (
                  <button
                    onClick={() => {
                      showToast('info', `Mở biên bản trả phòng hiện hành ${existingReturnReport.reportNumber}.`);
                      setActiveTab('final_report_bg11');
                    }}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold cursor-pointer"
                  >
                    Mở biên bản Nháp hiện có </button>
                ) : (
                  <button
                    disabled={isHistoricContractConflict}
                    onClick={() => {
                      if (isHistoricContractConflict) {
                        showToast('error', ': Không cho lưu biên bản trả chính thức cho hợp đồng lịch sử khi phòng đã có lần thuê mới.');
                        return;
                      }
                      if (!bg08Giver.trim() || !bg08Receiver.trim() || !bg08Date) {
                        showToast('error', ': Vui lòng nhập đầy đủ thông tin bên giao, bên nhận và ngày lập.');
                        return;
                      }

                      const newRep: HandoverReturnReport = {
                        id: 'ret_rep_' + selectedRoomCode.replace(/\D/g, '') + '_' + Date.now().toString().slice(-4),
                        reportNumber: 'BB-TRA-' + selectedRoomCode.replace(/\W/g, '') + '-' + (selectedContract?.leaseId || targetContract?.leaseId || ''),
                        roomCode: selectedRoomCode,
                        leaseId: selectedContract?.leaseId || targetContract?.leaseId || '',
                        contractId: selectedContract?.id || targetContract?.id || '',
                        status: 'Nháp',
                        missingReceiveReport: !isReceiveReportConfirmed,
                        initialConditionNotes: bg08Notes,
                        handoverPlace: bg08Place,
                        date: bg08Date,
                        giverName: bg08Giver,
                        receiverName: bg08Receiver,
                        tenantSignedPaper: 'Chưa ký',
                        ownerSignedPaper: 'Chưa ký',
                        reviewRequired: false,
                        version: 1,
                        createdAt: new Date().toISOString()
                      };

                      const res = initHandoverReturnReportDraftBG08(newRep);
                      showToast(res.success ? 'success' : 'error', toUserMessage(res.message));
                    }}
                    className={`px-4 py-2 rounded-lg font-semibold cursor-pointer shadow-xs ${
                      !isHistoricContractConflict
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    Khởi tạo biên bản Nháp </button>
                )}

                <button
                  disabled={!existingReturnReport}
                  onClick={() => {
                    setActiveTab('return_room_bg09');
                    showToast('info', "Mở kết quả nhận lại phòng.");
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <span>Ghi nhận kết quả nhận lại phòng</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* =========================================================================
          TAB 9: GHI NHẬN KẾT QUẢ NHẬN LẠI PHÒNG 
      ========================================================================= */}
      {selectedRoomCode && !linkedRoomMismatch && targetContract && activeTab === 'return_room_bg09' && (() => {
        // Evaluate completeness of 
        const allItemsChecked = bg09Items.every(i => i.inspected);
        const hasMissingReason = bg09Items.filter(i => !i.inspected).every(i => Boolean(i.reasonIfNotInspected && i.reasonIfNotInspected.trim()));
        const is303Complete = allItemsChecked;

        // Condition for  = "Đã nhận lại"
        const canSaveOfficially304 = is303Complete && bg09Items.length > 0 &&
          bg09Items.every(i => Number.isInteger(i.quantity) && i.quantity >= 0 && Boolean(i.condition)) &&
          bg09FinalElec !== '' && Number.isFinite(bg09FinalElec) && bg09FinalElec >= 0 &&
          bg09FinalWater !== '' && Number.isFinite(bg09FinalWater) && bg09FinalWater >= 0 &&
          Boolean(bg09Evidence.trim()) && Boolean(targetContract?.id && selectedLeaseId);
        const is305Confirmed = Boolean(returnInspectionTarget?.step305Confirmed);

        return (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 text-xs">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  
                  <h2 className="text-sm font-bold text-slate-900">Ghi nhận kết quả nhận lại phòng: {selectedRoomCode}</h2>
                </div>
                <p className="text-slate-500 mt-0.5">
                  Kiểm tra thực tế và ghi nhận kết quả. Khi đã nhận lại và đủ chứng cứ, xác nhận làm căn cứ để chuyển phòng sang trạng thái Trống. </p>
              </div>

              {is305Confirmed && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowCorrectionModal(true)}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <ShieldAlert className="w- h-" />
                    <span>Đính chính </span>
                  </button>
                </div>
              )}
            </div>

            {/* : Không tìm thấy biên bản trả phòng đang xử lý */}
            {!existingReturnReport && (
              <div className="p- bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs flex items-start gap-2.5 shadow-sm">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <strong className="block font-bold">: Chưa tìm thấy biên bản trả phòng đang xử lý </strong>
                  <p>
                    Cần lập biên bản trả phòng trước khi ghi nhận kết quả nhận lại thực tế. </p>
                  <button
                    onClick={() => setActiveTab('init_report_bg08')}
                    className="mt-1 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-semibold cursor-pointer"
                  >
                    Chuyển sang Khởi tạo biên bản trả phòng </button>
                </div>
              </div>
            )}

            {/* Status overview */}
            <div className="p- bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 md:grid-cols-4 gap-3 text-slate-700">
              <div>
                <span className="text-slate-500 block text-[11px]">Trạng thái kiểm tra:</span>
                <span className={`inline-block px-2 py-0.5 rounded font-bold text-[11px] ${
                  is303Complete ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {is303Complete ? 'Đã kiểm tra đầy đủ ()' : 'Kiểm tra chưa đầy đủ'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Kết quả nhận lại:</span>
                <span className={`inline-block px-2 py-0.5 rounded font-bold text-[11px] ${
                  bg09Step304Status === 'Đã nhận lại' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {bg09Step304Status}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Xác nhận độc lập:</span>
                <span className={`inline-block px-2 py-0.5 rounded font-bold text-[11px] ${
                  is305Confirmed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {is305Confirmed ? 'Đã xác nhận (Chủ nhà)' : 'Chờ Chủ nhà xác nhận'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Căn cứ cập nhật phòng Trống:</span>
                <span className={`font-semibold ${is305Confirmed ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
                  {is305Confirmed ? 'Đủ điều kiện ghi Trống (PH-08)' : 'Chưa đủ điều kiện'}
                </span>
              </div>
            </div>

            {/* Bảng kiểm tra tài sản thực tế (Thao tác) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                  Bảng kiểm tra tài sản thực tế tại phòng (Thao tác): </span>
                <span className="text-[10px] text-slate-500">
                  Dòng chưa kiểm tra phải ghi rõ lý do </span>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Tài sản / Thiết bị</th>
                      <th className="py-2.5 px-3">Trạng thái kiểm tra</th>
                      <th className="py-2.5 px-3 text-center">SL Thực tế</th>
                      <th className="py-2.5 px-3">Tình trạng vật lý</th>
                      <th className="py-2.5 px-3">Lý do nếu chưa/không thể kiểm tra</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {bg09Items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-semibold text-slate-800">{item.name}</td>
                        <td className="py-2 px-3">
                          <select
                            value={item.inspected ? 'Đã kiểm tra' : 'Chưa kiểm tra'}
                            onChange={(e) => {
                              const val = e.target.value === 'Đã kiểm tra';
                              setBg09Items(prev => prev.map((it, i) => i === idx ? { ...it, inspected: val } : it));
                            }}
                            className="px-2 py-1 border border-slate-300 rounded text-xs bg-white"
                          >
                            <option value="Đã kiểm tra">Đã kiểm tra</option>
                            <option value="Chưa kiểm tra">Chưa kiểm tra / Không thể kiểm tra</option>
                          </select>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <input
                            type="number"
                            min="0"
                            disabled={!item.inspected}
                            value={item.quantity}
                            onChange={(e) => {
                              const qty = Number(e.target.value);
                              setBg09Items(prev => prev.map((it, i) => i === idx ? { ...it, quantity: qty } : it));
                            }}
                            className={`w-14 px-2 py-1 border border-slate-300 rounded font-mono text-center ${
                              item.inspected ? 'bg-white font-bold' : 'bg-slate-100 text-slate-400'
                            }`}
                          />
                        </td>
                        <td className="py-2 px-3">
                          <select
                            disabled={!item.inspected}
                            value={item.condition}
                            onChange={(e) => {
                              const cond = e.target.value;
                              setBg09Items(prev => prev.map((it, i) => i === idx ? { ...it, condition: cond } : it));
                            }}
                            className={`px-2 py-1 border border-slate-300 rounded text-xs ${
                              item.inspected ? 'bg-white' : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            <option value="Bình thường">Bình thường</option>
                            <option value="Hư hỏng">Hư hỏng</option>
                            <option value="Khác">Khác</option>
                          </select>
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            placeholder="Ghi rõ lý do nếu chưa kiểm tra được..."
                            value={item.reasonIfNotInspected || ''}
                            onChange={(e) => {
                              const r = e.target.value;
                              setBg09Items(prev => prev.map((it, i) => i === idx ? { ...it, reasonIfNotInspected: r } : it));
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

            {/* Chỉ số điện nước cuối kỳ */}
            <div className="p- bg-blue-50/50 border border-blue-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between border-b border-blue-200 pb-1.5">
                <span className="font-bold text-blue-900">Chốt chỉ số điện nước cuối kỳ (Mốc dừng tính tiền dịch vụ - BR09-THU):</span>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">
                  Không sinh tiền thuê kỳ sau ngày nhận lại </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Số điện cuối kỳ (kWh):</label>
                  <input
                    type="number"
                    min="0"
                    value={bg09FinalElec}
                    onChange={(e) => setBg09FinalElec(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono font-bold text-amber-800"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Số nước cuối kỳ (m³):</label>
                  <input
                    type="number"
                    min="0"
                    value={bg09FinalWater}
                    onChange={(e) => setBg09FinalWater(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono font-bold text-blue-800"
                  />
                </div>
              </div>
            </div>

            {/* Thao tác: Kết quả nhận lại & Bằng chứng */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 text-xs">
                  Kết quả nhận lại phòng tại Thao tác <span className="text-red-500">*</span>: </label>
                <select
                  value={bg09Step304Status}
                  onChange={(e) => setBg09Step304Status(e.target.value as any)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-bold text-slate-900"
                >
                  <option value="Đã nhận lại">Đã nhận lại</option>
                  <option value="Chưa nhận lại">Chưa nhận lại ( &rarr; chuyển )</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mô tả bằng chứng nhận lại phòng thực tế (Chìa khóa, thẻ xe, hiện trạng) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={bg09Evidence}
                  onChange={(e) => setBg09Evidence(e.target.value)}
                  placeholder="Ví dụ: Đã nhận đủ 2 chìa khóa, 1 thẻ từ, phòng dọn sạch sẽ..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              {/* Photos & Video URL */}
              <div>
                <span className="block font-semibold text-slate-700 mb-1">Ảnh bằng chứng nhận lại (&le; 10 ảnh, &le; 5MB/ảnh):</span>
                <div className="flex flex-wrap items-center gap-2">
                  {bg09EvidencePhotos.map((p, i) => (
                    <div key={i} className="relative group w-14 h-14 rounded-lg overflow-hidden border border-slate-300">
                      <img src={p} alt="Ảnh nhận lại" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setBg09EvidencePhotos(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <X className="w- h-" />
                      </button>
                    </div>
                  ))}
                  {bg09EvidencePhotos.length < 10 && (
                    <label className="w-14 h-14 rounded-lg border-2 border-dashed border-slate-300 hover:border-blue-500 flex flex-col items-center justify-center text-slate-400 hover:text-blue-600 transition-colors cursor-pointer">
                      <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                        onChange={e => addEvidenceImage(e, setBg09EvidencePhotos, 10)} />
                      <Plus className="w-4 h-4" />
                      <span className="text-[9px]">Chọn ảnh</span>
                    </label>
                  )}
                </div>
              </div>

              {/* Notice  validation */}
              {bg09Step304Status === 'Đã nhận lại' && !canSaveOfficially304 && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px]">
                  <strong>:</strong> Để lưu chính thức kết quả <strong>Đã nhận lại</strong> tại, bảng kiểm tra phải <strong>Đã kiểm tra đầy đủ 100%</strong> và có mô tả bằng chứng. Nếu chưa đủ, chỉ cho phép <em>Lưu nháp - chờ bổ sung</em> và chưa kích hoạt xác nhận. </div>
              )}
            </div>

            {/* Actions for  &  */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                {/* Lưu nháp (khi chưa đủ  hoặc cần bổ sung) */}
                <button
                  onClick={() => {
                    const draftInsp: ReturnInspection = {
                      id: existingInspection?.id || 'ret_' + selectedRoomCode.replace(/\D/g, '') + '_' + selectedLeaseId + '_' + Date.now(),
                      roomCode: selectedRoomCode,
                      leaseId: targetContract?.leaseId || '',
                      contractId: targetContract?.id,
                      inspectionDate: bg09InspectionDate,
                      step304Status: bg09Step304Status,
                      step305Confirmed: false,
                      step305Evidence: bg09Evidence,
                      step305EvidencePhotos: bg09EvidencePhotos,
                      step305EvidenceVideoUrl: bg09EvidenceVideoUrl,
                      finalElectricityKwh: bg09FinalElec === '' ? undefined : bg09FinalElec,
                      finalWaterM3: bg09FinalWater === '' ? undefined : bg09FinalWater,
                      assetsCheckedFully: is303Complete,
                      incompleteReason: bg09IncompleteReason,
                      isDraft: true,
                      version: (existingInspection?.version || 1),
                      items: bg09Items
                    };
                    const result = recordReturnInspectionBG09(draftInsp);
                    showToast(result.success ? 'info' : 'error', result.message);
                  }}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold cursor-pointer"
                >
                  Lưu nháp kiểm tra </button>

                {/* Lưu kết quả  */}
                <button
                  onClick={() => {
                    if (bg09Step304Status === 'Đã nhận lại' && !canSaveOfficially304) {
                      showToast('error', ": Bảng chưa kiểm tra đầy đủ hoặc thiếu mô tả chứng cứ nhận lại. Vui lòng kiểm tra lại hoặc chọn Lưu nháp.");
                      return;
                    }

                    const inspRecord: ReturnInspection = {
                      id: existingInspection?.id || 'ret_' + selectedRoomCode.replace(/\D/g, '') + '_' + selectedLeaseId + '_' + Date.now(),
                      roomCode: selectedRoomCode,
                      leaseId: targetContract?.leaseId || '',
                      contractId: targetContract?.id,
                      inspectionDate: bg09InspectionDate,
                      step304Status: bg09Step304Status,
                      step305Confirmed: existingInspection?.step305Confirmed || false,
                      step305ConfirmedAt: existingInspection?.step305ConfirmedAt,
                      step305ConfirmedBy: existingInspection?.step305ConfirmedBy,
                      step305Evidence: bg09Evidence,
                      step305EvidencePhotos: bg09EvidencePhotos,
                      step305EvidenceVideoUrl: bg09EvidenceVideoUrl,
                      finalElectricityKwh: bg09FinalElec === '' ? undefined : bg09FinalElec,
                      finalWaterM3: bg09FinalWater === '' ? undefined : bg09FinalWater,
                      assetsCheckedFully: is303Complete,
                      incompleteReason: bg09IncompleteReason,
                      isDraft: false,
                      version: (existingInspection?.version || 1),
                      items: bg09Items
                    };

                    const result = recordReturnInspectionBG09(inspRecord);
                    showToast(result.success ? 'success' : 'error', result.message);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold cursor-pointer shadow-xs"
                >
                  Lưu kết quả nhận lại (Thao tác) </button>
              </div>

              {/* Thao tác: Chủ nhà xác nhận độc lập */}
              <div className="flex items-center gap-2">
                <button
                  disabled={is305Confirmed || bg09Step304Status !== 'Đã nhận lại' || !canSaveOfficially304}
                  onClick={() => {
                    if (is305Confirmed) {
                      showToast('info', "Chủ nhà đã xác nhận độc lập tại trước đó.");
                      return;
                    }
                    if (bg09Step304Status !== 'Đã nhận lại' || !canSaveOfficially304) {
                      showToast('error', ": Chưa có kết quả = Đã nhận lại hợp lệ để thực hiện xác nhận.");
                      return;
                    }
                    const result = confirmReturnInspectionStep305(
                      selectedRoomCode,
                      targetContract?.leaseId || '',
                      bg09Evidence,
                      bg09EvidencePhotos,
                      bg09EvidenceVideoUrl
                    );
                    showToast(result.success ? 'success' : 'error', result.message);
                  }}
                  className={`px-4 py-2 rounded-lg font-semibold cursor-pointer shadow-xs flex items-center gap-1.5 ${
                    is305Confirmed
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : bg09Step304Status === 'Đã nhận lại' && canSaveOfficially304
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{is305Confirmed ? 'Đã xác nhận  (Chủ nhà)' : 'Xác nhận độc lập Đã nhận lại (Thao tác)'}</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('deposit_check_bg10');
                    showToast('info', "Mở: Theo dõi đối soát cọc từ Quyết toán cọc.");
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <span>Đối soát cọc </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* =========================================================================
          TAB 10: THEO DÕI ĐỐI SOÁT CỌC 
      ========================================================================= */}
      {selectedRoomCode && !linkedRoomMismatch && targetContract && activeTab === 'deposit_check_bg10' && (() => {
        // Evaluate quyết toán cọc settlement slip status
        const slip = matchingSettlementSlip;
        const initialDeposit = slip?.initialDepositAmount ?? currentInitialPayment?.depositAmount ?? 0;
        const deductionTotal = slip?.deductions.reduce((s, d) => s + d.amount, 0) || 0;
        const calculatedResult = slip?.calculatedResult ?? (initialDeposit - deductionTotal);

        // Tracking label (Giao diện mục 3 & 7)
        let trackingStatus:
          | 'Chưa có 5.8/Chờ quyết toán'
          | '5.8 hợp lệ – Đã thống nhất'
          | 'Chưa thống nhất – Chờ xác nhận của khách'
          | 'Tranh chấp – Chờ xử lý'
          | 'Đã ghi kết quả vào biên bản'
          | 'Cần rà soát phiên bản' = 'Chưa có 5.8/Chờ quyết toán';

        if (existingReturnReport?.depositSettlementId) {
          trackingStatus = 'Đã ghi kết quả vào biên bản';
        } else if (slip?.status === 'Khách đồng ý' || slip?.status === 'Hoàn tất' || slip?.status === 'Đã có 5.8 – chờ ký biên bản') {
          trackingStatus = '5.8 hợp lệ – Đã thống nhất';
        } else if (slip?.status === 'Đang lập') {
          trackingStatus = 'Chưa thống nhất – Chờ xác nhận của khách';
        } else if (slip?.status === 'Không đồng ý' || slip?.status === 'Tranh chấp') {
          trackingStatus = 'Tranh chấp – Chờ xử lý';
        }

        const is58Valid = Boolean(slip && existingReturnReport && !slip.reviewRequired &&
          slip.calculationStatus === 'Đã tính' && slip.tenantFeedback === 'Đồng ý' &&
          ['Khách đồng ý', 'Hoàn tất', 'Đã có 5.8 – chờ ký biên bản'].includes(slip.status));

        return (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 text-xs">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  
                  <h2 className="text-sm font-bold text-slate-900">Theo dõi kết quả đối soát cọc từ Quyết toán cọc: {selectedRoomCode}</h2>
                </div>
                <p className="text-slate-500 mt-0.5">
                   chỉ theo dõi trạng thái kết quả của quyết toán cọc; không tự tính hoặc ghi giao dịch cọc mới. Chỉ ghi vào biên bản khi có kết quả kết quả quyết toán hợp lệ. </p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded text-xs font-bold border ${
                  trackingStatus === '5.8 hợp lệ – Đã thống nhất' || trackingStatus === 'Đã ghi kết quả vào biên bản'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : trackingStatus === 'Tranh chấp – Chờ xử lý'
                    ? 'bg-rose-50 text-rose-800 border-rose-300'
                    : 'bg-amber-50 text-amber-800 border-amber-300'
                }`}>
                  Nhãn theo dõi nguồn: {trackingStatus}
                </span>
              </div>
            </div>

            {/* Read-Only Financial Overview (Giao diện mục 2) */}
            <div className="p- bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 md:grid-cols-4 gap-3 text-slate-700">
              <div>
                <span className="text-slate-500 block text-[11px]">Cọc gốc ban đầu (Hợp đồng chuỗi thuê):</span>
                <strong className="font-mono text-blue-700 text-sm">{initialDeposit.toLocaleString('vi-VN')} đ</strong>
                <span className="text-[10px] text-slate-400 block mt-0.5">*: lấy từ hợp đồng đầu tiên</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Tổng khấu trừ từ quyết toán cọc:</span>
                <strong className="font-mono text-rose-700 text-sm">{deductionTotal.toLocaleString('vi-VN')} đ</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Số tiền hoàn lại / thu thêm:</span>
                <strong className="font-mono text-emerald-700 text-sm">{calculatedResult.toLocaleString('vi-VN')} đ</strong>
                <span className="text-[10px] text-slate-500 block">{calculatedResult >= 0 ? '(Hoàn trả khách)' : '(Thu thêm từ khách)'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Mã hồ sơ quyết toán cọc / Phiên bản:</span>
                <strong className="font-mono text-slate-900">{slip?.id || 'QTC-2026-CHỜ'} (v1)</strong>
              </div>
            </div>

            {/* Slip Details & Deductions Table */}
            {slip && (
              <div className="space-y-2">
                <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block">
                  Chi tiết các khoản đối trừ từ hồ sơ quyết toán cọc {slip.id}: </span>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[10px]">
                        <th className="py-2 px-3">Khoản mục</th>
                        <th className="py-2 px-3">Mô tả chi tiết</th>
                        <th className="py-2 px-3 text-right">Số tiền khấu trừ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {slip.deductions.map(d => (
                        <tr key={d.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-semibold text-slate-800">{d.category}</td>
                          <td className="py-2 px-3 text-slate-600">{d.description}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-rose-700">
                            {d.amount.toLocaleString('vi-VN')} đ </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Evidence & feedback */}
                <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1 text-slate-700">
                  <div>Phản hồi khách thuê: <strong className="text-emerald-700">{slip.tenantFeedback || 'Chưa phản hồi'}</strong></div>
                  <div>Chứng cứ thanh toán/xác nhận: <em>{slip.contactLogs[0]?.evidence || 'Chưa có chứng cứ'}</em></div>
                </div>
              </div>
            )}

            {/* If 5.8 not ready or disputed */}
            {!is58Valid && trackingStatus !== 'Đã ghi kết quả vào biên bản' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] space-y-2">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Chưa có kết quả quyết toán cọc hợp lệ được hai bên thống nhất ( &amp; &amp; ):</span>
                </div>
                <p>
                  Hệ thống chỉ cho phép ghi kết quả vào biên bản khi quyết toán cọc có kết quả kết quả quyết toán hợp lệ và hai bên đã thống nhất. Hiện tại hồ sơ đang ở trạng thái theo dõi <em>Chờ kết quả</em>. Biên bản trả phòng giữ trạng thái <strong>Nháp</strong> (không tạo trạng thái biên bản thứ tư). </p>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ghi lý do chờ quyết toán (Thao tác):</label>
                  <input
                    type="text"
                    value={bg10WaitingReason}
                    onChange={(e) => setBg10WaitingReason(e.target.value)}
                    placeholder="Ví dụ: Chờ chốt tiền điện nước kỳ cuối hoặc chờ khách phản hồi phương án..."
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs"
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setActiveTab('return_room_bg09')}
                className="px- py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium cursor-pointer"
              >
                &larr; Xem kết quả nhận lại </button>

              <div className="flex items-center gap-2">
                {/* : Lưu biên bản để chờ */}
                {!is58Valid && (
                  <button
                    onClick={() => {
                      if (!existingReturnReport) { showToast('error', 'Chưa có biên bản trả phòng để lưu.'); return; }
                      const saved = saveHandoverReturnReportBG11({
                        ...existingReturnReport,
                        waitingReason: bg10WaitingReason.trim() || 'Chờ kết quả quyết toán cọc'
                      });
                      showToast(saved.success ? 'info' : 'error', saved.message);
                    }}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold cursor-pointer"
                  >
                    Lưu biên bản để chờ </button>
                )}

                {/* Thao tác: Ghi kết quả vào biên bản trả phòng */}
                <button
                  disabled={!is58Valid || !existingReturnReport}
                  onClick={() => {
                    if (!is58Valid || !existingReturnReport) {
                      showToast('error', 'Chưa có kết quả quyết toán cọc hợp lệ hoặc chưa lập biên bản trả phòng.');
                      return;
                    }
                    const repId = existingReturnReport!.id;
                    const result = syncDepositSettlementBG10(repId, {
                      depositSettlementId: slip!.id,
                      depositSettlementVersion: slip!.version,
                      depositSettlementAmount: initialDeposit,
                      depositRefundAmount: calculatedResult >= 0 ? calculatedResult : 0,
                      depositDeductionAmount: deductionTotal,
                      depositAdditionalDue: calculatedResult < 0 ? Math.abs(calculatedResult) : 0,
                      depositTrackingStatus: '5.8 hợp lệ – Đã thống nhất',
                      depositTrackingReason: 'Phương án đã được khách đồng ý đúng phiên bản'
                    });
                    showToast(result.success ? 'success' : 'error', result.message);
                  }}
                  className={`px-4 py-2 rounded-lg font-semibold cursor-pointer shadow-xs ${
                    is58Valid
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  Ghi kết quả vào biên bản (Thao tác) </button>

                <button
                  onClick={() => {
                    setActiveTab('final_report_bg11');
                    showToast('info', "Mở: Hoàn thiện biên bản trả phòng.");
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <span>Hoàn thiện biên bản </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* =========================================================================
          TAB 11: HOÀN THIỆN BIÊN BẢN TRẢ PHÒNG 
      ========================================================================= */}
      {selectedRoomCode && !linkedRoomMismatch && targetContract && activeTab === 'final_report_bg11' && (() => {
        // Evaluate the 3 distinct thresholds
        // Threshold A: Mở / Xem / Lưu nháp -> always true
        // Threshold B: Điều kiện Lưu Đã lập (Bước 2):
        // 1. BG09  đã xác nhận
        const is305Confirmed = Boolean(returnInspectionTarget?.step305Confirmed);
        // 2. BG06 & BG07 đã hoàn tất
        const isBG06BG07Done = Boolean(existingCompResult && !existingCompResult.hasPendingWork);
        // 3. BG10 có kết quả 5.8 hợp lệ
        const validSettlement = matchingSettlementSlip && !matchingSettlementSlip.reviewRequired &&
          matchingSettlementSlip.calculationStatus === 'Đã tính' &&
          ['Khách đồng ý', 'Hoàn tất', 'Đã có 5.8 – chờ ký biên bản'].includes(matchingSettlementSlip.status) &&
          matchingSettlementSlip.tenantFeedback === 'Đồng ý';
        const isDeposit58Synced = Boolean(validSettlement && existingReturnReport?.depositSettlementId === matchingSettlementSlip?.id &&
          existingReturnReport?.depositSettlementVersion === matchingSettlementSlip?.version);

        const canSaveOfficially1102 = Boolean(targetContract && is305Confirmed && isBG06BG07Done && isDeposit58Synced);

        // Threshold C: Điều kiện Đã xác nhận (Bước 4 / ):
        // Report must be "Đã lập", and signed paper recorded
        const isDraftReport = !existingReturnReport || existingReturnReport.status === 'Nháp';
        const isEstablishedReport = Boolean(existingReturnReport && (existingReturnReport.status === 'Đã lập' || existingReturnReport.status === 'Đã xác nhận'));

        // Client signed or refusal recorded
        const clientSignRecorded = bg11TenantSigned === 'Khách đã ký' || (bg11TenantSigned === 'Khách không ký' && Boolean(bg11NotSignReason));
        const ownerSignedOnPaper = bg11OwnerSigned;

        const canConfirmFinal324 = isEstablishedReport && clientSignRecorded && ownerSignedOnPaper &&
          Boolean(bg11PaperLocation.trim()) && canSaveOfficially1102;

        return (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 text-xs">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  
                  <h2 className="text-sm font-bold text-slate-900">Hoàn thiện biên bản trả phòng: {selectedRoomCode}</h2>
                </div>
                <p className="text-slate-500 mt-0.5">
                  Biên bản được chuẩn bị và ký tay trên giấy ngoài hệ thống. Hệ thống không có chức năng In hay ký điện tử. </p>
              </div>

              {existingReturnReport && (
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded text-xs font-bold ${
                    existingReturnReport.status === 'Đã xác nhận'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : existingReturnReport.status === 'Đã lập'
                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    Trạng thái biên bản: {existingReturnReport.status}
                  </span>
                </div>
              )}
            </div>

            {/* 3 Distinct Thresholds Panel */}
            <div className="p- bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block">
                Phân biệt 3 ngưỡng điều kiện nghiệp vụ: </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                  <span className="font-bold text-slate-800 block text-[11px]">Ngưỡng A: Mở / Lưu nháp</span>
                  <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">&bull; Luôn khả dụng để chuẩn bị trước</span>
                  <span className="text-[10px] text-slate-400">Không cản trở ghi nhận thực tế</span>
                </div>

                <div className={`p-2.5 border rounded-lg ${canSaveOfficially1102 ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                  <span className="font-bold text-slate-800 block text-[11px]">Ngưỡng B: Lưu ĐÃ LẬP </span>
                  <ul className="text-[10px] space-y-0.5 mt-0.5">
                    <li className={is305Confirmed ? 'text-emerald-700 font-medium' : 'text-amber-700'}>
                      {is305Confirmed ? '✓' : '✗'} 1. Nhận lại đã xác nhận </li>
                    <li className={isDeposit58Synced ? 'text-emerald-700 font-medium' : 'text-amber-700'}>
                      {isDeposit58Synced ? '✓' : '✗'} 2. Quyết toán cọc đúng phiên bản đã đối chiếu </li>
                    <li className={isBG06BG07Done ? 'text-emerald-700 font-medium' : 'text-amber-700'}>
                      {isBG06BG07Done ? '✓' : '✗'} 3. Đối chiếu tài sản không còn việc chờ xử lý </li>
                  </ul>
                </div>

                <div className={`p-2.5 border rounded-lg ${canConfirmFinal324 ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-100 border-slate-200'}`}>
                  <span className="font-bold text-slate-800 block text-[11px]">Ngưỡng C: ĐÃ XÁC NHẬN </span>
                  <ul className="text-[10px] space-y-0.5 mt-0.5">
                    <li className={isEstablishedReport ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                      {isEstablishedReport ? '✓' : '✗'} 1. Biên bản ở trạng thái ĐÃ LẬP </li>
                    <li className={clientSignRecorded && ownerSignedOnPaper ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                      {clientSignRecorded && ownerSignedOnPaper ? '✓' : '✗'} 2. Hai bên ký giấy / ghi nhận không ký </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Preview of Handover Return Report */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h3>
                  <h4 className="font-bold text-blue-900 text-xs">BIÊN BẢN BÀN GIAO &amp; TRẢ PHÒNG (SỐ: {existingReturnReport?.reportNumber || 'BB-TRA-' + selectedRoomCode + '-2026'})</h4>
                </div>
                <span className="text-[11px] font-mono text-slate-500">Ngày lập: {existingReturnReport?.date || bg08Date}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-[11px] text-slate-700">
                <div>
                  <strong>Bên bàn giao (Khách thuê):</strong> {existingReturnReport?.giverName || bg08Giver}
                </div>
                <div>
                  <strong>Bên nhận (Chủ nhà/Quản lý):</strong> {existingReturnReport?.receiverName || bg08Receiver}
                </div>
                <div>
                  <strong>Căn hộ / Phòng:</strong> {selectedRoomCode} (HĐ: {targetContract?.id || 'Chưa có'}) </div>
                <div>
                  <strong>Chỉ số cuối kỳ:</strong> Điện: <strong>{bg09FinalElec} kWh</strong> · Nước: <strong>{bg09FinalWater} m³</strong>
                </div>
              </div>

              {/* Tóm tắt quyết toán cọc */}
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-800">Thông tin đối soát cọc từ Quyết toán cọc ( quyết toán cọc / 5.8):</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {matchingSettlementSlip && validSettlement ? matchingSettlementSlip.calculatedResult.toLocaleString('vi-VN') + ' đ' : 'Chờ số liệu quyết toán'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">
                  {existingReturnReport?.depositTrackingReason || 'Biên bản tham chiếu kết quả quyết toán cọc từ hợp đồng chuỗi thuê liên tục.'}
                </p>
              </div>
            </div>

            {/* Ghi nhận kết quả ký giấy thực tế ngoài hệ thống (Giao diện mục 3 & 4) */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-900 text-xs">
                  Ghi nhận kết quả ký tay trên bản giấy thực tế ngoài hệ thống: </span>
                <span className="text-[10px] text-slate-500">* Không có nút In hay ký điện tử</span>
              </div>

              {/* Khách ký hoặc không ký */}
              <div className="space-y-2">
                <label className="font-semibold text-slate-800 block text-[11px]">
                  1. Tình trạng chữ ký của Khách thuê trên bản in giấy: </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                    <input
                      type="radio"
                      name="tenantSignStatus"
                      value="Khách đã ký"
                      checked={bg11TenantSigned === 'Khách đã ký'}
                      onChange={() => setBg11TenantSigned('Khách đã ký')}
                    />
                    <span>Khách đã ký giấy (Thao tác)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer font-medium text-rose-700">
                    <input
                      type="radio"
                      name="tenantSignStatus"
                      value="Khách không ký"
                      checked={bg11TenantSigned === 'Khách không ký'}
                      onChange={() => setBg11TenantSigned('Khách không ký')}
                    />
                    <span>Khách không ký (Thao tác)</span>
                  </label>
                </div>

                {bg11TenantSigned === 'Khách không ký' && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg space-y-2 mt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-rose-900 mb-1">Lý do khách không ký:</label>
                        <select
                          value={bg11NotSignReason}
                          onChange={(e) => setBg11NotSignReason(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-rose-300 rounded bg-white text-xs"
                        >
                          <option value="Không cung cấp lý do">Không cung cấp lý do</option>
                          <option value="Chưa xác định">Chưa xác định</option>
                          <option value="Bất đồng về chi phí khấu trừ">Bất đồng về chi phí khấu trừ</option>
                          <option value="Không có mặt tại buổi bàn giao">Không có mặt tại buổi bàn giao</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-rose-900 mb-1">Cách thức trao đổi khi từ chối ký:</label>
                        <input
                          type="text"
                          value={bg11NotSignExchangeInfo}
                          onChange={(e) => setBg11NotSignExchangeInfo(e.target.value)}
                          placeholder="Gọi điện, gửi Zalo..."
                          className="w-full px-2.5 py-1.5 border border-rose-300 rounded bg-white text-xs"
                        />
                      </div>
                    </div>
                    <span className="text-[10px] text-rose-800 block">
                      * <strong>:</strong> Chủ nhà vẫn được ký giấy và xác nhận nếu đủ nguồn; Đã xác nhận lúc này chỉ biểu thị Chủ nhà đã xác nhận hồ sơ, KHÔNG có nghĩa khách đã ký/đồng ý tiền cọc. </span>
                  </div>
                )}
              </div>

              {/* Chủ nhà ký giấy */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <label className="font-semibold text-slate-800 block text-[11px]">
                  2. Xác nhận chữ ký tay của Chủ nhà trên bản in giấy: </label>
                <label className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bg11OwnerSigned}
                    onChange={(e) => setBg11OwnerSigned(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">
                      Chủ nhà / Quản lý đã ký tay thực tế trên bản in giấy đúng mã và phiên bản </span>
                    <span className="text-[10px] text-slate-500">
                      Tài khoản thực hiện: {currentUser?.fullName || 'Chủ nhà'}
                    </span>
                  </div>
                </label>
              </div>

              {/* Storage & Scan */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nơi lưu trữ bản giấy chính thức <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={bg11PaperLocation}
                    onChange={(e) => setBg11PaperLocation(e.target.value)}
                    placeholder="Ví dụ: Tủ hồ sơ Tầng 1..."
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tệp scan hoặc ảnh bản giấy đã ký (tùy chọn)</label>
                  <input
                    type="text"
                    value={bg11ScanUrl}
                    onChange={(e) => setBg11ScanUrl(e.target.value)}
                    placeholder="https://... (không bắt buộc tải ảnh chữ ký)"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons (Giao diện mục 5) */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setActiveTab('deposit_check_bg10')}
                className="px- py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium cursor-pointer"
              >
                &larr; Xem đối soát cọc </button>

              <div className="flex items-center gap-2">
                {/* Lưu nháp */}
                <button
                  onClick={() => {
                    const rep: HandoverReturnReport = {
                      id: existingReturnReport?.id || 'BB-TRA-' + selectedRoomCode.replace(/\D/g, '') + '-2026',
                      reportNumber: existingReturnReport?.reportNumber || 'BB-TRA-' + selectedRoomCode.replace(/\D/g, '') + '-2026',
                      roomCode: selectedRoomCode,
                      leaseId: targetContract?.leaseId || '',
                      contractId: targetContract?.id || '',
                      status: 'Nháp',
                      date: bg08Date,
                      giverName: bg08Giver,
                      receiverName: bg08Receiver,
                      tenantSignedPaper: bg11TenantSigned,
                      tenantNotSignReason: bg11TenantSigned === 'Khách không ký' ? bg11NotSignReason : undefined,
                      tenantNotSignExchangeInfo: bg11TenantSigned === 'Khách không ký' ? bg11NotSignExchangeInfo : undefined,
                      ownerSignedPaper: bg11OwnerSigned ? 'Đã ký' : 'Chưa ký',
                      paperLocation: bg11PaperLocation,
                      signedDocumentScanUrl: bg11ScanUrl,
                      reviewRequired: false,
                      version: (existingReturnReport?.version || 1),
                      createdAt: existingReturnReport?.createdAt || new Date().toISOString()
                    };
                    const result = saveHandoverReturnReportBG11(rep);
                    showToast(result.success ? 'info' : 'error', result.message);
                  }}
                  disabled={existingReturnReport?.status === 'Đã xác nhận' || !targetContract}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Lưu nháp biên bản </button>

                {/* Lưu Đã lập (Bước 2) */}
                <button
                  disabled={!canSaveOfficially1102}
                  onClick={() => {
                    if (!canSaveOfficially1102) {
                      showToast('error', "Chưa đủ điều kiện Ngưỡng B (nhận lại và quyết toán cọc 5.8) để Lưu Đã lập.");
                      return;
                    }

                    const establishedRep: HandoverReturnReport = {
                      id: existingReturnReport?.id || 'BB-TRA-' + selectedRoomCode.replace(/\D/g, '') + '-2026',
                      reportNumber: existingReturnReport?.reportNumber || 'BB-TRA-' + selectedRoomCode.replace(/\D/g, '') + '-2026',
                      roomCode: selectedRoomCode,
                      leaseId: targetContract?.leaseId || '',
                      contractId: targetContract?.id || '',
                      status: 'Đã lập',
                      date: bg08Date,
                      giverName: bg08Giver,
                      receiverName: bg08Receiver,
                      tenantSignedPaper: bg11TenantSigned,
                      tenantNotSignReason: bg11TenantSigned === 'Khách không ký' ? bg11NotSignReason : undefined,
                      tenantNotSignExchangeInfo: bg11TenantSigned === 'Khách không ký' ? bg11NotSignExchangeInfo : undefined,
                      ownerSignedPaper: bg11OwnerSigned ? 'Đã ký' : 'Chưa ký',
                      paperLocation: bg11PaperLocation,
                      signedDocumentScanUrl: bg11ScanUrl,
                      depositSettlementId: matchingSettlementSlip!.id,
                      depositSettlementVersion: matchingSettlementSlip!.version,
                      depositSettlementAmount: matchingSettlementSlip!.initialDepositAmount,
                      depositRefundAmount: Math.max(0, matchingSettlementSlip!.calculatedResult),
                      depositDeductionAmount: matchingSettlementSlip!.deductions.reduce((sum, item) => sum + item.amount, 0),
                      depositAdditionalDue: Math.max(0, -matchingSettlementSlip!.calculatedResult),
                      depositTrackingStatus: '5.8 hợp lệ – Đã thống nhất',
                      reviewRequired: false,
                      version: (existingReturnReport?.version || 1),
                      createdAt: existingReturnReport?.createdAt || new Date().toISOString()
                    };

                    const result = saveHandoverReturnReportBG11(establishedRep);
                    showToast(result.success ? 'success' : 'error', result.message);
                  }}
                  className={`px-4 py-2 rounded-lg font-semibold cursor-pointer shadow-xs ${
                    canSaveOfficially1102
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  Lưu Đã lập </button>

                {/* Xác nhận hoàn tất (Bước 4 / ) */}
                <button
                  disabled={!canConfirmFinal324}
                  onClick={() => {
                    if (!canConfirmFinal324) {
                      showToast('error', ": Chưa đủ điều kiện xác nhận (cần trạng thái Đã lập, ghi nhận ký giấy thực tế và Chủ nhà ký).");
                      return;
                    }
                    const repId = existingReturnReport!.id;
                    const res = confirmFinalReturnReportBG11(
                      repId,
                      bg11TenantSigned,
                      bg11TenantSigned === 'Khách không ký' ? bg11NotSignReason : undefined,
                      bg11TenantSigned === 'Khách không ký' ? bg11NotSignExchangeInfo : undefined,
                      bg11PaperLocation,
                      bg11ScanUrl
                    );
                    showToast(res.success ? 'success' : 'error', toUserMessage(res.message));
                  }}
                  className={`px-4 py-2 rounded-lg font-semibold cursor-pointer shadow-xs flex items-center gap-1.5 ${
                    canConfirmFinal324
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <FileCheck2 className="w-4 h-4" />
                  <span>Xác nhận hoàn tất (Thao tác)</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* =========================================================================
          MODAL: THÊM LƯỢT LIÊN HỆ THỰC TẾ ( / )
      ========================================================================= */}
      {showAddContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Ghi nhận lượt liên hệ khách thuê</h3>
              </div>
              <button
                onClick={() => setShowAddContactModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Thời điểm liên hệ thực tế</label>
                <input
                  type="datetime-local"
                  value={newContactDate}
                  onChange={(e) => setNewContactDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kênh liên hệ</label>
                  <select
                    value={newContactChannel}
                    onChange={(e) => setNewContactChannel(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-medium"
                  >
                    <option value="Zalo">Zalo</option>
                    <option value="Điện thoại">Điện thoại</option>
                    <option value="Trực tiếp">Trực tiếp</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Người liên hệ</label>
                  <input
                    type="text"
                    value={newContactCaller}
                    onChange={(e) => setNewContactCaller(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kết quả cuộc gọi / trao đổi <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newContactResult}
                  onChange={(e) => setNewContactResult(e.target.value)}
                  placeholder="Ví dụ: Gọi không nghe máy / Khách hẹn gọi lại sau..."
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mô tả bằng chứng (ảnh chụp màn hình, lịch sử cuộc gọi)</label>
                <input
                  type="text"
                  value={newContactEvidence}
                  onChange={(e) => setNewContactEvidence(e.target.value)}
                  placeholder="Ví dụ: Ảnh chụp màn hình 3 cuộc gọi nhỡ lúc 14h..."
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowAddContactModal(false)}
                className="px- py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium cursor-pointer"
              >
                Hủy </button>
              <button
                onClick={() => {
                  if (!newContactResult.trim()) {
                    showToast('error', 'Vui lòng nhập kết quả cuộc gọi / liên hệ.');
                    return;
                  }
                  const logItem = {
                    id: 'log_' + Date.now(),
                    date: newContactDate,
                    channel: newContactChannel,
                    caller: newContactCaller,
                    result: newContactResult,
                    evidence: newContactEvidence || 'Đã ghi nhận trong nhật ký liên hệ'
                  };
                  setBg07ContactLogs(prev => [logItem, ...prev]);
                  showToast('success', 'Đã ghi nhận thêm một lượt liên hệ thực tế thành công!');
                  setShowAddContactModal(false);
                  setNewContactResult('');
                  setNewContactEvidence('');
                }}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold cursor-pointer"
              >
                Lưu lượt liên hệ </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: TRA CỨU HỒ SƠ QUYẾT TOÁN CỌC ĐÃ TỒN TẠI ( / )
      ========================================================================= */}
      {showAF03SettlementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Tra cứu hồ sơ quyết toán cọc đã tồn tại</h3>
                  <span className="text-[11px] text-slate-500">Đối chiếu thông tin với Quyết toán cọc – Phòng {selectedRoomCode}</span>
                </div>
              </div>
              <button
                onClick={() => setShowAF03SettlementModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-3 gap-2">
                <div>
                  <span className="text-slate-500 block text-[10px]">Phòng thuê:</span>
                  <span className="font-bold text-slate-800">{selectedRoomCode}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Hợp đồng:</span>
                  <span className="font-mono text-slate-800 font-semibold">{targetContract?.id || 'Chưa có'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Mã lần thuê:</span>
                  <span className="font-mono text-slate-800 font-semibold">{targetContract?.leaseId || selectedRoom.currentLeaseId}</span>
                </div>
              </div>

              {matchingSettlementSlip ? (
                <div className="space-y-3">
                  <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-950 text-xs">Hồ sơ quyết toán cọc hiện có:</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-200 text-indigo-900">
                        {matchingSettlementSlip.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-500 block">Mã hồ sơ:</span>
                        <span className="font-mono font-bold text-slate-800">{matchingSettlementSlip.id}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Cọc gốc ban đầu:</span>
                        <span className="font-bold text-emerald-700">{matchingSettlementSlip.initialDepositAmount.toLocaleString()} đ</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Kết quả quyết toán tính toán:</span>
                        <span className="font-bold text-blue-700">{matchingSettlementSlip.calculatedResult.toLocaleString()} đ</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Phản hồi của khách thuê:</span>
                        <span className="font-semibold text-slate-700">{matchingSettlementSlip.tenantFeedback || 'Chưa ghi nhận'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <span className="font-bold text-slate-800 text-xs block">Dữ liệu đối chiếu tài sản đã lưu:</span>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-500 block">Mã đối chiếu:</span>
                        <span className="font-mono font-semibold text-slate-800">{existingCompResult?.id || 'Chưa lưu'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Chênh lệch tài sản:</span>
                        <span className={`font-semibold ${existingCompResult?.hasDifference ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {existingCompResult?.hasDifference ? 'Có chênh lệch' : 'Không có chênh lệch'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Chi phí bồi thường ghi nhận:</span>
                        <span className="font-mono font-bold text-amber-700">
                          {(existingCompResult?.compensationAmount || 0).toLocaleString()} đ </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Mức độ thống nhất:</span>
                        <span className="font-semibold text-slate-800">{existingCompResult?.unanimousStatus || 'Chưa xác định'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[10px] space-y-1">
                    <strong>* Hướng dẫn &amp;:</strong>
                    <p>
                      Hệ thống hiển thị dữ liệu đã lưu để đối chiếu thông tin với hồ sơ quyết toán cọc hiện có. <strong>Hệ thống KHÔNG tự tạo thêm hồ sơ hoặc giao dịch quyết toán cọc từ </strong>. </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center space-y-2">
                  <FileSpreadsheet className="w-8 h-8 text-slate-400 mx-auto" />
                  <strong className="block text-slate-700 text-xs">Chưa có hồ sơ quyết toán cọc cho hợp đồng/lần thuê này</strong>
                  <p className="text-slate-500 text-[11px] max-w-sm mx-auto">
                    Nếu chưa có hồ sơ quyết toán cọc, Chủ nhà tiếp tục bước chuyển thông tin ngoài hệ thống tại thao tác. không tự mở hoặc tự tạo hồ sơ quyết toán cọc. </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-[10px] text-slate-400"> &amp; 11</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAF03SettlementModal(false)}
                  className="px- py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium cursor-pointer"
                >
                  Đóng </button>
                {matchingSettlementSlip && (
                  <button
                    onClick={() => {
                      setShowAF03SettlementModal(false);
                      setActiveTab('deposit_check_bg10');
                    }}
                    className="px- py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold cursor-pointer flex items-center gap-1"
                  >
                    <span>Xem chi tiết tại </span>
                    <ArrowRight className="w- h-" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ĐÍNH CHÍNH XÁC NHẬN 
      ========================================================================= */}
      {showCorrectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-slate-900 text-sm">Đính chính kết quả nhận lại phòng </h3>
              </div>
              <button
                onClick={() => setShowCorrectionModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-600">
              Hướng dẫn: Không sửa/xóa lặng lẽ. Đính chính phải tạo phiên bản mới trạng thái <em>Đính chính chờ xác nhận</em>, ghi rõ lý do và chứng cứ để kiểm tra sai lệch. </p>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Trạng thái nhận lại mới</label>
                <select
                  value={correctionNewStatus}
                  onChange={(e) => setCorrectionNewStatus(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-bold"
                >
                  <option value="Chưa nhận lại">Chưa nhận lại (Đảo từ Đã nhận lại &rarr; Chưa nhận lại)</option>
                  <option value="Đã nhận lại">Đã nhận lại (Bổ sung đủ kiểm tra)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lý do đính chính <span className="text-red-500">*</span></label>
                <textarea
                  rows={2}
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder="Ví dụ: Phát hiện còn sót chìa khóa phòng kho khách chưa giao..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bằng chứng đính chính <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={correctionEvidence}
                  onChange={(e) => setCorrectionEvidence(e.target.value)}
                  placeholder="Biên bản làm việc bổ sung..."
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowCorrectionModal(false)}
                className="px- py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium cursor-pointer"
              >
                Hủy </button>
              <button
                onClick={() => {
                  if (!correctionReason.trim() || !correctionEvidence.trim()) {
                    showToast('error', 'Vui lòng nhập lý do và bằng chứng đính chính.');
                    return;
                  }
                  const result = correctReturnInspectionStep305(
                    selectedRoomCode,
                    targetContract?.leaseId || '',
                    correctionNewStatus,
                    correctionReason,
                    correctionEvidence
                  );
                  if (!result.success) { showToast('error', result.message); return; }
                  showToast('success', result.message);
                  setShowCorrectionModal(false);
                }}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold cursor-pointer"
              >
                Xác nhận đính chính </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: BỔ SUNG TÀI SẢN VÀO DANH SÁCH KIỂM KÊ ( / )
      ========================================================================= */}
      {showAddAssetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Bổ sung tài sản vào danh sách kiểm kê</h3>
              </div>
              <button
                onClick={() => setShowAddAssetModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tên tài sản / Thiết bị phát hiện <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newAssetName}
                  onChange={(e) => setNewAssetName(e.target.value)}
                  placeholder="Ví dụ: Bình nóng lạnh Ariston 20L..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Đơn vị tính</label>
                  <input
                    type="text"
                    value={newAssetUnit}
                    onChange={(e) => setNewAssetUnit(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số lượng thực tế</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={newAssetQty}
                    onChange={(e) => setNewAssetQty(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tình trạng vật lý ban đầu</label>
                <select
                  value={newAssetCondition}
                  onChange={(e) => setNewAssetCondition(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Bình thường">Bình thường</option>
                  <option value="Hư hỏng">Hư hỏng</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ghi chú nguồn gốc phát hiện</label>
                <input
                  type="text"
                  value={newAssetNote}
                  onChange={(e) => setNewAssetNote(e.target.value)}
                  placeholder="Ví dụ: Thiết bị do chủ nhà trang bị thêm tháng trước..."
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowAddAssetModal(false)}
                className="px- py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium cursor-pointer"
              >
                Hủy </button>
              <button
                onClick={() => {
                  if (!newAssetName.trim()) {
                    showToast('error', 'Vui lòng nhập tên tài sản.');
                    return;
                  }
                  const newItem: RoomAssetItem = {
                    id: 'inv_custom_' + Date.now(),
                    assetId: 'ast_custom_' + Date.now(),
                    name: newAssetName.trim(),
                    unit: newAssetUnit.trim() || 'Cái',
                    standardQuantity: newAssetQty,
                    actualQuantity: newAssetQty,
                    quantityDiff: 'Đủ',
                    physicalCondition: newAssetCondition,
                    notes: newAssetNote ? newAssetNote + ' (Bổ sung tại )' : 'Bổ sung khi kiểm kê'
                  };
                  setInventoryItems(prev => [...prev, newItem]);
                  showToast('success', `Đã bổ sung tài sản "${newAssetName}" vào danh sách kiểm kê phòng ${selectedRoomCode}!`);
                  setShowAddAssetModal(false);
                  setNewAssetName('');
                  setNewAssetNote('');
                }}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold cursor-pointer"
              >
                Thêm vào danh sách </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: LIÊN KẾT HỢP ĐỒNG / LẦN THUÊ
      ========================================================================= */}
      {showLinkContractModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Liên kết Hợp đồng / Lần thuê thực tế</h3>
              </div>
              <button
                onClick={() => setShowLinkContractModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-600">
              Chọn hợp đồng thuê tương ứng của phòng <strong>{selectedRoomCode}</strong> để chuyển trạng thái từ <em>Chưa liên kết</em> sang <em>Đã liên kết</em>. </p>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Hợp đồng thuê phòng {selectedRoomCode}</label>
              <select
                value={linkContractId}
                onChange={(e) => setLinkContractId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono font-bold text-slate-800"
              >
                {contracts.filter(c => c.roomCode === selectedRoomCode && c.leaseId === selectedLeaseId && c.isSignedPaper).map(c => (
                  <option key={c.id} value={c.id}>
                    {c.id} - {c.tenantName} ({c.status}) </option>
                ))}
                {contracts.filter(c => c.roomCode === selectedRoomCode).length === 0 && (
                  <option value="">Không có hợp đồng nào thuộc phòng {selectedRoomCode}</option>
                )}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowLinkContractModal(false)}
                className="px- py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium cursor-pointer"
              >
                Hủy </button>
              <button
                onClick={() => {
                  const target = contracts.find(c => c.id === linkContractId);
                  if (!target) {
                    showToast('error', 'Vui lòng chọn một hợp đồng hợp lệ.');
                    return;
                  }
                  const updatedRec: InventoryRecord = {
                    id: existingInventory?.id || 'inv_' + selectedRoomCode.replace(/\D/g, '') + '_' + Date.now().toString().slice(-4),
                    roomCode: selectedRoomCode,
                    expectedBatchCode: existingInventory?.expectedBatchCode || 'DOT-2026-K10',
                    version: existingInventory?.version || 1,
                    inventoryStatus: existingInventory?.inventoryStatus || 'Đã hoàn tất',
                    linkStatus: 'Đã liên kết',
                    linkedContractId: target.id,
                    linkedLeaseId: target.leaseId,
                    items: inventoryItems,
                    completedAt: existingInventory?.completedAt || new Date().toISOString(),
                    completedBy: currentUser?.fullName || 'Chủ nhà'
                  };
                  const result = saveInventoryBG01(updatedRec);
                  showToast(result.success ? 'success' : 'error', result.message);
                  if (result.success) setShowLinkContractModal(false);
                }}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold cursor-pointer"
              >
                Xác nhận liên kết </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: GHI NHẬN KẾT QUẢ KÝ GIẤY BIÊN BẢN NHẬN PHÒNG (1.07 & 1.08 / BG03)
      ========================================================================= */}
      {showSignPaperModal && existingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileSignature className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">Ghi nhận kết quả ký giấy hai bên </h3>
              </div>
              <button
                onClick={() => setShowSignPaperModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-600">
              Ghi nhận kết quả ký tay ngoài hệ thống của Khách thuê và Chủ nhà trên bản giấy <strong>{existingReport.reportNumber} (v{existingReport.version})</strong>. </p>

            <div className="space-y-3 bg-slate-50 p- rounded-xl border border-slate-200">
              <label className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                <div>
                  <span className="font-bold text-slate-800 block">1. Khách thuê đã ký tay:</span>
                  <span className="text-[11px] text-slate-500">{existingReport.receiverName}</span>
                </div>
                <input
                  type="checkbox"
                  checked={signPaperTenant}
                  onChange={(e) => setSignPaperTenant(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                <div>
                  <span className="font-bold text-slate-800 block">2. Chủ nhà/Quản lý đã ký tay:</span>
                  <span className="text-[11px] text-slate-500">{existingReport.giverName}</span>
                </div>
                <input
                  type="checkbox"
                  checked={signPaperOwner}
                  onChange={(e) => setSignPaperOwner(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nơi lưu trữ bản giấy chính thức <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={paperLocation}
                  onChange={(e) => setPaperLocation(e.target.value)}
                  placeholder="Ví dụ: Tủ hồ sơ Tầng 1 - Kẹp P101..."
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tệp ảnh/scan bản giấy đã ký (tùy chọn)</label>
                <input
                  type="text"
                  value={signedDocumentScanUrl}
                  onChange={(e) => setSignedDocumentScanUrl(e.target.value)}
                  placeholder="https://... hoặc mã lưu trữ tệp scan"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono text-[11px]"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">Không bắt buộc tải scan; bản giấy vẫn là chứng cứ gốc.</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowSignPaperModal(false)}
                className="px- py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium cursor-pointer"
              >
                Hủy </button>
              <button
                onClick={() => {
                  const res = confirmHandoverSignaturesBG03(existingReport.id, signPaperTenant, signPaperOwner, paperLocation, signedDocumentScanUrl);
                  if (!res.success) { showToast('error', res.message); return; }
                  if (signPaperTenant && signPaperOwner) {
                    showToast('success', 'Đã ghi nhận cả 2 bên đã ký tay! Biên bản chuyển sang trạng thái ĐÃ XÁC NHẬN.');
                  } else {
                    showToast('info', 'Đã cập nhật tình trạng ký tay từng bên. Biên bản giữ trạng thái Đã lập cho đến khi cả hai bên đều ký.');
                  }
                  setShowSignPaperModal(false);
                }}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold cursor-pointer"
              >
                Lưu kết quả ký giấy </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
