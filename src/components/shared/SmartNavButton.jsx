import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";

const FALLBACKS = {
  profile: "Mapa",
  detail: "Feed",
  organizer: "MeusEventos",
  default: "Mapa",
};

export default function SmartNavButton({ context = "default", to, className = "" }) {
  const fallback = to || createPageUrl(FALLBACKS[context] || FALLBACKS.default);

  return (
    <motion.div
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.04 }}
      className={className}
    >
      <Link
        to={fallback}
        aria-label="Voltar"
        className="flex items-center gap-1.5 px-3 rounded-xl flex-shrink-0 font-bold text-sm"
        style={{
          minWidth: 44,
          minHeight: 44,
          height: 44,
          background: 'linear-gradient(135deg, rgba(6,182,212,0.25), rgba(168,85,247,0.25))',
          border: '2px solid rgba(6,182,212,0.8)',
          boxShadow: '0 0 16px rgba(6,182,212,0.5)',
          color: '#67e8f9',
          display: 'inline-flex',
          alignItems: 'center',
          textDecoration: 'none',
        }}
      >
        <ArrowLeft className="w-5 h-5" style={{ color: '#67e8f9' }} />
        <span style={{ color: '#67e8f9' }}>Voltar</span>
      </Link>
    </motion.div>
  );
}