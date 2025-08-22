export type SelectedProject = { id: number | null; title: string };

import { create } from 'zustand';

interface ProjectState {
  selected: SelectedProject;
  setSelected: (p: SelectedProject) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  selected: { id: null, title: 'Tous les projets' },
  setSelected: (p) => set({ selected: p }),
}));
