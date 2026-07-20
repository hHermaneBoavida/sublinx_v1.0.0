import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Users, Phone, AlertTriangle, Check, X, CheckCheck } from "lucide-react";
import ReservationStatusBadge from "./ReservationStatusBadge";

export default function ReservationDetailSheet({ reservation, open, onOpenChange, hasConflict, onStatusChange }) {
  if (!reservation) return null;
  const date = new Date(reservation.reservation_date);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="bg-gray-950 border-gray-800 text-white overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-white">{reservation.venue_name}</SheetTitle>
          <SheetDescription className="text-gray-400">Detalhes da reserva</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {hasConflict && (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-red-500/40 bg-red-950/30 text-red-300 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              Conflito de horário detectado neste local
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Status</span>
            <ReservationStatusBadge status={reservation.status} />
          </div>

          <div className="flex items-center gap-3 text-sm">
            <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <div>
              <div className="font-medium capitalize">{format(date, "dd 'de' MMMM, yyyy", { locale: ptBR })}</div>
              <div className="text-gray-400">{format(date, "HH:mm")} · {reservation.duration_hours || 3}h de duração</div>
            </div>
          </div>

          <div className="flex items-start gap-3 text-sm">
            <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
            <span>{reservation.venue_address || reservation.venue_name}</span>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <Users className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <span>{reservation.party_size} pessoa(s) · <span className="capitalize">{reservation.table_type?.replace('_', ' ') || 'standard'}</span></span>
          </div>

          {reservation.contact_phone && (
            <div className="flex items-center gap-3 text-sm">
              <Phone className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <span>{reservation.contact_phone}</span>
            </div>
          )}

          <div className="pt-4 border-t border-gray-800">
            <div className="text-sm text-gray-400 mb-1">Cliente</div>
            <div className="font-medium">{reservation.user_name}</div>
          </div>

          {reservation.special_requests && (
            <div className="pt-4 border-t border-gray-800">
              <div className="text-sm text-gray-400 mb-1">Pedidos especiais</div>
              <div className="text-sm text-gray-300">{reservation.special_requests}</div>
            </div>
          )}

          {reservation.status === "pending" && (
            <div className="flex gap-2 pt-4 border-t border-gray-800">
              <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => onStatusChange(reservation.id, "confirmed")}>
                <Check className="w-4 h-4 mr-1" /> Aprovar
              </Button>
              <Button size="sm" variant="outline" className="flex-1 border-red-500/50 text-red-400 hover:bg-red-950/30"
                onClick={() => onStatusChange(reservation.id, "cancelled")}>
                <X className="w-4 h-4 mr-1" /> Recusar
              </Button>
            </div>
          )}

          {reservation.status === "confirmed" && (
            <div className="flex gap-2 pt-4 border-t border-gray-800">
              <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => onStatusChange(reservation.id, "completed")}>
                <CheckCheck className="w-4 h-4 mr-1" /> Finalizar
              </Button>
              <Button size="sm" variant="outline" className="flex-1 border-red-500/50 text-red-400 hover:bg-red-950/30"
                onClick={() => onStatusChange(reservation.id, "cancelled")}>
                <X className="w-4 h-4 mr-1" /> Cancelar
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}