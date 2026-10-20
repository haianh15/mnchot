import type { CoTenant, Contract, ReturnInspection, Room, Tenant } from '../types';
import { resolveRoomContract, resolveRoomTenantId } from './roomLinks';

/** One authoritative calculation for currently residing people.
 * A signed future lease and historical/expected co-tenants are not occupants.
 * null means that the occupied room is missing its current lease/tenant link:
 * do not turn missing data into a fictitious number.
 */
export function getRoomOccupancy(
  room: Room,
  contracts: Contract[],
  returnInspections: ReturnInspection[],
  tenants: Tenant[],
  coTenants: CoTenant[]
): { total: number | null; primaryTenantId?: string; leaseId?: string; currentCoTenants: CoTenant[] } {
  if (room.status === 'Trống') return { total: 0, currentCoTenants: [] };
  const contract = resolveRoomContract(room, contracts, returnInspections);
  const leaseId = room.currentLeaseId;
  const primaryTenantId = resolveRoomTenantId(room, contract, tenants);
  if (!leaseId || !primaryTenantId || (contract && contract.leaseId !== leaseId)) {
    return { total: null, currentCoTenants: [] };
  }
  const currentCoTenants = coTenants.filter(person =>
    person.tenantId === primaryTenantId &&
    person.roomCode === room.roomCode &&
    person.leaseId === leaseId &&
    person.status === 'Đang cư trú'
  );
  return { total: 1 + currentCoTenants.length, primaryTenantId, leaseId, currentCoTenants };
}
