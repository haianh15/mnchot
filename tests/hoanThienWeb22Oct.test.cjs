const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
let ts;
try {ts=require('typescript')} catch {ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
const code=fs.readFileSync('src/context/AppContext.tsx','utf8');
const ast=ts.createSourceFile('AppContext.tsx',code,ts.ScriptTarget.ES2022,true,ts.ScriptKind.TSX);
function func(name,scope) {
 let init;
 function walk(node){if(ts.isVariableDeclaration(node) && node.name.getText(ast)===name) init=node.initializer.getText(ast);ts.forEachChild(node,walk)}
 walk(ast);
 assert(init,name+' must exist');
 return vm.runInNewContext(ts.transpileModule(`(${init})`,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,scope);
}
const contract={id:'HD-101',roomCode:'P.101',leaseId:'L1',isSignedPaper:true,status:'Kết thúc'};
const signedReturn={roomCode:'P.101',leaseId:'L1',step304Status:'Đã nhận lại',step305Confirmed:true};
function checkArchived({status='Trống',c=contract,inspection=signedReturn,slip=true}={}){
 const scope={rooms:[{roomCode:'P.101',status}],contracts:[c],returnInspections:inspection?[inspection]:[],handoverReturnReports:slip?[{id:'ret1',roomCode:'P.101',leaseId:'L1',contractId:'HD-101'}]:[],verifyHandoverSource:()=>false};
 return func('verifyReturnLeaseSource',scope)('P.101','L1','HD-101');
}
assert.equal(checkArchived(),true,'returned signed lease can still be reviewed');
assert.equal(checkArchived({inspection:null}),false,'unconfirmed inspection is insufficient');
assert.equal(checkArchived({slip:false}),false,'must have return report');
assert.equal(checkArchived({status:'Đang thuê'}),false,'cannot treat occupied room as returned');
assert.equal(checkArchived({c:{...contract,id:'OTHER'}}),false,'cannot use other contract');
const handover=fs.readFileSync('src/components/views/HandoverAssetsView.tsx','utf8');
const rooms=fs.readFileSync('src/components/views/RoomsView.tsx','utf8');
const contracts=fs.readFileSync('src/components/views/ContractsView.tsx','utf8');
const app=fs.readFileSync('src/App.tsx','utf8');
const config=fs.readFileSync('src/components/views/ConfigView.tsx','utf8');
for(const value of ['selectedHistoricalLeaseId','Chọn lần thuê đã kết thúc','onOpenSettlement','Đối chiếu tài sản','1. Thông tin biên bản và hợp đồng','2. Thông tin các bên','3. Tình trạng nhận lại phòng và tài sản','4. Chỉ số điện, nước khi trả phòng','5. Đối chiếu và quyết toán tiền cọc','6. Các vấn đề tồn đọng và kết luận','7.1. Khách thuê bàn giao','Ghi nhận sự cố mới']) assert(handover.includes(value),value);
assert(!handover.includes('initialElectricityKwh || 1250'),'no invented meters');
assert(!handover.includes('qtyReturn: itm.actualQuantity,'),'do not assume return quantity equal to received');
assert(!handover.includes('Xem lịch sử sự cố'),'no unwanted shortcut');
assert(app.includes('onOpenSettlement='),'handover to settlement routing');
assert(contracts.includes('Quay lại bàn giao tài sản'),'settlement back to handover');
assert(!rooms.includes('depositAmount || 3500000'),'no fake deposit default');
assert(!rooms.includes('onClick={() => setShowContactModal(true)}'),'no inert contact action');
assert(code.includes("status: 'Đã kết thúc' as const"),'old return plan is closed');
assert(code.includes('window.setInterval(refreshReturnStatus, 60000)'),'time-based status refresh');
assert(config.includes('exportLocalBusinessData'),'local backup control exists');
console.log('PASS 26 post-return and UI regression assertions');
