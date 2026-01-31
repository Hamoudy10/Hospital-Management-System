// ============================================
// Lab Controller
// ============================================

import { Response } from 'express';
import { supabase } from '../config/supabase';
import { createLabTestSchema, updateLabTestSchema, labTestCatalogSchema, paginationSchema } from '../utils/validators';
import { logger } from '../utils/logger';
import { printService } from '../services/printService';
import auditService from '../services/auditService';
import { AuthenticatedRequest } from '../types';

/**
 * Create Lab Test Order
 */
export const createLabTest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const validation = createLabTestSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors
      });
      return;
    }

    const data = validation.data;

    // Get test catalog info
    const { data: catalog, error: catalogError } = await supabase
      .from('lab_test_catalog')
      .select('test_name, sample_type, price')
      .eq('id', data.testCatalogId)
      .single();

    if (catalogError || !catalog) {
      res.status(400).json({
        success: false,
        error: 'Invalid test catalog ID'
      });
      return;
    }

    // Create lab test
    const { data: labTest, error } = await supabase
      .from('lab_tests')
      .insert({
        visit_id: data.visitId,
        patient_id: data.patientId,
        ordered_by: req.user!.id,
        test_catalog_id: data.testCatalogId,
        test_name: catalog.test_name,
        status: 'ordered',
        priority: data.priority || 'routine',
        sample_type: catalog.sample_type,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create lab test:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create lab test order'
      });
      return;
    }

    // Log audit
    await auditService.logCreate(req.user!.id, 'lab_tests', labTest.id, {
      patientId: data.patientId,
      testName: catalog.test_name
    });

    res.status(201).json({
      success: true,
      data: labTest
    });
  } catch (error) {
    logger.error('Create lab test error:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while creating lab test'
    });
  }
};

/**
 * Get Lab Test by ID
 */
export const getLabTestById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: labTest, error } = await supabase
      .from('lab_tests')
      .select(`
        *,
        patient:patient_id(id, patient_number, first_name, last_name, date_of_birth, gender),
        orderedBy:ordered_by(first_name, last_name),
        completedBy:completed_by(first_name, last_name),
        catalog:test_catalog_id(*)
      `)
      .eq('id', id)
      .single();

    if (error || !labTest) {
      res.status(404).json({
        success: false,
        error: 'Lab test not found'
      });
      return;
    }

    res.json({
      success: true,
      data: labTest
    });
  } catch (error) {
    logger.error('Get lab test error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch lab test'
    });
  }
};

/**
 * Update Lab Test (Add results, change status)
 */
export const updateLabTest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const validation = updateLabTestSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors
      });
      return;
    }

    const data = validation.data;

    // Get existing lab test
    const { data: existing, error: fetchError } = await supabase
      .from('lab_tests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      res.status(404).json({
        success: false,
        error: 'Lab test not found'
      });
      return;
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    if (data.status) {
      updateData.status = data.status;
      
      if (data.status === 'sample_collected') {
        updateData.sample_collected_at = new Date().toISOString();
        updateData.sample_collected_by = req.user!.id;
      }
      
      if (data.status === 'completed') {
        updateData.completed_at = new Date().toISOString();
        updateData.completed_by = req.user!.id;
      }
    }

    if (data.results !== undefined) updateData.results = data.results;
    if (data.resultNotes !== undefined) updateData.result_notes = data.resultNotes;

    const { data: labTest, error } = await supabase
      .from('lab_tests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log audit
    await auditService.logUpdate(req.user!.id, 'lab_tests', id, existing, updateData);

    res.json({
      success: true,
      data: labTest
    });
  } catch (error) {
    logger.error('Update lab test error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update lab test'
    });
  }
};

/**
 * Get Lab Tests (Paginated with filters)
 */
export const getLabTests = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const paginationValidation = paginationSchema.safeParse(req.query);
    const { page, limit } = paginationValidation.data || { page: 1, limit: 20 };
    const { patientId, status, priority, date } = req.query;

    const offset = (page - 1) * limit;

    let query = supabase
      .from('lab_tests')
      .select(`
        *,
        patient:patient_id(id, patient_number, first_name, last_name),
        orderedBy:ordered_by(first_name, last_name)
      `, { count: 'exact' });

    if (patientId) {
      query = query.eq('patient_id', patientId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    if (date) {
      query = query.gte('created_at', `${date}T00:00:00`)
                   .lt('created_at', `${date}T23:59:59`);
    }

    const { data: labTests, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: labTests,
      meta: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    logger.error('Get lab tests error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch lab tests'
    });
  }
};

/**
 * Get Pending Lab Tests (Queue)
 */
export const getPendingLabTests = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { data: labTests, error } = await supabase
      .from('lab_tests')
      .select(`
        *,
        patient:patient_id(id, patient_number, first_name, last_name),
        orderedBy:ordered_by(first_name, last_name)
      `)
      .in('status', ['ordered', 'sample_collected', 'processing'])
      .order('priority', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    // Group by status
    const queue = {
      ordered: labTests?.filter(t => t.status === 'ordered') || [],
      sampleCollected: labTests?.filter(t => t.status === 'sample_collected') || [],
      processing: labTests?.filter(t => t.status === 'processing') || []
    };

    res.json({
      success: true,
      data: queue
    });
  } catch (error) {
    logger.error('Get pending lab tests error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending lab tests'
    });
  }
};

/**
 * Collect Sample
 */
export const collectSample = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: labTest, error: fetchError } = await supabase
      .from('lab_tests')
      .select('status')
      .eq('id', id)
      .single();

    if (fetchError || !labTest) {
      res.status(404).json({
        success: false,
        error: 'Lab test not found'
      });
      return;
    }

    if (labTest.status !== 'ordered') {
      res.status(400).json({
        success: false,
        error: 'Sample already collected or test in wrong status'
      });
      return;
    }

    const { error } = await supabase
      .from('lab_tests')
      .update({
        status: 'sample_collected',
        sample_collected_at: new Date().toISOString(),
        sample_collected_by: req.user!.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Sample collected successfully'
    });
  } catch (error) {
    logger.error('Collect sample error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to collect sample'
    });
  }
};

/**
 * Enter Lab Results
 */
export const enterResults = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { results, resultNotes } = req.body;

    if (!results) {
      res.status(400).json({
        success: false,
        error: 'Results are required'
      });
      return;
    }

    const { data: labTest, error: fetchError } = await supabase
      .from('lab_tests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !labTest) {
      res.status(404).json({
        success: false,
        error: 'Lab test not found'
      });
      return;
    }

    if (!['sample_collected', 'processing'].includes(labTest.status)) {
      res.status(400).json({
        success: false,
        error: 'Cannot enter results for this test'
      });
      return;
    }

    const { error } = await supabase
      .from('lab_tests')
      .update({
        status: 'completed',
        results: results,
        result_notes: resultNotes || null,
        completed_at: new Date().toISOString(),
        completed_by: req.user!.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      throw error;
    }

    // Log audit
    await auditService.logUpdate(req.user!.id, 'lab_tests', id, labTest, {
      status: 'completed',
      results
    });

    res.json({
      success: true,
      message: 'Results entered successfully'
    });
  } catch (error) {
    logger.error('Enter results error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to enter results'
    });
  }
};

/**
 * Generate Lab Result PDF
 */
export const generateResultPDF = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const pdfBase64 = await printService.generateLabResultPDF(id);

    res.json({
      success: true,
      data: {
        pdf: pdfBase64
      }
    });
  } catch (error) {
    logger.error('Generate lab result PDF error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate PDF'
    });
  }
};

// ==================== LAB TEST CATALOG ====================

/**
 * Get Test Catalog
 */
export const getTestCatalog = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { category, search } = req.query;

    let query = supabase
      .from('lab_test_catalog')
      .select('*')
      .eq('is_active', true);

    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`test_name.ilike.%${search}%,test_code.ilike.%${search}%`);
    }

    const { data: tests, error } = await query.order('category').order('test_name');

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: tests
    });
  } catch (error) {
    logger.error('Get test catalog error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch test catalog'
    });
  }
};

/**
 * Add Test to Catalog
 */
export const addTestToCatalog = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const validation = labTestCatalogSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors
      });
      return;
    }

    const data = validation.data;

    // Check for duplicate test code
    const { data: existing } = await supabase
      .from('lab_test_catalog')
      .select('id')
      .eq('test_code', data.testCode)
      .single();

    if (existing) {
      res.status(400).json({
        success: false,
        error: 'Test code already exists'
      });
      return;
    }

    const { data: test, error } = await supabase
      .from('lab_test_catalog')
      .insert({
        test_code: data.testCode,
        test_name: data.testName,
        category: data.category,
        description: data.description || null,
        sample_type: data.sampleType,
        normal_range: data.normalRange || null,
        unit: data.unit || null,
        price: data.price,
        turnaround_time: data.turnaroundTime || null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({
      success: true,
      data: test
    });
  } catch (error) {
    logger.error('Add test to catalog error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add test to catalog'
    });
  }
};

/**
 * Update Test in Catalog
 */
export const updateTestCatalog = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const data = req.body;

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    if (data.testName) updateData.test_name = data.testName;
    if (data.category) updateData.category = data.category;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.sampleType) updateData.sample_type = data.sampleType;
    if (data.normalRange !== undefined) updateData.normal_range = data.normalRange;
    if (data.unit !== undefined) updateData.unit = data.unit;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.turnaroundTime !== undefined) updateData.turnaround_time = data.turnaroundTime;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;

    const { data: test, error } = await supabase
      .from('lab_test_catalog')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: test
    });
  } catch (error) {
    logger.error('Update test catalog error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update test'
    });
  }
};

/**
 * Get Test Categories
 */
export const getTestCategories = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('lab_test_catalog')
      .select('category')
      .eq('is_active', true);

    if (error) {
      throw error;
    }

    // Get unique categories
    const categories = [...new Set(data?.map(d => d.category))].sort();

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    logger.error('Get test categories error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories'
    });
  }
};