const fs=require('fs'); const path=require('path'); const vm=require('vm');
let ts; try { ts = require('typescript'); } catch { ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript'); }
const f=path.resolve(__dirname,'../src/components/views/contracts/ContractDocument.tsx');
const rendered={jsx:(type,props)=>({type,props:props||{}}),jsxs:(type,props)=>({type,props:props||{}})};
const code=ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const exported={};vm.runInNewContext(code,{exports:exported,require: id => id === 'react/jsx-runtime'?rendered: {},console});
function words(node){if(node===null||node===undefined||node===false)return '';if(typeof node==='string'||typeof node==='number')return String(node);if(Array.isArray(node))return node.map(words).join(' ');return words(node.props?.children)}
function assert(val,msg){if(!val)throw new Error(msg);console.log('PASS',msg)}
const mk=(id,room,tenant,deposit,type='Hợp đồng lần đầu')=>({id,roomCode:room,leaseId:'THUE-'+id,tenantName:tenant,tenantId:'t1',monthlyRent:2500000,depositAmount:deposit,firstMonthRentAmount:2500000,paymentMethod:'Chuyển khoản',status:'Đã ký',isSignedPaper:true,batchCode:'D1',startDate:'2026-10-01',endDate:'2027-04-01',signedDate:'2026-09-29',contractType:type,terms:'Không khoan tường khi chưa được chấp thuận.'});
const first=words(exported.ContractDocument({contract:mk('HD-101','P.101','Trần Văn A',2500000),room:{floor:1,area:25,roomCode:'P.101'},tenant:{fullName:'Trần Văn A',address:'Địa chỉ A',idNumber:'123456789012'}}));
assert(first.includes('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM'), 'Quốc hiệu');
assert(first.includes('Độc lập - Tự do - Hạnh phúc'), 'Tiêu ngữ');
assert(first.includes('HỢP ĐỒNG THUÊ PHÒNG Ở'), 'Tên hợp đồng');
assert(first.includes('HD-101')&&first.includes('P.101')&&first.includes('Trần Văn A'), 'Gắn dữ liệu hợp đồng, phòng, khách');
assert(first.includes('29/09/2026')&&first.includes('2.500.000'), 'Ngày ký và tiền thuê hiển thị đúng');
assert(first.includes('Không khoan tường khi chưa được chấp thuận.'), 'Giữ nguyên điều khoản nguồn');
assert(!first.includes('Nguyễn Văn An') && !first.includes('NGUYEN VAN AN'), 'Không tự bịa danh tính chủ nhà');
const second=words(exported.ContractDocument({contract:mk('HD-202','P.202','Nguyễn Thị B',3100000,'Hợp đồng nối tiếp'),room:{floor:2,area:30}}));
assert(second.includes('HD-202')&&second.includes('P.202')&&second.includes('Nguyễn Thị B')&&!second.includes('Trần Văn A'), 'Không giữ dữ liệu hợp đồng đã chọn trước');
assert(second.includes('kế thừa')&&second.includes('3.100.000'), 'Hợp đồng nối tiếp không phát sinh cọc mới do hiển thị');
const draft=words(exported.ContractDocument({contract:{...mk('HD-303','P.303','Mai Văn C',3300000), status:'Nháp',isSignedPaper:false,signedDate:undefined,tenantIdNumber:undefined}}));
assert(draft.includes('Dự thảo / Chưa ghi nhận bản giấy đã ký'), 'Phân biệt hợp đồng chưa ký');
const owner=words(exported.ContractDocument({contract:{...mk('HD-404','P.404','Nguyễn Văn C',4100000),lessorName:'Bà Nguyễn Thị Chủ',lessorIdNumber:'012345678901',propertyAddress:'123 đường ABC'},room:{floor:4,area:28}}));
assert(owner.includes('Bà Nguyễn Thị Chủ') && owner.includes('012345678901') && owner.includes('123 đường ABC'), 'Thông tin Bên A lấy từ chính hợp đồng khi đã được nhập');
const draftSource=fs.readFileSync(path.resolve(__dirname,'../src/components/views/contracts/HDT02DraftContract.tsx'),'utf8');
assert(draftSource.includes('terms: terms.trim()'), 'Nội dung điều khoản nhập ở dự thảo được chuyển nguyên văn vào hồ sơ hợp đồng');
assert(draftSource.includes('<ContractDocument contract={previewContract}'), 'Dự thảo và Chi tiết dùng chung một mẫu hợp đồng');
console.log('TOTAL: 13 PASS');
