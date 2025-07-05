import create from 'zustand';
import { persist } from 'zustand/middleware';
import { db, auth } from './firebase.js';
import {
  collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc
} from 'firebase/firestore';

export const useAppStore = create(persist((set, get) => ({
  letters: [], // { id, data, unlockDate, taskId }
  tasks: [],   // { id, description, completed }
  sharedLetters: [], // { id, content, tags, date, mood }

  // Firestore: Add a letter for the current user
  addLetter: async (letter) => {
    const user = auth.currentUser;
    if (!user) return;
    const docRef = await addDoc(collection(db, 'letters'), {
      ...letter,
      userId: user.uid,
      createdAt: new Date().toISOString(),
    });
    set(state => ({
      letters: [...state.letters, { ...letter, id: docRef.id, userId: user.uid }],
    }));
  },

  // Firestore: Update a letter
  updateLetter: async (id, updatedLetter) => {
    const user = auth.currentUser;
    if (!user) return;
    const letterRef = doc(db, 'letters', id);
    await updateDoc(letterRef, updatedLetter);
    set(state => ({
      letters: state.letters.map(letter =>
        letter.id === id ? { ...letter, ...updatedLetter } : letter
      ),
    }));
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

  // Firestore: Delete a letter
  deleteLetter: async (id) => {
    await deleteDoc(doc(db, 'letters', id));
    set(state => ({
      letters: state.letters.filter(letter => letter.id !== id),
    }));
  },

  clearLetters: () => set({ letters: [] }),

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
})); 
