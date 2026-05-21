import React, { createContext, useContext, useState } from 'react';
import * as Notifications from 'expo-notifications';

// Configure Expo background notification display mechanics
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning';
  message: string;
}

interface NotificationContextType {
  toasts: ToastMessage[];
  showToast: (message: string, type: 'success' | 'error' | 'warning') => void;
  triggerPushNotification: (title: string, body: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    
    // Automatically dismiss the layout banner after 3.5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const triggerPushNotification = async (title: string, body: string) => {
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: null, // trigger immediately
    });
  };

  return (
    <NotificationContext.Provider value={{ toasts, showToast, triggerPushNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be bound inside NotificationProvider');
  return context;
};