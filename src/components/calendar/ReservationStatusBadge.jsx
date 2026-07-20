import React from "react";

const statusConfig = {
  pending: { label: "Pendente", classes: "bg-amber-50 text-amber-700 border-amber-200" },
  confirmed: { label: "Confirmado", classes: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cancelled: { label: "Cancelado", classes: "bg-red-50 text-red-700 border-red-200" },
  completed: { label: "Finalizado", classes: "bg-blue-50 text-blue-700 border-blue-200" },
  no_show: { label: "No-show", classes: "bg-gray-100 text-gray-600 border-gray-300" },
};

export default function ReservationStatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.pending;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${config.classes}`}>
      {config.label}
    </span>
  );
}