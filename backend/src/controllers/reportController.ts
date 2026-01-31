// ============================================
// Report Controller
// ============================================

import { Response } from 'express';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../types';

// ==================== FINANCIAL REPORTS ====================

/**
 * Get Revenue Report
 */
export const getRevenueReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    if (!startDate || !endDate) {
      res.status(400).json({
        success: false,
        error: 'Start date and end date are required'
      });
      return;
    }

    const { data: payments, error } = await supabase
      .from('payments')
      .select(`
        id,
        amount,
        payment_method,
        created_at,
        invoice:invoice_id(
          id,
          invoice_number,
          patient_id
        )
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    // Group by date
    const grouped: Record<string, {
      date: string;
      total: number;
      cash: number;
      mpesa: number;
      card: number;
      insurance: number;
      other: number;
      count: number;
    }> = {};

    payments?.forEach(payment => {
      let dateKey: string;
      const paymentDate = new Date(payment.created_at);

      switch (groupBy) {
        case 'month':
          dateKey = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'week':
          const weekStart = new Date(paymentDate);
          weekStart.setDate(paymentDate.getDate() - paymentDate.getDay());
          dateKey = weekStart.toISOString().split('T')[0];
          break;
        default:
          dateKey = paymentDate.toISOString().split('T')[0];
      }

      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          date: dateKey,
          total: 0,
          cash: 0,
          mpesa: 0,
          card: 0,
          insurance: 0,
          other: 0,
          count: 0
        };
      }

      grouped[dateKey].total += payment.amount;
      grouped[dateKey].count += 1;

      switch (payment.payment_method) {
        case 'cash':
          grouped[dateKey].cash += payment.amount;
          break;
        case 'mpesa':
          grouped[dateKey].mpesa += payment.amount;
          break;
        case 'card':
          grouped[dateKey].card += payment.amount;
          break;
        case 'insurance':
          grouped[dateKey].insurance += payment.amount;
          break;
        default:
          grouped[dateKey].other += payment.amount;
      }
    });

    const data = Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));

    // Calculate summary
    const summary = {
      totalRevenue: payments?.reduce((sum, p) => sum + p.amount, 0) || 0,
      totalTransactions: payments?.length || 0,
      averageTransaction: payments?.length ? (payments.reduce((sum, p) => sum + p.amount, 0) / payments.length) : 0,
      byPaymentMethod: {
        cash: payments?.filter(p => p.payment_method === 'cash').reduce((sum, p) => sum + p.amount, 0) || 0,
        mpesa: payments?.filter(p => p.payment_method === 'mpesa').reduce((sum, p) => sum + p.amount, 0) || 0,
        card: payments?.filter(p => p.payment_method === 'card').reduce((sum, p) => sum + p.amount, 0) || 0,
        insurance: payments?.filter(p => p.payment_method === 'insurance').reduce((sum, p) => sum + p.amount, 0) || 0
      }
    };

    res.json({
      success: true,
      data: {
        details: data,
        summary
      }
    });
  } catch (error) {
    logger.error('Get revenue report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate revenue report'
    });
  }
};

/**
 * Get Outstanding Invoices Report
 */
export const getOutstandingReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { daysOverdue } = req.query;

    let query = supabase
      .from('invoices')
      .select(`
        *,
        patient:patient_id(id, patient_number, first_name, last_name, phone)
      `)
      .in('status', ['pending', 'partially_paid'])
      .gt('balance_amount', 0)
      .order('created_at', { ascending: true });

    if (daysOverdue) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - Number(daysOverdue));
      query = query.lte('created_at', cutoffDate.toISOString());
    }

    const { data: invoices, error } = await query;

    if (error) {
      throw error;
    }

    // Calculate aging buckets
    const now = new Date();
    const aging = {
      current: { count: 0, amount: 0, invoices: [] as typeof invoices },
      days30: { count: 0, amount: 0, invoices: [] as typeof invoices },
      days60: { count: 0, amount: 0, invoices: [] as typeof invoices },
      days90: { count: 0, amount: 0, invoices: [] as typeof invoices },
      over90: { count: 0, amount: 0, invoices: [] as typeof invoices }
    };

    invoices?.forEach(invoice => {
      const invoiceDate = new Date(invoice.created_at);
      const daysDiff = Math.floor((now.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff <= 30) {
        aging.current.count += 1;
        aging.current.amount += invoice.balance_amount;
        aging.current.invoices.push(invoice);
      } else if (daysDiff <= 60) {
        aging.days30.count += 1;
        aging.days30.amount += invoice.balance_amount;
        aging.days30.invoices.push(invoice);
      } else if (daysDiff <= 90) {
        aging.days60.count += 1;
        aging.days60.amount += invoice.balance_amount;
        aging.days60.invoices.push(invoice);
      } else if (daysDiff <= 120) {
        aging.days90.count += 1;
        aging.days90.amount += invoice.balance_amount;
        aging.days90.invoices.push(invoice);
      } else {
        aging.over90.count += 1;
        aging.over90.amount += invoice.balance_amount;
        aging.over90.invoices.push(invoice);
      }
    });

    const summary = {
      totalOutstanding: invoices?.reduce((sum, inv) => sum + inv.balance_amount, 0) || 0,
      totalInvoices: invoices?.length || 0,
      aging: {
        current: { count: aging.current.count, amount: aging.current.amount },
        '31-60 days': { count: aging.days30.count, amount: aging.days30.amount },
        '61-90 days': { count: aging.days60.count, amount: aging.days60.amount },
        '91-120 days': { count: aging.days90.count, amount: aging.days90.amount },
        'Over 120 days': { count: aging.over90.count, amount: aging.over90.amount }
      }
    };

    res.json({
      success: true,
      data: {
        invoices,
        summary
      }
    });
  } catch (error) {
    logger.error('Get outstanding report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate outstanding report'
    });
  }
};

/**
 * Get Daily Collection Report
 */
export const getDailyCollectionReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { date } = req.query;
    const reportDate = date || new Date().toISOString().split('T')[0];

    const startOfDay = `${reportDate}T00:00:00`;
    const endOfDay = `${reportDate}T23:59:59`;

    const { data: payments, error } = await supabase
      .from('payments')
      .select(`
        *,
        invoice:invoice_id(invoice_number, patient_id),
        cashier:received_by(first_name, last_name)
      `)
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    // Group by cashier
    const byCashier: Record<string, { name: string; total: number; count: number }> = {};
    payments?.forEach(payment => {
      const cashierId = payment.received_by;
      const cashierName = payment.cashier ? 
        `${payment.cashier.first_name} ${payment.cashier.last_name}` : 'Unknown';

      if (!byCashier[cashierId]) {
        byCashier[cashierId] = { name: cashierName, total: 0, count: 0 };
      }
      byCashier[cashierId].total += payment.amount;
      byCashier[cashierId].count += 1;
    });

    const summary = {
      date: reportDate,
      totalCollections: payments?.reduce((sum, p) => sum + p.amount, 0) || 0,
      totalTransactions: payments?.length || 0,
      byPaymentMethod: {
        cash: payments?.filter(p => p.payment_method === 'cash').reduce((sum, p) => sum + p.amount, 0) || 0,
        mpesa: payments?.filter(p => p.payment_method === 'mpesa').reduce((sum, p) => sum + p.amount, 0) || 0,
        card: payments?.filter(p => p.payment_method === 'card').reduce((sum, p) => sum + p.amount, 0) || 0,
        insurance: payments?.filter(p => p.payment_method === 'insurance').reduce((sum, p) => sum + p.amount, 0) || 0
      },
      byCashier: Object.values(byCashier)
    };

    res.json({
      success: true,
      data: {
        payments,
        summary
      }
    });
  } catch (error) {
    logger.error('Get daily collection report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate daily collection report'
    });
  }
};

// ==================== MEDICAL REPORTS ====================

/**
 * Get Patient Visit Report
 */
export const getPatientVisitReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, visitType, doctorId } = req.query;

    if (!startDate || !endDate) {
      res.status(400).json({
        success: false,
        error: 'Start date and end date are required'
      });
      return;
    }

    let query = supabase
      .from('visits')
      .select(`
        *,
        patient:patient_id(id, patient_number, first_name, last_name, gender, date_of_birth)
      `)
      .gte('visit_date', startDate)
      .lte('visit_date', endDate)
      .order('visit_date', { ascending: false });

    if (visitType) {
      query = query.eq('visit_type', visitType);
    }

    const { data: visits, error } = await query;

    if (error) {
      throw error;
    }

    // Group by date
    const byDate: Record<string, number> = {};
    const byType: Record<string, number> = {};

    visits?.forEach(visit => {
      const date = new Date(visit.visit_date).toISOString().split('T')[0];
      byDate[date] = (byDate[date] || 0) + 1;
      byType[visit.visit_type] = (byType[visit.visit_type] || 0) + 1;
    });

    const summary = {
      totalVisits: visits?.length || 0,
      byVisitType: byType,
      dailyBreakdown: Object.entries(byDate).map(([date, count]) => ({ date, count }))
    };

    res.json({
      success: true,
      data: {
        visits,
        summary
      }
    });
  } catch (error) {
    logger.error('Get patient visit report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate visit report'
    });
  }
};

/**
 * Get Diagnosis Report
 */
export const getDiagnosisReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, limit = 20 } = req.query;

    if (!startDate || !endDate) {
      res.status(400).json({
        success: false,
        error: 'Start date and end date are required'
      });
      return;
    }

    const { data: records, error } = await supabase
      .from('medical_records')
      .select('diagnosis, diagnosis_code')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .not('diagnosis', 'is', null);

    if (error) {
      throw error;
    }

    // Count diagnoses
    const diagnosisCounts: Record<string, { diagnosis: string; code: string | null; count: number }> = {};

    records?.forEach(record => {
      const key = record.diagnosis.toLowerCase().trim();
      if (!diagnosisCounts[key]) {
        diagnosisCounts[key] = {
          diagnosis: record.diagnosis,
          code: record.diagnosis_code,
          count: 0
        };
      }
      diagnosisCounts[key].count += 1;
    });

    const topDiagnoses = Object.values(diagnosisCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, Number(limit));

    res.json({
      success: true,
      data: {
        topDiagnoses,
        totalRecords: records?.length || 0
      }
    });
  } catch (error) {
    logger.error('Get diagnosis report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate diagnosis report'
    });
  }
};

/**
 * Get Doctor Performance Report
 */
export const getDoctorPerformanceReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, doctorId } = req.query;

    if (!startDate || !endDate) {
      res.status(400).json({
        success: false,
        error: 'Start date and end date are required'
      });
      return;
    }

    // Get appointments
    let appointmentQuery = supabase
      .from('appointments')
      .select(`
        *,
        doctor:doctor_id(id, first_name, last_name, department)
      `)
      .gte('appointment_date', startDate)
      .lte('appointment_date', endDate);

    if (doctorId) {
      appointmentQuery = appointmentQuery.eq('doctor_id', doctorId);
    }

    const { data: appointments, error } = await appointmentQuery;

    if (error) {
      throw error;
    }

    // Group by doctor
    const byDoctor: Record<string, {
      doctorId: string;
      doctorName: string;
      department: string;
      totalAppointments: number;
      completed: number;
      cancelled: number;
      noShow: number;
      completionRate: number;
    }> = {};

    appointments?.forEach(apt => {
      const docId = apt.doctor_id;
      const docName = apt.doctor ? `${apt.doctor.first_name} ${apt.doctor.last_name}` : 'Unknown';
      const dept = apt.doctor?.department || 'Unknown';

      if (!byDoctor[docId]) {
        byDoctor[docId] = {
          doctorId: docId,
          doctorName: docName,
          department: dept,
          totalAppointments: 0,
          completed: 0,
          cancelled: 0,
          noShow: 0,
          completionRate: 0
        };
      }

      byDoctor[docId].totalAppointments += 1;
      if (apt.status === 'completed') byDoctor[docId].completed += 1;
      if (apt.status === 'cancelled') byDoctor[docId].cancelled += 1;
      if (apt.status === 'no_show') byDoctor[docId].noShow += 1;
    });

    // Calculate completion rates
    Object.values(byDoctor).forEach(doc => {
      doc.completionRate = doc.totalAppointments > 0 
        ? Math.round((doc.completed / doc.totalAppointments) * 100) 
        : 0;
    });

    const data = Object.values(byDoctor).sort((a, b) => b.totalAppointments - a.totalAppointments);

    res.json({
      success: true,
      data
    });
  } catch (error) {
    logger.error('Get doctor performance report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate doctor performance report'
    });
  }
};

// ==================== LAB REPORTS ====================

/**
 * Get Lab Test Report
 */
export const getLabTestReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, status, category } = req.query;

    if (!startDate || !endDate) {
      res.status(400).json({
        success: false,
        error: 'Start date and end date are required'
      });
      return;
    }

    let query = supabase
      .from('lab_tests')
      .select(`
        *,
        catalog:test_catalog_id(test_code, test_name, category)
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: labTests, error } = await query;

    if (error) {
      throw error;
    }

    // Group by test - define catalog type for proper typing
    interface LabTestCatalog {
      test_code?: string;
      test_name?: string;
      category?: string;
    }
    
    const byTest: Record<string, { testName: string; category: string; count: number }> = {};
    const byStatus: Record<string, number> = {};

    labTests?.forEach(test => {
      const catalog = test.catalog as LabTestCatalog | null;
      const testName = test.test_name || catalog?.test_name || 'Unknown';
      const testCategory = catalog?.category || 'Unknown';

      if (!byTest[testName]) {
        byTest[testName] = { testName, category: testCategory, count: 0 };
      }
      byTest[testName].count += 1;

      byStatus[test.status] = (byStatus[test.status] || 0) + 1;
    });

    const summary = {
      totalTests: labTests?.length || 0,
      byStatus,
      topTests: Object.values(byTest).sort((a, b) => b.count - a.count).slice(0, 10)
    };

    res.json({
      success: true,
      data: {
        tests: labTests,
        summary
      }
    });
  } catch (error) {
    logger.error('Get lab test report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate lab test report'
    });
  }
};

/**
 * Get Lab Turnaround Time Report
 */
export const getLabTurnaroundReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      res.status(400).json({
        success: false,
        error: 'Start date and end date are required'
      });
      return;
    }

    const { data: labTests, error } = await supabase
      .from('lab_tests')
      .select(`
        id,
        test_name,
        created_at,
        sample_collected_at,
        completed_at,
        catalog:test_catalog_id(category, turnaround_time)
      `)
      .eq('status', 'completed')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (error) {
      throw error;
    }

    // Define catalog type for proper typing
    interface TurnaroundCatalog {
      category?: string;
      turnaround_time?: string;
    }
    
    // Calculate turnaround times
    const turnaroundData = labTests?.map(test => {
      const created = new Date(test.created_at);
      const completed = new Date(test.completed_at);
      const turnaroundMinutes = Math.round((completed.getTime() - created.getTime()) / (1000 * 60));
      const catalog = test.catalog as TurnaroundCatalog | null;

      return {
        testName: test.test_name,
        category: catalog?.category || 'Unknown',
        turnaroundMinutes,
        turnaroundHours: Math.round(turnaroundMinutes / 60 * 10) / 10
      };
    }) || [];

    // Calculate averages by category
    const byCategory: Record<string, { total: number; count: number }> = {};
    turnaroundData.forEach(item => {
      if (!byCategory[item.category]) {
        byCategory[item.category] = { total: 0, count: 0 };
      }
      byCategory[item.category].total += item.turnaroundMinutes;
      byCategory[item.category].count += 1;
    });

    const averageByCategory = Object.entries(byCategory).map(([category, data]) => ({
      category,
      averageMinutes: Math.round(data.total / data.count),
      averageHours: Math.round((data.total / data.count) / 60 * 10) / 10,
      testCount: data.count
    }));

    const overallAverage = turnaroundData.length > 0
      ? Math.round(turnaroundData.reduce((sum, t) => sum + t.turnaroundMinutes, 0) / turnaroundData.length)
      : 0;

    res.json({
      success: true,
      data: {
        details: turnaroundData,
        byCategory: averageByCategory,
        overallAverageMinutes: overallAverage,
        overallAverageHours: Math.round(overallAverage / 60 * 10) / 10,
        totalTests: turnaroundData.length
      }
    });
  } catch (error) {
    logger.error('Get lab turnaround report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate turnaround report'
    });
  }
};

// ==================== INVENTORY REPORTS ====================

/**
 * Get Inventory Report
 */
export const getInventoryReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { category, lowStock, expiringSoon } = req.query;

    let query = supabase
      .from('pharmacy_inventory')
      .select('*')
      .eq('is_active', true);

    if (category) {
      query = query.eq('category', category);
    }

    const { data: drugs, error } = await query.order('name');

    if (error) {
      throw error;
    }

    let filteredDrugs = drugs || [];

    if (lowStock === 'true') {
      filteredDrugs = filteredDrugs.filter(d => d.current_stock <= d.reorder_level);
    }

    if (expiringSoon === 'true') {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      filteredDrugs = filteredDrugs.filter(d => 
        d.expiry_date && new Date(d.expiry_date) <= thirtyDaysFromNow
      );
    }

    // Calculate summary
    const totalValue = filteredDrugs.reduce((sum, d) => sum + (d.current_stock * d.unit_price), 0);
    const lowStockCount = filteredDrugs.filter(d => d.current_stock <= d.reorder_level).length;
    const outOfStockCount = filteredDrugs.filter(d => d.current_stock === 0).length;

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const expiringCount = filteredDrugs.filter(d => 
      d.expiry_date && new Date(d.expiry_date) <= thirtyDaysFromNow
    ).length;

    // Group by category
    const byCategory: Record<string, { count: number; value: number }> = {};
    filteredDrugs.forEach(drug => {
      if (!byCategory[drug.category]) {
        byCategory[drug.category] = { count: 0, value: 0 };
      }
      byCategory[drug.category].count += 1;
      byCategory[drug.category].value += drug.current_stock * drug.unit_price;
    });

    res.json({
      success: true,
      data: {
        drugs: filteredDrugs,
        summary: {
          totalItems: filteredDrugs.length,
          totalValue,
          lowStockCount,
          outOfStockCount,
          expiringCount,
          byCategory: Object.entries(byCategory).map(([category, data]) => ({
            category,
            ...data
          }))
        }
      }
    });
  } catch (error) {
    logger.error('Get inventory report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate inventory report'
    });
  }
};

/**
 * Get Stock Movement Report
 */
export const getStockMovementReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, drugId, movementType } = req.query;

    if (!startDate || !endDate) {
      res.status(400).json({
        success: false,
        error: 'Start date and end date are required'
      });
      return;
    }

    let query = supabase
      .from('stock_movements')
      .select(`
        *,
        drug:drug_id(drug_code, name),
        user:created_by(first_name, last_name)
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });

    if (drugId) {
      query = query.eq('drug_id', drugId);
    }

    if (movementType) {
      query = query.eq('movement_type', movementType);
    }

    const { data: movements, error } = await query;

    if (error) {
      throw error;
    }

    // Group by movement type
    const byType: Record<string, { count: number; totalQuantity: number }> = {};
    movements?.forEach(movement => {
      if (!byType[movement.movement_type]) {
        byType[movement.movement_type] = { count: 0, totalQuantity: 0 };
      }
      byType[movement.movement_type].count += 1;
      byType[movement.movement_type].totalQuantity += movement.quantity;
    });

    res.json({
      success: true,
      data: {
        movements,
        summary: {
          totalMovements: movements?.length || 0,
          byType: Object.entries(byType).map(([type, data]) => ({
            type,
            ...data
          }))
        }
      }
    });
  } catch (error) {
    logger.error('Get stock movement report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate stock movement report'
    });
  }
};

// ==================== APPOINTMENT REPORTS ====================

/**
 * Get Appointment Report
 */
export const getAppointmentReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, doctorId, status } = req.query;

    if (!startDate || !endDate) {
      res.status(400).json({
        success: false,
        error: 'Start date and end date are required'
      });
      return;
    }

    let query = supabase
      .from('appointments')
      .select(`
        *,
        patient:patient_id(patient_number, first_name, last_name),
        doctor:doctor_id(first_name, last_name, department)
      `)
      .gte('appointment_date', startDate)
      .lte('appointment_date', endDate);

    if (doctorId) {
      query = query.eq('doctor_id', doctorId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: appointments, error } = await query
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    if (error) {
      throw error;
    }

    // Calculate statistics
    const byStatus: Record<string, number> = {};
    const byType: Record<string, number> = {};
    const byDoctor: Record<string, { name: string; count: number }> = {};

    appointments?.forEach(apt => {
      byStatus[apt.status] = (byStatus[apt.status] || 0) + 1;
      byType[apt.type] = (byType[apt.type] || 0) + 1;

      const docId = apt.doctor_id;
      const docName = apt.doctor ? `${apt.doctor.first_name} ${apt.doctor.last_name}` : 'Unknown';
      if (!byDoctor[docId]) {
        byDoctor[docId] = { name: docName, count: 0 };
      }
      byDoctor[docId].count += 1;
    });

    const completedCount = appointments?.filter(a => a.status === 'completed').length || 0;
    const totalCount = appointments?.length || 0;

    res.json({
      success: true,
      data: {
        appointments,
        summary: {
          total: totalCount,
          completionRate: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
          byStatus,
          byType,
          byDoctor: Object.values(byDoctor).sort((a, b) => b.count - a.count)
        }
      }
    });
  } catch (error) {
    logger.error('Get appointment report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate appointment report'
    });
  }
};

// ==================== AUDIT REPORTS ====================

/**
 * Get Audit Log Report
 */
export const getAuditReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, userId, action, tableName, page = 1, limit = 50 } = req.query;

    if (!startDate || !endDate) {
      res.status(400).json({
        success: false,
        error: 'Start date and end date are required'
      });
      return;
    }

    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('audit_logs')
      .select(`
        *,
        user:user_id(first_name, last_name, email)
      `, { count: 'exact' })
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (action) {
      query = query.eq('action', action);
    }

    if (tableName) {
      query = query.eq('table_name', tableName);
    }

    const { data: logs, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: logs,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Get audit report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate audit report'
    });
  }
};

/**
 * Export Report (Generic)
 */
export const exportReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { reportType, format = 'json' } = req.query;

    // This is a placeholder - in production, you'd generate actual PDF/Excel files
    // using libraries like jsPDF, ExcelJS, etc.

    res.json({
      success: true,
      message: `Export ${reportType} as ${format} - Implementation needed`,
      data: {
        reportType,
        format,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Export report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export report'
    });
  }
};