import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Clock, MapPin, X, Bell, Loader2, ChevronLeft, QrCode, Check } from 'lucide-react';
import ReservationCalendarLink from '@/components/reservations/ReservationCalendarLink';
import CheckInCodeCard from '@/components/reservations/CheckInCodeCard';
import { createPageUrl } from '@/utils';

const STATUS_CONFIG = {
  pending: { label: 'Aguardando', class: 'bg-yellow-600/20 text-yellow-400 border-yellow-700', icon: Clock },
  confirmed: { label: 'Confirmada', class: 'bg-green-600/20 text-green-400 border-green-700', icon: Check },
  cancelled: { label: 'Cancelada', class: 'bg-red-600/20 text-red-400 border-red-700', icon: X },
  completed: { label: 'Concluída', class: 'bg-blue-600/20 text-blue-400 border-blue-700', icon: Check },
  no_show: { label: 'Não compareceu', class: 'bg-red-600/20 text-red-400 border-red-700', icon: X },
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
  const [expandedCode, setExpandedCode] = useState(null);

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
    onSuccess: () => {
      queryClientInstance.invalidateQueries({ queryKey: ['userReservations'] });
    },
  });

  const filtered = filter === 'all' ? reservations : reservations.filter(r => r.status === filter);
  const activeCount = reservations.filter(r => ['pending', 'confirmed'].includes(r.status)).length;
  const pendingCount = reservations.filter(r => r.status === 'pending').length;
  const confirmedCount = reservations.filter(r => r.status === 'confirmed').length;

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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-gray-900/60 rounded-lg p-3 text-center border border-gray-800">
          <div className="text-2xl font-bold text-yellow-400">{pendingCount}</div>
          <div className="text-xs text-gray-500">Aguardando</div>
        </div>
        <div className="bg-gray-900/60 rounded-lg p-3 text-center border border-gray-800">
          <div className="text-2xl font-bold text-green-400">{confirmedCount}</div>
          <div className="text-xs text-gray-500">Confirmadas</div>
        </div>
        <div className="bg-gray-900/60 rounded-lg p-3 text-center border border-gray-800">
          <div className="text-2xl font-bold text-blue-400">{reservations.filter(r => r.status === 'completed').length}</div>
          <div className="text-xs text-gray-500">Concluídas</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {[
          { key: 'all', label: 'Todas' },
          { key: 'pending', label: 'Aguardando' },
          { key: 'confirmed', label: 'Confirmadas' },
          { key: 'completed', label: 'Concluídas' },
          { key: 'cancelled', label: 'Canceladas' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              filter === f.key ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
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
              expandedCode={expandedCode}
              onToggleCode={(id) => setExpandedCode(expandedCode === id ? null : id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ReservationCard({ reservation, onCancel, isCancelling, expandedCode, onToggleCode }) {
  const [showCalendar, setShowCalendar] = useState(false);
  const status = STATUS_CONFIG[reservation.status] || STATUS_CONFIG.pending;
  const StatusIcon = status.icon;
  const canCancel = ['pending', 'confirmed'].includes(reservation.status);
  const hasCode = reservation.check_in_code && (reservation.status === 'confirmed' || reservation.status === 'completed');

  return (
    <div className={`bg-gray-900/80 border rounded-xl overflow-hidden ${
      reservation.status === 'pending' ? 'border-yellow-700/40' :
      reservation.status === 'confirmed' ? 'border-green-700/40' : 'border-gray-800'
    }`}>
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
            <Badge className={`text-xs border flex items-center gap-1 ${status.class}`}>
              <StatusIcon className="w-3 h-3" />
              {status.label}
            </Badge>
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

      {/* Collapsed code preview */}
      {hasCode && expandedCode !== reservation.id && (
        <button
          onClick={() => onToggleCode(reservation.id)}
          className="mx-3 mb-2 w-[calc(100%-1.5rem)] flex items-center justify-between gap-2 rounded-lg border border-cyan-700/40 bg-cyan-950/10 px-3 py-2 text-xs text-cyan-400 hover:bg-cyan-900/20 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <QrCode className="w-3.5 h-3.5" />
            Código de Check-in
          </span>
          <code className="font-mono font-bold text-white">{reservation.check_in_code}</code>
        </button>
      )}

      {/* Expanded code card */}
      {hasCode && expandedCode === reservation.id && (
        <div className="px-3 pb-3">
          <CheckInCodeCard
            code={reservation.check_in_code}
            checkedInAt={reservation.checked_in_at}
            checkedOutAt={reservation.checked_out_at}
            variant="user"
          />
          <button
            onClick={() => onToggleCode(reservation.id)}
            className="w-full text-center text-xs text-gray-500 mt-2 hover:text-gray-400"
          >
            Recolher
          </button>
        </div>
      )}

      <div className="flex gap-2 px-3 pb-3">
        {reservation.status === 'confirmed' && !showCalendar && !hasCode && (
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
        {reservation.status === 'confirmed' && !showCalendar && hasCode && expandedCode !== reservation.id && (
          <Button
            onClick={() => setShowCalendar(true)}
            variant="outline"
            size="sm"
            className="border-cyan-700 text-cyan-400 hover:bg-cyan-900/20 text-xs h-8"
          >
            <Bell className="w-3 h-3 mr-1" />
            Lembrete
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
            {isCancelling ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <X className="w-3 h-3 mr-1" />}
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