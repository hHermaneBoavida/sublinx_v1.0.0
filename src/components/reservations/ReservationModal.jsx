import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Users, Phone, MessageSquare, CheckCircle, Loader2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ReservationCalendarLink from './ReservationCalendarLink';

const TIME_SLOTS = ['18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '00:00'];

const TABLE_OPTIONS = [
  { value: 'standard', label: 'Mesa Standard' },
  { value: 'mesa', label: 'Mesa Reservada' },
  { value: 'vip', label: 'VIP' },
  { value: 'balcao', label: 'Balcão' },
  { value: 'lounge', label: 'Lounge' },
  { value: 'area_externa', label: 'Área Externa' },
];

const todayStr = () => new Date().toISOString().split('T')[0];

export default function ReservationModal({ venue, onClose }) {
  const [step, setStep] = useState('form'); // form | success
  const [form, setForm] = useState({
    date: todayStr(),
    time: '21:00',
    party_size: 2,
    table_type: 'standard',
    special_requests: '',
    contact_phone: '',
  });
  const [createdReservation, setCreatedReservation] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const reservationMutation = useMutation({
    mutationFn: async () => {
      const reservationDate = new Date(`${form.date}T${form.time}:00`);
      const organizerId = venue.created_by_id || venue.organizer_id || user?.id;

      const reservation = await base44.entities.Reservation.create({
        user_id: user.id,
        user_name: user.full_name || user.email?.split('@')[0] || 'Usuário',
        user_avatar_url: user.avatar_url || '',
        venue_id: venue.id,
        venue_name: venue.name,
        venue_image_url: venue.image_url || '',
        venue_address: venue.location?.address || '',
        organizer_id: organizerId,
        reservation_date: reservationDate.toISOString(),
        duration_hours: 3,
        party_size: Number(form.party_size),
        table_type: form.table_type,
        special_requests: form.special_requests,
        contact_phone: form.contact_phone,
        status: 'pending',
      });

      // Notificação para o organizador
      if (organizerId && organizerId !== user.id) {
        await base44.entities.Notification.create({
          user_id: organizerId,
          type: 'reservation_request',
          title: 'Nova Reserva Recebida',
          message: `${user.full_name || 'Usuário'} fez uma reserva para ${form.party_size} pessoas em ${venue.name} — ${form.date} às ${form.time}.`,
          reservation_id: reservation.id,
        });
      }

      // Notificação de confirmação para o usuário
      await base44.entities.Notification.create({
        user_id: user.id,
        type: 'reservation_confirmed',
        title: 'Reserva Registrada',
        message: `Sua reserva em ${venue.name} foi registrada! Data: ${form.date} às ${form.time}. Aguarde a confirmação do estabelecimento.`,
        reservation_id: reservation.id,
      });

      return reservation;
    },
    onSuccess: (reservation) => {
      setCreatedReservation(reservation);
      setStep('success');
    },
    onError: (e) => {
      alert('Erro ao criar reserva: ' + (e.message || 'tente novamente'));
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.contact_phone.trim()) {
      alert('Informe seu telefone para contato');
      return;
    }
    reservationMutation.mutate();
  };

  const formatDate = (d) => {
    const date = new Date(d);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const formatTime = (d) => {
    const date = new Date(d);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-md z-[110] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-gradient-to-b from-gray-900 to-black border-2 border-cyan-500/30 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 bg-black/50 backdrop-blur-sm rounded-full p-2 hover:bg-black/70 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Header */}
          <div className="relative h-32 overflow-hidden rounded-t-2xl">
            {venue.image_url && (
              <img src={venue.image_url} alt={venue.name} className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-black/50 to-transparent" />
            <div className="absolute bottom-3 left-5">
              <h2 className="text-xl font-bold text-white">{venue.name}</h2>
              <p className="text-xs text-gray-400">{venue.location?.neighborhood || venue.location?.city || ''}</p>
            </div>
          </div>

          <div className="p-5">
            {step === 'form' && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-semibold text-white">Fazer Reserva</h3>
                </div>

                {/* Data e Hora */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Data</label>
                    <input
                      type="date"
                      min={todayStr()}
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-cyan-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Horário</label>
                    <select
                      value={form.time}
                      onChange={(e) => setForm({ ...form, time: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-cyan-500 outline-none"
                    >
                      {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                {/* Pessoas e Mesa */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block flex items-center gap-1">
                      <Users className="w-3 h-3" /> Pessoas
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, party_size: Math.max(1, form.party_size - 1) })}
                        className="w-8 h-8 rounded-lg bg-gray-800 border border-gray-700 text-white flex items-center justify-center hover:bg-gray-700"
                      >−</button>
                      <span className="flex-1 text-center text-white font-bold">{form.party_size}</span>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, party_size: Math.min(30, form.party_size + 1) })}
                        className="w-8 h-8 rounded-lg bg-gray-800 border border-gray-700 text-white flex items-center justify-center hover:bg-gray-700"
                      >+</button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Tipo</label>
                    <select
                      value={form.table_type}
                      onChange={(e) => setForm({ ...form, table_type: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-cyan-500 outline-none"
                    >
                      {TABLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>

                {/* Telefone */}
                <div>
                  <label className="text-xs text-gray-400 mb-1 block flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Telefone para contato
                  </label>
                  <input
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={form.contact_phone}
                    onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-cyan-500 outline-none"
                    required
                  />
                </div>

                {/* Pedidos especiais */}
                <div>
                  <label className="text-xs text-gray-400 mb-1 block flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" /> Pedidos especiais (opcional)
                  </label>
                  <textarea
                    placeholder="Aniversário, restrições alimentares, etc."
                    value={form.special_requests}
                    onChange={(e) => setForm({ ...form, special_requests: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-cyan-500 outline-none resize-none"
                    rows={2}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={reservationMutation.isPending}
                  className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 h-11"
                >
                  {reservationMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Enviando reserva...</>
                  ) : (
                    <>Confirmar Reserva</>
                  )}
                </Button>
              </form>
            )}

            {step === 'success' && createdReservation && (
              <div className="space-y-5">
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.1 }}
                    className="w-16 h-16 mx-auto bg-green-600/20 rounded-full flex items-center justify-center mb-3 border-2 border-green-500"
                  >
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </motion.div>
                  <h3 className="text-lg font-bold text-white">Reserva Solicitada!</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    O estabelecimento foi notificado e irá aprovar sua reserva.
                  </p>
                </div>

                {/* Status Timeline */}
                <div className="flex items-center justify-between gap-1 px-2">
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[10px] text-green-400 font-medium">Solicitada</span>
                  </div>
                  <div className="flex-1 h-0.5 bg-gray-700 -mt-5">
                    <div className="h-full w-1/2 bg-yellow-500/50"></div>
                  </div>
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <div className="w-8 h-8 rounded-full bg-yellow-600/30 border-2 border-yellow-600 flex items-center justify-center animate-pulse">
                      <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />
                    </div>
                    <span className="text-[10px] text-yellow-400 font-medium">Aguardando</span>
                  </div>
                  <div className="flex-1 h-0.5 bg-gray-700 -mt-5"></div>
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <div className="w-8 h-8 rounded-full bg-gray-800 border-2 border-gray-700 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-gray-600" />
                    </div>
                    <span className="text-[10px] text-gray-600 font-medium">Confirmada</span>
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded-xl p-4 space-y-2 border border-gray-700">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Local</span>
                    <span className="text-white font-medium">{venue.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Data</span>
                    <span className="text-white font-medium">{formatDate(createdReservation.reservation_date)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Horário</span>
                    <span className="text-white font-medium">{formatTime(createdReservation.reservation_date)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Pessoas</span>
                    <span className="text-white font-medium">{createdReservation.party_size}</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-gray-400">Status</span>
                    <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-700">Aguardando aprovação</Badge>
                  </div>
                </div>

                <div className="bg-cyan-950/20 border border-cyan-800/40 rounded-lg p-3 text-xs text-cyan-300">
                  <p className="font-medium mb-1">📌 Próximos passos:</p>
                  <ul className="space-y-1 text-gray-400">
                    <li>• Você receberá uma notificação quando o local aprovar</li>
                    <li>• Após a aprovação, um código de check-in será gerado</li>
                    <li>• Apresente o código no local para fazer o check-in</li>
                  </ul>
                </div>

                {/* Calendar Link */}
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2">Vincular à Agenda</h4>
                  <ReservationCalendarLink
                    reservation={createdReservation}
                    onAdded={async () => {
                      if (!createdReservation.calendar_added) {
                        await base44.entities.Reservation.update(createdReservation.id, { calendar_added: true });
                      }
                    }}
                  />
                </div>

                <Button onClick={onClose} variant="outline" className="w-full border-gray-700 text-white hover:bg-gray-800">
                  Concluir
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}