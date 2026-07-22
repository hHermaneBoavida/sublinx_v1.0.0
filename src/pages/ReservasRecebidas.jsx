import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Clock, Phone, MessageSquare, Check, X, Loader2, ChevronLeft, Store, MapPin } from 'lucide-react';
import { createPageUrl } from '@/utils';
import CheckInCodeCard from '@/components/reservations/CheckInCodeCard';

const STATUS_CONFIG = {
  pending: { label: 'Aguardando', class: 'bg-yellow-600/20 text-yellow-400 border-yellow-700' },
  confirmed: { label: 'Confirmada', class: 'bg-green-600/20 text-green-400 border-green-700' },
  cancelled: { label: 'Cancelada', class: 'bg-red-600/20 text-red-400 border-red-700' },
  completed: { label: 'Concluída', class: 'bg-blue-600/20 text-blue-400 border-blue-700' },
  no_show: { label: 'Não compareceu', class: 'bg-red-600/20 text-red-400 border-red-700' },
};

const TABLE_LABELS = {
  standard: 'Standard', mesa: 'Mesa', vip: 'VIP', balcao: 'Balcão', lounge: 'Lounge', area_externa: 'Área Ext.',
};

const formatDate = (d) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
const formatTime = (d) => new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

export default function ReservasRecebidas() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const [filter, setFilter] = useState('pending');

  const { data: venues = [] } = useQuery({
    queryKey: ['organizerVenues', user?.id],
    queryFn: () => base44.entities.Venue.filter({}, '-created_date', 200),
    enabled: !!user,
    select: (data) => data.filter(v => v.created_by_id === user.id),
  });

  const venueIds = venues.map(v => v.id);

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ['organizerReservations', venueIds],
    queryFn: async () => {
      const all = [];
      for (const vid of venueIds) {
        const res = await base44.entities.Reservation.filter({ venue_id: vid }, '-reservation_date', 100);
        all.push(...res);
      }
      return all.sort((a, b) => new Date(b.reservation_date) - new Date(a.reservation_date));
    },
    enabled: venueIds.length > 0,
  });

  const actionMutation = useMutation({
    mutationFn: async ({ id, action }) => {
      return await base44.functions.invoke('approveReservation', { reservation_id: id, action });
    },
    onSuccess: () => {
      queryClientInstance.invalidateQueries({ queryKey: ['organizerReservations'] });
      queryClientInstance.invalidateQueries({ queryKey: ['calendarReservations'] });
    },
  });

  const filtered = filter === 'all' ? reservations : reservations.filter(r => r.status === filter);
  const pendingCount = reservations.filter(r => r.status === 'pending').length;
  const confirmedCount = reservations.filter(r => r.status === 'confirmed').length;

  if (!isLoading && venues.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white p-4 flex items-center justify-center">
        <div className="text-center">
          <Store className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-4">Você ainda não tem estabelecimentos cadastrados</p>
          <Link to={createPageUrl('CadastrarEstabelecimento')}>
            <Button className="bg-cyan-600 hover:bg-cyan-700 text-sm">Cadastrar Estabelecimento</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to={createPageUrl('DashboardOrganizador')}>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Reservas Recebidas</h1>
          <p className="text-xs text-gray-500">
            {pendingCount} aguardando · {confirmedCount} confirmadas
          </p>
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

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {[
          { key: 'pending', label: 'Aguardando' },
          { key: 'confirmed', label: 'Confirmadas' },
          { key: 'all', label: 'Todas' },
          { key: 'cancelled', label: 'Canceladas' },
          { key: 'completed', label: 'Concluídas' },
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
          <p className="text-gray-500 text-sm">Nenhuma reserva {filter !== 'all' ? 'neste filtro' : ''}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <OrganizerReservationCard
              key={r.id}
              reservation={r}
              onAction={(action) => actionMutation.mutate({ id: r.id, action })}
              isPending={actionMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function OrganizerReservationCard({ reservation, onAction, isPending }) {
  const status = STATUS_CONFIG[reservation.status] || STATUS_CONFIG.pending;

  return (
    <div className={`bg-gray-900/80 border rounded-xl p-3 ${
      reservation.status === 'pending' ? 'border-yellow-700/40' : 'border-gray-800'
    }`}>
      <div className="flex items-start gap-3">
        {reservation.user_avatar_url ? (
          <img src={reservation.user_avatar_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-600 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {reservation.user_name?.charAt(0)?.toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-bold text-white">{reservation.user_name}</h3>
            <Badge className={`text-xs border flex-shrink-0 ${status.class}`}>{status.label}</Badge>
          </div>
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3" />{reservation.venue_name}
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-gray-400">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(reservation.reservation_date)}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatTime(reservation.reservation_date)}</span>
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{reservation.party_size}p</span>
            <span className="text-gray-500">{TABLE_LABELS[reservation.table_type] || reservation.table_type}</span>
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-xs">
            <a href={`tel:${reservation.contact_phone}`} className="flex items-center gap-1 text-cyan-400">
              <Phone className="w-3 h-3" />{reservation.contact_phone}
            </a>
          </div>
          {reservation.special_requests && (
            <div className="flex items-start gap-1 mt-2 text-xs text-gray-500">
              <MessageSquare className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span className="italic">{reservation.special_requests}</span>
            </div>
          )}
        </div>
      </div>

      {/* Check-in code for confirmed/completed reservations */}
      {(reservation.status === 'confirmed' || reservation.status === 'completed') && reservation.check_in_code && (
        <div className="mt-3">
          <CheckInCodeCard
            code={reservation.check_in_code}
            checkedInAt={reservation.checked_in_at}
            checkedOutAt={reservation.checked_out_at}
            variant="organizer"
          />
        </div>
      )}

      {/* Action buttons */}
      {reservation.status === 'pending' && (
        <div className="flex gap-2 mt-3">
          <Button
            onClick={() => onAction('confirm')}
            disabled={isPending}
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-xs h-9 flex-1"
          >
            {isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Check className="w-3 h-3 mr-1" />}
            Aprovar
          </Button>
          <Button
            onClick={() => onAction('cancel')}
            disabled={isPending}
            variant="outline"
            size="sm"
            className="border-red-800 text-red-400 hover:bg-red-900/20 text-xs h-9"
          >
            <X className="w-3 h-3 mr-1" /> Recusar
          </Button>
        </div>
      )}

      {reservation.status === 'confirmed' && (
        <div className="flex gap-2 mt-3">
          <Button
            onClick={() => onAction('complete')}
            disabled={isPending}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-xs h-9 flex-1"
          >
            {isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Check className="w-3 h-3 mr-1" />}
            Finalizar (Check-out)
          </Button>
        </div>
      )}
    </div>
  );
}