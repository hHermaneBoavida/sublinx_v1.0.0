
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { MapPin, Zap, User as UserIcon, Users, Bell, Crown, Plus, Settings, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import NotificationListener from "@/components/notifications/NotificationListener";
import EventProximityChecker from "@/components/notifications/EventProximityChecker";
import { motion } from "framer-motion";
import { CACHE_CONFIG } from "@/components/shared/helpers";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
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

  // OTIMIZADO: Cache para contagem de notificações não lidas
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
    refetchInterval: 30000, // Atualiza a cada 30s
    refetchIntervalInBackground: false,
    ...CACHE_CONFIG.SHORT,
  });

  // Obter localização do usuário para notificações de proximidade
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
            
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              console.log('🔄 Nova versão do Service Worker encontrada');
              
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('✨ Nova versão disponível! Recarregue para atualizar.');
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
        
        {/* Notificações em TODAS as páginas */}
        {!isGuest && <NotificationListener user={user} />}
        {!isGuest && userLocation && <EventProximityChecker user={user} userLocation={userLocation} />}
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

      {/* Header - OTIMIZADO */}
      <header className="relative z-10 p-3 sm:p-4 md:p-6 backdrop-blur-xl border-b-2" style={{
        background: 'linear-gradient(135deg, rgba(0,0,0,0.7), rgba(17,24,39,0.5))',
        borderColor: 'rgba(6, 182, 212, 0.2)',
        boxShadow: '0 0 30px rgba(6, 182, 212, 0.15), inset 0 -1px 0 rgba(6, 182, 212, 0.3)'
      }}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to={createPageUrl("Mapa")} className="group flex items-center gap-2 sm:gap-3">
            <motion.img 
              whileHover={{ scale: 1.15, rotate: 10 }}
              whileTap={{ scale: 0.95 }}
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/116e0559c_Sublinx_icon.png" 
              alt="SUBLINX Icon" 
              className="w-8 h-8 sm:w-10 sm:h-10 transition-transform duration-300"
              style={{
                filter: 'drop-shadow(0 0 15px rgba(6, 182, 212, 0.7))'
              }}
            />
            <motion.h1 
              className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-lime-400 bg-clip-text text-transparent hidden xs:block"
              style={{
                textShadow: '0 0 30px rgba(6, 182, 212, 0.5)'
              }}
              whileHover={{
                textShadow: '0 0 40px rgba(6, 182, 212, 0.8)'
              }}
            >
              SUBLINX
            </motion.h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-2">
            {navigationItems.map((item) => (
              <motion.div
                key={item.title}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  to={item.url}
                  className={`flex items-center space-x-2 px-3 lg:px-4 py-2 rounded-lg transition-all duration-300 relative overflow-hidden ${
                    location.pathname === item.url
                      ? 'text-cyan-300'
                      : 'text-gray-300 hover:text-white'
                  }`}
                  style={{
                    background: location.pathname === item.url
                      ? 'linear-gradient(to right, rgba(6, 182, 212, 0.2), rgba(168, 85, 247, 0.2))'
                      : 'transparent',
                    borderColor: location.pathname === item.url ? 'rgba(6, 182, 212, 0.4)' : 'transparent',
                    boxShadow: location.pathname === item.url 
                      ? '0 0 20px rgba(6, 182, 212, 0.3), inset 0 0 15px rgba(6, 182, 212, 0.15)'
                      : 'none'
                  }}
                >
                  {location.pathname === item.url && (
                    <div 
                      className="absolute top-0 left-0 right-0 h-1/2 rounded-t-lg"
                      style={{
                        background: 'linear-gradient(to bottom, rgba(255,255,255,0.15), transparent)'
                      }}
                    />
                  )}

                  <item.icon className="w-4 h-4 relative z-10" />
                  <span className="text-sm lg:text-base relative z-10">{item.title}</span>
                </Link>
              </motion.div>
            ))}
          </nav>

          {/* Header Right Side */}
          <div className="flex items-center gap-2 sm:gap-3">
            {(!user?.is_pro_member || isGuest) && (
              <Link to={createPageUrl("Planos")}>
                <motion.div
                  whileHover={{ scale: 1.08, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    variant="outline"
                    size="sm"
                    className="hidden sm:flex text-xs lg:text-sm relative overflow-hidden"
                    style={{
                      background: 'linear-gradient(to right, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.2))',
                      borderColor: 'rgba(251, 191, 36, 0.5)',
                      color: '#FBBF24',
                      boxShadow: '0 0 20px rgba(251, 191, 36, 0.4)'
                    }}
                  >
                    <div 
                      className="absolute top-0 left-0 right-0 h-1/2"
                      style={{
                        background: 'linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)'
                      }}
                    />
                    <Crown className="w-3 h-3 lg:w-4 lg:h-4 mr-1 relative z-10" />
                    <span className="hidden lg:inline relative z-10">Upgrade</span>
                    <span className="lg:hidden relative z-10">Pro</span>
                  </Button>
                </motion.div>
              </Link>
            )}

            {/* MELHORADO: Indicador de Notificações com Animações */}
            {!isGuest && (
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to={createPageUrl("Notificacoes")}
                  className="relative p-2 rounded-lg hover:bg-gray-800/50 transition-all duration-300 group"
                >
                  {/* Bell Icon */}
                  <motion.div
                    animate={unreadCount > 0 ? {
                      rotate: [0, -15, 15, -10, 10, 0],
                    } : {}}
                    transition={{
                      duration: 0.5,
                      repeat: unreadCount > 0 ? Infinity : 0,
                      repeatDelay: 3
                    }}
                  >
                    <Bell className="w-5 h-5 text-gray-300 group-hover:text-white" />
                  </motion.div>

                  {/* Unread Badge - MELHORADO */}
                  {unreadCount > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 min-w-[18px] h-[18px] sm:min-w-[20px] sm:h-5 px-1 text-white text-[10px] sm:text-xs font-bold flex items-center justify-center rounded-full"
                      style={{
                        background: 'linear-gradient(135deg, rgba(239, 68, 68, 1), rgba(220, 38, 38, 1))',
                        boxShadow: '0 0 15px rgba(239, 68, 68, 0.8), 0 0 30px rgba(239, 68, 68, 0.5), inset 0 1px 0 rgba(255,255,255,0.3)'
                      }}
                    >
                      {/* Pulse Ring */}
                      <motion.div
                        className="absolute inset-0 rounded-full"
                        style={{
                          border: '2px solid rgba(239, 68, 68, 0.6)',
                        }}
                        animate={{
                          scale: [1, 1.8, 1],
                          opacity: [0.8, 0, 0.8]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />

                      {/* Top Gloss */}
                      <div
                        className="absolute top-0 left-0 right-0 h-1/2 rounded-t-full"
                        style={{
                          background: 'linear-gradient(to bottom, rgba(255,255,255,0.4), transparent)'
                        }}
                      />

                      {/* Count */}
                      <motion.span
                        animate={{
                          scale: [1, 1.1, 1]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="relative z-10"
                      >
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </motion.span>
                    </motion.div>
                  )}

                  {/* Dot Indicator (when 0 but system is active) */}
                  {unreadCount === 0 && (
                    <motion.div
                      className="absolute top-1 right-1 w-2 h-2 rounded-full"
                      style={{
                        background: 'rgba(6, 182, 212, 0.6)',
                        boxShadow: '0 0 8px rgba(6, 182, 212, 0.8)'
                      }}
                      animate={{
                        opacity: [0.4, 1, 0.4],
                        scale: [0.8, 1.2, 0.8]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </Link>
              </motion.div>
            )}

            {/* Mobile Profile/Login */}
            <div className="md:hidden">
              {user ? (
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link to={createPageUrl("Perfil")}>
                    <img 
                      src={user.avatar_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/5048ab8ec_perfil.png"} 
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover" 
                      alt="User Avatar"
                      style={{
                        border: '2px solid rgba(6, 182, 212, 0.5)',
                        boxShadow: '0 0 15px rgba(6, 182, 212, 0.5)'
                      }}
                    />
                  </Link>
                </motion.div>
              ) : (
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link to={createPageUrl("BemVindo")}>
                    <div 
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-800 flex items-center justify-center border-2 transition-all"
                      style={{
                        borderColor: 'rgba(6, 182, 212, 0.5)',
                        boxShadow: '0 0 15px rgba(6, 182, 212, 0.3)'
                      }}
                    >
                      <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400"/>
                    </div>
                  </Link>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* FAB - Redesenhado com Neon */}
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

      {/* Main Content */}
      <main className="relative z-0 pb-20 sm:pb-24 md:pb-0">
        {children}
      </main>

      {/* Mobile Bottom Navigation - Glass Neon */}
      <div 
        className="md:hidden fixed bottom-0 left-0 right-0 backdrop-blur-xl border-t-2 z-20 safe-area-inset-bottom"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.95), rgba(17,24,39,0.8))',
          borderColor: 'rgba(6, 182, 212, 0.2)',
          boxShadow: '0 -5px 30px rgba(6, 182, 212, 0.15), inset 0 1px 0 rgba(6, 182, 212, 0.2)'
        }}
      >
        <div className="grid grid-cols-4 h-16 sm:h-18">
          {navigationItems.map((item) => (
            <motion.div
              key={item.title}
              whileTap={{ scale: 0.9 }}
            >
              <Link
                to={item.url}
                className={`flex flex-col items-center justify-center py-2 px-1 transition-all duration-300 relative ${
                  location.pathname === item.url
                    ? 'text-cyan-400'
                    : 'text-gray-500 hover:text-white'
                }`}
              >
                <motion.div
                  animate={location.pathname === item.url ? {
                    filter: [
                      'drop-shadow(0 0 8px rgba(6, 182, 212, 0.8))',
                      'drop-shadow(0 0 15px rgba(6, 182, 212, 1))',
                      'drop-shadow(0 0 8px rgba(6, 182, 212, 0.8))'
                    ]
                  } : {}}
                  transition={{ duration: 2, repeat: location.pathname === item.url ? Infinity : 0 }}
                >
                  <item.icon className="w-5 h-5 sm:w-6 sm:h-6 mb-0.5 sm:mb-1" />
                </motion.div>

                <span className="text-[10px] sm:text-xs">{item.title}</span>

                {location.pathname === item.url && (
                  <motion.div 
                    className="w-1 h-1 rounded-full mt-0.5 sm:mt-1"
                    style={{
                      background: 'rgba(6, 182, 212, 1)',
                      boxShadow: '0 0 10px rgba(6, 182, 212, 1)'
                    }}
                    animate={{
                      boxShadow: [
                        '0 0 10px rgba(6, 182, 212, 1)',
                        '0 0 20px rgba(6, 182, 212, 1)',
                        '0 0 10px rgba(6, 182, 212, 1)'
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      <PWAInstallPrompt />

      {/* Sistema de Notificações em Tempo Real - SEMPRE ATIVO */}
      {!isGuest && <NotificationListener user={user} />}
      {!isGuest && userLocation && <EventProximityChecker user={user} userLocation={userLocation} />}

      <style jsx>{`
        @keyframes grid-glow {
          0%, 100% {
            opacity: 0.08;
          }
          50% {
            opacity: 0.15;
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            transform: scale(1);
            opacity: 0.15;
          }
          50% {
            transform: scale(1.12);
            opacity: 0.25;
          }
        }

        @keyframes diagonal-move {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 120px 120px;
          }
        }
      `}</style>
    </div>
  );
}
