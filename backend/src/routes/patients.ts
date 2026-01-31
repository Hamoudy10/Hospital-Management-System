// ============================================
// Patient Routes
// ============================================

import { Router } from 'express';
import {
  createPatient,
  getPatientById,
  updatePatient,
  searchPatients,
  getPatients,
  getPatientMedicalHistory,
  deletePatient
} from '../controllers/patientController';
import { requireAuth } from '../middleware/auth';
import { requirePermission, requireAnyPermission } from '../middleware/role';

const router = Router();

// ==================== PATIENT ROUTES ====================

/**
 * @route   POST /api/patients
 * @desc    Register new patient
 * @access  Private - patients.register or patients.write
 */
router.post(
  '/',
  requireAuth,
  requireAnyPermission('patients.register', 'patients.write'),
  createPatient
);

/**
 * @route   GET /api/patients
 * @desc    Get all patients (paginated)
 * @access  Private - patients.read
 */
router.get(
  '/',
  requireAuth,
  requirePermission('patients.read'),
  getPatients
);

/**
 * @route   GET /api/patients/search
 * @desc    Search patients by name, phone, patient number, or national ID
 * @access  Private - patients.read
 */
router.get(
  '/search',
  requireAuth,
  requirePermission('patients.read'),
  searchPatients
);

/**
 * @route   GET /api/patients/:id
 * @desc    Get patient by ID
 * @access  Private - patients.read
 */
router.get(
  '/:id',
  requireAuth,
  requirePermission('patients.read'),
  getPatientById
);

/**
 * @route   PUT /api/patients/:id
 * @desc    Update patient
 * @access  Private - patients.write
 */
router.put(
  '/:id',
  requireAuth,
  requirePermission('patients.write'),
  updatePatient
);

/**
 * @route   DELETE /api/patients/:id
 * @desc    Soft delete patient
 * @access  Private - patients.delete
 */
router.delete(
  '/:id',
  requireAuth,
  requirePermission('patients.delete'),
  deletePatient
);

/**
 * @route   GET /api/patients/:id/medical-history
 * @desc    Get patient's medical history
 * @access  Private - medical_records.read
 */
router.get(
  '/:id/medical-history',
  requireAuth,
  requirePermission('medical_records.read'),
  getPatientMedicalHistory
);

export default router;