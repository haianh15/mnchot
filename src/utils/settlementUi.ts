import { Contract, DepositSettlementSlip, ReturnInspection } from '../types';

/** Rules shared by the contract list and the settlement screens. */
export const terminalSettlementStatuses = ['Đã có kết quả – chờ ký biên bản', 'Đã có 5.8 – chờ ký biên bản', 'Đã lập quyết toán – chờ ký biên bản', 'Hoàn tất'];

export function getCurrentSettlementSlip(slips: DepositSettlementSlip[], leaseId: string, roomCode?: string) {
  return [...slips].filter(s => s.leaseId === leaseId && (!roomCode || s.roomCode === roomCode) && s.status !== 'Đã hủy')
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))[0] || null;
}

export function isLastContractOfLease(contract: Contract, contracts: Contract[]) {
  // A renewed contract belongs to the SAME lease. Do not put its preceding contract
  // in the settlement queue just because its status was changed to 'Kết thúc'.
  return !contracts.some(other => other.id !== contract.id && other.roomCode === contract.roomCode &&
    other.leaseId === contract.leaseId && other.status !== 'Đã hủy' &&
    ((other.previousContractId === contract.id && !['Nháp', 'Chờ khách ký'].includes(other.status)) ||
      (other.contractType === 'Hợp đồng nối tiếp' && other.startDate > contract.startDate &&
       !['Nháp', 'Chờ khách ký'].includes(other.status))));
}

export function requiresDepositSettlement(contract: Contract, contracts: Contract[], inspections: ReturnInspection[], slips: DepositSettlementSlip[]) {
  if (['Nháp', 'Chờ khách ký', 'Đã hủy'].includes(contract.status) || !isLastContractOfLease(contract, contracts)) return false;
  const receivedBack = inspections.some(i => i.roomCode === contract.roomCode && i.leaseId === contract.leaseId &&
    i.step304Status === 'Đã nhận lại' && i.step305Confirmed);
  const current = getCurrentSettlementSlip(slips, contract.leaseId, contract.roomCode);
  return receivedBack && (!current || current.status !== 'Hoàn tất');
}

export function canEditSettlement(slip: DepositSettlementSlip) {
  return !slip.step58Published && !slip.disputeLocked &&
    !terminalSettlementStatuses.includes(slip.status) &&
    !['Đã hủy', 'Tranh chấp'].includes(slip.status);
}

export function canRecordSettlement(slip: DepositSettlementSlip) {
  return slip.status === 'Khách đồng ý' && !slip.step58Published && !slip.reviewRequired &&
    slip.finalBillConfirmed && slip.calculationStatus === 'Đã tính' &&
    slip.tenantAgreementEvidence?.schemeVersion === slip.version &&
    slip.tenantAgreementEvidence?.agreedAmount === slip.calculatedResult;
}
