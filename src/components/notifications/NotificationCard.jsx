import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Star, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { formatRelative } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const notificationTypes = {
  event_alert: { icon: Bell, color: 'text-cyan-400' },
  surprise_event: { icon: Star, color: 'text-yellow-400' },
  level_up: { icon: Star, color: 'text-purple-400' },
  request_approved: { icon: CheckCircle, color: 'text-green-400' },
  request_denied: { icon: XCircle, color: 'text-red-400' },
  new_message: { icon: MessageSquare, color: 'text-blue-400' },
  default: { icon: Bell, color: 'text-gray-400' }
};

export default function NotificationCard({ notification, onMarkAsRead }) {
  const navigate = useNavigate();
  const { icon: Icon, color } = notificationTypes[notification.type] || notificationTypes.default;

  const handleClick = () => {
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }
    // Navegar para a página relevante se houver um link
    if (notification.event_id) {
      navigate(createPageUrl(`Mapa?eventId=${notification.event_id}`));
    }
  };

  return (
    <Card 
      className={cn(
        "bg-gray-900/70 border border-gray-700 cursor-pointer transition-all hover:border-cyan-500/50",
        !notification.is_read && "bg-gradient-to-r from-cyan-900/20 to-gray-900/70"
      )}
      onClick={handleClick}
    >
      <CardContent className="p-4 flex items-start gap-4">
        {!notification.is_read && (
          <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 animate-pulse" />
        )}
        <div className={cn("mt-1", notification.is_read && "ml-4")}>
          <Icon className={cn("w-6 h-6", color)} />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-white">{notification.title}</p>
          <p className="text-sm text-gray-300">{notification.message}</p>
          <p className="text-xs text-gray-500 mt-1">
            {formatRelative(new Date(notification.created_date), new Date(), { locale: ptBR })}
          </p>
        </div>
        {!notification.is_read && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsRead(notification.id);
            }}
          >
            Marcar como lida
          </Button>
        )}
      </CardContent>
    </Card>
  );
}