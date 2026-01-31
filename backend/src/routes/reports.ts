// ============================================
// Report Routes
// ============================================

import { Router } from 'express';
import {
  getRevenueReport,
  getOutstandingReport,
  getDailyCollectionReport,
  getPatientVisitReport,
  getDiagnosisReport,
  getDoctorPerformanceReport,
  getLabTestReport,
  getLabTurnaroundReport,
  getInventoryReport,
  getStockMovementReport,
  getAppointmentReport,
  getAuditReport,
  exportReport
} from '../controllers/reportController';
import { requireAuth } from '../middleware/auth';
import { requirePermission, requireAnyPermission, requireRole } from '../middleware/role';

const router = Router();

// ==================== FINANCIAL REPORTS ====================

/**
 * @route   GET /api/reports/financial/revenue
 * @desc    Get revenue report
 * @access  Private - reports.financial
 */
router.get(
  '/financial/revenue',
  requireAuth,
  requirePermission('reports.financial'),
  getRevenueReport
);

/**
 * @route   GET /api/reports/financial/outstanding
 * @desc    Get outstanding invoices report
 * @access  Private - reports.financial
 */
router.get(
  '/financial/outstanding',
  requireAuth,
  requirePermission('reports.financial'),
  getOutstandingReport
);

/**
 * @route   GET /api/reports/financial/daily-collection
 * @desc    Get daily collection report
 * @access  Private - reports.financial
 */
router.get(
  '/financial/daily-collection',
  requireAuth,
  requirePermission('reports.financial'),
  getDailyCollectionReport
);

// ==================== MEDICAL REPORTS ====================

/**
 * @route   GET /api/reports/medical/visits
 * @desc    Get patient visit report
 * @access  Private - reports.medical
 */
router.get(
  '/medical/visits',
  requireAuth,
  requirePermission('reports.medical'),
  getPatientVisitReport
);

/**
 * @route   GET /api/reports/medical/diagnosis
 * @desc    Get diagnosis report
 * @access  Private - reports.medical
 */
router.get(
  '/medical/diagnosis',
  requireAuth,
  requirePermission('reports.medical'),
  getDiagnosisReport
);

/**
 * @route   GET /api/reports/medical/doctor-performance
 * @desc    Get doctor performance report
 * @access  Private - reports.medical
 */
router.get(
  '/medical/doctor-performance',
  requireAuth,
  requirePermission('reports.medical'),
  getDoctorPerformanceReport
);

// ==================== LAB REPORTS ====================

/**
 * @route   GET /api/reports/lab/tests
 * @desc    Get lab test report
 * @access  Private - reports.read or lab.tests.read
 */
router.get(
  '/lab/tests',
  requireAuth,
  requireAnyPermission('reports.read', 'lab.tests.read'),
  getLabTestReport
);

/**
 * @route   GET /api/reports/lab/turnaround
 * @desc    Get lab turnaround time report
 * @access  Private - reports.read or lab.tests.read
 */
router.get(
  '/lab/turnaround',
  requireAuth,
  requireAnyPermission('reports.read', 'lab.tests.read'),
  getLabTurnaroundReport
);

// ==================== INVENTORY REPORTS ====================

/**
 * @route   GET /api/reports/inventory
 * @desc    Get inventory report
 * @access  Private - reports.inventory
 */
router.get(
  '/inventory',
  requireAuth,
  requirePermission('reports.inventory'),
  getInventoryReport
);

/**
 * @route   GET /api/reports/inventory/stock-movement
 * @desc    Get stock movement report
 * @access  Private - reports.inventory
 */
router.get(
  '/inventory/stock-movement',
  requireAuth,
  requirePermission('reports.inventory'),
  getStockMovementReport
);

// ==================== APPOINTMENT REPORTS ====================

/**
 * @route   GET /api/reports/appointments
 * @desc    Get appointment report
 * @access  Private - reports.read
 */
router.get(
  '/appointments',
  requireAuth,
  requirePermission('reports.read'),
  getAppointmentReport
);

// ==================== AUDIT REPORTS ====================

/**
 * @route   GET /api/reports/audit
 * @desc    Get audit log report
 * @access  Private - audit.read (Admin only)
 */
router.get(
  '/audit',
  requireAuth,
  requirePermission('audit.read'),
  getAuditReport
);

// ==================== EXPORT ====================

/**
 * @route   GET /api/reports/export
 * @desc    Export report (PDF/Excel)
 * @access  Private - reports.read
 */
router.get(
  '/export',
  requireAuth,
  requirePermission('reports.read'),
  exportReport
);

export default router;