
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { MapPin, Zap, User as UserIcon, Users, Bell, Crown, Plus, Settings, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        const userData = await base44.auth.me();
        return userData;
      } catch (error) {
        return null; // Modo guest permitido
      }
    },
    retry: false, // CORREÇÃO: Não redirecionar automaticamente
    staleTime: Infinity,
  });

  const isGuest = !user;

  const { data: unreadCount } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => base44.entities.Notification.filter({ user_id: user.id, is_read: false }),
    select: (data) => data.length,
    enabled: !!user,
    initialData: 0,
  });

  const getNavigationItems = (currentUser, guest) => {
    const baseItems = [
      {
        title: "Mapa",
        url: createPageUrl("Mapa"),
        icon: MapPin,
      },
      {
        title: "Feed", 
        url: createPageUrl("Feed"),
        icon: Zap,
      }
    ];

    if (guest) {
        return [
            ...baseItems,
            {
                title: "Perfil",
                url: createPageUrl("BemVindo"),
                icon: UserIcon,
            }
        ];
    }

    if (currentUser?.is_organizer) {
      return [
        ...baseItems,
        {
          title: "Chat",
          url: createPageUrl("Chat"),
          icon: MessageCircle,
        },
        {
          title: "Perfil",
          url: createPageUrl("Perfil"),
          icon: UserIcon,
        }
      ];
    } else {
      return [
        ...baseItems,
        {
          title: "Comunidade",
          url: createPageUrl("Comunidade"),
          icon: Users,
        },
        {
          title: "Perfil",
          url: createPageUrl("Perfil"),
          icon: UserIcon,
        }
      ];
    }
  };
  
  const navigationItems = getNavigationItems(user, isGuest);

  const showFAB = user?.is_organizer && ![createPageUrl("CriarEvento"), createPageUrl("Mapa")].includes(location.pathname);

  // Registrar Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/service-worker.js')
          .then((registration) => {
            console.log('✅ Service Worker registrado:', registration.scope);
            
            // Verificar atualizações
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              console.log('🔄 Nova versão do Service Worker encontrada');
              
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('✨ Nova versão disponível! Recarregue para atualizar.');
                  // Você pode mostrar uma notificação aqui
                }
              });
            });
          })
          .catch((error) => {
            console.error('❌ Erro ao registrar Service Worker:', error);
          });
      });
    }
  }, []);

  const noLayoutPages = ["BemVindo", "Mapa"];
  if (noLayoutPages.includes(currentPageName)) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Space+Grotesk:wght@400;700&display=swap');
          body {
            --font-orbitron: 'Orbitron', sans-serif;
            --font-space-grotesk: 'Space Grotesk', sans-serif;
          }
          .font-orbitron { font-family: 'Orbitron', sans-serif; }
          .font-space-grotesk { font-family: 'Space Grotesk', sans-serif; }
          .animate-spin-slow { animation: spin 8s linear infinite; }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
        {children}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Space+Grotesk:wght@400;700&display=swap');
        body {
          --font-orbitron: 'Orbitron', sans-serif;
          --font-space-grotesk: 'Space Grotesk', sans-serif;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-cyan-900/20 pointer-events-none" />
      <div className="fixed top-0 left-1/4 w-64 h-64 md:w-96 md:h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="fixed bottom-0 right-1/4 w-64 h-64 md:w-96 md:h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />

      {/* Header - Mobile First */}
      <header className="relative z-10 p-3 sm:p-4 md:p-6 border-b border-gray-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to={createPageUrl("Mapa")} className="group flex items-center gap-2 sm:gap-3">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/116e0559c_Sublinx_icon.png" 
              alt="SUBLINX Icon" 
              className="w-8 h-8 sm:w-10 sm:h-10 transition-transform duration-300 group-hover:scale-110"
            />
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-lime-400 bg-clip-text text-transparent hidden xs:block">
              SUBLINX
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-2">
            {navigationItems.map((item) => (
                <Link
                  key={item.title}
                  to={item.url}
                  className={`flex items-center space-x-2 px-3 lg:px-4 py-2 rounded-lg transition-all duration-300 ${
                    location.pathname === item.url
                      ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 text-cyan-300'
                      : 'hover:bg-gray-800/50 text-gray-300 hover:text-white'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-sm lg:text-base">{item.title}</span>
                </Link>
              ))}
          </nav>

          {/* Header Right Side - Mobile Optimized */}
          {/* CORREÇÃO: Mostrar opção de login para guests */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Planos Button */}
            {(!user?.is_pro_member || isGuest) && (
              <Link to={createPageUrl("Planos")}>
                <Button 
                  variant="outline"
                  size="sm"
                  className="hidden sm:flex bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border-yellow-500/50 text-yellow-400 hover:bg-gradient-to-r hover:from-yellow-600/30 hover:to-orange-600/30 text-xs lg:text-sm"
                >
                  <Crown className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                  <span className="hidden lg:inline">Upgrade</span>
                  <span className="lg:hidden">Pro</span>
                </Button>
              </Link>
            )}

            {/* Notifications Bell */}
            {!isGuest && (
              <Link
                to={createPageUrl("Notificacoes")}
                className="relative p-2 rounded-lg hover:bg-gray-800/50 transition-all duration-300"
              >
                <Bell className="w-5 h-5 text-gray-300 hover:text-white" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 p-0 bg-red-500 text-white text-[10px] sm:text-xs flex items-center justify-center rounded-full">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Badge>
                )}
              </Link>
            )}

            {/* Mobile Profile/Login */}
            <div className="md:hidden">
              {user ? (
                <Link to={createPageUrl("Perfil")}>
                  <img 
                    src={user.avatar_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/5048ab8ec_perfil.png"} 
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-cyan-500/50 object-cover" 
                    alt="User Avatar" 
                  />
                </Link>
              ) : (
                <Link to={createPageUrl("BemVindo")}>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-800 flex items-center justify-center border-2 border-gray-600 hover:border-cyan-500/50 transition-colors">
                    <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400"/>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Floating Action Button - Mobile Optimized */}
      {showFAB && (
        <Link
          to={createPageUrl("CriarEvento")}
          className="fixed bottom-20 sm:bottom-24 md:bottom-8 right-4 sm:right-6 md:right-8 z-30 group"
        >
          <Button
            size="lg"
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 shadow-2xl hover:shadow-cyan-500/25 transition-all duration-300 group-hover:scale-110"
          >
            <Plus className="w-6 h-6 sm:w-8 sm:h-8" />
          </Button>
          <div className="absolute bottom-full right-0 mb-2 sm:mb-3 px-2 sm:px-3 py-1 sm:py-1.5 bg-black/80 text-white text-xs sm:text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            Criar Evento
            <div className="absolute top-full right-3 sm:right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/80" />
          </div>
        </Link>
      )}

      {/* Main Content - Mobile Optimized */}
      <main className="relative z-0 pb-20 sm:pb-24 md:pb-0">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-lg border-t border-gray-800/50 z-20 safe-area-inset-bottom">
        <div className="grid grid-cols-4 h-16 sm:h-18">
          {navigationItems.map((item) => (
              <Link
                key={item.title}
                to={item.url}
                className={`flex flex-col items-center justify-center py-2 px-1 transition-all duration-300 ${
                  location.pathname === item.url
                    ? 'text-cyan-400'
                    : 'text-gray-500 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5 sm:w-6 sm:h-6 mb-0.5 sm:mb-1" />
                <span className="text-[10px] sm:text-xs">{item.title}</span>
                {location.pathname === item.url && (
                  <div className="w-1 h-1 bg-cyan-400 rounded-full mt-0.5 sm:mt-1 animate-pulse" />
                )}
              </Link>
            ))}
        </div>
      </div>

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  );
}
