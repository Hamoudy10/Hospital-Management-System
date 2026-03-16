-- M-Pesa payment tracking migration
-- Apply in Supabase SQL editor or psql

BEGIN;

ALTER TABLE student_fees ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(40);
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_fees_invoice_number
  ON student_fees (school_id, invoice_number)
  WHERE invoice_number IS NOT NULL;

CREATE TABLE IF NOT EXISTS mpesa_c2b_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES schools(school_id) ON DELETE SET NULL,
  student_id UUID REFERENCES students(student_id) ON DELETE SET NULL,
  student_fee_id UUID REFERENCES student_fees(id) ON DELETE SET NULL,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,

  transaction_type VARCHAR(40) NOT NULL,
  trans_id VARCHAR(40) NOT NULL,
  trans_time TIMESTAMPTZ,
  trans_amount DECIMAL(12,2) NOT NULL,
  business_short_code VARCHAR(20),
  bill_ref_number VARCHAR(100),
  invoice_number VARCHAR(100),
  msisdn VARCHAR(20),
  first_name VARCHAR(100),
  middle_name VARCHAR(100),
  last_name VARCHAR(100),
  org_account_balance VARCHAR(50),
  third_party_trans_id VARCHAR(50),

  status VARCHAR(30) NOT NULL DEFAULT 'received',
  validation_result_code INTEGER,
  validation_result_desc TEXT,
  confirmation_result_code INTEGER,
  confirmation_result_desc TEXT,
  reconciliation_status VARCHAR(30) NOT NULL DEFAULT 'pending',
  reconciliation_reason TEXT,
  reconciled_at TIMESTAMPTZ,
  reconciled_by UUID REFERENCES users(user_id) ON DELETE SET NULL,

  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (trans_id)
);

CREATE INDEX IF NOT EXISTS idx_mpesa_c2b_school ON mpesa_c2b_transactions (school_id);
CREATE INDEX IF NOT EXISTS idx_mpesa_c2b_status ON mpesa_c2b_transactions (status);
CREATE INDEX IF NOT EXISTS idx_mpesa_c2b_recon ON mpesa_c2b_transactions (reconciliation_status);
CREATE INDEX IF NOT EXISTS idx_mpesa_c2b_billref ON mpesa_c2b_transactions (bill_ref_number);
CREATE INDEX IF NOT EXISTS idx_mpesa_c2b_msisdn ON mpesa_c2b_transactions (msisdn);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column')
     AND NOT EXISTS (
       SELECT 1 FROM pg_trigger WHERE tgname = 'trg_mpesa_c2b_updated_at'
     ) THEN
    CREATE TRIGGER trg_mpesa_c2b_updated_at
      BEFORE UPDATE ON mpesa_c2b_transactions
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

ALTER TABLE mpesa_c2b_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY mpesa_c2b_select ON mpesa_c2b_transactions
  FOR SELECT TO authenticated
  USING (
    is_super_admin()
    OR (is_finance_role() AND school_id = get_user_school_id())
    OR (is_school_admin_level() AND school_id = get_user_school_id())
  );

CREATE POLICY mpesa_c2b_manage ON mpesa_c2b_transactions
  FOR UPDATE TO authenticated
  USING (is_super_admin() OR (is_finance_role() AND school_id = get_user_school_id()))
  WITH CHECK (is_super_admin() OR (is_finance_role() AND school_id = get_user_school_id()));

COMMIT;
