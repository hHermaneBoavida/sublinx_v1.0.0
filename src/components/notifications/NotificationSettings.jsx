import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Settings, Bell, MapPin, Heart, MessageCircle, UserPlus, Zap, Volume2, VolumeX } from "lucide-react";
import { motion } from "framer-motion";

export default function NotificationSettings({ user }) {
  // CORRIGIDO: Safe defaults com optional chaining
  const [settings, setSettings] = useState({
    event_alerts: user?.notification_settings?.event_alerts ?? true,
    nearby_events: user?.notification_settings?.nearby_events ?? true,
    likes: user?.notification_settings?.likes ?? true,
    comments: user?.notification_settings?.comments ?? true,
    new_followers: user?.notification_settings?.new_followers ?? true,
    surprise_events: user?.notification_settings?.surprise_events ?? true,
    sound_enabled: user?.notification_settings?.sound_enabled ?? true,
  });

  const handleToggle = (key) => {
    setSettings(prev => {
      const newSettings = {
        ...prev,
        [key]: !prev[key]
      };
      
      console.log('⚙️ Settings atualizados:', newSettings);
      
      // TODO: Salvar no backend quando base44.auth.updateMe suportar notification_settings
      // await base44.auth.updateMe({ notification_settings: newSettings });
      
      // Por enquanto, salvar no localStorage
      try {
        localStorage.setItem('notification_settings', JSON.stringify(newSettings));
      } catch (error) {
        console.error('Erro ao salvar settings:', error);
      }
      
      return newSettings;
    });
  };

  const settingItems = [
    {
      key: 'event_alerts',
      icon: Bell,
      label: 'Alertas de Eventos',
      description: 'Novos eventos e atualizações',
      color: 'text-cyan-400'
    },
    {
      key: 'nearby_events',
      icon: MapPin,
      label: 'Eventos Próximos',
      description: 'Quando houver eventos perto de você (5km)',
      color: 'text-purple-400'
    },
    {
      key: 'likes',
      icon: Heart,
      label: 'Curtidas',
      description: 'Quando curtirem seus eventos',
      color: 'text-pink-400'
    },
    {
      key: 'comments',
      icon: MessageCircle,
      label: 'Comentários',
      description: 'Novos comentários nos seus eventos',
      color: 'text-blue-400'
    },
    {
      key: 'new_followers',
      icon: UserPlus,
      label: 'Novos Seguidores',
      description: 'Quando alguém te seguir',
      color: 'text-green-400'
    },
    {
      key: 'surprise_events',
      icon: Zap,
      label: 'Eventos Surpresa',
      description: 'Eventos secretos e exclusivos',
      color: 'text-yellow-400'
    },
  ];

  return (
    <Card className="bg-gray-900/80 border-gray-700 overflow-hidden">
      {/* Header com Glow */}
      <CardHeader className="border-b border-gray-700 relative overflow-hidden">
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 20% 30%, rgba(6, 182, 212, 0.15) 0%, transparent 60%)'
          }}
          animate={{
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <CardTitle className="text-white flex items-center gap-2 relative z-10">
          <Settings className="w-5 h-5 text-cyan-400" />
          Preferências de Notificação
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4 pt-4">
        {/* Sound Toggle - Destacado */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border-2 border-cyan-500/30"
          style={{
            boxShadow: '0 0 20px rgba(6, 182, 212, 0.2)'
          }}
        >
          <div className="flex items-center gap-3">
            <motion.div
              animate={{
                scale: settings.sound_enabled ? [1, 1.2, 1] : 1
              }}
              transition={{ duration: 2, repeat: settings.sound_enabled ? Infinity : 0 }}
            >
              {settings.sound_enabled ? (
                <Volume2 className="w-5 h-5 text-cyan-400" />
              ) : (
                <VolumeX className="w-5 h-5 text-gray-500" />
              )}
            </motion.div>
            <div>
              <Label className="text-white font-semibold">Som de Notificação</Label>
              <p className="text-xs text-gray-400">Tocar som cyberpunk ao receber notificações</p>
            </div>
          </div>
          <Switch
            checked={settings.sound_enabled}
            onCheckedChange={() => handleToggle('sound_enabled')}
          />
        </motion.div>

        {/* Individual Settings */}
        <div className="space-y-2">
          {settingItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.01, x: 4 }}
                className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-gray-700/50 hover:border-gray-600 transition-all"
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${item.color}`} />
                  <div>
                    <Label className="text-white text-sm cursor-pointer">{item.label}</Label>
                    <p className="text-[10px] text-gray-400">{item.description}</p>
                  </div>
                </div>
                <Switch
                  checked={settings[item.key]}
                  onCheckedChange={() => handleToggle(item.key)}
                />
              </motion.div>
            );
          })}
        </div>

        {/* Info Footer */}
        <div className="pt-4 border-t border-gray-700">
          <div className="flex items-start gap-2">
            <Bell className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-400">
              💡 <strong className="text-yellow-400">Dica:</strong> Permita notificações no navegador para receber alertas mesmo quando o app estiver fechado
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}