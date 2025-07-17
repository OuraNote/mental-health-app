import create from 'zustand';
import { persist } from 'zustand/middleware';
import { db, auth } from './firebase.js';
import {
  collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc
} from 'firebase/firestore';

export const useAppStore = create(persist((set, get) => ({
  letters: [], // { id, data, unlockDate, taskId }
  diaryEntries: [], // { id, date, entry, emotion, sentiment, userId }
  tasks: [],   // { id, description, completed }
  sharedLetters: [], // { id, content, tags, date, mood }

  // Firestore: Add a letter for the current user
  addLetter: async (letter) => {
    console.log('addLetter called with:', letter);
    const user = auth.currentUser;
    console.log('Current user:', user);
    if (!user) {
      console.error('No authenticated user found');
      throw new Error('No authenticated user found');
    }
    try {
      const docRef = await addDoc(collection(db, 'letters'), {
        ...letter,
        userId: user.uid,
        createdAt: new Date().toISOString(),
      });
      console.log('Letter added to Firestore with ID:', docRef.id);
      set(state => ({
        letters: [...state.letters, { ...letter, id: docRef.id, userId: user.uid }],
      }));
    } catch (error) {
      console.error('Error adding letter to Firestore:', error);
      throw error;
    }
  },

  // Firestore: Add a diary entry for the current user
  addDiaryEntry: async (entry) => {
    console.log('addDiaryEntry called with:', entry);
    const user = auth.currentUser;
    console.log('Current user:', user);
    if (!user) {
      console.error('No authenticated user found');
      throw new Error('No authenticated user found');
    }
    try {
      const docRef = await addDoc(collection(db, 'diaryEntries'), {
        ...entry,
        userId: user.uid,
        createdAt: new Date().toISOString(),
      });
      console.log('Diary entry added to Firestore with ID:', docRef.id);
      set(state => ({
        diaryEntries: [...state.diaryEntries, { ...entry, id: docRef.id, userId: user.uid }],
      }));
    } catch (error) {
      console.error('Error adding diary entry to Firestore:', error);
      throw error;
    }
  },

  // Firestore: Update a letter
  updateLetter: async (id, updatedLetter) => {
    console.log('updateLetter called with ID:', id, 'and data:', updatedLetter);
    const user = auth.currentUser;
    console.log('Current user:', user);
    if (!user) {
      console.error('No authenticated user found');
      throw new Error('No authenticated user found');
    }
    try {
      const letterRef = doc(db, 'letters', id);
      await updateDoc(letterRef, updatedLetter);
      console.log('Letter updated in Firestore');
      set(state => ({
        letters: state.letters.map(letter =>
          letter.id === id ? { ...letter, ...updatedLetter } : letter
        ),
      }));
    } catch (error) {
      console.error('Error updating letter in Firestore:', error);
      throw error;
    }
  },

  // Firestore: Update a diary entry
  updateDiaryEntry: async (id, updatedEntry) => {
    console.log('updateDiaryEntry called with ID:', id, 'and data:', updatedEntry);
    const user = auth.currentUser;
    console.log('Current user:', user);
    if (!user) {
      console.error('No authenticated user found');
      throw new Error('No authenticated user found');
    }
    try {
      const entryRef = doc(db, 'diaryEntries', id);
      await updateDoc(entryRef, updatedEntry);
      console.log('Diary entry updated in Firestore');
      set(state => ({
        diaryEntries: state.diaryEntries.map(entry =>
          entry.id === id ? { ...entry, ...updatedEntry } : entry
        ),
      }));
    } catch (error) {
      console.error('Error updating diary entry in Firestore:', error);
      throw error;
    }
  },

  // Firestore: Load all letters for the current user
  loadLetters: async () => {
    const user = auth.currentUser;
    if (!user) {
      set({ letters: [] });
      return;
    }
    const q = query(collection(db, 'letters'), where('userId', '==', user.uid));
    const querySnapshot = await getDocs(q);
    const letters = querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
    set({ letters });
  },

  // Firestore: Load all diary entries for the current user
  loadDiaryEntries: async () => {
    const user = auth.currentUser;
    if (!user) {
      set({ diaryEntries: [] });
      return;
    }
    const q = query(collection(db, 'diaryEntries'), where('userId', '==', user.uid));
    const querySnapshot = await getDocs(q);
    const diaryEntries = querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
    set({ diaryEntries });
  },

  // Firestore: Delete a letter
  deleteLetter: async (id) => {
    await deleteDoc(doc(db, 'letters', id));
    set(state => ({
      letters: state.letters.filter(letter => letter.id !== id),
    }));
  },

  // Firestore: Delete a diary entry
  deleteDiaryEntry: async (id) => {
    await deleteDoc(doc(db, 'diaryEntries', id));
    set(state => ({
      diaryEntries: state.diaryEntries.filter(entry => entry.id !== id),
    }));
  },

  clearLetters: () => set({ letters: [] }),
  clearDiaryEntries: () => set({ diaryEntries: [] }),

  addTask: (description) => {
    const id = Date.now().toString();
    set(state => ({
      tasks: [...state.tasks, { id, description, completed: false }],
    }));
    return id;
  },

  completeTask: (taskId) => set(state => ({
    tasks: state.tasks.map(task =>
      task.id === taskId ? { ...task, completed: true } : task
    ),
  })),

  linkTaskToLetter: (letterId, taskId) => set(state => ({
    letters: state.letters.map(letter =>
      letter.id === letterId ? { ...letter, taskId } : letter
    ),
  })),

  getTask: (taskId) => get().tasks.find(task => task.id === taskId),
  getLetter: (letterId) => get().letters.find(letter => letter.id === letterId),

  addSharedLetter: (shared) => set(state => ({
    sharedLetters: [...state.sharedLetters, shared],
  })),

  deleteTask: (taskId) => set(state => ({
    tasks: state.tasks.filter(task => task.id !== taskId),
  })),

}), {
  name: 'mental-health-app-store',
  // Add storage configuration to handle storage access issues
  storage: {
    getItem: (name) => {
      try {
        const item = sessionStorage.getItem(name);
        return item ? JSON.parse(item) : null;
      } catch (error) {
        console.warn('Failed to get item from sessionStorage:', error);
        return null;
      }
    },
    setItem: (name, value) => {
      try {
        sessionStorage.setItem(name, JSON.stringify(value));
      } catch (error) {
        console.warn('Failed to set item in sessionStorage:', error);
        // Fallback to localStorage if sessionStorage fails
        try {
          localStorage.setItem(name, JSON.stringify(value));
        } catch (fallbackError) {
          console.warn('Failed to set item in localStorage as fallback:', fallbackError);
        }
      }
    },
    removeItem: (name) => {
      try {
        sessionStorage.removeItem(name);
      } catch (error) {
        console.warn('Failed to remove item from sessionStorage:', error);
      }
    },
  },
})); 
