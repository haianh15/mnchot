import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users, UserPlus, ShieldCheck, History, Edit, FileText,
  Layers, CheckCircle2, AlertCircle
} from 'lucide-react';
import { HSKT01RegisterTenant } from './tenants/HSKT01RegisterTenant';
import { HSKT02CoTenants } from './tenants/HSKT02CoTenants';
import { HSKT03VerifyChanges } from './tenants/HSKT03VerifyChanges';
import { HSKT04UpdateTenant } from './tenants/HSKT04UpdateTenant';
import { HSKT05HistoryAudit } from './tenants/HSKT05HistoryAudit';

export type TenantTabKey = 'tenants' | 'co_tenants' | 'verify' | 'update' | 'history';

export const TenantsView: React.FC<{initialTenantId?: string}> = ({initialTenantId}) => {
  const { tenants, coTenants, tenantProposals, tenantHistory } = useApp();

  const [activeTab, setActiveTab] = useState<TenantTabKey>('tenants');

  // Inter-tab navigation state
  const [selectedTenantForUpdate, setSelectedTenantForUpdate] = useState<string | undefined>(initialTenantId);
  const [selectedProposalForUpdate, setSelectedProposalForUpdate] = useState<string | undefined>();

  const handleNavigateToTab = (tab: TenantTabKey) => {
    setActiveTab(tab);
  };

  const handleSelectTenantForUpdate = (tenantId: string) => {
    setSelectedTenantForUpdate(tenantId);
    setActiveTab('update');
  };

  const handleSelectProposalForUpdate = (proposalId: string) => {
    setSelectedProposalForUpdate(proposalId);
    setActiveTab('update');
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900">Hồ sơ khách thuê</h1>
            
          </div>

        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs overflow-x-auto shrink-0 max-w-full">
          <button
            onClick={() => setActiveTab('tenants')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'tenants'
                ? 'bg-white text-blue-700 shadow-xs font-bold': 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Tra cứu khách ({tenants.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('co_tenants')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'co_tenants'
                ? 'bg-white text-emerald-700 shadow-xs font-bold': 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Người ở cùng ({coTenants.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('verify')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'verify'
                ? 'bg-white text-purple-700 shadow-xs font-bold': 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Kiểm tra thay đổi</span>
          </button>

          <button
            onClick={() => setActiveTab('update')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'update'
                ? 'bg-white text-cyan-700 shadow-xs font-bold': 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Cập nhật hồ sơ</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-white text-slate-900 shadow-xs font-bold': 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Lịch sử hồ sơ ({tenantHistory.length})</span>
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'tenants' && (
          <HSKT01RegisterTenant
            onNavigateToTab={handleNavigateToTab}
            onSelectTenantForUpdate={handleSelectTenantForUpdate}
          />
        )}

        {activeTab === 'co_tenants' && (
          <HSKT02CoTenants />
        )}

        {activeTab === 'verify' && (
          <HSKT03VerifyChanges
            onNavigateToTab={handleNavigateToTab}
            onSelectProposalForUpdate={handleSelectProposalForUpdate}
          />
        )}

        {activeTab === 'update' && (
          <HSKT04UpdateTenant
            initialTenantId={selectedTenantForUpdate}
            initialProposalId={selectedProposalForUpdate}
            onNavigateToTab={handleNavigateToTab}
          />
        )}

        {activeTab === 'history' && (
          <HSKT05HistoryAudit />
        )}
      </div>
    </div>
  );
};
