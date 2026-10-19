import React, { useState } from 'react';
import {
  Home,
  PackageCheck,
  Users,
  FileText,
  Calculator,
  QrCode,
  CreditCard,
  AlertTriangle,
  BarChart3,
  Settings
} from 'lucide-react';

export type NavTabKey =
  | 'rooms'
  | 'handover'
  | 'tenants'
  | 'contracts'
  | 'billing'
  | 'notices'
  | 'receipts'
  | 'debts'
  | 'reports'
  | 'config';

interface SidebarProps {
  currentTab: NavTabKey;
  onSelectTab: (tab: NavTabKey) => void;
}

interface NavItem {
  key: NavTabKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const NAV_ITEMS: NavItem[] = [
{
    key: 'rooms',
    label: 'Quản lý phòng',
    icon: Home
  },
  {
    key: 'handover',
    label: 'Bàn giao và tài sản',
    icon: PackageCheck
  },
  {
    key: 'tenants',
    label: 'Hồ sơ khách thuê',
    icon: Users
  },
  {
    key: 'contracts',
    label: 'Quản lý hợp đồng',
    icon: FileText
  },
  {
    key: 'billing',
    label: 'Tính tiền theo kỳ',
    icon: Calculator
  },
  {
    key: 'notices',
    label: 'Thông báo thanh toán',
    icon: QrCode
  },
  {
    key: 'receipts',
    label: 'Thu tiền',
    icon: CreditCard
  },
  {
    key: 'debts',
    label: 'Công nợ',
    icon: AlertTriangle
  },
  {
    key: 'reports',
    label: 'Báo cáo',
    icon: BarChart3
  },
  {
    key: 'config',
    label: 'Cài đặt',
    icon: Settings
  }
];

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const [mobileExpanded, setMobileExpanded] = useState(false);
  return (
    <aside className="w-full md:w-56 lg:w-60 shrink-0 bg-white border-r border-slate-200 flex flex-col md:h-[calc(100vh-57px)] md:sticky md:top-[57px]">
      <button onClick={()=>setMobileExpanded(!mobileExpanded)} className="md:hidden p-3 w-full text-left text-sm font-bold text-blue-700 border-b border-slate-200" aria-expanded={mobileExpanded} aria-controls="main-navigation">{mobileExpanded ? 'Thu gọn danh mục ▲' : '☰ Danh mục chức năng'}</button>
      <div className="hidden md:block p-3 border-b border-slate-100 bg-slate-50">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
          Chức năng </span>
      </div>

      <nav id="main-navigation" className={`${mobileExpanded ? 'block' : 'hidden'} md:block p-2 space-y-1 overflow-y-auto flex-1`}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => {onSelectTab(item.key); setMobileExpanded(false);}}
              className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-3 cursor-pointer group ${
                isActive ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 mt-0.5 ${
                  isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-800'
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-semibold truncate ${isActive ? 'text-white' : 'text-slate-800'}`}>
                  {item.label}
                </div>

              </div>
            </button>
          );
        })}
      </nav>

      <div className="hidden md:block p-3 border-t border-slate-100 bg-slate-50 text-[11px] text-slate-500 space-y-0.5">
        <div className="font-semibold text-slate-700">Chung cư mini An Bình</div>
        <div className="text-[10px] text-slate-400">Quản lý vận hành</div>
      </div>
    </aside>
  );
};
