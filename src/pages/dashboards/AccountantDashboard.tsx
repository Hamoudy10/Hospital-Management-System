import { motion } from "framer-motion";
import {
  Receipt,
  TrendingUp,
  ArrowRight,
  Smartphone,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, StatCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";

// Sample data
const recentInvoices = [
  { id: 1, invoiceNo: "INV2401001", patient: "John Doe", amount: 5500, paid: 5500, status: "paid", date: "2024-01-15" },
  { id: 2, invoiceNo: "INV2401002", patient: "Mary Jane", amount: 12000, paid: 5000, status: "partial", date: "2024-01-15" },
  { id: 3, invoiceNo: "INV2401003", patient: "Peter Ochieng", amount: 3200, paid: 0, status: "pending", date: "2024-01-15" },
  { id: 4, invoiceNo: "INV2401004", patient: "Grace Wanjiku", amount: 8500, paid: 0, status: "overdue", date: "2024-01-10" },
];

const recentMpesaPayments = [
  { id: 1, transId: "RAJ123456", phone: "254722***456", amount: 5500, account: "INV2401001", time: "10:25 AM", status: "completed" },
  { id: 2, transId: "RAJ123457", phone: "254733***567", amount: 5000, account: "INV2401002", time: "09:45 AM", status: "completed" },
  { id: 3, transId: "RAJ123458", phone: "254744***678", amount: 2000, account: "Unknown", time: "09:12 AM", status: "pending" },
];

const revenueByDepartment = [
  { department: "Consultation", amount: 125000, percentage: 35 },
  { department: "Laboratory", amount: 85000, percentage: 24 },
  { department: "Pharmacy", amount: 95000, percentage: 27 },
  { department: "Procedures", amount: 50000, percentage: 14 },
];

export function AccountantDashboard() {
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
            Hello, {user?.firstName}! 💰
          </h1>
          <p className="text-gray-500">
            Financial overview for {new Date().toLocaleDateString("en-KE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Reports
          </Button>
          <Button>
            <Receipt className="mr-2 h-4 w-4" />
            New Invoice
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
          title="Today's Revenue"
          value={formatCurrency(85500)}
          icon={<TrendingUp className="h-6 w-6" />}
          iconBgColor="bg-[#41a02f]"
          change={{ value: 12, type: "increase" }}
        />
        <StatCard
          title="Pending Invoices"
          value="23"
          icon={<Clock className="h-6 w-6" />}
          iconBgColor="bg-[#e88b39]"
        />
        <StatCard
          title="M-PESA Received"
          value={formatCurrency(62500)}
          icon={<Smartphone className="h-6 w-6" />}
          iconBgColor="bg-[#2438a6]"
        />
        <StatCard
          title="Overdue Amount"
          value={formatCurrency(45000)}
          icon={<AlertCircle className="h-6 w-6" />}
          iconBgColor="bg-[#9b162d]"
        />
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Invoices */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-[#2438a6]" />
                Recent Invoices
              </CardTitle>
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium text-[#2438a6]">
                        {invoice.invoiceNo}
                      </TableCell>
                      <TableCell>{invoice.patient}</TableCell>
                      <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                      <TableCell>{formatCurrency(invoice.paid)}</TableCell>
                      <TableCell>
                        <StatusBadge status={invoice.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        {invoice.status !== "paid" ? (
                          <Button size="sm" className="bg-[#41a02f] hover:bg-[#358026]">
                            Receive Payment
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline">
                            Print Receipt
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

        {/* Revenue by Department */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-[#41a02f]" />
                Revenue by Department
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {revenueByDepartment.map((dept) => (
                <div key={dept.department} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{dept.department}</span>
                    <span className="text-gray-500">{formatCurrency(dept.amount)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${dept.percentage}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-full bg-[#2438a6] rounded-full"
                    />
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t">
                <div className="flex justify-between font-semibold">
                  <span>Total Today</span>
                  <span className="text-[#41a02f]">{formatCurrency(355000)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* M-PESA Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-[#41a02f]" />
              Recent M-PESA Payments
            </CardTitle>
            <Button variant="ghost" size="sm">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Account/Invoice</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentMpesaPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.transId}</TableCell>
                    <TableCell>{payment.phone}</TableCell>
                    <TableCell className="font-semibold text-[#41a02f]">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell>
                      {payment.account === "Unknown" ? (
                        <Badge variant="warning">Unallocated</Badge>
                      ) : (
                        <span className="text-[#2438a6]">{payment.account}</span>
                      )}
                    </TableCell>
                    <TableCell>{payment.time}</TableCell>
                    <TableCell>
                      {payment.status === "completed" ? (
                        <Badge variant="success" className="flex items-center gap-1 w-fit">
                          <CheckCircle2 className="h-3 w-3" /> Completed
                        </Badge>
                      ) : (
                        <Badge variant="warning">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {payment.account === "Unknown" ? (
                        <Button size="sm">
                          Allocate
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline">
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
    </div>
  );
}