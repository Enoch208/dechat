"use client"

import { useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, User, Loader2 } from 'lucide-react';

interface RoomData {
  firstPhrase: string;
  secondPhrase: string;
  hostPassword?: string;
  isHost: boolean;
}

interface DisplayNameFormProps {
  roomData: RoomData;
  onSuccess?: () => void;
}

const DisplayNameForm = ({ roomData, onSuccess }: DisplayNameFormProps) => {
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!displayName.trim()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await signIn({
        ...roomData,
        displayName: displayName.trim()
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error signing in:', error);
      alert('Error signing in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg max-w-md w-full mx-auto overflow-hidden">
      <div className="bg-gradient-to-r from-green-600 to-blue-500 p-6 text-center text-white">
        <div className="mx-auto w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4">
          <MessageSquare className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold">Welcome to DeChat</h1>
        <p className="text-sm mt-2 text-green-50">Let's finish setting up your profile</p>
      </div>
      
      <div className="p-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <div className="flex items-center mb-2">
              <User className="h-4 w-4 mr-2 text-green-600" />
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                Choose a display name
              </label>
            </div>
            <div className="relative">
              <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How others will see you"
                className="h-12 text-lg pr-24"
                autoFocus
                maxLength={20}
              />
              {displayName && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center justify-center h-8 w-8 bg-green-100 rounded-full">
                  <span className="text-green-800 text-sm font-bold">
                    {displayName.trim().charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              This name will be visible to others in the chat.
            </p>
          </div>
          
          <Button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 text-lg h-auto"
            disabled={!displayName.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                Joining...
              </span>
            ) : (
              "Continue to Chat"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default DisplayNameForm; 