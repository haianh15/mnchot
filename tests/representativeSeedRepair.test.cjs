const assert = require('node:assert/strict');
const {loadTs} = require('./loadTs.cjs');
const seed = loadTs('src/data/seedData.ts');
const {repairSeedRepresentatives} = loadTs('src/utils/repairSeedRepresentatives.ts');

const tenantFor = new Map(seed.INITIAL_TENANTS.map(t => [t.id, t]));
const contractFor = id => seed.INITIAL_CONTRACTS.find(c => c.id === id);
assert.equal(contractFor('HD-103-KY').tenantId, 'ten_seed_103_vdt');
assert.equal(contractFor('HD-202-NHAP').tenantId, 'ten_seed_202_dmn');
assert.equal(contractFor('HD-303-2026').tenantId, 'ten_10');
assert.equal(contractFor('HD-201-2026').tenantId, 'ten_03');
for (const c of seed.INITIAL_CONTRACTS) {
  const p = tenantFor.get(c.tenantId);
  assert.ok(p, `Contract ${c.id}: missing tenant ${c.tenantId}`);
  assert.equal(p.fullName, c.tenantName, `Contract ${c.id}: profile/name mismatched`);
  if (c.tenantPhone) assert.equal(p.phoneNumber, c.tenantPhone, `Contract ${c.id}: phone mismatched`);
  if (c.tenantIdNumber) assert.equal(p.idNumber, c.tenantIdNumber, `Contract ${c.id}: ID mismatched`);
}
// A person may renew same room, but must not represent two unfinished rooms.
const used = new Map();
for (const c of seed.INITIAL_CONTRACTS.filter(c => !['Đã hủy','Kết thúc'].includes(c.status))) {
  const p = tenantFor.get(c.tenantId);
  if (!used.has(p.idNumber)) used.set(p.idNumber, new Set());
  used.get(p.idNumber).add(c.roomCode);
}
for (const [id, rooms] of used) assert.equal(rooms.size,1,`Representative ${id} appears in ${[...rooms]}`);

// Legacy storage: repair two bad REFERENCES without touching unrelated people.
const legacy = {
  tenants: seed.INITIAL_TENANTS.filter(t => !['ten_seed_103_vdt','ten_seed_202_dmn'].includes(t.id)),
  contracts: seed.INITIAL_CONTRACTS.map(c =>
    c.id === 'HD-103-KY' ? {...c, tenantId:'ten_10',tenantIdNumber:undefined} :
    c.id === 'HD-202-NHAP' ? {...c,tenantId:'ten_03',tenantIdNumber:undefined} : c),
  leaseConditions: seed.INITIAL_LEASE_CONDITIONS.map(c =>
    ['COND-2026-002','COND-2026-003'].includes(c.id) ? {...c,tenantId:undefined} : c)
};
const fixed = repairSeedRepresentatives(legacy);
assert.equal(fixed.correctedContracts, 2);
assert.equal(fixed.addedProfiles, 2);
assert.equal(fixed.conflicts.length, 0);
assert.equal(fixed.tenants.length, legacy.tenants.length + 2);
assert.equal(fixed.contracts.find(c=>c.id==='HD-103-KY').tenantId,'ten_seed_103_vdt');
assert.equal(fixed.contracts.find(c=>c.id==='HD-202-NHAP').tenantId,'ten_seed_202_dmn');
assert.equal(fixed.leaseConditions.find(c=>c.id==='COND-2026-002').tenantId,'ten_seed_103_vdt');
assert.equal(fixed.leaseConditions.find(c=>c.id==='COND-2026-003').tenantId,'ten_seed_202_dmn');
assert.equal(repairSeedRepresentatives(fixed).addedProfiles,0,'Idempotent: never create duplicate profile');
assert.equal(repairSeedRepresentatives(fixed).correctedContracts,0,'Idempotent: never rewire again');

// A previously signed *legacy* contract may have the wrong foreign-key while
// already containing correct independently verified identity evidence.
const signedProven = {...legacy, contracts:legacy.contracts.map(c => c.id==='HD-103-KY'
  ? {...c, isSignedPaper:true, status:'Hiệu lực', verifiedTenantIdNumber:'030095001234'} : c)};
const signedRepaired = repairSeedRepresentatives(signedProven);
assert.equal(signedRepaired.contracts.find(c=>c.id==='HD-103-KY').tenantId, 'ten_seed_103_vdt');
assert.equal(signedRepaired.contracts.find(c=>c.id==='HD-103-KY').tenantName, 'Vũ Đình Toàn');
const signedWrongProof = {...legacy, contracts:legacy.contracts.map(c => c.id==='HD-103-KY'
  ? {...c, isSignedPaper:true, status:'Hiệu lực', verifiedTenantIdNumber:'001099014562'} : c)};
assert.equal(repairSeedRepresentatives(signedWrongProof).contracts.find(c=>c.id==='HD-103-KY').tenantId, 'ten_10');

// Signed original without matching paper identity or custom contract must NEVER be silently relinked.
const signed = {...legacy,contracts:legacy.contracts.map(c=>c.id==='HD-103-KY'?{...c,isSignedPaper:true,status:'Đã ký'}:c)};
const signedResult = repairSeedRepresentatives(signed);
assert.equal(signedResult.contracts.find(c=>c.id==='HD-103-KY').tenantId,'ten_10');
assert.equal(signedResult.correctedContracts,1);
const customized = {...legacy,contracts:legacy.contracts.map(c=>c.id==='HD-202-NHAP'?{...c,tenantName:'Người khác'}:c)};
assert.equal(repairSeedRepresentatives(customized).contracts.find(c=>c.id==='HD-202-NHAP').tenantId,'ten_03');

const identityConflict = {...legacy,tenants:[...legacy.tenants,{...seed.INITIAL_TENANTS.find(t=>t.id==='ten_seed_103_vdt'),fullName:'Tên không khớp'}]};
const identityResult = repairSeedRepresentatives(identityConflict);
assert.ok(identityResult.conflicts.length);
assert.equal(identityResult.contracts.find(c=>c.id==='HD-103-KY').tenantId,'ten_10');
console.log('PASS: 2 demo representative links fixed, 1 person/room, 10 profile integrity checks, migration safe, no signed/custom overwrites.');
