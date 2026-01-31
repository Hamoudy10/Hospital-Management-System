// ============================================
// Appointment Routes
// ============================================

import { Router } from 'express';
import {
  createAppointment,
  getAppointmentById,
  updateAppointment,
  getAppointments,
  getTodaysAppointments,
  checkInAppointment,
  getDoctorAvailability,
  cancelAppointment
} from '../controllers/appointmentController';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/role';

const router = Router();

// ==================== APPOINTMENT ROUTES ====================

/**
 * @route   POST /api/appointments
 * @desc    Create new appointment
 * @access  Private - appointments.write
 */
router.post(
  '/',
  requireAuth,
  requirePermission('appointments.write'),
  createAppointment
);

/**
 * @route   GET /api/appointments
 * @desc    Get all appointments (paginated with filters)
 * @access  Private - appointments.read
 */
router.get(
  '/',
  requireAuth,
  requirePermission('appointments.read'),
  getAppointments
);

/**
 * @route   GET /api/appointments/today
 * @desc    Get today's appointments for a doctor
 * @access  Private - appointments.read
 */
router.get(
  '/today',
  requireAuth,
  requirePermission('appointments.read'),
  getTodaysAppointments
);

/**
 * @route   GET /api/appointments/availability
 * @desc    Get doctor's available time slots
 * @access  Private - appointments.read
 */
router.get(
  '/availability',
  requireAuth,
  requirePermission('appointments.read'),
  getDoctorAvailability
);

/**
 * @route   GET /api/appointments/:id
 * @desc    Get appointment by ID
 * @access  Private - appointments.read
 */
router.get(
  '/:id',
  requireAuth,
  requirePermission('appointments.read'),
  getAppointmentById
);

/**
 * @route   PUT /api/appointments/:id
 * @desc    Update appointment
 * @access  Private - appointments.write
 */
router.put(
  '/:id',
  requireAuth,
  requirePermission('appointments.write'),
  updateAppointment
);

/**
 * @route   POST /api/appointments/:id/check-in
 * @desc    Check in patient for appointment
 * @access  Private - appointments.write
 */
router.post(
  '/:id/check-in',
  requireAuth,
  requirePermission('appointments.write'),
  checkInAppointment
);

/**
 * @route   POST /api/appointments/:id/cancel
 * @desc    Cancel appointment
 * @access  Private - appointments.write
 */
router.post(
  '/:id/cancel',
  requireAuth,
  requirePermission('appointments.write'),
  cancelAppointment
);

export default router;