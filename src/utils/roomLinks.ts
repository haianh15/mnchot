import type { Contract, Room, ReturnInspection, Tenant } from '../types';

/**
 * Resolve the contract shown from a room without confusing an upcoming signed
 * contract with an actual occupied lease. Never fall back to an unrelated
 * historical contract just because it shares a room code.
 */
export function resolveRoomContract(
  room: Room,
  contracts: Contract[],
  returnInspections: ReturnInspection[]
): Contract | undefined {
  if (room.status !== 'Trống') {
    if (!room.currentLeaseId) return undefined;
    return contracts.find(c => c.id === room.currentContractId && c.roomCode === room.roomCode &&
      c.leaseId === room.currentLeaseId && !['Đã hủy', 'Kết thúc'].includes(c.status)) ||
      contracts.find(c => c.roomCode === room.roomCode && c.leaseId === room.currentLeaseId &&
        c.isSignedPaper && !['Đã hủy', 'Kết thúc'].includes(c.status));
  }
  const pending = contracts.filter(c => c.roomCode === room.roomCode && c.isSignedPaper &&
    ['Đã ký', 'Chờ hiệu lực', 'Hiệu lực'].includes(c.status) && !c.actualCheckInDate &&
    !returnInspections.some(i => i.roomCode === room.roomCode && i.leaseId === c.leaseId && i.step305Confirmed));
  return pending.find(c => c.id === room.pendingContractId) ||
    [...pending].sort((a, b) => (b.signedDate || b.createdAt || '').localeCompare(a.signedDate || a.createdAt || ''))[0];
}

export function resolveRoomTenantId(room: Room, contract: Contract | undefined, tenants: Tenant[]): string | undefined {
  if (room.status !== 'Trống' && room.currentTenantId) {
    if (contract && contract.tenantId !== room.currentTenantId) return undefined;
    return tenants.some(t => t.id === room.currentTenantId) ? room.currentTenantId : undefined;
  }
  return contract?.tenantId && tenants.some(t => t.id === contract.tenantId)
    ? contract.tenantId : undefined;
}
