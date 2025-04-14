"use client"

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  UserPresence, sendMessage, subscribeToMessages, 
  subscribeToPresence, updateTypingStatus 
} from '@/app/lib/chat';
import { useAuth } from '@/app/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Loader2, Send, User, MessageSquare, Smile, Paperclip, 
  MoreVertical, Shield
} from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import the emoji picker to reduce initial load time
const EmojiPicker = dynamic(() => import('emoji-picker-react'), {
  loading: () => <div className="p-4 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>,
  ssr: false
});

interface EmojiObject {
  emoji: string;
}

// Local Message interface that matches our UI needs
interface Message {
  id: string;
  text: string;
  uid: string;
  displayName: string;
  timestamp: number;
  metadata?: {
    type: string;
    content: string;
    duration?: number;
  };
}

const ChatRoom = () => {
  const { user, currentRoom, userDisplayName } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [presence, setPresence] = useState<Record<string, UserPresence>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle clicks outside emoji picker to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get avatar color based on user name
  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500',
      'bg-red-500', 'bg-orange-500', 'bg-teal-500'
    ];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Get avatar initials
  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return name.charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Subscribe to messages
  useEffect(() => {
    if (!currentRoom || !user) return;

    setIsLoading(true);
    const unsubscribe = subscribeToMessages(currentRoom, (newMessages) => {
      // Transform backend messages to match our UI interface
      const transformedMessages = newMessages.map(backendMsg => {
        // Create a message that follows our local Message interface
        const uiMessage: Message = {
          id: backendMsg.id,
          text: backendMsg.text,
          uid: backendMsg.uid,
          displayName: backendMsg.displayName,
          timestamp: backendMsg.timestamp,
          metadata: backendMsg.metadata
        };
        return uiMessage;
      });
      
      setMessages(transformedMessages);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [currentRoom, user]);

  // Subscribe to presence
  useEffect(() => {
    if (!currentRoom || !user) return;

    const unsubscribe = subscribeToPresence(currentRoom, (newPresence) => {
      setPresence(newPresence);
    });

    return () => {
      unsubscribe();
    };
  }, [currentRoom, user]);

  // Handle typing indicator
  useEffect(() => {
    if (!currentRoom || !user || !inputMessage) return;

    const handleTyping = async () => {
      await updateTypingStatus(currentRoom, user.uid, true, isHost ? "" : inputMessage);

      // Clear any existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout to clear typing indicator after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(async () => {
        await updateTypingStatus(currentRoom, user.uid, false, "");
      }, 3000);
    };

    handleTyping();

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [inputMessage, currentRoom, user]);

  // Handle message send
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!user || !currentRoom || !inputMessage.trim()) return;
    
    try {
      await sendMessage(
        currentRoom,
        user.uid,
        userDisplayName,
        inputMessage
      );
      setInputMessage('');
      // Update typing status to false after sending
      await updateTypingStatus(currentRoom, user.uid, false, "");
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Handle emoji selection
  const onEmojiClick = (emojiObject: EmojiObject) => {
    setInputMessage(prev => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  // Check if user is host
  const isHost = Object.entries(presence)
    .filter(([uid]) => uid === user?.uid)
    .some(([, data]) => data.isHost);

  // Get typing indicators or content (asymmetric - host sees what guest types)
  const getTypingContent = () => {
    const typingUsers = Object.entries(presence)
      .filter(([uid, data]) => uid !== user?.uid && data.typing);
    
    if (typingUsers.length === 0) return null;
    
    // If host, show what guest is typing (if they're typing)
    if (isHost && typingUsers.length === 1) {
      const [, userData] = typingUsers[0];
      if (userData.typingContent) {
        return (
          <div className="p-3 bg-gray-100 rounded-lg max-w-[75%] text-gray-500 italic ml-2 flex items-start">
            <div className={`${getAvatarColor(userData.displayName)} h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-medium mr-2 flex-shrink-0`}>
              {getInitials(userData.displayName)}
            </div>
            <div>
              <div className="text-xs font-bold text-gray-700">{userData.displayName}</div>
              <div>{userData.typingContent}...</div>
            </div>
          </div>
        );
      }
    }
    
    // For guests or when no typing content
    if (typingUsers.length === 1) {
      return (
        <div className="text-xs text-gray-500 italic mt-1 ml-2 flex items-center">
          <div className="flex items-center space-x-1 mr-1">
            <span className="animate-bounce">•</span>
            <span className="animate-bounce delay-75">•</span>
            <span className="animate-bounce delay-150">•</span>
          </div>
          <span>{typingUsers[0][1].displayName} is typing...</span>
        </div>
      );
    } else {
      return (
        <div className="text-xs text-gray-500 italic mt-1 ml-2 flex items-center">
          <div className="flex items-center space-x-1 mr-1">
            <span className="animate-bounce">•</span>
            <span className="animate-bounce delay-75">•</span>
            <span className="animate-bounce delay-150">•</span>
          </div>
          <span>Several people are typing...</span>
        </div>
      );
    }
  };

  // Find all users who are online
  const onlineUsers = Object.entries(presence)
    .filter(([uid, data]) => uid !== user?.uid && data.online)
    .map(([, data]) => data.displayName);

  if (!user || !currentRoom) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-green-600 mb-4" />
          <p className="text-lg font-medium">Reconnecting to DeChat...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait or refresh the page</p>
        </div>
      </div>
    );
  }

  // Render message in the chat
  const renderMessage = (message: Message) => {
    const isMe = message.uid === user.uid;
    const messageDate = new Date(message.timestamp);
    const timeStr = messageDate.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return (
      <div
        key={message.id}
        className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}
      >
        <div
          className={`flex max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
        >
          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0 ${getAvatarColor(message.displayName)} ${isMe ? 'ml-2' : 'mr-2'}`}>
            {getInitials(message.displayName)}
          </div>
          <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
            <div
              className={`px-4 py-2 rounded-2xl ${
                isMe
                  ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-tr-none'
                  : 'bg-white shadow-sm border border-gray-100 text-gray-800 rounded-tl-none'
              }`}
            >
              {!isMe && (
                <div className="text-xs font-semibold mb-1">
                  {message.displayName}
                </div>
              )}
              <div className="break-words">{message.text}</div>
            </div>
            <div className={`text-xs text-gray-500 mt-1 mx-1 opacity-0 group-hover:opacity-100 transition-opacity ${isMe ? 'text-right' : 'text-left'}`}>
              {timeStr}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Chat header */}
      <div className="bg-white text-gray-800 p-3 flex items-center justify-between shadow-sm border-b flex-shrink-0">
        <div className="flex items-center">
          <div className="bg-gradient-to-r from-green-600 to-blue-500 h-10 w-10 rounded-full flex items-center justify-center mr-3">
            <User className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold">
              {onlineUsers.length > 0 ? onlineUsers[0] : "DeChat"}
            </h2>
            <div className="text-xs text-green-600 flex items-center">
              <Shield className="h-3 w-3 mr-1" />
              End-to-end encryption secured by two way phrase
            </div>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-gray-500"
        >
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Online users - simplified for DM feel */}
      {onlineUsers.length > 0 && (
        <div className="bg-white/50 px-4 py-2 shadow-sm flex items-center border-b flex-shrink-0">
          <div className="flex-shrink-0">
            <div className="flex items-center">
              <User className="h-4 w-4 mr-1 text-green-700" />
              <span className="font-medium text-sm text-green-800 mr-2">Online now</span>
            </div>
          </div>
        </div>
      )}

      {/* Messages area with sleek background */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col space-y-3 bg-gradient-to-b from-gray-50 to-white bg-opacity-90 bg-size-200 bg-pos-0 animate-gradient" style={{backgroundImage: "url('data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23f3f4f6' fill-opacity='0.3' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='1.5'/%3E%3Ccircle cx='13' cy='13' r='1.5'/%3E%3C/g%3E%3C/svg%3E')"}}>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="h-10 w-10 animate-spin text-green-600 mb-4" />
            <p className="text-lg font-medium">Loading messages...</p>
            <p className="text-sm text-gray-500 mt-2">Secure chat connection in progress</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center h-full">
            <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-full p-6 mb-4">
              <MessageSquare className="h-12 w-12 text-white" />
            </div>
            <h3 className="font-semibold text-xl mb-2">Your conversation is secure</h3>
            <p className="text-gray-600 max-w-sm">
              Messages are encrypted and can only be accessed with your unique phrases. Start your conversation now!
            </p>
          </div>
        ) : (
          <>
            {messages.map(message => renderMessage(message))}
            {/* Typing indicator */}
            {getTypingContent()}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message input area with sleek background - fixed at bottom */}
      <div className="bg-gradient-to-r from-gray-50 to-white border-t border-gray-200 p-3 w-full flex-shrink-0">
        {showEmojiPicker && (
          <div 
            className="absolute bottom-20 right-4 z-10 shadow-xl rounded-lg bg-white border border-gray-200 overflow-hidden"
            ref={emojiPickerRef}
          >
            <EmojiPicker onEmojiClick={onEmojiClick} />
          </div>
        )}

        <form
          onSubmit={handleSendMessage}
          className="flex items-center space-x-2"
        >
          <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            className="text-gray-500 hover:text-gray-700 flex-shrink-0"
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="h-12 text-base pl-4 pr-12 rounded-full bg-white border-gray-200 focus:ring-green-500 focus:border-green-500 shadow-sm"
              autoFocus
            />
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Smile className="h-5 w-5" />
            </Button>
          </div>
          
          <Button
            type="submit"
            disabled={!inputMessage.trim()}
            className="h-12 w-12 rounded-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 p-0 flex items-center justify-center flex-shrink-0"
          >
            <Send className="h-5 w-5 text-white" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatRoom; 