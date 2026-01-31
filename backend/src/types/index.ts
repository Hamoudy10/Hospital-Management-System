// ============================================
// Kenya HMS - Backend Type Definitions
// ============================================

import { Request } from 'express';

// User & Authentication Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  department?: string;
  phone?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 
  | 'doctor'
  | 'nurse'
  | 'receptionist'
  | 'accountant'
  | 'lab_technician'
  | 'pharmacist'
  | 'procurement'
  | 'admin';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// Permission Types
export type Permission = 
  | 'patients.read'
  | 'patients.write'
  | 'patients.delete'
  | 'patients.register'
  | 'appointments.read'
  | 'appointments.write'
  | 'appointments.delete'
  | 'medical_records.read'
  | 'medical_records.write'
  | 'prescriptions.read'
  | 'prescriptions.write'
  | 'prescriptions.fulfill'
  | 'lab.tests.read'
  | 'lab.tests.write'
  | 'lab.results.read'
  | 'lab.results.write'
  | 'vitals.read'
  | 'vitals.write'
  | 'invoices.read'
  | 'invoices.write'
  | 'invoices.delete'
  | 'payments.read'
  | 'payments.write'
  | 'mpesa.read'
  | 'mpesa.write'
  | 'drugs.read'
  | 'drugs.write'
  | 'drugs.delete'
  | 'suppliers.read'
  | 'suppliers.write'
  | 'suppliers.delete'
  | 'purchase_orders.read'
  | 'purchase_orders.write'
  | 'inventory.read'
  | 'inventory.write'
  | 'reports.read'
  | 'reports.financial'
  | 'reports.medical'
  | 'reports.inventory'
  | 'users.read'
  | 'users.write'
  | 'users.delete'
  | 'audit.read';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'patients.read', 'patients.write', 'patients.delete', 'patients.register',
    'appointments.read', 'appointments.write', 'appointments.delete',
    'medical_records.read', 'medical_records.write',
    'prescriptions.read', 'prescriptions.write', 'prescriptions.fulfill',
    'lab.tests.read', 'lab.tests.write', 'lab.results.read', 'lab.results.write',
    'vitals.read', 'vitals.write',
    'invoices.read', 'invoices.write', 'invoices.delete',
    'payments.read', 'payments.write', 'mpesa.read', 'mpesa.write',
    'drugs.read', 'drugs.write', 'drugs.delete',
    'suppliers.read', 'suppliers.write', 'suppliers.delete',
    'purchase_orders.read', 'purchase_orders.write',
    'inventory.read', 'inventory.write',
    'reports.read', 'reports.financial', 'reports.medical', 'reports.inventory',
    'users.read', 'users.write', 'users.delete', 'audit.read'
  ],
  doctor: [
    'patients.read', 'patients.write',
    'appointments.read', 'appointments.write',
    'medical_records.read', 'medical_records.write',
    'prescriptions.read', 'prescriptions.write',
    'lab.tests.read', 'lab.tests.write', 'lab.results.read',
    'vitals.read',
    'reports.medical'
  ],
  nurse: [
    'patients.read',
    'appointments.read', 'appointments.write',
    'medical_records.read',
    'vitals.read', 'vitals.write',
    'prescriptions.read'
  ],
  receptionist: [
    'patients.read', 'patients.register',
    'appointments.read', 'appointments.write',
    'invoices.read'
  ],
  accountant: [
    'patients.read',
    'invoices.read', 'invoices.write',
    'payments.read', 'payments.write',
    'mpesa.read', 'mpesa.write',
    'reports.read', 'reports.financial'
  ],
  lab_technician: [
    'patients.read',
    'lab.tests.read', 'lab.tests.write',
    'lab.results.read', 'lab.results.write'
  ],
  pharmacist: [
    'patients.read',
    'prescriptions.read', 'prescriptions.fulfill',
    'drugs.read', 'drugs.write',
    'inventory.read', 'inventory.write',
    'reports.inventory'
  ],
  procurement: [
    'suppliers.read', 'suppliers.write',
    'purchase_orders.read', 'purchase_orders.write',
    'inventory.read', 'inventory.write',
    'drugs.read',
    'reports.inventory'
  ]
};

// Patient Types
export interface Patient {
  id: string;
  patientNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  nationalId?: string;
  phone: string;
  email?: string;
  address?: string;
  county?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bloodGroup?: string;
  allergies?: string[];
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePatientDTO {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  nationalId?: string;
  phone: string;
  email?: string;
  address?: string;
  county?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bloodGroup?: string;
  allergies?: string[];
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
}

// Appointment Types
export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentDate: Date;
  appointmentTime: string;
  duration: number;
  type: 'consultation' | 'follow_up' | 'emergency' | 'procedure';
  status: 'scheduled' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  reason?: string;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAppointmentDTO {
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  appointmentTime: string;
  duration?: number;
  type: 'consultation' | 'follow_up' | 'emergency' | 'procedure';
  reason?: string;
  notes?: string;
}

// Visit Types
export interface Visit {
  id: string;
  patientId: string;
  appointmentId?: string;
  visitDate: Date;
  visitType: 'outpatient' | 'inpatient' | 'emergency';
  chiefComplaint?: string;
  status: 'checked_in' | 'with_doctor' | 'with_nurse' | 'in_lab' | 'in_pharmacy' | 'discharged';
  dischargeDate?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
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
  notes?: string;
  recordedBy: string;
  recordedAt: Date;
}

export interface CreateVitalsDTO {
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
  notes?: string;
}

// Medical Record Types
export interface MedicalRecord {
  id: string;
  visitId: string;
  patientId: string;
  doctorId: string;
  diagnosis?: string;
  diagnosisCode?: string;
  symptoms?: string[];
  examination?: string;
  treatmentPlan?: string;
  notes?: string;
  followUpDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Prescription Types
export interface Prescription {
  id: string;
  visitId: string;
  patientId: string;
  doctorId: string;
  status: 'pending' | 'dispensed' | 'partially_dispensed' | 'cancelled';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  items?: PrescriptionItem[];
}

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
}

// Lab Types
export interface LabTest {
  id: string;
  visitId: string;
  patientId: string;
  orderedBy: string;
  testCatalogId: string;
  testName: string;
  status: 'ordered' | 'sample_collected' | 'processing' | 'completed' | 'cancelled';
  priority: 'routine' | 'urgent' | 'stat';
  sampleType?: string;
  sampleCollectedAt?: Date;
  sampleCollectedBy?: string;
  results?: string;
  resultNotes?: string;
  completedAt?: Date;
  completedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LabTestCatalog {
  id: string;
  testCode: string;
  testName: string;
  category: string;
  description?: string;
  sampleType: string;
  normalRange?: string;
  unit?: string;
  price: number;
  turnaroundTime?: string;
  isActive: boolean;
}

// Pharmacy Types
export interface Drug {
  id: string;
  drugCode: string;
  name: string;
  genericName?: string;
  category: string;
  formulation: string;
  strength?: string;
  manufacturer?: string;
  supplierId?: string;
  unitPrice: number;
  sellingPrice: number;
  reorderLevel: number;
  currentStock: number;
  expiryDate?: Date;
  batchNumber?: string;
  storageConditions?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Invoice & Payment Types
export interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  visitId?: string;
  subtotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: 'draft' | 'pending' | 'partially_paid' | 'paid' | 'cancelled' | 'refunded';
  dueDate?: Date;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  itemType: 'consultation' | 'procedure' | 'lab_test' | 'drug' | 'other';
  itemId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  totalPrice: number;
}

export interface CreateInvoiceDTO {
  patientId: string;
  visitId?: string;
  items: Array<{
    itemType: 'consultation' | 'procedure' | 'lab_test' | 'drug' | 'other';
    itemId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
  }>;
  discount?: number;
  notes?: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  paymentNumber: string;
  amount: number;
  paymentMethod: 'cash' | 'mpesa' | 'card' | 'insurance' | 'bank_transfer';
  paymentReference?: string;
  mpesaTransactionId?: string;
  receivedBy: string;
  notes?: string;
  createdAt: Date;
}

// M-Pesa Types
export interface MpesaTransaction {
  id: string;
  transactionId: string;
  transactionType: string;
  transactionTime: string;
  amount: number;
  businessShortCode: string;
  billRefNumber: string;
  invoiceNumber?: string;
  orgAccountBalance?: number;
  thirdPartyTransId?: string;
  msisdn: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  rawPayload: Record<string, unknown>;
  status: 'pending' | 'allocated' | 'failed';
  allocatedToInvoiceId?: string;
  allocatedAt?: Date;
  createdAt: Date;
}

export interface MpesaC2BPayload {
  TransactionType: string;
  TransID: string;
  TransTime: string;
  TransAmount: string;
  BusinessShortCode: string;
  BillRefNumber: string;
  InvoiceNumber?: string;
  OrgAccountBalance?: string;
  ThirdPartyTransID?: string;
  MSISDN: string;
  FirstName?: string;
  MiddleName?: string;
  LastName?: string;
}

// Supplier & Procurement Types
export interface Supplier {
  id: string;
  supplierCode: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone: string;
  address?: string;
  city?: string;
  country: string;
  paymentTerms?: string;
  taxPin?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'ordered' | 'partially_received' | 'received' | 'cancelled';
  subtotal: number;
  tax: number;
  totalAmount: number;
  expectedDeliveryDate?: Date;
  receivedDate?: Date;
  notes?: string;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  items?: PurchaseOrderItem[];
}

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

// Audit Types
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  tableName: string;
  recordId?: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}