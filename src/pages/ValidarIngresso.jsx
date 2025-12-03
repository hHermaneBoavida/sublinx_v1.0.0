import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Loader2, CheckCircle, XCircle, AlertCircle,
  Scan, User, Clock, Ticket, MapPin
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ValidarIngresso() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [qrCodeInput, setQrCodeInput] = useState("");
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);

  const { data: user } = useQuery({
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
  });

  const checkInMutation = useMutation({
    mutationFn: async ({ ticketId }) => {
      return await base44.entities.Ticket.update(ticketId, {
        status: 'used',
        checked_in_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['validatedTickets']);
    }
  });

  const validateTicket = async () => {
    if (!qrCodeInput.trim()) {
      setValidationResult({
        status: 'error',
        message: 'Digite ou escaneie um código QR'
      });
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      // Buscar ingresso pelo QR code
      const tickets = await base44.entities.Ticket.filter({ qr_code_data: qrCodeInput });
      
      if (tickets.length === 0) {
        setValidationResult({
          status: 'invalid',
          message: 'Ingresso não encontrado',
          details: 'Este código não está registrado no sistema'
        });
        setIsValidating(false);
        return;
      }

      const ticket = tickets[0];

      // Buscar evento associado
      const events = await base44.entities.Event.filter({ id: ticket.event_id });
      const event = events[0];

      // Verificar status do ingresso
      if (ticket.status === 'cancelled') {
        setValidationResult({
          status: 'cancelled',
          message: 'Ingresso Cancelado',
          details: 'Este ingresso foi cancelado e não pode ser usado',
          ticket,
          event
        });
        setIsValidating(false);
        return;
      }

      if (ticket.status === 'used') {
        setValidationResult({
          status: 'used',
          message: 'Ingresso Já Utilizado',
          details: `Check-in realizado em: ${format(new Date(ticket.checked_in_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
          ticket,
          event
        });
        setIsValidating(false);
        return;
      }

      // Verificar se é organizador do evento
      if (user?.id !== event?.organizer_id) {
        setValidationResult({
          status: 'error',
          message: 'Acesso Negado',
          details: 'Você não tem permissão para validar ingressos deste evento'
        });
        setIsValidating(false);
        return;
      }

      // Ingresso válido
      setValidationResult({
        status: 'valid',
        message: 'Ingresso Válido! ✅',
        details: 'Este ingresso pode ser usado para check-in',
        ticket,
        event
      });

    } catch (error) {
      console.error('Erro ao validar ingresso:', error);
      setValidationResult({
        status: 'error',
        message: 'Erro na Validação',
        details: error.message || 'Ocorreu um erro ao validar o ingresso'
      });
    }

    setIsValidating(false);
  };

  const handleCheckIn = async () => {
    if (!validationResult?.ticket) return;

    try {
      await checkInMutation.mutateAsync({ ticketId: validationResult.ticket.id });
      
      setValidationResult({
        ...validationResult,
        status: 'checked_in',
        message: 'Check-in Realizado! 🎉',
        details: 'Participante confirmado no evento'
      });

      // Limpar após 3 segundos
      setTimeout(() => {
        setQrCodeInput("");
        setValidationResult(null);
      }, 3000);
    } catch (error) {
      alert('Erro ao realizar check-in: ' + error.message);
    }
  };

  useEffect(() => {
    if (!user?.is_organizer) {
      navigate(createPageUrl("Feed"));
    }
  }, [user, navigate]);

  if (!user) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-16 h-16 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-24 md:pb-8">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-gray-900/80 border-gray-700 mb-6">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text flex items-center gap-3">
                <Scan className="w-8 h-8 text-cyan-400" />
                Validar Ingresso
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-300">Código QR do Ingresso</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Cole ou digite o código QR..."
                    value={qrCodeInput}
                    onChange={(e) => setQrCodeInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && validateTicket()}
                    className="flex-1 bg-gray-800 border-gray-700 text-white font-mono"
                    autoFocus
                  />
                  <Button
                    onClick={validateTicket}
                    disabled={isValidating}
                    className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700"
                  >
                    {isValidating ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Scan className="w-5 h-5 mr-2" />
                        Validar
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <p className="text-xs text-gray-400 mb-2">💡 Dica:</p>
                <ul className="text-xs text-gray-300 space-y-1">
                  <li>• Solicite que o participante mostre o código QR do ingresso</li>
                  <li>• Cole ou digite o código no campo acima</li>
                  <li>• Clique em "Validar" para verificar a autenticidade</li>
                  <li>• Realize o check-in se o ingresso for válido</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Resultado da Validação */}
          <AnimatePresence>
            {validationResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Card className={`
                  ${validationResult.status === 'valid' ? 'bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/50' : ''}
                  ${validationResult.status === 'checked_in' ? 'bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-500/50' : ''}
                  ${validationResult.status === 'invalid' ? 'bg-gradient-to-br from-red-900/30 to-rose-900/30 border-red-500/50' : ''}
                  ${validationResult.status === 'used' ? 'bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border-yellow-500/50' : ''}
                  ${validationResult.status === 'cancelled' ? 'bg-gradient-to-br from-gray-900/30 to-slate-900/30 border-gray-500/50' : ''}
                  ${validationResult.status === 'error' ? 'bg-gradient-to-br from-red-900/30 to-rose-900/30 border-red-500/50' : ''}
                `}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      {validationResult.status === 'valid' && <CheckCircle className="w-12 h-12 text-green-400" />}
                      {validationResult.status === 'checked_in' && <CheckCircle className="w-12 h-12 text-blue-400" />}
                      {validationResult.status === 'invalid' && <XCircle className="w-12 h-12 text-red-400" />}
                      {validationResult.status === 'used' && <AlertCircle className="w-12 h-12 text-yellow-400" />}
                      {validationResult.status === 'cancelled' && <XCircle className="w-12 h-12 text-gray-400" />}
                      {validationResult.status === 'error' && <AlertCircle className="w-12 h-12 text-red-400" />}
                      
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-white mb-1">
                          {validationResult.message}
                        </h3>
                        <p className="text-sm text-gray-300">
                          {validationResult.details}
                        </p>
                      </div>
                    </div>

                    {validationResult.ticket && validationResult.event && (
                      <div className="bg-gray-800/50 rounded-lg p-4 space-y-3 mb-4">
                        <div className="flex items-center gap-2">
                          <Ticket className="w-5 h-5 text-cyan-400" />
                          <div>
                            <p className="text-xs text-gray-400">Tipo de Ingresso</p>
                            <p className="font-semibold text-white">{validationResult.ticket.ticket_type}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <User className="w-5 h-5 text-purple-400" />
                          <div>
                            <p className="text-xs text-gray-400">Participante</p>
                            <p className="font-semibold text-white">
                              {validationResult.ticket.attendee_info?.full_name || 'Nome não informado'}
                            </p>
                            {validationResult.ticket.attendee_info?.email && (
                              <p className="text-xs text-gray-400">{validationResult.ticket.attendee_info.email}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-green-400" />
                          <div>
                            <p className="text-xs text-gray-400">Evento</p>
                            <p className="font-semibold text-white">{validationResult.event.title}</p>
                            <p className="text-xs text-gray-400">
                              {format(new Date(validationResult.event.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className="w-5 h-5 text-yellow-400" />
                          <div>
                            <p className="text-xs text-gray-400">Comprado em</p>
                            <p className="font-semibold text-white">
                              {format(new Date(validationResult.ticket.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-gray-700">
                          <Badge className={
                            validationResult.ticket.status === 'valid' ? 'bg-green-600' :
                            validationResult.ticket.status === 'used' ? 'bg-yellow-600' :
                            validationResult.ticket.status === 'cancelled' ? 'bg-red-600' : 'bg-gray-600'
                          }>
                            Status: {
                              validationResult.ticket.status === 'valid' ? 'Válido' :
                              validationResult.ticket.status === 'used' ? 'Usado' :
                              validationResult.ticket.status === 'cancelled' ? 'Cancelado' : 'Desconhecido'
                            }
                          </Badge>
                        </div>
                      </div>
                    )}

                    {validationResult.status === 'valid' && (
                      <Button
                        onClick={handleCheckIn}
                        disabled={checkInMutation.isPending}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold text-lg h-12"
                      >
                        {checkInMutation.isPending ? (
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        ) : (
                          <CheckCircle className="w-5 h-5 mr-2" />
                        )}
                        Confirmar Check-in
                      </Button>
                    )}

                    {validationResult.status === 'checked_in' && (
                      <div className="text-center">
                        <p className="text-green-400 font-semibold">✅ Check-in confirmado com sucesso!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}