import { Router } from 'express'
import {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient,
  searchPatients,
  getPatientVisits,
  getPatientAttachments,
  uploadPatientAttachment,
  deletePatientAttachment
} from '../controllers/patientController'
import { requireAuth } from '../middleware/auth'
import { requirePermission } from '../middleware/role'

const router = Router()

// All routes require authentication
router.use(requireAuth)

// Patient CRUD
router.post('/', requirePermission('patients.register'), createPatient)
router.get('/', requirePermission('patients.read'), getPatients)
router.get('/search', requirePermission('patients.read'), searchPatients)
router.get('/:id', requirePermission('patients.read'), getPatientById)
router.put('/:id', requirePermission('patients.write'), updatePatient)
router.delete('/:id', requirePermission('patients.write'), deletePatient)

// Patient visits
router.get('/:id/visits', requirePermission('visits.read'), getPatientVisits)

// Patient attachments (e.g., documents, images)
router.get('/:id/attachments', requirePermission('patients.read'), getPatientAttachments)
router.post('/:id/attachments', requirePermission('patients.write'), uploadPatientAttachment)
router.delete('/:id/attachments/:attachmentId', requirePermission('patients.write'), deletePatientAttachment)

export default router