import { toUserMessage } from '../../../utils/userMessages';
import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { Contract } from '../../../types';
import { getInitialPaymentStatus } from '../../../utils/initialPayments';
import {
  FileCheck, ShieldCheck, CheckCircle2, AlertTriangle, AlertCircle,
  Upload, FileText, Calendar, Building, User, Lock, ArrowRight,
  Info, ExternalLink
} from 'lucide-react';

interface HDT04Props {
  initialContract?: Contract | null;
  onSigned?: (contractId: string) => void;
  onNavigateToTab?: (tab: 'draft' | 'negotiate' | 'sign' | 'schedules' | 'renewal' | 'activate') => void;
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
    initialPaymentRecords,
    activeBankAccount,
    recordInitialPaymentPH07,
    confirmContractSignedHDT04
  } = useApp();

  const [selectedContractId, setSelectedContractId] = useState<string>(
    initialContract?.id || ''
  );

  const [signedDate, setSignedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [proofFile, setProofFile] = useState<string>('');

  //  ghi nhận ký Identity Verification fields
  const [verifiedIdNumber, setVerifiedIdNumber] = useState<string>('');
  const [verifiedProof, setVerifiedProof] = useState<string>('');
  const [confirmVerified, setConfirmVerified] = useState<boolean>(false);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [receivedDate, setReceivedDate] = useState('');
  const [transactionCode, setTransactionCode] = useState('');
  const [receivedBank, setReceivedBank] = useState('');
  const [transferProof, setTransferProof] = useState('');
  const [bankVerified, setBankVerified] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);

  const selectedContract = contracts.find(c => c.id === selectedContractId);
  const paymentStatus = getInitialPaymentStatus(selectedContract, contracts, initialPaymentRecords, signedDate);
  const totalInitialDue = selectedContract ? selectedContract.depositAmount + selectedContract.firstMonthRentAmount : 0;
  const handleConfirmInitialPayment = () => {
    if (!selectedContract || selectedContract.contractType === 'Hợp đồng nối tiếp') return;
    if (!bankVerified) {
      setPaymentMessage('Đây chỉ là bước ghi nhận: cần kiểm tra tiền đã chuyển ngoài hệ thống thực sự về tài khoản ngân hàng trước khi lưu.');
      return;
    }
    const response = recordInitialPaymentPH07({
      contractId: selectedContract.id,
      roomCode: selectedContract.roomCode,
      leaseId: selectedContract.leaseId,
      depositAmount: selectedContract.depositAmount,
      firstMonthRentAmount: selectedContract.firstMonthRentAmount,
      actualAmount: totalInitialDue,
      receivedDate,
      transactionCode,
      bankAccountReceived: receivedBank,
      proofFile: transferProof || undefined
    });
    setPaymentMessage(response.message);
    if (response.success) {
      setBankVerified(false);
    }
  };
  const selectedTenant = selectedContract ? tenants.find(t => t.id === selectedContract.tenantId): null;
  const isPreliminary = selectedTenant?.isPreliminary || selectedTenant?.verificationStatus === 'Chưa xác minh';

  // Available unsigned contracts
  const eligibleContracts = contracts.filter(c => c.status === 'Chờ khách ký' || c.status === 'Nháp');

  const handleConfirmSigned = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContract) return;
    if (!paymentStatus.valid) {
      alert(toUserMessage(`Không thể ghi nhận ký: ${paymentStatus.message}`));
      return;
    }

    // Check  ghi nhận ký identity verification constraint
    if (isPreliminary && (!confirmVerified || !verifiedIdNumber.trim())) {
      alert(
        'LỖI CHẶN KÝ:\n' +
        'Khách thuê hiện là hồ sơ sơ bộ hoặc còn thiếu giấy tờ đối chiếu!\n' +
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
                  setPaymentMessage(null);
                  setReceivedDate('');
                  setTransactionCode('');
                  setReceivedBank('');
                  setTransferProof('');
                  setBankVerified(false);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-xs"
              >
                <option value="" disabled>Chọn hợp đồng cần ghi nhận</option>
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

                {/* Chứng từ thu cọc và tiền thuê đầu là điều kiện bắt buộc TRƯỚC khi ký. */}
                <section className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-3" aria-label="Đối chiếu cọc và tiền thuê đầu">
                  <h4 className="text-sm font-bold text-blue-950">Đối chiếu khoản đã chuyển bên ngoài hệ thống trước khi ký</h4>
                  <p className="text-xs text-blue-900">Khách chuyển tiền cọc và tiền thuê kỳ đầu trực tiếp vào tài khoản ngân hàng theo thỏa thuận với Chủ nhà, ngoài website. Màn hình này <strong>chỉ ghi nhận giao dịch đã phát sinh và được Chủ nhà đối chiếu</strong>; không tạo yêu cầu thanh toán, không chuyển tiền hoặc tự xác nhận tiền đã về.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-white border p-2">Cọc gốc: <strong>{selectedContract.depositAmount.toLocaleString('vi-VN')} đ</strong></div>
                    <div className="rounded-lg bg-white border p-2">Tiền thuê kỳ đầu: <strong>{selectedContract.firstMonthRentAmount.toLocaleString('vi-VN')} đ</strong></div>
                    <div className="sm:col-span-2 rounded-lg bg-white border p-2">Tổng tiền phải thu: <strong>{totalInitialDue.toLocaleString('vi-VN')} đ</strong></div>
                  </div>
                  <p className={`rounded-lg p-2 text-xs ${paymentStatus.valid ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'}`} role="status">
                    {paymentStatus.valid ? `Đã đối chiếu chứng từ. ${paymentStatus.message}` : `Chưa đủ điều kiện ký: ${paymentStatus.message}`}
                  </p>
                  {paymentStatus.valid && paymentStatus.payment && (
                    <div className="rounded-lg border bg-white p-3 text-xs space-y-1">
                      <p><strong>Mã giao dịch:</strong> {paymentStatus.payment.transactionCode}</p>
                      <p><strong>Đã thu cọc:</strong> {paymentStatus.payment.depositAmount.toLocaleString('vi-VN')} đ</p>
                      <p><strong>Đã thu tiền thuê kỳ đầu:</strong> {paymentStatus.payment.firstMonthRentAmount.toLocaleString('vi-VN')} đ ({paymentStatus.payment.rentPeriodNote})</p>
                      <p><strong>Ngày tiền về:</strong> {paymentStatus.payment.receivedDate}</p>
                      {paymentStatus.inherited && <p className="text-purple-700">Hợp đồng nối tiếp: kế thừa chứng từ của hợp đồng gốc, không thu lại.</p>}
                    </div>
                  )}
                  {!paymentStatus.valid && selectedContract.contractType !== 'Hợp đồng nối tiếp' && (
                    <div className="space-y-3 rounded-lg bg-white border p-3">
                      <p className="text-xs font-semibold">Ghi nhận chứng từ giao dịch ngoài hệ thống (chỉ sau khi tiền thực tế đã về)</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="space-y-1">Ngày tiền về
                          <input type="date" className="w-full border rounded-lg p-2" value={receivedDate} max={new Date().toISOString().slice(0,10)} onChange={e => setReceivedDate(e.target.value)} />
                        </label>
                        <label className="space-y-1">Mã giao dịch chuyển khoản
                          <input className="w-full border rounded-lg p-2" value={transactionCode} onChange={e => setTransactionCode(e.target.value)} placeholder="Mã giao dịch thực tế" />
                        </label>
                        <label className="space-y-1">Tài khoản thực nhận
                          <input className="w-full border rounded-lg p-2" value={receivedBank} onChange={e => setReceivedBank(e.target.value)} placeholder="Ngân hàng / số tài khoản đã đối chiếu" />
                        </label>
                        <label className="space-y-1">Mã/tên chứng từ (nếu có)
                          <input className="w-full border rounded-lg p-2" value={transferProof} onChange={e => setTransferProof(e.target.value)} placeholder="Tên tệp chứng từ thực tế" />
                        </label>
                      </div>
                      {activeBankAccount && <p className="text-xs text-slate-600">Tài khoản thu đang cấu hình: {activeBankAccount.bankName} · {activeBankAccount.accountNumber}. Hãy đối chiếu đúng nơi tiền đã về.</p>}
                      <label className="flex gap-2 items-start text-xs">
                        <input type="checkbox" checked={bankVerified} onChange={e => setBankVerified(e.target.checked)} />
                        Tôi đã kiểm tra sao kê và xác nhận tiền cọc cùng tiền thuê kỳ đầu thực nhận đủ {totalInitialDue.toLocaleString('vi-VN')} đ.
                      </label>
                      <button type="button" onClick={handleConfirmInitialPayment} className="px-4 py-2 rounded-lg bg-blue-700 text-white font-semibold">Lưu kết quả đối chiếu khoản đã nhận</button>
                      {paymentMessage && <p role="status" className="text-xs text-blue-900">{toUserMessage(paymentMessage)}</p>}
                    </div>
                  )}
                </section>

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
                    Việc chuyển tiền diễn ra ngoài hệ thống. Chỉ ghi nhận hợp đồng đã ký khi đã đối chiếu đủ khoản cọc và thuê đầu; phòng chưa chuyển sang Đang thuê. </span>

                  <button
                    type="submit"
                    disabled={!paymentStatus.valid}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg font-bold flex items-center gap-2 shadow-sm cursor-pointer"
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
