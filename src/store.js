import create from 'zustand';
import { persist } from 'zustand/middleware';

export const useAppStore = create(persist((set, get) => ({
  letters: [], // { id, data, unlockDate, taskId }
  tasks: [],   // { id, description, completed }
  sharedLetters: [], // { id, content, tags, date, mood }

  addLetter: (letter) => set(state => ({
    letters: [...state.letters, letter],
  })),

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

  updateLetter: (id, updatedLetter) => set(state => ({
    letters: state.letters.map(letter =>
      letter.id === id ? { ...letter, ...updatedLetter } : letter
    ),
  })),
}), {
  name: 'mental-health-app-store',
})); 