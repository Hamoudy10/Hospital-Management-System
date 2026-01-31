import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, Phone, Calendar, FileText, Eye, Edit, ChevronRight } from 'lucide-react';
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

interface Patient {
  id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email: string;
  lastVisit: string;
  status: 'active' | 'inactive' | 'admitted';
  insuranceProvider: string;
}

// Mock data for demonstration
const mockPatients: Patient[] = [
  {
    id: '1',
    patientId: 'KH-ABC123',
    firstName: 'John',
    lastName: 'Kamau',
    dateOfBirth: '1985-03-15',
    gender: 'Male',
    phone: '+254 712 345 678',
    email: 'john.kamau@email.com',
    lastVisit: '2024-01-15',
    status: 'active',
    insuranceProvider: 'NHIF',
  },
  {
    id: '2',
    patientId: 'KH-DEF456',
    firstName: 'Mary',
    lastName: 'Wanjiku',
    dateOfBirth: '1990-07-22',
    gender: 'Female',
    phone: '+254 723 456 789',
    email: 'mary.wanjiku@email.com',
    lastVisit: '2024-01-18',
    status: 'admitted',
    insuranceProvider: 'Jubilee',
  },
  {
    id: '3',
    patientId: 'KH-GHI789',
    firstName: 'Peter',
    lastName: 'Ochieng',
    dateOfBirth: '1978-11-08',
    gender: 'Male',
    phone: '+254 734 567 890',
    email: 'peter.ochieng@email.com',
    lastVisit: '2024-01-10',
    status: 'active',
    insuranceProvider: 'AAR',
  },
  {
    id: '4',
    patientId: 'KH-JKL012',
    firstName: 'Grace',
    lastName: 'Muthoni',
    dateOfBirth: '1995-05-30',
    gender: 'Female',
    phone: '+254 745 678 901',
    email: 'grace.muthoni@email.com',
    lastVisit: '2023-12-20',
    status: 'inactive',
    insuranceProvider: 'None',
  },
  {
    id: '5',
    patientId: 'KH-MNO345',
    firstName: 'David',
    lastName: 'Kipchoge',
    dateOfBirth: '1982-09-12',
    gender: 'Male',
    phone: '+254 756 789 012',
    email: 'david.kipchoge@email.com',
    lastVisit: '2024-01-20',
    status: 'active',
    insuranceProvider: 'Britam',
  },
];

interface PatientLookupProps {
  onSelectPatient?: (patient: Patient) => void;
  onViewPatient?: (patient: Patient) => void;
  onEditPatient?: (patient: Patient) => void;
}

export const PatientLookup: React.FC<PatientLookupProps> = ({
  onSelectPatient,
  onViewPatient,
  onEditPatient,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'name' | 'id' | 'phone'>('name');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const filteredPatients = mockPatients.filter(patient => {
    const term = searchTerm.toLowerCase();
    switch (searchType) {
      case 'name':
        return (
          patient.firstName.toLowerCase().includes(term) ||
          patient.lastName.toLowerCase().includes(term)
        );
      case 'id':
        return patient.patientId.toLowerCase().includes(term);
      case 'phone':
        return patient.phone.replace(/\s/g, '').includes(term.replace(/\s/g, ''));
      default:
        return true;
    }
  });

  const getStatusBadge = (status: Patient['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success-green">Active</Badge>;
      case 'admitted':
        return <Badge className="bg-alert-orange">Admitted</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
    }
  };

  const calculateAge = (dob: string): number => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    if (onSelectPatient) {
      onSelectPatient(patient);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-primary-blue" />
            Patient Lookup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder={
                  searchType === 'name' ? 'Search by patient name...' :
                  searchType === 'id' ? 'Search by patient ID...' :
                  'Search by phone number...'
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={searchType === 'name' ? 'default' : 'outline'}
                onClick={() => setSearchType('name')}
                size="sm"
              >
                <User className="w-4 h-4 mr-1" />
                Name
              </Button>
              <Button
                variant={searchType === 'id' ? 'default' : 'outline'}
                onClick={() => setSearchType('id')}
                size="sm"
              >
                <FileText className="w-4 h-4 mr-1" />
                ID
              </Button>
              <Button
                variant={searchType === 'phone' ? 'default' : 'outline'}
                onClick={() => setSearchType('phone')}
                size="sm"
              >
                <Phone className="w-4 h-4 mr-1" />
                Phone
              </Button>
            </div>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Age/Gender</TableHead>
                  <TableHead className="hidden lg:table-cell">Phone</TableHead>
                  <TableHead className="hidden lg:table-cell">Last Visit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {filteredPatients.length > 0 ? (
                    filteredPatients.map((patient) => (
                      <motion.tr
                        key={patient.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedPatient?.id === patient.id ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => handlePatientSelect(patient)}
                      >
                        <TableCell className="font-medium text-primary-blue">
                          {patient.patientId}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary-blue/10 flex items-center justify-center">
                              <User className="w-4 h-4 text-primary-blue" />
                            </div>
                            <div>
                              <p className="font-medium">{patient.firstName} {patient.lastName}</p>
                              <p className="text-xs text-gray-500 md:hidden">
                                {calculateAge(patient.dateOfBirth)}yrs, {patient.gender}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {calculateAge(patient.dateOfBirth)} yrs, {patient.gender}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">{patient.phone}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Calendar className="w-3 h-3" />
                            {new Date(patient.lastVisit).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(patient.status)}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onViewPatient) onViewPatient(patient);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onEditPatient) onEditPatient(patient);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No patients found matching your search criteria.
                      </TableCell>
                    </TableRow>
                  )}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
            <span>Showing {filteredPatients.length} of {mockPatients.length} patients</span>
            <Button variant="outline" size="sm">
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Selected Patient Quick View */}
      <AnimatePresence>
        {selectedPatient && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <Card className="border-primary-blue/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Selected Patient</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary-blue/10 flex items-center justify-center">
                      <User className="w-8 h-8 text-primary-blue" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">
                        {selectedPatient.firstName} {selectedPatient.lastName}
                      </h3>
                      <p className="text-gray-600">{selectedPatient.patientId}</p>
                      <div className="flex gap-2 mt-1">
                        {getStatusBadge(selectedPatient.status)}
                        <Badge variant="outline">{selectedPatient.insuranceProvider}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => onViewPatient?.(selectedPatient)}>
                      <Eye className="w-4 h-4 mr-2" />
                      View Records
                    </Button>
                    <Button onClick={() => onSelectPatient?.(selectedPatient)}>
                      <ChevronRight className="w-4 h-4 mr-2" />
                      Proceed
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PatientLookup;