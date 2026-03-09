export const PRODUCT_EMOJIS = [
  '🎮', '🎬', '📚', '🍔', '🧸', '⭐',
  '🎁', '🧩', '🏸', '🎨', '🎹', '🧃',
  '🧁', '🎯', '🛍️', '🤝', '🧠', '🚲',
];

export const AVATAR_EMOJIS = [
  '🙂', '😄', '😎', '🤓', '🧑', '👩',
  '👨', '👩‍🏫', '👨‍🏫', '👩‍🍳', '👨‍🍳', '👩‍💼',
  '👨‍💼', '🦁', '🐼', '🐯', '🐻', '🐨',
  '🐶', '🐱', '🦊', '🐸', '🦄', '🐵',
  '🌟', '🚀', '🎈', '🎵', '🏆', '❤️',
];

export function sanitizeEmoji(value, fallback = '🙂') {
  const input = typeof value === 'string' ? value.trim() : '';
  if (!input) {
    return fallback;
  }

  try {
    if (/\p{Extended_Pictographic}/u.test(input)) {
      return input;
    }
  } catch {
    const chars = Array.from(input);
    if (chars.some((char) => (char.codePointAt(0) || 0) > 0x2600)) {
      return input;
    }
  }

  return fallback;
}
