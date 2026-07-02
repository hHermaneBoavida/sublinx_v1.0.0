import { createPageUrl } from "@/utils";

/**
 * Centralized navigation helper for opening user profiles.
 * Use this everywhere instead of duplicating navigation logic.
 */
export function openUserProfile(navigate, userId) {
  if (!userId) return;
  navigate(createPageUrl("PerfilUsuario") + `?id=${userId}`);
}