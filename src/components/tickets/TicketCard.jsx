import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, User, CreditCard, CheckCircle, XCircle, Copy, Share2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import CalendarIntegration from "../integrations/CalendarIntegration";
import { motion, AnimatePresence } from "framer-motion";

export default function TicketCard({ ticket, event }) {
  const [showQR, setShowQR] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const statusConfig = {
    valid: { color: "bg-green-600", icon: CheckCircle, label: "Válido" },
    used: { color: "bg-gray-600", icon: CheckCircle, label: "Usado" },
    cancelled: { color: "bg-red-600", icon: XCircle, label: "Cancelado" },
    refunded: { color: "bg-yellow-600", icon: XCircle, label: "Reembolsado" }
  };

  const status = statusConfig[ticket.status] || statusConfig.valid;
  const StatusIcon = status.icon;

  const handleShare = async () => {
    const text = `🎟️ Ingresso: ${ticket.ticket_type}\n📍 ${event?.title || 'Evento'}\n📅 ${event?.date ? format(new Date(event.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : ''}`;
    
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Meu Ingresso', text });
      } catch (err) {
        console.log('Compartilhamento cancelado');
      }
    } else {
      alert(text);
    }
  };

  const handleCopyQR = () => {
    navigator.clipboard.writeText(ticket.qr_code_data);
    alert('✅ Código copiado!');
  };

  if (!event) {
    return (
      <Card className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700 text-white overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <Badge className={`${status.color} text-white`}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {status.label}
            </Badge>
          </div>

          <h3 className="font-bold text-lg mb-2">{ticket.ticket_type}</h3>

          <div className="space-y-2 text-sm mb-4">
            <div className="flex items-center text-gray-300">
              <CreditCard className="w-4 h-4 mr-2 text-cyan-400" />
              <span className="font-semibold text-green-400">R$ {ticket.price?.toFixed(2)}</span>
            </div>
            <div className="flex items-center text-gray-300">
              <User className="w-4 h-4 mr-2 text-purple-400" />
              <span>{ticket.attendee_info?.full_name || 'Participante'}</span>
            </div>
          </div>

          <Button 
            onClick={() => setShowQR(!showQR)}
            className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700"
          >
            {showQR ? 'Ocultar Código' : 'Mostrar Código'}
          </Button>

          <AnimatePresence>
            {showQR && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4"
              >
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-black text-center font-mono text-sm break-all">{ticket.qr_code_data}</p>
                </div>
                <Button onClick={handleCopyQR} variant="outline" size="sm" className="w-full mt-2">
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar Código
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700 text-white overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <Badge className={`${status.color} text-white`}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {status.label}
          </Badge>
          <span className="text-xs text-gray-400">ID: {ticket.id.slice(0, 8)}</span>
        </div>

        <h3 className="font-bold text-lg mb-2">{event.title}</h3>

        <div className="space-y-2 text-sm mb-4">
          <div className="flex items-center text-gray-300">
            <Calendar className="w-4 h-4 mr-2 text-cyan-400" />
            <span>{format(new Date(event.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
          </div>
          <div className="flex items-center text-gray-300">
            <MapPin className="w-4 h-4 mr-2 text-green-400" />
            <span className="line-clamp-1">{event.location?.venue_name || event.location?.address}</span>
          </div>
          <div className="flex items-center text-gray-300">
            <User className="w-4 h-4 mr-2 text-purple-400" />
            <span>{ticket.attendee_info?.full_name || 'Participante'}</span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
          <div>
            <p className="text-xs text-gray-400">Tipo de Ingresso</p>
            <p className="font-semibold">{ticket.ticket_type}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Valor</p>
            <p className="font-semibold text-green-400">R$ {ticket.price?.toFixed(2)}</p>
          </div>
        </div>

        {ticket.checked_in_at && (
          <div className="mb-4 p-2 bg-green-500/10 border border-green-500/30 rounded-lg">
            <p className="text-xs text-green-400 flex items-center">
              <CheckCircle className="w-3 h-3 mr-1" />
              Check-in realizado em {format(new Date(ticket.checked_in_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        )}

        <div className="flex gap-2 mb-3">
          <Button 
            onClick={() => setShowQR(!showQR)}
            className="flex-1 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700"
          >
            {showQR ? 'Ocultar Código' : 'Ver Código'}
          </Button>
          <Button onClick={() => setShowCalendar(!showCalendar)} variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
            <Calendar className="w-4 h-4" />
          </Button>
          <Button onClick={handleShare} variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
            <Share2 className="w-4 h-4" />
          </Button>
        </div>

        <AnimatePresence>
          {showQR && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3"
            >
              <div className="bg-white p-4 rounded-lg">
                <p className="text-black text-center font-mono text-xs break-all">{ticket.qr_code_data}</p>
              </div>
              <Button onClick={handleCopyQR} variant="outline" size="sm" className="w-full mt-2 border-gray-600 text-gray-300">
                <Copy className="w-4 h-4 mr-2" />
                Copiar Código
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {showCalendar && <CalendarIntegration event={event} onClose={() => setShowCalendar(false)} />}
      </CardContent>
    </Card>
  );
}