import React from "react";
import { useNavigate } from "react-router-dom";
import { openUserProfile } from "@/lib/navigation";
import { DEFAULT_AVATAR } from "./helpers";

const sizeMap = {
  xs: "w-6 h-6",
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-16 h-16",
  xl: "w-24 h-24",
};

const borderMap = {
  xs: "border",
  sm: "border-2",
  md: "border-2",
  lg: "border-2",
  xl: "border-2",
};

/**
 * Standardized avatar component.
 * Every avatar click automatically triggers openUserProfile(userId).
 */
export default function UserAvatar({
  userId,
  userName,
  avatarUrl,
  size = "sm",
  className = "",
  onClick,
  ringColor = "rgba(6, 182, 212, 0.5)",
  glowColor = "rgba(6, 182, 212, 0.4)",
  clickable = true,
}) {
  const navigate = useNavigate();

  const handleClick = (e) => {
    e.stopPropagation();
    if (onClick) {
      onClick(e);
    } else if (clickable && userId) {
      openUserProfile(navigate, userId);
    }
  };

  return (
    <img
      src={avatarUrl || DEFAULT_AVATAR}
      alt={userName || "Usuário"}
      className={`${sizeMap[size] || sizeMap.sm} ${borderMap[size] || borderMap.sm} rounded-full object-cover ${clickable && userId ? "cursor-pointer" : ""} ${className}`}
      style={{
        borderColor: ringColor,
        boxShadow: clickable && userId ? `0 0 12px ${glowColor}` : undefined,
      }}
      onClick={handleClick}
    />
  );
}