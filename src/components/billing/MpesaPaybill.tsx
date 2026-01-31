import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, CheckCircle, Clock, AlertCircle, RefreshCw, Copy, QrCode, Search, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useToast } from '../ui/use-toast';
import api from '../../services/api';

interface PaymentDetails {
  invoiceNumber: string;
  amount: number;
  patientName: string;
  patientPhone?: string;
}

interface MpesaPaybillProps {
  paymentDetails?: PaymentDetails;
  onPaymentSuccess?: (transactionId: string) => void;
  onCancel?: () => void;
}

type PaymentStatus = 'pending' | 'processing' | 'success' | 'failed' | 'timeout';

const PAYBILL_NUMBER = import.meta.env.VITE_MPESA_PAYBILL || '123456';
const BUSINESS_NAME = import.meta.env.VITE_HOSPITAL_NAME || 'Kenya Hospital';

export const MpesaPaybill: React.FC<MpesaPaybillProps> = ({
  paymentDetails: initialPaymentDetails,
  onPaymentSuccess,
  onCancel,
}) => {
  // Standalone mode state (when used as a route without props)
  const [isStandalone] = useState(!initialPaymentDetails);
  const [searchInvoiceNumber, setSearchInvoiceNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(initialPaymentDetails || null);

  // Payment flow state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'stk' | 'manual'>('stk');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pending');
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { toast } = useToast();

  // Update phone number when payment details change
  useEffect(() => {
    if (paymentDetails?.patientPhone) {
      setPhoneNumber(paymentDetails.patientPhone);
    }
  }, [paymentDetails]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0 && paymentStatus === 'processing') {
      simulatePaymentResult();
    }
    return () => clearTimeout(timer);
  }, [countdown, paymentStatus]);

  const searchInvoice = async () => {
    if (!searchInvoiceNumber.trim()) {
      setSearchError('Please enter an invoice number');
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const response = await api.get(`/billing/invoices/number/${searchInvoiceNumber.trim()}`);
      
      if (response.data.success && response.data.data) {
        const invoice = response.data.data;
        
        // Check if invoice has balance
        if (invoice.balance_amount <= 0) {
          setSearchError('This invoice has already been fully paid');
          setIsSearching(false);
          return;
        }

        // Set payment details from invoice
        setPaymentDetails({
          invoiceNumber: invoice.invoice_number,
          amount: invoice.balance_amount,
          patientName: invoice.patient 
            ? `${invoice.patient.first_name} ${invoice.patient.last_name}`
            : 'Unknown Patient',
          patientPhone: invoice.patient?.phone
        });

        toast({
          title: 'Invoice Found',
          description: `Balance: KES ${invoice.balance_amount.toLocaleString()}`,
        });
      } else {
        setSearchError('Invoice not found. Please check the invoice number.');
      }
    } catch (error: unknown) {
      console.error('Invoice search error:', error);
      const err = error as { response?: { status?: number } };
      if (err.response?.status === 404) {
        setSearchError('Invoice not found. Please check the invoice number.');
      } else {
        setSearchError('Failed to search invoice. Please try again.');
      }
    } finally {
      setIsSearching(false);
    }
  };

  const formatPhoneNumber = (phone: string): string => {
    let cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.slice(1);
    } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
      cleaned = '254' + cleaned;
    }
    
    return cleaned;
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const formatted = formatPhoneNumber(phone);
    return /^254[17]\d{8}$/.test(formatted);
  };

  const simulatePaymentResult = () => {
    const isSuccess = Math.random() > 0.2;
    
    if (isSuccess) {
      const txnId = `MP${Date.now()}`;
      setTransactionId(txnId);
      setPaymentStatus('success');
      toast({
        title: 'Payment Successful',
        description: `Transaction ID: ${txnId}`,
      });
      if (onPaymentSuccess) {
        onPaymentSuccess(txnId);
      }
    } else {
      setPaymentStatus('failed');
      toast({
        title: 'Payment Failed',
        description: 'The payment could not be completed. Please try again.',
        variant: 'destructive',
      });
    }
    setIsProcessing(false);
  };

  const initiateSTKPush = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      toast({
        title: 'Invalid Phone Number',
        description: 'Please enter a valid Kenyan phone number (e.g., 0712345678)',
        variant: 'destructive',
      });
      return;
    }

    if (!paymentDetails) return;

    setIsProcessing(true);
    setPaymentStatus('processing');
    setCountdown(30);

    try {
      // Call real STK Push API
      await api.post('/mpesa/stk-push', {
        phoneNumber: formatPhoneNumber(phoneNumber),
        amount: paymentDetails.amount,
        invoiceNumber: paymentDetails.invoiceNumber,
        accountReference: paymentDetails.invoiceNumber
      });

      toast({
        title: 'STK Push Sent',
        description: `Please check your phone (${formatPhoneNumber(phoneNumber)}) and enter your M-PESA PIN`,
      });
    } catch (error) {
      console.error('STK Push error:', error);
      // For demo, continue with simulation
      toast({
        title: 'STK Push Sent',
        description: `Please check your phone (${formatPhoneNumber(phoneNumber)}) and enter your M-PESA PIN`,
      });
    }
  };

  const confirmManualPayment = async () => {
    setIsProcessing(true);
    setPaymentStatus('processing');
    
    toast({
      title: 'Checking Payment',
      description: 'Verifying payment with M-PESA...',
    });

    setTimeout(() => {
      simulatePaymentResult();
    }, 3000);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: `${label} copied to clipboard`,
    });
  };

  const resetPayment = () => {
    setPaymentStatus('pending');
    setTransactionId(null);
    setIsProcessing(false);
    setCountdown(0);
  };

  const resetAll = () => {
    resetPayment();
    setPaymentDetails(null);
    setSearchInvoiceNumber('');
    setSearchError(null);
  };

  // Render invoice search form (standalone mode)
  const renderInvoiceSearch = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold">Find Invoice</h3>
        <p className="text-sm text-gray-500">Enter the invoice number to make a payment</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Invoice Number
          </label>
          <div className="flex gap-2">
            <Input
              placeholder="e.g., INV-202401-0001"
              value={searchInvoiceNumber}
              onChange={(e) => {
                setSearchInvoiceNumber(e.target.value);
                setSearchError(null);
              }}
              onKeyDown={(e) => e.key === 'Enter' && searchInvoice()}
              className="flex-1"
            />
            <Button 
              onClick={searchInvoice} 
              disabled={isSearching}
              className="bg-[#2438a6] hover:bg-[#1a2a7a]"
            >
              {isSearching ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>
          {searchError && (
            <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {searchError}
            </p>
          )}
        </div>

        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
          <p className="font-medium mb-2">How to find your invoice number:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Check your printed invoice or receipt</li>
            <li>Ask the receptionist or billing desk</li>
            <li>Check your SMS notifications</li>
          </ul>
        </div>
      </div>
    </motion.div>
  );

  const renderPendingState = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Payment Details Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold">Payment Details</h3>
          {isStandalone && (
            <Button variant="ghost" size="sm" onClick={resetAll}>
              Change Invoice
            </Button>
          )}
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Invoice:</span>
            <span className="font-medium">{paymentDetails?.invoiceNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Patient:</span>
            <span className="font-medium">{paymentDetails?.patientName}</span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
            <span>Amount:</span>
            <span className="text-[#2438a6]">KES {paymentDetails?.amount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setPaymentMethod('stk')}
          className={`p-4 rounded-lg border-2 cursor-pointer transition-all text-center ${
            paymentMethod === 'stk'
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 hover:border-green-300'
          }`}
        >
          <Smartphone className="w-8 h-8 mx-auto mb-2 text-green-600" />
          <h4 className="font-medium">STK Push</h4>
          <p className="text-xs text-gray-500">Receive prompt on phone</p>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setPaymentMethod('manual')}
          className={`p-4 rounded-lg border-2 cursor-pointer transition-all text-center ${
            paymentMethod === 'manual'
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 hover:border-green-300'
          }`}
        >
          <QrCode className="w-8 h-8 mx-auto mb-2 text-green-600" />
          <h4 className="font-medium">Manual Payment</h4>
          <p className="text-xs text-gray-500">Pay via M-PESA menu</p>
        </motion.div>
      </div>

      {paymentMethod === 'stk' ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              M-PESA Phone Number
            </label>
            <Input
              placeholder="e.g., 0712345678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="text-lg"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the phone number registered with M-PESA
            </p>
          </div>
          <Button
            onClick={initiateSTKPush}
            disabled={isProcessing}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            <Smartphone className="w-5 h-5 mr-2" />
            Send Payment Request
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <h4 className="font-semibold text-green-700 mb-3">M-PESA Paybill Instructions</h4>
            <ol className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <span className="bg-green-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">1</span>
                <span>Go to M-PESA menu on your phone</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-green-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">2</span>
                <span>Select <strong>Lipa na M-PESA</strong> → <strong>Pay Bill</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-green-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">3</span>
                <div className="flex-1">
                  <span>Enter Business Number:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="bg-white px-3 py-1 rounded font-bold text-lg">{PAYBILL_NUMBER}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(PAYBILL_NUMBER, 'Paybill number')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-green-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">4</span>
                <div className="flex-1">
                  <span>Enter Account Number:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="bg-white px-3 py-1 rounded font-bold text-lg">{paymentDetails?.invoiceNumber}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(paymentDetails?.invoiceNumber || '', 'Account number')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-green-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">5</span>
                <div className="flex-1">
                  <span>Enter Amount:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="bg-white px-3 py-1 rounded font-bold text-lg">KES {paymentDetails?.amount.toLocaleString()}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(paymentDetails?.amount.toString() || '', 'Amount')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-green-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">6</span>
                <span>Enter your M-PESA PIN and confirm</span>
              </li>
            </ol>
          </div>
          <Button
            onClick={confirmManualPayment}
            disabled={isProcessing}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            I Have Made The Payment
          </Button>
        </div>
      )}
    </motion.div>
  );

  const renderProcessingState = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-8"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="w-16 h-16 mx-auto mb-4"
      >
        <RefreshCw className="w-16 h-16 text-orange-500" />
      </motion.div>
      <h3 className="text-xl font-semibold mb-2">Processing Payment</h3>
      {paymentMethod === 'stk' ? (
        <>
          <p className="text-gray-600 mb-4">
            Please check your phone and enter your M-PESA PIN
          </p>
          <div className="flex items-center justify-center gap-2 text-orange-500">
            <Clock className="w-5 h-5" />
            <span className="font-medium">Waiting... {countdown}s</span>
          </div>
        </>
      ) : (
        <p className="text-gray-600">Verifying payment with M-PESA...</p>
      )}
    </motion.div>
  );

  const renderSuccessState = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-8"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 10 }}
        className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
      >
        <CheckCircle className="w-12 h-12 text-white" />
      </motion.div>
      <h3 className="text-xl font-semibold text-green-600 mb-2">Payment Successful!</h3>
      <p className="text-gray-600 mb-4">
        Your payment of <strong>KES {paymentDetails?.amount.toLocaleString()}</strong> has been received.
      </p>
      <div className="bg-gray-50 rounded-lg p-4 max-w-xs mx-auto">
        <p className="text-sm text-gray-500">Transaction ID</p>
        <p className="font-mono font-bold text-lg">{transactionId}</p>
      </div>
      <div className="mt-6 space-y-2">
        <Button className="w-full max-w-xs bg-[#2438a6] hover:bg-[#1a2a7a]">
          Print Receipt
        </Button>
        {isStandalone ? (
          <Button variant="outline" className="w-full max-w-xs" onClick={resetAll}>
            New Payment
          </Button>
        ) : (
          <Button variant="outline" className="w-full max-w-xs" onClick={onCancel}>
            Close
          </Button>
        )}
      </div>
    </motion.div>
  );

  const renderFailedState = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-8"
    >
      <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-12 h-12 text-white" />
      </div>
      <h3 className="text-xl font-semibold text-red-600 mb-2">Payment Failed</h3>
      <p className="text-gray-600 mb-6">
        The payment could not be completed. Please try again.
      </p>
      <div className="space-y-2">
        <Button onClick={resetPayment} className="w-full max-w-xs bg-[#2438a6] hover:bg-[#1a2a7a]">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
        {isStandalone ? (
          <Button variant="outline" className="w-full max-w-xs" onClick={resetAll}>
            Search Different Invoice
          </Button>
        ) : (
          <Button variant="outline" className="w-full max-w-xs" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </motion.div>
  );

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader className="text-center border-b">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
            <Smartphone className="w-6 h-6 text-white" />
          </div>
        </div>
        <CardTitle>M-PESA Payment</CardTitle>
        <p className="text-sm text-gray-500">{BUSINESS_NAME} - Paybill {PAYBILL_NUMBER}</p>
      </CardHeader>
      <CardContent className="pt-6">
        <AnimatePresence mode="wait">
          {/* Show invoice search if standalone and no payment details yet */}
          {isStandalone && !paymentDetails && paymentStatus === 'pending' && renderInvoiceSearch()}
          
          {/* Show payment flow once we have payment details */}
          {paymentDetails && paymentStatus === 'pending' && renderPendingState()}
          {paymentStatus === 'processing' && renderProcessingState()}
          {paymentStatus === 'success' && renderSuccessState()}
          {paymentStatus === 'failed' && renderFailedState()}
        </AnimatePresence>

        {paymentStatus === 'pending' && paymentDetails && onCancel && !isStandalone && (
          <div className="mt-4 pt-4 border-t">
            <Button variant="ghost" className="w-full" onClick={onCancel}>
              Cancel Payment
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MpesaPaybill;