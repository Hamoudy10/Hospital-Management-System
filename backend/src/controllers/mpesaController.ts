// ============================================
// M-Pesa Controller
// ============================================

import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { mpesaC2BSchema, mpesaSTKPushSchema, paginationSchema } from '../utils/validators';
import { logger } from '../utils/logger';
import { mpesaService } from '../services/mpesaService';
import auditService from '../services/auditService';
import { AuthenticatedRequest } from '../types';

/**
 * Initiate STK Push
 */
export const initiateSTKPush = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const validation = mpesaSTKPushSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors
      });
      return;
    }

    const { phoneNumber, amount, invoiceNumber, accountReference } = validation.data;

    const result = await mpesaService.initiateSTKPush({
      phoneNumber,
      amount,
      accountReference: accountReference || invoiceNumber,
      transactionDesc: `Payment for Invoice ${invoiceNumber}`
    });

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error
      });
      return;
    }

    res.json({
      success: true,
      data: {
        checkoutRequestId: result.checkoutRequestId,
        merchantRequestId: result.merchantRequestId,
        customerMessage: result.customerMessage
      }
    });
  } catch (error) {
    logger.error('STK Push error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initiate payment'
    });
  }
};

/**
 * Query STK Push Status
 */
export const querySTKPushStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { checkoutRequestId } = req.params;

    const result = await mpesaService.querySTKPushStatus(checkoutRequestId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('STK Query error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to query payment status'
    });
  }
};

/**
 * STK Push Callback
 */
export const stkPushCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { Body } = req.body;
    
    logger.info('STK Push Callback received:', JSON.stringify(req.body));

    if (!Body?.stkCallback) {
      res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
      return;
    }

    const callback = Body.stkCallback;
    const checkoutRequestId = callback.CheckoutRequestID;
    const resultCode = callback.ResultCode;

    // Update STK request record
    await supabase
      .from('mpesa_stk_requests')
      .update({
        result_code: resultCode,
        result_desc: callback.ResultDesc,
        status: resultCode === 0 ? 'completed' : 'failed',
        callback_data: callback,
        updated_at: new Date().toISOString()
      })
      .eq('checkout_request_id', checkoutRequestId);

    if (resultCode === 0 && callback.CallbackMetadata) {
      // Payment successful - extract details
      const metadata = callback.CallbackMetadata.Item;
      const amount = metadata.find((i: { Name: string }) => i.Name === 'Amount')?.Value;
      const mpesaReceiptNumber = metadata.find((i: { Name: string }) => i.Name === 'MpesaReceiptNumber')?.Value;
      const phoneNumber = metadata.find((i: { Name: string }) => i.Name === 'PhoneNumber')?.Value;

      // Get the STK request to find the invoice
      const { data: stkRequest } = await supabase
        .from('mpesa_stk_requests')
        .select('account_reference')
        .eq('checkout_request_id', checkoutRequestId)
        .single();

      if (stkRequest) {
        // Create M-Pesa transaction record
        await supabase.from('mpesa_transactions').insert({
          transaction_id: mpesaReceiptNumber,
          transaction_type: 'CustomerPayBillOnline',
          transaction_time: new Date().toISOString(),
          amount: amount,
          business_short_code: process.env.MPESA_SHORTCODE,
          bill_ref_number: stkRequest.account_reference,
          msisdn: phoneNumber?.toString(),
          raw_payload: callback,
          status: 'pending',
          created_at: new Date().toISOString()
        });

        // Allocate payment
        await mpesaService.allocatePayment(
          mpesaReceiptNumber,
          stkRequest.account_reference,
          amount
        );
      }
    }

    // Log audit
    await auditService.logMpesaTransaction(checkoutRequestId, callback);

    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (error) {
    logger.error('STK Callback error:', error);
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
};

/**
 * C2B Validation Callback
 */
export const c2bValidation = async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = req.body;
    logger.info('C2B Validation:', JSON.stringify(payload));

    // Validate the transaction
    // For now, accept all transactions
    // In production, you might want to validate the BillRefNumber against invoices

    res.json({
      ResultCode: 0,
      ResultDesc: 'Accepted'
    });
  } catch (error) {
    logger.error('C2B Validation error:', error);
    res.json({
      ResultCode: 1,
      ResultDesc: 'Rejected'
    });
  }
};

/**
 * C2B Confirmation Callback
 */
export const c2bConfirmation = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = mpesaC2BSchema.safeParse(req.body);
    
    logger.info('C2B Confirmation received:', JSON.stringify(req.body));

    if (!validation.success) {
      logger.warn('Invalid C2B payload:', validation.error);
      res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
      return;
    }

    const result = await mpesaService.processC2BCallback(validation.data);

    if (!result.success) {
      logger.warn('C2B processing failed:', result.error);
    }

    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (error) {
    logger.error('C2B Confirmation error:', error);
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
};

/**
 * Get M-Pesa Transactions
 */
export const getTransactions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const paginationValidation = paginationSchema.safeParse(req.query);
    const { page, limit } = paginationValidation.data || { page: 1, limit: 20 };
    const { status, startDate, endDate } = req.query;

    const offset = (page - 1) * limit;

    let query = supabase
      .from('mpesa_transactions')
      .select('*', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: transactions, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: transactions,
      meta: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    logger.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transactions'
    });
  }
};

/**
 * Get Unallocated Transactions
 */
export const getUnallocatedTransactions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const paginationValidation = paginationSchema.safeParse(req.query);
    const { page, limit } = paginationValidation.data || { page: 1, limit: 20 };

    const result = await mpesaService.getUnallocatedTransactions(page, limit);

    res.json({
      success: true,
      data: result.data,
      meta: result.meta
    });
  } catch (error) {
    logger.error('Get unallocated transactions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch unallocated transactions'
    });
  }
};

/**
 * Manually Allocate Transaction
 */
export const allocateTransaction = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { transactionId } = req.params;
    const { invoiceId } = req.body;

    if (!invoiceId) {
      res.status(400).json({
        success: false,
        error: 'Invoice ID is required'
      });
      return;
    }

    const result = await mpesaService.manualAllocate(
      transactionId,
      invoiceId,
      req.user!.id
    );

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error
      });
      return;
    }

    res.json({
      success: true,
      message: 'Transaction allocated successfully'
    });
  } catch (error) {
    logger.error('Allocate transaction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to allocate transaction'
    });
  }
};

/**
 * Register C2B URLs (Admin only)
 */
export const registerC2BUrls = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await mpesaService.registerC2BUrls();

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error
      });
      return;
    }

    res.json({
      success: true,
      message: 'C2B URLs registered successfully'
    });
  } catch (error) {
    logger.error('Register C2B URLs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register C2B URLs'
    });
  }
};

/**
 * Get M-Pesa Statistics
 */
export const getStatistics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const end = endDate || new Date().toISOString();

    // Get transaction stats
    const { data: transactions } = await supabase
      .from('mpesa_transactions')
      .select('amount, status')
      .gte('created_at', start)
      .lte('created_at', end);

    const stats = {
      totalTransactions: transactions?.length || 0,
      totalAmount: transactions?.reduce((sum, t) => sum + t.amount, 0) || 0,
      allocatedCount: transactions?.filter(t => t.status === 'allocated').length || 0,
      pendingCount: transactions?.filter(t => t.status === 'pending').length || 0,
      allocatedAmount: transactions
        ?.filter(t => t.status === 'allocated')
        .reduce((sum, t) => sum + t.amount, 0) || 0,
      pendingAmount: transactions
        ?.filter(t => t.status === 'pending')
        .reduce((sum, t) => sum + t.amount, 0) || 0
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Get statistics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics'
    });
  }
};