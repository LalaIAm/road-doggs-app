// UI slice - manages UI state (sidebar, theme, modals, notifications)
// Based on TRD-155: ui slice in root state

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
}

const initialState = {
  sidebarOpen: false,
  theme: 'light' as 'light' | 'dark',
  activeModal: null as string | null,
  notifications: [] as Notification[],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },

    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },

    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },

    openModal: (state, action: PayloadAction<string>) => {
      state.activeModal = action.payload;
    },

    closeModal: (state) => {
      state.activeModal = null;
    },

    addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'timestamp'>>) => {
      const notification: Notification = {
        ...action.payload,
        id: `notif-${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
      };
      state.notifications.push(notification);
    },

    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },

    clearNotifications: (state) => {
      state.notifications = [];
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  setTheme,
  openModal,
  closeModal,
  addNotification,
  removeNotification,
  clearNotifications,
} = uiSlice.actions;

export default uiSlice.reducer;
