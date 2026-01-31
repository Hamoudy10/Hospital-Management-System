import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FlaskConical, Search, Plus, FileText, Clock, CheckCircle, 
  Eye, Edit, Filter 
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

interface LabTest {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string;
  price: number;
  turnaroundTime: string;
  sampleType: string;
  isActive: boolean;
}

interface LabRequest {
  id: string;
  patientId: string;
  patientName: string;
  testId: string;
  testName: string;
  requestedBy: string;
  requestedAt: string;
  status: 'pending' | 'sample_collected' | 'processing' | 'completed' | 'cancelled';
  priority: 'routine' | 'urgent' | 'stat';
  results?: string;
}

const testCategories = [
  'Hematology',
  'Biochemistry',
  'Microbiology',
  'Serology',
  'Urinalysis',
  'Imaging',
  'Pathology',
];

const mockLabTests: LabTest[] = [
  {
    id: '1',
    code: 'CBC',
    name: 'Complete Blood Count',
    category: 'Hematology',
    description: 'Measures red blood cells, white blood cells, hemoglobin, hematocrit, and platelets',
    price: 800,
    turnaroundTime: '2 hours',
    sampleType: 'Blood',
    isActive: true,
  },
  {
    id: '2',
    code: 'FBS',
    name: 'Fasting Blood Sugar',
    category: 'Biochemistry',
    description: 'Measures blood glucose levels after fasting',
    price: 300,
    turnaroundTime: '1 hour',
    sampleType: 'Blood',
    isActive: true,
  },
  {
    id: '3',
    code: 'LFT',
    name: 'Liver Function Test',
    category: 'Biochemistry',
    description: 'Measures liver enzymes, proteins, and bilirubin',
    price: 1500,
    turnaroundTime: '4 hours',
    sampleType: 'Blood',
    isActive: true,
  },
  {
    id: '4',
    code: 'RFT',
    name: 'Renal Function Test',
    category: 'Biochemistry',
    description: 'Measures kidney function including creatinine and BUN',
    price: 1200,
    turnaroundTime: '4 hours',
    sampleType: 'Blood',
    isActive: true,
  },
  {
    id: '5',
    code: 'URINALYSIS',
    name: 'Urinalysis Complete',
    category: 'Urinalysis',
    description: 'Physical, chemical, and microscopic analysis of urine',
    price: 400,
    turnaroundTime: '2 hours',
    sampleType: 'Urine',
    isActive: true,
  },
  {
    id: '6',
    code: 'LIPID',
    name: 'Lipid Profile',
    category: 'Biochemistry',
    description: 'Measures cholesterol, triglycerides, HDL, and LDL',
    price: 1200,
    turnaroundTime: '4 hours',
    sampleType: 'Blood',
    isActive: true,
  },
  {
    id: '7',
    code: 'WIDAL',
    name: 'Widal Test',
    category: 'Serology',
    description: 'Tests for typhoid fever antibodies',
    price: 500,
    turnaroundTime: '2 hours',
    sampleType: 'Blood',
    isActive: true,
  },
  {
    id: '8',
    code: 'MALARIA',
    name: 'Malaria Rapid Test',
    category: 'Microbiology',
    description: 'Rapid diagnostic test for malaria parasites',
    price: 350,
    turnaroundTime: '30 minutes',
    sampleType: 'Blood',
    isActive: true,
  },
];

const mockLabRequests: LabRequest[] = [
  {
    id: '1',
    patientId: 'KH-ABC123',
    patientName: 'John Kamau',
    testId: '1',
    testName: 'Complete Blood Count',
    requestedBy: 'Dr. James Mwangi',
    requestedAt: '2024-01-20 09:30',
    status: 'processing',
    priority: 'routine',
  },
  {
    id: '2',
    patientId: 'KH-DEF456',
    patientName: 'Mary Wanjiku',
    testId: '6',
    testName: 'Lipid Profile',
    requestedBy: 'Dr. Sarah Odhiambo',
    requestedAt: '2024-01-20 08:15',
    status: 'completed',
    priority: 'routine',
    results: 'Normal levels',
  },
  {
    id: '3',
    patientId: 'KH-GHI789',
    patientName: 'Peter Ochieng',
    testId: '8',
    testName: 'Malaria Rapid Test',
    requestedBy: 'Dr. Faith Njeri',
    requestedAt: '2024-01-20 10:00',
    status: 'pending',
    priority: 'urgent',
  },
];

interface LabTestCatalogProps {
  mode?: 'catalog' | 'requests';
  onSelectTest?: (test: LabTest) => void;
}

export const LabTestCatalog: React.FC<LabTestCatalogProps> = ({
  mode = 'catalog',
  onSelectTest,
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'requests'>(mode);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const { toast } = useToast();

  const filteredTests = mockLabTests.filter(test => {
    const matchesSearch = test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || test.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusBadge = (status: LabRequest['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="border-alert-orange text-alert-orange">Pending</Badge>;
      case 'sample_collected':
        return <Badge className="bg-secondary-olive">Sample Collected</Badge>;
      case 'processing':
        return <Badge className="bg-primary-blue">Processing</Badge>;
      case 'completed':
        return <Badge className="bg-success-green">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">Cancelled</Badge>;
    }
  };

  const getPriorityBadge = (priority: LabRequest['priority']) => {
    switch (priority) {
      case 'stat':
        return <Badge className="bg-critical-red">STAT</Badge>;
      case 'urgent':
        return <Badge className="bg-alert-orange">Urgent</Badge>;
      case 'routine':
        return <Badge variant="outline">Routine</Badge>;
    }
  };

  const handleAddTest = () => {
    setShowAddModal(false);
    toast({
      title: 'Test Added',
      description: 'New lab test has been added to the catalog.',
    });
  };

  const renderCatalog = () => (
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
            placeholder="Search tests by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue"
          >
            <option value="">All Categories</option>
            {testCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <Button onClick={() => setShowAddModal(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Test
          </Button>
        </div>
      </div>

      {/* Test Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredTests.map((test) => (
            <motion.div
              key={test.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              whileHover={{ y: -4 }}
              className="cursor-pointer"
              onClick={() => onSelectTest?.(test)}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline" className="font-mono">{test.code}</Badge>
                    <Badge className="bg-admin-purple/20 text-admin-purple">{test.category}</Badge>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{test.name}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{test.description}</p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <FlaskConical className="w-4 h-4" />
                      <span>Sample: {test.sampleType}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>TAT: {test.turnaroundTime}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <span className="font-bold text-primary-blue">KES {test.price.toLocaleString()}</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredTests.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <FlaskConical className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No tests found matching your criteria.</p>
        </div>
      )}
    </motion.div>
  );

  const renderRequests = () => (
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
            placeholder="Search by patient name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Request
          </Button>
        </div>
      </div>

      {/* Requests Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead>Test</TableHead>
              <TableHead className="hidden md:table-cell">Requested By</TableHead>
              <TableHead className="hidden lg:table-cell">Date/Time</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockLabRequests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{request.patientName}</p>
                    <p className="text-xs text-gray-500">{request.patientId}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-primary-blue" />
                    {request.testName}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">{request.requestedBy}</TableCell>
                <TableCell className="hidden lg:table-cell">{request.requestedAt}</TableCell>
                <TableCell>{getPriorityBadge(request.priority)}</TableCell>
                <TableCell>{getStatusBadge(request.status)}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon">
                      <Eye className="w-4 h-4" />
                    </Button>
                    {request.status === 'pending' && (
                      <Button variant="ghost" size="icon" className="text-success-green">
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    )}
                    {request.status === 'processing' && (
                      <Button variant="ghost" size="icon">
                        <FileText className="w-4 h-4" />
                      </Button>
                    )}
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
            <FlaskConical className="w-6 h-6 text-primary-blue" />
            Laboratory
          </CardTitle>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <Button
              variant={activeTab === 'catalog' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('catalog')}
            >
              Test Catalog
            </Button>
            <Button
              variant={activeTab === 'requests' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('requests')}
            >
              Lab Requests
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {activeTab === 'catalog' ? renderCatalog() : renderRequests()}
      </CardContent>

      {/* Add Test Modal */}
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
              className="bg-white rounded-xl p-6 w-full max-w-lg"
            >
              <h3 className="text-lg font-semibold mb-4">Add New Lab Test</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Test Code</label>
                    <Input placeholder="e.g., CBC" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                      {testCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Test Name</label>
                  <Input placeholder="Full test name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
                    placeholder="Test description..."
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (KES)</label>
                    <Input type="number" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">TAT</label>
                    <Input placeholder="e.g., 2 hours" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sample Type</label>
                    <Input placeholder="e.g., Blood" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button onClick={handleAddTest}>Add Test</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default LabTestCatalog;