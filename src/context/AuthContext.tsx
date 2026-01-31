import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo users for testing different roles
const demoUsers: Record<string, User> = {
  'doctor@hospital.ke': {
    id: '1',
    email: 'doctor@hospital.ke',
    firstName: 'Dr. James',
    lastName: 'Mwangi',
    role: 'doctor' as UserRole,
    phone: '+254712345678',
    department: 'General Medicine',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  'nurse@hospital.ke': {
    id: '2',
    email: 'nurse@hospital.ke',
    firstName: 'Mary',
    lastName: 'Wanjiku',
    role: 'nurse' as UserRole,
    phone: '+254722345678',
    department: 'Nursing',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  'receptionist@hospital.ke': {
    id: '3',
    email: 'receptionist@hospital.ke',
    firstName: 'Grace',
    lastName: 'Achieng',
    role: 'receptionist' as UserRole,
    phone: '+254732345678',
    department: 'Reception',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  'accountant@hospital.ke': {
    id: '4',
    email: 'accountant@hospital.ke',
    firstName: 'Peter',
    lastName: 'Odhiambo',
    role: 'accountant' as UserRole,
    phone: '+254742345678',
    department: 'Finance',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  'labtech@hospital.ke': {
    id: '5',
    email: 'labtech@hospital.ke',
    firstName: 'Samuel',
    lastName: 'Kipchoge',
    role: 'lab_technician' as UserRole,
    phone: '+254752345678',
    department: 'Laboratory',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  'pharmacist@hospital.ke': {
    id: '6',
    email: 'pharmacist@hospital.ke',
    firstName: 'Faith',
    lastName: 'Njeri',
    role: 'pharmacist' as UserRole,
    phone: '+254762345678',
    department: 'Pharmacy',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  'procurement@hospital.ke': {
    id: '7',
    email: 'procurement@hospital.ke',
    firstName: 'David',
    lastName: 'Mutua',
    role: 'procurement' as UserRole,
    phone: '+254772345678',
    department: 'Procurement',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  'admin@hospital.ke': {
    id: '8',
    email: 'admin@hospital.ke',
    firstName: 'John',
    lastName: 'Kamau',
    role: 'admin' as UserRole,
    phone: '+254782345678',
    department: 'Administration',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored session
    const storedUser = localStorage.getItem('hms_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('hms_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const demoUser = demoUsers[email.toLowerCase()];
    
    if (demoUser && password === 'password123') {
      setUser(demoUser);
      localStorage.setItem('hms_user', JSON.stringify(demoUser));
      localStorage.setItem('hms_token', 'demo_jwt_token_' + demoUser.id);
      setIsLoading(false);
      return true;
    }

    setIsLoading(false);
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('hms_user');
    localStorage.removeItem('hms_token');
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      localStorage.setItem('hms_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;