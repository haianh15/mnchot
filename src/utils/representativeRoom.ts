import type { Contract, Room, Tenant, ReturnInspection, LeaseStartEvent } from '../types';
import { isAwaitingFirstCheckIn, wasLeaseReturned } from './roomLifecycle';

/** A legal representative can be attached to at most ONE unfinished room/lease.
 * Use stable profile ID or CCCD; when no ID document exists use full name PLUS
 * phone (never name alone). Keep completed/returned leases as history.
 */
export type RepresentativeLookup = {
  roomCode: string;
  tenantId?: string;
  tenantIdNumber?: string;
  tenantName?: string;
  tenantPhone?: string;
  excludeContractId?: string;
};

const normalizeText = (value?: string) => (value || '').trim().normalize('NFC').toLocaleLowerCase('vi');
const normalizeDigits = (value?: string) => (value || '').replace(/\D/g, '');

export function findRepresentativeRoomConflict(
  input: RepresentativeLookup,
  rooms: Room[], contracts: Contract[], tenants: Tenant[],
  inspections: ReturnInspection[] = [], starts: LeaseStartEvent[] = []
): {roomCode: string; contractId?: string; message: string} | undefined {
  const selected = tenants.find(t => t.id === input.tenantId);
  const idNumber = normalizeDigits(input.tenantIdNumber || selected?.idNumber);
  const name = normalizeText(input.tenantName || selected?.fullName);
  const phone = normalizeDigits(input.tenantPhone || selected?.phoneNumber);
  if (!input.tenantId && !idNumber && !(name && phone)) return undefined;

  const matches = (person: {tenantId?: string; tenantIdNumber?: string; tenantName?: string; tenantPhone?: string}) => {
    if (input.tenantId && person.tenantId === input.tenantId) return true;
    const linked = tenants.find(t => t.id === person.tenantId);
    const otherId = normalizeDigits(person.tenantIdNumber || linked?.idNumber);
    if (idNumber && otherId && idNumber === otherId) return true;
    // Only use name+phone as fallback if a common CCCD cannot be checked.
    if (!idNumber || !otherId) {
      const otherName = normalizeText(person.tenantName || linked?.fullName);
      const otherPhone = normalizeDigits(person.tenantPhone || linked?.phoneNumber);
      if (name && phone && name === otherName && phone === otherPhone) return true;
    }
    return false;
  };

  const conflict = (roomCode: string, contractId?: string) => ({
    roomCode, contractId,
    message: `Người đại diện đã gắn với phòng ${roomCode}${contractId ? ` (hợp đồng ${contractId})` : ''}. Mỗi người chỉ được đại diện một phòng tại cùng thời điểm; hãy hoàn tất trả phòng hoặc xử lý hợp đồng ở phòng đó trước.`
  });

  // An occupied/returning room remains allocated until the actual return event,
  // even if the paper contract date has already passed.
  for (const room of rooms) {
    if (room.roomCode === input.roomCode || room.status === 'Trống') continue;
    if (matches({tenantId: room.currentTenantId, tenantName: room.currentTenantName})) {
      return conflict(room.roomCode, room.currentContractId);
    }
    const linked = contracts.find(c => c.roomCode === room.roomCode &&
      c.leaseId === room.currentLeaseId && c.isSignedPaper &&
      c.status !== 'Đã hủy' && matches(c));
    if (linked) return conflict(room.roomCode, linked.id);
  }

  for (const c of contracts) {
    if (c.roomCode === input.roomCode || c.id === input.excludeContractId ||
        ['Đã hủy', 'Kết thúc'].includes(c.status) || !matches(c) ||
        wasLeaseReturned(c, inspections)) continue;
    const room = rooms.find(r => r.roomCode === c.roomCode);
    // An unsigned pending draft counts as an existing proposed representative;
    // prevent two concurrent contracting flows for different rooms.
    if (!c.isSignedPaper && ['Nháp', 'Chờ khách ký'].includes(c.status)) return conflict(c.roomCode, c.id);
    if (room && room.status !== 'Trống' && room.currentLeaseId === c.leaseId) return conflict(c.roomCode, c.id);
    if (isAwaitingFirstCheckIn(c, inspections, starts)) return conflict(c.roomCode, c.id);
  }
  return undefined;
}
