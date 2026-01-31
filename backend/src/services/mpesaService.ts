// ============================================
// M-Pesa Integration Service (Daraja API)
// ============================================

import axios from 'axios';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import { MpesaC2BPayload } from '../types';

const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY || '';
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || '';
const MPESA_PASSKEY = process.env.MPESA_PASSKEY || '';
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE || '';
const MPESA_CALLBACK_URL = process.env.MPESA_CALLBACK_URL || '';
const MPESA_ENV = process.env.MPESA_ENV || 'sandbox';

const BASE_URL = MPESA_ENV === 'production'
  ? 'https://api.safaricom.co.ke'
  : 'https://sandbox.safaricom.co.ke';

class MpesaService {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  /**
   * Get OAuth access token from Safaricom
   */
  async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');

      const response = await axios.get(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
        headers: {
          Authorization: `Basic ${auth}`
        }
      });

      this.accessToken = response.data.access_token;
      // Token expires in 3599 seconds, refresh 5 minutes early
      this.tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;

      return this.accessToken;
    } catch (error) {
      logger.error('Failed to get M-Pesa access token:', error);
      throw new Error('Failed to authenticate with M-Pesa');
    }
  }

  /**
   * Generate timestamp for M-Pesa requests
   */
  private generateTimestamp(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  /**
   * Generate password for STK Push
   */
  private generatePassword(timestamp: string): string {
    const data = `${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`;
    return Buffer.from(data).toString('base64');
  }

  /**
   * Format phone number to Safaricom format (254...)
   */
  formatPhoneNumber(phone: string): string {
    // Remove any spaces, dashes, or other characters
    let cleaned = phone.replace(/\D/g, '');

    // Handle different formats
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.substring(1);
    } else if (cleaned.startsWith('+254')) {
      cleaned = cleaned.substring(1);
    } else if (!cleaned.startsWith('254')) {
      cleaned = '254' + cleaned;
    }

    return cleaned;
  }

  /**
   * Initiate STK Push (Lipa Na M-Pesa Online)
   */
  async initiateSTKPush(params: {
    phoneNumber: string;
    amount: number;
    accountReference: string;
    transactionDesc?: string;
  }): Promise<{
    success: boolean;
    checkoutRequestId?: string;
    merchantRequestId?: string;
    responseCode?: string;
    responseDescription?: string;
    customerMessage?: string;
    error?: string;
  }> {
    try {
      const accessToken = await this.getAccessToken();
      const timestamp = this.generateTimestamp();
      const password = this.generatePassword(timestamp);
      const phoneNumber = this.formatPhoneNumber(params.phoneNumber);

      const response = await axios.post(
        `${BASE_URL}/mpesa/stkpush/v1/processrequest`,
        {
          BusinessShortCode: MPESA_SHORTCODE,
          Password: password,
          Timestamp: timestamp,
          TransactionType: 'CustomerPayBillOnline',
          Amount: Math.round(params.amount),
          PartyA: phoneNumber,
          PartyB: MPESA_SHORTCODE,
          PhoneNumber: phoneNumber,
          CallBackURL: `${MPESA_CALLBACK_URL}/stk-callback`,
          AccountReference: params.accountReference,
          TransactionDesc: params.transactionDesc || 'Hospital Payment'
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.ResponseCode === '0') {
        // Store STK push request in database
        await supabase.from('mpesa_stk_requests').insert({
          checkout_request_id: response.data.CheckoutRequestID,
          merchant_request_id: response.data.MerchantRequestID,
          phone_number: phoneNumber,
          amount: params.amount,
          account_reference: params.accountReference,
          status: 'pending',
          created_at: new Date().toISOString()
        });

        return {
          success: true,
          checkoutRequestId: response.data.CheckoutRequestID,
          merchantRequestId: response.data.MerchantRequestID,
          responseCode: response.data.ResponseCode,
          responseDescription: response.data.ResponseDescription,
          customerMessage: response.data.CustomerMessage
        };
      }

      return {
        success: false,
        responseCode: response.data.ResponseCode,
        responseDescription: response.data.ResponseDescription,
        error: response.data.errorMessage || 'STK Push failed'
      };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { errorMessage?: string } } };
      logger.error('STK Push error:', error);
      return {
        success: false,
        error: axiosError?.response?.data?.errorMessage || 'Failed to initiate payment'
      };
    }
  }

  /**
   * Query STK Push status
   */
  async querySTKPushStatus(checkoutRequestId: string): Promise<{
    success: boolean;
    resultCode?: string;
    resultDesc?: string;
  }> {
    try {
      const accessToken = await this.getAccessToken();
      const timestamp = this.generateTimestamp();
      const password = this.generatePassword(timestamp);

      const response = await axios.post(
        `${BASE_URL}/mpesa/stkpushquery/v1/query`,
        {
          BusinessShortCode: MPESA_SHORTCODE,
          Password: password,
          Timestamp: timestamp,
          CheckoutRequestID: checkoutRequestId
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: response.data.ResultCode === '0',
        resultCode: response.data.ResultCode,
        resultDesc: response.data.ResultDesc
      };
    } catch (error) {
      logger.error('STK Query error:', error);
      return {
        success: false,
        resultDesc: 'Failed to query payment status'
      };
    }
  }

  /**
   * Process C2B (Customer to Business) callback
   */
  async processC2BCallback(payload: MpesaC2BPayload): Promise<{
    success: boolean;
    transactionId?: string;
    error?: string;
  }> {
    try {
      // Check for duplicate transaction
      const { data: existing } = await supabase
        .from('mpesa_transactions')
        .select('id')
        .eq('transaction_id', payload.TransID)
        .single();

      if (existing) {
        logger.warn(`Duplicate M-Pesa transaction: ${payload.TransID}`);
        return {
          success: true,
          transactionId: existing.id,
          error: 'Transaction already processed'
        };
      }

      // Insert transaction record
      const { data: transaction, error: insertError } = await supabase
        .from('mpesa_transactions')
        .insert({
          transaction_id: payload.TransID,
          transaction_type: payload.TransactionType,
          transaction_time: payload.TransTime,
          amount: parseFloat(payload.TransAmount),
          business_short_code: payload.BusinessShortCode,
          bill_ref_number: payload.BillRefNumber,
          invoice_number: payload.InvoiceNumber,
          org_account_balance: payload.OrgAccountBalance ? parseFloat(payload.OrgAccountBalance) : null,
          third_party_trans_id: payload.ThirdPartyTransID,
          msisdn: payload.MSISDN,
          first_name: payload.FirstName,
          middle_name: payload.MiddleName,
          last_name: payload.LastName,
          raw_payload: payload,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        logger.error('Failed to insert M-Pesa transaction:', insertError);
        return {
          success: false,
          error: 'Failed to record transaction'
        };
      }

      // Try to auto-allocate to invoice based on BillRefNumber
      await this.allocatePayment(transaction.id, payload.BillRefNumber, parseFloat(payload.TransAmount));

      return {
        success: true,
        transactionId: transaction.id
      };
    } catch (error) {
      logger.error('C2B callback processing error:', error);
      return {
        success: false,
        error: 'Failed to process callback'
      };
    }
  }

  /**
   * Allocate M-Pesa payment to invoice
   */
  async allocatePayment(
    mpesaTransactionId: string,
    billRefNumber: string,
    amount: number
  ): Promise<boolean> {
    try {
      // Find invoice by number (billRefNumber should be invoice number)
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('invoice_number', billRefNumber)
        .single();

      if (invoiceError || !invoice) {
        logger.warn(`No invoice found for BillRefNumber: ${billRefNumber}`);
        return false;
      }

      // Create payment record
      const paymentNumber = `PAY-${Date.now()}`;
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          invoice_id: invoice.id,
          payment_number: paymentNumber,
          amount: amount,
          payment_method: 'mpesa',
          mpesa_transaction_id: mpesaTransactionId,
          received_by: 'SYSTEM',
          notes: 'Auto-allocated from M-Pesa payment',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (paymentError) {
        logger.error('Failed to create payment record:', paymentError);
        return false;
      }

      // Update invoice amounts
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
        .eq('id', invoice.id);

      // Update M-Pesa transaction status
      await supabase
        .from('mpesa_transactions')
        .update({
          status: 'allocated',
          allocated_to_invoice_id: invoice.id,
          allocated_at: new Date().toISOString()
        })
        .eq('id', mpesaTransactionId);

      logger.info(`Payment allocated: ${amount} to invoice ${invoice.invoice_number}`);
      return true;
    } catch (error) {
      logger.error('Payment allocation error:', error);
      return false;
    }
  }

  /**
   * Manually allocate unallocated M-Pesa transaction
   */
  async manualAllocate(
    mpesaTransactionId: string,
    invoiceId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get M-Pesa transaction
      const { data: mpesaTx, error: txError } = await supabase
        .from('mpesa_transactions')
        .select('*')
        .eq('id', mpesaTransactionId)
        .single();

      if (txError || !mpesaTx) {
        return { success: false, error: 'Transaction not found' };
      }

      if (mpesaTx.status === 'allocated') {
        return { success: false, error: 'Transaction already allocated' };
      }

      // Get invoice
      const { data: invoice, error: invError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (invError || !invoice) {
        return { success: false, error: 'Invoice not found' };
      }

      // Create payment
      const paymentNumber = `PAY-${Date.now()}`;
      await supabase.from('payments').insert({
        invoice_id: invoiceId,
        payment_number: paymentNumber,
        amount: mpesaTx.amount,
        payment_method: 'mpesa',
        mpesa_transaction_id: mpesaTransactionId,
        received_by: userId,
        notes: 'Manually allocated M-Pesa payment',
        created_at: new Date().toISOString()
      });

      // Update invoice
      const newPaidAmount = (invoice.paid_amount || 0) + mpesaTx.amount;
      const newBalanceAmount = invoice.total_amount - newPaidAmount;

      await supabase
        .from('invoices')
        .update({
          paid_amount: newPaidAmount,
          balance_amount: Math.max(0, newBalanceAmount),
          status: newBalanceAmount <= 0 ? 'paid' : 'partially_paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId);

      // Update M-Pesa transaction
      await supabase
        .from('mpesa_transactions')
        .update({
          status: 'allocated',
          allocated_to_invoice_id: invoiceId,
          allocated_at: new Date().toISOString()
        })
        .eq('id', mpesaTransactionId);

      return { success: true };
    } catch (error) {
      logger.error('Manual allocation error:', error);
      return { success: false, error: 'Failed to allocate payment' };
    }
  }

  /**
   * Get unallocated M-Pesa transactions
   */
  async getUnallocatedTransactions(page: number = 1, limit: number = 20) {
    try {
      const offset = (page - 1) * limit;

      const { data, error, count } = await supabase
        .from('mpesa_transactions')
        .select('*', { count: 'exact' })
        .eq('status', 'pending')
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
      logger.error('Failed to get unallocated transactions:', error);
      throw error;
    }
  }

  /**
   * Register C2B URLs with Safaricom
   */
  async registerC2BUrls(): Promise<{ success: boolean; error?: string }> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await axios.post(
        `${BASE_URL}/mpesa/c2b/v1/registerurl`,
        {
          ShortCode: MPESA_SHORTCODE,
          ResponseType: 'Completed',
          ConfirmationURL: `${MPESA_CALLBACK_URL}/c2b-confirm`,
          ValidationURL: `${MPESA_CALLBACK_URL}/c2b-validate`
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.ResponseCode === '0') {
        return { success: true };
      }

      return {
        success: false,
        error: response.data.ResponseDescription
      };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { errorMessage?: string } } };
      logger.error('C2B URL registration error:', error);
      return {
        success: false,
        error: axiosError?.response?.data?.errorMessage || 'Failed to register C2B URLs'
      };
    }
  }
}

export const mpesaService = new MpesaService();
export default mpesaService;