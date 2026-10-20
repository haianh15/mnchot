import type { Contract, InitialPaymentRecord } from '../types';

export type InitialPaymentStatus = {
  valid: boolean;
  message: string;
  payment?: InitialPaymentRecord;
  sourceContractId?: string;
  inherited: boolean;
};

const validDate = (date?: string) => !!date && /^\d{4}-\d{2}-\d{2}$/.test(date) &&
  !Number.isNaN(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date;

/** The existence of a status flag is not proof of a bank transfer. */
export function getInitialPaymentStatus(
  contract: Contract | undefined,
  contracts: Contract[],
  records: InitialPaymentRecord[],
  signedDate?: string
): InitialPaymentStatus {
  if (!contract) return { valid: false, message: 'Chưa có hợp đồng để đối chiếu khoản thu.', inherited: false };
  let source = contract;
  const inherited = contract.contractType === 'Hợp đồng nối tiếp';
  const visited = new Set<string>();
  while (source.contractType === 'Hợp đồng nối tiếp') {
    if (visited.has(source.id) || !source.previousContractId) {
      return { valid: false, message: 'Không truy được hợp đồng lần đầu và cọc gốc.', inherited };
    }
    visited.add(source.id);
    const previous = contracts.find(c => c.id === source.previousContractId &&
      c.roomCode === contract.roomCode && c.leaseId === contract.leaseId && c.tenantId === contract.tenantId);
    if (!previous) return { valid: false, message: 'Hợp đồng nối tiếp không cùng phòng, khách hoặc lần thuê với hợp đồng gốc.', inherited };
    source = previous;
  }
  const payment = records.find(p => p.contractId === source.id && p.roomCode === source.roomCode && p.leaseId === source.leaseId);
  if (!payment) return { valid: false, message: 'Chưa có chứng từ xác nhận tiền cọc và tiền thuê kỳ đầu.', inherited, sourceContractId: source.id };
  if (!validDate(payment.receivedDate) || !payment.transactionCode?.trim() || !payment.bankAccountReceived?.trim() ||
      !payment.confirmedBy?.trim() || !payment.confirmedAt || Number.isNaN(Date.parse(payment.confirmedAt))) {
    return { valid: false, message: 'Chứng từ thanh toán thiếu ngày nhận, giao dịch, tài khoản hoặc xác nhận đối chiếu.', inherited, sourceContractId: source.id };
  }
  if (!(source.depositAmount > 0 && source.firstMonthRentAmount > 0) ||
      payment.depositAmount !== source.depositAmount || payment.firstMonthRentAmount !== source.firstMonthRentAmount ||
      payment.actualAmount !== source.depositAmount + source.firstMonthRentAmount) {
    return { valid: false, message: 'Tiền cọc hoặc tiền thuê kỳ đầu không khớp số tiền phải thu của hợp đồng gốc.', inherited, sourceContractId: source.id };
  }
  if (payment.receivedDate > new Date().toISOString().slice(0, 10)) {
    return { valid: false, message: 'Ngày nhận tiền không được nằm trong tương lai.', inherited, sourceContractId: source.id };
  }
  // The first lease must really have been paid before the written contract was signed.
  const signatureDate = signedDate || (source.isSignedPaper ? source.signedDate : undefined);
  if (!inherited && signatureDate && (!validDate(signatureDate) || payment.receivedDate > signatureDate)) {
    return { valid: false, message: 'Ngày ghi nhận đã thu tiền phải trước hoặc bằng ngày ký hợp đồng.', inherited, sourceContractId: source.id };
  }
  return {
    valid: true,
    message: inherited ? 'Đã đối chiếu cọc gốc và tiền thuê kỳ đầu từ hợp đồng lần đầu, không thu lại cọc.' : 'Đã xác nhận đủ tiền cọc và tiền thuê kỳ đầu trước khi ký.',
    payment, inherited, sourceContractId: source.id
  };
}
