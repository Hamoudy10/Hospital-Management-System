// ============================================
// Patient Controller
// ============================================

import { Response } from 'express';
import { supabase } from '../config/supabase';
import { createPatientSchema, updatePatientSchema, patientSearchSchema, paginationSchema } from '../utils/validators';
import { logger } from '../utils/logger';
import auditService from '../services/auditService';
import { AuthenticatedRequest } from '../types';

/**
 * Generate unique patient number
 */
const generatePatientNumber = async (): Promise<string> => {
  const date = new Date();
  const year = date.getFullYear();
  
  // Get count of patients this year
  const startOfYear = `${year}-01-01`;
  const { count } = await supabase
    .from('patients')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfYear);

  const sequence = String((count || 0) + 1).padStart(5, '0');
  return `PT${year}${sequence}`;
};

/**
 * Register New Patient
 */
export const createPatient = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Validate input
    const validation = createPatientSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors
      });
      return;
    }

    const data = validation.data;

    // Check for duplicate by phone or national ID
    if (data.nationalId) {
      const { data: existingByNationalId } = await supabase
        .from('patients')
        .select('id')
        .eq('national_id', data.nationalId)
        .single();

      if (existingByNationalId) {
        res.status(400).json({
          success: false,
          error: 'A patient with this National ID already exists'
        });
        return;
      }
    }

    // Generate patient number
    const patientNumber = await generatePatientNumber();

    // Create patient
    const { data: patient, error } = await supabase
      .from('patients')
      .insert({
        patient_number: patientNumber,
        first_name: data.firstName,
        last_name: data.lastName,
        date_of_birth: data.dateOfBirth,
        gender: data.gender,
        national_id: data.nationalId || null,
        phone: data.phone,
        email: data.email || null,
        address: data.address || null,
        county: data.county || null,
        emergency_contact_name: data.emergencyContactName || null,
        emergency_contact_phone: data.emergencyContactPhone || null,
        blood_group: data.bloodGroup || null,
        allergies: data.allergies || [],
        insurance_provider: data.insuranceProvider || null,
        insurance_policy_number: data.insurancePolicyNumber || null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create patient:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to register patient'
      });
      return;
    }

    // Log audit
    await auditService.logCreate(
      req.user!.id,
      'patients',
      patient.id,
      { patientNumber, phone: data.phone },
      req.ip,
      req.headers['user-agent'] as string
    );

    res.status(201).json({
      success: true,
      data: {
        id: patient.id,
        patientNumber: patient.patient_number,
        firstName: patient.first_name,
        lastName: patient.last_name,
        dateOfBirth: patient.date_of_birth,
        gender: patient.gender,
        phone: patient.phone,
        email: patient.email
      }
    });
  } catch (error) {
    logger.error('Create patient error:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while registering patient'
    });
  }
};

/**
 * Get Patient by ID
 */
export const getPatientById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: patient, error } = await supabase
      .from('patients')
      .select(`
        *,
        visits:visits(id, visit_date, visit_type, status, chief_complaint),
        appointments:appointments(id, appointment_date, appointment_time, type, status)
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error || !patient) {
      res.status(404).json({
        success: false,
        error: 'Patient not found'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: patient.id,
        patientNumber: patient.patient_number,
        firstName: patient.first_name,
        lastName: patient.last_name,
        dateOfBirth: patient.date_of_birth,
        gender: patient.gender,
        nationalId: patient.national_id,
        phone: patient.phone,
        email: patient.email,
        address: patient.address,
        county: patient.county,
        emergencyContactName: patient.emergency_contact_name,
        emergencyContactPhone: patient.emergency_contact_phone,
        bloodGroup: patient.blood_group,
        allergies: patient.allergies,
        insuranceProvider: patient.insurance_provider,
        insurancePolicyNumber: patient.insurance_policy_number,
        visits: patient.visits,
        appointments: patient.appointments,
        createdAt: patient.created_at,
        updatedAt: patient.updated_at
      }
    });
  } catch (error) {
    logger.error('Get patient error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch patient'
    });
  }
};

/**
 * Update Patient
 */
export const updatePatient = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate input
    const validation = updatePatientSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors
      });
      return;
    }

    const data = validation.data;

    // Get existing patient
    const { data: existingPatient, error: fetchError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingPatient) {
      res.status(404).json({
        success: false,
        error: 'Patient not found'
      });
      return;
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    if (data.firstName) updateData.first_name = data.firstName;
    if (data.lastName) updateData.last_name = data.lastName;
    if (data.dateOfBirth) updateData.date_of_birth = data.dateOfBirth;
    if (data.gender) updateData.gender = data.gender;
    if (data.nationalId !== undefined) updateData.national_id = data.nationalId || null;
    if (data.phone) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email || null;
    if (data.address !== undefined) updateData.address = data.address || null;
    if (data.county !== undefined) updateData.county = data.county || null;
    if (data.emergencyContactName !== undefined) updateData.emergency_contact_name = data.emergencyContactName || null;
    if (data.emergencyContactPhone !== undefined) updateData.emergency_contact_phone = data.emergencyContactPhone || null;
    if (data.bloodGroup !== undefined) updateData.blood_group = data.bloodGroup || null;
    if (data.allergies !== undefined) updateData.allergies = data.allergies || [];
    if (data.insuranceProvider !== undefined) updateData.insurance_provider = data.insuranceProvider || null;
    if (data.insurancePolicyNumber !== undefined) updateData.insurance_policy_number = data.insurancePolicyNumber || null;

    const { data: patient, error } = await supabase
      .from('patients')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update patient:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update patient'
      });
      return;
    }

    // Log audit
    await auditService.logUpdate(
      req.user!.id,
      'patients',
      id,
      existingPatient,
      updateData,
      req.ip,
      req.headers['user-agent'] as string
    );

    res.json({
      success: true,
      data: {
        id: patient.id,
        patientNumber: patient.patient_number,
        firstName: patient.first_name,
        lastName: patient.last_name,
        phone: patient.phone
      }
    });
  } catch (error) {
    logger.error('Update patient error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update patient'
    });
  }
};

/**
 * Search Patients
 */
export const searchPatients = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const searchValidation = patientSearchSchema.safeParse(req.query);
    if (!searchValidation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid search parameters'
      });
      return;
    }

    const { query, type } = searchValidation.data;

    let dbQuery = supabase
      .from('patients')
      .select('id, patient_number, first_name, last_name, phone, date_of_birth, gender')
      .eq('is_active', true);

    switch (type) {
      case 'phone':
        dbQuery = dbQuery.ilike('phone', `%${query}%`);
        break;
      case 'patientNumber':
        dbQuery = dbQuery.ilike('patient_number', `%${query}%`);
        break;
      case 'nationalId':
        dbQuery = dbQuery.ilike('national_id', `%${query}%`);
        break;
      default:
        // Search by name
        dbQuery = dbQuery.or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`);
    }

    const { data: patients, error } = await dbQuery.limit(20);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: patients?.map(p => ({
        id: p.id,
        patientNumber: p.patient_number,
        firstName: p.first_name,
        lastName: p.last_name,
        phone: p.phone,
        dateOfBirth: p.date_of_birth,
        gender: p.gender
      }))
    });
  } catch (error) {
    logger.error('Search patients error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search patients'
    });
  }
};

/**
 * Get All Patients (Paginated)
 */
export const getPatients = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const paginationValidation = paginationSchema.safeParse(req.query);
    const { page, limit, sortBy, sortOrder, search } = paginationValidation.data || { page: 1, limit: 20 };

    const offset = (page - 1) * limit;

    let query = supabase
      .from('patients')
      .select('id, patient_number, first_name, last_name, phone, date_of_birth, gender, created_at', { count: 'exact' })
      .eq('is_active', true);

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,patient_number.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data: patients, error, count } = await query
      .order(sortBy || 'created_at', { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: patients?.map(p => ({
        id: p.id,
        patientNumber: p.patient_number,
        firstName: p.first_name,
        lastName: p.last_name,
        phone: p.phone,
        dateOfBirth: p.date_of_birth,
        gender: p.gender,
        createdAt: p.created_at
      })),
      meta: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    logger.error('Get patients error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch patients'
    });
  }
};

/**
 * Get Patient Medical History
 */
export const getPatientMedicalHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Get visits with related medical records, vitals, prescriptions, and lab tests
    const { data: visits, error } = await supabase
      .from('visits')
      .select(`
        *,
        vitals:vitals(*),
        medical_records:medical_records(*),
        prescriptions:prescriptions(
          *,
          items:prescription_items(*)
        ),
        lab_tests:lab_tests(*)
      `)
      .eq('patient_id', id)
      .order('visit_date', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: visits
    });
  } catch (error) {
    logger.error('Get medical history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch medical history'
    });
  }
};

/**
 * Soft Delete Patient
 */
export const deletePatient = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Get existing patient
    const { data: existingPatient, error: fetchError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingPatient) {
      res.status(404).json({
        success: false,
        error: 'Patient not found'
      });
      return;
    }

    // Soft delete
    const { error } = await supabase
      .from('patients')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      throw error;
    }

    // Log audit
    await auditService.logDelete(
      req.user!.id,
      'patients',
      id,
      existingPatient,
      req.ip,
      req.headers['user-agent'] as string
    );

    res.json({
      success: true,
      message: 'Patient deleted successfully'
    });
  } catch (error) {
    logger.error('Delete patient error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete patient'
    });
  }
};