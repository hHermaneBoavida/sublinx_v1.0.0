import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CreditCard, Loader2 } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Separator } from '@/components/ui/separator';

export default function ComprarIngresso() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [processing, setProcessing] = useState(false);
  const [selectedTicketType, setSelectedTicketType] = useState(null);
  
  const searchParams = new URLSearchParams(location.search);
  const eventId = searchParams.get('eventId');
  const requestId = searchParams.get('requestId');

  // CORREÇÃO: Usar base44.auth.me() e base44.entities
  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch (error) {
        navigate(createPageUrl("BemVindo"));
        throw error;
      }
    },
    retry: false,
    staleTime: Infinity,
  });

  const { data: event, isLoading: loadingEvent } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      if (!eventId) return null;
      const events = await base44.entities.Event.filter({ id: eventId });
      if (events.length === 0) {
        throw new Error("Evento não encontrado");
      }
      return events[0];
    },
    enabled: !!eventId,
  });

  useEffect(() => {
    if (!eventId || !requestId) {
      navigate(createPageUrl("Mapa"));
      return;
    }
  }, [eventId, requestId, navigate]);

  useEffect(() => {
    if (event && event.ticket_types && event.ticket_types.length > 0) {
      setSelectedTicketType(event.ticket_types[0]);
    }
  }, [event]);

  const handlePurchase = async (paymentMethod) => {
    if (!selectedTicketType || !user || !event) {
      alert("Erro: informações incompletas para a compra.");
      return;
    }
    
    setProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const qrCodeData = `sublinx-ticket:${Date.now()}:${user.id}:${event.id}`;

      await base44.entities.Ticket.create({
        user_id: user.id,
        event_id: event.id,
        event_request_id: requestId,
        ticket_type: selectedTicketType.name,
        price: selectedTicketType.price,
        qr_code_data: qrCodeData,
        status: 'valid'
      });
      
      alert(`Pagamento com ${paymentMethod} confirmado! Seu ingresso para ${event.title} foi gerado.`);
      navigate(createPageUrl("Perfil"));

    } catch (error) {
      console.error("Erro na compra:", error);
      alert("Ocorreu um erro ao processar sua compra. Tente novamente.");
    } finally {
      setProcessing(false);
    }
  };

  if (loadingUser || loadingEvent) {
    return (
      <div className="w-full h-[calc(100vh-80px)] flex items-center justify-center">
        <Loader2 className="w-16 h-16 animate-spin text-cyan-500" />
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-white">
      <Card className="bg-gray-900/80 border-gray-700">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text">
            Comprar Ingresso
          </CardTitle>
          <CardDescription className="text-gray-400">
            Você está comprando um ingresso para: <span className="font-semibold text-white">{event.title}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-8">
          {/* Seletor de Ingressos */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">1. Escolha o tipo de ingresso</h3>
            <RadioGroup 
              value={selectedTicketType?.name} 
              onValueChange={(value) => {
                const foundType = event.ticket_types.find(t => t.name === value);
                setSelectedTicketType(foundType);
              }}
            >
              {(event.ticket_types || []).map((type) => (
                <Label key={type.name} htmlFor={type.name} className="flex items-center p-4 rounded-lg border border-gray-600 bg-gray-800/50 has-[:checked]:border-cyan-500 has-[:checked]:bg-cyan-900/30 transition-all cursor-pointer">
                  <RadioGroupItem value={type.name} id={type.name} />
                  <div className="ml-4 flex-1">
                    <span className="font-medium text-white">{type.name}</span>
                  </div>
                  <span className="font-semibold text-lime-400">R$ {type.price.toFixed(2)}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>

          {/* Opções de Pagamento */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">2. Efetue o pagamento</h3>
            <p className="text-sm text-gray-400">
              Após confirmar o pagamento, seu ingresso com QR Code será gerado e ficará disponível no seu perfil.
            </p>
            
            <Separator className="bg-gray-700" />
            
            <div className="text-center text-white">
              <p className="text-lg">Total a pagar:</p>
              <p className="text-4xl font-bold text-lime-400">
                R$ {selectedTicketType?.price.toFixed(2) || '0.00'}
              </p>
            </div>
            
            <div className="space-y-3">
              <Button
                onClick={() => handlePurchase('PIX')}
                disabled={processing}
                className="w-full h-14 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold"
              >
                {processing ? <Loader2 className="animate-spin mr-2"/> : null}
                Pagar com PIX
              </Button>
              
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600">
                <h4 className="text-sm font-semibold text-cyan-400 mb-2">Chave PIX (Celular):</h4>
                <div className="flex items-center justify-between bg-gray-700 rounded px-3 py-2">
                  <span className="text-sm font-mono">020.091.326-37</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText('020.091.326-37');
                      alert('Chave PIX copiada!');
                    }}
                    className="text-cyan-400 hover:text-cyan-300"
                  >
                    Copiar
                  </Button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  HERMANE DA GRACA CHANGO DE BOAVIDA
                </p>
              </div>

              <Button
                onClick={() => handlePurchase('Cartão')}
                disabled={processing}
                className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold"
              >
                {processing ? <Loader2 className="animate-spin mr-2"/> : <CreditCard className="w-6 h-6 mr-2" />}
                Pagar com Cartão de Crédito
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}