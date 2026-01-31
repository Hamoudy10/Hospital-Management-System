import { Router } from 'express'
import {
  c2bCallback,
  c2bValidation,
  c2bConfirmation,
  getTransactionStatus,
  getTransactions,
  getTransactionById,
  initiateB2C,
  b2cCallback,
  reconcileTransactions,
  generatePaybillQR
} from '../controllers/mpesaController'
import { requireAuth } from '../middleware/auth'
import { requirePermission } from '../middleware/role'

const router = Router()

// Public M-Pesa callback endpoints (called by Safaricom)
// These must NOT have authentication as Safaricom calls them directly
router.post('/c2b-callback', c2bCallback)
router.post('/c2b-validation', c2bValidation)
router.post('/c2b-confirmation', c2bConfirmation)
router.post('/b2c-callback', b2cCallback)

// Protected routes - require authentication
router.use(requireAuth)

// Transaction queries
router.get('/transactions', requirePermission('mpesa.read'), getTransactions)
router.get('/transactions/:id', requirePermission('mpesa.read'), getTransactionById)
router.get('/transactions/:transId/status', requirePermission('mpesa.read'), getTransactionStatus)

// Generate QR code for Paybill payment
router.post('/generate-qr', requirePermission('invoices.read'), generatePaybillQR)

// B2C (Business to Customer) - for refunds
router.post('/b2c', requirePermission('mpesa.write'), initiateB2C)

// Reconciliation
router.post('/reconcile', requirePermission('mpesa.write'), reconcileTransactions)

export default router