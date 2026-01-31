import React from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Bed,
  ClipboardList,
  AlertTriangle,
  Heart,
  Thermometer,
  Clock,
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
  { label: 'Patients in Ward', value: '24', icon: Bed, color: 'bg-[#41a02f]' },
  { label: 'Vitals Pending', value: '8', icon: Activity, color: 'bg-[#e88b39]' },
  { label: 'Medications Due', value: '12', icon: ClipboardList, color: 'bg-[#a06695]' },
  { label: 'Critical Patients', value: '3', icon: AlertTriangle, color: 'bg-[#9b162d]' },
];

const wardPatients = [
  { id: 1, name: 'John Kamau', bed: 'A-12', condition: 'Stable', nextVitals: '10:00 AM' },
  { id: 2, name: 'Mary Wanjiku', bed: 'A-15', condition: 'Critical', nextVitals: '09:30 AM' },
  { id: 3, name: 'Peter Ochieng', bed: 'B-03', condition: 'Improving', nextVitals: '11:00 AM' },
  { id: 4, name: 'Grace Akinyi', bed: 'B-07', condition: 'Stable', nextVitals: '10:30 AM' },
];

const pendingMedications = [
  { id: 1, patient: 'John Kamau', medication: 'Paracetamol 500mg', time: '09:00 AM', status: 'due' },
  { id: 2, patient: 'Mary Wanjiku', medication: 'Insulin 10 units', time: '09:15 AM', status: 'due' },
  { id: 3, patient: 'Peter Ochieng', medication: 'Amoxicillin 250mg', time: '09:30 AM', status: 'upcoming' },
];

export const NurseDashboard: React.FC = () => {
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
          Welcome, Nurse {user?.firstName}
        </h1>
        <p className="text-gray-500">Ward overview and patient care tasks for today.</p>
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
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
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
        {/* Ward Patients */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Ward Patients</CardTitle>
                <CardDescription>Patients currently in your ward</CardDescription>
              </div>
              <Button variant="outline" size="sm">View All</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {wardPatients.map((patient) => (
                  <div
                    key={patient.id}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        patient.condition === 'Critical' ? 'bg-red-100' : 'bg-green-100'
                      }`}>
                        <Bed className={`h-5 w-5 ${
                          patient.condition === 'Critical' ? 'text-[#9b162d]' : 'text-[#41a02f]'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{patient.name}</p>
                        <p className="text-sm text-gray-500">Bed: {patient.bed}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={patient.condition === 'Critical' ? 'destructive' : 'default'}>
                        {patient.condition}
                      </Badge>
                      <p className="mt-1 text-xs text-gray-500">Next vitals: {patient.nextVitals}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pending Medications */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Medication Schedule</CardTitle>
                <CardDescription>Medications due for administration</CardDescription>
              </div>
              <Button variant="outline" size="sm">View All</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingMedications.map((med) => (
                  <div
                    key={med.id}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        med.status === 'due' ? 'bg-orange-100' : 'bg-gray-100'
                      }`}>
                        <ClipboardList className={`h-5 w-5 ${
                          med.status === 'due' ? 'text-[#e88b39]' : 'text-gray-500'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{med.patient}</p>
                        <p className="text-sm text-gray-500">{med.medication}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{med.time}</p>
                      <Badge variant={med.status === 'due' ? 'secondary' : 'outline'}>
                        {med.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-4">
        <Card className="cursor-pointer transition-colors hover:bg-gray-50">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-[#41a02f]/10 p-3">
              <Thermometer className="h-6 w-6 text-[#41a02f]" />
            </div>
            <div>
              <p className="font-medium">Record Vitals</p>
              <p className="text-sm text-gray-500">8 pending</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer transition-colors hover:bg-gray-50">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-[#e88b39]/10 p-3">
              <ClipboardList className="h-6 w-6 text-[#e88b39]" />
            </div>
            <div>
              <p className="font-medium">Care Notes</p>
              <p className="text-sm text-gray-500">Add notes</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer transition-colors hover:bg-gray-50">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-[#a06695]/10 p-3">
              <Heart className="h-6 w-6 text-[#a06695]" />
            </div>
            <div>
              <p className="font-medium">Medications</p>
              <p className="text-sm text-gray-500">Administer</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer transition-colors hover:bg-gray-50">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-[#2438a6]/10 p-3">
              <Clock className="h-6 w-6 text-[#2438a6]" />
            </div>
            <div>
              <p className="font-medium">Handover</p>
              <p className="text-sm text-gray-500">Shift notes</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Ward Occupancy */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Ward Occupancy</CardTitle>
            <CardDescription>Current bed utilization by ward</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span>Ward A (General)</span>
                  <span>18/24 beds</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>
              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span>Ward B (Pediatric)</span>
                  <span>12/20 beds</span>
                </div>
                <Progress value={60} className="h-2" indicatorClassName="bg-[#41a02f]" />
              </div>
              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span>ICU</span>
                  <span>8/10 beds</span>
                </div>
                <Progress value={80} className="h-2" indicatorClassName="bg-[#9b162d]" />
              </div>
              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span>Maternity</span>
                  <span>10/16 beds</span>
                </div>
                <Progress value={62.5} className="h-2" indicatorClassName="bg-[#a06695]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default NurseDashboard;