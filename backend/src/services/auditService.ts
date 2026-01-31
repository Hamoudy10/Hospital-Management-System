// ============================================
// Audit Logging Service
// ============================================

import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';

export interface AuditLogEntry {
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
   * Log an audit entry
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      const { error } = await supabase.from('audit_logs').insert({
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

      if (error) {
        logger.error('Failed to create audit log:', error);
      }
    } catch (err) {
      logger.error('Audit logging error:', err);
    }
  }

  /**
   * Log a create action
   */
  async logCreate(
    userId: string,
    tableName: string,
    recordId: string,
    newData: Record<string, unknown>,
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
   * Log an update action
   */
  async logUpdate(
    userId: string,
    tableName: string,
    recordId: string,
    oldData: Record<string, unknown>,
    newData: Record<string, unknown>,
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
   * Log a delete action
   */
  async logDelete(
    userId: string,
    tableName: string,
    recordId: string,
    oldData: Record<string, unknown>,
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
   * Log a login event
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
   * Log a logout event
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
   * Log a payment event
   */
  async logPayment(
    userId: string,
    paymentId: string,
    paymentData: Record<string, unknown>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      userId,
      action: 'PAYMENT_RECEIVED',
      tableName: 'payments',
      recordId: paymentId,
      newData: paymentData,
      ipAddress,
      userAgent
    });
  }

  /**
   * Log an M-Pesa transaction
   */
  async logMpesaTransaction(
    transactionId: string,
    transactionData: Record<string, unknown>
  ): Promise<void> {
    await this.log({
      userId: 'SYSTEM',
      action: 'MPESA_CALLBACK',
      tableName: 'mpesa_transactions',
      recordId: transactionId,
      newData: transactionData
    });
  }

  /**
   * Get audit logs with filters
   */
  async getAuditLogs(filters: {
    userId?: string;
    tableName?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*, users:user_id(first_name, last_name, email)', { count: 'exact' });

      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters.tableName) {
        query = query.eq('table_name', filters.tableName);
      }

      if (filters.action) {
        query = query.eq('action', filters.action);
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

      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      return {
        data,
        meta: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (err) {
      logger.error('Failed to fetch audit logs:', err);
      throw err;
    }
  }
}

export const auditService = new AuditService();
export default auditService;