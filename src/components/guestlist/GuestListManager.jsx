import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserPlus, Crown, Gift, Trash2, Mail, Check, X, Star, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function GuestListManager({ event, user }) {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [guestEmail, setGuestEmail] = useState("");
  const [guestName, setGuestName] = useState("");
  const [vipType, setVipType] = useState("free");
  const [notes, setNotes] = useState("");
  const [specialAccess, setSpecialAccess] = useState(false);
  const [plusOnes, setPlusOnes] = useState(0);

  const { data: guestList = [] } = useQuery({
    queryKey: ['guestList', event.id],
    queryFn: () => base44.entities.GuestList.filter({ event_id: event.id }),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsersForGuest'],
    queryFn: () => base44.entities.User.list("", 100),
  });

  const addGuestMutation = useMutation({
    mutationFn: async (guestData) => {
      const foundUser = allUsers.find(u => u.email === guestEmail);
      
      return await base44.entities.GuestList.create({
        event_id: event.id,
        organizer_id: user.id,
        guest_user_id: foundUser?.id || null,
        guest_email: guestEmail,
        guest_name: guestName || foundUser?.full_name || guestEmail.split('@')[0],
        vip_type: vipType,
        discount_percentage: vipType === 'free' ? 100 : vipType === 'discount_50' ? 50 : vipType === 'discount_75' ? 75 : 100,
        notes: notes,
        special_access: specialAccess,
        plus_ones: plusOnes,
        status: 'pending'
      });
    },
    onSuccess: async (newGuest) => {
      queryClient.invalidateQueries(['guestList']);
      
      // Notificar o convidado
      if (newGuest.guest_user_id) {
        try {
          await base44.entities.Notification.create({
            user_id: newGuest.guest_user_id,
            type: 'event_alert',
            title: '🎉 Você está na Guest List VIP!',
            message: `${user.full_name || user.email} te adicionou à lista VIP de "${event.title}"`,
            event_id: event.id,
            is_read: false
          });
        } catch (e) {
          console.log("Erro ao notificar:", e);
        }
      }
      
      resetForm();
      setShowAddModal(false);
    }
  });

  const removeGuestMutation = useMutation({
    mutationFn: async (guestId) => {
      await base44.entities.GuestList.delete(guestId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['guestList']);
    }
  });

  const resetForm = () => {
    setGuestEmail("");
    setGuestName("");
    setVipType("free");
    setNotes("");
    setSpecialAccess(false);
    setPlusOnes(0);
  };

  const getVipTypeLabel = (type) => {
    const types = {
      free: { label: "Gratuito", icon: Gift, color: "bg-green-600/20 border-green-500/30 text-green-300" },
      discount_50: { label: "50% OFF", icon: Gift, color: "bg-blue-600/20 border-blue-500/30 text-blue-300" },
      discount_75: { label: "75% OFF", icon: Gift, color: "bg-purple-600/20 border-purple-500/30 text-purple-300" },
      influencer: { label: "Influencer", icon: Star, color: "bg-pink-600/20 border-pink-500/30 text-pink-300" },
      vip_exclusive: { label: "VIP Exclusivo", icon: Crown, color: "bg-yellow-600/20 border-yellow-500/30 text-yellow-300" }
    };
    return types[type] || types.free;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-yellow-400" />
          <h3 className="text-lg font-bold text-white">Guest List VIP</h3>
          <Badge className="bg-purple-600/20 border-purple-500/30 text-purple-300">
            {guestList.length}
          </Badge>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Adicionar Convidado
        </Button>
      </div>

      {guestList.length === 0 ? (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Nenhum convidado VIP ainda</p>
            <p className="text-gray-500 text-xs mt-1">Adicione influenciadores e convidados especiais</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          <AnimatePresence>
            {guestList.map((guest, index) => {
              const vipInfo = getVipTypeLabel(guest.vip_type);
              const Icon = vipInfo.icon;

              return (
                <motion.div
                  key={guest.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="bg-gray-800/50 border-gray-700 hover:border-purple-500/30 transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-white text-sm truncate">{guest.guest_name}</p>
                              {guest.status === 'accepted' && (
                                <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                              )}
                            </div>
                            
                            <p className="text-xs text-gray-400 truncate mb-2">{guest.guest_email}</p>
                            
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={vipInfo.color}>
                                {vipInfo.label}
                              </Badge>
                              
                              {guest.special_access && (
                                <Badge className="bg-cyan-600/20 border-cyan-500/30 text-cyan-300 text-xs">
                                  Backstage
                                </Badge>
                              )}
                              
                              {guest.plus_ones > 0 && (
                                <Badge className="bg-blue-600/20 border-blue-500/30 text-blue-300 text-xs">
                                  +{guest.plus_ones}
                                </Badge>
                              )}
                              
                              <Badge 
                                className={`text-xs ${
                                  guest.status === 'pending' ? 'bg-yellow-600/20 border-yellow-500/30 text-yellow-300' :
                                  guest.status === 'accepted' ? 'bg-green-600/20 border-green-500/30 text-green-300' :
                                  guest.status === 'used' ? 'bg-blue-600/20 border-blue-500/30 text-blue-300' :
                                  'bg-red-600/20 border-red-500/30 text-red-300'
                                }`}
                              >
                                {guest.status === 'pending' ? 'Pendente' :
                                 guest.status === 'accepted' ? 'Aceito' :
                                 guest.status === 'used' ? 'Usado' : 'Recusado'}
                              </Badge>
                            </div>
                            
                            {guest.notes && (
                              <p className="text-xs text-gray-500 mt-2 line-clamp-1">{guest.notes}</p>
                            )}
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (window.confirm('Remover convidado da lista VIP?')) {
                              removeGuestMutation.mutate(guest.id);
                            }
                          }}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-8 w-8"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Add Guest Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-400" />
              Adicionar à Guest List VIP
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Email do Convidado *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="convidado@email.com"
                  className="pl-10 bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-2 block">Nome (opcional)</label>
              <Input
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Nome do convidado"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-2 block">Tipo de Acesso</label>
              <Select value={vipType} onValueChange={setVipType}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="free">🎁 Entrada Gratuita</SelectItem>
                  <SelectItem value="discount_50">💰 50% de Desconto</SelectItem>
                  <SelectItem value="discount_75">💎 75% de Desconto</SelectItem>
                  <SelectItem value="influencer">⭐ Influencer</SelectItem>
                  <SelectItem value="vip_exclusive">👑 VIP Exclusivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-2 block">Acompanhantes (+1)</label>
              <Input
                type="number"
                min="0"
                max="5"
                value={plusOnes}
                onChange={(e) => setPlusOnes(parseInt(e.target.value) || 0)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
              <input
                type="checkbox"
                id="special-access"
                checked={specialAccess}
                onChange={(e) => setSpecialAccess(e.target.checked)}
                className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-cyan-500"
              />
              <label htmlFor="special-access" className="text-sm text-white cursor-pointer flex-1">
                Acesso a áreas especiais / Backstage
              </label>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-2 block">Observações</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas sobre o convidado..."
                className="bg-gray-800 border-gray-700 text-white h-20"
                maxLength={200}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                resetForm();
                setShowAddModal(false);
              }}
              className="flex-1 border-gray-700 text-gray-300"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => addGuestMutation.mutate()}
              disabled={!guestEmail || addGuestMutation.isPending}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
            >
              {addGuestMutation.isPending ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}