# CLAUDE.md Update - Backend Implementation Summary

**Date:** 2024-12-XX  
**Version:** 1.1.0  
**Status:** Backend Routes & Services Complete

---

## WHAT WAS IMPLEMENTED

### 1. Server Configuration (`src/server.ts`)

Complete Express server setup with:
- **Express 4 + TypeScript** with strict typing
- **CORS** configured for `localhost:5173` (dev) and Vercel production URLs
- **Helmet** security middleware with custom CSP
- **Rate Limiting**: 100 requests/15min general, 5 requests/15min for auth
- **Socket.IO** for real-time notifications (payment_received, appointment_updated, etc.)
- **Swagger/OpenAPI** documentation at `/api-docs`
- **Pino Logger** with pretty printing in development
- **Graceful shutdown** handling for SIGTERM/SIGINT
- **Health check** endpoint at `/api/health`

### 2. Route Files (10 files in `src/routes/`)

| Route File | Base Path | Endpoints | Auth Required |
|------------|-----------|-----------|---------------|
| `auth.ts` | `/api/auth` | login, register, profile, change-password, logout, users | Mixed |
| `patients.ts` | `/api/patients` | CRUD, search, medical-history | Yes |
| `appointments.ts` | `/api/appointments` | CRUD, today, availability, check-in, cancel | Yes |
| `billing.ts` | `/api/billing` | invoices, payments, receipts, summary, outstanding | Yes |
| `mpesa.ts` | `/api/mpesa` | stk-push, callbacks, transactions, allocate, stats | Mixed* |
| `lab.ts` | `/api/lab` | tests, catalog, samples, results, queue | Yes |
| `pharmacy.ts` | `/api/pharmacy` | drugs, stock, prescriptions, dispense, alerts | Yes |
| `procurement.ts` | `/api/procurement` | suppliers, purchase-orders, approve, receive | Yes |
| `reports.ts` | `/api/reports` | financial, medical, lab, inventory, audit | Yes |
| `print.ts` | `/api/print` | receipts, invoices, lab-reports, prescriptions | Yes |

*M-Pesa callbacks are public (no auth) for Safaricom to POST to.

### 3. Controllers (Created/Updated)

| Controller | Functions | Description |
|------------|-----------|-------------|
| `procurementController.ts` | 17 | Suppliers CRUD, PO workflow, receiving goods |
| `reportController.ts` | 13 | All report types (financial, medical, lab, inventory, audit) |

### 4. Service Files (4 files in `src/services/`)

| Service | Methods | Description |
|---------|---------|-------------|
| `auditService.ts` | 8 | Comprehensive audit logging (CRUD, login, payments, M-Pesa) |
| `invoiceService.ts` | 8 | Invoice generation, payments, cancellation, financial summary |
| `mpesaService.ts` | 10 | Daraja API integration (STK Push, C2B, allocation) |
| `printService.ts` | 4 | PDF generation (A5 receipts, lab results, financial reports) |

### 5. Configuration Files

| File | Purpose |
|------|---------|
| `config/supabase.ts` | Supabase client initialization with service role key |
| `types/index.ts` | All TypeScript interfaces and types |
| `types/qrcode.d.ts` | QRCode module type declarations |
| `utils/validators.ts` | 25+ Zod validation schemas |
| `utils/logger.ts` | Pino logger configuration |

---

## BACKEND FILE STRUCTURE

```
backend/
├── package.json
├── tsconfig.json
├── .env.example
└── src/
    ├── server.ts                 # Express + Socket.IO entry point
    ├── config/
    │   └── supabase.ts           # Supabase client
    ├── types/
    │   ├── index.ts              # All type definitions
    │   └── qrcode.d.ts           # QRCode module types
    ├── utils/
    │   ├── logger.ts             # Pino logger
    │   └── validators.ts         # Zod schemas
    ├── middleware/
    │   ├── auth.ts               # JWT authentication (existing)
    │   └── role.ts               # RBAC middleware (existing)
    ├── services/
    │   ├── auditService.ts       # Audit logging
    │   ├── invoiceService.ts     # Invoice operations
    │   ├── mpesaService.ts       # M-Pesa Daraja API
    │   └── printService.ts       # PDF generation
    ├── controllers/
    │   ├── authController.ts     # (existing)
    │   ├── patientController.ts  # (existing)
    │   ├── appointmentController.ts # (existing)
    │   ├── billingController.ts  # (existing)
    │   ├── labController.ts      # (existing)
    │   ├── mpesaController.ts    # (existing)
    │   ├── pharmacyController.ts # (existing)
    │   ├── procurementController.ts # NEW
    │   └── reportController.ts   # NEW
    └── routes/
        ├── index.ts              # Route aggregator
        ├── auth.ts
        ├── patients.ts
        ├── appointments.ts
        ├── billing.ts
        ├── mpesa.ts
        ├── lab.ts
        ├── pharmacy.ts
        ├── procurement.ts
        ├── reports.ts
        └── print.ts
```

---

## API ENDPOINTS QUICK REFERENCE

### Authentication (`/api/auth`)
```
POST   /login              # User login
POST   /register           # Register new user (admin only)
GET    /profile            # Get current user profile
PUT    /profile            # Update profile
PUT    /change-password    # Change password
POST   /logout             # Logout
GET    /users              # List all users (admin only)
```

### Patients (`/api/patients`)
```
GET    /                   # List patients (paginated)
POST   /                   # Register new patient
GET    /search             # Search patients
GET    /:id                # Get patient by ID
PUT    /:id                # Update patient
DELETE /:id                # Soft delete patient
GET    /:id/medical-history # Get medical history
```

### Appointments (`/api/appointments`)
```
GET    /                   # List appointments
POST   /                   # Create appointment
GET    /today              # Today's appointments
GET    /availability       # Check doctor availability
GET    /:id                # Get appointment
PUT    /:id                # Update appointment
POST   /:id/check-in       # Check-in patient
POST   /:id/cancel         # Cancel appointment
```

### Billing (`/api/billing`)
```
GET    /invoices           # List invoices
POST   /invoices           # Create invoice
GET    /invoices/outstanding # Outstanding invoices
GET    /invoices/:id       # Get invoice by ID
GET    /invoices/number/:num # Get by invoice number
POST   /invoices/:id/cancel # Cancel invoice
POST   /payments           # Add payment
GET    /payments/:invoiceId # Get invoice payments
GET    /receipts/:paymentId # Generate receipt PDF
GET    /summary            # Financial summary
GET    /revenue/daily      # Daily revenue stats
```

### M-Pesa (`/api/mpesa`)
```
POST   /stk-push           # Initiate STK Push
GET    /stk-status/:id     # Query STK status
POST   /stk-callback       # STK callback (public)
POST   /c2b-validate       # C2B validation (public)
POST   /c2b-confirm        # C2B confirmation (public)
GET    /transactions       # List transactions
GET    /unallocated        # Unallocated transactions
POST   /allocate/:id       # Manual allocation
POST   /register-urls      # Register C2B URLs
GET    /statistics         # M-Pesa stats
```

### Lab (`/api/lab`)
```
GET    /tests              # List lab tests
POST   /tests              # Create lab order
GET    /tests/pending      # Pending tests queue
GET    /tests/:id          # Get lab test
PUT    /tests/:id          # Update lab test
POST   /tests/:id/collect  # Collect sample
POST   /tests/:id/results  # Enter results
GET    /tests/:id/pdf      # Generate result PDF
GET    /catalog            # Test catalog
POST   /catalog            # Add to catalog
PUT    /catalog/:id        # Update catalog
GET    /categories         # Test categories
```

### Pharmacy (`/api/pharmacy`)
```
GET    /drugs              # List drugs
POST   /drugs              # Add drug
GET    /drugs/:id          # Get drug
PUT    /drugs/:id          # Update drug
POST   /stock/adjust       # Adjust stock
GET    /alerts/low-stock   # Low stock alerts
GET    /alerts/expiring    # Expiring drugs
GET    /categories         # Drug categories
GET    /prescriptions      # List prescriptions
POST   /prescriptions      # Create prescription
GET    /prescriptions/pending # Pending prescriptions
GET    /prescriptions/:id  # Get prescription
POST   /prescriptions/dispense # Dispense prescription
```

### Procurement (`/api/procurement`)
```
GET    /suppliers          # List suppliers
POST   /suppliers          # Create supplier
GET    /suppliers/:id      # Get supplier
PUT    /suppliers/:id      # Update supplier
DELETE /suppliers/:id      # Deactivate supplier
GET    /purchase-orders    # List POs
POST   /purchase-orders    # Create PO
GET    /purchase-orders/:id # Get PO
PUT    /purchase-orders/:id # Update PO
POST   /purchase-orders/:id/submit # Submit for approval
POST   /purchase-orders/:id/approve # Approve PO
POST   /purchase-orders/:id/receive # Receive goods
POST   /purchase-orders/:id/cancel # Cancel PO
```

### Reports (`/api/reports`)
```
GET    /financial          # Financial report
GET    /financial/pdf      # Financial PDF
GET    /medical            # Medical statistics
GET    /lab                # Lab statistics
GET    /lab/turnaround     # Lab turnaround times
GET    /inventory          # Inventory report
GET    /inventory/valuation # Stock valuation
GET    /audit              # Audit logs
GET    /dashboard          # Dashboard summary
```

### Print (`/api/print`)
```
GET    /receipt/:paymentId    # A5 receipt PDF
GET    /invoice/:invoiceId    # Invoice PDF
GET    /lab-result/:testId    # Lab result PDF
GET    /prescription/:id      # Prescription PDF
GET    /patient-card/:id      # Patient card PDF
```

---

## SOCKET.IO EVENTS

### Server Emits
```javascript
'payment_received'      // When M-Pesa payment allocated
'appointment_updated'   // When appointment status changes
'lab_result_ready'      // When lab results completed
'prescription_ready'    // When prescription dispensed
'low_stock_alert'       // When drug below reorder level
```

### Client Joins
```javascript
socket.emit('join', { room: 'accountant' });  // Join role-based room
socket.emit('join', { room: 'lab' });
socket.emit('join', { room: 'pharmacy' });
```

---

## ENVIRONMENT VARIABLES (Backend)

```env
# Server
PORT=4000
NODE_ENV=development

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE=eyJhbGc...
SUPABASE_ANON_KEY=eyJhbGc...

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# M-Pesa Daraja API
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_PASSKEY=
MPESA_SHORTCODE=
MPESA_CALLBACK_URL=https://your-api.com/api/mpesa
MPESA_ENV=sandbox

# Hospital Info (for receipts)
HOSPITAL_NAME=Kenya General Hospital
HOSPITAL_ADDRESS=P.O. Box 12345, Nairobi
HOSPITAL_PHONE=+254 700 123 456
HOSPITAL_EMAIL=info@hospital.co.ke
HOSPITAL_TAX_PIN=P000000000X

# Cloudinary (for file uploads)
CLOUDINARY_URL=cloudinary://...

# Frontend URLs (CORS)
FRONTEND_URL=http://localhost:5173
VERCEL_URL=https://kenya-hms.vercel.app
```

---

## DEPENDENCIES ADDED

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    "socket.io": "^4.7.2",
    "pino": "^8.16.2",
    "pino-pretty": "^10.2.3",
    "swagger-ui-express": "^5.0.0",
    "@supabase/supabase-js": "^2.38.4",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "zod": "^3.22.4",
    "axios": "^1.6.2",
    "jspdf": "^2.5.1",
    "jspdf-autotable": "^3.8.1",
    "qrcode": "^1.5.3"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.16",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/bcryptjs": "^2.4.6",
    "@types/swagger-ui-express": "^4.1.6",
    "@types/qrcode": "^1.5.5",
    "typescript": "^5.3.2"
  }
}
```

---

## TESTING THE BACKEND

```bash
# Install dependencies
cd backend
pnpm install

# Run in development
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Type check
pnpm type-check
```

### Health Check
```bash
curl http://localhost:4000/api/health
# Response: { "status": "ok", "timestamp": "...", "uptime": 123.45 }
```

### Swagger Docs
Open: http://localhost:4000/api-docs

---

## NOTES FOR AI CONTINUATION

1. **All routes follow the pattern**: `router.METHOD('/path', requireAuth, requirePermission('...'), controllerMethod)`

2. **M-Pesa callbacks are PUBLIC** - no auth middleware (Safaricom POSTs directly)

3. **Socket.IO rooms**: Use role-based rooms for real-time updates (accountant, lab, pharmacy, doctor)

4. **PDF Generation**: Uses jsPDF + jspdf-autotable, returns base64 data URI

5. **Audit logging**: Every CRUD operation should call `auditService.log*()` methods

6. **Error handling**: All controllers return `{ success: boolean, data?: T, error?: string }`

7. **Pagination**: Standard format `{ data: [], meta: { page, limit, total, totalPages } }`

---

## LAST UPDATED

2024-12-XX – Version 1.1.0 (Backend Routes Complete)