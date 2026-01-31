import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// ============================================
// Types
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  department?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// ============================================
// Axios Instance Configuration
// ============================================

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// ============================================
// Interceptors
// ============================================

// Request Interceptor: Attach Token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('kenya_hms_access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle Errors & Token Refresh
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized (Token Expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('kenya_hms_refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Attempt to refresh token
        // Note: Assuming /auth/refresh-token endpoint exists
        const response = await axios.post(`${baseURL}/auth/refresh-token`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;

        // Store new tokens
        localStorage.setItem('kenya_hms_access_token', accessToken);
        if (newRefreshToken) {
          localStorage.setItem('kenya_hms_refresh_token', newRefreshToken);
        }

        // Update header and retry original request
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - Logout user
        localStorage.removeItem('kenya_hms_access_token');
        localStorage.removeItem('kenya_hms_refresh_token');
        localStorage.removeItem('kenya_hms_user');
        
        // Redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle standard errors
    const errorMessage = (error.response?.data as any)?.error || error.message || 'An unknown error occurred';
    
    // You might want to trigger a global toast/notification here if you had access to the store
    console.error('API Error:', errorMessage);

    return Promise.reject(error);
  }
);

// ============================================
// Service Methods
// ============================================

export const auth = {
  login: (credentials: any) => api.post<ApiResponse<AuthResponse>>('/auth/login', credentials),
  register: (data: any) => api.post<ApiResponse>('/auth/register', data),
  logout: () => api.post<ApiResponse>('/auth/logout'),
  getProfile: () => api.get<ApiResponse<User>>('/auth/profile'),
  updateProfile: (data: any) => api.put<ApiResponse<User>>('/auth/profile', data),
  changePassword: (data: any) => api.post<ApiResponse>('/auth/change-password', data),
};

export const patients = {
  getAll: (params?: any) => api.get<ApiResponse>('/patients', { params }),
  getById: (id: string) => api.get<ApiResponse>(`/patients/${id}`),
  create: (data: any) => api.post<ApiResponse>('/patients', data),
  update: (id: string, data: any) => api.put<ApiResponse>(`/patients/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse>(`/patients/${id}`),
  search: (query: string) => api.get<ApiResponse>('/patients/search', { params: { query } }),
  getHistory: (id: string) => api.get<ApiResponse>(`/patients/${id}/medical-history`),
};

export const appointments = {
  getAll: (params?: any) => api.get<ApiResponse>('/appointments', { params }),
  getById: (id: string) => api.get<ApiResponse>(`/appointments/${id}`),
  create: (data: any) => api.post<ApiResponse>('/appointments', data),
  update: (id: string, data: any) => api.put<ApiResponse>(`/appointments/${id}`, data),
  checkIn: (id: string) => api.post<ApiResponse>(`/appointments/${id}/check-in`),
  cancel: (id: string, reason?: string) => api.post<ApiResponse>(`/appointments/${id}/cancel`, { reason }),
  getToday: () => api.get<ApiResponse>('/appointments/today'),
  getAvailability: (doctorId: string, date: string) => api.get<ApiResponse>('/appointments/availability', { params: { doctorId, date } }),
};

export const billing = {
  getInvoices: (params?: any) => api.get<ApiResponse>('/billing/invoices', { params }),
  getInvoiceById: (id: string) => api.get<ApiResponse>(`/billing/invoices/${id}`),
  getInvoiceByNumber: (num: string) => api.get<ApiResponse>(`/billing/invoices/number/${num}`),
  createInvoice: (data: any) => api.post<ApiResponse>('/billing/invoices', data),
  cancelInvoice: (id: string, reason: string) => api.post<ApiResponse>(`/billing/invoices/${id}/cancel`, { reason }),
  addPayment: (data: any) => api.post<ApiResponse>('/billing/payments', data),
  getPayments: (invoiceId: string) => api.get<ApiResponse>(`/billing/invoices/${invoiceId}/payments`),
  getSummary: (params?: any) => api.get<ApiResponse>('/billing/summary', { params }),
  getDailyRevenue: () => api.get<ApiResponse>('/billing/revenue/daily'),
};

export const mpesa = {
  stkPush: (data: { phoneNumber: string; amount: number; invoiceNumber: string }) => api.post<ApiResponse>('/mpesa/stk-push', data),
  checkStatus: (checkoutRequestId: string) => api.get<ApiResponse>(`/mpesa/stk-status/${checkoutRequestId}`),
  getTransactions: (params?: any) => api.get<ApiResponse>('/mpesa/transactions', { params }),
  getUnallocated: () => api.get<ApiResponse>('/mpesa/transactions/unallocated'),
  allocate: (transactionId: string, invoiceId: string) => api.post<ApiResponse>(`/mpesa/allocate/${transactionId}`, { invoiceId }),
  getStats: (params?: any) => api.get<ApiResponse>('/mpesa/statistics', { params }),
};

export const lab = {
  getTests: (params?: any) => api.get<ApiResponse>('/lab/tests', { params }),
  getPending: () => api.get<ApiResponse>('/lab/tests/pending'),
  createOrder: (data: any) => api.post<ApiResponse>('/lab/tests', data),
  updateTest: (id: string, data: any) => api.put<ApiResponse>(`/lab/tests/${id}`, data),
  enterResults: (id: string, results: any) => api.post<ApiResponse>(`/lab/tests/${id}/results`, results),
  collectSample: (id: string) => api.post<ApiResponse>(`/lab/tests/${id}/collect-sample`),
  getCatalog: () => api.get<ApiResponse>('/lab/catalog'),
  addToCatalog: (data: any) => api.post<ApiResponse>('/lab/catalog', data),
};

export const pharmacy = {
  getDrugs: (params?: any) => api.get<ApiResponse>('/pharmacy/drugs', { params }),
  getDrugById: (id: string) => api.get<ApiResponse>(`/pharmacy/drugs/${id}`),
  createDrug: (data: any) => api.post<ApiResponse>('/pharmacy/drugs', data),
  updateDrug: (id: string, data: any) => api.put<ApiResponse>(`/pharmacy/drugs/${id}`, data),
  adjustStock: (data: any) => api.post<ApiResponse>('/pharmacy/stock/adjust', data),
  getLowStock: () => api.get<ApiResponse>('/pharmacy/alerts/low-stock'),
  getExpiring: () => api.get<ApiResponse>('/pharmacy/alerts/expiring'),
  createPrescription: (data: any) => api.post<ApiResponse>('/pharmacy/prescriptions', data),
  getPendingPrescriptions: () => api.get<ApiResponse>('/pharmacy/prescriptions/pending'),
  dispense: (data: any) => api.post<ApiResponse>('/pharmacy/prescriptions/dispense', data),
};

export const procurement = {
  getSuppliers: (params?: any) => api.get<ApiResponse>('/procurement/suppliers', { params }),
  createSupplier: (data: any) => api.post<ApiResponse>('/procurement/suppliers', data),
  getPurchaseOrders: (params?: any) => api.get<ApiResponse>('/procurement/purchase-orders', { params }),
  createPO: (data: any) => api.post<ApiResponse>('/procurement/purchase-orders', data),
  approvePO: (id: string) => api.post<ApiResponse>(`/procurement/purchase-orders/${id}/approve`),
  receivePO: (id: string, items: any) => api.post<ApiResponse>(`/procurement/purchase-orders/${id}/receive`, { items }),
};

export const reports = {
  getFinancial: (params: any) => api.get<ApiResponse>('/reports/financial/revenue', { params }),
  getMedical: (params: any) => api.get<ApiResponse>('/reports/medical/visits', { params }),
  getInventory: (params: any) => api.get<ApiResponse>('/reports/inventory', { params }),
  getAuditLogs: (params: any) => api.get<ApiResponse>('/reports/audit', { params }),
};

export const print = {
  getReceiptUrl: (paymentId: string) => `${baseURL}/print/receipt/${paymentId}`,
  getInvoiceUrl: (invoiceId: string) => `${baseURL}/print/invoice/${invoiceId}`,
  getLabReportUrl: (orderId: string) => `${baseURL}/print/lab-report/${orderId}`,
};

export default api;