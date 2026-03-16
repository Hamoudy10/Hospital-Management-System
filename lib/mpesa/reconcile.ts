// lib/mpesa/reconcile.ts
// ============================================================
// Auto-reconciliation helpers for M-Pesa C2B
// ============================================================

import { isUuid, normalizeReference, splitReference } from "./utils";

export interface MpesaReconcileContext {
  supabase: any;
  systemUserId?: string | null;
}

export interface MpesaTransactionRecord {
  id: string;
  transId: string;
  transAmount: number;
  transTime: string | null;
  billRefNumber: string | null;
  invoiceNumber: string | null;
}

export interface MpesaReconcileResult {
  status: "reconciled" | "manual_review";
  reason?: string;
  paymentId?: string;
  studentId?: string;
  studentFeeId?: string;
  schoolId?: string;
}

async function generateReceiptNumber(supabase: any, schoolId: string) {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, "0");

  const { count } = await supabase
    .from("payments")
    .select("id", { count: "exact", head: true })
    .eq("school_id", schoolId)
    .gte("created_at", `${year}-${month}-01`);

  const sequence = String((count || 0) + 1).padStart(5, "0");
  return `RCP-${year}${month}-${sequence}`;
}

async function resolveStudentFee(
  supabase: any,
  billRefNumber: string | null,
  invoiceNumber: string | null,
): Promise<{
  studentFeeId?: string;
  studentId?: string;
  schoolId?: string;
  reason?: string;
}> {
  const invoiceRef = normalizeReference(invoiceNumber);
  const billRef = normalizeReference(billRefNumber);

  const lookupKeys = [invoiceRef, billRef].filter(Boolean) as string[];

  for (const key of lookupKeys) {
    const { normalized } = splitReference(key);
    if (!normalized) {continue;}

    if (isUuid(normalized)) {
      const { data: feeById } = await supabase
        .from("student_fees")
        .select("id, student_id, school_id")
        .eq("id", normalized)
        .maybeSingle();

      if (feeById) {
        return {
          studentFeeId: feeById.id,
          studentId: feeById.student_id,
          schoolId: feeById.school_id,
        };
      }
    }

    const { data: feeByInvoice } = await supabase
      .from("student_fees")
      .select("id, student_id, school_id")
      .eq("invoice_number", normalized)
      .maybeSingle();

    if (feeByInvoice) {
      return {
        studentFeeId: feeByInvoice.id,
        studentId: feeByInvoice.student_id,
        schoolId: feeByInvoice.school_id,
      };
    }
  }

  if (!billRef) {
    return { reason: "Missing bill reference" };
  }

  const { data: student } = await supabase
    .from("students")
    .select("student_id, school_id")
    .eq("admission_number", billRef)
    .maybeSingle();

  if (!student) {
    return { reason: "No student matched the bill reference" };
  }

  const { data: fees } = await supabase
    .from("student_fees")
    .select("id, student_id, school_id, balance, due_date, created_at")
    .eq("student_id", student.student_id)
    .gt("balance", 0)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true })
    .limit(1);

  const fee = fees?.[0];

  if (!fee) {
    return { reason: "Student has no outstanding fees" };
  }

  return {
    studentFeeId: fee.id,
    studentId: fee.student_id,
    schoolId: fee.school_id,
  };
}

export async function autoReconcileC2BTransaction(
  ctx: MpesaReconcileContext,
  transaction: MpesaTransactionRecord,
): Promise<MpesaReconcileResult> {
  const { supabase, systemUserId } = ctx;

  if (!systemUserId) {
    return {
      status: "manual_review",
      reason: "MPESA_SYSTEM_USER_ID not configured",
    };
  }

  const { data: existingPayment } = await supabase
    .from("payments")
    .select("id")
    .eq("transaction_id", transaction.transId)
    .maybeSingle();

  if (existingPayment) {
    return {
      status: "reconciled",
      paymentId: existingPayment.id,
    };
  }

  const resolved = await resolveStudentFee(
    supabase,
    transaction.billRefNumber,
    transaction.invoiceNumber,
  );

  if (!resolved.studentFeeId || !resolved.schoolId) {
    return {
      status: "manual_review",
      reason: resolved.reason || "Unable to match student fee",
    };
  }

  const { data: studentFee } = await supabase
    .from("student_fees")
    .select("id, balance")
    .eq("id", resolved.studentFeeId)
    .maybeSingle();

  if (!studentFee) {
    return { status: "manual_review", reason: "Student fee not found" };
  }

  const balance = typeof studentFee.balance === "number"
    ? studentFee.balance
    : parseFloat(studentFee.balance || "0");

  if (transaction.transAmount > balance) {
    return {
      status: "manual_review",
      reason: "Payment amount exceeds outstanding balance",
    };
  }

  const receiptNumber = await generateReceiptNumber(supabase, resolved.schoolId);

  const paymentDate = transaction.transTime
    ? transaction.transTime.split("T")[0]
    : new Date().toISOString().split("T")[0];

  const { data: payment, error } = await supabase
    .from("payments")
    .insert({
      school_id: resolved.schoolId,
      student_fee_id: resolved.studentFeeId,
      amount_paid: transaction.transAmount,
      payment_method: "mpesa",
      transaction_id: transaction.transId,
      receipt_number: receiptNumber,
      payment_date: paymentDate,
      notes: "Auto-reconciled from M-Pesa C2B",
      recorded_by: systemUserId,
    })
    .select("id")
    .single();

  if (error || !payment) {
    return {
      status: "manual_review",
      reason: error?.message || "Failed to create payment",
    };
  }

  return {
    status: "reconciled",
    paymentId: payment.id,
    studentId: resolved.studentId,
    studentFeeId: resolved.studentFeeId,
    schoolId: resolved.schoolId,
  };
}
