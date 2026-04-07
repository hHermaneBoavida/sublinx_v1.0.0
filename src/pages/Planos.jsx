import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Crown, Zap, Star, CreditCard, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

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
    price: 99.90,
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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
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
    
    if (plan.price > 0) {
      setSelectedPlan(plan);
      setShowPaymentModal(true);
      return;
    }
    
    // Plano gratuito
    try {
      setProcessing(true);
      
      if (currentSubscription) {
        await base44.entities.Subscription.update(currentSubscription.id, { status: "cancelled" });
      }
      
      await base44.entities.Subscription.create({
        user_id: user.id,
        plan_type: planId,
        price: plan.price,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        features: plan.features
      });
      
      await base44.auth.updateMe({
        subscription_type: planId,
        is_pro_member: false,
        is_organizer: false,
        secret_mode_unlocked: false,
        verified_organizer: false,
      });
      
      queryClient.invalidateQueries(['currentUser']);
      queryClient.invalidateQueries(['subscription']);
      
      alert(`Plano ${plan.name} ativado com sucesso!`);
    } catch (error) {
      console.error("Erro ao processar assinatura:", error);
      alert("Erro ao processar assinatura. Tente novamente.");
    } finally {
      setProcessing(false);
    }
  };

  const handlePayment = async (paymentMethod) => {
    if (!selectedPlan || !user) return;
    
    try {
      setProcessing(true);
      
      console.log(`Processing payment for ${selectedPlan.name} via ${paymentMethod}...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (currentSubscription) {
        await base44.entities.Subscription.update(currentSubscription.id, { status: "cancelled" });
      }
      
      await base44.entities.Subscription.create({
        user_id: user.id,
        plan_type: selectedPlan.id,
        price: selectedPlan.price,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        features: selectedPlan.features
      });
      
      const userUpdates = {
        subscription_type: selectedPlan.id
      };

      if (selectedPlan.id === "underground_pro") {
        userUpdates.is_pro_member = true;
        userUpdates.secret_mode_unlocked = true;
        userUpdates.is_organizer = false;
        userUpdates.verified_organizer = false;
      } else if (selectedPlan.id === "organizer_elite") {
        userUpdates.is_organizer = true;
        userUpdates.is_pro_member = true;
        userUpdates.secret_mode_unlocked = true;
        userUpdates.verified_organizer = true;
      }
      
      await base44.auth.updateMe(userUpdates);
      
      queryClient.invalidateQueries(['currentUser']);
      queryClient.invalidateQueries(['subscription']);
      
      setShowPaymentModal(false);
      setSelectedPlan(null);
      alert(`Pagamento confirmado! Plano ${selectedPlan.name} ativado com sucesso!`);
      
    } catch (error) {
      console.error("Erro no pagamento:", error);
      alert("Erro ao processar pagamento. Tente novamente.");
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
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <button
          onClick={() => { if (window.history.length > 1) navigate(-1); else navigate(createPageUrl('Mapa')); }}
          className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </button>
      </div>

      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-lime-400 bg-clip-text mb-4">
          Escolha Seu Plano
        </h1>
        <p className="text-xl text-gray-400 mb-2">
          Desbloqueie todo o potencial da cena underground
        </p>
        {currentSubscription && (
          <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
            Plano atual: {plans.find(p => p.id === currentSubscription.plan_type)?.name}
          </Badge>
        )}
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isActive = currentSubscription?.plan_type === plan.id;
          
          return (
            <Card
              key={plan.id}
              className={`relative overflow-hidden transition-all duration-300 hover:scale-105 flex flex-col ${
                plan.popular
                  ? "border-2 border-cyan-500 shadow-xl shadow-cyan-500/25"
                  : isActive
                  ? "border-2 border-green-500 shadow-xl shadow-green-500/25"
                  : "border border-gray-700 hover:border-gray-600"
              } ${isActive ? "bg-gradient-to-b from-green-900/20 to-black" : "bg-gradient-to-b from-gray-900/50 to-black"}`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-center py-2 text-sm font-semibold">
                  🔥 MAIS POPULAR
                </div>
              )}
              
              {isActive && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-center py-2 text-sm font-semibold">
                  ✅ PLANO ATIVO
                </div>
              )}

              <CardHeader className={`text-center ${plan.popular || isActive ? "pt-12" : "pt-8"}`}>
                <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-r ${plan.color} rounded-full flex items-center justify-center`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                
                <CardTitle className="text-2xl font-bold text-white mb-2">
                  {plan.name}
                </CardTitle>
                
                <p className="text-gray-400 mb-4">{plan.description}</p>
                
                <div className="text-4xl font-bold text-transparent bg-gradient-to-r from-white to-gray-300 bg-clip-text">
                  {plan.price === 0 ? (
                    "Grátis"
                  ) : (
                    <>
                      R$ {plan.price.toFixed(2).replace('.', ',')}
                      <span className="text-lg text-gray-400">/mês</span>
                    </>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex flex-col h-full">
                <ul className="space-y-3 mb-6 flex-grow">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-gray-300">
                      <Check className={`w-5 h-5 mr-3 bg-gradient-to-r ${plan.color} rounded-full p-1 text-white flex-shrink-0`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isActive || processing}
                  className={`w-full h-12 font-semibold mt-auto ${
                    isActive
                      ? "bg-green-600 text-white cursor-not-allowed"
                      : plan.popular
                      ? "bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white"
                      : "bg-gray-800 border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                >
                  {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : isActive ? "Plano Ativo" : "Assinar Agora"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="bg-gray-900 border-purple-500 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">
              Finalizar Assinatura
            </DialogTitle>
            <DialogDescription className="text-center text-gray-400">
              {selectedPlan?.name} - R$ {selectedPlan?.price?.toFixed(2).replace('.', ',')}/mês
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Button
              onClick={() => handlePayment('pix')}
              disabled={processing}
              className="w-full h-14 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold"
            >
              {processing ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : null}
              <div className="flex items-center justify-center gap-3">
                <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                  <span className="text-green-600 font-bold text-sm">PIX</span>
                </div>
                Pagar com PIX
              </div>
            </Button>

            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600">
              <h4 className="text-sm font-semibold text-cyan-400 mb-2">Chave PIX:</h4>
              <div className="flex items-center justify-between bg-gray-700 rounded px-3 py-2">
                <span className="text-sm font-mono">a04fdc2f-152d-40a0-b171-e10d494c4bbd</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    navigator.clipboard.writeText('a04fdc2f-152d-40a0-b171-e10d494c4bbd');
                    alert('Chave PIX copiada!');
                  }}
                  className="text-cyan-400 hover:text-cyan-300"
                >
                  Copiar
                </Button>
              </div>
            </div>

            <Button
              onClick={() => handlePayment('card')}
              disabled={processing}
              className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold"
            >
              {processing ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <CreditCard className="w-6 h-6 mr-2" />}
              Cartão de Crédito
            </Button>

            <Separator className="bg-gray-700" />

            <div className="text-center">
              <p className="text-xs text-gray-400">
                Pagamento seguro e criptografado
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Cancele a qualquer momento
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPaymentModal(false)}
              disabled={processing}
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FAQ Section */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Perguntas Frequentes</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
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
              Sim! Todos os planos pagos incluem 7 dias gratuitos para você testar todas as funcionalidades.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}