// Kiểm tra quy tắc mới: lập phiếu trả phòng NHÁP ngay khi bắt đầu bàn giao,
// chỉ ghi phòng Trống sau khi đã xác nhận nhận lại thực tế.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
let ts; try { ts = require('typescript'); } catch { ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript'); }
const read = file => fs.readFileSync(file, 'utf8');
const source = read('src/context/AppContext.tsx');
const ast = ts.createSourceFile('AppContext.tsx',source,ts.ScriptTarget.ES2022,true,ts.ScriptKind.TSX);
function business(name) {
  let expr;
  function visit(n){if(ts.isVariableDeclaration(n)&&n.name.getText(ast)===name) expr=n.initializer?.getText(ast);ts.forEachChild(n,visit);}
  visit(ast);assert.ok(expr,`Missing business handler: ${name}`);
  return ts.transpileModule(`(()=>{const fn=${expr};return fn;})();`,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
}
const room={roomCode:'P.101',status:'Đang thuê',currentLeaseId:'L1',currentContractId:'HD1'};
const contract={id:'HD1',roomCode:'P.101',leaseId:'L1',isSignedPaper:true,status:'Đã ký'};
const receive={roomCode:'P.101',leaseId:'L1',contractId:'HD1',status:'Đã xác nhận',tenantSignedPaper:'Đã ký giấy',ownerSignedPaper:'Đã ký giấy'};
const inspection={roomCode:'P.101',contractId:'HD1',leaseId:'L1',step304Status:'Đã nhận lại',step305Confirmed:true,assetsCheckedFully:true,isDraft:false,inspectionDate:'2026-10-20'};
const slip={id:'return1',roomCode:'P.101',contractId:'HD1',leaseId:'L1',status:'Nháp',date:'2026-10-20',giverName:'Khách thuê',receiverName:'Chủ nhà'};
function ctx(overrides={}) {
  const data={rooms:[room],contracts:[contract],handoverReports:[receive],handoverReturnReports:[],returnInspections:[],returnPlans:[],roomHistory:[],currentUser:{fullName:'Chủ nhà'},logSecurity:()=>{},...overrides};
  data.verifyHandoverSource=(code,lease,cid)=>data.rooms.some(r=>r.roomCode===code&&r.currentLeaseId===lease&&r.status!=='Trống')&&data.contracts.some(c=>c.id===cid&&c.leaseId===lease&&c.roomCode===code&&c.isSignedPaper);
  data.getConfirmedRoomHandover=(ct,all,reports)=>reports.find(r=>r.contractId===ct?.id&&r.leaseId===ct?.leaseId&&r.roomCode===ct?.roomCode&&r.status==='Đã xác nhận');
  data.persistCritical=()=>({success:true});
  data.setHandoverReturnReports=f=>{data.handoverReturnReports=typeof f==='function'?f(data.handoverReturnReports):f};
  data.setRooms=f=>{data.rooms=typeof f==='function'?f(data.rooms):f};
  data.setReturnPlans=f=>{data.returnPlans=typeof f==='function'?f(data.returnPlans):f};
  data.setRoomHistory=f=>{data.roomHistory=typeof f==='function'?f(data.roomHistory):f};
  return data;
}
function run(name,scope,...args){return vm.runInNewContext(business(name),scope)(...args)}
let count=0;
function check(name,fn){fn();console.log('PASS',name);count++;}
check('Ngay khi bắt đầu bàn giao, chưa có kết quả nhận lại vẫn tạo được phiếu Nháp',()=>{
 const c=ctx();const r=run('initHandoverReturnReportDraftBG08',c,slip);assert.equal(r.success,true);assert.equal(c.handoverReturnReports.length,1);assert.equal(c.handoverReturnReports[0].status,'Nháp');assert.equal(c.rooms[0].status,'Đang thuê');
});
check('Đang kiểm kê chưa đủ tài sản vẫn được lập Nháp, không tự xác nhận',()=>{
 const c=ctx({returnInspections:[{...inspection,step305Confirmed:false,assetsCheckedFully:false}]});const r=run('initHandoverReturnReportDraftBG08',c,slip);assert.equal(r.success,true);assert.equal(c.handoverReturnReports[0].status,'Nháp');
});
check('Không có biên bản nhận phòng đã xác nhận thì không được lập phiếu',()=>{
 const c=ctx({handoverReports:[]});assert.equal(run('initHandoverReturnReportDraftBG08',c,slip).success,false);
});
check('Phòng Trống không thể lập phiếu trả',()=>{
 const c=ctx({rooms:[{...room,status:'Trống'}]});assert.equal(run('initHandoverReturnReportDraftBG08',c,slip).success,false);
});
check('Sai phòng hoặc sai lần thuê thì bị từ chối',()=>{
 const c=ctx();assert.equal(run('initHandoverReturnReportDraftBG08',c,{...slip,leaseId:'OTHER'}).success,false);
 assert.equal(run('initHandoverReturnReportDraftBG08',c,{...slip,roomCode:'P.202'}).success,false);
});
check('Không nhận hợp đồng sai mã dù cùng phòng',()=>{
 const c=ctx();assert.equal(run('initHandoverReturnReportDraftBG08',c,{...slip,contractId:'HD-OLD'}).success,false);
});
check('Thiếu ngày lập/bên giao/bên nhận thì từ chối lưu Nháp',()=>{
 const c=ctx();for(const invalid of [{...slip,date:''},{...slip,giverName:''},{...slip,receiverName:'  '}])assert.equal(run('initHandoverReturnReportDraftBG08',c,invalid).success,false);
});
check('Một lần thuê chỉ có một phiếu, mở lại phiếu Nháp cũ',()=>{
 const c=ctx({handoverReturnReports:[slip]});const r=run('initHandoverReturnReportDraftBG08',c,{...slip,id:'return2'});assert.equal(r.success,true);assert.equal(c.handoverReturnReports.length,1);assert.equal(r.report.id,'return1');
});
check('Đã lập Nháp nhưng chưa nhận lại thì không được chuyển phòng Trống',()=>{
 const c=ctx({handoverReturnReports:[slip]});assert.equal(run('confirmReturnStep305AndVacantPH08',c,'P.101','L1','2026-10-20').success,false);assert.equal(c.rooms[0].status,'Đang thuê');
});
check('Nhận lại chưa có xác nhận chủ nhà thì không được chuyển Trống',()=>{
 const c=ctx({handoverReturnReports:[slip],returnInspections:[{...inspection,step305Confirmed:false}]});assert.equal(run('confirmReturnStep305AndVacantPH08',c,'P.101','L1','2026-10-20').success,false);
});
check('Nhận lại đủ hồ sơ nhưng chưa lập phiếu trả thì không chuyển Trống',()=>{
 const c=ctx({returnInspections:[inspection]});assert.equal(run('confirmReturnStep305AndVacantPH08',c,'P.101','L1','2026-10-20').success,false);
});
check('Chỉ đủ hồ sơ đúng lần thuê và đã nhận lại mới được chuyển Trống',()=>{
 const c=ctx({returnInspections:[inspection],handoverReturnReports:[slip]});assert.equal(run('confirmReturnStep305AndVacantPH08',c,'P.101','L1','2026-10-20').success,true);assert.equal(c.rooms[0].status,'Trống');
});
check('Không lấy phiếu trả của lần thuê khác',()=>{
 const c=ctx({returnInspections:[inspection],handoverReturnReports:[{...slip,leaseId:'L2'}]});assert.equal(run('confirmReturnStep305AndVacantPH08',c,'P.101','L1','2026-10-20').success,false);
});
check('Đã bỏ thao tác Chưa bàn giao ở phòng',()=>{
 const view=read('src/components/views/RoomsView.tsx');assert.ok(!view.includes('showUnfinishedHandoverModal'));assert.ok(!view.includes('Ghi nhận chưa bàn giao xong'));assert.ok(!view.includes('Chưa BG'));
});
check('Từ phòng mở thẳng lập phiếu trong Bàn giao',()=>{
 const view=read('src/components/views/HandoverAssetsView.tsx');assert.ok(view.includes("setActiveTab('init_report_bg08')"));assert.ok(!view.includes("setActiveTab(completed ? 'init_report_bg08' : 'return_room_bg09')"));assert.ok(view.includes("if (res.success) setActiveTab('return_room_bg09')"));
});
check('Không khóa lập phiếu bởi trạng thái xác nhận nhận lại',()=>{
 const view=read('src/components/views/HandoverAssetsView.tsx');assert.ok(!view.includes('completedReturnInspection && isReceiveReportConfirmed'));assert.ok(!view.includes('Chỉ lập phiếu trả phòng sau khi việc kiểm tra'));
});
console.log('TOTAL '+count+' return draft during handover tests');
