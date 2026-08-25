import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send, Users, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';

export default function Chat() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showChatList, setShowChatList] = useState(true);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      try {
        const userData = await base44.auth.me();
        if (!userData) {
          setLoading(false);
          return;
        }
        setUser(userData);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Buscar chats reais do usuário (diretos + grupos + eventos)
  const { data: chats = [], isLoading: loadingChats } = useQuery({
    queryKey: ['userChats', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const userChats = await base44.entities.Chat.filter({
        participants: { $in: [user.id] }
      });
      return userChats.sort((a, b) =>
        new Date(b.last_message_at || b.created_date) - new Date(a.last_message_at || a.created_date)
      );
    },
    enabled: !!user?.id,
    refetchInterval: 5000,
  });

  // Buscar mensagens reais do chat selecionado
  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['chatMessages', selectedChat?.id],
    queryFn: async () => {
      if (!selectedChat?.id) return [];
      const msgs = await base44.entities.ChatMessage.filter({ chat_id: selectedChat.id });
      return msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    },
    enabled: !!selectedChat?.id,
    refetchInterval: 2000,
  });

  // Subscrição realtime de mensagens
  useEffect(() => {
    if (!selectedChat?.id) return;
    const unsub = base44.entities.ChatMessage.subscribe((evt) => {
      if (evt.data?.chat_id !== selectedChat.id) return;
      queryClient.invalidateQueries(['chatMessages', selectedChat.id]);
    });
    return unsub;
  }, [selectedChat?.id, queryClient]);

  const sendMessageMutation = useMutation({
    mutationFn: async (text) => {
      const newMsg = await base44.entities.ChatMessage.create({
        chat_id: selectedChat.id,
        sender_id: user.id,
        sender_name: user.full_name || user.email?.split('@')[0] || 'Usuário',
        message: text,
        message_type: 'text',
      });
      // Atualizar last_message_at do chat
      await base44.entities.Chat.update(selectedChat.id, {
        last_message_at: new Date().toISOString(),
      });
      return newMsg;
    },
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries(['chatMessages', selectedChat.id]);
      queryClient.invalidateQueries(['userChats', user?.id]);
    },
  });

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    setShowChatList(false);
  };

  const handleSendMessage = () => {
    if (message.trim() && selectedChat && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate(message.trim());
    }
  };

  const filteredChats = chats.filter(chat =>
    chat.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatMessageTime = (time) => {
    if (!time) return '';
    try {
      return format(new Date(time), 'HH:mm', { locale: ptBR });
    } catch {
      return '';
    }
  };

  const formatChatTime = (time) => {
    if (!time) return '';
    const now = new Date();
    const t = new Date(time);
    const diffInHours = (now - t) / (1000 * 60 * 60);
    if (diffInHours < 24) return format(t, 'HH:mm', { locale: ptBR });
    if (diffInHours < 48) return 'Ontem';
    if (diffInHours < 168) return format(t, 'EEEE', { locale: ptBR });
    return format(t, 'dd/MM', { locale: ptBR });
  };

  if (loading) {
    return (
      <div className="w-full h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="w-full h-[calc(100vh-80px)] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Chat SUBLINX</h2>
          <p className="text-gray-400 mb-6">
            Faça login para acessar conversas com organizadores e membros da cena.
          </p>
          <Button onClick={() => navigate(createPageUrl("BemVindo"))}
            className="bg-gradient-to-r from-cyan-600 to-purple-600">
            Entrar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] md:h-[calc(100vh-120px)] overflow-hidden flex flex-col"
      style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #000000 60%, #0d0d1f 100%)' }}>

      {/* Header Mobile */}
      <div className="md:hidden px-4 py-3 border-b flex-shrink-0"
        style={{ borderColor: 'rgba(6,182,212,0.2)', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)' }}>
        {selectedChat && !showChatList ? (
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setShowChatList(true)}
              className="text-cyan-400 hover:bg-cyan-500/10 h-9 w-9">
              <X className="w-5 h-5" />
            </Button>
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)' }}>
              {selectedChat.type === 'group' ? (
                <Users className="w-4 h-4 text-cyan-400" />
              ) : (
                <MessageCircle className="w-4 h-4 text-cyan-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-white truncate text-sm">{selectedChat.name}</h2>
              {selectedChat.type === 'group' && (
                <p className="text-[10px] text-cyan-400">
                  {selectedChat.participants?.length || 0} membros
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-cyan-400"
                style={{ filter: 'drop-shadow(0 0 6px rgba(6,182,212,0.8))' }} />
              <h1 className="text-lg font-bold"
                style={{ background: 'linear-gradient(to right, #22d3ee, #a855f7)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Chat SUBLINX
              </h1>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex justify-between items-center px-6 py-4 border-b flex-shrink-0"
        style={{ borderColor: 'rgba(6,182,212,0.2)', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(168,85,247,0.2))',
              border: '1.5px solid rgba(6,182,212,0.5)', boxShadow: '0 0 20px rgba(6,182,212,0.3)' }}>
            <MessageCircle className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold"
              style={{ background: 'linear-gradient(to right, #22d3ee, #a855f7)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Chat SUBLINX
            </h1>
            <p className="text-xs text-gray-500">Conecte-se com organizadores e membros da cena</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Lista de Chats */}
        <div className={`${showChatList ? 'flex' : 'hidden'} md:flex w-full md:w-72 lg:w-80 flex-col flex-shrink-0 border-r`}
          style={{ borderColor: 'rgba(6,182,212,0.15)', background: 'rgba(0,0,0,0.4)' }}>

          <div className="p-3 border-b flex-shrink-0" style={{ borderColor: 'rgba(6,182,212,0.1)' }}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Buscar conversas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-sm text-white placeholder:text-gray-600 h-9"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: '10px' }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingChats ? (
              <div className="p-4 text-center text-gray-500 text-sm">Carregando conversas...</div>
            ) : filteredChats.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">
                  {searchTerm ? 'Nenhuma conversa encontrada' : 'Você ainda não tem conversas'}
                </p>
                {!searchTerm && (
                  <p className="text-gray-600 text-xs mt-2">
                    Participe de eventos e conecte-se com organizadores para iniciar conversas.
                  </p>
                )}
              </div>
            ) : (
              filteredChats.map((chat) => {
                const isActive = selectedChat?.id === chat.id;
                return (
                  <div key={chat.id} onClick={() => handleSelectChat(chat)}
                    className="px-3 py-3 cursor-pointer transition-all duration-200 border-b relative"
                    style={{
                      borderColor: 'rgba(6,182,212,0.08)',
                      background: isActive
                        ? 'linear-gradient(90deg, rgba(6,182,212,0.1), rgba(168,85,247,0.05))'
                        : 'transparent',
                      borderLeft: isActive ? '3px solid #06b6d4' : '3px solid transparent',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative flex-shrink-0">
                        <div className="w-11 h-11 rounded-full flex items-center justify-center"
                          style={{
                            background: isActive ? 'rgba(6,182,212,0.2)' : 'rgba(168,85,247,0.1)',
                            border: isActive ? '2px solid rgba(6,182,212,0.6)' : '2px solid rgba(255,255,255,0.1)',
                          }}>
                          {chat.type === 'group' ? (
                            <Users className="w-5 h-5 text-cyan-400" />
                          ) : chat.avatar_url ? (
                            <img src={chat.avatar_url} alt={chat.name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <MessageCircle className="w-5 h-5 text-purple-400" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <h3 className="font-semibold text-sm truncate"
                            style={{ color: isActive ? '#22d3ee' : '#f1f5f9' }}>
                            {chat.name}
                          </h3>
                          <span className="text-[10px] text-gray-600 flex-shrink-0 ml-2">
                            {formatChatTime(chat.last_message_at)}
                          </span>
                        </div>
                        {chat.type === 'group' && (
                          <p className="text-[10px] text-gray-600 mb-0.5">
                            {chat.participants?.length || 0} membros
                          </p>
                        )}
                        <p className="text-xs text-gray-500 truncate">
                          {chat.description || 'Toque para abrir'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Área de Mensagens */}
        <div className={`${!showChatList ? 'flex' : 'hidden'} md:flex flex-1 flex-col overflow-hidden`}
          style={{ background: 'rgba(0,0,0,0.2)' }}>
          {selectedChat ? (
            <>
              {/* Chat Header Desktop */}
              <div className="hidden md:flex items-center gap-3 px-5 py-3 border-b flex-shrink-0"
                style={{ borderColor: 'rgba(6,182,212,0.15)', background: 'rgba(0,0,0,0.3)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ border: '2px solid rgba(6,182,212,0.5)', background: 'rgba(6,182,212,0.1)' }}>
                  {selectedChat.type === 'group' ? (
                    <Users className="w-5 h-5 text-cyan-400" />
                  ) : selectedChat.avatar_url ? (
                    <img src={selectedChat.avatar_url} alt={selectedChat.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <MessageCircle className="w-5 h-5 text-purple-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="font-bold text-white text-sm">{selectedChat.name}</h2>
                  {selectedChat.type === 'group' && (
                    <p className="text-xs text-cyan-400/70">
                      {selectedChat.participants?.length || 0} membros
                    </p>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ scrollBehavior: 'smooth' }}>
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <MessageCircle className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">Nenhuma mensagem ainda</p>
                      <p className="text-gray-600 text-xs mt-1">Envie a primeira mensagem!</p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender_id === user.id;
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        {!isMe && (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                            style={{ background: 'rgba(168,85,247,0.15)', border: '1.5px solid rgba(168,85,247,0.4)' }}>
                            <span className="text-purple-300 font-bold text-xs">
                              {msg.sender_name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                        )}
                        <div className={`flex flex-col max-w-[72%] ${isMe ? 'items-end' : 'items-start'}`}>
                          {!isMe && (
                            <span className="text-xs text-purple-400 mb-1 px-1">{msg.sender_name}</span>
                          )}
                          <div className="px-4 py-2.5 rounded-2xl text-sm break-words"
                            style={isMe ? {
                              background: 'linear-gradient(135deg, #0891b2, #7c3aed)',
                              boxShadow: '0 0 15px rgba(6,182,212,0.3)',
                              color: '#fff'
                            } : {
                              background: 'rgba(255,255,255,0.06)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              color: '#e2e8f0'
                            }}>
                            {msg.message}
                          </div>
                          <span className="text-[10px] text-gray-600 mt-1 px-1">
                            {formatMessageTime(msg.created_date)}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="flex-shrink-0 p-3 border-t"
                style={{ borderColor: 'rgba(6,182,212,0.15)', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)' }}>
                <div className="flex gap-2 items-center">
                  <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Mensagem..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 bg-transparent outline-none text-white text-sm placeholder:text-gray-600 px-2"
                    style={{ borderBottom: '1px solid rgba(6,182,212,0.2)' }}
                  />
                  <button onClick={handleSendMessage}
                    disabled={!message.trim() || sendMessageMutation.isPending}
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all hover:scale-110 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(135deg, #0891b2, #7c3aed)', boxShadow: '0 0 14px rgba(6,182,212,0.5)' }}>
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.1), rgba(168,85,247,0.1))',
                    border: '1.5px solid rgba(6,182,212,0.2)' }}>
                  <MessageCircle className="w-9 h-9 text-cyan-500/50" />
                </div>
                <h3 className="text-base font-semibold text-gray-500 mb-1">Selecione uma conversa</h3>
                <p className="text-sm text-gray-700">Escolha da lista ao lado para começar</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}