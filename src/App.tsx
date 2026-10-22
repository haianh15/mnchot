import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar, NavTabKey, NAV_ITEMS } from './components/layout/Sidebar';
import { LoginModal } from './components/auth/LoginModal';
import { AccountProfileModal } from './components/auth/AccountProfileModal';
import { ConfigView } from './components/views/ConfigView';
import { RoomsView } from './components/views/RoomsView';
import { HandoverAssetsView } from './components/views/HandoverAssetsView';
import { TenantsView } from './components/views/TenantsView';
import { ContractsView } from './components/views/ContractsView';
import { BillingView } from './components/views/BillingView';
import { PaymentNoticesView } from './components/views/PaymentNoticesView';
import { PaymentReceiptsView } from './components/views/PaymentReceiptsView';
import { DebtsView } from './components/views/DebtsView';
import { ReportsView } from './components/views/ReportsView';

const MainAppContent: React.FC = () => {
  const { currentSession, authNotification } = useApp();
  const [currentTab, setCurrentTab] = useState<NavTabKey>('rooms');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [target, setTarget] = useState<{roomCode?: string; contractId?: string; tenantId?: string; leaseId?: string; billId?: string; noticeId?: string; debtSourceNoticeIds?: string[]; action?: 'create' | 'return-plans' | 'settlement'; handoverMode?: 'receive' | 'return' | 'view'}>({});
  const navigate = (tab: NavTabKey, record: typeof target = {}) => { setTarget(record); setCurrentTab(tab); };
  const authenticated = currentSession?.type === 'admin' && currentSession.expiresAt > Date.now();

  const activeNavItem = NAV_ITEMS.find(i => i.key === currentTab) || NAV_ITEMS[0];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* Global Top Bar */}
      {authenticated && <Header
        currentTabName={activeNavItem.label}
        onOpenProfile={() => setShowProfileModal(true)}
        onOpenLogin={() => setShowLoginModal(true)}
      />}

      {/* Main Body */}
      {authenticated && <div className="flex-1 flex flex-col md:flex-row max-w-[1600px] w-full mx-auto">
        {/* Navigation Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => navigate(tab)}
        />

        {/* Viewport Canvas */}
        <main className="flex-1 p-3 sm:p-5 lg:p-6 overflow-y-auto min-w-0 max-w-full">
          {authNotification && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 font-medium">
              {authNotification}
            </div>
          )}

          {currentTab === 'rooms' && <RoomsView onNavigate={navigate} initialRoomCode={target.roomCode} />}

          {currentTab === 'handover' && <HandoverAssetsView initialRoomCode={target.roomCode} initialLeaseId={target.leaseId} initialContractId={target.contractId} initialMode={target.handoverMode} onOpenSettlement={(ref) => navigate('contracts', {...ref, action: 'settlement'})} />}

          {currentTab === 'tenants' && <TenantsView initialTenantId={target.tenantId} initialRoomCode={target.roomCode} initialLeaseId={target.leaseId} />}

          {currentTab === 'contracts' && <ContractsView initialContractId={target.contractId} initialRoomCode={target.roomCode} initialLeaseId={target.leaseId} initialAction={target.action} onBackToHandover={(ref) => navigate('handover', {...ref, handoverMode: 'return'})} onBackToRooms={(roomCode) => navigate('rooms', {roomCode})} onOpenTenant={(record) => navigate('tenants', record)} />}

          {currentTab === 'billing' && (
            <BillingView onNavigateToNotices={(billId, noticeId) => navigate('notices', {billId, noticeId})} />
          )}

          {currentTab === 'notices' && (
            <PaymentNoticesView
              initialBillId={target.billId}
              initialNoticeId={target.noticeId}
              initialDebtRequest={target.debtSourceNoticeIds ? { roomCode: target.roomCode || '', leaseId: target.leaseId || '', sourceNoticeIds: target.debtSourceNoticeIds } : undefined}
              onNavigateToReceipts={(noticeId) => navigate('receipts', { noticeId })}
            />
          )}

          {currentTab === 'receipts' && <PaymentReceiptsView initialNoticeId={target.noticeId} />}

          {currentTab === 'debts' && <DebtsView onNavigate={navigate} />}

          {currentTab === 'reports' && <ReportsView />}

          {currentTab === 'config' && (
            <ConfigView onNavigateToNotices={() => navigate('notices')} />
          )}
        </main>
      </div>}

      {/* Modals */}
      <LoginModal
        isOpen={!authenticated || showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => navigate('rooms')}
      />

      <AccountProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
