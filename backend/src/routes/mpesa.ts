// ============================================
// M-Pesa Routes
// ============================================

import { Router } from 'express';
import {
  initiateSTKPush,
  querySTKPushStatus,
  stkPushCallback,
  c2bValidation,
  c2bConfirmation,
  getTransactions,
  getUnallocatedTransactions,
  allocateTransaction,
  registerC2BUrls,
  getStatistics
} from '../controllers/mpesaController';
import { requireAuth } from '../middleware/auth';
import { requirePermission, requireRole } from '../middleware/role';

const router = Router();

// ==================== PUBLIC CALLBACKS (from Safaricom) ====================

/**
 * @route   POST /api/mpesa/stk-callback
 * @desc    STK Push callback from Safaricom
 * @access  Public (Safaricom)
 */
router.post('/stk-callback', stkPushCallback);

/**
 * @route   POST /api/mpesa/c2b-validation
 * @desc    C2B validation callback from Safaricom
 * @access  Public (Safaricom)
 */
router.post('/c2b-validation', c2bValidation);

/**
 * @route   POST /api/mpesa/c2b-confirmation
 * @desc    C2B confirmation callback from Safaricom
 * @access  Public (Safaricom)
 */
router.post('/c2b-confirmation', c2bConfirmation);

// ==================== PROTECTED ROUTES ====================

/**
 * @route   POST /api/mpesa/stk-push
 * @desc    Initiate STK Push payment
 * @access  Private - mpesa.write
 */
router.post(
  '/stk-push',
  requireAuth,
  requirePermission('mpesa.write'),
  initiateSTKPush
);

/**
 * @route   GET /api/mpesa/stk-status/:checkoutRequestId
 * @desc    Query STK Push status
 * @access  Private - mpesa.read
 */
router.get(
  '/stk-status/:checkoutRequestId',
  requireAuth,
  requirePermission('mpesa.read'),
  querySTKPushStatus
);

/**
 * @route   GET /api/mpesa/transactions
 * @desc    Get M-Pesa transactions
 * @access  Private - mpesa.read
 */
router.get(
  '/transactions',
  requireAuth,
  requirePermission('mpesa.read'),
  getTransactions
);

/**
 * @route   GET /api/mpesa/transactions/unallocated
 * @desc    Get unallocated M-Pesa transactions
 * @access  Private - mpesa.read
 */
router.get(
  '/transactions/unallocated',
  requireAuth,
  requirePermission('mpesa.read'),
  getUnallocatedTransactions
);

/**
 * @route   POST /api/mpesa/transactions/:transactionId/allocate
 * @desc    Manually allocate transaction to invoice
 * @access  Private - mpesa.write
 */
router.post(
  '/transactions/:transactionId/allocate',
  requireAuth,
  requirePermission('mpesa.write'),
  allocateTransaction
);

/**
 * @route   GET /api/mpesa/statistics
 * @desc    Get M-Pesa statistics
 * @access  Private - mpesa.read
 */
router.get(
  '/statistics',
  requireAuth,
  requirePermission('mpesa.read'),
  getStatistics
);

/**
 * @route   POST /api/mpesa/register-urls
 * @desc    Register C2B URLs with Safaricom (Admin only)
 * @access  Private - Admin
 */
router.post(
  '/register-urls',
  requireAuth,
  requireRole('admin'),
  registerC2BUrls
);

export default router;