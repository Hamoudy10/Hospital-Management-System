// ============================================
// Procurement Routes
// ============================================

import { Router } from 'express';
import {
  createSupplier,
  getSupplierById,
  updateSupplier,
  getSuppliers,
  deleteSupplier,
  createPurchaseOrder,
  getPurchaseOrderById,
  updatePurchaseOrder,
  getPurchaseOrders,
  submitForApproval,
  approvePurchaseOrder,
  rejectPurchaseOrder,
  markAsOrdered,
  receiveItems,
  cancelPurchaseOrder,
  getPendingPurchaseOrders,
  getStatistics
} from '../controllers/procurementController';
import { requireAuth } from '../middleware/auth';
import { requirePermission, requireRole } from '../middleware/role';

const router = Router();

// ==================== SUPPLIER ROUTES ====================

/**
 * @route   POST /api/procurement/suppliers
 * @desc    Create new supplier
 * @access  Private - suppliers.write
 */
router.post(
  '/suppliers',
  requireAuth,
  requirePermission('suppliers.write'),
  createSupplier
);

/**
 * @route   GET /api/procurement/suppliers
 * @desc    Get all suppliers (paginated)
 * @access  Private - suppliers.read
 */
router.get(
  '/suppliers',
  requireAuth,
  requirePermission('suppliers.read'),
  getSuppliers
);

/**
 * @route   GET /api/procurement/suppliers/:id
 * @desc    Get supplier by ID
 * @access  Private - suppliers.read
 */
router.get(
  '/suppliers/:id',
  requireAuth,
  requirePermission('suppliers.read'),
  getSupplierById
);

/**
 * @route   PUT /api/procurement/suppliers/:id
 * @desc    Update supplier
 * @access  Private - suppliers.write
 */
router.put(
  '/suppliers/:id',
  requireAuth,
  requirePermission('suppliers.write'),
  updateSupplier
);

/**
 * @route   DELETE /api/procurement/suppliers/:id
 * @desc    Delete supplier (soft delete)
 * @access  Private - suppliers.delete
 */
router.delete(
  '/suppliers/:id',
  requireAuth,
  requirePermission('suppliers.delete'),
  deleteSupplier
);

// ==================== PURCHASE ORDER ROUTES ====================

/**
 * @route   POST /api/procurement/purchase-orders
 * @desc    Create new purchase order
 * @access  Private - purchase_orders.write
 */
router.post(
  '/purchase-orders',
  requireAuth,
  requirePermission('purchase_orders.write'),
  createPurchaseOrder
);

/**
 * @route   GET /api/procurement/purchase-orders
 * @desc    Get all purchase orders (paginated)
 * @access  Private - purchase_orders.read
 */
router.get(
  '/purchase-orders',
  requireAuth,
  requirePermission('purchase_orders.read'),
  getPurchaseOrders
);

/**
 * @route   GET /api/procurement/purchase-orders/pending
 * @desc    Get pending purchase orders
 * @access  Private - purchase_orders.read
 */
router.get(
  '/purchase-orders/pending',
  requireAuth,
  requirePermission('purchase_orders.read'),
  getPendingPurchaseOrders
);

/**
 * @route   GET /api/procurement/purchase-orders/:id
 * @desc    Get purchase order by ID
 * @access  Private - purchase_orders.read
 */
router.get(
  '/purchase-orders/:id',
  requireAuth,
  requirePermission('purchase_orders.read'),
  getPurchaseOrderById
);

/**
 * @route   PUT /api/procurement/purchase-orders/:id
 * @desc    Update purchase order
 * @access  Private - purchase_orders.write
 */
router.put(
  '/purchase-orders/:id',
  requireAuth,
  requirePermission('purchase_orders.write'),
  updatePurchaseOrder
);

/**
 * @route   POST /api/procurement/purchase-orders/:id/submit
 * @desc    Submit PO for approval
 * @access  Private - purchase_orders.write
 */
router.post(
  '/purchase-orders/:id/submit',
  requireAuth,
  requirePermission('purchase_orders.write'),
  submitForApproval
);

/**
 * @route   POST /api/procurement/purchase-orders/:id/approve
 * @desc    Approve purchase order
 * @access  Private - Admin
 */
router.post(
  '/purchase-orders/:id/approve',
  requireAuth,
  requireRole('admin'),
  approvePurchaseOrder
);

/**
 * @route   POST /api/procurement/purchase-orders/:id/reject
 * @desc    Reject purchase order
 * @access  Private - Admin
 */
router.post(
  '/purchase-orders/:id/reject',
  requireAuth,
  requireRole('admin'),
  rejectPurchaseOrder
);

/**
 * @route   POST /api/procurement/purchase-orders/:id/mark-ordered
 * @desc    Mark PO as ordered
 * @access  Private - purchase_orders.write
 */
router.post(
  '/purchase-orders/:id/mark-ordered',
  requireAuth,
  requirePermission('purchase_orders.write'),
  markAsOrdered
);

/**
 * @route   POST /api/procurement/purchase-orders/:id/receive
 * @desc    Receive PO items
 * @access  Private - inventory.write
 */
router.post(
  '/purchase-orders/:id/receive',
  requireAuth,
  requirePermission('inventory.write'),
  receiveItems
);

/**
 * @route   POST /api/procurement/purchase-orders/:id/cancel
 * @desc    Cancel purchase order
 * @access  Private - purchase_orders.write
 */
router.post(
  '/purchase-orders/:id/cancel',
  requireAuth,
  requirePermission('purchase_orders.write'),
  cancelPurchaseOrder
);

// ==================== STATISTICS ====================

/**
 * @route   GET /api/procurement/statistics
 * @desc    Get procurement statistics
 * @access  Private - purchase_orders.read
 */
router.get(
  '/statistics',
  requireAuth,
  requirePermission('purchase_orders.read'),
  getStatistics
);

export default router;