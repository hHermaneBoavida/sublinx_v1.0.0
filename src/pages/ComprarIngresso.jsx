import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  CreditCard, Loader2, CheckCircle, AlertCircle, 
  QrCode, Ticket, Clock, DollarSign, Users, Copy
} from 'lucide-react';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ComprarIngresso() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [processing, setProcessing] = useState(false);
  const [selectedTicketType, setSelectedTicketType] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [generatedTicket, setGeneratedTicket] = useState(null);
  
  const searchParams = new URLSearchParams(location.search);
  const eventId = searchParams.get('eventId');

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
      if (events.length === 0) throw new Error("Evento não encontrado");
      return events[0];
    },
    enabled: !!eventId,
  });

  const purchaseTicketMutation = useMutation({
    mutationFn: async ({ ticketData }) => {
      return await base44.entities.Ticket.create(ticketData);
    },
    onSuccess: (ticket) => {
      queryClient.invalidateQueries(['event', eventId]);
      queryClient.invalidateQueries(['userTickets']);
      setGeneratedTicket(ticket);
      setPurchaseSuccess(true);
      
      // Update event attendees count
      if (event) {
        base44.entities.Event.update(eventId, {
          current_attendees: (event.current_attendees || 0) + quantity
        });
      }
    }
  });

  useEffect(() => {
    if (!eventId) {
      navigate(createPageUrl("Mapa"));
      return;
    }
  }, [eventId, navigate]);

  useEffect(() => {
    if (event && event.ticket_types && event.ticket_types.length > 0) {
      const availableTickets = event.ticket_types.filter(tt => 
        tt.is_active && 
        (tt.quantity_available === 0 || (tt.quantity_sold || 0) < tt.quantity_available)
      );
      if (availableTickets.length > 0) {
        setSelectedTicketType(availableTickets[0]);
      }
    }
  }, [event]);

  const handlePurchase = async (paymentMethod) => {
    if (!selectedTicketType || !user || !event) {
      alert("Erro: informações incompletas para a compra.");
      return;
    }

    if (quantity < 1) {
      alert("Quantidade inválida");
      return;
    }

    // Verificar disponibilidade
    if (selectedTicketType.quantity_available > 0) {
      const soldCount = selectedTicketType.quantity_sold || 0;
      if (soldCount + quantity > selectedTicketType.quantity_available) {
        alert(`Apenas ${selectedTicketType.quantity_available - soldCount} ingresso(s) disponível(is)`);
        return;
      }
    }
    
    setProcessing(true);
    
    try {
      // Simular processamento de pagamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const qrCodeData = `SUBLINX:${Date.now()}:${user.id}:${event.id}:${selectedTicketType.id}`;

      await purchaseTicketMutation.mutateAsync({
        ticketData: {
          user_id: user.id,
          event_id: event.id,
          ticket_type: selectedTicketType.name,
          price: selectedTicketType.price * quantity,
          quantity: quantity,
          qr_code_data: qrCodeData,
          status: 'valid',
          payment_method: paymentMethod.toLowerCase().replace(/\s/g, '_'),
          payment_status: 'confirmed',
          transaction_id: `TXN-${Date.now()}`,
          attendee_info: {
            full_name: user.full_name,
            email: user.email
          }
        }
      });

    } catch (error) {
      console.error("Erro na compra:", error);
      alert("Ocorreu um erro ao processar sua compra. Tente novamente.");
    } finally {
      setProcessing(false);
    }
  };

  const totalAmount = selectedTicketType ? selectedTicketType.price * quantity : 0;

  if (loadingUser || loadingEvent) {
    return (
      <div className="w-full h-[calc(100vh-80px)] flex items-center justify-center bg-black">
        <Loader2 className="w-16 h-16 animate-spin text-cyan-500" />
      </div>
    );
  }

  if (!event) return null;

  if (purchaseSuccess && generatedTicket) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full"
        >
          <Card className="bg-gray-900 border-green-500/50">
            <CardHeader className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-600/20 flex items-center justify-center"
              >
                <CheckCircle className="w-10 h-10 text-green-400" />
              </motion.div>
              <CardTitle className="text-2xl text-white">Compra Confirmada!</CardTitle>
              <CardDescription className="text-gray-400">
                Seu ingresso foi gerado com sucesso
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-800/50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Evento:</span>
                  <span className="text-white font-semibold">{event.title}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Tipo:</span>
                  <span className="text-white">{generatedTicket.ticket_type}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Quantidade:</span>
                  <span className="text-white">{generatedTicket.quantity}x</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total Pago:</span>
                  <span className="text-green-400 font-bold">R$ {generatedTicket.price.toFixed(2)}</span>
                </div>
                <Separator className="bg-gray-700" />
                <div className="text-center">
                  <QrCode className="w-16 h-16 text-cyan-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">
                    QR Code disponível no seu perfil
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => navigate(createPageUrl("Perfil"))}
                  className="flex-1 bg-gradient-to-r from-cyan-600 to-purple-600"
                >
                  <Ticket className="w-4 h-4 mr-2" />
                  Ver Ingresso
                </Button>
                <Button
                  onClick={() => navigate(createPageUrl("Feed"))}
                  variant="outline"
                  className="flex-1 border-gray-600"
                >
                  Voltar ao Feed
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const availableTicketTypes = (event.ticket_types || []).filter(tt => 
    tt.is_active && 
    (tt.quantity_available === 0 || (tt.quantity_sold || 0) < tt.quantity_available)
  );

  if (availableTicketTypes.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="bg-gray-900 border-red-500/30 max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Esgotado</h2>
            <p className="text-gray-400 mb-4">Todos os ingressos para este evento estão esgotados</p>
            <Button onClick={() => navigate(createPageUrl("Feed"))}>
              Voltar ao Feed
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-gray-900/80 border-gray-700">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text">
                Comprar Ingresso
              </CardTitle>
              <CardDescription className="text-gray-400">
                <span className="font-semibold text-white">{event.title}</span>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {format(new Date(event.date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {event.current_attendees || 0}/{event.max_capacity || 0}
                  </span>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-8">
              {/* Ticket Selection */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white">1. Escolha o ingresso</h3>
                <RadioGroup 
                  value={selectedTicketType?.id} 
                  onValueChange={(value) => {
                    const foundType = event.ticket_types.find(t => t.id === value);
                    setSelectedTicketType(foundType);
                  }}
                >
                  {availableTicketTypes.map((type) => {
                    const soldCount = type.quantity_sold || 0;
                    const available = type.quantity_available > 0 
                      ? type.quantity_available - soldCount 
                      : '∞';

                    return (
                      <Label 
                        key={type.id} 
                        htmlFor={type.id}
                        className="flex items-start p-4 rounded-lg border border-gray-600 bg-gray-800/50 has-[:checked]:border-cyan-500 has-[:checked]:bg-cyan-900/30 transition-all cursor-pointer"
                      >
                        <RadioGroupItem value={type.id} id={type.id} className="mt-1" />
                        <div className="ml-4 flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-white">{type.name}</span>
                            <span className="font-semibold text-green-400">R$ {type.price.toFixed(2)}</span>
                          </div>
                          {type.description && (
                            <p className="text-sm text-gray-400 mb-2">{type.description}</p>
                          )}
                          <div className="flex items-center gap-2 text-xs">
                            <Badge variant="outline" className="border-gray-600 text-gray-300">
                              {available} disponível{available !== 1 && available !== '∞' ? 'is' : ''}
                            </Badge>
                            {type.benefits && type.benefits.length > 0 && (
                              <Badge className="bg-purple-600/20 border-purple-500/30 text-purple-300">
                                {type.benefits.length} benefício{type.benefits.length > 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </Label>
                    );
                  })}
                </RadioGroup>

                {/* Quantity Selector */}
                <div>
                  <Label className="text-white mb-2 block">Quantidade</Label>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="border-gray-600"
                    >
                      -
                    </Button>
                    <Input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 text-center bg-gray-800 border-gray-700 text-white"
                      min="1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(quantity + 1)}
                      className="border-gray-600"
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>

              {/* Payment */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white">2. Pagamento</h3>
                <p className="text-sm text-gray-400">
                  Após confirmar o pagamento, seu(s) ingresso(s) com QR Code será(ão) gerado(s).
                </p>
                
                <Separator className="bg-gray-700" />
                
                <div className="text-center bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-700/30 rounded-xl p-4">
                  <p className="text-sm text-gray-300 mb-1">Total a pagar:</p>
                  <div className="flex items-center justify-center gap-2">
                    <DollarSign className="w-6 h-6 text-green-400" />
                    <p className="text-4xl font-bold text-green-400">
                      {totalAmount.toFixed(2)}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {quantity}x {selectedTicketType?.name} • R$ {selectedTicketType?.price.toFixed(2)} cada
                  </p>
                </div>
                
                <div className="space-y-3">
                  <Button
                    onClick={() => handlePurchase('PIX')}
                    disabled={processing || !selectedTicketType}
                    className="w-full h-14 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold"
                  >
                    {processing ? <Loader2 className="animate-spin mr-2"/> : null}
                    Pagar com PIX
                  </Button>
                  
                  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600">
                    <h4 className="text-sm font-semibold text-cyan-400 mb-2 flex items-center gap-2">
                      <QrCode className="w-4 h-4" />
                      Chave PIX (Celular):
                    </h4>
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
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      HERMANE DA GRACA CHANGO DE BOAVIDA
                    </p>
                  </div>

                  <Button
                    onClick={() => handlePurchase('Cartão')}
                    disabled={processing || !selectedTicketType}
                    className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold"
                  >
                    {processing ? (
                      <Loader2 className="animate-spin mr-2"/>
                    ) : (
                      <CreditCard className="w-6 h-6 mr-2" />
                    )}
                    Pagar com Cartão
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}