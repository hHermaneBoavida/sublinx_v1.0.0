import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { MapPin, Zap, User as UserIcon, Bell, Plus, MessageCircle, ArrowLeft, MoreVertical, Share2, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import BottomNav from "@/components/navigation/BottomNav";
import NotificationListener from "@/components/notifications/NotificationListener";
import EventProximityChecker from "@/components/notifications/EventProximityChecker";
import NotificationPermissionPrompt from "@/components/notifications/NotificationPermissionPrompt";
import WebSocketEventProvider from "@/components/events/WebSocketEventProvider";
import ErrorBoundary from "@/components/shared/ErrorBoundary";
import { motion } from "framer-motion";
import { CACHE_CONFIG } from "@/components/shared/helpers";
import OfflineIndicator from "@/components/offline/OfflineIndicator";
import ServiceWorkerRegistration from "@/components/offline/ServiceWorkerRegistration";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        const userData = await base44.auth.me();
        return userData;
      } catch (error) {
        return null;
      }
    },
    retry: false,
    ...CACHE_CONFIG.STATIC,
  });

  const isGuest = !user;

  const { data: unreadCount } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const notifications = await base44.entities.Notification.filter({ 
        user_id: user.id, 
        is_read: false 
      });
      return notifications?.length || 0;
    },
    select: (data) => data?.length || 0,
    enabled: !!user,
    initialData: 0,
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
    ...CACHE_CONFIG.SHORT,
  });

  useEffect(() => {
    if (!user || isGuest) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log("Localização não disponível para notificações:", error);
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
      );
    }
  }, [user, isGuest]);

  const getNavigationItems = (currentUser, guest) => {
    return [
      { title: "Mapa", url: createPageUrl("Mapa"), icon: MapPin },
      { title: "Feed", url: createPageUrl("Feed"), icon: Zap },
      { title: "Chat", url: currentUser?.is_organizer ? createPageUrl("ChatOrganizadores") : createPageUrl("Chat"), icon: MessageCircle },
      { title: "Perfil", url: guest ? createPageUrl("BemVindo") : createPageUrl("Perfil"), icon: UserIcon },
    ];
  };
  
  const navigationItems = getNavigationItems(user, isGuest);

  const showFAB = user?.is_organizer && ![createPageUrl("CriarEvento"), createPageUrl("Mapa")].includes(location.pathname);



  const showNotificationPrompt = !isGuest && currentPageName !== "Mapa";

  const noLayoutPages = ["BemVindo", "Mapa"];
  if (noLayoutPages.includes(currentPageName)) {
    return (
      <ErrorBoundary key={currentPageName}>
        <ServiceWorkerRegistration />
        <OfflineIndicator />
        <WebSocketEventProvider user={user || null}>
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
          
          {!isGuest && user && <NotificationListener user={user} />}
          {!isGuest && user && userLocation && <EventProximityChecker user={user} userLocation={userLocation} />}
          {showNotificationPrompt && <NotificationPermissionPrompt />}
        </WebSocketEventProvider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary key={currentPageName}>
      <ServiceWorkerRegistration />
      <OfflineIndicator />
      <WebSocketEventProvider user={user || null}>
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
          
          <div 
            className="fixed inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, #0a1628 0%, #000000 50%, #0f0f23 100%)'
            }}
          />

          <div
            className="fixed inset-0 pointer-events-none opacity-[0.08]"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(6, 182, 212, 0.8) 0.5px, transparent 0.5px),
                linear-gradient(to bottom, rgba(6, 182, 212, 0.8) 0.5px, transparent 0.5px)
              `,
              backgroundSize: '50px 50px',
              animation: 'grid-glow 6s ease-in-out infinite'
            }}
          />

          <div 
            className="fixed top-0 left-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-15"
            style={{
              background: 'radial-gradient(circle, rgba(6, 182, 212, 0.8) 0%, transparent 70%)',
              animation: 'pulse-glow 8s ease-in-out infinite'
            }}
          />
          <div 
            className="fixed bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-12"
            style={{
              background: 'radial-gradient(circle, rgba(168, 85, 247, 0.8) 0%, transparent 70%)',
              animation: 'pulse-glow 10s ease-in-out infinite 2s'
            }}
          />

          <div
            className="fixed inset-0 pointer-events-none opacity-[0.04]"
            style={{
              backgroundImage: `
                repeating-linear-gradient(
                  45deg,
                  rgba(6, 182, 212, 0.6) 0px,
                  rgba(6, 182, 212, 0.6) 1px,
                  transparent 1px,
                  transparent 60px
                )
              `,
              animation: 'diagonal-move 25s linear infinite'
            }}
          />

          <header className="relative z-10 px-4 py-2 backdrop-blur-xl border-b" style={{
            background: 'rgba(0,0,0,0.85)',
            borderColor: 'rgba(6, 182, 212, 0.15)',
          }}>
            <div className="max-w-7xl mx-auto flex items-center justify-between h-12">
              {/* LEFT: Voltar + Logo */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(-1)}
                  className="flex items-center justify-center w-8 h-8 rounded-lg transition-all hover:scale-105"
                  style={{
                    background: 'rgba(6,182,212,0.1)',
                    border: '1.5px solid rgba(6,182,212,0.4)',
                    color: '#67e8f9'
                  }}
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <Link to={createPageUrl("Mapa")} className="flex items-center gap-2">
                  <motion.img
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68a70ee66a1156f1068d2903/de9996d20_500x500.png"
                    alt="SUBLINX"
                    className="w-8 h-8"
                    style={{ filter: 'drop-shadow(0 0 8px rgba(6,182,212,0.6))' }}
                  />
                  <span className="hidden sm:block text-base font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                    SUBLINX
                  </span>
                </Link>
              </div>

              {/* RIGHT: Notificações + Menu */}
              <div className="flex items-center gap-2">
                {!isGuest && (
                  <Link
                    to={createPageUrl("Notificacoes")}
                    className="relative flex items-center justify-center w-8 h-8 rounded-lg transition-all hover:scale-105"
                    style={{
                      background: 'rgba(6,182,212,0.1)',
                      border: '1.5px solid rgba(6,182,212,0.3)',
                    }}
                  >
                    <Bell className="w-4 h-4 text-cyan-400" />
                    {unreadCount > 0 && (
                      <span
                        className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 text-white text-[9px] font-bold flex items-center justify-center rounded-full"
                        style={{ background: '#ef4444', boxShadow: '0 0 8px rgba(239,68,68,0.8)' }}
                      >
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>
                )}

                {!isGuest && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="flex items-center justify-center w-8 h-8 rounded-lg transition-all hover:scale-105"
                        style={{
                          background: 'rgba(168,85,247,0.1)',
                          border: '1.5px solid rgba(168,85,247,0.4)',
                          color: '#d8b4fe'
                        }}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-48 border"
                      style={{
                        background: 'rgba(10,10,20,0.97)',
                        borderColor: 'rgba(168,85,247,0.3)',
                        backdropFilter: 'blur(20px)'
                      }}
                    >
                      <DropdownMenuItem
                        onClick={() => navigate(createPageUrl("Perfil"))}
                        className="flex items-center gap-2 text-gray-200 hover:text-white focus:text-white cursor-pointer"
                        style={{ background: 'transparent' }}
                      >
                        <UserIcon className="w-4 h-4 text-cyan-400" />
                        Meu Perfil
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          const url = window.location.href;
                          if (navigator.share) navigator.share({ url });
                          else navigator.clipboard.writeText(url);
                        }}
                        className="flex items-center gap-2 text-gray-200 hover:text-white focus:text-white cursor-pointer"
                        style={{ background: 'transparent' }}
                      >
                        <Share2 className="w-4 h-4 text-purple-400" />
                        Compartilhar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator style={{ borderColor: 'rgba(255,255,255,0.1)' }} />
                      <DropdownMenuItem
                        onClick={() => { base44.auth.logout(); navigate(createPageUrl("BemVindo")); }}
                        className="flex items-center gap-2 text-red-400 hover:text-red-300 focus:text-red-300 cursor-pointer"
                        style={{ background: 'transparent' }}
                      >
                        <LogOut className="w-4 h-4" />
                        Sair
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {isGuest && (
                  <Link
                    to={createPageUrl("BemVindo")}
                    className="flex items-center justify-center w-8 h-8 rounded-lg"
                    style={{
                      background: 'rgba(6,182,212,0.1)',
                      border: '1.5px solid rgba(6,182,212,0.4)',
                    }}
                  >
                    <UserIcon className="w-4 h-4 text-cyan-400" />
                  </Link>
                )}
              </div>
            </div>
          </header>

          {showFAB && (
            <motion.div
              className="fixed bottom-20 sm:bottom-24 md:bottom-8 right-4 sm:right-6 md:right-8 z-30 group"
              whileHover={{ scale: 1.15, rotate: 10 }}
              whileTap={{ scale: 0.9, rotate: -10 }}
            >
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(6, 182, 212, 0.5) 0%, transparent 70%)',
                  filter: 'blur(20px)',
                  width: '80px',
                  height: '80px',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 0.8, 0.5]
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />

              <Link to={createPageUrl("CriarEvento")}>
                <Button
                  size="lg"
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-3 border-white/30 shadow-2xl relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, rgba(6, 182, 212, 1), rgba(168, 85, 247, 1))',
                    boxShadow: '0 0 30px rgba(6, 182, 212, 0.7), 0 0 60px rgba(168, 85, 247, 0.5)'
                  }}
                >
                  <motion.div
                    className="absolute inset-0"
                    style={{
                      background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.5), transparent 65%)'
                    }}
                    animate={{
                      opacity: [0.3, 0.7, 0.3],
                      scale: [1, 1.15, 1]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />

                  <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-white relative z-10" />
                </Button>
              </Link>

              <motion.div 
                className="absolute bottom-full right-0 mb-2 sm:mb-3 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap backdrop-blur-xl border-2"
                style={{
                  background: 'rgba(0, 0, 0, 0.9)',
                  borderColor: 'rgba(6, 182, 212, 0.5)',
                  boxShadow: '0 0 25px rgba(6, 182, 212, 0.5)'
                }}
              >
                <span 
                  className="text-white text-xs sm:text-sm font-semibold"
                  style={{
                    textShadow: '0 0 10px rgba(6, 182, 212, 0.8)'
                  }}
                >
                  Criar Evento
                </span>
                <div 
                  className="absolute top-full right-3 sm:right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent"
                  style={{
                    borderTopColor: 'rgba(6, 182, 212, 0.5)'
                  }}
                />
              </motion.div>
            </motion.div>
          )}

          <main className="relative z-0 pb-28 md:pb-0">
            {children}
          </main>

          <BottomNav navigationItems={navigationItems} location={location} isOrganizer={user?.is_organizer} isGuest={isGuest} />

          <PWAInstallPrompt />

          {!isGuest && user && <NotificationListener user={user} />}
          {!isGuest && user && userLocation && <EventProximityChecker user={user} userLocation={userLocation} />}
          {showNotificationPrompt && <NotificationPermissionPrompt />}

          <style>{`
            @keyframes grid-glow {
              0%, 100% { opacity: 0.08; }
              50% { opacity: 0.15; }
            }
            @keyframes pulse-glow {
              0%, 100% { transform: scale(1); opacity: 0.15; }
              50% { transform: scale(1.12); opacity: 0.25; }
            }
            @keyframes diagonal-move {
              0% { background-position: 0 0; }
              100% { background-position: 120px 120px; }
            }
          `}</style>
        </div>
      </WebSocketEventProvider>
    </ErrorBoundary>
  );
}