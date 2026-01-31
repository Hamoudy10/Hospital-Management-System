import { motion } from "framer-motion";
import {
  FlaskConical,
  TestTube,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Microscope,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, StatCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";

// Sample data
const pendingTests = [
  { id: 1, requestNo: "LAB240115001", patient: "John Doe", test: "Complete Blood Count", priority: "urgent", requestedBy: "Dr. Mwangi", requestedAt: "09:00 AM" },
  { id: 2, requestNo: "LAB240115002", patient: "Mary Jane", test: "HBA1C", priority: "normal", requestedBy: "Dr. Ochieng", requestedAt: "09:30 AM" },
  { id: 3, requestNo: "LAB240115003", patient: "Peter Ochieng", test: "Lipid Profile", priority: "normal", requestedBy: "Dr. Mwangi", requestedAt: "10:00 AM" },
  { id: 4, requestNo: "LAB240115004", patient: "Grace Wanjiku", test: "Liver Function Tests", priority: "high", requestedBy: "Dr. Njeri", requestedAt: "10:15 AM" },
];

const samplesCollected = [
  { id: 1, sampleNo: "SMP240115001", patient: "David Kamau", type: "Blood (EDTA)", collectedAt: "08:45 AM", status: "processing" },
  { id: 2, sampleNo: "SMP240115002", patient: "Sarah Njeri", type: "Urine", collectedAt: "09:15 AM", status: "received" },
  { id: 3, sampleNo: "SMP240115003", patient: "Michael Odhiambo", type: "Blood (Serum)", collectedAt: "09:45 AM", status: "processing" },
];

const resultsToVerify = [
  { id: 1, resultNo: "RES240115001", patient: "Ann Wambui", test: "Malaria Rapid Test", result: "Negative", performedBy: "Lab Tech 1", performedAt: "10:30 AM" },
  { id: 2, resultNo: "RES240115002", patient: "Joseph Kiptoo", test: "Blood Sugar (RBS)", result: "145 mg/dL", performedBy: "Lab Tech 2", performedAt: "10:45 AM" },
];

export function LabTechDashboard() {
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
            Hello, {user?.firstName}! 🔬
          </h1>
          <p className="text-gray-500">
            Laboratory overview for {new Date().toLocaleDateString("en-KE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Test Catalog
          </Button>
          <Button>
            <TestTube className="mr-2 h-4 w-4" />
            Enter Results
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
          title="Pending Tests"
          value="18"
          icon={<Clock className="h-6 w-6" />}
          iconBgColor="bg-[#e88b39]"
        />
        <StatCard
          title="In Progress"
          value="6"
          icon={<FlaskConical className="h-6 w-6" />}
          iconBgColor="bg-[#2438a6]"
        />
        <StatCard
          title="Completed Today"
          value="24"
          icon={<CheckCircle2 className="h-6 w-6" />}
          iconBgColor="bg-[#41a02f]"
        />
        <StatCard
          title="Pending Verification"
          value="5"
          icon={<AlertTriangle className="h-6 w-6" />}
          iconBgColor="bg-[#a06695]"
        />
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Tests */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-[#e88b39]" />
                Pending Test Requests
              </CardTitle>
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request #</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Test</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingTests.map((test) => (
                    <TableRow key={test.id}>
                      <TableCell className="font-medium text-[#2438a6]">
                        {test.requestNo}
                      </TableCell>
                      <TableCell>{test.patient}</TableCell>
                      <TableCell>{test.test}</TableCell>
                      <TableCell>
                        <StatusBadge status={test.priority} />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{test.requestedBy}</p>
                          <p className="text-xs text-gray-500">{test.requestedAt}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm">
                          Collect Sample
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>

        {/* Results to Verify */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Microscope className="h-5 w-5 text-[#a06695]" />
                Results to Verify
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {resultsToVerify.map((result) => (
                <div
                  key={result.id}
                  className="p-3 bg-purple-50 rounded-lg border border-purple-100"
                >
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-medium text-sm">{result.patient}</p>
                    <Badge variant="purple">Pending</Badge>
                  </div>
                  <p className="text-sm text-gray-600">{result.test}</p>
                  <p className="text-sm font-semibold text-[#2438a6] mt-1">Result: {result.result}</p>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-gray-500">By: {result.performedBy}</p>
                    <Button size="sm" variant="outline">
                      Verify
                    </Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full" size="sm">
                View All Pending
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Samples in Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5 text-[#2438a6]" />
              Samples Being Processed
            </CardTitle>
            <Button variant="ghost" size="sm">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sample #</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Sample Type</TableHead>
                  <TableHead>Collected At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {samplesCollected.map((sample) => (
                  <TableRow key={sample.id}>
                    <TableCell className="font-medium">{sample.sampleNo}</TableCell>
                    <TableCell>{sample.patient}</TableCell>
                    <TableCell>{sample.type}</TableCell>
                    <TableCell>{sample.collectedAt}</TableCell>
                    <TableCell>
                      <StatusBadge status={sample.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {sample.status === "processing" ? (
                        <Button size="sm" className="bg-[#41a02f] hover:bg-[#358026]">
                          Enter Results
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline">
                          Process
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