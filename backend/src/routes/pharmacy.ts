import { Router } from 'express'
import {
  // Drug catalog
  getDrugs,
  getDrugById,
  createDrug,
  updateDrug,
  deleteDrug,
  searchDrugs,
  
  // Inventory
  getInventory,
  getInventoryByDrug,
  addStock,
  adjustStock,
  getExpiringDrugs,
  getLowStockDrugs,
  getInventoryHistory,
  
  // Prescriptions
  getPrescriptions,
  getPrescriptionById,
  createPrescription,
  updatePrescription,
  cancelPrescription,
  getPrescriptionsByPatient,
  getPendingPrescriptions,
  
  // Dispensing
  dispensePrescription,
  getDispensingHistory,
  returnToStock,
  
  // Drug interactions
  checkDrugInteractions,
  
  // Reports
  getPharmacyStatistics,
  getInventoryReport
} from '../controllers/pharmacyController'
import { requireAuth } from '../middleware/auth'
import { requirePermission } from '../middleware/role'

const router = Router()

// All routes require authentication
router.use(requireAuth)

// Drug catalog management
router.get('/drugs', requirePermission('drugs.read'), getDrugs)
router.get('/drugs/search', requirePermission('drugs.read'), searchDrugs)
router.get('/drugs/:id', requirePermission('drugs.read'), getDrugById)
router.post('/drugs', requirePermission('drugs.write'), createDrug)
router.put('/drugs/:id', requirePermission('drugs.write'), updateDrug)
router.delete('/drugs/:id', requirePermission('drugs.write'), deleteDrug)

// Drug interactions check
router.post('/drugs/interactions', requirePermission('drugs.read'), checkDrugInteractions)

// Inventory management
router.get('/inventory', requirePermission('drugs.read'), getInventory)
router.get('/inventory/expiring', requirePermission('drugs.read'), getExpiringDrugs)
router.get('/inventory/low-stock', requirePermission('drugs.read'), getLowStockDrugs)
router.get('/inventory/history', requirePermission('drugs.read'), getInventoryHistory)
router.get('/inventory/drug/:drugId', requirePermission('drugs.read'), getInventoryByDrug)
router.post('/inventory/add', requirePermission('drugs.write'), addStock)
router.post('/inventory/adjust', requirePermission('drugs.write'), adjustStock)

// Prescriptions
router.get('/prescriptions', requirePermission('prescriptions.read'), getPrescriptions)
router.get('/prescriptions/pending', requirePermission('prescriptions.read'), getPendingPrescriptions)
router.get('/prescriptions/patient/:patientId', requirePermission('prescriptions.read'), getPrescriptionsByPatient)
router.get('/prescriptions/:id', requirePermission('prescriptions.read'), getPrescriptionById)
router.post('/prescriptions', requirePermission('prescriptions.write'), createPrescription)
router.put('/prescriptions/:id', requirePermission('prescriptions.write'), updatePrescription)
router.delete('/prescriptions/:id', requirePermission('prescriptions.write'), cancelPrescription)

// Dispensing
router.post('/prescriptions/:id/dispense', requirePermission('prescriptions.fulfill'), dispensePrescription)
router.get('/dispensing/history', requirePermission('prescriptions.read'), getDispensingHistory)
router.post('/dispensing/:id/return', requirePermission('drugs.write'), returnToStock)

// Reports and statistics
router.get('/statistics', requirePermission('drugs.read'), getPharmacyStatistics)
router.get('/reports/inventory', requirePermission('drugs.read'), getInventoryReport)

export default router