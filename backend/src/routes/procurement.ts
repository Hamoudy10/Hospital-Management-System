import { Router } from 'express'
import {
  // Suppliers
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplierProducts,
  
  // Purchase orders
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  cancelPurchaseOrder,
  approvePurchaseOrder,
  rejectPurchaseOrder,
  getPendingApprovals,
  
  // Purchase order items
  addPurchaseOrderItem,
  updatePurchaseOrderItem,
  removePurchaseOrderItem,
  
  // Receiving
  receivePurchaseOrder,
  getReceivingHistory,
  
  // Quotations
  getQuotations,
  getQuotationById,
  createQuotationRequest,
  submitQuotation,
  compareQuotations,
  selectQuotation,
  
  // Reports
  getProcurementStatistics,
  getSupplierPerformance,
  getPurchaseHistory
} from '../controllers/procurementController'
import { requireAuth } from '../middleware/auth'
import { requirePermission } from '../middleware/role'

const router = Router()

// All routes require authentication
router.use(requireAuth)

// Supplier management
router.get('/suppliers', requirePermission('suppliers.read'), getSuppliers)
router.get('/suppliers/:id', requirePermission('suppliers.read'), getSupplierById)
router.post('/suppliers', requirePermission('suppliers.write'), createSupplier)
router.put('/suppliers/:id', requirePermission('suppliers.write'), updateSupplier)
router.delete('/suppliers/:id', requirePermission('suppliers.write'), deleteSupplier)
router.get('/suppliers/:id/products', requirePermission('suppliers.read'), getSupplierProducts)

// Purchase orders
router.get('/purchase-orders', requirePermission('purchase_orders.read'), getPurchaseOrders)
router.get('/purchase-orders/pending-approval', requirePermission('purchase_orders.read'), getPendingApprovals)
router.get('/purchase-orders/:id', requirePermission('purchase_orders.read'), getPurchaseOrderById)
router.post('/purchase-orders', requirePermission('purchase_orders.write'), createPurchaseOrder)
router.put('/purchase-orders/:id', requirePermission('purchase_orders.write'), updatePurchaseOrder)
router.delete('/purchase-orders/:id', requirePermission('purchase_orders.write'), cancelPurchaseOrder)

// Purchase order approval workflow
router.post('/purchase-orders/:id/approve', requirePermission('purchase_orders.approve'), approvePurchaseOrder)
router.post('/purchase-orders/:id/reject', requirePermission('purchase_orders.approve'), rejectPurchaseOrder)

// Purchase order items
router.post('/purchase-orders/:id/items', requirePermission('purchase_orders.write'), addPurchaseOrderItem)
router.put('/purchase-orders/:id/items/:itemId', requirePermission('purchase_orders.write'), updatePurchaseOrderItem)
router.delete('/purchase-orders/:id/items/:itemId', requirePermission('purchase_orders.write'), removePurchaseOrderItem)

// Receiving
router.post('/purchase-orders/:id/receive', requirePermission('inventory.write'), receivePurchaseOrder)
router.get('/receiving/history', requirePermission('inventory.read'), getReceivingHistory)

// Quotations
router.get('/quotations', requirePermission('purchase_orders.read'), getQuotations)
router.get('/quotations/:id', requirePermission('purchase_orders.read'), getQuotationById)
router.post('/quotations/request', requirePermission('purchase_orders.write'), createQuotationRequest)
router.post('/quotations/:id/submit', requirePermission('suppliers.write'), submitQuotation)
router.get('/quotations/compare/:requestId', requirePermission('purchase_orders.read'), compareQuotations)
router.post('/quotations/:id/select', requirePermission('purchase_orders.write'), selectQuotation)

// Reports and statistics
router.get('/statistics', requirePermission('purchase_orders.read'), getProcurementStatistics)
router.get('/suppliers/:id/performance', requirePermission('suppliers.read'), getSupplierPerformance)
router.get('/reports/purchase-history', requirePermission('purchase_orders.read'), getPurchaseHistory)

export default router