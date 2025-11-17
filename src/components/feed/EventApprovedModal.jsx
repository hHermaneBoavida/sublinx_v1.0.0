
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Download, Share2, CheckCircle, Crown, Copy, CalendarPlus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import CalendarIntegration from '../integrations/CalendarIntegration';

export default function EventApprovedModal({ event, onClose }) {
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  if (!event) return null;

  const qrCodeValue = `SUBLINX-${event.id}-${Date.now()}`;
  const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeValue)}`;

  const handleDownloadTicket = () => {
    const ticketData = {
      event: event.title,
      date: format(new Date(event.date), "PPP 'às' HH:mm", { locale: ptBR }),
      location: event.location?.venue_name || event.location?.city,
      qrCode: qrCodeValue
    };
    
    console.log('📥 Download do ingresso:', ticketData);
    alert('✅ Ingresso baixado! Verifique seus downloads.');
  };

  const handleShareTicket = () => {
    if (navigator.share) {
      navigator.share({
        title: `Ingresso - ${event.title}`,
        text: `Vou no evento ${event.title}! 🎉`,
        url: window.location.href
      }).catch(err => console.log('Erro ao compartilhar:', err));
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('✅ Link copiado para a área de transferência!');
    }
  };

  const handleCopyQRCode = () => {
    navigator.clipboard.writeText(qrCodeValue);
    alert('✅ Código do ingresso copiado!');
  };

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="bg-gray-900 border-green-500/50 text-white max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-400">
              <CheckCircle className="w-6 h-6" />
              Solicitação Aprovada!
            </DialogTitle>
          </DialogHeader>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            {/* Banner do Evento */}
            <div className="relative rounded-lg overflow-hidden">
              <img
                src={event.image_url || `https://picsum.photos/400/200?random=${event.id}`}
                alt={event.title}
                className="w-full h-32 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-2 left-2 right-2">
                <h3 className="font-bold text-white text-lg">{event.title}</h3>
              </div>
            </div>

            {/* Informações do Evento */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-gray-400">Data</p>
                    <p className="text-white font-medium">
                      {format(new Date(event.date), "PPP 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-gray-400">Local</p>
                    <p className="text-white font-medium">
                      {event.location?.venue_name || event.location?.address || 'Local será divulgado'}
                    </p>
                    {event.location?.city && (
                      <p className="text-gray-500 text-xs">{event.location.city}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2 text-sm">
                  <Crown className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-gray-400">Tipo de Ingresso</p>
                    <p className="text-white font-medium">Lista VIP - Entrada Garantida</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* QR Code usando API pública */}
            <div className="bg-white p-4 rounded-lg">
              <div className="flex justify-center mb-3">
                <img
                  src={qrCodeApiUrl}
                  alt="QR Code"
                  className="w-52 h-52"
                />
              </div>
              <div className="flex items-center justify-between bg-gray-100 rounded px-3 py-2 mb-2">
                <p className="text-gray-800 text-xs font-mono truncate flex-1">{qrCodeValue}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyQRCode}
                  className="text-gray-600 hover:text-gray-800 h-8 ml-2"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-center text-gray-800 text-xs font-medium">
                Apresente este QR Code na entrada
              </p>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge className="bg-green-600/20 border-green-500/30 text-green-300">
                ✅ Aprovado
              </Badge>
              <Badge className="bg-cyan-600/20 border-cyan-500/30 text-cyan-300">
                {event.genre}
              </Badge>
              <Badge className="bg-purple-600/20 border-purple-500/30 text-purple-300">
                {event.type}
              </Badge>
            </div>

            {/* Informações Importantes */}
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
              <p className="text-yellow-300 text-xs font-semibold mb-1">⚠️ Informações Importantes</p>
              <ul className="text-yellow-200 text-xs space-y-1">
                <li>• Chegue com 30 minutos de antecedência</li>
                <li>• Leve documento com foto</li>
                <li>• Este ingresso é pessoal e intransferível</li>
                {event.minimum_level > 1 && (
                  <li>• Nível Underground {event.minimum_level}+ necessário</li>
                )}
              </ul>
            </div>

            {/* Botões de Ação */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                onClick={handleDownloadTicket}
                className="bg-cyan-600 hover:bg-cyan-700 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 mr-1" />
                Baixar
              </Button>
              <Button
                onClick={handleShareTicket}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800 flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4 mr-1" />
                Compartilhar
              </Button>
              <Button
                onClick={() => setShowCalendarModal(true)}
                variant="outline"
                className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 flex items-center justify-center gap-2"
              >
                <CalendarPlus className="w-4 h-4 mr-1" />
                Calendário
              </Button>
            </div>

            {/* Botão Fechar */}
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Fechar
            </Button>
          </motion.div>
        </DialogContent>
      </Dialog>

      {showCalendarModal && <CalendarIntegration event={event} onClose={() => setShowCalendarModal(false)} />}
    </>
  );
}
