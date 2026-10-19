import { toUserMessage } from '../../../utils/userMessages';
import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { BatchSchedule } from '../../../types';
import {
  Calendar, Plus, Edit, CheckCircle2, AlertTriangle, Layers,
  Clock, ShieldCheck, Search, FileText, Check
} from 'lucide-react';

export const HDT05BatchSchedules: React.FC = () => {
  const {
    batchSchedules,
    contracts,
    addBatchSchedule,
    updateBatchScheduleHDT05
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<BatchSchedule | null>(null);

  // New Batch Form
  const [newBatchCode, setNewBatchCode] = useState('');
  const [newStartDate, setNewStartDate] = useState('2026-11-01');
  const [newEndDate, setNewEndDate] = useState('2027-05-01');
  const [newBillingNote, setNewBillingNote] = useState('Thu định kỳ ngày 25-30 hàng tháng, chốt điện nước ngày 25');
  const [newIsConfirmed, setNewIsConfirmed] = useState(true);

  // Edit Batch Form
  const [editBillingNote, setEditBillingNote] = useState('');
  const [editIsConfirmed, setEditIsConfirmed] = useState(true);

  const filteredBatches = batchSchedules.filter(b =>
    b.batchCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.billingCycleNote.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchCode.trim()) return;

    if (batchSchedules.some(b => b.batchCode.toLowerCase() === newBatchCode.trim().toLowerCase())) {
      alert(`Mã đợt ${newBatchCode} đã tồn tại! Vui lòng chọn mã đợt khác.`);
      return;
    }

    if (new Date(newStartDate) >= new Date(newEndDate)) {
      alert('Ngày bắt đầu phải trước ngày kết thúc đợt!');
      return;
    }

    addBatchSchedule({
      batchCode: newBatchCode.trim(),
      startDate: newStartDate,
      endDate: newEndDate,
      billingCycleNote: newBillingNote,
      isConfirmed: newIsConfirmed,
      status: 'Đang áp dụng'
    });

    setShowAddModal(false);
    setNewBatchCode('');
    alert('Thêm lịch đợt hợp đồng chung mới thành công!');
  };

  const handleOpenEdit = (b: BatchSchedule) => {
    setSelectedBatch(b);
    setEditBillingNote(b.billingCycleNote);
    setEditIsConfirmed(b.isConfirmed);
    setShowEditModal(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch) return;

    const res = updateBatchScheduleHDT05(selectedBatch.batchCode, {
      billingCycleNote: editBillingNote,
      isConfirmed: editIsConfirmed
    });

    if (res.success) {
      setShowEditModal(false);
      alert(toUserMessage(res.message));
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold bg-blue-700 text-white px-2 py-0.5 rounded">
              
            </span>
            <h2 className="text-sm font-bold text-slate-900">
              Quản lý lịch đợt hợp đồng chung </h2>
          </div>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Lịch đợt chung áp dụng cho toàn bộ các phòng tham gia cùng kỳ thuê. Các hợp đồng mới và hợp đồng nối tiếp bắt buộc phải tham chiếu theo đợt chung đã xác nhận để đồng bộ chu kỳ thu tiền và chốt điện nước. </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap self-start md:self-center"
        >
          <Plus className="w-4 h-4" />
          Thêm lịch đợt mới </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo mã đợt, ghi chú chu kỳ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Tổng cộng: <strong>{batchSchedules.length}</strong> đợt chung </span>
      </div>

      {/* Grid of Batch Schedules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBatches.map((b) => {
          const appliedContracts = contracts.filter(c => c.batchCode === b.batchCode);
          const activeContractsCount = appliedContracts.filter(c => c.status === 'Hiệu lực').length;

          return (
            <div
              key={b.batchCode}
              className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow p-4 flex flex-col justify-between space-y-3"
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
                <div>
                  <span className="font-mono font-bold text-sm text-blue-700">
                    {b.batchCode}
                  </span>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Thời lượng: 6 tháng tiêu chuẩn </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded font-bold ${
                      b.isConfirmed
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300': 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {b.isConfirmed ? 'Đã xác nhận': 'Dự thảo'}
                  </span>

                  <button
                    onClick={() => handleOpenEdit(b)}
                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded cursor-pointer"
                    title="Chỉnh sửa lịch đợt"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Dates */}
              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Ngày bắt đầu:</span>
                    <strong className="font-mono text-slate-800">{b.startDate}</strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Ngày kết thúc:</span>
                    <strong className="font-mono text-slate-800">{b.endDate}</strong>
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 border-t border-slate-100 pt-1.5">
                  <span className="font-semibold text-slate-700">Chu kỳ thu:</span> {b.billingCycleNote}
                </div>

                {/* Contract statistics */}
                <div className="p-2 bg-indigo-50/60 rounded-lg border border-indigo-100 flex items-center justify-between text-[11px]">
                  <span className="text-indigo-900 font-medium">Hợp đồng áp dụng:</span>
                  <div className="flex items-center gap-1 font-mono font-bold text-indigo-800">
                    <span>{appliedContracts.length} HĐ</span>
                    <span className="text-emerald-700">({activeContractsCount} hiệu lực)</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-[11px] text-slate-400">
                <span>Trạng thái: {b.status || 'Đang áp dụng'}</span>
                <span className="font-mono">✓</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ==================== MODAL: ADD BATCH SCHEDULE ==================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Thêm Lịch đợt hợp đồng chung</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕ </button>
            </div>

            <form onSubmit={handleAddBatch} className="space-y-3.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mã đợt (duy nhất) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newBatchCode}
                  onChange={(e) => setNewBatchCode(e.target.value.toUpperCase())}
                  placeholder="Ví dụ: DOT-2026-K12"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Ngày bắt đầu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Ngày kết thúc <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ghi chú chu kỳ thu tiền phòng & dịch vụ </label>
                <textarea
                  rows={2}
                  value={newBillingNote}
                  onChange={(e) => setNewBillingNote(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={newIsConfirmed}
                  onChange={(e) => setNewIsConfirmed(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <span className="font-semibold text-slate-700">
                  Xác nhận lịch đợt chính thức ngay (isConfirmed) </span>
              </label>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold cursor-pointer"
                >
                  Hủy </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold cursor-pointer"
                >
                  Xác nhận lưu đợt </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: EDIT BATCH SCHEDULE ==================== */}
      {showEditModal && selectedBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Cập nhật lịch đợt</h3>
                <span className="font-mono text-blue-700 font-bold">{selectedBatch.batchCode}</span>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕ </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-600 text-[11px] space-y-1">
                <div>Thời hạn: <strong className="font-mono">{selectedBatch.startDate} → {selectedBatch.endDate}</strong></div>
                <div className="text-slate-400 italic">Để bảo vệ tính toàn vẹn của các hợp đồng đã ký kết, không thay đổi ngày của đợt đang hoạt động.</div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ghi chú chu kỳ thu tiền phòng & dịch vụ </label>
                <textarea
                  rows={2}
                  value={editBillingNote}
                  onChange={(e) => setEditBillingNote(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={editIsConfirmed}
                  onChange={(e) => setEditIsConfirmed(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <span className="font-semibold text-slate-700">
                  Đợt đã xác nhận lịch chính thức </span>
              </label>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold cursor-pointer"
                >
                  Đóng </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold cursor-pointer"
                >
                  Lưu thay đổi </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
