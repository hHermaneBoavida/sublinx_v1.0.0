import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  QrCode, Calendar, MapPin, User, Ticket, 
  CheckCircle, XCircle, Download, Share2
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import QRCode from "react-qr-code";

export default function TicketCard({ ticket, event }) {
  const [showQR, setShowQR] = useState(false);

  if (!ticket || !event) return null;

  const statusConfig = {
    valid: {
      color: 'bg-green-600/20 border-green-500/30 text-green-300',
      icon: CheckCircle,
      label: 'Válido'
    },
    used: {
      color: 'bg-blue-600/20 border-blue-500/30 text-blue-300',
      icon: CheckCircle,
      label: 'Utilizado'
    },
    cancelled: {
      color: 'bg-red-600/20 border-red-500/30 text-red-300',
      icon: XCircle,
      label: 'Cancelado'
    },
    refunded: {
      color: 'bg-yellow-600/20 border-yellow-500/30 text-yellow-300',
      icon: XCircle,
      label: 'Reembolsado'
    }
  };

  const config = statusConfig[ticket.status] || statusConfig.valid;
  const StatusIcon = config.icon;

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Ingresso - ${event.title}`,
          text: `Meu ingresso para ${event.title}`,
          url: window.location.href
        });
      } else {
        alert('Compartilhamento não suportado neste dispositivo');
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="mb-4"
    >
      <Card className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700 overflow-hidden relative">
        {/* Background Pattern */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(6, 182, 212, 0.5) 10px, rgba(6, 182, 212, 0.5) 11px)`
          }}
        />

        <CardContent className="p-0 relative z-10">
          <div className="flex flex-col md:flex-row">
            {/* Left: Event Info */}
            <div className="flex-1 p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-600 to-purple-600 flex items-center justify-center">
                    <Ticket className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">{event.title}</h3>
                    <Badge className={config.color}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {config.label}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Event Details */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-gray-300">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm">
                    {format(new Date(event.date), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-gray-300">
                  <MapPin className="w-4 h-4 text-purple-400" />
                  <span className="text-sm">
                    {event.location?.venue_name || 'Local a definir'}
                  </span>
                </div>

                {ticket.attendee_info && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <User className="w-4 h-4 text-green-400" />
                    <span className="text-sm">
                      {ticket.attendee_info.full_name || 'Titular'}
                    </span>
                  </div>
                )}
              </div>

              {/* Ticket Info */}
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Tipo</p>
                    <p className="font-semibold text-white">{ticket.ticket_type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Valor</p>
                    <p className="font-semibold text-green-400">R$ {ticket.price.toFixed(2)}</p>
                  </div>
                  {ticket.quantity > 1 && (
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Quantidade</p>
                      <p className="font-semibold text-white">{ticket.quantity}x</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-400 mb-1">ID</p>
                    <p className="font-mono text-xs text-gray-300">
                      #{ticket.id.substring(0, 8)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => setShowQR(!showQR)}
                  className="flex-1 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700"
                  disabled={ticket.status !== 'valid'}
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  {showQR ? 'Ocultar QR' : 'Mostrar QR Code'}
                </Button>
                <Button
                  onClick={handleShare}
                  variant="outline"
                  className="border-gray-600"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Right: QR Code */}
            {showQR && ticket.status === 'valid' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="md:w-64 bg-white p-6 flex flex-col items-center justify-center border-l-2 border-gray-700"
              >
                <div className="bg-white p-4 rounded-lg mb-4">
                  <QRCode
                    value={ticket.qr_code_data}
                    size={200}
                    level="H"
                  />
                </div>
                <p className="text-xs text-center text-gray-800 font-mono">
                  {ticket.qr_code_data.substring(0, 20)}...
                </p>
                {ticket.checked_in_at && (
                  <Badge className="mt-3 bg-green-600 text-white">
                    Check-in realizado
                  </Badge>
                )}
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}