import { toUserMessage } from '../../../utils/userMessages';
import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { Contract } from '../../../types';
import {
  FileCheck, ShieldCheck, CheckCircle2, AlertTriangle, AlertCircle,
  Upload, FileText, Calendar, Building, User, Lock, ArrowRight,
  Info, ExternalLink
} from 'lucide-react';

interface HDT04Props {
  initialContract?: Contract | null;
  onSigned?: (contractId: string) => void;
  onNavigateToTab?: (tab: 'conditions' | 'draft' | 'negotiate' | 'sign' | 'schedules' | 'renewal' | 'activate') => void;
}

export const HDT04ReceiveSignedContract: React.FC<HDT04Props> = ({
  initialContract,
  onNavigateToTab,
  onSigned
}) => {
  const {
    contracts,
    tenants,
    rooms,
    confirmContractSignedHDT04
  } = useApp();

  const [selectedContractId, setSelectedContractId] = useState<string>(
    initialContract?.id ||
    contracts.find(c => c.status === 'Chờ khách ký' || c.status === 'Nháp')?.id ||
    ''
  );

  const [signedDate, setSignedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [proofFile, setProofFile] = useState<string>('hop_dong_ky_tay_hai_ben.pdf');

  //  ghi nhận ký Identity Verification fields
  const [verifiedIdNumber, setVerifiedIdNumber] = useState<string>('');
  const [verifiedProof, setVerifiedProof] = useState<string>('anh_cccd_goc_2_mat_doi_chieu.jpg');
  const [confirmVerified, setConfirmVerified] = useState<boolean>(false);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedContract = contracts.find(c => c.id === selectedContractId);
  const selectedTenant = selectedContract ? tenants.find(t => t.id === selectedContract.tenantId): null;
  const isPreliminary = selectedTenant?.isPreliminary || selectedTenant?.verificationStatus === 'Chưa xác minh';

  // Available unsigned contracts
  const eligibleContracts = contracts.filter(c => c.status === 'Chờ khách ký' || c.status === 'Nháp');

  const handleConfirmSigned = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContract) return;

    // Check  ghi nhận ký identity verification constraint
    if (isPreliminary && (!confirmVerified || !verifiedIdNumber.trim())) {
      alert(
        'LỖI CHẶN KÝ:\n' +
        'Khách thuê hiện là Hồ sơ sơ bộ / Chưa xác minh giấy tờ!\n' +
        'Bắt buộc nhập số CCCD thật, đính kèm ảnh đối chiếu bản gốc và tích chọn xác nhận đã đối chiếu trực tiếp.'
      );
      return;
    }

    const res = confirmContractSignedHDT04(
      selectedContract.id,
      signedDate,
      [proofFile],
      isPreliminary ? {
        idNumber: verifiedIdNumber.trim(),
        proof: verifiedProof,
        confirmVerified
      }: undefined
    );

    if (res.success) {
      setSuccessMessage(res.message);
      alert(toUserMessage(res.message));
      onSigned?.(selectedContract.id);
    } else {
      alert(toUserMessage(res.message));
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold bg-emerald-700 text-white px-2 py-0.5 rounded">
              
            </span>
            <h2 className="text-sm font-bold text-slate-900">
              Tiếp nhận, đối chiếu & lưu hợp đồng đã ký (Lưu bản ký hợp đồng) </h2>
          </div>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Đối chiếu văn bản có chữ ký của cả hai bên, tải file chứng cứ hợp đồng giấy. <strong>Ràng buộc đặc tả ghi nhận ký:</strong> Bắt buộc hoàn tất đối chiếu bản gốc CCCD/Hộ chiếu của khách thuê trước khi ký kết chính thức nếu là hồ sơ sơ bộ. </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs font-semibold text-slate-700">
            Chờ tiếp nhận ký: <strong>{eligibleContracts.length}</strong> hợp đồng </span>
        </div>
      </div>

      {/* Main Grid: Form Left, Contract Summary Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Container */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              Biểu mẫu tiếp nhận & đối chiếu hợp đồng ký </h3>
            <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold">
              Khóa dữ liệu pháp lý </span>
          </div>

          <form onSubmit={handleConfirmSigned} className="space-y-4 text-xs">
            {/* Contract Selector */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Chọn hợp đồng cần ghi nhận bản ký <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedContractId}
                onChange={(e) => {
                  setSelectedContractId(e.target.value);
                  setSuccessMessage(null);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-xs"
              >
                {eligibleContracts.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.id} - Phòng {c.roomCode} - Khách: {c.tenantName} ({c.status}) </option>
                ))}
              </select>
            </div>

            {selectedContract && (
              <>
                {/* Signing Date & Proof Files */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Ngày ký hợp đồng giấy thực tế <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={signedDate}
                      onChange={(e) => setSignedDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Tệp scan/PDF hợp đồng đã ký hai bên <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={proofFile}
                      onChange={(e) => setProofFile(e.target.value)}
                      placeholder="vd: hop_dong_p103_ky_tay.pdf"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs"
                    />
                  </div>
                </div>

                {/*  ghi nhận ký Identity Verification Box */}
                {isPreliminary ? (
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-300 space-y-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-bold text-amber-950 text-xs uppercase tracking-wide">
                          ĐỐI CHIẾU GIẤY TỜ NHÂN THÂN KHÁCH THUÊ </strong>
                        <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                          Hồ sơ khách <strong>{selectedTenant?.fullName}</strong> ({selectedTenant?.id}) hiện là <strong>Hồ sơ sơ bộ</strong>. Cần đối chiếu bản gốc giấy tờ tùy thân trước khi lưu hợp đồng đã ký. </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block font-semibold text-slate-800 mb-1 text-[11px]">
                          Số CCCD/Định danh đối chiếu bản gốc <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={verifiedIdNumber}
                          onChange={(e) => setVerifiedIdNumber(e.target.value)}
                          placeholder="Nhập 12 số CCCD thật..."
                          className="w-full px-3 py-1.5 border border-amber-400 bg-white rounded-lg font-mono text-xs font-bold"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-800 mb-1 text-[11px]">
                          Tệp ảnh đối chiếu CCCD 2 mặt <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={verifiedProof}
                          onChange={(e) => setVerifiedProof(e.target.value)}
                          className="w-full px-3 py-1.5 border border-amber-400 bg-white rounded-lg font-mono text-xs"
                        />
                      </div>
                    </div>

                    <label className="flex items-start gap-2 pt-2 border-t border-amber-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={confirmVerified}
                        onChange={(e) => setConfirmVerified(e.target.checked)}
                        className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                      />
                      <span className="text-[11px] text-slate-800 font-medium">
                        Tôi xác nhận đã kiểm tra, đối chiếu trực tiếp bản gốc CCCD/Hộ chiếu với người ký tên, đảm bảo thông tin hợp lệ và chính xác trước khi khóa hợp đồng. </span>
                    </label>
                  </div>
                ): (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-2 text-emerald-900 text-xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Hồ sơ khách thuê <strong>{selectedTenant?.fullName}</strong> đã được xác minh giấy tờ hợp lệ từ trước (CCCD: <span className="font-mono font-semibold">{selectedTenant?.idNumber || 'Đã có'}</span>). Đủ điều kiện ký hợp đồng ngay. </span>
                  </div>
                )}

                {/* Submit Action */}
                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">
                    Thao tác này sẽ chuyển hợp đồng sang trạng thái Đã ký / Hiệu lực và khóa phòng. </span>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Xác nhận lưu hợp đồng đã ký (4.12) </button>
                </div>
              </>
            )}
          </form>

          {successMessage && (
            <div className="p-4 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-900 text-xs flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-700" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {/* Contract Summary Box Right */}
        <div className="lg:col-span-5 space-y-4">
          {selectedContract ? (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="font-bold text-slate-900">Chi tiết hợp đồng tiếp nhận</span>
                <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  {selectedContract.id}
                </span>
              </div>

              <div className="space-y-2.5">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Phòng thuê:</span>
                  <strong className="text-slate-900 font-mono">{selectedContract.roomCode}</strong>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Khách thuê:</span>
                  <strong className="text-slate-900">{selectedContract.tenantName}</strong>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Mã lần thuê:</span>
                  <strong className="font-mono text-indigo-700">{selectedContract.leaseId}</strong>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Thời hạn thuê:</span>
                  <span className="font-mono font-semibold">{selectedContract.startDate} → {selectedContract.endDate}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Đơn giá thuê:</span>
                  <strong className="font-mono">{selectedContract.monthlyRent.toLocaleString('vi-VN')} đ/tháng</strong>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Tiền cọc giữ chỗ:</span>
                  <strong className="font-mono text-emerald-700">{selectedContract.depositAmount.toLocaleString('vi-VN')} đ</strong>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Tiền thuê tháng đầu:</span>
                  <span className="font-mono font-semibold text-blue-700">{selectedContract.firstMonthRentAmount.toLocaleString('vi-VN')} đ</span>
                </div>

                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Hình thức thanh toán:</span>
                  <span className="font-medium text-slate-700">{selectedContract.paymentMethod}</span>
                </div>
              </div>

              {/* Status Note */}
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 text-[11px] text-blue-900 space-y-1">
                <span className="font-bold block">Hiệu lực tự động:</span>
                <p>
                  Nếu ngày bắt đầu ({selectedContract.startDate}) &lt;= hôm nay, trạng thái hợp đồng lập tức chuyển thành <strong>Hiệu lực</strong>. Nếu ngày bắt đầu trong tương lai, trạng thái sẽ là <strong>Chờ hiệu lực</strong>. </p>
              </div>
            </div>
          ): (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
              Vui lòng chọn một hợp đồng để tiến hành đối chiếu và lưu bản ký. </div>
          )}
        </div>
      </div>
    </div>
  );
};
