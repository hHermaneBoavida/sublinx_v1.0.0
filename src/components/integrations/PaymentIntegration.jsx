import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CreditCard, Smartphone } from "lucide-react";
import { motion } from "framer-motion";

export default function PaymentIntegration({ amount, onPaymentSuccess, ticketData }) {
  const [processing, setProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);

  const handlePixPayment = async () => {
    setProcessing(true);
    setSelectedMethod('pix');
    
    // Simula processamento PIX
    setTimeout(() => {
      setProcessing(false);
      onPaymentSuccess({ method: 'pix', ...ticketData });
    }, 2000);
  };

  const handleCardPayment = async () => {
    setProcessing(true);
    setSelectedMethod('card');
    
    // Simula processamento cartão
    setTimeout(() => {
      setProcessing(false);
      onPaymentSuccess({ method: 'card', ...ticketData });
    }, 2000);
  };

  const handlePayPal = () => {
    alert('💳 Integração PayPal em desenvolvimento. Use PIX ou Cartão.');
  };

  const handleStripe = () => {
    alert('💳 Integração Stripe em desenvolvimento. Use PIX ou Cartão.');
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-2">Valor Total</h3>
        <p className="text-3xl font-bold text-cyan-400">R$ {amount.toFixed(2)}</p>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-400 uppercase">Métodos de Pagamento</h3>

        {/* PIX */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card
            onClick={handlePixPayment}
            className={`p-4 cursor-pointer transition-all ${
              selectedMethod === 'pix' && processing
                ? 'bg-green-600/20 border-green-500'
                : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-600/20 flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-green-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white">PIX</p>
                <p className="text-xs text-gray-400">Aprovação instantânea</p>
              </div>
              {selectedMethod === 'pix' && processing && (
                <div className="w-5 h-5 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          </Card>
        </motion.div>

        {/* Cartão */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card
            onClick={handleCardPayment}
            className={`p-4 cursor-pointer transition-all ${
              selectedMethod === 'card' && processing
                ? 'bg-blue-600/20 border-blue-500'
                : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white">Cartão de Crédito</p>
                <p className="text-xs text-gray-400">Parcele em até 3x sem juros</p>
              </div>
              {selectedMethod === 'card' && processing && (
                <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          </Card>
        </motion.div>

        {/* PayPal - Em breve */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card
            onClick={handlePayPal}
            className="p-4 cursor-pointer bg-gray-800/30 border-gray-700/50 opacity-60"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.76-4.852.072-.455.462-.788.922-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.744-4.46z"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white">PayPal</p>
                <p className="text-xs text-gray-500">Em breve</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Stripe - Em breve */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card
            onClick={handleStripe}
            className="p-4 cursor-pointer bg-gray-800/30 border-gray-700/50 opacity-60"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white">Stripe</p>
                <p className="text-xs text-gray-500">Em breve</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      <p className="text-xs text-gray-500 text-center mt-4">
        🔒 Pagamento 100% seguro e criptografado
      </p>
    </div>
  );
}