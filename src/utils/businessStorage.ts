/** Explicit, checked browser writes for business-critical operations.
 * A best-effort rollback covers synchronous failures. This is NOT a server database
 * transaction and must not be advertised as durable multi-device storage.
 */
export function commitBusinessStorage(updates: Record<string, unknown>, store: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>):
  {success: true} | {success: false; message: string} {
  const original: Array<[string, string | null]> = [];
  try {
    for (const [key, value] of Object.entries(updates)) {
      if (!/^mini_apt_[A-Za-z0-9_]+$/.test(key)) throw new Error('Tên nhóm dữ liệu không hợp lệ.');
      original.push([key, store.getItem(key)]);
      const encoded = JSON.stringify(value);
      if (encoded === undefined) throw new Error('Dữ liệu không thể chuyển thành JSON.');
      store.setItem(key, encoded);
      if (store.getItem(key) !== encoded) throw new Error('Đọc xác nhận dữ liệu vừa lưu thất bại.');
    }
    return { success: true };
  } catch {
    let rollbackFailed = false;
    for (const [key, before] of original.reverse()) {
      try {
        if (before === null) store.removeItem(key); else store.setItem(key, before);
        if (store.getItem(key) !== before) rollbackFailed = true;
      } catch { rollbackFailed = true; }
    }
    return {success:false, message: rollbackFailed
      ? 'Không thể lưu dữ liệu và khôi phục tự động chưa đầy đủ. KHÔNG nhập tiếp; hãy kiểm tra bản sao lưu.'
      : 'Không thể lưu dữ liệu. Đã hoàn nguyên các thay đổi cục bộ; hãy kiểm tra dung lượng lưu trữ và thử lại.'};
  }
}
