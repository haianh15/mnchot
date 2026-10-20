const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
let ts; try { ts = require('typescript'); } catch { ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript'); }
const read = f => fs.readFileSync(f, 'utf8');
const contextSource = read('src/context/AppContext.tsx');
const contextAst = ts.createSourceFile('AppContext.tsx', contextSource, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TSX);
function getFunction(name) {
  let target;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(contextAst) === name) target = node.initializer.getText(contextAst);
    ts.forEachChild(node, visit);
  }
  visit(contextAst);
  assert.ok(target, `Source business function not found: ${name}`);
  return ts.transpileModule(`const testFunction = ${target};`, {compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText + '\ntestFunction;';
}
const sourceGuardText = read('src/utils/handoverValidation.ts');
const sourceGuardJs = ts.transpileModule(sourceGuardText,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const sourceCtx = {module: {exports:{}}, exports:{}};
vm.runInNewContext(sourceGuardJs, sourceCtx);
const validSource = sourceCtx.module.exports.hasValidHandoverSource || sourceCtx.exports.hasValidHandoverSource;
assert.equal(typeof validSource, 'function');
const original = {id:'HD-1',roomCode:'P.101',leaseId:'L1',isSignedPaper:true,contractType:'Hợp đồng lần đầu',status:'Đã ký',depositAmount:4000000,firstMonthRentAmount:4000000};
const room={roomCode:'P.101',currentLeaseId:'L1',currentContractId:'HD-1',status:'Đang thuê'};
const payment={roomCode:'P.101',leaseId:'L1',contractId:'HD-1',depositAmount:4000000,firstMonthRentAmount:4000000};
const inventory={id:'inv1',roomCode:'P.101',linkedLeaseId:'L1',linkedContractId:'HD-1',inventoryStatus:'Đã hoàn tất'};
const condition={id:'cond1',roomCode:'P.101',linkedLeaseId:'L1',linkedContractId:'HD-1',status:'Đã hoàn tất',meterPhotos:['actual.jpg'],initialElectricityKwh:0,initialWaterM3:0};
const report={id:'report1',reportNumber:'BB-P101-L1',roomCode:'P.101',leaseId:'L1',contractId:'HD-1',date:'2026-10-20',giverName:'Chủ nhà',receiverName:'Khách',status:'Đã lập',tenantSignedPaper:'Chưa ký',ownerSignedPaper:'Chưa ký',version:1,createdAt:'2026-10-20',initialElectricityKwh:0,initialWaterM3:0};
let passed=0;
function check(label, fn) { fn(); passed++; console.log('PASS',label); }
function scope(overrides={}) {
  const base={rooms:[room],contracts:[original],initialPaymentRecords:[payment],inventoryRecords:[inventory],handoverConditions:[condition],handoverReports:[],assetComparisonResults:[],incidents:[], currentUser:{fullName:'Chủ nhà'},logSecurity:()=>{}};
  const ctx={...base,...overrides};
  ctx.verifyHandoverSource=(roomCode,leaseId,contractId)=>validSource(ctx.rooms,ctx.contracts,roomCode,leaseId,contractId);
  ctx.setHandoverReports=updater=>{ctx.handoverReports=updater(ctx.handoverReports)};
  ctx.setIncidents=updater=>{ctx.incidents=updater(ctx.incidents)};
  ctx.setAssetComparisonResults=updater=>{ctx.assetComparisonResults=updater(ctx.assetComparisonResults)};
  return ctx;
}
function invoke(fn,ctx,...args){return vm.runInNewContext(getFunction(fn),ctx)(...args)}
check('Từ phòng Trống chưa ký không có nguồn bàn giao',()=>assert.equal(validSource([{roomCode:'P.101',pendingLeaseId:'L1'}],[{...original,isSignedPaper:false}],'P.101','L1','HD-1'),false));
check('Sai mã phòng phải từ chối lưu biên bản',()=>assert.equal(invoke('saveHandoverReportBG03',scope(),{...report,roomCode:'P.202'}).success,false));
check('Sai lần thuê phải từ chối lưu biên bản',()=>assert.equal(invoke('saveHandoverReportBG03',scope(),{...report,leaseId:'L2'}).success,false));
check('Không ghi đè ID biên bản của khách khác',()=>assert.equal(invoke('saveHandoverReportBG03',scope({handoverReports:[{...report,contractId:'HD-X',roomCode:'P.202',leaseId:'LX'}]}),report).success,false));
check('Không thể sửa biên bản nhận phòng đã xác nhận',()=>assert.equal(invoke('saveHandoverReportBG03',scope({handoverReports:[{...report,status:'Đã xác nhận'}]}),report).success,false));
check('Chỉ biên bản Đã lập mới có thể xác nhận ký',()=>assert.equal(invoke('confirmHandoverSignaturesBG03',scope({handoverReports:[{...report,status:'Nháp'}]}),'report1',true,true,'Tủ giấy').success,false));
check('Không tạo biên bản Đã lập khi chưa có thanh toán nguồn',()=>assert.equal(invoke('saveHandoverReportBG03',scope({initialPaymentRecords:[]}),report).success,false));
check('Không tạo biên bản Đã lập khi thiếu kiểm kê',()=>assert.equal(invoke('saveHandoverReportBG03',scope({inventoryRecords:[]}),report).success,false));
check('Không tạo biên bản Đã lập khi thiếu hiện trạng công tơ',()=>assert.equal(invoke('saveHandoverReportBG03',scope({handoverConditions:[]}),report).success,false));
check('Chỉ số trên biên bản phải khớp nguồn đã lưu',()=>assert.equal(invoke('saveHandoverReportBG03',scope(),{...report,initialElectricityKwh:35}).success,false));
check('Chỉ số thực tế 0 vẫn được lập biên bản hợp lệ',()=>{let c=scope();assert.equal(invoke('saveHandoverReportBG03',c,report).success,true);assert.equal(c.handoverReports.length,1)});
check('Không thể xác nhận ký giấy nếu thiếu vị trí lưu bản thật',()=>assert.equal(invoke('confirmHandoverSignaturesBG03',scope({handoverReports:[report]}),'report1',true,true,'').success,false));
check('Xác nhận đủ hai chữ ký cập nhật đúng biên bản',()=>{let c=scope({handoverReports:[report]});assert.equal(invoke('confirmHandoverSignaturesBG03',c,'report1',true,true,'Tủ hồ sơ').success,true);assert.equal(c.handoverReports[0].status,'Đã xác nhận')});
check('Hồ sơ đã xác nhận không thể bấm ghi ký lại',()=>assert.equal(invoke('confirmHandoverSignaturesBG03',scope({handoverReports:[{...report,status:'Đã xác nhận'}]}),'report1',true,true,'Tủ giấy').success,false));
check('Hợp đồng nối tiếp không tạo thêm biên bản gốc',()=>{let c=scope({contracts:[{...original,contractType:'Hợp đồng nối tiếp'}]});assert.equal(invoke('saveHandoverReportBG03',c,report).success,false)});
check('Ghi sự cố cho sai lần thuê bị chặn',()=>{let c=scope();assert.equal(invoke('recordIncidentBG04',c,{id:'i1',roomCode:'P.101',leaseId:'L2',description:'Bóng đèn hỏng'}).success,false)});
check('Ghi sự cố cho đúng phòng và lần thuê',()=>{let c=scope();assert.equal(invoke('recordIncidentBG04',c,{id:'i1',roomCode:'P.101',leaseId:'L1',description:'Bóng đèn hỏng'}).success,true);assert.equal(c.incidents.length,1)});
check('Kết quả đối chiếu của hợp đồng khác bị từ chối',()=>assert.equal(invoke('saveAssetComparisonResultBG07',scope(),{id:'c1',roomCode:'P.101',leaseId:'L1',contractId:'HD-X'}).success,false));
check('Kết quả đối chiếu đúng lần thuê được ghi nhận',()=>{let c=scope();assert.equal(invoke('saveAssetComparisonResultBG07',c,{id:'c1',roomCode:'P.101',leaseId:'L1',contractId:'HD-1'}).success,true);assert.equal(c.assetComparisonResults.length,1)});
check('Phòng không có biên bản ký thật không được hoàn tất trả',()=>{
  const c=scope({handoverReports:[], returnInspections:[{id:'r1',roomCode:'P.101',contractId:'HD-1',leaseId:'L1',step304Status:'Đã nhận lại',step305Confirmed:true}]});
  c.getConfirmedRoomHandover=()=>undefined;
  assert.equal(invoke('confirmReturnStep305AndVacantPH08',c,'P.101','L1','2026-10-20').success,false);
});
check('Trả phòng được ghi Trống đúng lần thuê sau khi có biên bản thật',()=>{
  const c=scope({handoverReports:[{...report,status:'Đã xác nhận',tenantSignedPaper:'Đã ký giấy',ownerSignedPaper:'Đã ký giấy'}],
    returnInspections:[{id:'r1',roomCode:'P.101',contractId:'HD-1',leaseId:'L1',step304Status:'Đã nhận lại',step305Confirmed:true,inspectionDate:'2026-10-20'}],
    returnPlans:[],roomHistory:[]});
  c.getConfirmedRoomHandover=(contract,arr,reports)=> reports.find(r=>r.contractId===contract?.id && r.status==='Đã xác nhận');
  c.setRooms=updater=>{c.rooms=updater(c.rooms)};c.setReturnPlans=updater=>{c.returnPlans=updater(c.returnPlans)};
  c.setRoomHistory=updater=>{c.roomHistory=updater(c.roomHistory)};
  assert.equal(invoke('confirmReturnStep305AndVacantPH08',c,'P.101','L1','2026-10-20').success,true);
  assert.equal(c.rooms[0].status,'Trống');assert.equal(c.rooms[0].currentLeaseId,undefined);
});
check('Không nhận trả phòng theo lần thuê không khớp',()=>{
  const c=scope({returnInspections:[]});assert.equal(invoke('confirmReturnStep305AndVacantPH08',c,'P.101','L2','2026-10-20').success,false);
});
check('Không ghi kết quả cọc từ phiếu của phòng khác',()=>{
  const c=scope({handoverReturnReports:[{id:'ret1',roomCode:'P.101',leaseId:'L1',contractId:'HD-1'}],
    settlementSlips:[{id:'q1',roomCode:'P.202',leaseId:'L1',version:1,reviewRequired:false}]});
  c.setHandoverReturnReports=updater=>{c.handoverReturnReports=updater(c.handoverReturnReports)};
  assert.equal(invoke('syncDepositSettlementBG10',c,'ret1',{depositSettlementId:'q1',depositSettlementVersion:1,depositSettlementAmount:0,depositRefundAmount:0,depositDeductionAmount:0,depositTrackingStatus:'5.8 hợp lệ – Đã thống nhất'}).success,false);
});
check('Cọc đúng hồ sơ và phiên bản mới được ghi vào biên bản trả',()=>{
  const c=scope({handoverReturnReports:[{id:'ret1',roomCode:'P.101',leaseId:'L1',contractId:'HD-1'}],
    settlementSlips:[{id:'q1',roomCode:'P.101',leaseId:'L1',version:2,reviewRequired:false}]});
  c.setHandoverReturnReports=updater=>{c.handoverReturnReports=updater(c.handoverReturnReports)};
  assert.equal(invoke('syncDepositSettlementBG10',c,'ret1',{depositSettlementId:'q1',depositSettlementVersion:2,depositSettlementAmount:4000000,depositRefundAmount:4000000,depositDeductionAmount:0,depositTrackingStatus:'5.8 hợp lệ – Đã thống nhất'}).success,true);
  assert.equal(c.handoverReturnReports[0].depositSettlementVersion,2);
});
const ui=read('src/components/views/HandoverAssetsView.tsx'),rooms=read('src/components/views/RoomsView.tsx'),app=read('src/App.tsx');
check('Từ Trả phòng truyền đúng mã hợp đồng và mở nghiệp vụ trả',()=>assert(rooms.includes("handoverMode:'return'")));
check('App chuyển chế độ nghiệp vụ sang Bàn giao',()=>assert(app.includes('initialMode={target.handoverMode}')));
check('Bàn giao hỗ trợ chế độ trả phòng',()=>assert(ui.includes("if (initialMode === 'return')")));
check('Không còn danh tính CCCD/điện thoại giả trong biên bản nhận',()=>{assert(!ui.includes('001095012345'));assert(!ui.includes('0912 345 678'))});
check('Lưu và ký giấy phải đọc phản hồi thực của hàm',()=>{assert(ui.includes('const res = saveHandoverReportBG03('));assert(ui.includes('const res = confirmHandoverSignaturesBG03('))});
console.log(`TOTAL ${passed} linkage checks`);
