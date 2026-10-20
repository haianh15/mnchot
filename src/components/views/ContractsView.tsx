import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Contract, LeaseConditionDraft } from '../../types';
import {
  FileText, Sliders, Edit3, Send, FileCheck, Calendar, RotateCcw,
  Sparkles, Layers, CheckCircle2, ShieldCheck
} from 'lucide-react';
import { HDT01LeaseConditions } from './contracts/HDT01LeaseConditions';
import { HDT02DraftContract } from './contracts/HDT02DraftContract';
import { HDT03SendAndNegotiate } from './contracts/HDT03SendAndNegotiate';
import { HDT04ReceiveSignedContract } from './contracts/HDT04ReceiveSignedContract';
import { HDT05BatchSchedules } from './contracts/HDT05BatchSchedules';
import { HDT05ContractExpiry } from './contracts/HDT05ContractExpiry';
import { ContractReturnTracking } from './contracts/ContractReturnTracking';
import { HDT06RenewalContract } from './contracts/HDT06RenewalContract';
import { DepositSettlementView } from './DepositSettlementView';
import { ContractDocument } from './contracts/ContractDocument';
import { getCurrentSettlementSlip, requiresDepositSettlement, isLastContractOfLease, canEditSettlement, canRecordSettlement, terminalSettlementStatuses } from '../../utils/settlementUi';
import { HDT07ActivateRenewal } from './contracts/HDT07ActivateRenewal';

export type ContractTabKey =
  | 'overview'
  | 'settlement'
  | 'conditions'
  | 'draft'
  | 'negotiate'
  | 'sign'
  | 'expiry'
  | 'returns'
  | 'schedules'
  | 'renewal'
  | 'activate';

export const ContractsView: React.FC<{initialContractId?: string; initialRoomCode?: string; initialAction?: 'create' | 'return-plans'; initialLeaseId?: string; onBackToRooms?: (roomCode: string) => void}> = ({initialContractId, initialRoomCode, initialAction, initialLeaseId, onBackToRooms}) => {
  const {
    contracts,
    leaseConditions,
    batchSchedules,
    settlementSlips,
    initialPaymentRecords,
    returnInspections,
    rooms,
    tenants,
    returnPlans
  } = useApp();

  const [activeTab, setActiveTab] = useState<ContractTabKey>('overview');

  const [selectedContractId, setSelectedContractId] = useState(initialContractId || '');
  const [pendingCreateRoomCode, setPendingCreateRoomCode] = useState<string | undefined>(initialAction === 'create' ? initialRoomCode : undefined);
  const [searchContract, setSearchContract] = useState('');
  const [settlementFilter, setSettlementFilter] = useState<'all'|'pending'>('all');
  const [settlementMode, setSettlementMode] = useState<'list'|'create'|'edit'|'result'|'view'>('list');
  const [settlementOpenId, setSettlementOpenId] = useState('');
  const [largeContractOpen, setLargeContractOpen] = useState(false);
  const [returnFocus, setReturnFocus] = useState<{roomCode?: string; leaseId?: string; contractId?: string}>({});
  const openReturnTracking = (record: {roomCode?: string; leaseId?: string; contractId?: string} = {}) => {
    setReturnFocus(record);
    setActiveTab('returns');
  };
  useEffect(() => {
    if (initialAction === 'return-plans') {
      setSelectedContractId(initialContractId || '');
      openReturnTracking({roomCode: initialRoomCode, leaseId: initialLeaseId, contractId: initialContractId});
    } else if (initialAction === 'create' && initialRoomCode) {
      setSelectedContractId('');
      setPendingCreateRoomCode(initialRoomCode);
      setActiveTab('conditions');
    } else if (initialContractId) {
      setSelectedContractId(initialContractId);
      setActiveTab('overview');
    }
  }, [initialContractId, initialRoomCode, initialLeaseId, initialAction]);
  const selectedContract = contracts.find(c => c.id === selectedContractId);
  const selectedTenant = selectedContract ? tenants.find(t => t.id === selectedContract.tenantId) : undefined;
  const selectedRoom = selectedContract ? rooms.find(r => r.roomCode === selectedContract.roomCode) : undefined;
  const activeSlip = selectedContract ? getCurrentSettlementSlip(settlementSlips, selectedContract.leaseId, selectedContract.roomCode) : null;
  const needsSettlement = !!selectedContract && requiresDepositSettlement(selectedContract, contracts, returnInspections, settlementSlips);
  const isLatestForSettlement = !!selectedContract && isLastContractOfLease(selectedContract, contracts);
  const openSettlement = (mode: typeof settlementMode, slipId = '') => {
    setSettlementMode(mode);
    setSettlementOpenId(slipId);
    setActiveTab('settlement');
  };

  // Khi đóng quy trình quyết toán được mở từ hợp đồng, quay về danh sách hợp đồng
  // thay vì để người dùng mắc lại ở màn hình danh sách phiếu quyết toán.
  const returnToContractList = () => {
    setSettlementMode('list');
    setSettlementOpenId('');
    setSelectedContractId('');
    setLargeContractOpen(false);
    setActiveTab('overview');
  };
  const displayedContracts = contracts.filter(c =>
    [c.id, c.roomCode, c.tenantName].join(' ').toLowerCase().includes(searchContract.toLowerCase()) &&
    (settlementFilter === 'all' || requiresDepositSettlement(c, contracts, returnInspections, settlementSlips))
  );
  const firstPayment = initialPaymentRecords.find(r => r.leaseId === selectedContract?.leaseId && r.roomCode === selectedContract?.roomCode);
  const hasReturnConfirmation = returnInspections.some(i => i.leaseId === selectedContract?.leaseId && i.roomCode === selectedContract?.roomCode && i.step304Status === 'Đã nhận lại' && i.step305Confirmed);
  const hasCurrentReturnPlan = !!selectedContract && rooms.some(room =>
    room.roomCode === selectedContract.roomCode && room.status !== 'Trống' &&
    room.currentLeaseId === selectedContract.leaseId && !!room.expectedReturnDate &&
    returnPlans.some(plan => plan.roomCode === room.roomCode && plan.leaseId === selectedContract.leaseId &&
      plan.status === 'Còn theo dõi' && plan.expectedDate === room.expectedReturnDate)
  );
  // Inter-tab State
  const [selectedConditionForDraft, setSelectedConditionForDraft] = useState<LeaseConditionDraft | null>(null);
  const [selectedContractForSign, setSelectedContractForSign] = useState<Contract | null>(null);

  const handleNavigateToTab = (tab: ContractTabKey) => {
    setActiveTab(tab);
  };

  const handleSelectConditionForDraft = (condition: LeaseConditionDraft) => {
    setSelectedConditionForDraft(condition);
    setActiveTab('draft');
  };

  const handleSelectContractForSign = (contract: Contract) => {
    setSelectedContractForSign(contract);
    setActiveTab('sign');
  };

  // Counts for Badges
  const conditionsCount = leaseConditions.length;
  const draftOrNegotiatingCount = contracts.filter(c => c.status === 'Nháp' || c.status === 'Chờ khách ký').length;
  const renewalCount = contracts.filter(c => c.contractType === 'Hợp đồng nối tiếp').length;

  return (
    <div className="space-y-6">
      {/* Màn hình mặc định theo biên bản: danh sách hợp đồng trước, chi tiết sau */}
      {activeTab === 'overview' && <div className="space-y-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h1 className="font-bold text-lg text-slate-900">Danh sách hợp đồng</h1>
          <p className="text-xs text-slate-500 mt-1">Chọn hợp đồng để xem chi tiết, gia hạn hoặc quyết toán cọc theo điều kiện.</p>
          <div className="flex flex-wrap gap-2 mt-3 items-center">
            <input value={searchContract} onChange={e=>setSearchContract(e.target.value)} placeholder="Tìm mã hợp đồng, phòng hoặc khách thuê" className="w-full sm:w-auto sm:flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <label className="text-xs text-slate-600 flex items-center gap-2">Tình trạng quyết toán cọc
              <select aria-label="Tình trạng quyết toán cọc" value={settlementFilter} onChange={e=>setSettlementFilter(e.target.value as 'all'|'pending')} className="rounded-lg border border-slate-300 p-2 text-sm bg-white">
                <option value="all">Tất cả</option>
                <option value="pending">Cần hoàn tất quyết toán cọc</option>
              </select>
            </label>
            <button onClick={()=>{setSelectedContractId('');openSettlement('list');}} className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">Quản lý quyết toán cọc</button>
            <button onClick={()=>setActiveTab('schedules')} className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">Lịch hợp đồng chung</button>
            <button onClick={()=>openReturnTracking()} className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">Theo dõi trả phòng</button>
            <button onClick={()=>setActiveTab('expiry')} className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">Theo dõi hạn hợp đồng</button>
            <button onClick={()=>setActiveTab('conditions')} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold">+ Lập hợp đồng</button>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2 bg-white rounded-xl border p-3 space-y-2 max-h-[650px] overflow-y-auto">
            {displayedContracts.map(c=><button key={c.id} onClick={()=>{setSelectedContractId(c.id);setLargeContractOpen(false);}} className={`w-full text-left p-3 border rounded-lg text-sm ${c.id===selectedContractId?'bg-blue-50 border-blue-500':'hover:bg-slate-50 border-slate-200'}`}>
              <strong>{c.id}</strong> · {c.roomCode}<div className="text-xs text-slate-600 mt-1">{c.tenantName}</div><div className="text-xs text-slate-500">{c.startDate} → {c.endDate} · {c.status}</div>
              {requiresDepositSettlement(c, contracts, returnInspections, settlementSlips) &&
               <span className="inline-block mt-2 rounded bg-amber-100 text-amber-800 px-2 py-1 text-xs font-semibold">Cần hoàn tất quyết toán cọc</span>}
            </button>)}
            {displayedContracts.length===0 && <p className="text-sm text-slate-500">Không có hợp đồng phù hợp bộ lọc.</p>}
          </div>
          <div className="lg:col-span-3 bg-white rounded-xl border p-4 space-y-4">
            {!selectedContract || !displayedContracts.some(c => c.id === selectedContract.id) ? <p className="text-sm text-slate-500">Chọn một hợp đồng trong danh sách để xem chi tiết.</p> : <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-bold text-base">Chi tiết hợp đồng {selectedContract.id}</h2>
                  <p className="text-xs text-slate-500">Phòng {selectedContract.roomCode} · {selectedContract.status} · Lần thuê {selectedContract.leaseId}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <button type="button" onClick={()=>setLargeContractOpen(true)} className="px-3 py-2 bg-blue-600 text-white rounded-lg font-semibold">Xem bản hợp đồng khổ lớn</button>
                  <button type="button" onClick={()=>window.print()} className="px-3 py-2 border border-slate-300 rounded-lg font-semibold">In / Lưu PDF</button>
                </div>
              </div>
              <div className="rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs p-3">
                Đây là bản trình bày thông tin hợp đồng từ dữ liệu đang lưu, <strong>không thay thế bản giấy có chữ ký</strong>. Hồ sơ hiện chưa lưu đầy đủ thông tin Bên cho thuê và điều khoản chi tiết; các phần đó được để trống hoặc ghi rõ chưa có dữ liệu.
              </div>
              {!largeContractOpen && <ContractDocument contract={selectedContract} tenant={selectedTenant} room={selectedRoom} />}
              <div className="rounded-lg bg-slate-50 p-3 border text-sm">
                <p><span className="text-slate-500">Tình trạng ký bản giấy:</span> <strong>{selectedContract.isSignedPaper ? 'Đã ghi nhận ký' : 'Chưa ghi nhận ký'}</strong></p>
                <p><span className="text-slate-500">Cọc gốc đã xác nhận:</span> {firstPayment ? `${firstPayment.depositAmount.toLocaleString('vi-VN')}đ` : 'Chưa có chứng từ thanh toán ban đầu'}</p>
                {!!selectedContract.signedProofFiles?.length && <p><span className="text-slate-500">Tên tệp chứng cứ ký được ghi nhận:</span> {selectedContract.signedProofFiles.join(', ')}</p>}
              </div>
              <div className="rounded-xl border border-slate-200 p-3 bg-slate-50 space-y-2">
                <h3 className="font-semibold text-sm">Quyết toán cọc</h3>
                <p className="text-xs text-slate-600">Tình trạng phiếu: {activeSlip?.status || (hasReturnConfirmation ? 'Chưa lập phiếu' : 'Chưa đến giai đoạn quyết toán')}</p>
                {needsSettlement && <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2">Cần hoàn tất quyết toán cọc của lần thuê này.</p>}
                <div className="flex flex-wrap gap-2">
                  {hasReturnConfirmation && isLatestForSettlement && !activeSlip && <button className="px-3 py-2 text-sm rounded-lg bg-blue-600 text-white" onClick={()=>openSettlement('create')}>Lập quyết toán cọc</button>}
                  {activeSlip && isLatestForSettlement && (canEditSettlement(activeSlip) || activeSlip.status === 'Tranh chấp') && <button className="px-3 py-2 text-sm rounded-lg bg-blue-600 text-white" onClick={()=>openSettlement('edit',activeSlip.id)}>Sửa</button>}
                  {activeSlip && isLatestForSettlement && canRecordSettlement(activeSlip) && <button className="px-3 py-2 text-sm rounded-lg bg-emerald-600 text-white" onClick={()=>openSettlement('result',activeSlip.id)}>Ghi nhận kết quả quyết toán</button>}
                  {activeSlip && isLatestForSettlement && (terminalSettlementStatuses.includes(activeSlip.status) || activeSlip.step58Published || activeSlip.status === 'Tranh chấp' || activeSlip.status === 'Không liên hệ được' || activeSlip.status === 'Đã hủy') &&
                    <button className="px-3 py-2 text-sm rounded-lg border bg-white" onClick={()=>openSettlement('view',activeSlip.id)}>Xem phiếu quyết toán</button>}
                </div>
                {!isLatestForSettlement && <p className="text-xs text-slate-600">Hợp đồng này đã được nối tiếp trong cùng lần thuê. Việc quyết toán cọc được thực hiện tại hợp đồng cuối cùng, không tạo phiếu ở hợp đồng cũ.</p>}
                {!hasReturnConfirmation && isLatestForSettlement && <p className="text-xs text-amber-700">Chỉ lập quyết toán khi đã xác nhận nhận lại phòng thực tế.</p>}
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                {hasCurrentReturnPlan && selectedContract && <button onClick={()=>openReturnTracking({roomCode: selectedContract.roomCode, leaseId: selectedContract.leaseId, contractId: selectedContract.id})} className="px-3 py-2 rounded-lg border">Xem kế hoạch trả phòng</button>}
                {onBackToRooms && <button onClick={()=>onBackToRooms(selectedContract.roomCode)} className="px-3 py-2 rounded-lg border">Xem phòng</button>}
                {selectedContract.status==='Nháp' && <button onClick={()=>setActiveTab('negotiate')} className="px-3 py-2 rounded-lg border">Điều chỉnh dự thảo</button>}
                {['Nháp','Chờ khách ký'].includes(selectedContract.status) && <button onClick={()=>handleSelectContractForSign(selectedContract)} className="px-3 py-2 rounded-lg border">Ghi nhận ký</button>}
                {['Hiệu lực','Đã ký','Chờ hiệu lực'].includes(selectedContract.status) && <button onClick={()=>setActiveTab('renewal')} className="px-3 py-2 rounded-lg border">Lập hợp đồng nối tiếp</button>}
              </div>
            </>}
          </div>
        </div>
      </div>}
      {activeTab === 'overview' && largeContractOpen && selectedContract && displayedContracts.some(c => c.id === selectedContract.id) && (
        <div className="contract-fullscreen-modal fixed inset-0 z-[80] bg-slate-900/80 p-2 sm:p-5 overflow-y-auto" role="dialog" aria-modal="true" aria-label={`Bản hợp đồng ${selectedContract.id}`}>
          <div className="max-w-[225mm] mx-auto">
            <div className="contract-toolbar bg-white px-3 py-2 mb-3 rounded-lg flex items-center justify-between gap-2 text-sm shadow-lg">
              <span className="font-semibold truncate">Hợp đồng {selectedContract.id}</span>
              <div className="flex gap-2 shrink-0">
                <button type="button" onClick={()=>window.print()} className="rounded-lg bg-blue-600 text-white px-3 py-2">In / Lưu PDF</button>
                <button type="button" onClick={()=>setLargeContractOpen(false)} className="rounded-lg border px-3 py-2">Đóng</button>
              </div>
            </div>
            <ContractDocument contract={selectedContract} tenant={selectedTenant} room={selectedRoom} />
          </div>
        </div>
      )}
      {activeTab === 'settlement' && (selectedContract || settlementMode === 'list') && <div className="space-y-3">
        <button type="button" onClick={returnToContractList} className="px-3 py-2 border rounded-lg text-sm bg-white">← Danh sách hợp đồng</button>
        <DepositSettlementView key={`${settlementMode}-${selectedContract?.leaseId || 'all'}-${settlementOpenId}`} leaseId={settlementMode === 'list' ? undefined : selectedContract?.leaseId} contractId={selectedContract?.id} initialMode={settlementMode} initialSlipId={settlementOpenId} onCreateClose={returnToContractList} />
      </div>}
      {/* Action screens are contextual. The page no longer exposes every UC as a navigation tab. */}
      {activeTab !== 'overview' && activeTab !== 'settlement' && activeTab !== 'returns' && <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap gap-3 items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-blue-700">Quản lý hợp đồng</p>
          <h1 className="font-bold text-lg">{{conditions:'Ghi nhận điều kiện thuê đã thống nhất',draft:'Lập dự thảo hợp đồng',negotiate:'Điều chỉnh dự thảo',sign:'Ghi nhận hợp đồng đã ký',expiry:'Theo dõi hạn hợp đồng',returns:'Theo dõi trả phòng',schedules:'Lịch đợt hợp đồng chung',renewal:'Lập hợp đồng nối tiếp',activate:'Ghi nhận ký hợp đồng nối tiếp'}[activeTab]}</h1>
        </div>
        <button onClick={()=>setActiveTab('overview')} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50">← Danh sách hợp đồng</button>
      </div>}
      {activeTab === 'returns' && <ContractReturnTracking
        focusRoomCode={returnFocus.roomCode}
        focusLeaseId={returnFocus.leaseId}
        focusContractId={returnFocus.contractId}
        onSelectContract={id => { setSelectedContractId(id); setActiveTab('overview'); }}
        onBack={() => {setReturnFocus({});setActiveTab('overview');}} onOpenRoom={onBackToRooms}
      />}
      {activeTab === 'expiry' && <HDT05ContractExpiry onSelectContract={(id)=>{setSelectedContractId(id);setActiveTab('overview');}}/>}
      {/* Tab Panels */}
      <div>
        {activeTab === 'conditions' && (
          <HDT01LeaseConditions
            initialRoomCode={pendingCreateRoomCode}
            onInitialRoomConsumed={() => setPendingCreateRoomCode(undefined)}
            onNavigateToTab={handleNavigateToTab}
            onSelectConditionForDraft={handleSelectConditionForDraft}
          />
        )}

        {activeTab === 'draft' && (
          <HDT02DraftContract
            initialCondition={selectedConditionForDraft}
            onNavigateToTab={handleNavigateToTab}
            onContractCreated={() => {
              setSelectedConditionForDraft(null);
            }}
          />
        )}

        {activeTab === 'negotiate' && (
          <HDT03SendAndNegotiate
            onNavigateToTab={handleNavigateToTab}
            onSelectContractForSign={handleSelectContractForSign}
          />
        )}

        {activeTab === 'sign' && (
          <HDT04ReceiveSignedContract
            initialContract={selectedContractForSign}
            onNavigateToTab={handleNavigateToTab}
            onSigned={(contractId) => { setSelectedContractId(contractId); setActiveTab('overview'); }}
          />
        )}

        {activeTab === 'schedules' && (
          <HDT05BatchSchedules />
        )}

        {activeTab === 'renewal' && (
          <HDT06RenewalContract
            onNavigateToTab={handleNavigateToTab}
          />
        )}

        {activeTab === 'activate' && (
          <HDT07ActivateRenewal />
        )}
      </div>
    </div>
  );
};
