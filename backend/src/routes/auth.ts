import { Router } from 'express'
import {
  login,
  register,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile
} from '../controllers/authController'
import { requireAuth } from '../middleware/auth'

const router = Router()

// Public routes
router.post('/login', login)
router.post('/register', register)
router.post('/refresh-token', refreshToken)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)

// Protected routes
router.post('/logout', requireAuth, logout)
router.get('/profile', requireAuth, getProfile)
router.put('/profile', requireAuth, updateProfile)

export default router