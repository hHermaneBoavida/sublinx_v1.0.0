import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Loader2, X, Upload, Camera } from "lucide-react";
import { motion } from "framer-motion";

export default function EditProfileModal({ user, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    full_name: user.full_name || "",
    bio: user.bio || "",
    avatar_url: user.avatar_url || "",
    phone: user.phone || "",
    city: user.city || "",
    state: user.state || ""
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validação
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      alert("Formato inválido. Use JPG, PNG ou WEBP.");
      return;
    }

    if (file.size > maxSize) {
      alert("Imagem muito grande. Máximo 5MB.");
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      handleInputChange("avatar_url", file_url);
    } catch (error) {
      console.error("Erro no upload:", error);
      alert("❌ Falha no upload da imagem. Tente novamente.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.full_name || formData.full_name.trim().length < 3) {
      alert("Nome deve ter pelo menos 3 caracteres");
      return;
    }

    setLoading(true);
    try {
      await base44.auth.updateMe({
        full_name: formData.full_name.trim(),
        bio: formData.bio?.trim() || "",
        avatar_url: formData.avatar_url || "",
        phone: formData.phone?.trim() || "",
        city: formData.city?.trim() || "",
        state: formData.state?.trim() || ""
      });

      // Invalida o cache do usuário para forçar reload
      queryClient.invalidateQueries(['currentUser']);
      queryClient.invalidateQueries(['followers']);
      queryClient.invalidateQueries(['following']);

      alert("✅ Perfil atualizado com sucesso!");
      onClose();
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      alert(`❌ Erro ao atualizar perfil: ${error.message || 'Tente novamente'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-purple-500/30 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Editar Perfil
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </DialogHeader>

        <div className="py-6 space-y-6">
          {/* Avatar Upload */}
          <div className="text-center">
            <label htmlFor="avatar-upload" className="cursor-pointer group relative inline-block">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                <img
                  src={formData.avatar_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/5048ab8ec_perfil.png"}
                  alt="Avatar"
                  className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-cyan-500/50 group-hover:border-cyan-500 transition-all shadow-lg shadow-cyan-500/30"
                />
                <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploading ? (
                    <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                  ) : (
                    <>
                      <Camera className="w-8 h-8 text-white mb-1" />
                      <span className="text-sm font-semibold">Alterar</span>
                    </>
                  )}
                </div>
              </motion.div>
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleImageUpload}
              disabled={uploading || loading}
            />
            <p className="text-xs text-gray-500 mt-2">
              JPG, PNG ou WEBP • Máximo 5MB
            </p>
          </div>

          {/* Nome */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block font-semibold">
              Nome Completo *
            </label>
            <Input
              value={formData.full_name}
              onChange={(e) => handleInputChange("full_name", e.target.value)}
              className="bg-gray-800 border-gray-600 text-white focus:border-cyan-500"
              placeholder="Seu nome completo"
              maxLength={50}
            />
          </div>

          {/* Bio */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block font-semibold">
              Bio
            </label>
            <Textarea
              value={formData.bio}
              onChange={(e) => handleInputChange("bio", e.target.value)}
              className="bg-gray-800 border-gray-600 text-white h-24 focus:border-cyan-500"
              placeholder="Fale um pouco sobre você e suas vibes..."
              maxLength={200}
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {formData.bio?.length || 0}/200
            </p>
          </div>

          {/* Contato - Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block font-semibold">
                Telefone
              </label>
              <Input
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className="bg-gray-800 border-gray-600 text-white focus:border-cyan-500"
                placeholder="(00) 00000-0000"
                maxLength={20}
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-2 block font-semibold">
                Cidade
              </label>
              <Input
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
                className="bg-gray-800 border-gray-600 text-white focus:border-cyan-500"
                placeholder="São Paulo"
                maxLength={50}
              />
            </div>
          </div>

          {/* Estado */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block font-semibold">
              Estado
            </label>
            <Input
              value={formData.state}
              onChange={(e) => handleInputChange("state", e.target.value.toUpperCase())}
              className="bg-gray-800 border-gray-600 text-white focus:border-cyan-500"
              placeholder="SP"
              maxLength={2}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
            disabled={loading || uploading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || uploading || !formData.full_name}
            className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Salvando...
              </>
            ) : (
              "Salvar Alterações"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}