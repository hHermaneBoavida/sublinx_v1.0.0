import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { CACHE_CONFIG } from "./helpers";

/**
 * Hook centralizado para acessar o usuário logado
 * Elimina duplicação de código em 10+ arquivos
 * Cache infinito para evitar re-fetches desnecessários
 */
export default function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch (error) {
        return null;
      }
    },
    retry: false,
    ...CACHE_CONFIG.STATIC,
  });
}