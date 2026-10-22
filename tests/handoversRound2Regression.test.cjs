const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {loadTs} = require('./loadTs.cjs');
const {buildVerifiedAssetComparison, hasDuplicateAssetNames} = loadTs('src/utils/assetComparisonValidation.ts');
const {getCurrentSettlementSlip} = loadTs('src/utils/settlementUi.ts');
let ts; try {ts = require('typescript')} catch {ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
const contextSource = fs.readFileSync('src/context/AppContext.tsx', 'utf8');
const ast = ts.createSourceFile('AppContext.tsx',contextSource,ts.ScriptTarget.ES2022,true,ts.ScriptKind.TSX);
function functionFromContext(name, scope) {
 let init;
 function visit(n) {if (ts.isVariableDeclaration(n) && n.name.getText(ast)===name) init=n.initializer.getText(ast);ts.forEachChild(n,visit)}
 visit(ast); assert(init, name+' function missing');
 return vm.runInNewContext(ts.transpileModule(`(${init})`,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText, scope);
}
let n=0;const check=(title,fn)=>{fn();n++;console.log('PASS',title)};
const inventory = {inventoryStatus:'Đã hoàn tất',items:[
 {assetId:'a1',name:'Bàn',actualQuantity:1,physicalCondition:'Bình thường'},
 {assetId:'a2',name:'Tủ',actualQuantity:0,physicalCondition:'Bình thường'}
]};
const inspection = {step305Confirmed:true,step304Status:'Đã nhận lại',items:[
 {name:'Bàn',inspected:true,quantity:1,condition:'Bình thường'},
 {name:'Tủ',inspected:true,quantity:0,condition:'Bình thường'}
]};
check('Tài sản 0 chiếc vẫn được đối chiếu nếu được xác nhận',()=>{
 let c=buildVerifiedAssetComparison(inventory,inspection);assert.equal(c.valid,true);assert.equal(c.details.length,2);assert.equal(c.hasDifference,false);
});
check('Không được lưu khi chưa có kiểm kê',()=>assert.equal(buildVerifiedAssetComparison(undefined,inspection).valid,false));
check('Không được lưu khi chưa có nhận lại đã xác nhận',()=>assert.equal(buildVerifiedAssetComparison(inventory,{...inspection,step305Confirmed:false}).valid,false));
check('Không được lưu khi một tài sản chưa kiểm tra',()=>{
 const changed={...inspection,items:inspection.items.map((x,i)=>i?{...x,inspected:false}:x)};
 assert.equal(buildVerifiedAssetComparison(inventory,changed).valid,false);
});
check('Không được lưu khi bảng trả thiếu tài sản',()=>assert.equal(buildVerifiedAssetComparison(inventory,{...inspection,items:inspection.items.slice(0,1)}).valid,false));
check('Không được lưu khi bảng trả thêm tài sản ngoài kiểm kê',()=>assert.equal(buildVerifiedAssetComparison(inventory,{...inspection,items:[...inspection.items,{name:'Ghế',inspected:true,quantity:1,condition:'Bình thường'}]}).valid,false));
check('Không được lưu khi tài sản trùng tên khác hoa thường/dấu',()=>{
 assert.equal(hasDuplicateAssetNames([{name:'Bàn '},{name:' bàn'}]),true);
 assert.equal(buildVerifiedAssetComparison({...inventory,items:[...inventory.items,{assetId:'a3',name:' BÀN ',actualQuantity:1,physicalCondition:'Bình thường'}]},inspection).valid,false);
});
check('Mã tài sản giúp ngăn ghép nhầm hai thiết bị trùng tên theo lịch sử',()=>{
 const linked={...inspection,items:inspection.items.map((i,j)=>({...i,assetId:j?'a2':'a1'}))};
 assert.equal(buildVerifiedAssetComparison(inventory,linked).valid,true);
 const wrong={...inspection,items:inspection.items.map((i,j)=>({...i,assetId:j?'a1':'a2'}))};
 assert.equal(buildVerifiedAssetComparison(inventory,wrong).valid,false);
});
check('So sánh số lượng thực thay đổi tạo kết quả chênh lệch',()=>{
 let c=buildVerifiedAssetComparison(inventory,{...inspection,items:inspection.items.map((i,j)=>j?{...i,quantity:2}:i)});
 assert.equal(c.valid,true);assert.equal(c.hasDifference,true);
});
check('Chọn quyết toán phiên bản cao nhất đúng lượt thuê, bỏ phiếu hủy',()=>{
 const slips=[{id:'old',roomCode:'P.101',leaseId:'L1',version:1,status:'Hoàn tất',updatedAt:'2026-10-23'},
 {id:'new',roomCode:'P.101',leaseId:'L1',version:2,status:'Đang lập',updatedAt:'2026-10-21'},
 {id:'wrong',roomCode:'P.102',leaseId:'L1',version:9,status:'Đang lập'},
 {id:'cancel',roomCode:'P.101',leaseId:'L1',version:3,status:'Đã hủy'}];
 assert.equal(getCurrentSettlementSlip(slips,'L1','P.101').id,'new');
});
check('Lần thuê cũ có thể xử lý tiếp sau khi khách mới vào',()=>{
 const scope={
 rooms:[{roomCode:'P.101',status:'Đang thuê',currentLeaseId:'NEW'}],
 contracts:[{id:'HD-OLD',roomCode:'P.101',leaseId:'OLD',isSignedPaper:true}],
 returnInspections:[{roomCode:'P.101',leaseId:'OLD',step305Confirmed:true,step304Status:'Đã nhận lại'}],
 handoverReturnReports:[{roomCode:'P.101',leaseId:'OLD'}],
 verifyHandoverSource:()=>false
 };
 const fn=functionFromContext('verifyReturnLeaseSource',scope);
 assert.equal(fn('P.101','OLD','HD-OLD'),true);
 assert.equal(fn('P.101','NEW','HD-OLD'),false);
 scope.returnInspections=[];
 assert.equal(fn('P.101','OLD','HD-OLD'),false);
});
check('Không tự cho lưu khi người quản lý chưa so sánh',()=>{
 const view=fs.readFileSync('src/components/views/HandoverAssetsView.tsx','utf8');
 assert(view.includes('disabled={!canPerformOfficialComparison || !comparisonItems.length}'));
 assert(view.includes('buildVerifiedAssetComparison(existingInventory, returnInspectionTarget)'));
 assert(view.includes('comparisonDetails: verified.details'));
});
check('Chuyển lần thuê làm mới toàn bộ trạng thái biểu mẫu theo hồ sơ',()=>{
 const view=fs.readFileSync('src/components/views/HandoverAssetsView.tsx','utf8');
 assert(view.includes('[selectedRoomCode, selectedLeaseId, originalReceiveContractId]'));
 assert(view.includes('setBg09Items(existingInspection?.items?.length'));
 assert(view.includes('setBg11TenantSigned(existingReturnReport?.tenantSignedPaper'));
 assert(view.includes('historicalLeaseOptions.length > 0 && !initialLeaseId'));
});
check('Màn nhận lại hiển thị SL lúc nhận và cấm thêm tài sản trùng',()=>{
 const view=fs.readFileSync('src/components/views/HandoverAssetsView.tsx','utf8');
 assert(view.includes('>SL lúc nhận</th>'));
 assert(view.includes('Tên tài sản đã có trong kiểm kê'));
 assert(!view.includes('<span>Tra cứu lịch sử sự cố </span>'));
});
check('Ghi dữ liệu lỗi hiện cảnh báo, có phục hồi bản sao lưu JSON',()=>{
 const c=fs.readFileSync('src/context/AppContext.tsx','utf8');
 const cfg=fs.readFileSync('src/components/views/ConfigView.tsx','utf8');
 assert(c.includes('setStorageFailure(prev => prev ||'));
 assert(cfg.includes('restoreLocalBusinessData'));
 assert(cfg.includes('window.confirm('));
 assert(cfg.includes('window.location.reload()'));
});
console.log('TOTAL '+n+' regression checks for latest handover issues');
