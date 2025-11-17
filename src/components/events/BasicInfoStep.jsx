import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, AlertCircle, Image as ImageIcon } from "lucide-react";

export default function BasicInfoStep({ 
  formData, 
  errors, 
  uploadingImage,
  onInputChange, 
  onImageUpload 
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Sparkles className="w-8 h-8 text-cyan-400" />
        <h2 className="text-2xl font-bold">Informações Básicas</h2>
      </div>

      <div>
        <Label className="text-gray-300 mb-2 block">Nome do Evento *</Label>
        <Input
          value={formData.title}
          onChange={(e) => onInputChange('title', e.target.value)}
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

      <div>
        <Label className="text-gray-300 mb-2 block">Descrição</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => onInputChange('description', e.target.value)}
          placeholder="Descreva a experiência que você está criando..."
          className="bg-gray-800 border-gray-600 text-white h-32"
        />
      </div>

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
              onClick={() => onInputChange('image_url', '')}
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
                  onChange={onImageUpload}
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-gray-300 mb-2 block">Gênero Musical *</Label>
          <Select value={formData.genre} onValueChange={(value) => onInputChange('genre', value)}>
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
          <Select value={formData.type} onValueChange={(value) => onInputChange('type', value)}>
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-gray-300 mb-2 block">Data e Hora *</Label>
          <Input
            type="datetime-local"
            value={formData.date}
            onChange={(e) => onInputChange('date', e.target.value)}
            className="bg-gray-800 border-gray-600 text-white"
          />
          {errors.date && <p className="text-red-400 text-xs mt-1">{errors.date}</p>}
        </div>

        <div>
          <Label className="text-gray-300 mb-2 block">Duração (horas)</Label>
          <Input
            type="number"
            value={formData.duration_hours}
            onChange={(e) => onInputChange('duration_hours', parseInt(e.target.value))}
            className="bg-gray-800 border-gray-600 text-white"
            min="1"
            max="24"
          />
        </div>
      </div>
    </div>
  );
}