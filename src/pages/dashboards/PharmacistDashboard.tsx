import { motion } from "framer-motion";
import {
  Pill,
  Package,
  Clock,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  FileText,
  TrendingDown,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, StatCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";

// Sample data
const pendingPrescriptions = [
  { id: 1, rxNo: "RX240115001", patient: "John Doe", doctor: "Dr. Mwangi", items: 3, status: "pending", time: "10:30 AM" },
  { id: 2, rxNo: "RX240115002", patient: "Mary Jane", doctor: "Dr. Ochieng", items: 2, status: "pending", time: "10:45 AM" },
  { id: 3, rxNo: "RX240115003", patient: "Peter Ochieng", doctor: "Dr. Mwangi", items: 5, status: "partial", time: "11:00 AM" },
];

const lowStockItems = [
  { id: 1, code: "DRG001", name: "Paracetamol 500mg", currentStock: 45, reorderLevel: 100, expiryDays: 180 },
  { id: 2, code: "DRG003", name: "Amoxicillin 500mg", currentStock: 23, reorderLevel: 50, expiryDays: 90 },
  { id: 3, code: "DRG008", name: "Coartem (AL)", currentStock: 15, reorderLevel: 100, expiryDays: 120 },
];

const expiringDrugs = [
  { id: 1, name: "Metformin 500mg", batch: "BAT2023001", quantity: 200, expiryDate: "2024-02-15", daysLeft: 30 },
  { id: 2, name: "Omeprazole 20mg", batch: "BAT2023045", quantity: 50, expiryDate: "2024-02-28", daysLeft: 43 },
];

const recentDispensing = [
  { id: 1, rxNo: "RX240115000", patient: "Grace Wanjiku", items: 4, total: 1250, time: "10:00 AM" },
  { id: 2, rxNo: "RX240114099", patient: "David Kamau", items: 2, total: 580, time: "09:30 AM" },
  { id: 3, rxNo: "RX240114098", patient: "Sarah Njeri", items: 3, total: 920, time: "09:00 AM" },
];

export function PharmacistDashboard() {
  const { user } = useAuth();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount);
  };

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
            Hello, {user?.firstName}! 💊
          </h1>
          <p className="text-gray-500">
            Pharmacy overview for {new Date().toLocaleDateString("en-KE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Package className="mr-2 h-4 w-4" />
            Inventory
          </Button>
          <Button>
            <FileText className="mr-2 h-4 w-4" />
            Dispense
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
          title="Pending Prescriptions"
          value="12"
          icon={<Clock className="h-6 w-6" />}
          iconBgColor="bg-[#e88b39]"
        />
        <StatCard
          title="Dispensed Today"
          value="45"
          icon={<CheckCircle2 className="h-6 w-6" />}
          iconBgColor="bg-[#41a02f]"
        />
        <StatCard
          title="Low Stock Items"
          value="8"
          icon={<TrendingDown className="h-6 w-6" />}
          iconBgColor="bg-[#9b162d]"
        />
        <StatCard
          title="Expiring Soon"
          value="5"
          icon={<Calendar className="h-6 w-6" />}
          iconBgColor="bg-[#a06695]"
        />
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Prescriptions */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5 text-[#e88b39]" />
                Pending Prescriptions
              </CardTitle>
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rx #</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Prescribed By</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingPrescriptions.map((rx) => (
                    <TableRow key={rx.id}>
                      <TableCell className="font-medium text-[#2438a6]">
                        {rx.rxNo}
                      </TableCell>
                      <TableCell>{rx.patient}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{rx.doctor}</p>
                          <p className="text-xs text-gray-500">{rx.time}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{rx.items} items</Badge>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={rx.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" className="bg-[#41a02f] hover:bg-[#358026]">
                          Dispense
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>

        {/* Low Stock Alerts */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="h-5 w-5 text-[#9b162d]" />
                Low Stock Alert
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-red-50 rounded-lg border border-red-100"
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-medium text-sm">{item.name}</p>
                    <Badge variant="destructive">{item.currentStock} left</Badge>
                  </div>
                  <p className="text-xs text-gray-500">Code: {item.code}</p>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-gray-500">Reorder Level: {item.reorderLevel}</p>
                    <Button size="sm" variant="outline">
                      Reorder
                    </Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full" size="sm">
                View All Low Stock
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Expiring Drugs & Recent Dispensing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expiring Soon */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#a06695]" />
                Expiring Soon
              </CardTitle>
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Drug</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Expires In</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expiringDrugs.map((drug) => (
                    <TableRow key={drug.id}>
                      <TableCell className="font-medium">{drug.name}</TableCell>
                      <TableCell>{drug.batch}</TableCell>
                      <TableCell>{drug.quantity}</TableCell>
                      <TableCell>
                        <Badge variant={drug.daysLeft <= 30 ? "destructive" : "warning"}>
                          {drug.daysLeft} days
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Dispensing */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-[#41a02f]" />
                Recent Dispensing
              </CardTitle>
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rx #</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentDispensing.map((rx) => (
                    <TableRow key={rx.id}>
                      <TableCell className="font-medium text-[#2438a6]">{rx.rxNo}</TableCell>
                      <TableCell>{rx.patient}</TableCell>
                      <TableCell>{rx.items}</TableCell>
                      <TableCell className="font-semibold text-[#41a02f]">
                        {formatCurrency(rx.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}