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
import { Loader2, Send, AlertCircle, CheckCircle, Sparkles, PartyPopper } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function EventRequestModal({ event, user, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
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

    if (!formData.full_name || formData.full_name.trim().length === 0) {
      errors.full_name = 'Nome completo é obrigatório';
    } else if (formData.full_name.trim().length < 2) {
      errors.full_name = 'Nome deve ter no mínimo 2 caracteres';
    }

    if (!formData.email || formData.email.trim().length === 0) {
      errors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email inválido';
    }

    if (!formData.phone || formData.phone.trim().length === 0) {
      errors.phone = 'Telefone é obrigatório';
    } else {
      const cleanPhone = formData.phone.replace(/\D/g, '');
      if (cleanPhone.length < 10 || cleanPhone.length > 11) {
        errors.phone = 'Telefone inválido (mínimo 10 dígitos)';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const requestMutation = useMutation({
    mutationFn: async (requestData) => {
      console.log('📤 Enviando solicitação:', requestData);

      if (!requestData.user_id) {
        throw new Error('Usuário não identificado');
      }

      if (!requestData.event_id) {
        throw new Error('Evento não identificado');
      }

      if (!requestData.organizer_id) {
        throw new Error('Organizador não identificado');
      }

      const normalizedData = {
        user_id: String(requestData.user_id),
        event_id: String(requestData.event_id),
        organizer_id: String(requestData.organizer_id),
        status: 'pending',
        message: (requestData.message || '').trim(),
        applicant_data: {
          full_name: (requestData.applicant_data.full_name || '').trim(),
          email: (requestData.applicant_data.email || '').trim().toLowerCase(),
          phone: (requestData.applicant_data.phone || '').trim(),
          emergency_contact: (requestData.applicant_data.emergency_contact || '').trim(),
          dietary_restrictions: (requestData.applicant_data.dietary_restrictions || '').trim(),
          special_needs: (requestData.applicant_data.special_needs || '').trim()
        }
      };

      console.log('📦 Dados normalizados:', normalizedData);

      try {
        const existingRequests = await base44.entities.EventRequest.filter({
          user_id: normalizedData.user_id,
          event_id: normalizedData.event_id,
          status: { $in: ['pending', 'approved'] }
        });

        if (existingRequests && existingRequests.length > 0) {
          const existing = existingRequests[0];
          if (existing.status === 'approved') {
            throw new Error('Você já foi aprovado para este evento');
          } else {
            throw new Error('Você já possui uma solicitação pendente para este evento');
          }
        }
      } catch (error) {
        if (error.message.includes('já')) {
          throw error;
        }
        console.warn('⚠️ Não foi possível verificar solicitações existentes:', error);
      }

      const result = await base44.entities.EventRequest.create(normalizedData);
      console.log('✅ Solicitação criada:', result);

      return result;
    },
    onSuccess: (data) => {
      console.log('✅ Sucesso ao criar solicitação:', data);
      setShowSuccess(true);

      setTimeout(() => {
        if (onSuccess) onSuccess('pending');
        setTimeout(() => {
          onClose();
        }, 500);
      }, 3000);
    },
    onError: (error) => {
      console.error('❌ Erro ao criar solicitação:', error);
      
      let errorMessage = 'Erro ao enviar solicitação. Tente novamente.';
      
      if (error.message.includes('já')) {
        errorMessage = error.message;
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Sem conexão. Verifique sua internet e tente novamente.';
      } else if (error.message.includes('Usuário não identificado')) {
        errorMessage = 'Você precisa estar logado para solicitar acesso.';
      }
      
      alert(`❌ ${errorMessage}`);
    }
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

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
      alert('❌ Por favor, preencha todos os campos obrigatórios corretamente.');
      return;
    }

    if (!user?.id) {
      alert('❌ Erro: Usuário não identificado. Faça login novamente.');
      return;
    }

    if (!event?.id) {
      alert('❌ Erro: Evento não identificado. Recarregue a página.');
      return;
    }

    if (!event?.organizer_id) {
      alert('❌ Erro: Organizador não identificado. Evento inválido.');
      return;
    }

    const requestData = {
      user_id: user.id,
      event_id: event.id,
      organizer_id: event.organizer_id,
      status: 'pending',
      message: formData.message,
      applicant_data: {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        emergency_contact: formData.emergency_contact,
        dietary_restrictions: formData.dietary_restrictions,
        special_needs: formData.special_needs
      }
    };

    console.log('📋 Dados do formulário:', requestData);

    requestMutation.mutate(requestData);
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
          <p className="text-gray-300">
            Dados insuficientes para solicitar acesso. Recarregue a página e tente novamente.
          </p>
          <Button onClick={onClose} variant="outline" className="mt-4">
            Fechar
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-gray-900 via-gray-900 to-purple-900/30 border-2 border-cyan-500/50 text-white max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <AnimatePresence mode="wait">
          {showSuccess ? (
            <motion.div
              key="success"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="py-12 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.6, delay: 0.2 }}
              >
                <div className="relative inline-block">
                  <CheckCircle className="w-24 h-24 text-green-400 mx-auto mb-6" />
                  <motion.div
                    className="absolute inset-0"
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.5, 0, 0.5]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <div className="w-24 h-24 border-4 border-green-400 rounded-full" />
                  </motion.div>
                </div>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <h3 className="text-3xl font-bold mb-3 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  Solicitação Enviada! 🎉
                </h3>
                <p className="text-gray-300 text-lg mb-6 px-4">
                  O organizador receberá sua solicitação e você será notificado da resposta em breve.
                </p>

                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6, type: "spring" }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-full"
                >
                  <Sparkles className="w-5 h-5 text-green-400" />
                  <span className="text-green-300 font-semibold">
                    Aguardando aprovação...
                  </span>
                </motion.div>
              </motion.div>

              {/* Confetti Effect */}
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full"
                  style={{
                    left: `${50}%`,
                    top: `${50}%`,
                  }}
                  animate={{
                    x: [(Math.random() - 0.5) * 200],
                    y: [(Math.random() - 0.5) * 200],
                    opacity: [1, 0],
                    scale: [1, 0]
                  }}
                  transition={{
                    duration: 1,
                    delay: i * 0.05
                  }}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <DialogHeader className="border-b border-gray-700/50 pb-4 mb-4">
                <DialogTitle className="text-2xl flex items-center gap-2">
                  <PartyPopper className="w-6 h-6 text-cyan-400" />
                  Solicitar Acesso ao Evento
                </DialogTitle>
                <DialogDescription className="text-gray-400 mt-2">
                  <strong className="text-white text-lg block mb-1">{event.title}</strong>
                  Preencha seus dados para solicitar acesso a este evento exclusivo.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nome Completo */}
                <div>
                  <Label className="text-gray-300 text-sm mb-2 block font-semibold">
                    Nome Completo *
                  </Label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    placeholder="Seu nome completo"
                    className={`bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-500 focus:border-cyan-500 transition-all ${
                      validationErrors.full_name ? 'border-red-500 focus:border-red-500' : ''
                    }`}
                    disabled={requestMutation.isPending}
                  />
                  {validationErrors.full_name && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-400 text-xs mt-1 flex items-center gap-1"
                    >
                      <AlertCircle className="w-3 h-3" />
                      {validationErrors.full_name}
                    </motion.p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <Label className="text-gray-300 text-sm mb-2 block font-semibold">
                    Email *
                  </Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="seu@email.com"
                    className={`bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-500 focus:border-cyan-500 transition-all ${
                      validationErrors.email ? 'border-red-500 focus:border-red-500' : ''
                    }`}
                    disabled={requestMutation.isPending}
                  />
                  {validationErrors.email && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-400 text-xs mt-1 flex items-center gap-1"
                    >
                      <AlertCircle className="w-3 h-3" />
                      {validationErrors.email}
                    </motion.p>
                  )}
                </div>

                {/* Telefone */}
                <div>
                  <Label className="text-gray-300 text-sm mb-2 block font-semibold">
                    Telefone *
                  </Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(11) 99999-9999"
                    className={`bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-500 focus:border-cyan-500 transition-all ${
                      validationErrors.phone ? 'border-red-500 focus:border-red-500' : ''
                    }`}
                    disabled={requestMutation.isPending}
                  />
                  {validationErrors.phone && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-400 text-xs mt-1 flex items-center gap-1"
                    >
                      <AlertCircle className="w-3 h-3" />
                      {validationErrors.phone}
                    </motion.p>
                  )}
                </div>

                {/* Campos Opcionais - Collapsible */}
                <details className="group">
                  <summary className="cursor-pointer text-sm text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-2 py-2">
                    <span>+ Informações Adicionais (opcional)</span>
                  </summary>
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-4 mt-2"
                  >
                    <div>
                      <Label className="text-gray-400 text-xs mb-1 block">
                        Contato de Emergência
                      </Label>
                      <Input
                        value={formData.emergency_contact}
                        onChange={(e) => handleInputChange('emergency_contact', e.target.value)}
                        placeholder="Nome e telefone"
                        className="bg-gray-800/30 border-gray-700 text-white text-sm placeholder:text-gray-600"
                        disabled={requestMutation.isPending}
                      />
                    </div>

                    <div>
                      <Label className="text-gray-400 text-xs mb-1 block">
                        Restrições Alimentares
                      </Label>
                      <Input
                        value={formData.dietary_restrictions}
                        onChange={(e) => handleInputChange('dietary_restrictions', e.target.value)}
                        placeholder="Ex: vegetariano, intolerância à lactose"
                        className="bg-gray-800/30 border-gray-700 text-white text-sm placeholder:text-gray-600"
                        disabled={requestMutation.isPending}
                      />
                    </div>

                    <div>
                      <Label className="text-gray-400 text-xs mb-1 block">
                        Necessidades Especiais
                      </Label>
                      <Input
                        value={formData.special_needs}
                        onChange={(e) => handleInputChange('special_needs', e.target.value)}
                        placeholder="Ex: acessibilidade, PCD"
                        className="bg-gray-800/30 border-gray-700 text-white text-sm placeholder:text-gray-600"
                        disabled={requestMutation.isPending}
                      />
                    </div>
                  </motion.div>
                </details>

                {/* Mensagem */}
                <div>
                  <Label className="text-gray-300 text-sm mb-2 block font-semibold">
                    Mensagem para o Organizador (opcional)
                  </Label>
                  <Textarea
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    placeholder="Por que você quer participar deste evento?"
                    className="bg-gray-800/50 border-gray-600 text-white h-24 resize-none placeholder:text-gray-500 focus:border-cyan-500 transition-all"
                    disabled={requestMutation.isPending}
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.message.length}/500 caracteres
                  </p>
                </div>

                {/* Aviso de Campos Obrigatórios */}
                {Object.keys(validationErrors).length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Alert className="bg-red-900/20 border-red-500/50">
                      <AlertCircle className="h-4 w-4 text-red-400" />
                      <AlertDescription className="text-red-300 text-sm">
                        Por favor, corrija os erros acima antes de enviar.
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                )}

                {/* Botões */}
                <div className="flex gap-3 pt-4 border-t border-gray-700/50">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white transition-all"
                    disabled={requestMutation.isPending}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 shadow-lg shadow-cyan-500/20 transition-all"
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