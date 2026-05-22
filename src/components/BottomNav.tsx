import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';

export type AppTab = 'Summ' | 'Goods' | 'Audit' | 'Sett';

interface BottomNavProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'Summ' as AppTab, label: 'Summ.', icon: '📊' },
    { id: 'Goods' as AppTab, label: 'Goods', icon: '📦' },
    { id: 'Audit' as AppTab, label: 'Audit', icon: '📜' },
    { id: 'Sett' as AppTab, label: 'Sett.', icon: '⚙️' },
  ];

  return (
    <SafeAreaView className="bg-zinc-950 border-t border-zinc-900">
      <View className="h-16 flex-row items-center justify-around px-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => onTabChange(tab.id)}
              className="flex-1 items-center justify-center py-2"
            >
              <Text className={`text-xl ${isActive ? 'opacity-100' : 'opacity-40'}`}>
                {tab.icon}
              </Text>
              <Text className={`text-[9px] font-black uppercase tracking-widest mt-1 ${isActive ? 'text-white' : 'text-zinc-500'}`}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};