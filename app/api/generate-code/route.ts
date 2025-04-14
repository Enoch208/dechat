import { NextResponse } from 'next/server';
import { database } from '@/app/lib/firebase';
import { ref, get } from 'firebase/database';

// Dictionary of common, easy-to-remember words for code generation
const DICTIONARY_WORDS = [
  "apple", "beach", "cloud", "dance", "eagle", "flame",
  "grape", "honey", "igloo", "jolly", "kiwis", "lemon",
  "mango", "night", "ocean", "piano", "queen", "river",
  "sugar", "tiger", "umbra", "vivid", "water", "xenon",
  "yacht", "zebra", "amber", "bloom", "coral", "dunes",
  "earth", "frost", "guide", "heart", "ivory", "jewel",
  "karma", "lunar", "mocha", "noble", "oasis", "pluto",
  "quill", "royal", "stone", "tulip", "unity", "vault",
  "waves", "xeric", "yield", "zesty"
];

export async function GET() {
  try {
    // Get 3 unique random words
    const selectedWords = getUniqueWords(3);
    
    // Check if this combination already exists in the database
    const isUnique = await checkCodeUniqueness(selectedWords);
    
    if (!isUnique) {
      // If not unique, retry with new words
      return GET();
    }
    
    return NextResponse.json({
      firstPhrase: selectedWords[0],
      secondPhrase: selectedWords[1],
      hostPassword: selectedWords[2],
    });
  } catch (error) {
    console.error('Error generating code:', error);
    return NextResponse.json(
      { error: 'Failed to generate code' },
      { status: 500 }
    );
  }
}

function getUniqueWords(count: number): string[] {
  const words: string[] = [];
  const wordsCopy = [...DICTIONARY_WORDS];
  
  while (words.length < count && wordsCopy.length > 0) {
    // Get a random index
    const randomIndex = Math.floor(Math.random() * wordsCopy.length);
    // Add the word to our selection
    words.push(wordsCopy[randomIndex]);
    // Remove it from the array to avoid duplicates
    wordsCopy.splice(randomIndex, 1);
  }
  
  return words;
}

async function checkCodeUniqueness(words: string[]): Promise<boolean> {
  try {
    // Create a simple hash of the phrases
    const roomId = words
      .slice(0, 2) // Only use first two words for the room ID
      .join('-')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .split('')
      .reduce((acc, char) => {
        return ((acc << 5) - acc) + char.charCodeAt(0);
      }, 0)
      .toString(36)
      .substring(0, 12);
      
    // Check if a room with this ID exists
    const roomRef = ref(database, `rooms/${roomId}`);
    const snapshot = await get(roomRef);
    
    // Return true if the room doesn't exist (meaning our code is unique)
    return !snapshot.exists();
  } catch (error) {
    console.error('Error checking uniqueness:', error);
    // In case of error, we assume it's not unique to be safe
    return false;
  }
} 