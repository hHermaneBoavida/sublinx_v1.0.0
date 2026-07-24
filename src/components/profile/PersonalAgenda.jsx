import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import TicketCard from '../tickets/TicketCard';
import { Calendar } from 'lucide-react';

export default function PersonalAgenda({ user }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserTickets = async () => {
      setLoading(true);
      try {
        const userTickets = await base44.entities.Ticket.filter({ user_id: user.id }, '-created_date');
        
        if (userTickets.length > 0) {
          const eventIds = [...new Set(userTickets.map(t => t.event_id))];
          const events = await base44.entities.Event.filter({ id: eventIds });
          const eventsMap = new Map(events.map(e => [e.id, e]));

          const ticketsWithEvents = userTickets.map(ticket => ({
            ...ticket,
            event: eventsMap.get(ticket.event_id)
          })).filter(t => t.event); // Filtrar tickets onde o evento foi encontrado

          setTickets(ticketsWithEvents);
        } else {
          setTickets([]);
        }

      } catch (error) {
        console.error("Erro ao carregar agenda:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      loadUserTickets();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Minha Agenda</h2>
      {tickets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tickets.map(ticket => (
            <TicketCard key={ticket.id} ticket={ticket} event={ticket.event} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-900/50 rounded-lg border border-gray-700">
          <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">Sua agenda está vazia</h3>
          <p className="text-gray-500">
            Explore o mapa, encontre seu próximo evento e confirme presença para vê-lo aqui.
          </p>
        </div>
      )}
    </div>
  );
}