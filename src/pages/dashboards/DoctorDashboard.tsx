import { motion } from "framer-motion";
import {
  Users,
  Calendar,
  ClipboardList,
  Clock,
  ArrowRight,
  Stethoscope,
  FileText,
  AlertCircle,
  CheckCircle2,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, StatCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";

// Sample data for demo
const todayAppointments = [
  { id: 1, time: "09:00 AM", patient: "John Doe", type: "Consultation", status: "completed" },
  { id: 2, time: "10:00 AM", patient: "Mary Jane", type: "Follow-up", status: "in_progress" },
  { id: 3, time: "11:00 AM", patient: "Peter Ochieng", type: "Consultation", status: "checked_in" },
  { id: 4, time: "02:00 PM", patient: "Grace Wanjiku", type: "Procedure", status: "scheduled" },
  { id: 5, time: "03:30 PM", patient: "David Kamau", type: "Follow-up", status: "scheduled" },
];

const recentPatients = [
  { id: 1, name: "John Doe", age: 45, gender: "Male", diagnosis: "Hypertension", lastVisit: "Today" },
  { id: 2, name: "Mary Jane", age: 32, gender: "Female", diagnosis: "Diabetes Type 2", lastVisit: "Today" },
  { id: 3, name: "Peter Ochieng", age: 28, gender: "Male", diagnosis: "URTI", lastVisit: "Yesterday" },
];

const pendingLabResults = [
  { id: 1, patient: "John Doe", test: "Complete Blood Count", requestedDate: "2024-01-15" },
  { id: 2, patient: "Mary Jane", test: "HBA1C", requestedDate: "2024-01-14" },
];

export function DoctorDashboard() {
  const { user } = useAuth();

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Good morning, {user?.first_name}! 👋
          </h1>
          <p className="text-gray-500">
            Here's your clinical overview for today, {new Date().toLocaleDateString("en-KE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            View Schedule
          </Button>
          <Button>
            <Users className="mr-2 h-4 w-4" />
            Start Consultation
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard
          title="Today's Appointments"
          value="12"
          icon={<Calendar className="h-6 w-6" />}
          iconBgColor="bg-[#2438a6]"
          change={{ value: 8, type: "increase" }}
        />
        <StatCard
          title="Patients Seen"
          value="7"
          icon={<Users className="h-6 w-6" />}
          iconBgColor="bg-[#41a02f]"
        />
        <StatCard
          title="Pending Lab Results"
          value="5"
          icon={<ClipboardList className="h-6 w-6" />}
          iconBgColor="bg-[#e88b39]"
        />
        <StatCard
          title="Active Prescriptions"
          value="23"
          icon={<FileText className="h-6 w-6" />}
          iconBgColor="bg-[#a06695]"
        />
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-[#2438a6]" />
                Today's Appointments
              </CardTitle>
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todayAppointments.map((apt) => (
                    <TableRow key={apt.id}>
                      <TableCell className="font-medium">{apt.time}</TableCell>
                      <TableCell>{apt.patient}</TableCell>
                      <TableCell>{apt.type}</TableCell>
                      <TableCell>
                        <StatusBadge status={apt.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        {apt.status === "checked_in" ? (
                          <Button size="sm" className="bg-[#41a02f] hover:bg-[#358026]">
                            Start
                          </Button>
                        ) : apt.status === "in_progress" ? (
                          <Button size="sm" variant="outline">
                            Continue
                          </Button>
                        ) : apt.status === "completed" ? (
                          <Button size="sm" variant="ghost">
                            View
                          </Button>
                        ) : (
                          <Button size="sm" variant="ghost" disabled>
                            Waiting
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions & Alerts */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          {/* Pending Lab Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5 text-[#e88b39]" />
                Pending Lab Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingLabResults.map((lab) => (
                <div
                  key={lab.id}
                  className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100"
                >
                  <div>
                    <p className="font-medium text-sm">{lab.patient}</p>
                    <p className="text-xs text-gray-500">{lab.test}</p>
                  </div>
                  <Badge variant="warning">Pending</Badge>
                </div>
              ))}
              <Button variant="outline" className="w-full" size="sm">
                View All Lab Requests
              </Button>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Today's Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#41a02f]" />
                  <span className="text-sm">Completed</span>
                </div>
                <span className="font-semibold">7</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#2438a6]" />
                  <span className="text-sm">In Progress</span>
                </div>
                <span className="font-semibold">1</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#70748d]" />
                  <span className="text-sm">Remaining</span>
                </div>
                <span className="font-semibold">4</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-[#9b162d]" />
                  <span className="text-sm">Cancelled</span>
                </div>
                <span className="font-semibold">0</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Patients */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-[#41a02f]" />
              Recent Patients
            </CardTitle>
            <Button variant="ghost" size="sm">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient Name</TableHead>
                  <TableHead>Age/Gender</TableHead>
                  <TableHead>Primary Diagnosis</TableHead>
                  <TableHead>Last Visit</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPatients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">{patient.name}</TableCell>
                    <TableCell>
                      {patient.age} yrs / {patient.gender}
                    </TableCell>
                    <TableCell>{patient.diagnosis}</TableCell>
                    <TableCell>{patient.lastVisit}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline">
                        View Record
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}