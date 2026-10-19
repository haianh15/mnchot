import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { TenantHistoryEntry } from '../../../types';
import {
  History, Search, Filter, Eye, Calendar, Clock,
  UserCheck, ShieldCheck, FileText, CheckCircle2, Building2, X
} from 'lucide-react';

export const HSKT05HistoryAudit: React.FC<{tenantId?: string}> = ({tenantId}) => {
  const { tenantHistory, tenants, contracts } = useApp();

  // Filters
  const [filterTenantId, setFilterTenantId] = useState<string>(tenantId || 'all');
  const [filterModule, setFilterModule] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Selected event for detail drawer/modal (Bước 4)
  const [selectedEvent, setSelectedEvent] = useState<TenantHistoryEntry | null>(null);

  // Filtered entries
  const filteredHistory = tenantHistory.filter(h => {
    if ((tenantId || filterTenantId) !== 'all' && h.tenantId !== (tenantId || filterTenantId)) return false;
    if (filterModule !== 'all' && h.sourceModule && !h.sourceModule.includes(filterModule)) return false;

    if (dateFrom && h.timestamp < dateFrom) return false;
    if (dateTo && h.timestamp > dateTo + 'T23:59:59') return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchAction = h.action.toLowerCase().includes(q);
      const matchUser = h.performedBy.toLowerCase().includes(q);
      const matchNew = h.newValues && h.newValues.toLowerCase().includes(q);
      const matchEvidence = h.evidence && h.evidence.toLowerCase().includes(q);
      const matchLease = h.relatedLeaseId && h.relatedLeaseId.toLowerCase().includes(q);
      if (!matchAction && !matchUser && !matchNew && !matchEvidence && !matchLease) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-slate-100 to-slate-200 border border-slate-300 rounded-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              
              <h2 className="text-base font-bold text-slate-900">Tra cứu lịch sử hồ sơ khách thuê</h2>
            </div>
            <p className="text-xs text-slate-700 mt-1">
              Chế độ tra cứu nghiệp vụ: Chỉ đọc, không tạo, sửa hoặc xóa nhật ký. Tra cứu thông tin khách chính, người ở cùng, chuỗi lần thuê, hợp đồng và biên bản bàn giao. </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <History className="w-4 h-4 text-slate-500" />
              Tổng sự kiện: <strong>{tenantHistory.length}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>Bộ lọc tra cứu lịch sử </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="block text-slate-500 text-[11px] mb-1">Khách thuê</label>
            <select
              disabled={Boolean(tenantId)}
              value={tenantId || filterTenantId}
              onChange={(e) => setFilterTenantId(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="all">Tất cả khách</option>
              {tenants.map(t => (
                <option key={t.id} value={t.id}>{t.fullName} ({t.id})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 text-[11px] mb-1">Nguồn nghiệp vụ</label>
            <select
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="all">Tất cả nghiệp vụ</option>
              <option value="Tạo hồ sơ">Tạo hồ sơ</option>
              <option value="Người ở cùng">Người ở cùng</option>
              <option value="Kiểm tra">Kiểm tra thay đổi</option>
              <option value="Cập nhật">Cập nhật hồ sơ</option>
              <option value="trả phòng">Trả phòng</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 text-[11px] mb-1">Từ ngày</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full p-1.5 border border-slate-300 rounded-lg bg-white"
            />
          </div>

          <div>
            <label className="block text-slate-500 text-[11px] mb-1">Đến ngày</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full p-1.5 border border-slate-300 rounded-lg bg-white"
            />
          </div>

          <div>
            <label className="block text-slate-500 text-[11px] mb-1">Từ khóa tìm kiếm</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm nội dung, người, mã..."
                className="w-full pl-8 pr-2 py-1.5 border border-slate-300 rounded-lg bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800">
            Kết quả tra cứu ({filteredHistory.length} bản ghi) </h3>
          <span className="text-[11px] text-slate-400">Nhấn vào sự kiện để xem chi tiết trước/sau</span>
        </div>

        {filteredHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Thời điểm</th>
                  <th className="py-2.5 px-3">Khách thuê</th>
                  <th className="py-2.5 px-3">Hành động / Sự kiện</th>
                  <th className="py-2.5 px-3">Nguồn nghiệp vụ</th>
                  <th className="py-2.5 px-3">Người thực hiện</th>
                  <th className="py-2.5 px-3 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHistory.map(h => {
                  const t = tenants.find(item => item.id === h.tenantId);
                  return (
                    <tr
                      key={h.id}
                      onClick={() => setSelectedEvent(h)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {new Date(h.timestamp).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {t ? t.fullName: h.tenantId}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-800">{h.action}</div>
                        {h.newValues && (
                          <div className="text-[11px] text-slate-500 line-clamp-1">{h.newValues}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {h.sourceModule || 'Nghiệp vụ'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {h.performedBy}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(h);
                          }}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-medium"
                        >
                          <Eye className="w-3.5 h-3.5 inline mr-1" />
                          Xem </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ): (
          <div className="p-8 text-center text-slate-400 text-xs">
            Không có sự kiện lịch sử nào phù hợp với điều kiện tra cứu hiện tại. </div>
        )}
      </div>

      {/* Detail Modal (Bước 4) */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <History className="w-4 h-4 text-blue-400" />
                Chi tiết sự kiện lịch sử (Chỉ đọc) </h3>
              <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">{selectedEvent.action}</span>
                  <span className="text-[10px] font-mono text-slate-500">Mã: {selectedEvent.id}</span>
                </div>
                <div className="text-[11px] text-slate-600">
                  Thời điểm: <strong>{new Date(selectedEvent.timestamp).toLocaleString()}</strong>
                </div>
                <div className="text-[11px] text-slate-600">
                  Người ghi nhận: <strong>{selectedEvent.performedBy}</strong>
                </div>
                <div className="text-[11px] text-slate-600">
                  Nguồn nghiệp vụ: <strong>{selectedEvent.sourceModule || 'Hệ thống'}</strong>
                </div>
                {selectedEvent.relatedLeaseId && (
                  <div className="text-[11px] text-indigo-700 font-mono">
                    Lần thuê: <strong>{selectedEvent.relatedLeaseId}</strong>
                  </div>
                )}
                {selectedEvent.relatedContractId && (
                  <div className="text-[11px] text-indigo-700 font-mono">
                    Hợp đồng: <strong>{selectedEvent.relatedContractId}</strong>
                  </div>
                )}
              </div>

              {/* Before vs After */}
              {selectedEvent.oldValues && (
                <div>
                  <span className="block font-bold text-slate-700 mb-1">Dữ liệu trước thay đổi:</span>
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-950 font-mono text-[11px]">
                    {selectedEvent.oldValues}
                  </div>
                </div>
              )}

              {selectedEvent.newValues && (
                <div>
                  <span className="block font-bold text-slate-700 mb-1">Dữ liệu sau thay đổi / Giá trị ghi nhận:</span>
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-950 font-mono text-[11px]">
                    {selectedEvent.newValues}
                  </div>
                </div>
              )}

              {selectedEvent.evidence && (
                <div>
                  <span className="block font-bold text-slate-700 mb-1">Căn cứ & Chứng cứ đi kèm:</span>
                  <div className="p-2.5 bg-slate-100 rounded-lg text-slate-700">
                    {selectedEvent.evidence}
                  </div>
                </div>
              )}

              {/* Handover milestones */}
              {(selectedEvent.actualReturnDate || selectedEvent.handoverReturnStatus) && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 space-y-1">
                  <div className="font-bold">Mốc bàn giao & Trả phòng thực tế:</div>
                  {selectedEvent.actualReturnDate && (
                    <div>Ngày nhận lại phòng thực tế: <strong>{selectedEvent.actualReturnDate}</strong></div>
                  )}
                  {selectedEvent.actualLeaseEndDate && (
                    <div>Ngày kết thúc lần thuê thực tế: <strong>{selectedEvent.actualLeaseEndDate}</strong></div>
                  )}
                  {selectedEvent.handoverReturnStatus && (
                    <div>Trạng thái liên kết biên bản trả: <strong>{selectedEvent.handoverReturnStatus}</strong> (Phiên bản: {selectedEvent.handoverVersion || 'Gốc'})</div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg text-xs"
              >
                Đóng </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
