import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Share2, Copy, Users, Mail, MessageCircle, Star, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function InviteFriendsModal({ event, user, onClose }) {
  const [inviteMethod, setInviteMethod] = useState("link");
  const [email, setEmail] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  const inviteLink = event 
    ? `https://sublinx.app${window.location.pathname}?eventId=${event.id}&ref=${user?.id}`
    : `https://sublinx.app?ref=${user?.id}`;

  const inviteMessage = event
    ? `🎉 Você foi convidado para ${event.title}! Entre no SUBLINX e garanta sua vaga: ${inviteLink}`
    : `🎵 Descubra os melhores eventos underground no SUBLINX! Entre agora: ${inviteLink}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event?.title || "SUBLINX - Underground Events",
          text: inviteMessage,
          url: inviteLink
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      handleCopyLink();
    }
  };

  const handleWhatsAppShare = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(inviteMessage)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleEmailInvite = () => {
    const subject = event ? `Convite: ${event.title}` : "Descubra o SUBLINX";
    const body = inviteMessage;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-cyan-500/30 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-cyan-400">
            <Users className="w-5 h-5" />
            Convidar Amigos
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {event ? `Convide amigos para ${event.title}` : "Convide amigos para o SUBLINX"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recompensa por Convite */}
          <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Star className="w-5 h-5 text-yellow-400" fill="#facc15" />
              <span className="font-semibold text-yellow-300">Ganhe 50 pontos por amigo!</span>
            </div>
            <p className="text-xs text-gray-400">
              Quando seu amigo se cadastrar usando seu link, vocês ganham pontos de bônus.
            </p>
          </div>

          {/* Copiar Link */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400 block">Link de Convite</label>
            <div className="flex gap-2">
              <Input
                value={inviteLink}
                readOnly
                className="bg-gray-800 border-gray-600 text-white font-mono text-sm"
              />
              <Button
                onClick={handleCopyLink}
                variant="outline"
                className={`${copiedLink ? 'border-green-500/50 bg-green-900/20' : 'border-gray-600'}`}
              >
                {copiedLink ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Compartilhamento Rápido */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleWhatsAppShare}
              className="bg-green-600 hover:bg-green-700"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
            <Button
              onClick={handleShareNative}
              variant="outline"
              className="border-cyan-500/30 text-cyan-400"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Compartilhar
            </Button>
          </div>

          {/* Convite por Email */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400 block">Ou envie por email</label>
            <div className="flex gap-2">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="amigo@email.com"
                className="bg-gray-800 border-gray-600 text-white"
              />
              <Button
                onClick={handleEmailInvite}
                disabled={!email}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Mail className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}