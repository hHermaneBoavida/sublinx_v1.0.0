import React from "react";
import { Badge } from "@/components/ui/badge";
import { GENRE_COLORS, EVENT_TYPE_COLORS } from "./constants";

/**
 * Badge reutilizável para gênero/tipo de evento
 * Elimina duplicação de lógica de cores em 8+ arquivos
 */
export function GenreBadge({ genre, size = "sm" }) {
  if (!genre) return null;
  
  const colorClass = GENRE_COLORS[genre] || GENRE_COLORS.default;
  const sizeClass = size === "xs" ? "text-[9px] px-1 py-0 h-4" : "text-xs px-2 py-0.5";
  
  return (
    <Badge className={`${colorClass} ${sizeClass} capitalize`}>
      {genre.replace(/_/g, ' ')}
    </Badge>
  );
}

export function TypeBadge({ type, size = "sm" }) {
  if (!type) return null;
  
  const sizeClass = size === "xs" ? "text-[9px] px-1 py-0 h-4" : "text-xs px-2 py-0.5";
  
  return (
    <Badge 
      className={`${sizeClass} capitalize`}
      style={{
        background: `${EVENT_TYPE_COLORS[type] || EVENT_TYPE_COLORS.rave}20`,
        borderColor: `${EVENT_TYPE_COLORS[type] || EVENT_TYPE_COLORS.rave}30`,
        color: EVENT_TYPE_COLORS[type] || EVENT_TYPE_COLORS.rave
      }}
    >
      {type.replace(/_/g, ' ')}
    </Badge>
  );
}

export function SecretBadge({ isSecret, requiresApproval, size = "sm" }) {
  if (!isSecret && !requiresApproval) return null;
  
  const sizeClass = size === "xs" ? "text-[9px] px-1 py-0 h-4" : "text-xs px-2 py-0.5";
  
  return (
    <>
      {isSecret && (
        <Badge className={`bg-yellow-600/20 border-yellow-500/30 text-yellow-300 ${sizeClass}`}>
          🔒 Secreto
        </Badge>
      )}
      {requiresApproval && (
        <Badge className={`bg-orange-600/20 border-orange-500/30 text-orange-300 ${sizeClass}`}>
          ✓ Requer Aprovação
        </Badge>
      )}
    </>
  );
}