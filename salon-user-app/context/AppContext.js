import { createContext, useContext } from 'react';

export const AppContext = createContext({
  userToken: '',
  userName: '',
  userEmail: '',
  userProfileImage: null,
  userId: null,
  notifications: [],
  unreadCount: 0,
  addNotification: () => {},
  clearNotifications: () => {},
  markAllRead: () => {},
  refreshUnreadCount: async () => {},
  setUserProfileImage: () => {},
  onLogout: () => {},
});

export const useAppContext = () => useContext(AppContext);
