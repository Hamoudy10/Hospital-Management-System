-- ============================================================
-- KENYA HOSPITAL MANAGEMENT SYSTEM - DATABASE FUNCTIONS
-- Version: 1.0.0
-- Description: Stored procedures and functions
-- ============================================================

-- ============================================================
-- NUMBER GENERATION FUNCTIONS
-- ============================================================

-- Generate hospital number for new patients
CREATE OR REPLACE FUNCTION generate_hospital_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    year_suffix TEXT;
BEGIN
    year_suffix := TO_CHAR(NOW(), 'YY');
    new_number := 'P' || year_suffix || LPAD(nextval('patient_number_seq')::TEXT, 6, '0');
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Generate visit number
CREATE OR REPLACE FUNCTION generate_visit_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    date_part TEXT;
BEGIN
    date_part := TO_CHAR(NOW(), 'YYMMDD');
    new_number := 'V' || date_part || LPAD(nextval('visit_number_seq')::TEXT, 4, '0');
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Generate appointment number
CREATE OR REPLACE FUNCTION generate_appointment_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    date_part TEXT;
BEGIN
    date_part := TO_CHAR(NOW(), 'YYMMDD');
    new_number := 'A' || date_part || LPAD(nextval('appointment_number_seq')::TEXT, 4, '0');
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    year_month TEXT;
BEGIN
    year_month := TO_CHAR(NOW(), 'YYMM');
    new_number := 'INV' || year_month || LPAD(nextval('invoice_number_seq')::TEXT, 5, '0');
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Generate payment number
CREATE OR REPLACE FUNCTION generate_payment_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    date_part TEXT;
BEGIN
    date_part := TO_CHAR(NOW(), 'YYMMDD');
    new_number := 'PAY' || date_part || LPAD(nextval('payment_number_seq')::TEXT, 4, '0');
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Generate lab request number
CREATE OR REPLACE FUNCTION generate_lab_request_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    date_part TEXT;
BEGIN
    date_part := TO_CHAR(NOW(), 'YYMMDD');
    new_number := 'LAB' || date_part || LPAD(nextval('lab_request_number_seq')::TEXT, 4, '0');
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Generate lab result number
CREATE OR REPLACE FUNCTION generate_lab_result_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    date_part TEXT;
BEGIN
    date_part := TO_CHAR(NOW(), 'YYMMDD');
    new_number := 'RES' || date_part || LPAD(nextval('lab_result_number_seq')::TEXT, 4, '0');
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Generate lab sample number
CREATE OR REPLACE FUNCTION generate_sample_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    date_part TEXT;
BEGIN
    date_part := TO_CHAR(NOW(), 'YYMMDD');
    new_number := 'SMP' || date_part || LPAD(nextval('lab_sample_number_seq')::TEXT, 4, '0');
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Generate prescription number
CREATE OR REPLACE FUNCTION generate_prescription_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    date_part TEXT;
BEGIN
    date_part := TO_CHAR(NOW(), 'YYMMDD');
    new_number := 'RX' || date_part || LPAD(nextval('prescription_number_seq')::TEXT, 4, '0');
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Generate purchase order number
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    year_month TEXT;
BEGIN
    year_month := TO_CHAR(NOW(), 'YYMM');
    new_number := 'PO' || year_month || LPAD(nextval('po_number_seq')::TEXT, 4, '0');
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Generate GRN number
CREATE OR REPLACE FUNCTION generate_grn_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    date_part TEXT;
BEGIN
    date_part := TO_CHAR(NOW(), 'YYMMDD');
    new_number := 'GRN' || date_part || LPAD(nextval('grn_number_seq')::TEXT, 4, '0');
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGERS FOR AUTO-GENERATING NUMBERS
-- ============================================================

-- Auto-generate hospital number for patients
CREATE OR REPLACE FUNCTION set_patient_hospital_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.hospital_number IS NULL OR NEW.hospital_number = '' THEN
        NEW.hospital_number := generate_hospital_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_patient_hospital_number
    BEFORE INSERT ON patients
    FOR EACH ROW
    EXECUTE FUNCTION set_patient_hospital_number();

-- Auto-generate visit number
CREATE OR REPLACE FUNCTION set_visit_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.visit_number IS NULL OR NEW.visit_number = '' THEN
        NEW.visit_number := generate_visit_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_visit_number
    BEFORE INSERT ON visits
    FOR EACH ROW
    EXECUTE FUNCTION set_visit_number();

-- Auto-generate appointment number
CREATE OR REPLACE FUNCTION set_appointment_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.appointment_number IS NULL OR NEW.appointment_number = '' THEN
        NEW.appointment_number := generate_appointment_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_appointment_number
    BEFORE INSERT ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION set_appointment_number();

-- Auto-generate invoice number
CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
        NEW.invoice_number := generate_invoice_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_invoice_number
    BEFORE INSERT ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION set_invoice_number();

-- Auto-generate payment number
CREATE OR REPLACE FUNCTION set_payment_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.payment_number IS NULL OR NEW.payment_number = '' THEN
        NEW.payment_number := generate_payment_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_payment_number
    BEFORE INSERT ON payments
    FOR EACH ROW
    EXECUTE FUNCTION set_payment_number();

-- Auto-generate lab request number
CREATE OR REPLACE FUNCTION set_lab_request_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.request_number IS NULL OR NEW.request_number = '' THEN
        NEW.request_number := generate_lab_request_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_lab_request_number
    BEFORE INSERT ON lab_requests
    FOR EACH ROW
    EXECUTE FUNCTION set_lab_request_number();

-- Auto-generate lab result number
CREATE OR REPLACE FUNCTION set_lab_result_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.result_number IS NULL OR NEW.result_number = '' THEN
        NEW.result_number := generate_lab_result_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_lab_result_number
    BEFORE INSERT ON lab_results
    FOR EACH ROW
    EXECUTE FUNCTION set_lab_result_number();

-- Auto-generate sample number
CREATE OR REPLACE FUNCTION set_sample_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.sample_number IS NULL OR NEW.sample_number = '' THEN
        NEW.sample_number := generate_sample_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_sample_number
    BEFORE INSERT ON lab_samples
    FOR EACH ROW
    EXECUTE FUNCTION set_sample_number();

-- Auto-generate prescription number
CREATE OR REPLACE FUNCTION set_prescription_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.prescription_number IS NULL OR NEW.prescription_number = '' THEN
        NEW.prescription_number := generate_prescription_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_prescription_number
    BEFORE INSERT ON prescriptions
    FOR EACH ROW
    EXECUTE FUNCTION set_prescription_number();

-- Auto-generate PO number
CREATE OR REPLACE FUNCTION set_po_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.po_number IS NULL OR NEW.po_number = '' THEN
        NEW.po_number := generate_po_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_po_number
    BEFORE INSERT ON purchase_orders
    FOR EACH ROW
    EXECUTE FUNCTION set_po_number();

-- Auto-generate GRN number
CREATE OR REPLACE FUNCTION set_grn_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.grn_number IS NULL OR NEW.grn_number = '' THEN
        NEW.grn_number := generate_grn_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_grn_number
    BEFORE INSERT ON goods_received_notes
    FOR EACH ROW
    EXECUTE FUNCTION set_grn_number();

-- ============================================================
-- INVOICE CALCULATION FUNCTIONS
-- ============================================================

-- Calculate invoice totals
CREATE OR REPLACE FUNCTION calculate_invoice_totals()
RETURNS TRIGGER AS $$
DECLARE
    v_subtotal DECIMAL(12,2);
    v_tax DECIMAL(12,2);
BEGIN
    -- Calculate totals from invoice items
    SELECT 
        COALESCE(SUM(total_amount - tax_amount), 0),
        COALESCE(SUM(tax_amount), 0)
    INTO v_subtotal, v_tax
    FROM invoice_items
    WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
    AND is_active = true;
    
    -- Update the invoice
    UPDATE invoices
    SET 
        subtotal = v_subtotal,
        tax_amount = v_tax,
        total_amount = v_subtotal + v_tax - COALESCE(discount_amount, 0),
        balance_amount = v_subtotal + v_tax - COALESCE(discount_amount, 0) - COALESCE(paid_amount, 0)
    WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_invoice_totals
    AFTER INSERT OR UPDATE OR DELETE ON invoice_items
    FOR EACH ROW
    EXECUTE FUNCTION calculate_invoice_totals();

-- Update invoice paid amount
CREATE OR REPLACE FUNCTION update_invoice_paid_amount()
RETURNS TRIGGER AS $$
DECLARE
    v_paid DECIMAL(12,2);
    v_total DECIMAL(12,2);
BEGIN
    IF NEW.status = 'completed' THEN
        -- Calculate total paid
        SELECT COALESCE(SUM(amount), 0)
        INTO v_paid
        FROM payments
        WHERE invoice_id = NEW.invoice_id
        AND status = 'completed'
        AND is_active = true;
        
        -- Get invoice total
        SELECT total_amount INTO v_total
        FROM invoices WHERE id = NEW.invoice_id;
        
        -- Update invoice
        UPDATE invoices
        SET 
            paid_amount = v_paid,
            balance_amount = total_amount - v_paid,
            status = CASE 
                WHEN v_paid >= v_total THEN 'paid'
                WHEN v_paid > 0 THEN 'partial'
                ELSE 'pending'
            END
        WHERE id = NEW.invoice_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_invoice_paid
    AFTER INSERT OR UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_paid_amount();

-- ============================================================
-- PHARMACY INVENTORY FUNCTIONS
-- ============================================================

-- Update stock quantity and create movement record
CREATE OR REPLACE FUNCTION update_drug_stock(
    p_inventory_id UUID,
    p_quantity_change INTEGER,
    p_movement_type stock_movement_type,
    p_reference_type TEXT DEFAULT NULL,
    p_reference_id UUID DEFAULT NULL,
    p_reason TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_current_quantity INTEGER;
    v_new_quantity INTEGER;
BEGIN
    -- Get current quantity
    SELECT quantity INTO v_current_quantity
    FROM pharmacy_inventory
    WHERE id = p_inventory_id
    FOR UPDATE;
    
    -- Calculate new quantity
    v_new_quantity := v_current_quantity + p_quantity_change;
    
    -- Check if sufficient stock for reduction
    IF v_new_quantity < 0 THEN
        RAISE EXCEPTION 'Insufficient stock. Current: %, Requested: %', v_current_quantity, -p_quantity_change;
    END IF;
    
    -- Update inventory
    UPDATE pharmacy_inventory
    SET quantity = v_new_quantity, updated_at = NOW()
    WHERE id = p_inventory_id;
    
    -- Create movement record
    INSERT INTO stock_movements (
        inventory_id, movement_type, quantity,
        quantity_before, quantity_after,
        reference_type, reference_id, reason, performed_by
    ) VALUES (
        p_inventory_id, p_movement_type, ABS(p_quantity_change),
        v_current_quantity, v_new_quantity,
        p_reference_type, p_reference_id, p_reason, p_user_id
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Check for low stock items
CREATE OR REPLACE FUNCTION get_low_stock_drugs()
RETURNS TABLE (
    drug_id UUID,
    drug_code VARCHAR,
    drug_name VARCHAR,
    total_quantity BIGINT,
    reorder_level INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id as drug_id,
        d.drug_code,
        d.generic_name as drug_name,
        COALESCE(SUM(pi.quantity), 0) as total_quantity,
        d.reorder_level
    FROM drugs d
    LEFT JOIN pharmacy_inventory pi ON d.id = pi.drug_id AND pi.is_active = true
    WHERE d.is_active = true
    GROUP BY d.id, d.drug_code, d.generic_name, d.reorder_level
    HAVING COALESCE(SUM(pi.quantity), 0) <= d.reorder_level;
END;
$$ LANGUAGE plpgsql;

-- Get expiring drugs
CREATE OR REPLACE FUNCTION get_expiring_drugs(days_ahead INTEGER DEFAULT 30)
RETURNS TABLE (
    inventory_id UUID,
    drug_id UUID,
    drug_code VARCHAR,
    drug_name VARCHAR,
    batch_number VARCHAR,
    quantity INTEGER,
    expiry_date DATE,
    days_to_expiry INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pi.id as inventory_id,
        d.id as drug_id,
        d.drug_code,
        d.generic_name as drug_name,
        pi.batch_number,
        pi.quantity,
        pi.expiry_date,
        (pi.expiry_date - CURRENT_DATE)::INTEGER as days_to_expiry
    FROM pharmacy_inventory pi
    JOIN drugs d ON pi.drug_id = d.id
    WHERE pi.is_active = true
    AND pi.quantity > 0
    AND pi.expiry_date <= (CURRENT_DATE + days_ahead)
    ORDER BY pi.expiry_date ASC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- AUDIT LOGGING FUNCTION
-- ============================================================

-- Create audit log entry
CREATE OR REPLACE FUNCTION create_audit_log(
    p_user_id UUID,
    p_action audit_action,
    p_table_name VARCHAR,
    p_record_id UUID,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO audit_logs (
        user_id, action, table_name, record_id,
        old_values, new_values, metadata
    ) VALUES (
        p_user_id, p_action, p_table_name, p_record_id,
        p_old_values, p_new_values, p_metadata
    )
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generic audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    v_action audit_action;
    v_old_data JSONB;
    v_new_data JSONB;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_action := 'create';
        v_new_data := to_jsonb(NEW);
        
        INSERT INTO audit_logs (
            user_id, action, table_name, record_id, new_values
        ) VALUES (
            auth.uid(), v_action, TG_TABLE_NAME, NEW.id, v_new_data
        );
        RETURN NEW;
        
    ELSIF TG_OP = 'UPDATE' THEN
        v_action := 'update';
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
        
        INSERT INTO audit_logs (
            user_id, action, table_name, record_id, old_values, new_values
        ) VALUES (
            auth.uid(), v_action, TG_TABLE_NAME, NEW.id, v_old_data, v_new_data
        );
        RETURN NEW;
        
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'delete';
        v_old_data := to_jsonb(OLD);
        
        INSERT INTO audit_logs (
            user_id, action, table_name, record_id, old_values
        ) VALUES (
            auth.uid(), v_action, TG_TABLE_NAME, OLD.id, v_old_data
        );
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to important tables
CREATE TRIGGER audit_patients
    AFTER INSERT OR UPDATE OR DELETE ON patients
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_medical_records
    AFTER INSERT OR UPDATE OR DELETE ON medical_records
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_invoices
    AFTER INSERT OR UPDATE OR DELETE ON invoices
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_payments
    AFTER INSERT OR UPDATE OR DELETE ON payments
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_prescriptions
    AFTER INSERT OR UPDATE OR DELETE ON prescriptions
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_lab_results
    AFTER INSERT OR UPDATE OR DELETE ON lab_results
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- ============================================================
-- MPESA PROCESSING FUNCTIONS
-- ============================================================

-- Process MPESA C2B callback
CREATE OR REPLACE FUNCTION process_mpesa_payment(
    p_transaction_id VARCHAR,
    p_amount DECIMAL,
    p_msisdn VARCHAR,
    p_bill_ref VARCHAR,
    p_raw_payload JSONB
)
RETURNS UUID AS $$
DECLARE
    v_mpesa_id UUID;
    v_patient_id UUID;
    v_invoice_id UUID;
BEGIN
    -- Check for duplicate transaction
    SELECT id INTO v_mpesa_id
    FROM mpesa_transactions
    WHERE transaction_id = p_transaction_id;
    
    IF v_mpesa_id IS NOT NULL THEN
        -- Return existing transaction ID (idempotent)
        RETURN v_mpesa_id;
    END IF;
    
    -- Try to match invoice by bill reference
    SELECT id, patient_id INTO v_invoice_id, v_patient_id
    FROM invoices
    WHERE invoice_number = p_bill_ref
    OR id::TEXT = p_bill_ref
    LIMIT 1;
    
    -- Insert MPESA transaction
    INSERT INTO mpesa_transactions (
        transaction_id, trans_amount, msisdn, 
        bill_ref_number, invoice_number,
        patient_id, invoice_id, raw_payload,
        status
    ) VALUES (
        p_transaction_id, p_amount, p_msisdn,
        p_bill_ref, p_bill_ref,
        v_patient_id, v_invoice_id, p_raw_payload,
        'completed'
    )
    RETURNING id INTO v_mpesa_id;
    
    -- If invoice found, create payment record
    IF v_invoice_id IS NOT NULL THEN
        INSERT INTO payments (
            invoice_id, patient_id, amount,
            payment_method, status,
            mpesa_transaction_id, mpesa_receipt_number,
            reference_number
        ) VALUES (
            v_invoice_id, v_patient_id, p_amount,
            'mpesa', 'completed',
            v_mpesa_id, p_transaction_id,
            p_transaction_id
        );
        
        -- Update MPESA transaction as allocated
        UPDATE mpesa_transactions
        SET is_allocated = true, allocated_amount = p_amount, processed_at = NOW()
        WHERE id = v_mpesa_id;
    END IF;
    
    RETURN v_mpesa_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- DASHBOARD STATISTICS FUNCTIONS
-- ============================================================

-- Get patient statistics
CREATE OR REPLACE FUNCTION get_patient_stats()
RETURNS TABLE (
    total_patients BIGINT,
    new_today BIGINT,
    new_this_month BIGINT,
    active_visits BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_patients,
        COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE)::BIGINT as new_today,
        COUNT(*) FILTER (WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE))::BIGINT as new_this_month,
        (SELECT COUNT(*)::BIGINT FROM visits WHERE status = 'active') as active_visits
    FROM patients
    WHERE is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Get appointment statistics for today
CREATE OR REPLACE FUNCTION get_today_appointment_stats()
RETURNS TABLE (
    total_appointments BIGINT,
    completed BIGINT,
    pending BIGINT,
    cancelled BIGINT,
    no_show BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_appointments,
        COUNT(*) FILTER (WHERE status = 'completed')::BIGINT as completed,
        COUNT(*) FILTER (WHERE status IN ('scheduled', 'confirmed', 'checked_in'))::BIGINT as pending,
        COUNT(*) FILTER (WHERE status = 'cancelled')::BIGINT as cancelled,
        COUNT(*) FILTER (WHERE status = 'no_show')::BIGINT as no_show
    FROM appointments
    WHERE scheduled_date = CURRENT_DATE
    AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Get revenue statistics
CREATE OR REPLACE FUNCTION get_revenue_stats(
    p_start_date DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE)::DATE,
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    total_invoiced DECIMAL,
    total_paid DECIMAL,
    total_pending DECIMAL,
    payment_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(total_amount), 0) as total_invoiced,
        COALESCE(SUM(paid_amount), 0) as total_paid,
        COALESCE(SUM(balance_amount), 0) as total_pending,
        (SELECT COUNT(*)::BIGINT FROM payments 
         WHERE DATE(created_at) BETWEEN p_start_date AND p_end_date 
         AND status = 'completed') as payment_count
    FROM invoices
    WHERE DATE(created_at) BETWEEN p_start_date AND p_end_date
    AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Get lab statistics
CREATE OR REPLACE FUNCTION get_lab_stats()
RETURNS TABLE (
    pending_tests BIGINT,
    in_progress BIGINT,
    completed_today BIGINT,
    pending_verification BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) FILTER (WHERE status = 'pending')::BIGINT as pending_tests,
        COUNT(*) FILTER (WHERE status = 'in_progress')::BIGINT as in_progress,
        COUNT(*) FILTER (WHERE status = 'completed' AND DATE(updated_at) = CURRENT_DATE)::BIGINT as completed_today,
        COUNT(*) FILTER (WHERE status = 'completed' AND verified_at IS NULL)::BIGINT as pending_verification
    FROM lab_results
    WHERE is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Get pharmacy statistics
CREATE OR REPLACE FUNCTION get_pharmacy_stats()
RETURNS TABLE (
    pending_prescriptions BIGINT,
    dispensed_today BIGINT,
    low_stock_count BIGINT,
    expiring_soon BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::BIGINT FROM prescriptions WHERE status = 'pending' AND is_active = true),
        (SELECT COUNT(*)::BIGINT FROM prescriptions WHERE status = 'dispensed' AND DATE(dispensed_at) = CURRENT_DATE AND is_active = true),
        (SELECT COUNT(*)::BIGINT FROM get_low_stock_drugs()),
        (SELECT COUNT(*)::BIGINT FROM get_expiring_drugs(30));
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- SEARCH FUNCTIONS
-- ============================================================

-- Search patients
CREATE OR REPLACE FUNCTION search_patients(
    p_query TEXT,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    hospital_number VARCHAR,
    full_name TEXT,
    phone VARCHAR,
    national_id VARCHAR,
    gender gender_type,
    age INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.hospital_number,
        CONCAT(p.first_name, ' ', COALESCE(p.middle_name || ' ', ''), p.last_name) as full_name,
        p.phone_primary,
        p.national_id,
        p.gender,
        EXTRACT(YEAR FROM AGE(p.date_of_birth))::INTEGER as age
    FROM patients p
    WHERE p.is_active = true
    AND (
        p.hospital_number ILIKE '%' || p_query || '%'
        OR p.national_id ILIKE '%' || p_query || '%'
        OR p.phone_primary ILIKE '%' || p_query || '%'
        OR p.first_name ILIKE '%' || p_query || '%'
        OR p.last_name ILIKE '%' || p_query || '%'
        OR CONCAT(p.first_name, ' ', p.last_name) ILIKE '%' || p_query || '%'
    )
    ORDER BY p.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- REPORT FUNCTIONS
-- ============================================================

-- Daily revenue report
CREATE OR REPLACE FUNCTION get_daily_revenue_report(p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
    payment_method payment_method,
    transaction_count BIGINT,
    total_amount DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.payment_method,
        COUNT(*)::BIGINT as transaction_count,
        SUM(p.amount) as total_amount
    FROM payments p
    WHERE DATE(p.created_at) = p_date
    AND p.status = 'completed'
    AND p.is_active = true
    GROUP BY p.payment_method
    ORDER BY total_amount DESC;
END;
$$ LANGUAGE plpgsql;

-- Department-wise patient count
CREATE OR REPLACE FUNCTION get_department_patient_stats(
    p_start_date DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE)::DATE,
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    department VARCHAR,
    patient_count BIGINT,
    visit_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.department,
        COUNT(DISTINCT v.patient_id)::BIGINT as patient_count,
        COUNT(v.id)::BIGINT as visit_count
    FROM visits v
    WHERE DATE(v.check_in_time) BETWEEN p_start_date AND p_end_date
    AND v.is_active = true
    AND v.department IS NOT NULL
    GROUP BY v.department
    ORDER BY visit_count DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- NOTIFICATION FUNCTIONS
-- ============================================================

-- Create notification
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_title VARCHAR,
    p_message TEXT,
    p_type VARCHAR DEFAULT 'info',
    p_link VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO notifications (user_id, title, message, type, link)
    VALUES (p_user_id, p_title, p_message, p_type, p_link)
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE notifications
    SET is_read = true, read_at = NOW()
    WHERE id = p_notification_id
    AND user_id = auth.uid();
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE notifications
    SET is_read = true, read_at = NOW()
    WHERE user_id = auth.uid()
    AND is_read = false;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- END OF FUNCTIONS
-- ============================================================