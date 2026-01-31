-- ============================================================
-- KENYA HOSPITAL MANAGEMENT SYSTEM - SEED DATA
-- Version: 1.0.0
-- Description: Sample data for testing and development
-- ============================================================

-- ============================================================
-- PERMISSIONS
-- ============================================================

INSERT INTO permissions (code, name, description, module) VALUES
-- Patient permissions
('patients.read', 'View Patients', 'View patient records', 'patients'),
('patients.write', 'Edit Patients', 'Create and edit patient records', 'patients'),
('patients.register', 'Register Patients', 'Register new patients', 'patients'),
('patients.delete', 'Delete Patients', 'Delete patient records', 'patients'),

-- Visit permissions
('visits.read', 'View Visits', 'View patient visits', 'visits'),
('visits.write', 'Manage Visits', 'Create and edit visits', 'visits'),

-- Appointment permissions
('appointments.read', 'View Appointments', 'View appointments', 'appointments'),
('appointments.write', 'Manage Appointments', 'Create and edit appointments', 'appointments'),

-- Vitals permissions
('vitals.read', 'View Vitals', 'View patient vitals', 'vitals'),
('vitals.write', 'Record Vitals', 'Record patient vitals', 'vitals'),

-- Medical records permissions
('medical_records.read', 'View Medical Records', 'View medical records', 'medical_records'),
('medical_records.write', 'Edit Medical Records', 'Create and edit medical records', 'medical_records'),

-- Prescriptions permissions
('prescriptions.read', 'View Prescriptions', 'View prescriptions', 'prescriptions'),
('prescriptions.write', 'Create Prescriptions', 'Create prescriptions', 'prescriptions'),
('prescriptions.fulfill', 'Fulfill Prescriptions', 'Dispense prescriptions', 'prescriptions'),

-- Lab permissions
('lab.read', 'View Lab Results', 'View lab tests and results', 'lab'),
('lab.tests.write', 'Manage Lab Tests', 'Create and process lab tests', 'lab'),
('lab.results.write', 'Enter Lab Results', 'Enter and verify lab results', 'lab'),

-- Pharmacy permissions
('drugs.read', 'View Drug Inventory', 'View drug catalog and inventory', 'pharmacy'),
('drugs.write', 'Manage Drug Inventory', 'Manage drug catalog and inventory', 'pharmacy'),

-- Billing permissions
('invoices.read', 'View Invoices', 'View billing and invoices', 'billing'),
('invoices.write', 'Manage Invoices', 'Create and edit invoices', 'billing'),
('mpesa.read', 'View MPESA Transactions', 'View MPESA payments', 'billing'),
('reports.financial', 'Financial Reports', 'Access financial reports', 'reports'),

-- Procurement permissions
('suppliers.read', 'View Suppliers', 'View supplier information', 'procurement'),
('suppliers.write', 'Manage Suppliers', 'Manage supplier information', 'procurement'),
('purchase_orders.read', 'View Purchase Orders', 'View purchase orders', 'procurement'),
('purchase_orders.write', 'Manage Purchase Orders', 'Create and manage purchase orders', 'procurement'),
('inventory.read', 'View Inventory', 'View general inventory', 'procurement'),
('inventory.write', 'Manage Inventory', 'Manage general inventory', 'procurement'),

-- Admin permissions
('admin.users', 'Manage Users', 'Create and manage user accounts', 'admin'),
('admin.roles', 'Manage Roles', 'Manage roles and permissions', 'admin'),
('admin.settings', 'System Settings', 'Manage system settings', 'admin'),
('admin.audit', 'View Audit Logs', 'View system audit logs', 'admin');

-- ============================================================
-- ROLES
-- ============================================================

INSERT INTO roles (name, display_name, description, permissions, is_system_role) VALUES
(
    'admin',
    'System Administrator',
    'Full system access and administration',
    '["patients.read", "patients.write", "patients.register", "patients.delete", "visits.read", "visits.write", "appointments.read", "appointments.write", "vitals.read", "vitals.write", "medical_records.read", "medical_records.write", "prescriptions.read", "prescriptions.write", "prescriptions.fulfill", "lab.read", "lab.tests.write", "lab.results.write", "drugs.read", "drugs.write", "invoices.read", "invoices.write", "mpesa.read", "reports.financial", "suppliers.read", "suppliers.write", "purchase_orders.read", "purchase_orders.write", "inventory.read", "inventory.write", "admin.users", "admin.roles", "admin.settings", "admin.audit"]'::jsonb,
    true
),
(
    'doctor',
    'Doctor',
    'Medical doctor with clinical access',
    '["patients.read", "patients.write", "visits.read", "visits.write", "appointments.read", "appointments.write", "vitals.read", "medical_records.read", "medical_records.write", "prescriptions.read", "prescriptions.write", "lab.read"]'::jsonb,
    true
),
(
    'nurse',
    'Nurse',
    'Nursing staff with clinical support access',
    '["patients.read", "visits.read", "visits.write", "appointments.read", "appointments.write", "vitals.read", "vitals.write", "medical_records.read", "prescriptions.read", "lab.read"]'::jsonb,
    true
),
(
    'receptionist',
    'Receptionist',
    'Front desk and registration staff',
    '["patients.read", "patients.register", "visits.read", "visits.write", "appointments.read", "appointments.write"]'::jsonb,
    true
),
(
    'accountant',
    'Accountant',
    'Billing and financial management',
    '["patients.read", "visits.read", "invoices.read", "invoices.write", "mpesa.read", "reports.financial"]'::jsonb,
    true
),
(
    'lab_tech',
    'Laboratory Technician',
    'Laboratory testing and results',
    '["patients.read", "lab.read", "lab.tests.write", "lab.results.write"]'::jsonb,
    true
),
(
    'pharmacist',
    'Pharmacist',
    'Pharmacy and drug dispensing',
    '["patients.read", "prescriptions.read", "prescriptions.fulfill", "drugs.read", "drugs.write"]'::jsonb,
    true
),
(
    'procurement',
    'Procurement Clerk',
    'Procurement and logistics management',
    '["suppliers.read", "suppliers.write", "purchase_orders.read", "purchase_orders.write", "inventory.read", "inventory.write", "drugs.read"]'::jsonb,
    true
);

-- ============================================================
-- DRUG CATEGORIES
-- ============================================================

INSERT INTO drug_categories (name, description) VALUES
('Antibiotics', 'Anti-bacterial medications'),
('Analgesics', 'Pain relief medications'),
('Antipyretics', 'Fever reducing medications'),
('Antihistamines', 'Allergy medications'),
('Antidiabetics', 'Diabetes management medications'),
('Antihypertensives', 'Blood pressure medications'),
('Vitamins & Supplements', 'Nutritional supplements'),
('Gastrointestinal', 'Digestive system medications'),
('Respiratory', 'Respiratory system medications'),
('Cardiovascular', 'Heart and circulatory medications'),
('Dermatological', 'Skin care medications'),
('Ophthalmic', 'Eye medications'),
('ENT', 'Ear, nose, and throat medications'),
('Psychiatric', 'Mental health medications'),
('Antimalarials', 'Malaria treatment and prevention');

-- ============================================================
-- SAMPLE DRUGS
-- ============================================================

INSERT INTO drugs (drug_code, generic_name, brand_name, category_id, form, strength, unit, selling_price, reorder_level, requires_prescription) VALUES
('DRG001', 'Paracetamol', 'Panadol', (SELECT id FROM drug_categories WHERE name = 'Analgesics'), 'tablet', '500mg', 'tablet', 5.00, 100, false),
('DRG002', 'Ibuprofen', 'Brufen', (SELECT id FROM drug_categories WHERE name = 'Analgesics'), 'tablet', '400mg', 'tablet', 10.00, 100, false),
('DRG003', 'Amoxicillin', 'Amoxil', (SELECT id FROM drug_categories WHERE name = 'Antibiotics'), 'capsule', '500mg', 'capsule', 25.00, 50, true),
('DRG004', 'Metformin', 'Glucophage', (SELECT id FROM drug_categories WHERE name = 'Antidiabetics'), 'tablet', '500mg', 'tablet', 15.00, 100, true),
('DRG005', 'Amlodipine', 'Norvasc', (SELECT id FROM drug_categories WHERE name = 'Antihypertensives'), 'tablet', '5mg', 'tablet', 20.00, 100, true),
('DRG006', 'Omeprazole', 'Losec', (SELECT id FROM drug_categories WHERE name = 'Gastrointestinal'), 'capsule', '20mg', 'capsule', 30.00, 50, true),
('DRG007', 'Cetirizine', 'Zyrtec', (SELECT id FROM drug_categories WHERE name = 'Antihistamines'), 'tablet', '10mg', 'tablet', 15.00, 50, false),
('DRG008', 'Artemether-Lumefantrine', 'Coartem', (SELECT id FROM drug_categories WHERE name = 'Antimalarials'), 'tablet', '20/120mg', 'tablet', 150.00, 100, true),
('DRG009', 'Salbutamol', 'Ventolin', (SELECT id FROM drug_categories WHERE name = 'Respiratory'), 'inhaler', '100mcg', 'puff', 500.00, 20, true),
('DRG010', 'Vitamin C', 'Celin', (SELECT id FROM drug_categories WHERE name = 'Vitamins & Supplements'), 'tablet', '500mg', 'tablet', 10.00, 100, false);

-- ============================================================
-- LAB TEST CATALOG
-- ============================================================

INSERT INTO lab_test_catalog (test_code, test_name, category, description, sample_type, turnaround_time, price, reference_ranges) VALUES
('CBC', 'Complete Blood Count', 'Hematology', 'Full blood count with differential', 'Blood (EDTA)', '2 hours', 800.00, 
    '{"wbc": {"min": 4.0, "max": 11.0, "unit": "x10^9/L"}, "rbc": {"min": 4.0, "max": 6.0, "unit": "x10^12/L"}, "hemoglobin": {"min": 12.0, "max": 17.0, "unit": "g/dL"}, "hematocrit": {"min": 36, "max": 50, "unit": "%"}, "platelets": {"min": 150, "max": 400, "unit": "x10^9/L"}}'::jsonb),
('LFT', 'Liver Function Tests', 'Chemistry', 'Comprehensive liver panel', 'Blood (Serum)', '4 hours', 1500.00,
    '{"alt": {"min": 7, "max": 56, "unit": "U/L"}, "ast": {"min": 10, "max": 40, "unit": "U/L"}, "alp": {"min": 44, "max": 147, "unit": "U/L"}, "bilirubin": {"min": 0.1, "max": 1.2, "unit": "mg/dL"}}'::jsonb),
('RFT', 'Renal Function Tests', 'Chemistry', 'Kidney function panel', 'Blood (Serum)', '4 hours', 1200.00,
    '{"creatinine": {"min": 0.6, "max": 1.2, "unit": "mg/dL"}, "urea": {"min": 7, "max": 20, "unit": "mg/dL"}, "bun": {"min": 6, "max": 20, "unit": "mg/dL"}}'::jsonb),
('FBS', 'Fasting Blood Sugar', 'Chemistry', 'Fasting glucose level', 'Blood (Fluoride)', '1 hour', 300.00,
    '{"glucose": {"min": 70, "max": 100, "unit": "mg/dL"}}'::jsonb),
('RBS', 'Random Blood Sugar', 'Chemistry', 'Random glucose level', 'Blood (Fluoride)', '1 hour', 300.00,
    '{"glucose": {"min": 70, "max": 140, "unit": "mg/dL"}}'::jsonb),
('HBA1C', 'Glycated Hemoglobin', 'Chemistry', 'Diabetes control marker', 'Blood (EDTA)', '24 hours', 1500.00,
    '{"hba1c": {"min": 4.0, "max": 5.6, "unit": "%"}}'::jsonb),
('LIPID', 'Lipid Profile', 'Chemistry', 'Cholesterol and triglycerides', 'Blood (Serum)', '4 hours', 1200.00,
    '{"cholesterol": {"min": 0, "max": 200, "unit": "mg/dL"}, "triglycerides": {"min": 0, "max": 150, "unit": "mg/dL"}, "hdl": {"min": 40, "max": 60, "unit": "mg/dL"}, "ldl": {"min": 0, "max": 100, "unit": "mg/dL"}}'::jsonb),
('UA', 'Urinalysis', 'Urinalysis', 'Complete urine analysis', 'Urine', '2 hours', 500.00,
    '{"ph": {"min": 4.5, "max": 8.0, "unit": ""}, "specific_gravity": {"min": 1.005, "max": 1.030, "unit": ""}}'::jsonb),
('MALARIA', 'Malaria Rapid Test', 'Parasitology', 'Rapid diagnostic test for malaria', 'Blood (Finger prick)', '30 mins', 400.00, '{}'::jsonb),
('WIDAL', 'Widal Test', 'Serology', 'Typhoid antibody test', 'Blood (Serum)', '2 hours', 600.00, '{}'::jsonb),
('HIV', 'HIV Screening', 'Serology', 'HIV antibody rapid test', 'Blood (Serum)', '30 mins', 500.00, '{}'::jsonb),
('HEPB', 'Hepatitis B Surface Antigen', 'Serology', 'HBsAg screening', 'Blood (Serum)', '30 mins', 600.00, '{}'::jsonb),
('HEPC', 'Hepatitis C Antibody', 'Serology', 'Anti-HCV screening', 'Blood (Serum)', '30 mins', 800.00, '{}'::jsonb),
('PREG', 'Pregnancy Test', 'Serology', 'urine or blood HCG', 'Urine/Blood', '15 mins', 300.00, '{}'::jsonb),
('STOOL', 'Stool Analysis', 'Microbiology', 'Stool microscopy and culture', 'Stool', '24 hours', 500.00, '{}'::jsonb);

-- ============================================================
-- SERVICE CATALOG
-- ============================================================

INSERT INTO service_catalog (service_code, name, category, description, price) VALUES
('CONS001', 'General Consultation', 'Consultation', 'General practitioner consultation', 500.00),
('CONS002', 'Specialist Consultation', 'Consultation', 'Specialist doctor consultation', 1500.00),
('CONS003', 'Emergency Consultation', 'Consultation', 'Emergency room consultation', 2000.00),
('PROC001', 'Wound Dressing', 'Procedure', 'Minor wound cleaning and dressing', 300.00),
('PROC002', 'Injection Administration', 'Procedure', 'Intramuscular or subcutaneous injection', 100.00),
('PROC003', 'IV Cannulation', 'Procedure', 'Intravenous line insertion', 500.00),
('PROC004', 'Suturing', 'Procedure', 'Wound suturing (minor)', 1000.00),
('PROC005', 'Nebulization', 'Procedure', 'Bronchodilator nebulization', 300.00),
('WARD001', 'General Ward - Per Day', 'Ward', 'General ward bed charges per day', 2000.00),
('WARD002', 'Private Ward - Per Day', 'Ward', 'Private room charges per day', 5000.00),
('WARD003', 'ICU - Per Day', 'Ward', 'Intensive care unit per day', 15000.00),
('NURS001', 'Nursing Care - Per Day', 'Nursing', 'General nursing care per day', 1000.00),
('REG001', 'Registration Fee', 'Registration', 'New patient registration', 100.00),
('FILE001', 'File Retrieval', 'Registration', 'Patient file retrieval fee', 50.00);

-- ============================================================
-- DIAGNOSIS CODES (ICD-10 Sample)
-- ============================================================

INSERT INTO diagnosis_codes (code, description, category) VALUES
('A01.0', 'Typhoid fever', 'Infectious diseases'),
('A09', 'Diarrhoea and gastroenteritis of presumed infectious origin', 'Infectious diseases'),
('B50.9', 'Plasmodium falciparum malaria, unspecified', 'Parasitic diseases'),
('B54', 'Unspecified malaria', 'Parasitic diseases'),
('E11.9', 'Type 2 diabetes mellitus without complications', 'Endocrine disorders'),
('I10', 'Essential (primary) hypertension', 'Cardiovascular'),
('J00', 'Acute nasopharyngitis (common cold)', 'Respiratory'),
('J02.9', 'Acute pharyngitis, unspecified', 'Respiratory'),
('J06.9', 'Acute upper respiratory infection, unspecified', 'Respiratory'),
('J18.9', 'Pneumonia, unspecified organism', 'Respiratory'),
('K29.7', 'Gastritis, unspecified', 'Digestive'),
('K52.9', 'Noninfective gastroenteritis and colitis, unspecified', 'Digestive'),
('M54.5', 'Low back pain', 'Musculoskeletal'),
('N39.0', 'Urinary tract infection, site not specified', 'Genitourinary'),
('R50.9', 'Fever, unspecified', 'Symptoms'),
('R51', 'Headache', 'Symptoms');

-- ============================================================
-- WARDS AND BEDS
-- ============================================================

INSERT INTO wards (ward_code, name, ward_type, floor, capacity, charge_per_day) VALUES
('GEN-M', 'General Ward - Male', 'General', 'Ground', 20, 2000.00),
('GEN-F', 'General Ward - Female', 'General', 'Ground', 20, 2000.00),
('PED', 'Pediatric Ward', 'Pediatric', '1st', 15, 2500.00),
('MAT', 'Maternity Ward', 'Maternity', '1st', 15, 3000.00),
('PRIV', 'Private Rooms', 'Private', '2nd', 10, 5000.00),
('ICU', 'Intensive Care Unit', 'ICU', '2nd', 6, 15000.00);

-- Insert beds for General Ward - Male
INSERT INTO beds (bed_number, ward_id, bed_type, status)
SELECT 
    'GM-' || LPAD(generate_series::TEXT, 2, '0'),
    (SELECT id FROM wards WHERE ward_code = 'GEN-M'),
    'Standard',
    'available'
FROM generate_series(1, 20);

-- Insert beds for General Ward - Female
INSERT INTO beds (bed_number, ward_id, bed_type, status)
SELECT 
    'GF-' || LPAD(generate_series::TEXT, 2, '0'),
    (SELECT id FROM wards WHERE ward_code = 'GEN-F'),
    'Standard',
    'available'
FROM generate_series(1, 20);

-- Insert beds for ICU
INSERT INTO beds (bed_number, ward_id, bed_type, status)
SELECT 
    'ICU-' || LPAD(generate_series::TEXT, 2, '0'),
    (SELECT id FROM wards WHERE ward_code = 'ICU'),
    'ICU Bed',
    'available'
FROM generate_series(1, 6);

-- ============================================================
-- SYSTEM SETTINGS
-- ============================================================

INSERT INTO system_settings (key, value, description, category, is_public) VALUES
('hospital_name', '"Afya Bora Hospital"', 'Hospital name', 'general', true),
('hospital_address', '"123 Moi Avenue, Nairobi, Kenya"', 'Hospital physical address', 'general', true),
('hospital_phone', '"+254 20 123 4567"', 'Hospital main phone number', 'general', true),
('hospital_email', '"info@afyabora.co.ke"', 'Hospital email address', 'general', true),
('hospital_logo', '"/logo.png"', 'Hospital logo URL', 'general', true),
('mpesa_paybill', '"123456"', 'MPESA Paybill number', 'payments', true),
('currency', '"KES"', 'Default currency', 'general', true),
('tax_rate', '16', 'Default VAT rate percentage', 'billing', false),
('receipt_footer', '"Thank you for choosing Afya Bora Hospital. Get well soon!"', 'Receipt footer message', 'billing', false),
('appointment_slot_duration', '30', 'Default appointment duration in minutes', 'appointments', false),
('prescription_validity_days', '30', 'Prescription validity period in days', 'pharmacy', false),
('low_stock_threshold_days', '14', 'Days before showing low stock warning', 'pharmacy', false);

-- ============================================================
-- SAMPLE SUPPLIERS
-- ============================================================

INSERT INTO suppliers (supplier_code, name, contact_person, phone, email, physical_address, city, kra_pin, payment_terms, status) VALUES
('SUP001', 'Kenya Pharma Distributors', 'John Kamau', '+254 722 123 456', 'sales@kenyapharma.co.ke', 'Industrial Area, Nairobi', 'Nairobi', 'A123456789B', 'Net 30', 'active'),
('SUP002', 'MedEquip East Africa', 'Sarah Wanjiku', '+254 733 234 567', 'orders@medequip.co.ke', 'Westlands, Nairobi', 'Nairobi', 'B234567890C', 'Net 15', 'active'),
('SUP003', 'Lab Supplies Kenya', 'Peter Ochieng', '+254 711 345 678', 'info@labsupplies.co.ke', 'Mombasa Road, Nairobi', 'Nairobi', 'C345678901D', 'Net 30', 'active'),
('SUP004', 'Surgical Instruments Ltd', 'Mary Akinyi', '+254 720 456 789', 'sales@surgicalke.com', 'Upper Hill, Nairobi', 'Nairobi', 'D456789012E', 'Net 45', 'active'),
('SUP005', 'Generic Meds International', 'James Mwangi', '+254 734 567 890', 'orders@genericmeds.co.ke', 'Kilimani, Nairobi', 'Nairobi', 'E567890123F', 'Net 30', 'active');

-- ============================================================
-- SAMPLE CONSUMABLES
-- ============================================================

INSERT INTO consumables (item_code, name, category, unit, quantity, reorder_level, unit_price) VALUES
('CON001', 'Disposable Gloves (Box)', 'PPE', 'box', 50, 10, 500.00),
('CON002', 'Face Masks (Box of 50)', 'PPE', 'box', 30, 5, 800.00),
('CON003', 'Cotton Wool (Roll)', 'Dressing', 'roll', 100, 20, 150.00),
('CON004', 'Gauze Bandage', 'Dressing', 'piece', 200, 50, 50.00),
('CON005', 'Syringes 5ml (Box)', 'Injection', 'box', 40, 10, 400.00),
('CON006', 'Syringes 10ml (Box)', 'Injection', 'box', 30, 10, 450.00),
('CON007', 'IV Cannula 18G', 'IV', 'piece', 100, 20, 80.00),
('CON008', 'IV Cannula 20G', 'IV', 'piece', 100, 20, 75.00),
('CON009', 'IV Giving Set', 'IV', 'piece', 50, 15, 120.00),
('CON010', 'Normal Saline 500ml', 'IV Fluids', 'bottle', 100, 30, 180.00),
('CON011', 'Dextrose 5% 500ml', 'IV Fluids', 'bottle', 80, 20, 200.00),
('CON012', 'Surgical Tape', 'Dressing', 'roll', 50, 15, 100.00),
('CON013', 'Alcohol Swabs (Box)', 'Antiseptic', 'box', 60, 15, 250.00),
('CON014', 'Specimen Containers', 'Lab', 'piece', 200, 50, 30.00),
('CON015', 'Blood Collection Tubes (EDTA)', 'Lab', 'piece', 150, 50, 45.00);

-- ============================================================
-- END OF SEED DATA
-- ============================================================