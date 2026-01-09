'use client';

import { 
  MessageSquare, 
  Send, 
  Phone, 
  Video, 
  Search, 
  MoreVertical, 
  Paperclip, 
  Smile, 
  Image as ImageIcon,
  File,
  Mic,
  Check,
  CheckCheck,
  Clock,
  Users,
  Bell,
  Settings,
  UserPlus,
  Star,
  Pin
} from "lucide-react";
import { useState } from "react";

export default function CommunicationPage() {
  const [selectedChat, setSelectedChat] = useState<string | null>('1');
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'teachers' | 'classmates' | 'groups'>('all');

  // Mock Data
  const conversations = [
    {
      id: '1',
      name: 'Ms. Nguyễn Thu Hà',
      role: 'Giáo viên chủ nhiệm',
      avatar: '👩‍🏫',
      lastMessage: 'Em nhớ làm bài tập về nhà nhé!',
      time: '10:30',
      unread: 0,
      online: true,
      pinned: true,
      type: 'teacher'
    },
    {
      id: '7',
      name: 'Ms. Nguyễn Thu Hà',
      role: 'Giáo viên chủ nhiệm',
      avatar: '👩‍🏫',
      lastMessage: 'Em nhớ làm bài tập về nhà nhé!',
      time: '10:30',
      unread: 0,
      online: true,
      pinned: true,
      type: 'teacher'
    },
    {
      id: '2',
      name: 'Lớp 6A - Nhóm học tập',
      role: '24 thành viên',
      avatar: '👥',
      lastMessage: 'Minh Khôi: Ai làm xong bài tập chưa?',
      time: '09:45',
      unread: 5,
      online: false,
      pinned: true,
      type: 'group'
    },
    {
      id: '3',
      name: 'Mr. Trần Văn An',
      role: 'Giáo viên Toán',
      avatar: '👨‍🏫',
      lastMessage: 'Bài kiểm tra vào thứ 5 nhé các em',
      time: 'Hôm qua',
      unread: 1,
      online: false,
      pinned: false,
      type: 'teacher'
    },
    {
      id: '4',
      name: 'Trần Minh Khôi',
      role: 'Bạn cùng lớp',
      avatar: '😎',
      lastMessage: 'Tớ gửi tài liệu cho cậu rồi đó',
      time: 'Hôm qua',
      unread: 0,
      online: true,
      pinned: false,
      type: 'classmate'
    },
    {
      id: '5',
      name: 'Lê Thu Trang',
      role: 'Bạn cùng lớp',
      avatar: '🌸',
      lastMessage: 'Cảm ơn cậu nhé!',
      time: 'T2',
      unread: 0,
      online: false,
      pinned: false,
      type: 'classmate'
    },
     {
      id: '6',
      name: 'Lê Thu Trang',
      role: 'Bạn cùng lớp',
      avatar: '🌸',
      lastMessage: 'Cảm ơn cậu nhé!',
      time: 'T2',
      unread: 0,
      online: false,
      pinned: false,
      type: 'classmate'
    },
    //  {
    //   id: '7',
    //   name: 'Lê Thu Trang',
    //   role: 'Bạn cùng lớp',
    //   avatar: '🌸',
    //   lastMessage: 'Cảm ơn cậu nhé!',
    //   time: 'T2',
    //   unread: 0,
    //   online: false,
    //   pinned: false,
    //   type: 'classmate'
    // },
  ];

  const messages = [
    {
      id: 1,
      sender: 'teacher',
      senderName: 'Ms. Nguyễn Thu Hà',
      content: 'Chào em Băng Ngân! Cô thấy em đã cố gắng rất nhiều trong tuần này.',
      time: '10:15',
      status: 'read'
    },
    {
      id: 2,
      sender: 'teacher',
      senderName: 'Ms. Nguyễn Thu Hà',
      content: 'Bài tập về nhà của em làm rất tốt. Tiếp tục phát huy nhé! 👏',
      time: '10:16',
      status: 'read'
    },
    {
      id: 3,
      sender: 'me',
      senderName: 'Tôi',
      content: 'Dạ, em cảm ơn cô ạ! Em sẽ cố gắng hơn nữa.',
      time: '10:20',
      status: 'read'
    },
    {
      id: 4,
      sender: 'me',
      senderName: 'Tôi',
      content: 'Cô ơi, em có thể hỏi về bài tập trang 45 được không ạ?',
      time: '10:21',
      status: 'sent'
    },
    {
      id: 5,
      sender: 'teacher',
      senderName: 'Ms. Nguyễn Thu Hà',
      content: 'Được chứ! Em đang thắc mắc chỗ nào?',
      time: '10:28',
      status: 'read'
    },
    {
      id: 6,
      sender: 'teacher',
      senderName: 'Ms. Nguyễn Thu Hà',
      content: 'Em nhớ làm bài tập về nhà nhé!',
      time: '10:30',
      status: 'delivered'
    },
  ];

  const filteredConversations = conversations.filter(conv => {
    if (activeTab === 'all') return true;
    if (activeTab === 'teachers') return conv.type === 'teacher';
    if (activeTab === 'classmates') return conv.type === 'classmate';
    if (activeTab === 'groups') return conv.type === 'group';
    return true;
  });

  const currentChat = conversations.find(c => c.id === selectedChat);

  const handleSendMessage = () => {
    if (message.trim()) {
      // Handle send message logic here
      console.log('Sending:', message);
      setMessage('');
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] text-white flex overflow-hidden rounded-2xl pb-10">
      
      {/* Left Sidebar - Conversations List */}
      <div className="w-full md:w-96 h-full flex flex-col border-r border-white/10 bg-slate-900/50 backdrop-blur-xl shrink-0 custom-scrollbar">
        
        {/* Header */}
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-black flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-cyan-400" />
              Tin nhắn
            </h1>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-white/10 rounded-xl transition-all">
                <UserPlus className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-white/10 rounded-xl transition-all">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm tin nhắn..."
              className="w-full bg-slate-800/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 p-3 border-b border-white/10 overflow-x-auto">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'teachers', label: 'Giáo viên' },
            { id: 'classmates', label: 'Bạn bè' },
            { id: 'groups', label: 'Nhóm' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-800/50 text-gray-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {filteredConversations.map(conv => (
            <div
              key={conv.id}
              onClick={() => setSelectedChat(conv.id)}
              className={`p-4 border-b border-white/5 cursor-pointer transition-all ${
                selectedChat === conv.id
                  ? 'bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border-l-4 border-l-cyan-500'
                  : 'hover:bg-white/5'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-2xl">
                    {conv.avatar}
                  </div>
                  {conv.online && (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-slate-900"></div>
                  )}
                  {conv.pinned && (
                    <div className="absolute -top-1 -right-1">
                      <Pin className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-white truncate">{conv.name}</h3>
                    <span className="text-xs text-gray-400">{conv.time}</span>
                  </div>
                  <p className="text-xs text-cyan-400/80 mb-1">{conv.role}</p>
                  <p className="text-sm text-gray-400 truncate">{conv.lastMessage}</p>
                </div>

                {conv.unread > 0 && (
                  <div className="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold">{conv.unread}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Side - Chat Window */}
      {selectedChat && currentChat ? (
        <div className="flex-1 h-full flex flex-col bg-slate-900/30 backdrop-blur-xl overflow-hidden">
          
          {/* Chat Header */}
          <div className="p-5 border-b border-white/10 bg-slate-900/50 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center text-2xl">
                    {currentChat.avatar}
                  </div>
                  {currentChat.online && (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-slate-900"></div>
                  )}
                </div>
                <div>
                  <h2 className="font-bold text-lg text-white">{currentChat.name}</h2>
                  <p className="text-sm text-gray-400">
                    {currentChat.online ? '🟢 Đang hoạt động' : `${currentChat.role}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="p-3 hover:bg-white/10 rounded-xl transition-all">
                  <Phone className="w-5 h-5 text-cyan-400" />
                </button>
                <button className="p-3 hover:bg-white/10 rounded-xl transition-all">
                  <Video className="w-5 h-5 text-cyan-400" />
                </button>
                <button className="p-3 hover:bg-white/10 rounded-xl transition-all">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {/* Date Separator */}
            <div className="flex items-center justify-center my-2">
              <div className="bg-slate-800/50 px-4 py-1 rounded-full text-xs text-gray-400">
                Hôm nay - 15/01/2026
              </div>
            </div>

            {/* Messages */}
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-2 max-w-[70%] ${msg.sender === 'me' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {msg.sender !== 'me' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-lg shrink-0">
                      {currentChat.avatar}
                    </div>
                  )}
                  <div>
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        msg.sender === 'me'
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                          : 'bg-slate-800/70 text-white'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    </div>
                    <div className={`flex items-center gap-1 mt-1 text-xs text-gray-400 ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                      <span>{msg.time}</span>
                      {msg.sender === 'me' && (
                        msg.status === 'read' ? (
                          <CheckCheck className="w-4 h-4 text-cyan-400" />
                        ) : msg.status === 'sent' ? (
                          <CheckCheck className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Check className="w-4 h-4 text-gray-400" />
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-white/10 bg-slate-900/50 shrink-0 ">
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                <button className="p-2.5 hover:bg-white/10 rounded-xl transition-all">
                  <Paperclip className="w-5 h-5 text-gray-400 hover:text-white" />
                </button>
                <button className="p-2.5 hover:bg-white/10 rounded-xl transition-all">
                  <ImageIcon className="w-5 h-5 text-gray-400 hover:text-white" />
                </button>
              </div>

              <div className="flex-1 relative -mb-2">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Nhập tin nhắn..."
                  rows={1}
                  className="w-full bg-slate-800/50 border border-white/10 rounded-2xl px-4 py-3 pr-12 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all max-h-32"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-xl transition-all">
                  <Smile className="w-5 h-5 text-gray-400 hover:text-white" />
                </button>
              </div>

              <button 
                onClick={handleSendMessage}
                className="p-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!message.trim()}
              >
                <Send className="w-5 h-5" />
              </button>

              <button className="p-3 hover:bg-white/10 rounded-xl transition-all">
                <Mic className="w-5 h-5 text-gray-400 hover:text-white" />
              </button>
            </div>
        
            <p className="text-xs text-gray-500 mt-2 text-center">
              Nhấn Enter để gửi, Shift + Enter để xuống dòng
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-slate-900/30">
          <div className="text-center">
            <MessageSquare className="w-20 h-20 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-400 mb-2">Chọn một cuộc trò chuyện</h3>
            <p className="text-gray-500">Chọn từ danh sách bên trái để bắt đầu nhắn tin</p>
          </div>
        </div>
      )}
    </div>
  );
}
