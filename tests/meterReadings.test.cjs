const assert = require('node:assert/strict');
const fs = require('node:fs');
let ts; try { ts = require('typescript'); } catch { ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript'); }
require.extensions['.ts'] = function(mod, filename) {
  const source = fs.readFileSync(filename, 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  mod._compile(js, filename);
};
const { resolveMeterBaseline, validateMeterReadingSave } = require('../src/utils/meterReadings.ts');
const room = { id: 'R1', roomCode: 'P.101', status: 'Đang thuê', currentLeaseId: 'L1', currentContractId: 'HD1' };
const contract = { id: 'HD1', roomCode: 'P.101', leaseId: 'L1', contractType: 'Hợp đồng lần đầu', isSignedPaper: true, status: 'Hiệu lực' };
const report = { id: 'BB1', reportNumber: 'BB-101', roomCode: 'P.101', contractId: 'HD1', leaseId: 'L1', status: 'Đã xác nhận', tenantSignedPaper: 'Đã ký giấy', ownerSignedPaper: 'Đã ký giấy', date: '2026-09-01', initialElectricityKwh: 1250, initialWaterM3: 45 };
const condition = { linkedContractId: 'HD1', linkedLeaseId: 'L1', roomCode: 'P.101', scope: 'Hiện trạng chung của phòng', status: 'Đã hoàn tất', initialElectricityKwh: 1250, initialWaterM3: 45, meterElectricCode: 'CT-D-101', meterWaterCode: 'CT-N-101' };
const common = { rooms: [room], contracts: [contract], handoverReports: [report], handoverConditions: [condition], meterReadings: [] };
const newReading = { id: 'new', roomCode: 'P.101', leaseId: 'L1', periodCode: 'Kỳ 09/2026', readingDate: '2026-09-30', readingType: 'Ngoài kỳ chung', electricMeterCode: 'CT-D-101', waterMeterCode: 'CT-N-101', initialElectricKwh: 1250, finalElectricKwh: 1259, initialWaterM3: 45, finalWaterM3: 47, status: 'Nháp', pendingVerificationFlag: false, needsRecalculateFlag: false };
const baseArgs = { roomCode:'P.101',leaseId:'L1',readingDate:'2026-09-30',meterReadings:[],contracts:[contract],handoverReports:[report],handoverConditions:[condition] };
let count = 0;
function check(title,fn){fn();count++;console.log('PASS',title)}
check('Lấy chỉ số đầu từ biên bản xác nhận thật, không tự dùng 0',()=> {
  const b=resolveMeterBaseline(baseArgs);assert.equal(b.ok,true);assert.equal(b.electric,1250);assert.equal(b.water,45);assert.equal(b.electricMeterCode,'CT-D-101');
});
check('Chỉ số 0 trên biên bản là hợp lệ nếu được xác nhận',()=> {
  const b=resolveMeterBaseline({...baseArgs,handoverReports:[{...report,initialElectricityKwh:0,initialWaterM3:0}],handoverConditions:[]});
  assert.equal(b.ok,true); assert.equal(b.electric,0); assert.equal(b.water,0);
});
check('Biên bản chưa ký không được làm nguồn kỳ đầu',()=>assert.equal(resolveMeterBaseline({...baseArgs,handoverReports:[{...report,status:'Đã lập'}]}).ok,false));
check('Không mượn biên bản của phòng khác',()=>assert.equal(resolveMeterBaseline({...baseArgs,handoverReports:[{...report,roomCode:'P.202'}]}).ok,false));
check('Không mượn biên bản của lần thuê cũ',()=>assert.equal(resolveMeterBaseline({...baseArgs,handoverReports:[{...report,leaseId:'L0'}]}).ok,false));
check('Cảnh báo chỉ số biên bản và hiện trạng không đồng nhất',()=>assert.equal(resolveMeterBaseline({...baseArgs,handoverConditions:[{...condition,initialWaterM3:999}]}).ok,false));
check('Không chọn ngày trước ngày bàn giao',()=>assert.equal(resolveMeterBaseline({...baseArgs,readingDate:'2026-08-30'}).ok,false));
check('Không lấy kỳ trước là nháp chưa được xác nhận',()=> {
  const b=resolveMeterBaseline({...baseArgs,readingDate:'2026-10-20',meterReadings:[{...newReading,status:'Nháp'}]});
  assert.equal(b.ok,true); assert.equal(b.electric,1250);
});
check('Ưu tiên kỳ trước đã xác nhận thuộc đúng lần thuê',()=> {
  const b=resolveMeterBaseline({...baseArgs,readingDate:'2026-10-20',meterReadings:[{...newReading,status:'Đã xác nhận'}]});
  assert.equal(b.ok,true);assert.equal(b.electric,1259);assert.equal(b.water,47);
});
check('Không lấy kỳ trước đã xác nhận nhưng thuộc khách cũ',()=> {
  const b=resolveMeterBaseline({...baseArgs,readingDate:'2026-10-20',meterReadings:[{...newReading,leaseId:'L0',status:'Đã xác nhận'}]});
  assert.equal(b.ok,true);assert.equal(b.electric,1250);
});
check('Hợp đồng gia hạn cùng lần thuê kế thừa biên bản gốc',()=> {
  const renewal={...contract,id:'HD2',contractType:'Hợp đồng nối tiếp',previousContractId:'HD1'};
  const b=resolveMeterBaseline({...baseArgs,contracts:[contract,renewal]});
  assert.equal(b.ok,true);assert.equal(b.electric,1250);
});
check('Cho lưu lần đầu đúng chỉ số nguồn',()=>assert.equal(validateMeterReadingSave({ ...common,reading:newReading }).success,true));
check('Chặn lần đầu tự nhập chỉ số 0',()=>assert.equal(validateMeterReadingSave({...common,reading:{...newReading,initialElectricKwh:0,initialWaterM3:0}}).success,false));
check('Chặn tạo lại cùng phòng/lần thuê/kỳ',()=>assert.equal(validateMeterReadingSave({...common,meterReadings:[{...newReading,id:'older'}],reading:newReading}).success,false));
check('Chặn tạo lại cùng ngày dù khác kỳ',()=>assert.equal(validateMeterReadingSave({...common,meterReadings:[{...newReading,id:'older',periodCode:'Kỳ 08/2026'}],reading:newReading}).success,false));
check('Chặn dùng ID đã thuộc lần thuê khác',()=>assert.equal(validateMeterReadingSave({...common,meterReadings:[{...newReading,leaseId:'L0'}],reading:newReading}).success,false));
check('Chặn ghi đè bản chỉ số đã xác nhận',()=>assert.equal(validateMeterReadingSave({...common,meterReadings:[{...newReading,status:'Đã xác nhận'}],reading:newReading}).success,false));
check('Chặn ghi bản ghi thuộc phòng khách cũ',()=>assert.equal(validateMeterReadingSave({...common,reading:{...newReading,leaseId:'L0'}}).success,false));
check('Cho phép cập nhật đúng bản nháp cùng ID và kỳ',()=>assert.equal(validateMeterReadingSave({...common,meterReadings:[{...newReading}],reading:newReading}).success,true));
check('Nhập chỉ số không có biên bản xác nhận bị từ chối',()=>assert.equal(validateMeterReadingSave({...common,handoverReports:[],reading:newReading}).success,false));
check('Không đồng ý mã công tơ lạ mà không có xác minh',()=>assert.equal(validateMeterReadingSave({...common,reading:{...newReading,electricMeterCode:'SOME-OTHER'}}).success,false));
check('Giữ nguyên lựa chọn Ngoài kỳ chung trong bản ghi',()=>assert.equal(validateMeterReadingSave({...common,reading:newReading}).success,true));
check('Đọc chỉ số đã xác nhận ở kỳ sau, không lấy của phòng khác',()=> {
 const later={...newReading,id:'next',readingDate:'2026-10-31',periodCode:'Kỳ 10/2026',initialElectricKwh:1259,finalElectricKwh:1280,initialWaterM3:47,finalWaterM3:49};
 assert.equal(validateMeterReadingSave({...common,meterReadings:[{...newReading,status:'Đã xác nhận'}],reading:later}).success,true);
});
console.log(`Meter readings: ${count}/${count} checks passed.`);
const view = fs.readFileSync('src/components/views/BillingView.tsx', 'utf8');
const context = fs.readFileSync('src/context/AppContext.tsx', 'utf8');
check('Chọn phòng không tự chuyển Ngoài kỳ chung thành Theo kỳ chung',()=> {
  const chooser = view.slice(view.indexOf('const handleSelectRoomForReading'),view.indexOf('const handleContinueDraftReading'));
  assert(!chooser.includes("setReadType('Theo kỳ chung')"));
});
check('Chỉ số đầu kỳ trên biểu mẫu không còn cho sửa tự do',()=> {
  assert.match(view,/value=\{initElec\}\s+readOnly/);
  assert.match(view,/value=\{initWater\}\s+readOnly/);
});
check('Hàm lưu có kiểm tra nguồn và từ chối nếu đã lập bảng tính',()=> {
  const save = context.slice(context.indexOf('const saveMeterReadingTT01'),context.indexOf('const updateMeterReadingTT02'));
  assert(save.includes('validateMeterReadingSave'));
  assert(save.includes('periodBills.some'));
});
console.log('All meter UI/context checks completed.');
