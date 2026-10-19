import {
  UserAccount,
  ServiceFeeConfig,
  UtilityPriceHistory,
  BankAccountConfig,
  Room,
  RoomHistoryLog,
  Asset,
  InventoryRecord,
  HandoverCondition,
  HandoverReport,
  AssetIncident,
  ReturnInspection,
  AssetComparison,
  AssetComparisonResult,
  HandoverReturnReport,
  Tenant,
  CoTenant,
  BatchSchedule,
  LeaseConditionDraft,
  Contract,
  DepositSettlementSlip,
  MeterReading,
  PeriodBill,
  PaymentNotice,
  PaymentReceipt,
  DebtHistoryReminder,
  DebtPromise,
  SecurityAuditLog,
  MissingConditionLog,
  UnfinishedHandoverLog,
  InitialPaymentRecord,
  LeaseStartEvent,
  PendingReceptionDoc,
  TenantChangeProposal,
  PreSignIdentityVerification,
  TenantHistoryEntry,
  ReceptionRequest
} from '../types';

// Một tài khoản được cấp sẵn duy nhất cho BẢN XEM THỬ.
// Chỉ chứa dẫn xuất PBKDF2, không lưu mật khẩu rõ vào mã nguồn.
 // Tài khoản hoạt động cục bộ trên trình duyệt, KHÔNG phải hệ thống xác thực máy chủ.
export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'usr_owner_01',
    username: 'chunha',
    fullName: 'Quản lý/Chủ nhà',
    email: '', // Email khôi phục phải được cấu hình và xác minh trên backend thật.
    role: 'Quản lý/Chủ nhà',
    mustChangePasswordFirstLogin: true,
    failedLoginAttempts: 0,
    lockUntil: null,
    failedChangePasswordAttempts: 0,
    changePasswordLockUntil: null,
    authVersion: 1,
    passwordHash: 'pbkdf2-sha256:210000:fEp0McOcgS7c0KqhVOsM9w==:RB8gB2p5G5fkKgAgWDG9eR7NHd03rFcsujq6/NNINuM='
  }
];

export const INITIAL_SERVICES: ServiceFeeConfig[] = [
  { id: 'srv_1', name: 'Vệ sinh hành lang & rác thải', unit: 'phòng/kỳ', amount: 50000, status: 'Đang áp dụng' },
  { id: 'srv_2', name: 'Internet cáp quang Wifi tốc độ cao', unit: 'phòng/kỳ', amount: 100000, status: 'Đang áp dụng' },
  { id: 'srv_3', name: 'Điện chiếu sáng chung & thang máy', unit: 'phòng/kỳ', amount: 50000, status: 'Đang áp dụng' },
  { id: 'srv_4', name: 'Bảo dưỡng máy giặt chung sân thượng', unit: 'phòng/kỳ', amount: 50000, status: 'Đang áp dụng' }
];

export const INITIAL_PRICE_HISTORY: UtilityPriceHistory[] = [
  {
    id: 'uph_01',
    changedAt: '2026-09-01T08:00:00Z',
    changedBy: 'Nguyễn Văn An',
    effectivePeriod: 'Kỳ 09/2026',
    electricityPrice: 3500,
    waterPrice: 30000,
    services: INITIAL_SERVICES
  }
];

export const INITIAL_BANK_ACCOUNTS: BankAccountConfig[] = [
  {
    id: 'bank_01',
    bankName: 'MB Bank (Ngân hàng Quân Đội)',
    accountNumber: '0988123456',
    accountHolder: 'NGUYEN VAN AN',
    status: 'Đang sử dụng',
    updatedAt: '2026-09-01T08:00:00Z',
    updatedBy: 'Nguyễn Văn An'
  }
];

export const INITIAL_BATCH_SCHEDULES: BatchSchedule[] = [
  {
    batchCode: 'DOT-2026-K10',
    startDate: '2026-10-01',
    endDate: '2027-04-01',
    billingCycleNote: 'Thu định kỳ ngày 25-30 hàng tháng',
    isConfirmed: true
  },
  {
    batchCode: 'DOT-2026-K11',
    startDate: '2026-11-01',
    endDate: '2027-05-01',
    billingCycleNote: 'Thu định kỳ ngày 25-30 hàng tháng',
    isConfirmed: true
  }
];

export const INITIAL_STANDARD_ASSETS: Asset[] = [
  { id: 'ast_1', name: 'Điều hòa Daikin 9000 BTU Inverter', unit: 'cái', standardQuantity: 1 },
  { id: 'ast_2', name: 'Bình nóng lạnh Ferroli 20L', unit: 'cái', standardQuantity: 1 },
  { id: 'ast_3', name: 'Tủ lạnh mini Funiki 90L', unit: 'cái', standardQuantity: 1 },
  { id: 'ast_4', name: 'Giường gỗ sồi 1.6m x 2m kèm đệm', unit: 'bộ', standardQuantity: 1 },
  { id: 'ast_5', name: 'Tủ quần áo 2 cánh gỗ MDF', unit: 'cái', standardQuantity: 1 },
  { id: 'ast_6', name: 'Bàn ghế làm việc', unit: 'bộ', standardQuantity: 1 },
  { id: 'ast_7', name: 'Thiết bị vệ sinh & vòi sen Inax', unit: 'bộ', standardQuantity: 1 },
  { id: 'ast_8', name: 'Kệ bếp đá & bồn rửa inox', unit: 'bộ', standardQuantity: 1 },
  { id: 'ast_9', name: 'Chìa khóa phòng & thẻ từ ra vào cổng', unit: 'bộ', standardQuantity: 2 }
];

export const INITIAL_ROOMS: Room[] = [
  {
    id: 'rm_101',
    roomCode: 'P.101',
    floor: 1,
    area: 25,
    status: 'Đang thuê',
    hasDeposit: true,
    firstMonthRentPaid: true,
    firstMonthPeriod: 'Kỳ 09/2026',
    currentTenantId: 'ten_01',
    currentTenantName: 'Trần Văn Bình',
    contractStartDate: '2026-09-01',
    contractEndDate: '2027-03-01',
    currentContractId: 'HD-101-2026',
    currentLeaseId: 'THUE-101-L1',
    totalOccupants: 1,
    note: 'Căn góc tầng 1, ban công thoáng'
  },
  {
    id: 'rm_102',
    roomCode: 'P.102',
    floor: 1,
    area: 28,
    status: 'Sắp trả', // Còn <= 15 ngày
    hasDeposit: true,
    firstMonthRentPaid: true,
    firstMonthPeriod: 'Kỳ 05/2026',
    currentTenantId: 'ten_02',
    currentTenantName: 'Lê Thị Cúc',
    contractStartDate: '2026-05-01',
    contractEndDate: '2026-11-01',
    currentContractId: 'HD-102-2026',
    currentLeaseId: 'THUE-102-L1',
    expectedReturnDate: '2026-10-25', // Còn 9 ngày -> Sắp trả
    totalOccupants: 2,
    note: 'Khách báo chuyển công tác về Đà Nẵng'
  },
  {
    id: 'rm_103',
    roomCode: 'P.103',
    floor: 1,
    area: 22,
    status: 'Trống',
    hasDeposit: false,
    firstMonthRentPaid: false,
    firstMonthPeriod: '',
    totalOccupants: 0,
    note: 'Phòng đã dọn sạch sẽ, sẵn sàng giới thiệu'
  },
  {
    id: 'rm_201',
    roomCode: 'P.201',
    floor: 2,
    area: 30,
    status: 'Đang thuê',
    hasDeposit: true,
    firstMonthRentPaid: true,
    firstMonthPeriod: 'Kỳ 08/2026',
    currentTenantId: 'ten_03',
    currentTenantName: 'Phạm Hùng Cường',
    contractStartDate: '2026-08-01',
    contractEndDate: '2027-02-01',
    currentContractId: 'HD-201-2026',
    currentLeaseId: 'THUE-201-L1',
    totalOccupants: 2,
    note: 'Có 1 sự cố điều hòa đang theo dõi'
  },
  {
    id: 'rm_202',
    roomCode: 'P.202',
    floor: 2,
    area: 26,
    status: 'Trống', // Đã nhận lại phòng tại 3.05 -> Chuyển Trống
    hasDeposit: false,
    firstMonthRentPaid: false,
    firstMonthPeriod: '',
    totalOccupants: 0,
    note: 'Đã nhận lại thực tế ngày 15/10/2026, đang chờ đối soát quyết toán cọc'
  },
  {
    id: 'rm_203',
    roomCode: 'P.203',
    floor: 2,
    area: 28,
    status: 'Đang thuê',
    hasDeposit: true,
    firstMonthRentPaid: true,
    firstMonthPeriod: 'Kỳ 04/2026',
    currentTenantId: 'ten_04',
    currentTenantName: 'Võ Thị Hồng',
    contractStartDate: '2026-04-15',
    contractEndDate: '2026-10-28', // Sắp hết hạn hợp đồng (12 ngày)
    currentContractId: 'HD-203-2026',
    currentLeaseId: 'THUE-203-L1',
    totalOccupants: 1,
    note: 'Khách muốn tiếp tục thuê, chuẩn bị ký hợp đồng nối tiếp'
  },
  {
    id: 'rm_301',
    roomCode: 'P.301',
    floor: 3,
    area: 32,
    status: 'Đang thuê',
    hasDeposit: true,
    firstMonthRentPaid: true,
    firstMonthPeriod: 'Kỳ 07/2026',
    currentTenantId: 'ten_05',
    currentTenantName: 'Hoàng Minh Tuấn',
    contractStartDate: '2026-07-01',
    contractEndDate: '2027-01-01',
    currentContractId: 'HD-301-2026',
    currentLeaseId: 'THUE-301-L1',
    totalOccupants: 3, // Có người ở cùng
    note: 'Gia đình trẻ 2 vợ chồng và 1 con'
  },
  {
    id: 'rm_302',
    roomCode: 'P.302',
    floor: 3,
    area: 25,
    status: 'Đang thuê',
    hasDeposit: true,
    firstMonthRentPaid: true,
    firstMonthPeriod: 'Kỳ 06/2026',
    currentTenantId: 'ten_06',
    currentTenantName: 'Đặng Ngọc Lan',
    contractStartDate: '2026-06-01',
    contractEndDate: '2026-12-01',
    currentContractId: 'HD-302-2026',
    currentLeaseId: 'THUE-302-L1',
    totalOccupants: 1,
    note: 'Có khoản công nợ quá hạn kỳ 09/2026'
  },
  {
    id: 'rm_303',
    roomCode: 'P.303',
    floor: 3,
    area: 27,
    status: 'Trống',
    hasDeposit: false,
    firstMonthRentPaid: false,
    firstMonthPeriod: '',
    totalOccupants: 0,
    note: 'Vừa hoàn thiện thủ tục ký hợp đồng, chuẩn bị kiểm tra điều kiện nhận phòng'
  },
  {
    id: 'rm_401',
    roomCode: 'P.401',
    floor: 4,
    area: 29,
    status: 'Đang thuê',
    hasDeposit: true,
    firstMonthRentPaid: true,
    firstMonthPeriod: 'Kỳ 09/2026',
    currentTenantId: 'ten_07',
    currentTenantName: 'Ngô Đức Thành',
    contractStartDate: '2026-09-15',
    contractEndDate: '2027-03-15',
    currentContractId: 'HD-401-2026',
    currentLeaseId: 'THUE-401-L1',
    totalOccupants: 1,
    note: 'Công tơ điện có dấu hiệu quay vòng, cần xác minh sản lượng'
  },
  {
    id: 'rm_402',
    roomCode: 'P.402',
    floor: 4,
    area: 26,
    status: 'Đang thuê',
    hasDeposit: true,
    firstMonthRentPaid: true,
    firstMonthPeriod: 'Kỳ 09/2026',
    currentTenantId: 'ten_08',
    currentTenantName: 'Dương Thu Trang',
    contractStartDate: '2026-09-01',
    contractEndDate: '2027-03-01',
    currentContractId: 'HD-402-2026',
    currentLeaseId: 'THUE-402-L1',
    totalOccupants: 2,
    note: 'Đã lập thông báo thanh toán và mã QR'
  },
  {
    id: 'rm_403',
    roomCode: 'P.403',
    floor: 4,
    area: 28,
    status: 'Đang thuê',
    hasDeposit: true,
    firstMonthRentPaid: true,
    firstMonthPeriod: 'Kỳ 09/2026',
    currentTenantId: 'ten_09',
    currentTenantName: 'Bùi Anh Tuấn',
    contractStartDate: '2026-09-01',
    contractEndDate: '2027-03-01',
    currentContractId: 'HD-403-2026',
    currentLeaseId: 'THUE-403-L1',
    totalOccupants: 1,
    note: 'Đã thanh toán đủ tiền kỳ 10/2026'
  }
];

export const INITIAL_TENANTS: Tenant[] = [
  {
    id: 'ten_01',
    fullName: 'Trần Văn Bình',
    phoneNumber: '0912345678',
    idNumber: '001095012345',
    address: 'Phù Cừ, Hưng Yên',
    paperStatus: 'Đã cung cấp',
    verificationStatus: 'Đã xác minh hợp lệ',
    createdAt: '2026-08-25T09:00:00Z',
    createdBy: 'Nguyễn Văn An'
  },
  {
    id: 'ten_02',
    fullName: 'Lê Thị Cúc',
    phoneNumber: '0987654321',
    idNumber: '034198004567',
    address: 'Hải Hậu, Nam Định',
    paperStatus: 'Đã cung cấp',
    verificationStatus: 'Đã xác minh hợp lệ',
    createdAt: '2026-04-20T10:00:00Z',
    createdBy: 'Nguyễn Văn An'
  },
  {
    id: 'ten_03',
    fullName: 'Phạm Hùng Cường',
    phoneNumber: '0903112233',
    idNumber: '026093007890',
    address: 'Vĩnh Lộc, Thanh Hóa',
    paperStatus: 'Đã cung cấp',
    verificationStatus: 'Đã xác minh hợp lệ',
    createdAt: '2026-07-25T14:30:00Z',
    createdBy: 'Nguyễn Văn An'
  },
  {
    id: 'ten_04',
    fullName: 'Võ Thị Hồng',
    phoneNumber: '0977889900',
    idNumber: '040197003214',
    address: 'Diễn Châu, Nghệ An',
    paperStatus: 'Đã cung cấp',
    verificationStatus: 'Đã xác minh hợp lệ',
    createdAt: '2026-04-10T11:00:00Z',
    createdBy: 'Nguyễn Văn An'
  },
  {
    id: 'ten_05',
    fullName: 'Hoàng Minh Tuấn',
    phoneNumber: '0936778899',
    idNumber: '001090001122',
    address: 'Đống Đa, Hà Nội',
    paperStatus: 'Đã cung cấp',
    verificationStatus: 'Đã xác minh hợp lệ',
    createdAt: '2026-06-20T15:00:00Z',
    createdBy: 'Nguyễn Văn An'
  },
  {
    id: 'ten_06',
    fullName: 'Đặng Ngọc Lan',
    phoneNumber: '0965443322',
    idNumber: '019199008877',
    address: 'Thái Thụy, Thái Bình',
    paperStatus: 'Đã cung cấp',
    verificationStatus: 'Đã xác minh hợp lệ',
    createdAt: '2026-05-25T09:30:00Z',
    createdBy: 'Nguyễn Văn An'
  },
  {
    id: 'ten_07',
    fullName: 'Ngô Đức Thành',
    phoneNumber: '0945667788',
    idNumber: '037096005544',
    address: 'Kim Sơn, Ninh Bình',
    paperStatus: 'Đã cung cấp',
    verificationStatus: 'Đã xác minh hợp lệ',
    createdAt: '2026-09-10T16:00:00Z',
    createdBy: 'Nguyễn Văn An'
  },
  {
    id: 'ten_08',
    fullName: 'Dương Thu Trang',
    phoneNumber: '0922334455',
    idNumber: '022198006655',
    address: 'Hạ Long, Quảng Ninh',
    paperStatus: 'Đã cung cấp',
    verificationStatus: 'Đã xác minh hợp lệ',
    createdAt: '2026-08-28T10:15:00Z',
    createdBy: 'Nguyễn Văn An'
  },
  {
    id: 'ten_09',
    fullName: 'Bùi Anh Tuấn',
    phoneNumber: '0911882233',
    idNumber: '031092004433',
    address: 'Lê Chân, Hải Phòng',
    paperStatus: 'Đã cung cấp',
    verificationStatus: 'Đã xác minh hợp lệ',
    createdAt: '2026-08-29T14:00:00Z',
    createdBy: 'Nguyễn Văn An'
  },
  {
    id: 'ten_10',
    fullName: 'Nguyễn Quang Khải',
    phoneNumber: '0988776655',
    idNumber: '001099014562',
    address: 'Từ Liêm, Hà Nội',
    paperStatus: 'Đã cung cấp',
    verificationStatus: 'Đã xác minh hợp lệ',
    createdAt: '2026-10-14T09:00:00Z',
    createdBy: 'Nguyễn Văn An',
    notes: 'Khách mới đăng ký thuê phòng 303'
  }
];

export const INITIAL_CO_TENANTS: CoTenant[] = [
  {
    id: 'coten_01',
    tenantId: 'ten_05',
    roomCode: 'P.301',
    leaseId: 'THUE-301-L1',
    fullName: 'Nguyễn Thị Hương',
    idNumber: '001192003344',
    relationship: 'Vợ',
    status: 'Đang cư trú',
    actualArrivalDate: '2026-07-01',
    arrivalVerificationEvidence: 'Đã khai báo cư trú công an phường'
  },
  {
    id: 'coten_02',
    tenantId: 'ten_05',
    roomCode: 'P.301',
    leaseId: 'THUE-301-L1',
    fullName: 'Hoàng Bảo Nam',
    idNumber: 'Khai sinh số 123/2022',
    relationship: 'Con',
    status: 'Đang cư trú',
    actualArrivalDate: '2026-07-01',
    arrivalVerificationEvidence: 'Bản sao giấy khai sinh'
  },
  {
    id: 'coten_03',
    tenantId: 'ten_08',
    roomCode: 'P.402',
    leaseId: 'THUE-402-L1',
    fullName: 'Trần Thùy Linh',
    idNumber: '022199007788',
    relationship: 'Bạn cùng phòng',
    status: 'Đang cư trú',
    actualArrivalDate: '2026-09-01',
    arrivalVerificationEvidence: 'CCCD đã xác thực'
  }
];

export const INITIAL_PENDING_DOCS: PendingReceptionDoc[] = [
  {
    id: 'DOC-2026-001',
    tenantId: 'ten_10',
    tenantName: 'Nguyễn Quang Khải',
    docType: 'CCCD gắn chip (Bản gốc)',
    docNumber: '001099014562',
    source: 'Tiếp nhận trực tiếp tại văn phòng',
    receivedDate: '2026-10-14',
    recordedBy: 'Nguyễn Văn An (Chủ nhà)',
    status: 'Chờ nhận phòng',
    notes: 'Giấy tờ giữ để đối chiếu lúc bàn giao chìa khóa tại bước 3.10b (ASIS-03)'
  },
  {
    id: 'DOC-2026-002',
    tenantId: 'ten_04',
    tenantName: 'Võ Thị Hồng',
    docType: 'Giấy khai báo cư trú / Tạm trú',
    docNumber: 'TT-2026/0401',
    source: 'Cổng dịch vụ công nộp trực tuyến',
    receivedDate: '2026-10-12',
    recordedBy: 'Nguyễn Văn An (Chủ nhà)',
    status: 'Chờ nhận phòng',
    notes: 'Bổ sung giấy tờ cho hợp đồng nối tiếp'
  }
];

export const INITIAL_RECEPTION_REQUESTS: ReceptionRequest[] = [
  {
    requestCode: 'YCTN-2026-001',
    prospectiveTenantName: 'Nguyễn Quang Khải',
    prospectivePhone: '0988776655',
    prospectiveIdNumber: '001099014562',
    roomCode: 'P.303',
    conditionsVersion: 'v1.0 (Tiền thuê 3.4tr/tháng, cọc 1 tháng)',
    status: 'Đã gắn hồ sơ',
    linkedTenantId: 'ten_10',
    linkedAt: '2026-10-14T09:15:00Z',
    linkedBy: 'Nguyễn Văn An (Chủ nhà)',
    linkHistory: [
      {
        timestamp: '2026-10-14T08:30:00Z',
        action: 'Tiếp nhận nhu cầu thuê',
        by: 'Nguyễn Văn An (Chủ nhà)',
        note: 'Cấp mã yêu cầu tiếp nhận bất biến YCTN-2026-001'
      },
      {
        timestamp: '2026-10-14T09:15:00Z',
        action: 'Liên kết hồ sơ khách ',
        by: 'Nguyễn Văn An (Chủ nhà)',
        note: 'Gắn thành công hồ sơ ten_10 vào mã yêu cầu'
      }
    ]
  },
  {
    requestCode: 'YCTN-2026-002',
    prospectiveTenantName: 'Vũ Đình Toàn',
    prospectivePhone: '0915667788',
    prospectiveIdNumber: '030095001234',
    roomCode: 'P.103',
    conditionsVersion: 'v1.0 (Tiền thuê 3.2tr/tháng, cọc 1 tháng)',
    status: 'Chờ gắn hồ sơ',
    linkHistory: [
      {
        timestamp: '2026-10-15T14:00:00Z',
        action: 'Tiếp nhận nhu cầu thuê',
        by: 'Nguyễn Văn An (Chủ nhà)',
        note: 'Cấp mã yêu cầu tiếp nhận bất biến YCTN-2026-002, khách hẹn chiều nộp hồ sơ'
      }
    ]
  },
  {
    requestCode: 'YCTN-2026-003',
    prospectiveTenantName: 'Đoàn Minh Nhật',
    prospectivePhone: '0944556677',
    prospectiveIdNumber: '025098007766',
    roomCode: 'P.202',
    conditionsVersion: 'v1.1 (Tiền thuê 3.6tr/tháng, cọc 1 tháng)',
    status: 'Chờ gắn hồ sơ',
    linkHistory: [
      {
        timestamp: '2026-10-16T09:00:00Z',
        action: 'Tiếp nhận nhu cầu thuê',
        by: 'Nguyễn Văn An (Chủ nhà)',
        note: 'Khách đăng ký xem phòng 202 vừa trả hôm qua'
      }
    ]
  }
];

export const INITIAL_LEASE_CONDITIONS: LeaseConditionDraft[] = [
  {
    id: 'COND-2026-001',
    requestCode: 'YCTN-2026-001',
    tenantId: 'ten_10',
    prospectiveTenantName: 'Nguyễn Quang Khải',
    prospectivePhone: '0988776655',
    prospectiveIdNumber: '001099014562',
    roomCode: 'P.303',
    batchCode: 'DOT-2026-K10',
    startDate: '2026-10-18',
    endDate: '2027-04-18',
    monthlyRent: 3700000,
    depositAmount: 3700000,
    billingCycle: 'Ngày 25-30 hàng tháng',
    paymentMethod: 'Chuyển khoản',
    termsNote: 'Căn hộ mini ban công, có nội thất cơ bản, giữ gìn vệ sinh chung.',
    tenantAgreed44a1: true,
    status: 'Đã tạo hợp đồng',
    version: 1,
    createdAt: '2026-10-14T08:45:00Z',
    createdBy: 'Nguyễn Văn An (Chủ nhà)',
    updatedAt: '2026-10-14T09:30:00Z',
    updatedBy: 'Nguyễn Văn An (Chủ nhà)',
    checkResult: {
      isValid: true,
      roomAvailable: true,
      batchConfirmed: true,
      blockingErrors: [],
      warnings: ['Khách đang dùng giấy tờ đối chiếu tạm thời '],
      checkedAt: '2026-10-14T09:20:00Z'
    },
    history: [
      {
        version: 1,
        timestamp: '2026-10-14T08:45:00Z',
        by: 'Nguyễn Văn An (Chủ nhà)',
        changes: 'Khởi tạo bộ điều kiện thuê ban đầu theo yêu cầu YCTN-2026-001',
        note: 'Đơn giá 3.7tr/tháng, cọc 3.7tr'
      }
    ]
  },
  {
    id: 'COND-2026-002',
    requestCode: 'YCTN-2026-002',
    prospectiveTenantName: 'Vũ Đình Toàn',
    prospectivePhone: '0915667788',
    prospectiveIdNumber: '030095001234',
    roomCode: 'P.103',
    batchCode: 'DOT-2026-K10',
    startDate: '2026-10-20',
    endDate: '2027-04-20',
    monthlyRent: 3200000,
    depositAmount: 3200000,
    billingCycle: 'Ngày 25-30 hàng tháng',
    paymentMethod: 'Chuyển khoản',
    termsNote: 'Căn hộ tầng 1, không nuôi thú cưng lớn.',
    tenantAgreed44a1: false,
    status: 'Đang trao đổi',
    version: 2,
    createdAt: '2026-10-15T14:10:00Z',
    createdBy: 'Nguyễn Văn An (Chủ nhà)',
    updatedAt: '2026-10-15T16:00:00Z',
    updatedBy: 'Nguyễn Văn An (Chủ nhà)',
    checkResult: {
      isValid: true,
      roomAvailable: true,
      batchConfirmed: true,
      blockingErrors: [],
      warnings: ['Phòng P.103 đang kiểm kê chuẩn bị bàn giao (BG-01)'],
      checkedAt: '2026-10-15T15:50:00Z'
    },
    history: [
      {
        version: 1,
        timestamp: '2026-10-15T14:10:00Z',
        by: 'Nguyễn Văn An (Chủ nhà)',
        changes: 'Khởi tạo điều kiện thuê: Giá 3.5tr/tháng',
        note: 'Khách đề nghị giảm giá'
      },
      {
        version: 2,
        timestamp: '2026-10-15T16:00:00Z',
        by: 'Nguyễn Văn An (Chủ nhà)',
        changes: 'Điều chỉnh đơn giá: 3.500.000 đ → 3.200.000 đ; Cọc: 3.200.000 đ',
        note: 'Đã cập nhật theo yêu cầu khách, chờ phản hồi chính thức'
      }
    ]
  },
  {
    id: 'COND-2026-003',
    requestCode: 'YCTN-2026-003',
    prospectiveTenantName: 'Đoàn Minh Nhật',
    prospectivePhone: '0944556677',
    prospectiveIdNumber: '025098007766',
    roomCode: 'P.202',
    batchCode: 'DOT-2026-K11',
    startDate: '2026-11-01',
    endDate: '2027-05-01',
    monthlyRent: 3600000,
    depositAmount: 3600000,
    billingCycle: 'Ngày 25-30 hàng tháng',
    paymentMethod: 'Chuyển khoản',
    termsNote: 'Thuê 6 tháng, thanh toán chuyển khoản định kỳ.',
    tenantAgreed44a1: true,
    status: 'Đã thống nhất',
    version: 1,
    createdAt: '2026-10-16T09:15:00Z',
    createdBy: 'Nguyễn Văn An (Chủ nhà)',
    updatedAt: '2026-10-16T09:40:00Z',
    updatedBy: 'Nguyễn Văn An (Chủ nhà)',
    checkResult: {
      isValid: true,
      roomAvailable: true,
      batchConfirmed: true,
      blockingErrors: [],
      warnings: [],
      checkedAt: '2026-10-16T09:35:00Z'
    },
    history: [
      {
        version: 1,
        timestamp: '2026-10-16T09:15:00Z',
        by: 'Nguyễn Văn An (Chủ nhà)',
        changes: 'Khởi tạo điều kiện và khách đã thống nhất tại 4.4a1',
        note: 'Sẵn sàng lập dự thảo hợp đồng '
      }
    ]
  }
];

export const INITIAL_TENANT_PROPOSALS: TenantChangeProposal[] = [
  {
    id: 'BDL-2026-001',
    tenantId: 'ten_01',
    version: 1,
    source: 'HSKT-03',
    currentData: {
      address: 'Phù Cừ, Hưng Yên'
    },
    proposedData: {
      address: 'Số 12 đường Hoàng Cương, TT. Phù Cừ, Hưng Yên'
    },
    evidenceNote: 'Khách nộp bản sao CCCD mới làm lại có chi tiết số nhà cụ thể',
    verificationResult: 'Đạt',
    verifiedAt: '2026-10-15T10:00:00Z',
    verifiedBy: 'Nguyễn Văn An (Chủ nhà)',
    isTransferredToUpdate: true,
    transferredAt: '2026-10-15T10:05:00Z',
    isValid: true
  },
  {
    id: 'BDL-2026-002',
    tenantId: 'ten_03',
    version: 1,
    source: 'HSKT-04',
    currentData: {
      phoneNumber: '0903112233'
    },
    proposedData: {
      phoneNumber: '0903998877'
    },
    evidenceNote: 'Khách đề nghị đổi SĐT nhận tin nhắn qua ứng dụng Zalo',
    verificationResult: 'Chưa xác minh',
    reason: 'Chưa có bản cam kết hoặc đối chiếu trực tiếp sim chính chủ',
    isTransferredToUpdate: false,
    isValid: true
  }
];

export const INITIAL_PRE_SIGN_VERIFICATIONS: PreSignIdentityVerification[] = [
  {
    id: 'PSV-2026-001',
    tenantId: 'ten_04',
    contractId: 'HD-203-2026',
    docType: 'CCCD gắn chip',
    docNumber: '040197003214',
    evidence: 'Bản gốc đối chiếu trực tiếp tại văn phòng trước khi ký hợp đồng nối tiếp ASIS-04 bước 4.10',
    source: 'Tiếp nhận trực tiếp',
    result: 'Đã xác minh hợp lệ',
    verifiedAt: '2026-10-14T15:30:00Z',
    verifiedBy: 'Nguyễn Văn An (Chủ nhà)',
    purpose: 'Ký hợp đồng ASIS-04 bước 4.10',
    isValid: true,
    notes: 'Hồ sơ cá nhân không thay đổi, chỉ đối chiếu điều kiện định danh ký hợp đồng '
  }
];

export const INITIAL_TENANT_HISTORY: TenantHistoryEntry[] = [
  {
    id: 'th_01',
    tenantId: 'ten_01',
    action: 'Ghi nhận hồ sơ khách mới ',
    timestamp: '2026-08-25T09:00:00Z',
    performedBy: 'Nguyễn Văn An (Chủ nhà)',
    newValues: 'Khách: Trần Văn Bình, SĐT: 0912345678, CCCD: 001095012345. Đã đối chiếu không trùng.',
    sourceModule: 'Tạo hồ sơ khách thuê'
  },
  {
    id: 'th_02',
    tenantId: 'ten_05',
    action: 'Thêm người ở cùng Đang cư trú ',
    timestamp: '2026-07-01T08:30:00Z',
    performedBy: 'Nguyễn Văn An (Chủ nhà)',
    relatedLeaseId: 'THUE-301-L1',
    relatedContractId: 'HD-301-2026',
    newValues: 'Người ở cùng: Nguyễn Thị Hương (Vợ) & Hoàng Bảo Nam (Con), ngày đến thực tế: 2026-07-01',
    evidence: 'Đã khai báo tạm trú công an phường',
    sourceModule: 'Người ở cùng'
  },
  {
    id: 'th_03',
    tenantId: 'ten_01',
    action: 'Kiểm tra thông tin thay đổi đạt ',
    timestamp: '2026-10-15T10:00:00Z',
    performedBy: 'Nguyễn Văn An (Chủ nhà)',
    newValues: 'Bộ dữ liệu BDL-2026-001: Địa chỉ mới = Số 12 đường Hoàng Cương, TT. Phù Cừ, Hưng Yên. Kết quả: Đạt.',
    evidence: 'Bản chụp sổ hộ khẩu/CCCD mới',
    sourceModule: 'Kiểm tra thay đổi'
  },
  {
    id: 'th_04',
    tenantId: 'ten_02',
    action: 'Xác nhận trả phòng & kết thúc cư trú (ASIS-03 3.14)',
    timestamp: '2026-10-15T16:00:00Z',
    performedBy: 'Nguyễn Văn An (Chủ nhà)',
    relatedLeaseId: 'THUE-102-L1',
    relatedContractId: 'HD-102-2026',
    actualReturnDate: '2026-10-15',
    actualLeaseEndDate: '2026-10-15',
    handoverReturnStatus: 'Đã liên kết phiên bản cuối',
    handoverVersion: 'BG11-102-v1.0',
    newValues: 'Phòng P.102: Khách trả phòng thực tế ngày 15/10/2026. Lần thuê và cư trú đồng bộ đóng ngày 15/10/2026.',
    evidence: 'Biên bản bàn giao trả phòng BB-TR-102 đã ký đầy đủ',
    sourceModule: 'Người ở cùng'
  }
];

export const INITIAL_CONTRACTS: Contract[] = [
  {
    id: 'HD-101-2026',
    contractType: 'Hợp đồng lần đầu',
    leaseId: 'THUE-101-L1',
    roomCode: 'P.101',
    tenantId: 'ten_01',
    tenantName: 'Trần Văn Bình',
    batchCode: 'DOT-2026-K09',
    startDate: '2026-09-01',
    endDate: '2027-03-01',
    signedDate: '2026-08-30',
    actualCheckInDate: '2026-09-01',
    monthlyRent: 3500000,
    depositAmount: 3500000,
    firstMonthRentAmount: 3500000,
    firstMonthRentPaid: true,
    paymentMethod: 'Chuyển khoản',
    terms: 'Hợp đồng thuê căn hộ mini 6 tháng, thanh toán hàng tháng qua ngân hàng.',
    status: 'Hiệu lực',
    isSignedPaper: true,
    initialDepositCode: 'COC-101-L1',
    version: 1
  },
  {
    id: 'HD-102-2026',
    contractType: 'Hợp đồng lần đầu',
    leaseId: 'THUE-102-L1',
    roomCode: 'P.102',
    tenantId: 'ten_02',
    tenantName: 'Lê Thị Cúc',
    batchCode: 'DOT-2026-K05',
    startDate: '2026-05-01',
    endDate: '2026-11-01',
    signedDate: '2026-04-28',
    actualCheckInDate: '2026-05-01',
    monthlyRent: 3800000,
    depositAmount: 3800000,
    firstMonthRentAmount: 3800000,
    firstMonthRentPaid: true,
    paymentMethod: 'Chuyển khoản',
    terms: 'Hợp đồng thuê căn hộ mini 6 tháng.',
    status: 'Hiệu lực',
    isSignedPaper: true,
    initialDepositCode: 'COC-102-L1',
    version: 1
  },
  {
    id: 'HD-201-2026',
    contractType: 'Hợp đồng lần đầu',
    leaseId: 'THUE-201-L1',
    roomCode: 'P.201',
    tenantId: 'ten_03',
    tenantName: 'Phạm Hùng Cường',
    batchCode: 'DOT-2026-K08',
    startDate: '2026-08-01',
    endDate: '2027-02-01',
    signedDate: '2026-07-29',
    actualCheckInDate: '2026-08-01',
    monthlyRent: 4000000,
    depositAmount: 4000000,
    firstMonthRentAmount: 4000000,
    firstMonthRentPaid: true,
    paymentMethod: 'Chuyển khoản',
    terms: 'Hợp đồng thuê căn hộ mini 6 tháng.',
    status: 'Hiệu lực',
    isSignedPaper: true,
    initialDepositCode: 'COC-201-L1',
    version: 1
  },
  {
    id: 'HD-203-2026',
    contractType: 'Hợp đồng lần đầu',
    leaseId: 'THUE-203-L1',
    roomCode: 'P.203',
    tenantId: 'ten_04',
    tenantName: 'Võ Thị Hồng',
    batchCode: 'DOT-2026-K04',
    startDate: '2026-04-15',
    endDate: '2026-10-28', // Còn 12 ngày
    signedDate: '2026-04-12',
    actualCheckInDate: '2026-04-15',
    monthlyRent: 3800000,
    depositAmount: 3800000,
    firstMonthRentAmount: 3800000,
    firstMonthRentPaid: true,
    paymentMethod: 'Chuyển khoản',
    terms: 'Hợp đồng thuê căn hộ mini 6 tháng.',
    status: 'Hiệu lực',
    isSignedPaper: true,
    initialDepositCode: 'COC-203-L1',
    version: 1
  },
  {
    id: 'HD-303-2026',
    contractType: 'Hợp đồng lần đầu',
    leaseId: 'THUE-303-L1',
    roomCode: 'P.303',
    tenantId: 'ten_10',
    tenantName: 'Nguyễn Quang Khải',
    batchCode: 'DOT-2026-K10',
    startDate: '2026-10-18',
    endDate: '2027-04-18',
    signedDate: '2026-10-15',
    monthlyRent: 3700000,
    depositAmount: 3700000,
    firstMonthRentAmount: 3700000,
    firstMonthRentPaid: true, // Đã nộp đủ 1 cọc 1 thuê tại PH-07
    paymentMethod: 'Chuyển khoản',
    terms: 'Hợp đồng thuê phòng 303, đã ký giấy và nộp cọc + tiền thuê tháng đầu.',
    status: 'Chờ hiệu lực',
    isSignedPaper: true,
    initialDepositCode: 'COC-303-L1',
    version: 1
  },
  {
    id: 'HD-202-NHAP',
    contractType: 'Hợp đồng lần đầu',
    requestCode: 'YCTN-2026-003',
    leaseId: 'THUE-202-L2',
    roomCode: 'P.202',
    tenantId: 'ten_03',
    tenantName: 'Đoàn Minh Nhật',
    tenantPhone: '0944556677',
    batchCode: 'DOT-2026-K11',
    startDate: '2026-11-01',
    endDate: '2027-05-01',
    monthlyRent: 3600000,
    depositAmount: 3600000,
    firstMonthRentAmount: 3600000,
    firstMonthRentPaid: false,
    paymentMethod: 'Chuyển khoản',
    terms: 'Hợp đồng dự thảo theo đợt DOT-2026-K11, thanh toán chuyển khoản định kỳ.',
    status: 'Nháp',
    isSignedPaper: false,
    version: 1,
    createdAt: '2026-10-16T10:00:00Z',
    createdBy: 'Nguyễn Văn An (Chủ nhà)'
  },
  {
    id: 'HD-103-KY',
    contractType: 'Hợp đồng lần đầu',
    requestCode: 'YCTN-2026-002',
    leaseId: 'THUE-103-L1',
    roomCode: 'P.103',
    tenantId: 'ten_10',
    tenantName: 'Vũ Đình Toàn',
    tenantPhone: '0915667788',
    batchCode: 'DOT-2026-K10',
    startDate: '2026-10-20',
    endDate: '2027-04-20',
    monthlyRent: 3200000,
    depositAmount: 3200000,
    firstMonthRentAmount: 3200000,
    firstMonthRentPaid: false,
    paymentMethod: 'Chuyển khoản',
    terms: 'Hợp đồng thuê căn hộ mini P.103, thanh toán chuyển khoản ngày 25-30 hàng tháng.',
    status: 'Chờ khách ký',
    isSignedPaper: false,
    sentToTenantDate: '2026-10-15',
    version: 1,
    createdAt: '2026-10-15T16:30:00Z',
    createdBy: 'Nguyễn Văn An (Chủ nhà)'
  },
  {
    id: 'HD-102-GIAHAN',
    contractType: 'Hợp đồng nối tiếp',
    leaseId: 'THUE-102-L1',
    roomCode: 'P.102',
    tenantId: 'ten_02',
    tenantName: 'Lê Thị Cúc',
    tenantPhone: '0912345678',
    batchCode: 'DOT-2026-K11',
    startDate: '2026-11-01',
    endDate: '2027-05-01',
    monthlyRent: 3900000,
    depositAmount: 3800000, // Kế thừa cọc gốc 3.8tr
    firstMonthRentAmount: 3900000,
    firstMonthRentPaid: true,
    paymentMethod: 'Chuyển khoản',
    terms: 'Hợp đồng gia hạn nối tiếp tiếp tục thuê P.102, kế thừa khoản cọc gốc ban đầu.',
    status: 'Nháp',
    isSignedPaper: false,
    previousContractId: 'HD-102-2026',
    initialDepositCode: 'COC-102-L1',
    version: 1,
    createdAt: '2026-10-16T08:00:00Z',
    createdBy: 'Nguyễn Văn An (Chủ nhà)'
  }
];

export const INITIAL_INVENTORY_RECORDS: InventoryRecord[] = [
  {
    id: 'inv_103',
    roomCode: 'P.103',
    expectedBatchCode: 'DOT-2026-K10',
    version: 1,
    inventoryStatus: 'Đã hoàn tất',
    linkStatus: 'Chưa liên kết', // Kiểm kê chuẩn bị trước khi ký hợp đồng (AF-01 / BR-UC.BG.01-07)
    items: INITIAL_STANDARD_ASSETS.map((ast, idx) => ({
      id: `inv_item_103_${idx}`,
      assetId: ast.id,
      name: ast.name,
      unit: ast.unit,
      standardQuantity: ast.standardQuantity,
      actualQuantity: ast.standardQuantity,
      quantityDiff: 'Đủ',
      physicalCondition: 'Bình thường'
    })),
    completedAt: '2026-10-10T10:00:00Z',
    completedBy: 'Nguyễn Văn An'
  },
  {
    id: 'inv_303',
    roomCode: 'P.303',
    expectedBatchCode: 'DOT-2026-K10',
    version: 1,
    inventoryStatus: 'Đã hoàn tất',
    linkStatus: 'Đã liên kết',
    linkedContractId: 'HD-303-2026',
    linkedLeaseId: 'THUE-303-L1',
    items: INITIAL_STANDARD_ASSETS.map((ast, idx) => ({
      id: `inv_item_303_${idx}`,
      assetId: ast.id,
      name: ast.name,
      unit: ast.unit,
      standardQuantity: ast.standardQuantity,
      actualQuantity: ast.standardQuantity,
      quantityDiff: 'Đủ',
      physicalCondition: 'Bình thường'
    })),
    completedAt: '2026-10-15T09:00:00Z',
    completedBy: 'Nguyễn Văn An'
  }
];

export const INITIAL_HANDOVER_CONDITIONS: HandoverCondition[] = [
  {
    id: 'hc_101',
    roomCode: 'P.101',
    expectedBatchCode: 'DOT-2026-K09',
    linkedContractId: 'HD-101-2026',
    linkedLeaseId: 'THUE-101-L1',
    status: 'Đã hoàn tất',
    scope: 'Hiện trạng chung của phòng',
    description: 'Phòng sạch sẽ, sơn tường mới, sàn gạch men không trầy xước, cửa sổ và rèm che hoạt động trơn tru.',
    photos: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&auto=format&fit=crop'],
    initialElectricityKwh: 1250,
    initialWaterM3: 45,
    meterElectricCode: 'CT-D-101',
    meterWaterCode: 'CT-N-101',
    meterPhotos: ['https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=500&auto=format&fit=crop'],
    tenantChecked: true,
    tenantCheckNote: 'Khách đã kiểm tra thực tế, không có ý kiến bổ sung',
    tenantCheckSupplement: 'Không cần bổ sung',
    evidenceStatus: 'Đã đính kèm',
    handoverDoneAt: '2026-09-01T08:30:00Z',
    loggedBy: 'Nguyễn Văn An',
    version: 1
  },
  {
    id: 'hc_303',
    roomCode: 'P.303',
    expectedBatchCode: 'DOT-2026-K10',
    linkedContractId: 'HD-303-2026',
    linkedLeaseId: 'THUE-303-L1',
    status: 'Đã hoàn tất',
    scope: 'Hiện trạng chung của phòng',
    description: 'Phòng đầy đủ nội thất, đã vệ sinh trước khi giao, các thiết bị điện tử hoạt động tốt.',
    photos: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500&auto=format&fit=crop'],
    initialElectricityKwh: 3410,
    initialWaterM3: 120,
    meterElectricCode: 'CT-D-303',
    meterWaterCode: 'CT-N-303',
    meterPhotos: ['https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=500&auto=format&fit=crop'],
    tenantChecked: true,
    tenantCheckNote: 'Khách đã kiểm tra thực tế và xác nhận chỉ số đồng hồ',
    tenantCheckSupplement: 'Không cần bổ sung',
    evidenceStatus: 'Đã đính kèm',
    handoverDoneAt: '2026-10-16T08:00:00Z',
    loggedBy: 'Nguyễn Văn An',
    version: 1
  }
];

export const INITIAL_HANDOVER_REPORTS: HandoverReport[] = [
  {
    id: 'bb_101',
    reportNumber: 'BB-101-2026',
    roomCode: 'P.101',
    contractId: 'HD-101-2026',
    leaseId: 'THUE-101-L1',
    date: '2026-09-01',
    giverName: 'Nguyễn Văn An',
    receiverName: 'Trần Văn Bình',
    status: 'Đã xác nhận',
    tenantSignedPaper: 'Đã ký giấy',
    ownerSignedPaper: 'Đã ký giấy',
    paperLocation: 'Tủ hồ sơ Tầng 1 - Kẹp P101',
    version: 1,
    createdAt: '2026-09-01T08:30:00Z',
    confirmedAt: '2026-09-01T09:00:00Z',
    initialElectricityKwh: 1250,
    initialWaterM3: 45
  },
  {
    id: 'bb_303',
    reportNumber: 'BB-303-2026',
    roomCode: 'P.303',
    contractId: 'HD-303-2026',
    leaseId: 'THUE-303-L1',
    date: '2026-10-16',
    giverName: 'Nguyễn Văn An',
    receiverName: 'Nguyễn Quang Khải',
    status: 'Đã lập', // Đã lập ở 1.06, chuẩn bị ký giấy ở 1.07-1.08
    tenantSignedPaper: 'Chưa ký',
    ownerSignedPaper: 'Chưa ký',
    version: 1,
    createdAt: '2026-10-16T08:00:00Z',
    initialElectricityKwh: 3410,
    initialWaterM3: 120
  }
];

export const INITIAL_INCIDENTS: AssetIncident[] = [
  {
    id: 'inc_201_1',
    roomCode: 'P.201',
    leaseId: 'THUE-201-L1',
    scope: 'Tài sản cụ thể',
    assetName: 'Điều hòa Daikin 9000 BTU Inverter',
    occurredAt: '2026-10-12T19:00:00',
    description: 'Điều hòa chảy nước ở máng xối dàn lạnh xuống sàn gỗ',
    cause: 'Tắc ống thoát nước do bụi bẩn sau thời gian dài sử dụng',
    responsibilityStatus: 'Đã xác định',
    responsibilityNote: 'Hao mòn tự nhiên, thuộc trách nhiệm bảo trì định kỳ của chủ nhà',
    processingStatus: 'Đang xử lý',
    solutionPlan: 'Gọi thợ bảo dưỡng thông ống xả và nạp gas vào sáng 17/10',
    estimatedCompensation: 250000,
    photos: [],
    loggedBy: 'Nguyễn Văn An',
    loggedAt: '2026-10-13T08:00:00Z'
  }
];

export const INITIAL_METER_READINGS: MeterReading[] = [
  {
    id: 'mr_101_k10',
    roomCode: 'P.101',
    leaseId: 'THUE-101-L1',
    periodCode: 'Kỳ 10/2026',
    readingType: 'Theo kỳ chung',
    readingDate: '2026-10-01',
    electricMeterCode: 'CT-D-101',
    initialElectricKwh: 1250,
    finalElectricKwh: 1370, // 120 kWh
    waterMeterCode: 'CT-N-101',
    initialWaterM3: 45,
    finalWaterM3: 51, // 6 m3
    isAbnormal: false,
    status: 'Đã xác nhận',
    pendingVerificationFlag: false,
    needsRecalculateFlag: false
  },
  {
    id: 'mr_401_k10',
    roomCode: 'P.401',
    leaseId: 'THUE-401-L1',
    periodCode: 'Kỳ 10/2026',
    readingType: 'Theo kỳ chung',
    readingDate: '2026-10-01',
    electricMeterCode: 'CT-D-401',
    initialElectricKwh: 9980,
    finalElectricKwh: 45, // Quay vòng qua 9999
    waterMeterCode: 'CT-N-401',
    initialWaterM3: 88,
    finalWaterM3: 93,
    isAbnormal: true,
    abnormalReason: 'Quay vòng',
    verifiedElectricKwh: 65, // Sản lượng đã xác minh thực tế: (10000 - 9980) + 45 = 65 kWh
    verifiedWaterM3: 5,
    abnormalEvidence: 'Ảnh chụp công tơ trước và sau khi quay vòng số',
    status: 'Đã xác nhận',
    pendingVerificationFlag: false,
    needsRecalculateFlag: false
  }
];

export const INITIAL_PERIOD_BILLS: PeriodBill[] = [
  {
    id: 'bill_101_k10',
    roomCode: 'P.101',
    leaseId: 'THUE-101-L1',
    periodCode: 'Kỳ 10/2026',
    servicePeriodFrom: '2026-09-01',
    servicePeriodTo: '2026-09-30',
    nextRentPeriodFrom: '2026-10-01',
    nextRentPeriodTo: '2026-10-31',
    nextMonthRentAmount: 3500000,
    electricityUsage: 120,
    electricityRate: 3500,
    electricityAmount: 420000,
    waterUsage: 6,
    waterRate: 30000,
    waterAmount: 180000,
    serviceFees: [
      { name: 'Vệ sinh hành lang & rác thải', amount: 50000 },
      { name: 'Internet cáp quang Wifi tốc độ cao', amount: 100000 },
      { name: 'Điện chiếu sáng chung & thang máy', amount: 50000 },
      { name: 'Bảo dưỡng máy giặt chung sân thượng', amount: 50000 }
    ],
    totalAmount: 4350000, // 3.500.000 + 420.000 + 180.000 + 250.000 = 4.350.000đ
    isConfirmed: true,
    confirmedAt: '2026-10-02T08:00:00Z',
    version: 1
  },
  {
    id: 'bill_201_k10',
    roomCode: 'P.201',
    leaseId: 'THUE-201-L1',
    periodCode: 'Kỳ 10/2026',
    servicePeriodFrom: '2026-09-01',
    servicePeriodTo: '2026-09-30',
    nextRentPeriodFrom: '2026-10-01',
    nextRentPeriodTo: '2026-10-31',
    nextMonthRentAmount: 4000000,
    electricityUsage: 110,
    electricityRate: 3500,
    electricityAmount: 385000,
    waterUsage: 5,
    waterRate: 30000,
    waterAmount: 150000,
    serviceFees: [
      { name: 'Vệ sinh rác thải', amount: 50000 },
      { name: 'Internet cáp quang Wifi', amount: 100000 },
      { name: 'Chiếu sáng thang máy', amount: 50000 }
    ],
    totalAmount: 4735000, // 4.000.000 + 385.000 + 150.000 + 200.000 = 4.735.000đ
    isConfirmed: true,
    confirmedAt: '2026-10-03T09:00:00Z',
    version: 1
  },
  {
    id: 'bill_203_k10',
    roomCode: 'P.203',
    leaseId: 'THUE-203-L1',
    periodCode: 'Kỳ 10/2026',
    servicePeriodFrom: '2026-09-01',
    servicePeriodTo: '2026-09-30',
    nextRentPeriodFrom: '2026-10-01',
    nextRentPeriodTo: '2026-10-28',
    isRentPeriodEnded: true, // Khách trả phòng ngày 28/10, không sinh tiền thuê tháng mới (BR-UC07.1-04, BR-UC07.1-07)
    nextMonthRentAmount: 0,
    electricityUsage: 65,
    electricityRate: 3500,
    electricityAmount: 227500,
    waterUsage: 3,
    waterRate: 30000,
    waterAmount: 90000,
    serviceFees: [
      { name: 'Vệ sinh rác thải', amount: 50000 },
      { name: 'Internet cáp quang Wifi', amount: 100000 }
    ],
    totalAmount: 467500, // 0 + 227.500 + 90.000 + 150.000 = 467.500đ
    isConfirmed: true,
    confirmedAt: '2026-10-04T10:00:00Z',
    version: 1
  },
  {
    id: 'bill_302_k10',
    roomCode: 'P.302',
    leaseId: 'THUE-302-L1',
    periodCode: 'Kỳ 10/2026',
    servicePeriodFrom: '2026-09-01',
    servicePeriodTo: '2026-09-30',
    nextRentPeriodFrom: '2026-10-01',
    nextRentPeriodTo: '2026-10-31',
    nextMonthRentAmount: 3800000,
    electricityUsage: 95,
    electricityRate: 3500,
    electricityAmount: 332500,
    waterUsage: 4,
    waterRate: 30000,
    waterAmount: 120000,
    serviceFees: [
      { name: 'Vệ sinh rác thải', amount: 50000 },
      { name: 'Internet cáp quang Wifi', amount: 100000 },
      { name: 'Chiếu sáng thang máy', amount: 50000 }
    ],
    totalAmount: 4452500, // 3.800.000 + 332.500 + 120.000 + 200.000 = 4.452.500đ (KHÔNG CỘNG NỢ CŨ 4.150.000đ từ Kỳ 09)
    isConfirmed: true,
    confirmedAt: '2026-10-05T11:00:00Z',
    version: 1
  },
  {
    id: 'bill_102_k10',
    roomCode: 'P.102',
    leaseId: 'THUE-102-L1',
    periodCode: 'Kỳ 10/2026',
    servicePeriodFrom: '2026-10-01',
    servicePeriodTo: '2026-10-15',
    nextRentPeriodFrom: '2026-10-16',
    nextRentPeriodTo: '2026-10-31',
    isRentPeriodEnded: true,
    nextMonthRentAmount: 0,
    electricityUsage: 45,
    electricityRate: 3500,
    electricityAmount: 157500,
    waterUsage: 2,
    waterRate: 30000,
    waterAmount: 60000,
    serviceFees: [
      { name: 'Vệ sinh rác thải', amount: 50000 },
      { name: 'Internet cáp quang Wifi', amount: 100000 },
      { name: 'Chiếu sáng thang máy', amount: 50000 }
    ],
    totalAmount: 417500,
    isConfirmed: true,
    confirmedAt: '2026-10-15T15:30:00Z',
    version: 1
  },
  {
    id: 'bill_202_k10',
    roomCode: 'P.202',
    leaseId: 'THUE-202-L1',
    periodCode: 'Kỳ 10/2026',
    servicePeriodFrom: '2026-10-01',
    servicePeriodTo: '2026-10-15',
    nextRentPeriodFrom: '2026-10-16',
    nextRentPeriodTo: '2026-10-31',
    isRentPeriodEnded: true,
    nextMonthRentAmount: 0,
    electricityUsage: 50,
    electricityRate: 3500,
    electricityAmount: 175000,
    waterUsage: 2.5,
    waterRate: 30000,
    waterAmount: 75000,
    serviceFees: [
      { name: 'Vệ sinh rác thải', amount: 50000 },
      { name: 'Internet cáp quang Wifi', amount: 100000 },
      { name: 'Chiếu sáng thang máy', amount: 50000 }
    ],
    totalAmount: 450000,
    isConfirmed: true,
    confirmedAt: '2026-10-15T16:00:00Z',
    version: 1
  }
];

export const INITIAL_PAYMENT_NOTICES: PaymentNotice[] = [
  {
    id: 'not_101_k10',
    noticeCode: 'TB-101-2026-10',
    roomCode: 'P.101',
    leaseId: 'THUE-101-L1',
    periodCode: 'Kỳ 10/2026',
    servicePeriod: '01/09/2026 - 30/09/2026',
    nextRentPeriod: '01/10/2026 - 31/10/2026',
    dueDate: '2026-10-05',
    originalDueDate: '2026-10-05',
    totalAmount: 4350000,
    status: 'Đang hiệu lực',
    paymentStatus: 'Đã thu', // Đã thu
    breakdown: {
      nextRentAmount: 3500000,
      nextRentPeriodFrom: '2026-10-01',
      nextRentPeriodTo: '2026-10-31',
      electricityAmount: 420000,
      electricityUsage: 120,
      electricityRate: 3500,
      waterAmount: 180000,
      waterUsage: 6,
      waterRate: 30000,
      serviceFees: [
        { name: 'Vệ sinh hành lang & rác thải', amount: 50000 },
        { name: 'Internet cáp quang Wifi tốc độ cao', amount: 100000 },
        { name: 'Điện chiếu sáng chung & thang máy', amount: 50000 },
        { name: 'Bảo dưỡng máy giặt chung sân thượng', amount: 50000 }
      ]
    },
    qrBankSnapshot: {
      bankName: 'MB Bank',
      accountNumber: '0988123456',
      accountHolder: 'NGUYEN VAN AN',
      transferContent: 'P101 TIEN NHA KY 10',
      amount: 4350000
    },
    createdAt: '2026-10-02T09:00:00Z'
  },
  {
    id: 'not_201_k10_old',
    noticeCode: 'TB-201-2026-10-V1',
    roomCode: 'P.201',
    leaseId: 'THUE-201-L1',
    periodCode: 'Kỳ 10/2026',
    servicePeriod: '01/09/2026 - 30/09/2026',
    nextRentPeriod: '01/10/2026 - 31/10/2026',
    dueDate: '2026-10-08',
    originalDueDate: '2026-10-08',
    totalAmount: 4700000,
    status: 'Đã thay thế', // Bản cũ bị thay thế
    paymentStatus: 'Chưa thu',
    replacedByNoticeId: 'not_201_k10',
    breakdown: {
      nextRentAmount: 4000000,
      nextRentPeriodFrom: '2026-10-01',
      nextRentPeriodTo: '2026-10-31',
      electricityAmount: 350000,
      waterAmount: 150000,
      serviceFees: [{ name: 'Phí dịch vụ', amount: 200000 }]
    },
    qrBankSnapshot: {
      bankName: 'MB Bank',
      accountNumber: '0988123456',
      accountHolder: 'NGUYEN VAN AN',
      transferContent: 'P201 TIEN NHA KY 10',
      amount: 4700000
    },
    createdAt: '2026-10-03T10:00:00Z'
  },
  {
    id: 'not_201_k10',
    noticeCode: 'TB-201-2026-10-R',
    roomCode: 'P.201',
    leaseId: 'THUE-201-L1',
    periodCode: 'Kỳ 10/2026',
    servicePeriod: '01/09/2026 - 30/09/2026',
    nextRentPeriod: '01/10/2026 - 31/10/2026',
    dueDate: '2026-10-08', // Giữ nguyên hạn gốc ban đầu của V1 kể cả khi thay thế (BR-UC07.2-05)
    originalDueDate: '2026-10-08',
    totalAmount: 4735000,
    status: 'Đang hiệu lực',
    paymentStatus: 'Chưa thu',
    replacedNoticeId: 'not_201_k10_old',
    breakdown: {
      nextRentAmount: 4000000,
      nextRentPeriodFrom: '2026-10-01',
      nextRentPeriodTo: '2026-10-31',
      electricityAmount: 385000,
      electricityUsage: 110,
      electricityRate: 3500,
      waterAmount: 150000,
      waterUsage: 5,
      waterRate: 30000,
      serviceFees: [
        { name: 'Vệ sinh rác thải', amount: 50000 },
        { name: 'Internet cáp quang Wifi', amount: 100000 },
        { name: 'Chiếu sáng thang máy', amount: 50000 }
      ]
    },
    qrBankSnapshot: {
      bankName: 'MB Bank',
      accountNumber: '0988123456',
      accountHolder: 'NGUYEN VAN AN',
      transferContent: 'P201 TIEN NHA KY 10',
      amount: 4735000
    },
    createdAt: '2026-10-04T14:00:00Z'
  },
  {
    id: 'not_302_k09',
    noticeCode: 'TB-302-2026-09',
    roomCode: 'P.302',
    leaseId: 'THUE-302-L1',
    periodCode: 'Kỳ 09/2026',
    servicePeriod: '01/08/2026 - 31/08/2026',
    nextRentPeriod: '01/09/2026 - 30/09/2026',
    dueDate: '2026-09-05', // Quá hạn hơn 40 ngày (BR-UC08.1-01: Quá hạn là cảnh báo khi Chưa thu)
    originalDueDate: '2026-09-05',
    totalAmount: 4150000,
    status: 'Đang hiệu lực',
    paymentStatus: 'Chưa thu', // Quá hạn -> xuất hiện ở UC08.1 với nhãn Quá hạn
    breakdown: {
      nextRentAmount: 3500000,
      nextRentPeriodFrom: '2026-09-01',
      nextRentPeriodTo: '2026-09-30',
      electricityAmount: 350000,
      waterAmount: 100000,
      serviceFees: [
        { name: 'Phí dịch vụ chung & rác', amount: 200000 }
      ]
    },
    qrBankSnapshot: {
      bankName: 'MB Bank',
      accountNumber: '0988123456',
      accountHolder: 'NGUYEN VAN AN',
      transferContent: 'P302 TIEN NHA KY 09',
      amount: 4150000
    },
    createdAt: '2026-09-01T09:00:00Z'
  }
];

export const INITIAL_PAYMENT_RECEIPTS: PaymentReceipt[] = [
  {
    id: 'rcp_101_k10',
    noticeId: 'not_101_k10',
    roomCode: 'P.101',
    leaseId: 'THUE-101-L1',
    periodCode: 'Kỳ 10/2026',
    amountReceived: 4350000,
    receivedDate: '2026-10-04',
    transactionCode: 'FT2610049988123',
    bankAccountReceived: 'MB Bank - 0988123456',
    proofFile: 'anh_chuyen_khoan_mb_101.jpg',
    status: 'Đang hiệu lực',
    confirmedBy: 'Nguyễn Văn An',
    confirmedAt: '2026-10-04T14:20:00Z',
    auditHistory: [
      {
        action: 'Tạo chứng từ thu',
        timestamp: '2026-10-04T14:20:00Z',
        user: 'Nguyễn Văn An (Chủ nhà)',
        transactionCode: 'FT2610049988123',
        amount: 4350000,
        newStatus: 'Đang hiệu lực',
        details: 'Xác nhận thu đủ 4.350.000 đ qua chuyển khoản MB Bank khớp mã TB-101-2026-10'
      }
    ]
  }
];

export const INITIAL_DEBT_REMINDERS: DebtHistoryReminder[] = [
  {
    id: 'rmd_302_1',
    noticeId: 'not_302_k09',
    roomCode: 'P.302',
    leaseId: 'THUE-302-L1',
    contactDate: '2026-09-10',
    channel: 'Zalo',
    result: 'Khách xem tin nhắn nhưng chưa thanh toán, hẹn sang tuần',
    notes: 'Liên hệ qua số Zalo 0965443322',
    loggedBy: 'Nguyễn Văn An',
    loggedAt: '2026-09-10T10:00:00Z'
  },
  {
    id: 'rmd_302_2',
    noticeId: 'not_302_k09',
    roomCode: 'P.302',
    leaseId: 'THUE-302-L1',
    contactDate: '2026-09-20',
    channel: 'Điện thoại',
    result: 'Khách báo công ty chậm lương, xin gia hạn thanh toán',
    notes: 'Cuộc gọi kéo dài 2 phút',
    loggedBy: 'Nguyễn Văn An',
    loggedAt: '2026-09-20T15:30:00Z'
  }
];

export const INITIAL_DEBT_PROMISES: DebtPromise[] = [
  {
    id: 'prm_302_1',
    noticeId: 'not_302_k09',
    roomCode: 'P.302',
    contactTime: '2026-09-20T15:30:00',
    channel: 'Điện thoại',
    content: 'Khách cam kết khi công ty trả lương vào 25/09 sẽ chuyển khoản đủ 4.150.000đ',
    hasPromiseDate: true,
    promisedDate: '2026-09-25',
    loggedBy: 'Nguyễn Văn An',
    loggedAt: '2026-09-20T15:35:00Z'
  }
];

export const INITIAL_RETURN_INSPECTIONS: ReturnInspection[] = [
  {
    id: 'ret_202',
    roomCode: 'P.202',
    leaseId: 'THUE-202-L1',
    inspectionDate: '2026-10-15',
    step304Status: 'Đã nhận lại',
    step305Confirmed: true, // Chủ nhà đã xác nhận độc lập ở 3.05
    step305ConfirmedAt: '2026-10-15T16:00:00Z',
    step305ConfirmedBy: 'Nguyễn Văn An',
    step305Evidence: 'Khách đã giao chìa khóa và ký biên nhận bàn giao phòng tại sảnh',
    finalElectricityKwh: 2890,
    finalWaterM3: 98,
    assetsCheckedFully: true,
    version: 1,
    items: INITIAL_STANDARD_ASSETS.map((ast) => ({
      name: ast.name,
      inspected: true,
      quantity: ast.standardQuantity,
      condition: 'Bình thường'
    }))
  },
  {
    id: 'ret_102',
    roomCode: 'P.102',
    leaseId: 'THUE-102-L1',
    contractId: 'HD-102-GIAHAN',
    inspectionDate: '2026-10-15',
    step304Status: 'Đã nhận lại',
    step305Confirmed: true, // Đã nhận lại phòng thực tế theo ASIS-02/3.05
    step305ConfirmedAt: '2026-10-15T15:30:00Z',
    step305ConfirmedBy: 'Nguyễn Văn An',
    step305Evidence: 'Khách Lê Thị Cúc đã bàn giao đủ 2 chìa khóa + thẻ từ, ký xác nhận trả phòng 15/10/2026',
    finalElectricityKwh: 1850,
    finalWaterM3: 65,
    assetsCheckedFully: true,
    version: 1,
    items: INITIAL_STANDARD_ASSETS.map((ast) => ({
      name: ast.name,
      inspected: true,
      quantity: ast.standardQuantity,
      condition: 'Bình thường'
    }))
  },
  {
    id: 'ret_203',
    roomCode: 'P.203',
    leaseId: 'THUE-203-L1',
    contractId: 'HD-203-2026',
    inspectionDate: '2026-10-16',
    step304Status: 'Đã nhận lại',
    step305Confirmed: true, // Đã nhận lại thực tế
    step305ConfirmedAt: '2026-10-16T10:00:00Z',
    step305ConfirmedBy: 'Nguyễn Văn An',
    step305Evidence: 'Khách Võ Thị Hồng trả phòng trước hạn, bàn giao chìa khóa ngày 16/10/2026',
    finalElectricityKwh: 2210,
    finalWaterM3: 78,
    assetsCheckedFully: true,
    version: 1,
    items: INITIAL_STANDARD_ASSETS.map((ast) => ({
      name: ast.name,
      inspected: true,
      quantity: ast.standardQuantity,
      condition: 'Bình thường'
    }))
  }
];

export const INITIAL_SETTLEMENT_SLIPS: DepositSettlementSlip[] = [
  {
    id: 'QTC-202-2026',
    roomCode: 'P.202',
    leaseId: 'THUE-202-L1',
    contractChain: ['HD-202-2026'],
    initialContractId: 'HD-202-2026',
    initialDepositAmount: 3800000,
    initialDepositCode: 'COC-202-L1',
    handoverReturnDate: '2026-10-15',
    actualReturnDate: '2026-10-15',
    bg07Ref: 'BG07-202-2026',
    bg07Linked: true,
    finalBillId: 'bill_202_k10',
    finalBillPeriod: 'Kỳ 10/2026',
    finalBillConfirmed: true,
    prepaidRentAmount: 3800000,
    deductions: [
      {
        id: 'ded_1',
        category: 'Điện nước dịch vụ kỳ cuối',
        description: 'Điện nước và phí dịch vụ kỳ cuối đến ngày nhận lại 15/10/2026',
        amount: 450000,
        reason: 'Theo bảng tính kỳ cuối TT-03 đã xác nhận'
      }
    ],
    calculatedResult: 3350000, // 3.800.000 - 450.000 = 3.350.000đ (Hoàn cọc)
    calculationStatus: 'Đã tính',
    status: 'Khách đồng ý', // Đang ở bước sẵn sàng hoàn cọc qua UC-QTC-03
    version: 1,
    reviewRequired: false,
    tenantFeedback: 'Đồng ý',
    tenantAgreementEvidence: {
      schemeVersion: 1,
      agreedAmount: 3350000,
      evidenceFile: 'zalo_xac_nhan_le_van_dat.jpg',
      evidenceNote: 'Khách Lê Văn Đạt xác nhận qua Zalo: đồng ý phương án nhận lại 3.350.000đ vào tài khoản Vietcombank 1012345678',
      agreedAt: '2026-10-15T17:00:00Z',
      agreedBy: 'Nguyễn Văn An (Chủ nhà)'
    },
    contactLogs: [
      {
        id: 'cl_202_1',
        contactTime: '2026-10-15 17:00',
        channel: 'Zalo',
        contactPerson: 'Khách thuê Lê Văn Đạt',
        content: 'Thông báo phương án quyết toán cọc v1: Cọc gốc 3.800.000đ trừ 450.000đ điện nước dịch vụ kỳ cuối, hoàn trả 3.350.000đ.',
        result: 'Đồng ý',
        evidence: 'Ảnh chụp màn hình tin nhắn Zalo khách xác nhận số tài khoản nhận hoàn cọc',
        schemeVersion: 1,
        loggedBy: 'Nguyễn Văn An'
      }
    ],
    step58Published: false,
    auditHistory: [
      {
        timestamp: '2026-10-15 16:30',
        user: 'Nguyễn Văn An',
        action: 'Lập phiếu quyết toán cọc ',
        schemeVersion: 1,
        note: 'Khởi tạo phương án cọc gốc 3.800.000đ, trừ tiền kỳ cuối 450.000đ'
      },
      {
        timestamp: '2026-10-15 17:10',
        user: 'Nguyễn Văn An',
        action: 'Ghi nhận khách đồng ý ',
        schemeVersion: 1,
        note: 'Khách xác nhận đồng ý nhận hoàn cọc 3.350.000đ qua Vietcombank'
      }
    ],
    createdAt: '2026-10-15T16:30:00Z',
    updatedAt: '2026-10-15T17:10:00Z'
  },
  {
    id: 'QTC-302-2026',
    roomCode: 'P.302',
    leaseId: 'THUE-302-L1',
    contractChain: ['HD-302-2026'],
    initialContractId: 'HD-302-2026',
    initialDepositAmount: 3800000,
    initialDepositCode: 'COC-302-L1',
    handoverReturnDate: '2026-10-14',
    actualReturnDate: '2026-10-14',
    finalBillId: 'bill_302_k10',
    finalBillPeriod: 'Kỳ 10/2026',
    finalBillConfirmed: true,
    prepaidRentAmount: 3800000,
    deductions: [
      {
        id: 'ded_302_1',
        category: 'Công nợ kỳ trước',
        description: 'Tiền nhà nợ kỳ 09/2026 quá hạn ',
        amount: 4150000,
        reason: 'Thông báo nợ TB-302-2026-09 chưa thanh toán'
      },
      {
        id: 'ded_302_2',
        category: 'Thiệt hại tài sản',
        description: 'Bồi thường hư hỏng cửa kính ban công theo BG07',
        amount: 800000,
        reason: 'Cửa kính bị nứt vỡ theo biên bản BG07'
      }
    ],
    calculatedResult: -1150000, // 3.800.000 - 4.950.000 = -1.150.000đ (Thu thêm)
    calculationStatus: 'Đã tính',
    status: 'Tranh chấp', // Đang tranh chấp (để kiểm thử AF-03 mở lại phiếu tranh chấp)
    version: 1,
    reviewRequired: false,
    tenantFeedback: 'Không đồng ý',
    disputeReason: 'Khách không đồng ý bồi thường 800.000đ cửa kính, cho rằng do giông bão hao mòn',
    disputeItems: 'Khoản khấu trừ thiệt hại tài sản 800.000đ',
    disputeBasis: 'Ảnh chụp hiện trạng BG07 và hợp đồng thuê điều 5',
    disputeLocked: true,
    contactLogs: [
      {
        id: 'cl_302_1',
        contactTime: '2026-10-14 18:00',
        channel: 'Điện thoại',
        contactPerson: 'Hoàng Minh Tuấn',
        content: 'Thông báo phương án quyết toán thu thêm 1.150.000đ do nợ kỳ 09 và đền cửa kính',
        result: 'Không đồng ý',
        evidence: 'Ghi âm cuộc gọi khách phản đối khoản đền cửa kính',
        schemeVersion: 1,
        loggedBy: 'Nguyễn Văn An'
      }
    ],
    step58Published: false,
    auditHistory: [
      {
        timestamp: '2026-10-14 17:00',
        user: 'Nguyễn Văn An',
        action: 'Lập phiếu quyết toán cọc ',
        schemeVersion: 1,
        note: 'Phương án ban đầu: Cọc 3.8tr trừ nợ 4.15tr và đền kính 800k'
      },
      {
        timestamp: '2026-10-14 18:30',
        user: 'Nguyễn Văn An',
        action: 'Xác lập tranh chấp',
        schemeVersion: 1,
        note: 'Hai bên chưa thống nhất về chi phí bồi thường cửa kính 800.000đ'
      }
    ],
    createdAt: '2026-10-14T17:00:00Z',
    updatedAt: '2026-10-14T18:30:00Z'
  }
];

export const INITIAL_ROOM_HISTORY: RoomHistoryLog[] = [
  {
    id: 'rl_init_1',
    roomCode: 'P.101',
    field: 'Khởi tạo phòng',
    oldValue: '—',
    newValue: 'Khởi tạo phòng mới: Tầng 1, 28 m² (Trạng thái: Trống)',
    changedBy: 'Nguyễn Văn An (Chủ nhà)',
    changedAt: '2026-08-15 08:30:00'
  },
  {
    id: 'rl_init_2',
    roomCode: 'P.101',
    field: 'Ghi chú',
    oldValue: 'Phòng ban đầu chưa trang bị thêm tủ lạnh',
    newValue: 'Đã bổ sung tủ lạnh mini và bàn làm việc',
    changedBy: 'Nguyễn Văn An (Chủ nhà)',
    changedAt: '2026-08-20 14:15:00'
  },
  {
    id: 'rl_init_3',
    roomCode: 'P.102',
    field: 'Khởi tạo phòng',
    oldValue: '—',
    newValue: 'Khởi tạo phòng mới: Tầng 1, 30 m² (Trạng thái: Trống)',
    changedBy: 'Nguyễn Văn An (Chủ nhà)',
    changedAt: '2026-04-10 09:00:00'
  },
  {
    id: 'rl_init_4',
    roomCode: 'P.202',
    field: 'Diện tích',
    oldValue: '28 m²',
    newValue: '30 m²',
    changedBy: 'Nguyễn Văn An (Chủ nhà)',
    changedAt: '2026-09-01 10:45:00'
  },
  {
    id: 'rl_init_5',
    roomCode: 'P.301',
    field: 'Khởi tạo phòng',
    oldValue: '—',
    newValue: 'Khởi tạo phòng mới: Tầng 3, 26 m² (Trạng thái: Trống)',
    changedBy: 'Nguyễn Văn An (Chủ nhà)',
    changedAt: '2026-06-01 08:00:00'
  }
];

export const INITIAL_INITIAL_PAYMENT_RECORDS: InitialPaymentRecord[] = [
  {
    id: 'pay07_101',
    contractId: 'HD-101-2026',
    roomCode: 'P.101',
    leaseId: 'THUE-101-L1',
    depositAmount: 3500000,
    firstMonthRentAmount: 3500000,
    actualAmount: 7000000,
    receivedDate: '2026-08-30',
    transactionCode: 'FT260830112233',
    bankAccountReceived: 'MB Bank - 0988123456 (NGUYEN VAN AN)',
    proofFile: 'unc_chuyen_khoan_mb_101.jpg',
    depositCode: 'COC-101-L1',
    rentPeriodNote: 'Kỳ 09/2026',
    confirmedBy: 'Nguyễn Văn An (Chủ nhà)',
    confirmedAt: '2026-08-30T10:15:00Z'
  },
  {
    id: 'pay07_102',
    contractId: 'HD-102-2026',
    roomCode: 'P.102',
    leaseId: 'THUE-102-L1',
    depositAmount: 3600000,
    firstMonthRentAmount: 3600000,
    actualAmount: 7200000,
    receivedDate: '2026-04-28',
    transactionCode: 'FT260428889911',
    bankAccountReceived: 'MB Bank - 0988123456 (NGUYEN VAN AN)',
    proofFile: 'unc_chuyen_khoan_mb_102.jpg',
    depositCode: 'COC-102-L1',
    rentPeriodNote: 'Kỳ 05/2026',
    confirmedBy: 'Nguyễn Văn An (Chủ nhà)',
    confirmedAt: '2026-04-28T15:20:00Z'
  },
  {
    id: 'pay07_303',
    contractId: 'HD-303-2026',
    roomCode: 'P.303',
    leaseId: 'THUE-303-L1',
    depositAmount: 3700000,
    firstMonthRentAmount: 3700000,
    actualAmount: 7400000,
    receivedDate: '2026-10-15',
    transactionCode: 'FT261015998877',
    bankAccountReceived: 'MB Bank - 0988123456 (NGUYEN VAN AN)',
    proofFile: 'unc_mb_303_7tr4.jpg',
    depositCode: 'COC-303-L1',
    rentPeriodNote: 'Kỳ 10/2026',
    confirmedBy: 'Nguyễn Văn An (Chủ nhà)',
    confirmedAt: '2026-10-15T11:00:00Z'
  }
];

export const INITIAL_MISSING_CONDITION_LOGS: MissingConditionLog[] = [
  {
    id: 'mc_303_1',
    roomCode: 'P.303',
    contractId: 'HD-303-2026',
    leaseId: 'THUE-303-L1',
    missingContractEffect: true,
    missingHandover: true,
    notes: 'Đã thu đủ 1 cọc 1 thuê. Đang chờ khách hẹn ngày bàn giao thực tế và ký biên bản nhận phòng.',
    loggedBy: 'Nguyễn Văn An (Chủ nhà)',
    loggedAt: '2026-10-15T11:30:00Z',
    status: 'Đang theo dõi'
  }
];

export const INITIAL_UNFINISHED_HANDOVER_LOGS: UnfinishedHandoverLog[] = [
  {
    id: 'ufh_302_1',
    roomCode: 'P.302',
    leaseId: 'THUE-302-L1',
    contractId: 'HD-302-2026',
    handoverVersion: 'v1.0',
    step304Status: 'Chưa nhận lại',
    notFinishedIndicator: 'Chưa kết thúc thuê',
    reason: 'Khách còn đồ đạc cá nhân chưa dọn hết và cần đối soát lại công nợ quá hạn kỳ 09/2026',
    obstacleContent: 'Tủ quần áo còn quần áo, chưa bàn giao lại thẻ từ cổng; hẹn thứ Bảy quay lại dọn nốt.',
    loggedBy: 'Nguyễn Văn An (Chủ nhà)',
    loggedAt: '2026-10-14T16:00:00Z'
  }
];

export const INITIAL_LEASE_START_EVENTS: LeaseStartEvent[] = [
  {
    eventId: 'evt_lease_start_101',
    roomCode: 'P.101',
    contractId: 'HD-101-2026',
    leaseId: 'THUE-101-L1',
    checkInDate: '2026-09-01',
    handoverReportId: 'BB-101-2026',
    handoverVersion: 'v1.0',
    emittedAt: '2026-09-01T09:30:00Z',
    coTenantsChecked: true,
    syncStatus: 'Đã gửi HSKT-02'
  }
];
