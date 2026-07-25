import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Ticket, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ApprovedRequestCard({ request }) {
  const navigate = useNavigate();
  const { event } = request;

  if (!event) {
    return (
      <Card className="bg-gray-900/50 border-gray-700 text-white p-4">
        Carregando dados do evento...
      </Card>
    );
  }

  const handleBuyTicket = (e) => {
    if (e) e.stopPropagation();
    const url = event.ticket_url || event.purchase_url;
    window.open(url && url.startsWith('http') ? url : 'https://www.sympla.com.br/eventos/sao-paulo-sp', '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className="bg-gray-900/50 border-gray-700 hover:border-cyan-500/50 transition-all">
      <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-bold text-lg text-white">{event.title}</h3>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400 mt-1">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>{event.location.is_secret ? "Local Secreto" : event.location.venue_name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{format(new Date(event.date), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
            </div>
          </div>
        </div>
        <Button
          onClick={handleBuyTicket}
          className="w-full sm:w-auto bg-gradient-to-r from-lime-500 to-green-500 hover:from-lime-600 hover:to-green-600 text-white font-semibold"
        >
          <Ticket className="w-4 h-4 mr-2" />
          Comprar Ingresso
        </Button>
      </CardContent>
    </Card>
  );
}