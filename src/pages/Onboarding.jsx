import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, ArrowRight, X, Check, Sparkles, Navigation } from "lucide-react";

const EXPERIENCE_CATEGORIES = [
  { id: "musica", label: "Música", emoji: "🎵" },
  { id: "eletronica", label: "Eletrônica", emoji: "🎧" },
  { id: "shows", label: "Shows", emoji: "🎤" },
  { id: "cultura", label: "Cultura", emoji: "🎭" },
  { id: "gastronomia", label: "Gastronomia", emoji: "🍔" },
  { id: "arte", label: "Arte", emoji: "🎨" },
  { id: "urbano", label: "Experiências urbanas", emoji: "🏙️" },
  { id: "noturna", label: "Vida noturna", emoji: "🌙" },
  { id: "esportes", label: "Esportes", emoji: "🏄" },
  { id: "festas", label: "Festas", emoji: "🎉" },
  { id: "exclusivos", label: "Eventos exclusivos", emoji: "🔒" },
];

const POPULAR_CITIES = [
  "São Paulo", "Rio de Janeiro", "Belo Horizonte", "Brasília",
  "Curitiba", "Porto Alegre", "Salvador", "Recife", "Fortaleza", "Florianópolis",
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0);

  const [selectedCategories, setSelectedCategories] = useState([]);
  const [cityInput, setCityInput] = useState("");
  const [selectedCities, setSelectedCities] = useState([]);
  const [locationGranted, setLocationGranted] = useState(false);
  const [locationError, setLocationError] = useState("");

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const userData = await base44.auth.me();
      if (userData.onboarding_completed) {
        navigate(createPageUrl("Mapa"));
        return;
      }
    } catch (error) {
      navigate(createPageUrl("BemVindo"));
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (id) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const addCity = () => {
    const trimmed = cityInput.trim();
    if (trimmed && !selectedCities.includes(trimmed)) {
      setSelectedCities((prev) => [...prev, trimmed]);
      setCityInput("");
    }
  };

  const togglePopularCity = (city) => {
    setSelectedCities((prev) =>
      prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]
    );
  };

  const requestLocation = () => {
    setLocationError("");
    if (!navigator.geolocation) {
      setLocationError("Geolocalização não é suportada neste dispositivo.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationGranted(true);
      },
      (error) => {
        setLocationError("Permissão negada. Você pode ativar depois nas configurações.");
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      const updateData = {
        onboarding_completed: true,
        profile_status: "active",
        terms_accepted_at: new Date().toISOString(),
      };

      if (selectedCategories.length > 0) {
        updateData.experience_preferences = selectedCategories;
      }
      if (selectedCities.length > 0) {
        updateData.favorite_cities = selectedCities;
      }
      if (locationGranted) {
        updateData.location_enabled = true;
      }

      await base44.auth.updateMe(updateData);
      navigate(createPageUrl("Mapa"));
    } catch (error) {
      console.error("Erro ao completar onboarding:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({
        onboarding_completed: true,
        profile_status: "incomplete",
      });
      navigate(createPageUrl("Mapa"));
    } catch (error) {
      console.error("Erro ao pular:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500" />
      </div>
    );
  }

  const totalSteps = 3;
  const progress = ((step + 1) / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-cyan-900/20" />
      <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />

      {/* Skip button — always visible */}
      <button
        onClick={handleSkip}
        disabled={saving}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 text-sm text-gray-500 hover:text-white transition-colors flex items-center gap-1"
      >
        <X className="w-4 h-4" />
        Pular
      </button>

      <div className="relative w-full max-w-lg z-10">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-500">
              Passo {step + 1} de {totalSteps}
            </span>
            <span className="text-xs text-cyan-400">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 0: Welcome + Categories */}
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center"
            >
              <Sparkles className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                Bem-vindo ao SUBLINX
              </h1>
              <p className="text-gray-400 mb-8 text-sm sm:text-base">
                Que tipo de experiência você procura?
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-8">
                {EXPERIENCE_CATEGORIES.map((cat) => {
                  const selected = selectedCategories.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => toggleCategory(cat.id)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all ${
                        selected
                          ? "bg-cyan-500/20 border-cyan-500 text-white"
                          : "bg-gray-900/50 border-gray-800 text-gray-400 hover:border-gray-600"
                      }`}
                    >
                      <span className="text-2xl">{cat.emoji}</span>
                      <span className="text-xs font-medium">{cat.label}</span>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setStep(1)}
                className="w-full h-14 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #0d4f4f 0%, #00b894 100%)" }}
              >
                Continuar
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {/* Step 1: Locations */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center"
            >
              <MapPin className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                Quais lugares você frequenta?
              </h1>
              <p className="text-gray-400 mb-6 text-sm sm:text-base">
                Selecione as cidades que você costuma frequentar.
              </p>

              {/* Selected cities */}
              {selectedCities.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4 justify-center">
                  {selectedCities.map((city) => (
                    <span
                      key={city}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-white text-sm"
                    >
                      {city}
                      <button
                        onClick={() => togglePopularCity(city)}
                        className="text-purple-300 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* City input */}
              <div className="flex gap-2 mb-6">
                <input
                  type="text"
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCity())}
                  placeholder="Digite uma cidade..."
                  className="flex-1 h-12 rounded-2xl bg-gray-900/60 border border-gray-700 text-white text-sm px-4 focus:outline-none focus:border-cyan-500 transition-colors"
                />
                <button
                  onClick={addCity}
                  className="h-12 px-5 rounded-2xl font-bold text-white text-sm transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #0d4f4f 0%, #00b894 100%)" }}
                >
                  Adicionar
                </button>
              </div>

              {/* Popular cities */}
              <p className="text-xs text-gray-500 mb-2 text-left">Cidades populares:</p>
              <div className="flex flex-wrap gap-2 mb-8 justify-center">
                {POPULAR_CITIES.map((city) => {
                  const selected = selectedCities.includes(city);
                  return (
                    <button
                      key={city}
                      onClick={() => togglePopularCity(city)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                        selected
                          ? "bg-purple-500/20 border-purple-500 text-white"
                          : "bg-gray-900/50 border-gray-800 text-gray-400 hover:border-gray-600"
                      }`}
                    >
                      {city}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(0)}
                  className="h-14 px-6 rounded-2xl font-semibold text-gray-300 text-base border border-gray-700 hover:bg-gray-800 transition-all"
                >
                  Voltar
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 h-14 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #0d4f4f 0%, #00b894 100%)" }}
                >
                  Continuar
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Location permission */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center"
            >
              <Navigation className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                Descubra o que está acontecendo perto de você
              </h1>
              <p className="text-gray-400 mb-8 text-sm sm:text-base">
                Ative sua localização para receber eventos próximos e relevantes. Você pode desativar quando quiser.
              </p>

              {/* Location status */}
              {locationGranted ? (
                <div className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-green-500/10 border border-green-500/30 text-green-400 mb-6">
                  <Check className="w-5 h-5" />
                  <span className="text-sm font-medium">Localização ativada</span>
                </div>
              ) : (
                <button
                  onClick={requestLocation}
                  className="w-full h-14 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 mb-3 transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #0d4f4f 0%, #00b894 100%)" }}
                >
                  <MapPin className="w-5 h-5" />
                  Ativar localização
                </button>
              )}

              {locationError && (
                <p className="text-yellow-400 text-xs mb-4">{locationError}</p>
              )}

              <p className="text-xs text-gray-600 mb-8">
                Ou pule esta etapa — você pode ativar depois nas configurações.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="h-14 px-6 rounded-2xl font-semibold text-gray-300 text-base border border-gray-700 hover:bg-gray-800 transition-all"
                >
                  Voltar
                </button>
                <button
                  onClick={handleComplete}
                  disabled={saving}
                  className="flex-1 h-14 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #0d4f4f 0%, #00b894 100%)" }}
                >
                  {saving ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Concluir
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}