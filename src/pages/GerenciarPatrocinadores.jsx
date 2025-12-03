import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Award, Plus, Trash2, Upload, ExternalLink, Loader2, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl } from "@/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function GerenciarPatrocinadores() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const searchParams = new URLSearchParams(location.search);
  const eventId = searchParams.get('eventId');

  const [showAddForm, setShowAddForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newSponsor, setNewSponsor] = useState({
    name: "",
    logo_url: "",
    website: "",
    description: "",
    tier: "partner",
    display_order: 0,
    is_visible: true
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch (error) {
        navigate(createPageUrl("BemVindo"));
        throw error;
      }
    },
  });

  const { data: event, isLoading: loadingEvent } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      if (!eventId) return null;
      const events = await base44.entities.Event.filter({ id: eventId });
      return events[0] || null;
    },
    enabled: !!eventId,
  });

  const { data: sponsors = [] } = useQuery({
    queryKey: ['eventSponsors', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      return await base44.entities.EventSponsor.filter({ event_id: eventId }, "display_order");
    },
    enabled: !!eventId,
  });

  const addSponsorMutation = useMutation({
    mutationFn: async (sponsorData) => {
      return await base44.entities.EventSponsor.create({
        event_id: eventId,
        ...sponsorData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['eventSponsors', eventId]);
      setShowAddForm(false);
      setNewSponsor({
        name: "",
        logo_url: "",
        website: "",
        description: "",
        tier: "partner",
        display_order: 0,
        is_visible: true
      });
    }
  });

  const deleteSponsorMutation = useMutation({
    mutationFn: async (sponsorId) => {
      return await base44.entities.EventSponsor.delete(sponsorId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['eventSponsors', eventId]);
    }
  });

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setNewSponsor({ ...newSponsor, logo_url: file_url });
    } catch (error) {
      alert("Erro ao fazer upload: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleAddSponsor = () => {
    if (!newSponsor.name || !newSponsor.logo_url) {
      alert("Preencha o nome e faça upload do logo");
      return;
    }

    addSponsorMutation.mutate(newSponsor);
  };

  if (loadingEvent) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-16 h-16 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!event || event.organizer_id !== user?.id) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black p-4">
        <Card className="bg-gray-900 border-red-500/30">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Acesso Negado</h2>
            <p className="text-gray-400 mb-4">Você não tem permissão para gerenciar este evento</p>
            <Button onClick={() => navigate(createPageUrl("MeusEventos"))}>Voltar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tierOptions = [
    { value: "diamond", label: "💎 Diamante", color: "from-cyan-400 to-blue-600" },
    { value: "gold", label: "🥇 Ouro", color: "from-yellow-400 to-yellow-600" },
    { value: "silver", label: "🥈 Prata", color: "from-gray-300 to-gray-500" },
    { value: "bronze", label: "🥉 Bronze", color: "from-orange-400 to-orange-600" },
    { value: "partner", label: "🤝 Parceiro", color: "from-purple-400 to-pink-600" }
  ];

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
                Patrocinadores & Parceiros
              </h1>
              <p className="text-gray-400">{event.title}</p>
            </div>
            <Button
              onClick={() => navigate(createPageUrl("MeusEventos"))}
              variant="outline"
              className="border-gray-600"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </div>

          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-full mb-6 bg-gradient-to-r from-cyan-600 to-purple-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Patrocinador
          </Button>

          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Card className="bg-gray-900/80 border-cyan-500/30 mb-6">
                  <CardHeader>
                    <CardTitle className="text-white">Novo Patrocinador</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-gray-300">Nome *</Label>
                      <Input
                        placeholder="Nome do patrocinador"
                        value={newSponsor.name}
                        onChange={(e) => setNewSponsor({ ...newSponsor, name: e.target.value })}
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>

                    <div>
                      <Label className="text-gray-300">Logo *</Label>
                      <div className="flex gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="bg-gray-800 border-gray-700 text-white flex-1"
                        />
                        {uploading && <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />}
                      </div>
                      {newSponsor.logo_url && (
                        <img src={newSponsor.logo_url} alt="Preview" className="w-24 h-24 object-contain mt-2 bg-white/10 rounded-lg p-2" />
                      )}
                    </div>

                    <div>
                      <Label className="text-gray-300">Website</Label>
                      <Input
                        placeholder="https://..."
                        value={newSponsor.website}
                        onChange={(e) => setNewSponsor({ ...newSponsor, website: e.target.value })}
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>

                    <div>
                      <Label className="text-gray-300">Descrição</Label>
                      <Textarea
                        placeholder="Breve descrição do patrocinador..."
                        value={newSponsor.description}
                        onChange={(e) => setNewSponsor({ ...newSponsor, description: e.target.value })}
                        className="bg-gray-800 border-gray-700 text-white"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label className="text-gray-300">Nível de Patrocínio</Label>
                      <Select
                        value={newSponsor.tier}
                        onValueChange={(value) => setNewSponsor({ ...newSponsor, tier: value })}
                      >
                        <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          {tierOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleAddSponsor}
                        disabled={addSponsorMutation.isPending || uploading}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        {addSponsorMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Adicionar"}
                      </Button>
                      <Button
                        onClick={() => setShowAddForm(false)}
                        variant="outline"
                        className="flex-1 border-gray-600"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            {sponsors.map((sponsor) => {
              const tierInfo = tierOptions.find(t => t.value === sponsor.tier);
              
              return (
                <motion.div
                  key={sponsor.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="bg-gray-900/80 border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <img
                          src={sponsor.logo_url}
                          alt={sponsor.name}
                          className="w-20 h-20 object-contain rounded-lg bg-white/10 p-2"
                        />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-white">{sponsor.name}</h3>
                            <Badge className={`bg-gradient-to-r ${tierInfo?.color} text-white text-xs`}>
                              {tierInfo?.label}
                            </Badge>
                          </div>
                          
                          {sponsor.description && (
                            <p className="text-sm text-gray-300 mb-2">{sponsor.description}</p>
                          )}

                          {sponsor.website && (
                            <a
                              href={sponsor.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300"
                            >
                              <ExternalLink className="w-3 h-3" />
                              {sponsor.website}
                            </a>
                          )}
                        </div>

                        <Button
                          onClick={() => {
                            if (confirm("Remover este patrocinador?")) {
                              deleteSponsorMutation.mutate(sponsor.id);
                            }
                          }}
                          variant="ghost"
                          size="icon"
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}

            {sponsors.length === 0 && !showAddForm && (
              <div className="text-center py-12">
                <Award className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-300 mb-2">
                  Nenhum patrocinador cadastrado
                </h3>
                <p className="text-gray-400">
                  Adicione patrocinadores para destacar parceiros do evento
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}