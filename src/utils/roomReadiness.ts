import type { Contract, HandoverReport, InitialPaymentRecord, Room, Tenant } from '../types';
import { validateContractTenantLink } from './contractTenantLink';
import { getInitialPaymentStatus } from './initialPayments';
import { getConfirmedRoomHandover } from './roomLinks';

/** Read-only integrity audit. Missing old paper documents must never be invented,
 * and a physical occupancy flag must not be silently rewritten to "vacant". */
export function auditOccupiedRoom(
  room: Room,
  contracts: Contract[],
  tenants: Tenant[],
  payments: InitialPaymentRecord[],
  reports: HandoverReport[]
): { valid: boolean; missing: string[]; contract?: Contract; paymentValid: boolean; handoverValid: boolean; tenantValid: boolean } {
  if (room.status === 'Trống') {
    return { valid: true, missing: [], paymentValid: false, handoverValid: false, tenantValid: false };
  }
  const missing: string[] = [];
  const contract = contracts.find(c => c.id === room.currentContractId && c.roomCode === room.roomCode &&
    c.leaseId === room.currentLeaseId && c.isSignedPaper && !['Đã hủy', 'Kết thúc'].includes(c.status));
  if (!contract) missing.push('Hợp đồng đã ký liên kết đúng phòng và lần thuê');
  const linkedTenant = contract ? validateContractTenantLink(contract, tenants) : undefined;
  const tenantValid = Boolean(contract && linkedTenant?.valid && room.currentTenantId === contract.tenantId &&
    room.currentTenantName === contract.tenantName);
  if (!tenantValid) missing.push('Hồ sơ khách thuê đang cư trú khớp hợp đồng');
  const paymentValid = Boolean(contract && getInitialPaymentStatus(contract, contracts, payments).valid);
  if (!paymentValid) missing.push('Chứng từ đã đối chiếu cọc và tiền thuê kỳ đầu');
  const handoverValid = Boolean(contract && getConfirmedRoomHandover(contract, contracts, reports));
  if (!handoverValid) missing.push('Biên bản nhận phòng đã xác nhận, đủ chữ ký hai bên');
  if (!contract?.actualCheckInDate) missing.push('Ngày nhận phòng thực tế đã xác nhận');
  return { valid: missing.length === 0, missing, contract, paymentValid, handoverValid, tenantValid };
}
