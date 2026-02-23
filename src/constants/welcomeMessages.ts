// Welcome messages for home screen chat bubble
// Randomly selected with logic to prevent consecutive repeats

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@sudokitty:lastWelcomeMessage';

export const WELCOME_MESSAGES = [
  "i told a pigeon about you (⊙_⊙)",
  "mochi cat has been in the walls (ʘ_ʘ)",
  "something smells like tuesday (・_・;)",
  "mochi cat collected 14 rocks today. for what (〃＾▽＾〃)",
  "no, mochi cat did not eat your hamster (´･_･`)",
  "mochi cat made a friend but it was a leaf (っ´▽`)っ",
  "have you ever really looked at a spoon (・o・)",
  "you look so pretty (≧◡≦)",
  "i tired tbh (눈_눈)",
  "mochi cat has opinions about gravel (｀・ω・´)",
  "ever wonder about the meaning of it all? (ó_ò。)",
  "mochi cat loves to cuddle (・//・)",
  "i've been thinking about soup for 6 days (⊙ω⊙)",
  "mochi found a button. it means something (っ˘ω˘ς)",
  "the sky was doing a lot today (＾▽＾)",
  "mochi told a stranger she had nice elbows (≖‿≖✿)",
  "i remembered something but then i didn't (´；ω；`)",
  "mochi sat in a box for a while. needed that (ﾉ◕ヮ◕)ﾉ",
  "a bird looked at me for too long (･ω･;)",
  "mochi cat is scared of escalators (⊙_☉)",
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
