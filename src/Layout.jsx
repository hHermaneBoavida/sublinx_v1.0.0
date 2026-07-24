import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { MapPin, Zap, User as UserIcon, Bell, MessageCircle, ArrowLeft, MoreVertical, Share2, LogOut, CalendarCheck, Inbox, CalendarDays } from "lucide-react";
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
import { useAuth } from "@/lib/AuthContext";
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
import GlobalSearch from "@/components/search/GlobalSearch";
import ServiceWorkerRegistration from "@/components/offline/ServiceWorkerRegistration";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState(null);

  // Single source of truth for auth state — AuthContext (no parallel queries)
  const { user, isLoadingAuth } = useAuth();
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
              background: 'linear-gradient(135deg, #0a0e1a 0%, #000000 50%, #0a0e1a 100%)'
            }}
          />

          <header className="relative z-10 px-4 pb-2 safe-area-top backdrop-blur-xl border-b" style={{
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
                    src="https://media.base44.com/images/public/68a70ee66a1156f1068d2903/130e0a94e_sublinxicon.png"
                    alt="SUBLINX"
                    className="w-8 h-8"
                  />
                  <span className="hidden sm:block text-base font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                    SUBLINX
                  </span>
                </Link>
              </div>

              {/* CENTER: Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const active = location.pathname === item.url.split("?")[0];
                  return (
                    <Link
                      key={item.title}
                      to={item.url}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all hover:scale-105"
                      style={{
                        background: active ? 'rgba(123,97,255,0.15)' : 'transparent',
                        color: active ? '#a78bfa' : 'rgba(255,255,255,0.6)',
                        border: active ? '1px solid rgba(123,97,255,0.3)' : '1px solid transparent',
                      }}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  );
                })}
              </nav>

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
                        onClick={() => navigate(createPageUrl("MinhasReservas"))}
                        className="flex items-center gap-2 text-gray-200 hover:text-white focus:text-white cursor-pointer"
                        style={{ background: 'transparent' }}
                      >
                        <CalendarCheck className="w-4 h-4 text-cyan-400" />
                        Minhas Reservas
                      </DropdownMenuItem>
                      {user?.is_organizer && (
                        <>
                          <DropdownMenuItem
                            onClick={() => navigate(createPageUrl("ReservasRecebidas"))}
                            className="flex items-center gap-2 text-gray-200 hover:text-white focus:text-white cursor-pointer"
                            style={{ background: 'transparent' }}
                          >
                            <Inbox className="w-4 h-4 text-purple-400" />
                            Reservas Recebidas
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => navigate(createPageUrl("CalendarioReservas"))}
                            className="flex items-center gap-2 text-gray-200 hover:text-white focus:text-white cursor-pointer"
                            style={{ background: 'transparent' }}
                          >
                            <CalendarDays className="w-4 h-4 text-cyan-400" />
                            Calendário de Reservas
                          </DropdownMenuItem>
                        </>
                      )}
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

          <GlobalSearch />

          <main className="relative z-0 pb-28 md:pb-0">
            {children}
          </main>

          <BottomNav navigationItems={navigationItems} location={location} isOrganizer={user?.is_organizer} isGuest={isGuest} />

          <PWAInstallPrompt />

          {!isGuest && user && <NotificationListener user={user} />}
          {!isGuest && user && userLocation && <EventProximityChecker user={user} userLocation={userLocation} />}
          {showNotificationPrompt && <NotificationPermissionPrompt />}

        </div>
      </WebSocketEventProvider>
    </ErrorBoundary>
  );
}