-- ============================================================
-- KENYA HOSPITAL MANAGEMENT SYSTEM - ROW LEVEL SECURITY
-- Version: 1.0.0
-- Description: RLS policies for secure data access
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE vitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosis_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_administration ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_test_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE drug_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE drugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mpesa_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE goods_received_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE grn_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumables ENABLE ROW LEVEL SECURITY;
ALTER TABLE wards ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER FUNCTIONS FOR RLS
-- ============================================================

-- Get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT r.name INTO user_role
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = auth.uid();
    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has specific permission
CREATE OR REPLACE FUNCTION has_permission(required_permission TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_permissions JSONB;
BEGIN
    SELECT r.permissions INTO user_permissions
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = auth.uid();
    
    RETURN user_permissions ? required_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is clinical staff (doctor, nurse)
CREATE OR REPLACE FUNCTION is_clinical_staff()
RETURNS BOOLEAN AS $$
DECLARE
    role TEXT;
BEGIN
    role := get_user_role();
    RETURN role IN ('doctor', 'nurse', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- USERS POLICIES
-- ============================================================

-- Users can view their own profile
CREATE POLICY users_select_own ON users
    FOR SELECT USING (id = auth.uid() OR is_admin());

-- Only admins can insert users
CREATE POLICY users_insert_admin ON users
    FOR INSERT WITH CHECK (is_admin());

-- Users can update their own profile, admins can update anyone
CREATE POLICY users_update_own ON users
    FOR UPDATE USING (id = auth.uid() OR is_admin());

-- Only admins can delete users
CREATE POLICY users_delete_admin ON users
    FOR DELETE USING (is_admin());

-- ============================================================
-- ROLES POLICIES
-- ============================================================

-- All authenticated users can view roles
CREATE POLICY roles_select_all ON roles
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only admins can manage roles
CREATE POLICY roles_insert_admin ON roles
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY roles_update_admin ON roles
    FOR UPDATE USING (is_admin());

CREATE POLICY roles_delete_admin ON roles
    FOR DELETE USING (is_admin());

-- ============================================================
-- PERMISSIONS POLICIES
-- ============================================================

-- All authenticated users can view permissions
CREATE POLICY permissions_select_all ON permissions
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- ============================================================
-- PATIENTS POLICIES
-- ============================================================

-- Clinical staff and receptionists can view patients
CREATE POLICY patients_select ON patients
    FOR SELECT USING (
        has_permission('patients.read') OR 
        is_admin()
    );

-- Receptionists, clinical staff can create patients
CREATE POLICY patients_insert ON patients
    FOR INSERT WITH CHECK (
        has_permission('patients.write') OR 
        has_permission('patients.register') OR
        is_admin()
    );

-- Clinical staff and admins can update patients
CREATE POLICY patients_update ON patients
    FOR UPDATE USING (
        has_permission('patients.write') OR 
        is_admin()
    );

-- Only admins can delete patients (soft delete preferred)
CREATE POLICY patients_delete ON patients
    FOR DELETE USING (is_admin());

-- ============================================================
-- PATIENT DOCUMENTS POLICIES
-- ============================================================

CREATE POLICY patient_documents_select ON patient_documents
    FOR SELECT USING (
        has_permission('patients.read') OR 
        is_admin()
    );

CREATE POLICY patient_documents_insert ON patient_documents
    FOR INSERT WITH CHECK (
        has_permission('patients.write') OR 
        is_admin()
    );

CREATE POLICY patient_documents_update ON patient_documents
    FOR UPDATE USING (
        has_permission('patients.write') OR 
        is_admin()
    );

CREATE POLICY patient_documents_delete ON patient_documents
    FOR DELETE USING (is_admin());

-- ============================================================
-- VISITS POLICIES
-- ============================================================

CREATE POLICY visits_select ON visits
    FOR SELECT USING (
        has_permission('visits.read') OR 
        has_permission('patients.read') OR
        is_admin()
    );

CREATE POLICY visits_insert ON visits
    FOR INSERT WITH CHECK (
        has_permission('visits.write') OR 
        has_permission('appointments.write') OR
        is_admin()
    );

CREATE POLICY visits_update ON visits
    FOR UPDATE USING (
        has_permission('visits.write') OR 
        is_clinical_staff() OR
        is_admin()
    );

CREATE POLICY visits_delete ON visits
    FOR DELETE USING (is_admin());

-- ============================================================
-- APPOINTMENTS POLICIES
-- ============================================================

CREATE POLICY appointments_select ON appointments
    FOR SELECT USING (
        has_permission('appointments.read') OR 
        doctor_id = auth.uid() OR
        is_admin()
    );

CREATE POLICY appointments_insert ON appointments
    FOR INSERT WITH CHECK (
        has_permission('appointments.write') OR 
        is_admin()
    );

CREATE POLICY appointments_update ON appointments
    FOR UPDATE USING (
        has_permission('appointments.write') OR 
        doctor_id = auth.uid() OR
        is_admin()
    );

CREATE POLICY appointments_delete ON appointments
    FOR DELETE USING (is_admin());

-- ============================================================
-- DOCTOR SCHEDULES POLICIES
-- ============================================================

-- All staff can view schedules
CREATE POLICY doctor_schedules_select ON doctor_schedules
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Doctors can manage their own, admins can manage all
CREATE POLICY doctor_schedules_insert ON doctor_schedules
    FOR INSERT WITH CHECK (
        doctor_id = auth.uid() OR 
        is_admin()
    );

CREATE POLICY doctor_schedules_update ON doctor_schedules
    FOR UPDATE USING (
        doctor_id = auth.uid() OR 
        is_admin()
    );

CREATE POLICY doctor_schedules_delete ON doctor_schedules
    FOR DELETE USING (
        doctor_id = auth.uid() OR 
        is_admin()
    );

-- ============================================================
-- DOCTOR LEAVES POLICIES
-- ============================================================

CREATE POLICY doctor_leaves_select ON doctor_leaves
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY doctor_leaves_insert ON doctor_leaves
    FOR INSERT WITH CHECK (
        doctor_id = auth.uid() OR 
        is_admin()
    );

CREATE POLICY doctor_leaves_update ON doctor_leaves
    FOR UPDATE USING (
        doctor_id = auth.uid() OR 
        is_admin()
    );

CREATE POLICY doctor_leaves_delete ON doctor_leaves
    FOR DELETE USING (is_admin());

-- ============================================================
-- VITALS POLICIES
-- ============================================================

CREATE POLICY vitals_select ON vitals
    FOR SELECT USING (
        is_clinical_staff() OR 
        has_permission('vitals.read') OR
        is_admin()
    );

CREATE POLICY vitals_insert ON vitals
    FOR INSERT WITH CHECK (
        has_permission('vitals.write') OR 
        is_clinical_staff() OR
        is_admin()
    );

CREATE POLICY vitals_update ON vitals
    FOR UPDATE USING (
        has_permission('vitals.write') OR 
        is_admin()
    );

CREATE POLICY vitals_delete ON vitals
    FOR DELETE USING (is_admin());

-- ============================================================
-- MEDICAL RECORDS POLICIES
-- ============================================================

CREATE POLICY medical_records_select ON medical_records
    FOR SELECT USING (
        is_clinical_staff() OR 
        has_permission('medical_records.read') OR
        is_admin()
    );

CREATE POLICY medical_records_insert ON medical_records
    FOR INSERT WITH CHECK (
        has_permission('patients.write') OR 
        get_user_role() = 'doctor' OR
        is_admin()
    );

CREATE POLICY medical_records_update ON medical_records
    FOR UPDATE USING (
        doctor_id = auth.uid() OR 
        is_admin()
    );

CREATE POLICY medical_records_delete ON medical_records
    FOR DELETE USING (is_admin());

-- ============================================================
-- DIAGNOSIS CODES POLICIES
-- ============================================================

CREATE POLICY diagnosis_codes_select ON diagnosis_codes
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY diagnosis_codes_insert ON diagnosis_codes
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY diagnosis_codes_update ON diagnosis_codes
    FOR UPDATE USING (is_admin());

CREATE POLICY diagnosis_codes_delete ON diagnosis_codes
    FOR DELETE USING (is_admin());

-- ============================================================
-- CARE NOTES POLICIES
-- ============================================================

CREATE POLICY care_notes_select ON care_notes
    FOR SELECT USING (
        is_clinical_staff() OR 
        is_admin()
    );

CREATE POLICY care_notes_insert ON care_notes
    FOR INSERT WITH CHECK (
        get_user_role() = 'nurse' OR 
        is_clinical_staff() OR
        is_admin()
    );

CREATE POLICY care_notes_update ON care_notes
    FOR UPDATE USING (
        nurse_id = auth.uid() OR 
        is_admin()
    );

CREATE POLICY care_notes_delete ON care_notes
    FOR DELETE USING (is_admin());

-- ============================================================
-- MEDICATION ADMINISTRATION POLICIES
-- ============================================================

CREATE POLICY medication_admin_select ON medication_administration
    FOR SELECT USING (
        is_clinical_staff() OR 
        is_admin()
    );

CREATE POLICY medication_admin_insert ON medication_administration
    FOR INSERT WITH CHECK (
        get_user_role() = 'nurse' OR 
        is_admin()
    );

CREATE POLICY medication_admin_update ON medication_administration
    FOR UPDATE USING (
        administered_by = auth.uid() OR 
        is_admin()
    );

CREATE POLICY medication_admin_delete ON medication_administration
    FOR DELETE USING (is_admin());

-- ============================================================
-- LAB TEST CATALOG POLICIES
-- ============================================================

CREATE POLICY lab_test_catalog_select ON lab_test_catalog
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY lab_test_catalog_insert ON lab_test_catalog
    FOR INSERT WITH CHECK (
        get_user_role() = 'lab_tech' OR 
        is_admin()
    );

CREATE POLICY lab_test_catalog_update ON lab_test_catalog
    FOR UPDATE USING (
        get_user_role() = 'lab_tech' OR 
        is_admin()
    );

CREATE POLICY lab_test_catalog_delete ON lab_test_catalog
    FOR DELETE USING (is_admin());

-- ============================================================
-- LAB REQUESTS POLICIES
-- ============================================================

CREATE POLICY lab_requests_select ON lab_requests
    FOR SELECT USING (
        has_permission('lab.read') OR 
        requested_by = auth.uid() OR
        is_clinical_staff() OR
        is_admin()
    );

CREATE POLICY lab_requests_insert ON lab_requests
    FOR INSERT WITH CHECK (
        get_user_role() = 'doctor' OR 
        is_admin()
    );

CREATE POLICY lab_requests_update ON lab_requests
    FOR UPDATE USING (
        has_permission('lab.tests.write') OR 
        is_admin()
    );

CREATE POLICY lab_requests_delete ON lab_requests
    FOR DELETE USING (is_admin());

-- ============================================================
-- LAB REQUEST ITEMS POLICIES
-- ============================================================

CREATE POLICY lab_request_items_select ON lab_request_items
    FOR SELECT USING (
        has_permission('lab.read') OR 
        is_clinical_staff() OR
        is_admin()
    );

CREATE POLICY lab_request_items_insert ON lab_request_items
    FOR INSERT WITH CHECK (
        get_user_role() = 'doctor' OR 
        is_admin()
    );

CREATE POLICY lab_request_items_update ON lab_request_items
    FOR UPDATE USING (
        has_permission('lab.tests.write') OR 
        is_admin()
    );

CREATE POLICY lab_request_items_delete ON lab_request_items
    FOR DELETE USING (is_admin());

-- ============================================================
-- LAB SAMPLES POLICIES
-- ============================================================

CREATE POLICY lab_samples_select ON lab_samples
    FOR SELECT USING (
        has_permission('lab.read') OR 
        is_clinical_staff() OR
        is_admin()
    );

CREATE POLICY lab_samples_insert ON lab_samples
    FOR INSERT WITH CHECK (
        has_permission('lab.tests.write') OR 
        is_clinical_staff() OR
        is_admin()
    );

CREATE POLICY lab_samples_update ON lab_samples
    FOR UPDATE USING (
        has_permission('lab.tests.write') OR 
        is_admin()
    );

CREATE POLICY lab_samples_delete ON lab_samples
    FOR DELETE USING (is_admin());

-- ============================================================
-- LAB RESULTS POLICIES
-- ============================================================

CREATE POLICY lab_results_select ON lab_results
    FOR SELECT USING (
        has_permission('lab.read') OR 
        is_clinical_staff() OR
        is_admin()
    );

CREATE POLICY lab_results_insert ON lab_results
    FOR INSERT WITH CHECK (
        has_permission('lab.results.write') OR 
        is_admin()
    );

CREATE POLICY lab_results_update ON lab_results
    FOR UPDATE USING (
        has_permission('lab.results.write') OR 
        is_admin()
    );

CREATE POLICY lab_results_delete ON lab_results
    FOR DELETE USING (is_admin());

-- ============================================================
-- DRUG CATEGORIES POLICIES
-- ============================================================

CREATE POLICY drug_categories_select ON drug_categories
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY drug_categories_insert ON drug_categories
    FOR INSERT WITH CHECK (
        get_user_role() = 'pharmacist' OR 
        is_admin()
    );

CREATE POLICY drug_categories_update ON drug_categories
    FOR UPDATE USING (
        get_user_role() = 'pharmacist' OR 
        is_admin()
    );

CREATE POLICY drug_categories_delete ON drug_categories
    FOR DELETE USING (is_admin());

-- ============================================================
-- DRUGS POLICIES
-- ============================================================

CREATE POLICY drugs_select ON drugs
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY drugs_insert ON drugs
    FOR INSERT WITH CHECK (
        has_permission('drugs.write') OR 
        is_admin()
    );

CREATE POLICY drugs_update ON drugs
    FOR UPDATE USING (
        has_permission('drugs.write') OR 
        is_admin()
    );

CREATE POLICY drugs_delete ON drugs
    FOR DELETE USING (is_admin());

-- ============================================================
-- PHARMACY INVENTORY POLICIES
-- ============================================================

CREATE POLICY pharmacy_inventory_select ON pharmacy_inventory
    FOR SELECT USING (
        has_permission('drugs.read') OR 
        is_admin()
    );

CREATE POLICY pharmacy_inventory_insert ON pharmacy_inventory
    FOR INSERT WITH CHECK (
        has_permission('drugs.write') OR 
        is_admin()
    );

CREATE POLICY pharmacy_inventory_update ON pharmacy_inventory
    FOR UPDATE USING (
        has_permission('drugs.write') OR 
        is_admin()
    );

CREATE POLICY pharmacy_inventory_delete ON pharmacy_inventory
    FOR DELETE USING (is_admin());

-- ============================================================
-- STOCK MOVEMENTS POLICIES
-- ============================================================

CREATE POLICY stock_movements_select ON stock_movements
    FOR SELECT USING (
        has_permission('drugs.read') OR 
        is_admin()
    );

CREATE POLICY stock_movements_insert ON stock_movements
    FOR INSERT WITH CHECK (
        has_permission('drugs.write') OR 
        is_admin()
    );

-- Stock movements should be immutable
CREATE POLICY stock_movements_update ON stock_movements
    FOR UPDATE USING (is_admin());

CREATE POLICY stock_movements_delete ON stock_movements
    FOR DELETE USING (is_admin());

-- ============================================================
-- PRESCRIPTIONS POLICIES
-- ============================================================

CREATE POLICY prescriptions_select ON prescriptions
    FOR SELECT USING (
        has_permission('prescriptions.read') OR 
        prescribed_by = auth.uid() OR
        is_clinical_staff() OR
        is_admin()
    );

CREATE POLICY prescriptions_insert ON prescriptions
    FOR INSERT WITH CHECK (
        has_permission('prescriptions.write') OR 
        get_user_role() = 'doctor' OR
        is_admin()
    );

CREATE POLICY prescriptions_update ON prescriptions
    FOR UPDATE USING (
        has_permission('prescriptions.fulfill') OR 
        prescribed_by = auth.uid() OR
        is_admin()
    );

CREATE POLICY prescriptions_delete ON prescriptions
    FOR DELETE USING (is_admin());

-- ============================================================
-- PRESCRIPTION ITEMS POLICIES
-- ============================================================

CREATE POLICY prescription_items_select ON prescription_items
    FOR SELECT USING (
        has_permission('prescriptions.read') OR 
        is_clinical_staff() OR
        is_admin()
    );

CREATE POLICY prescription_items_insert ON prescription_items
    FOR INSERT WITH CHECK (
        has_permission('prescriptions.write') OR 
        get_user_role() = 'doctor' OR
        is_admin()
    );

CREATE POLICY prescription_items_update ON prescription_items
    FOR UPDATE USING (
        has_permission('prescriptions.fulfill') OR 
        is_admin()
    );

CREATE POLICY prescription_items_delete ON prescription_items
    FOR DELETE USING (is_admin());

-- ============================================================
-- SERVICE CATALOG POLICIES
-- ============================================================

CREATE POLICY service_catalog_select ON service_catalog
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY service_catalog_insert ON service_catalog
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY service_catalog_update ON service_catalog
    FOR UPDATE USING (is_admin());

CREATE POLICY service_catalog_delete ON service_catalog
    FOR DELETE USING (is_admin());

-- ============================================================
-- INVOICES POLICIES
-- ============================================================

CREATE POLICY invoices_select ON invoices
    FOR SELECT USING (
        has_permission('invoices.read') OR 
        is_admin()
    );

CREATE POLICY invoices_insert ON invoices
    FOR INSERT WITH CHECK (
        has_permission('invoices.write') OR 
        is_admin()
    );

CREATE POLICY invoices_update ON invoices
    FOR UPDATE USING (
        has_permission('invoices.write') OR 
        is_admin()
    );

CREATE POLICY invoices_delete ON invoices
    FOR DELETE USING (is_admin());

-- ============================================================
-- INVOICE ITEMS POLICIES
-- ============================================================

CREATE POLICY invoice_items_select ON invoice_items
    FOR SELECT USING (
        has_permission('invoices.read') OR 
        is_admin()
    );

CREATE POLICY invoice_items_insert ON invoice_items
    FOR INSERT WITH CHECK (
        has_permission('invoices.write') OR 
        is_admin()
    );

CREATE POLICY invoice_items_update ON invoice_items
    FOR UPDATE USING (
        has_permission('invoices.write') OR 
        is_admin()
    );

CREATE POLICY invoice_items_delete ON invoice_items
    FOR DELETE USING (is_admin());

-- ============================================================
-- PAYMENTS POLICIES
-- ============================================================

CREATE POLICY payments_select ON payments
    FOR SELECT USING (
        has_permission('invoices.read') OR 
        has_permission('mpesa.read') OR
        is_admin()
    );

CREATE POLICY payments_insert ON payments
    FOR INSERT WITH CHECK (
        has_permission('invoices.write') OR 
        is_admin()
    );

CREATE POLICY payments_update ON payments
    FOR UPDATE USING (
        has_permission('invoices.write') OR 
        is_admin()
    );

CREATE POLICY payments_delete ON payments
    FOR DELETE USING (is_admin());

-- ============================================================
-- MPESA TRANSACTIONS POLICIES
-- ============================================================

CREATE POLICY mpesa_transactions_select ON mpesa_transactions
    FOR SELECT USING (
        has_permission('mpesa.read') OR 
        is_admin()
    );

-- MPESA transactions are created by the callback (service role)
CREATE POLICY mpesa_transactions_insert ON mpesa_transactions
    FOR INSERT WITH CHECK (true); -- Service role bypasses RLS

CREATE POLICY mpesa_transactions_update ON mpesa_transactions
    FOR UPDATE USING (
        has_permission('invoices.write') OR 
        is_admin()
    );

CREATE POLICY mpesa_transactions_delete ON mpesa_transactions
    FOR DELETE USING (is_admin());

-- ============================================================
-- SUPPLIERS POLICIES
-- ============================================================

CREATE POLICY suppliers_select ON suppliers
    FOR SELECT USING (
        has_permission('suppliers.read') OR 
        is_admin()
    );

CREATE POLICY suppliers_insert ON suppliers
    FOR INSERT WITH CHECK (
        has_permission('suppliers.write') OR 
        is_admin()
    );

CREATE POLICY suppliers_update ON suppliers
    FOR UPDATE USING (
        has_permission('suppliers.write') OR 
        is_admin()
    );

CREATE POLICY suppliers_delete ON suppliers
    FOR DELETE USING (is_admin());

-- ============================================================
-- SUPPLIER ITEMS POLICIES
-- ============================================================

CREATE POLICY supplier_items_select ON supplier_items
    FOR SELECT USING (
        has_permission('suppliers.read') OR 
        is_admin()
    );

CREATE POLICY supplier_items_insert ON supplier_items
    FOR INSERT WITH CHECK (
        has_permission('suppliers.write') OR 
        is_admin()
    );

CREATE POLICY supplier_items_update ON supplier_items
    FOR UPDATE USING (
        has_permission('suppliers.write') OR 
        is_admin()
    );

CREATE POLICY supplier_items_delete ON supplier_items
    FOR DELETE USING (is_admin());

-- ============================================================
-- PURCHASE ORDERS POLICIES
-- ============================================================

CREATE POLICY purchase_orders_select ON purchase_orders
    FOR SELECT USING (
        has_permission('purchase_orders.read') OR 
        requested_by = auth.uid() OR
        is_admin()
    );

CREATE POLICY purchase_orders_insert ON purchase_orders
    FOR INSERT WITH CHECK (
        has_permission('purchase_orders.write') OR 
        is_admin()
    );

CREATE POLICY purchase_orders_update ON purchase_orders
    FOR UPDATE USING (
        has_permission('purchase_orders.write') OR 
        is_admin()
    );

CREATE POLICY purchase_orders_delete ON purchase_orders
    FOR DELETE USING (is_admin());

-- ============================================================
-- PURCHASE ORDER ITEMS POLICIES
-- ============================================================

CREATE POLICY purchase_order_items_select ON purchase_order_items
    FOR SELECT USING (
        has_permission('purchase_orders.read') OR 
        is_admin()
    );

CREATE POLICY purchase_order_items_insert ON purchase_order_items
    FOR INSERT WITH CHECK (
        has_permission('purchase_orders.write') OR 
        is_admin()
    );

CREATE POLICY purchase_order_items_update ON purchase_order_items
    FOR UPDATE USING (
        has_permission('purchase_orders.write') OR 
        is_admin()
    );

CREATE POLICY purchase_order_items_delete ON purchase_order_items
    FOR DELETE USING (is_admin());

-- ============================================================
-- GOODS RECEIVED NOTES POLICIES
-- ============================================================

CREATE POLICY grn_select ON goods_received_notes
    FOR SELECT USING (
        has_permission('inventory.read') OR 
        is_admin()
    );

CREATE POLICY grn_insert ON goods_received_notes
    FOR INSERT WITH CHECK (
        has_permission('inventory.write') OR 
        is_admin()
    );

CREATE POLICY grn_update ON goods_received_notes
    FOR UPDATE USING (
        has_permission('inventory.write') OR 
        is_admin()
    );

CREATE POLICY grn_delete ON goods_received_notes
    FOR DELETE USING (is_admin());

-- ============================================================
-- GRN ITEMS POLICIES
-- ============================================================

CREATE POLICY grn_items_select ON grn_items
    FOR SELECT USING (
        has_permission('inventory.read') OR 
        is_admin()
    );

CREATE POLICY grn_items_insert ON grn_items
    FOR INSERT WITH CHECK (
        has_permission('inventory.write') OR 
        is_admin()
    );

CREATE POLICY grn_items_update ON grn_items
    FOR UPDATE USING (
        has_permission('inventory.write') OR 
        is_admin()
    );

CREATE POLICY grn_items_delete ON grn_items
    FOR DELETE USING (is_admin());

-- ============================================================
-- ASSETS POLICIES
-- ============================================================

CREATE POLICY assets_select ON assets
    FOR SELECT USING (
        has_permission('inventory.read') OR 
        is_admin()
    );

CREATE POLICY assets_insert ON assets
    FOR INSERT WITH CHECK (
        has_permission('inventory.write') OR 
        is_admin()
    );

CREATE POLICY assets_update ON assets
    FOR UPDATE USING (
        has_permission('inventory.write') OR 
        is_admin()
    );

CREATE POLICY assets_delete ON assets
    FOR DELETE USING (is_admin());

-- ============================================================
-- CONSUMABLES POLICIES
-- ============================================================

CREATE POLICY consumables_select ON consumables
    FOR SELECT USING (
        has_permission('inventory.read') OR 
        is_admin()
    );

CREATE POLICY consumables_insert ON consumables
    FOR INSERT WITH CHECK (
        has_permission('inventory.write') OR 
        is_admin()
    );

CREATE POLICY consumables_update ON consumables
    FOR UPDATE USING (
        has_permission('inventory.write') OR 
        is_admin()
    );

CREATE POLICY consumables_delete ON consumables
    FOR DELETE USING (is_admin());

-- ============================================================
-- WARDS POLICIES
-- ============================================================

CREATE POLICY wards_select ON wards
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY wards_insert ON wards
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY wards_update ON wards
    FOR UPDATE USING (is_admin());

CREATE POLICY wards_delete ON wards
    FOR DELETE USING (is_admin());

-- ============================================================
-- BEDS POLICIES
-- ============================================================

CREATE POLICY beds_select ON beds
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY beds_insert ON beds
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY beds_update ON beds
    FOR UPDATE USING (
        is_clinical_staff() OR 
        is_admin()
    );

CREATE POLICY beds_delete ON beds
    FOR DELETE USING (is_admin());

-- ============================================================
-- AUDIT LOGS POLICIES
-- ============================================================

-- Audit logs are read-only and only admins can see them
CREATE POLICY audit_logs_select ON audit_logs
    FOR SELECT USING (is_admin());

-- Audit logs are created by the system
CREATE POLICY audit_logs_insert ON audit_logs
    FOR INSERT WITH CHECK (true);

-- Audit logs are immutable
CREATE POLICY audit_logs_update ON audit_logs
    FOR UPDATE USING (false);

CREATE POLICY audit_logs_delete ON audit_logs
    FOR DELETE USING (false);

-- ============================================================
-- NOTIFICATIONS POLICIES
-- ============================================================

-- Users can only see their own notifications
CREATE POLICY notifications_select ON notifications
    FOR SELECT USING (user_id = auth.uid() OR is_admin());

CREATE POLICY notifications_insert ON notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY notifications_update ON notifications
    FOR UPDATE USING (user_id = auth.uid() OR is_admin());

CREATE POLICY notifications_delete ON notifications
    FOR DELETE USING (user_id = auth.uid() OR is_admin());

-- ============================================================
-- SYSTEM SETTINGS POLICIES
-- ============================================================

-- Public settings can be viewed by anyone, others only by admins
CREATE POLICY system_settings_select ON system_settings
    FOR SELECT USING (is_public = true OR is_admin());

CREATE POLICY system_settings_insert ON system_settings
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY system_settings_update ON system_settings
    FOR UPDATE USING (is_admin());

CREATE POLICY system_settings_delete ON system_settings
    FOR DELETE USING (is_admin());

-- ============================================================
-- USER SESSIONS POLICIES
-- ============================================================

CREATE POLICY user_sessions_select ON user_sessions
    FOR SELECT USING (user_id = auth.uid() OR is_admin());

CREATE POLICY user_sessions_insert ON user_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY user_sessions_update ON user_sessions
    FOR UPDATE USING (user_id = auth.uid() OR is_admin());

CREATE POLICY user_sessions_delete ON user_sessions
    FOR DELETE USING (is_admin());

-- ============================================================
-- END OF RLS POLICIES
-- ============================================================