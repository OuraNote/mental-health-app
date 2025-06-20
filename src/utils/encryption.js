import CryptoJS from 'crypto-js';

// Use Vite's import.meta.env for environment variables in the browser
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'your-secure-key-here';

export async function encryptLetter(letter) {
  const {
    title,
    content,
    unlockDate,
    image,
    sentiment
  } = letter;

  // Convert image to base64 if present
  let imageData = null;
  if (image) {
    imageData = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(image);
    });
  }

  // Create letter object
  const letterData = {
    title,
    content,
    unlockDate: unlockDate.toISOString(),
    image: imageData,
    sentiment,
    createdAt: new Date().toISOString(),
  };

  // Encrypt the letter data
  const encryptedData = CryptoJS.AES.encrypt(
    JSON.stringify(letterData),
    ENCRYPTION_KEY
  ).toString();

  return {
    id: CryptoJS.MD5(encryptedData).toString(),
    data: encryptedData,
    unlockDate: unlockDate.toISOString(),
    lockedAt: new Date().toISOString(),
  };
}

export function decryptLetter(encryptedLetter) {
  try {
    const decryptedData = CryptoJS.AES.decrypt(
      encryptedLetter.data,
      ENCRYPTION_KEY
    ).toString(CryptoJS.enc.Utf8);

    return JSON.parse(decryptedData);
  } catch (error) {
    console.error('Error decrypting letter:', error);
    throw new Error('Failed to decrypt letter');
  }
}

export function isLetterUnlocked(letter) {
  const unlockDate = new Date(letter.unlockDate);
  return new Date() >= unlockDate;
} 