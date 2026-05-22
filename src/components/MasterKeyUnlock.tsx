import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';

interface MasterKeyUnlockProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlockSuccess: (validatedKey: string) => void;
}

export const MasterKeyUnlock: React.FC<MasterKeyUnlockProps> = ({ isOpen, onClose, onUnlockSuccess }) => {
  const [keyInput, setKeyInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = async () => {
    setError(false);
    const cleanedKey = keyInput.trim();
    if (!cleanedKey) return;

    setIsProcessing(true);
    try {
      // Basic format validation pattern matching your license structure TM-XXXX-XXXX-XXX
      if (cleanedKey.startsWith('TM-') && cleanedKey.length >= 10) {
        onUnlockSuccess(cleanedKey);
        setKeyInput('');
        onClose();
      } else {
        setError(true);
      }
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal visible={isOpen} animationType="fade" transparent={false} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-zinc-950 justify-center px-6"
      >
        <View className="w-full max-w-sm mx-auto">
          {/* Lock Badge */}
          <View className="w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Text className="text-3xl text-center">🔒</Text>
          </View>

          {/* Typography Header */}
          <View className="mb-6">
            <Text className="text-2xl font-black text-white text-center uppercase tracking-tighter">
              Inventory Locked
            </Text>
            <Text className="text-zinc-500 text-center font-bold text-xs uppercase tracking-wide mt-1">
              Master Key Verification Required
            </Text>
          </View>

          {/* Form Input */}
          <View className="bg-zinc-900 border border-zinc-800 h-16 rounded-2xl px-4 flex-row items-center mb-4">
            <TextInput
              autoFocus
              value={keyInput}
              onChangeText={setKeyInput}
              placeholder="TM-XXXX-XXXX-XXX"
              placeholderTextColor="#3f3f46"
              autoCapitalize="characters"
              autoCorrect={false}
              className="w-full text-white text-center font-mono tracking-widest text-base p-0"
            />
          </View>

          {error && (
            <Text className="text-red-500 text-[10px] font-black uppercase tracking-wider text-center mb-4">
              ⚠️ Invalid Master Key Format
            </Text>
          )}

          {/* Action Buttons */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isProcessing}
            className="w-full h-16 bg-white rounded-2xl flex-row items-center justify-center active:scale-95 disabled:opacity-50"
          >
            {isProcessing ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text className="text-black font-black uppercase tracking-widest text-sm">
                UNLOCK INVENTORY
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} className="w-full py-4 mt-2">
            <Text className="text-center text-[10px] font-black uppercase text-zinc-500 tracking-widest">
              Cancel Override
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};