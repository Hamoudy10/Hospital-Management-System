// Print Service for A5 Receipts, Medical Reports, and Lab Results
// Supports thermal printer formats and PDF generation

export interface ReceiptData {
  receiptNumber: string;
  date: string;
  patientName: string;
  patientId: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  subtotal: number;
  tax?: number;
  discount?: number;
  total: number;
  amountPaid: number;
  balance: number;
  paymentMethod: string;
  transactionId?: string;
  cashier: string;
  hospitalName: string;
  hospitalAddress: string;
  hospitalPhone: string;
  hospitalEmail?: string;
}

export interface LabReportData {
  reportNumber: string;
  date: string;
  patientName: string;
  patientId: string;
  patientAge: number;
  patientGender: string;
  referringDoctor: string;
  tests: {
    testName: string;
    result: string;
    unit: string;
    referenceRange: string;
    status: 'normal' | 'abnormal' | 'critical';
  }[];
  technician: string;
  verifiedBy: string;
  notes?: string;
}

export interface MedicalReportData {
  reportNumber: string;
  date: string;
  patientName: string;
  patientId: string;
  patientAge: number;
  patientGender: string;
  diagnosis: string;
  symptoms: string[];
  findings: string;
  treatment: string;
  prescriptions: {
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
  }[];
  followUp?: string;
  doctor: string;
  department: string;
}

class PrintService {
  private hospitalConfig = {
    name: 'Kenya Hospital',
    address: 'P.O. Box 12345, Nairobi, Kenya',
    phone: '+254 700 123 456',
    email: 'info@kenyahospital.co.ke',
    paybill: '123456',
    logo: '/logo.png',
  };

  // Generate A5 Receipt HTML
  generateA5Receipt(data: ReceiptData): string {
    const formatCurrency = (amount: number) => `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Receipt - ${data.receiptNumber}</title>
        <style>
          @page {
            size: A5;
            margin: 10mm;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Courier New', monospace;
            font-size: 11px;
            line-height: 1.4;
            color: #000;
          }
          .receipt {
            width: 100%;
            max-width: 148mm;
            margin: 0 auto;
            padding: 5mm;
          }
          .header {
            text-align: center;
            border-bottom: 2px dashed #000;
            padding-bottom: 10px;
            margin-bottom: 10px;
          }
          .hospital-name {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .hospital-info {
            font-size: 10px;
          }
          .receipt-title {
            font-size: 14px;
            font-weight: bold;
            text-align: center;
            margin: 10px 0;
            padding: 5px;
            background: #f0f0f0;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
          }
          .section {
            margin: 10px 0;
            padding-bottom: 10px;
            border-bottom: 1px dashed #000;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
          }
          .items-table th,
          .items-table td {
            text-align: left;
            padding: 3px 2px;
            font-size: 10px;
          }
          .items-table th {
            border-bottom: 1px solid #000;
            font-weight: bold;
          }
          .items-table .amount {
            text-align: right;
          }
          .totals {
            margin-top: 10px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 2px 0;
          }
          .total-row.grand-total {
            font-size: 14px;
            font-weight: bold;
            border-top: 2px solid #000;
            padding-top: 5px;
            margin-top: 5px;
          }
          .payment-info {
            background: #f0f0f0;
            padding: 8px;
            margin: 10px 0;
            text-align: center;
          }
          .footer {
            text-align: center;
            margin-top: 15px;
            font-size: 10px;
          }
          .barcode {
            text-align: center;
            margin: 10px 0;
            font-family: 'Libre Barcode 39', cursive;
            font-size: 30px;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="hospital-name">${data.hospitalName}</div>
            <div class="hospital-info">${data.hospitalAddress}</div>
            <div class="hospital-info">Tel: ${data.hospitalPhone}</div>
            ${data.hospitalEmail ? `<div class="hospital-info">Email: ${data.hospitalEmail}</div>` : ''}
          </div>
          
          <div class="receipt-title">PAYMENT RECEIPT</div>
          
          <div class="section">
            <div class="info-row">
              <span>Receipt No:</span>
              <span>${data.receiptNumber}</span>
            </div>
            <div class="info-row">
              <span>Date:</span>
              <span>${data.date}</span>
            </div>
            <div class="info-row">
              <span>Patient:</span>
              <span>${data.patientName}</span>
            </div>
            <div class="info-row">
              <span>Patient ID:</span>
              <span>${data.patientId}</span>
            </div>
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Qty</th>
                <th class="amount">Price</th>
                <th class="amount">Total</th>
              </tr>
            </thead>
            <tbody>
              ${data.items.map(item => `
                <tr>
                  <td>${item.description}</td>
                  <td>${item.quantity}</td>
                  <td class="amount">${formatCurrency(item.unitPrice)}</td>
                  <td class="amount">${formatCurrency(item.total)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="totals">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>${formatCurrency(data.subtotal)}</span>
            </div>
            ${data.tax ? `
              <div class="total-row">
                <span>Tax:</span>
                <span>${formatCurrency(data.tax)}</span>
              </div>
            ` : ''}
            ${data.discount ? `
              <div class="total-row">
                <span>Discount:</span>
                <span>-${formatCurrency(data.discount)}</span>
              </div>
            ` : ''}
            <div class="total-row grand-total">
              <span>TOTAL:</span>
              <span>${formatCurrency(data.total)}</span>
            </div>
            <div class="total-row">
              <span>Amount Paid:</span>
              <span>${formatCurrency(data.amountPaid)}</span>
            </div>
            <div class="total-row">
              <span>Balance:</span>
              <span>${formatCurrency(data.balance)}</span>
            </div>
          </div>
          
          <div class="payment-info">
            <strong>Payment Method: ${data.paymentMethod}</strong>
            ${data.transactionId ? `<br>Transaction ID: ${data.transactionId}` : ''}
          </div>
          
          <div class="section">
            <div class="info-row">
              <span>Served by:</span>
              <span>${data.cashier}</span>
            </div>
          </div>
          
          <div class="barcode">*${data.receiptNumber}*</div>
          
          <div class="footer">
            <p>Thank you for choosing ${data.hospitalName}</p>
            <p>This is a computer-generated receipt</p>
            <p>Paybill: ${this.hospitalConfig.paybill}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Generate Lab Report HTML
  generateLabReport(data: LabReportData): string {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'normal': return '#41a02f';
        case 'abnormal': return '#e88b39';
        case 'critical': return '#9b162d';
        default: return '#000';
      }
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Lab Report - ${data.reportNumber}</title>
        <style>
          @page {
            size: A4;
            margin: 15mm;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.5;
            color: #333;
          }
          .report {
            max-width: 210mm;
            margin: 0 auto;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 3px solid #2438a6;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .hospital-info h1 {
            color: #2438a6;
            font-size: 24px;
          }
          .report-title {
            background: #2438a6;
            color: white;
            padding: 10px 20px;
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            margin: 20px 0;
          }
          .patient-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            background: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
          }
          .info-item {
            display: flex;
            gap: 10px;
          }
          .info-label {
            font-weight: bold;
            color: #666;
            min-width: 120px;
          }
          .results-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          .results-table th {
            background: #2438a6;
            color: white;
            padding: 12px 10px;
            text-align: left;
          }
          .results-table td {
            padding: 10px;
            border-bottom: 1px solid #ddd;
          }
          .results-table tr:nth-child(even) {
            background: #f9f9f9;
          }
          .status-badge {
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
          }
          .signature-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 50px;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
          }
          .signature-box {
            text-align: center;
          }
          .signature-line {
            border-top: 1px solid #000;
            margin-top: 50px;
            padding-top: 5px;
          }
          .notes {
            background: #fff3cd;
            border: 1px solid #ffc107;
            padding: 15px;
            border-radius: 5px;
            margin-top: 20px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 10px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="report">
          <div class="header">
            <div class="hospital-info">
              <h1>${this.hospitalConfig.name}</h1>
              <p>${this.hospitalConfig.address}</p>
              <p>Tel: ${this.hospitalConfig.phone} | Email: ${this.hospitalConfig.email}</p>
            </div>
            <div class="report-info">
              <p><strong>Report No:</strong> ${data.reportNumber}</p>
              <p><strong>Date:</strong> ${data.date}</p>
            </div>
          </div>
          
          <div class="report-title">LABORATORY TEST REPORT</div>
          
          <div class="patient-info">
            <div class="info-item">
              <span class="info-label">Patient Name:</span>
              <span>${data.patientName}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Patient ID:</span>
              <span>${data.patientId}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Age:</span>
              <span>${data.patientAge} years</span>
            </div>
            <div class="info-item">
              <span class="info-label">Gender:</span>
              <span>${data.patientGender}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Referring Doctor:</span>
              <span>${data.referringDoctor}</span>
            </div>
          </div>
          
          <table class="results-table">
            <thead>
              <tr>
                <th>Test Name</th>
                <th>Result</th>
                <th>Unit</th>
                <th>Reference Range</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${data.tests.map(test => `
                <tr>
                  <td>${test.testName}</td>
                  <td><strong>${test.result}</strong></td>
                  <td>${test.unit}</td>
                  <td>${test.referenceRange}</td>
                  <td>
                    <span class="status-badge" style="background: ${getStatusColor(test.status)}20; color: ${getStatusColor(test.status)}">
                      ${test.status}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          ${data.notes ? `
            <div class="notes">
              <strong>Notes:</strong> ${data.notes}
            </div>
          ` : ''}
          
          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line">
                <p><strong>${data.technician}</strong></p>
                <p>Lab Technician</p>
              </div>
            </div>
            <div class="signature-box">
              <div class="signature-line">
                <p><strong>${data.verifiedBy}</strong></p>
                <p>Verified By</p>
              </div>
            </div>
          </div>
          
          <div class="footer">
            <p>This is a computer-generated report. For any queries, please contact the laboratory.</p>
            <p>${this.hospitalConfig.name} | ${this.hospitalConfig.phone}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Generate Medical Report HTML
  generateMedicalReport(data: MedicalReportData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Medical Report - ${data.reportNumber}</title>
        <style>
          @page {
            size: A4;
            margin: 15mm;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.6;
            color: #333;
          }
          .report {
            max-width: 210mm;
            margin: 0 auto;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 3px solid #2438a6;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .hospital-info h1 {
            color: #2438a6;
            font-size: 24px;
          }
          .report-title {
            background: #2438a6;
            color: white;
            padding: 10px 20px;
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            margin: 20px 0;
          }
          .patient-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            background: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
          }
          .info-item {
            display: flex;
            gap: 10px;
          }
          .info-label {
            font-weight: bold;
            color: #666;
            min-width: 120px;
          }
          .section {
            margin: 25px 0;
          }
          .section-title {
            background: #e9ecef;
            padding: 8px 15px;
            font-weight: bold;
            color: #2438a6;
            border-left: 4px solid #2438a6;
            margin-bottom: 10px;
          }
          .section-content {
            padding: 10px 15px;
          }
          .symptoms-list {
            list-style: disc;
            margin-left: 20px;
          }
          .prescription-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          .prescription-table th,
          .prescription-table td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: left;
          }
          .prescription-table th {
            background: #2438a6;
            color: white;
          }
          .prescription-table tr:nth-child(even) {
            background: #f9f9f9;
          }
          .signature-section {
            margin-top: 50px;
            text-align: right;
          }
          .signature-box {
            display: inline-block;
            text-align: center;
            min-width: 200px;
          }
          .signature-line {
            border-top: 1px solid #000;
            margin-top: 60px;
            padding-top: 5px;
          }
          .stamp-area {
            border: 2px dashed #ccc;
            width: 100px;
            height: 100px;
            margin: 10px auto;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #999;
            font-size: 10px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 15px;
          }
        </style>
      </head>
      <body>
        <div class="report">
          <div class="header">
            <div class="hospital-info">
              <h1>${this.hospitalConfig.name}</h1>
              <p>${this.hospitalConfig.address}</p>
              <p>Tel: ${this.hospitalConfig.phone} | Email: ${this.hospitalConfig.email}</p>
            </div>
            <div class="report-info">
              <p><strong>Report No:</strong> ${data.reportNumber}</p>
              <p><strong>Date:</strong> ${data.date}</p>
              <p><strong>Department:</strong> ${data.department}</p>
            </div>
          </div>
          
          <div class="report-title">MEDICAL REPORT</div>
          
          <div class="patient-info">
            <div class="info-item">
              <span class="info-label">Patient Name:</span>
              <span>${data.patientName}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Patient ID:</span>
              <span>${data.patientId}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Age:</span>
              <span>${data.patientAge} years</span>
            </div>
            <div class="info-item">
              <span class="info-label">Gender:</span>
              <span>${data.patientGender}</span>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">PRESENTING SYMPTOMS</div>
            <div class="section-content">
              <ul class="symptoms-list">
                ${data.symptoms.map(symptom => `<li>${symptom}</li>`).join('')}
              </ul>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">CLINICAL FINDINGS</div>
            <div class="section-content">
              ${data.findings}
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">DIAGNOSIS</div>
            <div class="section-content">
              <strong>${data.diagnosis}</strong>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">TREATMENT</div>
            <div class="section-content">
              ${data.treatment}
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">PRESCRIPTIONS</div>
            <div class="section-content">
              <table class="prescription-table">
                <thead>
                  <tr>
                    <th>Medication</th>
                    <th>Dosage</th>
                    <th>Frequency</th>
                    <th>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.prescriptions.map(rx => `
                    <tr>
                      <td>${rx.medication}</td>
                      <td>${rx.dosage}</td>
                      <td>${rx.frequency}</td>
                      <td>${rx.duration}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
          
          ${data.followUp ? `
            <div class="section">
              <div class="section-title">FOLLOW-UP</div>
              <div class="section-content">
                ${data.followUp}
              </div>
            </div>
          ` : ''}
          
          <div class="signature-section">
            <div class="signature-box">
              <div class="stamp-area">STAMP</div>
              <div class="signature-line">
                <p><strong>Dr. ${data.doctor}</strong></p>
                <p>${data.department}</p>
              </div>
            </div>
          </div>
          
          <div class="footer">
            <p>This is a confidential medical document. Unauthorized disclosure is prohibited.</p>
            <p>${this.hospitalConfig.name} | ${this.hospitalConfig.phone}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Print HTML content
  printHtml(html: string): void {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  }

  // Print receipt
  printReceipt(data: ReceiptData): void {
    const html = this.generateA5Receipt(data);
    this.printHtml(html);
  }

  // Print lab report
  printLabReport(data: LabReportData): void {
    const html = this.generateLabReport(data);
    this.printHtml(html);
  }

  // Print medical report
  printMedicalReport(data: MedicalReportData): void {
    const html = this.generateMedicalReport(data);
    this.printHtml(html);
  }

  // Generate PDF as base64 (for backend integration)
  async generatePdfBase64(html: string): Promise<string> {
    // This would typically use a library like html2pdf or call a backend service
    // For now, we'll return a placeholder
    return btoa(html);
  }

  // Print from base64 PDF
  printBase64Pdf(base64: string): void {
    const pdfData = `data:application/pdf;base64,${base64}`;
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = pdfData;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    };
  }
}

export const printService = new PrintService();
export default printService;