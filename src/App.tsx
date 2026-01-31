import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Toaster } from './components/ui/toaster';

// Layouts
import { AdminLayout } from './layouts/AdminLayout';

// Auth Pages
import { Login } from './pages/auth/Login';

// Dashboard Pages
import { DoctorDashboard } from './pages/dashboards/DoctorDashboard';
import { NurseDashboard } from './pages/dashboards/NurseDashboard';
import { ReceptionistDashboard } from './pages/dashboards/ReceptionistDashboard';
import { AccountantDashboard } from './pages/dashboards/AccountantDashboard';
import { LabTechDashboard } from './pages/dashboards/LabTechDashboard';
import { PharmacistDashboard } from './pages/dashboards/PharmacistDashboard';
import { ProcurementDashboard } from './pages/dashboards/ProcurementDashboard';

// Feature Components
import { PatientRegister } from './components/patients/PatientRegister';
import { PatientLookup } from './components/patients/PatientLookup';
import { AppointmentBook } from './components/appointments/AppointmentBook';
import { InvoiceCreate } from './components/billing/InvoiceCreate';
import { MpesaPaybill } from './components/billing/MpesaPaybill';
import { LabTestCatalog } from './components/lab/LabTestCatalog';
import { DrugInventory } from './components/pharmacy/DrugInventory';
import { SupplierManager } from './components/procurement/SupplierManager';
import { ReportViewer } from './components/reports/ReportViewer';

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#2438a6] border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Dashboard Router - Routes to correct dashboard based on role
const DashboardRouter: React.FC = () => {
  const { user } = useAuth();

  switch (user?.role) {
    case 'doctor':
      return <DoctorDashboard />;
    case 'nurse':
      return <NurseDashboard />;
    case 'receptionist':
      return <ReceptionistDashboard />;
    case 'accountant':
      return <AccountantDashboard />;
    case 'lab_technician':
      return <LabTechDashboard />;
    case 'pharmacist':
      return <PharmacistDashboard />;
    case 'procurement':
      return <ProcurementDashboard />;
    case 'admin':
      return <DoctorDashboard />; // Admin sees doctor dashboard by default
    default:
      return <DoctorDashboard />;
  }
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <AnimatePresence mode="wait">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />

              {/* Protected Routes with Admin Layout */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                {/* Dashboard - Role-based */}
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardRouter />} />

                {/* Patient Management */}
                <Route path="patients">
                  <Route index element={<PatientLookup />} />
                  <Route path="register" element={<PatientRegister />} />
                  <Route path="lookup" element={<PatientLookup />} />
                </Route>

                {/* Appointments */}
                <Route path="appointments">
                  <Route index element={<AppointmentBook />} />
                  <Route path="book" element={<AppointmentBook />} />
                  <Route path="schedule" element={<AppointmentBook />} />
                </Route>

                {/* Clinical */}
                <Route path="clinical">
                  <Route path="records" element={<ReportViewer />} />
                  <Route path="prescriptions" element={<ReportViewer />} />
                  <Route path="vitals" element={<ReportViewer />} />
                  <Route path="diagnosis" element={<ReportViewer />} />
                </Route>

                {/* Laboratory */}
                <Route path="lab">
                  <Route index element={<LabTestCatalog />} />
                  <Route path="catalog" element={<LabTestCatalog />} />
                  <Route path="requests" element={<LabTestCatalog />} />
                  <Route path="results" element={<LabTestCatalog />} />
                  <Route path="samples" element={<LabTestCatalog />} />
                </Route>

                {/* Pharmacy */}
                <Route path="pharmacy">
                  <Route index element={<DrugInventory />} />
                  <Route path="inventory" element={<DrugInventory />} />
                  <Route path="dispensing" element={<DrugInventory />} />
                  <Route path="alerts" element={<DrugInventory />} />
                  <Route path="expiry" element={<DrugInventory />} />
                </Route>

                {/* Billing */}
                <Route path="billing">
                  <Route index element={<InvoiceCreate />} />
                  <Route path="invoices" element={<InvoiceCreate />} />
                  <Route path="create" element={<InvoiceCreate />} />
                  <Route path="payments" element={<InvoiceCreate />} />
                  <Route path="mpesa" element={<MpesaPaybill />} />
                </Route>

                {/* Procurement */}
                <Route path="procurement">
                  <Route index element={<SupplierManager />} />
                  <Route path="suppliers" element={<SupplierManager />} />
                  <Route path="orders" element={<SupplierManager />} />
                  <Route path="inventory" element={<SupplierManager />} />
                  <Route path="assets" element={<SupplierManager />} />
                </Route>

                {/* Reports */}
                <Route path="reports">
                  <Route index element={<ReportViewer />} />
                  <Route path="medical" element={<ReportViewer />} />
                  <Route path="financial" element={<ReportViewer />} />
                  <Route path="inventory" element={<ReportViewer />} />
                  <Route path="analytics" element={<ReportViewer />} />
                </Route>

                {/* Admin */}
                <Route path="admin">
                  <Route path="users" element={<ReportViewer />} />
                  <Route path="roles" element={<ReportViewer />} />
                  <Route path="departments" element={<ReportViewer />} />
                  <Route path="audit" element={<ReportViewer />} />
                </Route>

                {/* Settings */}
                <Route path="settings" element={<ReportViewer />} />
                <Route path="profile" element={<ReportViewer />} />
              </Route>

              {/* Catch all - redirect to dashboard */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </AnimatePresence>
          <Toaster />
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;