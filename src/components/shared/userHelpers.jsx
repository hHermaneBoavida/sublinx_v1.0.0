// Helper para obter o nome de exibição do usuário
export function getUserDisplayName(user) {
  if (!user) return 'Usuário';
  return user.display_name || user.full_name || 'Usuário';
}

// Helper para obter o avatar do usuário
export function getUserAvatar(user, isOrganizerContext = false) {
  if (!user) return 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/5048ab8ec_perfil.png';
  
  if (isOrganizerContext && user.organizer_avatar) {
    return user.organizer_avatar;
  }
  
  return user.avatar_url || 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/5048ab8ec_perfil.png';
}