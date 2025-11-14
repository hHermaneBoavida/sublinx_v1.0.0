import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Download } from "lucide-react";
import { motion } from "framer-motion";

export default function CalendarIntegration({ event, onClose }) {
  const formatDateForCalendar = (date, durationHours = 3) => {
    const start = new Date(date);
    const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
    
    const formatDate = (d) => {
      return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    return {
      start: formatDate(start),
      end: formatDate(end)
    };
  };

  const handleGoogleCalendar = () => {
    const { start, end } = formatDateForCalendar(event.date, event.duration_hours || 3);
    const title = encodeURIComponent(event.title);
    const details = encodeURIComponent(event.description || '');
    const location = encodeURIComponent(event.location?.venue_name || event.location?.address || '');
    
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
    window.open(url, '_blank');
  };

  const handleAppleCalendar = () => {
    const { start, end } = formatDateForCalendar(event.date, event.duration_hours || 3);
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//SUBLINX//Event//PT',
      'BEGIN:VEVENT',
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description || ''}`,
      `LOCATION:${event.location?.venue_name || event.location?.address || ''}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.title}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleOutlookCalendar = () => {
    const { start, end } = formatDateForCalendar(event.date, event.duration_hours || 3);
    const title = encodeURIComponent(event.title);
    const details = encodeURIComponent(event.description || '');
    const location = encodeURIComponent(event.location?.venue_name || event.location?.address || '');
    
    const url = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${start}&enddt=${end}&body=${details}&location=${location}`;
    window.open(url, '_blank');
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            Adicionar ao Calendário
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleGoogleCalendar}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 h-12"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 110-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0012.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z"/>
              </svg>
              Google Calendar
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleAppleCalendar}
              className="w-full bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 h-12"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              Apple Calendar
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleOutlookCalendar}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 h-12"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 7.387v9.226c0 1.24-.561 2.387-1.501 3.108l-6.626 5.074c-.517.396-1.098.592-1.686.592a2.974 2.974 0 01-1.686-.592L5.875 19.72C4.935 19 4.373 17.853 4.373 16.613V7.387c0-1.24.561-2.387 1.502-3.108l6.626-5.073c.517-.397 1.098-.593 1.686-.593.588 0 1.169.196 1.686.593l6.626 5.073C23.439 5 24 6.147 24 7.387zM7.5 13.5v2.827l2.338-1.413L7.5 13.5zm9.663 3.951l-2.413-1.232 2.413-1.268v2.5zM7.5 7.673v2.827l2.338-1.413L7.5 7.673zm9.663 3.95l-2.413-1.231 2.413-1.268v2.5zm-1.826-3.463L12 10.846 8.663 8.16 12 5.475l3.337 2.686zm-7.674 8.154l2.488-1.506 1.012.604-3.5 2.122v-1.22zm6.674 0l-2.488-1.506-1.012.604 3.5 2.122v-1.22z"/>
              </svg>
              Outlook Calendar
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleAppleCalendar}
              variant="outline"
              className="w-full border-gray-700 text-white hover:bg-gray-800 h-12"
            >
              <Download className="w-5 h-5 mr-2" />
              Baixar .ics (Outros)
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}