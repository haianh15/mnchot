import React from 'react';
import { Contract, Room, Tenant } from '../../../types';

/**
 * Bản thể hiện dạng văn bản từ hồ sơ hợp đồng đang được lưu.
 * Không tự suy diễn điều khoản đã ký, danh tính bên cho thuê hoặc chữ ký.
 */
interface Props {
  contract: Contract;
  tenant?: Tenant;
  room?: Room;
}

const empty = '........................................................';
const formatDate = (value?: string) => {
  if (!value) return '........ / ........ / ........';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
};
const formatAmount = (value?: number) => typeof value === 'number' && Number.isFinite(value)
  ? `${value.toLocaleString('vi-VN')} đồng` : 'Chưa ghi nhận';

export const ContractDocument: React.FC<Props> = ({ contract, tenant, room }) => {
  const idNumber = contract.verifiedTenantIdNumber || contract.tenantIdNumber || tenant?.idNumber || '';
  const address = tenant?.address || '';
  const phone = contract.tenantPhone || tenant?.phoneNumber || '';
  const isDraft = ['Nháp', 'Chờ khách ký'].includes(contract.status) || !contract.isSignedPaper;
  return (
    <article className="contract-print-page bg-white text-slate-950 border border-slate-200 shadow-sm rounded-md mx-auto w-full max-w-[210mm] p-4 sm:p-6 lg:p-8 font-serif text-[13px] sm:text-[14px] leading-[1.75] break-words" aria-label={`Bản hợp đồng thuê phòng ${contract.id}`}>
      <div className="text-center leading-relaxed mb-5">
        <div className="font-bold text-[13px] sm:text-[15px] uppercase tracking-[.025em]">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
        <div className="font-bold text-[13px] sm:text-[14px]">Độc lập - Tự do - Hạnh phúc</div>
        <div className="w-32 border-b border-slate-900 mx-auto mt-1.5" />
        <h2 className="font-bold text-lg sm:text-xl uppercase mt-5">HỢP ĐỒNG THUÊ PHÒNG Ở</h2>
        <div>Số: <strong>{contract.id}</strong></div>
        <div className="text-xs text-slate-600">{isDraft ? 'Dự thảo / Chưa ghi nhận bản giấy đã ký' : `Hồ sơ đã ghi nhận ký ngày ${formatDate(contract.signedDate)}`}</div>
      </div>

      <p className="mb-3">Hôm nay, ngày {formatDate(contract.signedDate)}, các bên tham gia hợp đồng thuê phòng với những thông tin được ghi nhận như sau:</p>

      <section className="mb-4">
        <h3 className="font-bold uppercase mb-1">BÊN CHO THUÊ (BÊN A)</h3>
        <p>Họ và tên / Tên chủ thể cho thuê: <strong>{contract.lessorName || empty}</strong></p>
        <p>Số CCCD / Mã định danh: {contract.lessorIdNumber || empty}</p>
        <p>Địa chỉ liên hệ: {contract.lessorAddress || empty}</p>
        <p>Số điện thoại: {contract.lessorPhone || empty}</p>
        {!contract.lessorName && <p className="text-xs italic text-slate-600 mt-1">Hồ sơ hợp đồng này chưa lưu tên pháp lý Bên A; không lấy tên chủ tài khoản ngân hàng thay cho người cho thuê.</p>}
      </section>

      <section className="mb-4">
        <h3 className="font-bold uppercase mb-1">BÊN THUÊ (BÊN B)</h3>
        <p>Họ và tên: <strong>{contract.tenantName || tenant?.fullName || empty}</strong></p>
        <p>Số CCCD / Mã định danh: <strong>{idNumber || empty}</strong></p>
        <p>Địa chỉ liên hệ: {address || empty}</p>
        <p>Số điện thoại: {phone || empty}</p>
      </section>

      <p className="mb-4">Các nội dung dưới đây được trình bày theo dữ liệu hợp đồng đã lưu. Các mục chưa có dữ liệu cần đối chiếu với bản hợp đồng giấy trước khi sử dụng.</p>

      <section className="mb-4">
        <h3 className="font-bold uppercase">ĐIỀU 1. ĐỐI TƯỢNG THUÊ</h3>
        <p>1.1. Phòng thuê: <strong>{contract.roomCode}</strong>{room ? `; tầng ${room.floor}; diện tích ${room.area} m²` : ''}.</p>
        <p>1.2. Địa chỉ tòa nhà / địa chỉ phòng: {contract.propertyAddress || empty}</p>
        <p>1.3. Tình trạng phòng, tài sản và trang thiết bị bàn giao: theo biên bản bàn giao riêng của đúng lần thuê (nếu đã có); không tự tạo danh mục tài sản trong hợp đồng.</p>
      </section>

      <section className="mb-4">
        <h3 className="font-bold uppercase">ĐIỀU 2. THỜI HẠN THUÊ</h3>
        <p>2.1. Thời gian thuê: từ ngày <strong>{formatDate(contract.startDate)}</strong> đến ngày <strong>{formatDate(contract.endDate)}</strong>.</p>
        <p>2.2. Đợt hợp đồng: <strong>{contract.batchCode || 'Chưa ghi nhận'}</strong>; loại hợp đồng: <strong>{contract.contractType}</strong>.</p>
        {contract.actualCheckInDate && <p>2.3. Ngày nhận phòng thực tế đã ghi nhận: {formatDate(contract.actualCheckInDate)}.</p>}
      </section>

      <section className="mb-4">
        <h3 className="font-bold uppercase">ĐIỀU 3. GIÁ THUÊ, TIỀN ĐẶT CỌC VÀ THANH TOÁN</h3>
        <p>3.1. Tiền thuê: <strong>{formatAmount(contract.monthlyRent)}/tháng</strong>.</p>
        <p>3.2. Tiền đặt cọc ghi trong hợp đồng: <strong>{formatAmount(contract.depositAmount)}</strong>{contract.contractType === 'Hợp đồng nối tiếp' ? ' (số cọc kế thừa từ lần thuê hiện tại, không phải khoản cọc cần đóng thêm)' : ''}.</p>
        <p>3.3. Tiền thuê tháng đầu ghi trong hợp đồng: <strong>{formatAmount(contract.firstMonthRentAmount)}</strong>{contract.contractType === 'Hợp đồng nối tiếp' ? ' (không suy ra khoản cần thu lại)' : ''}.</p>
        <p>3.4. Phương thức thanh toán: <strong>{contract.paymentMethod || 'Chưa ghi nhận'}</strong>.</p>
        <p>3.5. Thời điểm thanh toán, giá dịch vụ và các điều kiện thu khác: đối chiếu thỏa thuận thực tế hoặc phụ lục hợp đồng; hồ sơ chưa lưu thành từng điều khoản riêng.</p>
      </section>

      <section className="mb-4">
        <h3 className="font-bold uppercase">ĐIỀU 4. SỬ DỤNG PHÒNG VÀ BÀN GIAO</h3>
        <p>Thông tin nhận phòng, hiện trạng tài sản, chỉ số điện nước và việc nhận lại phòng được quản lý tại các biên bản riêng. Quyền, nghĩa vụ và yêu cầu sử dụng cụ thể của các bên phải được đối chiếu theo hợp đồng giấy đã ký.</p>
      </section>

      <section className="mb-4">
        <h3 className="font-bold uppercase">ĐIỀU 5. CHẤM DỨT THUÊ VÀ XỬ LÝ TIỀN CỌC</h3>
        <p>Việc hoàn, khấu trừ hoặc đối trừ tiền cọc căn cứ các điều khoản đã thỏa thuận, chứng cứ thực tế và phiếu quyết toán cọc có liên quan. Không mặc nhiên coi một khoản trừ chưa được xác nhận là điều khoản của hợp đồng.</p>
      </section>

      <section className="mb-5">
        <h3 className="font-bold uppercase">ĐIỀU 6. ĐIỀU KHOẢN VÀ THỎA THUẬN ĐƯỢC GHI NHẬN</h3>
        <div className="whitespace-pre-wrap">{contract.terms?.trim() || 'Chưa lưu nội dung thỏa thuận bổ sung trong hồ sơ.'}</div>
      </section>

      <section className="mb-3">
        <h3 className="font-bold uppercase">ĐIỀU 7. XÁC NHẬN CỦA CÁC BÊN</h3>
        <p>Hợp đồng và các phụ lục, biên bản (nếu có) cần được đối chiếu với bản giấy do các bên ký. Việc hiển thị thông tin trên website không thay thế bản gốc có chữ ký.</p>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:gap-8 mt-8 text-center font-sans text-xs sm:text-sm break-inside-avoid">
        <div><strong className="block uppercase">BÊN CHO THUÊ (BÊN A)</strong><span className="italic text-slate-600">(Ký và ghi rõ họ tên)</span><div className="h-20" /><strong>{contract.lessorName || ''}</strong></div>
        <div><strong className="block uppercase">BÊN THUÊ (BÊN B)</strong><span className="italic text-slate-600">(Ký và ghi rõ họ tên)</span><div className="h-20" /><strong>{contract.tenantName || tenant?.fullName || ''}</strong></div>
      </div>
      <div className="contract-document-warning mt-5 border-t border-slate-200 pt-3 text-[11px] font-sans text-slate-600 italic">
        Bản trình bày được tạo từ dữ liệu hệ thống, không phải bản scan hay bản sao chứng thực hợp đồng đã ký. Các chỗ để trống không được tự suy diễn từ tài khoản quản lý hoặc tài khoản nhận tiền.
      </div>
    </article>
  );
};
