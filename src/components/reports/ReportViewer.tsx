import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, Download, Printer, Calendar, Filter, 
  BarChart3, PieChart, TrendingUp, Users, DollarSign,
  FlaskConical, Pill, FileSpreadsheet
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { useToast } from '../ui/use-toast';

type ReportType = 'financial' | 'medical' | 'inventory' | 'appointments' | 'lab' | 'pharmacy';

interface ReportConfig {
  id: ReportType;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const reportTypes: ReportConfig[] = [
  {
    id: 'financial',
    name: 'Financial Reports',
    description: 'Revenue, payments, invoices, and expenses',
    icon: <DollarSign className="w-6 h-6" />,
    color: 'bg-success-green',
  },
  {
    id: 'medical',
    name: 'Medical Reports',
    description: 'Patient records, diagnoses, treatments',
    icon: <FileText className="w-6 h-6" />,
    color: 'bg-primary-blue',
  },
  {
    id: 'inventory',
    name: 'Inventory Reports',
    description: 'Stock levels, movements, valuations',
    icon: <BarChart3 className="w-6 h-6" />,
    color: 'bg-admin-purple',
  },
  {
    id: 'appointments',
    name: 'Appointments Reports',
    description: 'Bookings, attendance, doctor schedules',
    icon: <Calendar className="w-6 h-6" />,
    color: 'bg-alert-orange',
  },
  {
    id: 'lab',
    name: 'Laboratory Reports',
    description: 'Test requests, results, turnaround times',
    icon: <FlaskConical className="w-6 h-6" />,
    color: 'bg-secondary-olive',
  },
  {
    id: 'pharmacy',
    name: 'Pharmacy Reports',
    description: 'Dispensing, stock, prescriptions',
    icon: <Pill className="w-6 h-6" />,
    color: 'bg-critical-red',
  },
];

interface FinancialSummary {
  totalRevenue: number;
  totalCollected: number;
  totalPending: number;
  mpesaPayments: number;
  cashPayments: number;
  insurancePayments: number;
}

const mockFinancialSummary: FinancialSummary = {
  totalRevenue: 2500000,
  totalCollected: 2150000,
  totalPending: 350000,
  mpesaPayments: 1500000,
  cashPayments: 450000,
  insurancePayments: 200000,
};

interface ReportViewerProps {
  defaultReportType?: ReportType;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({
  defaultReportType = 'financial',
}) => {
  const [selectedReport, setSelectedReport] = useState<ReportType>(defaultReportType);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: 'Report Generated',
        description: 'Your report is ready for download.',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to generate report.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportPDF = () => {
    toast({
      title: 'Exporting PDF',
      description: 'Your PDF report is being prepared...',
    });
  };

  const handleExportExcel = () => {
    toast({
      title: 'Exporting Excel',
      description: 'Your Excel report is being prepared...',
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const renderFinancialReport = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-success-green to-success-green/80 text-white">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold">KES {mockFinancialSummary.totalRevenue.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-10 h-10 opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-primary-blue to-primary-blue/80 text-white">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm">Collected</p>
                <p className="text-2xl font-bold">KES {mockFinancialSummary.totalCollected.toLocaleString()}</p>
              </div>
              <DollarSign className="w-10 h-10 opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-alert-orange to-alert-orange/80 text-white">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm">Pending</p>
                <p className="text-2xl font-bold">KES {mockFinancialSummary.totalPending.toLocaleString()}</p>
              </div>
              <Users className="w-10 h-10 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <PieChart className="w-5 h-5 text-primary-blue" />
            Payment Methods Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-success-green/10 rounded-lg">
              <div className="w-16 h-16 bg-success-green rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <p className="font-semibold text-lg">M-PESA</p>
              <p className="text-2xl font-bold text-success-green">
                KES {mockFinancialSummary.mpesaPayments.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">
                {Math.round((mockFinancialSummary.mpesaPayments / mockFinancialSummary.totalCollected) * 100)}% of total
              </p>
            </div>
            
            <div className="text-center p-4 bg-primary-blue/10 rounded-lg">
              <div className="w-16 h-16 bg-primary-blue rounded-full flex items-center justify-center mx-auto mb-3">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <p className="font-semibold text-lg">Cash</p>
              <p className="text-2xl font-bold text-primary-blue">
                KES {mockFinancialSummary.cashPayments.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">
                {Math.round((mockFinancialSummary.cashPayments / mockFinancialSummary.totalCollected) * 100)}% of total
              </p>
            </div>
            
            <div className="text-center p-4 bg-admin-purple/10 rounded-lg">
              <div className="w-16 h-16 bg-admin-purple rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <p className="font-semibold text-lg">Insurance</p>
              <p className="text-2xl font-bold text-admin-purple">
                KES {mockFinancialSummary.insurancePayments.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">
                {Math.round((mockFinancialSummary.insurancePayments / mockFinancialSummary.totalCollected) * 100)}% of total
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions Table Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-success-green/20 rounded-full flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-success-green" />
                  </div>
                  <div>
                    <p className="font-medium">Payment #{1000 + i}</p>
                    <p className="text-sm text-gray-500">Invoice INV-2024-00{i}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-success-green">+ KES {(Math.random() * 50000).toFixed(0)}</p>
                  <p className="text-xs text-gray-500">via M-PESA</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderGenericReport = () => (
    <Card>
      <CardContent className="py-12 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Generate {reportTypes.find(r => r.id === selectedReport)?.name}</h3>
        <p className="text-gray-600 mb-6">
          Select date range and click generate to view detailed reports.
        </p>
        <Button onClick={handleGenerateReport} disabled={isGenerating}>
          {isGenerating ? 'Generating...' : 'Generate Report'}
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Report Type Selection */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {reportTypes.map((report) => (
          <motion.div
            key={report.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedReport(report.id)}
            className={`cursor-pointer rounded-xl p-4 transition-all ${
              selectedReport === report.id
                ? 'ring-2 ring-primary-blue bg-primary-blue/5'
                : 'bg-white hover:shadow-md border'
            }`}
          >
            <div className={`w-12 h-12 ${report.color} rounded-lg flex items-center justify-center text-white mb-3`}>
              {report.icon}
            </div>
            <h3 className="font-medium text-sm">{report.name}</h3>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                From Date
              </label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                To Date
              </label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                More Filters
              </Button>
              <Button onClick={handleGenerateReport} disabled={isGenerating} className="gap-2">
                <BarChart3 className="w-4 h-4" />
                {isGenerating ? 'Generating...' : 'Generate'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CardTitle className="flex items-center gap-2">
                {reportTypes.find(r => r.id === selectedReport)?.icon}
                {reportTypes.find(r => r.id === selectedReport)?.name}
              </CardTitle>
              <Badge variant="outline">
                {dateFrom && dateTo ? `${dateFrom} - ${dateTo}` : 'All Time'}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-2">
                <Download className="w-4 h-4" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportExcel} className="gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                Excel
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
                <Printer className="w-4 h-4" />
                Print
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {selectedReport === 'financial' ? renderFinancialReport() : renderGenericReport()}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportViewer;