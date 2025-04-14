import { database, firestore } from './firebase';
import { 
  ref, 
  push, 
  set, 
  onValue, 
  off, 
  serverTimestamp,
  query,
  orderByChild,
  limitToLast,
  onDisconnect,
  DataSnapshot
} from 'firebase/database';
import { doc, updateDoc } from 'firebase/firestore';

export interface Message {
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

export interface UserPresence {
  displayName: string;
  online: boolean;
  lastSeen: string;
  typing: boolean;
  typingContent?: string;
  isHost?: boolean;
}

// Send a chat message
export const sendMessage = async (
  roomId: string,
  userId: string,
  displayName: string,
  text: string,
  metadata?: {
    type: string;
    content: string;
    duration?: number;
  }
): Promise<void> => {
  if (!text.trim() && !metadata) return;
  
  const messagesRef = ref(database, `messages/${roomId}`);
  const newMessageRef = push(messagesRef);
  
  await set(newMessageRef, {
    text,
    uid: userId,
    displayName,
    timestamp: serverTimestamp(),
    ...(metadata && { metadata })
  });
};

// Listen for new messages
export const subscribeToMessages = (
  roomId: string,
  callback: (messages: Message[]) => void
) => {
  const messagesRef = query(
    ref(database, `messages/${roomId}`),
    orderByChild('timestamp'),
    limitToLast(100)
  );
  
  const handleSnapshot = (snapshot: DataSnapshot) => {
    const messages: Message[] = [];
    snapshot.forEach((childSnapshot: DataSnapshot) => {
      const data = childSnapshot.val();
      const message: Message = {
        id: childSnapshot.key as string,
        text: data.text,
        uid: data.uid,
        displayName: data.displayName,
        timestamp: data.timestamp || Date.now(),
        metadata: data.metadata
      };
      messages.push(message);
    });
    
    // Sort messages by timestamp
    messages.sort((a, b) => a.timestamp - b.timestamp);
    
    callback(messages);
  };
  
  onValue(messagesRef, handleSnapshot);
  
  // Return unsubscribe function
  return () => off(messagesRef, 'value', handleSnapshot);
};

// Listen for users presence in a room
export const subscribeToPresence = (
  roomId: string,
  callback: (users: Record<string, UserPresence>) => void
) => {
  const presenceRef = ref(database, `presence/${roomId}`);
  
  onValue(presenceRef, (snapshot) => {
    const presence: Record<string, UserPresence> = snapshot.val() || {};
    callback(presence);
  });
  
  return () => off(presenceRef);
};

// Update user typing status
export const updateTypingStatus = async (
  roomId: string,
  userId: string,
  isTyping: boolean,
  typingContent: string = ""
): Promise<void> => {
  if (!roomId || !userId) return;
  
  const presenceRef = ref(database, `presence/${roomId}/${userId}`);
  
  // First get the current presence data
  onValue(presenceRef, (snapshot) => {
    const currentData = snapshot.val() || {};
    
    // Only update if the typing status or content has changed
    if (currentData.typing !== isTyping || currentData.typingContent !== typingContent) {
      set(presenceRef, {
        ...currentData,
        typing: isTyping,
        typingContent: typingContent,
        lastSeen: new Date().toISOString()
      });
    }
    
    // Immediately remove this listener since we only needed one snapshot
    off(presenceRef);
  }, { onlyOnce: true });
};

// Set user online status and host info
export const setUserPresence = async (
  roomId: string,
  userId: string,
  displayName: string,
  isHost: boolean
): Promise<void> => {
  if (!roomId || !userId) return;
  
  const presenceRef = ref(database, `presence/${roomId}/${userId}`);
  
  await set(presenceRef, {
    displayName,
    online: true,
    isHost,
    lastSeen: new Date().toISOString(),
    typing: false,
    typingContent: ""
  });
  
  // Set up disconnect handling
  const onDisconnectRef = ref(database, `presence/${roomId}/${userId}`);
  await onDisconnect(onDisconnectRef).remove();
};

// Mark messages as read
export const markMessagesAsRead = async (
  roomId: string,
  userId: string
): Promise<void> => {
  const roomRef = doc(firestore, 'rooms', roomId);
  await updateDoc(roomRef, {
    [`lastRead.${userId}`]: new Date().toISOString()
  });
}; 