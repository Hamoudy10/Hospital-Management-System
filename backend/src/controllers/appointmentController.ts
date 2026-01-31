// ============================================
// Appointment Controller
// ============================================

import { Response } from 'express';
import { supabase } from '../config/supabase';
import { createAppointmentSchema, updateAppointmentSchema, paginationSchema } from '../utils/validators';
import { logger } from '../utils/logger';
import auditService from '../services/auditService';
import { AuthenticatedRequest } from '../types';

/**
 * Create New Appointment
 */
export const createAppointment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Validate input
    const validation = createAppointmentSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors
      });
      return;
    }

    const data = validation.data;

    // Check if doctor is available at the requested time
    const appointmentDateTime = new Date(`${data.appointmentDate}T${data.appointmentTime}`);
    const duration = data.duration || 30;
    const endTime = new Date(appointmentDateTime.getTime() + duration * 60000);

    // Check for conflicting appointments
    const { data: conflicts } = await supabase
      .from('appointments')
      .select('id')
      .eq('doctor_id', data.doctorId)
      .eq('appointment_date', data.appointmentDate)
      .neq('status', 'cancelled')
      .gte('appointment_time', data.appointmentTime)
      .lt('appointment_time', endTime.toTimeString().slice(0, 5));

    if (conflicts && conflicts.length > 0) {
      res.status(409).json({
        success: false,
        error: 'Doctor is not available at the requested time'
      });
      return;
    }

    // Create appointment
    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert({
        patient_id: data.patientId,
        doctor_id: data.doctorId,
        appointment_date: data.appointmentDate,
        appointment_time: data.appointmentTime,
        duration: duration,
        type: data.type,
        status: 'scheduled',
        reason: data.reason || null,
        notes: data.notes || null,
        created_by: req.user!.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select(`
        *,
        patient:patient_id(patient_number, first_name, last_name),
        doctor:doctor_id(first_name, last_name)
      `)
      .single();

    if (error) {
      logger.error('Failed to create appointment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create appointment'
      });
      return;
    }

    // Log audit
    await auditService.logCreate(
      req.user!.id,
      'appointments',
      appointment.id,
      { patientId: data.patientId, doctorId: data.doctorId, date: data.appointmentDate }
    );

    res.status(201).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    logger.error('Create appointment error:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while creating appointment'
    });
  }
};

/**
 * Get Appointment by ID
 */
export const getAppointmentById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: appointment, error } = await supabase
      .from('appointments')
      .select(`
        *,
        patient:patient_id(id, patient_number, first_name, last_name, phone),
        doctor:doctor_id(id, first_name, last_name, department)
      `)
      .eq('id', id)
      .single();

    if (error || !appointment) {
      res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
      return;
    }

    res.json({
      success: true,
      data: appointment
    });
  } catch (error) {
    logger.error('Get appointment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch appointment'
    });
  }
};

/**
 * Update Appointment
 */
export const updateAppointment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate input
    const validation = updateAppointmentSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors
      });
      return;
    }

    const data = validation.data;

    // Get existing appointment
    const { data: existing, error: fetchError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
      return;
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    if (data.appointmentDate) updateData.appointment_date = data.appointmentDate;
    if (data.appointmentTime) updateData.appointment_time = data.appointmentTime;
    if (data.duration) updateData.duration = data.duration;
    if (data.type) updateData.type = data.type;
    if (data.status) updateData.status = data.status;
    if (data.reason !== undefined) updateData.reason = data.reason;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const { data: appointment, error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log audit
    await auditService.logUpdate(req.user!.id, 'appointments', id, existing, updateData);

    res.json({
      success: true,
      data: appointment
    });
  } catch (error) {
    logger.error('Update appointment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update appointment'
    });
  }
};

/**
 * Get Appointments (Paginated with filters)
 */
export const getAppointments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const paginationValidation = paginationSchema.safeParse(req.query);
    const { page, limit } = paginationValidation.data || { page: 1, limit: 20 };
    const { doctorId, patientId, date, status } = req.query;

    const offset = (page - 1) * limit;

    let query = supabase
      .from('appointments')
      .select(`
        *,
        patient:patient_id(id, patient_number, first_name, last_name, phone),
        doctor:doctor_id(id, first_name, last_name)
      `, { count: 'exact' });

    if (doctorId) {
      query = query.eq('doctor_id', doctorId);
    }

    if (patientId) {
      query = query.eq('patient_id', patientId);
    }

    if (date) {
      query = query.eq('appointment_date', date);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: appointments, error, count } = await query
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: appointments,
      meta: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    logger.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch appointments'
    });
  }
};

/**
 * Get Today's Appointments for a Doctor
 */
export const getTodaysAppointments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const doctorId = req.query.doctorId || req.user?.id;
    const today = new Date().toISOString().split('T')[0];

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        *,
        patient:patient_id(id, patient_number, first_name, last_name, phone, date_of_birth)
      `)
      .eq('doctor_id', doctorId)
      .eq('appointment_date', today)
      .neq('status', 'cancelled')
      .order('appointment_time', { ascending: true });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: appointments
    });
  } catch (error) {
    logger.error('Get todays appointments error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch appointments'
    });
  }
};

/**
 * Check-in Patient for Appointment
 */
export const checkInAppointment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Get appointment
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !appointment) {
      res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
      return;
    }

    if (appointment.status !== 'scheduled') {
      res.status(400).json({
        success: false,
        error: 'Appointment cannot be checked in'
      });
      return;
    }

    // Update appointment status
    await supabase
      .from('appointments')
      .update({
        status: 'checked_in',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    // Create visit record
    const { data: visit, error: visitError } = await supabase
      .from('visits')
      .insert({
        patient_id: appointment.patient_id,
        appointment_id: id,
        visit_date: new Date().toISOString(),
        visit_type: 'outpatient',
        status: 'checked_in',
        chief_complaint: appointment.reason,
        created_by: req.user!.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (visitError) {
      logger.error('Failed to create visit:', visitError);
    }

    // Log audit
    await auditService.logUpdate(req.user!.id, 'appointments', id, 
      { status: 'scheduled' }, 
      { status: 'checked_in' }
    );

    res.json({
      success: true,
      data: {
        appointmentId: id,
        visitId: visit?.id,
        status: 'checked_in'
      }
    });
  } catch (error) {
    logger.error('Check-in error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check in patient'
    });
  }
};

/**
 * Get Doctor's Available Slots
 */
export const getDoctorAvailability = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || !date) {
      res.status(400).json({
        success: false,
        error: 'Doctor ID and date are required'
      });
      return;
    }

    // Get existing appointments for the doctor on the date
    const { data: appointments } = await supabase
      .from('appointments')
      .select('appointment_time, duration')
      .eq('doctor_id', doctorId)
      .eq('appointment_date', date)
      .neq('status', 'cancelled');

    // Generate available slots (8 AM to 5 PM, 30 min slots)
    const allSlots: string[] = [];
    for (let hour = 8; hour < 17; hour++) {
      allSlots.push(`${String(hour).padStart(2, '0')}:00`);
      allSlots.push(`${String(hour).padStart(2, '0')}:30`);
    }

    // Filter out booked slots
    const bookedTimes = appointments?.map(a => a.appointment_time) || [];
    const availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot));

    res.json({
      success: true,
      data: {
        date,
        availableSlots,
        bookedSlots: bookedTimes
      }
    });
  } catch (error) {
    logger.error('Get availability error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get doctor availability'
    });
  }
};

/**
 * Cancel Appointment
 */
export const cancelAppointment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !appointment) {
      res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
      return;
    }

    if (['completed', 'cancelled'].includes(appointment.status)) {
      res.status(400).json({
        success: false,
        error: 'Appointment cannot be cancelled'
      });
      return;
    }

    await supabase
      .from('appointments')
      .update({
        status: 'cancelled',
        notes: `${appointment.notes || ''}\n\nCancelled: ${reason || 'No reason provided'}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    await auditService.logUpdate(req.user!.id, 'appointments', id,
      { status: appointment.status },
      { status: 'cancelled', reason }
    );

    res.json({
      success: true,
      message: 'Appointment cancelled successfully'
    });
  } catch (error) {
    logger.error('Cancel appointment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel appointment'
    });
  }
};