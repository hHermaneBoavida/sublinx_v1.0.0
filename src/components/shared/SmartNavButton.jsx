import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";

const FALLBACKS = {
  profile: "Mapa",
  detail: "Feed",
  default: "Mapa",
};

export default function SmartNavButton({ context = "default", className = "" }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      const fallback = FALLBACKS[context] || FALLBACKS.default;
      navigate(createPageUrl(fallback));
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      whileTap={{ scale: 0.88 }}
      whileHover={{ scale: 1.05 }}
      aria-label="Voltar"
      className={`flex items-center justify-center rounded-xl flex-shrink-0 ${className}`}
      style={{
        minWidth: 44,
        minHeight: 44,
        width: 44,
        height: 44,
        background: 'linear-gradient(135deg, rgba(6,182,212,0.25), rgba(168,85,247,0.25))',
        border: '2px solid rgba(6,182,212,0.7)',
        boxShadow: '0 0 14px rgba(6,182,212,0.4)',
      }}
    >
      <ArrowLeft className="w-5 h-5" style={{ color: '#67e8f9' }} />
    </motion.button>
  );
}