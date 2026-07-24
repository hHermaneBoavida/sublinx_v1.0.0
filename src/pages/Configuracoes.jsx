import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, LogOut, ChevronRight, Loader2, AlertCircle, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export default function Configuracoes() {
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const userImage = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/5048ab8ec_perfil.png";

  // CORREÇÃO: Usar useQuery em vez de useEffect
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        const userData = await base44.auth.me();
        
        // Defaults para garantir que os campos existam
        if (!userData.avatar_url) userData.avatar_url = userImage;
        if (!userData.music_preferences) userData.music_preferences = ["Techno", "Industrial", "DnB"];
        if (!userData.notification_preferences) {
          userData.notification_preferences = {
            event_alerts: true,
            surprise_events: true,
            level_notifications: true,
            chat_messages: true,
            request_updates: true,
            transport_reminders: true
          };
        }
        if (!userData.transport_preferences) {
          userData.transport_preferences = {
            preferred_service: "uber",
            reminder_time: 30
          };
        }

        return userData;
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);
        throw error;
      }
    },
    retry: false,
    staleTime: 30 * 1000,
  });

  // State local para edição
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

  // Sincronizar com dados do usuário quando carregar
  React.useEffect(() => {
    if (user) {
      if (user.notification_preferences) {
        setNotificationPrefs(user.notification_preferences);
      }
      if (user.transport_preferences) {
        setTransportPrefs(user.transport_preferences);
      }
    }
  }, [user]);

  // Mutation para salvar configurações
  const updateSettingsMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.auth.updateMe(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['currentUser']);
      alert("✅ Configurações salvas com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao salvar configurações:", error);
      alert("Erro ao salvar configurações. Tente novamente.");
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

  const handleLogout = async () => {
    try {
      await base44.auth.logout();
      navigate(createPageUrl("BemVindo"));
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      navigate(createPageUrl("BemVindo"));
      window.location.reload();
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 text-cyan-500 animate-spin" />
          <p className="text-gray-400">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full h-[calc(100vh-80px)] flex items-center justify-center px-4">
        <Card className="bg-gray-900/50 border-red-500/50 max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Erro ao Carregar</h3>
            <p className="text-gray-400 mb-4">
              Não foi possível carregar suas configurações. Você precisa estar autenticado.
            </p>
            <Button onClick={() => navigate(createPageUrl("BemVindo"))} className="w-full">
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User not found (should not happen with error handling above, but safety check)
  if (!user) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 text-white">
      <div className="mb-6 sm:mb-8">
        <h1 className="flex items-center gap-2 sm:gap-3 text-2xl sm:text-3xl font-bold text-transparent bg-gradient-to-r from-lime-400 to-cyan-400 bg-clip-text mb-2">
          <Settings className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400" />
          Configurações
        </h1>
        <p className="text-xs sm:text-sm text-gray-400">
          Gerencie sua conta e preferências do SUBLINX
        </p>
      </div>

      {/* Notificações */}
      <Card className="bg-gray-900/50 border-gray-700 mb-6">
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
      <Card className="bg-gray-900/50 border-gray-700 mb-6">
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
        className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 mb-6 h-12 sm:h-14 text-sm sm:text-base"
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

      {/* Separador */}
      <Separator className="my-6 sm:my-8 bg-gray-700" />

      {/* Logout Button */}
      <div className="mt-6 sm:mt-8">
        <Button
          onClick={() => setShowLogoutDialog(true)}
          variant="outline"
          className="w-full justify-between bg-red-900/20 border-red-500/50 text-red-400 hover:bg-red-900/30 hover:text-red-300 h-12 sm:h-14 text-sm sm:text-base"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Sair da Conta</span>
          </div>
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
      </div>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="bg-gray-900 border-red-500/50 text-white max-w-md mx-4 sm:mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">Confirmar Saída</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400 text-xs sm:text-sm">
              Tem certeza que deseja sair da sua conta? Você precisará fazer login novamente para acessar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="bg-gray-800 border-gray-600 hover:bg-gray-700 text-sm w-full sm:w-auto">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleLogout}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-sm w-full sm:w-auto"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair da Conta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}