"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  signInAnonymously, 
  onAuthStateChanged, 
  updateProfile, 
  User as FirebaseUser,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { auth, firestore, database } from '@/app/lib/firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, set } from 'firebase/database';
import { setUserPresence } from '@/app/lib/chat';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  signIn: (roomData: RoomData, displayName?: string) => Promise<string>;
  signOut: () => Promise<void>;
  updateUserDisplayName: (name: string) => Promise<void>;
  currentRoom: string | null;
  userDisplayName: string;
  knownDisplayName: string | null;
  checkExistingUser: (roomData: RoomData) => Promise<string | null>;
}

export interface RoomData {
  firstPhrase: string;
  secondPhrase: string;
  thirdPhrase?: string;
  hostPassword?: string;
  isHost: boolean;
  displayName?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [userDisplayName, setUserDisplayName] = useState('');
  const [isRoomHost, setIsRoomHost] = useState(false);
  const [knownDisplayName, setKnownDisplayName] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Setup online presence system when user is authenticated
  useEffect(() => {
    if (!user || !currentRoom) return;

    // Set user presence in the room with host flag
    setUserPresence(currentRoom, user.uid, userDisplayName, isRoomHost);

    return () => {
      // Manually remove user when component unmounts
      const presenceRef = ref(database, `presence/${currentRoom}/${user.uid}`);
      set(presenceRef, null);
    };
  }, [user, currentRoom, userDisplayName, isRoomHost]);

  const generateRoomId = (phrases: string[]): string => {
    // Simple hash function to create a room ID from phrases
    return phrases
      .join('-')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .split('')
      .reduce((acc, char) => {
        return ((acc << 5) - acc) + char.charCodeAt(0);
      }, 0)
      .toString(36)
      .substring(0, 12);
  };

  // Generate a user ID from phrases and host state
  const generateUserId = (phrases: string[], isHost: boolean): string => {
    return phrases
      .join('-')
      .toLowerCase()
      .concat(isHost ? '-host' : '-guest')
      .replace(/[^a-z0-9-]/g, '')
      .split('')
      .reduce((acc, char) => {
        return ((acc << 5) - acc) + char.charCodeAt(0);
      }, 0)
      .toString(36)
      .substring(0, 16);
  };

  // Check if user already exists with a display name
  const checkExistingUser = async (roomData: RoomData): Promise<string | null> => {
    try {
      const phrases = [roomData.firstPhrase, roomData.secondPhrase];
      const roomId = generateRoomId(phrases);
      const userId = generateUserId(phrases, roomData.isHost);
      
      // Check if room exists
      const roomRef = doc(firestore, 'rooms', roomId);
      const roomDoc = await getDoc(roomRef);
      
      if (!roomDoc.exists()) {
        if (roomData.isHost) {
          // Room doesn't exist yet, but host is creating it
          return null;
        }
        throw new Error('Room does not exist');
      }
      
      // Get users collection in the room
      const userRef = doc(firestore, `rooms/${roomId}/users`, userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setKnownDisplayName(userData.displayName);
        return userData.displayName;
      }
      
      return null;
    } catch (error) {
      console.error('Error checking for existing user:', error);
      return null;
    }
  };

  const signIn = async (roomData: RoomData): Promise<string> => {
    try {
      // Create a room ID from the phrases
      const phrases = [roomData.firstPhrase, roomData.secondPhrase];
      const roomId = generateRoomId(phrases);
      const userId = generateUserId(phrases, roomData.isHost);
      
      // Check if room exists
      const roomRef = doc(firestore, 'rooms', roomId);
      const roomDoc = await getDoc(roomRef);
      
      // If host is creating the room
      if (roomData.isHost) {
        if (roomDoc.exists()) {
          // Verify host password
          const roomData = roomDoc.data();
          if (roomData.hostPassword !== roomData.hostPassword) {
            throw new Error('Invalid host password');
          }
        } else {
          // Create new room
          await setDoc(roomRef, {
            createdAt: new Date(),
            hostPassword: roomData.hostPassword,
            phrases: phrases
          });
        }
        setIsRoomHost(true);
      } else {
        if (!roomDoc.exists()) {
          throw new Error('Room does not exist');
        }
        setIsRoomHost(false);
      }
      
      // Check if user already exists in this room with this ID
      const userRef = doc(firestore, `rooms/${roomId}/users`, userId);
      const userDoc = await getDoc(userRef);
      let existingDisplayName = null;
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        existingDisplayName = userData.displayName;
      }
      
      // Sign in anonymously
      const userCredential = await signInAnonymously(auth);
      
      // Determine which display name to use - prioritize existing display name over provided one
      // This ensures we use the name they've used previously for this room
      const finalDisplayName = existingDisplayName || roomData.displayName;
      
      if (!finalDisplayName) {
        throw new Error('Display name is required');
      }
      
      // Set user display name
      await updateProfile(userCredential.user, {
        displayName: finalDisplayName
      });
      
      // Save user info to firestore, updating just the lastLogin field if user exists
      if (userDoc.exists()) {
        await updateDoc(userRef, {
          lastLogin: new Date()
        });
      } else {
        // Create new user document if this is first time
        await setDoc(userRef, {
          displayName: finalDisplayName,
          isHost: roomData.isHost,
          createdAt: new Date(),
          lastLogin: new Date()
        });
      }
      
      setUserDisplayName(finalDisplayName);
      setCurrentRoom(roomId);
      
      return roomId;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signOut = async (): Promise<void> => {
    if (user && currentRoom) {
      // Remove user from presence list
      const presenceRef = ref(database, `presence/${currentRoom}/${user.uid}`);
      await set(presenceRef, null);
    }
    
    setCurrentRoom(null);
    setUserDisplayName('');
    setIsRoomHost(false);
    setKnownDisplayName(null);
    return firebaseSignOut(auth);
  };

  const updateUserDisplayName = async (name: string): Promise<void> => {
    if (user) {
      await updateProfile(user, {
        displayName: name
      });
      setUserDisplayName(name);
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
    updateUserDisplayName,
    currentRoom,
    userDisplayName,
    knownDisplayName,
    checkExistingUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 