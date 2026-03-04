"use client";

import { CheckCircle2, XCircle, Loader2, Clock } from "lucide-react";

type Status = "running" | "success" | "failed" | "partial" | "cancelled";

const STATUS_MAP: Record<Status, { icon: React.ReactNode; cls: string }> = {
  success: {
    icon: <CheckCircle2 size={13} />,
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  failed: {
    icon: <XCircle size={13} />,
    cls: "bg-red-50 text-red-700 border-red-200",
  },
  running: {
    icon: <Loader2 size={13} className="animate-spin" />,
    cls: "bg-blue-50 text-blue-700 border-blue-200",
  },
  partial: {
    icon: <Clock size={13} />,
    cls: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
  cancelled: {
    icon: <XCircle size={13} />,
    cls: "bg-slate-50 text-slate-600 border-slate-200",
  },
};

export default function StatusBadge({ status }: { status: Status }) {
  const { icon, cls } = STATUS_MAP[status] || STATUS_MAP.cancelled;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${cls}`}
    >
      {icon}
      {status}
    </span>
  );
}
