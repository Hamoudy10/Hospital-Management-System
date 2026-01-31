import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, Trash2, Calculator, Save, Printer, Search } from 'lucide-react';
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

interface InvoiceItem {
  id: string;
  description: string;
  category: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Patient {
  id: string;
  name: string;
  patientId: string;
}

const serviceCategories = [
  { id: 'consultation', name: 'Consultation', items: [
    { name: 'General Consultation', price: 500 },
    { name: 'Specialist Consultation', price: 1500 },
    { name: 'Emergency Consultation', price: 2500 },
  ]},
  { id: 'lab', name: 'Laboratory', items: [
    { name: 'Complete Blood Count (CBC)', price: 800 },
    { name: 'Blood Sugar Test', price: 300 },
    { name: 'Urinalysis', price: 400 },
    { name: 'Lipid Profile', price: 1200 },
    { name: 'Liver Function Test', price: 1500 },
  ]},
  { id: 'pharmacy', name: 'Pharmacy', items: [
    { name: 'Prescription Medication', price: 0 },
    { name: 'Over-the-Counter Drugs', price: 0 },
  ]},
  { id: 'procedure', name: 'Procedures', items: [
    { name: 'Wound Dressing', price: 500 },
    { name: 'Minor Surgery', price: 5000 },
    { name: 'ECG', price: 1000 },
    { name: 'X-Ray', price: 2000 },
    { name: 'Ultrasound', price: 3000 },
  ]},
  { id: 'admission', name: 'Admission', items: [
    { name: 'General Ward (per day)', price: 3000 },
    { name: 'Private Room (per day)', price: 8000 },
    { name: 'ICU (per day)', price: 25000 },
  ]},
];

const mockPatients: Patient[] = [
  { id: '1', name: 'John Kamau', patientId: 'KH-ABC123' },
  { id: '2', name: 'Mary Wanjiku', patientId: 'KH-DEF456' },
  { id: '3', name: 'Peter Ochieng', patientId: 'KH-GHI789' },
];

interface InvoiceCreateProps {
  patientId?: string;
  onSuccess?: (invoice: { invoiceNumber: string; total: number }) => void;
  onCancel?: () => void;
}

export const InvoiceCreate: React.FC<InvoiceCreateProps> = ({
  patientId,
  onSuccess,
  onCancel,
}) => {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(
    patientId ? mockPatients.find(p => p.patientId === patientId) || null : null
  );
  const [patientSearch, setPatientSearch] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const filteredPatients = mockPatients.filter(p =>
    p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.patientId.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const selectedCategoryData = serviceCategories.find(c => c.id === selectedCategory);

  const addItem = () => {
    if (!selectedService && !customDescription) {
      toast({
        title: 'Error',
        description: 'Please select a service or enter a custom description.',
        variant: 'destructive',
      });
      return;
    }

    const description = customDescription || selectedService;
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description,
      category: selectedCategory,
      quantity,
      unitPrice,
      total: quantity * unitPrice,
    };

    setItems([...items, newItem]);
    setSelectedService('');
    setCustomDescription('');
    setQuantity(1);
    setUnitPrice(0);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal - discountAmount;

  const generateInvoiceNumber = (): string => {
    const prefix = 'INV';
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${date}-${random}`;
  };

  const handleSubmit = async () => {
    if (!selectedPatient) {
      toast({
        title: 'Error',
        description: 'Please select a patient.',
        variant: 'destructive',
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one item to the invoice.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const invoiceNumber = generateInvoiceNumber();
      
      toast({
        title: 'Invoice Created Successfully',
        description: `Invoice ${invoiceNumber} created for KES ${total.toLocaleString()}`,
      });

      if (onSuccess) {
        onSuccess({ invoiceNumber, total });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to create invoice.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleServiceSelect = (serviceName: string) => {
    setSelectedService(serviceName);
    const service = selectedCategoryData?.items.find(i => i.name === serviceName);
    if (service) {
      setUnitPrice(service.price);
    }
  };

  return (
    <Card className="w-full max-w-5xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-6 h-6 text-primary-blue" />
          Create Invoice
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Patient Selection */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-3">Patient Information</h3>
          {selectedPatient ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{selectedPatient.name}</p>
                <p className="text-sm text-gray-600">{selectedPatient.patientId}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setSelectedPatient(null)}>
                Change
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search patient by name or ID..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              {patientSearch && (
                <div className="bg-white border rounded-lg max-h-40 overflow-y-auto">
                  {filteredPatients.map(patient => (
                    <div
                      key={patient.id}
                      onClick={() => {
                        setSelectedPatient(patient);
                        setPatientSearch('');
                      }}
                      className="p-2 hover:bg-gray-50 cursor-pointer"
                    >
                      <p className="font-medium">{patient.name}</p>
                      <p className="text-xs text-gray-500">{patient.patientId}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Add Items */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-3">Add Services/Items</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSelectedService('');
                  setUnitPrice(0);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue"
              >
                <option value="">Select category</option>
                {serviceCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
              <select
                value={selectedService}
                onChange={(e) => handleServiceSelect(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue"
                disabled={!selectedCategory}
              >
                <option value="">Select service</option>
                {selectedCategoryData?.items.map(item => (
                  <option key={item.name} value={item.name}>{item.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (KES)</label>
              <Input
                type="number"
                min="0"
                value={unitPrice}
                onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Custom Description (optional)
              </label>
              <Input
                placeholder="Enter custom item description..."
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
              />
            </div>
            <Button onClick={addItem} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Item
            </Button>
          </div>
        </div>

        {/* Invoice Items */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead className="text-center">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {items.length > 0 ? (
                  items.map((item) => (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <TableCell className="font-medium">{item.description}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className="capitalize">{item.category}</Badge>
                      </TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">KES {item.unitPrice.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-medium">KES {item.total.toLocaleString()}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          className="text-critical-red hover:text-critical-red/80"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </motion.tr>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No items added yet. Add services above.
                    </TableCell>
                  </TableRow>
                )}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>

        {/* Totals */}
        <div className="flex flex-col md:flex-row md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Discount (%)</label>
            <Input
              type="number"
              min="0"
              max="100"
              value={discount}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              className="w-24"
            />
          </div>
          <div className="bg-gray-50 p-4 rounded-lg min-w-[250px]">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">KES {subtotal.toLocaleString()}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between mb-2 text-success-green">
                <span>Discount ({discount}%):</span>
                <span>- KES {discountAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span className="text-primary-blue">KES {total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4 border-t">
          <div className="flex gap-2">
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Calculator className="w-4 h-4" />
              Preview
            </Button>
            <Button variant="outline" className="gap-2">
              <Printer className="w-4 h-4" />
              Print Draft
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2">
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Creating...' : 'Create Invoice'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoiceCreate;