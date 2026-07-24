import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, Ticket, CalendarCheck, Info, AlertCircle, Clock } from "lucide-react";
import { base44 } from "@/api/base44Client";

/**
 * SUBLINX — Event Action Buttons
 * 
 * Determina e exibe o botao de acao correto para cada evento:
 * 1. COMPRAR INGRESSOS (se houver purchase_url ou ticket_url)
 * 2. FAZER RESERVA (se houver reservation_url)
 * 3. VER DETALHES (se houver external_url ou source_url)
 * 4. VER EVENTO (se nao houver nenhuma URL)
 * 
 * Prioridade: purchase_url > ticket_url > reservation_url > external_url > source_event_url
 * 
 * Rastreia todos os cliques via backend function trackEventClick.
 * NUNCA gera URLs artificiais — apenas usa URLs oficiais da fonte.
 */
export default function EventActionButtons({ event, user }) {
  const [redirecting, setRedirecting] = useState(false);

  const getActionInfo = () => {
    const purchaseUrl = event.purchase_url || event.ticket_url;
    const reservationUrl = event.reservation_url;
    const externalUrl = event.external_url || event.source_event_url || event.source_url;

    // Status de ingressos
    if (event.ticket_status === 'sold_out') {
      return { label: 'Ingressos Esgotados', disabled: true, icon: AlertCircle, variant: 'sold_out' };
    }
    if (event.ticket_status === 'not_on_sale') {
      return { label: 'Ingressos Ainda Não Disponíveis', disabled: true, icon: Clock, variant: 'not_on_sale' };
    }

    // Prioridade: compra > reserva > detalhes
    if (purchaseUrl) {
      return { url: purchaseUrl, label: 'Comprar Ingressos', actionType: 'purchase', icon: Ticket };
    }
    if (reservationUrl) {
      return { url: reservationUrl, label: 'Fazer Reserva', actionType: 'reservation', icon: CalendarCheck };
    }
    if (externalUrl) {
      return { url: externalUrl, label: 'Ver Detalhes', actionType: 'details', icon: ExternalLink };
    }

    return null;
  };

  const handleAction = async (actionInfo) => {
    setRedirecting(true);
    
    // Rastrear clique (silencioso — nao bloqueia redirecionamento)
    try {
      await base44.functions.invoke('trackEventClick', {
        event_id: event.id,
        user_id: user?.id || null,
        action_type: actionInfo.actionType,
        provider: event.booking_provider || event.external_source || event.source || 'unknown',
        destination_url: actionInfo.url,
      });
    } catch {
      // Tracking falhou — nao bloquear redirecionamento
    }

    // Abrir URL oficial
    window.open(actionInfo.url, '_blank', 'noopener,noreferrer');
    setRedirecting(false);
  };

  const actionInfo = getActionInfo();

  // Sem URL disponivel
  if (!actionInfo) {
    return (
      <div className="space-y-2">
        <Button disabled className="w-full h-14 bg-gray-800 text-gray-400 font-bold text-base border border-gray-700">
          <Info className="w-5 h-5 mr-2" />
          Ver Evento
        </Button>
      </div>
    );
  }

  const Icon = actionInfo.icon;

  // Estados especiais (esgotado, nao a venda)
  if (actionInfo.disabled) {
    return (
      <Button disabled className="w-full h-14 bg-gray-800 text-gray-400 font-bold text-base border border-gray-700">
        <Icon className="w-5 h-5 mr-2" />
        {actionInfo.label}
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={() => handleAction(actionInfo)}
        disabled={redirecting}
        className="w-full h-14 bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 hover:from-cyan-700 hover:via-purple-700 hover:to-pink-700 text-white font-bold text-base shadow-xl"
      >
        <Icon className="w-5 h-5 mr-2" />
        {redirecting ? 'Redirecionando...' : actionInfo.label}
      </Button>
      <p className="text-xs text-gray-400 text-center">
        Você será redirecionado para o site oficial para concluir.
      </p>
    </div>
  );
}