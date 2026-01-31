// ============================================
// Authentication Routes
// ============================================

import { Router } from 'express';
import {
  login,
  register,
  getProfile,
  updateProfile,
  changePassword,
  logout,
  getUsers
} from '../controllers/authController';
import { requireAuth } from '../middleware/auth';
import { requireRole, requirePermission } from '../middleware/role';

const router = Router();

// ==================== PUBLIC ROUTES ====================

/**
 * @route   POST /api/auth/login
 * @desc    User login
 * @access  Public
 */
router.post('/login', login);

// ==================== PROTECTED ROUTES ====================

/**
 * @route   POST /api/auth/register
 * @desc    Register new user (Admin only)
 * @access  Private - Admin
 */
router.post('/register', requireAuth, requireRole('admin'), register);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', requireAuth, getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/profile', requireAuth, updateProfile);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password', requireAuth, changePassword);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', requireAuth, logout);

/**
 * @route   GET /api/auth/users
 * @desc    Get all users (Admin only)
 * @access  Private - Admin
 */
router.get('/users', requireAuth, requirePermission('users.read'), getUsers);

export default router;