import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit } from "lucide-react";
import EditProfileModal from "./EditProfileModal";

export default function ProfileHeader({ user, onProfileUpdate }) {
  const [showEditModal, setShowEditModal] = useState(false);

  return (
    <>
      <div className="relative text-center rounded-xl bg-gradient-to-b from-gray-900 via-gray-900/80 to-black/50 border border-gray-700 p-8">
        {/* Edit Button */}
        <Button
          variant="outline"
          size="icon"
          className="absolute top-4 right-4 bg-black/50 border-gray-600 hover:bg-gray-800"
          onClick={() => setShowEditModal(true)}
        >
          <Edit className="w-4 h-4" />
        </Button>
        
        {/* Profile Picture */}
        <img
          src={user.avatar_url}
          alt={user.full_name}
          className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-cyan-500/50 shadow-lg"
        />

        {/* Name and Level */}
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-white">{user.full_name}</h1>
          <p className="text-lg text-gray-400">@{user.email?.split('@')[0]}</p>
        </div>

        {/* Badges */}
        <div className="flex justify-center flex-wrap gap-2 mb-4">
          {user.is_pro_member && <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 border-0">Membro PRO</Badge>}
          {user.verified_organizer && <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 border-0">Organizador Verificado</Badge>}
        </div>

        {/* Bio */}
        {user.bio && <p className="max-w-2xl mx-auto text-gray-300">{user.bio}</p>}

        {/* Music Preferences */}
        {user.music_preferences && user.music_preferences.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">CURTE</h3>
            <div className="flex justify-center flex-wrap gap-2">
              {user.music_preferences.map(pref => (
                <Badge key={pref} variant="outline" className="border-cyan-500/30 text-cyan-300">
                  {pref}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {showEditModal && (
        <EditProfileModal
          user={user}
          onClose={() => setShowEditModal(false)}
          onUpdate={onProfileUpdate}
        />
      )}
    </>
  );
}