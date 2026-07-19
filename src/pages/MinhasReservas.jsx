import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Clock, MapPin, X, Bell, Loader2, ChevronLeft } from 'lucide-react';
import ReservationCalendarLink from '@/components/reservations/ReservationCalendarLink';
import { createPageUrl } from '@/utils';

const STATUS_CONFIG = {
  pending: { label: 'Aguardando', class: 'bg-yellow-600/20 text-yellow-400 border-yellow-700' },
  confirmed: { label: 'Confirmada', class: 'bg-green-600/20 text-green-400 border-green-700' },
  cancelled: { label: 'Cancelada', class: 'bg-red-600/20 text-red-400 border-red-700' },
  completed: { label: 'Concluída', class: 'bg-blue-600/20 text-blue-400 border-blue-700' },
  no_show: { label: 'Não compareceu', class: 'bg-red-600/20 text-red-400 border-red-700' },
};

const formatDate = (d) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
const formatTime = (d) => new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

export default function MinhasReservas() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const [filter, setFilter] = useState('all');

  const { data: reservations = [], isLoading, refetch } = useQuery({
    queryKey: ['userReservations', user?.id],
    queryFn: () => base44.entities.Reservation.filter({ user_id: user.id }, '-reservation_date', 100),
    enabled: !!user,
  });

  const cancelMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.Reservation.update(id, {
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: 'user',
      });
    },
    onSuccess: () => refetch(),
  });

  const filtered = filter === 'all' ? reservations : reservations.filter(r => r.status === filter);
  const activeCount = reservations.filter(r => ['pending', 'confirmed'].includes(r.status)).length;

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to={createPageUrl('Perfil')}>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Minhas Reservas</h1>
          <p className="text-xs text-gray-500">{activeCount} reserva(s) ativa(s)</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {[
          { key: 'all', label: 'Todas' },
          { key: 'pending', label: 'Aguardando' },
          { key: 'confirmed', label: 'Confirmadas' },
          { key: 'cancelled', label: 'Canceladas' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              filter === f.key
                ? 'bg-cyan-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Nenhuma reserva encontrada</p>
          <Link to={createPageUrl('Mapa')}>
            <Button className="mt-4 bg-cyan-600 hover:bg-cyan-700 text-sm">
              Explorar Estabelecimentos
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <ReservationCard
              key={r.id}
              reservation={r}
              onCancel={cancelMutation.mutate}
              isCancelling={cancelMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ReservationCard({ reservation, onCancel, isCancelling }) {
  const [showCalendar, setShowCalendar] = useState(false);
  const status = STATUS_CONFIG[reservation.status] || STATUS_CONFIG.pending;
  const canCancel = ['pending', 'confirmed'].includes(reservation.status);

  return (
    <div className="bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden">
      <div className="flex gap-3 p-3">
        {reservation.venue_image_url && (
          <img
            src={reservation.venue_image_url}
            alt={reservation.venue_name}
            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-bold text-white truncate">{reservation.venue_name}</h3>
            <Badge className={`text-xs border ${status.class}`}>{status.label}</Badge>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(reservation.reservation_date)}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatTime(reservation.reservation_date)}</span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{reservation.party_size} pessoas</span>
            {reservation.venue_address && (
              <span className="flex items-center gap-1 truncate"><MapPin className="w-3 h-3" />{reservation.venue_address}</span>
            )}
          </div>
        </div>
      </div>

      {reservation.special_requests && (
        <div className="px-3 pb-2">
          <p className="text-xs text-gray-500 italic">"{reservation.special_requests}"</p>
        </div>
      )}

      <div className="flex gap-2 px-3 pb-3">
        {reservation.status === 'confirmed' && !showCalendar && (
          <Button
            onClick={() => setShowCalendar(true)}
            variant="outline"
            size="sm"
            className="border-cyan-700 text-cyan-400 hover:bg-cyan-900/20 text-xs h-8"
          >
            <Bell className="w-3 h-3 mr-1" />
            Lembrete na Agenda
          </Button>
        )}
        {canCancel && (
          <Button
            onClick={() => onCancel(reservation.id)}
            disabled={isCancelling}
            variant="ghost"
            size="sm"
            className="text-red-400 hover:bg-red-900/20 text-xs h-8 ml-auto"
          >
            <X className="w-3 h-3 mr-1" />
            Cancelar
          </Button>
        )}
      </div>

      {showCalendar && (
        <div className="px-3 pb-3 border-t border-gray-800 pt-3">
          <ReservationCalendarLink reservation={reservation} />
        </div>
      )}
    </div>
  );
}