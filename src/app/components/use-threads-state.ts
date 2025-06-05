import { create } from "zustand";

interface ThreadsState {
  showThreadsPanel: boolean;
  setShowThreadsPanel: (show: boolean) => void;
}

export const useThreadsState = create<ThreadsState>((set) => ({
  showThreadsPanel: false,
  setShowThreadsPanel: (show) => set({ showThreadsPanel: show }),
}));
