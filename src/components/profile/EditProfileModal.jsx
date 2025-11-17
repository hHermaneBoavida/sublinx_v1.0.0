import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, X, Camera, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getUserDisplayName } from "../shared/userHelpers";

export default function EditProfileModal({ user, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    display_name: getUserDisplayName(user),
    bio: user.bio || "",
    avatar_url: user.avatar_url || "",
    phone: user.phone || "",
    city: user.city || "",
    state: user.state || "",
    birth_date: user.birth_date || ""
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      setError("Formato inválido. Use JPG, PNG ou WEBP.");
      return;
    }

    if (file.size > maxSize) {
      setError("Imagem muito grande. Máximo 5MB.");
      return;
    }

    setUploading(true);
    setError("");
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, avatar_url: file_url }));
    } catch (error) {
      console.error("Erro no upload:", error);
      setError("Falha no upload da imagem.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    const trimmedName = formData.display_name.trim();
    
    if (!trimmedName || trimmedName.length < 3) {
      setError("Nome deve ter pelo menos 3 caracteres");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const updateData = {
        display_name: trimmedName,
        bio: formData.bio?.trim() || "",
        avatar_url: formData.avatar_url || "",
        phone: formData.phone?.trim() || "",
        city: formData.city?.trim() || "",
        state: formData.state?.trim() || "",
        birth_date: formData.birth_date || ""
      };

      await base44.auth.updateMe(updateData);

      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['profileUser'] });
      
      onClose();

    } catch (error) {
      console.error("❌ Erro ao salvar:", error);
      setError(error.message || 'Erro ao salvar. Tente novamente.');
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
          {error && (
            <Alert className="bg-red-900/20 border-red-500/50">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-300 text-sm ml-2">
                {error}
              </AlertDescription>
            </Alert>
          )}

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

          <div>
            <label className="text-sm text-gray-400 mb-2 block">Nome de Exibição *</label>
            <Input
              value={formData.display_name}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, display_name: e.target.value }));
                setError("");
              }}
              className="bg-gray-800 border-gray-700 text-white focus:border-cyan-500"
              placeholder="Como você quer ser chamado"
              maxLength={50}
              disabled={loading || uploading}
            />
            <p className="text-xs text-gray-500 mt-1">Este é o nome que aparecerá em seu perfil</p>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">Bio</label>
            <Textarea
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              className="bg-gray-800 border-gray-700 text-white h-20 focus:border-cyan-500"
              placeholder="Sobre você..."
              maxLength={200}
              disabled={loading || uploading}
            />
            <p className="text-xs text-gray-500 mt-1 text-right">{formData.bio?.length || 0}/200</p>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">Data de Nascimento</label>
            <Input
              type="date"
              value={formData.birth_date}
              onChange={(e) => setFormData(prev => ({ ...prev, birth_date: e.target.value }))}
              className="bg-gray-800 border-gray-700 text-white focus:border-cyan-500"
              disabled={loading || uploading}
            />
            <p className="text-xs text-gray-500 mt-1">🎁 Ganhe um presente especial no seu aniversário!</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Telefone</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-white focus:border-cyan-500"
                placeholder="(00) 00000-0000"
                maxLength={20}
                disabled={loading || uploading}
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
                disabled={loading || uploading}
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">Estado</label>
            <Input
              value={formData.state}
              onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value.toUpperCase() }))}
              className="bg-gray-800 border-gray-700 text-white focus:border-cyan-500"
              placeholder="SP"
              maxLength={2}
              disabled={loading || uploading}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="border-gray-700 text-gray-300" disabled={loading || uploading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || uploading || !formData.display_name || formData.display_name.trim().length < 3}
            className="bg-cyan-600 hover:bg-cyan-700"
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