import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ExternalLink, Ticket, ShoppingCart, TrendingUp,
  CheckCircle, AlertCircle, Zap
} from "lucide-react";
import { motion } from "framer-motion";

export default function ExternalTicketPurchase({ event, user, externalTickets }) {
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const purchaseMutation = useMutation({
    mutationFn: async ({ ticket, qty }) => {
      // Registrar intenção de compra
      await base44.entities.TicketPurchaseIntent.create({
        user_id: user.id,
        event_id: event.id,
        ticket_type: ticket.ticket_type,
        quantity: qty,
        platform: ticket.platform,
        external_url: ticket.purchase_url,
        status: "redirected"
      });

      // Abrir URL externa
      window.open(ticket.purchase_url, '_blank');
      
      return ticket;
    },
    onSuccess: () => {
      alert("🎫 Redirecionando para a plataforma de ingressos...");
      queryClient.invalidateQueries(['ticketPurchaseIntents']);
    },
  });

  const handlePurchase = (ticket) => {
    if (!user) {
      alert("❌ Faça login para comprar ingressos");
      return;
    }

    if (ticket.status !== "available") {
      alert("❌ Ingresso indisponível");
      return;
    }

    purchaseMutation.mutate({ ticket, qty: quantity });
  };

  if (!externalTickets || externalTickets.length === 0) {
    return null;
  }

  // Agrupar por plataforma
  const ticketsByPlatform = externalTickets.reduce((acc, ticket) => {
    if (!acc[ticket.platform]) {
      acc[ticket.platform] = [];
    }
    acc[ticket.platform].push(ticket);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full flex items-center justify-center">
          <Ticket className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Ingressos Disponíveis</h3>
          <p className="text-sm text-gray-400">Compre via plataformas parceiras</p>
        </div>
      </div>

      {Object.entries(ticketsByPlatform).map(([platform, tickets]) => (
        <Card key={platform} className="bg-gray-900/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-400" />
              Ingressos via {platform.charAt(0).toUpperCase() + platform.slice(1)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {tickets.map((ticket) => (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-lg font-bold text-white mb-1">
                      {ticket.ticket_type}
                    </h4>
                    <p className="text-2xl font-bold text-cyan-400">
                      R$ {ticket.price.toFixed(2)}
                    </p>
                  </div>
                  
                  <Badge className={
                    ticket.status === "available" 
                      ? "bg-green-600" 
                      : ticket.status === "sold_out"
                      ? "bg-red-600"
                      : "bg-yellow-600"
                  }>
                    {ticket.status === "available" 
                      ? `${ticket.quantity_available} disponíveis` 
                      : ticket.status === "sold_out"
                      ? "Esgotado"
                      : "Pausado"}
                  </Badge>
                </div>

                {ticket.status === "available" && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-gray-900/50 rounded-lg px-3 py-2">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="text-white font-bold"
                      >
                        -
                      </button>
                      <span className="text-white font-semibold px-3">{quantity}</span>
                      <button
                        onClick={() => setQuantity(Math.min(ticket.quantity_available, quantity + 1))}
                        className="text-white font-bold"
                      >
                        +
                      </button>
                    </div>

                    <Button
                      onClick={() => handlePurchase(ticket)}
                      disabled={purchaseMutation.isPending}
                      className="flex-1 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Comprar Agora
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}

                {ticket.status === "sold_out" && (
                  <div className="flex items-center gap-2 text-sm text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    <span>Ingressos esgotados - {ticket.quantity_sold} vendidos</span>
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-gray-700">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {ticket.quantity_sold} / {ticket.quantity_total} vendidos
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {((ticket.quantity_sold / ticket.quantity_total) * 100).toFixed(0)}% vendido
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                    <div 
                      className="bg-gradient-to-r from-cyan-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(ticket.quantity_sold / ticket.quantity_total) * 100}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}

            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-cyan-300 mb-1">
                    Compra Segura
                  </p>
                  <p className="text-xs text-gray-300">
                    Você será redirecionado para {platform} para finalizar a compra com segurança. 
                    Após a confirmação, seu ingresso aparecerá automaticamente no seu perfil Sublinx.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}