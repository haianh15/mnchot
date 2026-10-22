import type { Tenant, Contract, LeaseConditionDraft } from '../types';

/**
 * Sửa riêng hai liên kết mẫu sai trong phiên bản cũ: hợp đồng P.103/P.202
 * đã tham chiếu mã hồ sơ người ở P.303/P.201. Hợp đồng đã ký chỉ sửa mã liên kết
 * khi đã có chứng cứ CCCD đúng. Không đổi nội dung giấy, không suy diễn danh tính.
 * Phần mềm chống trùng cho dữ liệu mới bằng findRepresentativeRoomConflict.
 */
const CORRECTIONS = [
  { roomCode: 'P.103', contractId: 'HD-103-KY', requestCode: 'YCTN-2026-002',
    oldTenantId: 'ten_10', newTenantId: 'ten_seed_103_vdt', name: 'Vũ Đình Toàn',
    idNumber: '030095001234', phone: '0915667788', status: 'Chờ khách ký',
    conditionId: 'COND-2026-002', createdAt: '2026-10-15T16:30:00Z' },
  { roomCode: 'P.202', contractId: 'HD-202-NHAP', requestCode: 'YCTN-2026-003',
    oldTenantId: 'ten_03', newTenantId: 'ten_seed_202_dmn', name: 'Đoàn Minh Nhật',
    idNumber: '025098007766', phone: '0944556677', status: 'Nháp',
    conditionId: 'COND-2026-003', createdAt: '2026-10-16T10:00:00Z' }
] as const;

type State = { tenants: Tenant[]; contracts: Contract[]; leaseConditions: LeaseConditionDraft[] };

export function repairSeedRepresentatives(state: State): State & {
  correctedContracts: number; addedProfiles: number; conflicts: string[];
} {
  let tenants = state.tenants;
  let contracts = state.contracts;
  let leaseConditions = state.leaseConditions;
  let correctedContracts = 0;
  let addedProfiles = 0;
  const conflicts: string[] = [];

  for (const fix of CORRECTIONS) {
    const contract = contracts.find(c => c.id === fix.contractId && c.roomCode === fix.roomCode);
    if (!contract || contract.contractType !== 'Hợp đồng lần đầu' ||
        contract.requestCode !== fix.requestCode ||
        contract.tenantName !== fix.name || contract.tenantPhone !== fix.phone ||
        (contract.tenantId !== fix.oldTenantId && contract.tenantId !== fix.newTenantId)) continue;

    // Only repair a proven wrong foreign-key for the two known seed contracts.
    // A signed contract MUST already contain the correct ID in its recorded
    // identity evidence. We never invent or overwrite a signed name or ID.
    if (contract.isSignedPaper) {
      if (!['Đã ký', 'Chờ hiệu lực', 'Hiệu lực'].includes(contract.status)) continue;
      const signedIdentity = contract.tenantIdNumber?.trim();
      const verifiedIdentity = contract.verifiedTenantIdNumber?.trim();
      if ((signedIdentity && signedIdentity !== fix.idNumber) ||
          (verifiedIdentity && verifiedIdentity !== fix.idNumber) ||
          (!signedIdentity && !verifiedIdentity)) {
        if (contract.tenantId === fix.oldTenantId) {
          conflicts.push(`Phòng ${fix.roomCode}: hợp đồng ${fix.contractId} đã ký nhưng chưa có chứng cứ CCCD khớp người trong yêu cầu thuê; cần đối chiếu hồ sơ thực tế.`);
        }
        continue;
      }
    } else if (contract.status !== fix.status) continue;

    // CCCD là định danh, không tạo hồ sơ trùng số; nếu số đã thuộc người khác thì
    // chặn tự sửa và yêu cầu người quản lý kiểm tra hồ sơ gốc.
    const byNumber = tenants.find(t => t.idNumber?.trim() === fix.idNumber);
    if (byNumber && (byNumber.fullName.trim() !== fix.name || byNumber.phoneNumber !== fix.phone)) {
      conflicts.push(`Phòng ${fix.roomCode}: số định danh đã thuộc hồ sơ ${byNumber.id}; cần đối chiếu thủ công.`);
      continue;
    }
    const byStableId = tenants.find(t => t.id === fix.newTenantId);
    if (byStableId && (byStableId.fullName !== fix.name || byStableId.idNumber !== fix.idNumber)) {
      conflicts.push(`Phòng ${fix.roomCode}: mã hồ sơ dự kiến đã được sử dụng; cần đối chiếu thủ công.`);
      continue;
    }
    const profile = byNumber || byStableId || {
      id: fix.newTenantId,
      fullName: fix.name,
      phoneNumber: fix.phone,
      idNumber: fix.idNumber,
      address: '',
      paperStatus: 'Chưa cung cấp' as const,
      verificationStatus: 'Chưa xác minh' as const,
      requestAdmissionCode: fix.requestCode,
      createdAt: fix.createdAt,
      createdBy: 'Hệ thống'
    };
    if (!byNumber && !byStableId) {
      tenants = [...tenants, profile];
      addedProfiles++;
    }

    if (contract.tenantId !== profile.id || contract.tenantIdNumber !== fix.idNumber) {
      contracts = contracts.map(c => c === contract ? {
        ...c, tenantId: profile.id, tenantIdNumber: fix.idNumber
      } : c);
      correctedContracts++;
    }

    // Giữ mã yêu cầu gốc và trạng thái tiếp nhận, không đánh dấu đã xác minh giấy tờ.
    if (leaseConditions.some(c => c.id === fix.conditionId && c.requestCode === fix.requestCode &&
      c.roomCode === fix.roomCode && c.prospectiveTenantName === fix.name &&
      (!c.tenantId || c.tenantId === fix.oldTenantId))) {
      leaseConditions = leaseConditions.map(c => c.id === fix.conditionId &&
        c.requestCode === fix.requestCode && c.roomCode === fix.roomCode &&
        c.prospectiveTenantName === fix.name && (!c.tenantId || c.tenantId === fix.oldTenantId)
        ? { ...c, tenantId: profile.id } : c);
    }
  }
  return { tenants, contracts, leaseConditions, correctedContracts, addedProfiles, conflicts };
}
