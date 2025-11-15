import React from "react";
import { motion } from "framer-motion";
import { Gift, Ticket, Calendar, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function BirthdayBanner({ user, isBirthday, daysUntilBirthday }) {
  const navigate = useNavigate();

  if (!isBirthday && daysUntilBirthday > 7) return null;

  if (isBirthday) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 relative overflow-hidden rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, #FF6B9D 0%, #C471ED 50%, #12C2E9 100%)'
        }}
      >
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative p-6 text-center">
          <motion.div
            animate={{
              rotate: [0, -10, 10, -10, 0],
              scale: [1, 1.1, 1, 1.1, 1]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-block mb-3"
          >
            <Gift className="w-12 h-12 text-white" />
          </motion.div>

          <h2 className="text-2xl font-bold text-white mb-2">
            🎉 Feliz Aniversário! 🎂
          </h2>
          <p className="text-white/90 mb-4">
            Você ganhou um cupom especial de aniversário!
          </p>

          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 mb-4 border border-white/30">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Ticket className="w-5 h-5 text-white" />
              <span className="text-white font-bold text-lg">CUPOM: BDAY{new Date().getFullYear()}</span>
            </div>
            <p className="text-white/90 text-sm">30% de desconto em qualquer ingresso hoje!</p>
          </div>

          <Button
            onClick={() => navigate(createPageUrl("Feed"))}
            className="bg-white text-purple-600 hover:bg-white/90 font-bold"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Ver Eventos
          </Button>
        </div>
      </motion.div>
    );
  }

  // Banner de aniversário se aproximando
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-xl p-4"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-purple-600/20 flex items-center justify-center flex-shrink-0">
          <Calendar className="w-5 h-5 text-purple-400" />
        </div>
        <div className="flex-1">
          <p className="text-white font-semibold text-sm">Seu aniversário está chegando! 🎂</p>
          <p className="text-gray-400 text-xs">
            Faltam {daysUntilBirthday} dias para você ganhar um presente especial
          </p>
        </div>
      </div>
    </motion.div>
  );
}