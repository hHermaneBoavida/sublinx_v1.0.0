import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function AccountSettings({ user, onUpdate }) {
  const queryClient = useQueryClient();
  
  // CORREÇÃO: Inicializar com valores padrão seguros
  const [notificationPrefs, setNotificationPrefs] = useState({
    event_alerts: true,
    surprise_events: true,
    level_notifications: true,
    chat_messages: true,
    request_updates: true,
    transport_reminders: true
  });
  
  const [transportPrefs, setTransportPrefs] = useState({
    preferred_service: "uber",
    reminder_time: 30
  });

  // CORREÇÃO: Sincronizar com dados do usuário quando disponível
  useEffect(() => {
    if (user) {
      if (user.notification_preferences) {
        setNotificationPrefs(user.notification_preferences);
      }
      if (user.transport_preferences) {
        setTransportPrefs(user.transport_preferences);
      }
    }
  }, [user]);

  // CORREÇÃO: Usar mutation em vez de chamada direta
  const updateSettingsMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.auth.updateMe(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['currentUser']);
      alert("✅ Configurações salvas com sucesso!");
      if (onUpdate) onUpdate();
    },
    onError: (error) => {
      console.error("❌ Erro ao salvar configurações:", error);
      alert("❌ Falha ao salvar. Tente novamente.");
    }
  });

  const handleNotifChange = (key, value) => {
    setNotificationPrefs(prev => ({ ...prev, [key]: value }));
  };

  const handleTransportChange = (key, value) => {
    setTransportPrefs(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    updateSettingsMutation.mutate({
      notification_preferences: notificationPrefs,
      transport_preferences: transportPrefs
    });
  };

  // CORREÇÃO: Verificar se user existe antes de renderizar
  if (!user) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notificações */}
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-base sm:text-lg">Notificações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: 'event_alerts', label: 'Alertas de Eventos' },
            { key: 'surprise_events', label: 'Eventos Surpresa' },
            { key: 'level_notifications', label: 'Notificações de Nível' },
            { key: 'chat_messages', label: 'Mensagens de Chat' },
            { key: 'request_updates', label: 'Atualizações de Solicitações' },
            { key: 'transport_reminders', label: 'Lembretes de Transporte' }
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <Label htmlFor={`notif-${key}`} className="text-gray-300 text-sm sm:text-base">
                {label}
              </Label>
              <Switch
                id={`notif-${key}`}
                checked={notificationPrefs[key] || false}
                onCheckedChange={(checked) => handleNotifChange(key, checked)}
                disabled={updateSettingsMutation.isPending}
              />
            </div>
          ))}
        </CardContent>
      </Card>
      
      {/* Transporte */}
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-base sm:text-lg">Transporte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-gray-300 text-sm sm:text-base block mb-2">Serviço Preferido</Label>
            <Select 
              value={transportPrefs.preferred_service || "uber"} 
              onValueChange={(value) => handleTransportChange('preferred_service', value)}
              disabled={updateSettingsMutation.isPending}
            >
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="uber">Uber</SelectItem>
                <SelectItem value="99taxi">99</SelectItem>
                <SelectItem value="both">Ambos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-gray-300 text-sm sm:text-base block mb-2">
              Lembrete (minutos antes do evento)
            </Label>
            <Input 
              type="number"
              value={transportPrefs.reminder_time || 30}
              onChange={(e) => handleTransportChange('reminder_time', parseInt(e.target.value) || 30)}
              className="bg-gray-800 border-gray-600 text-white"
              min="5"
              max="120"
              disabled={updateSettingsMutation.isPending}
            />
          </div>
        </CardContent>
      </Card>

      {/* Botão Salvar */}
      <Button 
        onClick={handleSave} 
        disabled={updateSettingsMutation.isPending} 
        className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 h-12 sm:h-14 text-sm sm:text-base"
      >
        {updateSettingsMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mr-2" />
            Salvando...
          </>
        ) : (
          <>
            <Save className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Salvar Configurações
          </>
        )}
      </Button>
    </div>
  );
}