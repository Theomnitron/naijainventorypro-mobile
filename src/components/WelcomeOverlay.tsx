import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

export const WelcomeOverlay: React.FC = () => {
  const { profile } = useAuth() as any;

  if (!profile || profile.welcomed) return null;

  const handleAcknowledge = async () => {
    if (profile.uid) {
      try {
        await updateDoc(doc(db, 'users', profile.uid), { welcomed: true });
      } catch (err) {
        console.error("Failed to acknowledge welcome deed:", err);
      }
    }
  };

  return (
    <Modal visible={true} animationType="fade" transparent={false}>
      <View className="flex-1 bg-black px-6 justify-center">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
          <View className="w-full max-w-sm mx-auto space-y-6 my-8">
            
            {/* Header Badge */}
            <View className="bg-emerald-950 border border-emerald-900 p-8 rounded-[32px] items-center">
              <View className="w-16 h-16 bg-emerald-900/50 rounded-full items-center justify-center mb-4">
                <Text className="text-3xl">🛡️</Text>
              </View>
              <Text className="text-2xl font-black text-white uppercase tracking-tighter text-center">
                Registration Deed
              </Text>
              <Text className="text-emerald-400 font-bold text-[10px] uppercase tracking-widest mt-1 text-center">
                Security Identity Key Assigned
              </Text>
            </View>

            {/* Cryptographic Content Display Area */}
            <View className="space-y-4">
              <View className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
                <Text className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">
                  Unique Terminal UID
                </Text>
                <Text className="font-mono text-xs text-zinc-300 break-all select-all">
                  {profile.uid}
                </Text>
              </View>

              <View className="p-4 bg-amber-950/30 border border-amber-500/20 rounded-2xl">
                <View className="flex-row items-center space-x-2 mb-1">
                  <Text className="text-xs">🔑</Text>
                  <Text className="text-[10px] font-black uppercase tracking-widest text-amber-500">
                    AES-256 Master Key
                  </Text>
                </View>
                <Text className="font-mono text-xs font-black text-white break-all select-all">
                  {profile.masterKey}
                </Text>
              </View>
            </View>

            {/* Crucial Safeguard Warning Notice */}
            <View className="flex-row items-start space-x-3 p-4 bg-zinc-900/40 border border-zinc-900 rounded-2xl">
              <Text className="text-base mt-0.5">⚠️</Text>
              <Text className="flex-1 text-[10px] font-bold text-zinc-500 uppercase loading-relaxed">
                IMPORTANT: Take a screenshot or secure copy of this frame right now. This structural key is the ONLY path to decrypt, read, and pull inventory records if you switch phone devices.
              </Text>
            </View>

            {/* Trigger Button */}
            <TouchableOpacity
              onPress={handleAcknowledge}
              className="w-full h-16 bg-white rounded-2xl flex-row items-center justify-center active:scale-95"
            >
              <Text className="text-black font-black uppercase tracking-widest text-sm">
                I HAVE SECURED MY KEY
              </Text>
            </TouchableOpacity>
            
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};