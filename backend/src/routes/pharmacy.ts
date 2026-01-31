// ============================================
// Pharmacy Routes
// ============================================

import { Router } from 'express';
import {
  createDrug,
  getDrugById,
  updateDrug,
  getDrugs,
  adjustStock,
  getLowStockAlerts,
  getExpiringDrugs,
  getDrugCategories,
  createPrescription,
  getPrescriptionById,
  getPendingPrescriptions,
  dispensePrescription
} from '../controllers/pharmacyController';
import { requireAuth } from '../middleware/auth';
import { requirePermission, requireAnyPermission } from '../middleware/role';

const router = Router();

// ==================== DRUG INVENTORY ROUTES ====================

/**
 * @route   POST /api/pharmacy/drugs
 * @desc    Create new drug
 * @access  Private - drugs.write
 */
router.post(
  '/drugs',
  requireAuth,
  requirePermission('drugs.write'),
  createDrug
);

/**
 * @route   GET /api/pharmacy/drugs
 * @desc    Get all drugs (paginated)
 * @access  Private - drugs.read
 */
router.get(
  '/drugs',
  requireAuth,
  requirePermission('drugs.read'),
  getDrugs
);

/**
 * @route   GET /api/pharmacy/drugs/categories
 * @desc    Get drug categories
 * @access  Private - drugs.read
 */
router.get(
  '/drugs/categories',
  requireAuth,
  requirePermission('drugs.read'),
  getDrugCategories
);

/**
 * @route   GET /api/pharmacy/drugs/low-stock
 * @desc    Get low stock alerts
 * @access  Private - inventory.read
 */
router.get(
  '/drugs/low-stock',
  requireAuth,
  requirePermission('inventory.read'),
  getLowStockAlerts
);

/**
 * @route   GET /api/pharmacy/drugs/expiring
 * @desc    Get expiring drugs
 * @access  Private - inventory.read
 */
router.get(
  '/drugs/expiring',
  requireAuth,
  requirePermission('inventory.read'),
  getExpiringDrugs
);

/**
 * @route   GET /api/pharmacy/drugs/:id
 * @desc    Get drug by ID
 * @access  Private - drugs.read
 */
router.get(
  '/drugs/:id',
  requireAuth,
  requirePermission('drugs.read'),
  getDrugById
);

/**
 * @route   PUT /api/pharmacy/drugs/:id
 * @desc    Update drug
 * @access  Private - drugs.write
 */
router.put(
  '/drugs/:id',
  requireAuth,
  requirePermission('drugs.write'),
  updateDrug
);

/**
 * @route   POST /api/pharmacy/stock/adjust
 * @desc    Adjust drug stock
 * @access  Private - inventory.write
 */
router.post(
  '/stock/adjust',
  requireAuth,
  requirePermission('inventory.write'),
  adjustStock
);

// ==================== PRESCRIPTION ROUTES ====================

/**
 * @route   POST /api/pharmacy/prescriptions
 * @desc    Create prescription
 * @access  Private - prescriptions.write
 */
router.post(
  '/prescriptions',
  requireAuth,
  requirePermission('prescriptions.write'),
  createPrescription
);

/**
 * @route   GET /api/pharmacy/prescriptions/pending
 * @desc    Get pending prescriptions for dispensing
 * @access  Private - prescriptions.read or prescriptions.fulfill
 */
router.get(
  '/prescriptions/pending',
  requireAuth,
  requireAnyPermission('prescriptions.read', 'prescriptions.fulfill'),
  getPendingPrescriptions
);

/**
 * @route   GET /api/pharmacy/prescriptions/:id
 * @desc    Get prescription by ID
 * @access  Private - prescriptions.read
 */
router.get(
  '/prescriptions/:id',
  requireAuth,
  requirePermission('prescriptions.read'),
  getPrescriptionById
);

/**
 * @route   POST /api/pharmacy/prescriptions/dispense
 * @desc    Dispense prescription
 * @access  Private - prescriptions.fulfill
 */
router.post(
  '/prescriptions/dispense',
  requireAuth,
  requirePermission('prescriptions.fulfill'),
  dispensePrescription
);

export default router;