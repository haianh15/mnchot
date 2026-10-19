import { toUserMessage } from '../../../utils/userMessages';
import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { Contract } from '../../../types';
import {
  Sparkles, CheckCircle2, RotateCcw, AlertCircle, History,
  FileText, Search, Calendar, User, Building, Eye, Printer,
  ShieldCheck, ArrowRight
} from 'lucide-react';

export const HDT07ActivateRenewal: React.FC = () => {
  const {
    contracts,
    activateRenewalContractHDT07,
    rooms
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [selectedContractForDetail, setSelectedContractForDetail] = useState<Contract | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Renewal contracts that are awaiting activation
  const draftRenewals = contracts.filter(c =>
    c.contractType === 'Hợp đồng nối tiếp' && (c.status === 'Nháp' || c.status === 'Chờ khách ký' || c.status === 'Chờ hiệu lực')
  );

  const [signDate, setSignDate] = useState(new Date().toISOString().split('T')[0]);
  const [proofFile, setProofFile] = useState('hop_dong_gia_han_ky_tay_2_ben.pdf');

  const handleActivate = (contractId: string) => {
    const res = activateRenewalContractHDT07(contractId, signDate, [proofFile]);
    alert(toUserMessage(res.message));
  };

  // Filtered all contracts
  const allFilteredContracts = contracts.filter(c => {
    const matchesSearch =
      c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.roomCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.tenantName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || c.contractType === filterType;
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold bg-purple-700 text-white px-2 py-0.5 rounded">
              
            </span>
            <h2 className="text-sm font-bold text-slate-900">
              Kích hoạt hiệu lực hợp đồng gia hạn & Vòng đời hợp đồng </h2>
          </div>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Kích hoạt chuyển tiếp hợp đồng nối tiếp thành <strong>Hiệu lực</strong>, tự động chuyển hợp đồng cũ thành <strong>Kết thúc</strong> và tự động hủy bỏ kế hoạch trả phòng nếu có theo. Đồng thời cung cấp bảng tổng thể quản lý vòng đời toàn bộ hợp đồng thuê. </p>
        </div>

        <div className="text-xs font-semibold bg-white px-3 py-1.5 rounded-lg border border-purple-200 text-purple-800 shadow-2xs">
          HĐ chờ kích hoạt: <strong>{draftRenewals.length}</strong>
        </div>
      </div>

      {/* Section 1: Renewals awaiting activation */}
      {draftRenewals.length > 0 && (
        <div className="bg-white p-5 rounded-xl border border-purple-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-purple-100 pb-3">
            <h3 className="font-bold text-purple-900 text-sm flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-600" />
              Hợp đồng nối tiếp đang chờ kích hoạt hiệu lực </h3>
            <span className="text-[11px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-bold">
              {draftRenewals.length} hợp đồng </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {draftRenewals.map((rc) => (
              <div
                key={rc.id}
                className="p-4 rounded-xl border border-purple-200 bg-purple-50/30 space-y-3 text-xs"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono font-bold text-indigo-700 text-sm">{rc.id}</span>
                    <div className="text-xs text-slate-800 font-semibold mt-0.5">
                      Phòng <strong className="text-blue-700">{rc.roomCode}</strong> - {rc.tenantName}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded font-bold text-[10px]">
                    {rc.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-white p-2.5 rounded-lg border border-purple-100 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Thời hạn nối tiếp:</span>
                    <span className="font-mono font-semibold">{rc.startDate} → {rc.endDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">HĐ tiền nhiệm:</span>
                    <span className="font-mono font-bold text-slate-700">{rc.previousContractId}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-600">
                  <span>Giá thuê: <strong className="font-mono text-slate-900">{rc.monthlyRent.toLocaleString('vi-VN')} đ</strong></span>
                  <span className="text-emerald-700 font-mono font-semibold">Cọc kế thừa: {rc.depositAmount.toLocaleString('vi-VN')} đ</span>
                </div>

                {/* Activation Button */}
                <div className="pt-2 border-t border-purple-200 flex justify-end">
                  <button
                    onClick={() => handleActivate(rc.id)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Kích hoạt hiệu lực nối tiếp </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 2: Full Lifecycle Contracts Master Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Bảng tra cứu vòng đời toàn bộ hợp đồng thuê </h3>
            <p className="text-xs text-slate-500">
              Tổng hợp hợp đồng lần đầu và hợp đồng nối tiếp theo các giai đoạn hiệu lực. </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">
              Tìm thấy: <strong>{allFilteredContracts.length}</strong> hợp đồng </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between text-xs">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo mã HĐ, phòng, tên khách..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
            >
              <option value="all">-- Tất cả loại HĐ --</option>
              <option value="Hợp đồng lần đầu">Hợp đồng lần đầu</option>
              <option value="Hợp đồng nối tiếp">Hợp đồng nối tiếp</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
            >
              <option value="all">-- Tất cả trạng thái --</option>
              <option value="Nháp">Nháp</option>
              <option value="Chờ khách ký">Chờ khách ký</option>
              <option value="Chờ hiệu lực">Chờ hiệu lực</option>
              <option value="Hiệu lực">Hiệu lực</option>
              <option value="Kết thúc">Kết thúc</option>
              <option value="Đã hủy">Đã hủy</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                <th className="py-2.5 px-3">Mã hợp đồng</th>
                <th className="py-2.5 px-3">Loại hợp đồng</th>
                <th className="py-2.5 px-3">Phòng</th>
                <th className="py-2.5 px-3">Khách thuê</th>
                <th className="py-2.5 px-3">Mã lần thuê</th>
                <th className="py-2.5 px-3">Thời hạn</th>
                <th className="py-2.5 px-3">Giá thuê / tháng</th>
                <th className="py-2.5 px-3">Tiền cọc</th>
                <th className="py-2.5 px-3">Ký giấy</th>
                <th className="py-2.5 px-3">Trạng thái</th>
                <th className="py-2.5 px-3 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allFilteredContracts.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                    {c.id}
                    <span className="block text-[10px] text-slate-400 font-sans">v{c.version}</span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                        c.contractType === 'Hợp đồng nối tiếp'
                          ? 'text-indigo-700 bg-indigo-50 font-semibold': 'text-slate-600 bg-slate-100'
                      }`}
                    >
                      {c.contractType}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{c.roomCode}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-800">{c.tenantName}</td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-indigo-700">{c.leaseId}</td>
                  <td className="py-2.5 px-3 font-mono text-[11px]">
                    {c.startDate} → {c.endDate}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-semibold">
                    {c.monthlyRent.toLocaleString('vi-VN')} đ </td>
                  <td className="py-2.5 px-3 font-mono text-emerald-700">
                    {c.depositAmount.toLocaleString('vi-VN')} đ {c.previousContractId && (
                      <span className="block text-[10px] text-slate-400 font-sans">(cọc gốc)</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`text-[11px] font-semibold ${
                        c.isSignedPaper ? 'text-emerald-700': 'text-amber-700'
                      }`}
                    >
                      {c.isSignedPaper ? 'Đã ký giấy': 'Chưa ký'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        c.status === 'Hiệu lực'
                          ? 'bg-emerald-100 text-emerald-800': c.status === 'Chờ hiệu lực'
                          ? 'bg-blue-100 text-blue-800': c.status === 'Chờ khách ký'
                          ? 'bg-amber-100 text-amber-800': c.status === 'Nháp'
                          ? 'bg-slate-200 text-slate-700': c.status === 'Kết thúc'
                          ? 'bg-slate-100 text-slate-500': 'bg-red-100 text-red-700'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => {
                        setSelectedContractForDetail(c);
                        setShowDetailModal(true);
                      }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold cursor-pointer inline-flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      Xem </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================== MODAL: CONTRACT FULL DETAIL ==================== */}
      {showDetailModal && selectedContractForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Chi tiết hồ sơ hợp đồng </h3>
                <span className="font-mono text-blue-700 font-bold">{selectedContractForDetail.id}</span>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕ </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <div>Loại hợp đồng: <strong>{selectedContractForDetail.contractType}</strong></div>
                <div>Trạng thái: <strong className="text-blue-700">{selectedContractForDetail.status}</strong></div>
                <div>Phòng: <strong className="font-mono">{selectedContractForDetail.roomCode}</strong></div>
                <div>Khách thuê: <strong>{selectedContractForDetail.tenantName}</strong></div>
                <div>Mã lần thuê: <strong className="font-mono text-indigo-700">{selectedContractForDetail.leaseId}</strong></div>
                <div>Đợt chung: <strong className="font-mono">{selectedContractForDetail.batchCode}</strong></div>
                <div>Thời hạn: <span className="font-mono font-semibold">{selectedContractForDetail.startDate} → {selectedContractForDetail.endDate}</span></div>
                <div>Đơn giá: <strong className="font-mono">{selectedContractForDetail.monthlyRent.toLocaleString('vi-VN')} đ</strong></div>
                <div>Tiền cọc: <strong className="font-mono text-emerald-700">{selectedContractForDetail.depositAmount.toLocaleString('vi-VN')} đ</strong></div>
                <div>Phương thức: <span>{selectedContractForDetail.paymentMethod}</span></div>
              </div>

              {selectedContractForDetail.previousContractId && (
                <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-900 text-[11px]">
                  Kế thừa cọc gốc từ hợp đồng: <strong className="font-mono">{selectedContractForDetail.previousContractId}</strong> (Mã cọc: {selectedContractForDetail.initialDepositCode}) </div>
              )}

              {selectedContractForDetail.terms && (
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">Điều khoản thỏa thuận:</span>
                  <p className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-600 italic">
                    {selectedContractForDetail.terms}
                  </p>
                </div>
              )}

              {/* History entries */}
              <div>
                <span className="font-semibold text-slate-700 block mb-1">Lịch sử sự kiện & kiểm toán:</span>
                <div className="space-y-2">
                  {(selectedContractForDetail.history || []).map((h, i) => (
                    <div key={i} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] space-y-0.5">
                      <div className="flex justify-between font-semibold text-slate-800">
                        <span>{h.action} (v{h.version})</span>
                        <span className="text-slate-400 font-mono text-[10px]">{new Date(h.timestamp).toLocaleString('vi-VN')}</span>
                      </div>
                      {h.note && <div className="text-slate-600">{h.note}</div>}
                      <div className="text-[10px] text-slate-400">Bởi: {h.by}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold cursor-pointer"
              >
                Đóng </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
