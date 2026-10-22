import type { InventoryRecord, ReturnInspection } from '../types';

export type ComparedAssetDetail = {
  assetId: string;
  assetName: string;
  qtyReceive: number;
  qtyReturn: number;
  condReceive: string;
  condReturn: string;
};

const normalize = (name: string) => (name || '').trim().normalize('NFC').toLocaleLowerCase('vi');

export function hasDuplicateAssetNames(items: {name: string}[]): boolean {
  const keys = items.map(i => normalize(i.name));
  return keys.some(k => !k) || new Set(keys).size !== keys.length;
}

/** Lấy kết quả đối chiếu từ chứng từ gốc, tuyệt đối không suy diễn "không chênh lệch". */
export function buildVerifiedAssetComparison(
  inventory: InventoryRecord | undefined,
  inspection: ReturnInspection | undefined
): { valid: boolean; message: string; details: ComparedAssetDetail[]; hasDifference: boolean } {
  const fail = (message: string) => ({valid: false, message, details: [] as ComparedAssetDetail[], hasDifference: false});
  if (!inventory || inventory.inventoryStatus !== 'Đã hoàn tất' || !inventory.items.length)
    return fail('Chưa có kiểm kê khi nhận phòng đã hoàn tất cho đúng lần thuê.');
  if (!inspection || !inspection.step305Confirmed || inspection.step304Status !== 'Đã nhận lại' || !inspection.items.length)
    return fail('Chưa có kết quả nhận lại phòng đã xác nhận cho đúng lần thuê.');
  if (hasDuplicateAssetNames(inventory.items) || hasDuplicateAssetNames(inspection.items))
    return fail('Danh sách tài sản có tên trùng hoặc tên trống. Cần kiểm tra trước khi đối chiếu.');
  if (new Set(inventory.items.map(i => i.assetId)).size !== inventory.items.length)
    return fail('Mã tài sản khi nhận bị trùng; cần đối chiếu lại kiểm kê gốc.');
  const returned = new Map(inspection.items.map(i => [normalize(i.name), i]));
  const returnedWithId = inspection.items.filter(i => i.assetId);
  const byId = new Map(returnedWithId.map(i => [i.assetId, i]));
  if (returned.size !== inventory.items.length || byId.size !== returnedWithId.length)
    return fail('Danh sách tài sản trả phòng có dòng thừa/thiếu hoặc mã tài sản bị trùng.');
  const details: ComparedAssetDetail[] = [];
  const used = new Set<(typeof inspection.items)[number]>();
  for (const asset of inventory.items) {
    // New records use a stable assetId; older records may safely use a unique name.
    const byName = returned.get(normalize(asset.name));
    const returnedAsset = byId.get(asset.assetId) || (byName && !byName.assetId ? byName : undefined);
    if (returnedAsset && normalize(returnedAsset.name) !== normalize(asset.name))
      return fail(`Mã tài sản của "${asset.name}" không khớp tên tài sản tại biên bản trả.`);
    if (returnedAsset) used.add(returnedAsset);
    if (!returnedAsset || !returnedAsset.inspected || !Number.isInteger(returnedAsset.quantity) ||
        returnedAsset.quantity < 0 || !returnedAsset.condition?.trim() ||
        !Number.isInteger(asset.actualQuantity) || asset.actualQuantity < 0 || !asset.physicalCondition?.trim()) {
      return fail(`Chưa đối chiếu đầy đủ tài sản "${asset.name}" theo biên bản nhận và kết quả trả thực tế.`);
    }
    details.push({
      assetId: asset.assetId, assetName: asset.name,
      qtyReceive: asset.actualQuantity, qtyReturn: returnedAsset.quantity,
      condReceive: asset.physicalCondition, condReturn: returnedAsset.condition
    });
  }
  if (used.size !== inspection.items.length)
    return fail('Có tài sản trả phòng không thuộc kiểm kê gốc hoặc liên kết sai mã tài sản.');
  return {
    valid: true, message: 'Đã đối chiếu toàn bộ tài sản theo lần thuê.', details,
    hasDifference: details.some(d => d.qtyReceive !== d.qtyReturn || d.condReceive !== d.condReturn)
  };
}
