import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Shield, Eye, EyeOff, MapPin, Trash2, Download, AlertCircle, Check, Bell, Sparkles, Trophy, MessageCircle, Mail, BellRing } from "lucide-react";
import { toast } from "sonner";

export default function ConfiguracoesPrivacidade() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDataDialog, setShowDataDialog] = useState(false);
  const navigate = useNavigate();

  const [privacySettings, setPrivacySettings] = useState({
    profile_visible: false,
    show_email: false,
    show_location: false,
    show_events_attended: false,
    allow_messages_from: "nobody",
    discoverable: false
  });

  const [notificationSettings, setNotificationSettings] = useState({
    event_alerts: false,
    surprise_events: false,
    level_notifications: false,
    chat_messages: false,
    email: false,
    push: false,
    sms: false
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      setPrivacySettings(userData.privacy_settings || privacySettings);
      setNotificationSettings(userData.notification_preferences || notificationSettings);
    } catch (error) {
      navigate(createPageUrl("BemVindo"));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({
        privacy_settings: privacySettings,
        notification_preferences: notificationSettings
      });
      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadData = async () => {
    try {
      const userData = await base44.auth.me();
      const dataStr = JSON.stringify(userData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sublynx-dados-${new Date().toISOString()}.json`;
      link.click();
      toast.success("Dados baixados com sucesso!");
    } catch (error) {
      toast.error("Erro ao baixar dados.");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // IMPORTANTE: Implementar lógica de deleção real no backend
      await base44.auth.logout();
      toast.success("Conta apagada. Até breve!");
      navigate(createPageUrl("BemVindo"));
    } catch (error) {
      toast.error("Erro ao apagar conta. Entre em contato com suporte.");
    }
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="flex items-center gap-3 text-3xl font-bold text-transparent bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text mb-2">
          <Shield className="w-8 h-8" />
          Privacidade e Dados
        </h1>
        <p className="text-gray-400">
          Você tem controle total sobre seus dados e privacidade
        </p>
      </div>

      {/* Privacidade */}
      <Card className="bg-gray-900/50 border-gray-700 mb-6">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Configurações de Privacidade
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-green-900/20 border-green-500/30">
            <Shield className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-200 text-sm">
              Seu perfil é <strong>privado por padrão</strong>. Ative apenas o que desejar compartilhar.
            </AlertDescription>
          </Alert>

          {[
            { key: 'profile_visible', label: 'Perfil público visível', description: 'Outros usuários podem ver seu perfil' },
            { key: 'discoverable', label: 'Aparecer em buscas', description: 'Seu perfil aparece nos resultados de busca' },
            { key: 'show_email', label: 'Mostrar email no perfil', description: 'Seu email fica visível para outros' },
            { key: 'show_location', label: 'Compartilhar localização', description: 'Outros podem ver sua cidade/região' },
            { key: 'show_events_attended', label: 'Mostrar eventos participados', description: 'Lista de eventos que você foi' },
          ].map(({ key, label, description }) => (
            <div key={key} className="flex items-start justify-between p-4 bg-gray-800/50 rounded-lg">
              <div className="flex-1">
                <Label htmlFor={key} className="text-gray-200 cursor-pointer">{label}</Label>
                <p className="text-xs text-gray-400 mt-1">{description}</p>
              </div>
              <Switch
                id={key}
                checked={privacySettings[key]}
                onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, [key]: checked }))}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Notificações */}
      <Card className="bg-gray-900/50 border-gray-700 mb-6">
        <CardHeader>
          <CardTitle className="text-white">Preferências de Notificação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: 'event_alerts', label: 'Alertas de eventos', icon: Bell },
            { key: 'surprise_events', label: 'Eventos surpresa', icon: Sparkles },
            { key: 'level_notifications', label: 'Conquistas', icon: Trophy },
            { key: 'chat_messages', label: 'Mensagens', icon: MessageCircle },
            { key: 'email', label: 'Email', icon: Mail },
            { key: 'push', label: 'Push', icon: BellRing },
          ].map(({ key, label, icon: Icon }) => (
            <div key={key} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-cyan-400" />
                <Label htmlFor={key} className="text-gray-200 cursor-pointer">{label}</Label>
              </div>
              <Switch
                id={key}
                checked={notificationSettings[key]}
                onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, [key]: checked }))}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Seus Dados (GDPR/LGPD) */}
      <Card className="bg-gray-900/50 border-gray-700 mb-6">
        <CardHeader>
          <CardTitle className="text-white">Seus Dados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-blue-900/20 border-blue-500/30">
            <AlertCircle className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-200 text-sm">
              Conforme LGPD/GDPR, você tem direito a acessar, corrigir e apagar seus dados
            </AlertDescription>
          </Alert>

          <Button
            onClick={handleDownloadData}
            variant="outline"
            className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            <Download className="w-4 h-4 mr-2" />
            Baixar Todos os Meus Dados (JSON)
          </Button>

          <Button
            onClick={() => setShowDeleteDialog(true)}
            variant="outline"
            className="w-full border-red-600 text-red-400 hover:bg-red-900/20"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Apagar Minha Conta e Dados
          </Button>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex gap-4">
        <Button
          onClick={() => navigate(createPageUrl("Configuracoes"))}
          variant="outline"
          className="flex-1 border-gray-600 text-gray-300"
        >
          Voltar
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 bg-gradient-to-r from-green-600 to-cyan-600 hover:from-green-700 hover:to-cyan-700"
        >
          {saving ? "Salvando..." : <><Check className="w-4 h-4 mr-2" />Salvar Alterações</>}
        </Button>
      </div>

      {/* Delete Account Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-gray-900 border-red-500/50 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400">Apagar Conta</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Esta ação é <strong>irreversível</strong>. Todos os seus dados serão permanentemente apagados:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Perfil e informações pessoais</li>
                <li>Posts, fotos e vídeos</li>
                <li>Histórico de eventos</li>
                <li>Mensagens e conversas</li>
                <li>Conquistas e pontos</li>
              </ul>
              <p className="mt-2">Tem certeza que deseja continuar?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 border-gray-600">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-red-600 hover:bg-red-700"
            >
              Sim, Apagar Tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}