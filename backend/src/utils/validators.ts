// ============================================
// Zod Validation Schemas
// ============================================

import { z } from 'zod';

// Common validation patterns
const phoneRegex = /^(?:\+254|0)[17]\d{8}$/;
const nationalIdRegex = /^\d{7,8}$/;

// ==================== AUTH SCHEMAS ====================

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phone: z.string().regex(phoneRegex, 'Invalid Kenyan phone number').optional(),
  role: z.enum(['doctor', 'nurse', 'receptionist', 'accountant', 'lab_technician', 'pharmacist', 'procurement', 'admin']),
  department: z.string().optional()
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

// ==================== PATIENT SCHEMAS ====================

export const createPatientSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  dateOfBirth: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date format'),
  gender: z.enum(['male', 'female', 'other']),
  nationalId: z.string().regex(nationalIdRegex, 'Invalid national ID').optional().or(z.literal('')),
  phone: z.string().regex(phoneRegex, 'Invalid Kenyan phone number'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  county: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().regex(phoneRegex, 'Invalid phone number').optional().or(z.literal('')),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  allergies: z.array(z.string()).optional(),
  insuranceProvider: z.string().optional(),
  insurancePolicyNumber: z.string().optional()
});

export const updatePatientSchema = createPatientSchema.partial();

export const patientSearchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  type: z.enum(['name', 'phone', 'patientNumber', 'nationalId']).optional()
});

// ==================== APPOINTMENT SCHEMAS ====================

export const createAppointmentSchema = z.object({
  patientId: z.string().uuid('Invalid patient ID'),
  doctorId: z.string().uuid('Invalid doctor ID'),
  appointmentDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date format'),
  appointmentTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
  duration: z.number().min(15).max(240).optional().default(30),
  type: z.enum(['consultation', 'follow_up', 'emergency', 'procedure']),
  reason: z.string().optional(),
  notes: z.string().optional()
});

export const updateAppointmentSchema = z.object({
  appointmentDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date format').optional(),
  appointmentTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format').optional(),
  duration: z.number().min(15).max(240).optional(),
  type: z.enum(['consultation', 'follow_up', 'emergency', 'procedure']).optional(),
  status: z.enum(['scheduled', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show']).optional(),
  reason: z.string().optional(),
  notes: z.string().optional()
});

// ==================== VISIT SCHEMAS ====================

export const createVisitSchema = z.object({
  patientId: z.string().uuid('Invalid patient ID'),
  appointmentId: z.string().uuid('Invalid appointment ID').optional(),
  visitType: z.enum(['outpatient', 'inpatient', 'emergency']),
  chiefComplaint: z.string().optional()
});

export const updateVisitSchema = z.object({
  status: z.enum(['checked_in', 'with_doctor', 'with_nurse', 'in_lab', 'in_pharmacy', 'discharged']).optional(),
  chiefComplaint: z.string().optional(),
  dischargeDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date format').optional()
});

// ==================== VITALS SCHEMAS ====================

export const createVitalsSchema = z.object({
  visitId: z.string().uuid('Invalid visit ID'),
  patientId: z.string().uuid('Invalid patient ID'),
  temperature: z.number().min(30).max(45).optional(),
  bloodPressureSystolic: z.number().min(50).max(250).optional(),
  bloodPressureDiastolic: z.number().min(30).max(150).optional(),
  pulseRate: z.number().min(30).max(200).optional(),
  respiratoryRate: z.number().min(5).max(60).optional(),
  oxygenSaturation: z.number().min(50).max(100).optional(),
  weight: z.number().min(0.5).max(500).optional(),
  height: z.number().min(20).max(300).optional(),
  notes: z.string().optional()
});

// ==================== MEDICAL RECORD SCHEMAS ====================

export const createMedicalRecordSchema = z.object({
  visitId: z.string().uuid('Invalid visit ID'),
  patientId: z.string().uuid('Invalid patient ID'),
  diagnosis: z.string().optional(),
  diagnosisCode: z.string().optional(),
  symptoms: z.array(z.string()).optional(),
  examination: z.string().optional(),
  treatmentPlan: z.string().optional(),
  notes: z.string().optional(),
  followUpDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date format').optional()
});

export const updateMedicalRecordSchema = createMedicalRecordSchema.partial().omit({ visitId: true, patientId: true });

// ==================== PRESCRIPTION SCHEMAS ====================

export const createPrescriptionSchema = z.object({
  visitId: z.string().uuid('Invalid visit ID'),
  patientId: z.string().uuid('Invalid patient ID'),
  notes: z.string().optional(),
  items: z.array(z.object({
    drugId: z.string().uuid('Invalid drug ID'),
    drugName: z.string(),
    dosage: z.string(),
    frequency: z.string(),
    duration: z.string(),
    quantity: z.number().min(1),
    instructions: z.string().optional()
  })).min(1, 'At least one prescription item is required')
});

export const dispensePrescriptionSchema = z.object({
  prescriptionId: z.string().uuid('Invalid prescription ID'),
  items: z.array(z.object({
    prescriptionItemId: z.string().uuid('Invalid item ID'),
    dispensedQuantity: z.number().min(0)
  }))
});

// ==================== LAB TEST SCHEMAS ====================

export const createLabTestSchema = z.object({
  visitId: z.string().uuid('Invalid visit ID'),
  patientId: z.string().uuid('Invalid patient ID'),
  testCatalogId: z.string().uuid('Invalid test catalog ID'),
  priority: z.enum(['routine', 'urgent', 'stat']).optional().default('routine'),
  notes: z.string().optional()
});

export const updateLabTestSchema = z.object({
  status: z.enum(['ordered', 'sample_collected', 'processing', 'completed', 'cancelled']).optional(),
  sampleCollectedAt: z.string().optional(),
  results: z.string().optional(),
  resultNotes: z.string().optional()
});

export const labTestCatalogSchema = z.object({
  testCode: z.string().min(2, 'Test code is required'),
  testName: z.string().min(2, 'Test name is required'),
  category: z.string(),
  description: z.string().optional(),
  sampleType: z.string(),
  normalRange: z.string().optional(),
  unit: z.string().optional(),
  price: z.number().min(0),
  turnaroundTime: z.string().optional()
});

// ==================== PHARMACY / DRUG SCHEMAS ====================

export const createDrugSchema = z.object({
  drugCode: z.string().min(2, 'Drug code is required'),
  name: z.string().min(2, 'Drug name is required'),
  genericName: z.string().optional(),
  category: z.string(),
  formulation: z.string(),
  strength: z.string().optional(),
  manufacturer: z.string().optional(),
  supplierId: z.string().uuid('Invalid supplier ID').optional(),
  unitPrice: z.number().min(0),
  sellingPrice: z.number().min(0),
  reorderLevel: z.number().min(0),
  currentStock: z.number().min(0),
  expiryDate: z.string().optional(),
  batchNumber: z.string().optional(),
  storageConditions: z.string().optional()
});

export const updateDrugSchema = createDrugSchema.partial();

export const stockAdjustmentSchema = z.object({
  drugId: z.string().uuid('Invalid drug ID'),
  adjustmentType: z.enum(['add', 'subtract', 'set']),
  quantity: z.number().min(0),
  reason: z.string().min(1, 'Reason is required'),
  batchNumber: z.string().optional(),
  expiryDate: z.string().optional()
});

// ==================== INVOICE SCHEMAS ====================

export const createInvoiceSchema = z.object({
  patientId: z.string().uuid('Invalid patient ID'),
  visitId: z.string().uuid('Invalid visit ID').optional(),
  discount: z.number().min(0).optional().default(0),
  notes: z.string().optional(),
  items: z.array(z.object({
    itemType: z.enum(['consultation', 'procedure', 'lab_test', 'drug', 'other']),
    itemId: z.string().uuid().optional(),
    description: z.string(),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
    discount: z.number().min(0).optional().default(0)
  })).min(1, 'At least one invoice item is required')
});

export const updateInvoiceSchema = z.object({
  discount: z.number().min(0).optional(),
  notes: z.string().optional(),
  status: z.enum(['draft', 'pending', 'partially_paid', 'paid', 'cancelled', 'refunded']).optional()
});

// ==================== PAYMENT SCHEMAS ====================

export const createPaymentSchema = z.object({
  invoiceId: z.string().uuid('Invalid invoice ID'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  paymentMethod: z.enum(['cash', 'mpesa', 'card', 'insurance', 'bank_transfer']),
  paymentReference: z.string().optional(),
  notes: z.string().optional()
});

// ==================== MPESA SCHEMAS ====================

export const mpesaC2BSchema = z.object({
  TransactionType: z.string(),
  TransID: z.string(),
  TransTime: z.string(),
  TransAmount: z.string(),
  BusinessShortCode: z.string(),
  BillRefNumber: z.string(),
  InvoiceNumber: z.string().optional(),
  OrgAccountBalance: z.string().optional(),
  ThirdPartyTransID: z.string().optional(),
  MSISDN: z.string(),
  FirstName: z.string().optional(),
  MiddleName: z.string().optional(),
  LastName: z.string().optional()
});

export const mpesaSTKPushSchema = z.object({
  phoneNumber: z.string().regex(phoneRegex, 'Invalid Kenyan phone number'),
  amount: z.number().min(1, 'Amount must be at least 1'),
  invoiceNumber: z.string(),
  accountReference: z.string().optional()
});

// ==================== SUPPLIER SCHEMAS ====================

export const createSupplierSchema = z.object({
  supplierCode: z.string().min(2, 'Supplier code is required'),
  name: z.string().min(2, 'Supplier name is required'),
  contactPerson: z.string().optional(),
  email: z.string().email('Invalid email').optional(),
  phone: z.string().regex(phoneRegex, 'Invalid phone number'),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional().default('Kenya'),
  paymentTerms: z.string().optional(),
  taxPin: z.string().optional()
});

export const updateSupplierSchema = createSupplierSchema.partial();

// ==================== PURCHASE ORDER SCHEMAS ====================

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().uuid('Invalid supplier ID'),
  expectedDeliveryDate: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    drugId: z.string().uuid().optional(),
    itemDescription: z.string(),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0)
  })).min(1, 'At least one item is required')
});

export const updatePurchaseOrderSchema = z.object({
  status: z.enum(['draft', 'pending_approval', 'approved', 'ordered', 'partially_received', 'received', 'cancelled']).optional(),
  expectedDeliveryDate: z.string().optional(),
  notes: z.string().optional()
});

export const receivePurchaseOrderSchema = z.object({
  items: z.array(z.object({
    itemId: z.string().uuid('Invalid item ID'),
    receivedQuantity: z.number().min(0)
  }))
});

// ==================== REPORT SCHEMAS ====================

export const reportQuerySchema = z.object({
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid start date'),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid end date'),
  type: z.enum(['financial', 'medical', 'inventory', 'appointments', 'patients']).optional(),
  department: z.string().optional(),
  doctorId: z.string().uuid().optional(),
  format: z.enum(['json', 'pdf', 'csv']).optional().default('json')
});

// ==================== PAGINATION SCHEMA ====================

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  search: z.string().optional()
});

// Type exports
export type LoginDTO = z.infer<typeof loginSchema>;
export type RegisterDTO = z.infer<typeof registerSchema>;
export type CreatePatientDTO = z.infer<typeof createPatientSchema>;
export type CreateAppointmentDTO = z.infer<typeof createAppointmentSchema>;
export type CreateVisitDTO = z.infer<typeof createVisitSchema>;
export type CreateVitalsDTO = z.infer<typeof createVitalsSchema>;
export type CreateMedicalRecordDTO = z.infer<typeof createMedicalRecordSchema>;
export type CreatePrescriptionDTO = z.infer<typeof createPrescriptionSchema>;
export type CreateLabTestDTO = z.infer<typeof createLabTestSchema>;
export type CreateDrugDTO = z.infer<typeof createDrugSchema>;
export type CreateInvoiceDTO = z.infer<typeof createInvoiceSchema>;
export type CreatePaymentDTO = z.infer<typeof createPaymentSchema>;
export type CreateSupplierDTO = z.infer<typeof createSupplierSchema>;
export type CreatePurchaseOrderDTO = z.infer<typeof createPurchaseOrderSchema>;
export type PaginationDTO = z.infer<typeof paginationSchema>;