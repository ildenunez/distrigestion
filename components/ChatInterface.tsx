
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { AppUser, ChatMessage, GroupMessage } from '../types';

interface ChatInterfaceProps {
  currentUser: AppUser;
  users: AppUser[];
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ currentUser, users }) => {
  const [selectedChat, setSelectedChat] = useState<{ type: 'private' | 'group', id: string, name: string } | null>({
    type: 'group',
    id: 'global',
    name: 'Sala General'
  });
  
  const [messages, setMessages] = useState<(ChatMessage | GroupMessage)[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filtrar para no mostrarse a sí mismo en la lista
  const chatPartners = useMemo(() => {
    return users.filter(u => u.id !== currentUser.id);
  }, [users, currentUser]);

  // Suscripción en tiempo real
  useEffect(() => {
    const chatChannel = supabase
      .channel('chat_realtime_private')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          if (selectedChat?.type === 'private' && (
            (newMsg.sender_id === currentUser.id && newMsg.receiver_id === selectedChat.id) ||
            (newMsg.sender_id === selectedChat.id && newMsg.receiver_id === currentUser.id)
          )) {
            setMessages(prev => [...prev, newMsg]);
          }
        }
      )
      .subscribe();

    const groupChannel = supabase
      .channel('chat_realtime_group')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'group_messages' },
        (payload) => {
          const newMsg = payload.new as GroupMessage;
          if (selectedChat?.type === 'group') {
            setMessages(prev => [...prev, newMsg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chatChannel);
      supabase.removeChannel(groupChannel);
    };
  }, [currentUser, selectedChat]);

  // Cargar mensajes al cambiar de chat
  useEffect(() => {
    if (selectedChat) {
      loadMessages();
    }
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    if (!selectedChat) return;
    setIsLoading(true);
    try {
      if (selectedChat.type === 'private') {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedChat.id}),and(sender_id.eq.${selectedChat.id},receiver_id.eq.${currentUser.id})`)
          .order('created_at', { ascending: true });
        if (error) throw error;
        setMessages(data || []);
      } else {
        const { data, error } = await supabase
          .from('group_messages')
          .select('*')
          .order('created_at', { ascending: true });
        if (error) throw error;
        setMessages(data || []);
      }
    } catch (err) {
      console.error("Error cargando mensajes:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    const content = newMessage.trim();
    setNewMessage('');

    try {
      if (selectedChat.type === 'private') {
        const { error } = await supabase
          .from('chat_messages')
          .insert([{
            sender_id: currentUser.id,
            receiver_id: selectedChat.id,
            content: content
          }]);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('group_messages')
          .insert([{
            sender_id: currentUser.id,
            content: content
          }]);
        if (error) throw error;
      }
    } catch (err) {
      console.error("Error enviando mensaje:", err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const getSenderName = (senderId: string) => {
    if (senderId === currentUser.id) return 'Yo';
    const user = users.find(u => u.id === senderId);
    return user ? user.name : 'Alguien';
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden flex h-[70vh] animate-fadeIn">
      {/* Sidebar de Usuarios */}
      <div className="w-80 border-r border-slate-100 flex flex-col bg-slate-50/50">
        <div className="p-8 border-b border-slate-100">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Compañeros</h2>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Canales de Chat</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {/* Sala General */}
          <button
            onClick={() => setSelectedChat({ type: 'group', id: 'global', name: 'Sala General' })}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left mb-4 ${
              selectedChat?.type === 'group' 
                ? 'bg-emerald-50 shadow-lg shadow-emerald-100 border border-emerald-100' 
                : 'hover:bg-white/60 border border-transparent'
            }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm ${
              selectedChat?.type === 'group' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
            }`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-black text-slate-700 truncate">Sala General</div>
              <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight">Chat Grupal</div>
            </div>
          </button>

          <div className="h-[1px] bg-slate-100 mx-4 mb-4" />

          {chatPartners.map(user => (
            <button
              key={user.id}
              onClick={() => setSelectedChat({ type: 'private', id: user.id, name: user.name })}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left ${
                selectedChat?.type === 'private' && selectedChat.id === user.id 
                  ? 'bg-white shadow-lg shadow-indigo-100 border border-indigo-100' 
                  : 'hover:bg-white/60 border border-transparent'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm ${
                selectedChat?.type === 'private' && selectedChat.id === user.id ? 'bg-[#5851FF] text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-black text-slate-700 truncate">{user.name}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">@{user.username}</div>
              </div>
              {selectedChat?.type === 'private' && selectedChat.id === user.id && (
                <div className="w-2 h-2 rounded-full bg-[#5851FF] animate-pulse" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Área de Chat */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedChat ? (
          <>
            {/* Header del Chat */}
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 ${selectedChat.type === 'group' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-[#5851FF]'} rounded-xl flex items-center justify-center font-black text-sm`}>
                  {selectedChat.type === 'group' ? 'G' : selectedChat.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight leading-none mb-1">{selectedChat.name}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    {selectedChat.type === 'group' ? 'Toda la empresa' : 'Conversación Privada'}
                  </p>
                </div>
              </div>
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/30">
              {isLoading ? (
                <div className="h-full flex items-center justify-center opacity-40">
                  <div className="w-8 h-8 border-3 border-slate-200 border-t-[#5851FF] rounded-full animate-spin"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-10 opacity-30">
                  <div className="w-16 h-16 bg-slate-200 rounded-3xl flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  </div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">No hay mensajes previos</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isMine = msg.sender_id === currentUser.id;
                  const senderName = getSenderName(msg.sender_id);
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-slideIn`}>
                      <div className={`max-w-[70%] group`}>
                        {selectedChat.type === 'group' && !isMine && (
                          <span className="text-[9px] font-black uppercase text-emerald-600 ml-1 mb-1 block tracking-wider">
                            {senderName}
                          </span>
                        )}
                        <div className={`px-5 py-3 rounded-2xl text-sm font-medium shadow-sm ${
                          isMine 
                            ? 'bg-[#5851FF] text-white rounded-tr-none' 
                            : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
                        }`}>
                          {msg.content}
                        </div>
                        <div className={`text-[9px] font-black uppercase mt-1.5 px-1 tracking-widest ${
                          isMine ? 'text-right text-indigo-400' : 'text-slate-400'
                        }`}>
                          {formatTime(msg.created_at)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="p-6 border-t border-slate-100 bg-white">
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder={`Escribir en ${selectedChat.name}...`}
                  className="w-full pl-6 pr-16 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-50 focus:border-[#5851FF] transition-all placeholder:text-slate-300"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className={`absolute right-2 p-3 ${selectedChat.type === 'group' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-[#5851FF] hover:bg-[#4a44d4]'} text-white rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:shadow-none`}
                >
                  <svg className="w-5 h-5 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
              </div>
            </form>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default ChatInterface;
