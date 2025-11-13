import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, MapPin, Heart, MessageCircle, UserPlus, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function NotificationSettings({ user }) {
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
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    // TODO: Salvar no backend
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
      description: 'Quando houver eventos perto de você',
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
    <Card className="bg-gray-900/80 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyan-400" />
          Preferências de Notificação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sound Toggle */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700"
        >
          <div className="flex items-center gap-3">
            {settings.sound_enabled ? (
              <Volume2 className="w-5 h-5 text-cyan-400" />
            ) : (
              <VolumeX className="w-5 h-5 text-gray-500" />
            )}
            <div>
              <Label className="text-white font-semibold">Som de Notificação</Label>
              <p className="text-xs text-gray-400">Tocar som ao receber notificações</p>
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
                whileHover={{ scale: 1.01 }}
                className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-gray-700/50 hover:border-gray-600"
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${item.color}`} />
                  <div>
                    <Label className="text-white text-sm">{item.label}</Label>
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

        <div className="pt-4 border-t border-gray-700">
          <p className="text-xs text-gray-500 text-center">
            💡 Dica: Permita notificações no navegador para receber alertas mesmo quando o app estiver fechado
          </p>
        </div>
      </CardContent>
    </Card>
  );
}