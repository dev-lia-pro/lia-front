import { create } from 'zustand';

interface ChatStore {
  isOpen: boolean;
  activeConversationId: number | null;
  openChat: () => void;
  closeChat: () => void;
  setActiveConversation: (conversationId: number | null) => void;
  toggleChat: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  isOpen: false,
  activeConversationId: null,

  openChat: () => set({ isOpen: true }),

  closeChat: () => set({ isOpen: false }),

  setActiveConversation: (conversationId) => set({ activeConversationId: conversationId }),

  toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),
}));
