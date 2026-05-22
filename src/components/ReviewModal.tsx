import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import Constants from 'expo-constants';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReviewModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  const { profile } = useAuth() as any;
  const [complaint, setComplaint] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');

  // Extract environmental variables dynamically bound from app.json configurations
  const { emailjsServiceId, emailjsTemplateId, emailjsPublicKey } = Constants.expoConfig?.extra || {};

  const handleSendEmail = async () => {
    if (!complaint.trim()) return;

    setIsSending(true);
    setError('');

    // Maps directly to your production EmailJS template tracking properties
    const templateParams = {
      from_name: profile?.businessName || 'Anonymous Merchant',
      reply_to: profile?.email || 'no-reply@terminal.com',
      message: complaint.trim(),
      terminal_uid: profile?.uid || 'Unknown Device',
    };

    try {
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: emailjsServiceId,   
          template_id: emailjsTemplateId,  
          user_id: emailjsPublicKey,      
          template_params: templateParams,
        }),
      });

      if (response.status === 200) {
        alert("Support Ticket Dispatched Globally!");
        setComplaint('');
        onClose();
      } else {
        throw new Error('EmailJS gateway rejected request payload structure.');
      }
    } catch (err) {
      console.error(err);
      setError('Dispatch Failure. Please recheck device network uplink.');
    } finally {
      setIsSending(false); 
    }
  };

  return (
    <Modal visible={isOpen} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/70">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="bg-zinc-950 border-t border-zinc-900 rounded-t-3xl p-6 pb-8"
        >
          {/* Header Dashboard section */}
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Official Dispatch Terminal</Text>
              <Text className="text-white text-xl font-black mt-0.5 tracking-tight">Shop Support Desk</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="p-2 bg-zinc-900 rounded-full">
              <Text className="text-zinc-400 font-bold text-sm">✕</Text>
            </TouchableOpacity>
          </View>

          {/* Network Failure Banner Alert */}
          {error ? (
            <View className="mb-4 p-3 bg-red-950/40 border border-red-500/20 rounded-xl">
              <Text className="text-red-500 text-xs font-bold text-center uppercase tracking-tight">{error}</Text>
            </View>
          ) : null}

          {/* Textarea Entry Block */}
          <View className="space-y-2 mb-6">
            <Text className="text-[9px] font-black text-zinc-500 uppercase tracking-widest pl-1">
              File Your Technical Complaint *
            </Text>
            <TextInput
              multiline
              numberOfLines={6}
              value={complaint}
              onChangeText={setComplaint}
              placeholder="Describe what occurred on your system dashboard..."
              placeholderTextColor="#3f3f46"
              textAlignVertical="top"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white text-sm font-medium min-h-[140px]"
            />
          </View>

          {/* Core Trigger Button */}
          <TouchableOpacity
            onPress={handleSendEmail}
            disabled={isSending || !complaint.trim()}
            className="w-full h-14 bg-white rounded-xl flex-row items-center justify-center active:scale-95 disabled:opacity-40"
          >
            {isSending ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text className="text-black font-black uppercase text-xs tracking-widest">
                ✉️ SUBMIT TICKET TO SUPPORT
              </Text>
            )}
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};