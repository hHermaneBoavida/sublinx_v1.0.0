import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Calendar, MapPin, Upload, Loader2, Trash2, Ticket,
  ChevronRight, ChevronLeft, Check, Sparkles, DollarSign,
  Users, Clock, Image as ImageIcon, Info, AlertCircle, CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Componente para capturar cliques no mapa
function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition({
        lat: e.latlng.lat,
        lng: e.latlng.lng
      });
    },
  });

  return position ? <Marker position={[position.lat, position.lng]} /> : null;
}

const STEPS = [
  { id: 1, name: "Básico", icon: Sparkles },
  { id: 2, name: "Localização", icon: MapPin },
  { id: 3, name: "Ingressos", icon: Ticket },
  { id: 4, name: "Avançado", icon: Users },
  { id: 5, name: "Revisar", icon: Check }
];

export default function CriarEvento() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    // Etapa 1: Básico
    title: "",
    description: "",
    genre: "",
    type: "",
    image_url: "",
    date: "",
    duration_hours: 6,
    
    // Etapa 2: Localização
    location: {
      venue_name: "",
      address: "",
      city: "",
      state: "",
      postal_code: "",
      is_secret: false,
      lat: -23.5505,
      lng: -46.6333
    },
    
    // Etapa 3: Ingressos
    ticket_types: [
      { 
        name: 'Pista', 
        price: 50.00, 
        quantity: 100,
        description: '',
        early_bird_price: null,
        early_bird_until: null
      }
    ],
    
    // Etapa 4: Avançado
    max_capacity: 100,
    vibe_tags: [],
    minimum_level: 1,
    requires_approval: true,
    is_secret: false,
    allow_waitlist: true,
    refund_policy: "flexible",
    age_restriction: "18+",
    community_id: null
  });

  const [userCommunities, setUserCommunities] = useState([]);

  useEffect(() => {
    checkOrganizerAccess();
  }, []);

  const checkOrganizerAccess = async () => {
    try {
      const userData = await base44.auth.me();
      if (!userData.is_organizer) {
        navigate(createPageUrl("Planos"));
        return;
      }
      setUser(userData);
      loadUserCommunities(userData);
    } catch (error) {
      navigate(createPageUrl("BemVindo"));
    }
  };

  const loadUserCommunities = async (userData) => {
    try {
      if (!userData) return;
      
      const memberships = await base44.entities.CommunityMember.filter({ 
        user_id: userData.id,
        role: { $in: ['admin', 'moderator'] }
      });
      
      if (memberships.length > 0) {
        const communityIds = memberships.map(m => m.community_id);
        const communities = await base44.entities.Community.filter({ 
          id: { $in: communityIds } 
        });
        setUserCommunities(communities);
      }
    } catch (error) {
      console.error('Erro ao carregar comunidades:', error);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    // Limpar erro do campo
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, image_url: file_url }));
    } catch (error) {
      console.error("Erro no upload:", error);
      alert("❌ Falha no upload da imagem.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleTicketTypeChange = (index, field, value) => {
    const newTicketTypes = [...formData.ticket_types];
    newTicketTypes[index][field] = field === 'price' || field === 'quantity' || field === 'early_bird_price' 
      ? parseFloat(value) || 0 
      : value;
    setFormData(prev => ({ ...prev, ticket_types: newTicketTypes }));
  };

  const addTicketType = () => {
    setFormData(prev => ({
      ...prev,
      ticket_types: [
        ...prev.ticket_types, 
        { 
          name: '', 
          price: 0, 
          quantity: 50,
          description: '',
          early_bird_price: null,
          early_bird_until: null
        }
      ]
    }));
  };

  const removeTicketType = (index) => {
    const newTicketTypes = formData.ticket_types.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, ticket_types: newTicketTypes }));
  };

  const handleVibeTagsChange = (value) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag);
    setFormData(prev => ({ ...prev, vibe_tags: tags }));
  };

  // Validação por etapa
  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.title) newErrors.title = "Título é obrigatório";
      if (!formData.genre) newErrors.genre = "Gênero é obrigatório";
      if (!formData.type) newErrors.type = "Tipo é obrigatório";
      if (!formData.image_url) newErrors.image_url = "Imagem é obrigatória";
      if (!formData.date) newErrors.date = "Data é obrigatória";
    }

    if (step === 2) {
      if (!formData.location.venue_name) newErrors.venue_name = "Nome do local é obrigatório";
      if (!formData.location.address) newErrors.address = "Endereço é obrigatório";
      if (!formData.location.city) newErrors.city = "Cidade é obrigatória";
    }

    if (step === 3) {
      if (formData.ticket_types.length === 0) {
        newErrors.tickets = "Configure pelo menos um tipo de ingresso";
      } else {
        formData.ticket_types.forEach((ticket, index) => {
          if (!ticket.name) newErrors[`ticket_${index}_name`] = "Nome é obrigatório";
          if (ticket.price <= 0) newErrors[`ticket_${index}_price`] = "Preço inválido";
          if (ticket.quantity <= 0) newErrors[`ticket_${index}_quantity`] = "Quantidade inválida";
        });
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    // Validate all steps before final submission
    const allStepsValid = [1, 2, 3, 4].every(step => validateStep(step));
    if (!allStepsValid) {
      // Find the first step with errors and navigate to it
      for (let i = 1; i <= 4; i++) {
        if (!validateStep(i)) {
          setCurrentStep(i);
          break;
        }
      }
      return;
    }

    setLoading(true);

    try {
      const newEvent = await base44.entities.Event.create({
        ...formData,
        price: formData.ticket_types[0]?.price || 0,
        organizer: user.full_name || user.email.split('@')[0],
        organizer_id: user.id,
        organizer_avatar: user.avatar_url,
        current_attendees: 0,
        // Campos de autenticidade obrigatórios
        source: "organizer",
        trust_level: "pending",
        is_published: false,
        is_expired: false,
        last_validated_at: new Date().toISOString(),
      });

      // Notificar seguidores
      try {
        const followers = await base44.entities.Follow.filter({ following_id: user.id });
        
        if (followers && followers.length > 0) {
          const notificationPromises = followers.map(follower => 
            base44.entities.Notification.create({
              user_id: follower.follower_id,
              type: 'event_alert',
              title: '🎉 Novo Evento!',
              message: `${user.full_name || user.email.split('@')[0]} criou: ${formData.title}`,
              event_id: newEvent.id,
              is_read: false,
              location_match: false,
              genre_match: [formData.genre]
            })
          );

          await Promise.all(notificationPromises);
        }
      } catch (notifError) {
        console.error("Erro ao notificar:", notifError);
      }

      alert(`✅ Evento "${formData.title}" enviado para análise! Será publicado após validação pela equipe SUBLINX.`);
      navigate(createPageUrl("MeusEventos"));
    } catch (error) {
      console.error("Erro ao criar evento:", error);
      alert("❌ Erro ao criar evento. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl("MeusEventos"))}
            className="text-gray-400 hover:text-white mb-4"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Voltar para Meus Eventos
          </Button>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text mb-2">
              Criar Novo Evento
            </h1>
            <p className="text-gray-400">
              Siga os passos para configurar seu evento perfeito
            </p>
          </div>
        </div>

        {/* Progress Stepper */}
        <div className="mb-12 overflow-x-auto pb-2 -mx-4 px-4">
          <div className="flex items-center justify-between min-w-[280px] sm:min-w-0">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;

              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center">
                    <motion.div
                      initial={false}
                      animate={{
                        scale: isCurrent ? 1.1 : 1,
                        backgroundColor: isCompleted 
                          ? '#10b981' 
                          : isCurrent 
                            ? '#06b6d4' 
                            : '#374151'
                      }}
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-2 ${
                        isCurrent ? 'ring-4 ring-cyan-500/30' : ''
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-6 h-6 text-white" />
                      ) : (
                        <Icon className={`w-6 h-6 ${isCurrent ? 'text-white' : 'text-gray-500'}`} />
                      )}
                    </motion.div>
                    <span className={`text-xs font-medium ${
                      isCurrent ? 'text-cyan-400' : isCompleted ? 'text-green-400' : 'text-gray-500'
                    }`}>
                      {step.name}
                    </span>
                  </div>

                  {index < STEPS.length - 1 && (
                    <div className="flex-1 h-0.5 mx-1 sm:mx-2 bg-gray-700 relative">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: isCompleted ? '100%' : '0%' }}
                        className="h-full bg-gradient-to-r from-cyan-500 to-green-500"
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Form Steps */}
        <Card className="bg-gray-900/80 border-gray-700 text-white">
          <CardContent className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* ETAPA 1: BÁSICO */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                      <Sparkles className="w-8 h-8 text-cyan-400" />
                      <h2 className="text-2xl font-bold">Informações Básicas</h2>
                    </div>

                    {/* Título */}
                    <div>
                      <Label className="text-gray-300 mb-2 block">Nome do Evento *</Label>
                      <Input
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder="Ex: Techno Underground Session"
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                      {errors.title && (
                        <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.title}
                        </p>
                      )}
                    </div>

                    {/* Descrição */}
                    <div>
                      <Label className="text-gray-300 mb-2 block">Descrição</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Descreva a experiência que você está criando..."
                        className="bg-gray-800 border-gray-600 text-white h-32"
                      />
                    </div>

                    {/* Imagem */}
                    <div>
                      <Label className="text-gray-300 mb-2 block">Imagem do Evento *</Label>
                      {formData.image_url ? (
                        <div className="relative">
                          <img 
                            src={formData.image_url} 
                            alt="Preview" 
                            className="w-full h-64 object-cover rounded-lg border-2 border-gray-600"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="absolute top-2 right-2 bg-black/70 border-gray-600"
                            onClick={() => setFormData(prev => ({ ...prev, image_url: "" }))}
                          >
                            Alterar
                          </Button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-600 rounded-lg p-12 text-center hover:border-cyan-500 transition-colors cursor-pointer">
                          {uploadingImage ? (
                            <div className="flex flex-col items-center">
                              <Loader2 className="w-12 h-12 animate-spin text-cyan-400 mb-4" />
                              <span className="text-gray-400">Carregando...</span>
                            </div>
                          ) : (
                            <label htmlFor="event-image" className="cursor-pointer">
                              <ImageIcon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                              <p className="text-gray-400 mb-2 font-medium">Clique para adicionar uma imagem</p>
                              <p className="text-sm text-gray-500">PNG, JPG até 10MB</p>
                              <input 
                                id="event-image"
                                type="file" 
                                className="hidden" 
                                accept="image/*"
                                onChange={handleImageUpload}
                              />
                            </label>
                          )}
                        </div>
                      )}
                      {errors.image_url && (
                        <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.image_url}
                        </p>
                      )}
                    </div>

                    {/* Gênero e Tipo */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300 mb-2 block">Gênero Musical *</Label>
                        <Select value={formData.genre} onValueChange={(value) => handleInputChange('genre', value)}>
                          <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                            <SelectValue placeholder="Selecione o gênero" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-600">
                            <SelectItem value="techno">Techno</SelectItem>
                            <SelectItem value="house">House</SelectItem>
                            <SelectItem value="trance">Trance</SelectItem>
                            <SelectItem value="drum_bass">Drum & Bass</SelectItem>
                            <SelectItem value="dubstep">Dubstep</SelectItem>
                            <SelectItem value="experimental">Experimental</SelectItem>
                            <SelectItem value="funk">Funk</SelectItem>
                            <SelectItem value="trap">Trap</SelectItem>
                            <SelectItem value="rap">Rap</SelectItem>
                            <SelectItem value="reggae">Reggae</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.genre && <p className="text-red-400 text-xs mt-1">{errors.genre}</p>}
                      </div>

                      <div>
                        <Label className="text-gray-300 mb-2 block">Tipo de Evento *</Label>
                        <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                          <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-600">
                            <SelectItem value="rave">Rave</SelectItem>
                            <SelectItem value="warehouse">Warehouse</SelectItem>
                            <SelectItem value="rooftop">Rooftop</SelectItem>
                            <SelectItem value="underground">Underground</SelectItem>
                            <SelectItem value="club">Club</SelectItem>
                            <SelectItem value="secret">Secret</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.type && <p className="text-red-400 text-xs mt-1">{errors.type}</p>}
                      </div>
                    </div>

                    {/* Data e Duração */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300 mb-2 block">Data e Hora *</Label>
                        <Input
                          type="datetime-local"
                          value={formData.date}
                          onChange={(e) => handleInputChange('date', e.target.value)}
                          className="bg-gray-800 border-gray-600 text-white"
                        />
                        {errors.date && <p className="text-red-400 text-xs mt-1">{errors.date}</p>}
                      </div>

                      <div>
                        <Label className="text-gray-300 mb-2 block">Duração (horas)</Label>
                        <Input
                          type="number"
                          value={formData.duration_hours}
                          onChange={(e) => handleInputChange('duration_hours', parseInt(e.target.value))}
                          className="bg-gray-800 border-gray-600 text-white"
                          min="1"
                          max="24"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ETAPA 2: LOCALIZAÇÃO */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                      <MapPin className="w-8 h-8 text-purple-400" />
                      <h2 className="text-2xl font-bold">Localização do Evento</h2>
                    </div>

                    {/* Nome do Local */}
                    <div>
                      <Label className="text-gray-300 mb-2 block">Nome do Local *</Label>
                      <Input
                        value={formData.location.venue_name}
                        onChange={(e) => handleInputChange('location.venue_name', e.target.value)}
                        placeholder="Ex: Warehouse 23, Club Underground"
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                      {errors.venue_name && <p className="text-red-400 text-xs mt-1">{errors.venue_name}</p>}
                    </div>

                    {/* Endereço */}
                    <div>
                      <Label className="text-gray-300 mb-2 block">Endereço Completo *</Label>
                      <Input
                        value={formData.location.address}
                        onChange={(e) => handleInputChange('location.address', e.target.value)}
                        placeholder="Rua, número, bairro"
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                      {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address}</p>}
                    </div>

                    {/* Cidade, Estado, CEP */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-gray-300 mb-2 block">Cidade *</Label>
                        <Input
                          value={formData.location.city}
                          onChange={(e) => handleInputChange('location.city', e.target.value)}
                          placeholder="São Paulo"
                          className="bg-gray-800 border-gray-600 text-white"
                        />
                        {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city}</p>}
                      </div>
                      <div>
                        <Label className="text-gray-300 mb-2 block">Estado</Label>
                        <Input
                          value={formData.location.state}
                          onChange={(e) => handleInputChange('location.state', e.target.value)}
                          placeholder="SP"
                          maxLength={2}
                          className="bg-gray-800 border-gray-600 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300 mb-2 block">CEP</Label>
                        <Input
                          value={formData.location.postal_code}
                          onChange={(e) => handleInputChange('location.postal_code', e.target.value)}
                          placeholder="00000-000"
                          className="bg-gray-800 border-gray-600 text-white"
                        />
                      </div>
                    </div>

                    {/* Mapa Interativo */}
                    <div>
                      <Label className="text-gray-300 mb-2 block">
                        Clique no mapa para marcar a localização exata
                      </Label>
                      <div className="h-96 rounded-lg overflow-hidden border-2 border-gray-700">
                        <MapContainer
                          center={[formData.location.lat, formData.location.lng]}
                          zoom={13}
                          style={{ height: '100%', width: '100%' }}
                        >
                          <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                          />
                          <LocationMarker
                            position={formData.location}
                            setPosition={(pos) => {
                              handleInputChange('location.lat', pos.lat);
                              handleInputChange('location.lng', pos.lng);
                            }}
                          />
                        </MapContainer>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Coordenadas: {formData.location.lat.toFixed(6)}, {formData.location.lng.toFixed(6)}
                      </p>
                    </div>

                    {/* Localização Secreta */}
                    <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <Label className="text-gray-300 font-semibold">Localização Secreta</Label>
                          <p className="text-sm text-gray-400 mt-1">
                            O endereço completo será revelado apenas 24h antes do evento
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={formData.location.is_secret}
                        onCheckedChange={(checked) => handleInputChange('location.is_secret', checked)}
                      />
                    </div>
                  </div>
                )}

                {/* ETAPA 3: INGRESSOS */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                      <Ticket className="w-8 h-8 text-green-400" />
                      <h2 className="text-2xl font-bold">Configurar Ingressos</h2>
                    </div>

                    {errors.tickets && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-400" />
                        <p className="text-red-400 text-sm">{errors.tickets}</p>
                      </div>
                    )}

                    {/* Lista de Ingressos */}
                    <div className="space-y-4">
                      {formData.ticket_types.map((ticket, index) => (
                        <Card key={index} className="bg-gray-800/50 border-gray-700">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg flex items-center gap-2">
                                <Ticket className="w-5 h-5 text-cyan-400" />
                                Ingresso #{index + 1}
                              </CardTitle>
                              {formData.ticket_types.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeTicketType(index)}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {/* Nome e Preço */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-gray-300 mb-2 block">Nome do Ingresso *</Label>
                                <Input
                                  value={ticket.name}
                                  onChange={(e) => handleTicketTypeChange(index, 'name', e.target.value)}
                                  placeholder="Ex: Pista, VIP, Camarote"
                                  className="bg-gray-800 border-gray-600 text-white"
                                />
                                {errors[`ticket_${index}_name`] && (
                                  <p className="text-red-400 text-xs mt-1">{errors[`ticket_${index}_name`]}</p>
                                )}
                              </div>
                              <div>
                                <Label className="text-gray-300 mb-2 block">Preço (R$) *</Label>
                                <div className="relative">
                                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                  <Input
                                    type="number"
                                    value={ticket.price}
                                    onChange={(e) => handleTicketTypeChange(index, 'price', e.target.value)}
                                    className="bg-gray-800 border-gray-600 text-white pl-10"
                                    min="0"
                                    step="0.01"
                                  />
                                </div>
                                {errors[`ticket_${index}_price`] && (
                                  <p className="text-red-400 text-xs mt-1">{errors[`ticket_${index}_price`]}</p>
                                )}
                              </div>
                            </div>

                            {/* Quantidade e Descrição */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-gray-300 mb-2 block">Quantidade Disponível *</Label>
                                <Input
                                  type="number"
                                  value={ticket.quantity}
                                  onChange={(e) => handleTicketTypeChange(index, 'quantity', e.target.value)}
                                  className="bg-gray-800 border-gray-600 text-white"
                                  min="1"
                                />
                                {errors[`ticket_${index}_quantity`] && (
                                  <p className="text-red-400 text-xs mt-1">{errors[`ticket_${index}_quantity`]}</p>
                                )}
                              </div>
                              <div>
                                <Label className="text-gray-300 mb-2 block">Descrição</Label>
                                <Input
                                  value={ticket.description}
                                  onChange={(e) => handleTicketTypeChange(index, 'description', e.target.value)}
                                  placeholder="Ex: Acesso à pista principal"
                                  className="bg-gray-800 border-gray-600 text-white"
                                />
                              </div>
                            </div>

                            {/* Early Bird */}
                            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg space-y-3">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-yellow-400" />
                                <Label className="text-yellow-300 font-semibold">Preço Promocional (Early Bird)</Label>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-gray-300 text-xs mb-1 block">Preço Promocional (R$)</Label>
                                  <Input
                                    type="number"
                                    value={ticket.early_bird_price || ''}
                                    onChange={(e) => handleTicketTypeChange(index, 'early_bird_price', e.target.value)}
                                    placeholder="Ex: 35.00"
                                    className="bg-gray-800 border-gray-600 text-white"
                                    min="0"
                                    step="0.01"
                                  />
                                </div>
                                <div>
                                  <Label className="text-gray-300 text-xs mb-1 block">Válido Até</Label>
                                  <Input
                                    type="datetime-local"
                                    value={ticket.early_bird_until || ''}
                                    onChange={(e) => handleTicketTypeChange(index, 'early_bird_until', e.target.value)}
                                    className="bg-gray-800 border-gray-600 text-white"
                                  />
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Botão Adicionar Ingresso */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addTicketType}
                      className="w-full border-dashed border-2 border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Tipo de Ingresso
                    </Button>

                    {/* Resumo de Ingressos */}
                    <Card className="bg-cyan-500/10 border-cyan-500/30">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-cyan-300 font-semibold">Total de Ingressos:</span>
                          <span className="text-2xl font-bold text-white">
                            {formData.ticket_types.reduce((sum, t) => sum + (t.quantity || 0), 0)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-cyan-300 font-semibold">Receita Potencial:</span>
                          <span className="text-2xl font-bold text-green-400">
                            R$ {formData.ticket_types.reduce((sum, t) => sum + (t.price * t.quantity), 0).toFixed(2)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* ETAPA 4: AVANÇADO */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                      <Users className="w-8 h-8 text-orange-400" />
                      <h2 className="text-2xl font-bold">Configurações Avançadas</h2>
                    </div>

                    {/* Capacidade e Nível Mínimo */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300 mb-2 block">Capacidade Máxima</Label>
                        <Input
                          type="number"
                          value={formData.max_capacity}
                          onChange={(e) => handleInputChange('max_capacity', parseInt(e.target.value))}
                          className="bg-gray-800 border-gray-600 text-white"
                          min="1"
                        />
                      </div>

                      <div>
                        <Label className="text-gray-300 mb-2 block">Nível Underground Mínimo</Label>
                        <Select 
                          value={formData.minimum_level.toString()} 
                          onValueChange={(value) => handleInputChange('minimum_level', parseInt(value))}
                        >
                          <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-600">
                            <SelectItem value="1">Nível 1 - Todos</SelectItem>
                            <SelectItem value="2">Nível 2 - Experiente</SelectItem>
                            <SelectItem value="3">Nível 3 - Veterano</SelectItem>
                            <SelectItem value="4">Nível 4 - Elite</SelectItem>
                            <SelectItem value="5">Nível 5 - Lenda</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Restrição de Idade e Política de Reembolso */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300 mb-2 block">Restrição de Idade</Label>
                        <Select 
                          value={formData.age_restriction} 
                          onValueChange={(value) => handleInputChange('age_restriction', value)}
                        >
                          <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-600">
                            <SelectItem value="all">Todas as idades</SelectItem>
                            <SelectItem value="16+">16+</SelectItem>
                            <SelectItem value="18+">18+</SelectItem>
                            <SelectItem value="21+">21+</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-gray-300 mb-2 block">Política de Reembolso</Label>
                        <Select 
                          value={formData.refund_policy} 
                          onValueChange={(value) => handleInputChange('refund_policy', value)}
                        >
                          <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-600">
                            <SelectItem value="flexible">Flexível (até 7 dias antes)</SelectItem>
                            <SelectItem value="moderate">Moderada (até 30 dias antes)</SelectItem>
                            <SelectItem value="strict">Rígida (não reembolsável)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Tags de Vibe */}
                    <div>
                      <Label className="text-gray-300 mb-2 block">Tags de Vibe</Label>
                      <Input
                        value={formData.vibe_tags.join(', ')}
                        onChange={(e) => handleVibeTagsChange(e.target.value)}
                        placeholder="dark, underground, techno, warehouse (separadas por vírgula)"
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Ajuda os usuários a encontrar o evento baseado na vibe desejada
                      </p>
                    </div>

                    {/* Comunidade Privada */}
                    {userCommunities.length > 0 && (
                      <div>
                        <Label className="text-gray-300 mb-2 block">Evento Privado de Comunidade (Opcional)</Label>
                        <Select 
                          value={formData.community_id || 'none'} 
                          onValueChange={(value) => handleInputChange('community_id', value === 'none' ? null : value)}
                        >
                          <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                            <SelectValue placeholder="Selecione uma comunidade (opcional)" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-600">
                            <SelectItem value="none">Nenhuma (Evento Público)</SelectItem>
                            {userCommunities.map(community => (
                              <SelectItem key={community.id} value={community.id}>
                                {community.name} ({community.member_count} membros)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500 mt-1">
                          Eventos de comunidade são visíveis apenas para membros
                        </p>
                      </div>
                    )}

                    {/* Opções de Toggle */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                        <div>
                          <Label className="text-gray-300 font-semibold">Evento Secreto</Label>
                          <p className="text-sm text-gray-400 mt-1">
                            Apenas membros Pro podem ver e acessar
                          </p>
                        </div>
                        <Switch
                          checked={formData.is_secret}
                          onCheckedChange={(checked) => handleInputChange('is_secret', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                        <div>
                          <Label className="text-gray-300 font-semibold">Requer Aprovação</Label>
                          <p className="text-sm text-gray-400 mt-1">
                            Você aprova manualmente cada solicitação
                          </p>
                        </div>
                        <Switch
                          checked={formData.requires_approval}
                          onCheckedChange={(checked) => handleInputChange('requires_approval', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                        <div>
                          <Label className="text-gray-300 font-semibold">Permitir Lista de Espera</Label>
                          <p className="text-sm text-gray-400 mt-1">
                            Quando esgotado, usuários podem entrar na lista de espera
                          </p>
                        </div>
                        <Switch
                          checked={formData.allow_waitlist}
                          onCheckedChange={(checked) => handleInputChange('allow_waitlist', checked)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ETAPA 5: REVISAR */}
                {currentStep === 5 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                      <Check className="w-8 h-8 text-green-400" />
                      <h2 className="text-2xl font-bold">Revisar e Publicar</h2>
                    </div>

                    {/* Preview do Evento */}
                    <Card className="bg-gray-800/50 border-gray-700 overflow-hidden">
                      <img 
                        src={formData.image_url} 
                        alt={formData.title}
                        className="w-full h-64 object-cover"
                      />
                      <CardContent className="p-6 space-y-4">
                        <div>
                          <h3 className="text-2xl font-bold mb-2">{formData.title}</h3>
                          <div className="flex flex-wrap gap-2 mb-3">
                            <Badge className="bg-cyan-600">{formData.genre}</Badge>
                            <Badge className="bg-purple-600">{formData.type}</Badge>
                            {formData.is_secret && <Badge className="bg-yellow-600">Secreto</Badge>}
                          </div>
                          <p className="text-gray-300">{formData.description}</p>
                        </div>

                        {/* Informações */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-gray-300">
                            <Calendar className="w-4 h-4 text-cyan-400" />
                            {formData.date ? format(new Date(formData.date), "PPP 'às' HH:mm", { locale: ptBR }) : "Data não definida"}
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <Clock className="w-4 h-4 text-purple-400" />
                            {formData.duration_hours}h de duração
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <MapPin className="w-4 h-4 text-green-400" />
                            {formData.location.venue_name}
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <Users className="w-4 h-4 text-orange-400" />
                            {formData.max_capacity} pessoas
                          </div>
                        </div>

                        {/* Ingressos */}
                        <div>
                          <h4 className="font-semibold mb-3 text-white">Ingressos Disponíveis:</h4>
                          <div className="space-y-2">
                            {formData.ticket_types.map((ticket, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                                <div>
                                  <p className="font-semibold text-white">{ticket.name}</p>
                                  <p className="text-xs text-gray-400">
                                    {ticket.quantity} disponíveis
                                    {ticket.description && ` • ${ticket.description}`}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-green-400">
                                    R$ {ticket.price.toFixed(2)}
                                  </p>
                                  {ticket.early_bird_price && (
                                    <p className="text-xs text-yellow-400">
                                      Promo: R$ {ticket.early_bird_price.toFixed(2)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Tags */}
                        {formData.vibe_tags.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2 text-white">Vibes:</h4>
                            <div className="flex flex-wrap gap-2">
                              {formData.vibe_tags.map(tag => (
                                <span key={tag} className="px-3 py-1 bg-purple-500/20 rounded-full text-xs text-purple-300">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Confirmação */}
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-green-300 mb-2">
                            Enviar para Análise
                          </h4>
                          <p className="text-sm text-gray-300">
                            Seu evento será enviado para análise pela equipe SUBLINX. Após validação (normalmente em até 24h), será publicado e seus seguidores serão notificados. Isso garante que apenas eventos reais e verificados apareçam na plataforma.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-700">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>

              {currentStep < 5 ? (
                <Button
                  onClick={nextStep}
                  className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700"
                >
                  Próximo
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-8"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Publicando...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Publicar Evento
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}