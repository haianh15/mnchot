import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserAccount,
  AuthSession,
  PasswordResetToken,
  SecurityAuditLog,
  ServiceFeeConfig,
  UtilityPriceHistory,
  BankAccountConfig,
  BatchSchedule,
  Room,
  RoomHistoryLog,
  ReturnPlanLog,
  TenantContactLog,
  InventoryRecord,
  HandoverCondition,
  HandoverReport,
  AssetIncident,
  ReturnInspection,
  AssetComparisonResult,
  HandoverReturnReport,
  Tenant,
  CoTenant,
  TenantChangeProposal,
  TenantHistoryEntry,
  Contract,
  DepositSettlementSlip,
  DeductionItem,
  SettlementContactLog,
  MeterReading,
  PeriodBill,
  PaymentNotice,
  PaymentReceipt,
  ReceivableReconciliation,
  DebtHistoryReminder,
  DebtPromise,
  Asset,
  MissingConditionLog,
  UnfinishedHandoverLog,
  InitialPaymentRecord,
  LeaseStartEvent,
  ManagementReportSnapshot,
  PendingReceptionDoc,
  PreSignIdentityVerification,
  ReceptionRequest,
  LeaseConditionDraft
} from '../types';

import {
  INITIAL_USERS,
  INITIAL_SERVICES,
  INITIAL_PRICE_HISTORY,
  INITIAL_BANK_ACCOUNTS,
  INITIAL_BATCH_SCHEDULES,
  INITIAL_STANDARD_ASSETS,
  INITIAL_ROOMS,
  INITIAL_TENANTS,
  INITIAL_CO_TENANTS,
  INITIAL_CONTRACTS,
  INITIAL_INVENTORY_RECORDS,
  INITIAL_HANDOVER_CONDITIONS,
  INITIAL_HANDOVER_REPORTS,
  INITIAL_INCIDENTS,
  INITIAL_METER_READINGS,
  INITIAL_PERIOD_BILLS,
  INITIAL_PAYMENT_NOTICES,
  INITIAL_PAYMENT_RECEIPTS,
  INITIAL_DEBT_REMINDERS,
  INITIAL_DEBT_PROMISES,
  INITIAL_RETURN_INSPECTIONS,
  INITIAL_SETTLEMENT_SLIPS,
  INITIAL_ROOM_HISTORY,
  INITIAL_INITIAL_PAYMENT_RECORDS,
  INITIAL_MISSING_CONDITION_LOGS,
  INITIAL_UNFINISHED_HANDOVER_LOGS,
  INITIAL_LEASE_START_EVENTS,
  INITIAL_PENDING_DOCS,
  INITIAL_RECEPTION_REQUESTS,
  INITIAL_LEASE_CONDITIONS,
  INITIAL_TENANT_PROPOSALS,
  INITIAL_PRE_SIGN_VERIFICATIONS,
  INITIAL_TENANT_HISTORY
} from '../data/seedData';
import { verifyPassword, hashPassword } from '../utils/authDemo';

interface AppContextType {
  // Auth
  currentUser: UserAccount | null;
  currentSession: AuthSession | null;
  authNotification: string | null;
  setAuthNotification: (msg: string | null) => void;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string; requireChangePass?: boolean }>;
  changePasswordFirstLogin: (currentPass: string, newPass: string, confirmPass: string) => Promise<{ success: boolean; message: string }>;
  logout: () => { success: boolean; message: string };
  changePasswordFromProfile: (currentPass: string, newPass: string, confirmPass: string) => Promise<{ success: boolean; message: string }>;
  requestPasswordResetEmail: (email: string) => { success: boolean; message: string; generatedToken?: string };
  resetPasswordWithToken: (token: string, newPass: string, confirmPass: string) => Promise<{ success: boolean; message: string }>;
  resetTokens: PasswordResetToken[];

  // Config (Mục 0.2)
  services: ServiceFeeConfig[];
  priceHistory: UtilityPriceHistory[];
  bankAccounts: BankAccountConfig[];
  activeBankAccount: BankAccountConfig | undefined;
  updateUtilityPrices: (electricPrice: number, waterPrice: number, serviceItems: ServiceFeeConfig[], effectivePeriod: string) => boolean;
  updateBankAccount: (bankName: string, accountNumber: string, accountHolder: string) => boolean;

  // Rooms (QT01)
  rooms: Room[];
  roomHistory: RoomHistoryLog[];
  returnPlans: ReturnPlanLog[];
  contactLogs: TenantContactLog[];
  initialPaymentRecords: InitialPaymentRecord[];
  missingConditionLogs: MissingConditionLog[];
  unfinishedHandoverLogs: UnfinishedHandoverLog[];
  leaseStartEvents: LeaseStartEvent[];
  addRoom: (roomCode: string, floor: number, area: number, note?: string) => { success: boolean; message: string; field?: string; code?: string; room?: Room };
  updateRoom: (roomCode: string, floor: number, area: number, note?: string) => { success: boolean; message: string; field?: string; code?: string; room?: Room };
  recordInitialPaymentPH07: (params: {
    roomCode: string;
    leaseId: string;
    contractId: string;
    depositAmount: number;
    firstMonthRentAmount: number;
    actualAmount: number;
    receivedDate: string;
    transactionCode: string;
    bankAccountReceived: string;
    proofFile?: string;
  }) => { success: boolean; message: string };
  correctInitialPaymentPH07: (id: string, reason: string, updatedFields: Partial<InitialPaymentRecord>) => { success: boolean; message: string };
  confirmCheckInPH05: (roomCode: string, leaseId: string, actualCheckInDate: string, handoverReportId?: string, handoverVersion?: string) => { success: boolean; message: string };
  saveMissingConditionPH06: (params: {
    roomCode: string;
    contractId: string;
    leaseId: string;
    missingContractEffect: boolean;
    missingHandover: boolean;
    notes: string;
    isTenantStoppedProcedure?: boolean;
    tenantStopReason?: string;
    tenantStopContent?: string;
  }) => { success: boolean; message: string };
  updateExpectedReturnDatePH11_12: (params: {
    roomCode: string;
    leaseId: string;
    expectedDate: string;
    confirmSource: 'trực tiếp' | 'điện thoại' | 'tin nhắn' | 'khác';
    confirmedAt: string;
    exchangeContent: string;
    reason?: string;
  }) => { success: boolean; message: string };
  recordTenantContactPH13: (params: {
    roomCode: string;
    leaseId: string;
    contactTimeActual: string;
    contactSource: 'trực tiếp' | 'điện thoại' | 'tin nhắn' | 'khác';
    contactResult: 'Chưa phản hồi' | 'Không tiếp tục thuê – Chưa xác nhận ngày dự kiến trả' | 'Chờ đối chiếu' | 'Đồng ý tiếp tục thuê';
    content: string;
    nextContactDate?: string;
    isAppointmentOnly?: boolean;
    contactChannelSource?: 'UC-PH-13' | 'UC-BG09' | 'UC-PH-09';
  }) => { success: boolean; message: string; logId?: string; isConflict?: boolean };
  autoCancelReturnPlanPH14: (roomCode: string, renewalContractId?: string) => { success: boolean; message: string };
  checkExtensionResultPH15: (roomCode: string) => {
    result: 'Có bằng chứng hợp lệ về việc tiếp tục thuê' | 'Chưa có căn cứ';
    caseType: 'Trường hợp 01' | 'Trường hợp 02' | 'Trường hợp 03';
    reason: string;
    activeContract?: Contract;
    renewalContract?: Contract;
  };
  confirmReturnStep305AndVacantPH08: (roomCode: string, leaseId: string, actualReturnDate?: string) => { success: boolean; message: string };
  saveUnfinishedHandoverPH09: (params: {
    roomCode: string;
    leaseId: string;
    contractId: string;
    handoverVersion: string;
    reason: string;
    obstacleContent: string;
    existingId?: string;
  }) => { success: boolean; message: string };

  // Handover & Assets (QT02)
  standardAssets: Asset[];
  inventoryRecords: InventoryRecord[];
  handoverConditions: HandoverCondition[];
  handoverReports: HandoverReport[];
  incidents: AssetIncident[];
  returnInspections: ReturnInspection[];
  assetComparisonResults: AssetComparisonResult[];
  handoverReturnReports: HandoverReturnReport[];
  saveInventoryBG01: (record: InventoryRecord) => void;
  saveHandoverConditionBG02: (condition: HandoverCondition) => { success: boolean; message: string };
  saveHandoverReportBG03: (report: HandoverReport) => void;
  confirmHandoverSignaturesBG03: (reportId: string, tenantSigned: boolean, ownerSigned: boolean, paperLocation?: string) => void;
  recordIncidentBG04: (incident: AssetIncident) => void;
  recordReturnInspectionBG09: (inspection: ReturnInspection) => void;
  confirmReturnInspectionStep305: (roomCode: string, leaseId: string, evidence: string, photos?: string[], videoUrl?: string) => void;
  correctReturnInspectionStep305: (roomCode: string, leaseId: string, newStatus: 'Đã nhận lại' | 'Chưa nhận lại', reason: string, evidence: string) => void;
  saveAssetComparisonResultBG07: (result: AssetComparisonResult) => void;
  initHandoverReturnReportDraftBG08: (report: HandoverReturnReport) => { success: boolean; message: string; report: HandoverReturnReport };
  syncDepositSettlementBG10: (reportId: string, settlementData: {
    depositSettlementId: string;
    depositSettlementVersion: number;
    depositSettlementAmount: number;
    depositRefundAmount: number;
    depositDeductionAmount: number;
    depositAdditionalDue?: number;
    depositTrackingStatus: '5.8 hợp lệ – Đã thống nhất' | 'Chưa có 5.8/Chờ quyết toán' | 'Chưa thống nhất – Chờ xác nhận của khách' | 'Tranh chấp – Chờ xử lý' | 'Cần rà soát phiên bản';
    depositTrackingReason?: string;
  }) => void;
  saveHandoverReturnReportBG11: (report: HandoverReturnReport) => void;
  confirmFinalReturnReportBG11: (reportId: string, tenantSignedStatus: 'Khách đã ký' | 'Khách không ký', notSignReason?: string, notSignExchangeInfo?: string, paperLocation?: string, scanUrl?: string) => { success: boolean; message: string };

  // Tenants (QT03 - UC-HSKT-01 -> 05)
  tenants: Tenant[];
  coTenants: CoTenant[];
  tenantProposals: TenantChangeProposal[];
  tenantHistory: TenantHistoryEntry[];
  pendingDocs: PendingReceptionDoc[];
  receptionRequests: ReceptionRequest[];
  preSignVerifications: PreSignIdentityVerification[];

  // UC-HSKT-01
  addTenantHSKT01: (tenant: Omit<Tenant, 'id' | 'createdAt' | 'createdBy'>) => {
    success: boolean;
    tenantId?: string;
    isPreliminary?: boolean;
    warning?: string;
    message: string;
  };
  addPendingReceptionDocHSKT01: (doc: Omit<PendingReceptionDoc, 'id'>) => { success: boolean; message: string };
  updatePendingReceptionDocStatus: (id: string, status: 'Chờ nhận phòng' | 'Đã đối chiếu tại 3.10b' | 'Đã hoàn trả') => void;
  linkReceptionRequestHSKT01: (requestCode: string, tenantId: string) => { success: boolean; message: string };

  // UC-HSKT-02
  addCoTenantHSKT02: (coTenant: Omit<CoTenant, 'id'>) => { success: boolean; id?: string; message: string };
  updateCoTenantStatusHSKT02: (coTenantId: string, status: 'Nháp' | 'Dự kiến' | 'Đang cư trú' | 'Đã kết thúc', actualDate?: string, evidence?: string) => { success: boolean; message: string };
  updateCoTenantFieldsHSKT02: (coTenantId: string, fields: Partial<CoTenant>) => { success: boolean; message: string };
  closeCoTenantResidencyHSKT02: (coTenantId: string, actualReturnDate: string, eventCode: string) => { success: boolean; message: string };
  linkConsecutiveContractCoTenantHSKT02: (tenantId: string, newContractId: string) => { success: boolean; message: string };

  // UC-HSKT-03
  createOrUpdateProposalHSKT03: (proposal: Omit<TenantChangeProposal, 'id' | 'version'> & { id?: string; version?: number }) => { success: boolean; proposalId: string; message: string };
  verifyProposalResultHSKT03: (proposalId: string, result: 'Đạt' | 'Chưa đạt' | 'Chưa xác minh', reason?: string, distinctionBasis?: string) => { success: boolean; message: string };
  transferProposalToUpdateHSKT03: (proposalId: string) => { success: boolean; message: string };
  recordPreSignVerificationHSKT03: (verification: Omit<PreSignIdentityVerification, 'id' | 'verifiedAt' | 'verifiedBy' | 'purpose' | 'isValid'>) => { success: boolean; message: string };

  // UC-HSKT-04
  applyTenantUpdateHSKT04: (tenantId: string, updatedFields: Partial<Tenant>, proposalId?: string) => { success: boolean; message: string };

  // Contracts & Lease Conditions (QT04 / ASIS-04)
  leaseConditions: LeaseConditionDraft[];
  saveLeaseConditionHDT01: (condition: Omit<LeaseConditionDraft, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy' | 'version'> & { id?: string }) => { success: boolean; conditionId: string; version: number; message: string };
  checkLeaseConditionHDT01: (condition: Partial<LeaseConditionDraft>) => { isValid: boolean; roomAvailable: boolean; batchConfirmed: boolean; blockingErrors: string[]; warnings: string[] };
  updateLeaseConditionStatusHDT01: (requestCode: string, agreed: boolean, note?: string) => { success: boolean; message: string };
  cancelLeaseConditionHDT01: (requestCode: string, reason: string) => { success: boolean; message: string };

  contracts: Contract[];
  batchSchedules: BatchSchedule[];
  addBatchSchedule: (batch: BatchSchedule) => void;
  updateBatchScheduleHDT05: (batchCode: string, updates: Partial<BatchSchedule>) => { success: boolean; message: string };
  createContractDraftHDT02: (contract: Omit<Contract, 'id' | 'status' | 'isSignedPaper' | 'version'>) => { success: boolean; contractId?: string; message: string };
  updateContractDraftHDT03: (contractId: string, updates: Partial<Contract>, changeNote: string) => { success: boolean; message: string };
  sendContractToTenantHDT03: (contractId: string) => { success: boolean; message: string };
  cancelContractDraftHDT03: (contractId: string, reason: string) => { success: boolean; message: string };
  confirmContractSignedHDT04: (contractId: string, signedDate: string, proofFiles: string[], verifyInfo?: { idNumber: string; proof: string; confirmVerified: boolean }) => { success: boolean; message: string };
  createRenewalContractHDT06: (params: {
    previousContractId: string;
    roomCode: string;
    tenantId: string;
    tenantName: string;
    batchCode: string;
    startDate: string;
    endDate: string;
    monthlyRent: number;
    terms: string;
  }) => { success: boolean; contractId?: string; message: string };
  activateRenewalContractHDT07: (contractId: string, signedDate: string, proofFiles: string[]) => { success: boolean; message: string };

  // Deposit Settlement (QT05)
  settlementSlips: DepositSettlementSlip[];
  saveSettlementSlipQTC01: (slip: DepositSettlementSlip) => { success: boolean; message: string };
  updateSettlementFeedbackQTC02: (params: {
    slipId: string;
    feedback: 'Đồng ý' | 'Không đồng ý' | 'Chưa phản hồi' | 'Không liên hệ được';
    contactLog: {
      channel: string;
      contactPerson: string;
      content: string;
      result: 'Đồng ý' | 'Không đồng ý' | 'Chưa phản hồi' | 'Không liên hệ được';
      evidence?: string;
    };
    agreementEvidence?: {
      evidenceFile: string;
      evidenceNote: string;
    };
    disputeReason?: string;
  }) => { success: boolean; message: string };
  adjustSettlementDeductionsQTC02: (params: {
    slipId: string;
    updatedDeductions: DeductionItem[];
    adjustReason: string;
  }) => { success: boolean; message: string; newVersion: number };
  lockDisputeSettlementQTC02: (params: {
    slipId: string;
    disputeReason: string;
    disputeItems: string;
    disputeBasis: string;
  }) => { success: boolean; message: string };
  reopenDisputedSettlementQTC02: (params: {
    slipId: string;
    reopenReason: string;
  }) => { success: boolean; message: string };
  cancelSettlementSlipQTC02: (params: {
    slipId: string;
    cancelReason: string;
  }) => { success: boolean; message: string };
  confirmSettlementTransferReceiptQTC03: (params: {
    slipId: string;
    receipt?: DepositSettlementSlip['transferReceipt'];
  }) => { success: boolean; message: string };

  // Billing (QT06)
  meterReadings: MeterReading[];
  periodBills: PeriodBill[];
  saveMeterReadingTT01: (reading: MeterReading) => void;
  updateMeterReadingTT02: (readingId: string, updates: Partial<MeterReading>, reason: string) => void;
  generatePeriodBillTT03: (roomCode: string, periodCode: string) => { success: boolean; billId?: string; message: string };
  confirmPeriodBillTT03: (billId: string) => { success: boolean; message: string };

  // Payment Notices (QT07)
  reconciliations: ReceivableReconciliation[];
  performReconciliationUC07_1: (billId: string) => { success: boolean; result?: ReceivableReconciliation; message: string };
  confirmReconciliationUC07_1: (reconciliationId: string) => { success: boolean; message: string };
  paymentNotices: PaymentNotice[];
  generatePaymentNotice07_2: (billId: string, dueDate: string, reconciliationId?: string) => { success: boolean; noticeId?: string; message: string };
  replacePaymentNotice07_2: (oldNoticeId: string, reason?: string) => { success: boolean; noticeId?: string; message: string };

  // Payment Receipts (QT08)
  paymentReceipts: PaymentReceipt[];
  confirmPaymentReceipt08_2: (noticeId: string, amount: number, receivedDate: string, transactionCode: string, bankAccountReceived: string, proofFile?: string) => { success: boolean; message: string };
  revertPaymentReceipt08_2: (receiptId: string, reason: string) => { success: boolean; message: string };

  // Debts (QT09)
  debtReminders: DebtHistoryReminder[];
  debtPromises: DebtPromise[];
  recordDebtReminder09_2: (reminder: Omit<DebtHistoryReminder, 'id' | 'loggedAt' | 'loggedBy'>) => { success: boolean; message: string; record?: DebtHistoryReminder };
  recordDebtPromise09_3: (promise: Omit<DebtPromise, 'id' | 'loggedAt' | 'loggedBy'>) => { success: boolean; message: string; record?: DebtPromise };

  // Security Audit Log
  securityLogs: SecurityAuditLog[];
  logSecurity: (action: string, details: string) => void;

  // Management Reports (QT10)
  reportSnapshots: ManagementReportSnapshot[];
  saveReportSnapshot: (snapshot: ManagementReportSnapshot) => void;

  // Quick reset for demo/testing
  resetAllToSeedData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Storage helpers
  const getStored = <T,>(key: string, defaultVal: T): T => {
    try {
      const item = localStorage.getItem(`mini_apt_${key}`);
      return item ? JSON.parse(item) : defaultVal;
    } catch {
      return defaultVal;
    }
  };

  const setStored = <T,>(key: string, val: T) => {
    try {
      localStorage.setItem(`mini_apt_${key}`, JSON.stringify(val));
    } catch (e) {
      console.error('LocalStorage write error', e);
    }
  };

  // State Declarations
  // Auth v2: không nhập lại các tài khoản/mật khẩu rõ từ bản demo cũ.
  const [users, setUsers] = useState<UserAccount[]>(() => {
    const cached = getStored<UserAccount[]>('owner_auth_v2', INITIAL_USERS);
    return cached.length === 1 && cached[0]?.username === 'chunha' && cached[0]?.role === 'Quản lý/Chủ nhà' && cached[0]?.passwordHash?.startsWith('pbkdf2-sha256:')
      ? cached : INITIAL_USERS;
  });
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [currentSession, setCurrentSession] = useState<AuthSession | null>(null);
  const [resetTokens, setResetTokens] = useState<PasswordResetToken[]>([]);
  const [authNotification, setAuthNotification] = useState<string | null>(null);

  const [services, setServices] = useState<ServiceFeeConfig[]>(() => getStored('services', INITIAL_SERVICES));
  const [priceHistory, setPriceHistory] = useState<UtilityPriceHistory[]>(() => getStored('priceHistory', INITIAL_PRICE_HISTORY));
  const [bankAccounts, setBankAccounts] = useState<BankAccountConfig[]>(() => getStored('bankAccounts', INITIAL_BANK_ACCOUNTS));

  const [batchSchedules, setBatchSchedules] = useState<BatchSchedule[]>(() => getStored('batchSchedules', INITIAL_BATCH_SCHEDULES));
  const [standardAssets] = useState<Asset[]>(INITIAL_STANDARD_ASSETS);
  const [rooms, setRooms] = useState<Room[]>(() => getStored('rooms', INITIAL_ROOMS));
  const [roomHistory, setRoomHistory] = useState<RoomHistoryLog[]>(() => getStored('roomHistory', INITIAL_ROOM_HISTORY));
  const [returnPlans, setReturnPlans] = useState<ReturnPlanLog[]>(() => getStored('returnPlans', []));
  const [contactLogs, setContactLogs] = useState<TenantContactLog[]>(() => getStored('contactLogs', []));
  const [initialPaymentRecords, setInitialPaymentRecords] = useState<InitialPaymentRecord[]>(() => getStored('initialPaymentRecords', INITIAL_INITIAL_PAYMENT_RECORDS));
  const [missingConditionLogs, setMissingConditionLogs] = useState<MissingConditionLog[]>(() => getStored('missingConditionLogs', INITIAL_MISSING_CONDITION_LOGS));
  const [unfinishedHandoverLogs, setUnfinishedHandoverLogs] = useState<UnfinishedHandoverLog[]>(() => getStored('unfinishedHandoverLogs', INITIAL_UNFINISHED_HANDOVER_LOGS));
  const [leaseStartEvents, setLeaseStartEvents] = useState<LeaseStartEvent[]>(() => getStored('leaseStartEvents', INITIAL_LEASE_START_EVENTS));

  const [inventoryRecords, setInventoryRecords] = useState<InventoryRecord[]>(() => getStored('inventoryRecords', INITIAL_INVENTORY_RECORDS));
  const [handoverConditions, setHandoverConditions] = useState<HandoverCondition[]>(() => getStored('handoverConditions', INITIAL_HANDOVER_CONDITIONS));
  const [handoverReports, setHandoverReports] = useState<HandoverReport[]>(() => getStored('handoverReports', INITIAL_HANDOVER_REPORTS));
  const [incidents, setIncidents] = useState<AssetIncident[]>(() => getStored('incidents', INITIAL_INCIDENTS));
  const [returnInspections, setReturnInspections] = useState<ReturnInspection[]>(() => getStored('returnInspections', INITIAL_RETURN_INSPECTIONS));
  const [assetComparisonResults, setAssetComparisonResults] = useState<AssetComparisonResult[]>(() => getStored('assetComparisonResults', []));
  const [handoverReturnReports, setHandoverReturnReports] = useState<HandoverReturnReport[]>(() => getStored('handoverReturnReports', []));

  const [tenants, setTenants] = useState<Tenant[]>(() => getStored('tenants', INITIAL_TENANTS));
  const [coTenants, setCoTenants] = useState<CoTenant[]>(() => getStored('coTenants', INITIAL_CO_TENANTS));
  const [tenantProposals, setTenantProposals] = useState<TenantChangeProposal[]>(() => getStored('tenantProposals', INITIAL_TENANT_PROPOSALS));
  const [tenantHistory, setTenantHistory] = useState<TenantHistoryEntry[]>(() => getStored('tenantHistory', INITIAL_TENANT_HISTORY));
  const [pendingDocs, setPendingDocs] = useState<PendingReceptionDoc[]>(() => getStored('pendingDocs', INITIAL_PENDING_DOCS));
  const [receptionRequests, setReceptionRequests] = useState<ReceptionRequest[]>(() => getStored('receptionRequests', INITIAL_RECEPTION_REQUESTS));
  const [preSignVerifications, setPreSignVerifications] = useState<PreSignIdentityVerification[]>(() => getStored('preSignVerifications', INITIAL_PRE_SIGN_VERIFICATIONS));
  const [leaseConditions, setLeaseConditions] = useState<LeaseConditionDraft[]>(() => getStored('leaseConditions', INITIAL_LEASE_CONDITIONS));

  const [contracts, setContracts] = useState<Contract[]>(() => getStored('contracts', INITIAL_CONTRACTS));
  const [settlementSlips, setSettlementSlips] = useState<DepositSettlementSlip[]>(() => getStored('settlementSlips', INITIAL_SETTLEMENT_SLIPS));

  const [meterReadings, setMeterReadings] = useState<MeterReading[]>(() => getStored('meterReadings', INITIAL_METER_READINGS));
  const [periodBills, setPeriodBills] = useState<PeriodBill[]>(() => getStored('periodBills', INITIAL_PERIOD_BILLS));
  const [reconciliations, setReconciliations] = useState<ReceivableReconciliation[]>(() => getStored('reconciliations', []));
  const [paymentNotices, setPaymentNotices] = useState<PaymentNotice[]>(() => getStored('paymentNotices', INITIAL_PAYMENT_NOTICES));
  const [paymentReceipts, setPaymentReceipts] = useState<PaymentReceipt[]>(() => getStored('paymentReceipts', INITIAL_PAYMENT_RECEIPTS));
  const [debtReminders, setDebtReminders] = useState<DebtHistoryReminder[]>(() => getStored('debtReminders', INITIAL_DEBT_REMINDERS));
  const [debtPromises, setDebtPromises] = useState<DebtPromise[]>(() => getStored('debtPromises', INITIAL_DEBT_PROMISES));
  const [securityLogs, setSecurityLogs] = useState<SecurityAuditLog[]>(() => getStored('securityLogs', []));
  const [reportSnapshots, setReportSnapshots] = useState<ManagementReportSnapshot[]>(() => getStored('reportSnapshots', [
    {
      id: 'snap_demo_01',
      reportCode: 'BCQT-202610-01',
      createdAt: '2026-10-15 17:30',
      createdBy: 'Quản lý Nguyễn Văn An',
      asOfTimestamp: '15/10/2026 17:30:00',
      periodLabel: 'Kỳ tháng 10/2026',
      sourceVersion: 'ASIS-01 v2.4 (Chốt kỳ 10/2026)',
      roomStats: {
        totalRooms: 12,
        vacantRooms: 2,
        rentedRooms: 8,
        returningRooms: 2,
        occupancyRate: 83.3,
        roomsSnapshot: [
          { roomCode: 'P.101', status: 'Đang thuê', hasDeposit: true, expectedReturnDate: '2026-12-31' },
          { roomCode: 'P.102', status: 'Trống', hasDeposit: false },
          { roomCode: 'P.103', status: 'Đang thuê', hasDeposit: true },
          { roomCode: 'P.201', status: 'Sắp trả', hasDeposit: true, expectedReturnDate: '2026-10-25' },
          { roomCode: 'P.202', status: 'Đang thuê', hasDeposit: true },
          { roomCode: 'P.203', status: 'Đang thuê', hasDeposit: true },
          { roomCode: 'P.301', status: 'Đang thuê', hasDeposit: true },
          { roomCode: 'P.302', status: 'Trống', hasDeposit: true },
          { roomCode: 'P.303', status: 'Sắp trả', hasDeposit: true, expectedReturnDate: '2026-10-20' },
          { roomCode: 'P.401', status: 'Đang thuê', hasDeposit: true },
          { roomCode: 'P.402', status: 'Đang thuê', hasDeposit: true },
          { roomCode: 'P.403', status: 'Đang thuê', hasDeposit: true }
        ]
      },
      financialStats: {
        totalReceivable: 45500000,
        totalCollected: 38200000,
        totalHandledByDeposit: 2500000,
        totalUncollected: 4800000,
        totalOverdueDebt: 3100000,
        initialRentTotal: 7000000,
        nextRentTotal: 31500000,
        utilityFeesTotal: 7000000,
        depositHoldingTotal: 42000000
      },
      reconciliationStatus: 'Đã kiểm tra',
      reconciledAt: '15/10/2026 17:25',
      reconciledBy: 'Quản lý Nguyễn Văn An'
    }
  ]));

  // Sync state to local storage on changes
  useEffect(() => { setStored('reportSnapshots', reportSnapshots); }, [reportSnapshots]);
  useEffect(() => { setStored('owner_auth_v2', users); }, [users]);
  // Không lưu phiên đăng nhập hoặc thông tin người đăng nhập xuống localStorage.
  useEffect(() => { setStored('services', services); }, [services]);
  useEffect(() => { setStored('priceHistory', priceHistory); }, [priceHistory]);
  useEffect(() => { setStored('bankAccounts', bankAccounts); }, [bankAccounts]);
  useEffect(() => { setStored('rooms', rooms); }, [rooms]);
  useEffect(() => { setStored('roomHistory', roomHistory); }, [roomHistory]);
  useEffect(() => { setStored('returnPlans', returnPlans); }, [returnPlans]);
  useEffect(() => { setStored('contactLogs', contactLogs); }, [contactLogs]);
  useEffect(() => { setStored('initialPaymentRecords', initialPaymentRecords); }, [initialPaymentRecords]);
  useEffect(() => { setStored('missingConditionLogs', missingConditionLogs); }, [missingConditionLogs]);
  useEffect(() => { setStored('unfinishedHandoverLogs', unfinishedHandoverLogs); }, [unfinishedHandoverLogs]);
  useEffect(() => { setStored('leaseStartEvents', leaseStartEvents); }, [leaseStartEvents]);
  useEffect(() => { setStored('inventoryRecords', inventoryRecords); }, [inventoryRecords]);
  useEffect(() => { setStored('handoverConditions', handoverConditions); }, [handoverConditions]);
  useEffect(() => { setStored('handoverReports', handoverReports); }, [handoverReports]);
  useEffect(() => { setStored('incidents', incidents); }, [incidents]);
  useEffect(() => { setStored('returnInspections', returnInspections); }, [returnInspections]);
  useEffect(() => { setStored('assetComparisonResults', assetComparisonResults); }, [assetComparisonResults]);
  useEffect(() => { setStored('handoverReturnReports', handoverReturnReports); }, [handoverReturnReports]);
  useEffect(() => { setStored('tenants', tenants); }, [tenants]);
  useEffect(() => { setStored('coTenants', coTenants); }, [coTenants]);
  useEffect(() => { setStored('tenantProposals', tenantProposals); }, [tenantProposals]);
  useEffect(() => { setStored('tenantHistory', tenantHistory); }, [tenantHistory]);
  useEffect(() => { setStored('pendingDocs', pendingDocs); }, [pendingDocs]);
  useEffect(() => { setStored('receptionRequests', receptionRequests); }, [receptionRequests]);
  useEffect(() => { setStored('preSignVerifications', preSignVerifications); }, [preSignVerifications]);
  useEffect(() => { setStored('leaseConditions', leaseConditions); }, [leaseConditions]);
  useEffect(() => { setStored('contracts', contracts); }, [contracts]);
  useEffect(() => { setStored('batchSchedules', batchSchedules); }, [batchSchedules]);
  useEffect(() => { setStored('settlementSlips', settlementSlips); }, [settlementSlips]);
  useEffect(() => { setStored('meterReadings', meterReadings); }, [meterReadings]);
  useEffect(() => { setStored('periodBills', periodBills); }, [periodBills]);
  useEffect(() => { setStored('reconciliations', reconciliations); }, [reconciliations]);
  useEffect(() => { setStored('paymentNotices', paymentNotices); }, [paymentNotices]);
  useEffect(() => { setStored('paymentReceipts', paymentReceipts); }, [paymentReceipts]);
  useEffect(() => { setStored('debtReminders', debtReminders); }, [debtReminders]);
  useEffect(() => { setStored('debtPromises', debtPromises); }, [debtPromises]);
  useEffect(() => { setStored('securityLogs', securityLogs); }, [securityLogs]);

  const logSecurity = (action: string, details: string) => {
    const newLog: SecurityAuditLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      userId: currentUser?.id || 'anonymous',
      action,
      details
    };
    setSecurityLogs(prev => [newLog, ...prev]);
  };

  // ==================== AUTH METHODS (UC-TK-01 -> 04) ====================
  const login = async (username: string, password: string) => {
    const trimmedUser = username.trim();
    if (!trimmedUser && !password) {
      return { success: false, message: 'Tên đăng nhập là trường bắt buộc và Mật khẩu là trường bắt buộc' };
    }
    if (!trimmedUser) {
      return { success: false, message: 'Tên đăng nhập là trường bắt buộc' };
    }
    if (!password) {
      return { success: false, message: 'Mật khẩu là trường bắt buộc' };
    }

    const user = users.find(u => u.username === trimmedUser);
    const now = Date.now();

    if (!user) {
      logSecurity('LOGIN_FAILED', `User not found: ${trimmedUser}`);
      return { success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác. Vui lòng thử lại.' };
    }

    // Check lock
    if (user.lockUntil && user.lockUntil > now) {
      const minsLeft = Math.ceil((user.lockUntil - now) / 60000);
      return { success: false, message: `Tài khoản tạm thời bị khóa do sai quá 5 lần. Vui lòng thử lại sau ${minsLeft} phút.` };
    }

    if (!(await verifyPassword(password, user.passwordHash))) {
      const newFails = user.failedLoginAttempts + 1;
      let newLock: number | null = null;
      let lockMsg = '';
      if (newFails >= 5) {
        newLock = now + 15 * 60 * 1000;
        lockMsg = ' Bạn đã nhập sai 5 lần liên tiếp. Tài khoản tạm khóa 15 phút.';
      }

      setUsers(prev => prev.map(u => u.id === user.id ? {
        ...u,
        failedLoginAttempts: newFails,
        lockUntil: newLock
      } : u));

      logSecurity('LOGIN_FAILED', `User ${trimmedUser} password mismatch. Tries: ${newFails}`);
      return { success: false, message: `Tên đăng nhập hoặc mật khẩu không chính xác. Vui lòng thử lại.${lockMsg}` };
    }

    // Login successful
    const updatedUser = { ...user, failedLoginAttempts: 0, lockUntil: null };
    setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
    setCurrentUser(updatedUser);

    if (updatedUser.mustChangePasswordFirstLogin) {
      const tempSession: AuthSession = {
        sessionId: 'sess_temp_' + now,
        userId: user.id,
        username: user.username,
        role: user.role,
        type: 'temp_change_password',
        expiresAt: now + 15 * 60 * 1000,
        createdAt: now
      };
      setCurrentSession(tempSession);
      logSecurity('LOGIN_FIRST_TIME', `Temp session for mandatory password change: ${user.username}`);
      return { success: true, requireChangePass: true, message: 'Đăng nhập thành công! Vui lòng đổi mật khẩu lần đầu.' };
    }

    const adminSession: AuthSession = {
      sessionId: 'sess_adm_' + now,
      userId: user.id,
      username: user.username,
      role: user.role,
      type: 'admin',
      expiresAt: now + 30 * 60 * 1000,
      createdAt: now
    };
    setCurrentSession(adminSession);
    logSecurity('LOGIN_SUCCESS', `Admin session established for ${user.username}`);
    return { success: true, requireChangePass: false };
  };

  const changePasswordFirstLogin = async (currentPass: string, newPass: string, confirmPass: string) => {
    if (!currentUser || !currentSession || currentSession.type !== 'temp_change_password' || currentSession.expiresAt <= Date.now()) {
      return { success: false, message: 'Phiên làm việc đã kết thúc. Vui lòng đăng nhập lại.' };
    }

    if (!currentPass) return { success: false, message: 'Mật khẩu hiện tại là trường bắt buộc' };
    if (!newPass) return { success: false, message: 'Mật khẩu mới là trường bắt buộc' };
    if (!confirmPass) return { success: false, message: 'Xác nhận mật khẩu mới là trường bắt buộc' };

    if (!(await verifyPassword(currentPass, currentUser.passwordHash))) {
      return { success: false, message: 'Mật khẩu hiện tại không chính xác.' };
    }

    if (newPass === currentPass) {
      return { success: false, message: 'Mật khẩu mới phải khác mật khẩu hiện tại.' };
    }

    if (newPass.length < 12) {
      return { success: false, message: 'Mật khẩu mới phải có ít nhất 12 ký tự theo chính sách bảo mật.' };
    }

    if (newPass !== confirmPass) {
      return { success: false, message: 'Xác nhận mật khẩu không khớp.' };
    }

    const now = Date.now();
    const updatedUser: UserAccount = {
      ...currentUser,
      passwordHash: await hashPassword(newPass),
      mustChangePasswordFirstLogin: false,
      authVersion: currentUser.authVersion + 1,
      failedLoginAttempts: 0,
      lockUntil: null
    };

    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    setCurrentUser(updatedUser);

    // Create new admin session
    const adminSession: AuthSession = {
      sessionId: 'sess_adm_' + now,
      userId: updatedUser.id,
      username: updatedUser.username,
      role: updatedUser.role,
      type: 'admin',
      expiresAt: now + 30 * 60 * 1000,
      createdAt: now
    };
    setCurrentSession(adminSession);
    setResetTokens([]);
    logSecurity('PASSWORD_CHANGED_FIRST_LOGIN', `First login password change succeeded for ${updatedUser.username}`);

    return { success: true, message: 'Đổi mật khẩu thành công!' };
  };

  const logout = () => {
    const isTemp = currentSession?.type === 'temp_change_password';
    logSecurity('LOGOUT', `Session revoked: ${currentSession?.sessionId}`);
    setCurrentSession(null);
    setCurrentUser(null);
    if (isTemp) {
      return { success: true, message: 'Đã thoát khỏi bước đổi mật khẩu. Vui lòng đăng nhập lại.' };
    }
    return { success: true, message: 'Đăng xuất thành công!' };
  };

  const changePasswordFromProfile = async (currentPass: string, newPass: string, confirmPass: string) => {
    if (!currentUser || !currentSession || currentSession.type !== 'admin') {
      return { success: false, message: 'Phiên làm việc đã kết thúc. Vui lòng đăng nhập lại.' };
    }

    const now = Date.now();
    if (currentUser.changePasswordLockUntil && currentUser.changePasswordLockUntil > now) {
      return { success: false, message: 'Tạm thời chưa thể đổi mật khẩu. Vui lòng thử lại sau.' };
    }

    if (!currentPass) return { success: false, message: 'Mật khẩu hiện tại là trường bắt buộc' };
    if (!newPass) return { success: false, message: 'Mật khẩu mới là trường bắt buộc' };
    if (!confirmPass) return { success: false, message: 'Xác nhận mật khẩu mới là trường bắt buộc' };

    if (newPass !== confirmPass) {
      return { success: false, message: 'Xác nhận mật khẩu không khớp.' };
    }

    if (newPass.length < 12) {
      return { success: false, message: 'Mật khẩu mới phải có ít nhất 12 ký tự.' };
    }

    if (!(await verifyPassword(currentPass, currentUser.passwordHash))) {
      const fails = currentUser.failedChangePasswordAttempts + 1;
      let newLock: number | null = null;
      let msg = 'Mật khẩu hiện tại không chính xác.';
      if (fails >= 5) {
        newLock = now + 15 * 60 * 1000;
        msg = 'Nhập sai 5 lần liên tiếp. Tạm thời ngừng chức năng đổi mật khẩu trong 15 phút.';
      }
      const updatedUser = { ...currentUser, failedChangePasswordAttempts: fails, changePasswordLockUntil: newLock };
      setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
      setCurrentUser(updatedUser);
      return { success: false, message: msg };
    }

    if (newPass === currentPass) {
      return { success: false, message: 'Mật khẩu mới phải khác mật khẩu hiện tại.' };
    }

    const updatedUser: UserAccount = {
      ...currentUser,
      passwordHash: await hashPassword(newPass),
      authVersion: currentUser.authVersion + 1,
      failedChangePasswordAttempts: 0,
      changePasswordLockUntil: null
    };

    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    setCurrentUser(updatedUser);
    setCurrentSession({
      sessionId: 'sess_adm_' + Date.now() + '_' + crypto.randomUUID(),
      userId: updatedUser.id,
      username: updatedUser.username,
      role: updatedUser.role,
      type: 'admin',
      expiresAt: Date.now() + 30 * 60 * 1000,
      createdAt: Date.now()
    });
    setResetTokens([]);
    logSecurity('PASSWORD_CHANGED_PROFILE', `Password changed successfully for ${currentUser.username}`);
    return { success: true, message: 'Đổi mật khẩu thành công!' };
  };

  // UC-TK-04: không giả lập gửi email hoặc tiết lộ mã khôi phục trên trình duyệt.
  // Dịch vụ này chỉ có thể mở khi có backend gửi mail và lưu token phía máy chủ.
  const requestPasswordResetEmail = (email: string) => {
    if (!email.trim()) return { success: false, message: 'Email là trường bắt buộc.' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return { success: false, message: 'Email không đúng định dạng.' };
    return { success: false, message: 'Bản xem thử chưa kết nối dịch vụ email khôi phục. Vui lòng liên hệ người cấp tài khoản; không có email nào được gửi.' };
  };
  const resetPasswordWithToken = async (_token: string, _newPass: string, _confirmPass: string) => {
    return { success: false, message: 'Khôi phục bằng token chỉ được hỗ trợ khi tích hợp backend và dịch vụ email thật.' };
  };

  // Phiên trong bản demo chỉ tồn tại trong bộ nhớ: đóng/tải lại phải đăng nhập lại.
  // UC-TK: sau 30 phút không hoạt động tự trả về màn hình Đăng nhập.
  useEffect(() => {
    if (!currentSession) return;
    const expire = () => {
      setCurrentSession(prev => prev && prev.expiresAt <= Date.now() ? null : prev);
      setCurrentUser(prev => currentSession.expiresAt <= Date.now() ? null : prev);
      if (currentSession.expiresAt <= Date.now()) setAuthNotification('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    };
    const activity = () => {
      if (currentSession.type !== 'admin') return;
      const now = Date.now();
      if (currentSession.expiresAt <= now) { expire(); return; }
      // Giảm số lần cập nhật state nhưng vẫn có 30 phút không hoạt động.
      if (currentSession.expiresAt - now < 29 * 60 * 1000) {
        setCurrentSession(prev => prev?.type === 'admin' ? { ...prev, expiresAt: now + 30 * 60 * 1000 } : prev);
      }
    };
    const timer = window.setInterval(expire, 5000);
    for (const event of ['pointerdown', 'keydown', 'touchstart']) window.addEventListener(event, activity, { passive: true });
    return () => {
      window.clearInterval(timer);
      for (const event of ['pointerdown', 'keydown', 'touchstart']) window.removeEventListener(event, activity);
    };
  }, [currentSession]);

  // ==================== CONFIG METHODS (UC-CH-01, UC-CH-02) ====================
  const activeBankAccount = bankAccounts.find(b => b.status === 'Đang sử dụng');

  const updateUtilityPrices = (
    electricPrice: number,
    waterPrice: number,
    serviceItems: ServiceFeeConfig[],
    effectivePeriod: string
  ) => {
    if (electricPrice <= 0 || waterPrice <= 0) return false;
    const historyItem: UtilityPriceHistory = {
      id: 'uph_' + Date.now(),
      changedAt: new Date().toISOString(),
      changedBy: currentUser?.fullName || 'Chủ nhà',
      effectivePeriod,
      electricityPrice: electricPrice,
      waterPrice: waterPrice,
      services: serviceItems
    };
    setServices(serviceItems);
    setPriceHistory(prev => [historyItem, ...prev]);
    logSecurity('CONFIG_PRICE_UPDATED', `Updated prices: Điện ${electricPrice}đ, Nước ${waterPrice}đ for ${effectivePeriod}`);
    return true;
  };

  const updateBankAccount = (bankName: string, accountNumber: string, accountHolder: string) => {
    if (!bankName.trim() || !accountNumber.trim() || !accountHolder.trim()) return false;
    const newAccount: BankAccountConfig = {
      id: 'bank_' + Date.now(),
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      accountHolder: accountHolder.trim().toUpperCase(),
      status: 'Đang sử dụng',
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser?.fullName || 'Chủ nhà'
    };
    setBankAccounts(prev => [
      newAccount,
      ...prev.map(b => ({ ...b, status: 'Lịch sử' as const }))
    ]);
    logSecurity('CONFIG_BANK_UPDATED', `New active bank account: ${bankName} - ${accountNumber}`);
    return true;
  };

  // ==================== ROOM METHODS (QT01: UC-PH-01 -> UC-PH-15) ====================
  // UC-PH-02: Thêm phòng mới
  const addRoom = (roomCode: string, floor: number, area: number, note?: string) => {
    // Kiểm tra phiên đăng nhập và quyền (EF-03)
    if (!currentUser || !currentSession || currentSession.expiresAt < Date.now()) {
      return { success: false, message: 'Phiên đăng nhập đã hết hiệu lực. Vui lòng đăng nhập lại.', code: 'EF-03' };
    }
    if (currentUser.role !== 'Quản lý/Chủ nhà') {
      return { success: false, message: 'Chức năng chỉ dành cho User có vai trò Quản lý hoặc Chủ nhà.', code: 'EF-03' };
    }

    // Mã phòng sau khi bỏ khoảng trắng đầu/cuối phải có nội dung và duy nhất
    const code = (roomCode || '').trim();
    if (!code) {
      return { success: false, message: 'Mã phòng không hợp lệ hoặc đã tồn tại', field: 'roomCode', code: 'EF-02' };
    }
    if (rooms.some(r => r.roomCode.toLowerCase() === code.toLowerCase())) {
      return { success: false, message: 'Mã phòng không hợp lệ hoặc đã tồn tại', field: 'roomCode', code: 'EF-02' };
    }

    // BR-UC.PH.02-02 & EF-01: Tầng là số nguyên từ 0 trở lên
    if (floor === undefined || isNaN(floor) || floor < 0 || !Number.isInteger(floor)) {
      return { success: false, message: 'Tầng trống hoặc sai định dạng (phải là số nguyên từ 0 trở lên).', field: 'floor', code: 'EF-01' };
    }

    // BR-UC.PH.02-02 & EF-01: Diện tích là số dương > 0
    if (area === undefined || isNaN(area) || area <= 0) {
      return { success: false, message: 'Diện tích trống hoặc không lớn hơn 0 (phải là số dương).', field: 'area', code: 'EF-01' };
    }

    // BR-UC.PH.02-02 & EF-02: Ghi chú không bắt buộc và không quá 500 ký tự
    const trimmedNote = (note || '').trim();
    if (trimmedNote.length > 500) {
      return { success: false, message: 'Ghi chú vượt 500 ký tự. Vui lòng sửa trước khi lưu.', field: 'note', code: 'EF-02' };
    }

    const now = new Date().toISOString();
    const user = currentUser?.fullName || 'Chủ nhà';

    // BR-UC.PH.02-03 & Khởi tạo phòng trạng thái Trống, không tự có khách thuê, hợp đồng, cọc hoặc ngày dự kiến trả
    const newRoom: Room = {
      id: 'rm_' + Date.now(),
      roomCode: code,
      floor,
      area,
      status: 'Trống',
      hasDeposit: false,
      firstMonthRentPaid: false,
      firstMonthPeriod: '',
      totalOccupants: 0,
      note: trimmedNote
    };

    // Tạo phòng phải lưu trọn vẹn, ghi vết khởi tạo cùng giao dịch
    const initLog: RoomHistoryLog = {
      id: 'rl_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      roomCode: code,
      field: 'Khởi tạo phòng',
      oldValue: '—',
      newValue: `Khởi tạo phòng mới: Tầng ${floor}, ${area} m² (Trạng thái: Trống)`,
      changedBy: user,
      changedAt: now
    };

    setRooms(prev => [...prev, newRoom]);
    setRoomHistory(prev => [initLog, ...prev]);
    logSecurity('ROOM_CREATED', `Tạo phòng ${code} - Tầng ${floor}, ${area}m² bởi ${user}`);

    return { success: true, message: 'Thêm phòng thành công', room: newRoom };
  };

  // UC-PH-02: Cập nhật thông tin phòng đã có
  const updateRoom = (roomCode: string, floor: number, area: number, note?: string) => {
    // Kiểm tra phiên đăng nhập và quyền (EF-03)
    if (!currentUser || !currentSession || currentSession.expiresAt < Date.now()) {
      return { success: false, message: 'Phiên đăng nhập đã hết hiệu lực. Vui lòng đăng nhập lại.', code: 'EF-03' };
    }
    if (currentUser.role !== 'Quản lý/Chủ nhà') {
      return { success: false, message: 'Chức năng chỉ dành cho User có vai trò Quản lý hoặc Chủ nhà.', code: 'EF-03' };
    }

    const room = rooms.find(r => r.roomCode === roomCode);
    if (!room) {
      return { success: false, message: 'Không tìm thấy phòng tương ứng.', code: 'NOT_FOUND' };
    }

    // BR-UC.PH.02-02 & EF-01: Tầng là số nguyên từ 0 trở lên
    if (floor === undefined || isNaN(floor) || floor < 0 || !Number.isInteger(floor)) {
      return { success: false, message: 'Tầng trống hoặc sai định dạng (phải là số nguyên từ 0 trở lên).', field: 'floor', code: 'EF-01' };
    }

    // BR-UC.PH.02-02 & EF-01: Diện tích là số dương > 0
    if (area === undefined || isNaN(area) || area <= 0) {
      return { success: false, message: 'Diện tích trống hoặc không lớn hơn 0 (phải là số dương).', field: 'area', code: 'EF-01' };
    }

    // BR-UC.PH.02-02 & EF-02: Ghi chú không bắt buộc và không quá 500 ký tự
    const trimmedNote = (note !== undefined ? note : (room.note || '')).trim();
    if (trimmedNote.length > 500) {
      return { success: false, message: 'Ghi chú vượt 500 ký tự. Vui lòng sửa trước khi lưu.', field: 'note', code: 'EF-02' };
    }

    // Cập nhật phòng và lưu vết thay đổi phải diễn ra cùng giao dịch
    const logs: RoomHistoryLog[] = [];
    const now = new Date().toISOString();
    const user = currentUser?.fullName || 'Chủ nhà';

    if (room.floor !== floor) {
      logs.push({
        id: 'rl_' + Date.now() + '_fl',
        roomCode,
        field: 'Tầng',
        oldValue: `Tầng ${room.floor}`,
        newValue: `Tầng ${floor}`,
        changedBy: user,
        changedAt: now
      });
    }
    if (room.area !== area) {
      logs.push({
        id: 'rl_' + Date.now() + '_ar',
        roomCode,
        field: 'Diện tích',
        oldValue: `${room.area} m²`,
        newValue: `${area} m²`,
        changedBy: user,
        changedAt: now
      });
    }
    const currentNoteTrimmed = (room.note || '').trim();
    if (currentNoteTrimmed !== trimmedNote) {
      logs.push({
        id: 'rl_' + Date.now() + '_nt',
        roomCode,
        field: 'Ghi chú',
        oldValue: currentNoteTrimmed || '(Trống)',
        newValue: trimmedNote || '(Trống)',
        changedBy: user,
        changedAt: now
      });
    }

    const updatedRoom: Room = {
      ...room,
      floor,
      area,
      note: trimmedNote
    };

    setRooms(prev => prev.map(r => r.roomCode === roomCode ? updatedRoom : r));
    if (logs.length > 0) {
      setRoomHistory(prev => [...logs, ...prev]);
    }

    logSecurity('ROOM_UPDATED', `Cập nhật phòng ${roomCode}: Tầng ${floor}, ${area}m² bởi ${user}`);
    return { success: true, message: 'Cập nhật thông tin phòng thành công', room: updatedRoom };
  };

  // UC-PH-07: Ghi nhận hoàn tất một tháng tiền cọc và một tháng tiền thuê đầu
  const recordInitialPaymentPH07 = (params: {
    roomCode: string;
    leaseId: string;
    contractId: string;
    depositAmount: number;
    firstMonthRentAmount: number;
    actualAmount: number;
    receivedDate: string;
    transactionCode: string;
    bankAccountReceived: string;
    proofFile?: string;
  }) => {
    // Hợp đồng gia hạn không thu cọc mới
    const targetContract = contracts.find(c => c.id === params.contractId);
    if (targetContract && targetContract.contractType === 'Hợp đồng nối tiếp') {
      return { success: false, message: 'Hợp đồng nối tiếp kế thừa cọc gốc từ hợp đồng đầu, không thu cọc ban đầu mới (BR-UC.PH.07-04).' };
    }

    // Đúng đủ 1 tháng cọc + 1 tháng thuê đầu
    const totalRequired = params.depositAmount + params.firstMonthRentAmount;
    if (params.actualAmount !== totalRequired) {
      return {
        success: false,
        message: `EF-01: Số tiền thực nhận (${params.actualAmount.toLocaleString('vi-VN')} đ) không khớp tổng 1 tháng cọc + 1 tháng tiền thuê (${totalRequired.toLocaleString('vi-VN')} đ). Không xác nhận và không cho nhận phòng.`
      };
    }

    // Check duplicate transaction code
    if (initialPaymentRecords.some(p => p.transactionCode === params.transactionCode)) {
      return { success: false, message: 'Mã giao dịch đã tồn tại trên hệ thống. Vui lòng kiểm tra lại để tránh ghi trùng (AF-02).' };
    }

    const depositCode = 'COC-' + params.roomCode.replace(/[^0-9a-zA-Z]/g, '') + '-L1';
    const rentPeriodNote = targetContract?.batchCode ? `Kỳ thuê đầu (${targetContract.batchCode})` : 'Kỳ thuê đầu';

    const newPaymentRecord: InitialPaymentRecord = {
      id: 'pay07_' + Date.now(),
      contractId: params.contractId,
      roomCode: params.roomCode,
      leaseId: params.leaseId,
      depositAmount: params.depositAmount,
      firstMonthRentAmount: params.firstMonthRentAmount,
      actualAmount: params.actualAmount,
      receivedDate: params.receivedDate,
      transactionCode: params.transactionCode,
      bankAccountReceived: params.bankAccountReceived,
      proofFile: params.proofFile,
      depositCode,
      rentPeriodNote,
      confirmedBy: currentUser?.fullName || 'Chủ nhà',
      confirmedAt: new Date().toISOString()
    };

    setInitialPaymentRecords(prev => [newPaymentRecord, ...prev]);

    // Cập nhật hợp đồng
    setContracts(prev => prev.map(c => c.id === params.contractId ? {
      ...c,
      firstMonthRentPaid: true,
      initialDepositCode: depositCode
    } : c));

    // Cập nhật phòng
    setRooms(prev => prev.map(r => r.roomCode === params.roomCode ? {
      ...r,
      hasDeposit: true,
      firstMonthRentPaid: true,
      firstMonthPeriod: rentPeriodNote
    } : r));

    logSecurity('PH07_PAYMENT_RECORDED', `Room ${params.roomCode} recorded deposit (${params.depositAmount}) & 1st rent (${params.firstMonthRentAmount}) via txn ${params.transactionCode}`);
    return { success: true, message: 'Ghi nhận hoàn tất một tháng tiền cọc và một tháng tiền thuê đầu thành công! Đã lưu 2 dòng riêng biệt.' };
  };

  // UC-PH-07 AF-03: Đính chính thông tin chứng cứ chuyển khoản có lịch sử
  const correctInitialPaymentPH07 = (id: string, reason: string, updatedFields: Partial<InitialPaymentRecord>) => {
    if (!reason.trim()) {
      return { success: false, message: 'Vui lòng nhập lý do đính chính thông tin.' };
    }
    const record = initialPaymentRecords.find(p => p.id === id);
    if (!record) return { success: false, message: 'Không tìm thấy bản ghi thanh toán.' };

    const correctionHistory = record.correctionHistory || [];
    const now = new Date().toISOString();
    const user = currentUser?.fullName || 'Chủ nhà';

    const historyItems = Object.entries(updatedFields).map(([k, v]) => ({
      field: k,
      oldVal: String((record as any)[k] || ''),
      newVal: String(v || ''),
      reason,
      correctedBy: user,
      correctedAt: now
    }));

    setInitialPaymentRecords(prev => prev.map(p => p.id === id ? {
      ...p,
      ...updatedFields,
      // Không cho sửa đổi số tiền cọc gốc tùy tiện 
      depositAmount: record.depositAmount,
      correctionHistory: [...correctionHistory, ...historyItems]
    } : p));

    logSecurity('PH07_CORRECTION', `Payment ${id} corrected by ${user}: ${reason}`);
    return { success: true, message: 'Đính chính thông tin chứng từ thành công! Lịch sử đã được ghi nhận.' };
  };

  // UC-PH-05: Kiểm tra điều kiện nhận phòng & xác nhận hoàn tất nhận phòng
  const confirmCheckInPH05 = (roomCode: string, leaseId: string, actualCheckInDate: string, handoverReportId?: string, handoverVersion?: string) => {
    const room = rooms.find(r => r.roomCode === roomCode);
    const contract = contracts.find(c => c.leaseId === leaseId) || contracts.find(c => c.roomCode === roomCode && (c.status === 'Hiệu lực' || c.status === 'Đã ký' || c.status === 'Chờ hiệu lực'));
    const report = handoverReports.find(h => (h.leaseId === leaseId || h.roomCode === roomCode) && h.status === 'Đã xác nhận');

    // Tiêu chí 1: Hợp đồng đã ký
    if (!contract || (!contract.isSignedPaper && contract.status !== 'Hiệu lực' && contract.status !== 'Đã ký' && contract.status !== 'Chờ hiệu lực')) {
      return { success: false, message: 'Tiêu chí 1 Chưa đạt: Hợp đồng chưa ký hoặc chưa có hiệu lực (EF-02).' };
    }

    // Tiêu chí 2 & 3: Cọc 1 tháng & Thuê đầu 1 tháng tại UC-PH-07
    if (!contract.firstMonthRentPaid || !room?.firstMonthRentPaid || !room?.hasDeposit) {
      return { success: false, message: 'Tiêu chí 2 & 3 Chưa đạt: Chưa thu đủ 1 tháng tiền cọc và 1 tháng tiền thuê đầu tại UC-PH-07 (EF-01). Không cho nhận phòng trước rồi nộp bù.' };
    }

    // Tiêu chí 4: Bàn giao nhận thực tế hoàn tất & UC-BG03 Đã xác nhận (hai bên đã ký tay)
    if (!report) {
      return { success: false, message: 'Tiêu chí 4 Chưa đạt: Biên bản nhận phòng UC-BG03 chưa ở trạng thái Đã xác nhận (chưa có chữ ký tay hai bên).' };
    }

    // Lưu ngày nhận phòng thực tế, chuyển trạng thái Đang thuê theo UC-PH-04
    setRooms(prev => prev.map(r => r.roomCode === roomCode ? {
      ...r,
      status: 'Đang thuê',
      currentTenantId: contract.tenantId,
      currentTenantName: contract.tenantName,
      contractStartDate: actualCheckInDate,
      contractEndDate: contract.endDate,
      currentContractId: contract.id,
      currentLeaseId: contract.leaseId,
      totalOccupants: Math.max(1, r.totalOccupants),
      firstMonthPeriod: `Từ ${actualCheckInDate} đến cuối kỳ`
    } : r));

    setContracts(prev => prev.map(c => c.id === contract.id ? {
      ...c,
      status: 'Hiệu lực',
      actualCheckInDate
    } : c));

    // Phát sự kiện Bắt đầu lần thuê cho HSKT-02 để kiểm tra người ở cùng Dự kiến (không tự chuyển sang Đang cư trú)
    const newEvent: LeaseStartEvent = {
      eventId: 'evt_ls_' + Date.now(),
      roomCode,
      contractId: contract.id,
      leaseId: contract.leaseId,
      checkInDate: actualCheckInDate,
      handoverReportId: report.id,
      handoverVersion: handoverVersion || 'v1.0',
      emittedAt: new Date().toISOString(),
      coTenantsChecked: true,
      syncStatus: 'Đã gửi HSKT-02'
    };
    setLeaseStartEvents(prev => [newEvent, ...prev]);

    // Ghi lịch sử phòng
    const checkInLog: RoomHistoryLog = {
      id: 'rl_' + Date.now() + '_checkin',
      roomCode,
      field: 'Tiếp nhận phòng ',
      oldValue: `Trạng thái: ${room?.status || 'Trống'}`,
      newValue: `Đang thuê (Ngày nhận thực tế: ${actualCheckInDate}, Khách: ${contract.tenantName})`,
      changedBy: currentUser?.fullName || 'Chủ nhà',
      changedAt: new Date().toISOString()
    };
    setRoomHistory(prev => [checkInLog, ...prev]);

    logSecurity('PH05_CHECKIN_CONFIRMED', `Room ${roomCode} check-in confirmed on ${actualCheckInDate}. Status -> Đang thuê. Event ${newEvent.eventId} emitted to HSKT-02`);
    return { success: true, message: `Xác nhận nhận phòng hoàn tất! Phòng ${roomCode} đã chuyển sang Đang thuê. Kỳ thuê đầu được chốt từ ngày ${actualCheckInDate}. Sự kiện Bắt đầu lần thuê đã phát tới HSKT-02.` };
  };

  // UC-PH-06: Ghi nhận điều kiện còn thiếu
  const saveMissingConditionPH06 = (params: {
    roomCode: string;
    contractId: string;
    leaseId: string;
    missingContractEffect: boolean;
    missingHandover: boolean;
    notes: string;
    isTenantStoppedProcedure?: boolean;
    tenantStopReason?: string;
    tenantStopContent?: string;
  }) => {
    // BR-UC.PH.06-01 & Bắt buộc hai khoản thanh toán đã Đạt
    const room = rooms.find(r => r.roomCode === params.roomCode);
    const contract = contracts.find(c => c.id === params.contractId);
    if (!room?.hasDeposit || !room?.firstMonthRentPaid || !contract?.firstMonthRentPaid) {
      return {
        success: false,
        message: 'Khóa chức năng UC-PH-06: Hai khoản tiền cọc 1 tháng và tiền thuê đầu 1 tháng chưa được xác minh Đạt. Vui lòng tra soát tại UC-PH-07 (BR-UC.PH.06-01/02).'
      };
    }

    if (!params.notes.trim() && !params.isTenantStoppedProcedure) {
      return { success: false, message: 'EF-01: Vui lòng nhập nội dung ghi chú điều kiện còn thiếu.' };
    }

    const newLog: MissingConditionLog = {
      id: 'mc_' + Date.now(),
      roomCode: params.roomCode,
      contractId: params.contractId,
      leaseId: params.leaseId,
      missingContractEffect: params.missingContractEffect,
      missingHandover: params.missingHandover,
      notes: params.notes,
      isTenantStoppedProcedure: params.isTenantStoppedProcedure,
      tenantStopReason: params.tenantStopReason,
      tenantStopContent: params.tenantStopContent,
      loggedBy: currentUser?.fullName || 'Chủ nhà',
      loggedAt: new Date().toISOString(),
      status: params.isTenantStoppedProcedure ? 'Khách dừng thủ tục' : 'Đang theo dõi'
    };

    setMissingConditionLogs(prev => [newLog, ...prev]);

    // Khách dừng thủ tục không đồng nghĩa hợp đồng bị hủy, tiền được hoàn hay phòng đổi trạng thái
    logSecurity('PH06_MISSING_CONDITION_SAVED', `Room ${params.roomCode} recorded missing condition. Status: ${newLog.status}`);
    return {
      success: true,
      message: params.isTenantStoppedProcedure
        ? 'Đã ghi nhận khách chủ động dừng làm thủ tục. Hợp đồng và phòng được giữ nguyên '
        : 'Đã lưu ghi nhận điều kiện còn thiếu thành công! Phòng giữ nguyên trạng thái để theo dõi.'
    };
  };

  const updateExpectedReturnDatePH11_12 = (params: {
    roomCode: string;
    leaseId: string;
    expectedDate: string;
    confirmSource: 'trực tiếp' | 'điện thoại' | 'tin nhắn' | 'khác';
    confirmedAt: string;
    exchangeContent: string;
    reason?: string;
  }) => {
    const room = rooms.find(r => r.roomCode === params.roomCode);
    if (!room) return { success: false, message: 'Không tìm thấy phòng.' };

    const expDate = new Date(params.expectedDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Threshold 15 days rule (BR-UC.PH.04-05, BR-UC.PH.11-03)
    const newStatus = diffDays <= 15 ? 'Sắp trả' : 'Đang thuê';

    setRooms(prev => prev.map(r => r.roomCode === params.roomCode ? {
      ...r,
      expectedReturnDate: params.expectedDate,
      status: newStatus
    } : r));

    const newLog: ReturnPlanLog = {
      id: 'rp_' + Date.now(),
      roomCode: params.roomCode,
      leaseId: params.leaseId,
      expectedDate: params.expectedDate,
      oldDate: room.expectedReturnDate,
      reason: params.reason,
      confirmSource: params.confirmSource,
      confirmedAt: params.confirmedAt,
      exchangeContent: params.exchangeContent,
      loggedBy: currentUser?.fullName || 'Chủ nhà',
      loggedAt: new Date().toISOString(),
      status: 'Còn theo dõi'
    };

    setReturnPlans(prev => [newLog, ...prev]);
    logSecurity('RETURN_DATE_RECORDED', `Room ${params.roomCode} return date: ${params.expectedDate} (diff: ${diffDays}d -> ${newStatus})`);
    return { success: true, message: `Đã lưu ngày dự kiến trả phòng. Trạng thái phòng hiện tại: ${newStatus}` };
  };

  const recordTenantContactPH13 = (params: {
    roomCode: string;
    leaseId: string;
    contactTimeActual: string;
    contactSource: 'trực tiếp' | 'điện thoại' | 'tin nhắn' | 'khác';
    contactResult: 'Chưa phản hồi' | 'Không tiếp tục thuê – Chưa xác nhận ngày dự kiến trả' | 'Chờ đối chiếu' | 'Đồng ý tiếp tục thuê';
    content: string;
    nextContactDate?: string;
    isAppointmentOnly?: boolean;
    contactChannelSource?: 'UC-PH-13' | 'UC-BG09' | 'UC-PH-09';
  }) => {
    // BR-UC.PH.13-14 & EF-04 / AF-07: Kiểm tra mâu thuẫn căn cứ ASIS-04 Tiếp tục thuê
    const activeRenewal = contracts.find(c => c.roomCode === params.roomCode && c.contractType === 'Hợp đồng nối tiếp' && (c.status === 'Hiệu lực' || c.status === 'Chờ hiệu lực'));
    let effectiveResult = params.contactResult;
    let isConflict = false;
    let hdt06Ref: string | undefined = undefined;

    if (params.contactResult === 'Không tiếp tục thuê – Chưa xác nhận ngày dự kiến trả' && activeRenewal) {
      effectiveResult = 'Chờ đối chiếu';
      isConflict = true;
      hdt06Ref = 'EVT-CONFLICT-HDT06-' + Date.now().toString().slice(-6);
    }

    const newLog: TenantContactLog = {
      id: 'tc_' + Date.now(),
      roomCode: params.roomCode,
      leaseId: params.leaseId,
      contactTimeActual: params.contactTimeActual,
      systemInputTime: new Date().toISOString(),
      contactSource: params.contactSource,
      contactResult: effectiveResult,
      content: params.content,
      nextContactDate: params.nextContactDate,
      loggedBy: currentUser?.fullName || 'Chủ nhà',
      conflictFlag: isConflict,
      hdt06Reference: hdt06Ref,
      contactChannelSource: params.contactChannelSource || 'UC-PH-13',
      isAppointmentOnly: params.isAppointmentOnly
    };

    setContactLogs(prev => [newLog, ...prev]);

    if (isConflict) {
      logSecurity('PH13_CONFLICT_DETECTED', `Room ${params.roomCode} feedback conflict with ASIS-04. Logged as Chờ đối chiếu (${hdt06Ref})`);
      return {
        success: true,
        logId: newLog.id,
        isConflict: true,
        message: `Phản hồi thực tế mâu thuẫn với hợp đồng nối tiếp ASIS-04 (${activeRenewal?.id}). Đã lưu sự kiện Chờ đối chiếu (${hdt06Ref}) và gửi tham chiếu sang UC-HDT-06  Không đổi nhãn tiếp tục thuê hiện hành.`
      };
    }

    logSecurity('PH13_CONTACT_LOGGED', `Room ${params.roomCode} contact logged: ${params.contactResult} via ${params.contactSource}`);
    return {
      success: true,
      logId: newLog.id,
      isConflict: false,
      message: params.isAppointmentOnly
        ? 'Đã lưu lịch hẹn liên hệ tiếp theo riêng vào nhật ký (Trường hợp 09).'
        : 'Đã lưu ghi nhận kết quả liên hệ khách thuê thành công!'
    };
  };

  // UC-PH-14: Hủy kế hoạch trả phòng tự động khi hợp đồng tiếp tục thuê có hiệu lực
  const autoCancelReturnPlanPH14 = (roomCode: string, renewalContractId?: string) => {
    const room = rooms.find(r => r.roomCode === roomCode);
    if (!room) return { success: false, message: 'Không tìm thấy thông tin phòng.' };

    const renewal = renewalContractId
      ? contracts.find(c => c.id === renewalContractId)
      : contracts.find(c => c.roomCode === roomCode && c.contractType === 'Hợp đồng nối tiếp' && c.status === 'Hiệu lực');

    if (!renewal || renewal.status !== 'Hiệu lực') {
      return { success: false, message: 'EF-01: Chưa có hợp đồng nối tiếp mới đã ký và có hiệu lực theo UC-HDT-07. Giữ nguyên kế hoạch trả và trạng thái phòng.' };
    }

    // Tự đánh dấu kế hoạch cũ Đã hủy do gia hạn
    setRooms(prev => prev.map(r => r.roomCode === roomCode ? {
      ...r,
      status: 'Đang thuê', // BR-UC.PH.14-03
      expectedReturnDate: undefined,
      returnPlanCancelled: true,
      returnPlanCancelReason: `Đã hủy do gia hạn (Hợp đồng: ${renewal.id})`
    } : r));

    setReturnPlans(prev => prev.map(p => (p.roomCode === roomCode && p.status === 'Còn theo dõi') ? {
      ...p,
      status: 'Đã hủy',
      reason: `Đã hủy do gia hạn hợp đồng nối tiếp ${renewal.id}`
    } : p));

    // Lịch sử phòng
    const cancelLog: RoomHistoryLog = {
      id: 'rl_' + Date.now() + '_cancel_plan',
      roomCode,
      field: 'Hủy kế hoạch trả phòng tự động ',
      oldValue: `Kế hoạch trả ngày ${room.expectedReturnDate || 'đang theo dõi'}`,
      newValue: `Đã hủy do gia hạn (Hợp đồng mới có hiệu lực: ${renewal.id}, Phòng giữ Đang thuê)`,
      changedBy: 'Hệ thống tự động ',
      changedAt: new Date().toISOString()
    };
    setRoomHistory(prev => [cancelLog, ...prev]);

    logSecurity('PH14_PLAN_AUTO_CANCELLED', `Room ${roomCode} return plan auto-cancelled due to renewal ${renewal.id}. Status -> Đang thuê.`);
    return {
      success: true,
      message: `Hệ thống đã tự động hủy kế hoạch trả cũ do hợp đồng nối tiếp ${renewal.id} đã có hiệu lực (BR-UC.PH.14-02). Phòng giữ trạng thái Đang thuê.`
    };
  };

  // UC-PH-15: Kiểm tra kết quả tiếp tục thuê
  const checkExtensionResultPH15 = (roomCode: string) => {
    const activeContract = contracts.find(c => c.roomCode === roomCode && (c.status === 'Hiệu lực' || c.contractType === 'Hợp đồng lần đầu'));
    const renewalContract = contracts.find(c => c.roomCode === roomCode && c.contractType === 'Hợp đồng nối tiếp');

    if (!renewalContract) {
      return {
        result: 'Chưa có căn cứ' as const,
        caseType: 'Trường hợp 02' as const,
        reason: 'Chưa có hợp đồng mới được lập trên hệ thống. Khách chưa có bằng chứng hợp lệ về việc tiếp tục thuê.',
        activeContract,
        renewalContract: undefined
      };
    }

    if (renewalContract.status === 'Hiệu lực') {
      return {
        result: 'Có bằng chứng hợp lệ về việc tiếp tục thuê' as const,
        caseType: 'Trường hợp 03' as const,
        reason: `Hợp đồng nối tiếp ${renewalContract.id} đã ký và đang có hiệu lực pháp lý (ngày ký: ${renewalContract.signedDate || 'Đã ký'}). Kế hoạch trả cũ đã tự hủy, phòng duy trì trạng thái Đang thuê và kế thừa cọc gốc ${renewalContract.depositAmount.toLocaleString('vi-VN')} đ (BR-UC.PH.15-03).`,
        activeContract,
        renewalContract
      };
    }

    // Trường hợp 01: Nháp hoặc Chờ hiệu lực
    return {
      result: 'Chưa có căn cứ' as const,
      caseType: 'Trường hợp 01' as const,
      reason: `Hợp đồng nối tiếp ${renewalContract.id} hiện ở trạng thái "${renewalContract.status}" (chưa có hiệu lực hoặc chưa đến ngày bắt đầu ${renewalContract.startDate}). Tiếp tục theo dõi kế hoạch trả hiện tại, không tự hủy kế hoạch.`,
      activeContract,
      renewalContract
    };
  };

  // UC-PH-08: Kiểm tra kết quả trả phòng & cập nhật trạng thái Trống
  const confirmReturnStep305AndVacantPH08 = (roomCode: string, leaseId: string, actualReturnDate?: string) => {
    const inspection = returnInspections.find(i => (i.roomCode === roomCode && i.leaseId === leaseId) || (i.roomCode === roomCode && i.step304Status === 'Đã nhận lại'));
    if (!inspection || inspection.step304Status !== 'Đã nhận lại') {
      return { success: false, message: 'EF-01: Chưa có kết quả nhận lại thực tế tại ASIS-02 bước 3.04 (3.04 != Đã nhận lại). Giữ trạng thái phòng hiện tại.' };
    }
    if (!inspection.step305Confirmed) {
      return { success: false, message: 'EF-01: Kết quả 3.04 = Đã nhận lại nhưng chưa có xác nhận độc lập tại bước 3.05 của Chủ nhà (người xác nhận và thời điểm/bằng chứng). Vui lòng xác nhận 3.05 tại ASIS-02 trước khi cập nhật Trống (BR-UC.PH.08-01).' };
    }

    const returnDate = actualReturnDate || inspection.inspectionDate || new Date().toISOString().split('T')[0];
    const room = rooms.find(r => r.roomCode === roomCode);

    setRooms(prev => prev.map(r => r.roomCode === roomCode ? {
      ...r,
      status: 'Trống',
      hasDeposit: false,
      firstMonthRentPaid: false,
      firstMonthPeriod: '',
      currentTenantId: undefined,
      currentTenantName: undefined,
      contractStartDate: undefined,
      contractEndDate: undefined,
      currentContractId: undefined,
      currentLeaseId: undefined,
      expectedReturnDate: undefined,
      totalOccupants: 0
    } : r));

    // Kết thúc kế hoạch trả nếu có
    setReturnPlans(prev => prev.map(p => (p.roomCode === roomCode && p.status === 'Còn theo dõi') ? {
      ...p,
      status: 'Đã kết thúc'
    } : p));

    // Tự lưu liên kết hợp đồng, khách thuê, người ở cùng và biên bản vào lịch sử lần thuê
    const vacateLog: RoomHistoryLog = {
      id: 'rl_' + Date.now() + '_vacate',
      roomCode,
      field: 'Kết thúc lần thuê thực tế ',
      oldValue: `Trạng thái: ${room?.status || 'Đang thuê'} (Khách: ${room?.currentTenantName || '—'})`,
      newValue: `Trạng thái: Trống (Ngày nhận lại thực tế: ${returnDate}, Biên bản: ${inspection.id}, Xác nhận 3.05 bởi ${inspection.step305ConfirmedBy || 'Chủ nhà'})`,
      changedBy: currentUser?.fullName || 'Chủ nhà',
      changedAt: new Date().toISOString()
    };
    setRoomHistory(prev => [vacateLog, ...prev]);

    logSecurity('PH08_ROOM_VACATED', `Room ${roomCode} marked Trống following 3.05 handover confirmation on ${returnDate}.`);
    return {
      success: true,
      message: `Cập nhật trạng thái Trống thành công! Ngày kết thúc lần thuê thực tế (${returnDate}) đã được ghi nhận. Không cần chờ quyết toán tiền cọc `
    };
  };

  // UC-PH-09: Ghi nhận chưa bàn giao xong
  const saveUnfinishedHandoverPH09 = (params: {
    roomCode: string;
    leaseId: string;
    contractId: string;
    handoverVersion: string;
    reason: string;
    obstacleContent: string;
    existingId?: string;
  }) => {
    // EF-02: Lý do hoặc nội dung bị bỏ trống
    if (!params.reason.trim()) {
      return { success: false, message: 'EF-02: Lý do khách chưa thể tiếp tục bàn giao là bắt buộc.' };
    }
    if (!params.obstacleContent.trim()) {
      return { success: false, message: 'EF-02: Nội dung vướng mắc thực tế là bắt buộc.' };
    }

    // BR-UC.PH.09-01 & EF-01: Chỉ tạo mới hoặc cập nhật khi kết quả thực tế vẫn là Chưa nhận lại
    const inspection = returnInspections.find(i => (i.roomCode === params.roomCode && i.leaseId === params.leaseId) || i.roomCode === params.roomCode);
    if (inspection && inspection.step304Status === 'Đã nhận lại') {
      return {
        success: false,
        message: 'EF-01: Kết quả bàn giao của phòng đã chuyển thành Đã nhận lại thực tế. Không cho phép tạo/cập nhật ghi nhận chưa bàn giao xong (BR-UC.PH.09-01).'
      };
    }

    const now = new Date().toISOString();
    const user = currentUser?.fullName || 'Chủ nhà';

    // AF-01: Cập nhật nội dung có lưu lịch sử
    if (params.existingId) {
      const existing = unfinishedHandoverLogs.find(u => u.id === params.existingId);
      if (existing) {
        const hist = existing.history || [];
        const newHistItem = {
          reason: existing.reason,
          obstacleContent: existing.obstacleContent,
          changedBy: user,
          changedAt: now
        };

        setUnfinishedHandoverLogs(prev => prev.map(u => u.id === params.existingId ? {
          ...u,
          reason: params.reason.trim(),
          obstacleContent: params.obstacleContent.trim(),
          updatedAt: now,
          updatedBy: user,
          history: [...hist, newHistItem]
        } : u));

        logSecurity('PH09_UPDATED', `Room ${params.roomCode} unfinished handover updated by ${user}`);
        return {
          success: true,
          message: 'Cập nhật nội dung vướng mắc bàn giao thành công! Lịch sử đã được lưu lại (AF-01).'
        };
      }
    }

    // Tạo mới
    const newRecord: UnfinishedHandoverLog = {
      id: 'ufh_' + Date.now(),
      roomCode: params.roomCode,
      leaseId: params.leaseId,
      contractId: params.contractId,
      handoverVersion: params.handoverVersion || 'v1.0',
      step304Status: 'Chưa nhận lại',
      notFinishedIndicator: 'Chưa kết thúc thuê', // BR-UC.PH.09-03
      reason: params.reason.trim(),
      obstacleContent: params.obstacleContent.trim(),
      loggedBy: user,
      loggedAt: now
    };

    setUnfinishedHandoverLogs(prev => [newRecord, ...prev]);

    // Ghi nhận này không phải trạng thái sử dụng phòng và không làm phòng chuyển Trống
    logSecurity('PH09_CREATED', `Room ${params.roomCode} recorded unfinished handover: ${params.reason}`);
    return {
      success: true,
      message: 'Ghi nhận chưa bàn giao xong thành công! Phòng giữ nguyên trạng thái sử dụng và gắn chỉ báo Chưa kết thúc thuê '
    };
  };

  // ==================== HANDOVER & ASSETS METHODS (QT02) ====================
  const saveInventoryBG01 = (record: InventoryRecord) => {
    setInventoryRecords(prev => {
      const idx = prev.findIndex(r => r.roomCode === record.roomCode && r.expectedBatchCode === record.expectedBatchCode);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = record;
        return updated;
      }
      return [record, ...prev];
    });
    logSecurity('INVENTORY_SAVED', `Room ${record.roomCode} inventory saved. Status: ${record.inventoryStatus}`);
  };

  const saveHandoverConditionBG02 = (condition: HandoverCondition) => {
    setHandoverConditions(prev => {
      const idx = prev.findIndex(c => c.id === condition.id || (c.roomCode === condition.roomCode && c.scope === condition.scope && c.assetName === condition.assetName));
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = condition;
        return updated;
      }
      return [condition, ...prev];
    });
    logSecurity('BG02_CONDITION_SAVED', `Room ${condition.roomCode} condition saved: ${condition.scope}`);
    return { success: true, message: 'Đã lưu hiện trạng bàn giao thành công !' };
  };

  const saveHandoverReportBG03 = (report: HandoverReport) => {
    setHandoverReports(prev => {
      const idx = prev.findIndex(r => r.id === report.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = report;
        return updated;
      }
      return [report, ...prev];
    });
  };

  const confirmHandoverSignaturesBG03 = (reportId: string, tenantSigned: boolean, ownerSigned: boolean, paperLocation?: string) => {
    setHandoverReports(prev => prev.map(r => {
      if (r.id !== reportId) return r;
      const bothSigned = tenantSigned && ownerSigned;
      return {
        ...r,
        tenantSignedPaper: tenantSigned ? 'Đã ký giấy' : 'Chưa ký',
        ownerSignedPaper: ownerSigned ? 'Đã ký giấy' : 'Chưa ký',
        status: bothSigned ? 'Đã xác nhận' : r.status,
        paperLocation: paperLocation || r.paperLocation,
        confirmedAt: bothSigned ? new Date().toISOString() : r.confirmedAt
      };
    }));
  };

  const recordIncidentBG04 = (incident: AssetIncident) => {
    setIncidents(prev => {
      const idx = prev.findIndex(i => i.id === incident.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = incident;
        return updated;
      }
      return [incident, ...prev];
    });
  };

  const recordReturnInspectionBG09 = (inspection: ReturnInspection) => {
    setReturnInspections(prev => {
      const idx = prev.findIndex(i => i.id === inspection.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = inspection;
        return updated;
      }
      return [inspection, ...prev];
    });
  };

  const confirmReturnInspectionStep305 = (
    roomCode: string,
    leaseId: string,
    evidence: string,
    photos?: string[],
    videoUrl?: string
  ) => {
    setReturnInspections(prev => prev.map(i => {
      if (i.roomCode === roomCode && i.leaseId === leaseId) {
        return {
          ...i,
          step304Status: 'Đã nhận lại',
          step305Confirmed: true,
          step305ConfirmedAt: new Date().toISOString(),
          step305ConfirmedBy: currentUser?.fullName || 'Chủ nhà',
          step305Evidence: evidence,
          step305EvidencePhotos: photos || i.step305EvidencePhotos,
          step305EvidenceVideoUrl: videoUrl || i.step305EvidenceVideoUrl,
          isDraft: false,
          version: i.version || 1
        };
      }
      return i;
    }));
    logSecurity('BG09_STEP305_CONFIRMED', `Handover return confirmed 3.05 for room ${roomCode}`);
  };

  const correctReturnInspectionStep305 = (
    roomCode: string,
    leaseId: string,
    newStatus: 'Đã nhận lại' | 'Chưa nhận lại',
    reason: string,
    evidence: string
  ) => {
    setReturnInspections(prev => prev.map(i => {
      if (i.roomCode === roomCode && i.leaseId === leaseId) {
        const nextVer = (i.version || 1) + 1;
        return {
          ...i,
          step304Status: newStatus,
          step305Confirmed: newStatus === 'Đã nhận lại',
          step305ConfirmedAt: newStatus === 'Đã nhận lại' ? new Date().toISOString() : undefined,
          step305ConfirmedBy: currentUser?.fullName || 'Chủ nhà',
          step305Evidence: evidence,
          correctionStatus: 'Sai lệch cần xử lý',
          correctionNote: reason,
          version: nextVer
        };
      }
      return i;
    }));
    logSecurity('BG09_STEP305_CORRECTED', `3.05 correction recorded for room ${roomCode}`);
  };

  const saveAssetComparisonResultBG07 = (result: AssetComparisonResult) => {
    setAssetComparisonResults(prev => {
      const idx = prev.findIndex(r => r.id === result.id || (r.roomCode === result.roomCode && r.leaseId === result.leaseId));
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = result;
        return updated;
      }
      return [result, ...prev];
    });
  };

  const initHandoverReturnReportDraftBG08 = (report: HandoverReturnReport) => {
    const existing = handoverReturnReports.find(r => r.roomCode === report.roomCode && r.leaseId === report.leaseId);
    if (existing) {
      return { success: true, message: 'Đã có biên bản trả phòng hiện hành. Hệ thống mở lại biên bản hiện có (AF-01).', report: existing };
    }
    const draftReport: HandoverReturnReport = {
      ...report,
      status: 'Nháp',
      version: 1,
      createdAt: new Date().toISOString()
    };
    setHandoverReturnReports(prev => [draftReport, ...prev]);
    return { success: true, message: 'Đã khởi tạo biên bản trả phòng (Nháp) thành công !', report: draftReport };
  };

  const syncDepositSettlementBG10 = (
    reportId: string,
    settlementData: {
      depositSettlementId: string;
      depositSettlementVersion: number;
      depositSettlementAmount: number;
      depositRefundAmount: number;
      depositDeductionAmount: number;
      depositAdditionalDue?: number;
      depositTrackingStatus: '5.8 hợp lệ – Đã thống nhất' | 'Chưa có 5.8/Chờ quyết toán' | 'Chưa thống nhất – Chờ xác nhận của khách' | 'Tranh chấp – Chờ xử lý' | 'Cần rà soát phiên bản';
      depositTrackingReason?: string;
    }
  ) => {
    setHandoverReturnReports(prev => prev.map(r => {
      if (r.id !== reportId) return r;
      return {
        ...r,
        depositSettlementId: settlementData.depositSettlementId,
        depositSettlementVersion: settlementData.depositSettlementVersion,
        depositSettlementAmount: settlementData.depositSettlementAmount,
        depositRefundAmount: settlementData.depositRefundAmount,
        depositDeductionAmount: settlementData.depositDeductionAmount,
        depositAdditionalDue: settlementData.depositAdditionalDue,
        depositTrackingStatus: settlementData.depositTrackingStatus,
        depositTrackingReason: settlementData.depositTrackingReason,
        waitingReason: settlementData.depositTrackingStatus === '5.8 hợp lệ – Đã thống nhất' ? undefined : settlementData.depositTrackingReason
      };
    }));
  };

  const saveHandoverReturnReportBG11 = (report: HandoverReturnReport) => {
    setHandoverReturnReports(prev => {
      const idx = prev.findIndex(r => r.id === report.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = report;
        return updated;
      }
      return [report, ...prev];
    });
  };

  const confirmFinalReturnReportBG11 = (
    reportId: string,
    tenantSignedStatus: 'Khách đã ký' | 'Khách không ký',
    notSignReason?: string,
    notSignExchangeInfo?: string,
    paperLocation?: string,
    scanUrl?: string
  ) => {
    const target = handoverReturnReports.find(r => r.id === reportId);
    if (!target) return { success: false, message: 'Không tìm thấy biên bản trả phòng.' };
    if (target.status !== 'Đã lập') {
      return { success: false, message: 'Biên bản phải ở trạng thái ĐÃ LẬP mới được xác nhận 3.24.' };
    }
    setHandoverReturnReports(prev => prev.map(r => {
      if (r.id !== reportId) return r;
      return {
        ...r,
        status: 'Đã xác nhận',
        tenantSignedPaper: tenantSignedStatus,
        tenantNotSignReason: notSignReason,
        tenantNotSignExchangeInfo: notSignExchangeInfo,
        ownerSignedPaper: 'Đã ký',
        paperLocation: paperLocation || r.paperLocation,
        signedDocumentScanUrl: scanUrl || r.signedDocumentScanUrl,
        confirmedAt: new Date().toISOString(),
        confirmedBy: currentUser?.fullName || 'Chủ nhà'
      };
    }));
    return { success: true, message: 'Chủ nhà đã xác nhận hoàn tất biên bản trả phòng (Bước 3.24) thành công!' };
  };

  // ==================== TENANTS METHODS (QT03 - UC-HSKT-01 -> 05) ====================
  const addTenantHSKT01 = (tenantData: {
    fullName: string;
    phoneNumber: string;
    idNumber?: string;
    address?: string;
    paperStatus: 'Đã cung cấp' | 'Chưa cung cấp';
    verificationStatus: 'Chưa xác minh' | 'Đã xác minh hợp lệ' | 'Không hợp lệ';
    isPreliminary?: boolean;
    verificationReason?: string;
    requestAdmissionCode?: string;
    notes?: string;
    evidencePaperDescription?: string;
  }) => {
    const trimmedName = tenantData.fullName?.trim();
    const trimmedPhone = tenantData.phoneNumber?.trim();
    const trimmedId = tenantData.idNumber?.trim();

    // EF-01: Thiếu họ tên hoặc thiếu cả liên hệ và định danh
    if (!trimmedName) {
      return { success: false, message: 'EF-01: Họ tên khách thuê là trường bắt buộc, không được để trống.' };
    }
    if (!trimmedPhone && !trimmedId) {
      return { success: false, message: 'EF-01: Phải có ít nhất một thông tin liên hệ (SĐT) hoặc số định danh (CCCD) để đối chiếu.' };
    }
    if (!tenantData.paperStatus) {
      return { success: false, message: 'EF-01: Tình trạng cung cấp giấy tờ là trường bắt buộc (Đã cung cấp / Chưa cung cấp).' };
    }

    // EF-02: Kiểm tra định dạng SĐT (10 số nếu có nhập)
    if (trimmedPhone && !/^(0[2-9][0-9]{8})$/.test(trimmedPhone)) {
      return { success: false, message: 'EF-02: Số điện thoại không đúng định dạng chuẩn (phải gồm 10 chữ số bắt đầu bằng 0).' };
    }

    // EF-03: Số định danh khớp hồ sơ hiện có
    if (trimmedId) {
      const existingById = tenants.find(t => t.idNumber && t.idNumber.toLowerCase() === trimmedId.toLowerCase());
      if (existingById) {
        return {
          success: false,
          tenantId: existingById.id,
          message: `EF-03: Số định danh ${trimmedId} trùng khớp với khách "${existingById.fullName}" (${existingById.id}). Đã chặn tạo trùng theo AF-01.`
        };
      }
    }

    // Nghi trùng theo tên hoặc SĐT (AF-02 / EF-04)
    const suspectDuplicates = tenants.filter(t =>
      (trimmedPhone && t.phoneNumber === trimmedPhone) ||
      (t.fullName.toLowerCase() === trimmedName.toLowerCase())
    );

    if (suspectDuplicates.length > 0 && !tenantData.verificationReason?.trim()) {
      return {
        success: false,
        message: `EF-04: Phát hiện nghi trùng với hồ sơ hiện có (${suspectDuplicates.map(s => `${s.fullName} - ${s.id}`).join(', ')}). Bắt buộc nhập căn cứ phân biệt hai người trước khi xác nhận tạo.`
      };
    }

    // BR-HSKT-01-03 & AF-03: Khách chưa cung cấp giấy tờ
    let finalVerificationStatus = tenantData.verificationStatus;
    let isPreliminary = false;
    let warning = '';

    if (tenantData.paperStatus === 'Chưa cung cấp') {
      finalVerificationStatus = 'Chưa xác minh';
      isPreliminary = true;
      warning = 'Hồ sơ sơ bộ: Khách chưa cung cấp giấy tờ định danh. Tuyệt đối không sinh số giả và phải đối chiếu giấy tờ hợp lệ trước khi ký hợp đồng (ASIS-04 bước 4.10).';
    } else if (tenantData.verificationStatus === 'Không hợp lệ') {
      // AF-06: Giấy tờ đã đối chiếu Không hợp lệ nhưng họ tên + SĐT hợp lệ
      if (trimmedPhone) {
        isPreliminary = true;
        warning = 'CẢNH BÁO: Giấy tờ đối chiếu KHÔNG HỢP LỆ. Hồ sơ sơ bộ được lưu để theo dõi liên hệ, tuyệt đối không đánh dấu đã xác minh định danh và KHÔNG được dùng để ký hợp đồng.';
      } else {
        return { success: false, message: 'EF-02: Giấy tờ không hợp lệ và không có số điện thoại liên hệ hợp lệ thay thế. Bị chặn tạo hồ sơ.' };
      }
    }

    // Tạo mã hồ sơ khách duy nhất (Không tạo mã lần thuê ở đây)
    const newId = 'HK-' + Date.now().toString().slice(-6);
    const nowIso = new Date().toISOString();
    const creator = currentUser?.fullName || 'Chủ nhà';

    const newTenant: Tenant = {
      id: newId,
      fullName: trimmedName,
      phoneNumber: trimmedPhone || '',
      idNumber: trimmedId || undefined,
      address: tenantData.address?.trim() || undefined,
      paperStatus: tenantData.paperStatus,
      verificationStatus: finalVerificationStatus,
      isPreliminary,
      preliminaryWarning: warning || undefined,
      verificationReason: tenantData.verificationReason?.trim() || undefined,
      requestAdmissionCode: tenantData.requestAdmissionCode || undefined,
      requestAdmissionLinkedAt: tenantData.requestAdmissionCode ? nowIso : undefined,
      requestAdmissionLinkedBy: tenantData.requestAdmissionCode ? creator : undefined,
      evidencePaperDescription: tenantData.evidencePaperDescription?.trim() || undefined,
      notes: tenantData.notes?.trim() || undefined,
      version: 1,
      createdAt: nowIso,
      createdBy: creator
    };

    setTenants(prev => [newTenant, ...prev]);

    // Nếu có mã yêu cầu tiếp nhận nguồn (AF-07, BR-HSKT-01-08) -> gắn mã hồ sơ khách vào yêu cầu tiếp nhận
    if (tenantData.requestAdmissionCode) {
      setReceptionRequests(prev => prev.map(r => {
        if (r.requestCode !== tenantData.requestAdmissionCode) return r;
        return {
          ...r,
          status: 'Đã gắn hồ sơ',
          linkedTenantId: newId,
          linkedAt: nowIso,
          linkedBy: creator,
          linkHistory: [
            ...(r.linkHistory || []),
            {
              timestamp: nowIso,
              action: 'Liên kết hồ sơ khách mới (AF-07)',
              by: creator,
              note: `Gắn hồ sơ ${newTenant.fullName} (${newId}) vào mã yêu cầu bất biến ${r.requestCode}`
            }
          ]
        };
      }));
    }

    // Ghi nhật ký lịch sử hồ sơ (BR-HSKT-01-05)
    setTenantHistory(prev => [{
      id: 'th_' + Date.now(),
      tenantId: newId,
      action: isPreliminary ? 'Tạo hồ sơ sơ bộ (AF-03/AF-06)' : 'Ghi nhận hồ sơ khách mới ',
      timestamp: nowIso,
      performedBy: creator,
      sourceModule: 'Tạo hồ sơ khách thuê',
      newValues: `Họ tên: ${newTenant.fullName}, SĐT: ${newTenant.phoneNumber}, Giấy tờ: ${newTenant.paperStatus} (${newTenant.verificationStatus})${warning ? ` [${warning}]` : ''}`
    }, ...prev]);

    logSecurity('TENANT_CREATED_HSKT01', `Profile ${newId} created for ${newTenant.fullName}. Preliminary: ${isPreliminary}`);

    return {
      success: true,
      tenantId: newId,
      isPreliminary,
      warning,
      message: isPreliminary
        ? `Tạo Hồ sơ sơ bộ thành công (Mã: ${newId}). Lưu ý: ${warning}`
        : `Ghi nhận hồ sơ khách thuê thành công! Mã hồ sơ: ${newId}`
    };
  };

  const addPendingReceptionDocHSKT01 = (doc: Omit<PendingReceptionDoc, 'id'>) => {
    const docId = 'DOC-' + Date.now().toString().slice(-6);
    const newDoc: PendingReceptionDoc = {
      ...doc,
      id: docId
    };
    setPendingDocs(prev => [newDoc, ...prev]);
    setTenantHistory(prev => [{
      id: 'th_' + Date.now(),
      tenantId: doc.tenantId,
      action: 'Tiếp nhận giấy tờ chờ nhận phòng (ASIS-03 3.10c / AF-05)',
      timestamp: new Date().toISOString(),
      performedBy: doc.recordedBy,
      sourceModule: 'Tạo hồ sơ khách thuê',
      evidence: `${doc.docType} (${doc.docNumber || 'Không có số'})`,
      newValues: `Nguồn: ${doc.source}, Ngày nhận: ${doc.receivedDate}, Trạng thái: ${doc.status}`
    }, ...prev]);
    return { success: true, message: `Lưu giấy tờ chờ nhận phòng thành công (Mã: ${docId}).` };
  };

  const updatePendingReceptionDocStatus = (id: string, status: 'Chờ nhận phòng' | 'Đã đối chiếu tại 3.10b' | 'Đã hoàn trả') => {
    setPendingDocs(prev => prev.map(d => d.id === id ? { ...d, status } : d));
  };

  const linkReceptionRequestHSKT01 = (requestCode: string, tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) return { success: false, message: 'Không tìm thấy hồ sơ khách để liên kết.' };
    const request = receptionRequests.find(r => r.requestCode === requestCode);
    if (!request) return { success: false, message: 'Không tìm thấy mã yêu cầu tiếp nhận nguồn.' };

    const nowIso = new Date().toISOString();
    const creator = currentUser?.fullName || 'Chủ nhà';

    setTenants(prev => prev.map(t => t.id === tenantId ? {
      ...t,
      requestAdmissionCode: requestCode,
      requestAdmissionLinkedAt: nowIso,
      requestAdmissionLinkedBy: creator
    } : t));

    setReceptionRequests(prev => prev.map(r => r.requestCode === requestCode ? {
      ...r,
      status: 'Đã gắn hồ sơ',
      linkedTenantId: tenantId,
      linkedAt: nowIso,
      linkedBy: creator,
      linkHistory: [
        ...(r.linkHistory || []),
        {
          timestamp: nowIso,
          action: 'Liên kết hồ sơ khách (AF-07)',
          by: creator,
          note: `Gắn hồ sơ ${tenant.fullName} (${tenantId}) vào yêu cầu bất biến ${requestCode}`
        }
      ]
    } : r));

    setTenantHistory(prev => [{
      id: 'th_' + Date.now(),
      tenantId,
      action: 'Liên kết mã yêu cầu tiếp nhận (AF-07)',
      timestamp: nowIso,
      performedBy: creator,
      sourceModule: 'Tạo hồ sơ khách thuê',
      newValues: `Mã yêu cầu: ${requestCode}, Phòng yêu cầu: ${request.roomCode}, Phiên bản điều kiện: ${request.conditionsVersion}`
    }, ...prev]);

    return { success: true, message: `Liên kết thành công mã yêu cầu ${requestCode} với hồ sơ khách ${tenant.fullName} (${tenantId})!` };
  };

  // ==================== CO-TENANT METHODS  ====================
  const addCoTenantHSKT02 = (coTenant: Omit<CoTenant, 'id'>) => {
    // EF-02: Kiểm tra tối thiểu tên và quan hệ
    if (!coTenant.fullName?.trim()) {
      return { success: false, message: 'EF-02: Họ tên người ở cùng là trường bắt buộc.' };
    }
    if (!coTenant.relationship?.trim()) {
      return { success: false, message: 'EF-02: Quan hệ với khách chính là trường bắt buộc.' };
    }

    // Đang cư trú: kiểm tra ngày đến thực tế & căn cứ (EF-02, EF-07)
    if (coTenant.status === 'Đang cư trú') {
      if (!coTenant.actualArrivalDate) {
        return { success: false, message: 'EF-07: Chuyển sang Đang cư trú bắt buộc phải có Ngày đến thực tế.' };
      }
      if (!coTenant.arrivalVerificationEvidence?.trim()) {
        return { success: false, message: 'EF-07: Chuyển sang Đang cư trú bắt buộc phải có Căn cứ xác nhận (giấy tờ tạm trú/khai báo).' };
      }
      // EF-03: Kiểm tra chồng lấn khoảng cư trú nếu cùng số định danh
      if (coTenant.idNumber) {
        const overlap = coTenants.find(c =>
          c.idNumber === coTenant.idNumber &&
          c.status === 'Đang cư trú'
        );
        if (overlap) {
          return {
            success: false,
            message: `EF-03: Người có số định danh ${coTenant.idNumber} đang cư trú tại phòng ${overlap.roomCode || 'khác'}. Không thể cư trú chồng lấn.`
          };
        }
      }
    }

    const coId = 'coten_' + Date.now();
    const newCoTenant: CoTenant = {
      ...coTenant,
      id: coId,
      syncStatus: 'Đã đồng bộ'
    };
    setCoTenants(prev => [...prev, newCoTenant]);

    if (coTenant.tenantId && coTenant.tenantId !== 'DRAFT') {
      setTenantHistory(prev => [{
        id: 'th_' + Date.now(),
        tenantId: coTenant.tenantId,
        action: `Thêm người ở cùng [${coTenant.status}] `,
        timestamp: new Date().toISOString(),
        performedBy: currentUser?.fullName || 'Chủ nhà',
        sourceModule: 'Người ở cùng',
        relatedLeaseId: coTenant.leaseId,
        relatedContractId: coTenant.contractId,
        newValues: `${coTenant.fullName} (${coTenant.relationship}) - Trạng thái: ${coTenant.status}${coTenant.actualArrivalDate ? `, Ngày đến thực tế: ${coTenant.actualArrivalDate}` : ''}`,
        evidence: coTenant.arrivalVerificationEvidence
      }, ...prev]);
    }

    return { success: true, id: coId, message: `Thêm người ở cùng (${coTenant.fullName}) trạng thái [${coTenant.status}] thành công!` };
  };

  const updateCoTenantStatusHSKT02 = (
    coTenantId: string,
    status: 'Nháp' | 'Dự kiến' | 'Đang cư trú' | 'Đã kết thúc',
    actualDate?: string,
    evidence?: string
  ) => {
    const target = coTenants.find(c => c.id === coTenantId);
    if (!target) return { success: false, message: 'Không tìm thấy người ở cùng.' };

    if (status === 'Đang cư trú') {
      if (!actualDate && !target.actualArrivalDate) {
        return { success: false, message: 'EF-07: Chuyển Đang cư trú bắt buộc phải nhập Ngày đến thực tế.' };
      }
      if (!evidence?.trim() && !target.arrivalVerificationEvidence?.trim()) {
        return { success: false, message: 'EF-07: Chuyển Đang cư trú bắt buộc phải có Căn cứ xác nhận cư trú.' };
      }
    }

    if (status === 'Đã kết thúc') {
      const departure = actualDate || new Date().toISOString().split('T')[0];
      if (target.actualArrivalDate && departure < target.actualArrivalDate) {
        return { success: false, message: 'EF-03: Ngày kết thúc cư trú không được trước ngày bắt đầu cư trú thực tế.' };
      }
    }

    setCoTenants(prev => prev.map(c => {
      if (c.id !== coTenantId) return c;
      return {
        ...c,
        status,
        actualArrivalDate: status === 'Đang cư trú' ? (actualDate || c.actualArrivalDate || new Date().toISOString().split('T')[0]) : c.actualArrivalDate,
        arrivalVerificationEvidence: evidence || c.arrivalVerificationEvidence,
        departureDate: status === 'Đã kết thúc' ? (actualDate || new Date().toISOString().split('T')[0]) : c.departureDate
      };
    }));

    if (target.tenantId && target.tenantId !== 'DRAFT') {
      setTenantHistory(prev => [{
        id: 'th_' + Date.now(),
        tenantId: target.tenantId,
        action: `Cập nhật trạng thái người ở cùng -> ${status} `,
        timestamp: new Date().toISOString(),
        performedBy: currentUser?.fullName || 'Chủ nhà',
        sourceModule: 'Người ở cùng',
        relatedLeaseId: target.leaseId,
        relatedContractId: target.contractId,
        oldValues: `Trạng thái: ${target.status}`,
        newValues: `Trạng thái: ${status}${actualDate ? `, Ngày: ${actualDate}` : ''}`,
        evidence
      }, ...prev]);
    }

    return { success: true, message: `Cập nhật trạng thái cư trú của ${target.fullName} thành [${status}] thành công!` };
  };

  const updateCoTenantFieldsHSKT02 = (coTenantId: string, fields: Partial<CoTenant>) => {
    const target = coTenants.find(c => c.id === coTenantId);
    if (!target) return { success: false, message: 'Không tìm thấy người ở cùng.' };

    setCoTenants(prev => prev.map(c => c.id === coTenantId ? { ...c, ...fields } : c));

    if (target.tenantId && target.tenantId !== 'DRAFT') {
      setTenantHistory(prev => [{
        id: 'th_' + Date.now(),
        tenantId: target.tenantId,
        action: 'Cập nhật thông tin người ở cùng trong kỳ thuê (AF-01.1)',
        timestamp: new Date().toISOString(),
        performedBy: currentUser?.fullName || 'Chủ nhà',
        sourceModule: 'Người ở cùng',
        newValues: JSON.stringify(fields)
      }, ...prev]);
    }

    return { success: true, message: `Cập nhật thông tin người ở cùng ${target.fullName} thành công!` };
  };

  const closeCoTenantResidencyHSKT02 = (coTenantId: string, actualReturnDate: string, eventCode: string) => {
    const target = coTenants.find(c => c.id === coTenantId);
    if (!target) return { success: false, message: 'Không tìm thấy người ở cùng.' };

    setCoTenants(prev => prev.map(c => c.id === coTenantId ? {
      ...c,
      status: 'Đã kết thúc',
      departureDate: actualReturnDate,
      checkoutEventId: eventCode,
      syncStatus: 'Đã đồng bộ'
    } : c));

    if (target.tenantId && target.tenantId !== 'DRAFT') {
      setTenantHistory(prev => [{
        id: 'th_' + Date.now(),
        tenantId: target.tenantId,
        action: 'Đóng cư trú theo ngày nhận lại thực tế (ASIS-03 3.14 / AF-03)',
        timestamp: new Date().toISOString(),
        performedBy: currentUser?.fullName || 'Chủ nhà',
        sourceModule: 'Người ở cùng',
        relatedLeaseId: target.leaseId,
        actualReturnDate,
        actualLeaseEndDate: actualReturnDate,
        newValues: `${target.fullName} kết thúc cư trú ngày ${actualReturnDate} theo sự kiện bàn giao trả ${eventCode}`
      }, ...prev]);
    }

    return { success: true, message: `Đã đóng cư trú của ${target.fullName} theo ngày nhận lại thực tế ${actualReturnDate}.` };
  };

  const linkConsecutiveContractCoTenantHSKT02 = (tenantId: string, newContractId: string) => {
    setCoTenants(prev => prev.map(c => {
      if (c.tenantId !== tenantId || c.status !== 'Đang cư trú') return c;
      return {
        ...c,
        contractId: newContractId,
        consecutiveChainLinked: true
      };
    }));

    setTenantHistory(prev => [{
      id: 'th_' + Date.now(),
      tenantId,
      action: 'Nối tiếp chuỗi cư trú sang hợp đồng gia hạn (AF-04 / BR-HSKT02-04)',
      timestamp: new Date().toISOString(),
      performedBy: currentUser?.fullName || 'Chủ nhà',
      sourceModule: 'Người ở cùng',
      relatedContractId: newContractId,
      newValues: `Tự động liên kết hợp đồng mới ${newContractId} vào chuỗi cư trú đang mở, không tạo trùng người và không đóng người cũ.`
    }, ...prev]);

    return { success: true, message: `Liên kết hợp đồng gia hạn ${newContractId} vào chuỗi cư trú thành công!` };
  };

  // ==================== PROPOSALS & PRE-SIGN  ====================
  const createOrUpdateProposalHSKT03 = (proposal: Omit<TenantChangeProposal, 'id' | 'version'> & { id?: string; version?: number }) => {
    const propId = proposal.id || 'BDL-' + Date.now().toString().slice(-6);
    const version = (proposal.version || 0) + 1;

    const newProposal: TenantChangeProposal = {
      ...proposal,
      id: propId,
      version,
      isValid: true,
      verificationResult: proposal.verificationResult || 'Chưa xác minh'
    };

    setTenantProposals(prev => {
      const idx = prev.findIndex(p => p.id === propId);
      if (idx >= 0) {
        const u = [...prev];
        u[idx] = newProposal;
        return u;
      }
      return [newProposal, ...prev];
    });

    return { success: true, proposalId: propId, message: `Lưu bộ dữ liệu đề nghị thay đổi [${propId} v${version}] thành công!` };
  };

  const verifyProposalResultHSKT03 = (
    proposalId: string,
    result: 'Đạt' | 'Chưa đạt' | 'Chưa xác minh',
    reason?: string,
    distinctionBasis?: string
  ) => {
    const target = tenantProposals.find(p => p.id === proposalId);
    if (!target) return { success: false, message: 'Không tìm thấy bộ dữ liệu đề nghị thay đổi.' };

    const nowIso = new Date().toISOString();
    const verifier = currentUser?.fullName || 'Chủ nhà';

    setTenantProposals(prev => prev.map(p => {
      if (p.id !== proposalId) return p;
      return {
        ...p,
        verificationResult: result,
        verifiedAt: nowIso,
        verifiedBy: verifier,
        reason,
        distinctionBasis,
        isValid: true
      };
    }));

    setTenantHistory(prev => [{
      id: 'th_' + Date.now(),
      tenantId: target.tenantId,
      action: `Kiểm tra đề nghị thay đổi -> ${result} `,
      timestamp: nowIso,
      performedBy: verifier,
      sourceModule: 'Kiểm tra thay đổi',
      evidence: target.evidenceNote,
      newValues: `Bộ ${proposalId} (v${target.version}): Kết quả = ${result}${reason ? `. Lý do: ${reason}` : ''}${distinctionBasis ? `. Căn cứ phân biệt: ${distinctionBasis}` : ''}`
    }, ...prev]);

    return { success: true, message: `Xác nhận kết quả kiểm tra [${result}] cho bộ dữ liệu ${proposalId} thành công!` };
  };

  const transferProposalToUpdateHSKT03 = (proposalId: string) => {
    const target = tenantProposals.find(p => p.id === proposalId);
    if (!target) return { success: false, message: 'Không tìm thấy bộ dữ liệu đề nghị thay đổi.' };
    if (target.verificationResult !== 'Đạt' || !target.isValid) {
      return { success: false, message: 'Chỉ bộ dữ liệu có kết quả ĐẠT và còn hiệu lực mới được chuyển sang HSKT-04 cập nhật.' };
    }

    setTenantProposals(prev => prev.map(p => p.id === proposalId ? {
      ...p,
      isTransferredToUpdate: true,
      transferredAt: new Date().toISOString()
    } : p));

    return { success: true, message: `Đã chuyển nguyên bộ dữ liệu ${proposalId} sang HSKT-04 để cập nhật!` };
  };

  const recordPreSignVerificationHSKT03 = (verification: Omit<PreSignIdentityVerification, 'id' | 'verifiedAt' | 'verifiedBy' | 'purpose' | 'isValid'>) => {
    const verId = 'PSV-' + Date.now().toString().slice(-6);
    const nowIso = new Date().toISOString();
    const verifier = currentUser?.fullName || 'Chủ nhà';

    const newRecord: PreSignIdentityVerification = {
      ...verification,
      id: verId,
      verifiedAt: nowIso,
      verifiedBy: verifier,
      purpose: 'Ký hợp đồng ASIS-04 bước 4.10',
      isValid: true
    };

    setPreSignVerifications(prev => [newRecord, ...prev]);

    setTenantHistory(prev => [{
      id: 'th_' + Date.now(),
      tenantId: verification.tenantId,
      action: 'Đối chiếu định danh khách cũ trước ký hợp đồng (AF-06 / BR-HSKT-03-10)',
      timestamp: nowIso,
      performedBy: verifier,
      sourceModule: 'Kiểm tra thay đổi',
      relatedContractId: verification.contractId,
      evidence: `${verification.docType} (${verification.docNumber}): ${verification.evidence}`,
      newValues: `Kết quả đối chiếu: ${verification.result}. Không phát sinh thay đổi trường hồ sơ cá nhân.`
    }, ...prev]);

    return { success: true, message: `Ghi nhận đối chiếu định danh trước ký [${verification.result}] thành công (Mã: ${verId})!` };
  };

  // ==================== APPLY UPDATE  ====================
  const applyTenantUpdateHSKT04 = (tenantId: string, updatedFields: Partial<Tenant>, proposalId?: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) return { success: false, message: 'EF-01: Không tìm thấy hồ sơ khách để cập nhật.' };

    // Kiểm tra kết quả HSKT-03 Đạt còn hiệu lực (BR-HSKT-04-02)
    if (proposalId) {
      const proposal = tenantProposals.find(p => p.id === proposalId);
      if (!proposal) {
        return { success: false, message: 'EF-02: Không tìm thấy bộ dữ liệu đề nghị thay đổi tương ứng.' };
      }
      if (proposal.verificationResult !== 'Đạt' || !proposal.isValid) {
        return { success: false, message: 'EF-02: Bộ dữ liệu chưa đạt kết quả ĐẠT hoặc đã bị vô hiệu do thay đổi sau kiểm tra. Bắt buộc kiểm tra lại tại HSKT-03.' };
      }
    }

    // AF-03: Kiểm tra không có thay đổi thực tế
    let hasActualChange = false;
    const oldValuesObj: Record<string, any> = {};
    const newValuesObj: Record<string, any> = {};

    for (const key of Object.keys(updatedFields) as (keyof Tenant)[]) {
      if (updatedFields[key] !== undefined && (tenant as any)[key] !== (updatedFields as any)[key]) {
        hasActualChange = true;
        oldValuesObj[key] = (tenant as any)[key];
        newValuesObj[key] = (updatedFields as any)[key];
      }
    }

    if (!hasActualChange) {
      return { success: false, message: 'AF-03: Dữ liệu mới hoàn toàn trùng khớp với hồ sơ hiện tại. Không có thay đổi thực tế để cập nhật.' };
    }

    // Cập nhật hồ sơ gốc
    const nowIso = new Date().toISOString();
    const updater = currentUser?.fullName || 'Chủ nhà';
    const newVersion = (tenant.version || 1) + 1;

    setTenants(prev => prev.map(t => {
      if (t.id !== tenantId) return t;
      return {
        ...t,
        ...updatedFields,
        version: newVersion
      };
    }));

    // Ghi nhật ký trước/sau đầy đủ (BR-HSKT-04-05)
    setTenantHistory(prev => [{
      id: 'th_' + Date.now(),
      tenantId,
      action: 'Cập nhật hồ sơ khách thuê thành công ',
      timestamp: nowIso,
      performedBy: updater,
      sourceModule: 'Cập nhật hồ sơ',
      oldValues: JSON.stringify(oldValuesObj),
      newValues: JSON.stringify(newValuesObj)
    }, ...prev]);

    logSecurity('TENANT_UPDATED_HSKT04', `Updated tenant ${tenantId} to v${newVersion} by ${updater}`);

    return { success: true, message: `Cập nhật hồ sơ khách thuê (${tenant.fullName}) thành công (v${newVersion})!` };
  };

  // ==================== CONTRACTS (QT04) ====================
  const addBatchSchedule = (batch: BatchSchedule) => {
    setBatchSchedules(prev => {
      const idx = prev.findIndex(b => b.batchCode === batch.batchCode);
      if (idx >= 0) {
        const u = [...prev];
        u[idx] = batch;
        return u;
      }
      return [...prev, batch];
    });
  };

  const updateBatchScheduleHDT05 = (batchCode: string, updates: Partial<BatchSchedule>) => {
    setBatchSchedules(prev => prev.map(b => {
      if (b.batchCode === batchCode) {
        return { ...b, ...updates };
      }
      return b;
    }));
    logSecurity('BATCH_SCHEDULE_UPDATED', `Batch schedule ${batchCode} updated`);
    return { success: true, message: 'Cập nhật lịch đợt hợp đồng chung thành công!' };
  };

  // ==================== UC-HDT-01: ĐIỀU CHỈNH ĐIỀU KIỆN THUÊ (4.4a → 4.5) ====================
  const checkLeaseConditionHDT01 = (condition: Partial<LeaseConditionDraft>) => {
    const blockingErrors: string[] = [];
    const warnings: string[] = [];

    // 1. Kiểm tra phòng
    if (!condition.roomCode) {
      blockingErrors.push('Chưa chọn phòng dự kiến');
    } else {
      const room = rooms.find(r => r.roomCode === condition.roomCode);
      if (!room) {
        blockingErrors.push(`Không tìm thấy phòng ${condition.roomCode}`);
      }

      // So trùng lịch hợp đồng đã ký
      if (condition.startDate && condition.endDate) {
        const condStart = new Date(condition.startDate).getTime();
        const condEnd = new Date(condition.endDate).getTime();

        const overlappingContract = contracts.find(c => {
          if (c.roomCode !== condition.roomCode) return false;
          if (c.status !== 'Hiệu lực' && c.status !== 'Chờ hiệu lực') return false;
          const cStart = new Date(c.startDate).getTime();
          const cEnd = new Date(c.endDate).getTime();
          return (condStart < cEnd && condEnd > cStart);
        });

        if (overlappingContract) {
          blockingErrors.push(`Lỗi chặn ký: Phòng ${condition.roomCode} đã có hợp đồng hiệu lực ${overlappingContract.id} (${overlappingContract.startDate} → ${overlappingContract.endDate})`);
        }
      }
    }

    // 2. Kiểm tra đợt chung
    if (!condition.batchCode) {
      blockingErrors.push('Chưa chọn đợt hợp đồng chung');
    } else {
      const batch = batchSchedules.find(b => b.batchCode === condition.batchCode);
      if (!batch) {
        blockingErrors.push(`Đợt ${condition.batchCode} không tồn tại trong hệ thống`);
      } else if (!batch.isConfirmed) {
        warnings.push(`Cảnh báo: Đợt ${condition.batchCode} chưa được xác nhận lịch chính thức`);
      }
    }

    // 3. Đơn giá và cọc
    if (!condition.monthlyRent || condition.monthlyRent <= 0) {
      blockingErrors.push('Đơn giá thuê hàng tháng phải lớn hơn 0');
    } else {
      if (condition.depositAmount !== condition.monthlyRent) {
        warnings.push(`Cảnh báo quy tắc cọc: Tiền cọc dự kiến chuẩn bằng 1 tháng thuê (${condition.monthlyRent?.toLocaleString('vi-VN')} đ)`);
      }
    }

    // 4. Kiểm tra hồ sơ khách nếu có
    if (condition.tenantId) {
      const tenant = tenants.find(t => t.id === condition.tenantId);
      if (tenant && (tenant.isPreliminary || tenant.verificationStatus === 'Chưa xác minh')) {
        warnings.push('Cảnh báo hồ sơ sơ bộ: Khách chưa đối chiếu giấy tờ nhân thân gốc. Bắt buộc đối chiếu trước bước ký 4.10 tại UC-HDT-04.');
      }
    }

    const roomAvailable = blockingErrors.every(e => !e.includes('Phòng'));
    const batchConfirmed = blockingErrors.every(e => !e.includes('Đợt'));
    const isValid = blockingErrors.length === 0;

    return {
      isValid,
      roomAvailable,
      batchConfirmed,
      blockingErrors,
      warnings
    };
  };

  const saveLeaseConditionHDT01 = (conditionData: Omit<LeaseConditionDraft, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy' | 'version'> & { id?: string }) => {
    const nowStr = new Date().toISOString();
    const userName = currentUser?.fullName || 'Nguyễn Văn An (Chủ nhà)';

    // Kiểm tra tính hợp lệ sơ bộ
    const checkRes = checkLeaseConditionHDT01(conditionData);

    let savedId = conditionData.id;
    let savedVersion = 1;

    setLeaseConditions(prev => {
      const existingIdx = prev.findIndex(c => (conditionData.id && c.id === conditionData.id) || (conditionData.requestCode && c.requestCode === conditionData.requestCode));

      if (existingIdx >= 0) {
        const existing = prev[existingIdx];
        savedId = existing.id;
        savedVersion = existing.version + 1;

        const changeDetails = `Cập nhật v${savedVersion}: Giá ${conditionData.monthlyRent.toLocaleString('vi-VN')} đ, Cọc ${conditionData.depositAmount.toLocaleString('vi-VN')} đ, Phòng ${conditionData.roomCode}, Đợt ${conditionData.batchCode}`;

        const updatedHistory = [
          ...(existing.history || []),
          {
            version: savedVersion,
            timestamp: nowStr,
            by: userName,
            changes: changeDetails,
            note: conditionData.termsNote
          }
        ];

        const updated: LeaseConditionDraft = {
          ...existing,
          ...conditionData,
          id: existing.id,
          version: savedVersion,
          updatedAt: nowStr,
          updatedBy: userName,
          checkResult: {
            ...checkRes,
            checkedAt: nowStr
          },
          history: updatedHistory
        };

        const copy = [...prev];
        copy[existingIdx] = updated;
        return copy;
      } else {
        savedId = 'COND-' + Date.now().toString().slice(-6);
        savedVersion = 1;

        const newCondition: LeaseConditionDraft = {
          ...conditionData,
          id: savedId,
          version: 1,
          status: conditionData.status || 'Đang trao đổi',
          tenantAgreed44a1: conditionData.tenantAgreed44a1 || false,
          createdAt: nowStr,
          createdBy: userName,
          updatedAt: nowStr,
          updatedBy: userName,
          paymentMethod: 'Chuyển khoản',
          checkResult: {
            ...checkRes,
            checkedAt: nowStr
          },
          history: [
            {
              version: 1,
              timestamp: nowStr,
              by: userName,
              changes: `Khởi tạo bộ điều kiện thuê theo yêu cầu ${conditionData.requestCode}`,
              note: conditionData.termsNote
            }
          ]
        };

        return [newCondition, ...prev];
      }
    });

    // Cập nhật versions sang receptionRequests nếu có
    if (conditionData.requestCode) {
      setReceptionRequests(prev => prev.map(r => {
        if (r.requestCode === conditionData.requestCode) {
          return {
            ...r,
            conditionsVersion: `v${savedVersion}.0 (Giá ${conditionData.monthlyRent.toLocaleString('vi-VN')} đ, cọc 1 tháng)`,
            roomCode: conditionData.roomCode || r.roomCode
          };
        }
        return r;
      }));
    }

    logSecurity('LEASE_CONDITION_SAVED', `Lease condition ${savedId} v${savedVersion} saved for req ${conditionData.requestCode}`);
    return {
      success: true,
      conditionId: savedId!,
      version: savedVersion,
      message: `Đã lưu bộ điều kiện thuê thành công (Phiên bản v${savedVersion})!`
    };
  };

  const updateLeaseConditionStatusHDT01 = (requestCode: string, agreed: boolean, note?: string) => {
    const nowStr = new Date().toISOString();
    const userName = currentUser?.fullName || 'Nguyễn Văn An (Chủ nhà)';

    setLeaseConditions(prev => prev.map(c => {
      if (c.requestCode === requestCode) {
        const nextStatus: LeaseConditionDraft['status'] = agreed ? 'Đã thống nhất' : 'Đang trao đổi';
        const historyEntry = {
          version: c.version,
          timestamp: nowStr,
          by: userName,
          changes: agreed ? 'Khách đã đồng ý điều kiện thuê tại 4.4a1' : 'Khách yêu cầu điều chỉnh thêm điều kiện thuê',
          note: note || (agreed ? 'Thống nhất điều kiện, sẵn sàng lập dự thảo HD-02' : 'Tiếp tục thương lượng')
        };
        return {
          ...c,
          tenantAgreed44a1: agreed,
          status: nextStatus,
          updatedAt: nowStr,
          updatedBy: userName,
          history: [...(c.history || []), historyEntry]
        };
      }
      return c;
    }));

    logSecurity('LEASE_CONDITION_FEEDBACK', `Condition req ${requestCode} agreed: ${agreed}`);
    return {
      success: true,
      message: agreed
        ? 'Khách đã đồng ý điều kiện (4.4a1). Sẵn sàng chuyển sang Lập dự thảo hợp đồng (HDT-02)!'
        : 'Đã cập nhật trạng thái: Đang tiếp tục trao đổi với khách.'
    };
  };

  const cancelLeaseConditionHDT01 = (requestCode: string, reason: string) => {
    const nowStr = new Date().toISOString();
    const userName = currentUser?.fullName || 'Nguyễn Văn An (Chủ nhà)';

    setLeaseConditions(prev => prev.map(c => {
      if (c.requestCode === requestCode) {
        return {
          ...c,
          status: 'Đã hủy',
          updatedAt: nowStr,
          updatedBy: userName,
          history: [
            ...(c.history || []),
            {
              version: c.version,
              timestamp: nowStr,
              by: userName,
              changes: 'Hủy bộ điều kiện thuê',
              note: reason
            }
          ]
        };
      }
      return c;
    }));

    setReceptionRequests(prev => prev.map(r => {
      if (r.requestCode === requestCode) {
        return {
          ...r,
          status: 'Đã dừng',
          linkHistory: [
            ...(r.linkHistory || []),
            {
              timestamp: nowStr,
              action: 'Dừng yêu cầu tiếp nhận',
              by: userName,
              note: `Lý do: ${reason}`
            }
          ]
        };
      }
      return r;
    }));

    logSecurity('LEASE_CONDITION_CANCELLED', `Condition req ${requestCode} cancelled. Reason: ${reason}`);
    return { success: true, message: 'Đã hủy bộ điều kiện thuê và dừng yêu cầu tiếp nhận.' };
  };

  // ==================== UC-HDT-02: LẬP DỰ THẢO HỢP ĐỒNG (4.5 → 4.8) ====================
  const createContractDraftHDT02 = (contractData: Omit<Contract, 'id' | 'status' | 'isSignedPaper' | 'version'>) => {
    const nowStr = new Date().toISOString();
    const userName = currentUser?.fullName || 'Nguyễn Văn An (Chủ nhà)';

    // Kiểm tra tiền cọc = 1 tháng thuê (BR-HDT02-02)
    if (contractData.depositAmount !== contractData.monthlyRent) {
      contractData.depositAmount = contractData.monthlyRent;
    }

    // Sinh mã hợp đồng chuẩn: HD-[roomCode]-[Date]
    const contractId = 'HD-' + contractData.roomCode.replace(/\D/g, '') + '-' + Date.now().toString().slice(-4);
    
    // Sinh mã lần thuê chuẩn nếu chưa có: THUE-[roomCode]-L[n]
    const existingRoomContracts = contracts.filter(c => c.roomCode === contractData.roomCode);
    const leaseNumber = existingRoomContracts.length + 1;
    const leaseId = contractData.leaseId || `THUE-${contractData.roomCode.replace(/\D/g, '')}-L${leaseNumber}`;

    const newContract: Contract = {
      ...contractData,
      id: contractId,
      leaseId,
      status: 'Nháp',
      isSignedPaper: false,
      firstMonthRentAmount: contractData.monthlyRent, // 1 tháng tiền thuê
      firstMonthRentPaid: contractData.firstMonthRentPaid || false,
      paymentMethod: 'Chuyển khoản', // BR-HDT02-04
      version: 1,
      createdAt: nowStr,
      createdBy: userName,
      history: [
        {
          version: 1,
          action: 'Lập dự thảo hợp đồng',
          timestamp: nowStr,
          by: userName,
          note: `Khởi tạo hợp đồng nháp từ yêu cầu ${contractData.requestCode || 'trực tiếp'}`
        }
      ]
    };

    setContracts(prev => [newContract, ...prev]);

    // Nếu từ requestCode, cập nhật trạng thái condition & reception
    if (contractData.requestCode) {
      setLeaseConditions(prev => prev.map(c => {
        if (c.requestCode === contractData.requestCode) {
          return {
            ...c,
            status: 'Đã tạo hợp đồng',
            updatedAt: nowStr,
            updatedBy: userName
          };
        }
        return c;
      }));

      setReceptionRequests(prev => prev.map(r => {
        if (r.requestCode === contractData.requestCode) {
          return {
            ...r,
            status: 'Đã tạo hợp đồng',
            linkHistory: [
              ...(r.linkHistory || []),
              {
                timestamp: nowStr,
                action: 'Tạo dự thảo hợp đồng (HDT-02)',
                by: userName,
                note: `Đã sinh hợp đồng dự thảo ${contractId}`
              }
            ]
          };
        }
        return r;
      }));
    }

    logSecurity('CONTRACT_DRAFT_CREATED', `Contract draft ${contractId} created for room ${contractData.roomCode}`);
    return { success: true, contractId, message: `Lập hợp đồng dự thảo thành công! Mã hợp đồng: ${contractId}` };
  };

  // ==================== UC-HDT-03: GỬI VÀ THEO DÕI KÝ (4.9 → 4.10) ====================
  const updateContractDraftHDT03 = (contractId: string, updates: Partial<Contract>, changeNote: string) => {
    const nowStr = new Date().toISOString();
    const userName = currentUser?.fullName || 'Nguyễn Văn An (Chủ nhà)';

    setContracts(prev => prev.map(c => {
      if (c.id === contractId) {
        const nextVersion = c.version + 1;
        return {
          ...c,
          ...updates,
          version: nextVersion,
          history: [
            ...(c.history || []),
            {
              version: nextVersion,
              action: 'Điều chỉnh dự thảo hợp đồng (AF-01)',
              timestamp: nowStr,
              by: userName,
              note: changeNote
            }
          ]
        };
      }
      return c;
    }));

    logSecurity('CONTRACT_DRAFT_UPDATED', `Contract draft ${contractId} updated with note: ${changeNote}`);
    return { success: true, message: 'Cập nhật nội dung dự thảo hợp đồng thành công!' };
  };

  const sendContractToTenantHDT03 = (contractId: string) => {
    const nowStr = new Date().toISOString();
    const userName = currentUser?.fullName || 'Nguyễn Văn An (Chủ nhà)';
    const today = nowStr.split('T')[0];

    setContracts(prev => prev.map(c => {
      if (c.id === contractId) {
        return {
          ...c,
          status: 'Chờ khách ký',
          sentToTenantDate: today,
          history: [
            ...(c.history || []),
            {
              version: c.version,
              action: 'Gửi dự thảo hợp đồng cho khách ký (4.9)',
              timestamp: nowStr,
              by: userName,
              note: 'Đã xuất văn bản dự thảo và chuyển cho khách thuê xem xét, ký ngoài hệ thống'
            }
          ]
        };
      }
      return c;
    }));

    logSecurity('CONTRACT_SENT_TO_TENANT', `Contract ${contractId} sent to tenant for signature`);
    return { success: true, message: 'Đã chuyển hợp đồng sang trạng thái Chờ khách ký!' };
  };

  const cancelContractDraftHDT03 = (contractId: string, reason: string) => {
    const nowStr = new Date().toISOString();
    const userName = currentUser?.fullName || 'Nguyễn Văn An (Chủ nhà)';

    setContracts(prev => prev.map(c => {
      if (c.id === contractId) {
        return {
          ...c,
          status: 'Đã hủy',
          cancellationReason: reason,
          cancelledAt: nowStr,
          history: [
            ...(c.history || []),
            {
              version: c.version,
              action: 'Hủy dự thảo hợp đồng (AF-02)',
              timestamp: nowStr,
              by: userName,
              note: `Lý do: ${reason}`
            }
          ]
        };
      }
      return c;
    }));

    logSecurity('CONTRACT_DRAFT_CANCELLED', `Contract draft ${contractId} cancelled. Reason: ${reason}`);
    return { success: true, message: 'Đã hủy dự thảo hợp đồng thành công!' };
  };

  // ==================== UC-HDT-04: TIẾP NHẬN & LƯU HỢP ĐỒNG ĐÃ KÝ (4.10 → 4.12) ====================
  const confirmContractSignedHDT04 = (
    contractId: string,
    signedDate: string,
    proofFiles: string[],
    verifyInfo?: { idNumber: string; proof: string; confirmVerified: boolean }
  ) => {
    const contract = contracts.find(c => c.id === contractId);
    if (!contract) return { success: false, message: 'Không tìm thấy hợp đồng.' };

    const nowStr = new Date().toISOString();
    const userName = currentUser?.fullName || 'Nguyễn Văn An (Chủ nhà)';

    // Kiểm tra đối chiếu giấy tờ nhân thân khách theo ASIS-04 4.10
    const tenant = tenants.find(t => t.id === contract.tenantId);
    if (tenant && (tenant.isPreliminary || tenant.verificationStatus === 'Chưa xác minh')) {
      if (!verifyInfo || !verifyInfo.confirmVerified) {
        return {
          success: false,
          message: 'LỖI CHẶN KÝ (ASIS-04 bước 4.10): Khách thuê hiện là Hồ sơ sơ bộ / Chưa xác minh giấy tờ! Bắt buộc đối chiếu trực tiếp bản gốc CCCD/Hộ chiếu hợp lệ trước khi hoàn tất tiếp nhận hợp đồng đã ký.'
        };
      }

      // Cập nhật trạng thái xác minh của khách thuê trong hồ sơ HSKT
      setTenants(prev => prev.map(t => {
        if (t.id === tenant.id) {
          return {
            ...t,
            idNumber: verifyInfo.idNumber || t.idNumber,
            paperStatus: 'Đã cung cấp',
            verificationStatus: 'Đã xác minh hợp lệ',
            isPreliminary: false,
            preliminaryWarning: undefined,
            arrivalVerificationEvidence: verifyInfo.proof || 'Đối chiếu trực tiếp tại văn phòng trước khi ký hợp đồng ASIS-04 4.10'
          };
        }
        return t;
      }));

      // Ghi nhật ký vào tenantHistory
      setTenantHistory(prev => [
        {
          id: 'LOG-HDT04-' + Date.now().toString().slice(-6),
          tenantId: tenant.id,
          action: 'Đối chiếu giấy tờ nhân thân trước ký (ASIS-04 4.10)',
          timestamp: nowStr,
          performedBy: userName,
          oldValues: 'Chưa xác minh / Hồ sơ sơ bộ',
          newValues: `Đã xác minh hợp lệ (CCCD: ${verifyInfo.idNumber})`,
          relatedContractId: contractId,
          evidence: verifyInfo.proof,
          sourceModule: 'Ghi nhận ký hợp đồng'
        },
        ...prev
      ]);
    }

    const startDate = new Date(contract.startDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const hasEffective = now >= startDate;
    const finalStatus: Contract['status'] = hasEffective ? 'Hiệu lực' : 'Chờ hiệu lực';

    setContracts(prev => prev.map(c => {
      if (c.id === contractId) {
        return {
          ...c,
          status: finalStatus,
          isSignedPaper: true,
          signedDate,
          signedProofFiles: proofFiles,
          verifiedTenantProof: verifyInfo?.proof,
          verifiedTenantIdNumber: verifyInfo?.idNumber,
          tenantVerificationConfirmed: true,
          history: [
            ...(c.history || []),
            {
              version: c.version,
              action: 'Tiếp nhận và lưu hợp đồng đã ký (4.10 → 4.12)',
              timestamp: nowStr,
              by: userName,
              note: `Đã đối chiếu chữ ký 2 bên và giấy tờ nhân thân. Trạng thái: ${finalStatus}`
            }
          ]
        };
      }
      return c;
    }));

    // Cập nhật trạng thái phòng
    setRooms(prev => prev.map(r => {
      if (r.roomCode === contract.roomCode) {
        return {
          ...r,
          status: hasEffective ? 'Đang thuê' : 'Đang thuê', // Phòng đã được khóa theo hợp đồng
          currentTenant: contract.tenantName
        };
      }
      return r;
    }));

    logSecurity('CONTRACT_SIGNED_HDT04', `Contract ${contractId} signed. Effective: ${hasEffective}`);
    return {
      success: true,
      message: `Ghi nhận hợp đồng đã ký thành công! Trạng thái hợp đồng: ${finalStatus}. Phòng ${contract.roomCode} đã được cập nhật.`
    };
  };

  // ==================== UC-HDT-06: LẬP HỢP ĐỒNG NỐI TIẾP (4.14) ====================
  const createRenewalContractHDT06 = (params: {
    previousContractId: string;
    roomCode: string;
    tenantId: string;
    tenantName: string;
    batchCode: string;
    startDate: string;
    endDate: string;
    monthlyRent: number;
    terms: string;
  }) => {
    const prevContract = contracts.find(c => c.id === params.previousContractId);
    if (!prevContract) return { success: false, message: 'Không tìm thấy hợp đồng cũ.' };

    const nowStr = new Date().toISOString();
    const userName = currentUser?.fullName || 'Nguyễn Văn An (Chủ nhà)';

    const newId = 'HD-' + params.roomCode.replace(/\D/g, '') + '-GIAHAN-' + Date.now().toString().slice(-4);
    const renewalContract: Contract = {
      id: newId,
      contractType: 'Hợp đồng nối tiếp',
      leaseId: prevContract.leaseId, // Cùng chuỗi lần thuê (kế thừa)
      roomCode: params.roomCode,
      tenantId: params.tenantId,
      tenantName: params.tenantName,
      batchCode: params.batchCode,
      startDate: params.startDate,
      endDate: params.endDate,
      monthlyRent: params.monthlyRent,
      depositAmount: prevContract.depositAmount, // Kế thừa cọc gốc (không thu cọc mới)
      firstMonthRentAmount: params.monthlyRent,
      firstMonthRentPaid: true, // Kế thừa chuỗi thanh toán định kỳ
      paymentMethod: 'Chuyển khoản',
      terms: params.terms,
      status: 'Nháp',
      isSignedPaper: false,
      previousContractId: prevContract.id,
      initialDepositCode: prevContract.initialDepositCode || 'COC-' + params.roomCode + '-L1',
      version: 1,
      createdAt: nowStr,
      createdBy: userName,
      history: [
        {
          version: 1,
          action: 'Lập hợp đồng nối tiếp (HDT-06)',
          timestamp: nowStr,
          by: userName,
          note: `Kế thừa lần thuê ${prevContract.leaseId} và khoản cọc gốc ${prevContract.depositAmount.toLocaleString('vi-VN')} đ từ hợp đồng ${prevContract.id}`
        }
      ]
    };

    setContracts(prev => [renewalContract, ...prev]);
    logSecurity('RENEWAL_CONTRACT_CREATED', `Renewal contract ${newId} created for room ${params.roomCode}`);
    return {
      success: true,
      contractId: newId,
      message: `Lập hợp đồng nối tiếp thành công (Mã: ${newId})! Khoản tiền cọc ${prevContract.depositAmount.toLocaleString('vi-VN')} đ được kế thừa trọn vẹn.`
    };
  };

  // ==================== UC-HDT-07: KÍCH HOẠT HỢP ĐỒNG GIA HẠN (4.15) ====================
  const activateRenewalContractHDT07 = (contractId: string, signedDate: string, proofFiles: string[]) => {
    const contract = contracts.find(c => c.id === contractId);
    if (!contract || !contract.previousContractId) {
      return { success: false, message: 'Hợp đồng gia hạn không hợp lệ hoặc thiếu liên kết hợp đồng cũ.' };
    }

    const nowStr = new Date().toISOString();
    const userName = currentUser?.fullName || 'Nguyễn Văn An (Chủ nhà)';

    // Terminate old contract and activate renewal
    setContracts(prev => prev.map(c => {
      if (c.id === contract.previousContractId) {
        return {
          ...c,
          status: 'Kết thúc',
          history: [
            ...(c.history || []),
            {
              version: c.version,
              action: 'Kết thúc hợp đồng (đã chuyển tiếp hợp đồng nối tiếp)',
              timestamp: nowStr,
              by: userName,
              note: `Hợp đồng nối tiếp ${contractId} đã được kích hoạt hiệu lực`
            }
          ]
        };
      }
      if (c.id === contractId) {
        return {
          ...c,
          status: 'Hiệu lực',
          isSignedPaper: true,
          signedDate,
          signedProofFiles: proofFiles,
          history: [
            ...(c.history || []),
            {
              version: c.version,
              action: 'Kích hoạt hiệu lực hợp đồng nối tiếp (HDT-07)',
              timestamp: nowStr,
              by: userName,
              note: 'Đã hoàn tất ký bản giấy và kích hoạt hiệu lực tiếp tục thuê'
            }
          ]
        };
      }
      return c;
    }));

    // Auto-cancel old return plan (BR-UC.PH.14-01)
    setRooms(prev => prev.map(r => r.roomCode === contract.roomCode ? {
      ...r,
      status: 'Đang thuê',
      expectedReturnDate: undefined,
      returnPlanCancelled: true,
      returnPlanCancelReason: 'Đã hủy do kích hoạt hợp đồng nối tiếp'
    } : r));

    logSecurity('RENEWAL_ACTIVATED_HDT07', `Renewal contract ${contractId} activated. Old contract closed, return plan cancelled.`);
    return {
      success: true,
      message: 'Kích hoạt hợp đồng nối tiếp thành công! Hợp đồng cũ đã kết thúc, kế hoạch trả cũ tự động hủy '
    };
  };

  // ==================== DEPOSIT SETTLEMENT (QT05: UC-QTC-01 -> UC-QTC-03) ====================
  const saveSettlementSlipQTC01 = (slip: DepositSettlementSlip) => {
    const nowStr = new Date().toISOString();
    const userName = currentUser?.fullName || 'Nguyễn Văn An (Chủ nhà)';

    const slipWithAudit: DepositSettlementSlip = {
      ...slip,
      status: slip.status || 'Đang lập',
      auditHistory: [
        ...(slip.auditHistory || []),
        {
          timestamp: nowStr,
          user: userName,
          action: 'Lập / Cập nhật phiếu quyết toán cọc ',
          schemeVersion: slip.version || 1,
          note: `Khởi tạo phương án cọc gốc ${slip.initialDepositAmount.toLocaleString('vi-VN')} đ, kết quả dự kiến: ${slip.calculatedResult.toLocaleString('vi-VN')} đ`
        }
      ],
      updatedAt: nowStr
    };

    setSettlementSlips(prev => {
      const idx = prev.findIndex(s => s.id === slip.id);
      if (idx >= 0) {
        const u = [...prev];
        u[idx] = slipWithAudit;
        return u;
      }
      return [slipWithAudit, ...prev];
    });

    // If BG07 reference exists, mark asset comparison as linked to 3.18
    if (slip.bg07Ref) {
      setAssetComparisonResults(prev => prev.map(r => {
        if (r.id === slip.bg07Ref || (r.roomCode === slip.roomCode && r.leaseId === slip.leaseId)) {
          return {
            ...r,
            transferredToSettlement318: true,
            transferredAt: nowStr,
            settlementCaseId: slip.id
          };
        }
        return r;
      }));
    }

    logSecurity('SETTLEMENT_SAVED_QTC01', `Settlement slip ${slip.id} saved for room ${slip.roomCode} in status 'Đang lập'`);
    return {
      success: true,
      message: `Lưu phiếu quyết toán cọc ${slip.id} thành công ở trạng thái Đang lập !`
    };
  };

  const updateSettlementFeedbackQTC02 = (params: {
    slipId: string;
    feedback: 'Đồng ý' | 'Không đồng ý' | 'Chưa phản hồi' | 'Không liên hệ được';
    contactLog: {
      channel: string;
      contactPerson: string;
      content: string;
      result: 'Đồng ý' | 'Không đồng ý' | 'Chưa phản hồi' | 'Không liên hệ được';
      evidence?: string;
    };
    agreementEvidence?: {
      evidenceFile: string;
      evidenceNote: string;
    };
    disputeReason?: string;
  }) => {
    const slip = settlementSlips.find(s => s.id === params.slipId);
    if (!slip) return { success: false, message: 'Không tìm thấy phiếu quyết toán.' };

    if (slip.status === 'Đã có 5.8 – chờ ký biên bản' || slip.status === 'Hoàn tất' || slip.status === 'Đã hủy') {
      return { success: false, message: 'Phiếu đã có kết quả 5.8 hoặc đã khóa, chỉ được xem (BR-UC.QTC.02-08).' };
    }

    const nowStr = new Date().toISOString();
    const userName = currentUser?.fullName || 'Nguyễn Văn An (Chủ nhà)';

    const newContactLog: SettlementContactLog = {
      id: 'cl_' + Date.now().toString().slice(-6),
      contactTime: nowStr.replace('T', ' ').slice(0, 16),
      channel: params.contactLog.channel,
      contactPerson: params.contactLog.contactPerson,
      content: params.contactLog.content,
      result: params.contactLog.result,
      evidence: params.contactLog.evidence,
      schemeVersion: slip.version,
      loggedBy: userName
    };

    let newStatus: DepositSettlementSlip['status'] = slip.status;
    let newAgreementEvidence = slip.tenantAgreementEvidence;

    if (params.feedback === 'Đồng ý') {
      if (!params.agreementEvidence?.evidenceFile) {
        return { success: false, message: 'Bắt buộc đính kèm bằng chứng khách đồng ý hợp lệ đúng phiên bản (EF-03).' };
      }
      newStatus = 'Khách đồng ý';
      newAgreementEvidence = {
        schemeVersion: slip.version,
        agreedAmount: slip.calculatedResult,
        evidenceFile: params.agreementEvidence.evidenceFile,
        evidenceNote: params.agreementEvidence.evidenceNote,
        agreedAt: nowStr,
        agreedBy: userName
      };
    } else if (params.feedback === 'Không đồng ý') {
      newStatus = 'Không đồng ý';
      newAgreementEvidence = undefined;
    } else if (params.feedback === 'Không liên hệ được') {
      newStatus = 'Không liên hệ được';
      newAgreementEvidence = undefined;
    } else if (params.feedback === 'Chưa phản hồi') {
      // Chưa phản hồi giữ nguyên trạng thái phiếu hiện có, chỉ lưu nhật ký theo dõi
      newStatus = slip.status;
    }

    setSettlementSlips(prev => prev.map(s => {
      if (s.id !== params.slipId) return s;
      return {
        ...s,
        tenantFeedback: params.feedback,
        disputeReason: params.disputeReason || s.disputeReason,
        status: newStatus,
        contactLogs: [newContactLog, ...(s.contactLogs || [])],
        tenantAgreementEvidence: newAgreementEvidence,
        auditHistory: [
          ...(s.auditHistory || []),
          {
            timestamp: nowStr,
            user: userName,
            action: `Ghi nhận phản hồi khách: ${params.feedback} `,
            schemeVersion: s.version,
            note: `Kênh: ${params.contactLog.channel}. Kết quả: ${params.contactLog.result}. Trạng thái phiếu: ${newStatus}`
          }
        ],
        updatedAt: nowStr
      };
    }));

    logSecurity('SETTLEMENT_FEEDBACK_UPDATED', `Settlement ${params.slipId} feedback updated: ${params.feedback}. New status: ${newStatus}`);
    return {
      success: true,
      message: `Đã ghi nhận phản hồi: ${params.feedback}. Trạng thái phiếu hiện tại: ${newStatus} .`
    };
  };

  const adjustSettlementDeductionsQTC02 = (params: {
    slipId: string;
    updatedDeductions: DeductionItem[];
    adjustReason: string;
  }) => {
    const slip = settlementSlips.find(s => s.id === params.slipId);
    if (!slip) return { success: false, message: 'Không tìm thấy phiếu quyết toán.', newVersion: 1 };

    if (slip.status === 'Đã có 5.8 – chờ ký biên bản' || slip.status === 'Hoàn tất' || slip.status === 'Đã hủy') {
      return { success: false, message: 'Phiếu đã có kết quả 5.8 hoặc đã khóa, không được sửa (BR-UC.QTC.02-05).', newVersion: slip.version };
    }

    if (!params.adjustReason.trim()) {
      return { success: false, message: 'Bắt buộc nhập lý do điều chỉnh phương án khấu trừ (EF-02).', newVersion: slip.version };
    }

    const nowStr = new Date().toISOString();
    const userName = currentUser?.fullName || 'Nguyễn Văn An (Chủ nhà)';
    const newVersion = (slip.version || 1) + 1;

    const totalDed = params.updatedDeductions.reduce((sum, d) => sum + d.amount, 0);
    const newCalculated = slip.initialDepositAmount - totalDed;

    setSettlementSlips(prev => prev.map(s => {
      if (s.id !== params.slipId) return s;
      return {
        ...s,
        version: newVersion,
        deductions: params.updatedDeductions,
        calculatedResult: newCalculated,
        // Khi sửa tiền, bằng chứng đồng ý cũ bị hủy, phải xác nhận lại với khách
        tenantAgreementEvidence: undefined,
        status: 'Không đồng ý', // Chờ khách phản hồi phiên bản mới
        tenantFeedback: 'Chưa phản hồi',
        reviewRequired: false,
        auditHistory: [
          ...(s.auditHistory || []),
          {
            timestamp: nowStr,
            user: userName,
            action: `Điều chỉnh phương án khấu trừ -> Phiên bản v${newVersion} (UC-QTC-02 / Bước 4)`,
            schemeVersion: newVersion,
            note: `Lý do: ${params.adjustReason}. Tổng khấu trừ mới: ${totalDed.toLocaleString('vi-VN')} đ. Kết quả mới: ${newCalculated.toLocaleString('vi-VN')} đ. Bằng chứng đồng ý cũ đã hủy.`
          }
        ],
        updatedAt: nowStr
      };
    }));

    logSecurity('SETTLEMENT_ADJUSTED_QTC02', `Settlement ${params.slipId} adjusted to v${newVersion}. New result: ${newCalculated}`);
    return {
      success: true,
      message: `Đã tính lại và nâng phương án lên phiên bản v${newVersion}! Kết quả mới: ${newCalculated.toLocaleString('vi-VN')} đ. Vui lòng liên hệ lại khách để xác nhận phiên bản này (BR-UC.QTC.02-12).`,
      newVersion
    };
  };

  const lockDisputeSettlementQTC02 = (params: {
    slipId: string;
    disputeReason: string;
    disputeItems: string;
    disputeBasis: string;
  }) => {
    const slip = settlementSlips.find(s => s.id === params.slipId);
    if (!slip) return { success: false, message: 'Không tìm thấy phiếu quyết toán.' };

    if (slip.status === 'Đã có 5.8 – chờ ký biên bản' || slip.status === 'Hoàn tất' || slip.status === 'Đã hủy') {
      return { success: false, message: 'Phiếu đã khóa, không thể chuyển tranh chấp.' };
    }

    const nowStr = new Date().toISOString();
    const userName = currentUser?.fullName || 'Nguyễn Văn An (Chủ nhà)';

    setSettlementSlips(prev => prev.map(s => {
      if (s.id !== params.slipId) return s;
      return {
        ...s,
        status: 'Tranh chấp',
        disputeReason: params.disputeReason,
        disputeItems: params.disputeItems,
        disputeBasis: params.disputeBasis,
        disputeLocked: true,
        auditHistory: [
          ...(s.auditHistory || []),
          {
            timestamp: nowStr,
            user: userName,
            action: 'Xác lập tranh chấp và khóa sửa trực tiếp (AF-01)',
            schemeVersion: s.version,
            note: `Lý do: ${params.disputeReason}. Căn cứ: ${params.disputeBasis}`
          }
        ],
        updatedAt: nowStr
      };
    }));

    logSecurity('SETTLEMENT_DISPUTE_LOCKED', `Settlement ${params.slipId} locked in dispute. Reason: ${params.disputeReason}`);
    return {
      success: true,
      message: `Đã chuyển phiếu sang trạng thái Tranh chấp (AF-01). Khóa sửa trực tiếp.`
    };
  };

  const reopenDisputedSettlementQTC02 = (params: {
    slipId: string;
    reopenReason: string;
  }) => {
    const slip = settlementSlips.find(s => s.id === params.slipId);
    if (!slip) return { success: false, message: 'Không tìm thấy phiếu quyết toán.' };

    if (slip.status !== 'Tranh chấp') {
      return { success: false, message: 'Chỉ phiếu đang ở trạng thái Tranh chấp mới được mở lại.' };
    }

    if (!params.reopenReason.trim()) {
      return { success: false, message: 'Bắt buộc nhập lý do mở lại phiếu tranh chấp (AF-03).' };
    }

    const nowStr = new Date().toISOString();
    const userName = currentUser?.fullName || 'Nguyễn Văn An (Chủ nhà)';

    setSettlementSlips(prev => prev.map(s => {
      if (s.id !== params.slipId) return s;
      return {
        ...s,
        status: 'Không đồng ý', // Mở lại chuyển về Không đồng ý để tiếp tục điều chỉnh
        disputeLocked: false,
        auditHistory: [
          ...(s.auditHistory || []),
          {
            timestamp: nowStr,
            user: userName,
            action: 'Mở lại phiếu Tranh chấp (AF-03)',
            schemeVersion: s.version,
            note: `Lý do mở lại: ${params.reopenReason}. Chuyển trạng thái về Không đồng ý để tiếp tục xử lý.`
          }
        ],
        updatedAt: nowStr
      };
    }));

    logSecurity('SETTLEMENT_DISPUTE_REOPENED', `Settlement ${params.slipId} reopened from dispute. Reason: ${params.reopenReason}`);
    return {
      success: true,
      message: `Đã mở lại phiếu quyết toán cọc! Phiếu chuyển về trạng thái 'Không đồng ý' để điều chỉnh khoản trừ (AF-03).`
    };
  };

  const cancelSettlementSlipQTC02 = (params: {
    slipId: string;
    cancelReason: string;
  }) => {
    const slip = settlementSlips.find(s => s.id === params.slipId);
    if (!slip) return { success: false, message: 'Không tìm thấy phiếu quyết toán.' };

    if (slip.step58Published || slip.transferReceipt) {
      return { success: false, message: 'Phiếu đã có giao dịch tiền hoặc đã phát hành 5.8, không được hủy (BR-UC.QTC.02-07).' };
    }

    if (!params.cancelReason.trim()) {
      return { success: false, message: 'Bắt buộc nhập lý do hủy phiếu quyết toán (AF-02).' };
    }

    const nowStr = new Date().toISOString();
    const userName = currentUser?.fullName || 'Nguyễn Văn An (Chủ nhà)';

    setSettlementSlips(prev => prev.map(s => {
      if (s.id !== params.slipId) return s;
      return {
        ...s,
        status: 'Đã hủy',
        cancelReason: params.cancelReason,
        cancelledAt: nowStr,
        auditHistory: [
          ...(s.auditHistory || []),
          {
            timestamp: nowStr,
            user: userName,
            action: 'Hủy phiếu quyết toán cọc (AF-02)',
            schemeVersion: s.version,
            note: `Lý do hủy: ${params.cancelReason}`
          }
        ],
        updatedAt: nowStr
      };
    }));

    logSecurity('SETTLEMENT_CANCELLED_QTC02', `Settlement ${params.slipId} cancelled. Reason: ${params.cancelReason}`);
    return {
      success: true,
      message: `Đã hủy phiếu quyết toán cọc thành công (AF-02).`
    };
  };

  const confirmSettlementTransferReceiptQTC03 = (params: {
    slipId: string;
    receipt?: DepositSettlementSlip['transferReceipt'];
  }) => {
    const slip = settlementSlips.find(s => s.id === params.slipId);
    if (!slip) return { success: false, message: 'Không tìm thấy phiếu quyết toán.' };

    // Bước 1: Kiểm tra trạng thái phiếu
    if (slip.status !== 'Khách đồng ý') {
      return {
        success: false,
        message: `Chỉ tiếp tục khi phiếu ở trạng thái 'Khách đồng ý'. Trạng thái hiện tại: '${slip.status}' (Bước 1).`
      };
    }

    if (!slip.tenantAgreementEvidence || slip.tenantAgreementEvidence.schemeVersion !== slip.version) {
      return {
        success: false,
        message: `Thiếu bằng chứng khách đồng ý hợp lệ cho phiên bản hiện hành v${slip.version} (BR-QTC03-01 / BR-UC.QTC.02-12).`
      };
    }

    if (slip.reviewRequired) {
      return {
        success: false,
        message: `Phiếu đang có cờ 'Cần rà soát' do bảng tính kỳ cuối hoặc công nợ nguồn đã thay đổi. Cần tính lại và khách đồng ý lại trước khi hoàn tất (BR-QTC01-08).`
      };
    }

    if (slip.step58Published) {
      return {
        success: false,
        message: 'Phiếu đã ghi kết quả 5.8 trước đó, không ghi nhận trùng lặp (AF-04).'
      };
    }

    const nowStr = new Date().toISOString();
    const userName = currentUser?.fullName || 'Nguyễn Văn An (Chủ nhà)';
    const resultCode = 'KQ58-' + slip.roomCode.replace(/\D/g, '') + '-' + Date.now().toString().slice(-4);

    // Bước 2: Kiểm tra tiền phải chuyển
    const mustTransferAmount = Math.abs(slip.calculatedResult);

    if (slip.calculatedResult !== 0) {
      // Có tiền phải chuyển: Hoàn (>0) hoặc Thu thêm (<0)
      if (!params.receipt) {
        return {
          success: false,
          message: 'Bắt buộc nhập MỘT chứng từ chuyển khoản duy nhất cho khoản tiền phải chuyển (Bước 2 / BR-QTC03-08).'
        };
      }

      // Chứng từ phải có số tiền bằng đúng số phải hoàn/thu thêm, không chuyển một phần
      if (params.receipt.amount !== mustTransferAmount) {
        return {
          success: false,
          message: `Số tiền chứng từ (${params.receipt.amount.toLocaleString('vi-VN')} đ) không khớp số tiền phải chuyển theo phương án thống nhất (${mustTransferAmount.toLocaleString('vi-VN')} đ). Không chấp nhận hoàn/thu một phần.`
        };
      }

      if (!params.receipt.bankName || !params.receipt.accountNumber || !params.receipt.transactionCode) {
        return {
          success: false,
          message: 'Vui lòng điền đầy đủ ngân hàng, số tài khoản nhận và mã giao dịch ngân hàng.'
        };
      }

      // Với hoàn cọc, tài khoản nhận là tài khoản của KHÁCH được xác minh (không phải tài khoản chủ nhà 0988123456)
      if (slip.calculatedResult > 0 && params.receipt.accountNumber === '0988123456') {
        return {
          success: false,
          message: 'Với khoản hoàn cọc, tài khoản nhận phải là tài khoản ngân hàng của KHÁCH thuê được xác minh, không phải tài khoản MB Bank của Chủ nhà.'
        };
      }
    }

    // Bước 5 & 6: Xử lý trong một lần duy nhất (ATOMIC)
    // 1. Chỉ quyết toán các nghĩa vụ được chỉ đích danh trong phiếu.
    // Tuyệt đối không đóng toàn bộ thông báo của một lần thuê chỉ vì có kết quả QTC.
    // Khoản trừ một phần không được coi như đã thanh toán toàn bộ thông báo.
    setPaymentNotices(prev => prev.map(n => {
      if (n.roomCode !== slip.roomCode || n.leaseId !== slip.leaseId ||
          n.paymentStatus !== 'Chưa thu' || n.status !== 'Đang hiệu lực') return n;
      const offset = slip.deductions
        .filter(d => d.category === 'Công nợ kỳ trước' &&
          (d.id === `ded_overdue_${n.id}` || d.description.includes(n.noticeCode)))
        .reduce((sum, d) => sum + d.amount, 0);
      if (offset <= 0) return n;
      if (offset >= n.totalAmount) {
        // Đủ số dư bằng cọc: không tiếp tục yêu cầu chuyển khoản vào QR cũ.
        return {...n, paymentStatus: 'Đã xử lý bằng cọc', status: 'Đã thanh toán'};
      }
      // Còn số dư: giữ nguyên nghĩa vụ gốc; sổ công nợ trừ phần cọc đã phân bổ.
      return n;
    }));

    // 2. Cập nhật phiếu quyết toán: chuyển sang 'Đã có 5.8 – chờ ký biên bản'
    setSettlementSlips(prev => prev.map(s => {
      if (s.id !== params.slipId) return s;
      return {
        ...s,
        status: 'Đã có 5.8 – chờ ký biên bản',
        step58Published: true,
        step58PublishedAt: nowStr,
        step58ResultCode: resultCode,
        transferReceipt: slip.calculatedResult === 0 ? undefined : {
          ...params.receipt!,
          verifiedBy: userName,
          confirmedAt: nowStr
        },
        auditHistory: [
          ...(s.auditHistory || []),
          {
            timestamp: nowStr,
            user: userName,
            action: 'Ghi nhận kết quả quyết toán cọc & phát hành 5.8 ',
            schemeVersion: s.version,
            note: `Mã kết quả 5.8: ${resultCode}. Kết quả: ${slip.calculatedResult > 0 ? 'Hoàn cọc' : slip.calculatedResult < 0 ? 'Thu thêm' : 'Đối trừ hết'}. Chuyển trạng thái sang: Đã có 5.8 – chờ ký biên bản.`
          }
        ],
        updatedAt: nowStr
      };
    }));

    // 3. Đồng bộ kết quả 5.8 sang Biên bản trả phòng (BG10 / BG11)
    const matchingReturnReport = handoverReturnReports.find(r => r.roomCode === slip.roomCode && r.leaseId === slip.leaseId);
    if (matchingReturnReport) {
      syncDepositSettlementBG10(matchingReturnReport.id, {
        depositSettlementId: slip.id,
        depositSettlementVersion: slip.version,
        depositSettlementAmount: slip.initialDepositAmount,
        depositRefundAmount: slip.calculatedResult > 0 ? slip.calculatedResult : 0,
        depositDeductionAmount: slip.deductions.reduce((sum, d) => sum + d.amount, 0),
        depositAdditionalDue: slip.calculatedResult < 0 ? Math.abs(slip.calculatedResult) : 0,
        depositTrackingStatus: '5.8 hợp lệ – Đã thống nhất',
        depositTrackingReason: `Đã có kết quả 5.8 hợp lệ (${resultCode}) thống nhất hoàn/thu ngày ${nowStr.split('T')[0]}`
      });
    }

    // 4. Cập nhật báo cáo quản lý
    setReportSnapshots(prev => prev.map(snap => ({
      ...snap,
      financialStats: {
        ...snap.financialStats,
        totalHandledByDeposit: snap.financialStats.totalHandledByDeposit + slip.deductions.reduce((sum, d) => sum + d.amount, 0)
      }
    })));

    logSecurity('SETTLEMENT_RESULT_58_PUBLISHED', `Settlement ${params.slipId} 5.8 published (${resultCode}). Status: Đã có 5.8 – chờ ký biên bản.`);

    return {
      success: true,
      message: `Ghi nhận kết quả quyết toán thành công! Phát hành kết quả 5.8 (${resultCode}), đồng bộ sang BG10/BG11 và chuyển trạng thái phiếu sang 'Đã có 5.8 – chờ ký biên bản' .`
    };
  };

  // ==================== BILLING (QT06) ====================
  const saveMeterReadingTT01 = (reading: MeterReading) => {
    setMeterReadings(prev => {
      const idx = prev.findIndex(m => m.id === reading.id);
      if (idx >= 0) {
        const u = [...prev];
        u[idx] = reading;
        return u;
      }
      return [reading, ...prev];
    });
  };

  const updateMeterReadingTT02 = (readingId: string, updates: Partial<MeterReading>, reason: string) => {
    setMeterReadings(prev => prev.map(m => m.id === readingId ? {
      ...m,
      ...updates,
      status: 'Nháp – điều chỉnh',
      needsRecalculateFlag: true
    } : m));
    logSecurity('METER_READING_UPDATED_TT02', `Reading ${readingId} updated: ${reason}`);
  };

  const generatePeriodBillTT03 = (roomCode: string, periodCode: string) => {
    const room = rooms.find(r => r.roomCode === roomCode);
    if (!room) return { success: false, message: 'Không tìm thấy phòng.' };

    const reading = meterReadings.find(m => m.roomCode === roomCode && m.periodCode === periodCode);
    if (!reading) {
      return { success: false, message: `Chưa có chỉ số điện nước cho ${periodCode}.` };
    }
    if (reading.pendingVerificationFlag) {
      return { success: false, message: 'Chỉ số điện nước đang chờ xác minh bất thường. Chưa thể tính tiền.' };
    }

    // periodCode: 'Kỳ MM/YYYY'. Giá được áp theo tháng hiệu lực, không lấy phần tử đầu mảng.
    const parseMonth = (code: string): number | null => {
      const found = code.match(/(\d{1,2})\s*\/\s*(\d{4})/);
      if (!found) return null;
      const month = Number(found[1]);
      return month >= 1 && month <= 12 ? Number(found[2]) * 12 + month : null;
    };
    const monthKey = parseMonth(periodCode);
    if (monthKey === null) return {success:false, message:'Kỳ tính tiền phải có dạng Kỳ MM/YYYY.'};
    const [year, month] = [Math.floor((monthKey - 1) / 12), (monthKey - 1) % 12 + 1];
    const format = (y: number, m: number, day: number) => `${y}-${String(m).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const serviceStart = format(year,month,1);
    const serviceEnd = format(year,month,new Date(year,month,0).getDate());
    const nextStartDate = new Date(year,month,1);
    const nextYear = nextStartDate.getFullYear(), nextMonth = nextStartDate.getMonth()+1;
    const nextStart = format(nextYear,nextMonth,1);
    const nextEnd = format(nextYear,nextMonth,new Date(nextYear,nextMonth,0).getDate());
    const price = priceHistory
      .filter(x => {const eff=parseMonth(x.effectivePeriod);return eff!==null && eff<=monthKey;})
      .sort((a,b)=>(parseMonth(b.effectivePeriod)||0)-(parseMonth(a.effectivePeriod)||0))[0];
    if (!price) return {success:false, message:`Chưa có đơn giá điện, nước và dịch vụ có hiệu lực cho ${periodCode}. Vui lòng thiết lập tại Cài đặt.`};
    if (reading.status !== 'Đã xác nhận') return {success:false, message:'Chỉ số điện nước chưa được xác nhận.'};
    if (reading.needsRecalculateFlag) return {success:false, message:'Chỉ số vừa điều chỉnh; cần kiểm tra lại trước khi tính tiền.'};
    if (periodBills.some(b=>b.roomCode===roomCode && b.leaseId===reading.leaseId && b.periodCode===periodCode && b.isConfirmed)) return {success:false, message:'Đã có bảng tính tiền xác nhận cho lần thuê và kỳ này. Không tạo bảng tính trùng.'};

    const elecUsage = reading.verifiedElectricKwh !== undefined ? reading.verifiedElectricKwh : Math.max(0, reading.finalElectricKwh - reading.initialElectricKwh);
    const waterUsage = reading.verifiedWaterM3 !== undefined ? reading.verifiedWaterM3 : Math.max(0, reading.finalWaterM3 - reading.initialWaterM3);

    const elecAmount = elecUsage * price.electricityPrice;
    const waterAmount = waterUsage * price.waterPrice;

    const srvFees = price.services.filter(s => s.status === 'Đang áp dụng').map(s => ({
      name: s.name,
      amount: s.amount
    }));

    const totalSrv = srvFees.reduce((sum, s) => sum + s.amount, 0);

    // Tiền thuê kỳ tiếp theo
    const contract = contracts.find(c => c.leaseId === reading.leaseId && c.roomCode === roomCode && ['Hiệu lực','Đã ký','Chờ hiệu lực'].includes(c.status));
    if (room.status !== 'Trống' && !contract) return {success:false, message:'Không tìm thấy hợp đồng hợp lệ của lần thuê. Không được tự dùng giá thuê mẫu.'};
    const rentEnded = room.status === 'Trống' || reading.isFinalPeriodForLease === true;
    const nextRent = rentEnded ? 0 : (contract?.monthlyRent ?? 0);

    const totalAmount = nextRent + elecAmount + waterAmount + totalSrv;

    const newBill: PeriodBill = {
      id: 'bill_' + roomCode.replace(/\D/g, '') + '_' + Date.now().toString().slice(-4),
      roomCode,
      leaseId: reading.leaseId,
      periodCode,
      servicePeriodFrom: serviceStart,
      servicePeriodTo: serviceEnd,
      nextRentPeriodFrom: nextStart,
      nextRentPeriodTo: nextEnd,
      isRentPeriodEnded: rentEnded,
      nextMonthRentAmount: nextRent,
      electricityUsage: elecUsage,
      electricityRate: price.electricityPrice,
      electricityAmount: elecAmount,
      waterUsage: waterUsage,
      waterRate: price.waterPrice,
      waterAmount: waterAmount,
      serviceFees: srvFees,
      totalAmount,
      isConfirmed: false,
      version: 1
    };

    setPeriodBills(prev => [newBill, ...prev]);
    return { success: true, billId: newBill.id, message: 'Tính tiền kỳ thành công (Bản nháp)!' };
  };

  const confirmPeriodBillTT03 = (billId: string) => {
    const bill = periodBills.find(b => b.id === billId);
    if (!bill) return { success: false, message: 'EF-01: Không tìm thấy bảng tính tiền.' };

    // Kiểm tra cờ Chờ xác minh của chỉ số điện nước theo UC-TT-01 Bước 6
    const reading = meterReadings.find(m => m.roomCode === bill.roomCode && m.periodCode === bill.periodCode);
    if (reading && reading.pendingVerificationFlag) {
      return {
        success: false,
        message: 'Chỉ số điện nước của phòng đang gắn cờ "Chờ xác minh" bất thường. Chưa thể xác nhận bảng tính tiền cho đến khi kiểm tra và xác minh xong.'
      };
    }

    setPeriodBills(prev => prev.map(b => b.id === billId ? {
      ...b,
      isConfirmed: true,
      confirmedAt: new Date().toISOString()
    } : b));
    return { success: true, message: 'Đã xác nhận bảng tính tiền thành công !' };
  };

  // ==================== PAYMENT NOTICES (QT07: UC07.1 -> UC07.3) ====================
  const performReconciliationUC07_1 = (billId: string) => {
    const bill = periodBills.find(b => b.id === billId);
    if (!bill) {
      return { success: false, message: 'EF-01: Không tìm thấy bảng tính tiền nguồn .' };
    }
    if (!bill.isConfirmed) {
      return { success: false, message: 'Bảng tính tiền chưa được xác nhận. Vui lòng xác nhận trước khi đối chiếu.' };
    }

    const room = rooms.find(r => r.roomCode === bill.roomCode);
    const contract = contracts.find(c => c.leaseId === bill.leaseId);

    // BR-UC07.1-03, Xử lý tiền thuê kỳ đầu đã thu tại PH-07
    // Nếu hợp đồng bắt đầu cùng kỳ này và đã thanh toán cọc + thuê tháng đầu
    const isFirstMonthPrepaid: boolean = Boolean(
      contract?.firstMonthRentPaid === true &&
      contract?.startDate &&
      bill.servicePeriodFrom &&
      (contract.startDate.startsWith(bill.servicePeriodFrom.slice(0, 7)) ||
       contract.startDate.startsWith(bill.nextRentPeriodFrom.slice(0, 7)))
    );

    // BR-UC07.1-04, Xử lý kỳ cuối sau trả phòng
    // Không tự sinh tiền thuê tháng mới sau khi phòng đã được nhận lại thực tế
    const isRentEnded = Boolean(bill.isRentPeriodEnded || room?.status === 'Trống');

    const nextRentAmount = isRentEnded ? 0 : (isFirstMonthPrepaid ? 0 : bill.nextMonthRentAmount);
    const nextRentStatus: ReceivableReconciliation['nextRentStatus'] = isRentEnded
      ? 'Không phát sinh'
      : (isFirstMonthPrepaid ? 'Đã thu' : 'Chưa thu');

    // Nhóm 2: Tiền điện, nước, phí dịch vụ của kỳ vừa sử dụng (trả sau)
    const serviceTotal = (bill.electricityAmount || 0) + (bill.waterAmount || 0) +
      (bill.serviceFees?.reduce((sum, f) => sum + f.amount, 0) || 0) + (bill.adjustmentAmount || 0);

    // BR-UC07.1-01, Nợ cũ chỉ để tra cứu, không cộng dồn vào tổng kỳ mới
    const overdueDebt = paymentNotices.find(n =>
      n.roomCode === bill.roomCode && n.leaseId === bill.leaseId &&
      n.paymentStatus === 'Chưa thu' &&
      n.status === 'Đang hiệu lực' &&
      n.periodCode !== bill.periodCode
    );

    // Tổng tiền còn phải trả thực tế sau khi loại bỏ tiền cọc, tiền thuê đã trả trước
    const netReceivable = nextRentAmount + serviceTotal;

    const recId = 'rec_' + bill.roomCode.replace(/\D/g, '') + '_' + Date.now().toString().slice(-4);
    const result: ReceivableReconciliation = {
      id: recId,
      roomCode: bill.roomCode,
      leaseId: bill.leaseId,
      periodCode: bill.periodCode,
      billId: bill.id,
      billVersion: bill.version,
      nextRentPeriodFrom: bill.nextRentPeriodFrom,
      nextRentPeriodTo: bill.nextRentPeriodTo,
      nextRentAmount,
      nextRentStatus,
      nextRentPrepaidAtPH07: isFirstMonthPrepaid,
      servicePeriodFrom: bill.servicePeriodFrom,
      servicePeriodTo: bill.servicePeriodTo,
      electricityUsage: bill.electricityUsage,
      electricityRate: bill.electricityRate,
      electricityAmount: bill.electricityAmount,
      waterUsage: bill.waterUsage,
      waterRate: bill.waterRate,
      waterAmount: bill.waterAmount,
      serviceFees: bill.serviceFees || [],
      adjustmentAmount: bill.adjustmentAmount,
      adjustmentReason: bill.adjustmentReason,
      serviceTotalAmount: serviceTotal,
      serviceStatus: 'Chưa thu',
      overdueDebtReference: overdueDebt ? {
        noticeCode: overdueDebt.noticeCode,
        amount: overdueDebt.totalAmount,
        dueDate: overdueDebt.dueDate,
        noticeId: overdueDebt.id
      } : undefined,
      netReceivableAmount: netReceivable,
      isZeroBalance: netReceivable === 0,
      zeroBalanceMessage: netReceivable === 0
        ? 'AF-01: Không có khoản còn phải thu (Tổng = 0 đ). Trạng thái: Đã thanh toán. Không tạo khoản phải thu mới và không tạo mã QR có số tiền bằng 0.'
        : undefined,
      isReconciled: false
    };

    setReconciliations(prev => [result, ...prev.filter(r => r.billId !== billId)]);

    if (netReceivable === 0) {
      return {
        success: true,
        result,
        message: 'AF-01: Tổng số tiền còn phải thu bằng 0 đ (Đã thanh toán trước/Không phát sinh). Trạng thái Đã thanh toán, không tạo mã QR 0 đ.'
      };
    }

    return {
      success: true,
      result,
      message: 'Đối chiếu thành công! Dữ liệu 2 nhóm tiền và công nợ cũ đã được phân tách rõ ràng.'
    };
  };

  const confirmReconciliationUC07_1 = (reconciliationId: string) => {
    const rec = reconciliations.find(r => r.id === reconciliationId);
    if (!rec) return { success: false, message: 'EF-01: Không tìm thấy hồ sơ đối chiếu.' };
    const bill = periodBills.find(b => b.id === rec.billId && b.isConfirmed);
    if (!bill || bill.roomCode !== rec.roomCode || bill.leaseId !== rec.leaseId || bill.periodCode !== rec.periodCode || rec.billVersion !== bill.version) {
      return {success:false, message:'Bảng tính đã thay đổi hoặc không còn hợp lệ. Vui lòng kiểm tra đối chiếu lại theo dữ liệu mới nhất.'};
    }

    setReconciliations(prev => prev.map(r => r.id === reconciliationId ? {
      ...r,
      isReconciled: true,
      reconciledAt: new Date().toISOString(),
      reconciledBy: currentUser?.fullName || 'Chủ nhà'
    } : r));

    logSecurity('RECONCILIATION_CONFIRMED_07_1', `Reconciliation ${reconciliationId} for room ${rec.roomCode} confirmed.`);
    return { success: true, message: 'Đã xác nhận đối chiếu thành công ! Chuyển sang lập thông báo thanh toán.' };
  };

  const generatePaymentNotice07_2 = (billId: string, dueDate: string, reconciliationId?: string) => {
    const bill = periodBills.find(b => b.id === billId);
    if (!bill || !bill.isConfirmed) {
      return { success: false, message: 'Bảng tính tiền chưa được xác nhận.' };
    }

    // Khi lập thông báo mới, User phải chọn hạn thanh toán không trước ngày phát hành
    const todayStr = new Date().toISOString().split('T')[0];
    if (dueDate < todayStr) {
      return { success: false, message: `Hạn thanh toán (${dueDate}) không được trước ngày phát hành (${todayStr}).` };
    }

    // Phải có tài khoản ngân hàng nhận tiền
    const bank = activeBankAccount;
    if (!bank) {
      return { success: false, message: 'Chưa thiết lập tài khoản ngân hàng nhận tiền tại Cài đặt . Không thể tạo mã QR.' };
    }

    const rec = reconciliationId ? reconciliations.find(r => r.id === reconciliationId && r.billId === billId) : undefined;
    if (!rec || !rec.isReconciled || rec.leaseId !== bill.leaseId || rec.roomCode !== bill.roomCode || rec.periodCode !== bill.periodCode) {
      return {success:false, message:'Phải kiểm tra và xác nhận đối chiếu khoản phải thu cho đúng bảng tính, phòng và lần thuê trước khi lập thông báo.'};
    }
    if (rec.billVersion !== bill.version || rec.netReceivableAmount <= 0) {
      return {success:false, message:'Kết quả đối chiếu đã cũ hoặc không còn khoản phải thu. Vui lòng kiểm tra lại bảng tính.'};
    }
    const room = rooms.find(r => r.roomCode === bill.roomCode);
    const contract = contracts.find(c => c.leaseId === bill.leaseId);

    // Tính toán số tiền theo 2 nhóm (BR-UC07.2-02, BR-UC07.1-02)
    const isRentEnded = Boolean(bill.isRentPeriodEnded || room?.status === 'Trống');
    const isFirstMonthPrepaid: boolean = Boolean(
      contract?.firstMonthRentPaid === true &&
      contract?.startDate &&
      bill.servicePeriodFrom &&
      (contract.startDate.startsWith(bill.servicePeriodFrom.slice(0, 7)) ||
       contract.startDate.startsWith(bill.nextRentPeriodFrom.slice(0, 7)))
    );

    const nextRentAmount = isRentEnded ? 0 : (isFirstMonthPrepaid ? 0 : bill.nextMonthRentAmount);
    const serviceTotal = (bill.electricityAmount || 0) + (bill.waterAmount || 0) +
      (bill.serviceFees?.reduce((s, f) => s + f.amount, 0) || 0) + (bill.adjustmentAmount || 0);

    const totalAmount = nextRentAmount + serviceTotal;
    if (!Number.isFinite(totalAmount) || rec.netReceivableAmount !== totalAmount ||
        rec.nextRentAmount !== nextRentAmount || rec.serviceTotalAmount !== serviceTotal) {
      return {success:false, message:'Số tiền nguồn khác kết quả đã đối chiếu. Hãy kiểm tra và xác nhận đối chiếu lại trước khi lập thông báo.'};
    }

    // AF-02: Không có khoản phải thu
    if (totalAmount <= 0) {
      return { success: false, message: 'Tổng số tiền còn phải thu bằng 0 đ. Không phát hành thông báo hoặc mã QR.' };
    }

    // Kiểm tra thông báo đang hiệu lực (BR-UC07.2-01)
    const existingActive = paymentNotices.find(n => n.roomCode === bill.roomCode && n.periodCode === bill.periodCode && n.status === 'Đang hiệu lực');
    if (existingActive) {
      return {
        success: false,
        message: `Phòng ${bill.roomCode} đã có thông báo ${existingActive.noticeCode} đang hiệu lực. Hãy dùng chức năng Thay thế thông báo nếu cần cập nhật.`
      };
    }

    // Overdue debt reference (chỉ tra cứu, không cộng dồn - BR-UC07.2-02)
    const overdueDebt = paymentNotices.find(n =>
      n.roomCode === bill.roomCode && n.leaseId === bill.leaseId &&
      n.paymentStatus === 'Chưa thu' &&
      n.status === 'Đang hiệu lực' &&
      n.periodCode !== bill.periodCode
    );

    const noticeId = 'not_' + bill.roomCode.replace(/\D/g, '') + '_' + Date.now().toString().slice(-4);
    const noticeCode = 'TB-' + bill.roomCode.replace(/\D/g, '') + '-' + bill.periodCode.replace(/\D/g, '');

    const notice: PaymentNotice = {
      id: noticeId,
      noticeCode,
      roomCode: bill.roomCode,
      leaseId: bill.leaseId,
      periodCode: bill.periodCode,
      servicePeriod: `${bill.servicePeriodFrom} - ${bill.servicePeriodTo}`,
      nextRentPeriod: isRentEnded ? 'Không phát sinh (Đã trả phòng)' : `${bill.nextRentPeriodFrom} - ${bill.nextRentPeriodTo}`,
      dueDate,
      originalDueDate: dueDate,
      totalAmount,
      status: 'Đang hiệu lực',
      paymentStatus: 'Chưa thu',
      reconciliationId: rec?.id,
      breakdown: {
        nextRentAmount,
        nextRentPeriodFrom: bill.nextRentPeriodFrom,
        nextRentPeriodTo: bill.nextRentPeriodTo,
        isRentEnded,
        nextRentPrepaid: isFirstMonthPrepaid,
        electricityAmount: bill.electricityAmount,
        electricityUsage: bill.electricityUsage,
        electricityRate: bill.electricityRate,
        waterAmount: bill.waterAmount,
        waterUsage: bill.waterUsage,
        waterRate: bill.waterRate,
        serviceFees: bill.serviceFees || [],
        adjustmentAmount: bill.adjustmentAmount,
        adjustmentReason: bill.adjustmentReason
      },
      priorDebtReference: overdueDebt ? {
        noticeCode: overdueDebt.noticeCode,
        amount: overdueDebt.totalAmount,
        dueDate: overdueDebt.dueDate,
        noticeId: overdueDebt.id
      } : undefined,
      qrBankSnapshot: {
        bankName: bank.bankName,
        accountNumber: bank.accountNumber,
        accountHolder: bank.accountHolder,
        transferContent: `${bill.roomCode.replace(/\D/g, '')} ${bill.periodCode.replace(/\s+/g, '')}`,
        amount: totalAmount
      },
      createdAt: new Date().toISOString()
    };

    setPaymentNotices(prev => [notice, ...prev]);
    logSecurity('PAYMENT_NOTICE_CREATED_07_2', `Notice ${noticeCode} created with QR fixed amount ${totalAmount} đ`);
    return { success: true, noticeId, message: 'Lập thông báo thanh toán và mã QR thành công !' };
  };

  const replacePaymentNotice07_2 = (oldNoticeId: string, reason?: string) => {
    const oldNotice = paymentNotices.find(n => n.id === oldNoticeId);
    if (!oldNotice) return { success: false, message: 'EF-01: Không tìm thấy thông báo cũ.' };

    // Không thay thế thông báo Đã thu
    if (oldNotice.paymentStatus === 'Đã thu') {
      return { success: false, message: 'Thông báo đã ở trạng thái Đã thu, không được thay thế để ghi đè thực nhận.' };
    }

    const bank = activeBankAccount;
    if (!bank) {
      return { success: false, message: 'EF-01: Chưa thiết lập tài khoản ngân hàng nhận tiền tại Cài đặt.' };
    }

    const newId = 'not_' + Date.now().toString().slice(-6);
    const newCode = oldNotice.noticeCode.includes('-R')
      ? oldNotice.noticeCode + '1'
      : oldNotice.noticeCode + '-R';

    // Khi thay thế thông báo chưa thu, hệ thống GIỮ NGUYÊN HẠN THANH TOÁN BAN ĐẦU (kể cả khi đã quá hạn)
    const newNotice: PaymentNotice = {
      ...oldNotice,
      id: newId,
      noticeCode: newCode,
      dueDate: oldNotice.originalDueDate, // Giữ nguyên hạn gốc ban đầu
      originalDueDate: oldNotice.originalDueDate,
      replacedNoticeId: oldNoticeId,
      status: 'Đang hiệu lực',
      qrBankSnapshot: {
        ...oldNotice.qrBankSnapshot,
        bankName: bank.bankName,
        accountNumber: bank.accountNumber,
        accountHolder: bank.accountHolder
      },
      createdAt: new Date().toISOString()
    };

    // Đánh dấu thông báo cũ là Đã thay thế và vô hiệu hóa QR cũ
    setPaymentNotices(prev => [
      newNotice,
      ...prev.map(n => n.id === oldNoticeId ? {
        ...n,
        status: 'Đã thay thế' as const,
        replacedByNoticeId: newId
      } : n)
    ]);

    logSecurity('PAYMENT_NOTICE_REPLACED_07_2', `Replaced notice ${oldNotice.noticeCode} with ${newCode}. Kept original due date ${oldNotice.originalDueDate}. Reason: ${reason || 'Cập nhật'}`);
    return { success: true, noticeId: newId, message: `Đã phát hành thông báo thay thế (${newCode})! Giữ nguyên hạn gốc ${oldNotice.originalDueDate} và vô hiệu hóa mã QR cũ.` };
  };

  // ==================== PAYMENT RECEIPTS (QT08: UC08.1 -> UC08.2) ====================
  const confirmPaymentReceipt08_2 = (
    noticeId: string,
    amount: number,
    receivedDate: string,
    transactionCode: string,
    bankAccountReceived: string,
    proofFile?: string
  ) => {
    const notice = paymentNotices.find(n => n.id === noticeId);
    if (!notice) return { success: false, message: 'EF-01: Không tìm thấy thông báo thanh toán.' };

    if (notice.status !== 'Đang hiệu lực') {
      return { success: false, message: 'Không được xác nhận thu bằng thông báo hoặc mã QR đã thay thế.' };
    }

    if (notice.paymentStatus === 'Đã thu') {
      return { success: false, message: 'AF-04 / EF-02: Thông báo này đã được xác nhận thu đủ trước đó.' };
    }

    // Chỉ xác nhận khi tiền thực vào tài khoản đúng đủ số của QR
    if (amount !== notice.totalAmount) {
      return {
        success: false,
        message: `Số tiền thực nhận (${amount.toLocaleString('vi-VN')} đ) phải đúng đủ 100% tổng tiền trên thông báo QR (${notice.totalAmount.toLocaleString('vi-VN')} đ). Không hỗ trợ thu thiếu, chuyển thừa hoặc thanh toán một phần.`
      };
    }

    // EF-02: Kiểm tra chống trùng mã giao dịch
    const isDuplicateTxn = paymentReceipts.some(r => r.transactionCode === transactionCode && r.status === 'Đang hiệu lực');
    if (isDuplicateTxn) {
      return {
        success: false,
        message: `EF-02: Mã giao dịch "${transactionCode}" đã tồn tại trong hệ thống. Vui lòng kiểm tra lại để tránh ghi nhận trùng.`
      };
    }

    const receiptId = 'rcp_' + Date.now().toString().slice(-6);
    const actor = currentUser?.fullName || 'Chủ nhà';
    const nowIso = new Date().toISOString();
    const receipt: PaymentReceipt = {
      id: receiptId,
      noticeId,
      roomCode: notice.roomCode,
      leaseId: notice.leaseId,
      periodCode: notice.periodCode,
      amountReceived: amount,
      receivedDate,
      transactionCode: transactionCode.trim(),
      bankAccountReceived,
      paymentMethod: 'Chuyển khoản ngân hàng',
      proofFile,
      status: 'Đang hiệu lực',
      confirmedBy: actor,
      confirmedAt: nowIso,
      auditHistory: [
        {
          action: 'Tạo chứng từ thu tiền ',
          timestamp: nowIso,
          user: actor,
          transactionCode: transactionCode.trim(),
          amount,
          newStatus: 'Đang hiệu lực',
          details: `Xác nhận thu đủ ${amount.toLocaleString('vi-VN')} đ vào ${bankAccountReceived} qua mã giao dịch ${transactionCode.trim()}`
        }
      ]
    };

    setPaymentReceipts(prev => [receipt, ...prev]);
    setPaymentNotices(prev => prev.map(n => n.id === noticeId ? {
      ...n,
      paymentStatus: 'Đã thu'
    } : n));

    logSecurity('PAYMENT_CONFIRMED_08_2', `Notice ${notice.noticeCode} confirmed collected ${amount.toLocaleString('vi-VN')} đ via txn ${transactionCode}`);
    return { success: true, message: 'Xác nhận thu đủ thành công ! Tiền thuê kỳ sau đã trả trước và dịch vụ đã thu.' };
  };

  const revertPaymentReceipt08_2 = (receiptId: string, reason: string) => {
    const receipt = paymentReceipts.find(r => r.id === receiptId);
    if (!receipt) return { success: false, message: 'EF-01: Không tìm thấy chứng từ thu tiền.' };

    const trimmedReason = reason?.trim();
    if (!trimmedReason) {
      return { success: false, message: 'Lý do sửa xác nhận thu nhầm là trường bắt buộc.' };
    }

    const nowIso = new Date().toISOString();
    const actor = currentUser?.fullName || 'Chủ nhà';

    // BR-UC08.2-06 & 10: Không xóa giao dịch nguồn, bảo toàn số liệu cho đối soát
    const newAuditEntry = {
      action: 'Sửa xác nhận thu nhầm (AF-03)',
      timestamp: nowIso,
      user: actor,
      reason: trimmedReason,
      previousStatus: receipt.status,
      newStatus: 'Không còn hiệu lực',
      transactionCode: receipt.transactionCode,
      amount: receipt.amountReceived,
      details: `Hủy hiệu lực xác nhận thu tiền. Giữ nguyên giao dịch nguồn ${receipt.transactionCode} để bảo toàn lịch sử kế toán.`
    };

    setPaymentReceipts(prev => prev.map(r => r.id === receiptId ? {
      ...r,
      status: 'Không còn hiệu lực' as const,
      invalidatedReason: trimmedReason,
      invalidatedAt: nowIso,
      invalidatedBy: actor,
      auditHistory: [...(r.auditHistory || []), newAuditEntry]
    } : r));

    // Hoàn tác trạng thái thông báo thanh toán tương ứng về Chưa thu
    setPaymentNotices(prev => prev.map(n => n.id === receipt.noticeId ? {
      ...n,
      paymentStatus: 'Chưa thu'
    } : n));

    logSecurity('PAYMENT_REVERTED_08_2', `Receipt ${receipt.transactionCode} invalidated: ${trimmedReason}. Source txn preserved.`);
    return { success: true, message: 'Đã sửa xác nhận thu nhầm (AF-03)! Giao dịch nguồn được bảo toàn trong lịch sử kiểm toán và thông báo thanh toán đã quay lại trạng thái Chưa thu.' };
  };

  // ==================== DEBTS (QT09) ====================
  const recordDebtReminder09_2 = (reminder: Omit<DebtHistoryReminder, 'id' | 'loggedAt' | 'loggedBy'>): { success: boolean; message: string; record?: DebtHistoryReminder } => {
    if (!reminder.contactDate || !reminder.channel || !reminder.result?.trim()) {
      return { success: false, message: 'Lỗi EF-02: Thiếu ngày liên hệ, kênh hoặc kết quả trao đổi bắt buộc.' };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (!reminder.isRetrospective && reminder.contactDate > todayStr) {
      return { success: false, message: 'Lỗi EF-03: Ngày liên hệ không thể ở tương lai.' };
    }

    // Check duplicate key (EF-05): noticeId + contactDate + channel
    const duplicate = debtReminders.find(r =>
      r.noticeId === reminder.noticeId &&
      r.contactDate === reminder.contactDate &&
      r.channel === reminder.channel
    );
    if (duplicate) {
      return {
        success: false,
        message: 'Lỗi EF-05: Bản ghi nhắc nợ cùng kênh và ngày liên hệ này đã tồn tại trong lịch sử.',
        record: duplicate
      };
    }

    const newRem: DebtHistoryReminder = {
      ...reminder,
      id: 'drm_' + Date.now(),
      loggedAt: new Date().toISOString(),
      loggedBy: currentUser?.fullName || 'Quản lý / Chủ nhà'
    };

    setDebtReminders(prev => [newRem, ...prev]);
    logSecurity('DEBT_REMINDER_LOGGED_09_2', `Reminded notice ${reminder.noticeId} (Room ${reminder.roomCode}) via ${reminder.channel}`);
    return { success: true, message: 'Ghi nhận lịch sử nhắc nợ thành công !', record: newRem };
  };

  const recordDebtPromise09_3 = (promise: Omit<DebtPromise, 'id' | 'loggedAt' | 'loggedBy'>): { success: boolean; message: string; record?: DebtPromise } => {
    if (!promise.content?.trim()) {
      return { success: false, message: 'Lỗi EF-02: Nội dung phản hồi là trường bắt buộc.' };
    }

    if (promise.hasPromiseDate && !promise.promisedDate) {
      return { success: false, message: 'Lỗi EF-03: Vui lòng nhập ngày hẹn thanh toán khi chọn có hẹn.' };
    }

    const newProm: DebtPromise = {
      ...promise,
      id: 'dpr_' + Date.now(),
      loggedAt: new Date().toISOString(),
      loggedBy: currentUser?.fullName || 'Quản lý / Chủ nhà'
    };

    setDebtPromises(prev => [newProm, ...prev]);
    logSecurity('DEBT_PROMISE_LOGGED_09_3', `Recorded promise for notice ${promise.noticeId} (Room ${promise.roomCode})`);
    return { success: true, message: 'Ghi nhận phản hồi và ngày hẹn thanh toán thành công !', record: newProm };
  };

  const resetAllToSeedData = () => {
    // Chức năng khôi phục dữ liệu mẫu dành riêng cho dev; không cấp phiên quản trị.
    localStorage.removeItem('mini_apt_owner_auth_v2');
    setUsers(INITIAL_USERS);
    setCurrentUser(null);
    setCurrentSession(null);
    setResetTokens([]);
    setServices(INITIAL_SERVICES);
    setPriceHistory(INITIAL_PRICE_HISTORY);
    setBankAccounts(INITIAL_BANK_ACCOUNTS);
    setBatchSchedules(INITIAL_BATCH_SCHEDULES);
    setRooms(INITIAL_ROOMS);
    setRoomHistory([]);
    setReturnPlans([]);
    setContactLogs([]);
    setInventoryRecords(INITIAL_INVENTORY_RECORDS);
    setHandoverReports(INITIAL_HANDOVER_REPORTS);
    setIncidents(INITIAL_INCIDENTS);
    setReturnInspections(INITIAL_RETURN_INSPECTIONS);
    setAssetComparisonResults([]);
    setHandoverReturnReports([]);
    setTenants(INITIAL_TENANTS);
    setCoTenants(INITIAL_CO_TENANTS);
    setTenantProposals([]);
    setTenantHistory([]);
    setContracts(INITIAL_CONTRACTS);
    setSettlementSlips(INITIAL_SETTLEMENT_SLIPS);
    setMeterReadings(INITIAL_METER_READINGS);
    setPeriodBills(INITIAL_PERIOD_BILLS);
    setPaymentNotices(INITIAL_PAYMENT_NOTICES);
    setPaymentReceipts(INITIAL_PAYMENT_RECEIPTS);
    setDebtReminders(INITIAL_DEBT_REMINDERS);
    setDebtPromises(INITIAL_DEBT_PROMISES);
    setSecurityLogs([]);
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      currentSession,
      authNotification,
      setAuthNotification,
      login,
      changePasswordFirstLogin,
      logout,
      changePasswordFromProfile,
      requestPasswordResetEmail,
      resetPasswordWithToken,
      resetTokens,

      services,
      priceHistory,
      bankAccounts,
      activeBankAccount,
      updateUtilityPrices,
      updateBankAccount,

      rooms,
      roomHistory,
      returnPlans,
      contactLogs,
      initialPaymentRecords,
      missingConditionLogs,
      unfinishedHandoverLogs,
      leaseStartEvents,
      addRoom,
      updateRoom,
      recordInitialPaymentPH07,
      correctInitialPaymentPH07,
      confirmCheckInPH05,
      saveMissingConditionPH06,
      updateExpectedReturnDatePH11_12,
      recordTenantContactPH13,
      autoCancelReturnPlanPH14,
      checkExtensionResultPH15,
      confirmReturnStep305AndVacantPH08,
      saveUnfinishedHandoverPH09,

      standardAssets,
      inventoryRecords,
      handoverConditions,
      handoverReports,
      incidents,
      returnInspections,
      assetComparisonResults,
      handoverReturnReports,
      saveInventoryBG01,
      saveHandoverConditionBG02,
      saveHandoverReportBG03,
      confirmHandoverSignaturesBG03,
      recordIncidentBG04,
      recordReturnInspectionBG09,
      confirmReturnInspectionStep305,
      correctReturnInspectionStep305,
      saveAssetComparisonResultBG07,
      initHandoverReturnReportDraftBG08,
      syncDepositSettlementBG10,
      saveHandoverReturnReportBG11,
      confirmFinalReturnReportBG11,

      tenants,
      coTenants,
      tenantProposals,
      tenantHistory,
      pendingDocs,
      receptionRequests,
      preSignVerifications,
      addTenantHSKT01,
      addPendingReceptionDocHSKT01,
      updatePendingReceptionDocStatus,
      linkReceptionRequestHSKT01,
      addCoTenantHSKT02,
      updateCoTenantStatusHSKT02,
      updateCoTenantFieldsHSKT02,
      closeCoTenantResidencyHSKT02,
      linkConsecutiveContractCoTenantHSKT02,
      createOrUpdateProposalHSKT03,
      verifyProposalResultHSKT03,
      transferProposalToUpdateHSKT03,
      recordPreSignVerificationHSKT03,
      applyTenantUpdateHSKT04,

      leaseConditions,
      saveLeaseConditionHDT01,
      checkLeaseConditionHDT01,
      updateLeaseConditionStatusHDT01,
      cancelLeaseConditionHDT01,

      contracts,
      batchSchedules,
      addBatchSchedule,
      updateBatchScheduleHDT05,
      createContractDraftHDT02,
      updateContractDraftHDT03,
      sendContractToTenantHDT03,
      cancelContractDraftHDT03,
      confirmContractSignedHDT04,
      createRenewalContractHDT06,
      activateRenewalContractHDT07,

      settlementSlips,
      saveSettlementSlipQTC01,
      updateSettlementFeedbackQTC02,
      adjustSettlementDeductionsQTC02,
      lockDisputeSettlementQTC02,
      reopenDisputedSettlementQTC02,
      cancelSettlementSlipQTC02,
      confirmSettlementTransferReceiptQTC03,

      meterReadings,
      periodBills,
      saveMeterReadingTT01,
      updateMeterReadingTT02,
      generatePeriodBillTT03,
      confirmPeriodBillTT03,

      reconciliations,
      performReconciliationUC07_1,
      confirmReconciliationUC07_1,
      paymentNotices,
      generatePaymentNotice07_2,
      replacePaymentNotice07_2,

      paymentReceipts,
      confirmPaymentReceipt08_2,
      revertPaymentReceipt08_2,

      debtReminders,
      debtPromises,
      recordDebtReminder09_2,
      recordDebtPromise09_3,

      securityLogs,
      logSecurity,

      // Management Reports (QT10)
      reportSnapshots,
      saveReportSnapshot: (snapshot: ManagementReportSnapshot) => {
        setReportSnapshots(prev => [snapshot, ...prev]);
        logSecurity('Lưu snapshot báo cáo quản trị', `Mã BC: ${snapshot.reportCode} - Kỳ: ${snapshot.periodLabel}`);
      },

      resetAllToSeedData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
