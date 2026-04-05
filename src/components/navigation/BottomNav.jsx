import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Search, PlusCircle, PlayCircle, User, Users } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function BottomNav({ location, isOrganizer, isGuest }) {
  const navItems = isOrganizer
    ? [
        { title: "Mapa", icon: MapPin, url: createPageUrl("Mapa") },
        { title: "Explorar", icon: Search, url: createPageUrl("Feed") },
        { title: "Criar", icon: PlusCircle, url: createPageUrl("CriarEvento"), isAction: true },
        { title: "Reels", icon: PlayCircle, url: createPageUrl("Mapa") },
        { title: "Perfil", icon: User, url: createPageUrl("Perfil") },
      ]
    : [
        { title: "Mapa", icon: MapPin, url: createPageUrl("Mapa") },
        { title: "Explorar", icon: Search, url: createPageUrl("Feed") },
        { title: "Reels", icon: PlayCircle, url: createPageUrl("Mapa") },
        { title: "Comunidade", icon: Users, url: createPageUrl("Comunidade") },
        { title: "Perfil", icon: User, url: isGuest ? createPageUrl("BemVindo") : createPageUrl("Perfil") },
      ];

  const isActive = (url) => location?.pathname === url.split("?")[0];

  return (
    <div
      className="md:hidden fixed z-[9999]"
      style={{ bottom: 16, left: 16, right: 16 }}
    >
      <div
        className="flex justify-around items-center"
        style={{
          height: 64,
          borderRadius: 24,
          background: "rgba(10, 10, 20, 0.82)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.55), 0 0 0 0.5px rgba(255,255,255,0.04) inset",
          padding: "8px 4px",
        }}
      >
        {navItems.map((item) => {
          const active = isActive(item.url);

          return (
            <motion.div key={item.title} whileTap={{ scale: 0.88 }} style={{ flex: 1 }}>
              <Link
                to={item.url}
                className="flex flex-col items-center justify-center gap-[3px]"
                style={{ minHeight: 44 }}
              >
                {item.isAction ? (
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 14,
                      background: "linear-gradient(135deg, #7B61FF, #a855f7)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 0 18px rgba(123,97,255,0.5)",
                    }}
                  >
                    <item.icon size={20} color="#fff" />
                  </div>
                ) : (
                  <>
                    <motion.div
                      animate={active ? { filter: "drop-shadow(0 0 8px rgba(123,97,255,0.8))" } : { filter: "none" }}
                      transition={{ duration: 0.2 }}
                    >
                      <item.icon
                        size={22}
                        color={active ? "#7B61FF" : "rgba(255,255,255,0.45)"}
                        strokeWidth={active ? 2.2 : 1.8}
                      />
                    </motion.div>
                    <span
                      style={{
                        fontSize: 10,
                        color: active ? "#7B61FF" : "rgba(255,255,255,0.4)",
                        fontWeight: active ? 600 : 400,
                        letterSpacing: "0.02em",
                      }}
                    >
                      {item.title}
                    </span>
                  </>
                )}
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}