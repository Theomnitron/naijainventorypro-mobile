import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { useAuth } from '../context/AuthContext';

export const GlobalHeader: React.FC = () => {
  const { profile, logout } = useAuth() as any;
  const [showMenu, setShowMenu] = useState(false);

  if (!profile) return null;

  return (
    <View className="px-6 py-4 bg-black border-b border-zinc-900 flex-row justify-between items-center z-50">
      <View className="flex-1 pr-4">
        <h1 className="text-white text-sm font-black uppercase tracking-widest leading-tight truncate">
          {profile.businessName || "Retail Terminal"}
        </h1>
        <Text className="text-zinc-500 text-[9px] font-bold uppercase tracking-wider truncate mt-0.5 max-w-[220px]">
          {profile.businessAddress || `${profile.city || ''} | ${profile.state || ''}`}
        </Text>
      </View>

      {/* User Initials Circle Action Avatar Button */}
      <TouchableOpacity 
        onPress={() => setShowMenu(true)}
        className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 items-center justify-center"
      >
        <Text className="text-white text-xs font-black uppercase">
          {(profile.businessName || 'B').charAt(0).toUpperCase()}
        </Text>
      </TouchableOpacity>

      {/* Profile Overlay Dropdown Menu Panel Sheet */}
      <Modal visible={showMenu} transparent={true} animationType="fade" onRequestClose={() => setShowMenu(false)}>
        <TouchableOpacity 
          activeOpacity={1} 
          onPress={() => setShowMenu(false)} 
          className="flex-1 bg-black/60 justify-start items-end pt-16 pr-6"
        >
          <View className="w-48 bg-zinc-950 border border-zinc-900 rounded-2xl p-2 shadow-2xl">
            <View className="p-3 border-b border-zinc-900 mb-1">
              <Text className="text-[9px] font-black uppercase text-zinc-500 tracking-widest mb-0.5">Terminal Scope</Text>
              <Text className="text-white text-xs font-bold truncate">{profile.businessName}</Text>
            </View>

            <TouchableOpacity 
              onPress={() => { logout(); setShowMenu(false); }}
              className="w-full flex-row items-center space-x-3 p-3 rounded-xl active:bg-red-950/20"
            >
              <Text className="text-red-500 text-[10px] font-black uppercase tracking-widest">
                🚪 Close Terminal (Sign Out)
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};