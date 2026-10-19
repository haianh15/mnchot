import { toUserMessage } from '../../../utils/userMessages';
import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { Contract } from '../../../types';
import {
  RotateCcw, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight,
  Clock, DollarSign, Calendar, Building, User, FileText, Check
} from 'lucide-react';

interface HDT06Props {
  onNavigateToTab?: (tab: 'conditions' | 'draft' | 'negotiate' | 'sign' | 'schedules' | 'renewal' | 'activate') => void;
  onSelectContractForActivation?: (contractId: string) => void;
}

export const HDT06RenewalContract: React.FC<HDT06Props> = ({
  onNavigateToTab,
  onSelectContractForActivation
}) => {
  const {
    contracts,
    batchSchedules,
    createRenewalContractHDT06
  } = useApp();

  // Active contracts that can be renewed
  const activeContracts = contracts.filter(c => c.status === 'Hiệu lực');

  // Existing renewal drafts
  const renewalContracts = contracts.filter(c => c.contractType === 'Hợp đồng nối tiếp');

  const [selectedOldContractId, setSelectedOldContractId] = useState<string>(
    activeContracts[0]?.id || ''
  );
  const [renewalBatchCode, setRenewalBatchCode] = useState<string>(
    batchSchedules[1]?.batchCode || batchSchedules[0]?.batchCode || 'DOT-2026-K11'
  );
  const [newRent, setNewRent] = useState<number>(3800000);
  const [renewalTerms, setRenewalTerms] = useState<string>(
    'Hợp đồng gia hạn nối tiếp tiếp tục thuê phòng. Kế thừa toàn bộ khoản cọc gốc ban đầu, không thu cọc mới. Thanh toán chuyển khoản định kỳ hàng tháng.'
  );

  const selectedOldContract = contracts.find(c => c.id === selectedOldContractId);
  const selectedBatch = batchSchedules.find(b => b.batchCode === renewalBatchCode);

  const handleSelectOldContract = (contractId: string) => {
    setSelectedOldContractId(contractId);
    const c = contracts.find(item => item.id === contractId);
    if (c) {
      setNewRent(c.monthlyRent);
    }
  };

  const handleCreateRenewal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOldContract || !selectedBatch) return;

    // Check if renewal contract already drafted for this contract
    const existingRenewal = contracts.find(c => c.previousContractId === selectedOldContract.id && c.status !== 'Đã hủy');
    if (existingRenewal) {
      alert(`Hợp đồng ${selectedOldContract.id} đã có hợp đồng nối tiếp ${existingRenewal.id} (${existingRenewal.status})!`);
      return;
    }

    const res = createRenewalContractHDT06({
      previousContractId: selectedOldContract.id,
      roomCode: selectedOldContract.roomCode,
      tenantId: selectedOldContract.tenantId,
      tenantName: selectedOldContract.tenantName,
      batchCode: selectedBatch.batchCode,
      startDate: selectedBatch.startDate,
      endDate: selectedBatch.endDate,
      monthlyRent: newRent,
      terms: renewalTerms
    });

    if (res.success) {
      alert(toUserMessage(res.message));
      if (res.contractId && onSelectContractForActivation) {
        onSelectContractForActivation(res.contractId);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold bg-indigo-700 text-white px-2 py-0.5 rounded">
              
            </span>
            <h2 className="text-sm font-bold text-slate-900">
              Lập hợp đồng nối tiếp / Gia hạn thuê </h2>
          </div>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Áp dụng cho khách thuê tiếp tục thuê cùng một phòng khi hết kỳ hợp đồng. <strong>Nguyên tắc cốt lõi:</strong> Hợp đồng nối tiếp giữ nguyên chuỗi lần thuê (<code>leaseId</code>), kế thừa khoản tiền cọc gốc ban đầu (<code>initialDepositCode</code>), tuyệt đối không thu tiền cọc mới. </p>
        </div>

        <div className="text-xs font-semibold bg-white px-3 py-1.5 rounded-lg border border-indigo-200 text-indigo-800 shadow-2xs">
          Tổng hợp đồng nối tiếp: <strong>{renewalContracts.length}</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Create Renewal */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4 text-indigo-600" />
              Thiết lập hợp đồng gia hạn nối tiếp </h3>
            <span className="text-[11px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-semibold">
              Kế thừa cọc gốc </span>
          </div>

          <form onSubmit={handleCreateRenewal} className="space-y-4 text-xs">
            {/* Old Contract Selector */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Chọn hợp đồng hiện hành đang hiệu lực cần gia hạn <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedOldContractId}
                onChange={(e) => handleSelectOldContract(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-xs"
              >
                {activeContracts.map(c => {
                  const hasRenewal = contracts.some(r => r.previousContractId === c.id && r.status !== 'Đã hủy');
                  return (
                    <option key={c.id} value={c.id}>
                      {c.id} - Phòng {c.roomCode} - {c.tenantName} (Hạn: {c.endDate}) {hasRenewal ? '[Đã có gia hạn]': ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {selectedOldContract && (
              <div className="p-3.5 bg-indigo-50/70 rounded-xl border border-indigo-200 space-y-2 text-xs">
                <span className="font-bold text-indigo-950 block text-[11px] uppercase tracking-wide">
                  Thông tin kế thừa từ hợp đồng tiền nhiệm: </span>
                <div className="grid grid-cols-2 gap-2 text-indigo-900">
                  <div>
                    Mã lần thuê: <strong className="font-mono">{selectedOldContract.leaseId}</strong> (Giữ nguyên) </div>
                  <div>
                    Phòng: <strong className="font-mono">{selectedOldContract.roomCode}</strong>
                  </div>
                  <div>
                    Khách thuê: <strong>{selectedOldContract.tenantName}</strong>
                  </div>
                  <div>
                    Khoản cọc gốc kế thừa: <strong className="font-mono text-emerald-700">{selectedOldContract.depositAmount.toLocaleString('vi-VN')} đ</strong>
                  </div>
                </div>
                <div className="text-[11px] text-indigo-800 italic pt-1 border-t border-indigo-200/60">
                  Mã cọc gốc bảo lưu: <span className="font-mono font-bold">{selectedOldContract.initialDepositCode || 'COC-' + selectedOldContract.roomCode}</span>
                </div>
              </div>
            )}

            {/* Next Batch Schedule */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Đợt hợp đồng chung kế tiếp <span className="text-red-500">*</span>
              </label>
              <select
                value={renewalBatchCode}
                onChange={(e) => setRenewalBatchCode(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs"
              >
                {batchSchedules.map(b => (
                  <option key={b.batchCode} value={b.batchCode}>
                    {b.batchCode} ({b.startDate} → {b.endDate}) - {b.isConfirmed ? 'Đã xác nhận': 'Dự thảo'}
                  </option>
                ))}
              </select>
            </div>

            {/* Rent adjustment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Giá thuê chu kỳ mới (đ/tháng) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="50000"
                  required
                  value={newRent}
                  onChange={(e) => setNewRent(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-xs"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Giá cũ: {selectedOldContract?.monthlyRent.toLocaleString('vi-VN')} đ/tháng </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tiền cọc yêu cầu nộp thêm </label>
                <div className="px-3 py-2 border border-slate-200 bg-slate-100 rounded-lg font-mono font-bold text-emerald-700 flex justify-between items-center">
                  <span>0 đ (Kế thừa cọc gốc)</span>
                  <span className="text-[10px] text-emerald-800 font-sans font-bold bg-emerald-100 px-1.5 py-0.2 rounded">
                    Không thu lại cọc </span>
                </div>
              </div>
            </div>

            {/* Terms */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Điều khoản hợp đồng gia hạn </label>
              <textarea
                rows={3}
                value={renewalTerms}
                onChange={(e) => setRenewalTerms(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer shadow-sm text-xs"
              >
                <RotateCcw className="w-4 h-4" />
                Lập hợp đồng nối tiếp (Nháp) </button>
            </div>
          </form>
        </div>

        {/* Existing Renewals List Right */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center justify-between text-indigo-700">
              <span>Hợp đồng nối tiếp đã lập</span>
              <span className="text-slate-500 font-mono text-[11px] font-normal">
                ({renewalContracts.length}) </span>
            </h4>

            <div className="space-y-3">
              {renewalContracts.map((rc) => (
                <div
                  key={rc.id}
                  className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono font-bold text-indigo-700 text-xs">{rc.id}</span>
                      <div className="text-[11px] text-slate-700 font-medium mt-0.5">
                        Phòng <strong>{rc.roomCode}</strong> - {rc.tenantName}
                      </div>
                    </div>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        rc.status === 'Hiệu lực'
                          ? 'bg-emerald-100 text-emerald-800': rc.status === 'Nháp'
                          ? 'bg-amber-100 text-amber-800': 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {rc.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1 border-t border-slate-200">
                    <div>
                      <span className="text-slate-400 block">Thời hạn mới:</span>
                      <span className="font-mono">{rc.startDate} → {rc.endDate}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Giá thuê mới:</span>
                      <span className="font-mono font-bold text-slate-900">{rc.monthlyRent.toLocaleString('vi-VN')} đ</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-indigo-800 bg-indigo-50/50 p-1.5 rounded flex justify-between items-center">
                    <span>HĐ tiền nhiệm: <strong className="font-mono">{rc.previousContractId}</strong></span>
                    <span className="font-mono text-emerald-700 font-bold">Cọc: {rc.depositAmount.toLocaleString('vi-VN')} đ</span>
                  </div>

                  {rc.status === 'Nháp' && (
                    <div className="pt-1 flex justify-end">
                      <button
                        onClick={() => {
                          if (onNavigateToTab) {
                            onNavigateToTab('activate');
                          }
                        }}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        Kích hoạt hiệu lực <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {renewalContracts.length === 0 && (
                <div className="p-6 text-center text-slate-400 text-xs">
                  Chưa có hợp đồng nối tiếp nào được tạo. </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
