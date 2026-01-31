import { motion } from "framer-motion";
import {
  Users,
  Calendar,
  UserPlus,
  Clock,
  ArrowRight,
  Search,
  CheckCircle2,
  Phone,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, StatCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";

// Sample data
const todayAppointments = [
  { id: 1, time: "09:00 AM", patient: "John Doe", phone: "+254722123456", doctor: "Dr. Mwangi", type: "Consultation", status: "checked_in" },
  { id: 2, time: "09:30 AM", patient: "Mary Jane", phone: "+254733234567", doctor: "Dr. Ochieng", type: "Follow-up", status: "scheduled" },
  { id: 3, time: "10:00 AM", patient: "Peter Kamau", phone: "+254744345678", doctor: "Dr. Mwangi", type: "Consultation", status: "scheduled" },
  { id: 4, time: "10:30 AM", patient: "Grace Wanjiku", phone: "+254755456789", doctor: "Dr. Njeri", type: "Procedure", status: "confirmed" },
  { id: 5, time: "11:00 AM", patient: "David Otieno", phone: "+254766567890", doctor: "Dr. Mwangi", type: "Follow-up", status: "scheduled" },
];

const recentRegistrations = [
  { id: 1, hospitalNo: "P24001234", name: "James Mwangi", phone: "+254722111222", registeredAt: "10 min ago" },
  { id: 2, hospitalNo: "P24001235", name: "Sarah Njeri", phone: "+254733222333", registeredAt: "45 min ago" },
  { id: 3, hospitalNo: "P24001236", name: "Michael Odhiambo", phone: "+254744333444", registeredAt: "1 hr ago" },
];

const walkInQueue = [
  { id: 1, name: "Ann Wambui", phone: "+254722999888", waitTime: "5 min", reason: "General Consultation" },
  { id: 2, name: "Joseph Kiptoo", phone: "+254733888777", waitTime: "12 min", reason: "Follow-up Visit" },
  { id: 3, name: "Lucy Achieng", phone: "+254744777666", waitTime: "20 min", reason: "Lab Results Collection" },
];

export function ReceptionistDashboard() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

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
            Welcome, {user?.firstName}! 🏥
          </h1>
          <p className="text-gray-500">
            Front desk overview for {new Date().toLocaleDateString("en-KE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Book Appointment
          </Button>
          <Button className="bg-[#41a02f] hover:bg-[#358026]">
            <UserPlus className="mr-2 h-4 w-4" />
            Register Patient
          </Button>
        </div>
      </motion.div>

      {/* Quick Search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Card>
          <CardContent className="py-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search patient by name, phone, hospital number, or ID..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>
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
          value="28"
          icon={<Calendar className="h-6 w-6" />}
          iconBgColor="bg-[#2438a6]"
        />
        <StatCard
          title="Checked In"
          value="12"
          icon={<CheckCircle2 className="h-6 w-6" />}
          iconBgColor="bg-[#41a02f]"
        />
        <StatCard
          title="Walk-in Queue"
          value="5"
          icon={<Users className="h-6 w-6" />}
          iconBgColor="bg-[#e88b39]"
        />
        <StatCard
          title="New Registrations Today"
          value="8"
          icon={<UserPlus className="h-6 w-6" />}
          iconBgColor="bg-[#a06695]"
        />
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Appointments */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#2438a6]" />
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
                    <TableHead>Doctor</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todayAppointments.map((apt) => (
                    <TableRow key={apt.id}>
                      <TableCell className="font-medium">{apt.time}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{apt.patient}</p>
                          <p className="text-xs text-gray-500">{apt.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>{apt.doctor}</TableCell>
                      <TableCell>{apt.type}</TableCell>
                      <TableCell>
                        <StatusBadge status={apt.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        {apt.status === "scheduled" || apt.status === "confirmed" ? (
                          <Button size="sm" className="bg-[#41a02f] hover:bg-[#358026]">
                            Check In
                          </Button>
                        ) : apt.status === "checked_in" ? (
                          <Button size="sm" variant="outline">
                            View
                          </Button>
                        ) : (
                          <Button size="sm" variant="ghost">
                            View
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

        {/* Walk-in Queue */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-[#e88b39]" />
                Walk-in Queue
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {walkInQueue.map((patient) => (
                <div
                  key={patient.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                >
                  <div>
                    <p className="font-medium text-sm">{patient.name}</p>
                    <p className="text-xs text-gray-500">{patient.reason}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" /> {patient.waitTime} waiting
                    </p>
                  </div>
                  <Button size="sm" variant="outline">
                    Serve
                  </Button>
                </div>
              ))}
              <Button variant="outline" className="w-full" size="sm">
                Add Walk-in
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Registrations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-[#41a02f]" />
              Recent Registrations
            </CardTitle>
            <Button variant="ghost" size="sm">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hospital No.</TableHead>
                  <TableHead>Patient Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentRegistrations.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium text-[#2438a6]">
                      {patient.hospitalNo}
                    </TableCell>
                    <TableCell>{patient.name}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-gray-400" />
                        {patient.phone}
                      </span>
                    </TableCell>
                    <TableCell>{patient.registeredAt}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline">
                          View Profile
                        </Button>
                        <Button size="sm">
                          Book Appointment
                        </Button>
                      </div>
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