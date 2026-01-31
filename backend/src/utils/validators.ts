// ============================================
// Zod Validation Schemas
// ============================================

import { z } from 'zod';

// ==================== COMMON SCHEMAS ====================

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  search: z.string().optional()
});

export const uuidSchema = z.string().uuid();

export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)');

export const phoneSchema = z.string()
  .regex(/^(?:\+254|0)?[17]\d{8}$/, 'Invalid Kenyan phone number');

export const emailSchema = z.string().email('Invalid email address');

// ==================== AUTH SCHEMAS ====================

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const registerSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phone: phoneSchema.optional(),
  role: z.enum(['doctor', 'nurse', 'receptionist', 'accountant', 'lab_technician', 'pharmacist', 'procurement', 'admin']),
  department: z.string().optional()
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters')
});

// ==================== PATIENT SCHEMAS ====================

export const createPatientSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  dateOfBirth: dateSchema,
  gender: z.enum(['male', 'female', 'other']),
  nationalId: z.string().optional(),
  phone: phoneSchema,
  email: emailSchema.optional(),
  address: z.string().optional(),
  county: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: phoneSchema.optional(),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  allergies: z.array(z.string()).optional(),
  insuranceProvider: z.string().optional(),
  insurancePolicyNumber: z.string().optional()
});

export const updatePatientSchema = createPatientSchema.partial();

export const patientSearchSchema = z.object({
  query: z.string().min(1),
  type: z.enum(['name', 'phone', 'patientNumber', 'nationalId']).optional().default('name')
});

// ==================== APPOINTMENT SCHEMAS ====================

export const createAppointmentSchema = z.object({
  patientId: uuidSchema,
  doctorId: uuidSchema,
  appointmentDate: dateSchema,
  appointmentTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
  duration: z.number().min(15).max(120).optional().default(30),
  type: z.enum(['consultation', 'follow_up', 'emergency', 'procedure']),
  reason: z.string().optional(),
  notes: z.string().optional()
});

export const updateAppointmentSchema = z.object({
  appointmentDate: dateSchema.optional(),
  appointmentTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  duration: z.number().min(15).max(120).optional(),
  type: z.enum(['consultation', 'follow_up', 'emergency', 'procedure']).optional(),
  status: z.enum(['scheduled', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show']).optional(),
  reason: z.string().optional(),
  notes: z.string().optional()
});

// ==================== INVOICE SCHEMAS ====================

export const createInvoiceSchema = z.object({
  patientId: uuidSchema,
  visitId: uuidSchema.optional(),
  items: z.array(z.object({
    itemType: z.enum(['consultation', 'procedure', 'lab_test', 'drug', 'other']),
    itemId: uuidSchema.optional(),
    description: z.string().min(1),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
    discount: z.number().min(0).optional()
  })).min(1, 'At least one item is required'),
  discount: z.number().min(0).optional(),
  notes: z.string().optional()
});

export const createPaymentSchema = z.object({
  invoiceId: uuidSchema,
  amount: z.number().positive('Amount must be positive'),
  paymentMethod: z.enum(['cash', 'mpesa', 'card', 'insurance', 'bank_transfer']),
  paymentReference: z.string().optional(),
  notes: z.string().optional()
});

// ==================== LAB SCHEMAS ====================

export const createLabTestSchema = z.object({
  visitId: uuidSchema,
  patientId: uuidSchema,
  testCatalogId: uuidSchema,
  priority: z.enum(['routine', 'urgent', 'stat']).optional().default('routine')
});

export const updateLabTestSchema = z.object({
  status: z.enum(['ordered', 'sample_collected', 'processing', 'completed', 'cancelled']).optional(),
  results: z.string().optional(),
  resultNotes: z.string().optional()
});

export const labTestCatalogSchema = z.object({
  testCode: z.string().min(2),
  testName: z.string().min(2),
  category: z.string().min(2),
  description: z.string().optional(),
  sampleType: z.string().min(2),
  normalRange: z.string().optional(),
  unit: z.string().optional(),
  price: z.number().min(0),
  turnaroundTime: z.string().optional()
});

// ==================== PHARMACY SCHEMAS ====================

export const createDrugSchema = z.object({
  drugCode: z.string().min(2),
  name: z.string().min(2),
  genericName: z.string().optional(),
  category: z.string().min(2),
  formulation: z.string().min(2),
  strength: z.string().optional(),
  manufacturer: z.string().optional(),
  supplierId: uuidSchema.optional(),
  unitPrice: z.number().min(0),
  sellingPrice: z.number().min(0),
  reorderLevel: z.number().min(0),
  currentStock: z.number().min(0),
  expiryDate: dateSchema.optional(),
  batchNumber: z.string().optional(),
  storageConditions: z.string().optional()
});

export const updateDrugSchema = createDrugSchema.partial();

export const stockAdjustmentSchema = z.object({
  drugId: uuidSchema,
  adjustmentType: z.enum(['add', 'subtract', 'set']),
  quantity: z.number().min(0),
  reason: z.string().min(2),
  batchNumber: z.string().optional(),
  expiryDate: dateSchema.optional()
});

export const createPrescriptionSchema = z.object({
  visitId: uuidSchema,
  patientId: uuidSchema,
  items: z.array(z.object({
    drugId: uuidSchema,
    drugName: z.string(),
    dosage: z.string(),
    frequency: z.string(),
    duration: z.string(),
    quantity: z.number().min(1),
    instructions: z.string().optional()
  })).min(1),
  notes: z.string().optional()
});

export const dispensePrescriptionSchema = z.object({
  prescriptionId: uuidSchema,
  items: z.array(z.object({
    prescriptionItemId: uuidSchema,
    dispensedQuantity: z.number().min(0)
  }))
});

// ==================== PROCUREMENT SCHEMAS ====================

export const createSupplierSchema = z.object({
  supplierCode: z.string().min(2),
  name: z.string().min(2),
  contactPerson: z.string().optional(),
  email: emailSchema.optional(),
  phone: phoneSchema,
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().default('Kenya'),
  paymentTerms: z.string().optional(),
  taxPin: z.string().optional()
});

export const updateSupplierSchema = createSupplierSchema.partial();

export const createPurchaseOrderSchema = z.object({
  supplierId: uuidSchema,
  items: z.array(z.object({
    drugId: uuidSchema.optional(),
    itemDescription: z.string().min(2),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0)
  })).min(1),
  expectedDeliveryDate: dateSchema.optional(),
  notes: z.string().optional()
});

export const receivePurchaseOrderSchema = z.object({
  items: z.array(z.object({
    purchaseOrderItemId: uuidSchema,
    receivedQuantity: z.number().min(0),
    batchNumber: z.string().optional(),
    expiryDate: dateSchema.optional()
  }))
});

// ==================== M-PESA SCHEMAS ====================

export const mpesaSTKPushSchema = z.object({
  phoneNumber: phoneSchema,
  amount: z.number().positive(),
  invoiceNumber: z.string().min(1),
  accountReference: z.string().optional()
});

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

// ==================== REPORT SCHEMAS ====================

export const dateRangeSchema = z.object({
  startDate: dateSchema,
  endDate: dateSchema
});

export const reportFilterSchema = z.object({
  startDate: dateSchema,
  endDate: dateSchema,
  groupBy: z.enum(['day', 'week', 'month']).optional().default('day'),
  format: z.enum(['json', 'pdf', 'excel']).optional().default('json')
});