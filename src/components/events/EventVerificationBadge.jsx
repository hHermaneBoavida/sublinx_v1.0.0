import React from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock } from "lucide-react";

/**
 * SUBLINX — Event Verification Badge
 * 
 * Exibe o status de verificacao do evento.
 * Nao afirma que o SUBLINX garante a compra — apenas verifica existencia e consistencia.
 */
export default function EventVerificationBadge({ status, score }) {
  if (status === 'verified' && score >= 70) {
    return (
      <Badge className="bg-green-600/80 border-green-500/50 text-white backdrop-blur-sm flex items-center gap-1">
        <CheckCircle className="w-3 h-3" />
        Evento Verificado
      </Badge>
    );
  }

  if (status === 'pending') {
    return (
      <Badge className="bg-yellow-600/80 border-yellow-500/50 text-white backdrop-blur-sm flex items-center gap-1">
        <Clock className="w-3 h-3" />
        Pendente
      </Badge>
    );
  }

  // Nao exibir badge para unverified, expired, cancelled
  return null;
}