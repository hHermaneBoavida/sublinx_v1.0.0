import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Users, Phone, AlertTriangle, Check, X, CheckCheck, Loader2 } from "lucide-react";
import ReservationStatusBadge from "./ReservationStatusBadge";
import CheckInCodeCard from "@/components/reservations/CheckInCodeCard";
import { base44 } from "@/api/base44Client";

export default function ReservationDetailSheet({ reservation, open, onOpenChange, hasConflict, onStatusChange }) {
  const [loading, setLoading] = React.useState(false);

  if (!reservation) return null;
  const date = new Date(reservation.reservation_date);

  const handleAction = async (action) => {
    setLoading(true);
    try {
      const now = new Date().toISOString();

      if (action === 'confirm') {
        // Gerar código de check-in único
        const codeChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let randomPart = '';
        for (let i = 0; i < 8; i++) {
          randomPart += codeChars[Math.floor(Math.random() * codeChars.length)];
        }
        const checkInCode = `SBLX-${randomPart}`;

        await base44.entities.Reservation.update(reservation.id, {
          status: 'confirmed',
          confirmed_at: now,
          check_in_code: checkInCode,
        });

        // Notificar o usuário solicitante
        try {
          await base44.entities.Notification.create({
            user_id: reservation.user_id,
            type: 'reservation_confirmed',
            title: 'Reserva Confirmada! ✅',
            message: `Sua reserva em ${reservation.venue_name} foi confirmada! Apresente o código ${checkInCode} no local para o check-in.`,
            reservation_id: reservation.id,
            is_read: false,
          });
        } catch (notifErr) {
          console.error('Erro ao criar notificação:', notifErr);
        }
      } else if (action === 'cancel') {
        await base44.entities.Reservation.update(reservation.id, {
          status: 'cancelled',
          cancelled_at: now,
          cancelled_by: 'organizer',
        });

        try {
          await base44.entities.Notification.create({
            user_id: reservation.user_id,
            type: 'reservation_cancelled',
            title: 'Reserva Cancelada',
            message: `Infelizmente sua reserva em ${reservation.venue_name} foi cancelada pelo estabelecimento.`,
            reservation_id: reservation.id,
            is_read: false,
          });
        } catch (notifErr) {
          console.error('Erro ao criar notificação:', notifErr);
        }
      } else if (action === 'complete') {
        await base44.entities.Reservation.update(reservation.id, {
          status: 'completed',
          checked_out_at: now,
        });
      }

      await onStatusChange(reservation.id, action === 'confirm' ? 'confirmed' : action === 'cancel' ? 'cancelled' : 'completed');
    } catch (e) {
      console.error(e);
      alert('Erro ao processar reserva: ' + (e.message || 'tente novamente'));
    } finally {
      setLoading(false);
    }
  };

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
              <a href={`tel:${reservation.contact_phone}`} className="text-cyan-400">{reservation.contact_phone}</a>
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

          {/* Check-in code */}
          {(reservation.status === 'confirmed' || reservation.status === 'completed') && reservation.check_in_code && (
            <div className="pt-4 border-t border-gray-800">
              <CheckInCodeCard
                code={reservation.check_in_code}
                checkedInAt={reservation.checked_in_at}
                checkedOutAt={reservation.checked_out_at}
                variant="organizer"
              />
            </div>
          )}

          {reservation.status === "pending" && (
            <div className="flex gap-2 pt-4 border-t border-gray-800">
              <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={loading}
                onClick={() => handleAction('confirm')}>
                {loading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                Aprovar
              </Button>
              <Button size="sm" variant="outline" className="flex-1 border-red-500/50 text-red-400 hover:bg-red-950/30"
                disabled={loading}
                onClick={() => handleAction('cancel')}>
                <X className="w-4 h-4 mr-1" /> Recusar
              </Button>
            </div>
          )}

          {reservation.status === "confirmed" && (
            <div className="flex gap-2 pt-4 border-t border-gray-800">
              <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={loading}
                onClick={() => handleAction('complete')}>
                {loading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CheckCheck className="w-4 h-4 mr-1" />}
                Finalizar (Check-out)
              </Button>
              <Button size="sm" variant="outline" className="flex-1 border-red-500/50 text-red-400 hover:bg-red-950/30"
                disabled={loading}
                onClick={() => handleAction('cancel')}>
                <X className="w-4 h-4 mr-1" /> Cancelar
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}