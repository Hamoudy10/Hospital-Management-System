import { Router } from 'express'
import {
  // Financial reports
  getRevenueReport,
  getExpenseReport,
  getProfitLossReport,
  getOutstandingPaymentsReport,
  getCashFlowReport,
  getMpesaTransactionsReport,
  getDailyCollectionsReport,
  
  // Medical reports
  getPatientStatisticsReport,
  getDiagnosisReport,
  getVisitSummaryReport,
  getDoctorPerformanceReport,
  getDepartmentStatisticsReport,
  
  // Inventory reports
  getInventoryStatusReport,
  getStockMovementReport,
  getExpiryReport,
  getDrugConsumptionReport,
  
  // Lab reports
  getLabTestsReport,
  getLabTurnaroundReport,
  getLabRevenueReport,
  
  // Appointment reports
  getAppointmentReport,
  getNoShowReport,
  getWaitTimeReport,
  
  // General reports
  generateCustomReport,
  getReportTemplates,
  saveReportTemplate,
  deleteReportTemplate,
  scheduleReport,
  getScheduledReports,
  deleteScheduledReport,
  exportReport
} from '../controllers/reportController'
import { requireAuth } from '../middleware/auth'
import { requirePermission } from '../middleware/role'

const router = Router()

// All routes require authentication
router.use(requireAuth)

// Financial reports
router.get('/financial/revenue', requirePermission('reports.financial'), getRevenueReport)
router.get('/financial/expenses', requirePermission('reports.financial'), getExpenseReport)
router.get('/financial/profit-loss', requirePermission('reports.financial'), getProfitLossReport)
router.get('/financial/outstanding', requirePermission('reports.financial'), getOutstandingPaymentsReport)
router.get('/financial/cash-flow', requirePermission('reports.financial'), getCashFlowReport)
router.get('/financial/mpesa', requirePermission('reports.financial'), getMpesaTransactionsReport)
router.get('/financial/daily-collections', requirePermission('reports.financial'), getDailyCollectionsReport)

// Medical reports
router.get('/medical/patient-statistics', requirePermission('reports.medical'), getPatientStatisticsReport)
router.get('/medical/diagnosis', requirePermission('reports.medical'), getDiagnosisReport)
router.get('/medical/visit-summary', requirePermission('reports.medical'), getVisitSummaryReport)
router.get('/medical/doctor-performance', requirePermission('reports.medical'), getDoctorPerformanceReport)
router.get('/medical/department-statistics', requirePermission('reports.medical'), getDepartmentStatisticsReport)

// Inventory reports
router.get('/inventory/status', requirePermission('reports.inventory'), getInventoryStatusReport)
router.get('/inventory/stock-movement', requirePermission('reports.inventory'), getStockMovementReport)
router.get('/inventory/expiry', requirePermission('reports.inventory'), getExpiryReport)
router.get('/inventory/drug-consumption', requirePermission('reports.inventory'), getDrugConsumptionReport)

// Lab reports
router.get('/lab/tests', requirePermission('reports.lab'), getLabTestsReport)
router.get('/lab/turnaround', requirePermission('reports.lab'), getLabTurnaroundReport)
router.get('/lab/revenue', requirePermission('reports.lab'), getLabRevenueReport)

// Appointment reports
router.get('/appointments/summary', requirePermission('reports.appointments'), getAppointmentReport)
router.get('/appointments/no-shows', requirePermission('reports.appointments'), getNoShowReport)
router.get('/appointments/wait-time', requirePermission('reports.appointments'), getWaitTimeReport)

// Custom reports
router.post('/custom', requirePermission('reports.custom'), generateCustomReport)

// Report templates
router.get('/templates', requirePermission('reports.read'), getReportTemplates)
router.post('/templates', requirePermission('reports.write'), saveReportTemplate)
router.delete('/templates/:id', requirePermission('reports.write'), deleteReportTemplate)

// Scheduled reports
router.post('/schedule', requirePermission('reports.write'), scheduleReport)
router.get('/scheduled', requirePermission('reports.read'), getScheduledReports)
router.delete('/scheduled/:id', requirePermission('reports.write'), deleteScheduledReport)

// Export reports
router.post('/export', requirePermission('reports.read'), exportReport)

export default router