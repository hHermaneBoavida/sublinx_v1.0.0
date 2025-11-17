import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Send, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function EventRequestModal({ event, user, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    full_name: user?.full_name || user?.display_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    emergency_contact: '',
    dietary_restrictions: '',
    special_needs: '',
    message: ''
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  const validateForm = () => {
    const errors = {};

    if (!formData.full_name || formData.full_name.trim().length < 2) {
      errors.full_name = 'Nome completo é obrigatório (mínimo 2 caracteres)';
    }

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email válido é obrigatório';
    }

    if (!formData.phone || formData.phone.replace(/\D/g, '').length < 10) {
      errors.phone = 'Telefone válido é obrigatório (mínimo 10 dígitos)';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const requestMutation = useMutation({
    mutationFn: async (requestData) => {
      const existingRequests = await base44.entities.EventRequest.filter({
        user_id: requestData.user_id,
        event_id: requestData.event_id,
        status: { $in: ['pending', 'approved'] }
      });

      if (existingRequests?.length > 0) {
        const existing = existingRequests[0];
        if (existing.status === 'approved') {
          throw new Error('Você já foi aprovado para este evento');
        }
        throw new Error('Você já possui uma solicitação pendente');
      }

      const newRequest = await base44.entities.EventRequest.create({
        user_id: String(requestData.user_id),
        event_id: String(requestData.event_id),
        organizer_id: String(requestData.organizer_id),
        status: 'pending',
        message: requestData.message?.trim() || '',
        applicant_data: {
          full_name: requestData.applicant_data.full_name?.trim(),
          email: requestData.applicant_data.email?.trim().toLowerCase(),
          phone: requestData.applicant_data.phone?.trim(),
          emergency_contact: requestData.applicant_data.emergency_contact?.trim(),
          dietary_restrictions: requestData.applicant_data.dietary_restrictions?.trim(),
          special_needs: requestData.applicant_data.special_needs?.trim()
        }
      });

      try {
        await base44.entities.Notification.create({
          user_id: requestData.organizer_id,
          type: 'event_alert',
          title: '🎫 Nova Solicitação de Ingresso',
          message: `${requestData.applicant_data.full_name} solicitou acesso ao evento "${event.title}"`,
          event_id: requestData.event_id,
          is_read: false
        });
      } catch (e) {
        console.warn('Erro ao notificar organizador:', e);
      }

      return newRequest;
    },
    onSuccess: () => {
      setShowSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess('pending');
        setTimeout(onClose, 500);
      }, 3000);
    },
    onError: (error) => {
      let errorMessage = 'Erro ao enviar solicitação. Tente novamente.';
      
      if (error.message.includes('já')) {
        errorMessage = error.message;
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Sem conexão. Verifique sua internet.';
      }
      
      alert(`❌ ${errorMessage}`);
      setFormData(prev => ({ ...prev, message: '' }));
    }
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      alert('❌ Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (!user?.id || !event?.id || !event?.organizer_id) {
      alert('❌ Erro: Dados insuficientes. Recarregue a página.');
      return;
    }

    requestMutation.mutate({
      user_id: user.id,
      event_id: event.id,
      organizer_id: event.organizer_id,
      message: formData.message,
      applicant_data: {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        emergency_contact: formData.emergency_contact,
        dietary_restrictions: formData.dietary_restrictions,
        special_needs: formData.special_needs
      }
    });
  };

  if (!event || !user) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="bg-gray-900 border-red-500 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <AlertCircle className="w-5 h-5" />
              Erro
            </DialogTitle>
          </DialogHeader>
          <p className="text-gray-300">Dados insuficientes. Recarregue a página.</p>
          <Button onClick={onClose} variant="outline" className="mt-4">Fechar</Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-gray-900 via-gray-900 to-purple-900/30 border-2 border-cyan-500/50 text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <AnimatePresence mode="wait">
          {showSuccess ? (
            <motion.div
              key="success"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="py-12 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.6 }}
              >
                <CheckCircle className="w-24 h-24 text-green-400 mx-auto mb-6" />
              </motion.div>
              <h3 className="text-3xl font-bold mb-3 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                Solicitação Enviada! 🎉
              </h3>
              <p className="text-gray-300 text-lg mb-6 px-4">
                O organizador foi notificado e você receberá uma resposta em breve.
              </p>
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-full">
                <Sparkles className="w-5 h-5 text-green-400" />
                <span className="text-green-300 font-semibold">Aguardando aprovação...</span>
              </div>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <DialogHeader className="border-b border-gray-700/50 pb-4 mb-4">
                <DialogTitle className="text-2xl">Solicitar Acesso ao Evento</DialogTitle>
                <DialogDescription className="text-gray-400 mt-2">
                  <strong className="text-white text-lg block mb-1">{event.title}</strong>
                  Preencha seus dados para solicitar acesso.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label className="text-gray-300 text-sm mb-2 block font-semibold">Nome Completo *</Label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    placeholder="Seu nome completo"
                    className={`bg-gray-800/50 border-gray-600 text-white ${validationErrors.full_name ? 'border-red-500' : ''}`}
                    disabled={requestMutation.isPending}
                  />
                  {validationErrors.full_name && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {validationErrors.full_name}
                    </p>
                  )}
                </div>

                <div>
                  <Label className="text-gray-300 text-sm mb-2 block font-semibold">Email *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="seu@email.com"
                    className={`bg-gray-800/50 border-gray-600 text-white ${validationErrors.email ? 'border-red-500' : ''}`}
                    disabled={requestMutation.isPending}
                  />
                  {validationErrors.email && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {validationErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <Label className="text-gray-300 text-sm mb-2 block font-semibold">Telefone *</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(11) 99999-9999"
                    className={`bg-gray-800/50 border-gray-600 text-white ${validationErrors.phone ? 'border-red-500' : ''}`}
                    disabled={requestMutation.isPending}
                  />
                  {validationErrors.phone && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {validationErrors.phone}
                    </p>
                  )}
                </div>

                <details className="group">
                  <summary className="cursor-pointer text-sm text-cyan-400 hover:text-cyan-300 py-2">
                    + Informações Adicionais (opcional)
                  </summary>
                  <div className="space-y-3 mt-2">
                    <div>
                      <Label className="text-gray-400 text-xs mb-1 block">Contato de Emergência</Label>
                      <Input
                        value={formData.emergency_contact}
                        onChange={(e) => handleInputChange('emergency_contact', e.target.value)}
                        placeholder="Nome e telefone"
                        className="bg-gray-800/30 border-gray-700 text-white text-sm"
                        disabled={requestMutation.isPending}
                      />
                    </div>
                    <div>
                      <Label className="text-gray-400 text-xs mb-1 block">Restrições Alimentares</Label>
                      <Input
                        value={formData.dietary_restrictions}
                        onChange={(e) => handleInputChange('dietary_restrictions', e.target.value)}
                        placeholder="Ex: vegetariano"
                        className="bg-gray-800/30 border-gray-700 text-white text-sm"
                        disabled={requestMutation.isPending}
                      />
                    </div>
                    <div>
                      <Label className="text-gray-400 text-xs mb-1 block">Necessidades Especiais</Label>
                      <Input
                        value={formData.special_needs}
                        onChange={(e) => handleInputChange('special_needs', e.target.value)}
                        placeholder="Ex: acessibilidade"
                        className="bg-gray-800/30 border-gray-700 text-white text-sm"
                        disabled={requestMutation.isPending}
                      />
                    </div>
                  </div>
                </details>

                <div>
                  <Label className="text-gray-300 text-sm mb-2 block font-semibold">Mensagem (opcional)</Label>
                  <Textarea
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    placeholder="Por que você quer participar?"
                    className="bg-gray-800/50 border-gray-600 text-white h-24 resize-none"
                    disabled={requestMutation.isPending}
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">{formData.message.length}/500</p>
                </div>

                {Object.keys(validationErrors).length > 0 && (
                  <Alert className="bg-red-900/20 border-red-500/50">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <AlertDescription className="text-red-300 text-sm">
                      Corrija os erros acima antes de enviar.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-3 pt-4 border-t border-gray-700/50">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="flex-1 border-gray-600"
                    disabled={requestMutation.isPending}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-cyan-600 to-purple-600"
                    disabled={requestMutation.isPending || Object.keys(validationErrors).length > 0}
                  >
                    {requestMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Enviar Solicitação
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}