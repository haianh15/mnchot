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
import { HDT06RenewalContract } from './contracts/HDT06RenewalContract';
import { DepositSettlementView } from './DepositSettlementView';
import { HDT07ActivateRenewal } from './contracts/HDT07ActivateRenewal';

export type ContractTabKey =
  | 'overview'
  | 'settlement'
  | 'conditions'
  | 'draft'
  | 'negotiate'
  | 'sign'
  | 'schedules'
  | 'renewal'
  | 'activate';

export const ContractsView: React.FC<{initialContractId?: string; onBackToRooms?: (roomCode: string) => void}> = ({initialContractId, onBackToRooms}) => {
  const {
    contracts,
    leaseConditions,
    batchSchedules,
    settlementSlips,
    initialPaymentRecords,
    returnInspections
  } = useApp();

  const [activeTab, setActiveTab] = useState<ContractTabKey>('overview');

  const [selectedContractId, setSelectedContractId] = useState(initialContractId || '');
  const [searchContract, setSearchContract] = useState('');
  useEffect(() => { if (initialContractId) {setSelectedContractId(initialContractId); setActiveTab('overview');} }, [initialContractId]);
  const selectedContract = contracts.find(c => c.id === selectedContractId);
  const linkedSlips = settlementSlips.filter(s => s.leaseId === selectedContract?.leaseId);
  const firstPayment = initialPaymentRecords.find(r => r.leaseId === selectedContract?.leaseId);
  const hasReturnConfirmation = returnInspections.some(i => i.leaseId === selectedContract?.leaseId && i.step304Status === 'Đã nhận lại' && i.step305Confirmed);
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
          <h1 className="font-bold text-lg text-slate-900">Quản lý hợp đồng · Danh sách hợp đồng</h1>
          <p className="text-xs text-slate-500 mt-1">Chọn hợp đồng để xem chi tiết, gia hạn hoặc quyết toán cọc theo điều kiện.</p>
          <input value={searchContract} onChange={e=>setSearchContract(e.target.value)} placeholder="Tìm mã hợp đồng, phòng hoặc khách thuê" className="mt-3 w-full md:w-96 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2 bg-white rounded-xl border p-3 space-y-2 max-h-[650px] overflow-y-auto">
            {contracts.filter(c=>[c.id,c.roomCode,c.tenantName].join(' ').toLowerCase().includes(searchContract.toLowerCase())).map(c=><button key={c.id} onClick={()=>setSelectedContractId(c.id)} className={`w-full text-left p-3 border rounded-lg text-sm ${c.id===selectedContractId?'bg-blue-50 border-blue-500':'hover:bg-slate-50 border-slate-200'}`}>
              <strong>{c.id}</strong> · {c.roomCode}<div className="text-xs text-slate-600 mt-1">{c.tenantName}</div><div className="text-xs text-slate-500">{c.startDate} → {c.endDate} · {c.status}</div>
            </button>)}
            {contracts.length===0 && <p className="text-sm text-slate-500">Chưa có hợp đồng.</p>}
          </div>
          <div className="lg:col-span-3 bg-white rounded-xl border p-4 space-y-4">
            {!selectedContract ? <p className="text-sm text-slate-500">Chọn một hợp đồng trong danh sách để xem chi tiết.</p> : <>
              <h2 className="font-bold text-base">Chi tiết hợp đồng {selectedContract.id}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <p><span className="text-slate-500">Phòng:</span> {selectedContract.roomCode}</p>
                <p><span className="text-slate-500">Khách thuê:</span> {selectedContract.tenantName}</p>
                <p><span className="text-slate-500">Lần thuê:</span> {selectedContract.leaseId}</p>
                <p><span className="text-slate-500">Trạng thái:</span> {selectedContract.status}</p>
                <p><span className="text-slate-500">Từ ngày:</span> {selectedContract.startDate}</p>
                <p><span className="text-slate-500">Đến ngày:</span> {selectedContract.endDate}</p>
                <p><span className="text-slate-500">Tiền thuê:</span> {selectedContract.monthlyRent.toLocaleString('vi-VN')}đ/tháng</p>
                <p><span className="text-slate-500">Cọc gốc đã xác nhận:</span> {firstPayment ? `${firstPayment.depositAmount.toLocaleString('vi-VN')}đ` : 'Chưa có chứng cứ thanh toán ban đầu'}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3 bg-slate-50 space-y-2">
                <h3 className="font-semibold text-sm">Quyết toán cọc (thuộc hồ sơ hợp đồng)</h3>
                <p className="text-xs text-slate-600">Tình trạng: {linkedSlips.length ? linkedSlips[0].status : hasReturnConfirmation ? 'Chưa lập phiếu — cần xử lý' : 'Chưa đủ điều kiện nhận lại phòng'}</p>
                {hasReturnConfirmation && <button className="px-3 py-2 text-sm rounded-lg bg-blue-600 text-white" onClick={()=>setActiveTab('settlement')}>{linkedSlips.length ? 'Xem / xử lý phiếu quyết toán' : 'Lập quyết toán cọc'}</button>}
                {!hasReturnConfirmation && <p className="text-xs text-amber-700">Cần xác nhận nhận lại phòng thực tế trước khi lập phiếu.</p>}
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                {onBackToRooms && <button onClick={()=>onBackToRooms(selectedContract.roomCode)} className="px-3 py-2 rounded-lg border">Xem phòng</button>}
                {selectedContract.status==='Nháp' && <button onClick={()=>{setSelectedContractForSign(selectedContract);setActiveTab('draft')}} className="px-3 py-2 rounded-lg border">Sửa dự thảo</button>}
                {['Nháp','Chờ khách ký'].includes(selectedContract.status) && <button onClick={()=>handleSelectContractForSign(selectedContract)} className="px-3 py-2 rounded-lg border">Ghi nhận ký</button>}
                {['Hiệu lực','Đã ký','Chờ hiệu lực'].includes(selectedContract.status) && <button onClick={()=>setActiveTab('renewal')} className="px-3 py-2 rounded-lg border">Lập hợp đồng nối tiếp</button>}
              </div>
            </>}
          </div>
        </div>
        <button onClick={()=>setActiveTab('conditions')} className="text-sm text-blue-700 underline">Ghi nhận điều kiện thuê đã thống nhất / công cụ lập hợp đồng</button>
      </div>}
      {activeTab === 'settlement' && selectedContract && <div className="space-y-3">
        <button onClick={()=>setActiveTab('overview')} className="px-3 py-2 border rounded-lg text-sm bg-white">← Quay lại Chi tiết hợp đồng</button>
        <DepositSettlementView leaseId={selectedContract.leaseId} />
      </div>}
      {/* Top Header Card */}
      {activeTab !== 'overview' && activeTab !== 'settlement' && <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900">
              Quản lý hợp đồng
            </h1>
            
          </div>

        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs overflow-x-auto shrink-0 max-w-full">
          <button
            onClick={() => setActiveTab('conditions')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'conditions'
                ? 'bg-white text-blue-700 shadow-xs font-bold': 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Điều kiện thuê ({conditionsCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('draft')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'draft'
                ? 'bg-white text-blue-700 shadow-xs font-bold': 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Lập/Sửa nháp</span>
          </button>

          <button
            onClick={() => setActiveTab('negotiate')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'negotiate'
                ? 'bg-white text-amber-700 shadow-xs font-bold': 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Gửi ký ({draftOrNegotiatingCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('sign')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'sign'
                ? 'bg-white text-emerald-700 shadow-xs font-bold': 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Ghi nhận ký</span>
          </button>

          <button
            onClick={() => setActiveTab('schedules')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'schedules'
                ? 'bg-white text-slate-900 shadow-xs font-bold': 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Lịch đợt thanh toán ({batchSchedules.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('renewal')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'renewal'
                ? 'bg-white text-indigo-700 shadow-xs font-bold': 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Gia hạn hợp đồng ({renewalCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('activate')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'activate'
                ? 'bg-white text-purple-700 shadow-xs font-bold': 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Kích hoạt hợp đồng nối tiếp</span>
          </button>
        </div>
      </div>}

      {activeTab !== 'overview' && activeTab !== 'settlement' && <button onClick={()=>setActiveTab('overview')} className="mb-3 px-3 py-2 border rounded-lg text-sm bg-white">← Danh sách hợp đồng</button>}
      {/* Tab Panels */}
      <div>
        {activeTab === 'conditions' && (
          <HDT01LeaseConditions
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
