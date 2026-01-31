import { Router } from 'express'
import {
  // Test catalog
  getTestCatalog,
  getTestById,
  createTest,
  updateTest,
  deleteTest,
  
  // Lab orders
  createLabOrder,
  getLabOrders,
  getLabOrderById,
  updateLabOrder,
  cancelLabOrder,
  getLabOrdersByPatient,
  getPendingLabOrders,
  
  // Samples
  collectSample,
  getSampleById,
  updateSampleStatus,
  getSamplesByOrder,
  
  // Results
  enterResults,
  getResultById,
  updateResult,
  verifyResult,
  getResultsByPatient,
  getPendingResults,
  
  // Reports
  printLabReport,
  getLabStatistics
} from '../controllers/labController'
import { requireAuth } from '../middleware/auth'
import { requirePermission } from '../middleware/role'

const router = Router()

// All routes require authentication
router.use(requireAuth)

// Test catalog management
router.get('/tests', requirePermission('lab.read'), getTestCatalog)
router.get('/tests/:id', requirePermission('lab.read'), getTestById)
router.post('/tests', requirePermission('lab.tests.write'), createTest)
router.put('/tests/:id', requirePermission('lab.tests.write'), updateTest)
router.delete('/tests/:id', requirePermission('lab.tests.write'), deleteTest)

// Lab orders
router.post('/orders', requirePermission('lab.tests.write'), createLabOrder)
router.get('/orders', requirePermission('lab.read'), getLabOrders)
router.get('/orders/pending', requirePermission('lab.read'), getPendingLabOrders)
router.get('/orders/patient/:patientId', requirePermission('lab.read'), getLabOrdersByPatient)
router.get('/orders/:id', requirePermission('lab.read'), getLabOrderById)
router.put('/orders/:id', requirePermission('lab.tests.write'), updateLabOrder)
router.delete('/orders/:id', requirePermission('lab.tests.write'), cancelLabOrder)

// Sample management
router.post('/orders/:orderId/samples', requirePermission('lab.tests.write'), collectSample)
router.get('/samples/:id', requirePermission('lab.read'), getSampleById)
router.put('/samples/:id/status', requirePermission('lab.tests.write'), updateSampleStatus)
router.get('/orders/:orderId/samples', requirePermission('lab.read'), getSamplesByOrder)

// Results management
router.post('/orders/:orderId/results', requirePermission('lab.results.write'), enterResults)
router.get('/results/pending', requirePermission('lab.read'), getPendingResults)
router.get('/results/patient/:patientId', requirePermission('lab.read'), getResultsByPatient)
router.get('/results/:id', requirePermission('lab.read'), getResultById)
router.put('/results/:id', requirePermission('lab.results.write'), updateResult)
router.post('/results/:id/verify', requirePermission('lab.results.write'), verifyResult)

// Lab reports and statistics
router.get('/orders/:orderId/print', requirePermission('lab.read'), printLabReport)
router.get('/statistics', requirePermission('lab.read'), getLabStatistics)

export default router