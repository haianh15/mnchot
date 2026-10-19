import React, { useEffect, useState } from 'react';
import { ArrowLeft, FileText, History, ShieldCheck, Users, UserRound, Pencil } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { HSKT01RegisterTenant } from './tenants/HSKT01RegisterTenant';
import { HSKT02CoTenants } from './tenants/HSKT02CoTenants';
import { HSKT03VerifyChanges } from './tenants/HSKT03VerifyChanges';
import { HSKT04UpdateTenant } from './tenants/HSKT04UpdateTenant';
import { HSKT05HistoryAudit } from './tenants/HSKT05HistoryAudit';

// These are workflow screens, not global navigation tabs.
export type TenantTabKey = 'tenants' | 'co_tenants' | 'verify' | 'update' | 'history';
type TenantScreen = TenantTabKey | 'detail';

export const TenantsView: React.FC<{initialTenantId?: string}> = ({initialTenantId}) => {
  const { tenants, coTenants, contracts, tenantHistory } = useApp();
  const [screen, setScreen] = useState<TenantScreen>(initialTenantId ? 'detail' : 'tenants');
  const [selectedTenantId, setSelectedTenantId] = useState<string | undefined>(initialTenantId);
  const [selectedProposalId, setSelectedProposalId] = useState<string | undefined>();
  const [detailSection, setDetailSection] = useState<'information' | 'co_tenants' | 'history'>('information');
  const selectedTenant = tenants.find(t => t.id === selectedTenantId);
  const relatedContracts = contracts.filter(c => c.tenantId === selectedTenantId);
  const latestContract = relatedContracts.find(c => ['Hiệu lực','Chờ hiệu lực','Đã ký'].includes(c.status)) || relatedContracts[0];

  useEffect(() => {
    if (initialTenantId) {
      setSelectedTenantId(initialTenantId);
      setScreen('detail');
      setDetailSection('information');
    }
  }, [initialTenantId]);

  const openTenant = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    setScreen('detail');
    setDetailSection('information');
  };
  const openUpdate = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    setSelectedProposalId(undefined);
    setScreen('update');
  };
  const openProposal = (proposalId: string) => {
    setSelectedProposalId(proposalId);
    setScreen('update');
  };
  const goToWorkflow = (tab: TenantTabKey) => {
    setScreen(tab);
    if (tab === 'co_tenants') setDetailSection('co_tenants');
    if (tab === 'history') setDetailSection('history');
  };

  const buttonStyle = 'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50';
  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
        <div className="flex flex-wrap justify-between gap-3 items-center">
          <div>
            <p className="text-xs font-medium text-blue-700">Quản lý hồ sơ</p>
            <h1 className="text-xl font-bold text-slate-900">Hồ sơ khách thuê</h1>
            <p className="text-xs text-slate-500 mt-1">Tra cứu và chọn khách thuê để xem người ở cùng, kiểm tra thay đổi và lịch sử hồ sơ.</p>
          </div>
          {screen !== 'tenants' && <button className={buttonStyle} onClick={() => setScreen('tenants')}><ArrowLeft className="w-4 h-4"/> Danh sách khách thuê</button>}
        </div>
      </div>

      {screen === 'tenants' && <HSKT01RegisterTenant
        onNavigateToTab={goToWorkflow}
        onSelectTenantForUpdate={openUpdate}
        onSelectTenant={openTenant}
      />}

      {screen === 'detail' && (
        !selectedTenant ? <div className="rounded-xl border bg-white p-5 text-sm text-slate-600">Không tìm thấy hồ sơ được chọn. <button className="text-blue-700 underline" onClick={() => setScreen('tenants')}>Quay lại danh sách</button></div> :
        <div className="space-y-4">
          <div className="rounded-2xl border bg-white p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap gap-3 justify-between items-start">
              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-blue-50 text-blue-700 p-3"><UserRound className="w-5 h-5"/></span>
                <div>
                  <h2 className="font-bold text-lg">{selectedTenant.fullName}</h2>
                  <p className="text-xs text-slate-500">Mã hồ sơ: {selectedTenant.id} · {selectedTenant.verificationStatus}</p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button className={buttonStyle} onClick={() => setScreen('verify')}><ShieldCheck className="w-4 h-4"/> Kiểm tra thay đổi</button>
                <button className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 text-sm font-semibold inline-flex items-center gap-2" onClick={() => openUpdate(selectedTenant.id)}><Pencil className="w-4 h-4"/> Cập nhật hồ sơ</button>
              </div>
            </div>
            <div className="flex gap-2 border-b border-slate-200 overflow-x-auto" role="tablist" aria-label="Chi tiết khách thuê">
              {([
                ['information','Thông tin hồ sơ',FileText],
                ['co_tenants',`Người ở cùng (${coTenants.filter(t=>t.tenantId===selectedTenantId).length})`,Users],
                ['history',`Lịch sử thay đổi (${tenantHistory.filter(t=>t.tenantId===selectedTenantId).length})`,History]
              ] as const).map(([tab,label,Icon]) => <button key={tab} role="tab" aria-selected={detailSection===tab} onClick={()=>setDetailSection(tab)} className={`inline-flex shrink-0 gap-2 items-center text-xs sm:text-sm font-semibold px-3 py-3 border-b-2 ${detailSection===tab?'text-blue-700 border-blue-600':'border-transparent text-slate-600 hover:text-blue-700'}`}><Icon className="w-4 h-4"/>{label}</button>)}
            </div>
            {detailSection === 'information' && <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {([
                ['Họ và tên',selectedTenant.fullName],
                ['Số điện thoại',selectedTenant.phoneNumber || 'Chưa có'],
                ['CCCD / Định danh',selectedTenant.idNumber || 'Chưa cung cấp'],
                ['Địa chỉ',selectedTenant.address || 'Chưa có'],
                ['Tình trạng giấy tờ',selectedTenant.paperStatus],
                ['Kết quả xác minh',selectedTenant.verificationStatus],
                ['Phòng (theo hợp đồng)',latestContract?.roomCode || 'Chưa có hợp đồng'],
                ['Hợp đồng',latestContract?.id || 'Chưa có'],
                ['Trạng thái hợp đồng',latestContract?.status || 'Chưa có'],
                ['Ghi chú',selectedTenant.notes || '—'],
              ] as const).map(([label,val]) => <div className="p-3 bg-slate-50 rounded-lg border border-slate-100" key={label}><div className="text-xs text-slate-500 mb-1">{label}</div><div className="font-medium break-words">{val}</div></div>)}
            </div>}
          </div>
          {detailSection === 'co_tenants' && <HSKT02CoTenants tenantId={selectedTenant.id}/>}
          {detailSection === 'history' && <HSKT05HistoryAudit tenantId={selectedTenant.id}/>}
        </div>
      )}

      {screen === 'co_tenants' && <HSKT02CoTenants tenantId={selectedTenantId}/>}
      {screen === 'history' && <HSKT05HistoryAudit tenantId={selectedTenantId}/>}
      {screen === 'verify' && <HSKT03VerifyChanges initialTenantId={selectedTenantId} onNavigateToTab={goToWorkflow} onSelectProposalForUpdate={openProposal}/>}
      {screen === 'update' && <HSKT04UpdateTenant initialTenantId={selectedTenantId} initialProposalId={selectedProposalId} onNavigateToTab={goToWorkflow}/>}
    </section>
  );
};
