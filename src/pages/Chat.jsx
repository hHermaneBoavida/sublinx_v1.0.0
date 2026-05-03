import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, Users, Search, Plus, X, Heart, Reply, MoreVertical, Image as ImageIcon, Smile, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Chat() {
  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showChatList, setShowChatList] = useState(true);
  const navigate = useNavigate();
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const mockMessages = [
    {
      id: 1,
      sender_id: 'user1',
      sender_name: 'Alex Santos',
      sender_avatar: 'https://i.pravatar.cc/40?u=alex',
      message: 'Pessoal, quem vai no evento de sábado?',
      time: new Date(Date.now() - 2 * 60 * 60 * 1000),
      isMe: false,
      likes: 3,
      liked_by_me: false,
      replies: []
    },
    {
      id: 2,
      sender_id: 'me',
      sender_name: 'Você',
      sender_avatar: 'https://i.pravatar.cc/40?u=me',
      message: 'Eu vou! Mal posso esperar 🔥',
      time: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
      isMe: true,
      likes: 5,
      liked_by_me: false,
      replies: []
    },
    {
      id: 3,
      sender_id: 'user2',
      sender_name: 'Marina Silva',
      sender_avatar: 'https://i.pravatar.cc/40?u=marina',
      message: 'Também estarei lá! Vamos nos encontrar na entrada?',
      time: new Date(Date.now() - 1 * 60 * 60 * 1000),
      isMe: false,
      likes: 2,
      liked_by_me: true,
      replies: []
    },
    {
      id: 4,
      sender_id: 'user3',
      sender_name: 'Pedro Costa',
      sender_avatar: 'https://i.pravatar.cc/40?u=pedro',
      message: 'Alguém sabe se vai ter after?',
      time: new Date(Date.now() - 30 * 60 * 1000),
      isMe: false,
      likes: 1,
      liked_by_me: false,
      replies: []
    }
  ];

  useEffect(() => {
    const mockChats = [
      {
        id: 1,
        name: 'Grupo Techno SP',
        type: 'group',
        participants: 127,
        lastMessage: 'Alguém vai no D.Edge hoje?',
        lastMessageTime: new Date(Date.now() - 30 * 60 * 1000),
        unreadCount: 3,
        avatar: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=100&h=100&fit=crop&crop=faces'
      },
      {
        id: 2,
        name: 'Alex Santos',
        type: 'direct',
        lastMessage: 'Evento foi incrível! 🎉',
        lastMessageTime: new Date(Date.now() - 9 * 60 * 60 * 1000),
        unreadCount: 0,
        avatar: 'https://i.pravatar.cc/100?u=alex'
      },
      {
        id: 3,
        name: 'Organizadores Underground',
        type: 'group',
        participants: 45,
        lastMessage: 'Precisamos discutir o próximo evento...',
        lastMessageTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
        unreadCount: 1,
        avatar: 'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?w=100&h=100&fit=crop&crop=faces'
      },
      {
        id: 4,
        name: 'Marina Silva',
        type: 'direct',
        lastMessage: 'Conseguiu os ingressos?',
        lastMessageTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        unreadCount: 0,
        avatar: 'https://i.pravatar.cc/100?u=marina'
      }
    ];

    const initializeChat = async () => {
      try {
        const userData = await base44.auth.me();
        // CORREÇÃO: Não redirecionar, apenas mostrar mensagem
        if (!userData.is_organizer) {
          setUser(null);
          setLoading(false);
          return;
        }
        setUser(userData);
        setChats(mockChats);
      } catch (error) {
        // CORREÇÃO: Não redirecionar automaticamente
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    initializeChat();
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    setMessages(mockMessages);
    setShowChatList(false);
    // Zerar contador de não lidas ao abrir o chat
    setChats(prev => prev.map(c => c.id === chat.id ? { ...c, unreadCount: 0 } : c));
  };

  const handleSendMessage = () => {
    if (message.trim() && selectedChat) {
      const newMessage = {
        id: messages.length + 1,
        sender_id: 'me',
        sender_name: user?.full_name || 'Você',
        sender_avatar: user?.avatar_url || 'https://i.pravatar.cc/40?u=me',
        message: message,
        time: new Date(),
        isMe: true,
        likes: 0,
        liked_by_me: false,
        replies: [],
        reply_to: replyingTo
      };
      setMessages([...messages, newMessage]);
      setMessage('');
      setReplyingTo(null);
    }
  };

  const handleLikeMessage = (messageId) => {
    setMessages(messages.map(msg => 
      msg.id === messageId 
        ? { 
            ...msg, 
            liked_by_me: !msg.liked_by_me,
            likes: msg.liked_by_me ? msg.likes - 1 : msg.likes + 1
          }
        : msg
    ));
  };

  const handleReplyToMessage = (msg) => {
    setReplyingTo(msg);
  };

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatMessageTime = (time) => {
    const now = new Date();
    const diffInHours = (now - time) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return format(time, 'HH:mm', { locale: ptBR });
    } else if (diffInHours < 48) {
      return 'Ontem';
    } else if (diffInHours < 168) {
      return format(time, 'EEEE', { locale: ptBR });
    } else {
      return format(time, 'dd/MM', { locale: ptBR });
    }
  };

  if (loading) {
    return (
      <div className="w-full h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  // CORREÇÃO: Mostrar mensagem se não for organizador
  if (!user || !user.is_organizer) {
    return (
      <div className="w-full h-[calc(100vh-80px)] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">
            Chat para Organizadores
          </h2>
          <p className="text-gray-400 mb-6">
            Esta funcionalidade está disponível apenas para organizadores de eventos.
          </p>
          <Button 
            onClick={() => navigate(createPageUrl("Planos"))}
            className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700"
          >
            <Crown className="w-4 h-4 mr-2" />
            Tornar-se Organizador
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
            <Button variant="ghost" size="icon" onClick={() => setShowChatList(true)} className="text-cyan-400 hover:bg-cyan-500/10 h-9 w-9">
              <X className="w-5 h-5" />
            </Button>
            <img src={selectedChat.avatar} alt={selectedChat.name} className="w-9 h-9 rounded-full object-cover border border-cyan-500/40" />
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-white truncate text-sm">{selectedChat.name}</h2>
              {selectedChat.type === 'group' && <p className="text-[10px] text-cyan-400">{selectedChat.participants} membros</p>}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-cyan-400" style={{ filter: 'drop-shadow(0 0 6px rgba(6,182,212,0.8))' }} />
              <h1 className="text-lg font-bold" style={{ background: 'linear-gradient(to right, #22d3ee, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Chat Underground
              </h1>
            </div>
            <Button size="icon" className="h-9 w-9 rounded-full" style={{ background: 'linear-gradient(135deg, #0891b2, #7c3aed)', boxShadow: '0 0 14px rgba(6,182,212,0.5)' }}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex justify-between items-center px-6 py-4 border-b flex-shrink-0"
        style={{ borderColor: 'rgba(6,182,212,0.2)', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(168,85,247,0.2))', border: '1.5px solid rgba(6,182,212,0.5)', boxShadow: '0 0 20px rgba(6,182,212,0.3)' }}>
            <MessageCircle className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ background: 'linear-gradient(to right, #22d3ee, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Chat Underground
            </h1>
            <p className="text-xs text-gray-500">Conecte-se com organizadores e membros da cena</p>
          </div>
        </div>
        <Button className="rounded-xl font-bold text-sm px-4 h-9"
          style={{ background: 'linear-gradient(135deg, #0891b2, #7c3aed)', boxShadow: '0 0 20px rgba(6,182,212,0.4)', border: '1px solid rgba(6,182,212,0.4)' }}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Conversa
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Lista de Chats */}
        <div className={`${showChatList ? 'flex' : 'hidden'} md:flex w-full md:w-72 lg:w-80 flex-col flex-shrink-0 border-r`}
          style={{ borderColor: 'rgba(6,182,212,0.15)', background: 'rgba(0,0,0,0.4)' }}>

          {/* Search */}
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

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
            {filteredChats.map((chat) => {
              const isActive = selectedChat?.id === chat.id;
              return (
                <div key={chat.id} onClick={() => handleSelectChat(chat)}
                  className="px-3 py-3 cursor-pointer transition-all duration-200 border-b relative"
                  style={{
                    borderColor: 'rgba(6,182,212,0.08)',
                    background: isActive ? 'linear-gradient(90deg, rgba(6,182,212,0.1), rgba(168,85,247,0.05))' : 'transparent',
                    borderLeft: isActive ? '3px solid #06b6d4' : '3px solid transparent',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <img src={chat.avatar} alt={chat.name} className="w-11 h-11 rounded-full object-cover"
                        style={{ border: isActive ? '2px solid rgba(6,182,212,0.6)' : '2px solid rgba(255,255,255,0.1)' }} />
                      {chat.type === 'group' && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                          style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', border: '1.5px solid #000' }}>
                          <Users className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h3 className="font-semibold text-sm truncate" style={{ color: isActive ? '#22d3ee' : '#f1f5f9' }}>
                          {chat.name}
                        </h3>
                        <span className="text-[10px] text-gray-600 flex-shrink-0 ml-2">{formatMessageTime(chat.lastMessageTime)}</span>
                      </div>
                      {chat.type === 'group' && <p className="text-[10px] text-gray-600 mb-0.5">{chat.participants} membros</p>}
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500 truncate flex-1">{chat.lastMessage}</p>
                        {chat.unreadCount > 0 && (
                          <span className="ml-2 flex-shrink-0 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                            style={{ background: 'linear-gradient(135deg, #06b6d4, #7c3aed)', boxShadow: '0 0 8px rgba(6,182,212,0.6)' }}>
                            {chat.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
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
                <img src={selectedChat.avatar} alt={selectedChat.name} className="w-10 h-10 rounded-full object-cover"
                  style={{ border: '2px solid rgba(6,182,212,0.5)' }} />
                <div className="flex-1">
                  <h2 className="font-bold text-white text-sm">{selectedChat.name}</h2>
                  {selectedChat.type === 'group' && <p className="text-xs text-cyan-400/70">{selectedChat.participants} membros</p>}
                </div>
                <div className="w-2 h-2 rounded-full bg-green-400" style={{ boxShadow: '0 0 8px rgba(74,222,128,0.8)' }} />
                <span className="text-xs text-green-400">Online</span>
              </div>

              {/* Messages */}
              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4"
                style={{ scrollBehavior: 'smooth' }}>
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-3 ${msg.isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    {!msg.isMe && (
                      <img src={msg.sender_avatar} alt={msg.sender_name}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-1"
                        style={{ border: '1.5px solid rgba(168,85,247,0.5)' }} />
                    )}
                    <div className={`flex flex-col max-w-[72%] ${msg.isMe ? 'items-end' : 'items-start'}`}>
                      {!msg.isMe && <span className="text-xs text-purple-400 mb-1 px-1">{msg.sender_name}</span>}

                      {msg.reply_to && (
                        <div className="px-3 py-1.5 mb-1 rounded-lg text-xs border-l-2 border-cyan-500 max-w-full"
                          style={{ background: 'rgba(6,182,212,0.08)' }}>
                          <p className="font-semibold text-cyan-400">{msg.reply_to.sender_name}</p>
                          <p className="truncate text-gray-500">{msg.reply_to.message}</p>
                        </div>
                      )}

                      <div className="relative group">
                        <div className={`px-4 py-2.5 rounded-2xl text-sm break-words`}
                          style={msg.isMe ? {
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

                        {/* Actions on hover */}
                        <div className={`absolute ${msg.isMe ? 'right-full mr-2' : 'left-full ml-2'} top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1`}>
                          <button onClick={() => handleLikeMessage(msg.id)}
                            className={`w-7 h-7 rounded-full flex items-center justify-center ${msg.liked_by_me ? 'text-red-400' : 'text-gray-500'} hover:text-red-400 transition-colors`}
                            style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <Heart className={`w-3.5 h-3.5 ${msg.liked_by_me ? 'fill-current' : ''}`} />
                          </button>
                          <button onClick={() => handleReplyToMessage(msg)}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-gray-500 hover:text-cyan-400 transition-colors"
                            style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <Reply className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {msg.likes > 0 && (
                          <div className={`absolute -bottom-2 ${msg.isMe ? 'left-2' : 'right-2'} flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px]`}
                            style={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <Heart className="w-2.5 h-2.5 text-red-400 fill-current" />
                            <span className="text-gray-400">{msg.likes}</span>
                          </div>
                        )}
                      </div>

                      <span className="text-[10px] text-gray-600 mt-1 px-1">
                        {format(msg.time, 'HH:mm', { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="flex-shrink-0 p-3 border-t" style={{ borderColor: 'rgba(6,182,212,0.15)', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)' }}>
                {replyingTo && (
                  <div className="mb-2 px-3 py-2 rounded-lg flex items-center justify-between border-l-2 border-cyan-500"
                    style={{ background: 'rgba(6,182,212,0.08)' }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-cyan-400 font-semibold">↩ {replyingTo.sender_name}</p>
                      <p className="text-xs text-gray-500 truncate">{replyingTo.message}</p>
                    </div>
                    <button onClick={() => setReplyingTo(null)} className="text-gray-500 hover:text-white ml-2">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <div className="flex gap-2 items-center">
                  <Button size="icon" variant="ghost" className="text-gray-600 hover:text-cyan-400 flex-shrink-0 h-9 w-9">
                    <ImageIcon className="w-4 h-4" />
                  </Button>
                  <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Mensagem..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 bg-transparent outline-none text-white text-sm placeholder:text-gray-600 px-2"
                    style={{ borderBottom: '1px solid rgba(6,182,212,0.2)' }}
                  />
                  <Button size="icon" variant="ghost" className="text-gray-600 hover:text-yellow-400 flex-shrink-0 h-9 w-9">
                    <Smile className="w-4 h-4" />
                  </Button>
                  <button onClick={handleSendMessage}
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all hover:scale-110"
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
                  style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.1), rgba(168,85,247,0.1))', border: '1.5px solid rgba(6,182,212,0.2)' }}>
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