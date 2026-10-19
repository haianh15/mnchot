import React from 'react';
import { useApp } from '../../context/AppContext';
import { NavTabKey } from '../layout/Sidebar';
import { Room, Contract, Tenant, PaymentNotice, PaymentReceipt } from '../../types';
import {
  Home,
  PackageCheck,
  Users,
  FileText,
  Scale,
  Calculator,
  QrCode,
  CreditCard,
  AlertTriangle,
  BarChart3,
  Settings,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Building2
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (tab: NavTabKey) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const {
    rooms,
    contracts,
    tenants,
    periodBills,
    paymentNotices,
    paymentReceipts,
    currentUser
  } = useApp();

  // Metrics
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter((r: Room) => r.status === 'Đang thuê').length;
  const vacantRooms = rooms.filter((r: Room) => r.status === 'Trống').length;
  const expiringRooms = rooms.filter((r: Room) => r.status === 'Sắp trả').length;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  const totalTenants = tenants.length;
  const activeContracts = contracts.filter((c: Contract) => c.status === 'Hiệu lực').length;

  const unpaidNotices = paymentNotices.filter((n: PaymentNotice) => n.paymentStatus === 'Chưa thu' && n.status === 'Đang hiệu lực');
  const overdueNotices = unpaidNotices.filter((n: PaymentNotice) => new Date(n.dueDate) < new Date());
  const totalOverdueAmount = overdueNotices.reduce((sum: number, n: PaymentNotice) => sum + n.totalAmount, 0);

  const totalCollectedThisMonth = paymentReceipts
    .filter((r: PaymentReceipt) => r.status === 'Đang hiệu lực')
    .reduce((sum: number, r: PaymentReceipt) => sum + r.amountReceived, 0);

  const workflows = [
    {
      tab: 'rooms' as NavTabKey,
      title: 'Quản lý phòng',
      flow: 'Danh sách phòng → Chi tiết phòng → Thêm/Sửa, Tiếp nhận, Trả phòng, Kế hoạch trả',
      icon: Home,
      color: 'bg-blue-500',
      stat: `${occupiedRooms}/${totalRooms} phòng đang thuê`,
      statColor: 'text-blue-700 bg-blue-50 border-blue-200'
    },
    {
      tab: 'handover' as NavTabKey,
      title: 'Bàn giao và tài sản',
      flow: 'Chi tiết phòng → Tài sản → Kiểm kê, Hiện trạng, Sự cố, Biên bản bàn giao',
      icon: PackageCheck,
      color: 'bg-emerald-500',
      stat: 'Kiểm kê & biên bản nhận/trả',
      statColor: 'text-emerald-700 bg-emerald-50 border-emerald-200'
    },
    {
      tab: 'tenants' as NavTabKey,
      title: 'Hồ sơ khách thuê',
      flow: 'Tra cứu khách → Chi tiết hồ sơ → Người ở cùng, Cập nhật, Lịch sử',
      icon: Users,
      color: 'bg-indigo-500',
      stat: `${totalTenants} khách thuê`,
      statColor: 'text-indigo-700 bg-indigo-50 border-indigo-200'
    },
    {
      tab: 'contracts' as NavTabKey,
      title: 'Quản lý hợp đồng',
      flow: 'Danh sách hợp đồng → Chi tiết hợp đồng → Lập/Sửa nháp, Ghi nhận ký, Gia hạn, Quyết toán cọc',
      icon: FileText,
      color: 'bg-violet-500',
      stat: `${activeContracts} hợp đồng hiệu lực`,
      statColor: 'text-violet-700 bg-violet-50 border-violet-200'
    },
    {
      tab: 'billing' as NavTabKey,
      title: 'Tính tiền theo kỳ',
      flow: 'Bảng tính kỳ → Ghi/Sửa chỉ số → Tính tiền → Xác nhận bảng tính',
      icon: Calculator,
      color: 'bg-cyan-500',
      stat: `${periodBills.length} bảng tính kỳ này`,
      statColor: 'text-cyan-700 bg-cyan-50 border-cyan-200'
    },
    {
      tab: 'notices' as NavTabKey,
      title: 'Thông báo thanh toán',
      flow: 'Đối chiếu khoản phải thu → Lập thông báo → Xem/Tải QR → Chia sẻ',
      icon: QrCode,
      color: 'bg-teal-500',
      stat: `${unpaidNotices.length} thông báo chờ thu`,
      statColor: 'text-teal-700 bg-teal-50 border-teal-200'
    },
    {
      tab: 'receipts' as NavTabKey,
      title: 'Thu tiền',
      flow: 'Theo dõi thanh toán → Chi tiết thông báo → Xác nhận thu hoặc sửa xác nhận nhầm',
      icon: CreditCard,
      color: 'bg-green-600',
      stat: `${totalCollectedThisMonth.toLocaleString('vi-VN')} đ đã thu`,
      statColor: 'text-green-700 bg-green-50 border-green-200'
    },
    {
      tab: 'debts' as NavTabKey,
      title: 'Công nợ',
      flow: 'Danh sách nợ quá hạn → Chi tiết nợ → Nhắc thanh toán, Ghi phản hồi, Tra cứu căn cứ',
      icon: AlertTriangle,
      color: 'bg-red-500',
      stat: `${overdueNotices.length} khoản nợ (${totalOverdueAmount.toLocaleString('vi-VN')} đ)`,
      statColor: 'text-red-700 bg-red-50 border-red-200'
    },
    {
      tab: 'reports' as NavTabKey,
      title: 'Báo cáo',
      flow: 'Báo cáo phòng, tài chính → Đối soát → Báo cáo tổng hợp',
      icon: BarChart3,
      color: 'bg-sky-500',
      stat: 'Báo cáo phòng & đối soát tài chính',
      statColor: 'text-sky-700 bg-sky-50 border-sky-200'
    },
    {
      tab: 'config' as NavTabKey,
      title: 'Cài đặt',
      flow: 'Đơn giá điện nước/dịch vụ; tài khoản ngân hàng nhận tiền',
      icon: Settings,
      color: 'bg-slate-600',
      stat: 'Bảng giá & tài khoản ngân hàng',
      statColor: 'text-slate-700 bg-slate-100 border-slate-200'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 rounded-2xl p-6 text-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-200 text-xs font-semibold uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" />
            <span>Chung cư mini An Bình — Tổng quan vận hành</span>
          </div>
          <h1 className="text-2xl font-bold">Xin chào, {currentUser?.fullName || 'Quản trị viên'}</h1>
          <p className="text-blue-100 text-sm mt-1 max-w-xl">
            Hệ thống quản lý chung cư mini toàn diện: phòng, hợp đồng, tài sản, hồ sơ cư trú, tính tiền điện nước, thu chi và công nợ.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigate('rooms')}
            className="px-4 py-2.5 bg-white text-blue-900 rounded-xl text-xs font-bold hover:bg-blue-50 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Home className="w-4 h-4 text-blue-700" />
            <span>Xem danh sách phòng</span>
          </button>
          <button
            onClick={() => onNavigate('billing')}
            className="px-4 py-2.5 bg-blue-600/80 hover:bg-blue-600 text-white border border-blue-400/40 rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Calculator className="w-4 h-4" />
            <span>Tính tiền kỳ này</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>Tỷ lệ lấp đầy</span>
            <Home className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{occupancyRate}%</div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <span className="font-semibold text-blue-700">{occupiedRooms} đang thuê</span>
            <span>•</span>
            <span className="font-semibold text-emerald-700">{vacantRooms} trống</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>Khách đang ở</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalTenants}</div>
          <div className="text-xs text-slate-500 mt-1">
            <span className="font-semibold text-indigo-700">{activeContracts} hợp đồng</span> có hiệu lực
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>Thực thu tháng này</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalCollectedThisMonth.toLocaleString('vi-VN')} đ</div>
          <div className="text-xs text-emerald-700 font-semibold mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Chuyển khoản đã xác nhận</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>Công nợ quá hạn</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-600">{totalOverdueAmount.toLocaleString('vi-VN')} đ</div>
          <div className="text-xs text-red-600 font-medium mt-1">
            {overdueNotices.length} thông báo cần nhắc nợ
          </div>
        </div>
      </div>

      {/* Main Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Nhóm chức năng &amp; Quy trình điều hướng</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Chọn nhóm chức năng để chuyển trực tiếp đến màn hình chính và thực hiện các bước điều hướng.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workflows.map((wf) => {
            const Icon = wf.icon;
            return (
              <div
                key={wf.tab}
                onClick={() => onNavigate(wf.tab)}
                className="group p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer bg-slate-50/50 hover:bg-white flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg ${wf.color} text-white flex items-center justify-center shrink-0 shadow-xs`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-slate-800 text-sm group-hover:text-blue-700 transition-colors">
                        {wf.title}
                      </h3>
                    </div>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${wf.statColor}`}>
                      {wf.stat}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-blue-600 font-semibold group-hover:translate-x-0.5 transition-transform">
                  <span>Mở chức năng</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
