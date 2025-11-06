import React, { useState } from "react";
import { User } from "@/entities/User";
import { UploadFile } from "@/integrations/Core";
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
import { Loader2, X } from "lucide-react";

export default function EditProfileModal({ user, onClose, onUpdate }) {
  const [formData, setFormData] = useState({
    full_name: user.full_name || "",
    bio: user.bio || "",
    avatar_url: user.avatar_url || ""
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      handleInputChange("avatar_url", file_url);
    } catch (error) {
      console.error("Erro no upload:", error);
      alert("Falha no upload da imagem.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await User.updateMyUserData(formData);
      onUpdate(); // Recarrega os dados do perfil na página
      onClose(); // Fecha o modal
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      alert("Erro ao atualizar perfil. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-purple-500 text-white">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4"
          >
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>
        <div className="py-6 space-y-6">
          <div className="text-center">
            <label htmlFor="avatar-upload" className="cursor-pointer group relative">
              <img
                src={formData.avatar_url}
                alt="Avatar"
                className="w-24 h-24 rounded-full mx-auto object-cover border-2 border-gray-600 group-hover:opacity-70 transition-opacity"
              />
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <span className="text-sm">Alterar</span>
                )}
              </div>
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
              disabled={uploading}
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Nome Completo</label>
            <Input
              value={formData.full_name}
              onChange={(e) => handleInputChange("full_name", e.target.value)}
              className="bg-gray-800 border-gray-600"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Bio</label>
            <Textarea
              value={formData.bio}
              onChange={(e) => handleInputChange("bio", e.target.value)}
              className="bg-gray-800 border-gray-600 h-24"
              placeholder="Fale um pouco sobre você e suas vibes..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-600 text-gray-300"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || uploading}
            className="bg-gradient-to-r from-purple-600 to-pink-600"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}