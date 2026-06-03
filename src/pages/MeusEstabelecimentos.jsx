import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus, MapPin, Star, Users, ArrowLeft, Edit, Calendar, Phone, Globe, Instagram, Loader2 } from "lucide-react";

const TYPE_LABELS = {
  bar: "Bar", discoteca: "Discoteca", restaurante: "Restaurante", cafe: "Café",
  lounge_bar: "Lounge Bar", pub: "Pub", club: "Club", padaria: "Padaria",
  warehouse: "Warehouse", rooftop: "Rooftop", studio: "Estúdio",
  gallery: "Galeria", underground_space: "Underground", cultural_center: "Centro Cultural"
};

export default function MeusEstabelecimentos() {
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const { data: venues = [], isLoading } = useQuery({
    queryKey: ['myVenues', user?.id],
    queryFn: () => base44.entities.Venue.filter({ created_by: user.email }),
    enabled: !!user?.id,
    staleTime: 60000,
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-screen bg-black">
      <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 px-4 py-3 border-b flex items-center justify-between"
        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', borderColor: 'rgba(6,182,212,0.2)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-cyan-400 hover:text-cyan-300 p-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Building2 className="w-5 h-5 text-cyan-400" />
          <h1 className="text-lg font-bold" style={{ background: 'linear-gradient(to right, #22d3ee, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Meus Estabelecimentos
          </h1>
        </div>
        <Button onClick={() => navigate(createPageUrl("CadastrarEstabelecimento"))} size="sm"
          className="rounded-xl text-xs font-bold px-3 h-8"
          style={{ background: 'linear-gradient(135deg, #0891b2, #7c3aed)', boxShadow: '0 0 14px rgba(6,182,212,0.4)' }}>
          <Plus className="w-3.5 h-3.5 mr-1" />
          Novo
        </Button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {venues.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.1), rgba(168,85,247,0.1))', border: '1.5px solid rgba(6,182,212,0.2)' }}>
              <Building2 className="w-9 h-9 text-cyan-500/40" />
            </div>
            <h3 className="text-lg font-semibold text-gray-400 mb-2">Nenhum estabelecimento ainda</h3>
            <p className="text-gray-600 text-sm mb-6">Cadastre seu bar, club, restaurante ou espaço cultural</p>
            <Button onClick={() => navigate(createPageUrl("CadastrarEstabelecimento"))}
              className="rounded-xl font-bold"
              style={{ background: 'linear-gradient(135deg, #0891b2, #7c3aed)' }}>
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar Estabelecimento
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {venues.map(venue => (
              <div key={venue.id} className="rounded-xl border p-4"
                style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(6,182,212,0.12)' }}>
                <div className="flex items-start gap-3">
                  {venue.image_url ? (
                    <img src={venue.image_url} alt={venue.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(168,85,247,0.15))', border: '1px solid rgba(6,182,212,0.2)' }}>
                      <Building2 className="w-7 h-7 text-cyan-500/50" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-white">{venue.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="text-[10px] px-2 py-0.5" style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)', color: '#22d3ee' }}>
                            {TYPE_LABELS[venue.type] || venue.type}
                          </Badge>
                          {venue.verified && (
                            <Badge className="text-[10px] px-2 py-0.5 bg-green-600/20 border-green-500/30 text-green-400">✓ Verificado</Badge>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-cyan-400 flex-shrink-0"
                        onClick={() => navigate(createPageUrl("CadastrarEstabelecimento") + `?editId=${venue.id}`)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>

                    {venue.location?.address && (
                      <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {venue.location.address}, {venue.location.city}
                      </p>
                    )}

                    <div className="flex items-center gap-3 mt-2">
                      {venue.rating > 0 && (
                        <span className="flex items-center gap-1 text-xs text-yellow-400">
                          <Star className="w-3 h-3 fill-current" />
                          {venue.rating.toFixed(1)} ({venue.total_reviews})
                        </span>
                      )}
                      {venue.capacity > 0 && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Users className="w-3 h-3" />
                          {venue.capacity} pessoas
                        </span>
                      )}
                      {venue.upcoming_events_count > 0 && (
                        <span className="flex items-center gap-1 text-xs text-cyan-400">
                          <Calendar className="w-3 h-3" />
                          {venue.upcoming_events_count} eventos
                        </span>
                      )}
                    </div>

                    {venue.genres?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {venue.genres.slice(0, 4).map(g => (
                          <span key={g} className="text-[10px] px-2 py-0.5 rounded-full text-gray-400"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            {g}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}