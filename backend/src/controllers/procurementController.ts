// ============================================
// Procurement Controller
// ============================================

import { Response } from 'express';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import auditService from '../services/auditService';
import { AuthenticatedRequest } from '../types';

// ==================== SUPPLIERS ====================

/**
 * Create Supplier
 */
export const createSupplier = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, contactPerson, email, phone, address, city, country, paymentTerms, taxPin } = req.body;

    if (!name || !phone) {
      res.status(400).json({
        success: false,
        error: 'Name and phone are required'
      });
      return;
    }

    // Generate supplier code
    const { count } = await supabase
      .from('suppliers')
      .select('*', { count: 'exact', head: true });

    const supplierCode = `SUP${String((count || 0) + 1).padStart(4, '0')}`;

    const { data: supplier, error } = await supabase
      .from('suppliers')
      .insert({
        supplier_code: supplierCode,
        name,
        contact_person: contactPerson || null,
        email: email || null,
        phone,
        address: address || null,
        city: city || null,
        country: country || 'Kenya',
        payment_terms: paymentTerms || null,
        tax_pin: taxPin || null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create supplier:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create supplier'
      });
      return;
    }

    await auditService.logCreate(req.user!.id, 'suppliers', supplier.id, {
      supplierCode,
      name
    });

    res.status(201).json({
      success: true,
      data: supplier
    });
  } catch (error) {
    logger.error('Create supplier error:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while creating supplier'
    });
  }
};

/**
 * Get Supplier by ID
 */
export const getSupplierById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: supplier, error } = await supabase
      .from('suppliers')
      .select(`
        *,
        purchase_orders:purchase_orders(id, po_number, status, total_amount, created_at)
      `)
      .eq('id', id)
      .single();

    if (error || !supplier) {
      res.status(404).json({
        success: false,
        error: 'Supplier not found'
      });
      return;
    }

    res.json({
      success: true,
      data: supplier
    });
  } catch (error) {
    logger.error('Get supplier error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch supplier'
    });
  }
};

/**
 * Update Supplier
 */
export const updateSupplier = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const data = req.body;

    const { data: existing, error: fetchError } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      res.status(404).json({
        success: false,
        error: 'Supplier not found'
      });
      return;
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    if (data.name) updateData.name = data.name;
    if (data.contactPerson !== undefined) updateData.contact_person = data.contactPerson;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone) updateData.phone = data.phone;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.country !== undefined) updateData.country = data.country;
    if (data.paymentTerms !== undefined) updateData.payment_terms = data.paymentTerms;
    if (data.taxPin !== undefined) updateData.tax_pin = data.taxPin;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;

    const { data: supplier, error } = await supabase
      .from('suppliers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    await auditService.logUpdate(req.user!.id, 'suppliers', id, existing, updateData);

    res.json({
      success: true,
      data: supplier
    });
  } catch (error) {
    logger.error('Update supplier error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update supplier'
    });
  }
};

/**
 * Get Suppliers (Paginated)
 */
export const getSuppliers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, search, isActive } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('suppliers')
      .select('*', { count: 'exact' });

    if (isActive !== undefined) {
      query = query.eq('is_active', isActive === 'true');
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,supplier_code.ilike.%${search}%,contact_person.ilike.%${search}%`);
    }

    const { data: suppliers, error, count } = await query
      .order('name')
      .range(offset, offset + Number(limit) - 1);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: suppliers,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Get suppliers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch suppliers'
    });
  }
};

/**
 * Delete Supplier (Soft Delete)
 */
export const deleteSupplier = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: existing, error: fetchError } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      res.status(404).json({
        success: false,
        error: 'Supplier not found'
      });
      return;
    }

    await supabase
      .from('suppliers')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    await auditService.logDelete(req.user!.id, 'suppliers', id, existing);

    res.json({
      success: true,
      message: 'Supplier deleted successfully'
    });
  } catch (error) {
    logger.error('Delete supplier error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete supplier'
    });
  }
};

// ==================== PURCHASE ORDERS ====================

/**
 * Create Purchase Order
 */
export const createPurchaseOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { supplierId, items, expectedDeliveryDate, notes } = req.body;

    if (!supplierId || !items || items.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Supplier ID and items are required'
      });
      return;
    }

    // Verify supplier exists
    const { data: supplier } = await supabase
      .from('suppliers')
      .select('id, name')
      .eq('id', supplierId)
      .eq('is_active', true)
      .single();

    if (!supplier) {
      res.status(400).json({
        success: false,
        error: 'Supplier not found or inactive'
      });
      return;
    }

    // Generate PO number
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    const { count } = await supabase
      .from('purchase_orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${year}-${month}-01`);

    const poNumber = `PO${year}${month}${String((count || 0) + 1).padStart(4, '0')}`;

    // Calculate totals
    let subtotal = 0;
    const processedItems = items.map((item: { quantity: number; unitPrice: number; drugId?: string; itemDescription: string }) => {
      const totalPrice = item.quantity * item.unitPrice;
      subtotal += totalPrice;
      return {
        drug_id: item.drugId || null,
        item_description: item.itemDescription,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: totalPrice,
        received_quantity: 0
      };
    });

    const tax = subtotal * 0.16; // 16% VAT
    const totalAmount = subtotal + tax;

    // Create purchase order
    const { data: purchaseOrder, error } = await supabase
      .from('purchase_orders')
      .insert({
        po_number: poNumber,
        supplier_id: supplierId,
        status: 'draft',
        subtotal,
        tax,
        total_amount: totalAmount,
        expected_delivery_date: expectedDeliveryDate || null,
        notes: notes || null,
        created_by: req.user!.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Create PO items
    const poItems = processedItems.map((item: Record<string, unknown>) => ({
      ...item,
      purchase_order_id: purchaseOrder.id
    }));

    await supabase.from('purchase_order_items').insert(poItems);

    await auditService.logCreate(req.user!.id, 'purchase_orders', purchaseOrder.id, {
      poNumber,
      supplierId,
      totalAmount
    });

    res.status(201).json({
      success: true,
      data: {
        ...purchaseOrder,
        items: poItems
      }
    });
  } catch (error) {
    logger.error('Create purchase order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create purchase order'
    });
  }
};

/**
 * Get Purchase Order by ID
 */
export const getPurchaseOrderById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: purchaseOrder, error } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        supplier:supplier_id(id, supplier_code, name, contact_person, phone, email),
        createdBy:created_by(first_name, last_name),
        approvedBy:approved_by(first_name, last_name),
        items:purchase_order_items(*)
      `)
      .eq('id', id)
      .single();

    if (error || !purchaseOrder) {
      res.status(404).json({
        success: false,
        error: 'Purchase order not found'
      });
      return;
    }

    res.json({
      success: true,
      data: purchaseOrder
    });
  } catch (error) {
    logger.error('Get purchase order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch purchase order'
    });
  }
};

/**
 * Update Purchase Order
 */
export const updatePurchaseOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const data = req.body;

    const { data: existing, error: fetchError } = await supabase
      .from('purchase_orders')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      res.status(404).json({
        success: false,
        error: 'Purchase order not found'
      });
      return;
    }

    // Only allow updates to draft or pending_approval orders
    if (!['draft', 'pending_approval'].includes(existing.status)) {
      res.status(400).json({
        success: false,
        error: 'Cannot update purchase order in current status'
      });
      return;
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    if (data.expectedDeliveryDate !== undefined) updateData.expected_delivery_date = data.expectedDeliveryDate;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const { data: purchaseOrder, error } = await supabase
      .from('purchase_orders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    await auditService.logUpdate(req.user!.id, 'purchase_orders', id, existing, updateData);

    res.json({
      success: true,
      data: purchaseOrder
    });
  } catch (error) {
    logger.error('Update purchase order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update purchase order'
    });
  }
};

/**
 * Get Purchase Orders (Paginated)
 */
export const getPurchaseOrders = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, status, supplierId, startDate, endDate } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('purchase_orders')
      .select(`
        *,
        supplier:supplier_id(id, name, supplier_code)
      `, { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    if (supplierId) {
      query = query.eq('supplier_id', supplierId);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: purchaseOrders, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: purchaseOrders,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Get purchase orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch purchase orders'
    });
  }
};

/**
 * Submit Purchase Order for Approval
 */
export const submitForApproval = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: purchaseOrder, error: fetchError } = await supabase
      .from('purchase_orders')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !purchaseOrder) {
      res.status(404).json({
        success: false,
        error: 'Purchase order not found'
      });
      return;
    }

    if (purchaseOrder.status !== 'draft') {
      res.status(400).json({
        success: false,
        error: 'Only draft orders can be submitted for approval'
      });
      return;
    }

    await supabase
      .from('purchase_orders')
      .update({
        status: 'pending_approval',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    await auditService.logUpdate(req.user!.id, 'purchase_orders', id,
      { status: 'draft' },
      { status: 'pending_approval' }
    );

    res.json({
      success: true,
      message: 'Purchase order submitted for approval'
    });
  } catch (error) {
    logger.error('Submit for approval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit purchase order'
    });
  }
};

/**
 * Approve Purchase Order
 */
export const approvePurchaseOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: purchaseOrder, error: fetchError } = await supabase
      .from('purchase_orders')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !purchaseOrder) {
      res.status(404).json({
        success: false,
        error: 'Purchase order not found'
      });
      return;
    }

    if (purchaseOrder.status !== 'pending_approval') {
      res.status(400).json({
        success: false,
        error: 'Only pending orders can be approved'
      });
      return;
    }

    await supabase
      .from('purchase_orders')
      .update({
        status: 'approved',
        approved_by: req.user!.id,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    await auditService.logUpdate(req.user!.id, 'purchase_orders', id,
      { status: 'pending_approval' },
      { status: 'approved', approvedBy: req.user!.id }
    );

    res.json({
      success: true,
      message: 'Purchase order approved'
    });
  } catch (error) {
    logger.error('Approve purchase order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve purchase order'
    });
  }
};

/**
 * Reject Purchase Order
 */
export const rejectPurchaseOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const { data: purchaseOrder, error: fetchError } = await supabase
      .from('purchase_orders')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !purchaseOrder) {
      res.status(404).json({
        success: false,
        error: 'Purchase order not found'
      });
      return;
    }

    if (purchaseOrder.status !== 'pending_approval') {
      res.status(400).json({
        success: false,
        error: 'Only pending orders can be rejected'
      });
      return;
    }

    await supabase
      .from('purchase_orders')
      .update({
        status: 'cancelled',
        notes: `${purchaseOrder.notes || ''}\n\nRejected: ${reason || 'No reason provided'}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    await auditService.logUpdate(req.user!.id, 'purchase_orders', id,
      { status: 'pending_approval' },
      { status: 'cancelled', reason }
    );

    res.json({
      success: true,
      message: 'Purchase order rejected'
    });
  } catch (error) {
    logger.error('Reject purchase order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject purchase order'
    });
  }
};

/**
 * Mark Purchase Order as Ordered
 */
export const markAsOrdered = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: purchaseOrder, error: fetchError } = await supabase
      .from('purchase_orders')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !purchaseOrder) {
      res.status(404).json({
        success: false,
        error: 'Purchase order not found'
      });
      return;
    }

    if (purchaseOrder.status !== 'approved') {
      res.status(400).json({
        success: false,
        error: 'Only approved orders can be marked as ordered'
      });
      return;
    }

    await supabase
      .from('purchase_orders')
      .update({
        status: 'ordered',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    res.json({
      success: true,
      message: 'Purchase order marked as ordered'
    });
  } catch (error) {
    logger.error('Mark as ordered error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update purchase order'
    });
  }
};

/**
 * Receive Purchase Order Items
 */
export const receiveItems = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { items } = req.body;

    if (!items || items.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Items are required'
      });
      return;
    }

    const { data: purchaseOrder, error: fetchError } = await supabase
      .from('purchase_orders')
      .select('*, items:purchase_order_items(*)')
      .eq('id', id)
      .single();

    if (fetchError || !purchaseOrder) {
      res.status(404).json({
        success: false,
        error: 'Purchase order not found'
      });
      return;
    }

    if (!['ordered', 'partially_received'].includes(purchaseOrder.status)) {
      res.status(400).json({
        success: false,
        error: 'Cannot receive items for this order'
      });
      return;
    }

    // Update each item
    for (const item of items) {
      const poItem = purchaseOrder.items.find((i: { id: string }) => i.id === item.itemId);
      if (!poItem) continue;

      const newReceivedQty = poItem.received_quantity + item.receivedQuantity;

      await supabase
        .from('purchase_order_items')
        .update({ received_quantity: newReceivedQty })
        .eq('id', item.itemId);

      // Update pharmacy inventory if drug_id exists
      if (poItem.drug_id && item.receivedQuantity > 0) {
        const { data: drug } = await supabase
          .from('pharmacy_inventory')
          .select('current_stock')
          .eq('id', poItem.drug_id)
          .single();

        if (drug) {
          await supabase
            .from('pharmacy_inventory')
            .update({
              current_stock: drug.current_stock + item.receivedQuantity,
              updated_at: new Date().toISOString()
            })
            .eq('id', poItem.drug_id);

          // Log stock movement
          await supabase.from('stock_movements').insert({
            drug_id: poItem.drug_id,
            movement_type: 'receive',
            quantity: item.receivedQuantity,
            previous_stock: drug.current_stock,
            new_stock: drug.current_stock + item.receivedQuantity,
            reason: `Received from PO ${purchaseOrder.po_number}`,
            created_by: req.user!.id,
            created_at: new Date().toISOString()
          });
        }
      }
    }

    // Check if fully received
    const { data: updatedItems } = await supabase
      .from('purchase_order_items')
      .select('quantity, received_quantity')
      .eq('purchase_order_id', id);

    const isFullyReceived = updatedItems?.every(
      (item: { quantity: number; received_quantity: number }) =>
        item.received_quantity >= item.quantity
    );

    const newStatus = isFullyReceived ? 'received' : 'partially_received';

    await supabase
      .from('purchase_orders')
      .update({
        status: newStatus,
        received_date: isFullyReceived ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    await auditService.log({
      userId: req.user!.id,
      action: 'RECEIVE_ITEMS',
      tableName: 'purchase_orders',
      recordId: id,
      newData: { items, newStatus }
    });

    res.json({
      success: true,
      message: 'Items received successfully',
      data: { status: newStatus }
    });
  } catch (error) {
    logger.error('Receive items error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to receive items'
    });
  }
};

/**
 * Cancel Purchase Order
 */
export const cancelPurchaseOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const { data: purchaseOrder, error: fetchError } = await supabase
      .from('purchase_orders')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !purchaseOrder) {
      res.status(404).json({
        success: false,
        error: 'Purchase order not found'
      });
      return;
    }

    if (['received', 'cancelled'].includes(purchaseOrder.status)) {
      res.status(400).json({
        success: false,
        error: 'Cannot cancel this purchase order'
      });
      return;
    }

    await supabase
      .from('purchase_orders')
      .update({
        status: 'cancelled',
        notes: `${purchaseOrder.notes || ''}\n\nCancelled: ${reason || 'No reason provided'}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    await auditService.logUpdate(req.user!.id, 'purchase_orders', id,
      { status: purchaseOrder.status },
      { status: 'cancelled', reason }
    );

    res.json({
      success: true,
      message: 'Purchase order cancelled'
    });
  } catch (error) {
    logger.error('Cancel purchase order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel purchase order'
    });
  }
};

/**
 * Get Pending Purchase Orders
 */
export const getPendingPurchaseOrders = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { data: purchaseOrders, error } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        supplier:supplier_id(id, name, supplier_code),
        createdBy:created_by(first_name, last_name)
      `)
      .in('status', ['pending_approval', 'approved', 'ordered', 'partially_received'])
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: purchaseOrders
    });
  } catch (error) {
    logger.error('Get pending purchase orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending purchase orders'
    });
  }
};

/**
 * Get Procurement Statistics
 */
export const getStatistics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const end = endDate || new Date().toISOString();

    // Get PO stats
    const { data: purchaseOrders } = await supabase
      .from('purchase_orders')
      .select('status, total_amount')
      .gte('created_at', start)
      .lte('created_at', end);

    // Get supplier count
    const { count: supplierCount } = await supabase
      .from('suppliers')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    const stats = {
      totalPurchaseOrders: purchaseOrders?.length || 0,
      totalValue: purchaseOrders?.reduce((sum, po) => sum + po.total_amount, 0) || 0,
      pendingApproval: purchaseOrders?.filter(po => po.status === 'pending_approval').length || 0,
      ordered: purchaseOrders?.filter(po => po.status === 'ordered').length || 0,
      received: purchaseOrders?.filter(po => po.status === 'received').length || 0,
      activeSuppliers: supplierCount || 0
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Get statistics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics'
    });
  }
};