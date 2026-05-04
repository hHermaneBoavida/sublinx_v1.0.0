import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Building2, MapPin, Phone, Mail, Globe, Instagram, Check, Loader2, ChevronRight, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const VENUE_TYPES = [
  { value: "bar", label: "Bar", emoji: "🍸" },
  { value: "discoteca", label: "Discoteca", emoji: "🪩" },
  { value: "restaurante", label: "Restaurante", emoji: "🍽️" },
  { value: "cafe", label: "Café", emoji: "☕" },
  { value: "lounge_bar", label: "Lounge Bar", emoji: "🛋️" },
  { value: "pub", label: "Pub", emoji: "🍺" },
  { value: "club", label: "Club / Balada", emoji: "🎉" },
  { value: "padaria", label: "Padaria", emoji: "🥐" },
  { value: "warehouse", label: "Warehouse", emoji: "🏭" },
  { value: "rooftop", label: "Rooftop", emoji: "🏙️" },
  { value: "studio", label: "Estúdio", emoji: "🎧" },
  { value: "gallery", label: "Galeria / Arte", emoji: "🎨" },
  { value: "underground_space", label: "Underground", emoji: "⚡" },
  { value: "cultural_center", label: "Centro Cultural", emoji: "🎭" },
];

const GENRES = ["techno", "house", "trance", "drum & bass", "funk", "trap", "hip hop", "reggae", "ambient", "experimental", "afrobeat", "jazz"];

const AMENITIES = ["Bar", "Fumódromo", "Área externa", "Pista de dança", "VIP", "DJ Booth", "Estacionamento", "Acessível", "Vestiário", "Segurança 24h", "Open bar", "Lounge privativo"];

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

const STEPS = ["Tipo", "Básico", "Localização", "Contato", "Extras"];

export default function CadastrarEstabelecimento() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);

  const [form, setForm] = useState({
    name: "", description: "", type: "",
    location: { lat: 0, lng: 0, address: "", city: "", state: "", neighborhood: "" },
    contact: { phone: "", email: "", website: "", instagram: "" },
    capacity: "", average_price: "",
    opening_hours: {},
  });

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));
  const setLocation = (field, value) => setForm(f => ({ ...f, location: { ...f.location, [field]: value } }));
  const setContact = (field, value) => setForm(f => ({ ...f, contact: { ...f.contact, [field]: value } }));
  const setHours = (day, value) => setForm(f => ({ ...f, opening_hours: { ...f.opening_hours, [day]: value } }));
  const toggleGenre = (g) => setSelectedGenres(p => p.includes(g) ? p.filter(x => x !== g) : [...p, g]);
  const toggleAmenity = (a) => setSelectedAmenities(p => p.includes(a) ? p.filter(x => x !== a) : [...p, a]);

  const handleGeocode = async () => {
    const addr = `${form.location.address}, ${form.location.city}, Brasil`;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addr)}&limit=1`);
      const data = await res.json();
      if (data[0]) setForm(f => ({ ...f, location: { ...f.location, lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) } }));
    } catch {}
  };

  const canNext = () => {
    if (step === 0) return !!form.type;
    if (step === 1) return !!form.name;
    if (step === 2) return !!form.location.address && !!form.location.city;
    return true;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.Venue.create({
        ...form,
        genres: selectedGenres,
        amenities: selectedAmenities,
        capacity: form.capacity ? Number(form.capacity) : undefined,
        average_price: form.average_price ? Number(form.average_price) : undefined,
        verified: false, rating: 0, total_reviews: 0, upcoming_events_count: 0,
      });
      queryClient.invalidateQueries(['venues']);
      setSaved(true);
      setTimeout(() => navigate(createPageUrl("MeusEstabelecimentos")), 1500);
    } catch {
      alert("Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 px-4 py-3 border-b flex items-center gap-3"
        style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(16px)', borderColor: 'rgba(6,182,212,0.15)' }}>
        <button onClick={() => step > 0 ? setStep(s => s - 1) : navigate(-1)} className="text-cyan-400 hover:text-cyan-300 p-1 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-bold" style={{ background: 'linear-gradient(to right, #22d3ee, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Cadastrar Estabelecimento
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">{STEPS[step]} — passo {step + 1} de {STEPS.length}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-gray-900">
        <motion.div className="h-full" animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }} transition={{ duration: 0.4 }}
          style={{ background: 'linear-gradient(to right, #06b6d4, #a855f7)' }} />
      </div>

      {/* Step dots */}
      <div className="flex items-center justify-center gap-2 py-3 px-4">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex items-center justify-center rounded-full text-[10px] font-bold transition-all ${i < step ? 'w-5 h-5 text-white' : i === step ? 'w-6 h-6 text-white' : 'w-5 h-5 text-gray-600'}`}
              style={{
                background: i < step ? 'linear-gradient(135deg, #06b6d4, #7c3aed)' :
                  i === step ? 'linear-gradient(135deg, #0891b2, #7c3aed)' : 'rgba(255,255,255,0.05)',
                border: i === step ? '1.5px solid rgba(6,182,212,0.6)' : 'none',
                boxShadow: i === step ? '0 0 12px rgba(6,182,212,0.4)' : 'none'
              }}>
              {i < step ? <Check className="w-3 h-3" /> : i + 1}
            </div>
            {i < STEPS.length - 1 && <div className="w-4 h-px" style={{ background: i < step ? 'rgba(6,182,212,0.5)' : 'rgba(255,255,255,0.08)' }} />}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="flex-1 max-w-lg mx-auto w-full px-4 pb-6">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>

            {/* STEP 0 - Tipo */}
            {step === 0 && (
              <div className="space-y-3 pt-2">
                <p className="text-gray-400 text-sm mb-4">Qual tipo de espaço você vai cadastrar?</p>
                <div className="grid grid-cols-2 gap-3">
                  {VENUE_TYPES.map(t => (
                    <button key={t.value} onClick={() => { set('type', t.value); setTimeout(() => setStep(1), 150); }}
                      className="rounded-xl p-4 text-left transition-all border"
                      style={{
                        background: form.type === t.value ? 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(168,85,247,0.2))' : 'rgba(255,255,255,0.03)',
                        borderColor: form.type === t.value ? 'rgba(6,182,212,0.5)' : 'rgba(255,255,255,0.07)',
                        boxShadow: form.type === t.value ? '0 0 20px rgba(6,182,212,0.25)' : 'none'
                      }}>
                      <div className="text-2xl mb-2">{t.emoji}</div>
                      <div className="text-sm font-semibold text-white">{t.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 1 - Básico */}
            {step === 1 && (
              <div className="space-y-4 pt-2">
                <p className="text-gray-400 text-sm mb-4">Informações principais do seu espaço</p>
                <Field label="Nome do Estabelecimento *">
                  <Input value={form.name} onChange={e => set('name', e.target.value)}
                    placeholder="Ex: Club Void, Bar da Cena, Lounge 404..."
                    className="bg-gray-900/60 border-gray-800 text-white focus:border-cyan-500 h-11" autoFocus />
                </Field>
                <Field label="Descrição">
                  <Textarea value={form.description} onChange={e => set('description', e.target.value)}
                    placeholder="Conte sobre o ambiente, proposta musical, história do espaço..."
                    className="bg-gray-900/60 border-gray-800 text-white focus:border-cyan-500 h-24 resize-none" />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Capacidade">
                    <Input type="number" value={form.capacity} onChange={e => set('capacity', e.target.value)}
                      placeholder="300" className="bg-gray-900/60 border-gray-800 text-white h-11" />
                  </Field>
                  <Field label="Preço Médio (R$)">
                    <Input type="number" value={form.average_price} onChange={e => set('average_price', e.target.value)}
                      placeholder="40" className="bg-gray-900/60 border-gray-800 text-white h-11" />
                  </Field>
                </div>
              </div>
            )}

            {/* STEP 2 - Localização */}
            {step === 2 && (
              <div className="space-y-4 pt-2">
                <p className="text-gray-400 text-sm mb-4">Onde fica o seu estabelecimento?</p>
                <Field label="Endereço *">
                  <Input value={form.location.address} onChange={e => setLocation('address', e.target.value)}
                    placeholder="Rua Augusta, 1500" className="bg-gray-900/60 border-gray-800 text-white focus:border-cyan-500 h-11" autoFocus />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Cidade *">
                    <Input value={form.location.city} onChange={e => setLocation('city', e.target.value)}
                      placeholder="São Paulo" className="bg-gray-900/60 border-gray-800 text-white h-11" />
                  </Field>
                  <Field label="Estado">
                    <Input value={form.location.state} onChange={e => setLocation('state', e.target.value)}
                      placeholder="SP" maxLength={2} className="bg-gray-900/60 border-gray-800 text-white h-11" />
                  </Field>
                </div>
                <Field label="Bairro">
                  <Input value={form.location.neighborhood} onChange={e => setLocation('neighborhood', e.target.value)}
                    placeholder="Consolação, Pinheiros..." className="bg-gray-900/60 border-gray-800 text-white h-11" />
                </Field>
                <Button variant="outline" onClick={handleGeocode} size="sm"
                  className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 text-xs h-9 w-full">
                  <MapPin className="w-3.5 h-3.5 mr-1.5" />
                  Localizar coordenadas automaticamente
                </Button>
                {form.location.lat !== 0 && (
                  <p className="text-xs text-green-400 text-center flex items-center justify-center gap-1">
                    <Check className="w-3 h-3" /> Coordenadas detectadas
                  </p>
                )}
              </div>
            )}

            {/* STEP 3 - Contato */}
            {step === 3 && (
              <div className="space-y-4 pt-2">
                <p className="text-gray-400 text-sm mb-4">Como o público pode entrar em contato?</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Telefone / WhatsApp">
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-3.5 h-3.5 text-gray-500" />
                      <Input value={form.contact.phone} onChange={e => setContact('phone', e.target.value)}
                        placeholder="(11) 99999-9999" className="bg-gray-900/60 border-gray-800 text-white pl-9 h-11" />
                    </div>
                  </Field>
                  <Field label="Email">
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-3.5 h-3.5 text-gray-500" />
                      <Input value={form.contact.email} onChange={e => setContact('email', e.target.value)}
                        placeholder="contato@..." className="bg-gray-900/60 border-gray-800 text-white pl-9 h-11" />
                    </div>
                  </Field>
                  <Field label="Instagram">
                    <div className="relative">
                      <Instagram className="absolute left-3 top-3 w-3.5 h-3.5 text-gray-500" />
                      <Input value={form.contact.instagram} onChange={e => setContact('instagram', e.target.value)}
                        placeholder="@perfil" className="bg-gray-900/60 border-gray-800 text-white pl-9 h-11" />
                    </div>
                  </Field>
                  <Field label="Website">
                    <div className="relative">
                      <Globe className="absolute left-3 top-3 w-3.5 h-3.5 text-gray-500" />
                      <Input value={form.contact.website} onChange={e => setContact('website', e.target.value)}
                        placeholder="https://..." className="bg-gray-900/60 border-gray-800 text-white pl-9 h-11" />
                    </div>
                  </Field>
                </div>
              </div>
            )}

            {/* STEP 4 - Extras */}
            {step === 4 && (
              <div className="space-y-5 pt-2">
                <div>
                  <p className="text-sm font-semibold text-white mb-2">🎵 Gêneros Musicais</p>
                  <div className="flex flex-wrap gap-2">
                    {GENRES.map(g => (
                      <button key={g} onClick={() => toggleGenre(g)}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all border"
                        style={{
                          background: selectedGenres.includes(g) ? 'linear-gradient(135deg, #0891b2, #7c3aed)' : 'transparent',
                          borderColor: selectedGenres.includes(g) ? 'rgba(6,182,212,0.5)' : 'rgba(255,255,255,0.1)',
                          color: selectedGenres.includes(g) ? '#fff' : '#9ca3af'
                        }}>
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-white mb-2">✨ Comodidades</p>
                  <div className="flex flex-wrap gap-2">
                    {AMENITIES.map(a => (
                      <button key={a} onClick={() => toggleAmenity(a)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all border flex items-center gap-1"
                        style={{
                          background: selectedAmenities.includes(a) ? 'rgba(6,182,212,0.12)' : 'transparent',
                          borderColor: selectedAmenities.includes(a) ? 'rgba(6,182,212,0.4)' : 'rgba(255,255,255,0.08)',
                          color: selectedAmenities.includes(a) ? '#22d3ee' : '#6b7280'
                        }}>
                        {selectedAmenities.includes(a) && <Check className="w-3 h-3" />}
                        {a}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-white mb-2">🕐 Horários de Funcionamento</p>
                  <div className="space-y-2">
                    {DAYS.map((day, i) => (
                      <div key={day} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-8 flex-shrink-0">{DAY_LABELS[i]}</span>
                        <Input value={form.opening_hours[day] || ""} onChange={e => setHours(day, e.target.value)}
                          placeholder="23:00 - 06:00" className="bg-gray-900/60 border-gray-800 text-white text-xs h-8 focus:border-cyan-500" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom navigation */}
      <div className="sticky bottom-0 px-4 py-3 border-t flex gap-3"
        style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(16px)', borderColor: 'rgba(6,182,212,0.1)' }}>
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep(s => s + 1)} disabled={!canNext()} className="flex-1 h-12 text-base font-bold rounded-xl"
            style={{ background: canNext() ? 'linear-gradient(135deg, #0891b2, #7c3aed)' : undefined, boxShadow: canNext() ? '0 0 24px rgba(6,182,212,0.35)' : undefined }}>
            Continuar <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <motion.div className="flex-1" whileTap={{ scale: 0.97 }}>
            <Button onClick={handleSave} disabled={saving || saved} className="w-full h-12 text-base font-bold rounded-xl"
              style={{ background: saved ? 'linear-gradient(135deg, #16a34a, #15803d)' : 'linear-gradient(135deg, #0891b2, #7c3aed)', boxShadow: '0 0 30px rgba(6,182,212,0.4)' }}>
              {saving ? <><Loader2 className="w-5 h-5 animate-spin mr-2" />Salvando...</>
                : saved ? <><Check className="w-5 h-5 mr-2" />Cadastrado com sucesso!</>
                : <><Building2 className="w-5 h-5 mr-2" />Finalizar Cadastro</>}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs text-gray-500 mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}