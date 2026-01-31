import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Truck, Search, Plus, Phone, Mail, MapPin, 
  Star, Edit, Eye, FileText, ShoppingCart
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { useToast } from '../ui/use-toast';

interface Supplier {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  category: string[];
  rating: number;
  status: 'active' | 'inactive' | 'suspended';
  paymentTerms: string;
  creditLimit: number;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  orderDate: string;
  expectedDelivery: string;
  status: 'draft' | 'pending' | 'approved' | 'ordered' | 'delivered' | 'cancelled';
  items: number;
  totalAmount: number;
}

const supplierCategories = [
  'Pharmaceuticals',
  'Medical Equipment',
  'Laboratory Supplies',
  'Office Supplies',
  'Surgical Instruments',
  'Consumables',
  'IT Equipment',
];

const mockSuppliers: Supplier[] = [
  {
    id: '1',
    code: 'SUP-001',
    name: 'Dawa Pharmaceuticals Ltd',
    contactPerson: 'James Omondi',
    email: 'orders@dawapharma.co.ke',
    phone: '+254 722 123 456',
    address: 'Industrial Area, Nairobi',
    city: 'Nairobi',
    category: ['Pharmaceuticals'],
    rating: 4.5,
    status: 'active',
    paymentTerms: 'Net 30',
    creditLimit: 500000,
    totalOrders: 45,
    totalSpent: 2500000,
    lastOrderDate: '2024-01-15',
  },
  {
    id: '2',
    code: 'SUP-002',
    name: 'MedEquip Kenya',
    contactPerson: 'Sarah Njeri',
    email: 'sales@medequip.co.ke',
    phone: '+254 733 234 567',
    address: 'Westlands, Nairobi',
    city: 'Nairobi',
    category: ['Medical Equipment', 'Surgical Instruments'],
    rating: 4.8,
    status: 'active',
    paymentTerms: 'Net 45',
    creditLimit: 1000000,
    totalOrders: 23,
    totalSpent: 4500000,
    lastOrderDate: '2024-01-18',
  },
  {
    id: '3',
    code: 'SUP-003',
    name: 'Lab Supplies East Africa',
    contactPerson: 'Peter Kimani',
    email: 'info@labsupplies.co.ke',
    phone: '+254 711 345 678',
    address: 'Mombasa Road, Nairobi',
    city: 'Nairobi',
    category: ['Laboratory Supplies', 'Consumables'],
    rating: 4.2,
    status: 'active',
    paymentTerms: 'Net 15',
    creditLimit: 200000,
    totalOrders: 67,
    totalSpent: 890000,
    lastOrderDate: '2024-01-20',
  },
  {
    id: '4',
    code: 'SUP-004',
    name: 'Office World Kenya',
    contactPerson: 'Grace Wambui',
    email: 'orders@officeworld.co.ke',
    phone: '+254 700 456 789',
    address: 'CBD, Nairobi',
    city: 'Nairobi',
    category: ['Office Supplies'],
    rating: 3.8,
    status: 'inactive',
    paymentTerms: 'COD',
    creditLimit: 50000,
    totalOrders: 12,
    totalSpent: 150000,
    lastOrderDate: '2023-12-01',
  },
];

const mockPurchaseOrders: PurchaseOrder[] = [
  {
    id: '1',
    poNumber: 'PO-2024-001',
    supplierId: '1',
    supplierName: 'Dawa Pharmaceuticals Ltd',
    orderDate: '2024-01-15',
    expectedDelivery: '2024-01-20',
    status: 'delivered',
    items: 15,
    totalAmount: 125000,
  },
  {
    id: '2',
    poNumber: 'PO-2024-002',
    supplierId: '2',
    supplierName: 'MedEquip Kenya',
    orderDate: '2024-01-18',
    expectedDelivery: '2024-01-25',
    status: 'ordered',
    items: 5,
    totalAmount: 350000,
  },
  {
    id: '3',
    poNumber: 'PO-2024-003',
    supplierId: '3',
    supplierName: 'Lab Supplies East Africa',
    orderDate: '2024-01-20',
    expectedDelivery: '2024-01-22',
    status: 'pending',
    items: 20,
    totalAmount: 45000,
  },
];

interface SupplierManagerProps {
  onSelectSupplier?: (supplier: Supplier) => void;
}

export const SupplierManager: React.FC<SupplierManagerProps> = ({
  onSelectSupplier,
}) => {
  const [activeTab, setActiveTab] = useState<'suppliers' | 'orders'>('suppliers');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const { toast } = useToast();

  const filteredSuppliers = mockSuppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || supplier.category.includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const getStatusBadge = (status: Supplier['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success-green">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'suspended':
        return <Badge className="bg-critical-red">Suspended</Badge>;
    }
  };

  const getOrderStatusBadge = (status: PurchaseOrder['status']) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'pending':
        return <Badge className="bg-alert-orange">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-primary-blue">Approved</Badge>;
      case 'ordered':
        return <Badge className="bg-admin-purple">Ordered</Badge>;
      case 'delivered':
        return <Badge className="bg-success-green">Delivered</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">Cancelled</Badge>;
    }
  };

  const renderRating = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'text-yellow-400 fill-yellow-400'
                : star <= rating + 0.5
                ? 'text-yellow-400 fill-yellow-400/50'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-gray-600 ml-1">({rating})</span>
      </div>
    );
  };

  const handleAddSupplier = () => {
    setShowAddModal(false);
    toast({
      title: 'Supplier Added',
      description: 'New supplier has been added successfully.',
    });
  };

  const handleCreateOrder = () => {
    setShowOrderModal(false);
    toast({
      title: 'Purchase Order Created',
      description: 'New purchase order has been created.',
    });
  };

  const renderSuppliers = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue"
        >
          <option value="">All Categories</option>
          {supplierCategories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <Button onClick={() => setShowAddModal(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Supplier
        </Button>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredSuppliers.map((supplier) => (
            <motion.div
              key={supplier.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              whileHover={{ y: -4 }}
              className="cursor-pointer"
              onClick={() => onSelectSupplier?.(supplier)}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant="outline" className="font-mono">{supplier.code}</Badge>
                    {getStatusBadge(supplier.status)}
                  </div>
                  
                  <h3 className="font-semibold text-lg mb-1">{supplier.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{supplier.contactPerson}</p>
                  
                  {renderRating(supplier.rating)}
                  
                  <div className="space-y-2 mt-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{supplier.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{supplier.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{supplier.city}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mt-3">
                    {supplier.category.map(cat => (
                      <Badge key={cat} variant="secondary" className="text-xs">{cat}</Badge>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t text-sm">
                    <div>
                      <p className="text-gray-500">Total Orders</p>
                      <p className="font-semibold">{supplier.totalOrders}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-500">Total Spent</p>
                      <p className="font-semibold text-primary-blue">
                        KES {supplier.totalSpent.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-1 mt-4">
                    <Button variant="outline" size="sm" className="flex-1 gap-1">
                      <Eye className="w-4 h-4" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 gap-1">
                      <ShoppingCart className="w-4 h-4" />
                      Order
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );

  const renderOrders = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search purchase orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setShowOrderModal(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Purchase Order
        </Button>
      </div>

      {/* Orders Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PO Number</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead className="hidden md:table-cell">Order Date</TableHead>
              <TableHead className="hidden lg:table-cell">Expected Delivery</TableHead>
              <TableHead className="text-center">Items</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockPurchaseOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-mono font-medium text-primary-blue">
                  {order.poNumber}
                </TableCell>
                <TableCell>{order.supplierName}</TableCell>
                <TableCell className="hidden md:table-cell">
                  {new Date(order.orderDate).toLocaleDateString()}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {new Date(order.expectedDelivery).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-center">{order.items}</TableCell>
                <TableCell>{getOrderStatusBadge(order.status)}</TableCell>
                <TableCell className="text-right font-medium">
                  KES {order.totalAmount.toLocaleString()}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <FileText className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-6 h-6 text-primary-blue" />
            Procurement & Suppliers
          </CardTitle>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <Button
              variant={activeTab === 'suppliers' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('suppliers')}
            >
              Suppliers
            </Button>
            <Button
              variant={activeTab === 'orders' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('orders')}
            >
              Purchase Orders
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {activeTab === 'suppliers' ? renderSuppliers() : renderOrders()}
      </CardContent>

      {/* Add Supplier Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-lg font-semibold mb-4">Add New Supplier</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Code</label>
                    <Input placeholder="Auto-generated" disabled />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                  <Input placeholder="Supplier company name" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                    <Input placeholder="Primary contact name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <Input placeholder="+254 7XX XXX XXX" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <Input type="email" placeholder="supplier@company.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <Input placeholder="Physical address" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <Input placeholder="City" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                      <option>COD</option>
                      <option>Net 15</option>
                      <option>Net 30</option>
                      <option>Net 45</option>
                      <option>Net 60</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categories</label>
                  <div className="flex flex-wrap gap-2">
                    {supplierCategories.map(cat => (
                      <label key={cat} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" className="rounded border-gray-300" />
                        {cat}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Credit Limit (KES)</label>
                  <Input type="number" placeholder="0" />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button onClick={handleAddSupplier}>Add Supplier</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Order Modal */}
      <AnimatePresence>
        {showOrderModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowOrderModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-lg font-semibold mb-4">Create Purchase Order</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PO Number</label>
                    <Input placeholder="Auto-generated" disabled />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Order Date</label>
                    <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="">Select supplier</option>
                    {mockSuppliers.filter(s => s.status === 'active').map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expected Delivery Date</label>
                  <Input type="date" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
                    placeholder="Order notes..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setShowOrderModal(false)}>Cancel</Button>
                <Button onClick={handleCreateOrder}>Create Order</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default SupplierManager;