import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Download, Bell, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const TABLE_LABELS = {
  standard: 'Mesa Standard',
  mesa: 'Mesa',
  vip: 'VIP',
  balcao: 'Balcão',
  lounge: 'Lounge',
  area_externa: 'Área Externa',
};

export default function ReservationCalendarLink({ reservation, onAdded }) {
  const start = new Date(reservation.reservation_date);
  const end = new Date(start.getTime() + (reservation.duration_hours || 3) * 60 * 60 * 1000);

  const formatDate = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const title = `Reserva - ${reservation.venue_name}`;
  const description = `Reserva para ${reservation.party_size} pessoas${reservation.table_type !== 'standard' ? ` • ${TABLE_LABELS[reservation.table_type] || reservation.table_type}` : ''}${reservation.special_requests ? ` • ${reservation.special_requests}` : ''}`;
  const location = reservation.venue_address || reservation.venue_name;

  const handleGoogleCalendar = () => {
    const startFmt = formatDate(start);
    const endFmt = formatDate(end);
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: title,
      dates: `${startFmt}/${endFmt}`,
      details: `${description}\n\n⚠️ Configure um lembrete para 2 horas antes!`,
      location,
    });
    window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, '_blank');
    if (onAdded) onAdded();
  };

  const handleICS = () => {
    const startFmt = formatDate(start);
    const endFmt = formatDate(end);

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//SUBLINX//Reservation//PT',
      'BEGIN:VEVENT',
      `UID:${reservation.id || Date.now()}@sublinx.com`,
      `DTSTART:${startFmt}`,
      `DTEND:${endFmt}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${location}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT2H',
      'ACTION:DISPLAY',
      'DESCRIPTION:🔔 Sua reserva em ' + reservation.venue_name + ' começa em 2 horas!',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reserva-${reservation.venue_name}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    if (onAdded) onAdded();
  };

  const handleOutlook = () => {
    const startFmt = start.toISOString();
    const endFmt = end.toISOString();
    const params = new URLSearchParams({
      subject: title,
      startdt: startFmt,
      enddt: endFmt,
      body: `${description}\n\n⚠️ Configure um lembrete para 2 horas antes!`,
      location,
    });
    window.open(`https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`, '_blank');
    if (onAdded) onAdded();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-cyan-400 bg-cyan-900/20 border border-cyan-800/50 rounded-lg p-2">
        <Bell className="w-3.5 h-3.5 flex-shrink-0" />
        <span>Vincule à sua agenda para receber um lembrete 2h antes da reserva</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={handleGoogleCalendar}
            className="w-full bg-blue-600 hover:bg-blue-700 h-10 text-xs"
          >
            <Calendar className="w-3.5 h-3.5 mr-1" />
            Google
          </Button>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={handleICS}
            className="w-full bg-gray-700 hover:bg-gray-800 h-10 text-xs"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            Apple / .ics
          </Button>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={handleOutlook}
            variant="outline"
            className="w-full border-blue-500 text-blue-400 hover:bg-blue-900/20 h-10 text-xs"
          >
            <Calendar className="w-3.5 h-3.5 mr-1" />
            Outlook
          </Button>
        </motion.div>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <Clock className="w-3 h-3" />
        <span>Lembrete automático configurado para 2h antes</span>
      </div>
    </div>
  );
}