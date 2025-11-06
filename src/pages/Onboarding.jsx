import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  User as UserIcon,
  MapPin,
  Music,
  Bell,
  Shield,
  ArrowRight,
  X,
  Check,
  Eye,
  EyeOff,
  Upload,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Onboarding() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [skipping, setSkipping] = useState(false);
  
  // Dados do perfil (todos começam vazios/null)
  const [profileData, setProfileData] = useState({
    display_name: "",
    bio: "",
    avatar_url: "",
    music_preferences: [],
    location: {
      city: "",
      share_location: false
    },
    notification_preferences: {
      event_alerts: false,
      surprise_events: false,
      level_notifications: false,
      chat_messages: false,
      email: false,
      push: false
    },
    privacy_settings: {
      profile_visible: false,
      show_email: false,
      show_location: false,
      show_events_attended: false,
      allow_messages_from: "nobody",
      discoverable: false
    },
    gdpr_consent: false
  });

  const totalSteps = 5;
  const genres = ["techno", "house", "trance", "funk", "trap", "dubstep", "drum_bass", "ambient"];

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const userData = await base44.auth.me();
      
      // Se já completou onboarding, redirecionar
      if (userData.onboarding_completed) {
        navigate(createPageUrl("Mapa"));
        return;
      }
      
      setUser(userData);
    } catch (error) {
      navigate(createPageUrl("BemVindo"));
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setSkipping(true);
    try {
      // Salvar apenas que pulou onboarding - mantém defaults
      await base44.auth.updateMe({
        onboarding_completed: true,
        profile_status: "incomplete",
        // NÃO preencher nenhum outro campo
      });
      
      navigate(createPageUrl("Mapa"));
    } catch (error) {
      console.error("Erro ao pular:", error);
      alert("Erro. Tente novamente.");
    } finally {
      setSkipping(false);
    }
  };

  const handleComplete = async () => {
    if (!profileData.gdpr_consent) {
      alert("Por favor, aceite os termos de privacidade para continuar.");
      return;
    }

    setLoading(true);
    try {
      // Salvar APENAS os campos que o usuário preencheu
      const updateData = {
        onboarding_completed: true,
        profile_status: "active",
        gdpr_consent: true,
        terms_accepted_at: new Date().toISOString()
      };

      // Adicionar apenas campos não-vazios
      if (profileData.display_name.trim()) {
        updateData.display_name = profileData.display_name.trim();
      }
      if (profileData.bio.trim()) {
        updateData.bio = profileData.bio.trim();
      }
      if (profileData.avatar_url) {
        updateData.avatar_url = profileData.avatar_url;
      }
      if (profileData.music_preferences.length > 0) {
        updateData.music_preferences = profileData.music_preferences;
      }
      if (profileData.location.city.trim()) {
        updateData.location = {
          city: profileData.location.city.trim(),
          share_location: profileData.location.share_location
        };
      }

      // Salvar preferências (opt-in explícito)
      updateData.notification_preferences = profileData.notification_preferences;
      updateData.privacy_settings = profileData.privacy_settings;

      await base44.auth.updateMe(updateData);
      
      navigate(createPageUrl("Mapa"));
    } catch (error) {
      console.error("Erro ao completar perfil:", error);
      alert("Erro ao salvar perfil. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setProfileData(prev => ({ ...prev, avatar_url: file_url }));
    } catch (error) {
      console.error("Erro no upload:", error);
      alert("Falha no upload da imagem.");
    }
  };

  const toggleGenre = (genre) => {
    setProfileData(prev => ({
      ...prev,
      music_preferences: prev.music_preferences.includes(genre)
        ? prev.music_preferences.filter(g => g !== genre)
        : [...prev.music_preferences, genre]
    }));
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900/20 flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMTIxMjEiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>

      <div className="relative w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">
              Passo {step} de {totalSteps}
            </span>
            <span className="text-sm text-cyan-400">
              {Math.round((step / totalSteps) * 100)}% completo
            </span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${(step / totalSteps) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Bem-vindo */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="bg-gray-900/90 border-gray-700">
                <CardContent className="p-8 text-center">
                  <Sparkles className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
                  <h1 className="text-3xl font-bold text-white mb-4">
                    Bem-vindo ao SUBLYNX!
                  </h1>
                  <p className="text-gray-300 mb-6">
                    Vamos configurar seu perfil? Este processo é <strong>completamente opcional</strong>.
                    Você pode pular e completar depois, ou fazer agora.
                  </p>
                  
                  <Alert className="bg-gray-800 border-gray-700 mb-6">
                    <Shield className="h-4 w-4 text-cyan-400" />
                    <AlertDescription className="text-gray-300 text-sm text-left">
                      <strong>Sua privacidade é prioridade:</strong>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Seu perfil começa <strong>privado</strong></li>
                        <li>Notificações <strong>desativadas</strong> por padrão</li>
                        <li>Você controla o que compartilhar</li>
                        <li>Pode apagar tudo a qualquer momento</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <div className="flex gap-4">
                    <Button
                      onClick={handleSkip}
                      disabled={skipping}
                      variant="outline"
                      className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Pular por Agora
                    </Button>
                    <Button
                      onClick={() => setStep(2)}
                      className="flex-1 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700"
                    >
                      Começar
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Perfil Básico (OPCIONAL) */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="bg-gray-900/90 border-gray-700">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <UserIcon className="w-8 h-8 text-cyan-400" />
                    <div>
                      <h2 className="text-2xl font-bold text-white">Perfil Básico</h2>
                      <p className="text-gray-400 text-sm">Opcional - você pode preencher depois</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Avatar */}
                    <div className="text-center">
                      <label htmlFor="avatar-upload" className="cursor-pointer">
                        {profileData.avatar_url ? (
                          <img
                            src={profileData.avatar_url}
                            alt="Avatar"
                            className="w-24 h-24 rounded-full mx-auto object-cover border-2 border-cyan-500 hover:opacity-70 transition-opacity"
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-full mx-auto bg-gray-800 border-2 border-dashed border-gray-600 flex items-center justify-center hover:border-cyan-500 transition-colors">
                            <Upload className="w-8 h-8 text-gray-500" />
                          </div>
                        )}
                        <p className="text-xs text-gray-400 mt-2">Clique para adicionar foto (opcional)</p>
                      </label>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </div>

                    {/* Nome de Exibição */}
                    <div>
                      <Label className="text-gray-300">Nome de Exibição (opcional)</Label>
                      <Input
                        value={profileData.display_name}
                        onChange={(e) => setProfileData(prev => ({ ...prev, display_name: e.target.value }))}
                        placeholder="Como quer ser chamado?"
                        className="bg-gray-800 border-gray-600 text-white mt-1"
                      />
                    </div>

                    {/* Bio */}
                    <div>
                      <Label className="text-gray-300">Bio (opcional)</Label>
                      <Textarea
                        value={profileData.bio}
                        onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                        placeholder="Conte um pouco sobre você..."
                        className="bg-gray-800 border-gray-600 text-white mt-1 h-20"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 mt-8">
                    <Button
                      onClick={() => setStep(1)}
                      variant="outline"
                      className="border-gray-600 text-gray-300"
                    >
                      Voltar
                    </Button>
                    <Button
                      onClick={() => setStep(3)}
                      className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                    >
                      Próximo
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Preferências Musicais (OPCIONAL) */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="bg-gray-900/90 border-gray-700">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Music className="w-8 h-8 text-purple-400" />
                    <div>
                      <h2 className="text-2xl font-bold text-white">Gêneros Favoritos</h2>
                      <p className="text-gray-400 text-sm">Opcional - selecione os estilos que você curte</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {genres.map(genre => (
                      <Button
                        key={genre}
                        onClick={() => toggleGenre(genre)}
                        variant="outline"
                        className={`h-20 flex-col gap-2 capitalize ${
                          profileData.music_preferences.includes(genre)
                            ? "bg-purple-600 border-purple-500 text-white"
                            : "bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
                        }`}
                      >
                        <Music className="w-6 h-6" />
                        {genre}
                      </Button>
                    ))}
                  </div>

                  <div className="flex gap-4 mt-8">
                    <Button
                      onClick={() => setStep(2)}
                      variant="outline"
                      className="border-gray-600 text-gray-300"
                    >
                      Voltar
                    </Button>
                    <Button
                      onClick={() => setStep(4)}
                      className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                    >
                      Próximo
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 4: Notificações (OPT-IN) */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="bg-gray-900/90 border-gray-700">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Bell className="w-8 h-8 text-yellow-400" />
                    <div>
                      <h2 className="text-2xl font-bold text-white">Notificações</h2>
                      <p className="text-gray-400 text-sm">Escolha o que deseja receber (tudo desativado por padrão)</p>
                    </div>
                  </div>

                  <Alert className="bg-yellow-900/20 border-yellow-500/30 mb-6">
                    <Bell className="h-4 w-4 text-yellow-400" />
                    <AlertDescription className="text-yellow-200 text-sm">
                      Você sempre pode alterar estas configurações depois
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    {[
                      { key: 'event_alerts', label: 'Alertas de novos eventos', icon: '🎉' },
                      { key: 'surprise_events', label: 'Eventos surpresa próximos', icon: '✨' },
                      { key: 'level_notifications', label: 'Conquistas e níveis', icon: '🏆' },
                      { key: 'chat_messages', label: 'Mensagens de chat', icon: '💬' },
                      { key: 'email', label: 'Notificações por email', icon: '📧' },
                      { key: 'push', label: 'Notificações push', icon: '🔔' },
                    ].map(({ key, label, icon }) => (
                      <div key={key} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{icon}</span>
                          <Label htmlFor={key} className="text-gray-200">{label}</Label>
                        </div>
                        <Switch
                          id={key}
                          checked={profileData.notification_preferences[key]}
                          onCheckedChange={(checked) => setProfileData(prev => ({
                            ...prev,
                            notification_preferences: {
                              ...prev.notification_preferences,
                              [key]: checked
                            }
                          }))}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-4 mt-8">
                    <Button
                      onClick={() => setStep(3)}
                      variant="outline"
                      className="border-gray-600 text-gray-300"
                    >
                      Voltar
                    </Button>
                    <Button
                      onClick={() => setStep(5)}
                      className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                    >
                      Próximo
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 5: Privacidade (OPT-IN) */}
          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="bg-gray-900/90 border-gray-700">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Shield className="w-8 h-8 text-green-400" />
                    <div>
                      <h2 className="text-2xl font-bold text-white">Privacidade</h2>
                      <p className="text-gray-400 text-sm">Controle quem pode ver suas informações</p>
                    </div>
                  </div>

                  <Alert className="bg-green-900/20 border-green-500/30 mb-6">
                    <Shield className="h-4 w-4 text-green-400" />
                    <AlertDescription className="text-green-200 text-sm">
                      Seu perfil está <strong>privado por padrão</strong>. Ative apenas o que desejar compartilhar.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4 mb-6">
                    {[
                      { key: 'profile_visible', label: 'Perfil público visível', icon: <Eye className="w-5 h-5" /> },
                      { key: 'discoverable', label: 'Aparecer em buscas', icon: <UserIcon className="w-5 h-5" /> },
                      { key: 'show_location', label: 'Mostrar localização', icon: <MapPin className="w-5 h-5" /> },
                      { key: 'show_events_attended', label: 'Mostrar eventos participados', icon: <Music className="w-5 h-5" /> },
                    ].map(({ key, label, icon }) => (
                      <div key={key} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {icon}
                          <Label htmlFor={key} className="text-gray-200">{label}</Label>
                        </div>
                        <Switch
                          id={key}
                          checked={profileData.privacy_settings[key]}
                          onCheckedChange={(checked) => setProfileData(prev => ({
                            ...prev,
                            privacy_settings: {
                              ...prev.privacy_settings,
                              [key]: checked
                            }
                          }))}
                        />
                      </div>
                    ))}
                  </div>

                  {/* GDPR Consent */}
                  <div className="p-4 bg-gray-800 rounded-lg border border-gray-700 mb-6">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="gdpr"
                        checked={profileData.gdpr_consent}
                        onChange={(e) => setProfileData(prev => ({ ...prev, gdpr_consent: e.target.checked }))}
                        className="mt-1"
                      />
                      <Label htmlFor="gdpr" className="text-gray-300 text-sm cursor-pointer">
                        Li e aceito os <a href="#" className="text-cyan-400 hover:underline">Termos de Uso</a> e a{' '}
                        <a href="#" className="text-cyan-400 hover:underline">Política de Privacidade</a>.
                        Entendo que posso apagar minha conta e dados a qualquer momento.
                      </Label>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      onClick={() => setStep(4)}
                      variant="outline"
                      className="border-gray-600 text-gray-300"
                    >
                      Voltar
                    </Button>
                    <Button
                      onClick={handleComplete}
                      disabled={!profileData.gdpr_consent || loading}
                      className="flex-1 bg-gradient-to-r from-green-600 to-cyan-600 hover:from-green-700 hover:to-cyan-700"
                    >
                      {loading ? "Salvando..." : "Concluir"}
                      <Check className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Skip Button (sempre visível) */}
        {step > 1 && (
          <div className="text-center mt-4">
            <Button
              onClick={handleSkip}
              disabled={skipping}
              variant="ghost"
              className="text-gray-400 hover:text-white"
            >
              {skipping ? "Pulando..." : "Pular e Completar Depois"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}