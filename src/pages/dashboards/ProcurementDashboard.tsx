import React from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  Truck,
  ClipboardList,
  DollarSign,
  AlertTriangle,
  Building2,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const stats = [
  { label: 'Pending Orders', value: '8', icon: ClipboardList, color: 'bg-[#e88b39]' },
  { label: 'Active Suppliers', value: '24', icon: Truck, color: 'bg-[#41a02f]' },
  { label: 'Monthly Spend', value: 'KES 2.4M', icon: DollarSign, color: 'bg-[#2438a6]' },
  { label: 'Low Stock Items', value: '15', icon: AlertTriangle, color: 'bg-[#9b162d]' },
];

const pendingOrders = [
  { id: 'PO-2024-001', supplier: 'MedSupply Kenya', items: 25, total: 'KES 450,000', status: 'Approved', date: '2024-06-01' },
  { id: 'PO-2024-002', supplier: 'PharmaCare Ltd', items: 12, total: 'KES 280,000', status: 'Pending', date: '2024-06-02' },
  { id: 'PO-2024-003', supplier: 'LabEquip East', items: 5, total: 'KES 1,200,000', status: 'Ordered', date: '2024-05-28' },
  { id: 'PO-2024-004', supplier: 'Medical Supplies Co', items: 18, total: 'KES 320,000', status: 'Pending', date: '2024-06-03' },
];

const topSuppliers = [
  { id: 1, name: 'MedSupply Kenya', orders: 45, value: 'KES 8.5M', rating: 4.8 },
  { id: 2, name: 'PharmaCare Ltd', orders: 38, value: 'KES 6.2M', rating: 4.5 },
  { id: 3, name: 'LabEquip East', orders: 22, value: 'KES 4.8M', rating: 4.7 },
  { id: 4, name: 'Medical Supplies Co', orders: 30, value: 'KES 3.9M', rating: 4.3 },
];

const inventoryCategories = [
  { name: 'Pharmaceuticals', stock: 85, budget: 'KES 1.2M' },
  { name: 'Lab Consumables', stock: 72, budget: 'KES 450K' },
  { name: 'Medical Devices', stock: 90, budget: 'KES 380K' },
  { name: 'Office Supplies', stock: 45, budget: 'KES 80K' },
];

export const ProcurementDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Welcome Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {user?.firstName}
        </h1>
        <p className="text-gray-500">Procurement and supply chain management.</p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`rounded-full p-3 ${stat.color}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Purchase Orders */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Purchase Orders</CardTitle>
                <CardDescription>Recent and pending orders</CardDescription>
              </div>
              <Button variant="outline" size="sm">View All</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        order.status === 'Approved' ? 'bg-green-100' : order.status === 'Ordered' ? 'bg-blue-100' : 'bg-orange-100'
                      }`}>
                        <ClipboardList className={`h-5 w-5 ${
                          order.status === 'Approved' ? 'text-[#41a02f]' : order.status === 'Ordered' ? 'text-[#2438a6]' : 'text-[#e88b39]'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{order.id}</p>
                        <p className="text-sm text-gray-500">{order.supplier}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{order.total}</p>
                      <Badge variant={order.status === 'Approved' ? 'default' : order.status === 'Ordered' ? 'secondary' : 'outline'}>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Suppliers */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Top Suppliers</CardTitle>
                <CardDescription>By order value this year</CardDescription>
              </div>
              <Button variant="outline" size="sm">Manage</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topSuppliers.map((supplier) => (
                  <div
                    key={supplier.id}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                        <Building2 className="h-5 w-5 text-[#2438a6]" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{supplier.name}</p>
                        <p className="text-sm text-gray-500">{supplier.orders} orders</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{supplier.value}</p>
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-sm text-[#e88b39]">★</span>
                        <span className="text-sm text-gray-500">{supplier.rating}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Inventory Overview */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Inventory by Category</CardTitle>
            <CardDescription>Stock levels and monthly budget allocation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {inventoryCategories.map((category) => (
                <div key={category.name}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-medium">{category.name}</span>
                    <span className="text-gray-500">{category.stock}% stocked • {category.budget}</span>
                  </div>
                  <Progress 
                    value={category.stock} 
                    className="h-2" 
                    indicatorClassName={
                      category.stock < 50 ? 'bg-[#9b162d]' : 
                      category.stock < 75 ? 'bg-[#e88b39]' : 'bg-[#41a02f]'
                    } 
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-4">
        <Card className="cursor-pointer transition-colors hover:bg-gray-50">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-[#2438a6]/10 p-3">
              <ClipboardList className="h-6 w-6 text-[#2438a6]" />
            </div>
            <div>
              <p className="font-medium">New Order</p>
              <p className="text-sm text-gray-500">Create PO</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer transition-colors hover:bg-gray-50">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-[#41a02f]/10 p-3">
              <Truck className="h-6 w-6 text-[#41a02f]" />
            </div>
            <div>
              <p className="font-medium">Suppliers</p>
              <p className="text-sm text-gray-500">Manage list</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer transition-colors hover:bg-gray-50">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-[#e88b39]/10 p-3">
              <Package className="h-6 w-6 text-[#e88b39]" />
            </div>
            <div>
              <p className="font-medium">Receive Stock</p>
              <p className="text-sm text-gray-500">GRN Entry</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer transition-colors hover:bg-gray-50">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-[#a06695]/10 p-3">
              <FileText className="h-6 w-6 text-[#a06695]" />
            </div>
            <div>
              <p className="font-medium">Reports</p>
              <p className="text-sm text-gray-500">Analytics</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default ProcurementDashboard;