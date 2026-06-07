import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Phone, Mail, Globe, Instagram, Star, Users, DollarSign, Clock, Calendar, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const VENUE_TYPE_LABELS = {
  club: '🎵 Club',
  bar: '🍺 Bar',
  warehouse: '🏭 Warehouse',
  rooftop: '🌆 Rooftop',
  studio: '🎙️ Studio',
  gallery: '🎨 Galeria',
  underground_space: '🔥 Underground Space',
  cultural_center: '🏛️ Centro Cultural'
};

export default function VenueDetailsModal({ venue, onClose }) {
  if (!venue) return null;

  const openMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${venue.location.lat},${venue.location.lng}`;
    window.open(url, '_blank');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-gradient-to-b from-gray-900 to-black border-2 border-cyan-500/30 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 bg-black/50 backdrop-blur-sm rounded-full p-2 hover:bg-black/70 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Image */}
          {venue.image_url && (
            <div className="relative h-48 sm:h-64 overflow-hidden rounded-t-2xl">
              <img
                src={venue.image_url}
                alt={venue.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              
              {/* Verified Badge */}
              {venue.verified && (
                <Badge className="absolute top-4 left-4 bg-green-600 text-white border-0">
                  ✓ Verificado SUBLINX
                </Badge>
              )}
            </div>
          )}

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between mb-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-white">{venue.name}</h2>
                {venue.rating != null && venue.rating > 0 && (
                  <div className="flex items-center gap-1 bg-yellow-600/20 px-3 py-1 rounded-full">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-yellow-300 font-semibold">{venue.rating.toFixed(1)}</span>
                    <span className="text-xs text-gray-400">({venue.total_reviews})</span>
                  </div>
                )}
              </div>
              
              <Badge className="bg-purple-600/20 border-purple-500/30 text-purple-300">
                {VENUE_TYPE_LABELS[venue.type] || venue.type}
              </Badge>
              
              {venue.description && (
                <p className="text-gray-300 mt-3 text-sm sm:text-base">{venue.description}</p>
              )}
            </div>

            <Separator className="bg-gray-700" />

            {/* Location */}
            <div>
              <h3 className="text-lg font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Localização
              </h3>
              <p className="text-gray-300 text-sm sm:text-base mb-2">{venue.location.address}</p>
              {venue.location.neighborhood && (
                <p className="text-gray-400 text-xs sm:text-sm">
                  {venue.location.neighborhood} - {venue.location.city}, {venue.location.state}
                </p>
              )}
              <Button
                onClick={openMaps}
                className="mt-3 bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Como Chegar
              </Button>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              {venue.capacity && (
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-cyan-400 mb-1">
                    <Users className="w-4 h-4" />
                    <span className="text-xs font-semibold">Capacidade</span>
                  </div>
                  <p className="text-white font-bold">{venue.capacity} pessoas</p>
                </div>
              )}
              
              {venue.average_price != null && (
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-green-400 mb-1">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-xs font-semibold">Entrada Média</span>
                  </div>
                  <p className="text-white font-bold">
                    {venue.average_price === 0 ? 'Grátis' : `R$ ${Number(venue.average_price).toFixed(2)}`}
                  </p>
                </div>
              )}
              
              {venue.upcoming_events_count > 0 && (
                <div className="bg-gray-800/50 rounded-lg p-3 col-span-2">
                  <div className="flex items-center gap-2 text-purple-400 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-semibold">Eventos Próximos</span>
                  </div>
                  <p className="text-white font-bold">{venue.upcoming_events_count} evento(s)</p>
                </div>
              )}
            </div>

            {/* Genres */}
            {venue.genres && venue.genres.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2">Gêneros Musicais</h3>
                <div className="flex flex-wrap gap-2">
                  {venue.genres.map(genre => (
                    <Badge key={genre} variant="outline" className="border-cyan-500/30 text-cyan-300">
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Amenities */}
            {venue.amenities && venue.amenities.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2">Comodidades</h3>
                <div className="flex flex-wrap gap-2">
                  {venue.amenities.map(amenity => (
                    <Badge key={amenity} className="bg-gray-700 text-gray-300">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Opening Hours */}
            {venue.opening_hours && Object.keys(venue.opening_hours).length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Horário de Funcionamento
                </h3>
                <div className="bg-gray-800/50 rounded-lg p-3 space-y-1 text-sm">
                  {Object.entries(venue.opening_hours).map(([day, hours]) => (
                    <div key={day} className="flex justify-between">
                      <span className="text-gray-400 capitalize">{day}:</span>
                      <span className="text-white font-medium">{hours || 'Fechado'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contact */}
            {venue.contact && (
              <div>
                <h3 className="text-lg font-semibold text-cyan-400 mb-3">Contato</h3>
                <div className="space-y-2">
                  {venue.contact.phone && (
                    <a href={`tel:${venue.contact.phone}`} className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                      <Phone className="w-4 h-4" />
                      <span>{venue.contact.phone}</span>
                    </a>
                  )}
                  {venue.contact.email && (
                    <a href={`mailto:${venue.contact.email}`} className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                      <Mail className="w-4 h-4" />
                      <span>{venue.contact.email}</span>
                    </a>
                  )}
                  {venue.contact.website && (
                    <a href={venue.contact.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                      <Globe className="w-4 h-4" />
                      <span>Website</span>
                    </a>
                  )}
                  {venue.contact.instagram && (
                    <a href={`https://instagram.com/${venue.contact.instagram}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                      <Instagram className="w-4 h-4" />
                      <span>@{venue.contact.instagram}</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}