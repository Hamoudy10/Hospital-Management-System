CLAUDE.mdKenya Hospital Management System – AI Continuation Bible
This file is the single source of truth for any AI (Claude, Copilot, etc.) that needs to understand, extend, or debug this codebase without breaking production.


PROJECT OVERVIEW


A real-world, Kenyan private/public hospital system built with:
• Frontend: React 18 + Vite + TypeScript + Tailwind CSS + ShadCN/UI• Backend: Node.js 20 + Express + TypeScript + Supabase PostgreSQL• Hosting: Frontend → Vercel, Backend → Render, DB → Supabase• Payments: M-Pesa Paybill (C2B) with ETR-compliant receipts• Security: Supabase Auth (JWT), Row Level Security (RLS), audited tables• Compliance: Kenyan MoH data-privacy rules, WCAG 2.2 accessibility


TECH STACK CONSTRAINTS (NON-NEGOTIABLE)


Frontend• React functional components + hooks only (no classes)• Strict TypeScript – no any types• Tailwind 3.4+ utility classes only – no inline styles• ShadCN/UI components live in src/components/ui/ (do NOT reinstall)• Framer Motion for page transitions (already wrapped in PageTransition)• Icons: Lucide React only• API calls: Axios via src/services/api.ts (auto-attaches JWT)  
Backend• Express 4 + TypeScript compiled to dist/• Supabase PostgREST-style: every table has created_at, updated_at, soft-delete via is_active• All SQL queries use Supabase client (supabase-js) NOT raw pg pool• ENV vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE, JWT_SECRET, MPESA_PASSKEY, MPESA_SHORTCODE, MPESA_CALLBACK_URL• File uploads: Cloudinary (already configured in backend/src/services/cloudinary.ts)  
Database• UUIDv4 primary keys everywhere• RLS enabled on every table (see supabase/migrations/002_rls.sql)• Audit table audit_logs populated via Postgres triggers• M-Pesa table mpesa_transactions stores full C2B callback payload  


FOLDER CONVENTIONS


Frontend (/frontend/src)├── components/ui          # ShadCN components – do not rename├── components/functional # Feature-specific (e.g., PatientRegister)├── pages                 # Route components (dashboards, auth)├── contexts              # AuthContext, NotificationContext├── hooks                 # useLocalStorage, useDebounce, etc.├── services              # api.ts, mpesaService.ts├── types                 # Shared TypeScript interfaces└── styles                # Tailwind entry + custom fonts
Backend (/backend/src)├── config                # supabase.ts (single client)├── controllers           # One per feature (auth, patient, billing...)├── routes                # Same basename as controller├── services              # Business logic (invoiceService, auditService)├── middleware            # auth.ts (Supabase JWT), role.ts (RBAC)├── utils                 # validators.ts (Zod schemas)└── types                 # Shared DTOs (auto-generated from controllers)


ROLE HIERARCHY & PERMISSIONS


Roles live in table roles (id, name, permissions:JSONB).RBAC middleware uses requireRole() and requirePermission() in /middleware/role.ts.
Role → Permissions (examples)Doctor: ["patients.read", "patients.write", "prescriptions.write", "lab.read"]Nurse: ["vitals.write", "patients.read", "appointments.write"]Receptionist: ["patients.register", "appointments.write", "visits.read"]Accountant: ["invoices.read", "invoices.write", "mpesa.read", "reports.financial"]LabTech: ["lab.tests.write", "lab.results.write", "patients.read"]Pharmacist: ["drugs.read", "drugs.write", "prescriptions.fulfill"]Procurement: ["suppliers.read", "purchase_orders.write", "inventory.write"]


API PATTERN


Every controller follows this exact shape:
import { Request, Response } from 'express'import { z } from 'zod'import { supabase } from '../config/supabase'import { audit } from '../services/auditService'
const schema = z.object({ ... })      // Zod validationexport const handler = async (req: Request, res: Response) => {  const { data, error } = schema.safeParse(req.body)  if (error) return res.status(400).json({ success:false, message:error.errors })  const user = req.user!              // injected by auth middleware  // ... business logic  await audit.log(user.id, 'patients.create', { patientId:newPatient.id })  return res.json({ success:true, data:newPatient })}
Routes register handlers via:
router.post('/patients', requireAuth, requirePermission('patients.write'), handler)


M-PESA PAYBILL FLOW (C2B)



Accountant generates invoice → QR code (Paybill + Account Number) displayed.  
Patient pays via M-Pesa menu.  
Safaricom POSTs C2B payload to /api/mpesa/c2b-callback  
mpesaController.c2bCallback does:a. Validate callback (check ResultCode, Amount, MSISDN format).b. Insert into mpesa_transactions (idempotent via TransID).c. Allocate payment: arrears → water → rent (reuse existing allocation logic).d. Mark invoice paid if fully allocated.e. Emit socket event payment_received to accountant dashboard.  
Receipt generated via printService.generateA5Receipt(paymentId) → base64 PDF for printing.



PRINTING REQUIREMENTS


• A5 thermal receipts: 80 mm width, auto-cut ESC/POS commands.• PDF generated with jsPDF + jspdf-autotable in printService.ts.• Route: GET /api/print/receipt/:paymentId returns { pdf:base64 }.• Frontend uses printService.printBase64(base64) which calls window.print() after embedding PDF in hidden iframe.


DEPLOYMENT CHECKLIST


Frontend Vercel• ENV: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_URL• Build command: pnpm build• Output dir: dist  
Backend Render• ENV: SUPABASE_URL, SUPABASE_SERVICE_ROLE, JWT_SECRET, CLOUDINARY_URL, MPESA_SHORTCODE, MPESA_PASSKEY, MPESA_CALLBACK_URL• Build command: pnpm build (compiles to dist/)• Start command: node dist/server.js  
Database Supabase• Migrations run automatically via GitHub action (see .github/workflows/deploy.yml)• RLS must be enabled before migrations run  


CODING STANDARDS


• Never commit .env – only .env.example• Never expose service-role key to frontend – use anon key + RLS• Never use console.log in production – use logger.info (pino) already wired• Never create new ShadCN components – import existing ones• Never change primary color palette – use CSS vars defined in globals.css• Always run pnpm lint and pnpm type-check before push – CI will fail otherwise  


COMMON EXTENSION POINTS


Insurance Module• Add table insurance_schemes (id, name, api_url, api_key)• Add column patients.insurance_scheme_id• Add table insurance_policies (patient_id, scheme_id, policy_number, expiry)• Create service insuranceService.validatePolicy(patientId)  
NHIF Integration• Add env NHIF_API_URL, NHIF_USERNAME, NHIF_PASSWORD• Create controller nhifController.ts and route /api/nhif/validate-card• Use SOAP client (already installed) for NHIF SOAP API  
SMS Notifications• Add env AT_USERNAME, AT_API_KEY (Africa’s Talking)• Create service smsService.send(to, message)• Call from afterInsert trigger on appointments table  
Telemedicine• Install livekit-client and livekit-server-sdk• Add pages TeleConsultation.tsx and controller telemedicineController.ts• Use existing ChatContext for side-chat during video call  


TROUBLESHOOTING QUICK-REF


“Socket not receiving messages”→ Check that broadcastMessage is called after message insert (see Update-Chat fix in CLAUDE.md).
“RLS policy violation”→ Run supabase db dump --schema-only and inspect policies section.
“MPESA callback returns 500”→ Validate ResultCode === 0 before processing; log full payload to mpesa_transactions.raw_payload.
“Print receipt shows blank”→ Ensure PDF base64 string is prefixed with data:application/pdf;base64, before passing to print iframe.


LAST UPDATED


2024-06-01 – Version 1.0.0 (Production-ready)