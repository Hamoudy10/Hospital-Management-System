// User Role Types
export type UserRole =
  | 'doctor'
  | 'nurse'
  | 'receptionist'
  | 'accountant'
  | 'lab_technician'
  | 'pharmacist'
  | 'procurement'
  | 'admin';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  department?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Helper to get full name
export const getFullName = (user: User | null): string => {
  if (!user) return 'User';
  return `${user.firstName} ${user.lastName}`.trim() || user.email;
};

// Role display names
export const roleDisplayNames: Record<UserRole, string> = {
  doctor: 'Doctor',
  nurse: 'Nurse',
  receptionist: 'Receptionist',
  accountant: 'Accountant',
  lab_technician: 'Lab Technician',
  pharmacist: 'Pharmacist',
  procurement: 'Procurement Officer',
  admin: 'Administrator',
};

// Patient Types
export interface Patient {
  id: string;
  hospitalNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  phone: string;
  email?: string;
  address?: string;
  county?: string;
  subCounty?: string;
  nationalId?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  bloodGroup?: string;
  allergies?: string[];
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Appointment Types
export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'checked_in'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  departmentId?: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  appointmentType: string;
  status: AppointmentStatus;
  reason?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  patient?: Patient;
  doctor?: User;
}

// Visit Types
export type VisitType = 'outpatient' | 'inpatient' | 'emergency';
export type VisitStatus = 'active' | 'discharged' | 'transferred';

export interface Visit {
  id: string;
  patientId: string;
  appointmentId?: string;
  visitType: VisitType;
  visitDate: string;
  chiefComplaint?: string;
  status: VisitStatus;
  assignedDoctorId?: string;
  assignedNurseId?: string;
  wardId?: string;
  bedNumber?: string;
  admissionDate?: string;
  dischargeDate?: string;
  createdAt: string;
  updatedAt: string;
  patient?: Patient;
}

// Vitals Types
export interface Vitals {
  id: string;
  visitId: string;
  patientId: string;
  temperature?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  pulseRate?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
  bmi?: number;
  painLevel?: number;
  notes?: string;
  recordedBy: string;
  recordedAt: string;
}

// Medical Record Types
export interface MedicalRecord {
  id: string;
  visitId: string;
  patientId: string;
  doctorId: string;
  diagnosis?: string;
  icdCode?: string;
  symptoms?: string;
  clinicalNotes?: string;
  treatmentPlan?: string;
  followUpDate?: string;
  createdAt: string;
  updatedAt: string;
}

// Lab Test Types
export type LabTestStatus =
  | 'pending'
  | 'sample_collected'
  | 'processing'
  | 'completed'
  | 'cancelled';

export interface LabTestCatalogItem {
  id: string;
  testCode: string;
  testName: string;
  category: string;
  description?: string;
  sampleType: string;
  turnaroundTime?: number;
  price: number;
  isActive: boolean;
}

export interface LabTest {
  id: string;
  visitId: string;
  patientId: string;
  orderedBy: string;
  testCatalogId: string;
  priority: 'routine' | 'urgent' | 'stat';
  status: LabTestStatus;
  sampleCollectedAt?: string;
  sampleCollectedBy?: string;
  processedBy?: string;
  completedAt?: string;
  results?: string;
  resultNotes?: string;
  normalRange?: string;
  isAbnormal?: boolean;
  attachmentUrl?: string;
  createdAt: string;
  updatedAt: string;
  testCatalog?: LabTestCatalogItem;
  patient?: Patient;
}

// Prescription Types
export type PrescriptionStatus = 'pending' | 'dispensed' | 'partially_dispensed' | 'cancelled';

export interface PrescriptionItem {
  id: string;
  prescriptionId: string;
  drugId: string;
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  dispensedQuantity: number;
  instructions?: string;
  isDispensed: boolean;
}

export interface Prescription {
  id: string;
  visitId: string;
  patientId: string;
  prescribedBy: string;
  status: PrescriptionStatus;
  notes?: string;
  dispensedBy?: string;
  dispensedAt?: string;
  createdAt: string;
  updatedAt: string;
  items?: PrescriptionItem[];
  patient?: Patient;
}

// Pharmacy/Drug Types
export interface Drug {
  id: string;
  drugCode: string;
  brandName: string;
  genericName: string;
  category: string;
  formulation: string;
  strength: string;
  manufacturer?: string;
  unitPrice: number;
  reorderLevel: number;
  currentStock: number;
  expiryDate?: string;
  batchNumber?: string;
  supplierId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Invoice Types
export type InvoiceStatus = 'draft' | 'pending' | 'partial' | 'paid' | 'cancelled' | 'overdue';

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  itemType: 'consultation' | 'lab_test' | 'medication' | 'procedure' | 'bed_charge' | 'other';
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  referenceId?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  visitId?: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: InvoiceStatus;
  dueDate?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  items?: InvoiceItem[];
  payments?: Payment[];
  patient?: Patient;
}

// Payment Types
export type PaymentMethod = 'cash' | 'mpesa' | 'card' | 'insurance' | 'bank_transfer';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  transactionReference?: string;
  mpesaReceiptNumber?: string;
  payerPhone?: string;
  payerName?: string;
  notes?: string;
  receivedBy: string;
  receivedAt: string;
  createdAt: string;
}

// M-Pesa Transaction Types
export interface MpesaTransaction {
  id: string;
  transactionType: string;
  transId: string;
  transTime: string;
  transAmount: number;
  businessShortCode: string;
  billRefNumber: string;
  invoiceNumber?: string;
  orgAccountBalance?: number;
  thirdPartyTransId?: string;
  msisdn: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  isAllocated: boolean;
  allocatedToInvoiceId?: string;
  rawPayload?: Record<string, unknown>;
  createdAt: string;
}

// Supplier Types
export interface Supplier {
  id: string;
  supplierCode: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country: string;
  taxPin?: string;
  paymentTerms?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Purchase Order Types
export type PurchaseOrderStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'ordered'
  | 'partially_received'
  | 'received'
  | 'cancelled';

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  drugId?: string;
  itemDescription: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  receivedQuantity: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  status: PurchaseOrderStatus;
  orderDate: string;
  expectedDeliveryDate?: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  items?: PurchaseOrderItem[];
  supplier?: Supplier;
}

// Department Types
export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  headOfDepartmentId?: string;
  isActive: boolean;
}

// Ward Types
export interface Ward {
  id: string;
  name: string;
  code: string;
  departmentId?: string;
  totalBeds: number;
  occupiedBeds: number;
  wardType: string;
  isActive: boolean;
}

// Audit Log Types
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  tableName: string;
  recordId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// Report Types
export interface ReportFilter {
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  doctorId?: string;
  status?: string;
}

export interface DashboardStats {
  totalPatients: number;
  todayAppointments: number;
  pendingLabTests: number;
  pendingPrescriptions: number;
  todayRevenue: number;
  occupiedBeds: number;
  totalBeds: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form Types
export interface SelectOption {
  value: string;
  label: string;
}

// Notification Types
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}