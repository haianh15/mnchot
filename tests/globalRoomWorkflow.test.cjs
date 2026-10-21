/** Mọi phòng dùng cùng một quy tắc, không có xử lý cứng cho P101/P909. */
const assert = require('node:assert/strict');
const {loadTs} = require('./loadTs.cjs');
const {getPendingSignedRoomContract, getRoomWorkflowPhase, reconcileRoomWorkflowLinks, pendingSignedContractsForRoom} = loadTs('src/utils/roomLifecycle.ts');
const {resolveRoomContract,getVacantRoomNextStep,getConfirmedRoomHandover} = loadTs('src/utils/roomLinks.ts');
const {blocksNewLeaseOnVacantRoom,canCreateRenewalContract} = loadTs('src/utils/contractEligibility.ts');
const {hasValidHandoverSource} = loadTs('src/utils/handoverValidation.ts');
let tests=0; const test=(name,fn)=>{fn();tests++;console.log('PASS',name)};
const asRoom = code => ({id:'R'+code,roomCode:code,status:'Trống',totalOccupants:0,hasDeposit:false,firstMonthRentPaid:false});
const asContract = (code, lease='L-1') => ({id:`HD-${code}-${lease}`,roomCode:code,leaseId:lease,contractType:'Hợp đồng lần đầu',isSignedPaper:true,status:'Đã ký',tenantId:'TEN-'+code,tenantName:'Khách thuê',endDate:'2027-04-01'});
const checkedReport = c => ({roomCode:c.roomCode,contractId:c.id,leaseId:c.leaseId,status:'Đã xác nhận',tenantSignedPaper:'Đã ký giấy',ownerSignedPaper:'Đã ký giấy'});
for (const code of ['P.101','P.909','P.999','P.102','P.301','P.505','A-12','ROOM_NEW_10']) {
  test(`${code}: chưa có hợp đồng giấy → Lập hợp đồng`,()=>{
    const room=asRoom(code); const draft={...asContract(code),status:'Nháp',isSignedPaper:false};
    assert.equal(resolveRoomContract(room,[draft],[]),undefined);
    assert.equal(getVacantRoomNextStep(room,[draft],[],[]).label,'Lập hợp đồng');
    assert.equal(getRoomWorkflowPhase(room,[draft],[],false),'vacant');
  });
  test(`${code}: ký xong → nhận đúng hợp đồng, chưa có người ở`,()=>{
    const room={...asRoom(code),pendingContractId:'OLD_WRONG',pendingLeaseId:'OLD_WRONG'};
    const signed=asContract(code);
    assert.equal(reconcileRoomWorkflowLinks(room,[signed],[]).pendingContractId,signed.id);
    assert.equal(getPendingSignedRoomContract(room,[signed],[])?.id,signed.id);
    assert.equal(getVacantRoomNextStep(room,[signed],[],[]).label,'Lập biên bản nhận phòng');
    assert.equal(hasValidHandoverSource([room],[signed],code,signed.leaseId,signed.id),true);
    assert.equal(room.status,'Trống');
  });
  test(`${code}: xác nhận biên bản giấy → xác nhận nhận phòng`,()=>{
    const room=asRoom(code),signed=asContract(code),report=checkedReport(signed);
    assert.equal(getVacantRoomNextStep(room,[signed],[],[report]).label,'Xác nhận nhận phòng');
    assert.equal(Boolean(getConfirmedRoomHandover(signed,[signed],[report])),true);
  });
  test(`${code}: trả phòng đã xác nhận → lịch sử không khóa hợp đồng mới`,()=>{
    const room=asRoom(code), past={...asContract(code),status:'Hiệu lực'}, inspection={roomCode:code,leaseId:past.leaseId,step305Confirmed:true,step304Status:'Đã nhận lại'};
    assert.equal(getPendingSignedRoomContract(room,[past],[inspection]),undefined);
    assert.equal(blocksNewLeaseOnVacantRoom(past,[inspection]),false);
    assert.equal(hasValidHandoverSource([room],[past],code,past.leaseId,past.id,[inspection]),false);
    assert.equal(getVacantRoomNextStep(room,[past],[inspection],[]).label,'Lập hợp đồng');
  });
  test(`${code}: đủ điều kiện nối tiếp mới được gia hạn`,()=>{
    const old={...asContract(code),status:'Hiệu lực',actualCheckInDate:'2026-01-10'};
    const room={...asRoom(code),status:'Đang thuê',currentLeaseId:old.leaseId,currentContractId:old.id,currentTenantId:old.tenantId};
    assert.equal(canCreateRenewalContract(old,[room],[old],'2026-10-21'),false);
    assert.equal(canCreateRenewalContract(old,[{...room,status:'Sắp trả'}],[old],'2026-10-21'),true);
    assert.equal(canCreateRenewalContract(old,[room],[old],'2027-04-01'),true);
    assert.equal(canCreateRenewalContract(old,[{...room,status:'Trống'}],[old],'2027-04-01'),false);
  });
}
test('Lượt thuê đã ghi nhận bắt đầu không được nhận phòng lại khi hồ sơ cũ thiếu ngày nhận',()=>{
  const room=asRoom('P.800'), old=asContract('P.800','L-OLD');
  const starts=[{roomCode:room.roomCode,leaseId:old.leaseId}];
  assert.equal(getPendingSignedRoomContract(room,[old],[],starts),undefined);
  assert.equal(blocksNewLeaseOnVacantRoom(old,[],starts),false);
  assert.equal(getVacantRoomNextStep(room,[old],[],[],starts).label,'Lập hợp đồng');
  assert.equal(hasValidHandoverSource([room],[old],room.roomCode,old.leaseId,old.id,[],starts),false);
});
test('Hồ sơ trùng cùng chờ của một phòng không được tự chọn và không cho bàn giao',()=>{
  const room=asRoom('P.701'), a=asContract('P.701','L1'), b=asContract('P.701','L2');
  assert.equal(pendingSignedContractsForRoom(room.roomCode,[a,b],[]).length,2);
  assert.equal(resolveRoomContract(room,[a,b],[]),undefined);
  assert.equal(getVacantRoomNextStep(room,[a,b],[],[]).label,'Kiểm tra hợp đồng trùng');
  assert.equal(hasValidHandoverSource([room],[a,b],room.roomCode,a.leaseId,a.id),false);
});
test('Hợp đồng chờ của phòng này không nhận sang phòng khác',()=>{
  const a=asContract('P.701');
  assert.equal(hasValidHandoverSource([asRoom('P.702')],[a],'P.702',a.leaseId,a.id),false);
});
test('Đã có khách: chỉ sửa pointer sai khi đúng một hợp đồng giấy cùng lần thuê và khách',()=>{
  const a={...asContract('P.303'),status:'Hiệu lực',actualCheckInDate:'2026-01-10'};
  const room={...asRoom('P.303'),status:'Đang thuê',currentLeaseId:a.leaseId,currentContractId:'WRONG',currentTenantId:a.tenantId};
  assert.equal(reconcileRoomWorkflowLinks(room,[a],[]).currentContractId,a.id);
  assert.equal(reconcileRoomWorkflowLinks({...room,currentTenantId:'DIFFERENT'},[a],[]).currentContractId,'WRONG');
});
test('Hợp đồng nối tiếp đã kích hoạt là hiện hành, không kéo về hợp đồng cũ Kết thúc',()=>{
 const orig={...asContract('P.602'),id:'HD-A',status:'Kết thúc',actualCheckInDate:'2026-01-01'};
 const renewal={...asContract('P.602'),id:'HD-B',contractType:'Hợp đồng nối tiếp',status:'Hiệu lực',previousContractId:orig.id,actualCheckInDate:undefined};
 const r={...asRoom('P.602'),status:'Đang thuê',currentLeaseId:orig.leaseId,currentContractId:orig.id,currentTenantId:orig.tenantId};
 assert.equal(reconcileRoomWorkflowLinks(r,[orig,renewal],[]).currentContractId,renewal.id);
 assert.equal(resolveRoomContract(r,[orig,renewal],[])?.id,renewal.id);
});
test('Phòng đang thuê không được lấy hợp đồng nháp làm hợp đồng hiện hành',()=>{
 const good={...asContract('P.603'),id:'SIGNED',status:'Hiệu lực',actualCheckInDate:'2026-01-01'};
 const draft={...good,id:'DRAFT',status:'Nháp',isSignedPaper:false};
 const r={...asRoom('P.603'),status:'Đang thuê',currentLeaseId:good.leaseId,currentContractId:draft.id,currentTenantId:good.tenantId};
 assert.equal(resolveRoomContract(r,[draft,good],[])?.id,good.id);
});
console.log(`TOTAL ${tests} global cross-room scenarios`);
