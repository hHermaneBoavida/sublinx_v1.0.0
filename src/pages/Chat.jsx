
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
    <div className="h-[calc(100vh-80px)] md:h-[calc(100vh-120px)] overflow-hidden">
      {/* Header Mobile */}
      <div className="md:hidden p-3 sm:p-4 border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm">
        {selectedChat && !showChatList ? (
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowChatList(true)}
              className="text-gray-400"
            >
              <X className="w-5 h-5" />
            </Button>
            <img src={selectedChat.avatar} alt={selectedChat.name} className="w-10 h-10 rounded-full object-cover" />
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-white truncate">{selectedChat.name}</h2>
              {selectedChat.type === 'group' && (
                <p className="text-xs text-gray-400">{selectedChat.participants} membros</p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text">
              Chat Underground
            </h1>
            <Button size="icon" className="bg-gradient-to-r from-cyan-600 to-purple-600">
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex justify-between items-center p-4 md:p-6 border-b border-gray-700">
        <div>
          <h1 className="flex items-center gap-3 text-2xl md:text-3xl font-bold text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text mb-2">
            <MessageCircle className="w-6 h-6 md:w-8 md:h-8" />
            Chat Underground
          </h1>
          <p className="text-sm text-gray-400">
            Conecte-se com outros organizadores e membros da comunidade
          </p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-purple-600">
          <Plus className="w-4 h-4 mr-2" />
          Nova Conversa
        </Button>
      </div>

      <div className="flex h-[calc(100%-64px)] md:h-[calc(100%-100px)]">
        {/* Lista de Chats - Mobile/Desktop Responsivo */}
        <div className={`${showChatList ? 'block' : 'hidden'} md:block w-full md:w-80 lg:w-96 border-r border-gray-700 bg-gray-900/30 flex flex-col`}>
          {/* Search Bar */}
          <div className="p-3 sm:p-4 border-b border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar conversas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-800 border-gray-600 pl-10 text-white text-sm"
              />
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
            {filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => handleSelectChat(chat)}
                className={`p-3 sm:p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-800/50 transition-colors ${
                  selectedChat?.id === chat.id ? 'bg-cyan-900/20 border-l-4 border-l-cyan-500' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <img src={chat.avatar} alt={chat.name} className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover" />
                    {chat.type === 'group' && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                        <Users className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-white truncate text-sm sm:text-base">{chat.name}</h3>
                      <span className="text-[10px] sm:text-xs text-gray-400 flex-shrink-0 ml-2">
                        {formatMessageTime(chat.lastMessageTime)}
                      </span>
                    </div>
                    {chat.type === 'group' && (
                      <p className="text-xs text-gray-500 mb-1">{chat.participants} membros</p>
                    )}
                    <div className="flex items-center justify-between">
                      <p className="text-xs sm:text-sm text-gray-300 truncate flex-1">{chat.lastMessage}</p>
                      {chat.unreadCount > 0 && (
                        <Badge className="bg-cyan-600 text-white min-w-[20px] h-5 rounded-full p-0 flex items-center justify-center text-[10px] ml-2 flex-shrink-0">
                          {chat.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Área de Mensagens - Mobile/Desktop Responsivo */}
        <div className={`${!showChatList ? 'block' : 'hidden'} md:block flex-1 flex flex-col bg-gray-900/50`}>
          {selectedChat ? (
            <>
              {/* Header do Chat - Desktop Only */}
              <div className="hidden md:flex items-center gap-3 p-4 border-b border-gray-700">
                <img src={selectedChat.avatar} alt={selectedChat.name} className="w-12 h-12 rounded-full object-cover" />
                <div className="flex-1">
                  <h2 className="font-semibold text-white">{selectedChat.name}</h2>
                  {selectedChat.type === 'group' && (
                    <p className="text-sm text-gray-400">{selectedChat.participants} membros</p>
                  )}
                </div>
              </div>

              {/* Área de Mensagens */}
              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4"
                style={{ 
                  overflowY: 'auto',
                  WebkitOverflowScrolling: 'touch',
                  scrollBehavior: 'smooth'
                }}
              >
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-2 sm:gap-3 ${msg.isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    {!msg.isMe && (
                      <img 
                        src={msg.sender_avatar} 
                        alt={msg.sender_name}
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover flex-shrink-0"
                      />
                    )}
                    <div className={`flex flex-col max-w-[75%] sm:max-w-[70%] ${msg.isMe ? 'items-end' : 'items-start'}`}>
                      {!msg.isMe && (
                        <span className="text-xs text-gray-400 mb-1 px-2">{msg.sender_name}</span>
                      )}
                      
                      {/* Reply Preview */}
                      {msg.reply_to && (
                        <div className="px-3 py-2 bg-gray-700/30 border-l-2 border-cyan-500 rounded-lg mb-1 text-xs text-gray-400 max-w-full">
                          <p className="font-semibold text-gray-300">{msg.reply_to.sender_name}</p>
                          <p className="truncate">{msg.reply_to.message}</p>
                        </div>
                      )}

                      <div className="relative group">
                        <div className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl ${
                          msg.isMe 
                            ? 'bg-gradient-to-r from-cyan-600 to-purple-600 text-white' 
                            : 'bg-gray-800 text-white'
                        }`}>
                          <p className="text-sm sm:text-base break-words">{msg.message}</p>
                        </div>
                        
                        {/* Message Actions */}
                        <div className={`absolute ${msg.isMe ? 'left-0' : 'right-0'} top-1/2 -translate-y-1/2 ${msg.isMe ? '-translate-x-full' : 'translate-x-full'} px-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1`}>
                          <Button
                            size="icon"
                            variant="ghost"
                            className={`h-8 w-8 rounded-full ${msg.liked_by_me ? 'text-red-500' : 'text-gray-400'} hover:text-red-500 bg-gray-800/90`}
                            onClick={() => handleLikeMessage(msg.id)}
                          >
                            <Heart className={`w-4 h-4 ${msg.liked_by_me ? 'fill-current' : ''}`} />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-full text-gray-400 hover:text-cyan-400 bg-gray-800/90"
                            onClick={() => handleReplyToMessage(msg)}
                          >
                            <Reply className="w-4 h-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 rounded-full text-gray-400 hover:text-white bg-gray-800/90"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-gray-800 border-gray-700">
                              <DropdownMenuItem className="text-gray-300">Copiar</DropdownMenuItem>
                              <DropdownMenuItem className="text-gray-300">Encaminhar</DropdownMenuItem>
                              {msg.isMe && <DropdownMenuItem className="text-red-400">Deletar</DropdownMenuItem>}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Likes Count */}
                        {msg.likes > 0 && (
                          <div className={`absolute -bottom-2 ${msg.isMe ? 'left-2' : 'right-2'} bg-gray-800 border border-gray-700 rounded-full px-2 py-0.5 flex items-center gap-1`}>
                            <Heart className="w-3 h-3 text-red-500 fill-current" />
                            <span className="text-[10px] text-gray-300">{msg.likes}</span>
                          </div>
                        )}
                      </div>

                      <span className="text-[10px] text-gray-500 mt-1 px-2">
                        {format(msg.time, 'HH:mm', { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                ))}
                {/* Scroll anchor */}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-3 sm:p-4 border-t border-gray-700 bg-gray-900/70 backdrop-blur-sm">
                {/* Reply Preview */}
                {replyingTo && (
                  <div className="mb-2 p-2 bg-gray-800 border-l-2 border-cyan-500 rounded flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-cyan-400 font-semibold">Respondendo a {replyingTo.sender_name}</p>
                      <p className="text-xs text-gray-400 truncate">{replyingTo.message}</p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-gray-400"
                      onClick={() => setReplyingTo(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-gray-400 hover:text-cyan-400 flex-shrink-0"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </Button>
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    className="bg-gray-800 border-gray-600 text-white text-sm sm:text-base"
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-gray-400 hover:text-yellow-400 flex-shrink-0"
                  >
                    <Smile className="w-5 h-5" />
                  </Button>
                  <Button
                    onClick={handleSendMessage}
                    size="icon"
                    className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 flex-shrink-0"
                  >
                    <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">
                  Selecione uma conversa
                </h3>
                <p className="text-gray-500">
                  Escolha uma conversa da lista para começar a trocar mensagens.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
