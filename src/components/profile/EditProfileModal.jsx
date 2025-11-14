import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, X, Camera } from "lucide-react";

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

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024;

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
      setFormData(prev => ({ ...prev, avatar_url: file_url }));
    } catch (error) {
      console.error("Erro no upload:", error);
      alert("❌ Falha no upload da imagem.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    const trimmedName = formData.full_name.trim();
    
    if (!trimmedName || trimmedName.length < 3) {
      alert("Nome deve ter pelo menos 3 caracteres");
      return;
    }

    setLoading(true);
    try {
      // USA base44.auth.updateMe para atualizar o usuário atual
      await base44.auth.updateMe({
        full_name: trimmedName,
        bio: formData.bio?.trim() || null,
        avatar_url: formData.avatar_url || null,
        phone: formData.phone?.trim() || null,
        city: formData.city?.trim() || null,
        state: formData.state?.trim() || null
      });

      // Invalida e refetch todos os caches relacionados
      queryClient.invalidateQueries(['currentUser']);
      queryClient.invalidateQueries(['profileUser', user.id]);
      
      // Força reload completo da página após sucesso
      setTimeout(() => {
        window.location.reload();
      }, 500);

      alert("✅ Perfil atualizado!");
      onClose();
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      alert(`❌ Erro: ${error.message || 'Tente novamente'}`);
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">Editar Perfil</DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </Button>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Avatar */}
          <div className="text-center">
            <label htmlFor="avatar-upload" className="cursor-pointer group relative inline-block">
              <img
                src={formData.avatar_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/5048ab8ec_perfil.png"}
                alt="Avatar"
                className="w-24 h-24 rounded-full mx-auto object-cover border-2 border-gray-700 group-hover:border-cyan-500 transition-all"
              />
              <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                ) : (
                  <>
                    <Camera className="w-6 h-6 text-white mb-1" />
                    <span className="text-xs font-semibold">Alterar</span>
                  </>
                )}
              </div>
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleImageUpload}
              disabled={uploading || loading}
            />
            <p className="text-xs text-gray-500 mt-2">JPG, PNG ou WEBP • Máx 5MB</p>
          </div>

          {/* Nome */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Nome Completo *</label>
            <Input
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              className="bg-gray-800 border-gray-700 text-white focus:border-cyan-500"
              placeholder="Seu nome completo"
              maxLength={50}
            />
          </div>

          {/* Bio */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Bio</label>
            <Textarea
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              className="bg-gray-800 border-gray-700 text-white h-20 focus:border-cyan-500"
              placeholder="Sobre você..."
              maxLength={200}
            />
            <p className="text-xs text-gray-500 mt-1 text-right">{formData.bio?.length || 0}/200</p>
          </div>

          {/* Contato */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Telefone</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-white focus:border-cyan-500"
                placeholder="(00) 00000-0000"
                maxLength={20}
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-2 block">Cidade</label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-white focus:border-cyan-500"
                placeholder="São Paulo"
                maxLength={50}
              />
            </div>
          </div>

          {/* Estado */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Estado</label>
            <Input
              value={formData.state}
              onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value.toUpperCase() }))}
              className="bg-gray-800 border-gray-700 text-white focus:border-cyan-500"
              placeholder="SP"
              maxLength={2}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="border-gray-700 text-gray-300" disabled={loading || uploading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || uploading || !formData.full_name}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Salvando...
              </>
            ) : (
              "Salvar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}