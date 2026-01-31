import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  CreditCard,
  TestTube,
  Pill,
  Package,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  Stethoscope,
  Activity,
  ClipboardList,
  Receipt,
  FlaskConical,
  Truck,
  Building2,
  UserCog,
  ShieldCheck,
  X,
  Heart,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole, roleDisplayNames } from '../../types';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  icon: React.ElementType;
  href?: string;
  children?: NavItem[];
  roles?: UserRole[];
}

const navigationItems: NavItem[] = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
  },
  {
    label: 'Patients',
    icon: Users,
    children: [
      { label: 'All Patients', icon: Users, href: '/patients' },
      { label: 'Register Patient', icon: UserCog, href: '/patients/register' },
      { label: 'Patient Lookup', icon: ClipboardList, href: '/patients/lookup' },
    ],
    roles: ['doctor', 'nurse', 'receptionist', 'admin'],
  },
  {
    label: 'Appointments',
    icon: Calendar,
    children: [
      { label: 'All Appointments', icon: Calendar, href: '/appointments' },
      { label: 'Book Appointment', icon: ClipboardList, href: '/appointments/book' },
      { label: 'Schedule', icon: Calendar, href: '/appointments/schedule' },
    ],
    roles: ['doctor', 'nurse', 'receptionist', 'admin'],
  },
  {
    label: 'Clinical',
    icon: Stethoscope,
    children: [
      { label: 'Medical Records', icon: FileText, href: '/clinical/records' },
      { label: 'Prescriptions', icon: ClipboardList, href: '/clinical/prescriptions' },
      { label: 'Vitals', icon: Activity, href: '/clinical/vitals' },
      { label: 'Diagnosis', icon: Stethoscope, href: '/clinical/diagnosis' },
    ],
    roles: ['doctor', 'nurse', 'admin'],
  },
  {
    label: 'Laboratory',
    icon: TestTube,
    children: [
      { label: 'Test Catalog', icon: FlaskConical, href: '/lab/catalog' },
      { label: 'Test Requests', icon: ClipboardList, href: '/lab/requests' },
      { label: 'Results', icon: FileText, href: '/lab/results' },
      { label: 'Sample Tracking', icon: TestTube, href: '/lab/samples' },
    ],
    roles: ['doctor', 'nurse', 'lab_technician', 'admin'],
  },
  {
    label: 'Pharmacy',
    icon: Pill,
    children: [
      { label: 'Drug Inventory', icon: Pill, href: '/pharmacy/inventory' },
      { label: 'Dispensing', icon: ClipboardList, href: '/pharmacy/dispensing' },
      { label: 'Stock Alerts', icon: Package, href: '/pharmacy/alerts' },
      { label: 'Expiry Tracking', icon: Calendar, href: '/pharmacy/expiry' },
    ],
    roles: ['pharmacist', 'admin'],
  },
  {
    label: 'Billing',
    icon: CreditCard,
    children: [
      { label: 'Invoices', icon: Receipt, href: '/billing/invoices' },
      { label: 'Create Invoice', icon: FileText, href: '/billing/create' },
      { label: 'Payments', icon: CreditCard, href: '/billing/payments' },
      { label: 'M-Pesa', icon: CreditCard, href: '/billing/mpesa' },
    ],
    roles: ['accountant', 'receptionist', 'admin'],
  },
  {
    label: 'Procurement',
    icon: Package,
    children: [
      { label: 'Suppliers', icon: Truck, href: '/procurement/suppliers' },
      { label: 'Purchase Orders', icon: ClipboardList, href: '/procurement/orders' },
      { label: 'Inventory', icon: Package, href: '/procurement/inventory' },
      { label: 'Assets', icon: Building2, href: '/procurement/assets' },
    ],
    roles: ['procurement', 'admin'],
  },
  {
    label: 'Reports',
    icon: BarChart3,
    children: [
      { label: 'Medical Reports', icon: FileText, href: '/reports/medical' },
      { label: 'Financial Reports', icon: CreditCard, href: '/reports/financial' },
      { label: 'Inventory Reports', icon: Package, href: '/reports/inventory' },
      { label: 'Analytics', icon: BarChart3, href: '/reports/analytics' },
    ],
    roles: ['doctor', 'accountant', 'admin'],
  },
  {
    label: 'Administration',
    icon: ShieldCheck,
    children: [
      { label: 'Users', icon: Users, href: '/admin/users' },
      { label: 'Roles & Permissions', icon: ShieldCheck, href: '/admin/roles' },
      { label: 'Departments', icon: Building2, href: '/admin/departments' },
      { label: 'Audit Logs', icon: FileText, href: '/admin/audit' },
    ],
    roles: ['admin'],
  },
  {
    label: 'Settings',
    icon: Settings,
    href: '/settings',
  },
];

const roleColors: Record<UserRole, string> = {
  doctor: 'bg-[#2438a6]',
  nurse: 'bg-[#41a02f]',
  receptionist: 'bg-[#e88b39]',
  accountant: 'bg-[#a06695]',
  lab_technician: 'bg-[#ccd563]',
  pharmacist: 'bg-[#70748d]',
  procurement: 'bg-[#9b162d]',
  admin: 'bg-[#2438a6]',
};

export const AppSidebar: React.FC<AppSidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>(['Dashboard']);

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    );
  };

  const filterNavByRole = (items: NavItem[]): NavItem[] => {
    return items.filter((item) => {
      if (!item.roles) return true;
      return user && item.roles.includes(user.role);
    });
  };

  const isActiveRoute = (href?: string) => {
    if (!href) return false;
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.[0] || '';
    const last = lastName?.[0] || '';
    return (first + last).toUpperCase() || 'U';
  };

  const renderNavItem = (item: NavItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.label);
    const isActive = isActiveRoute(item.href);
    const Icon = item.icon;

    if (hasChildren) {
      return (
        <div key={item.label}>
          <button
            onClick={() => toggleExpand(item.label)}
            className={cn(
              'flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              'text-gray-700 hover:bg-gray-100',
              isExpanded && 'bg-gray-50'
            )}
          >
            <div className="flex items-center gap-3">
              <Icon className="h-5 w-5 text-gray-500" />
              <span>{item.label}</span>
            </div>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )}
          </button>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="ml-4 mt-1 space-y-1 border-l border-gray-200 pl-3">
                  {filterNavByRole(item.children!).map((child) => renderNavItem(child, depth + 1))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    return (
      <NavLink
        key={item.label}
        to={item.href || '#'}
        onClick={() => onClose()}
        className={({ isActive: linkActive }) =>
          cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
            linkActive || isActive
              ? 'bg-[#2438a6] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          )
        }
      >
        <Icon className={cn('h-5 w-5', isActive ? 'text-white' : 'text-gray-500')} />
        <span>{item.label}</span>
      </NavLink>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white shadow-xl transition-transform duration-300 lg:static lg:translate-x-0 lg:shadow-none lg:border-r',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2438a6]">
              <Heart className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#2438a6]">Kenya HMS</h1>
              <p className="text-xs text-gray-500">Hospital Management</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            {filterNavByRole(navigationItems).map((item) => renderNavItem(item))}
          </div>
        </nav>

        {/* User Info */}
        <div className="border-t p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className={cn(roleColors[user?.role || 'doctor'], 'text-white')}>
                {getInitials(user?.firstName, user?.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 truncate">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {roleDisplayNames[user?.role || 'doctor']}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AppSidebar;