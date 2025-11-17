import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MapPin, Info, AlertCircle } from "lucide-react";
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

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

export default function LocationStep({ formData, errors, onInputChange }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <MapPin className="w-8 h-8 text-purple-400" />
        <h2 className="text-2xl font-bold">Localização do Evento</h2>
      </div>

      <div>
        <Label className="text-gray-300 mb-2 block">Nome do Local *</Label>
        <Input
          value={formData.location.venue_name}
          onChange={(e) => onInputChange('location.venue_name', e.target.value)}
          placeholder="Ex: Warehouse 23, Club Underground"
          className="bg-gray-800 border-gray-600 text-white"
        />
        {errors.venue_name && (
          <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.venue_name}
          </p>
        )}
      </div>

      <div>
        <Label className="text-gray-300 mb-2 block">Endereço Completo *</Label>
        <Input
          value={formData.location.address}
          onChange={(e) => onInputChange('location.address', e.target.value)}
          placeholder="Rua, número, bairro"
          className="bg-gray-800 border-gray-600 text-white"
        />
        {errors.address && (
          <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.address}
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label className="text-gray-300 mb-2 block">Cidade *</Label>
          <Input
            value={formData.location.city}
            onChange={(e) => onInputChange('location.city', e.target.value)}
            placeholder="São Paulo"
            className="bg-gray-800 border-gray-600 text-white"
          />
          {errors.city && (
            <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.city}
            </p>
          )}
        </div>
        <div>
          <Label className="text-gray-300 mb-2 block">Estado</Label>
          <Input
            value={formData.location.state}
            onChange={(e) => onInputChange('location.state', e.target.value)}
            placeholder="SP"
            maxLength={2}
            className="bg-gray-800 border-gray-600 text-white"
          />
        </div>
        <div>
          <Label className="text-gray-300 mb-2 block">CEP</Label>
          <Input
            value={formData.location.postal_code}
            onChange={(e) => onInputChange('location.postal_code', e.target.value)}
            placeholder="00000-000"
            className="bg-gray-800 border-gray-600 text-white"
          />
        </div>
      </div>

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
                onInputChange('location.lat', pos.lat);
                onInputChange('location.lng', pos.lng);
              }}
            />
          </MapContainer>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Coordenadas: {formData.location.lat.toFixed(6)}, {formData.location.lng.toFixed(6)}
        </p>
      </div>

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
          onCheckedChange={(checked) => onInputChange('location.is_secret', checked)}
        />
      </div>
    </div>
  );
}