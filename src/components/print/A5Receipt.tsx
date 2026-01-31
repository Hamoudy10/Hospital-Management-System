import React from 'react';
import { format } from 'date-fns';

interface ReceiptItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface ReceiptData {
  receiptNumber: string;
  invoiceNumber: string;
  date: Date;
  patientName: string;
  patientId: string;
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
  total: number;
  amountPaid: number;
  paymentMethod: string;
  transactionId?: string;
  balance: number;
  cashier: string;
}

interface A5ReceiptProps {
  data: ReceiptData;
  hospitalName?: string;
  hospitalAddress?: string;
  hospitalPhone?: string;
  hospitalEmail?: string;
  paybillNumber?: string;
}

export const A5Receipt: React.FC<A5ReceiptProps> = ({
  data,
  hospitalName = 'Kenya Hospital',
  hospitalAddress = 'Hospital Road, Nairobi, Kenya',
  hospitalPhone = '+254 20 123 4567',
  hospitalEmail = 'info@kenyahospital.co.ke',
  paybillNumber = '123456',
}) => {
  return (
    <div className="a5-receipt bg-white p-6 max-w-[148mm] mx-auto font-mono text-sm" style={{ width: '148mm', minHeight: '210mm' }}>
      {/* Header */}
      <div className="text-center border-b-2 border-black pb-4 mb-4">
        <h1 className="text-xl font-bold uppercase">{hospitalName}</h1>
        <p className="text-xs mt-1">{hospitalAddress}</p>
        <p className="text-xs">Tel: {hospitalPhone} | Email: {hospitalEmail}</p>
        <p className="text-xs mt-1">Paybill: {paybillNumber}</p>
      </div>

      {/* Receipt Title */}
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold border border-black inline-block px-4 py-1">
          OFFICIAL RECEIPT
        </h2>
      </div>

      {/* Receipt Details */}
      <div className="grid grid-cols-2 gap-x-4 mb-4 text-xs">
        <div>
          <p><span className="font-bold">Receipt No:</span> {data.receiptNumber}</p>
          <p><span className="font-bold">Invoice No:</span> {data.invoiceNumber}</p>
          <p><span className="font-bold">Date:</span> {format(data.date, 'dd/MM/yyyy HH:mm')}</p>
        </div>
        <div className="text-right">
          <p><span className="font-bold">Patient ID:</span> {data.patientId}</p>
          <p><span className="font-bold">Patient:</span> {data.patientName}</p>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full border-collapse mb-4">
        <thead>
          <tr className="border-t border-b border-black">
            <th className="text-left py-2 text-xs">Description</th>
            <th className="text-center py-2 text-xs w-12">Qty</th>
            <th className="text-right py-2 text-xs w-20">Price</th>
            <th className="text-right py-2 text-xs w-24">Amount</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, index) => (
            <tr key={index} className="border-b border-dashed border-gray-400">
              <td className="py-1 text-xs">{item.description}</td>
              <td className="text-center py-1 text-xs">{item.quantity}</td>
              <td className="text-right py-1 text-xs">{item.unitPrice.toFixed(2)}</td>
              <td className="text-right py-1 text-xs">{item.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="border-t border-black pt-2 mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span>Subtotal:</span>
          <span>KES {data.subtotal.toFixed(2)}</span>
        </div>
        {data.discount > 0 && (
          <div className="flex justify-between text-xs mb-1">
            <span>Discount:</span>
            <span>- KES {data.discount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold border-t border-black pt-1 mb-2">
          <span>TOTAL:</span>
          <span>KES {data.total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs mb-1">
          <span>Amount Paid:</span>
          <span>KES {data.amountPaid.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs font-bold">
          <span>Balance:</span>
          <span>KES {data.balance.toFixed(2)}</span>
        </div>
      </div>

      {/* Payment Info */}
      <div className="border border-black p-2 mb-4 text-xs">
        <div className="flex justify-between mb-1">
          <span className="font-bold">Payment Method:</span>
          <span>{data.paymentMethod}</span>
        </div>
        {data.transactionId && (
          <div className="flex justify-between">
            <span className="font-bold">Transaction ID:</span>
            <span>{data.transactionId}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-xs border-t border-black pt-4">
        <p className="mb-2">Served by: {data.cashier}</p>
        <p className="font-bold mb-2">Thank you for choosing {hospitalName}</p>
        <p className="text-[10px] text-gray-600">
          This is a computer-generated receipt and does not require a signature.
        </p>
        <p className="text-[10px] text-gray-600 mt-1">
          For inquiries, please contact us at {hospitalPhone}
        </p>
      </div>

      {/* ETR Info (Kenya Revenue Authority compliance) */}
      <div className="mt-4 pt-4 border-t border-dashed border-gray-400 text-center text-[10px]">
        <p className="font-bold">ETR COMPLIANCE</p>
        <p>Control Unit: CU-001234567</p>
        <p>Serial: {data.receiptNumber}</p>
        <div className="mt-2 flex justify-center">
          {/* QR Code placeholder - in production would use actual QR code */}
          <div className="w-16 h-16 border border-black flex items-center justify-center text-[8px]">
            QR CODE
          </div>
        </div>
      </div>
    </div>
  );
};

// Wrapper component for printing
export const PrintableReceipt: React.FC<A5ReceiptProps> = (props) => {
  return (
    <div className="print-container">
      <style>
        {`
          @media print {
            @page {
              size: A5 portrait;
              margin: 10mm;
            }
            body * {
              visibility: hidden;
            }
            .print-container, .print-container * {
              visibility: visible;
            }
            .print-container {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .a5-receipt {
              page-break-after: always;
            }
          }
        `}
      </style>
      <A5Receipt {...props} />
    </div>
  );
};

export default A5Receipt;