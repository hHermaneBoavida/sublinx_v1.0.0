import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, QrCode, Ticket as TicketIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function TicketCard({ ticket, event }) {
  const [showQr, setShowQr] = useState(false);
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(ticket.qr_code_data)}`;

  return (
    <>
      <Card className="bg-gradient-to-br from-gray-900 via-gray-800/70 to-black border border-gray-700 text-white overflow-hidden group">
        <div className="relative">
          <img src={event.image_url} alt={event.title} className="w-full h-32 object-cover opacity-50 group-hover:opacity-70 transition-opacity" />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
          <div className="absolute bottom-0 left-0 p-4">
            <CardTitle className="text-lg font-bold">{event.title}</CardTitle>
            <p className="text-sm text-gray-300">{ticket.ticket_type}</p>
          </div>
        </div>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <span>{format(new Date(event.date), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <MapPin className="w-4 h-4 text-purple-400" />
            <span>{event.location.venue_name}</span>
          </div>
          <Button
            onClick={() => setShowQr(true)}
            className="w-full bg-gradient-to-r from-lime-600 to-green-600 hover:from-lime-700 hover:to-green-700"
          >
            <QrCode className="w-4 h-4 mr-2" />
            Mostrar Ingresso
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showQr} onOpenChange={setShowQr}>
        <DialogContent className="bg-gray-900 border-green-500 text-white">
          <DialogHeader>
            <DialogTitle className="text-center text-xl text-green-400">Seu Ingresso</DialogTitle>
          </DialogHeader>
          <div className="p-6 flex flex-col items-center gap-4">
            <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64 rounded-lg bg-white p-2" />
            <div className="text-center">
              <p className="font-bold text-lg">{event.title}</p>
              <p className="text-gray-300">{ticket.ticket_type}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}