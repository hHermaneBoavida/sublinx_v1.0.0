import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Instagram, Music2, Link as LinkIcon, Check, Calendar, Facebook } from "lucide-react";
import { motion } from "framer-motion";

export default function SocialShare({ event, onClose }) {
  const [copied, setCopied] = useState(false);
  const eventUrl = `${window.location.origin}${window.location.pathname}?evento=${event.id}`;
  
  const shareText = `🎉 ${event.title}\n📅 ${new Date(event.date).toLocaleDateString('pt-BR')}\n📍 ${event.location?.venue_name || event.location?.address}\n\n#SUBLINX #${event.genre}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(eventUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInstagramShare = () => {
    // Instagram não permite deep linking direto, então copiamos o texto
    navigator.clipboard.writeText(shareText);
    alert('📋 Texto copiado! Cole no Instagram para compartilhar.');
  };

  const handleTikTokShare = () => {
    // TikTok também não permite deep linking direto
    navigator.clipboard.writeText(shareText);
    alert('📋 Texto copiado! Cole no TikTok para compartilhar.');
  };

  const handleFacebookShare = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}`;
    window.open(fbUrl, '_blank', 'width=600,height=400');
  };

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(eventUrl)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  };

  const handleWhatsAppShare = () => {
    const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText + '\n' + eventUrl)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Compartilhar Evento</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleInstagramShare}
              className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 hover:from-purple-700 hover:via-pink-700 hover:to-orange-700 h-12"
            >
              <Instagram className="w-5 h-5 mr-2" />
              Compartilhar no Instagram
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleTikTokShare}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 h-12"
            >
              <Music2 className="w-5 h-5 mr-2" />
              Compartilhar no TikTok
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleFacebookShare}
              className="w-full bg-blue-600 hover:bg-blue-700 h-12"
            >
              <Facebook className="w-5 h-5 mr-2" />
              Compartilhar no Facebook
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleWhatsAppShare}
              className="w-full bg-green-600 hover:bg-green-700 h-12"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              Compartilhar no WhatsApp
            </Button>
          </motion.div>

          <div className="border-t border-gray-800 pt-3">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleCopyLink}
                variant="outline"
                className="w-full border-gray-700 text-white hover:bg-gray-800 h-12"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5 mr-2 text-green-400" />
                    Link Copiado!
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-5 h-5 mr-2" />
                    Copiar Link
                  </>
                )}
              </Button>
            </motion.div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}