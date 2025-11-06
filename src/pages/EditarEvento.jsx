import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Edit, Loader2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function EditarEvento() {
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    loadEvent();
  }, []);

  const loadEvent = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('id');

    if (!eventId) {
      alert("❌ ID do evento não fornecido");
      navigate(createPageUrl("MeusEventos"));
      return;
    }

    try {
      const eventsList = await base44.entities.Event.filter({ id: eventId });
      if (!eventsList || eventsList.length === 0) {
        alert("❌ Evento não encontrado");
        navigate(createPageUrl("MeusEventos"));
        return;
      }

      const eventData = eventsList[0];
      setEvent(eventData);
      setFormData(eventData);
    } catch (error) {
      console.error("Erro ao carregar evento:", error);
      alert("❌ Erro ao carregar evento");
      navigate(createPageUrl("MeusEventos"));
    } finally {
      setLoading(false);
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
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.Event.update(event.id, formData);
      alert("✅ Evento atualizado com sucesso!");
      navigate(createPageUrl("MeusEventos"));
    } catch (error) {
      console.error("Erro ao atualizar evento:", error);
      alert("❌ Erro ao atualizar evento. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <Loader2 className="w-16 h-16 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!formData) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <Button
        variant="outline"
        onClick={() => navigate(createPageUrl("MeusEventos"))}
        className="mb-6 border-gray-600 text-gray-300"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar
      </Button>

      <div className="mb-8">
        <h1 className="flex items-center gap-3 text-3xl font-bold text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text mb-2">
          <Edit className="w-8 h-8" />
          Editar Evento
        </h1>
        <p className="text-gray-400">
          Atualize as informações do seu evento
        </p>
      </div>

      <div className="space-y-6">
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-gray-300">Nome do Evento</Label>
              <Input
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="bg-gray-800 border-gray-600 text-white mt-1"
              />
            </div>

            <div>
              <Label className="text-gray-300">Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="bg-gray-800 border-gray-600 text-white mt-1 h-24"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Gênero Musical</Label>
                <Select value={formData.genre} onValueChange={(value) => handleInputChange('genre', value)}>
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="techno">Techno</SelectItem>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="trance">Trance</SelectItem>
                    <SelectItem value="drum_bass">Drum & Bass</SelectItem>
                    <SelectItem value="dubstep">Dubstep</SelectItem>
                    <SelectItem value="funk">Funk</SelectItem>
                    <SelectItem value="trap">Trap</SelectItem>
                    <SelectItem value="rap">Rap</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-300">Data e Hora</Label>
                <Input
                  type="datetime-local"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-300">Local</Label>
              <Input
                value={formData.location?.venue_name || ''}
                onChange={(e) => handleInputChange('location.venue_name', e.target.value)}
                className="bg-gray-800 border-gray-600 text-white mt-1"
              />
            </div>

            <div>
              <Label className="text-gray-300">Endereço</Label>
              <Input
                value={formData.location?.address || ''}
                onChange={(e) => handleInputChange('location.address', e.target.value)}
                className="bg-gray-800 border-gray-600 text-white mt-1"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => navigate(createPageUrl("MeusEventos"))}
            className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700"
          >
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...</> : "Salvar Alterações"}
          </Button>
        </div>
      </div>
    </div>
  );
}