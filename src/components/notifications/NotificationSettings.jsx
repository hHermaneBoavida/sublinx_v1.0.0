import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function NotificationSettings({ user, onClose, onUpdate }) {
  // A lógica completa de salvar as configurações está em `AccountSettings`
  // Este é um componente de visualização que redireciona para lá.

  return (
    <Card className="mb-6 bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Configurar Notificações</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-400 mb-4">
          As configurações detalhadas de notificações estão na aba "Config" do seu perfil.
        </p>
        <div className="flex gap-2">
          <Button onClick={onClose} variant="outline">
            Fechar
          </Button>
          {/* Implementar navegação para o perfil/configurações */}
          <Button className="bg-cyan-600 hover:bg-cyan-700">
            Ir para Configurações
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}