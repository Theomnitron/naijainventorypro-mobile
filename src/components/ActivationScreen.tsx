import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

interface ActivationScreenProps {
  canClose?: boolean;
  onClose?: () => void;
}

export const ActivationScreen: React.FC<ActivationScreenProps> = ({ canClose, onClose }) => {
  const { user, profile } = useAuth() as any;
  const [verifying, setVerifying] = useState(false);

  const handleSyncPaymentVerification = async () => {
    if (!user?.uid || verifying) return;
    setVerifying(true);
    try {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists() && docSnap.data().isPaid) {
        alert("Payment Sync Successful! Operational status active.");
        if (onClose) onClose();
      } else {
        alert("Verification Note: No recent outstanding un-synced invoice transactions located on server.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setVerifying(false);
    }
  };

  const handleRedirectToBillingGateway = () => {
    const checkoutUrl = "https://checkout.paystack.com"; // Swapped out back-end pop endpoints with standard external linkages
    Linking.openURL(checkoutUrl).catch((err) => console.error("Couldn't open browser channel", err));
  };

  return (
    <View className="flex-1 bg-black justify-center px-6">
      <View className="w-full max-w-sm mx-auto space-y-6">
        
        {/* Core Lock Info Status Header Card */}
        <View className="bg-zinc-900 border border-zinc-800 p-8 rounded-[32px] items-center">
          <Text className="text-4xl mb-2">💳</Text>
          <Text className="text-xl font-black text-white uppercase tracking-tighter text-center">
            License Access Suspended
          </Text>
          <Text className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-1 text-center">
            Trial Expiration or Invoice Outstanding
          </Text>
        </View>

        {/* Informative Value Prop Fields */}
        <View className="space-y-3 bg-zinc-950 p-4 rounded-2xl border border-zinc-900">
          <Text className="text-white text-xs font-black uppercase tracking-wide">Premium Terminal Access Perks:</Text>
          <Text className="text-zinc-400 text-[11px] font-medium">• Absolute Local Hardware Military AES-256 Encryption</Text>
          <Text className="text-zinc-400 text-[11px] font-medium">• Unlimited Stock Product Ledger Entries</Text>
          <Text className="text-zinc-400 text-[11px] font-medium">• Infinite Log Virtualized Audit Trail History</Text>
        </View>

        {/* Actions Button Wrapper Blocks */}
        <View className="space-y-3 pt-2">
          <TouchableOpacity
            onPress={handleRedirectToBillingGateway}
            className="w-full h-16 bg-emerald-500 rounded-2xl flex-row items-center justify-center active:scale-95"
          >
            <Text className="text-white font-black uppercase tracking-widest text-sm">
              ACTIVATE DEVICE LICENSE (₦)
            </Text>
          </TouchableOpacity>

          {canClose && onClose && (
            <TouchableOpacity onPress={onClose} className="w-full py-2">
              <Text className="text-center text-[10px] font-black uppercase tracking-widest text-zinc-500">
                Maybe Later
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Structural Backend Data Sync Anchor Row */}
        <View className="border-t border-zinc-900 pt-4 items-center">
          <TouchableOpacity 
            onPress={handleSyncPaymentVerification} 
            disabled={verifying}
            className="flex-row items-center space-x-2 py-2"
          >
            {verifying ? <ActivityIndicator size="small" color="#a1a1aa" /> : null}
            <Text className="text-zinc-400 font-black text-[10px] uppercase tracking-widest">
              {verifying ? 'Verifying server logs...' : 'Already Paid? Click to sync status'}
            </Text>
          </TouchableOpacity>
        </View>

      </View>
    </View>
  );
};