import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Crown, Zap, Star, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const plans = [
  {
    id: "free",
    name: "Underground Free",
    price: 0,
    description: "Para quem está começando na cena",
    icon: Zap,
    color: "from-gray-500 to-gray-600",
    features: [
      "Acesso a eventos públicos",
      "3 eventos por mês",
      "Feed básico",
      "Perfil simples"
    ]
  },
  {
    id: "underground_pro",
    name: "Underground Pro",
    price: 29.90,
    description: "Para os verdadeiros underground",
    icon: Star,
    color: "from-cyan-500 to-purple-600",
    popular: true,
    features: [
      "Acesso a TODOS os eventos",
      "Eventos ilimitados",
      "Notificações personalizadas",
      "Prioridade em eventos secretos",
      "Chat com organizadores",
      "Perfil premium",
      "Sem anúncios"
    ]
  },
  {
    id: "organizer_elite",
    name: "Organizador Elite",
    price: 399.99,
    description: "Para criadores de experiências",
    icon: Crown,
    color: "from-yellow-500 to-orange-600",
    features: [
      "Criar eventos ilimitados",
      "Gestão de participantes",
      "Analytics avançados",
      "Promoção prioritária",
      "Chat premium com usuários",
      "Suporte dedicado",
      "Comissão reduzida",
      "Verificação de organizador"
    ]
  }
];

export default function Planos() {
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  const { data: currentSubscription } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const subscriptions = await base44.entities.Subscription.filter(
        { user_id: user.id, status: "active" }
      );
      return subscriptions.length > 0 ? subscriptions[0] : null;
    },
    enabled: !!user?.id,
  });

  const handleSubscribe = async (planId) => {
    const plan = plans.find(p => p.id === planId);

    try {
      setProcessing(true);
      const data = await base44.functions.invoke('manageSubscription', { plan_id: planId });

      queryClient.invalidateQueries(['currentUser']);
      queryClient.invalidateQueries(['subscription']);
    } catch (error) {
      console.error("Erro ao processar assinatura:", error);
    } finally {
      setProcessing(false);
    }
  };

  if (loadingUser) {
    return (
      <div className="w-full h-[calc(100vh-80px)] flex items-center justify-center">
        <Loader2 className="w-16 h-16 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-2 sm:px-3 py-2 sm:py-3 pb-28">
      {/* Back Button */}
      <div className="mb-2 sm:mb-3">
        <button
          onClick={() => { if (window.history.length > 1) navigate(-1); else navigate(createPageUrl('Mapa')); }}
          className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </button>
      </div>

      {/* Header */}
      <div className="text-center mb-3 sm:mb-4">
        <h1 className="text-lg sm:text-2xl font-bold text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-lime-400 bg-clip-text mb-0.5 sm:mb-1">
          Escolha Seu Plano
        </h1>
        <p className="text-[11px] sm:text-sm text-gray-400 mb-1">
          Desbloqueie todo o potencial da cena underground
        </p>
        {currentSubscription && (
          <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
            Plano atual: {plans.find(p => p.id === currentSubscription.plan_type)?.name}
          </Badge>
        )}
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-3 mb-3 sm:mb-5 items-stretch">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isActive = currentSubscription?.plan_type === plan.id;
          
          return (
            <Card
              key={plan.id}
              className={`relative overflow-hidden transition-all duration-300 hover:scale-[1.02] flex flex-col ${
                plan.popular
                  ? "border-2 border-cyan-500 shadow-xl shadow-cyan-500/25"
                  : isActive
                  ? "border-2 border-green-500 shadow-xl shadow-green-500/25"
                  : "border border-gray-700 hover:border-gray-600"
              } ${isActive ? "bg-gradient-to-b from-green-900/20 to-black" : "bg-gradient-to-b from-gray-900/50 to-black"}`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-center py-0.5 text-[8px] sm:text-xs font-semibold">
                  🔥 POPULAR
                </div>
              )}
              
              {isActive && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-center py-0.5 text-[8px] sm:text-xs font-semibold">
                  ✅ ATIVO
                </div>
              )}

              <CardHeader className={`text-center px-2 ${plan.popular || isActive ? "pt-5 sm:pt-7" : "pt-2 sm:pt-3"}`}>
                <div className={`w-7 h-7 sm:w-10 sm:h-10 mx-auto mb-1 sm:mb-2 bg-gradient-to-r ${plan.color} rounded-full flex items-center justify-center`}>
                  <Icon className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
                </div>
                
                <CardTitle className="text-xs sm:text-base font-bold text-white mb-0.5">
                  {plan.name}
                </CardTitle>
                
                <p className="hidden sm:block text-xs text-gray-400 mb-1.5 sm:mb-2">{plan.description}</p>
                
                <div className="text-sm sm:text-xl font-bold text-transparent bg-gradient-to-r from-white to-gray-300 bg-clip-text">
                  {plan.price === 0 ? (
                    "Grátis"
                  ) : (
                    <>
                      30 dias
                      <span className="text-xs sm:text-sm text-gray-400"> grátis</span>
                    </>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex flex-col flex-1 px-2 pb-2 pt-0">
                <ul className="space-y-0.5 sm:space-y-1.5 mb-2 sm:mb-3 flex-1">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start text-gray-300 text-[9px] sm:text-xs">
                      <Check className={`w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 mr-1 mt-0.5 bg-gradient-to-r ${plan.color} rounded-full p-0.5 text-white shrink-0`} />
                      <span className="flex-1 min-w-0 break-words leading-tight">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isActive || processing}
                  className={`w-full h-7 sm:h-9 font-semibold text-[9px] sm:text-xs px-1 mt-auto ${
                    isActive
                      ? "bg-green-600 text-white cursor-not-allowed"
                      : plan.popular
                      ? "bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white"
                      : "bg-gray-800 border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                >
                  {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : isActive ? "Plano Ativo" : plan.price === 0 ? "Ativar" : "Iniciar Trial"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* FAQ Section */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-3 sm:p-5">
        <h2 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">Perguntas Frequentes</h2>
        
        <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <h3 className="font-semibold text-cyan-400 mb-2">Posso cancelar a qualquer momento?</h3>
            <p className="text-gray-300 text-sm">
              Sim! Você pode cancelar sua assinatura a qualquer momento e continuar usando até o final do período pago.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-cyan-400 mb-2">O que são eventos secretos?</h3>
            <p className="text-gray-300 text-sm">
              Eventos exclusivos com localização limitada, acesso restrito e experiências únicas para membros premium.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-cyan-400 mb-2">Como funciona o plano Organizador?</h3>
            <p className="text-gray-300 text-sm">
              Permite criar e gerenciar seus próprios eventos, com ferramentas profissionais e analytics detalhados.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-cyan-400 mb-2">Há período de teste gratuito?</h3>
            <p className="text-gray-300 text-sm">
              Sim! Todos os planos pagos oferecem 30 dias gratuitos para você testar todas as funcionalidades. O plano gratuito é permanente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}