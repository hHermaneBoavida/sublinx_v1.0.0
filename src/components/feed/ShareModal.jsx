import React from 'react';
import { motion } from 'framer-motion';
import { X, Link2, MessageCircle, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ShareModal({ event, onClose }) {
  const shareUrl = window.location.origin + window.location.pathname + `?event=${event.id}`;
  const shareText = `🎉 Confira esse evento no SUBLINX: ${event.title}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('✅ Link copiado! Cole onde quiser 🔗');
      onClose();
    } catch (error) {
      // Fallback manual
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        alert('✅ Link copiado! Cole onde quiser 🔗');
        onClose();
      } catch (err) {
        alert('❌ Erro ao copiar. Link: ' + shareUrl);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`${shareText}\n\n${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
    onClose();
  };

  const handleFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
    onClose();
  };

  const handleInstagram = () => {
    // Instagram não permite compartilhamento direto de links via web
    handleCopyLink();
    alert('📱 Instagram não suporta links diretos.\nO link foi copiado! Cole na bio ou nos stories.');
  };

  const handleTwitter = () => {
    const text = encodeURIComponent(shareText);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`, '_blank');
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-gray-900 border-2 border-cyan-500/50 rounded-2xl w-full max-w-md relative shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-700">
          <h2 className="text-xl sm:text-2xl font-bold text-white">Compartilhar Evento</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Informações do Evento */}
        <div className="p-4 sm:p-6 border-b border-gray-700">
          <div className="flex gap-3">
            <img 
              src={event.image_url || "https://picsum.photos/200"} 
              alt={event.title}
              className="w-16 h-16 rounded-lg object-cover"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white truncate">{event.title}</h3>
              <p className="text-sm text-gray-400 truncate">{event.location?.venue_name}</p>
            </div>
          </div>
        </div>

        {/* Opções de Compartilhamento */}
        <div className="p-4 sm:p-6 space-y-3">
          {/* WhatsApp */}
          <button
            onClick={handleWhatsApp}
            className="w-full flex items-center gap-4 p-4 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-xl transition-all group"
          >
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-white">WhatsApp</p>
              <p className="text-xs text-gray-400">Compartilhar via WhatsApp</p>
            </div>
          </button>

          {/* Facebook */}
          <button
            onClick={handleFacebook}
            className="w-full flex items-center gap-4 p-4 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-xl transition-all group"
          >
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </div>
            <div className="text-left">
              <p className="font-semibold text-white">Facebook</p>
              <p className="text-xs text-gray-400">Compartilhar no Facebook</p>
            </div>
          </button>

          {/* Instagram */}
          <button
            onClick={handleInstagram}
            className="w-full flex items-center gap-4 p-4 bg-gradient-to-br from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 border border-purple-500/30 rounded-xl transition-all group"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </div>
            <div className="text-left">
              <p className="font-semibold text-white">Instagram</p>
              <p className="text-xs text-gray-400">Copiar link para Instagram</p>
            </div>
          </button>

          {/* Twitter/X */}
          <button
            onClick={handleTwitter}
            className="w-full flex items-center gap-4 p-4 bg-gray-700/20 hover:bg-gray-700/30 border border-gray-600/30 rounded-xl transition-all group"
          >
            <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </div>
            <div className="text-left">
              <p className="font-semibold text-white">Twitter / X</p>
              <p className="text-xs text-gray-400">Compartilhar no Twitter</p>
            </div>
          </button>

          {/* Copiar Link */}
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center gap-4 p-4 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 rounded-xl transition-all group"
          >
            <div className="w-12 h-12 bg-cyan-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Link2 className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-white">Copiar Link</p>
              <p className="text-xs text-gray-400">Copiar link para a área de transferência</p>
            </div>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}