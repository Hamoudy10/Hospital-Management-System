// ============================================
// Role-Based Access Control Middleware
// ============================================

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, UserRole, Permission, ROLE_PERMISSIONS } from '../types';
import { logger } from '../utils/logger';

/**
 * Require specific role(s) to access a route
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      const user = req.user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required.'
        });
        return;
      }

      // Admin has access to everything
      if (user.role === 'admin') {
        next();
        return;
      }

      if (!allowedRoles.includes(user.role)) {
        logger.warn(`Access denied: User ${user.id} with role ${user.role} tried to access route requiring ${allowedRoles.join(', ')}`);
        res.status(403).json({
          success: false,
          error: 'Access denied. Insufficient role permissions.'
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Role middleware error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during authorization.'
      });
    }
  };
};

/**
 * Require specific permission(s) to access a route
 */
export const requirePermission = (...requiredPermissions: Permission[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      const user = req.user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required.'
        });
        return;
      }

      // Get permissions for user's role
      const userPermissions = ROLE_PERMISSIONS[user.role] || [];

      // Check if user has all required permissions
      const hasAllPermissions = requiredPermissions.every(permission =>
        userPermissions.includes(permission)
      );

      if (!hasAllPermissions) {
        logger.warn(`Permission denied: User ${user.id} missing permissions ${requiredPermissions.join(', ')}`);
        res.status(403).json({
          success: false,
          error: 'Access denied. Insufficient permissions.'
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Permission middleware error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during authorization.'
      });
    }
  };
};

/**
 * Require any of the specified permissions (OR logic)
 */
export const requireAnyPermission = (...permissions: Permission[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      const user = req.user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required.'
        });
        return;
      }

      const userPermissions = ROLE_PERMISSIONS[user.role] || [];

      const hasAnyPermission = permissions.some(permission =>
        userPermissions.includes(permission)
      );

      if (!hasAnyPermission) {
        logger.warn(`Permission denied: User ${user.id} has none of ${permissions.join(', ')}`);
        res.status(403).json({
          success: false,
          error: 'Access denied. Insufficient permissions.'
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Permission middleware error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during authorization.'
      });
    }
  };
};

/**
 * Check if user has a specific permission
 */
export const hasPermission = (user: AuthenticatedRequest['user'], permission: Permission): boolean => {
  if (!user) return false;
  const userPermissions = ROLE_PERMISSIONS[user.role] || [];
  return userPermissions.includes(permission);
};

/**
 * Get all permissions for a role
 */
export const getRolePermissions = (role: UserRole): Permission[] => {
  return ROLE_PERMISSIONS[role] || [];
};

/**
 * Check if user can access their own resource or has admin role
 */
export const requireOwnerOrRole = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      const user = req.user;
      const resourceUserId = req.params.userId || req.body.userId;

      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required.'
        });
        return;
      }

      // Allow if user is accessing their own resource
      if (user.id === resourceUserId) {
        next();
        return;
      }

      // Allow if user has one of the allowed roles
      if (allowedRoles.includes(user.role)) {
        next();
        return;
      }

      logger.warn(`Access denied: User ${user.id} tried to access resource belonging to ${resourceUserId}`);
      res.status(403).json({
        success: false,
        error: 'Access denied. You can only access your own resources.'
      });
    } catch (error) {
      logger.error('Owner/Role middleware error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during authorization.'
      });
    }
  };
};