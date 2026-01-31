// ============================================
// Billing Controller
// ============================================

import { Response } from 'express';
import { supabase } from '../config/supabase';
import { createInvoiceSchema, createPaymentSchema, paginationSchema } from '../utils/validators';
import { logger } from '../utils/logger';
import { invoiceService } from '../services/invoiceService';
import { printService } from '../services/printService';
import auditService from '../services/auditService';
import { AuthenticatedRequest } from '../types';

/**
 * Create Invoice
 */
export const createInvoice = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const validation = createInvoiceSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors
      });
      return;
    }

    const result = await invoiceService.createInvoice(validation.data, req.user!.id);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error
      });
      return;
    }

    res.status(201).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error('Create invoice error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create invoice'
    });
  }
};

/**
 * Get Invoice by ID
 */
export const getInvoiceById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const invoice = await invoiceService.getInvoiceById(id);

    if (!invoice) {
      res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
      return;
    }

    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    logger.error('Get invoice error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invoice'
    });
  }
};

/**
 * Get Invoice by Number
 */
export const getInvoiceByNumber = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { invoiceNumber } = req.params;
    const invoice = await invoiceService.getInvoiceByNumber(invoiceNumber);

    if (!invoice) {
      res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
      return;
    }

    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    logger.error('Get invoice by number error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invoice'
    });
  }
};

/**
 * Get Invoices (Paginated)
 */
export const getInvoices = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const paginationValidation = paginationSchema.safeParse(req.query);
    const { page, limit } = paginationValidation.data || { page: 1, limit: 20 };
    const { patientId, status, startDate, endDate } = req.query;

    const result = await invoiceService.getInvoices({
      patientId: patientId as string,
      status: status as string,
      startDate: startDate as string,
      endDate: endDate as string,
      page,
      limit
    });

    res.json({
      success: true,
      data: result.data,
      meta: result.meta
    });
  } catch (error) {
    logger.error('Get invoices error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invoices'
    });
  }
};

/**
 * Add Payment to Invoice
 */
export const addPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const validation = createPaymentSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors
      });
      return;
    }

    const { invoiceId, amount, paymentMethod, paymentReference, notes } = validation.data;

    const result = await invoiceService.addPayment(
      invoiceId,
      amount,
      paymentMethod,
      req.user!.id,
      { paymentReference, notes }
    );

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error
      });
      return;
    }

    res.status(201).json({
      success: true,
      data: {
        paymentId: result.paymentId
      }
    });
  } catch (error) {
    logger.error('Add payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add payment'
    });
  }
};

/**
 * Get Payments for Invoice
 */
export const getInvoicePayments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { invoiceId } = req.params;

    const { data: payments, error } = await supabase
      .from('payments')
      .select(`
        *,
        cashier:received_by(first_name, last_name),
        mpesa_transaction:mpesa_transaction_id(transaction_id, msisdn)
      `)
      .eq('invoice_id', invoiceId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    logger.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payments'
    });
  }
};

/**
 * Cancel Invoice
 */
export const cancelInvoice = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const result = await invoiceService.cancelInvoice(id, req.user!.id, reason);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error
      });
      return;
    }

    res.json({
      success: true,
      message: 'Invoice cancelled successfully'
    });
  } catch (error) {
    logger.error('Cancel invoice error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel invoice'
    });
  }
};

/**
 * Generate Receipt PDF
 */
export const generateReceipt = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { paymentId } = req.params;

    const pdfBase64 = await printService.generateA5Receipt(paymentId);

    res.json({
      success: true,
      data: {
        pdf: pdfBase64
      }
    });
  } catch (error) {
    logger.error('Generate receipt error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate receipt'
    });
  }
};

/**
 * Get Financial Summary
 */
export const getFinancialSummary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      res.status(400).json({
        success: false,
        error: 'Start date and end date are required'
      });
      return;
    }

    const summary = await invoiceService.getFinancialSummary(
      startDate as string,
      endDate as string
    );

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    logger.error('Get financial summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get financial summary'
    });
  }
};

/**
 * Get Daily Revenue
 */
export const getDailyRevenue = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { days = 30 } = req.query;
    const daysCount = Math.min(Number(days), 365);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysCount);

    const { data: payments, error } = await supabase
      .from('payments')
      .select('amount, payment_method, created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    // Group by date
    const dailyRevenue: Record<string, { total: number; cash: number; mpesa: number; other: number }> = {};

    payments?.forEach(payment => {
      const date = new Date(payment.created_at).toISOString().split('T')[0];
      
      if (!dailyRevenue[date]) {
        dailyRevenue[date] = { total: 0, cash: 0, mpesa: 0, other: 0 };
      }

      dailyRevenue[date].total += payment.amount;

      if (payment.payment_method === 'cash') {
        dailyRevenue[date].cash += payment.amount;
      } else if (payment.payment_method === 'mpesa') {
        dailyRevenue[date].mpesa += payment.amount;
      } else {
        dailyRevenue[date].other += payment.amount;
      }
    });

    const result = Object.entries(dailyRevenue).map(([date, data]) => ({
      date,
      ...data
    }));

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Get daily revenue error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get daily revenue'
    });
  }
};

/**
 * Get Outstanding Invoices
 */
export const getOutstandingInvoices = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const paginationValidation = paginationSchema.safeParse(req.query);
    const { page, limit } = paginationValidation.data || { page: 1, limit: 20 };
    const offset = (page - 1) * limit;

    const { data: invoices, error, count } = await supabase
      .from('invoices')
      .select(`
        *,
        patient:patient_id(patient_number, first_name, last_name, phone)
      `, { count: 'exact' })
      .in('status', ['pending', 'partially_paid'])
      .gt('balance_amount', 0)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: invoices,
      meta: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    logger.error('Get outstanding invoices error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get outstanding invoices'
    });
  }
};