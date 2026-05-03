import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Building2, MapPin, Phone, Mail, Globe, Instagram, Star, Check, Loader2, Plus, X } from "lucide-react";
import { motion } from "framer-motion";

const VENUE_TYPES = [
  { value: "club", label: "🎉 Club / Balada" },
  { value: "bar", label: "🍺 Bar" },
  { value: "warehouse", label: "🏭 Warehouse / Galpão" },
  { value: "rooftop", label: "🏙️ Rooftop" },
  { value: "studio", label: "🎧 Estúdio" },
  { value: "gallery", label: "🎨 Galeria / Espaço Cultural" },
  { value: "underground_space", label: "⚡ Espaço Underground" },
  { value: "cultural_center", label: "🎭 Centro Cultural" },
];

const GENRES = ["techno", "house", "trance", "drum_bass", "funk", "trap", "hip_hop", "reggae", "ambient", "experimental"];

const AMENITIES_OPTIONS = [
  "Bar", "Fumodrome", "Área externa", "Pista de dança", "VIP", "DJ Booth", 
  "Estacionamento", "Acessível", "Vestiário", "Segurança 24h"
];

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_LABELS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

export default function CadastrarEstabelecimento() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);

  const [form, setForm] = useState({
    name: "",
    description: "",
    type: "",
    location: { lat: 0, lng: 0, address: "", city: "", state: "", neighborhood: "" },
    contact: { phone: "", email: "", website: "", instagram: "" },
    capacity: "",
    average_price: "",
    opening_hours: {},
  });

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));
  const setLocation = (field, value) => setForm(f => ({ ...f, location: { ...f.location, [field]: value } }));
  const setContact = (field, value) => setForm(f => ({ ...f, contact: { ...f.contact, [field]: value } }));
  const setHours = (day, value) => setForm(f => ({ ...f, opening_hours: { ...f.opening_hours, [day]: value } }));

  const toggleGenre = (g) => setSelectedGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  const toggleAmenity = (a) => setSelectedAmenities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);

  const handleGeocode = async () => {
    const addr = `${form.location.address}, ${form.location.city}, Brasil`;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addr)}&limit=1`);
      const data = await res.json();
      if (data[0]) {
        setForm(f => ({ ...f, location: { ...f.location, lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) } }));
      }
    } catch {}
  };

  const handleSave = async () => {
    if (!form.name || !form.type || !form.location.address || !form.location.city) {
      alert("Preencha: nome, tipo, endereço e cidade.");
      return;
    }
    setSaving(true);
    try {
      await base44.entities.Venue.create({
        ...form,
        genres: selectedGenres,
        amenities: selectedAmenities,
        capacity: form.capacity ? Number(form.capacity) : undefined,
        average_price: form.average_price ? Number(form.average_price) : undefined,
        verified: false,
        rating: 0,
        total_reviews: 0,
        upcoming_events_count: 0,
      });
      queryClient.invalidateQueries(['venues']);
      setSaved(true);
      setTimeout(() => navigate(createPageUrl("MeusEstabelecimentos")), 1500);
    } catch (e) {
      alert("Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-screen bg-black"><Loader2 className="w-10 h-10 animate-spin text-cyan-500" /></div>;

  return (
    <div className="min-h-screen bg-black text-white pb-16">
      {/* Header */}
      <div className="sticky top-0 z-10 px-4 py-3 border-b flex items-center gap-3"
        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', borderColor: 'rgba(6,182,212,0.2)' }}>
        <button onClick={() => navigate(-1)} className="text-cyan-400 hover:text-cyan-300 p-1">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Building2 className="w-5 h-5 text-cyan-400" />
        <h1 className="text-lg font-bold" style={{ background: 'linear-gradient(to right, #22d3ee, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Cadastrar Estabelecimento
        </h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Informações Básicas */}
        <Section title="Informações Básicas" icon="📋">
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Nome do Estabelecimento *</label>
              <Input value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="Ex: Club Void, Bar da Cena..."
                className="bg-gray-900/60 border-gray-700 text-white focus:border-cyan-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Tipo *</label>
              <Select value={form.type} onValueChange={v => set('type', v)}>
                <SelectTrigger className="bg-gray-900/60 border-gray-700 text-white">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  {VENUE_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value} className="text-white hover:bg-gray-800">{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Descrição</label>
              <Textarea value={form.description} onChange={e => set('description', e.target.value)}
                placeholder="Conte sobre o ambiente, proposta, história..."
                className="bg-gray-900/60 border-gray-700 text-white focus:border-cyan-500 h-20 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Capacidade</label>
                <Input type="number" value={form.capacity} onChange={e => set('capacity', e.target.value)}
                  placeholder="500" className="bg-gray-900/60 border-gray-700 text-white" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Preço Médio (R$)</label>
                <Input type="number" value={form.average_price} onChange={e => set('average_price', e.target.value)}
                  placeholder="50" className="bg-gray-900/60 border-gray-700 text-white" />
              </div>
            </div>
          </div>
        </Section>

        {/* Localização */}
        <Section title="Localização" icon="📍">
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Endereço *</label>
              <Input value={form.location.address} onChange={e => setLocation('address', e.target.value)}
                placeholder="Rua, número, bairro"
                className="bg-gray-900/60 border-gray-700 text-white focus:border-cyan-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Cidade *</label>
                <Input value={form.location.city} onChange={e => setLocation('city', e.target.value)}
                  placeholder="São Paulo" className="bg-gray-900/60 border-gray-700 text-white" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Estado</label>
                <Input value={form.location.state} onChange={e => setLocation('state', e.target.value)}
                  placeholder="SP" className="bg-gray-900/60 border-gray-700 text-white" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Bairro</label>
              <Input value={form.location.neighborhood} onChange={e => setLocation('neighborhood', e.target.value)}
                placeholder="Centro, Pinheiros..." className="bg-gray-900/60 border-gray-700 text-white" />
            </div>
            <Button variant="outline" onClick={handleGeocode} size="sm"
              className="border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10 text-xs">
              <MapPin className="w-3.5 h-3.5 mr-1" />
              Obter coordenadas do endereço
            </Button>
            {form.location.lat !== 0 && (
              <p className="text-xs text-green-400">✓ Coordenadas: {form.location.lat.toFixed(4)}, {form.location.lng.toFixed(4)}</p>
            )}
          </div>
        </Section>

        {/* Contato */}
        <Section title="Contato" icon="📞">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block flex items-center gap-1"><Phone className="w-3 h-3" /> Telefone</label>
                <Input value={form.contact.phone} onChange={e => setContact('phone', e.target.value)}
                  placeholder="(11) 99999-9999" className="bg-gray-900/60 border-gray-700 text-white" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block flex items-center gap-1"><Mail className="w-3 h-3" /> Email</label>
                <Input value={form.contact.email} onChange={e => setContact('email', e.target.value)}
                  placeholder="contato@local.com" className="bg-gray-900/60 border-gray-700 text-white" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block flex items-center gap-1"><Globe className="w-3 h-3" /> Website</label>
                <Input value={form.contact.website} onChange={e => setContact('website', e.target.value)}
                  placeholder="https://..." className="bg-gray-900/60 border-gray-700 text-white" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block flex items-center gap-1"><Instagram className="w-3 h-3" /> Instagram</label>
                <Input value={form.contact.instagram} onChange={e => setContact('instagram', e.target.value)}
                  placeholder="@perfil" className="bg-gray-900/60 border-gray-700 text-white" />
              </div>
            </div>
          </div>
        </Section>

        {/* Gêneros Musicais */}
        <Section title="Gêneros Musicais" icon="🎵">
          <div className="flex flex-wrap gap-2">
            {GENRES.map(g => (
              <button key={g} onClick={() => toggleGenre(g)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${selectedGenres.includes(g) ? 'text-white' : 'text-gray-500 border border-gray-700 bg-transparent hover:border-gray-500'}`}
                style={selectedGenres.includes(g) ? { background: 'linear-gradient(135deg, #0891b2, #7c3aed)', border: '1px solid rgba(6,182,212,0.5)' } : {}}>
                {g}
              </button>
            ))}
          </div>
        </Section>

        {/* Comodidades */}
        <Section title="Comodidades" icon="✨">
          <div className="flex flex-wrap gap-2">
            {AMENITIES_OPTIONS.map(a => (
              <button key={a} onClick={() => toggleAmenity(a)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${selectedAmenities.includes(a) ? 'text-white' : 'text-gray-400 border border-gray-800 bg-transparent hover:border-gray-600'}`}
                style={selectedAmenities.includes(a) ? { background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.4)' } : {}}>
                {selectedAmenities.includes(a) && <Check className="w-3 h-3 text-cyan-400" />}
                {a}
              </button>
            ))}
          </div>
        </Section>

        {/* Horários */}
        <Section title="Horários de Funcionamento" icon="🕐">
          <div className="space-y-2">
            {DAYS.map((day, i) => (
              <div key={day} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-14 flex-shrink-0">{DAY_LABELS[i]}</span>
                <Input
                  value={form.opening_hours[day] || ""}
                  onChange={e => setHours(day, e.target.value)}
                  placeholder="Ex: 23:00 - 06:00 ou Fechado"
                  className="bg-gray-900/60 border-gray-700 text-white text-xs h-8 focus:border-cyan-500"
                />
              </div>
            ))}
          </div>
        </Section>

        {/* Botão Salvar */}
        <motion.div whileTap={{ scale: 0.97 }}>
          <Button onClick={handleSave} disabled={saving || saved} className="w-full h-12 text-base font-bold rounded-xl"
            style={{ background: saved ? 'linear-gradient(135deg, #16a34a, #15803d)' : 'linear-gradient(135deg, #0891b2, #7c3aed)', boxShadow: '0 0 30px rgba(6,182,212,0.4)' }}>
            {saving ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Salvando...</>
             : saved ? <><Check className="w-5 h-5 mr-2" /> Cadastrado com sucesso!</>
             : <><Building2 className="w-5 h-5 mr-2" /> Cadastrar Estabelecimento</>}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div className="rounded-xl border p-4" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(6,182,212,0.12)' }}>
      <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
        <span>{icon}</span>
        {title}
      </h2>
      {children}
    </div>
  );
}