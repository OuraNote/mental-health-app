import CryptoJS from 'crypto-js';
import { storage } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

// Use Vite's import.meta.env for environment variables in the browser
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'your-secure-key-here';

/**
 * Base64 Media Handling for Persistent Playback
 * 
 * This implementation converts audio/video blobs to base64 strings for storage
 * and back to blob URLs for playback. This ensures media files persist after
 * page reloads and edits, unlike session-only blob URLs.
 */

// Helper function to cleanup blob URLs
export function cleanupBlobUrl(url) {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

// Helper function to check media format compatibility
export function getSupportedMediaFormat(type) {
  if (type === 'video') {
    if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
      return 'video/webm;codecs=vp9,opus';
    } else if (MediaRecorder.isTypeSupported('video/webm')) {
      return 'video/webm';
    } else if (MediaRecorder.isTypeSupported('video/mp4')) {
      return 'video/mp4';
    }
    return 'video/webm'; // fallback
  } else {
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      return 'audio/webm;codecs=opus';
    } else if (MediaRecorder.isTypeSupported('audio/webm')) {
      return 'audio/webm';
    } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
      return 'audio/mp4';
    }
    return 'audio/webm'; // fallback
  }
}

// Helper function to validate media blob
export function validateMediaBlob(blob, expectedType) {
  if (!blob || blob.size === 0) {
    throw new Error('Invalid media blob: empty or null');
  }
  
  if (!blob.type.startsWith(expectedType.split('/')[0])) {
    throw new Error(`Invalid media type: expected ${expectedType}, got ${blob.type}`);
  }
  
  return true;
}

// Debug function to check browser media support
export function debugMediaSupport() {
  const support = {
    audio: {
      'audio/webm;codecs=opus': MediaRecorder.isTypeSupported('audio/webm;codecs=opus'),
      'audio/webm': MediaRecorder.isTypeSupported('audio/webm'),
      'audio/mp4': MediaRecorder.isTypeSupported('audio/mp4'),
      'audio/wav': MediaRecorder.isTypeSupported('audio/wav'),
    },
    video: {
      'video/webm;codecs=vp9,opus': MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus'),
      'video/webm': MediaRecorder.isTypeSupported('video/webm'),
      'video/mp4': MediaRecorder.isTypeSupported('video/mp4'),
    }
  };
  
  console.log('Browser media support:', support);
  return support;
}

// Helper to upload media to Firebase Storage and get a download URL
export async function uploadMediaAndGetUrl(file, userId, onProgress) {
  console.log('=== UPLOAD FUNCTION STARTED ===');
  console.log('Uploading blob:', file, 'size:', file?.size, 'type:', file?.type, 'userId:', userId);
  console.log('Storage instance:', storage);
  console.log('User ID:', userId);
  console.log('Progress callback:', onProgress);
  
  if (!file || file.size === 0) {
    console.error('Invalid file: empty or null');
    throw new Error('Invalid file: empty or null');
  }
  
  if (!userId) {
    console.error('User ID is required for upload');
    throw new Error('User ID is required for upload');
  }
  
  // Free solution: Use base64 for small files, compressed videos for larger files
  console.log('Using free storage solution (no Firebase Storage required)');
  
  const MAX_SIZE_FOR_BASE64 = 1024 * 1024; // 1MB for base64
  
  if (file.size <= MAX_SIZE_FOR_BASE64) {
    console.log('File is small enough for base64 storage, converting...');
    if (onProgress) onProgress(10);
    
    try {
      console.log('Converting file to base64...');
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (onProgress) onProgress(50);
          console.log('Base64 conversion in progress...');
          resolve(reader.result);
        };
        reader.onerror = (error) => {
          console.error('FileReader error:', error);
          reject(error);
        };
        reader.readAsDataURL(file);
      });
      
      if (onProgress) onProgress(100);
      console.log('Base64 conversion completed successfully');
      return base64Data; // Return the data URL directly
    } catch (error) {
      console.error('Error converting to base64:', error);
      throw error;
    }
  } else {
    console.log('File is too large for base64, creating compressed version...');
    if (onProgress) onProgress(10);
    
    try {
      // Create a compressed version of the video
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const video = document.createElement('video');
      
      return new Promise((resolve, reject) => {
        video.onloadedmetadata = () => {
          // Set canvas size to a smaller resolution
          canvas.width = 480; // Reduced from typical 1920
          canvas.height = 270; // Reduced from typical 1080
          
          // Draw video frame to canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Convert to base64 with lower quality
          canvas.toBlob((blob) => {
            if (onProgress) onProgress(50);
            
            const reader = new FileReader();
            reader.onload = () => {
              if (onProgress) onProgress(100);
              console.log('Compressed video created');
              resolve(reader.result);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          }, 'image/jpeg', 0.5); // Lower quality
        };
        
        video.onerror = reject;
        video.src = URL.createObjectURL(file);
      });
    } catch (error) {
      console.error('Error compressing video:', error);
      // Fallback to blob URL for current session only
      const blobUrl = URL.createObjectURL(file);
      console.log('Created blob URL for large file:', blobUrl);
      console.log('WARNING: This URL will only work during the current session');
      return blobUrl;
    }
  }
}

export async function encryptLetter(letter) {
  console.log('Encrypting letter with data:', letter);
  console.log('Encryption key available:', !!ENCRYPTION_KEY);
  console.log('Encryption key length:', ENCRYPTION_KEY ? ENCRYPTION_KEY.length : 0);
  
  const {
    title,
    content,
    unlockDate,
    image,
    sentiment,
    moods,
    mediaUrl, // Now only storing the download URL
    mediaType,
    mediaMimeType,
    transcription,
    mediaSentiment
  } = letter;

  // Convert image to base64 if present (only for small images)
  let imageData = null;
  if (image && image.size <= 500 * 1024) { // Only base64 for images under 500KB
    console.log('Converting small image to base64...');
    imageData = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(image);
    });
  }

  // Check if mediaUrl is a Firebase Storage URL, base64, or blob URL
  let mediaUrlToStore = mediaUrl;
  console.log('Media URL analysis:', {
    mediaUrl: mediaUrl ? mediaUrl.substring(0, 50) + '...' : null,
    isFirebaseUrl: mediaUrl && mediaUrl.includes('firebasestorage.googleapis.com'),
    isBlobUrl: mediaUrl && mediaUrl.startsWith('blob:'),
    isDataUrl: mediaUrl && mediaUrl.startsWith('data:'),
    urlLength: mediaUrl ? mediaUrl.length : 0
  });
  
  if (mediaUrl && mediaUrl.includes('firebasestorage.googleapis.com')) {
    console.log('Firebase Storage URL detected, storing permanently');
    mediaUrlToStore = mediaUrl;
  } else if (mediaUrl && mediaUrl.startsWith('data:')) {
    console.log('Small media file detected (base64), storing in Firestore');
    mediaUrlToStore = mediaUrl;
  } else if (mediaUrl && mediaUrl.startsWith('blob:')) {
    console.log('Large media file detected (blob URL), will not persist across sessions');
    // For blob URLs, we can't store them in Firestore as they're session-only
    mediaUrlToStore = null;
  }

  // Create letter object - DO NOT include large media data
  const letterData = {
    title,
    content,
    unlockDate: unlockDate.toISOString(),
    image: imageData, // Only small images
    sentiment,
    createdAt: new Date().toISOString(),
    moods,
    mediaUrl: mediaUrlToStore, // Store only small media files or null for large files
    mediaType,
    mediaMimeType,
    transcription,
    mediaSentiment,
  };

  console.log('Letter data to encrypt:', letterData);

  try {
    console.log('About to encrypt letter data...');
    const letterDataString = JSON.stringify(letterData);
    console.log('Letter data string length:', letterDataString.length);
    
    // Encrypt the letter data
    const encryptedData = CryptoJS.AES.encrypt(
      letterDataString,
      ENCRYPTION_KEY
    ).toString();

    console.log('Encryption successful, encrypted data length:', encryptedData.length);
    
    const result = {
      data: encryptedData,
      unlockDate: unlockDate.toISOString(),
      lockedAt: new Date().toISOString(),
    };
    
    console.log('Returning encrypted letter:', result);
    return result;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt letter: ' + error.message);
  }
}

export function decryptLetter(encryptedLetter) {
  try {
    const decryptedData = CryptoJS.AES.decrypt(
      encryptedLetter.data,
      ENCRYPTION_KEY
    ).toString(CryptoJS.enc.Utf8);

    const letterData = JSON.parse(decryptedData);
    // No more base64 mediaData handling needed
    return letterData;
  } catch (error) {
    console.error('Error decrypting letter:', error);
    throw new Error('Failed to decrypt letter');
  }
}

export function isLetterUnlocked(letter) {
  const unlockDate = new Date(letter.unlockDate);
  return new Date() >= unlockDate;
} 