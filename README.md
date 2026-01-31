README.mdKenya Hospital Management System
A modern, fully-featured hospital management platform built for Kenyan healthcare facilities.Supports clinical, administrative, lab, pharmacy, billing (M-Pesa Paybill), procurement and reporting workflows out of the box.
Live Demo (optional)
Frontend: https://kenya-hms.vercel.appBackend : https://kenya-hms-api.onrender.comSwagger : https://kenya-hms-api.onrender.com/api-docs
Features
• Patient Management – unique hospital numbers, visit history, attachments• Appointments – doctor schedules, SMS-ready structure• Lab & Pharmacy – sample tracking, inventory, expiry alerts• Billing – M-Pesa Paybill C2B, partial payments, A5 receipts• Reports – medical, financial, inventory (PDF + Excel)• Security – Supabase Auth, Row Level Security, audit logs• Multi-role – Doctor, Nurse, Receptionist, Accountant, LabTech, Pharmacist, Procurement• Print – A5 thermal receipts, lab results, reports• Extensible – insurance, NHIF, tele-medicine hooks ready
Tech Stack
Frontend: React 18 + Vite + TypeScript + Tailwind CSS + ShadCN/UIBackend : Node.js 20 + Express + TypeScript + Supabase PostgreSQLHosting : Frontend → Vercel, Backend → Render, DB → SupabasePayments: M-Pesa Paybill (C2B) with ETR-compliant receiptsPrint   : jsPDF + auto-table → base64 → ESC/POS thermal printers
Quick Start (Local)

Clone repo

   Copied git clone https://github.com/YOUR_USER/kenya-hms.git
cd kenya-hms 
Backend

   Copied cd backend
cp .env.example .env
pnpm i
pnpm dev        # http://localhost:4000 
Frontend

   Copied cd frontend
cp .env.example .env
pnpm i
pnpm dev        # http://localhost:5173 
Database (Supabase)• Create project → copy SUPABASE_URL & SUPABASE_SERVICE_ROLE• Run migrations inside supabase/migrations/ (or let CI run them)

Environment Variables
See .env.example files in frontend/ and backend/ folders.Minimum required:
FrontendVITE_SUPABASE_URL=VITE_SUPABASE_ANON_KEY=VITE_API_URL=http://localhost:4000
BackendSUPABASE_URL=SUPABASE_SERVICE_ROLE=JWT_SECRET=MPESA_SHORTCODE=MPESA_PASSKEY=MPESA_CALLBACK_URL=https://.../api/mpesa/c2b-callbackCLOUDINARY_URL=cloudinary://...
Deploy to Production

Push to main branch – GitHub Actions auto-deploys:• Frontend to Vercel• Backend  to Render• Migrations to Supabase  
Set production environment variables in each platform.

Testing
   Copied # backend
pnpm test

# frontend
pnpm type-check
pnpm lint API Documentation
Run backend locally → visit http://localhost:4000/api-docs (Swagger UI)
Contributing

Fork repo  
Create feature branch (git checkout -b feat/insurance)  
Commit with Conventional Commits (feat: add NHIF validation)  
Push and open PR to main

License
MIT – feel free to use in private/public hospitals.
Support
Open an issue or email support@yourhospital.co.ke