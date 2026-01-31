// ============================================
// Audit Service
// ============================================

import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';

interface AuditLogEntry {
  userId: string;
  action: string;
  tableName: string;
  recordId?: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

class AuditService {
  /**
   * Log a generic audit entry
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await supabase.from('audit_logs').insert({
        user_id: entry.userId,
        action: entry.action,
        table_name: entry.tableName,
        record_id: entry.recordId,
        old_data: entry.oldData,
        new_data: entry.newData,
        ip_address: entry.ipAddress,
        user_agent: entry.userAgent,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to create audit log:', error);
      // Don't throw - audit failures shouldn't break the main operation
    }
  }

  /**
   * Log a CREATE operation
   */
  async logCreate(
    userId: string,
    tableName: string,
    recordId: string,
    newData?: Record<string, unknown>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      userId,
      action: 'CREATE',
      tableName,
      recordId,
      newData,
      ipAddress,
      userAgent
    });
  }

  /**
   * Log an UPDATE operation
   */
  async logUpdate(
    userId: string,
    tableName: string,
    recordId: string,
    oldData?: Record<string, unknown>,
    newData?: Record<string, unknown>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      userId,
      action: 'UPDATE',
      tableName,
      recordId,
      oldData,
      newData,
      ipAddress,
      userAgent
    });
  }

  /**
   * Log a DELETE operation
   */
  async logDelete(
    userId: string,
    tableName: string,
    recordId: string,
    oldData?: Record<string, unknown>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      userId,
      action: 'DELETE',
      tableName,
      recordId,
      oldData,
      ipAddress,
      userAgent
    });
  }

  /**
   * Log a LOGIN event
   */
  async logLogin(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
    success: boolean = true
  ): Promise<void> {
    await this.log({
      userId,
      action: success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
      tableName: 'users',
      recordId: userId,
      ipAddress,
      userAgent
    });
  }

  /**
   * Log a LOGOUT event
   */
  async logLogout(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      userId,
      action: 'LOGOUT',
      tableName: 'users',
      recordId: userId,
      ipAddress,
      userAgent
    });
  }

  /**
   * Log a PAYMENT event
   */
  async logPayment(
    userId: string,
    paymentId: string,
    details: Record<string, unknown>
  ): Promise<void> {
    await this.log({
      userId,
      action: 'PAYMENT_RECEIVED',
      tableName: 'payments',
      recordId: paymentId,
      newData: details
    });
  }

  /**
   * Log M-Pesa transaction
   */
  async logMpesaTransaction(
    transactionId: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    await this.log({
      userId: 'SYSTEM',
      action: 'MPESA_CALLBACK',
      tableName: 'mpesa_transactions',
      recordId: transactionId,
      newData: payload
    });
  }

  /**
   * Get audit logs with filters
   */
  async getAuditLogs(filters: {
    userId?: string;
    action?: string;
    tableName?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          user:user_id(first_name, last_name, email)
        `, { count: 'exact' });

      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters.action) {
        query = query.eq('action', filters.action);
      }

      if (filters.tableName) {
        query = query.eq('table_name', filters.tableName);
      }

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      const page = filters.page || 1;
      const limit = filters.limit || 50;
      const offset = (page - 1) * limit;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        data,
        meta: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      logger.error('Failed to get audit logs:', error);
      throw error;
    }
  }

  /**
   * Get user activity summary
   */
  async getUserActivity(userId: string, days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('audit_logs')
        .select('action, table_name, created_at')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by action
      const actionCounts: Record<string, number> = {};
      data?.forEach(log => {
        actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      });

      return {
        totalActions: data?.length || 0,
        byAction: actionCounts,
        recentActivity: data?.slice(0, 10)
      };
    } catch (error) {
      logger.error('Failed to get user activity:', error);
      throw error;
    }
  }
}

export const auditService = new AuditService();
export default auditService;