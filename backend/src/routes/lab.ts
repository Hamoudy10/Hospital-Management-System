// ============================================
// Lab Routes
// ============================================

import { Router } from 'express';
import {
  createLabTest,
  getLabTestById,
  updateLabTest,
  getLabTests,
  getPendingLabTests,
  collectSample,
  enterResults,
  generateResultPDF,
  getTestCatalog,
  addTestToCatalog,
  updateTestCatalog,
  getTestCategories
} from '../controllers/labController';
import { requireAuth } from '../middleware/auth';
import { requirePermission, requireAnyPermission } from '../middleware/role';

const router = Router();

// ==================== LAB TEST ROUTES ====================

/**
 * @route   POST /api/lab/tests
 * @desc    Create lab test order
 * @access  Private - lab.tests.write
 */
router.post(
  '/tests',
  requireAuth,
  requirePermission('lab.tests.write'),
  createLabTest
);

/**
 * @route   GET /api/lab/tests
 * @desc    Get all lab tests (paginated)
 * @access  Private - lab.tests.read
 */
router.get(
  '/tests',
  requireAuth,
  requirePermission('lab.tests.read'),
  getLabTests
);

/**
 * @route   GET /api/lab/tests/pending
 * @desc    Get pending lab tests queue
 * @access  Private - lab.tests.read
 */
router.get(
  '/tests/pending',
  requireAuth,
  requirePermission('lab.tests.read'),
  getPendingLabTests
);

/**
 * @route   GET /api/lab/tests/:id
 * @desc    Get lab test by ID
 * @access  Private - lab.tests.read
 */
router.get(
  '/tests/:id',
  requireAuth,
  requirePermission('lab.tests.read'),
  getLabTestById
);

/**
 * @route   PUT /api/lab/tests/:id
 * @desc    Update lab test
 * @access  Private - lab.tests.write or lab.results.write
 */
router.put(
  '/tests/:id',
  requireAuth,
  requireAnyPermission('lab.tests.write', 'lab.results.write'),
  updateLabTest
);

/**
 * @route   POST /api/lab/tests/:id/collect-sample
 * @desc    Collect sample for lab test
 * @access  Private - lab.tests.write
 */
router.post(
  '/tests/:id/collect-sample',
  requireAuth,
  requirePermission('lab.tests.write'),
  collectSample
);

/**
 * @route   POST /api/lab/tests/:id/results
 * @desc    Enter lab test results
 * @access  Private - lab.results.write
 */
router.post(
  '/tests/:id/results',
  requireAuth,
  requirePermission('lab.results.write'),
  enterResults
);

/**
 * @route   GET /api/lab/tests/:id/pdf
 * @desc    Generate lab result PDF
 * @access  Private - lab.results.read
 */
router.get(
  '/tests/:id/pdf',
  requireAuth,
  requirePermission('lab.results.read'),
  generateResultPDF
);

// ==================== TEST CATALOG ROUTES ====================

/**
 * @route   GET /api/lab/catalog
 * @desc    Get test catalog
 * @access  Private - lab.tests.read
 */
router.get(
  '/catalog',
  requireAuth,
  requirePermission('lab.tests.read'),
  getTestCatalog
);

/**
 * @route   GET /api/lab/catalog/categories
 * @desc    Get test categories
 * @access  Private - lab.tests.read
 */
router.get(
  '/catalog/categories',
  requireAuth,
  requirePermission('lab.tests.read'),
  getTestCategories
);

/**
 * @route   POST /api/lab/catalog
 * @desc    Add test to catalog
 * @access  Private - lab.tests.write (Admin/LabTech)
 */
router.post(
  '/catalog',
  requireAuth,
  requirePermission('lab.tests.write'),
  addTestToCatalog
);

/**
 * @route   PUT /api/lab/catalog/:id
 * @desc    Update test in catalog
 * @access  Private - lab.tests.write
 */
router.put(
  '/catalog/:id',
  requireAuth,
  requirePermission('lab.tests.write'),
  updateTestCatalog
);

export default router;