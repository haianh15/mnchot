import type { PaymentNotice } from '../types';

/**
 * Công nợ là các thông báo kỳ nguồn; Thu công nợ là chứng từ thu gộp từ chính
 * các thông báo ấy. Không tạo hai nguồn thu/QR cho cùng một khoản.
 */
export type DebtPaymentRoute =
  | { mode: 'detail'; noticeId: string }
  | { mode: 'create'; roomCode: string; leaseId: string; sourceNoticeIds: string[] }
  | { mode: 'split'; message: string }
  | { mode: 'unavailable'; message: string };

type DebtNotice = Pick<PaymentNotice, 'id' | 'roomCode' | 'leaseId' | 'noticeType' | 'status' | 'paymentStatus' | 'debtNoticeIds' | 'noticeCode' | 'dueDate' | 'originalDueDate'>;

export function resolveDebtPaymentRoute(
  notices: DebtNotice[], roomCode: string, leaseId: string, sourceNoticeIds: string[]
): DebtPaymentRoute {
  const ids = [...new Set(sourceNoticeIds.filter(Boolean))];
  if (!roomCode || !leaseId || !ids.length)
    return { mode: 'unavailable', message: 'Chưa xác định được phòng, lượt thuê và khoản nợ cần thanh toán.' };

  const sources = ids.map(id => notices.find(n => n.id === id));
  if (sources.some(n => !n || n.noticeType === 'DEBT' || n.roomCode !== roomCode || n.leaseId !== leaseId))
    return { mode: 'unavailable', message: 'Khoản nợ không thuộc cùng phòng/lượt thuê hoặc không còn tồn tại. Hãy tải lại dữ liệu.' };
  if (sources.some(n => n!.status !== 'Đang hiệu lực' || n!.paymentStatus !== 'Chưa thu'))
    return { mode: 'unavailable', message: 'Một hoặc nhiều khoản đã thu hoặc không còn hiệu lực. Hãy tải lại công nợ.' };

  const activeBundles = notices.filter(n => n.noticeType === 'DEBT' && n.roomCode === roomCode && n.leaseId === leaseId &&
    n.status === 'Đang hiệu lực' && n.paymentStatus === 'Chưa thu' && n.debtNoticeIds?.some(id => ids.includes(id)));
  const covering = activeBundles.filter(n => ids.every(id => n.debtNoticeIds?.includes(id)));
  if (covering.length > 1) return { mode: 'split', message: 'Một kỳ nợ đang xuất hiện trong nhiều thông báo thu công nợ còn hiệu lực. Vui lòng đối chiếu dữ liệu trước khi thu.' };
  if (covering.length === 1) return { mode: 'detail', noticeId: covering[0].id };
  if (activeBundles.length) {
    return { mode: 'split', message: 'Các kỳ nợ đã thuộc nhiều thông báo thu công nợ khác nhau hoặc có kỳ chưa lập thông báo. Hãy bấm Thanh toán ở từng kỳ để tránh thu trùng.' };
  }
  if (notices.some(n => n.noticeType === 'DEBT' && n.roomCode === roomCode && n.leaseId === leaseId &&
    n.status === 'Đang hiệu lực' && n.paymentStatus === 'Đã thu' && n.debtNoticeIds?.some(id => ids.includes(id)))) {
    return { mode: 'unavailable', message: 'Khoản nợ đã thuộc thông báo công nợ được ghi nhận Đã thu nhưng kỳ gốc vẫn còn Chưa thu. Vui lòng đối chiếu trước khi thanh toán.' };
  }
  const today = new Date();
  const todayISO = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  if (sources.some(n => (n!.originalDueDate || n!.dueDate) >= todayISO))
    return { mode: 'unavailable', message: 'Chỉ được lập thông báo thu công nợ cho các kỳ đã quá hạn.' };
  return { mode: 'create', roomCode, leaseId, sourceNoticeIds: ids };
}
