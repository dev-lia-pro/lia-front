import { create } from 'zustand';

interface ChatStore {
  isOpen: boolean;
  activeConversationId: number | null;
  isWaitingForResponse: boolean;
  openChat: () => void;
  closeChat: () => void;
  setActiveConversation: (conversationId: number | null) => void;
  toggleChat: () => void;
  setWaitingForResponse: (isWaiting: boolean) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  isOpen: false,
  activeConversationId: null,
  isWaitingForResponse: false,

  openChat: () => set({ isOpen: true }),

  closeChat: () => set({ isOpen: false }),

  setActiveConversation: (conversationId) => set({ activeConversationId: conversationId }),

  toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),

  setWaitingForResponse: (isWaiting) => set({ isWaitingForResponse: isWaiting }),
}));
