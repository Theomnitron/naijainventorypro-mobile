import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { useAuth } from '../context/AuthContext';

export const SubBanner: React.FC = () => {
  const { profile } = useAuth() as any;
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!profile?.accessExpiresAt) return;

    const calculateTime = () => {
      const now = Date.now();
      const diff = profile.accessExpiresAt - now;

      if (diff <= 0) {
        setTimeLeft('EXPIRED');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeLeft(`${days}d ${hours}h ${minutes}m Left`);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 60000);
    return () => clearInterval(interval);
  }, [profile?.accessExpiresAt]);

  if (!profile) return null;

  const isExpired = Date.now() > profile.accessExpiresAt;

  return (
    <View className={`w-full py-2 px-6 flex-row items-center justify-center space-x-2 ${isExpired ? 'bg-red-950/80 border-b border-red-900/50' : 'bg-zinc-950 border-b border-zinc-900'}`}>
      <Text className="text-xs">⏱️</Text>
      <Text className={`text-[10px] font-black uppercase tracking-[0.15em] ${isExpired ? 'text-red-400' : 'text-zinc-400'}`}>
        Subscription Access Status:
      </Text>
      <Text className={`font-mono text-[10px] font-black uppercase ${isExpired ? 'text-red-500' : 'text-white'}`}>
        {timeLeft}
      </Text>
    </View>
  );
};