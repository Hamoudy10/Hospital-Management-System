// ============================================
// Invoice Service
// ============================================

import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import { Invoice, InvoiceItem, CreateInvoiceDTO } from '../types';
import auditService from './auditService';

class InvoiceService {
  /**
   * Generate unique invoice number
   */
  async generateInvoiceNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    // Get count of invoices this month
    const startOfMonth = `${year}-${month}-01`;
    const { count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth);

    const sequence = String((count || 0) + 1).padStart(4, '0');
    return `INV-${year}${month}-${sequence}`;
  }

  /**
   * Create a new invoice
   */
  async createInvoice(
    data: CreateInvoiceDTO,
    userId: string
  ): Promise<{ success: boolean; data?: Invoice; error?: string }> {
    try {
      const invoiceNumber = await this.generateInvoiceNumber();

      // Calculate totals
      let subtotal = 0;
      const items: Omit<InvoiceItem, 'id' | 'invoiceId'>[] = data.items.map(item => {
        const itemTotal = item.quantity * item.unitPrice - (item.discount || 0);
        subtotal += itemTotal;
        return {
          itemType: item.itemType,
          itemId: item.itemId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount || 0,
          totalPrice: itemTotal
        };
      });

      const tax = subtotal * 0.16; // 16% VAT in Kenya
      const totalAmount = subtotal + tax - (data.discount || 0);

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceNumber,
          patient_id: data.patientId,
          visit_id: data.visitId || null,
          subtotal: subtotal,
          tax: tax,
          discount: data.discount || 0,
          total_amount: totalAmount,
          paid_amount: 0,
          balance_amount: totalAmount,
          status: 'pending',
          notes: data.notes || null,
          created_by: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (invoiceError) {
        logger.error('Failed to create invoice:', invoiceError);
        return { success: false, error: 'Failed to create invoice' };
      }

      // Create invoice items
      const invoiceItems = items.map(item => ({
        invoice_id: invoice.id,
        item_type: item.itemType,
        item_id: item.itemId || null,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        discount: item.discount,
        total_price: item.totalPrice
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItems);

      if (itemsError) {
        logger.error('Failed to create invoice items:', itemsError);
        // Rollback invoice
        await supabase.from('invoices').delete().eq('id', invoice.id);
        return { success: false, error: 'Failed to create invoice items' };
      }

      // Log audit
      await auditService.logCreate(userId, 'invoices', invoice.id, {
        invoiceNumber,
        patientId: data.patientId,
        totalAmount,
        itemCount: items.length
      });

      return { success: true, data: invoice as Invoice };
    } catch (error) {
      logger.error('Invoice creation error:', error);
      return { success: false, error: 'Failed to create invoice' };
    }
  }

  /**
   * Get invoice by ID with items and payments
   */
  async getInvoiceById(invoiceId: string): Promise<Invoice | null> {
    try {
      const { data: invoice, error } = await supabase
        .from('invoices')
        .select(`
          *,
          patient:patient_id(id, patient_number, first_name, last_name, phone),
          items:invoice_items(*),
          payments:payments(*)
        `)
        .eq('id', invoiceId)
        .single();

      if (error) {
        logger.error('Failed to get invoice:', error);
        return null;
      }

      return invoice as Invoice;
    } catch (error) {
      logger.error('Get invoice error:', error);
      return null;
    }
  }

  /**
   * Get invoice by invoice number
   */
  async getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | null> {
    try {
      const { data: invoice, error } = await supabase
        .from('invoices')
        .select(`
          *,
          patient:patient_id(id, patient_number, first_name, last_name, phone),
          items:invoice_items(*),
          payments:payments(*)
        `)
        .eq('invoice_number', invoiceNumber)
        .single();

      if (error) {
        logger.error('Failed to get invoice by number:', error);
        return null;
      }

      return invoice as Invoice;
    } catch (error) {
      logger.error('Get invoice by number error:', error);
      return null;
    }
  }

  /**
   * Get invoices with pagination and filters
   */
  async getInvoices(filters: {
    patientId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    data: Invoice[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    try {
      let query = supabase
        .from('invoices')
        .select(`
          *,
          patient:patient_id(id, patient_number, first_name, last_name)
        `, { count: 'exact' });

      if (filters.patientId) {
        query = query.eq('patient_id', filters.patientId);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const offset = (page - 1) * limit;

      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: (data || []) as Invoice[],
        meta: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      logger.error('Failed to get invoices:', error);
      throw error;
    }
  }

  /**
   * Add payment to invoice
   */
  async addPayment(
    invoiceId: string,
    amount: number,
    paymentMethod: 'cash' | 'mpesa' | 'card' | 'insurance' | 'bank_transfer',
    userId: string,
    options?: {
      paymentReference?: string;
      mpesaTransactionId?: string;
      notes?: string;
    }
  ): Promise<{ success: boolean; paymentId?: string; error?: string }> {
    try {
      // Get current invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (invoiceError || !invoice) {
        return { success: false, error: 'Invoice not found' };
      }

      if (invoice.status === 'paid') {
        return { success: false, error: 'Invoice is already fully paid' };
      }

      if (invoice.status === 'cancelled') {
        return { success: false, error: 'Cannot add payment to cancelled invoice' };
      }

      // Generate payment number
      const paymentNumber = `PAY-${Date.now()}`;

      // Create payment
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          invoice_id: invoiceId,
          payment_number: paymentNumber,
          amount: amount,
          payment_method: paymentMethod,
          payment_reference: options?.paymentReference || null,
          mpesa_transaction_id: options?.mpesaTransactionId || null,
          received_by: userId,
          notes: options?.notes || null,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (paymentError) {
        logger.error('Failed to create payment:', paymentError);
        return { success: false, error: 'Failed to create payment' };
      }

      // Update invoice
      const newPaidAmount = (invoice.paid_amount || 0) + amount;
      const newBalanceAmount = invoice.total_amount - newPaidAmount;
      const newStatus = newBalanceAmount <= 0 ? 'paid' : 'partially_paid';

      await supabase
        .from('invoices')
        .update({
          paid_amount: newPaidAmount,
          balance_amount: Math.max(0, newBalanceAmount),
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId);

      // Log audit
      await auditService.logPayment(userId, payment.id, {
        invoiceId,
        amount,
        paymentMethod,
        newBalance: newBalanceAmount
      });

      return { success: true, paymentId: payment.id };
    } catch (error) {
      logger.error('Add payment error:', error);
      return { success: false, error: 'Failed to add payment' };
    }
  }

  /**
   * Cancel invoice
   */
  async cancelInvoice(
    invoiceId: string,
    userId: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (invoiceError || !invoice) {
        return { success: false, error: 'Invoice not found' };
      }

      if (invoice.paid_amount > 0) {
        return { success: false, error: 'Cannot cancel invoice with payments. Process refund instead.' };
      }

      await supabase
        .from('invoices')
        .update({
          status: 'cancelled',
          notes: `${invoice.notes || ''}\n\nCancelled: ${reason}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId);

      await auditService.logUpdate(userId, 'invoices', invoiceId, 
        { status: invoice.status },
        { status: 'cancelled', reason }
      );

      return { success: true };
    } catch (error) {
      logger.error('Cancel invoice error:', error);
      return { success: false, error: 'Failed to cancel invoice' };
    }
  }

  /**
   * Get financial summary for a date range
   */
  async getFinancialSummary(startDate: string, endDate: string): Promise<{
    totalInvoiced: number;
    totalCollected: number;
    totalOutstanding: number;
    paymentsByMethod: Record<string, number>;
    invoiceCount: number;
    paymentCount: number;
  }> {
    try {
      // Get invoices in date range
      const { data: invoices } = await supabase
        .from('invoices')
        .select('total_amount, paid_amount, status')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .neq('status', 'cancelled');

      // Get payments in date range
      const { data: payments } = await supabase
        .from('payments')
        .select('amount, payment_method')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      // Calculate totals
      const totalInvoiced = invoices?.reduce((sum, inv) => sum + inv.total_amount, 0) || 0;
      const totalCollected = payments?.reduce((sum, pay) => sum + pay.amount, 0) || 0;
      const totalOutstanding = invoices?.reduce((sum, inv) => sum + (inv.total_amount - inv.paid_amount), 0) || 0;

      // Group payments by method
      const paymentsByMethod = payments?.reduce((acc, pay) => {
        acc[pay.payment_method] = (acc[pay.payment_method] || 0) + pay.amount;
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        totalInvoiced,
        totalCollected,
        totalOutstanding,
        paymentsByMethod,
        invoiceCount: invoices?.length || 0,
        paymentCount: payments?.length || 0
      };
    } catch (error) {
      logger.error('Financial summary error:', error);
      throw error;
    }
  }
}

export const invoiceService = new InvoiceService();
export default invoiceService;