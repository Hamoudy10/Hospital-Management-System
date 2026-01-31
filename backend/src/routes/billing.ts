import { Router } from 'express'
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  voidInvoice,
  getInvoicesByPatient,
  addInvoiceItem,
  removeInvoiceItem,
  applyDiscount,
  getPayments,
  getPaymentById,
  recordPayment,
  getOutstandingBalances,
  getInvoiceSummary,
  sendInvoiceReminder
} from '../controllers/billingController'
import { requireAuth } from '../middleware/auth'
import { requirePermission } from '../middleware/role'

const router = Router()

// All routes require authentication
router.use(requireAuth)

// Invoice routes
router.post('/invoices', requirePermission('invoices.write'), createInvoice)
router.get('/invoices', requirePermission('invoices.read'), getInvoices)
router.get('/invoices/summary', requirePermission('invoices.read'), getInvoiceSummary)
router.get('/invoices/outstanding', requirePermission('invoices.read'), getOutstandingBalances)
router.get('/invoices/patient/:patientId', requirePermission('invoices.read'), getInvoicesByPatient)
router.get('/invoices/:id', requirePermission('invoices.read'), getInvoiceById)
router.put('/invoices/:id', requirePermission('invoices.write'), updateInvoice)
router.delete('/invoices/:id', requirePermission('invoices.write'), voidInvoice)

// Invoice items
router.post('/invoices/:id/items', requirePermission('invoices.write'), addInvoiceItem)
router.delete('/invoices/:id/items/:itemId', requirePermission('invoices.write'), removeInvoiceItem)

// Discounts
router.post('/invoices/:id/discount', requirePermission('invoices.write'), applyDiscount)

// Invoice notifications
router.post('/invoices/:id/remind', requirePermission('invoices.write'), sendInvoiceReminder)

// Payment routes
router.get('/payments', requirePermission('invoices.read'), getPayments)
router.get('/payments/:id', requirePermission('invoices.read'), getPaymentById)
router.post('/payments', requirePermission('invoices.write'), recordPayment)

export default router