// ============================================
// Pharmacy Controller
// ============================================

import { Response } from 'express';
import { supabase } from '../config/supabase';
import { createDrugSchema, updateDrugSchema, stockAdjustmentSchema, createPrescriptionSchema, dispensePrescriptionSchema, paginationSchema } from '../utils/validators';
import { logger } from '../utils/logger';
import auditService from '../services/auditService';
import { AuthenticatedRequest } from '../types';

// ==================== DRUG INVENTORY ====================

/**
 * Create Drug
 */
export const createDrug = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const validation = createDrugSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors
      });
      return;
    }

    const data = validation.data;

    // Check for duplicate drug code
    const { data: existing } = await supabase
      .from('pharmacy_inventory')
      .select('id')
      .eq('drug_code', data.drugCode)
      .single();

    if (existing) {
      res.status(400).json({
        success: false,
        error: 'Drug code already exists'
      });
      return;
    }

    const { data: drug, error } = await supabase
      .from('pharmacy_inventory')
      .insert({
        drug_code: data.drugCode,
        name: data.name,
        generic_name: data.genericName || null,
        category: data.category,
        formulation: data.formulation,
        strength: data.strength || null,
        manufacturer: data.manufacturer || null,
        supplier_id: data.supplierId || null,
        unit_price: data.unitPrice,
        selling_price: data.sellingPrice,
        reorder_level: data.reorderLevel,
        current_stock: data.currentStock,
        expiry_date: data.expiryDate || null,
        batch_number: data.batchNumber || null,
        storage_conditions: data.storageConditions || null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create drug:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create drug'
      });
      return;
    }

    // Log audit
    await auditService.logCreate(req.user!.id, 'pharmacy_inventory', drug.id, {
      drugCode: data.drugCode,
      name: data.name
    });

    res.status(201).json({
      success: true,
      data: drug
    });
  } catch (error) {
    logger.error('Create drug error:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while creating drug'
    });
  }
};

/**
 * Get Drug by ID
 */
export const getDrugById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: drug, error } = await supabase
      .from('pharmacy_inventory')
      .select(`
        *,
        supplier:supplier_id(id, name, contact_person, phone)
      `)
      .eq('id', id)
      .single();

    if (error || !drug) {
      res.status(404).json({
        success: false,
        error: 'Drug not found'
      });
      return;
    }

    res.json({
      success: true,
      data: drug
    });
  } catch (error) {
    logger.error('Get drug error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch drug'
    });
  }
};

/**
 * Update Drug
 */
export const updateDrug = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const validation = updateDrugSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors
      });
      return;
    }

    const data = validation.data;

    // Get existing drug
    const { data: existing, error: fetchError } = await supabase
      .from('pharmacy_inventory')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      res.status(404).json({
        success: false,
        error: 'Drug not found'
      });
      return;
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    if (data.name) updateData.name = data.name;
    if (data.genericName !== undefined) updateData.generic_name = data.genericName;
    if (data.category) updateData.category = data.category;
    if (data.formulation) updateData.formulation = data.formulation;
    if (data.strength !== undefined) updateData.strength = data.strength;
    if (data.manufacturer !== undefined) updateData.manufacturer = data.manufacturer;
    if (data.supplierId !== undefined) updateData.supplier_id = data.supplierId;
    if (data.unitPrice !== undefined) updateData.unit_price = data.unitPrice;
    if (data.sellingPrice !== undefined) updateData.selling_price = data.sellingPrice;
    if (data.reorderLevel !== undefined) updateData.reorder_level = data.reorderLevel;
    if (data.expiryDate !== undefined) updateData.expiry_date = data.expiryDate;
    if (data.batchNumber !== undefined) updateData.batch_number = data.batchNumber;
    if (data.storageConditions !== undefined) updateData.storage_conditions = data.storageConditions;

    const { data: drug, error } = await supabase
      .from('pharmacy_inventory')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log audit
    await auditService.logUpdate(req.user!.id, 'pharmacy_inventory', id, existing, updateData);

    res.json({
      success: true,
      data: drug
    });
  } catch (error) {
    logger.error('Update drug error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update drug'
    });
  }
};

/**
 * Get Drugs (Paginated with filters)
 */
export const getDrugs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const paginationValidation = paginationSchema.safeParse(req.query);
    const { page, limit, search } = paginationValidation.data || { page: 1, limit: 20 };
    const { category, lowStock, expiringSoon } = req.query;

    const offset = (page - 1) * limit;

    let query = supabase
      .from('pharmacy_inventory')
      .select('*', { count: 'exact' })
      .eq('is_active', true);

    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,drug_code.ilike.%${search}%,generic_name.ilike.%${search}%`);
    }

    if (lowStock === 'true') {
      query = query.lte('current_stock', supabase.rpc('get_reorder_level'));
    }

    if (expiringSoon === 'true') {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      query = query.lte('expiry_date', thirtyDaysFromNow.toISOString());
    }

    const { data: drugs, error, count } = await query
      .order('name')
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: drugs,
      meta: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    logger.error('Get drugs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch drugs'
    });
  }
};

/**
 * Adjust Stock
 */
export const adjustStock = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const validation = stockAdjustmentSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors
      });
      return;
    }

    const { drugId, adjustmentType, quantity, reason, batchNumber, expiryDate } = validation.data;

    // Get current stock
    const { data: drug, error: fetchError } = await supabase
      .from('pharmacy_inventory')
      .select('current_stock, name')
      .eq('id', drugId)
      .single();

    if (fetchError || !drug) {
      res.status(404).json({
        success: false,
        error: 'Drug not found'
      });
      return;
    }

    let newStock: number;
    switch (adjustmentType) {
      case 'add':
        newStock = drug.current_stock + quantity;
        break;
      case 'subtract':
        newStock = drug.current_stock - quantity;
        if (newStock < 0) {
          res.status(400).json({
            success: false,
            error: 'Insufficient stock'
          });
          return;
        }
        break;
      case 'set':
        newStock = quantity;
        break;
      default:
        newStock = drug.current_stock;
    }

    // Update stock
    const updateData: Record<string, unknown> = {
      current_stock: newStock,
      updated_at: new Date().toISOString()
    };

    if (batchNumber) updateData.batch_number = batchNumber;
    if (expiryDate) updateData.expiry_date = expiryDate;

    await supabase
      .from('pharmacy_inventory')
      .update(updateData)
      .eq('id', drugId);

    // Log stock movement
    await supabase.from('stock_movements').insert({
      drug_id: drugId,
      movement_type: adjustmentType,
      quantity: quantity,
      previous_stock: drug.current_stock,
      new_stock: newStock,
      reason: reason,
      batch_number: batchNumber || null,
      created_by: req.user!.id,
      created_at: new Date().toISOString()
    });

    // Log audit
    await auditService.log({
      userId: req.user!.id,
      action: 'STOCK_ADJUSTMENT',
      tableName: 'pharmacy_inventory',
      recordId: drugId,
      oldData: { current_stock: drug.current_stock },
      newData: { current_stock: newStock, reason }
    });

    res.json({
      success: true,
      data: {
        drugId,
        previousStock: drug.current_stock,
        newStock,
        adjustmentType,
        quantity
      }
    });
  } catch (error) {
    logger.error('Adjust stock error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to adjust stock'
    });
  }
};

/**
 * Get Low Stock Alerts
 */
export const getLowStockAlerts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { data: drugs, error } = await supabase
      .from('pharmacy_inventory')
      .select('id, drug_code, name, current_stock, reorder_level, category')
      .eq('is_active', true)
      .filter('current_stock', 'lte', supabase.rpc('reorder_level'));

    if (error) {
      // Fallback query without RPC
      const { data: allDrugs, error: fallbackError } = await supabase
        .from('pharmacy_inventory')
        .select('id, drug_code, name, current_stock, reorder_level, category')
        .eq('is_active', true);

      if (fallbackError) throw fallbackError;

      const lowStockDrugs = allDrugs?.filter(d => d.current_stock <= d.reorder_level) || [];
      
      res.json({
        success: true,
        data: lowStockDrugs
      });
      return;
    }

    res.json({
      success: true,
      data: drugs
    });
  } catch (error) {
    logger.error('Get low stock alerts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch low stock alerts'
    });
  }
};

/**
 * Get Expiring Drugs
 */
export const getExpiringDrugs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { days = 30 } = req.query;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + Number(days));

    const { data: drugs, error } = await supabase
      .from('pharmacy_inventory')
      .select('id, drug_code, name, current_stock, expiry_date, batch_number, category')
      .eq('is_active', true)
      .gt('current_stock', 0)
      .lte('expiry_date', expiryDate.toISOString())
      .order('expiry_date');

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: drugs
    });
  } catch (error) {
    logger.error('Get expiring drugs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch expiring drugs'
    });
  }
};

/**
 * Get Drug Categories
 */
export const getDrugCategories = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('pharmacy_inventory')
      .select('category')
      .eq('is_active', true);

    if (error) {
      throw error;
    }

    const categories = [...new Set(data?.map(d => d.category))].sort();

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    logger.error('Get drug categories error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories'
    });
  }
};

// ==================== PRESCRIPTIONS ====================

/**
 * Create Prescription
 */
export const createPrescription = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const validation = createPrescriptionSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors
      });
      return;
    }

    const data = validation.data;

    // Create prescription
    const { data: prescription, error } = await supabase
      .from('prescriptions')
      .insert({
        visit_id: data.visitId,
        patient_id: data.patientId,
        doctor_id: req.user!.id,
        status: 'pending',
        notes: data.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Create prescription items
    const items = data.items.map(item => ({
      prescription_id: prescription.id,
      drug_id: item.drugId,
      drug_name: item.drugName,
      dosage: item.dosage,
      frequency: item.frequency,
      duration: item.duration,
      quantity: item.quantity,
      dispensed_quantity: 0,
      instructions: item.instructions || null
    }));

    await supabase.from('prescription_items').insert(items);

    // Log audit
    await auditService.logCreate(req.user!.id, 'prescriptions', prescription.id, {
      patientId: data.patientId,
      itemCount: items.length
    });

    res.status(201).json({
      success: true,
      data: prescription
    });
  } catch (error) {
    logger.error('Create prescription error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create prescription'
    });
  }
};

/**
 * Get Prescription by ID
 */
export const getPrescriptionById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: prescription, error } = await supabase
      .from('prescriptions')
      .select(`
        *,
        patient:patient_id(id, patient_number, first_name, last_name),
        doctor:doctor_id(first_name, last_name),
        items:prescription_items(*)
      `)
      .eq('id', id)
      .single();

    if (error || !prescription) {
      res.status(404).json({
        success: false,
        error: 'Prescription not found'
      });
      return;
    }

    res.json({
      success: true,
      data: prescription
    });
  } catch (error) {
    logger.error('Get prescription error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch prescription'
    });
  }
};

/**
 * Get Pending Prescriptions
 */
export const getPendingPrescriptions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { data: prescriptions, error } = await supabase
      .from('prescriptions')
      .select(`
        *,
        patient:patient_id(id, patient_number, first_name, last_name),
        doctor:doctor_id(first_name, last_name),
        items:prescription_items(*)
      `)
      .in('status', ['pending', 'partially_dispensed'])
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: prescriptions
    });
  } catch (error) {
    logger.error('Get pending prescriptions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending prescriptions'
    });
  }
};

/**
 * Dispense Prescription
 */
export const dispensePrescription = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const validation = dispensePrescriptionSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors
      });
      return;
    }

    const { prescriptionId, items } = validation.data;

    // Get prescription
    const { data: prescription, error: prescError } = await supabase
      .from('prescriptions')
      .select('*, items:prescription_items(*)')
      .eq('id', prescriptionId)
      .single();

    if (prescError || !prescription) {
      res.status(404).json({
        success: false,
        error: 'Prescription not found'
      });
      return;
    }

    // Update each item and reduce stock
    for (const item of items) {
      const prescItem = prescription.items.find((i: { id: string }) => i.id === item.prescriptionItemId);
      if (!prescItem) continue;

      // Update prescription item
      await supabase
        .from('prescription_items')
        .update({
          dispensed_quantity: prescItem.dispensed_quantity + item.dispensedQuantity
        })
        .eq('id', item.prescriptionItemId);

      // Reduce drug stock
      if (item.dispensedQuantity > 0) {
        const { data: drug } = await supabase
          .from('pharmacy_inventory')
          .select('current_stock')
          .eq('id', prescItem.drug_id)
          .single();

        if (drug) {
          await supabase
            .from('pharmacy_inventory')
            .update({
              current_stock: drug.current_stock - item.dispensedQuantity,
              updated_at: new Date().toISOString()
            })
            .eq('id', prescItem.drug_id);

          // Log stock movement
          await supabase.from('stock_movements').insert({
            drug_id: prescItem.drug_id,
            movement_type: 'dispense',
            quantity: item.dispensedQuantity,
            previous_stock: drug.current_stock,
            new_stock: drug.current_stock - item.dispensedQuantity,
            reason: `Dispensed for prescription ${prescriptionId}`,
            created_by: req.user!.id,
            created_at: new Date().toISOString()
          });
        }
      }
    }

    // Check if fully dispensed
    const { data: updatedItems } = await supabase
      .from('prescription_items')
      .select('quantity, dispensed_quantity')
      .eq('prescription_id', prescriptionId);

    const isFullyDispensed = updatedItems?.every(
      (item: { quantity: number; dispensed_quantity: number }) => 
        item.dispensed_quantity >= item.quantity
    );

    const isPartiallyDispensed = updatedItems?.some(
      (item: { dispensed_quantity: number }) => item.dispensed_quantity > 0
    );

    let newStatus = 'pending';
    if (isFullyDispensed) {
      newStatus = 'dispensed';
    } else if (isPartiallyDispensed) {
      newStatus = 'partially_dispensed';
    }

    await supabase
      .from('prescriptions')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', prescriptionId);

    res.json({
      success: true,
      message: 'Prescription dispensed successfully',
      data: { status: newStatus }
    });
  } catch (error) {
    logger.error('Dispense prescription error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to dispense prescription'
    });
  }
};