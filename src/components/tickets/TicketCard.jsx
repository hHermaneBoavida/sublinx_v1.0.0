import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCode, Calendar, MapPin, User, Ticket, CheckCircle, XCircle, Share2, Copy } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function TicketCard({ ticket, event }) {
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  useEffect(() => {
    if (showQR && ticket?.qr_code_data) {
      // Gera QR Code usando API pública
      const qrData = encodeURIComponent(ticket.qr_code_data);
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${qrData}`;
      setQrCodeUrl(qrUrl);
    }
  }, [showQR, ticket?.qr_code_data]);

  if (!ticket || !event) return null;

  const statusConfig = {
    valid: { color: 'bg-green-600/20 border-green-500/30 text-green-300', icon: CheckCircle, label: 'Válido' },
    used: { color: 'bg-blue-600/20 border-blue-500/30 text-blue-300', icon: CheckCircle, label: 'Utilizado' },
    cancelled: { color: 'bg-red-600/20 border-red-500/30 text-red-300', icon: XCircle, label: 'Cancelado' },
    refunded: { color: 'bg-yellow-600/20 border-yellow-500/30 text-yellow-300', icon: XCircle, label: 'Reembolsado' }
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
        alert('Compartilhamento não suportado');
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
    }
  };

  const handleCopyQRCode = () => {
    navigator.clipboard.writeText(ticket.qr_code_data);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="bg-gray-900 border-gray-800 overflow-hidden">
      <CardContent className="p-6">
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

        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 text-gray-300">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <span className="text-sm">
              {format(new Date(event.date), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
            </span>
          </div>

          <div className="flex items-center gap-2 text-gray-300">
            <MapPin className="w-4 h-4 text-purple-400" />
            <span className="text-sm">{event.location?.venue_name || 'Local a definir'}</span>
          </div>

          {ticket.attendee_info?.full_name && (
            <div className="flex items-center gap-2 text-gray-300">
              <User className="w-4 h-4 text-green-400" />
              <span className="text-sm">{ticket.attendee_info.full_name}</span>
            </div>
          )}
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 mb-4">
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
              <p className="font-mono text-xs text-gray-300">#{ticket.id.substring(0, 8)}</p>
            </div>
          </div>
        </div>

        {showQR && ticket.status === 'valid' && (
          <div className="bg-gradient-to-br from-cyan-900/20 to-purple-900/20 border-2 border-cyan-500/30 rounded-xl p-6 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-cyan-400" />
                <h4 className="font-bold text-white">Código do Ingresso</h4>
              </div>
              <Button
                onClick={handleCopyQRCode}
                size="sm"
                variant="ghost"
                className="text-cyan-400 hover:bg-cyan-900/20"
              >
                <Copy className="w-4 h-4 mr-2" />
                {copied ? 'Copiado!' : 'Copiar'}
              </Button>
            </div>

            {/* QR Code Visual */}
            <div className="bg-white rounded-lg p-4 mb-3 flex items-center justify-center">
              {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Código texto */}
            <div className="bg-black/50 rounded-lg p-4 border border-cyan-500/20">
              <p className="font-mono text-xs text-cyan-300 break-all text-center">
                {ticket.qr_code_data}
              </p>
            </div>

            <p className="text-xs text-gray-400 mt-3 text-center">
              Apresente este código na entrada do evento
            </p>

            {ticket.checked_in_at && (
              <div className="mt-3 flex items-center justify-center gap-2">
                <Badge className="bg-green-600 text-white">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Check-in realizado
                </Badge>
                <span className="text-xs text-gray-400">
                  {format(new Date(ticket.checked_in_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={() => setShowQR(!showQR)}
            className="flex-1 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700"
            disabled={ticket.status !== 'valid'}
          >
            <QrCode className="w-4 h-4 mr-2" />
            {showQR ? 'Ocultar Código' : 'Mostrar Código'}
          </Button>
          <Button onClick={handleShare} variant="outline" className="border-gray-600">
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}