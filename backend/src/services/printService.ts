// ============================================
// Print/PDF Generation Service
// ============================================

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import QRCode from 'qrcode';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';

// Extend jsPDF type for autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: AutoTableOptions) => jsPDF;
    lastAutoTable: { finalY: number };
  }
}

interface AutoTableOptions {
  startY?: number;
  head?: string[][];
  body?: (string | number)[][];
  theme?: 'striped' | 'grid' | 'plain';
  styles?: {
    fontSize?: number;
    cellPadding?: number;
    fontStyle?: string;
    fillColor?: number[];
    textColor?: number[];
  };
  headStyles?: {
    fontStyle?: string;
    fillColor?: number[];
    textColor?: number[];
  };
  columnStyles?: Record<number, {
    cellWidth?: number;
    halign?: 'left' | 'center' | 'right';
  }>;
  margin?: { left?: number; right?: number; top?: number; bottom?: number };
}

interface ReceiptData {
  receiptNumber: string;
  invoiceNumber: string;
  patientName: string;
  patientNumber: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentMethod: string;
  paymentReference?: string;
  cashier: string;
  date: string;
}

interface InvoiceItemRecord {
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface LabTestCatalogRecord {
  test_name?: string;
  category?: string;
  normal_range?: string;
  unit?: string;
  turnaround_time?: string;
}

class PrintService {
  private hospitalName = process.env.HOSPITAL_NAME || 'Kenya General Hospital';
  private hospitalAddress = process.env.HOSPITAL_ADDRESS || 'P.O. Box 12345, Nairobi, Kenya';
  private hospitalPhone = process.env.HOSPITAL_PHONE || '+254 700 123 456';
  private hospitalEmail = process.env.HOSPITAL_EMAIL || 'info@hospital.co.ke';
  private hospitalPin = process.env.HOSPITAL_TAX_PIN || 'P000000000X';

  /**
   * Generate A5 Receipt PDF (148mm x 210mm)
   */
  async generateA5Receipt(paymentId: string): Promise<string> {
    try {
      // Fetch payment with invoice and patient details
      const { data: payment, error } = await supabase
        .from('payments')
        .select(`
          *,
          invoice:invoice_id(
            *,
            patient:patient_id(patient_number, first_name, last_name, phone),
            items:invoice_items(*)
          ),
          cashier:received_by(first_name, last_name)
        `)
        .eq('id', paymentId)
        .single();

      if (error || !payment) {
        throw new Error('Payment not found');
      }

      const invoice = payment.invoice;
      const patient = invoice.patient;
      const cashier = payment.cashier;

      const receiptData: ReceiptData = {
        receiptNumber: payment.payment_number,
        invoiceNumber: invoice.invoice_number,
        patientName: `${patient.first_name} ${patient.last_name}`,
        patientNumber: patient.patient_number,
        items: invoice.items.map((item: InvoiceItemRecord) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          total: item.total_price
        })),
        subtotal: invoice.subtotal,
        tax: invoice.tax,
        discount: invoice.discount,
        totalAmount: invoice.total_amount,
        paidAmount: payment.amount,
        balanceAmount: invoice.balance_amount,
        paymentMethod: payment.payment_method,
        paymentReference: payment.payment_reference,
        cashier: cashier ? `${cashier.first_name} ${cashier.last_name}` : 'System',
        date: new Date(payment.created_at).toLocaleString('en-KE', {
          dateStyle: 'medium',
          timeStyle: 'short'
        })
      };

      return await this.createReceiptPDF(receiptData);
    } catch (error) {
      logger.error('Failed to generate receipt:', error);
      throw error;
    }
  }

  /**
   * Create the PDF document
   */
  private async createReceiptPDF(data: ReceiptData): Promise<string> {
    // A5 dimensions in mm
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [148, 210]
    });

    const pageWidth = 148;
    const margin = 10;
    let yPos = margin;

    // Header - Hospital Info
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(this.hospitalName, pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 5;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(this.hospitalAddress, pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 4;
    doc.text(`Tel: ${this.hospitalPhone} | Email: ${this.hospitalEmail}`, pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 4;
    doc.text(`PIN: ${this.hospitalPin}`, pageWidth / 2, yPos, { align: 'center' });

    // Divider
    yPos += 5;
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);

    // Receipt Title
    yPos += 7;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT RECEIPT', pageWidth / 2, yPos, { align: 'center' });

    // Receipt Details
    yPos += 8;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    const leftCol = margin;
    const rightCol = pageWidth / 2 + 5;

    doc.text(`Receipt No: ${data.receiptNumber}`, leftCol, yPos);
    doc.text(`Date: ${data.date}`, rightCol, yPos);

    yPos += 5;
    doc.text(`Invoice No: ${data.invoiceNumber}`, leftCol, yPos);
    doc.text(`Patient No: ${data.patientNumber}`, rightCol, yPos);

    yPos += 5;
    doc.text(`Patient: ${data.patientName}`, leftCol, yPos);

    // Divider
    yPos += 5;
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, pageWidth - margin, yPos);

    // Items Table
    yPos += 3;
    doc.autoTable({
      startY: yPos,
      head: [['Description', 'Qty', 'Price', 'Total']],
      body: data.items.map(item => [
        item.description,
        item.quantity.toString(),
        this.formatCurrency(item.unitPrice),
        this.formatCurrency(item.total)
      ]),
      theme: 'plain',
      styles: {
        fontSize: 8,
        cellPadding: 1
      },
      headStyles: {
        fontStyle: 'bold',
        fillColor: [240, 240, 240]
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 15, halign: 'center' },
        2: { cellWidth: 25, halign: 'right' },
        3: { cellWidth: 28, halign: 'right' }
      },
      margin: { left: margin, right: margin }
    });

    yPos = doc.lastAutoTable.finalY + 5;

    // Totals Section
    const totalsX = pageWidth - margin - 50;
    
    doc.setFontSize(8);
    doc.text('Subtotal:', totalsX, yPos);
    doc.text(this.formatCurrency(data.subtotal), pageWidth - margin, yPos, { align: 'right' });

    yPos += 4;
    doc.text('VAT (16%):', totalsX, yPos);
    doc.text(this.formatCurrency(data.tax), pageWidth - margin, yPos, { align: 'right' });

    if (data.discount > 0) {
      yPos += 4;
      doc.text('Discount:', totalsX, yPos);
      doc.text(`-${this.formatCurrency(data.discount)}`, pageWidth - margin, yPos, { align: 'right' });
    }

    yPos += 4;
    doc.setLineWidth(0.3);
    doc.line(totalsX - 5, yPos, pageWidth - margin, yPos);

    yPos += 4;
    doc.setFont('helvetica', 'bold');
    doc.text('Total:', totalsX, yPos);
    doc.text(this.formatCurrency(data.totalAmount), pageWidth - margin, yPos, { align: 'right' });

    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.text('Amount Paid:', totalsX, yPos);
    doc.text(this.formatCurrency(data.paidAmount), pageWidth - margin, yPos, { align: 'right' });

    yPos += 4;
    doc.setFont('helvetica', 'bold');
    doc.text('Balance:', totalsX, yPos);
    doc.text(this.formatCurrency(data.balanceAmount), pageWidth - margin, yPos, { align: 'right' });

    // Payment Method
    yPos += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Payment Method: ${data.paymentMethod.toUpperCase()}`, margin, yPos);
    
    if (data.paymentReference) {
      yPos += 4;
      doc.text(`Reference: ${data.paymentReference}`, margin, yPos);
    }

    yPos += 4;
    doc.text(`Cashier: ${data.cashier}`, margin, yPos);

    // QR Code for verification
    yPos += 8;
    const qrData = `${data.receiptNumber}|${data.invoiceNumber}|${data.paidAmount}|${data.date}`;
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, { width: 50, margin: 1 });
    doc.addImage(qrCodeDataUrl, 'PNG', pageWidth / 2 - 15, yPos, 30, 30);

    yPos += 35;

    // Footer
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.text('Thank you for choosing our hospital.', pageWidth / 2, yPos, { align: 'center' });
    yPos += 4;
    doc.text('This is a computer generated receipt.', pageWidth / 2, yPos, { align: 'center' });
    yPos += 4;
    doc.text('For queries, please contact our billing department.', pageWidth / 2, yPos, { align: 'center' });

    // Return base64 encoded PDF
    return doc.output('datauristring');
  }

  /**
   * Generate Lab Results PDF
   */
  async generateLabResultPDF(labTestId: string): Promise<string> {
    try {
      const { data: labTest, error } = await supabase
        .from('lab_tests')
        .select(`
          *,
          patient:patient_id(patient_number, first_name, last_name, date_of_birth, gender),
          orderedBy:ordered_by(first_name, last_name),
          completedBy:completed_by(first_name, last_name),
          catalog:test_catalog_id(test_name, category, normal_range, unit)
        `)
        .eq('id', labTestId)
        .single();

      if (error || !labTest) {
        throw new Error('Lab test not found');
      }

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = 210;
      const margin = 15;
      let yPos = margin;

      // Header
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(this.hospitalName, pageWidth / 2, yPos, { align: 'center' });

      yPos += 6;
      doc.setFontSize(12);
      doc.text('LABORATORY REPORT', pageWidth / 2, yPos, { align: 'center' });

      yPos += 10;
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);

      // Patient & Test Info
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      const patient = labTest.patient;
      const catalog = labTest.catalog as LabTestCatalogRecord | null;

      doc.text(`Patient Name: ${patient.first_name} ${patient.last_name}`, margin, yPos);
      doc.text(`Patient No: ${patient.patient_number}`, pageWidth / 2, yPos);

      yPos += 6;
      doc.text(`Date of Birth: ${new Date(patient.date_of_birth).toLocaleDateString()}`, margin, yPos);
      doc.text(`Gender: ${patient.gender}`, pageWidth / 2, yPos);

      yPos += 6;
      const testName = catalog?.test_name || labTest.test_name || 'Unknown Test';
      const testCategory = catalog?.category || 'General';
      doc.text(`Test: ${testName}`, margin, yPos);
      doc.text(`Category: ${testCategory}`, pageWidth / 2, yPos);

      yPos += 6;
      doc.text(`Sample Collected: ${labTest.sample_collected_at ? new Date(labTest.sample_collected_at).toLocaleString() : 'N/A'}`, margin, yPos);
      doc.text(`Completed: ${labTest.completed_at ? new Date(labTest.completed_at).toLocaleString() : 'Pending'}`, pageWidth / 2, yPos);

      // Results Section
      yPos += 15;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('RESULTS', margin, yPos);

      yPos += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);

      if (labTest.results) {
        const resultLines = doc.splitTextToSize(labTest.results, pageWidth - margin * 2);
        doc.text(resultLines, margin, yPos);
        yPos += resultLines.length * 6;
      } else {
        doc.text('Results pending...', margin, yPos);
        yPos += 6;
      }

      // Reference Range
      if (catalog?.normal_range) {
        yPos += 10;
        doc.setFont('helvetica', 'bold');
        doc.text('Reference Range:', margin, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(`${catalog.normal_range} ${catalog.unit || ''}`, margin + 40, yPos);
      }

      // Notes
      if (labTest.result_notes) {
        yPos += 15;
        doc.setFont('helvetica', 'bold');
        doc.text('Notes:', margin, yPos);
        yPos += 6;
        doc.setFont('helvetica', 'normal');
        const noteLines = doc.splitTextToSize(labTest.result_notes, pageWidth - margin * 2);
        doc.text(noteLines, margin, yPos);
        yPos += noteLines.length * 6;
      }

      // Signatures
      yPos += 20;
      doc.setLineWidth(0.3);
      doc.line(margin, yPos, margin + 50, yPos);
      doc.line(pageWidth / 2, yPos, pageWidth / 2 + 50, yPos);

      yPos += 5;
      doc.setFontSize(8);
      const orderedBy = labTest.orderedBy;
      const completedBy = labTest.completedBy;
      doc.text(`Ordered by: Dr. ${orderedBy?.first_name || ''} ${orderedBy?.last_name || ''}`, margin, yPos);
      doc.text(`Performed by: ${completedBy?.first_name || ''} ${completedBy?.last_name || ''}`, pageWidth / 2, yPos);

      // Footer
      yPos = 280;
      doc.setFontSize(7);
      doc.setFont('helvetica', 'italic');
      doc.text('This is a computer-generated report and does not require a signature.', pageWidth / 2, yPos, { align: 'center' });
      yPos += 4;
      doc.text(`Printed on: ${new Date().toLocaleString()}`, pageWidth / 2, yPos, { align: 'center' });

      return doc.output('datauristring');
    } catch (error) {
      logger.error('Failed to generate lab result PDF:', error);
      throw error;
    }
  }

  /**
   * Format currency to KES
   */
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Generate financial report PDF
   */
  async generateFinancialReportPDF(
    startDate: string,
    endDate: string,
    data: {
      totalInvoiced: number;
      totalCollected: number;
      totalOutstanding: number;
      paymentsByMethod: Record<string, number>;
      invoices: Array<{
        invoice_number: string;
        patient_name: string;
        total_amount: number;
        paid_amount: number;
        status: string;
        created_at: string;
      }>;
    }
  ): Promise<string> {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = 297;
    const margin = 15;
    let yPos = margin;

    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(this.hospitalName, pageWidth / 2, yPos, { align: 'center' });

    yPos += 6;
    doc.setFontSize(14);
    doc.text('FINANCIAL REPORT', pageWidth / 2, yPos, { align: 'center' });

    yPos += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Period: ${startDate} to ${endDate}`, pageWidth / 2, yPos, { align: 'center' });

    // Summary Cards
    yPos += 15;
    doc.setFillColor(36, 56, 166); // Primary blue
    doc.roundedRect(margin, yPos, 80, 25, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text('Total Invoiced', margin + 5, yPos + 8);
    doc.setFontSize(14);
    doc.text(this.formatCurrency(data.totalInvoiced), margin + 5, yPos + 18);

    doc.setFillColor(65, 160, 47); // Green
    doc.roundedRect(margin + 90, yPos, 80, 25, 3, 3, 'F');
    doc.text('Total Collected', margin + 95, yPos + 8);
    doc.setFontSize(14);
    doc.text(this.formatCurrency(data.totalCollected), margin + 95, yPos + 18);

    doc.setFillColor(232, 139, 57); // Orange
    doc.roundedRect(margin + 180, yPos, 80, 25, 3, 3, 'F');
    doc.setFontSize(9);
    doc.text('Outstanding', margin + 185, yPos + 8);
    doc.setFontSize(14);
    doc.text(this.formatCurrency(data.totalOutstanding), margin + 185, yPos + 18);

    doc.setTextColor(0, 0, 0);

    // Invoice Table
    yPos += 35;
    doc.autoTable({
      startY: yPos,
      head: [['Invoice #', 'Patient', 'Total', 'Paid', 'Balance', 'Status', 'Date']],
      body: data.invoices.map(inv => [
        inv.invoice_number,
        inv.patient_name,
        this.formatCurrency(inv.total_amount),
        this.formatCurrency(inv.paid_amount),
        this.formatCurrency(inv.total_amount - inv.paid_amount),
        inv.status.toUpperCase(),
        new Date(inv.created_at).toLocaleDateString()
      ]),
      theme: 'striped',
      styles: { fontSize: 8 },
      headStyles: {
        fillColor: [36, 56, 166],
        textColor: [255, 255, 255]
      },
      margin: { left: margin, right: margin }
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, 200, { align: 'center' });
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - margin, 200, { align: 'right' });
    }

    return doc.output('datauristring');
  }

  /**
   * Generate prescription PDF
   */
  async generatePrescriptionPDF(prescriptionId: string): Promise<string> {
    try {
      const { data: prescription, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          patient:patient_id(patient_number, first_name, last_name, date_of_birth),
          doctor:doctor_id(first_name, last_name, department),
          items:prescription_items(*)
        `)
        .eq('id', prescriptionId)
        .single();

      if (error || !prescription) {
        throw new Error('Prescription not found');
      }

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a5'
      });

      const pageWidth = 148;
      const margin = 10;
      let yPos = margin;

      // Header
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(this.hospitalName, pageWidth / 2, yPos, { align: 'center' });

      yPos += 5;
      doc.setFontSize(10);
      doc.text('PRESCRIPTION', pageWidth / 2, yPos, { align: 'center' });

      yPos += 8;
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);

      // Patient Info
      yPos += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const patient = prescription.patient;
      doc.text(`Patient: ${patient.first_name} ${patient.last_name}`, margin, yPos);
      doc.text(`No: ${patient.patient_number}`, pageWidth - margin, yPos, { align: 'right' });

      yPos += 5;
      const doctor = prescription.doctor;
      doc.text(`Doctor: Dr. ${doctor.first_name} ${doctor.last_name}`, margin, yPos);
      doc.text(`Dept: ${doctor.department || 'General'}`, pageWidth - margin, yPos, { align: 'right' });

      yPos += 5;
      doc.text(`Date: ${new Date(prescription.created_at).toLocaleDateString()}`, margin, yPos);

      // Medications
      yPos += 8;
      doc.setFont('helvetica', 'bold');
      doc.text('Rx:', margin, yPos);

      yPos += 5;
      doc.setFont('helvetica', 'normal');
      prescription.items.forEach((item: { drug_name: string; dosage: string; frequency: string; duration: string; quantity: number; instructions?: string }, index: number) => {
        doc.text(`${index + 1}. ${item.drug_name}`, margin + 5, yPos);
        yPos += 4;
        doc.setFontSize(8);
        doc.text(`   ${item.dosage} - ${item.frequency} - ${item.duration}`, margin + 5, yPos);
        yPos += 4;
        doc.text(`   Qty: ${item.quantity}${item.instructions ? ` | ${item.instructions}` : ''}`, margin + 5, yPos);
        yPos += 6;
        doc.setFontSize(9);
      });

      // Signature
      yPos += 10;
      doc.setLineWidth(0.3);
      doc.line(pageWidth - margin - 40, yPos, pageWidth - margin, yPos);
      yPos += 4;
      doc.setFontSize(8);
      doc.text("Doctor's Signature", pageWidth - margin - 20, yPos, { align: 'center' });

      return doc.output('datauristring');
    } catch (error) {
      logger.error('Failed to generate prescription PDF:', error);
      throw error;
    }
  }
}

export const printService = new PrintService();
export default printService;