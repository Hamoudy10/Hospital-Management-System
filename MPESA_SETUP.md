# M-Pesa C2B Setup

This system supports M-Pesa C2B validation/confirmation with automatic reconciliation and manual fallback.

## 1. Apply the migration
Run the SQL migration in Supabase SQL editor:
- `scripts/mpesa_payment_tracking.sql`

## 2. Required environment variables
Set these in your environment (Render/Vercel/locally):

- `MPESA_ENV` = `sandbox` or `production`
- `MPESA_CONSUMER_KEY`
- `MPESA_CONSUMER_SECRET`
- `MPESA_SHORTCODE` (Paybill or Till number)
- `MPESA_CALLBACK_BASE_URL` (public base URL for callbacks)
- `MPESA_SYSTEM_USER_ID` (user_id from the `users` table used to record auto payments)
- `MPESA_DEFAULT_SCHOOL_ID` (single-school fallback for unmatched transactions)
- `SUPABASE_SERVICE_ROLE_KEY` (required for callback inserts)

Optional:
- `MPESA_C2B_RESPONSE_TYPE` = `Completed` (default) or `Cancelled`

## 3. Callback URLs
These are built automatically:
- `{MPESA_CALLBACK_BASE_URL}/api/mpesa/c2b/validation`
- `{MPESA_CALLBACK_BASE_URL}/api/mpesa/c2b/confirmation`

For local testing, use a tunnel (e.g., ngrok) and set `MPESA_CALLBACK_BASE_URL` to the tunnel URL.

## 4. Register C2B URLs
Once the env vars are set, call:
- `POST /api/mpesa/c2b/register`

This registers your validation/confirmation URLs with Daraja.

## 5. Bill Reference Matching
Auto-reconciliation uses this order:
1. Invoice number (generated on student fees, format `INV-YYYYMM-XXXXX`)
2. Student fee UUID
3. Admission number

If no match or overpayment occurs, the transaction is flagged for manual review.

## 6. Manual Reconciliation
Go to `Finance > M-Pesa Tracking` and reconcile pending transactions.
