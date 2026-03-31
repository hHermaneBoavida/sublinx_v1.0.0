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
      whileTap={{ scale: 0.88, opacity: 0.7 }}
      whileHover={{ scale: 1.08 }}
      aria-label="Voltar"
      className={`flex items-center justify-center w-11 h-11 rounded-xl bg-gray-800/80 border border-gray-600 hover:bg-gray-700 hover:border-gray-400 transition-colors flex-shrink-0 ${className}`}
      style={{ minWidth: 44, minHeight: 44 }}
    >
      <ArrowLeft className="w-5 h-5 text-white" />
    </motion.button>
  );
}