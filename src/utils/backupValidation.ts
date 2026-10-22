/** Validate ccmn-business-backup-v1 before touching current browser records. */
export type BusinessBackup = {schema:string; exportedAt:string; records:Record<string,unknown>};
const isObject = (v:unknown):v is Record<string,unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const nonEmpty = (v:unknown):v is string => typeof v==='string' && !!v.trim();
const core = ['rooms','tenants','contracts'];
const allowed = new Set([
  'services','priceHistory','bankAccounts','batchSchedules','rooms','roomHistory','returnPlans','contactLogs',
  'initialPaymentRecords','missingConditionLogs','unfinishedHandoverLogs','leaseStartEvents','inventoryRecords',
  'handoverConditions','handoverReports','incidents','returnInspections','assetComparisonResults',
  'handoverReturnReports','tenants','coTenants','tenantProposals','tenantHistory','pendingDocs',
  'receptionRequests','preSignVerifications','leaseConditions','contracts','settlementSlips','meterReadings',
  'periodBills','reconciliations','paymentNotices','paymentReceipts','debtReminders','debtPromises','reportSnapshots'
]);
export function validateBusinessBackup(backup:unknown): string[] {
  const errors:string[]=[];
  const fail=(text:string)=>{ if(errors.length<30) errors.push(text); };
  if(!isObject(backup) || backup.schema!=='ccmn-business-backup-v1' || !isObject(backup.records) ||
    !nonEmpty(backup.exportedAt) || Number.isNaN(Date.parse(backup.exportedAt)))
    return ['Sai định dạng sao lưu, phiên bản hoặc thời gian xuất dữ liệu.'];
  const records=backup.records;
  for(const k of Object.keys(records)) {
    if(!k.startsWith('mini_apt_') || !allowed.has(k.slice(9))) fail(`Nhóm dữ liệu không được hỗ trợ: ${k}`);
    else if(!Array.isArray(records[k])) fail(`Nhóm ${k} phải là danh sách.`);
  }
  for(const key of core) if(!Array.isArray(records['mini_apt_'+key])) fail(`Thiếu danh sách bắt buộc: ${key}.`);
  if(errors.length) return errors;
  type Rec=Record<string,unknown>;
  const list=(name:string):Rec[]=> (records['mini_apt_'+name] as unknown[] || []).filter(isObject);
  for(const [key,value] of Object.entries(records)) {
    if((value as unknown[]).some(v=>!isObject(v))) fail(`${key}: có bản ghi không phải đối tượng.`);
  }
  const unique=(name:string,fields:string[])=> {
    const arr=list(name);const seen=new Set<string>();
    for(const [i,r] of arr.entries()) {
      if(fields.some(f=>!nonEmpty(r[f]))) {fail(`${name}[${i}]: thiếu ${fields.join(', ')}.`);continue;}
      const id=fields.map(f=>String(r[f]).trim()).join('::');
      if(seen.has(id)) fail(`${name}: trùng ${fields.join('+')} (${id}).`);
      seen.add(id);
    }
  };
  unique('rooms',['roomCode']);unique('rooms',['id']);unique('tenants',['id']);unique('contracts',['id']);
  const identityNumbers = new Map<string,string>();
  for(const t of list('tenants')) {
    if (!nonEmpty(t.idNumber)) continue;
    const number=t.idNumber.replace(/\s/g,'');
    const old=identityNumbers.get(number);
    if(old && old!==t.id) fail(`Trùng CCCD/số định danh ở hai hồ sơ khách (${old}, ${t.id}).`);
    identityNumbers.set(number,String(t.id));
  }
  const assigned = new Map<string,string>();
  for(const room of list('rooms').filter(r=>r.status!=='Trống')) {
    if(!nonEmpty(room.currentTenantId)) continue;
    const last=assigned.get(room.currentTenantId);
    if(last && last!==room.roomCode) fail(`Một người đại diện ${room.currentTenantId} đang ở cả ${last} và ${room.roomCode}.`);
    assigned.set(room.currentTenantId,String(room.roomCode));
  }

  const roomIds=new Set(list('rooms').map(r=>r.roomCode));
  const tenantById=new Map(list('tenants').map(r=>[r.id,r]));
  const contractById=new Map(list('contracts').map(r=>[r.id,r]));
  const contracts=list('contracts');
  for(const [i,c] of contracts.entries()){
    if(!nonEmpty(c.leaseId) || !nonEmpty(c.tenantId) || !nonEmpty(c.tenantName)) fail(`contracts[${i}]: thiếu lần thuê hoặc người đại diện.`);
    if(!roomIds.has(c.roomCode)) fail(`contracts[${i}]: phòng không tồn tại.`);
    const t=tenantById.get(c.tenantId);
    if(!t) fail(`contracts[${i}]: không tìm thấy hồ sơ khách ${c.tenantId}.`);
    else if(c.isSignedPaper===true && (t.fullName!==c.tenantName ||
      (nonEmpty(c.tenantIdNumber) && nonEmpty(t.idNumber) && c.tenantIdNumber!==t.idNumber)))
      fail(`contracts[${i}]: người ký không khớp hồ sơ khách.`);
  }
  for(const [i,r] of list('rooms').entries()){
    if(!nonEmpty(r.id) || !['Trống','Đang thuê','Sắp trả'].includes(String(r.status))) fail(`rooms[${i}]: mã hoặc trạng thái phòng sai.`);
    if(r.status !== 'Trống'){
      if(!nonEmpty(r.currentLeaseId) || !nonEmpty(r.currentContractId) || !nonEmpty(r.currentTenantId))
        fail(`rooms[${i}]: thiếu liên kết lần thuê/hợp đồng/người ở.`);
      const c=contractById.get(r.currentContractId);
      if(!c || c.roomCode!==r.roomCode || c.leaseId!==r.currentLeaseId || c.tenantId!==r.currentTenantId)
        fail(`rooms[${i}]: liên kết lần thuê hiện tại không khớp hợp đồng.`);
    }
  }
  for(const name of ['initialPaymentRecords','handoverReports','returnInspections','handoverReturnReports']){
    for(const [i,r] of list(name).entries()){
      if(!nonEmpty(r.roomCode) || !nonEmpty(r.leaseId) || !nonEmpty(r.contractId)) fail(`${name}[${i}]: thiếu phòng, hợp đồng hoặc lần thuê.`);
      const c=contractById.get(r.contractId);
      if(!c || c.roomCode!==r.roomCode || c.leaseId!==r.leaseId) fail(`${name}[${i}]: liên kết hợp đồng/lần thuê không đúng.`);
    }
  }
  for(const [i,r] of list('settlementSlips').entries()) {
    if(!roomIds.has(r.roomCode) || !nonEmpty(r.leaseId) || !contracts.some(c=>c.roomCode===r.roomCode && c.leaseId===r.leaseId))
      fail(`settlementSlips[${i}]: không tìm thấy phòng/lần thuê của quyết toán.`);
  }
  return errors;
}
