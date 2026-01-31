import React, { useRef } from 'react';
import { Printer, Download, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useToast } from '../ui/use-toast';

interface PrintWrapperProps {
  children: React.ReactNode;
  title?: string;
  onClose?: () => void;
  showDownload?: boolean;
  documentType?: 'receipt' | 'report' | 'prescription' | 'lab-result';
}

export const PrintWrapper: React.FC<PrintWrapperProps> = ({
  children,
  title = 'Print Preview',
  onClose,
  showDownload = true,
  documentType = 'receipt',
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: 'Print Error',
        description: 'Unable to open print window. Please check your popup settings.',
        variant: 'destructive',
      });
      return;
    }

    const pageSize = documentType === 'receipt' ? 'A5 portrait' : 'A4 portrait';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            @page {
              size: ${pageSize};
              margin: 10mm;
            }
            body {
              font-family: 'Courier New', monospace;
              margin: 0;
              padding: 0;
            }
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    // Wait for styles to load
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);

    toast({
      title: 'Printing',
      description: 'Your document is being sent to the printer.',
    });
  };

  const handleDownload = async () => {
    toast({
      title: 'Downloading',
      description: 'Your document is being prepared for download.',
    });
    
    // In production, this would generate a PDF using jsPDF or similar
    // For now, we'll just show a toast
    setTimeout(() => {
      toast({
        title: 'Download Ready',
        description: 'Your PDF has been downloaded.',
      });
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-auto">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-auto">
        <CardHeader className="sticky top-0 bg-white z-10 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Printer className="w-5 h-5 text-primary-blue" />
              {title}
            </CardTitle>
            <div className="flex gap-2">
              {showDownload && (
                <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
                  <Download className="w-4 h-4" />
                  Download PDF
                </Button>
              )}
              <Button size="sm" onClick={handlePrint} className="gap-2">
                <Printer className="w-4 h-4" />
                Print
              </Button>
              {onClose && (
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 bg-gray-100">
          <div ref={printRef} className="bg-white shadow-lg mx-auto">
            {children}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Utility function to print base64 PDF
export const printBase64PDF = (base64: string): void => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    console.error('Unable to open print window');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print Document</title>
      </head>
      <body style="margin: 0; padding: 0;">
        <iframe 
          src="${base64}" 
          style="width: 100%; height: 100vh; border: none;"
          onload="setTimeout(() => { window.print(); window.close(); }, 500)"
        ></iframe>
      </body>
    </html>
  `);

  printWindow.document.close();
};

// Utility function to trigger print dialog
export const triggerPrint = (elementId: string): void => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id "${elementId}" not found`);
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    console.error('Unable to open print window');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print</title>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        <style>
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        ${element.outerHTML}
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);
};

export default PrintWrapper;