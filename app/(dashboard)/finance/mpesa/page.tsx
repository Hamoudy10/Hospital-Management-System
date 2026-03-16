// app/(dashboard)/finance/mpesa/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Search,
  Smartphone,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/Toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

interface MpesaTransaction {
  id: string;
  transId: string;
  transactionType: string;
  transTime: string | null;
  transAmount: number;
  billRefNumber: string | null;
  invoiceNumber: string | null;
  msisdn: string | null;
  status: string;
  reconciliationStatus: string;
  reconciliationReason: string | null;
  createdAt: string;
  student: {
    id: string;
    name: string;
    admissionNumber: string;
  } | null;
  fee: {
    id: string;
    balance: number;
    amountDue: number;
    amountPaid: number;
    feeName: string | null;
  } | null;
  payment: {
    id: string;
    receiptNumber: string | null;
    paymentDate: string | null;
  } | null;
}

interface LookupResult {
  student: {
    id: string;
    name: string;
    admissionNumber: string;
  } | null;
  fees: Array<{
    id: string;
    invoiceNumber?: string;
    balance: number;
    amountDue: number;
    amountPaid: number;
    dueDate: string | null;
    feeName: string | null;
  }>;
}

const statusOptions = [
  { value: "", label: "All" },
  { value: "reconciled", label: "Reconciled" },
  { value: "manual_review", label: "Manual Review" },
  { value: "confirmed", label: "Confirmed" },
  { value: "validated", label: "Validated" },
  { value: "received", label: "Received" },
  { value: "failed", label: "Failed" },
];

const reconciliationOptions = [
  { value: "", label: "All" },
  { value: "auto", label: "Auto" },
  { value: "manual", label: "Manual" },
  { value: "pending", label: "Pending" },
];

type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "primary"
  | "danger"
  | "outline";

const statusBadgeMap: Record<string, BadgeVariant> = {
  reconciled: "success",
  manual_review: "warning",
  confirmed: "info",
  validated: "info",
  received: "default",
  failed: "error",
};

export default function MpesaTrackingPage() {
  const { user, loading, checkPermission } = useAuth();
  const { success, error: toastError } = useToast();

  const [transactions, setTransactions] = useState<MpesaTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [reconciliationFilter, setReconciliationFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedTx, setSelectedTx] = useState<MpesaTransaction | null>(null);
  const [lookupRef, setLookupRef] = useState("");
  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null);
  const [selectedFeeId, setSelectedFeeId] = useState("");
  const [isReconciling, setIsReconciling] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);

  const canView = checkPermission("finance", "view");
  const canUpdate = checkPermission("finance", "update");

  const loadTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) {params.set("status", statusFilter);}
      if (reconciliationFilter) {
        params.set("reconciliation_status", reconciliationFilter);
      }
      if (searchTerm) {params.set("search", searchTerm);}
      params.set("page", String(page));
      params.set("page_size", "20");

      const response = await fetch(`/api/mpesa/transactions?${params.toString()}`);
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.message || "Failed to load transactions");
      }

      setTransactions(json.data.items || []);
      setTotalPages(json.data.totalPages || 1);
    } catch (err: any) {
      toastError("M-Pesa", err.message || "Failed to load transactions");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, reconciliationFilter, searchTerm, page, toastError]);

  useEffect(() => {
    if (!loading && user && canView) {
      loadTransactions();
    }
  }, [loading, user, canView, loadTransactions]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, reconciliationFilter, searchTerm]);

  useEffect(() => {
    if (!loading && user && canView) {
      loadTransactions();
    }
  }, [page, loading, user, canView, loadTransactions]);

  const summary = useMemo(() => {
    const total = transactions.length;
    const reconciled = transactions.filter((t) => t.status === "reconciled").length;
    const manual = transactions.filter((t) => t.status === "manual_review").length;
    return { total, reconciled, manual };
  }, [transactions]);

  const openReconcile = (tx: MpesaTransaction) => {
    setSelectedTx(tx);
    const ref = tx.invoiceNumber || tx.billRefNumber || "";
    setLookupRef(ref);
    setLookupResult(null);
    setSelectedFeeId("");
  };

  const closeReconcile = () => {
    setSelectedTx(null);
    setLookupResult(null);
    setSelectedFeeId("");
  };

  const handleLookup = async () => {
    if (!lookupRef.trim()) {
      toastError("Lookup", "Enter a bill reference or invoice number.");
      return;
    }

    try {
      setIsLookingUp(true);
      const response = await fetch(`/api/mpesa/lookup?ref=${encodeURIComponent(lookupRef.trim())}`);
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.message || "Lookup failed");
      }

      setLookupResult(json.data);
      if (json.data?.fees?.length === 1) {
        setSelectedFeeId(json.data.fees[0].id);
      }
    } catch (err: any) {
      toastError("Lookup", err.message || "Lookup failed");
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleReconcile = async () => {
    if (!selectedTx || !selectedFeeId) {
      toastError("Reconcile", "Select a fee to reconcile.");
      return;
    }

    try {
      setIsReconciling(true);
      const response = await fetch("/api/mpesa/reconcile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: selectedTx.id,
          studentFeeId: selectedFeeId,
        }),
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.message || "Reconciliation failed");
      }

      success("Reconciled", "Transaction reconciled successfully.");
      closeReconcile();
      loadTransactions();
    } catch (err: any) {
      toastError("Reconcile", err.message || "Reconciliation failed");
    } finally {
      setIsReconciling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-gray-500">Loading M-Pesa tracking...</p>
        </div>
      </div>
    );
  }

  if (!user || !canView) {
    return (
      <div className="space-y-6">
        <PageHeader title="M-Pesa Tracking" />
        <Alert variant="destructive">You do not have access to this module.</Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="M-Pesa Tracking"
        description="Monitor incoming C2B payments, auto-reconciliation, and exceptions"
      >
        <Button
          variant="secondary"
          size="sm"
          onClick={loadTransactions}
          disabled={isLoading}
        >
          <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Loaded</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {summary.total}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Reconciled</p>
            <p className="mt-2 text-2xl font-semibold text-green-600">
              {summary.reconciled}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Needs Review</p>
            <p className="mt-2 text-2xl font-semibold text-amber-600">
              {summary.manual}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filter Transactions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Input
            label="Search"
            placeholder="Trans ID, Bill Ref, Phone"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={statusOptions}
          />
          <Select
            label="Reconciliation"
            value={reconciliationFilter}
            onChange={(e) => setReconciliationFilter(e.target.value)}
            options={reconciliationOptions}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Incoming Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center">
              <Spinner size="lg" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              No M-Pesa transactions found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Student / Fee</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium text-gray-900">{tx.transId}</p>
                          <p className="text-xs text-gray-500">
                            {tx.msisdn || "Unknown payer"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-xs">
                          <p>{tx.billRefNumber || "-"}</p>
                          <p className="text-gray-500">{tx.invoiceNumber || "-"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {tx.student ? (
                          <div className="space-y-1">
                            <p className="font-medium text-gray-900">{tx.student.name}</p>
                            <p className="text-xs text-gray-500">
                              {tx.student.admissionNumber}
                              {tx.fee?.feeName ? ` · ${tx.fee.feeName}` : ""}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">Unmatched</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge variant={statusBadgeMap[tx.status] ?? "default"}>
                            {tx.status.replace("_", " ")}
                          </Badge>
                          {tx.reconciliationStatus && (
                            <p className="text-xs text-gray-500">
                              {tx.reconciliationStatus}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        {formatCurrency(tx.transAmount)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {tx.transTime ? formatDate(tx.transTime) : formatDate(tx.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {tx.status === "reconciled" ? (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            Done
                          </div>
                        ) : tx.status === "failed" ? (
                          <div className="flex items-center gap-2 text-sm text-red-600">
                            <XCircle className="h-4 w-4" />
                            Failed
                          </div>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => openReconcile(tx)}
                            disabled={!canUpdate}
                          >
                            Reconcile
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Modal open={!!selectedTx} onClose={closeReconcile} size="lg">
        {selectedTx && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-700">
                <Smartphone className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Manual Reconciliation</h3>
                <p className="text-sm text-gray-500">
                  Transaction {selectedTx.transId} · {formatCurrency(selectedTx.transAmount)}
                </p>
              </div>
            </div>

            {selectedTx.reconciliationReason && (
              <Alert variant="warning">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {selectedTx.reconciliationReason}
                </div>
              </Alert>
            )}

            <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
              <Input
                label="Bill Ref / Invoice"
                value={lookupRef}
                onChange={(e) => setLookupRef(e.target.value)}
                placeholder="ADM123 or INV-202603-00001"
              />
              <div className="flex items-end">
                <Button
                  variant="secondary"
                  onClick={handleLookup}
                  disabled={isLookingUp}
                >
                  {isLookingUp ? "Looking up..." : "Lookup"}
                </Button>
              </div>
            </div>

            {lookupResult && (
              <div className="space-y-3">
                {lookupResult.student ? (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <p className="text-sm font-medium text-gray-900">
                      {lookupResult.student.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Admission: {lookupResult.student.admissionNumber}
                    </p>
                  </div>
                ) : (
                  <Alert variant="warning">No student found for that reference.</Alert>
                )}

                <Select
                  label="Outstanding Fees"
                  value={selectedFeeId}
                  onChange={(e) => setSelectedFeeId(e.target.value)}
                  options={lookupResult.fees.map((fee) => ({
                    value: fee.id,
                    label: `${fee.feeName || "Fee"} · Balance ${formatCurrency(fee.balance)}${fee.invoiceNumber ? ` · ${fee.invoiceNumber}` : ""}`,
                  }))}
                  placeholder={
                    lookupResult.fees.length === 0
                      ? "No outstanding fees"
                      : "Select a fee"
                  }
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <Button variant="secondary" onClick={closeReconcile}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleReconcile}
                disabled={!selectedFeeId || isReconciling}
              >
                {isReconciling ? "Reconciling..." : "Reconcile Payment"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

