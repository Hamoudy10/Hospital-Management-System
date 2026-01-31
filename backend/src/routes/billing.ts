// ============================================
// Billing Routes
// ============================================

import { Router } from 'express';
import {
  createInvoice,
  getInvoiceById,
  getInvoiceByNumber,
  getInvoices,
  addPayment,
  getInvoicePayments,
  cancelInvoice,
  generateReceipt,
  getFinancialSummary,
  getDailyRevenue,
  getOutstandingInvoices
} from '../controllers/billingController';
import { requireAuth } from '../middleware/auth';
import { requirePermission, requireAnyPermission } from '../middleware/role';

const router = Router();

// ==================== INVOICE ROUTES ====================

/**
 * @route   POST /api/billing/invoices
 * @desc    Create new invoice
 * @access  Private - invoices.write
 */
router.post(
  '/invoices',
  requireAuth,
  requirePermission('invoices.write'),
  createInvoice
);

/**
 * @route   GET /api/billing/invoices
 * @desc    Get all invoices (paginated)
 * @access  Private - invoices.read
 */
router.get(
  '/invoices',
  requireAuth,
  requirePermission('invoices.read'),
  getInvoices
);

/**
 * @route   GET /api/billing/invoices/outstanding
 * @desc    Get outstanding invoices
 * @access  Private - invoices.read
 */
router.get(
  '/invoices/outstanding',
  requireAuth,
  requirePermission('invoices.read'),
  getOutstandingInvoices
);

/**
 * @route   GET /api/billing/invoices/number/:invoiceNumber
 * @desc    Get invoice by number
 * @access  Private - invoices.read
 */
router.get(
  '/invoices/number/:invoiceNumber',
  requireAuth,
  requirePermission('invoices.read'),
  getInvoiceByNumber
);

/**
 * @route   GET /api/billing/invoices/:id
 * @desc    Get invoice by ID
 * @access  Private - invoices.read
 */
router.get(
  '/invoices/:id',
  requireAuth,
  requirePermission('invoices.read'),
  getInvoiceById
);

/**
 * @route   POST /api/billing/invoices/:id/cancel
 * @desc    Cancel invoice
 * @access  Private - invoices.delete
 */
router.post(
  '/invoices/:id/cancel',
  requireAuth,
  requirePermission('invoices.delete'),
  cancelInvoice
);

/**
 * @route   GET /api/billing/invoices/:invoiceId/payments
 * @desc    Get payments for an invoice
 * @access  Private - payments.read
 */
router.get(
  '/invoices/:invoiceId/payments',
  requireAuth,
  requirePermission('payments.read'),
  getInvoicePayments
);

// ==================== PAYMENT ROUTES ====================

/**
 * @route   POST /api/billing/payments
 * @desc    Add payment to invoice
 * @access  Private - payments.write
 */
router.post(
  '/payments',
  requireAuth,
  requirePermission('payments.write'),
  addPayment
);

/**
 * @route   GET /api/billing/payments/:paymentId/receipt
 * @desc    Generate receipt PDF for payment
 * @access  Private - payments.read
 */
router.get(
  '/payments/:paymentId/receipt',
  requireAuth,
  requirePermission('payments.read'),
  generateReceipt
);

// ==================== FINANCIAL REPORTS ====================

/**
 * @route   GET /api/billing/summary
 * @desc    Get financial summary
 * @access  Private - reports.financial
 */
router.get(
  '/summary',
  requireAuth,
  requirePermission('reports.financial'),
  getFinancialSummary
);

/**
 * @route   GET /api/billing/daily-revenue
 * @desc    Get daily revenue for last N days
 * @access  Private - reports.financial
 */
router.get(
  '/daily-revenue',
  requireAuth,
  requirePermission('reports.financial'),
  getDailyRevenue
);

export default router;