import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { db } from '../services/firebase';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success';
}

export const GlobalInfoFeed: React.FC = () => {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const { profile } = useAuth() as any;

  useEffect(() => {
    if (!profile) return;

    const now = new Date();
    const q = query(
      collection(db, 'announcements'),
      where('expiresAt', '>', now),
      orderBy('expiresAt', 'asc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        const data = docSnap.data();
        setAnnouncement({
          id: docSnap.id,
          title: data.title || '',
          message: data.message || '',
          type: data.type || 'info',
        });
        setIsVisible(true);
      } else {
        setAnnouncement(null);
      }
    }, (error) => {
      console.error("Feed error:", error);
    });

    return () => unsubscribe();
  }, [profile]);

  if (!announcement || !isVisible) return null;

  const typeStyles = {
    warning: 'bg-amber-950/40 border-amber-500/20 text-amber-500',
    success: 'bg-emerald-950/40 border-emerald-500/20 text-emerald-400',
    info: 'bg-blue-950/40 border-blue-500/20 text-blue-400',
  };

  const badgeIcons = {
    warning: '⚠️',
    success: '✅',
    info: '📢',
  };

  return (
    <View className={`mx-4 mt-4 p-4 border rounded-2xl flex-row items-start space-x-3 ${typeStyles[announcement.type] || typeStyles.info}`}>
      <Text className="text-base">{badgeIcons[announcement.type] || badgeIcons.info}</Text>
      
      <View className="flex-1 space-y-0.5">
        <Text className="text-white text-xs font-black uppercase tracking-wide">
          {announcement.title}
        </Text>
        <Text className="text-zinc-400 text-[11px] font-medium leading-relaxed">
          {announcement.message}
        </Text>
      </View>

      <TouchableOpacity onPress={() => setIsVisible(false)} className="p-1">
        <Text className="text-zinc-500 text-xs font-bold px-1">✕</Text>
      </TouchableOpacity>
    </View>
  );
};