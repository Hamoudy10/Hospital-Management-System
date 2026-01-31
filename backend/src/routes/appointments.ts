import { Router } from 'express'
import {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  cancelAppointment,
  getAppointmentsByDoctor,
  getAppointmentsByPatient,
  getTodaysAppointments,
  getDoctorSchedule,
  updateDoctorSchedule,
  checkInPatient,
  completeAppointment
} from '../controllers/appointmentController'
import { requireAuth } from '../middleware/auth'
import { requirePermission } from '../middleware/role'

const router = Router()

// All routes require authentication
router.use(requireAuth)

// Appointment CRUD
router.post('/', requirePermission('appointments.write'), createAppointment)
router.get('/', requirePermission('appointments.read'), getAppointments)
router.get('/today', requirePermission('appointments.read'), getTodaysAppointments)
router.get('/doctor/:doctorId', requirePermission('appointments.read'), getAppointmentsByDoctor)
router.get('/patient/:patientId', requirePermission('appointments.read'), getAppointmentsByPatient)
router.get('/:id', requirePermission('appointments.read'), getAppointmentById)
router.put('/:id', requirePermission('appointments.write'), updateAppointment)
router.delete('/:id', requirePermission('appointments.write'), cancelAppointment)

// Appointment workflow
router.post('/:id/check-in', requirePermission('appointments.write'), checkInPatient)
router.post('/:id/complete', requirePermission('appointments.write'), completeAppointment)

// Doctor schedule management
router.get('/schedule/:doctorId', requirePermission('appointments.read'), getDoctorSchedule)
router.put('/schedule/:doctorId', requirePermission('appointments.write'), updateDoctorSchedule)

export default router