import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { useNotifications } from '../context/NotificationContext';

export const ToastContainer: React.FC = () => {
  const { toasts } = useNotifications();

  if (toasts.length === 0) return null;

  return (
    <SafeAreaView className="absolute top-4 left-0 right-0 z-50 items-center pointer-events-none">
      {toasts.map((toast) => {
        let bgColor = 'bg-zinc-900 border-zinc-800';
        let textColor = 'text-white';

        if (toast.type === 'success') bgColor = 'bg-emerald-950 border-emerald-500/30';
        if (toast.type === 'error') bgColor = 'bg-red-950 border-red-500/30';
        if (toast.type === 'warning') bgColor = 'bg-amber-950 border-amber-500/30';

        return (
          <View
            key={toast.id}
            className={`mx-4 my-1 px-4 py-3 border rounded-xl shadow-xl flex-row items-center w-[90%] max-w-md ${bgColor}`}
          >
            <Text className={`text-sm font-medium ${textColor}`}>{toast.message}</Text>
          </View>
        );
      })}
    </SafeAreaView>
  );
};