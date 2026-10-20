import type { Contract, Tenant } from '../types';

/** Identity check BEFORE preparing or confirming a paper contract.
 * Never create a fictional tenant profile or infer one from a room number.
 * Linking is always by the stable profile ID, not by name alone.
 */
export function validateContractTenantLink(
  contract: Pick<Contract, 'tenantId' | 'tenantName' | 'tenantIdNumber'>,
  tenants: Tenant[]
): { valid: boolean; tenant?: Tenant; message?: string } {
  const tenant = tenants.find(t => t.id === contract.tenantId);
  if (!tenant) {
    return { valid: false, message: 'Chưa có hồ sơ khách thuê tương ứng. Hãy tạo hoặc chọn đúng hồ sơ khách trước khi ký hợp đồng.' };
  }
  if (!contract.tenantName.trim() || tenant.fullName.trim() !== contract.tenantName.trim()) {
    return { valid: false, message: 'Họ tên người ký không trùng với hồ sơ khách đã chọn. Cần đối chiếu và sửa dự thảo.' };
  }
  if (contract.tenantIdNumber?.trim() && tenant.idNumber?.trim() &&
      contract.tenantIdNumber.trim() !== tenant.idNumber.trim()) {
    return { valid: false, message: 'CCCD người ký không khớp hồ sơ khách thuê.' };
  }
  return { valid: true, tenant };
}
