// Welcome messages for home screen chat bubble
// Randomly selected with logic to prevent consecutive repeats

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@sudokitty:lastWelcomeMessage';

export const WELCOME_MESSAGES = [
  "mochi has been in the walls o_o",
] as const;

/**
 * Get a random welcome message, ensuring it's different from the last one shown
 * @returns A random welcome message string
 */
export async function getRandomWelcomeMessage(): Promise<string> {
  try {
    // Get the last message shown
    const lastMessage = await AsyncStorage.getItem(STORAGE_KEY);
    
    // Select a random message
    let newMessage = WELCOME_MESSAGES[Math.floor(Math.random() * WELCOME_MESSAGES.length)];
    
    // If it's the same as the last message, pick a different one
    if (lastMessage && newMessage === lastMessage && WELCOME_MESSAGES.length > 1) {
      // Filter out the last message and pick from remaining
      const availableMessages = WELCOME_MESSAGES.filter(msg => msg !== lastMessage);
      newMessage = availableMessages[Math.floor(Math.random() * availableMessages.length)];
    }
    
    // Store the new message for next time
    await AsyncStorage.setItem(STORAGE_KEY, newMessage);
    
    return newMessage;
  } catch (error) {
    // Fallback to random message if storage fails
    return WELCOME_MESSAGES[Math.floor(Math.random() * WELCOME_MESSAGES.length)];
  }
}
