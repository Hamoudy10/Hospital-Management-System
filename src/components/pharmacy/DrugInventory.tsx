import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Pill, Search, Plus, AlertTriangle, Package, 
  TrendingDown, Calendar, Edit, Trash2, Eye, RefreshCw
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

interface Drug {
  id: string;
  code: string;
  name: string;
  genericName: string;
  category: string;
  formulation: string;
  strength: string;
  unit: string;
  quantity: number;
  reorderLevel: number;
  costPrice: number;
  sellingPrice: number;
  expiryDate: string;
  supplier: string;
  batchNumber: string;
  location: string;
  isActive: boolean;
}

const drugCategories = [
  'Antibiotics',
  'Analgesics',
  'Antimalarials',
  'Antihypertensives',
  'Antidiabetics',
  'Vitamins & Supplements',
  'Antihistamines',
  'Gastrointestinal',
  'Cardiovascular',
  'Respiratory',
];

const mockDrugs: Drug[] = [
  {
    id: '1',
    code: 'AMOX500',
    name: 'Amoxicillin 500mg',
    genericName: 'Amoxicillin',
    category: 'Antibiotics',
    formulation: 'Capsules',
    strength: '500mg',
    unit: 'Capsule',
    quantity: 500,
    reorderLevel: 100,
    costPrice: 5,
    sellingPrice: 10,
    expiryDate: '2025-06-30',
    supplier: 'Dawa Pharmaceuticals',
    batchNumber: 'BAT-2024-001',
    location: 'Shelf A-1',
    isActive: true,
  },
  {
    id: '2',
    code: 'PARA500',
    name: 'Paracetamol 500mg',
    genericName: 'Paracetamol',
    category: 'Analgesics',
    formulation: 'Tablets',
    strength: '500mg',
    unit: 'Tablet',
    quantity: 1000,
    reorderLevel: 200,
    costPrice: 2,
    sellingPrice: 5,
    expiryDate: '2025-12-31',
    supplier: 'Kenya Pharma Ltd',
    batchNumber: 'BAT-2024-002',
    location: 'Shelf A-2',
    isActive: true,
  },
  {
    id: '3',
    code: 'ARTM20',
    name: 'Artemether-Lumefantrine 20/120mg',
    genericName: 'AL',
    category: 'Antimalarials',
    formulation: 'Tablets',
    strength: '20/120mg',
    unit: 'Pack',
    quantity: 50,
    reorderLevel: 30,
    costPrice: 150,
    sellingPrice: 250,
    expiryDate: '2024-08-15',
    supplier: 'Novartis Kenya',
    batchNumber: 'BAT-2024-003',
    location: 'Shelf B-1',
    isActive: true,
  },
  {
    id: '4',
    code: 'OMEP20',
    name: 'Omeprazole 20mg',
    genericName: 'Omeprazole',
    category: 'Gastrointestinal',
    formulation: 'Capsules',
    strength: '20mg',
    unit: 'Capsule',
    quantity: 80,
    reorderLevel: 100,
    costPrice: 8,
    sellingPrice: 15,
    expiryDate: '2024-03-10',
    supplier: 'Beta Healthcare',
    batchNumber: 'BAT-2024-004',
    location: 'Shelf C-1',
    isActive: true,
  },
  {
    id: '5',
    code: 'MET500',
    name: 'Metformin 500mg',
    genericName: 'Metformin',
    category: 'Antidiabetics',
    formulation: 'Tablets',
    strength: '500mg',
    unit: 'Tablet',
    quantity: 300,
    reorderLevel: 150,
    costPrice: 3,
    sellingPrice: 8,
    expiryDate: '2025-09-20',
    supplier: 'Cosmos Pharmaceuticals',
    batchNumber: 'BAT-2024-005',
    location: 'Shelf D-1',
    isActive: true,
  },
];

interface DrugInventoryProps {
  onSelectDrug?: (drug: Drug) => void;
}

export const DrugInventory: React.FC<DrugInventoryProps> = ({
  onSelectDrug,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [showExpiring, setShowExpiring] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [showAddModal, setShowAddModal] = useState(false);
  const { toast } = useToast();

  const isLowStock = (drug: Drug): boolean => drug.quantity <= drug.reorderLevel;
  
  const isExpiringSoon = (drug: Drug): boolean => {
    const expiryDate = new Date(drug.expiryDate);
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    return expiryDate <= threeMonthsFromNow;
  };

  const isExpired = (drug: Drug): boolean => {
    return new Date(drug.expiryDate) < new Date();
  };

  const filteredDrugs = mockDrugs.filter(drug => {
    const matchesSearch = drug.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      drug.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      drug.genericName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || drug.category === selectedCategory;
    const matchesLowStock = !showLowStock || isLowStock(drug);
    const matchesExpiring = !showExpiring || isExpiringSoon(drug);
    return matchesSearch && matchesCategory && matchesLowStock && matchesExpiring;
  });

  const lowStockCount = mockDrugs.filter(isLowStock).length;
  const expiringCount = mockDrugs.filter(isExpiringSoon).length;
  const totalValue = mockDrugs.reduce((sum, drug) => sum + (drug.quantity * drug.costPrice), 0);

  const getStockBadge = (drug: Drug) => {
    if (isExpired(drug)) {
      return <Badge className="bg-critical-red">Expired</Badge>;
    }
    if (drug.quantity === 0) {
      return <Badge className="bg-critical-red">Out of Stock</Badge>;
    }
    if (isLowStock(drug)) {
      return <Badge className="bg-alert-orange">Low Stock</Badge>;
    }
    return <Badge className="bg-success-green">In Stock</Badge>;
  };

  const handleAddDrug = () => {
    setShowAddModal(false);
    toast({
      title: 'Drug Added',
      description: 'New drug has been added to inventory.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary-blue to-primary-blue/80 text-white">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm">Total Items</p>
                <p className="text-2xl font-bold">{mockDrugs.length}</p>
              </div>
              <Package className="w-10 h-10 opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer transition-all ${showLowStock ? 'ring-2 ring-alert-orange' : ''}`}
          onClick={() => setShowLowStock(!showLowStock)}
        >
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Low Stock</p>
                <p className="text-2xl font-bold text-alert-orange">{lowStockCount}</p>
              </div>
              <TrendingDown className="w-10 h-10 text-alert-orange opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer transition-all ${showExpiring ? 'ring-2 ring-critical-red' : ''}`}
          onClick={() => setShowExpiring(!showExpiring)}
        >
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Expiring Soon</p>
                <p className="text-2xl font-bold text-critical-red">{expiringCount}</p>
              </div>
              <AlertTriangle className="w-10 h-10 text-critical-red opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Stock Value</p>
                <p className="text-2xl font-bold text-success-green">KES {totalValue.toLocaleString()}</p>
              </div>
              <RefreshCw className="w-10 h-10 text-success-green opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Pill className="w-6 h-6 text-primary-blue" />
              Drug Inventory
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                Table
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                Grid
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search drugs by name, code, or generic name..."
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
              {drugCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <Button onClick={() => setShowAddModal(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Drug
            </Button>
          </div>

          {/* Table View */}
          {viewMode === 'table' && (
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Drug Name</TableHead>
                    <TableHead className="hidden md:table-cell">Category</TableHead>
                    <TableHead className="text-center">Quantity</TableHead>
                    <TableHead className="hidden lg:table-cell">Expiry</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {filteredDrugs.map((drug) => (
                      <motion.tr
                        key={drug.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => onSelectDrug?.(drug)}
                      >
                        <TableCell className="font-mono text-sm">{drug.code}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{drug.name}</p>
                            <p className="text-xs text-gray-500">{drug.formulation}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline">{drug.category}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`font-medium ${isLowStock(drug) ? 'text-alert-orange' : ''}`}>
                            {drug.quantity}
                          </span>
                          <span className="text-gray-400 text-xs"> / {drug.reorderLevel}</span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className={`flex items-center gap-1 ${isExpiringSoon(drug) ? 'text-critical-red' : 'text-gray-600'}`}>
                            <Calendar className="w-3 h-3" />
                            {new Date(drug.expiryDate).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>{getStockBadge(drug)}</TableCell>
                        <TableCell className="text-right font-medium">
                          KES {drug.sellingPrice}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-critical-red">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          )}

          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {filteredDrugs.map((drug) => (
                  <motion.div
                    key={drug.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileHover={{ y: -4 }}
                    className="cursor-pointer"
                    onClick={() => onSelectDrug?.(drug)}
                  >
                    <Card className="h-full hover:shadow-lg transition-shadow">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-3">
                          <Badge variant="outline" className="font-mono">{drug.code}</Badge>
                          {getStockBadge(drug)}
                        </div>
                        <h3 className="font-semibold mb-1">{drug.name}</h3>
                        <p className="text-sm text-gray-500 mb-3">{drug.genericName} • {drug.formulation}</p>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                          <div>
                            <p className="text-gray-500">Quantity</p>
                            <p className={`font-medium ${isLowStock(drug) ? 'text-alert-orange' : ''}`}>
                              {drug.quantity} {drug.unit}s
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Expiry</p>
                            <p className={`font-medium ${isExpiringSoon(drug) ? 'text-critical-red' : ''}`}>
                              {new Date(drug.expiryDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t">
                          <span className="font-bold text-primary-blue">
                            KES {drug.sellingPrice}
                          </span>
                          <Badge variant="outline" className="text-xs">{drug.category}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {filteredDrugs.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Pill className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No drugs found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Drug Modal */}
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
              <h3 className="text-lg font-semibold mb-4">Add New Drug</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Drug Code</label>
                    <Input placeholder="e.g., AMOX500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                      {drugCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Drug Name</label>
                    <Input placeholder="Full drug name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Generic Name</label>
                    <Input placeholder="Generic name" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Formulation</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                      <option>Tablets</option>
                      <option>Capsules</option>
                      <option>Syrup</option>
                      <option>Injection</option>
                      <option>Cream</option>
                      <option>Ointment</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Strength</label>
                    <Input placeholder="e.g., 500mg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                    <Input placeholder="e.g., Tablet" />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <Input type="number" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
                    <Input type="number" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price</label>
                    <Input type="number" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price</label>
                    <Input type="number" placeholder="0" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                    <Input type="date" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number</label>
                    <Input placeholder="Batch number" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                    <Input placeholder="Supplier name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Storage Location</label>
                    <Input placeholder="e.g., Shelf A-1" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button onClick={handleAddDrug}>Add Drug</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DrugInventory;